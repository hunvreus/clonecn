const STYLE_SET = new Set(['nova', 'vega', 'maia', 'lyra', 'mira', 'luma'])
const MODE_SET = new Set(['light', 'dark'])
const SHARE_ID_LENGTH = 8
const MAX_CSS_LENGTH = 200_000

const CREATE_SHARE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS share (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  css TEXT NOT NULL,
  mode TEXT NOT NULL,
  style TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`

const CREATE_SHARE_CREATED_AT_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS share_created_at_idx ON share(created_at);
`

type ThemeMode = 'light' | 'dark'
type ThemeStyle = 'nova' | 'vega' | 'maia' | 'lyra' | 'mira' | 'luma'

type ShareInput = {
  css: string
  mode: ThemeMode
  style: ThemeStyle
}

export type ShareRecord = ShareInput & {
  id: string
  createdAt: number
}

type D1Like = {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => {
      first: <T = unknown>() => Promise<T | null>
      run: () => Promise<unknown>
    }
  }
}

type LocalStore = {
  getById: (id: string) => LocalRow | undefined
  getByHash: (hash: string) => LocalRow | undefined
  insert: (row: {
    id: string
    hash: string
    css: string
    mode: ThemeMode
    style: ThemeStyle
    createdAt: number
  }) => void
}

type LocalRow = {
  id: string
  css: string
  mode: string
  style: string
  created_at: number
}

type D1Row = {
  id: string
  css: string
  mode: string
  style: string
  created_at: number
}

type RequestContext = {
  context?: unknown
  request?: Request
}

export class ShareServiceError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ShareServiceError'
    this.statusCode = statusCode
  }
}

let d1SchemaReady = false
let localStorePromise: Promise<LocalStore> | null = null

export async function createShare(
  payload: unknown,
  requestContext?: RequestContext,
): Promise<{ id: string }> {
  const input = parseShareInput(payload)
  const hash = await hashInput(input)
  const db = getD1Binding(requestContext)

  if (db) {
    return createD1Share(db, hash, input)
  }

  const localStore = await getLocalStore()
  return createLocalShare(localStore, hash, input)
}

export async function getShareById(
  id: string,
  requestContext?: RequestContext,
): Promise<ShareRecord | null> {
  if (!isShareId(id)) {
    throw new ShareServiceError(400, 'Invalid share id')
  }

  const db = getD1Binding(requestContext)

  if (db) {
    await ensureD1Schema(db)

    const row = await db
      .prepare(
        'SELECT id, css, mode, style, created_at FROM share WHERE id = ?1 LIMIT 1',
      )
      .bind(id)
      .first<D1Row>()

    return row ? mapRecordRow(row) : null
  }

  const localStore = await getLocalStore()
  const row = localStore.getById(id)
  return row ? mapRecordRow(row) : null
}

export function toShareErrorResponse(error: unknown) {
  if (error instanceof ShareServiceError) {
    return Response.json({ error: error.message }, { status: error.statusCode })
  }

  console.error(error)
  return Response.json({ error: 'Failed to process share request' }, { status: 500 })
}

function parseShareInput(payload: unknown): ShareInput {
  if (!payload || typeof payload !== 'object') {
    throw new ShareServiceError(400, 'Invalid share payload')
  }

  const record = payload as Record<string, unknown>
  const css = typeof record.css === 'string' ? record.css.trim() : ''
  const mode = record.mode
  const style = record.style

  if (!css || css.length > MAX_CSS_LENGTH) {
    throw new ShareServiceError(400, 'Invalid css payload')
  }

  if (typeof mode !== 'string' || !MODE_SET.has(mode)) {
    throw new ShareServiceError(400, 'Invalid mode payload')
  }

  if (typeof style !== 'string' || !STYLE_SET.has(style)) {
    throw new ShareServiceError(400, 'Invalid style payload')
  }

  return {
    css,
    mode: mode as ThemeMode,
    style: style as ThemeStyle,
  }
}

function getD1Binding(requestContext?: RequestContext): D1Like | null {
  const context = requestContext?.context as
    | {
        cloudflare?: { env?: Record<string, unknown> }
        env?: Record<string, unknown>
        DB?: unknown
      }
    | undefined
  const request = requestContext?.request as
    | (Request & {
        runtime?: {
          cloudflare?: { env?: Record<string, unknown> }
        }
      })
    | undefined
  const globalEnv = (globalThis as { __env__?: Record<string, unknown> }).__env__

  const candidates = [
    context?.cloudflare?.env?.DB,
    context?.env?.DB,
    context?.DB,
    request?.runtime?.cloudflare?.env?.DB,
    globalEnv?.DB,
  ]

  for (const candidate of candidates) {
    if (isD1Like(candidate)) {
      return candidate
    }
  }

  return null
}

function isD1Like(value: unknown): value is D1Like {
  return !!value && typeof value === 'object' && 'prepare' in value
}

async function createD1Share(
  db: D1Like,
  hash: string,
  input: ShareInput,
): Promise<{ id: string }> {
  await ensureD1Schema(db)

  const existingByHash = await db
    .prepare('SELECT id FROM share WHERE hash = ?1 LIMIT 1')
    .bind(hash)
    .first<{ id: string }>()

  if (existingByHash?.id) {
    return { id: existingByHash.id }
  }

  const createdAt = Date.now()

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const id = createShareId()

    try {
      await db
        .prepare(
          'INSERT INTO share (id, hash, css, mode, style, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        )
        .bind(id, hash, input.css, input.mode, input.style, createdAt)
        .run()

      return { id }
    } catch (error) {
      if (isUniqueViolation(error, 'share.hash')) {
        const existing = await db
          .prepare('SELECT id FROM share WHERE hash = ?1 LIMIT 1')
          .bind(hash)
          .first<{ id: string }>()

        if (existing?.id) {
          return { id: existing.id }
        }
      }

      if (isUniqueViolation(error, 'share.id')) {
        continue
      }

      throw new ShareServiceError(500, 'Failed to create share')
    }
  }

  throw new ShareServiceError(500, 'Failed to create share')
}

async function ensureD1Schema(db: D1Like) {
  if (d1SchemaReady) {
    return
  }

  await db.prepare(CREATE_SHARE_TABLE_SQL).bind().run()
  await db.prepare(CREATE_SHARE_CREATED_AT_INDEX_SQL).bind().run()
  d1SchemaReady = true
}

async function createLocalShare(
  localStore: LocalStore,
  hash: string,
  input: ShareInput,
): Promise<{ id: string }> {
  const existing = localStore.getByHash(hash)
  if (existing?.id) {
    return { id: existing.id }
  }

  const createdAt = Date.now()

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const id = createShareId()

    try {
      localStore.insert({
        id,
        hash,
        css: input.css,
        mode: input.mode,
        style: input.style,
        createdAt,
      })

      return { id }
    } catch (error) {
      if (isUniqueViolation(error, 'share.hash')) {
        const duplicate = localStore.getByHash(hash)
        if (duplicate?.id) {
          return { id: duplicate.id }
        }
      }

      if (isUniqueViolation(error, 'share.id')) {
        continue
      }

      throw new ShareServiceError(500, 'Failed to create share')
    }
  }

  throw new ShareServiceError(500, 'Failed to create share')
}

async function getLocalStore(): Promise<LocalStore> {
  if (!localStorePromise) {
    localStorePromise = initLocalStore()
  }

  return localStorePromise
}

async function initLocalStore(): Promise<LocalStore> {
  try {
    const [{ DatabaseSync }, fsPromises, path] = await Promise.all([
      import('node:sqlite'),
      import('node:fs/promises'),
      import('node:path'),
    ])

    const dbPath = process.env.CLONECN_SHARE_DB_PATH || '.data/share.db'
    const absolutePath = path.resolve(process.cwd(), dbPath)
    await fsPromises.mkdir(path.dirname(absolutePath), { recursive: true })

    const db = new DatabaseSync(absolutePath)
    db.exec(CREATE_SHARE_TABLE_SQL)
    db.exec(CREATE_SHARE_CREATED_AT_INDEX_SQL)

    const getByIdStatement = db.prepare(
      'SELECT id, css, mode, style, created_at FROM share WHERE id = ?1 LIMIT 1',
    )
    const getByHashStatement = db.prepare(
      'SELECT id, css, mode, style, created_at FROM share WHERE hash = ?1 LIMIT 1',
    )
    const insertStatement = db.prepare(
      'INSERT INTO share (id, hash, css, mode, style, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
    )

    return {
      getById(id) {
        return getByIdStatement.get(id) as LocalRow | undefined
      },
      getByHash(hash) {
        return getByHashStatement.get(hash) as LocalRow | undefined
      },
      insert(row) {
        insertStatement.run(
          row.id,
          row.hash,
          row.css,
          row.mode,
          row.style,
          row.createdAt,
        )
      },
    }
  } catch {
    throw new ShareServiceError(
      500,
      'Share storage is unavailable: missing D1 binding `DB` and local SQLite support',
    )
  }
}

function mapRecordRow(row: D1Row | LocalRow): ShareRecord {
  if (!MODE_SET.has(row.mode) || !STYLE_SET.has(row.style)) {
    throw new ShareServiceError(500, 'Invalid stored share payload')
  }

  return {
    id: row.id,
    css: row.css,
    mode: row.mode as ThemeMode,
    style: row.style as ThemeStyle,
    createdAt: row.created_at,
  }
}

async function hashInput(input: ShareInput): Promise<string> {
  const source = `${input.mode}\n${input.style}\n${input.css}`
  const bytes = new TextEncoder().encode(source)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return encodeBytesAsBase64Url(new Uint8Array(digest))
}

function createShareId(length = SHARE_ID_LENGTH) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  let id = ''
  for (const byte of bytes) {
    id += alphabet[byte % alphabet.length]
  }

  return id
}

function encodeBytesAsBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '')
  }

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function isUniqueViolation(error: unknown, key: string) {
  if (!(error instanceof Error)) {
    return false
  }

  return error.message.includes('UNIQUE constraint failed') &&
    error.message.includes(key)
}

function isShareId(value: string) {
  return /^[a-z0-9]{6,40}$/.test(value)
}

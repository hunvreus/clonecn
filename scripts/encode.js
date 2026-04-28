#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const STYLES = new Set(['nova', 'vega', 'maia', 'lyra', 'mira', 'luma'])
const MODES = new Set(['light', 'dark'])

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) {
      continue
    }
    const key = token.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = 'true'
      continue
    }
    args[key] = next
    i += 1
  }
  return args
}

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded =
    normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

function usage() {
  console.error(
    [
      'Usage:',
      '  node scripts/encode.js --css ./theme.css --mode dark --style vega --chrome 0',
      '',
      'Optional:',
      '  --chrome 0|1',
      '  --origin https://clonecn.com',
      '  --origin http://localhost:3001',
    ].join('\n'),
  )
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const cssPath = args.css ? path.resolve(args.css) : path.resolve('theme.css')
  const mode = args.mode || 'dark'
  const style = args.style || 'vega'
  const chrome = args.chrome || '1'
  const origin = (args.origin || 'https://clonecn.com').replace(
    /\/+$/,
    '',
  )

  if (!fs.existsSync(cssPath)) {
    console.error(`Missing CSS file: ${cssPath}`)
    usage()
    process.exit(1)
  }
  if (!MODES.has(mode)) {
    console.error(`Invalid mode: ${mode}`)
    usage()
    process.exit(1)
  }
  if (!STYLES.has(style)) {
    console.error(`Invalid style: ${style}`)
    usage()
    process.exit(1)
  }
  if (chrome !== '0' && chrome !== '1') {
    console.error(`Invalid chrome: ${chrome}`)
    usage()
    process.exit(1)
  }

  const css = fs.readFileSync(cssPath, 'utf8')
  const encoded = encodeBase64Url(css)
  const decoded = decodeBase64Url(encoded)

  if (decoded !== css) {
    throw new Error('Preview hash encode/decode mismatch')
  }

  const url = `${origin}/?chrome=${chrome}#css=${encoded}&mode=${mode}&style=${style}`
  console.log(url)
}

main()

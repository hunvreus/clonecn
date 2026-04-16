import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CheckIcon,
  CopyIcon,
  MoonIcon,
  RotateCcwIcon,
  SettingsIcon,
  ShareIcon,
  SunIcon,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import { Label } from '#/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import lumaCss from '#/theme/style-luma.css?url'
import lyraCss from '#/theme/style-lyra.css?url'
import maiaCss from '#/theme/style-maia.css?url'
import miraCss from '#/theme/style-mira.css?url'
import novaCss from '#/theme/style-nova.css?url'
import vegaCss from '#/theme/style-vega.css?url'

export const Route = createFileRoute('/preview')({ component: HomeRoute })

const Preview02Example = React.lazy(() => import('#/components'))

const VARS = [
  'radius',
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const

const STYLES = ['nova', 'vega', 'maia', 'lyra', 'mira', 'luma'] as const
const DEFAULT_STYLE: StyleName = 'nova'
const STYLE_LINK_ID_PREFIX = 'clonecn-style-css'
const THEME_STYLE_ID = 'clonecn-theme-vars'
const STYLE_HOOK_KEYS = ['variant', 'size', 'orientation'] as const
const MENU_TARGET_SLOTS = new Set([
  'select-content',
  'dropdown-menu-content',
  'dropdown-menu-sub-content',
  'combobox-content',
])
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0'
const REPO_URL = 'https://github.com/hunvreus/clonecn'
const INSTALL_URL = `${REPO_URL}?tab=readme-ov-file#install`
const AUTHOR_URL = 'https://github.com/hunvreus'
const STYLE_CSS_URLS: Record<StyleName, string> = {
  nova: novaCss,
  vega: vegaCss,
  maia: maiaCss,
  lyra: lyraCss,
  mira: miraCss,
  luma: lumaCss,
}

type CopyTarget = 'css' | 'share'
type StyleName = (typeof STYLES)[number]
type ThemeMode = 'light' | 'dark'
type ThemeVars = Record<string, string>
type ShareRecordResponse = {
  id: string
  css: string
  mode: ThemeMode
  style: StyleName
}
type ShareCreateResponse = {
  id: string
  path?: string
  url?: string
}

type ThemePageProps = {
  shareId?: string
  embedded?: boolean
  modeOverride?: ThemeMode
}

function HomeRoute() {
  return <ThemePage />
}

export function ThemePage({
  shareId,
  embedded = false,
  modeOverride,
}: ThemePageProps) {
  const runtimeQuery = readThemeRuntimeQuery()
  const isEmbedded = embedded || runtimeQuery.embedded
  const activeModeOverride = modeOverride ?? runtimeQuery.mode
  const [mode, setMode] = React.useState<ThemeMode>('light')
  const [css, setCss] = React.useState('')
  const [copied, setCopied] = React.useState<CopyTarget | null>(null)
  const [initialized, setInitialized] = React.useState(false)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [style, setStyle] = React.useState<StyleName>(DEFAULT_STYLE)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [shareBusy, setShareBusy] = React.useState(false)
  const [shareLink, setShareLink] = React.useState('')
  const [shareError, setShareError] = React.useState<string | null>(null)
  const defaultCss = React.useRef('')
  const copyTimeout = React.useRef<number | null>(null)
  const debouncedCss = useDebouncedValue(css, 500)
  const themePending = useDelayedFlag(initialized && css !== debouncedCss, 500)

  React.useEffect(() => {
    let active = true

    async function initialize() {
      const baselineCss = readBaselineCss()
      const nextState = readCssStateFromLocation(baselineCss)

      defaultCss.current = baselineCss

      if (shareId && !parseHashCss()) {
        try {
          const sharedTheme = await fetchSharedTheme(shareId)

          if (!active) {
            return
          }

          setMode(activeModeOverride ?? sharedTheme.mode)
          setStyle(sharedTheme.style)
          setCss(sharedTheme.css)
          setInitialized(true)
          return
        } catch {
          // Fall back to default location/hash state if share loading fails.
        }
      }

      if (!active) {
        return
      }

      setMode(activeModeOverride ?? nextState.mode)
      setStyle(nextState.style)
      setCss(nextState.css)
      setInitialized(true)
    }

    void initialize()

    return () => {
      active = false
    }
  }, [activeModeOverride, shareId])

  React.useEffect(() => {
    if (!initialized) {
      return
    }

    function handleHashChange() {
      const nextState = readCssStateFromLocation(
        defaultCss.current || readCurrentCss(),
      )

      setMode(activeModeOverride ?? nextState.mode)
      setStyle(nextState.style)
      setCss(nextState.css)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [activeModeOverride, initialized])

  React.useEffect(() => {
    if (initialized && activeModeOverride) {
      setMode(activeModeOverride)
    }
  }, [activeModeOverride, initialized])

  React.useEffect(() => {
    if (!initialized) {
      return
    }

    document.documentElement.style.colorScheme = mode
    document.documentElement.classList.toggle('dark', mode === 'dark')
    window.localStorage.setItem('clonecn-mode', mode)
  }, [initialized, mode])

  React.useEffect(() => {
    if (!initialized) {
      return
    }

    if (isEmbedded) {
      return
    }

    if (debouncedCss !== css) {
      return
    }

    syncBrowserUrl(debouncedCss, mode, style)
  }, [css, debouncedCss, initialized, isEmbedded, mode, style])

  React.useEffect(() => {
    if (!initialized) {
      return
    }

    syncStyleStylesheet(style)

    for (const item of STYLES) {
      document.documentElement.classList.toggle(`style-${item}`, item === style)
    }
  }, [initialized, style])

  React.useEffect(() => {
    if (initialized) {
      syncThemeStyles(css)
    }
  }, [css, initialized])

  React.useEffect(() => {
    if (!initialized) {
      return
    }

    return observeStyleHooks()
  }, [initialized])

  React.useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        window.clearTimeout(copyTimeout.current)
      }
    }
  }, [])

  async function copy(value: string, target: CopyTarget) {
    try {
      await window.navigator.clipboard.writeText(value)
    } catch {
      return false
    }

    setCopied(target)

    if (copyTimeout.current) {
      window.clearTimeout(copyTimeout.current)
    }

    copyTimeout.current = window.setTimeout(() => setCopied(null), 1200)
    return true
  }

  async function shareTheme() {
    setShareBusy(true)
    setShareError(null)

    try {
      const link = await createShareLink(css, mode, style)
      setShareLink(link)
      setShareOpen(true)
      await copy(link, 'share')
    } catch {
      setShareError('Could not create share link. Try again.')
      setShareOpen(true)
    } finally {
      setShareBusy(false)
    }
  }

  function resetTheme() {
    setStyle(DEFAULT_STYLE)
    setCss(defaultCss.current || readCurrentCss())
  }

  function changeStyle(nextStyle: string) {
    const normalizedStyle = normalizeStyle(nextStyle)
    if (!normalizedStyle) {
      return
    }

    setStyle(normalizedStyle)
  }

  return (
    <main
      className="min-h-screen bg-muted text-foreground"
      data-theme-ready={initialized ? 'true' : 'false'}
      data-embed={isEmbedded ? 'true' : 'false'}
    >
      {!initialized ? (
        <InitialLayout embedded={isEmbedded} />
      ) : (
        <>
          {isEmbedded ? null : (
            <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
              <AboutDialog />
              <div className="flex items-center gap-1">
                {themePending && <Spinner className="text-muted-foreground" />}
                <Popover open={shareOpen} onOpenChange={setShareOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={
                        copied === 'share' ? 'Copied link' : 'Share theme'
                      }
                      onClick={() => {
                        void shareTheme()
                      }}
                      disabled={shareBusy}
                    >
                      <ShareIcon />
                      {shareBusy
                        ? 'Sharing…'
                        : copied === 'share'
                          ? 'Copied Link'
                          : 'Share'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-2">
                    <div className="grid gap-2">
                      <InputGroup>
                        <InputGroupInput
                          readOnly
                          value={shareLink}
                          placeholder={
                            shareBusy
                              ? 'Creating link...'
                              : 'Share link appears here.'
                          }
                          className="h-7 font-mono text-xs"
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={
                              copied === 'share'
                                ? 'Copied link'
                                : 'Copy share link'
                            }
                            disabled={!shareLink}
                            onClick={() => {
                              if (shareLink) {
                                void copy(shareLink, 'share')
                              }
                            }}
                          >
                            {copied === 'share' ? <CheckIcon /> : <CopyIcon />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      {shareError ? (
                        <p className="text-xs text-destructive">{shareError}</p>
                      ) : null}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={copied === 'css' ? 'Copied CSS' : 'Copy CSS'}
                  onClick={() => {
                    void copy(buildCopyCss(css, style), 'css')
                  }}
                >
                  <CopyIcon />
                  {copied === 'css' ? 'Copied CSS' : 'Copy CSS'}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Reset theme"
                      onClick={resetTheme}
                    >
                      <RotateCcwIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Reset theme</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit theme"
                      onClick={() => setEditorOpen(true)}
                    >
                      <SettingsIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Edit theme</TooltipContent>
                </Tooltip>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
                  onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                >
                  {mode === 'light' ? <MoonIcon /> : <SunIcon />}
                </Button>
              </div>
            </header>
          )}

          <PreviewPane embedded={isEmbedded} />

          {isEmbedded ? null : (
            <Sheet open={editorOpen} onOpenChange={setEditorOpen} modal={false}>
              <SheetContent
                side="right"
                hideOverlay
                overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"
                className="w-full sm:max-w-xl"
              >
                <SheetHeader>
                  <SheetTitle>Edit Style</SheetTitle>
                  <SheetDescription>
                    Choose a base component style and edit CSS theme variables.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4">
                  <div className="grid shrink-0 gap-2">
                    <Label htmlFor="theme-style">Component style</Label>
                    <Select value={style} onValueChange={changeStyle}>
                      <SelectTrigger id="theme-style" className="w-full">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Styles</SelectLabel>
                          <SelectSeparator />
                          {STYLES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {styleLabel(item)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2">
                    <Label htmlFor="theme-css">CSS</Label>
                    <Textarea
                      id="theme-css"
                      aria-label="Theme CSS"
                      value={css}
                      onChange={(event) => setCss(event.target.value)}
                      className="h-full min-h-80 resize-none font-mono text-xs"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </>
      )}
    </main>
  )
}

function InitialLayout({ embedded = false }: { embedded?: boolean }) {
  if (embedded) {
    return <PreviewSkeleton embedded />
  }

  return (
    <div className="min-h-screen">
      <div className="flex h-12 items-center justify-between border-b bg-background px-4">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-18" />
          <Skeleton className="h-8 w-18" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      </div>
      <PreviewSkeleton />
    </div>
  )
}

function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5!"
          aria-label="About clonecn"
        >
          <BrandLogo className="size-4 rounded-xs" iconClassName="size-2.5" />
          <span>clonecn</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[20rem] max-w-[calc(100vw-2rem)]">
        <DialogHeader className="items-center gap-3 text-center">
          <BrandLogo className="size-15 rounded-2xl" iconClassName="size-10" />
          <DialogTitle className="text-base font-semibold">clonecn</DialogTitle>
          <DialogDescription>
            An agent skill to generate shadcn/ui themes from design references.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm">{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Install</span>
            <a
              href={INSTALL_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-medium text-primary hover:underline"
            >
              README install
            </a>
          </div>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <span className="text-sm text-muted-foreground">GitHub</span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-medium text-primary hover:underline"
            >
              hunvreus/clonecn
            </a>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Built by</span>
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-medium text-primary hover:underline"
            >
              @hunvreus
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BrandLogo({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center bg-primary text-background ${className ?? ''}`}
    >
      <svg
        viewBox="140 120 180 240"
        className={iconClassName ?? 'size-3'}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="200" y="120" width="120" height="60" fill="currentColor" />
        <rect x="200" y="300" width="120" height="60" fill="currentColor" />
        <rect
          x="140"
          y="300"
          width="120"
          height="60"
          transform="rotate(-90 140 300)"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

const PreviewPane = React.memo(function Preview({
  embedded = false,
}: {
  embedded?: boolean
}) {
  return (
    <div>
      <React.Suspense fallback={<PreviewSkeleton embedded={embedded} />}>
        <Preview02Example />
      </React.Suspense>
    </div>
  )
})

function PreviewSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={`grid min-w-0 grid-cols-3 gap-6 bg-muted p-10 dark:bg-background ${
        embedded ? 'min-h-screen' : 'min-h-[calc(100vh-3rem)]'
      }`}
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <Skeleton
          key={index}
          className={index % 4 === 0 ? 'h-80 rounded-xl' : 'h-52 rounded-xl'}
        />
      ))}
    </div>
  )
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

function useDelayedFlag(value: boolean, delay: number) {
  const [delayed, setDelayed] = React.useState(false)

  React.useEffect(() => {
    if (!value) {
      setDelayed(false)
      return
    }

    const timeout = window.setTimeout(() => setDelayed(true), delay)
    return () => window.clearTimeout(timeout)
  }, [value, delay])

  return delayed
}

function readThemeRuntimeQuery(): { embedded: boolean; mode?: ThemeMode } {
  if (typeof window === 'undefined') {
    return { embedded: false, mode: undefined as ThemeMode | undefined }
  }

  const params = new URLSearchParams(window.location.search)
  const embedRaw = params.get('embed')
  const chromeRaw = params.get('chrome')
  const modeRaw = params.get('mode')
  const embedByChrome = chromeRaw === '0' || chromeRaw === 'false'

  return {
    embedded: embedRaw === '1' || embedRaw === 'true' || embedByChrome,
    mode: modeRaw === 'light' || modeRaw === 'dark' ? modeRaw : undefined,
  }
}

function parseHashCss() {
  const value = readHashParams()?.get('css')
  if (!value) {
    return null
  }

  try {
    return decodeBase64Url(value)
  } catch {
    return null
  }
}

function parseHashMode(): ThemeMode | null {
  const mode = readHashParams()?.get('mode')
  return mode === 'dark' || mode === 'light' ? mode : null
}

function readCssStateFromLocation(fallbackCss: string): {
  css: string
  mode: ThemeMode
  style: StyleName
} {
  const nextCss = parseHashCss() ?? fallbackCss
  const nextMode = parseHashMode() ?? readSavedMode()
  const nextStyle = parseHashStyle() ?? DEFAULT_STYLE

  return {
    css: nextCss,
    mode: nextMode,
    style: nextStyle,
  }
}

function parseHashStyle() {
  return normalizeStyle(readHashParams()?.get('style'))
}

function readHashParams() {
  if (typeof window === 'undefined') {
    return null
  }

  const hash = window.location.hash.replace(/^#/, '')
  return hash ? new URLSearchParams(hash) : null
}

function readSavedMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const mode = window.localStorage.getItem('clonecn-mode')
  return mode === 'dark' || mode === 'light' ? mode : 'light'
}

function normalizeStyle(input: unknown): StyleName | null {
  return typeof input === 'string' && STYLES.includes(input as StyleName)
    ? (input as StyleName)
    : null
}

function styleLabel(style: StyleName) {
  return style[0].toUpperCase() + style.slice(1)
}

function buildCopyCss(css: string, style: StyleName) {
  return `/* component style: ${style} */\n\n${css}`
}

function observeStyleHooks() {
  applyStyleHooksToTree(document.body)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        applyStyleHooksToTree(mutation.target)
        continue
      }

      for (const node of mutation.addedNodes) {
        applyStyleHooksToTree(node)
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'data-slot',
      'data-variant',
      'data-size',
      'data-orientation',
    ],
  })

  return () => observer.disconnect()
}

function syncStyleStylesheet(style: StyleName) {
  for (const item of STYLES) {
    const id = `${STYLE_LINK_ID_PREFIX}-${item}`
    let link = document.getElementById(id) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = STYLE_CSS_URLS[item]
      document.head.appendChild(link)
    }

    if (link.getAttribute('href') !== STYLE_CSS_URLS[item]) {
      link.setAttribute('href', STYLE_CSS_URLS[item])
    }

    link.media = item === style ? 'all' : 'not all'
  }
}

function syncThemeStyles(css: string) {
  let style = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement('style')
    style.id = THEME_STYLE_ID
    document.head.appendChild(style)
  }

  if (style.textContent !== css) {
    style.textContent = css
  }

  if (
    style.parentElement === document.head &&
    style !== document.head.lastElementChild
  ) {
    document.head.appendChild(style)
  }
}

function applyStyleHooksToTree(node: Node) {
  if (!(node instanceof Element)) {
    return
  }

  if (node.hasAttribute('data-slot')) {
    applyStyleHooks(node as HTMLElement)
  }

  for (const element of node.querySelectorAll<HTMLElement>('[data-slot]')) {
    applyStyleHooks(element)
  }
}

function applyStyleHooks(element: HTMLElement) {
  const slot = element.dataset.slot
  if (!slot) {
    return
  }

  const slotPrefix = `cn-${slot}-`
  for (const key of STYLE_HOOK_KEYS) {
    const dynamicPrefix = `${slotPrefix}${key}-`
    for (const className of Array.from(element.classList)) {
      if (className.startsWith(dynamicPrefix)) {
        element.classList.remove(className)
      }
    }
  }

  element.classList.add(`cn-${slot}`)
  element.classList.toggle('cn-menu-target', MENU_TARGET_SLOTS.has(slot))

  for (const key of STYLE_HOOK_KEYS) {
    const value = element.dataset[key]
    if (value) {
      element.classList.add(`cn-${slot}-${key}-${value}`)
    }
  }
}

function readCurrentCss() {
  const root = document.documentElement
  const wasDark = root.classList.contains('dark')

  root.classList.remove('dark')
  const light = readVars()

  root.classList.add('dark')
  const dark = readVars()

  root.classList.toggle('dark', wasDark)

  return [block(':root', light), block('.dark', dark)].join('\n\n')
}

function readBaselineCss() {
  const themeStyle = document.getElementById(
    THEME_STYLE_ID,
  ) as HTMLStyleElement | null
  const wasDisabled = themeStyle?.disabled ?? false

  if (themeStyle) {
    themeStyle.disabled = true
  }

  try {
    return readCurrentCss()
  } finally {
    if (themeStyle) {
      themeStyle.disabled = wasDisabled
    }
  }
}

function readVars(): ThemeVars {
  const styles = window.getComputedStyle(document.documentElement)
  return Object.fromEntries(
    VARS.flatMap((key) => {
      const value = styles.getPropertyValue(`--${key}`).trim()
      return value ? [[key, value]] : []
    }),
  )
}

function buildPreviewUrl(css: string, mode: ThemeMode, style: StyleName) {
  if (typeof window === 'undefined') {
    return ''
  }

  const params = new URLSearchParams({
    css: encodeBase64Url(css),
    mode,
    style,
  })

  return `${window.location.origin}${window.location.pathname}${window.location.search}#${params.toString()}`
}

function syncBrowserUrl(css: string, mode: ThemeMode, style: StyleName) {
  if (typeof window === 'undefined') {
    return
  }

  window.history.replaceState(null, '', buildPreviewUrl(css, mode, style))
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function block(selector: string, vars: ThemeVars) {
  const lines = VARS.flatMap((key) => {
    const value = vars[key]
    return value ? [`  --${key}: ${value};`] : []
  })
  return `${selector} {\n${lines.join('\n')}\n}`
}

async function fetchSharedTheme(shareId: string): Promise<ShareRecordResponse> {
  const response = await fetch(`/api/share/${encodeURIComponent(shareId)}`)
  if (!response.ok) {
    throw new Error('Failed to load shared theme')
  }

  const data = (await response.json()) as Partial<ShareRecordResponse>

  const normalizedStyle = normalizeStyle(data.style)

  if (
    typeof data.id !== 'string' ||
    typeof data.css !== 'string' ||
    (data.mode !== 'light' && data.mode !== 'dark') ||
    !normalizedStyle
  ) {
    throw new Error('Invalid shared theme payload')
  }

  return {
    id: data.id,
    css: data.css,
    mode: data.mode,
    style: normalizedStyle,
  }
}

async function createShareLink(
  css: string,
  mode: ThemeMode,
  style: StyleName,
): Promise<string> {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ css, mode, style }),
  })

  if (!response.ok) {
    throw new Error('Failed to create share link')
  }

  const data = (await response.json()) as Partial<ShareCreateResponse>

  if (typeof window === 'undefined') {
    throw new Error('Window unavailable')
  }

  if (typeof data.url === 'string') {
    return data.url
  }

  if (typeof data.path === 'string') {
    return `${window.location.origin}${data.path}`
  }

  if (typeof data.id === 'string') {
    return `${window.location.origin}/share/${data.id}`
  }

  throw new Error('Invalid share response')
}

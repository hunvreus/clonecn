import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CheckIcon,
  CopyIcon,
  MoonIcon,
  SunIcon,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import { ButtonGroup } from '#/components/ui/button-group'
import { Label } from '#/components/ui/label'
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
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { IconPlaceholder } from '#/components/icon-placeholder'
import lumaCss from '#/theme/style-luma.css?url'
import lyraCss from '#/theme/style-lyra.css?url'
import maiaCss from '#/theme/style-maia.css?url'
import miraCss from '#/theme/style-mira.css?url'
import novaCss from '#/theme/style-nova.css?url'
import vegaCss from '#/theme/style-vega.css?url'

export const Route = createFileRoute('/')({ component: App })

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
const STYLE_CSS_URLS: Record<StyleName, string> = {
  nova: novaCss,
  vega: vegaCss,
  maia: maiaCss,
  lyra: lyraCss,
  mira: miraCss,
  luma: lumaCss,
}

type CopyTarget = 'css' | 'url'
type StyleName = (typeof STYLES)[number]
type ThemeVars = Record<string, string>

function App() {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light')
  const [css, setCss] = React.useState('')
  const [copied, setCopied] = React.useState<CopyTarget | null>(null)
  const [initialized, setInitialized] = React.useState(false)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [style, setStyle] = React.useState<StyleName>(DEFAULT_STYLE)
  const defaultCss = React.useRef('')
  const copyTimeout = React.useRef<number | null>(null)
  const debouncedCss = useDebouncedValue(css, 500)
  const themePending = useDelayedFlag(initialized && css !== debouncedCss, 500)
  const url = React.useMemo(
    () => (css ? buildPreviewUrl(css, mode, style) : ''),
    [css, mode, style],
  )

  React.useEffect(() => {
    const baselineCss = readCurrentCss()
    const nextState = readCssStateFromLocation(baselineCss)

    defaultCss.current = baselineCss
    setMode(nextState.mode)
    setStyle(nextState.style)
    setCss(nextState.css)
    setInitialized(true)
  }, [])

  React.useEffect(() => {
    if (!initialized) {
      return
    }

    function handleHashChange() {
      const nextState = readCssStateFromLocation(
        defaultCss.current || readCurrentCss(),
      )

      setMode(nextState.mode)
      setStyle(nextState.style)
      setCss(nextState.css)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [initialized])

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

    if (debouncedCss !== css) {
      return
    }

    syncBrowserUrl(debouncedCss, mode, style)
  }, [css, debouncedCss, initialized, mode, style])

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
    await window.navigator.clipboard.writeText(value)
    setCopied(target)

    if (copyTimeout.current) {
      window.clearTimeout(copyTimeout.current)
    }

    copyTimeout.current = window.setTimeout(() => setCopied(null), 1200)
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
    <main className="min-h-screen bg-muted text-foreground">
      {!initialized ? (
        <InitialLayout />
      ) : (
        <>
          <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
            <h1 className="text-base font-semibold tracking-tight">clonecn</h1>
            <div className="flex items-center gap-1">
              {themePending && <Spinner className="text-muted-foreground" />}
              <ButtonGroup>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={copied === 'url' ? 'Copied URL' : 'Copy URL'}
                  onClick={() => copy(url, 'url')}
                >
                  <CopyIcon />
                  {copied === 'url' ? 'Copied URL' : 'Copy URL'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={copied === 'css' ? 'Copied CSS' : 'Copy CSS'}
                  onClick={() => copy(buildCopyCss(css, style), 'css')}
                >
                  <CopyIcon />
                  {copied === 'css' ? 'Copied CSS' : 'Copy CSS'}
                </Button>
              </ButtonGroup>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="Edit theme"
                onClick={() => setEditorOpen(true)}
              >
                <IconPlaceholder
                  lucide="SlidersHorizontalIcon"
                  tabler="IconAdjustmentsHorizontal"
                  hugeicons="SlidersHorizontalIcon"
                  phosphor="SlidersHorizontalIcon"
                  remixicon="RiEqualizerLine"
                />
                Edit theme
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Reset theme"
                onClick={resetTheme}
              >
                <IconPlaceholder
                  lucide="RotateCcwIcon"
                  tabler="IconRefresh"
                  hugeicons="RefreshIcon"
                  phosphor="ArrowClockwiseIcon"
                  remixicon="RiRefreshLine"
                />
              </Button>
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

          <PreviewPane />

          <Sheet open={editorOpen} onOpenChange={setEditorOpen} modal={false}>
            <SheetContent
              side="right"
              hideOverlay
              overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"
              className="w-full sm:max-w-xl"
            >
              <SheetHeader>
                <SheetTitle>Edit Style</SheetTitle>
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
        </>
      )}
    </main>
  )
}

function InitialLayout() {
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

const PreviewPane = React.memo(function Preview() {
  return (
    <div>
      <React.Suspense fallback={<PreviewSkeleton />}>
        <Preview02Example />
      </React.Suspense>
    </div>
  )
})

function PreviewSkeleton() {
  return (
    <div className="grid min-h-[calc(100vh-3rem)] min-w-0 grid-cols-3 gap-6 bg-muted p-10 dark:bg-background">
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

function CopyButton({
  copied,
  label,
  onClick,
}: {
  copied: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="absolute top-0.5 right-0.5"
      aria-label={copied ? 'Copied' : label}
      onClick={onClick}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
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

function parseHashMode() {
  const mode = readHashParams()?.get('mode')
  return mode === 'dark' || mode === 'light' ? mode : null
}

function readCssStateFromLocation(fallbackCss: string) {
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

function readSavedMode() {
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

function readVars(): ThemeVars {
  const styles = window.getComputedStyle(document.documentElement)
  return Object.fromEntries(
    VARS.flatMap((key) => {
      const value = styles.getPropertyValue(`--${key}`).trim()
      return value ? [[key, value]] : []
    }),
  )
}

function buildPreviewUrl(
  css: string,
  mode: 'light' | 'dark',
  style: StyleName,
) {
  if (typeof window === 'undefined') {
    return ''
  }

  const params = new URLSearchParams({
    css: encodeBase64Url(css),
    mode,
    style,
  })

  return `${window.location.origin}${window.location.pathname}#${params.toString()}`
}

function syncBrowserUrl(css: string, mode: 'light' | 'dark', style: StyleName) {
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

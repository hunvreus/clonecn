export type ThemeMode = 'light' | 'dark'

export type ThemeVars = Record<string, string>

const FALLBACK_THEME_VARS: ThemeVars = {
  background: '#f6f5ef',
  foreground: '#1f1f1f',
  primary: '#ea580c',
  secondary: '#e7e0d4',
  accent: '#f59e0b',
}

export function resolveThemeVars(css: string, mode: ThemeMode) {
  const root: ThemeVars = {}
  const dark: ThemeVars = {}
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g
  let match: RegExpExecArray | null

  while ((match = blockPattern.exec(css))) {
    const selectors = match[1]
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean)
    const vars = parseDeclarations(match[2])

    if (selectors.includes(':root')) {
      Object.assign(root, vars)
    }

    if (selectors.some((selector) => selector.includes('.dark'))) {
      Object.assign(dark, vars)
    }
  }

  const resolved = mode === 'dark' ? { ...root, ...dark } : root
  return { ...FALLBACK_THEME_VARS, ...resolved }
}

function parseDeclarations(block: string) {
  const vars: ThemeVars = {}
  const declarationPattern = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi
  let match: RegExpExecArray | null

  while ((match = declarationPattern.exec(block))) {
    vars[match[1]] = match[2].trim()
  }

  return vars
}

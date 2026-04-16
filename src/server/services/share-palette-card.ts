import type { ShareRecord } from '#/server/services/share'
import { resolveThemeVars } from '#/server/services/theme-vars'
import type { ThemeMode } from '#/server/services/theme-vars'

export function renderSharePaletteCard(
  share: ShareRecord,
  options?: { mode?: ThemeMode },
) {
  const mode = options?.mode ?? share.mode
  const vars = resolveThemeVars(share.css, mode)

  const background = esc(vars.background)
  const foreground = esc(vars.foreground)
  const primary = esc(vars.primary)
  const secondary = esc(vars.secondary)
  const accent = esc(vars.accent)
  const canvasWidth = 1200
  const canvasHeight = 630
  const squareSize = 188
  const gap = 44
  const logoWidth = squareSize * 0.75
  const logoBar = squareSize * 0.25
  const logoBarLength = squareSize * 0.5
  const groupWidth = logoWidth + squareSize * 3 + gap * 3
  const groupX = (canvasWidth - groupWidth) / 2
  const groupY = (canvasHeight - squareSize) / 2
  const logoX = groupX
  const logoY = groupY
  const swatch1X = logoX + logoWidth + gap
  const swatch2X = swatch1X + squareSize + gap
  const swatch3X = swatch2X + squareSize + gap

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="clonecn theme card">
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="${background}" />

  <rect x="${logoX + logoBar}" y="${logoY}" width="${logoBarLength}" height="${logoBar}" fill="${foreground}" />
  <rect x="${logoX + logoBar}" y="${logoY + squareSize - logoBar}" width="${logoBarLength}" height="${logoBar}" fill="${foreground}" />
  <rect x="${logoX}" y="${logoY + logoBar}" width="${logoBar}" height="${logoBarLength}" fill="${foreground}" />

  <rect x="${swatch1X}" y="${groupY}" width="${squareSize}" height="${squareSize}" fill="${primary}" />
  <rect x="${swatch2X}" y="${groupY}" width="${squareSize}" height="${squareSize}" fill="${secondary}" />
  <rect x="${swatch3X}" y="${groupY}" width="${squareSize}" height="${squareSize}" fill="${accent}" />
</svg>`
}

function esc(value?: string) {
  const input = value || ''
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

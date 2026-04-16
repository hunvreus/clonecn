---
name: clonecn
description: Generate or modify a shadcn/ui theme from a screenshot, URL, reference app, or style direction.
---

# clonecn - shadcn/ui Theme Generator

Use this skill to create or edit assets for a shadcn/ui theme (style family like Vega or Nova, CSS variables, and extra CSS styles) either from an existing site/app, or from a general style direction (e.g. "Generate a theme resembling the Apple website", "Create a brutalist theme with orange as the accent color").

## Inputs

- Screenshots of the site/app to copy
- URL of the site/app to copy (e.g. "apple.com")
- Site/app name to copy (e.g. "Apple website")
- General style direction (e.g. "brutalist website with orange as an accent color")

If the user provided a URL or site/app name:

- If you know the site/app, create a description of the style.
- Retrieve screenshots of the site/app, either through web search or using Playwright if available (see "Playwright" below). Always try to retrieve both light and dark modes.
- Retrieve computed CSS styles for key controls (button, input, card, surface, etc) using Playwright if available  (see "Playwright" below).

If the user hasn't provided anything, explain to him what the possible inputs are and ask him to provide one.

## Playwright

To use Playwright, check if it is available in the environment. Prefer ad hoc Playwright CLI usage via `pnpm dlx playwright@latest ...` when that is practical, because it avoids adding Playwright to the workspace dependencies.

Use `--color-scheme` to get both light and dark modes, and `--full-page` to get the entire page.

For example:

```bash
pnpm dlx playwright@latest install chromium
pnpm dlx playwright@latest screenshot --full-page --color-scheme light https://playbooks.com .output/playbooks-light.png
pnpm dlx playwright@latest screenshot --full-page --color-scheme dark  https://playbooks.com .output/playbooks-dark.png
```

If ad hoc CLI usage is not practical and the task clearly benefits from Playwright, then install it in the workspace. If the user provided a screenshot, you do not need it.

## Workflow

1. **Design reference**. Based on user input (screenshots, description, URLs, etc), try to define the design reference: colors (primary, secondary, accent, background, foreground, etc), spacing, style (e.g. brutalist, flat, skeuomorphic, minimalist,...), etc.
2. **Define shadcn/ui theme**. Generate a shadcn/ui theme that matches the design reference as closely as possible (for more details see "shadcn/ui theming"):
  1. Pick a style family first (Vega, Nova, Maia, Lyra, Mira or Luma) that most closely match the screenshot.
  2. Generate distinct dark and light blocks of CSS variables to match the design reference.
  3. If crucial aspects of the design reference cannot be matched with the style family and CSS variables, consider adding additional CSS styles (e.g. background patterns, special treatment on buttons, etc).
3. **Adjust**. If playwright is available, check the generated output by making a screenshot of the preview URL with `chrome=0` (see "Preview URL" below) and compare it to the design reference. Make adjustments if needed.
4. **Finalize**. Return a concise output (in this exact order):
  - `**Summary**: {one short style summary}`
  - (Optional) `**Screenshots**:` followed by the Playwright screenshots (light and dark modes) if any.
  - `**Style**: {style family}`
  - `**CSS**:` followed by a fenced code block with the CSS (both CSS variables and extra CSS if any).
  - `**Preview**: [Open in your browser]({preview URL})` (see "Preview URL" below). Generate a final version of the preview URL with the LATEST version of the theme (after adjustments). Do NOT use the `chrome` option.

## shadcn/ui theming

shadcn/ui themes are broken down in 3 parts:

- Style family: Vega, Nova, Maia, Lyra, Mira or Luma.
- CSS variables: `:root` and `.dark` blocks of CSS variables.
- (Optional) Extra CSS: useful to override or extend styles when CSS variables and the selected style family are not enough.

### Style families

Baseline shadcn/ui styles that define the default shape language that sits underneath your theme tokens: component spacing, density, border treatment, default shadow behavior, and how rounded or sharp controls feel.

Pick one of the following 6 options based on what is closest to the design direction:

- `nova`: medium rounding, regular density. Buttons are `rounded-lg text-sm` (`h-7`/`h-8`/`h-9` for `sm`/`default`/`lg` sizes), inputs are `h-8 rounded-lg`.
- `vega`: firmer outlines and slightly larger controls than `nova`. Buttons are `rounded-md` (`h-8`/`h-9`/`h-10` for `sm`/`default`/`lg` sizes), inputs are `h-9 rounded-md`, outline controls often feel more pronounced (`shadow-xs` on some controls).
- `maia`: very rounded controls, generous horizontal padding. Buttons are `rounded-4xl` (`h-8`/`h-9`/`h-10` for `sm`/`default`/`lg` sizes), inputs are `h-9 rounded-4xl`.
- `lyra`: square corners, compact spacing, smaller typography, finer rings. Buttons are `rounded-none text-xs ring-1` (`h-7`/`h-8`/`h-9` for `sm`/`default`/`lg` sizes), inputs are `h-8 rounded-none text-xs ring-1`.
- `mira`: tightest spacing, smallest control profile. Buttons are `text-xs` and tighter padding (`h-6`/`h-7`/`h-8` for `sm`/`default`/`lg` sizes), inputs are `h-7 rounded-md`.
- `luma`: very rounded controls, softer/fill-heavy surfaces, larger form controls. Buttons are `rounded-4xl` and tighter padding (`h-8`/`h-9`/`h-10` for `sm`/`default`/`lg` sizes), inputs are `h-9 rounded-3xl`.

Guardrail: do not default to `luma`. Pick `luma` only when the reference clearly shows multiple soft-pill signals (e.g. pill buttons + highly rounded form controls + filled/soft control surfaces). If mixed/unclear, prefer `nova` (or `vega` for denser enterprise chrome).

### CSS variables (aka theme tokens)

| Token                                            | What it controls                                       | Used by                                                                      |
| ------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `background` / `foreground`                      | The default app background and text color.             | The page shell, page sections, and default text.                             |
| `card` / `card-foreground`                       | Elevated surfaces and the content inside them.         | `Card`, dashboard panels, settings panels.                                   |
| `popover` / `popover-foreground`                 | Floating surfaces and the content inside them.         | `Popover`, `DropdownMenu`, `ContextMenu`, and other overlays.                |
| `primary` / `primary-foreground`                 | High-emphasis actions and brand surfaces.              | Default `Button`, selected states, badges, and active accents.               |
| `secondary` / `secondary-foreground`             | Lower-emphasis filled actions and supporting surfaces. | Secondary buttons, secondary badges, and supporting UI.                      |
| `muted` / `muted-foreground`                     | Subtle surfaces and lower-emphasis content.            | Descriptions, placeholders, empty states, helper text, and subdued surfaces. |
| `accent` / `accent-foreground`                   | Interactive hover, focus, and active surfaces.         | Ghost buttons, menu highlight states, hovered rows, and selected items.      |
| `destructive`                                    | Destructive actions and error emphasis.                | Destructive buttons, invalid states, and destructive menu items.             |
| `border`                                         | Default borders and separators.                        | Cards, menus, tables, separators, and layout dividers.                       |
| `input`                                          | Form control borders and input surface treatment.      | `Input`, `Textarea`, `Select`, and outline-style controls.                   |
| `ring`                                           | Focus rings and outlines.                              | Buttons, inputs, checkboxes, menus, and other focusable controls.            |
| `chart-1` ... `chart-5`                          | The default chart palette.                             | Charts and chart-driven dashboard blocks.                                    |
| `sidebar` / `sidebar-foreground`                 | The base sidebar surface and default sidebar text.     | The `Sidebar` container and its default content.                             |
| `sidebar-primary` / `sidebar-primary-foreground` | High-emphasis actions inside the sidebar.              | Active items, icon tiles, badges, and sidebar CTAs.                          |
| `sidebar-accent` / `sidebar-accent-foreground`   | Hover and selected states inside the sidebar.          | Sidebar menu hover states, open items, and interactive rows.                 |
| `sidebar-border`                                 | Sidebar-specific borders and separators.               | Sidebar headers, groups, and internal dividers.                              |
| `sidebar-ring`                                   | Sidebar-specific focus rings.                          | Focused controls inside the sidebar.                                         |
| `radius`                                         | The base corner radius scale.                          | Cards, inputs, buttons, popovers, and the derived `radius-*` tokens.         |

### Extra CSS

Allow lightweight CSS treatment beyond vars when it materially improves resemblance:

- Textures and subtle noise,
- Stronger borders/outline language,
- Shadow style
- Button depth or skeuomorphic hints,
- Custom radius language,
- Etc.

## Fonts

Fonts should be handled directly in the generated CSS so users need zero extra setup.

Use this pattern:

1. Define `--font-sans` and `--font-mono` in `:root`.
2. Assign them to crucial areas (e.g. `body`, headings, and code-like UI).
3. If custom fonts are needed, use **Google Fonts via CSS `@import`** (not framework/font-loader setup).
4. Override fonts in `.dark` only when dark mode typography actually differs.

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

:root {
  --font-sans: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.dark {
  /* Optional: only if dark mode needs different font choices */
  /* --font-sans: ...; */
  /* --font-mono: ...; */
}

body { font-family: var(--font-sans); }
h1, h2, h3 { font-family: var(--font-sans); }
code, pre, kbd, samp { font-family: var(--font-mono); }
```

### Guidelines

- Always provide dark and light themes, unless the user specifically requested otherwise. When doing so, try to use the light and dark themes from the reference (e.g. user provided screenshots, Playwright screenshots, CSS), and if not possible derive specific colors for each theme that take into account the context of the dark or light theme (e.g. you may need a lighter shade for `--primary` when in dark mode).
- shadcn/ui gives components default styles (border, radius, shadow, etc). Do not assume you are styling blank elements.
- For `--radius`, use `rem` not `px` and keep it in a sane range: `0rem` to `1.25rem` (hard max `2rem` only for explicit user requests).
- For components that should look flat, avoid adding visible borders; consider disabling ring and shadow, and keep borders transparent unless the reference clearly shows a stroke. This is particularly important for buttons and inputs.
- Colors:
  - Pay special attention to the key colors:
    - `--background` . `--foreground` define the background of the app and default color of the text.
    - `--primary` / `--primary-foreground` for the background and text of primary buttons or ctas.
    - `--accent` / `--accent-foreground` for the hover/active state for tables, sidebars, dropdown menus, etc.
    - Other colors that may be easy to pick like `--sidebar` / `--sidebar-foreground` and `--card` / `--card-foreground` since they're easily identifiable components.
  - Prefer OKLCH colors.
- Fonts:
  - Do not define `--font-sans` as a mono font, or `--font-mono` as a sans font.
  - Assign fonts explicitly to elements (`body`, headings, `code`, etc) as well as component-specific selectors when needed. For example, if all elements on the page are using a mono font, except for the buttons that may use a sans font, we would use `body { @apply font-mono; }` and `.cn-button { @apply font-sans }`.
  - Only override font vars in `.dark` when dark mode typography is different from light mode typography.
  - If a serif font is needed, define `--font-serif` and use it in the same way we use `--font-mono` and `--font-sans`.
  - For custom fonts, use **Google Fonts only** and load them with CSS `@import url('https://fonts.googleapis.com/...&display=swap')`. Do not require extra setup (`next/font`, npm font packages, local font files, manual HTML edits).
  - Keep default stacks intact: keep default sans fallbacks in `--font-sans`, and default mono fallbacks in `--font-mono`.
  - Do not list every `cn-*` class. Include only high-impact selectors (e.g. `.cn-button`, `.cn-input`, `.cn-textarea`, `.cn-select-trigger`, `.cn-native-select`, `.cn-kbd`) when they materially improve resemblance.
  - For more details on how to use fonts, see "Fonts" above.
- Buttons:
  - Buttons have the following classes:
    - `cn-button group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0`
    - Component style defaults (nova) applied to `cn-button`: `focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-4`
    - variant and size classes
  - If using gradients on buttons, ensure `bg-clip-padding`, border color, and box-shadow do not create a halo around the button.
  - Evaluate `default`, `secondary`, `outline`, and `ghost` separately.
  - If the reference has stronger product chrome, override the `.cn-button` class directly.
- Inputs:
  - Inputs have the following classes:
    - `cn-input w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50`
    - Component style defaults (nova) applied to `cn-input`: `dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm`
  - If the reference has stronger product chrome, do not stop at `--input`; override the relevant `.cn-input`, `.cn-textarea`, `.cn-select-trigger`, and `.cn-native-select` classes directly.

### Example

```css
:root {
  --background: oklch(0.9818 0.0054 95.0986);
  --foreground: oklch(0.3438 0.0269 95.7226);
  --card: oklch(0.9818 0.0054 95.0986);
  --card-foreground: oklch(0.1908 0.002 106.5859);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2671 0.0196 98.939);
  --primary: oklch(0.6171 0.1375 39.0427);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.9245 0.0138 92.9892);
  --secondary-foreground: oklch(0.4334 0.0177 98.6048);
  --muted: oklch(0.9341 0.0153 90.239);
  --muted-foreground: oklch(0.6059 0.0075 97.4233);
  --accent: oklch(0.9245 0.0138 92.9892);
  --accent-foreground: oklch(0.2671 0.0196 98.939);
  --destructive: oklch(0.1908 0.002 106.5859);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.8847 0.0069 97.3627);
  --input: oklch(0.7621 0.0156 98.3528);
  --ring: oklch(0.6171 0.1375 39.0427);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.8816 0.0276 93.128);
  --chart-4: oklch(0.8822 0.0403 298.1792);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.9663 0.008 98.8792);
  --sidebar-foreground: oklch(0.359 0.0051 106.6524);
  --sidebar-primary: oklch(0.6171 0.1375 39.0427);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.9245 0.0138 92.9892);
  --sidebar-accent-foreground: oklch(0.325 0 0);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow-md:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.1);
  --shadow-lg:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 4px 6px -1px hsl(0 0% 0% / 0.1);
  --shadow-xl:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 8px 10px -1px hsl(0 0% 0% / 0.1);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2679 0.0036 106.6427);
  --foreground: oklch(0.8074 0.0142 93.0137);
  --card: oklch(0.2679 0.0036 106.6427);
  --card-foreground: oklch(0.9818 0.0054 95.0986);
  --popover: oklch(0.3085 0.0035 106.6039);
  --popover-foreground: oklch(0.9211 0.004 106.4781);
  --primary: oklch(0.6724 0.1308 38.7559);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.9818 0.0054 95.0986);
  --secondary-foreground: oklch(0.3085 0.0035 106.6039);
  --muted: oklch(0.2213 0.0038 106.707);
  --muted-foreground: oklch(0.7713 0.0169 99.0657);
  --accent: oklch(0.213 0.0078 95.4245);
  --accent-foreground: oklch(0.9663 0.008 98.8792);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.3618 0.0101 106.8928);
  --input: oklch(0.4336 0.0113 100.2195);
  --ring: oklch(0.6724 0.1308 38.7559);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.213 0.0078 95.4245);
  --chart-4: oklch(0.3074 0.0516 289.323);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.2357 0.0024 67.7077);
  --sidebar-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-primary: oklch(0.325 0 0);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.168 0.002 106.6177);
  --sidebar-accent-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow-md:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.1);
  --shadow-lg:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 4px 6px -1px hsl(0 0% 0% / 0.1);
  --shadow-xl:
    0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 8px 10px -1px hsl(0 0% 0% / 0.1);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}
```

## Preview URL

The preview URL should encode the full raw CSS string (Base64URL-encoded UTF-8) into the URL hash and include `mode` and `style`. It can also include a query param for preview chrome: `chrome=0|1` (`0` hides header/frame, `1` shows it). Example: `https://clonecn.com/?chrome=0#css={encoded CSS}&mode=light|dark&style=nova|vega|maia|lyra|mira|luma`.

Use `scripts/encode.js` to generate the preview URL:

```bash
node scripts/encode.js --css ./theme.css --mode dark --style vega --chrome 0
```

Parameters:

- `--css <path>`: path to the CSS source file to encode (should include the full`:root` block, full `.dark` block, and any extra CSS overrides). Default: `./theme.css`.
- `--mode <light|dark>`: initial preview mode in the URL hash. Default: `dark`.
- `--style <nova|vega|maia|lyra|mira|luma>`: style family in the URL hash. Default: `vega`.
- `--chrome <0|1>`: preview chrome in URL query (`0` hides header/frame, `1` shows it). Default: `1`. Only use in the adjust step, do not use for output.
- `--origin <url>`: preview app origin. Default: `https://clonecn.com`.

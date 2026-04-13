---
name: clonecn
description: Generate or modify a shadcn/ui theme from a screenshot, URL, reference app, or style direction.
metadata:
  short-description: Generate clonecn shadcn/ui themes
---

# clonecn Theme Generator

Use this skill to create or edit assets for a shadcn/ui theme (CSS variables, CSS styles and component styles like Vega or Nova) either from an existing site/app, or from a general style direction (e.g. "Generate a theme resembling the Apple website", "Create a brutalist theme with orange as the accent color").

## Inputs

- Screenshot of the site/app to copy
- URL of the site/app to copy (e.g. "apple.com")
- Site/app name to copy (e.g. "Apple website")
- General style direction (e.g. "brutalist website with orange as an accent color")

If the user provided a screenshot, use those first.

If the user hasn't provided anything, explain to him what the possible inputs are and ask him to provide one.

## Dependencies

**This skill may need Playwright**. If the user provided a URL (e.g. "apple.com") or site/app name as a reference (e.g. "Apple website"), check if Playwright is available in the environment. Prefer ad hoc Playwright CLI usage via `pnpm dlx playwright@latest ...` when that is practical, because it avoids adding Playwright to the workspace dependencies. For example:

```bash
pnpm dlx playwright@latest install chromium
pnpm dlx playwright@latest screenshot https://posthog.com posthog.png
```

If ad hoc CLI usage is not practical and the task clearly benefits from Playwright, then install it in the workspace. If the user provided a screenshot, you do not need it.

## Steps

1. **Design reference**. Based on user input, try to define the design reference:
   1. If the user provided no visual reference and instead used a general direction, use that.
   2. Otherwise, if the user provided a screenshot, use that.
   3. Otherwise, if the user provided a URL or site/app name, use Playwright to retrieve screenshots of the app/site along with the CSS for the relevant elements: page background and text colors, buttons, dialogs, etc. Prefer `pnpm dlx playwright@latest ...` if possible.
2. **Define shadcn/ui theme**. Generate a shadcn/ui theme that matches the design reference as closely as possible (for more details see "shadcn/ui theming"):
   1. Pick a component style first (Vega, Nova, Maia, Lyra, Mira or Luma) as it impacts critical aspects of the design (e.g. spacing, rounded or straight corners, etc) that cannot be controlled by CSS variables.
   2. Once that is done, generate dark and light blocks of CSS variables, matching colors, border radius, typography, etc.
      - `:root` must be a real light theme and `.dark` must be a real dark theme, unless the user explicitly asked for a single-mode theme.
      - Do not duplicate a dark palette into both `:root` and `.dark`, or a light palette into both, even if the reference only shows one mode.
      - If the reference only shows one mode, derive the missing mode from the same visual language so the light/dark switch still works meaningfully.
   3. If crucial aspects of the design reference cannot be matched with the component style and CSS variables, consider adding additional CSS styles (e.g. background patterns, special treatment on buttons, etc).
3. **Finalize**.
   1. Do a validation pass against the reference and do not return the theme if it still looks like the untouched preset.
      - Confirm that `mode=light` and `mode=dark` produce materially different results when both modes were requested.
   2. Return concise output with:
      - `**Summary**: {one short style summary}`
      - if a screenshot was captured and it materially helps the user judge the match, include `**Screenshot**:` and then include it directly in the response
      - `**Style**: {component style}`
      - `**CSS**:`
      - a fenced code block with the CSS (both CSS variables and extra CSS if any)
      - if a preview URL is available, include `[See preview]({URL})`

## Conversation protocol

- If input is unclear or underspecified, ask 1-2 targeted questions and include one concrete example direction the user can pick.
- If input is clear, state a one-sentence plan that mentions only what will change, then generate.
- After generation, give a short delta-only summary focused on what changed (tokens/components), not a full restatement of intent.

## Prompt-to-token mapping

Use these defaults unless the user specifies otherwise:

- "Make it [color]" or broad recolor requests: prioritize brand/action tokens first (`--primary`, `--secondary`, `--accent`, `--ring`), then align `--chart-*` and sidebar emphasis tokens to the same hue family.
- "Background darker/lighter" or surface-tone requests: modify surface tokens (`--background`, `--card`, `--popover`, `--muted`, `--sidebar`) and their foreground pairs, not brand/action tokens.
- "Change [token] in dark/light mode": modify only the requested mode block (`:root` or `.dark`) unless the user asks to mirror both.
- If the user references a base theme or current theme and asks for a narrow change, preserve non-requested token families (especially radius, shadow model, and typography behavior).

## Style archetypes for complex themes

When the request names a broad style, commit consistently across radius, borders, shadows, and control chrome:

- Flat: keep surfaces close in tone, minimize or remove shadows, preserve clear borders, and avoid glossy button treatments.
- Minimal: use subtle surface steps, restrained borders/shadows, and clean control chrome with quiet focus rings.
- Brutalist: use square corners (`radius` near `0`), high-contrast borders, and hard offset shadows (low blur, stronger opacity, limited spread/offset).

Do not blend conflicting archetypes unless the user explicitly asks for a hybrid.

## shadcn/ui theming

shadcn/ui themes are broken down in 3 parts:

- Components styles: Vega, Nova, Maia, Lyra, Mira or Luma. This defines aspects of the theme that can't be customized by CSS variables.
- CSS variables: `:root` and `.dark` blocks of CSS variables. That's the "meat" of the theme that defines colors, fonts, shadows, etc.
- (Optional) Extra CSS: useful to override or extend styles when CSS variables and component styles are not enough.

### Components styles

Component styles are the baseline shadcn/ui style families. They define the default shape language that sits underneath your theme tokens: component spacing, density, border treatment, default shadow behavior, and how rounded or sharp controls feel. Pick this first, because some visual traits are easier to get by choosing the right family than by fighting the preset with extra CSS later.

The descriptions below are based on the local registry CSS files, especially the default radius, spacing, and control treatment used by buttons, inputs, dialogs, and grouped controls.

- `Nova`: balanced and general-purpose, with medium rounding (`rounded-lg` in many controls) and standard app density. Good default when the reference is modern but not highly stylized.
- `Vega`: similar to Nova but a little firmer and more structured, with more obvious outline/button treatment and medium rounding (`rounded-md` to `rounded-xl`). Good for denser product UIs.
- `Maia`: the softest and most rounded family, with pill-like buttons and large radii (`rounded-4xl`, `rounded-full`). Good for friendlier or more consumer-feeling interfaces.
- `Lyra`: the sharpest family, with many controls using `rounded-none`, smaller text, and a flatter, more editorial feel. Good when the reference is square, restrained, or intentionally severe.
- `Mira`: compact and product-dense, with smaller text, tighter spacing, and modest rounding (`rounded-md`, `rounded-sm`). Good for tighter utility-heavy app UIs.
- `Luma`: rounded and airy, especially in form controls (`rounded-3xl`, `rounded-full`), with softer inputs and brighter, more open chrome. Good for glossy or friendly interfaces with soft controls.

These style families are implemented in the local CSS files imported by clonecn:

- `src/theme/style-nova.css`
- `src/theme/style-vega.css`
- `src/theme/style-maia.css`
- `src/theme/style-lyra.css`
- `src/theme/style-mira.css`
- `src/theme/style-luma.css`

If the chosen family still fights the reference, keep the closest one for the general layout rhythm and then override the remaining differences with theme tokens and extra CSS.

### shadcn/ui gotchas

shadcn/ui already gives many components a built-in visual model. When generating a theme, do not assume you are styling blank elements.

- Inspect the base component's existing border, radius, shadow, and background treatment before adding extra CSS.
- Do not stack a new border/shadow model on top of an existing one unless they are intentionally compatible.
- Treat the chosen component style family as structural, not cosmetic. If its default geometry fights the reference, switch families before piling on overrides.
- When the reference depends on component chrome, do not rely on tokens alone. Override the specific component classes involved.
- Validate buttons, inputs, cards, dialogs, and navigation separately. It is not enough that the primary color is merely present somewhere.
- Treat light and dark mode as separate deliverables. The mode switch should produce a meaningful visual change, not the same palette duplicated twice.
- Watch for shadcn/ui artifacts such as default neutral borders, inherited rounded corners, muted hover layers, focus rings, and `bg-background` or `bg-secondary` fills bleeding through.
- For saturated CTA buttons, make the fill, edge, and depth read as one object. Avoid pale or translucent rims unless the reference clearly has them.
- If using gradients on buttons, ensure `bg-clip-padding`, border color, and box-shadow do not create a halo around the button.

### Buttons

Buttons need their own treatment. In shadcn/ui, button chrome is a stack of variant classes, border, fill, radius, ring, focus styling, and sometimes clipping or highlight behavior. Do not treat them as simple token-colored rectangles.

- Evaluate `default`, `secondary`, `outline`, and `ghost` separately.
- Treat CTA button borders separately from card and input borders.
- Evaluate fill, edge, highlight, shadow, and focus ring as one system.
- If the reference has flat product buttons, avoid translucent rims, generic outline borders, and default neutral shadcn edge treatment.
- If the reference has desktop-like depth, prefer an explicit edge color plus bottom shadow over a generic neutral border.
- If the reference has soft or pill-like buttons, pick a component style family that already supports that before piling on overrides.

Useful button recipes:

- `Flat SaaS CTA`: solid fill, slightly darker edge, no pale top rim, restrained shadow, quiet ring.
- `Desktop/Product CTA`: integrated edge color, subtle inset top highlight, firmer bottom shadow, tight or square radius.
- `Soft Consumer CTA`: low-contrast edge, softer shadow, larger radius, gentler ring.

Common button failure modes:

- halo border around a saturated fill
- default gray outline leaking through the custom fill
- button border and shadow reading as separate layers
- focus ring color clashing with the button chrome
- all button variants inheriting the same edge treatment when the reference differentiates them

### Inputs

Inputs and selects also need dedicated treatment. In shadcn/ui they often keep default neutral chrome unless you override them directly, so token changes alone often leave them looking like generic shadcn controls.

- Evaluate `Input`, `Textarea`, `Select`, and other outline-style controls separately from buttons and cards.
- Treat the input surface, border, placeholder/muted text, and focus ring as one system.
- If the reference has stronger product chrome, do not stop at `--input`; override the relevant `.cn-input`, `.cn-textarea`, `.cn-select-trigger`, and `.cn-native-select` classes directly.
- If the reference has very quiet inputs, remove unintended highlights, excessive contrast, and default gray edge treatment.
- If the reference has dense utility-style controls, ensure radius and spacing align with that density instead of staying at generic shadcn defaults.

Useful input recipes:

- `Flat Product Input`: quiet surface tint, visible but restrained edge, minimal shadow, crisp focus ring.
- `Desktop Utility Input`: stronger edge contrast, subtle inset highlight only if the reference clearly has it, tight radius, compact feel.
- `Soft Consumer Input`: softer surface, lower-contrast edge, larger radius, lighter ring treatment.

Common input failure modes:

- generic gray outline treatment left in place
- border contrast too weak or too strong for the surface
- ring color or thickness feeling unrelated to the rest of the theme
- input surface reading as plain white when the reference uses tinted controls
- inputs, selects, and textareas not matching each other

### CSS variables (aka theme tokens)

The most important part of a shadcn/ui theme is the token set that lives in your CSS file under `:root` and `.dark`.

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

This extra CSS will live directly under the exported theme vars.

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

### Validation checks

Do not validate the theme only at a high level. Check the chrome system by component type:

- cards and dialogs: surface tint, border weight, highlight, shadow
- buttons: fill, edge, highlight, shadow, focus ring, variant differentiation
- inputs and selects: surface, border, placeholder contrast, focus ring, consistency across control types
- toggles and selection controls: checkbox, switch, radio, slider/progress track and thumb, active/checked contrast
- popovers and menus: select content, dropdown menus, dialog/sheet overlays and content (portal-rendered surfaces)
- tables and separators: border contrast and density

If any of those still read as untouched shadcn/ui rather than the target reference, the theme is not done.

When extra CSS is needed for control chrome, prefer slot selectors first and keep class fallbacks:

- target `data-slot` selectors (example: `[data-slot='button']`, `[data-slot='input']`, `[data-slot='select-trigger']`)
- keep `.cn-*` class selectors as compatibility fallbacks for clonecn previews

## Preview link

Use `https://clonecn.hunvreus.workers.dev` for preview URLs. The preview link should encode the full raw CSS string into the URL hash and include `mode` and `style`. The app reads `https://clonecn.hunvreus.workers.dev#css=...&mode=light|dark&style=nova|vega|maia|lyra|mira|luma`, injects the CSS, and applies the selected component style. The `css` payload is the source of truth and should include both the theme tokens and any extra CSS overrides.

## Guidelines

- Use OKLCH when possible.
- Ignore custom fonts, instead just use the default `font-mono` and `font-sans` font families.
- Keep enough contrast for text and controls. WCAG AA is the floor unless the user explicitly wants a rough mockup.
- Always provide dark and light themes, unless the user specifically requested otherwise. When doing so, try to use the light and dark themes from the reference (e.g. user provided screenshots, Playwright screenshots, CSS), and if not possible derive specific colors for each theme that take into account the context of the dark or light theme (e.g. you may need a lighter shade for `--primary` when in dark mode).
- Use tinted near-neutrals for surfaces. Avoid pure `#FFFFFF` and `#000000` unless the user explicitly asks for true black/white.
- For shadows, tune by mode: lighter/softer in light mode, stronger in dark mode so depth remains visible.
- Do not stop when the output still looks like the untouched preset. If the result still reads as generic shadcn/ui, the theme is not done.
- Before returning a theme, verify at minimum that the visible radius matches the reference, the primary color is clearly present in the UI, and the overall chrome no longer looks like the base style family.
- Before returning a theme, inspect CTA buttons for halo artifacts, mismatched border-vs-fill treatment, and shadows that feel detached from the button edge.
- Before returning a theme, toggle both light and dark mode and verify that portal controls (select/dropdown/dialog/sheet content and overlays) also switch correctly.

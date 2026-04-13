# clonecn

clonecn is a shadcn/ui theme playground and preview app.

It lets you:
- edit theme CSS variables
- switch style families (nova, vega, maia, lyra, mira, luma)
- preview light/dark modes
- share a preview via URL hash (`css`, `mode`, `style`)

## Run locally

Requirements:
- Node.js 22+
- pnpm 10+

Install and start:

```bash
pnpm install
pnpm dev
```

Open:
- `http://localhost:3000`

## Build

```bash
pnpm build
```

## Deploy

Current preview domain:
- `https://clonecn.hunvreus.workers.dev`

Planned primary domain:
- `https://clonecn.com`

## Skill packaging

Publishable Codex skill files are in:
- `skills/clonecn/SKILL.md`
- `skills/clonecn/agents/openai.yaml`

`.codex/` is local-only and gitignored.

# clonecn

`clonecn` is a reusable Codex skill for generating shadcn/ui themes from screenshots, URLs, or style prompts.

## Install

Use one of these:

```bash
# skills CLI
npx skills add hunvreus/clonecn --skill clonecn

# skills CLI (Pi)
npx skills add hunvreus/clonecn --skill clonecn --agent pi --yes

# skills CLI (Claude Code)
npx skills add hunvreus/clonecn --skill clonecn --agent claude-code --yes

# skills CLI (direct folder URL)
npx skills add https://github.com/hunvreus/clonecn/tree/main/skills/clonecn

# Codex skill-installer (path install)
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo hunvreus/clonecn \
  --path skills/clonecn
```

## Usage

Invoke with `$clonecn` and provide screenshots, name and/or URLs of sites/apps (e.g. "Cursor.com"), style directions (e.g. "brutalist website with orange as an accent color").

The skill returns a shadcn/ui theme (recommend style family + full CSS) along with a preview link at `https://clonecn.com`.

## Repository layout

- `skills/clonecn/SKILL.md`: canonical, publishable skill definition
- `skills/clonecn/agents/openai.yaml`: agent metadata
- `.codex/skills/clonecn/*`: local development copy

## Web app

*The web app is used only to preview the theme. It is available at https://clonecn.com.*

Run locally:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Build:

```bash
pnpm build
```

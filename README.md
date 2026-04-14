# clonecn

`clonecn` is an agent skill for generating shadcn/ui themes from screenshots, URLs, or style prompts.

Factory.ai | Fly.io | Hacker News
--- | --- | ---
<img width="1512" height="945" alt="factory-ai" src="https://github.com/user-attachments/assets/ac0ca041-c0b4-4a4c-b427-23d2d1e80ac9" /> | <img width="1512" height="945" alt="fly-io" src="https://github.com/user-attachments/assets/ffb3200c-8703-46c8-bc5d-ab584a1b47a0" /> | <img width="1512" height="945" alt="hn" src="https://github.com/user-attachments/assets/e3179720-ab40-4ab4-b848-6a615a8b980e" />

PostHog | Supabase | "Tokyo cyberpunk mono"
--- | --- | ---
<img width="1512" height="945" alt="posthog" src="https://github.com/user-attachments/assets/cad38582-6900-46c0-8aa2-c3c6b1395cf6" /> | <img width="1512" height="945" alt="supabase" src="https://github.com/user-attachments/assets/c2f4ac98-4868-4912-a47e-55f13bffcedb" /> | <img width="1512" height="945" alt="tokyo-cyberpunk-mono" src="https://github.com/user-attachments/assets/d8a51382-6f87-4fd1-bba4-cdc18e605065" />


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

### Local development

```bash
pnpm install
pnpm dev
```

Database is at `.data/share.db`.

### Production (Cloudflare Workers)

Use a D1 binding named `DB`.

```toml
[[d1_databases]]
binding = "DB"
database_name = "clonecn"
database_id = "<your-d1-database-id>"
```

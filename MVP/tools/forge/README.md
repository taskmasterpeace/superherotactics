# SHT Forge

The AI-native dev tool for SuperHero Tactics. One shared spine — **Contract → Generators → Learn → Bridge** — with pluggable content modules. **Module 1: Character** (prompt → rank-scale stats + 8-direction art + tuning defaults → saved roster).

Full design: [`docs/design/SHT_FORGE_PLAN.md`](../../../docs/design/SHT_FORGE_PLAN.md).

## Run it

```bash
cd MVP/tools/forge
node server.mjs          # → http://localhost:5174
```

Zero npm dependencies. With no config it runs **fully in mock mode**: the mock LLM writes contract-true characters (humans 1–39 / LSWs 40+, the LSW power rule, PSI=CON) and art uses the proven stand-in sprites — so the whole generate → refine → save loop works with **no keys**.

## Live generation

Copy `.env.example` → `.env.local` (gitignored) and set what you use:
- `LLM_PROVIDER=ollama` (+ `OLLAMA_URL`/`OLLAMA_MODEL`) — the local LAN box; or `anthropic` + `ANTHROPIC_API_KEY`.
- `PIXELLAB_API_KEY` — real 8-direction v3 tokens (rendered to `MVP/public/asset-lab/forge/<id>/`, served at `/game/asset-lab/forge/...`).

## What the UI does today (P1)

- **Forge** a character from a prompt (or **bulk**, one concept per line — bulk auto-saves).
- **Refine** everything inline: name, origin (LSW badge follows the 2–8 rule), role, faction, stats (rank-tier bars recolor live; PSI mirrors CON; health = MEL+AGL+STA+STR), powers, backstory.
- Contract violations from the LLM are auto-fixed and flagged (⚑ notes).
- **Save to roster** → `data/characters.json` (owner content, committed on purpose). Gallery loads any saved character back for editing.
- Tuning defaults (fps / emitter / sound per action) are attached to every record — the **tuner UI + live preview** is the next phase, then the **learning brain** (conventions) and the **bridge** (export into the game).

## API

`GET /api/health` · `GET /api/contract` · `GET /api/balance` · `POST /api/forge {prompt, provider?, art?}` · `POST /api/bulk {prompts[]}` · `GET|POST /api/characters` · `POST /api/characters/delete {id}` · static `/game/*` → `MVP/public/*`.

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

## What the UI does today (P1 + P3 tuner)

- **Forge** a character from a prompt (or **bulk**, one concept per line — bulk auto-saves).
- **Refine** everything inline: name, origin (LSW badge follows the 2–8 rule), role, faction, stats (rank-tier bars recolor live; PSI mirrors CON; health = MEL+AGL+STA+STR), powers, backstory.
- Contract violations from the LLM are auto-fixed and flagged (⚑ notes).
- **Save to roster** → `data/characters.json` (owner content, committed on purpose). Gallery loads any saved character back for editing.
- **Tune** any animation live: click a tuning chip → the tuner opens with a playing preview (real frames on mock stand-ins, token pulse otherwise). Controls: character default fps + per-animation fps, loop, **release frame** (when the emitter fires), **muzzle point** (sliders or click the stage), **emitter** (projectile count/speed · thin beam · big beam width · melee) with color, and a **sound picker** over the full 381-SFX catalog (`/api/sounds`) with instant playback. Every tweak writes into the record's `tuning` — Save persists it; that data is what the **learning brain** (P4, next) learns your taste from, then the **bridge** exports into the game.

## API

`GET /api/health` · `GET /api/contract` · `GET /api/balance` · `POST /api/forge {prompt, provider?, art?}` · `POST /api/bulk {prompts[]}` · `GET|POST /api/characters` · `POST /api/characters/delete {id}` · static `/game/*` → `MVP/public/*`.

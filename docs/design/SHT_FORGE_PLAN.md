# SHT Forge — the AI-native development tool for SuperHero Tactics

> **Status: APPROVED, saved for later. Priority 2.** Priority 1 is proving the asset pipeline can generate the game's building blocks (maps/tiles/props) to the target look (the owner's top-down tactical mockups), so we know the editor will have real material to work with. Build the editor after the map/asset look is validated.

## Context

Every content type in the game has the **same shape**: *AI generates it → the owner refines & tunes it → the tool captures the decisions → Claude learns the conventions → it exports into the live game.* So the right thing to build is the **ultimate dev tool**: a standalone, AI-native game editor where **characters, items, powers, maps, enemies, effects, and sound** are all "forge" modules on one shared spine. **Character is the first module**; the spine is designed so every other module plugs in.

There's currently **no authoring surface** — content is hand-coded or Claude-generated ad hoc; recruited characters show placeholder glyphs, combat FX are procedural placeholders. This tool becomes the place all content is made, tuned, and learned from.

## Modules (the "forges")

Standalone **zero-dependency Node** app at `MVP/tools/forge/` — built-in `http` server + a web UI with a module switcher. Runs on the owner's machine (`node server.mjs`), independent of Claude Code. Each module = **Generate (AI) → Refine → Tune → Preview → Export** on the shared spine.

| Module | Generates | Tunes / authors | Exports to |
|---|---|---|---|
| **Character** ⭐ (first) | stats (rank scale) + 8-dir art + P0 animations | powers, per-anim fps/release/muzzle, emitter, sound | roster + tokens + manifest + portrait + combat metadata |
| **Item** | weapon/armor/gadget/grenade stats + icon + sound | balance vs DBs, flammability, cost | weapons/armor/gadgets data |
| **Power** | effect (damage/status/buff/AoE/beam) + anim mapping | emitter, cost/cooldown, targeting; wires power dispatch | powers data + combat dispatch |
| **Map** | top-down tileset + props/cover | paint a map, terrain, spawns, multi-floor | map templates + tile assets |
| **Enemy / Faction** | enemy units + faction rosters | AI behavior tags, loadouts | enemy generation + factions |
| **Effect / FX** | emitter library | projectile sprites, procedural beams/cones/auras | shared FX config |
| **Sound** | text-to-SFX | assign/override library sounds | catalog + SoundManager |

## Shared spine (built once, every module uses it)

1. **The Contract** — one source for look + rules: style suffix (`MVP/scripts/asset-pipeline/style-contract.json`), the **rank scale** (`rankSystem.ts`: humans 1–39, LSW 40+, PSI=CON, health=MEL+AGL+STA+STR), **no purple**, default 6 fps.
2. **The Generators** — pluggable: **LLM** (local **Ollama** `192.168.1.217:11434 qwen3.5` default, **Anthropic** option, **mock** for keyless tests), **PixelLab REST v2** (art), **text-to-SFX**.
3. **The Learning Brain** — every tune decision captured (`data/<module>.json`) and folded into rolling **`data/conventions.json`**; new content pre-fills from learned defaults; Claude reads it later to bulk-produce to the owner's taste; regenerates **`docs/design/FORGE_CONVENTIONS.md`**.
4. **The Bridge** — exports into live game data + assets via seams that already auto-load (`generated-manifest.json` + `PreloadScene.loadGeneratedRoster()`, `portrait.url` → `CharacterPortrait`, the data DBs). Preview == in-game.
5. **The Shell** — web UI: module switcher, generate bar, entity card, tuner panel, saved-gallery, balance readout, bulk lane. Zero npm deps.
6. **Bulk / headless** — same spine callable by Claude to mass-produce to learned conventions.

## Module 1 — Character Forge (first slice)

### Character record (`tuning` is what Claude learns from)
```json
{ "id","name","realName","origin":1-9,"isLSW","role","faction",
  "stats": {"MEL","AGL","STR","STA","INT","INS","CON"},
  "powers": [...], "backstory", "artDescription",
  "art": { "tokens": {"S":"...png",...}, "animations": {"cast":{...},...} },
  "tuning": { "fps": 6, "animations": {
    "ranged": {"fps":8,"releaseFrame":3,"muzzle":{"x":0.62,"y":0.45},
               "emitter":{"type":"projectile","sprite":"bolt","color":"#ffd24a","speed":320},"sound":"combat.gunshot_rifle"},
    "cast":   {"fps":6,"releaseFrame":"last","muzzle":{"x":0.5,"y":0.42},
               "emitter":{"type":"beam_big","color":"#38f0ff","width":0.6,"area":true},"sound":"powers.energy_beam"},
    "eyebeam":{"fps":6,"releaseFrame":2,"muzzle":{"x":0.5,"y":0.30},
               "emitter":{"type":"beam_thin","color":"#ff3b3b","pierce":true},"sound":"powers.laser_fire"},
    "melee":  {"fps":6,"emitter":{"type":"none"},"sound":"combat.impact_punch"},
    "idle":   {"fps":4,"loop":true} } } }
```

### Generate → Refine → Tune (workspace, not one-shot)
Generate from a prompt or by hand; re-roll a single part; refine stats/name/powers/backstory (validated to the origin band); per-attack **tuner** (reuses `MVP/public/asset-lab/grid-mockup.html`) with **live preview**: fps (character default + per-anim override), release frame (clamps past clip length), draggable muzzle, emitter type + tunables, sound.

### Emitters (procedural where possible)
`projectile` (sprite + tween, arc for grenade) · `beam_thin` (procedural line, pierces — heat-vision/laser) · `beam_big` (procedural thick gradient beam/cone + particles, area — Kamehameha/Human-Torch) · `cone` (particles) · `aura` (radial) · `none`. Only projectile bodies are generated sprites.

### Sound
Per-animation `sound` from the shared library (`SoundManager.ts` + `sounds/catalog.json`), per-character override + "generate SFX from prompt".

## Files
**Spine:** `server.mjs`, `lib/contract.mjs`, `lib/generators/{llm,pixellab,sfx}.mjs` (`pixellab.mjs` client already drafted), `lib/learn.mjs`, `lib/bridge.mjs`, `lib/effects.mjs`, `lib/sound.mjs`, `public/index.html`+`public/app.js`. **Character module:** `modules/character.mjs` + UI panel. Plus `package.json`, `.env.example`, `README.md`.

## Reuse
`STYLE_SUFFIX`/style-contract; P0 list + fps-override from `action-set.json`; `magick -trim +repage` + union-crop from `import-roster.mjs`; grid-mockup tuner; `generated-manifest.json` + `PreloadScene.loadGeneratedRoster()`; `CharacterPortrait.portrait.url`; `rankSystem.ts`; `SoundManager.ts` + catalog; weapon/armor/gadget DBs for the Item module.

## Mock / test (no keys)
`LLM=mock` + `PIXELLAB=mock` → deterministic character + reuse existing test sprites + anim frames so the full generate→refine→tune→save→learn loop runs keyless.

## Verification
Mock end-to-end (card + tuner + save + conventions), learning (defaults pre-fill), live (Ollama + PixelLab + balance), export (character in-game with tuning metadata).

## Build order (phased)
1. Spine + Character in mock. 2. Real generation. 3. Tuner + effects + sound. 4. Learning + bridge. 5. Next modules (Item → Power → Effect/Sound → Map → Enemy/Faction).

## Keys (never committed)
`MVP/tools/forge/.env.local` (gitignored): `PIXELLAB_API_KEY`, `LLM_PROVIDER`, `OLLAMA_URL`, `OLLAMA_MODEL`, `ANTHROPIC_API_KEY`.

# SHT Asset Pipeline

A **system** for turning any character concept into consistent, game-ready art — so every operative we bring in looks like it belongs in the same game, for the fewest generations.

## The idea (why this exists)

You don't want to hand-art 200 characters, and you don't want a roster that looks like it came from five different games. So we lock the *look* once (the **style contract**) and treat each character as one line of creative input (a description). Everything downstream is deterministic.

```
 roster.json            style-contract.json            generated-manifest.json
 (who: descriptions)  +  (the look: locked once)   →   (game-ready tokens, auto-loaded)
        │                        │                              ▲
        └──────► PixelLab v3 (8 true rotations) ──► import-roster.mjs (trim+resize) ┘
```

Three files you touch, one you never do:
- **`roster.json`** — the cast. Add `{id, name, faction, description}`. The description is the *only* thing you write per character.
- **`style-contract.json`** — the look. Edit once when the *whole game's* aesthetic should shift; otherwise leave it. This one file is ~90% of why the roster stays cohesive.
- **`import-roster.mjs`** — the deterministic normalizer (run it; don't edit).
- `generated-manifest.json` — output; the game reads it. Never hand-edit.

## Consistency — the thing you actually asked for

Every generation inherits, verbatim:
- **mode `v3`** (native pixel art that matches our existing tokens — standard mode drifts stylized/realistic across a roster; v3 doesn't),
- **`low top-down`** view (the isometric-grid angle),
- **8 true rotations** (not mirrored — gear stays in the correct hand; **West faces left, East faces right**),
- a fixed **style suffix**: *"gritty modern superhero-tactics game operative, muted realistic palette, clear readable silhouette…"* appended to every description,
- normalize to a fixed **166px token height** (matches the current `sprite_XX.png`).

Same knobs + same suffix + same normalize = a roster that reads as one game, no matter who writes the descriptions. For hard palette lock across a single character's poses/animations, use PixelLab `create_character_state(use_color_palette_from_reference: true)`.

## Bang for the buck

| Asset | Cost | Notes |
|---|---|---|
| Full character, 8 true directions (v3) | **~3 generations** | the whole facing set, one call |
| One animation (walk/attack/**fireball**/**flying-kick**) | 1 gen **per direction** | animate only the directions/actions a unit actually shows |
| Palette-locked pose/variant (`create_character_state`) | 1–3 gens | flying, firing, armor swap — stays on-model |
| Isometric tile / top-down tileset | ~1 gen | maps share the contract |

With ~1,600 generations left that's **~500 full 8-direction characters**, or a smaller cast with rich animation. Rules of thumb: v3 for anything the player sees up close; animate the *4 cardinal* facings first (diagonals read fine from cardinals in motion); only animate actions a unit performs.

## How to run it

Generation happens two ways — both use the **same contract**:

1. **Live via Claude/MCP (now):** tell Claude "add a character: <description>". Claude runs PixelLab v3 with the contract, drops the 8 rotations into `public/asset-lab/sprites/<prefix>_<dir>.png`, adds the roster entry, and runs the importer.
2. **Standalone (CI / without Claude):** a `generate.mjs` against the PixelLab REST API (`https://api.pixellab.ai/v2`, `Authorization: Bearer $PIXELLAB_API_KEY`, `POST /v2/create-character-with-8-directions`). Key lives in `MVP/.env.local` (gitignored) — **never committed**.

Then, always:
```bash
cd MVP
node scripts/asset-pipeline/import-roster.mjs   # needs ImageMagick `magick` on PATH
```
Output: `public/assets/character_token/generated/<id>/{S,SE,E,NE,N,NW,W,SW}.png` + `generated-manifest.json`.

## In-game (auto-loads, zero code change)

`PreloadScene` reads `generated-manifest.json` and registers every character:
- `gen_<id>` → default South token (billboard use, like the current soldier tokens),
- `gen_<id>_<DIR>` → the 8-way facing (for real in-combat facing once the renderer picks direction from movement).

Add a character → import → it's available in the engine. No edits to the loader.

## Extends to objects & inventory (later)

Same contract, same discipline. `style-contract.json` already carries `tiles` and `objects` blocks: PixelLab `create_isometric_tile` / `create_topdown_tileset` for maps, and `create_map_object` / `create_8_direction_object` for gadgets, weapons, vehicles, and inventory icons — all sharing the palette suffix so items match the world. When we get to inventory, this is where it plugs in.

## Preview

`public/asset-lab/roster-preview.html` — open it in a browser (or the dev server at `/asset-lab/roster-preview.html`) to see the current roster across all 8 facings.

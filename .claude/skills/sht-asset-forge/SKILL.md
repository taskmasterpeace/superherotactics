---
name: sht-asset-forge
description: Generate consistent, game-ready SHT pixel art with PixelLab (MCP) — characters (8 true directions + animations), map tiles/props, and combat FX — all to one locked style contract. Use when asked to make/add a character, hero, enemy, token, animation, tile, map, prop, projectile, or FX for SuperHero Tactics.
---

# SHT Asset Forge

The pipeline that turns any character/map/FX concept into cohesive, in-game-ready pixel art. **Decided head-to-head: PixelLab, not AutoSprite** (AutoSprite is HD-flat, mirrors directions, no iso tiles). PixelLab MCP is authenticated in-session — you are the generation engine.

**Read these first:** style contract [`MVP/scripts/asset-pipeline/style-contract.json`], action set [`MVP/scripts/asset-pipeline/action-set.json`], design spec [`docs/design/ASSET_ANIMATION_SYSTEM.md`], pipeline README [`MVP/scripts/asset-pipeline/README.md`].

## The invariant: the style contract
Every character generation uses the SAME knobs so the roster looks like one game: `mode:"v3"`, `view:"low top-down"`, `size:128`, `n_directions:8`, and the fixed style suffix appended to every description ("gritty modern superhero-tactics game operative, muted realistic palette, clear readable silhouette, plain transparent background"). NO PURPLE. Never vary these per character — only the character's own description changes.

## Make a CHARACTER (8 true directions)
1. `create_character({ description: "<their look>, <contract stylePrompt>", mode:"v3", view:"low top-down", size:128 })` → id. ~3 gens, ~3–8 min.
2. Poll `get_character(id)` until `status: completed`; it returns 8 rotation URLs (south/east/north/west + diagonals).
3. Download all 8 to `MVP/public/asset-lab/sprites/<prefix>_<direction>.png` (plain curl, backblaze URLs).
4. Add the entry to `roster.json` (`id`, `name`, `faction`, `description`, `rawPrefix`), then run `node scripts/asset-pipeline/import-roster.mjs` → normalized tokens + `generated-manifest.json`. The game auto-loads `gen_<id>` + `gen_<id>_<DIR>` (no code change).

## Give a character ACTIONS (animations)
Drive from `action-set.json`. `animate_character(id, template_animation_id | action_description, directions:[...])` — **1 gen per direction**. Follow the directional rule: 8-dir idle/move, **4-dir aimed attacks (throw/ranged/cast/melee)**, 1-dir hit/death. P0 set = idle, move, ranged, throw, melee, cast, take_hit, death. Templates exist for most (`throw-object`, `fireball`, `cross-punch`, `walking-6-frames`, `taking-punch`, `falling-back-death`, `breathing-idle`); use custom `action_description` only for superhero motion (fly, beam, teleport). For same-character pose variants that must stay on-model, use `create_character_state(..., use_color_palette_from_reference:true)`.

## Make MAP assets
- Ground: `create_topdown_tileset(lower, upper, view:"high top-down", tile_size:32)` — 16-tile Wang autotiling, one call textures the whole floor. Chain `base_tile_ids` for seamless terrain transitions. (Use **top-down**, not iso, per the flat-grid decision.)
- Props / cover / walls / doors / vehicles: `create_map_object(description, view:"high top-down")` — pass `background_image` (a map tile) to STYLE-MATCH so props sit in the world; `create_8_direction_object` for things that rotate (vehicles).
- Minimal P0 map = 1 tileset + ~3 objects.

## Make PROJECTILES / FX
Sprite what travels or reads as a hit; keep particles for trails/blood/smoke. `create_1_direction_object` for bullet/plasma/rocket/bolt/muzzle/impact (16–32px). Demo pack ≈ 13 sprites. Integrate drop-in with fallback: `textures.exists(key) ? add.sprite(...) : add.circle(...)`.

## Bang-for-buck rules
1. Reuse a PixelLab template before writing a custom prompt (≥80%). 2. 4-dir attacks before 8. 3. 1-dir reactions/death. 4. Autotiling tileset over per-tile. 5. Sprite only what moves/hits. 6. **Prove one vertical slice in-engine before batching the roster.** Budget: full character = ~3 gens art + ~10–14 anim; first slice (1 char + 1 map + FX) ≈ 15–20 jobs. ~1,600 gens in the account.

## Show the owner (CRITICAL)
The owner does NOT see chat images or claude.ai Artifacts. Deliver visuals into the repo: sprites under `MVP/public/asset-lab/`, and a browsable page (`roster-preview.html`) he opens via file:// or the dev server `/asset-lab/...`. Regenerate the preview with `scripts/asset-pipeline` builders. Screenshots you take are for YOUR QA only.

## Quadrupeds & non-humanoids
`create_character(body_type:"quadruped", template:"dog"|"cat"|"horse"|"bear"|"lion")` for K9/creature units; `isHumanoid:false` equivalents for drones/vehicles.

## Keys / secrets
PixelLab REST is `https://api.pixellab.ai/v2` (Bearer). AutoSprite is `https://www.autosprite.io/api/v1` + `/api/mcp`. Keys live in `MVP/.env.local` (gitignored) — NEVER commit or echo them. In-session, use the MCP (already authed).

Grid must be flat top-down for 8-dir facing to render (see spec §2). If facing still 2-way, that refactor isn't done yet.

# SHT Asset Pipeline — Challenges & Known Issues

Running log of the real problems in the PixelLab asset pipeline, why they happen, and the fix. Surfaced during the first character/animation/grid tests (2026-07-04). Paired with `ASSET_ANIMATION_SYSTEM.md`.

## 1. Sprite baseline / "levitation" (shadow floats below the feet)
**Symptom:** in the roster + animation previews, characters looked levitated — the ground shadow sat well below their feet.
**Cause:** PixelLab renders on a canvas ~40% larger than the character (room for animation), so there's **~26% transparent padding below the feet** (measured: feet at ~73% down a 244–248px canvas). A shadow placed at the box bottom is ~26% below the actual feet.
**Fix (done):** trim to the character. `import-roster.mjs` already trims the rotation tokens (feet at bottom) — the grid mockup uses those and looks grounded. Animation frames are now **union-cropped** across their frames (shared bbox → feet at bottom, no jitter). Roster preview switched to the trimmed tokens.
**Rule:** always display/place the **trimmed** art, never the raw padded canvas. In-engine, anchor sprites by **feet (bottom-center)**, not image center.

## 2. Idle token ↔ animation frame anchor mismatch (the big one)
**Symptom:** swapping a unit's idle token for an attack-animation frame can shift its size/position (arms extend → the animation's bounding box is wider/taller than the idle token's).
**Cause:** the idle rotation and the animation are trimmed to **different** bounding boxes. Bottom-anchoring keeps the feet planted, but the character can appear to grow/shift when the clip starts.
**Fix:** give every clip a **shared anchor** = the feet point (bottom-center) and a consistent nominal height, so idle and all actions register to the same baseline. Store the anchor in the manifest per character. This is the #1 production detail to get right before scaling the roster.

## 3. Projectile / muzzle origin (attacks came from the feet)
**Symptom:** in the grid mockup, projectiles launched from the tile center = the character's feet.
**Cause:** tile center is the unit's ground position; the weapon/hands are higher up.
**Fix (mockup):** raise the origin to ~55% of a tile (torso). **Real fix:** each attack animation has a "fire frame" and a muzzle point — spawn the projectile from that frame/offset, not a constant. Tie projectile spawn to the animation's release frame.

## 4. Per-direction animation cost (why the grid isn't fully animated)
**Reality:** `animate_character` bills **1 generation per direction**. A full action in 8 directions = 8 gens; 8 P0 actions × 8 dirs × N characters explodes fast.
**Answer to "why static tokens in the grid?":** we only generated attacks in **2 directions** (Surge blast S+E, merc throw S) as a proof. The grid now plays the real clip when the unit faces a direction we generated, and says "static token — not generated for <dir> yet" otherwise.
**Mitigation (baked into `action-set.json`):** 8-dir only for idle/move/fly; **4-dir for aimed attacks** (throw/ranged/cast/melee); **1-dir for hit/death**. Firing on a diagonal falls back to the nearest cardinal clip (acceptable) until we choose to generate 8-dir attacks. Generate a character's action set as a known batch (~10–14 gens) and prove it before batching the roster.

## 5. Animation timing & loop metadata
**Gap:** the engine needs to know per action: loops or one-shot, fps, and which frame "fires" (spawns projectile / applies damage). `action-set.json` carries `loop`; still needs **fps** + **triggerFrame** per action.
**Fix:** extend the manifest so each imported animation records frameCount, fps, loop, and triggerFrame.

## 6. Generation variance / palette drift
**Reality:** v3 re-rolls vary slightly run-to-run; a character's own pose/variant set can drift in color.
**Fix:** for a single character's variants/states use `create_character_state(use_color_palette_from_reference: true)`. For roster-wide cohesion, the locked style contract (same knobs + suffix) is the lever. Re-rolls are cheap — reject a weak asset rather than ship it.

## 7. Diagonal facing vs 4-dir attacks
**Tension:** movement/idle are 8-dir but attacks are 4-dir (cost). A unit standing on a diagonal facing then attacking will snap to a cardinal clip for the attack.
**Decision:** acceptable for launch; upgrade specific hero attacks to 8-dir only if the snap reads wrong in-engine.

---
**Status:** #1, #3, #4 addressed in the mockups/pipeline; #2, #5 are the must-solve items before the grid refactor + vertical slice; #6, #7 are policy, handled by the contract + action-set.

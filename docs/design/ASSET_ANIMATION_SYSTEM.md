# SHT Asset & Animation System — Director's Spec

**What this is:** the finite, engine-grounded set of character animations, map tiles, and combat FX that PixelLab generates, plus the one grid refactor that makes 8-direction sprites and straight projectiles "just work." Machine-readable action list: [`MVP/scripts/asset-pipeline/action-set.json`](../../MVP/scripts/asset-pipeline/action-set.json). Pipeline: [`MVP/scripts/asset-pipeline/`](../../MVP/scripts/asset-pipeline/README.md). Skill: `sht-asset-forge`.

**Thesis:** switch the combat renderer from isometric to **flat top-down** (~40-line change, 2 files), then generate a **P0 vertical slice** — one fully-actioned character + one urban map + a small FX pack — and prove it in-engine before scaling. The pipeline already generates "low top-down" sprites and `PreloadScene` already loads 8 directions; today only the renderer disagrees.

---

## 1. The Action Vocabulary (the core — what we generate)

Every animation maps to a real trigger in `CombatScene.ts`/`EventBridge.ts`; every trigger maps to a PixelLab template (reused ≥80% of the time) or a justified custom prompt. This list is what tells us WHAT to generate and what the engine selects at runtime.

| # | Action | PixelLab template / **custom** | Dirs | Prio | In-engine trigger |
|---|--------|-------------------------------|------|------|-------------------|
| 1 | Idle / breathing | `breathing-idle` | 8 | **P0** | turn-start / stance render |
| 2 | Move (walk/sprint) | `walking-6-frames` / `running-8-frames` | 8 | **P0** | `tryMoveUnit` ~7923 |
| 3 | Ranged attack | **custom** "aim & fire" | 4→8 | **P0** | `tryAttackUnit` ~3927 |
| 4 | Throw grenade | `throw-object` | 4 | **P0** | `start-grenade-throw` ~1695 |
| 5 | Melee strike | `cross-punch` / `roundhouse-kick` | 4→8 | **P0** | `tryMeleeAttack` ~4740 |
| 6 | Cast power (beam/blast) | `fireball` / **custom** beam | 4→8 | **P0** | `activate-power` ~1656 |
| 7 | Take damage | `taking-punch` | 1–2 | **P0** | `applyDamage` ~5034 |
| 8 | Death / fall | `falling-back-death` (one-shot) | 1 | **P0** | HP≤0 ~6300 |
| 9 | Fly / hover | **custom** hover+move | 8 | P1 | flight/altitude state |
| 10 | Teleport flash | **custom** fade→spark | 1 | P1 | `teleportUnit` ~6341 |
| 11 | Grapple / clinch | `fight-stance-idle` + **custom** | 1 | P1 | clinch init ~4845 |
| 12 | Martial-arts technique | `cross-punch`→`leg-sweep`→`flying-kick` | 4→8 | P1 | `MartialArtsSystem` 69-140 |
| 13 | Knockback / knockdown | `falling-back-death` (short) | 1–2 | P1 | knockback ≥3 tiles ~6209 |
| 14 | Overwatch / stance idle | `crouching` | 8 | P1 | `setActionMode` ~1539 |
| 15 | Get up (from prone) | `getting-up` | 1–2 | P2 | prone cleared ~4499 |
| 16 | Heal / support aura | **custom** aura | 4 | P2 | `heal` power ~810 |
| 17 | Reload | **custom** reload | 1–2 | P2 | `use-item` ~186 |
| 18 | Phase / super-speed | **custom** fade/blur | 8 | P2 | `phase`/`superSpeed` powers |

**Directional rule of thumb:** 8-dir for anything the eye tracks continuously (idle, move, fly, stance); **4-dir for aimed one-shots** (ranged, throw, cast, heal) — upgrade to 8 only if diagonals read wrong; 1–2 dir for reactions/death/get-up. **Ship attacks at 4-dir first.**

**Power → animation class** (so new powers reuse art): *Beam* = directed arm/eye glow; *Blast/zone* = radial arms-up (`fireball`); *Self* (teleport/phase/invis) = unit-centered shimmer; *Aura* (heal/inspire) = in-place gesture.

---

## 2. Grid Decision — SWITCH TO FLAT TOP-DOWN

**Recommendation: flat top-down. Effort = SMALL (~40 lines, 2 files, zero new deps, near-zero risk).**

The renderer is isometric (`config.ts`: `gridToScreen = (gx-gy)*64, (gx+gy)*32`; depth = `gx+gy`), but the pipeline generates **"low top-down"** sprites and `PreloadScene` already loads all 8 directions (`gen_<id>_<DIR>`). Combat ignores them — `CombatScene.ts:2775` only does `setFlipX` (2-direction). Keeping iso means isometric-rotation frame mapping **and** per-direction projectile arc math (LARGE, z-fighting risk with animated 8-dir art). Flat top-down deletes both: painter's-algorithm Y-sort is bulletproof and projectiles are straight-line tweens that already work. Standard for pixel-art tactics (Fire Emblem, Tactics Ogre, Valkyria Chronicles).

| File | Change | ~Lines |
|------|--------|--------|
| `game/config.ts` TILE_WIDTH/HEIGHT | square 64×64 | 2 |
| `config.ts` `gridToScreen` / `screenToGrid` | `x=gx*TILE; y=gy*TILE` | ~8 |
| `config.ts` `getIsoDepth` | `return screenY` (painter's) | 2 |
| `CombatScene.ts:2773-2775` | 8-dir texture swap (below), drop `setFlipX` | ~10 |
| `CombatScene.ts` tile draw | diamond path → `fillRect()` | ~6 |
| projectiles / PreloadScene | **no change** | 0 |

```ts
// facing → sprite (replaces setFlipX)
const dirs = ['S','SW','W','NW','N','NE','E','SE'];
const key = `gen_${unit.id}_${dirs[Math.round(unit.facing / 45) % 8]}`;
if (this.textures.exists(key)) unit.sprite.setTexture(key);
```

---

## 3. Map Assets — one playable urban map

Engine defines 10 terrain types (FLOOR, GRASS, CONCRETE, WATER, WALL, LOW_WALL, DOOR_CLOSED/OPEN, BREAKABLE_WALL, RUBBLE), currently flat-color polygons (functional, zero art). Minimal cohesive urban set:

| Asset | Terrain | PixelLab tool | Prio |
|-------|---------|---------------|------|
| Concrete/asphalt ground (2–3 variants, autotiled) | FLOOR/CONCRETE | **`create_topdown_tileset`** (1 call) | P0 |
| Brick/steel wall (sides+corners) | WALL | `create_map_object` | P0 |
| Waist-high cover (railing / meter box / crate) | LOW_WALL | `create_map_object` ×1–2 | P0 |
| Door (closed↔open) | DOOR_* | `create_map_object` | P0 |
| Rubble scatter | RUBBLE | tileset variant | P1 |
| Manhole / dumpster / street furniture | hazard/cover/decor | `create_map_object` | P1–P2 |

Use **top-down** tiles (not isometric) to match the flat grid. **P0 map = 1 tileset + ~3 objects = 4 calls → textured, playable.**

---

## 4. Projectiles & FX — sprite vs particle

All FX are procedural today (Phaser graphics + tweens + particles). Rule: **sprite what travels or reads as a hit; keep particles for trails/impact/blood/smoke.**

| Effect | Sprite or particle |
|--------|-------------------|
| Projectile body (bullet/plasma/rocket/bolt) | **Sprite** (`create_1_direction_object`) |
| Trail | Particle (keep) |
| Muzzle flash | **Sprite** (scale-fade) |
| Impact flash / explosion | **Sprite** + particle burst |
| Beam core+glow | Sprite (stretched) or graphics |
| Spark / blood / fire / smoke | Particle (keep) |

**Demo FX pack (~13 sprites, 16–32px):** 5 projectiles · 3 muzzle flashes · 3 impacts · 2 beam parts. Drop-in with fallback (no refactor): `textures.exists(key) ? add.sprite(...) : add.circle(...)`.

---

## 5. Generation plan & budget

**Order (grid refactor FIRST — free, everything downstream assumes it):**
1. Grid refactor (§2) — code only.
2. Vertical slice, 1 character: P0 actions (#1–8). Move/idle 8-dir, attacks/throw/cast 4-dir, hit/death 1-dir.
3. Vertical slice, 1 map: §3 P0 (1 tileset + 3 objects).
4. Vertical slice, FX: §4 demo pack.
5. **Verify in-engine, refine, THEN scale.**

| Bucket | Est. PixelLab jobs |
|--------|--------------------|
| Character P0 (8 actions, mixed dirs) | ~10–14 |
| Map P0 | ~4 |
| FX pack | ~1–2 |
| **First slice** | **~15–20** |

Scaling: +1 character (same action set) ≈ 10–14 jobs (a known, repeatable batch — the subagent's unit of work). +P1 hero actions ≈ 6–8. +1 map (same theme) ≈ 2–4. With ~1,600 gens, the whole first slice is a rounding error.

**Bang-for-buck rules (baked into the skill):** reuse templates before custom; 4-dir attacks before 8; 1-dir reactions; autotiling tilesets over per-tile; sprite only what moves/hits; **prove the slice before batching the roster.**

---

## 6. Decisions — APPROVED (owner sign-off 2026-07-04)

| # | Decision | Call |
|---|----------|------|
| 1 | Grid | ✅ **Flat top-down** (~40 lines; see mockup `MVP/public/asset-lab/grid-mockup.html`) |
| 2 | Character sprite size | ✅ 48–64px on 64px tiles |
| 3 | Attack directions | ✅ 4-dir attacks / 8-dir move+idle |
| 4 | First hero P1 actions | ✅ **Fly + teleport**. **Flight is REQUIRED dual-mode: `fly_hover` + `fly_move` (forward) both exist for any flying unit** (owner). |
| 5 | Map theme | ✅ Modern plaza + alleys, concrete/steel, daytime |
| 6 | FX pack | ✅ ~13-sprite demo pack; particles stay procedural |
| 7 | Verify-before-scale | ✅ Yes — one char + one map + FX proven in-engine before roster |

**Front-end is intentionally swappable.** The asset layer is renderer-agnostic: `generated-manifest.json` + tokens/animations feed the current Phaser 2D scene, but could just as well feed a future **three.js / low-poly** front end without regenerating art (and AutoSprite's 3D-model export is a bridge if we go that way). Flat top-down maps cleanly onto a future top-down 3D camera too. So the flat-grid decision is low-commitment — the game's depth lives in the systems, not the renderer.

**Grid-switch status:** designed + mocked, NOT yet implemented in `CombatScene`. Next build = flip the grid + one full vertical slice (Surge fully actioned on a textured map with projectiles).

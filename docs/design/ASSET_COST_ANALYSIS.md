# SHT Asset Cost Analysis

Interactive version: `MVP/public/asset-lab/cost-calculator.html`. Bottom line up front: **money is not the constraint** — a full launch roster fits inside one month of the plan you already pay for. The real costs are generation *time* (batchable) and *engine wiring*.

## The unit: a "generation" — and the template/custom split (important)
PixelLab bills in **generations**. Your plan = **~2,000/month** (Tier 1, ~$9–22/mo); overflow = credits (~$1/gen). Inside the allowance, marginal cost per character ≈ **$0**.
- 8-direction token (v3 art): **3 gens**
- **Template animation** (the 49 presets: walk, run, punch, kick, throw-object, fireball, taking-punch, falling-back-death, crouch, get-up…): **1 gen / direction** — cheap.
- **Custom animation** (anything not a preset — **gun-fire, energy beams, flight, teleport**): **~1 gen per FRAME per direction** (frames usually 8) → **~8 gens/direction**. *Measured live: a custom rifle-fire in 2 directions cost 16 gens.*

**This is the #1 cost lever.** Reuse a template whenever possible; for the unavoidable customs (guns/beams/flight), keep them to **few directions and fewer frames** (a 4-frame custom = 4 gens/dir vs 8).

## Cost per animation
| Animation | Gens |
|-----------|------|
| Template action, 4-dir (throw/melee/cast) | **4** |
| Template action, 8-dir (idle/walk) | **8** |
| Template, 1-dir (hit/death) | **1** |
| **Custom action (gun-fire/beam), 4-dir × 8 frames** | **32** |
| Custom, 4-dir × 4 frames (cheaper) | 16 |

## Cost per character (three depths)
| Depth | What's animated | Gens (incl. 3 art) |
|-------|-----------------|--------------------|
| **MVP** (all template) | idle(4) · walk(4) · melee/throw(4) · death(1) | **~16** |
| **Full P0** | idle(8)·walk(8) template + throw/melee/cast(4) template + hit/death(1) + **ranged gun-fire (custom 4-dir×8f = 32)** | **~65** |
| **Rich** | Full P0 + overwatch(8, template) + **fly-hover/fly-forward/teleport (custom)** | **~145** (or ~93 with 4-frame customs) |

The single custom action (gun-fire) is ~half a Full-P0 character's cost. A **melee/thrown-only** unit (no gun, no powers) skips it → **~33 gens**. Flight is the expensive tier (two more customs).

## ⭐ The facing model is the biggest lever (owner idea)
Sprites only need to face **East/West** — West is a **free horizontal mirror** of East. True 8-way facing is shown by a **ground vision cone** (Project-Zomboid style), not the sprite; projectiles fly the true angle regardless of body facing. Prototype: `asset-lab/facing-cone.html`. This collapses direction count to **1 generated direction per animation**:

| Facing model | Full-P0 gens/char | 30-hero roster |
|--------------|-------------------|----------------|
| 8-way (unique renders) | ~65 | 1,950 (~1 mo) |
| 4-way | ~57 | 1,710 |
| **2-way E/W + mirror ⭐** | **~18** (14 with 4-frame customs) | **~420–540** |

**~72% cheaper**, and it *improves* tactical readability (the cone shows an enemy facing away — you couldn't tell that from a sprite anyway). This is the recommended system. Tradeoff: no unique front/back/¾ art — acceptable, the cone + pip carry facing.

## "Can we duplicate the work cheaper?" (slicing)
- **Mirror (E/W)** — the #1 free win, now the plan.
- **Templates are skeleton-based** — the same preset applied to any character is cheap (1 gen/dir) and consistent; we already lean on them.
- **Pose + procedural FX** — for some customs (muzzle flash, recoil), generate ONE firing pose + add flash/shake in code instead of a full 8-frame custom. Cuts a custom to ~1 gen.
- **Full cutout rigging** (slice a character into limbs + re-rig, Spine-style) — powerful but PixelLab returns flat frames, not rigged parts, so this needs a whole rig pipeline. **Overkill vs mirror + templates + the cone. Not recommended now.**

Verdict: **the way we're doing it is good** — generate to the style contract, lean on templates, mirror E/W, cone for facing, procedural for the cheap FX. Reserve real generation budget for the few customs that matter (signature powers, flight).

## Roster math (against 2,000 gens/month)
| Roster | MVP (~16) | Full P0 (~65) | Rich (~145) |
|--------|-----------|---------------|-------------|
| 10 | 160 | 650 | 1,450 |
| 30 | 480 | 1,950 (~1 mo) | 4,350 (~2 mo) |
| 50 | 800 | 3,250 (~1.6 mo) | 7,250 (~3.6 mo) |

Your plan ≈ **125 MVP / ~30 Full-P0 / ~14 Rich** characters per month. A launch roster of **20–30 fully-animated** heroes = **~1 month, in-budget**. Still cheap — but customs (guns/beams/flight) are where the gens go, so pick them deliberately.

## Maps & FX
- Map: 1 top-down tileset + ~3 style-matched props = **~4 gens/map** (theme's tileset reuses across many maps).
- FX pack (bullets/beams/impacts/muzzle) = **~13 sprites ≈ 1–2 gens.**

## Time cost (the real one)
~5 min/gen, 8 running concurrently. Full-P0 character ≈ **25–40 min** wall-clock (batched); a 30-char Full-P0 roster ≈ **~12 hours** of generation — unattended/overnight. This is the practical throttle, not dollars.

## "Can we make a game from this? How far from a real (v2) game?"
**Art-wise: yes, comfortably.** The pipeline is built, the style is locked, and a full animated roster costs one subscription-month. The distance to a real game is **engine work, not asset cost**:
1. Grid → flat top-down refactor (~40 lines, designed).
2. Wire animations into combat with a **shared feet-anchor + fps/triggerFrame metadata** (challenges #2/#5) — the must-solve before scaling.
3. Fine-tune projectile **muzzle origin** per attack (challenge #3) + **flight (hover + forward)**.
4. The combat gaps from the earlier analysis (power dispatch, etc.).

Sequence: build the **vertical slice** (1 character fully actioned on 1 map with real projectiles, proven in-engine), lock the anchor/timing systems, then batch the roster. Playback locked at **6 fps** (owner).

## Character generation (not a "character creator")
Direction: replace the old manual character-creator UI with a **character generation system** — one description → stats (`characterGeneration.ts`, rank scale) + 8-direction art + the P0 action set, all to the style contract. The `pixel-asset-forge` agent already does the art half; unifying it with stat-gen is the next system. See `ASSET_ANIMATION_SYSTEM.md`.

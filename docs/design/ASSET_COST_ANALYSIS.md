# SHT Asset Cost Analysis

Interactive version: `MVP/public/asset-lab/cost-calculator.html`. Bottom line up front: **money is not the constraint** — a full launch roster fits inside one month of the plan you already pay for. The real costs are generation *time* (batchable) and *engine wiring*.

## The unit: a "generation"
PixelLab bills in **generations**. Your plan = **~2,000 generations/month** (Tier 1, ~$9–22/mo). Overflow = credits (~$1/gen). So **inside the monthly allowance, the marginal cost of a character is effectively $0.**
- 8-direction character token (v3 art): **3 gens**
- One animation = **1 gen per direction**

## Cost per animation
| Action | Directions | Gens |
|--------|-----------|------|
| One aimed attack (ranged/throw/melee/cast) | 4 (cardinal) | **4** |
| Same attack, 8-dir | 8 | 8 |
| Idle / walk | 8 | 8 |
| Take-hit / death | 1 | 1 |

A single "shoot his gun, all four cardinal directions" = **4 generations** ≈ pennies.

## Cost per character (three depths)
| Depth | What's animated | Gens (incl. 3 art) |
|-------|-----------------|--------------------|
| **MVP** | idle(4) · walk(4) · ranged(4) · death(1) | **~16** |
| **Full P0** | idle(8) · walk(8) · ranged/throw/melee/cast(4 ea) · hit(1) · death(1) | **~37** |
| **Rich** | Full P0 + fly-hover(8) · fly-forward(8) · teleport(1) · overwatch(8) | **~62** |

## Roster math (against 2,000 gens/month)
| Roster | MVP (~16) | Full P0 (~37) | Rich (~62) |
|--------|-----------|---------------|-----------|
| 10 | 160 | 370 | 620 |
| 30 | 480 | 1,110 | 1,860 |
| 50 | 800 | 1,850 | 3,100 (~1.5 mo) |
| 100 | 1,600 | 3,700 (~2 mo) | 6,200 (~3 mo) |

Your monthly plan ≈ **125 MVP / 54 Full-P0 / 32 Rich** characters. A realistic launch roster (20–40 fully-animated) = **one month, in-budget.**

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

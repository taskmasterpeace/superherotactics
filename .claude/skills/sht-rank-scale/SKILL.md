---
name: sht-rank-scale
description: The canonical 1-5000 rank scale for SuperHero Tactics stats. Use whenever writing or reviewing code that reads a primary stat (MEL/AGL/STR/STA/INT/INS/CON/PSI) — combat to-hit/damage, generation, roles, character sheet. Prevents the "50 = average" bug class.
---

# SHT Rank Scale

Every primary stat in SHT is a value on ONE universal scale that runs from a barroom brawler to an omnipotent deity. **Humans occupy 1–39. 40+ is superhuman. 100+ cosmic. 1000+ beyond comprehension.** The whole point: raw stat values are directly comparable across the human/superhuman divide.

The trap this skill exists to stop: the tactical engine (and older code) was written for a 0–100 world where **50 == "average"**. On the rank scale **50 is superhuman**, so any formula that pivots on 50 (`(stat - 50) / 5`, `stat > 50`, `?? 50` defaults) silently **penalizes humans** and **never fires** its superhuman branch for them. This is the same name-vs-code / predicted-vs-actual bug class flagged in project memory.

## The stats
`MEL` melee · `AGL` agility · `STR` strength · `STA` stamina · `INT` intellect · `INS` instinct · `CON` constitution. `PSI` (Psionic) mirrors `CON` (alias — keep the `CON` key, show "Psionic"). Health = `MEL + AGL + STA + STR`. LSWs (origins 2–8) generate at 40+; skilled humans (origins 1/9) stay 1–39.

## Rank tiers (`MVP/src/data/rankSystem.ts`)
| range | tier | human? |
|---|---|---|
| 1–2 / 3–5 / 6–9 / 10–19 / 20–29 / 30–39 | Min → Below-avg → Average → Above-avg → Exceptional → Max Human | yes |
| 40–49 / 50–74 / 75–99 | Low / Superhuman / High Superhuman | no |
| 100–149 / 150–999 / 1000+ | Low Cosmic / Cosmic / Beyond | no |

`getRankTier(v)`, `isHumanRank(v)`, `rankLabel(v)`, `getThreatDesignation(peakStat)` (Alpha/T1–T5/Earthshaker…Omnipotent), and:
- `rankNorm(v)` → 0–100 "effective competence" for old-world math: human 1–39 → 0–70, superhuman → 70–92, cosmic → 92–99, beyond → 100. **Cosmic-compressed.**

## The helper modules — reuse these, never hand-roll stat math
**`data/combatStatScaling.ts`** (combat modifiers, all call `rankNorm` internally):
- `statMod(raw, ÷5, cap12)` — signed ±accuracy pts. 0 at trained-human (~25), +5 max-human (39), +11 cosmic.
- `statBonus(raw, ÷6, cap12)` — one-sided ≥0 (flanking, stability, melee bonus). 0 at/below the human baseline → replaces `> 50` gates.
- `statStep(raw, per, cap)` — small integer bonus units (AP, vision tiles, HP blocks). 0 for average humans, small ramp above.
- `statDamageMult(raw)` — ×damage centred on 1.0. `isSuperhumanStat(raw)` — `raw >= 40` (replaces `> 50`).

**`data/strengthSystem.ts`** — `getStrengthDamageBonus(str)` (owner STR→melee-damage table; use for every STR damage add), `getCharacterWeight(str)`, `getLiftingCapacity(str)`, `STRENGTH_TABLE`, `MATERIALS`.

**`data/dodgeSystem.ts`** — the owner Dodge Chart. `getDodgeAccuracyPenalty(agl)` = defender AGL → attacker to-hit penalty (`COLUMN_SHIFT_PCT=5`); `getDodgeColumnShift(agl)`, `getThreatDesignation`.

## Rules when touching stat code
1. **Pass RAW stats to the helpers** — they call `rankNorm` internally. `statMod(rankNorm(x))` double-compresses. Wrong.
2. **Never pivot on 50.** Replace `(stat-50)/5` → `statMod(stat)`; `stat > 50` → `statBonus(stat)` (auto-0 below baseline) or `isSuperhumanStat(stat)`.
3. **Stat-less defaults = 20 (human), not 50 (=superhuman).** Grep `?? 50` / `|| 50` in combat spawn code. (Exception: `morale ?? 50` is a 0–100 morale value, not a rank stat — leave it.)
4. **STR damage → `getStrengthDamageBonus`**, not `str/10`. Predicted-damage preview must call the identical expression as the resolution path.
5. **Opposed physical rolls (grapple) stay on RAW stats** — raw = faithful physical power; compressing erases the superhuman advantage the scale encodes. The `attacker.str > target.str + 20` super-strength override handles dominance.

## Combat hit resolution (unified July 2026)
`CombatScene.tryAttackUnit` resolves against `calculateHitChance()` (the rich number: range brackets, cover, stance, flanking, stats, dodge, skills, calling, morale, injury) — so cover/positioning actually matter and the tooltip is honest. `resolveHitOutcome(roll, hitPct)` makes P(land) == shown hit%, splitting graze/hit/crit by roll margin. The old column-shift `getHitResult` is gone. Two spawn paths: `spawnFromGameStore` (live) and `createUnit` (Combat Lab) — both must read MEL/AGL/STR/STA/INT/INS/CON.

## Verify
`npx tsx MVP/src/combat/rankScaleSanity.ts` prints the stat→modifier table + simulated hit curves + the resolution distribution. NOTE: `npm run test:battery` exercises a SEPARATE headless `MVP/src/combat/` module (belt/15-pivot), NOT `CombatScene` — scene changes need the sanity harness or an in-engine check.

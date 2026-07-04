/**
 * COMBAT STAT SCALING — one place that turns a raw rank stat into a combat modifier.
 *
 * Characters now live on the 1–5000 rank scale (see rankSystem.ts): the entire
 * human range is 1–39, 40+ is superhuman, 100+ cosmic. The tactical engine was
 * written for an old 0–100 world where 50 == "average", so formulas like
 * `(agl - 50) / 5` now PENALISE every human (a maxed human AGL 39 would read as
 * -2 accuracy) and stability checks like `con > 50` never fire for humans.
 *
 * This module recentres all stat-derived combat modifiers on a human baseline
 * and compresses the cosmic tail (via rankNorm) so a demigod's +50 stat doesn't
 * translate into an absurd +60 to-hit — cosmic power expresses through POWERS
 * and threat, not a flat aim bonus. Combat reads raw rank stats and calls these.
 *
 * Pairs with dodgeSystem.ts (the owner's Dodge Chart: defender AGL → attacker
 * column-shift penalty), which is the DEFENDER side; statMod() here is the
 * ACTOR side (steadier aim, harder hits). They never double-count — different
 * units, different mechanics.
 */

import { rankNorm } from './rankSystem';

/**
 * The rankNorm value we treat as the neutral pivot — a solid, trained human.
 * rankNorm(25) ≈ 45 (an "Exceptional Human" floor). Stats below read as a
 * penalty, above as a bonus; an average civilian (~AGL 10) sits clearly negative.
 */
export const COMBAT_PIVOT = 45;

/**
 * Signed combat modifier (in accuracy/percent points) from a raw rank stat.
 * @param raw     the character's raw rank stat (1..5000+)
 * @param divisor sensitivity — larger = gentler slope (default 5)
 * @param cap     absolute bound so cosmic stats stay sane (default 12)
 *
 * Reference points at default divisor 5:
 *   AGL 10 → -5 · 20 → -2 · 25 → 0 · 30 → +2 · 39 (max human) → +5
 *   50 (superhuman) → +6 · 75 → +8 · 99 → +9 · 1000+ (beyond) → +11 (capped)
 */
export function statMod(raw: number | undefined, divisor = 5, cap = 12): number {
  const n = rankNorm(raw ?? 0);
  const m = Math.round((n - COMBAT_PIVOT) / divisor);
  return Math.max(-cap, Math.min(cap, m));
}

/**
 * A one-sided POSITIVE contribution (never a penalty) — for bonuses that should
 * only ever help (e.g. flanking exploitation from INS, stability from CON).
 * Zero at/below the human baseline, scaling up from there.
 */
export function statBonus(raw: number | undefined, divisor = 6, cap = 12): number {
  return Math.max(0, statMod(raw, divisor, cap));
}

/**
 * Damage multiplier from a raw rank stat, centred on 1.0 at the human baseline.
 * Used for STR→melee and any stat→damage scaling. Bounded so cosmic strength
 * multiplies hard but not infinitely at the tactical layer.
 * @param raw   raw rank stat
 * @param perStep fraction added per rankNorm point above/below pivot (default 0.02)
 * @param min/max clamp on the final multiplier (default 0.6 .. 3.0)
 *
 * Reference (default): AGL/STR 10 → ~0.78 · 25 → 1.0 · 39 → 1.5 · 50 → 1.58 ·
 *   99 → 1.94 · 1000+ → 2.1  (clamped)
 */
export function statDamageMult(raw: number | undefined, perStep = 0.02, min = 0.6, max = 3.0): number {
  const n = rankNorm(raw ?? 0);
  const mult = 1 + (n - COMBAT_PIVOT) * perStep;
  return Math.max(min, Math.min(max, mult));
}

/**
 * Small NON-NEGATIVE integer "bonus units" a stat grants above the human floor —
 * for derived resources that step in whole numbers (AP, vision tiles, HP blocks),
 * NOT accuracy points. Zero for an average/weak human, a modest ramp for elites
 * and superhumans, capped so cosmic stats don't hand out infinite AP.
 * @param raw raw rank stat · @param per rankNorm points per step · @param cap max steps
 *
 * Reference (default per 15, cap 6):
 *   AGL 20 → 0 · 25 → 0 · 39 (max human) → +1 · 50 → +1 · 75 → +2 · 99 → +3 · cosmic → +3
 */
export function statStep(raw: number | undefined, per = 15, cap = 6): number {
  const n = rankNorm(raw ?? 0);
  return Math.max(0, Math.min(cap, Math.floor((n - COMBAT_PIVOT) / per)));
}

/**
 * Whether a raw stat clears a superhuman gate (≥ 40). Cheap helper for combat
 * branches that used to test `stat > 50` to mean "exceptional".
 */
export function isSuperhumanStat(raw: number | undefined): boolean {
  return (raw ?? 0) >= 40;
}

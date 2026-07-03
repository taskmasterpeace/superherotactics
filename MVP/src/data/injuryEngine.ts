/**
 * Injury engine — turns combat outcomes into persistent injuries on characters.
 *
 * Pipeline (spec 23): wounded/downed in combat -> d100 roll on the SHT injury
 * table (low = worse) -> origin gate (a Robotic/Synthetic character Malfunctions,
 * flesh injuries don't apply) -> spine modifier (good-healthcare countries soften
 * the roll) -> AppliedInjury attached to the character.
 *
 * "Some shown now, some later": internal injuries (organ/spine) and mental trauma
 * are HIDDEN until a hospital diagnosis reveals them — the merc knows he hurts;
 * the doctor finds out why.
 */

import {
  getInjuryEntry, InjuryTableEntry, InjurySeverity, SEVERITY_ORDER, SEVERITY_COLOR,
} from './injuryTableSHT';

export interface AppliedInjury {
  id: string;
  entryD100: number;
  name: string;
  severity: InjurySeverity;
  bodyPart: string;
  effect: string;
  permanent: boolean;
  treatment: string;
  duration: string;
  /** True until a hospital diagnosis reveals it to the player. */
  hidden: boolean;
  appliedAtDay: number;
  revealedAtDay?: number;
  /** Set when the origin gate remapped a flesh wound (e.g. Robotic Malfunction). */
  originRemap?: 'malfunction' | 'skipped';
}

export interface InjuryRollContext {
  /** Origin category 1-9 (6 = Robotic/Synthetic). */
  origin?: number;
  /** Country healthcare 0-100 — spine modifier softens rolls in good systems. */
  countryHealthcare?: number;
  /** Country crime index 0-100 — hardens rolls (worse street medicine). */
  crimeIndex?: number;
  /** Bias the roll directly (overkill damage = negative, glancing = positive). */
  rollBias?: number;
  gameDay: number;
  rand?: () => number;
}

const FLESH_PARTS = new Set(['organ', 'muscle', 'tendon', 'throat', 'rib', 'spine']);
const MENTAL_SEVERITIES = new Set<InjurySeverity>(['MentalTrauma']);
let injuryCounter = 0;

/** Spine modifier per spec 23 §5.1: healthcare softens, crime hardens. */
export function spineRollModifier(healthcare = 50, crimeIndex = 50, gdpPerCapita = 50): number {
  const cs = Math.round(0.04 * healthcare + 0.02 * gdpPerCapita - 0.03 * crimeIndex);
  return cs * 10; // +CS pushes the roll toward the survivable/boon end
}

/**
 * Roll an injury for a wounded/downed character. Returns null when the origin
 * gate skips the injury entirely (e.g. an energy form shrugging off a bleed).
 */
export function rollInjury(ctx: InjuryRollContext): AppliedInjury | null {
  const rand = ctx.rand ?? Math.random;
  const raw = 1 + Math.floor(rand() * 100);
  const modified = Math.max(1, Math.min(100,
    raw + (ctx.rollBias ?? 0) + spineRollModifier(ctx.countryHealthcare, ctx.crimeIndex)));
  const entry = getInjuryEntry(modified);
  return materializeInjury(entry, ctx);
}

/** Deterministic variant when the d100 is already known (tests, called shots). */
export function applyInjuryRoll(d100: number, ctx: InjuryRollContext): AppliedInjury | null {
  return materializeInjury(getInjuryEntry(d100), ctx);
}

function materializeInjury(entry: InjuryTableEntry, ctx: InjuryRollContext): AppliedInjury | null {
  const origin = ctx.origin ?? 1;
  let name = entry.name;
  let effect = entry.effect;
  let treatment: string = entry.treatment;
  let originRemap: AppliedInjury['originRemap'];

  // Origin gate: Robotic/Synthetic (6) doesn't bleed or tear muscle — it
  // malfunctions, and it's repaired, not healed. Mental trauma needs a mind;
  // constructs skip it entirely.
  if (origin === 6) {
    if (MENTAL_SEVERITIES.has(entry.severity)) return null;
    if (FLESH_PARTS.has(entry.bodyPart) || /bleed/i.test(entry.effect)) {
      name = `Malfunction: ${entry.name}`;
      effect = `System damage equivalent — ${entry.effect}`;
      treatment = 'FieldSurgery'; // = Repair tier for constructs
      originRemap = 'malfunction';
    }
  }

  // The high band is boons/survival beats, not wounds — no injury record.
  if (entry.severity === 'Boon' || entry.severity === 'Survival' || entry.severity === 'Special') {
    return null;
  }

  // Hidden until hospital diagnosis: internal + mental damage.
  const hidden =
    (!entry.permanent && (entry.bodyPart === 'organ' || entry.bodyPart === 'spine')) ||
    MENTAL_SEVERITIES.has(entry.severity);

  return {
    id: `inj_${ctx.gameDay}_${injuryCounter++}`,
    entryD100: entry.d100,
    name,
    severity: entry.severity,
    bodyPart: entry.bodyPart,
    effect,
    permanent: entry.permanent,
    treatment,
    duration: entry.duration,
    hidden,
    appliedAtDay: ctx.gameDay,
    originRemap,
  };
}

// ============================================================================
// STATE DERIVATION — the color-coded report reads these
// ============================================================================

export type PhysicalState = 'healthy' | 'hurt' | 'wounded' | 'critical';
export type MentalState = 'stable' | 'stressed' | 'shaken' | 'broken';

export const PHYSICAL_STATE_COLOR: Record<PhysicalState, string> = {
  healthy: '#22c55e', hurt: '#eab308', wounded: '#f97316', critical: '#ef4444',
};
export const MENTAL_STATE_COLOR: Record<MentalState, string> = {
  stable: '#22c55e', stressed: '#eab308', shaken: '#f97316', broken: '#ef4444',
};

function worstSeverity(injuries: AppliedInjury[]): InjurySeverity | null {
  let worstIdx = Infinity;
  for (const inj of injuries) {
    const idx = SEVERITY_ORDER.indexOf(inj.severity);
    if (idx >= 0 && idx < worstIdx) worstIdx = idx;
  }
  return Number.isFinite(worstIdx) ? SEVERITY_ORDER[worstIdx] : null;
}

/** Physical condition from VISIBLE physical injuries + health fraction. */
export function getPhysicalState(char: {
  activeInjuries?: AppliedInjury[]; health?: number; maxHealth?: number;
}): { state: PhysicalState; color: string; worst: InjurySeverity | null } {
  const visible = (char.activeInjuries ?? []).filter(i => !i.hidden && i.severity !== 'MentalTrauma');
  const worst = worstSeverity(visible);
  const hp = char.maxHealth ? (char.health ?? char.maxHealth) / char.maxHealth : 1;

  let state: PhysicalState = 'healthy';
  if (worst === 'Fatal' || worst === 'Permanent' || worst === 'Critical' || hp < 0.25) state = 'critical';
  else if (worst === 'Severe' || hp < 0.5) state = 'wounded';
  else if (worst === 'Moderate' || worst === 'Minor' || hp < 0.85) state = 'hurt';
  return { state, color: PHYSICAL_STATE_COLOR[state], worst };
}

/** Mental condition from VISIBLE mental trauma + morale. */
export function getMentalState(char: {
  activeInjuries?: AppliedInjury[]; morale?: number;
}): { state: MentalState; color: string } {
  const traumas = (char.activeInjuries ?? []).filter(i => !i.hidden && i.severity === 'MentalTrauma');
  const morale = char.morale ?? 75;

  let state: MentalState = 'stable';
  if (traumas.length >= 2 || morale < 15) state = 'broken';
  else if (traumas.length === 1 || morale < 35) state = 'shaken';
  else if (morale < 55) state = 'stressed';
  return { state, color: MENTAL_STATE_COLOR[state] };
}

/** Hospital diagnosis: reveal hidden injuries; returns the newly revealed ones. */
export function diagnoseInjuries(
  injuries: AppliedInjury[] | undefined, gameDay: number,
): { injuries: AppliedInjury[]; revealed: AppliedInjury[] } {
  const list = injuries ?? [];
  const revealed: AppliedInjury[] = [];
  const next = list.map(inj => {
    if (!inj.hidden) return inj;
    const shown = { ...inj, hidden: false, revealedAtDay: gameDay };
    revealed.push(shown);
    return shown;
  });
  return { injuries: next, revealed };
}

export { SEVERITY_COLOR };

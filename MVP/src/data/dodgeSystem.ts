/**
 * DODGE SYSTEM — the owner "Dodge Chart": Agility → Column-Shift penalty an
 * attacker suffers when targeting this character. Pure stat→math data, ready
 * for the combat pass to subtract from to-hit (attacker accuracy -= |CS|·step).
 *
 * The chart also carries the threat-class designation per AGL band; combat and
 * the character sheet share this one source of truth for evasion.
 */

export interface DodgeEntry {
  min: number;
  max: number;          // inclusive
  columnShift: number;  // penalty TO THE ATTACKER (negative)
  comparison: string;   // rank comparison label
  threat: string;       // threat-level designation
}

export const DODGE_CHART: DodgeEntry[] = [
  { min: 1,    max: 9,    columnShift: 0,   comparison: 'Little Human',      threat: '—' },
  { min: 10,   max: 19,   columnShift: -2,  comparison: 'Above-Avg Human',   threat: '—' },
  { min: 20,   max: 29,   columnShift: -3,  comparison: 'Exceptional Human',  threat: '—' },
  { min: 30,   max: 39,   columnShift: -4,  comparison: 'Max Human Limit',    threat: 'Alpha' },
  { min: 40,   max: 49,   columnShift: -5,  comparison: 'Low Superhuman',     threat: 'Level 1' },
  { min: 50,   max: 59,   columnShift: -6,  comparison: 'Superhuman',         threat: 'Level 2' },
  { min: 60,   max: 69,   columnShift: -7,  comparison: 'Superhuman',         threat: 'Level 3' },
  { min: 70,   max: 79,   columnShift: -8,  comparison: 'Superhuman',         threat: 'Level 4' },
  { min: 80,   max: 99,   columnShift: -9,  comparison: 'High Superhuman',    threat: 'Level 5' },
  { min: 100,  max: 149,  columnShift: -10, comparison: 'Low Cosmic',         threat: 'Earthshaker' },
  { min: 150,  max: 250,  columnShift: -11, comparison: 'Cosmic',            threat: 'Earthbreaker' },
  { min: 251,  max: 500,  columnShift: -12, comparison: 'High Cosmic',        threat: 'Eartheater' },
  { min: 501,  max: 999,  columnShift: -13, comparison: 'Supreme Cosmic',     threat: 'Sunbreaker' },
  { min: 1000, max: 2499, columnShift: -14, comparison: 'Deity',              threat: 'Suneater' },
  { min: 2500, max: Infinity, columnShift: -14, comparison: 'Supreme Being',  threat: 'Omnipotent' },
];

export function getDodgeEntry(agility: number): DodgeEntry {
  const v = Math.max(0, agility || 0);
  if (v < 1) return DODGE_CHART[0];
  for (const e of DODGE_CHART) if (v >= e.min && v <= e.max) return e;
  return DODGE_CHART[DODGE_CHART.length - 1];
}

/** Column-shift penalty to the attacker (negative or 0) from the target's AGL. */
export function getDodgeColumnShift(agility: number): number {
  return getDodgeEntry(agility).columnShift;
}

/**
 * Convert the dodge column-shift into a flat to-hit penalty percentage for the
 * current hit-roll model. One column shift ≈ 8% (matches the existing
 * cover/flanking step in the combat core). Clamp keeps cosmic evasion sane.
 */
export const COLUMN_SHIFT_PCT = 8;
export function getDodgeAccuracyPenalty(agility: number): number {
  return Math.abs(getDodgeColumnShift(agility)) * COLUMN_SHIFT_PCT;
}

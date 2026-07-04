/**
 * RANK SYSTEM — the universal 1–5000 rank scale (owner "Rank Value" table).
 *
 * Every stat value IS its rank on one scale that spans a barroom brawler to an
 * omnipotent deity. 1–39 is the entire human range; 40+ is superhuman; 100+
 * cosmic; 1000+ beyond comprehension. This is the semantic layer combat, roles,
 * and the character sheet read to answer "how strong is this, really?"
 *
 * Pairs with the LSW rule: skilled humans generate inside 1–39, LSWs at 40+.
 */

export type RankTierId =
  | 'minimum' | 'below_avg' | 'average' | 'above_avg' | 'exceptional' | 'max_human'
  | 'low_super' | 'superhuman' | 'high_super'
  | 'low_cosmic' | 'cosmic' | 'beyond';

export interface RankTier {
  id: RankTierId;
  label: string;
  min: number;
  max: number;      // inclusive; Infinity for the top tier
  color: string;    // no purple — cyan→gold→red→white ramp
  isHuman: boolean; // ≤ 39
}

// Owner "Rank Value" table (image 1), verbatim bands.
export const RANK_TIERS: RankTier[] = [
  { id: 'minimum',     label: 'Minimum Human',       min: 1,    max: 2,        color: '#64748b', isHuman: true },
  { id: 'below_avg',   label: 'Below-Average Human', min: 3,    max: 5,        color: '#6b7280', isHuman: true },
  { id: 'average',     label: 'Average Human',       min: 6,    max: 9,        color: '#94a3b8', isHuman: true },
  { id: 'above_avg',   label: 'Above-Average Human', min: 10,   max: 19,       color: '#38bdf8', isHuman: true },
  { id: 'exceptional', label: 'Exceptional Human',   min: 20,   max: 29,       color: '#22d3ee', isHuman: true },
  { id: 'max_human',   label: 'Maximum Human Limit', min: 30,   max: 39,       color: '#2dd4bf', isHuman: true },
  { id: 'low_super',   label: 'Low Superhuman',      min: 40,   max: 49,       color: '#a3e635', isHuman: false },
  { id: 'superhuman',  label: 'Superhuman',          min: 50,   max: 74,       color: '#facc15', isHuman: false },
  { id: 'high_super',  label: 'High Superhuman',     min: 75,   max: 99,       color: '#f59e0b', isHuman: false },
  { id: 'low_cosmic',  label: 'Low Cosmic',          min: 100,  max: 149,      color: '#fb923c', isHuman: false },
  { id: 'cosmic',      label: 'Cosmic',              min: 150,  max: 999,      color: '#ef4444', isHuman: false },
  { id: 'beyond',      label: 'Beyond Comprehension', min: 1000, max: Infinity, color: '#f8fafc', isHuman: false },
];

export function getRankTier(value: number): RankTier {
  const v = Math.max(0, value || 0);
  if (v < 1) return RANK_TIERS[0];
  for (const t of RANK_TIERS) if (v >= t.min && v <= t.max) return t;
  return RANK_TIERS[RANK_TIERS.length - 1];
}

export function isHumanRank(value: number): boolean {
  return getRankTier(value).isHuman;
}

/** Short compare-label for tooltips (e.g. "Exceptional Human"). */
export function rankLabel(value: number): string {
  return getRankTier(value).label;
}

/**
 * Normalize any stat value to a 0–100 "effective competence" for UI bars and
 * strategic-layer math that was written for the old 0–100 world. The whole
 * human range (1–39) maps into 0–70 so a maxed-out human reads as clearly
 * capable, and superhuman/cosmic push above 70 with diminishing returns.
 * Keeps role-effectiveness / investigation math meaningful across the divide.
 */
export function rankNorm(value: number): number {
  const v = Math.max(0, value || 0);
  if (v <= 39) return Math.round((v / 39) * 70);               // human: 0→70
  if (v <= 99) return Math.round(70 + ((v - 39) / 60) * 22);   // superhuman: 70→92
  if (v <= 999) return Math.round(92 + ((v - 99) / 900) * 7);  // cosmic: 92→99
  return 100;                                                   // beyond
}

// ---------------------------------------------------------------------------
// Threat-level designation from any stat value (owner dodge chart's right col).
// Used to headline a character's peak — the value of their strongest stat.
// ---------------------------------------------------------------------------

export interface ThreatBand { min: number; max: number; label: string; short: string }

export const THREAT_BANDS: ThreatBand[] = [
  { min: 0,    max: 29,   label: 'Human',            short: '—' },
  { min: 30,   max: 39,   label: 'Threat Alpha',     short: 'α' },
  { min: 40,   max: 49,   label: 'Threat Level 1',   short: 'T1' },
  { min: 50,   max: 59,   label: 'Threat Level 2',   short: 'T2' },
  { min: 60,   max: 69,   label: 'Threat Level 3',   short: 'T3' },
  { min: 70,   max: 79,   label: 'Threat Level 4',   short: 'T4' },
  { min: 80,   max: 99,   label: 'Threat Level 5',   short: 'T5' },
  { min: 100,  max: 149,  label: 'Earthshaker',      short: 'ES' },
  { min: 150,  max: 250,  label: 'Earthbreaker',     short: 'EB' },
  { min: 251,  max: 500,  label: 'Eartheater',       short: 'EE' },
  { min: 501,  max: 999,  label: 'Sunbreaker',       short: 'SB' },
  { min: 1000, max: 1499, label: 'Suneater',         short: 'SE' },
  { min: 1500, max: Infinity, label: 'Omnipotent',   short: 'Ω' },
];

/** Peak threat designation from the character's single highest primary stat. */
export function getThreatDesignation(peakStatValue: number): ThreatBand {
  const v = Math.max(0, peakStatValue || 0);
  for (const b of THREAT_BANDS) if (v >= b.min && v <= b.max) return b;
  return THREAT_BANDS[THREAT_BANDS.length - 1];
}

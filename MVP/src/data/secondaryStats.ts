/**
 * SECONDARY STATS & TRAIT FLAGS (owner spec).
 *
 * Beyond the 7 primaries, a character carries social standing and physical
 * trait flags. Fear/Respect/Popularity are MUTABLE (seeded at generation, moved
 * by play). Flight / BreatheAir / TeamPlayer / SecretID / Diseased / Poisoned
 * are traits or live status — resolved by getter so they work on any character
 * shape (hand-authored seeds, profiled recruits, combat units) without every
 * producer having to set every field.
 *
 *  FEAR       — how much people fear them (Batman/Hulk). 0-5000-capable, human 0-100.
 *  RESPECT    — how much people love/respect them (Superman/Cap).
 *  POPULARITY — fans / following (distinct from fame=recognition, fear, respect).
 *  FLIGHT     — can fly (combat Z-axis).                    [trait]
 *  BREATHEAIR — needs to breathe (false = immune to gas/asphyxiation). [trait]
 *  TEAMPLAYER — plays well with others (default true).      [trait, personality]
 *  SECRETID   — maintains a secret identity.                [trait]
 *  DISEASED / POISONED — live afflictions.                  [status]
 *
 * ALIVE and HIRED are intentionally NOT fields here — `status !== 'dead'` and
 * `employment.isEmployed` are the single sources of truth (ledger call).
 */

function num(...vals: any[]): number | undefined {
  for (const v of vals) if (typeof v === 'number') return v;
  return undefined;
}
function powerNames(char: any): string[] {
  return (char?.powers || []).map((p: any) => String(typeof p === 'string' ? p : p?.name || '').toLowerCase());
}

// --- Trait flags -----------------------------------------------------------

/** Can this character fly? Explicit flag, else inferred from flight-ish powers. */
export function getFlight(char: any): boolean {
  if (typeof char?.flight === 'boolean') return char.flight;
  return powerNames(char).some(n => /flight|\bfly\b|jump jet|flight pack|levitat|wing|jet pack/.test(n));
}

/** Does this character need to breathe? Synthetics/some aliens don't. */
export function getBreatheAir(char: any): boolean {
  if (typeof char?.breatheAir === 'boolean') return char.breatheAir;
  const origin = char?.origin ?? char?.originType;
  // Robotic/synthetic (6) and Alien (8) may not breathe air
  if (origin === 6) return false;
  if (origin === 8) return !powerNames(char).some(n => /alien phys|void|space/.test(n));
  return true;
}

/** Personality-derived team fit; explicit flag wins. */
export function getTeamPlayer(char: any): boolean {
  if (typeof char?.teamPlayer === 'boolean') return char.teamPlayer;
  const p = char?.personality || {};
  const volatility = p.volatility ?? 5;
  const socia = p.sociability ?? (10 - volatility);
  return socia >= 4 && volatility <= 8;
}

export function getSecretId(char: any): boolean {
  return !!(char?.secretId ?? char?.secretIdentity ?? char?.hasSecretIdentity);
}

export function isDiseased(char: any): boolean {
  if (typeof char?.diseased === 'boolean') return char.diseased;
  return !!char?.infected || (char?.activeInjuries || []).some((i: any) => /disease|infect|plague|virus/i.test(i?.name || ''));
}

export function isPoisoned(char: any): boolean {
  if (typeof char?.poisoned === 'boolean') return char.poisoned;
  return (char?.statusEffects || []).some((s: any) => /poison|venom|toxin/i.test(s?.id || s?.name || ''));
}

// --- Social stats (mutable; getters fall back to a stable derivation) -------

const ORIGIN_FEAR_LEAN: Record<number, number> = { 1: 0, 2: 8, 3: 4, 4: 15, 5: 6, 6: 12, 7: 25, 8: 18, 9: 2 };
const ORIGIN_RESPECT_LEAN: Record<number, number> = { 1: 10, 2: 6, 3: 8, 4: 2, 5: 20, 6: 4, 7: -5, 8: 6, 9: 12 };

function threatNum(char: any): number {
  const t = char?.threatLevel;
  if (typeof t === 'number') return t;
  const m = String(t || '').match(/(\d+)/);
  return m ? Number(m[1]) : 1;
}

/** How feared (Batman/Hulk). Stored value wins; else derived from origin + threat + notoriety. */
export function getFear(char: any): number {
  const stored = num(char?.reputation?.fear, char?.fear);
  if (stored !== undefined) return stored;
  const origin = char?.origin ?? char?.originType ?? 1;
  const wanted = num(char?.reputation?.wanted) ?? 0;
  return Math.max(0, Math.min(100, (ORIGIN_FEAR_LEAN[origin] ?? 5) + threatNum(char) * 3 + wanted));
}

/** How respected/loved (Superman/Cap). */
export function getRespect(char: any): number {
  const stored = num(char?.reputation?.respect, char?.respect);
  if (stored !== undefined) return stored;
  const origin = char?.origin ?? char?.originType ?? 1;
  const pub = num(char?.reputation?.public) ?? 0;
  return Math.max(0, Math.min(100, (ORIGIN_RESPECT_LEAN[origin] ?? 8) + 20 + Math.round(pub / 2)));
}

/** Fans / following. Distinct from fame (recognition). */
export function getPopularity(char: any): number {
  const stored = num(char?.popularity);
  if (stored !== undefined) return stored;
  return Math.max(0, Math.round((char?.fame || 0) * 0.6 + getRespect(char) * 2));
}

/** Seed social stats + trait flags onto a freshly-generated character (mutates). */
export function seedSocialStats(char: any): void {
  char.reputation = char.reputation || {};
  if (char.reputation.fear === undefined) char.reputation.fear = getFear(char);
  if (char.reputation.respect === undefined) char.reputation.respect = getRespect(char);
  if (char.popularity === undefined) char.popularity = getPopularity(char);
  if (char.flight === undefined) char.flight = getFlight(char);
  if (char.breatheAir === undefined) char.breatheAir = getBreatheAir(char);
  if (char.teamPlayer === undefined) char.teamPlayer = getTeamPlayer(char);
}

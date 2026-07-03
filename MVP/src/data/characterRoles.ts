/**
 * Role effectiveness — "everyone is effective at something."
 *
 * Every character already carries a `role` (soldier/specialist/scientist/
 * investigator/operative/support) + `education` fields + stats + earned degrees.
 * This module turns those into a per-DOMAIN effectiveness score (0-100) that any
 * system can consult to weight bonuses (investigations, city ops, base-building,
 * medical, diplomacy) — and to show the player what each person is good at.
 *
 * This is connect-not-invent: it reads existing character data, adds no new state.
 */

import type { CharacterRole, EducationField } from './countryProfiles';

export type RoleDomain = 'combat' | 'investigation' | 'tech' | 'medical' | 'social' | 'support';

export const DOMAIN_LABEL: Record<RoleDomain, string> = {
  combat: 'Field / Combat',
  investigation: 'Investigation',
  tech: 'Engineering / Tech',
  medical: 'Medical',
  social: 'Diplomacy / Face',
  support: 'Base / Support',
};

export const DOMAIN_ICON: Record<RoleDomain, string> = {
  combat: '⚔️', investigation: '🔍', tech: '⚙️', medical: '⚕️', social: '🎭', support: '🛠️',
};

// Which stats drive each domain (SHT stats: MEL/AGL/STR/STA/INT/INS/CON).
const DOMAIN_STATS: Record<RoleDomain, string[]> = {
  combat: ['MEL', 'AGL', 'STR'],
  investigation: ['INS', 'INT'],
  tech: ['INT', 'CON'],
  medical: ['INT', 'CON', 'INS'],
  social: ['INS', 'CON'],
  support: ['CON', 'INT', 'STA'],
};

// Role gives a flat lean toward its home domains.
const ROLE_DOMAINS: Record<CharacterRole, RoleDomain[]> = {
  soldier: ['combat', 'support'],
  specialist: ['tech', 'investigation'],
  scientist: ['tech', 'medical'],
  investigator: ['investigation', 'social'],
  operative: ['investigation', 'social', 'combat'],
  support: ['support', 'medical'],
};

// Education fields nudge domains (a doctor leans medical even if their role is scientist).
const FIELD_DOMAINS: Partial<Record<EducationField, RoleDomain>> = {
  military_tactics: 'combat', weapons_systems: 'combat', martial_arts: 'combat',
  combat_sciences: 'combat', demolitions: 'combat',
  hacking: 'tech', electronics: 'tech', robotics: 'tech', cybernetics: 'tech',
  weapons_smithing: 'tech', engineering: 'tech', super_science: 'tech',
  medicine: 'medical', biology: 'medical', genetics: 'medical', chemistry: 'medical',
  surgery: 'medical', combat_medicine: 'medical',
  forensics: 'investigation', investigation: 'investigation', psychology: 'investigation',
  interrogation: 'investigation', tradecraft: 'investigation', undercover: 'investigation',
  diplomacy: 'social', languages: 'social', mystical_studies: 'social',
  underground_ops: 'support', logistics: 'support',
};

interface RoleCharacter {
  role?: CharacterRole;
  education?: EducationField[];
  stats?: Record<string, number>;
  currentStats?: Record<string, number>;
  completedDegrees?: { fieldId: string; degreeLevel: string }[];
}

function statAvg(stats: Record<string, number> | undefined, names: string[]): number {
  if (!stats) return 40;
  const vals = names.map(n => stats[n] ?? stats[n.toLowerCase()] ?? 40);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Per-domain effectiveness 0-100 for a character. */
export function getRoleEffectiveness(char: RoleCharacter): Record<RoleDomain, number> {
  const stats = char.stats || char.currentStats;
  const out = {} as Record<RoleDomain, number>;
  const roleHome = char.role ? ROLE_DOMAINS[char.role] ?? [] : [];
  const eduDomains = (char.education || []).map(f => FIELD_DOMAINS[f]).filter(Boolean) as RoleDomain[];
  const degreeCount = char.completedDegrees?.length ?? 0;

  (Object.keys(DOMAIN_STATS) as RoleDomain[]).forEach(domain => {
    let score = statAvg(stats, DOMAIN_STATS[domain]);          // stat baseline
    if (roleHome.includes(domain)) score += 14;                // role home bonus
    score += eduDomains.filter(d => d === domain).length * 8;  // each matching field
    if (roleHome[0] === domain) score += 6;                    // primary role domain
    score += degreeCount * 2;                                  // earned degrees broaden competence
    out[domain] = Math.max(0, Math.min(100, Math.round(score)));
  });
  return out;
}

/** The character's single strongest domain + score. */
export function getPrimaryStrength(char: RoleCharacter): { domain: RoleDomain; label: string; score: number; icon: string } {
  const eff = getRoleEffectiveness(char);
  let best: RoleDomain = 'support';
  for (const d of Object.keys(eff) as RoleDomain[]) if (eff[d] > eff[best]) best = d;
  return { domain: best, label: DOMAIN_LABEL[best], score: eff[best], icon: DOMAIN_ICON[best] };
}

/** Top N domains for a compact "good at X, Y" display. */
export function getStrengths(char: RoleCharacter, n = 2): { domain: RoleDomain; label: string; score: number; icon: string }[] {
  const eff = getRoleEffectiveness(char);
  return (Object.keys(eff) as RoleDomain[])
    .sort((a, b) => eff[b] - eff[a])
    .slice(0, n)
    .map(d => ({ domain: d, label: DOMAIN_LABEL[d], score: eff[d], icon: DOMAIN_ICON[d] }));
}

/** Effectiveness in one domain, as a bonus multiplier around 1.0 (0.7x..1.4x). */
export function getDomainMultiplier(char: RoleCharacter, domain: RoleDomain): number {
  const score = getRoleEffectiveness(char)[domain];
  return 0.7 + (score / 100) * 0.7; // 0.7x at 0, ~1.4x at 100
}

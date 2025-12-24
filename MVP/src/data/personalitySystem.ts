/**
 * Personality System
 *
 * Defines personality traits that affect character behavior:
 * - Impatience: How fast they escalate when idle (affects notification timing)
 * - Initiative: How proactive they are (auto-return, auto-actions)
 * - Volatility: Mood swings, unpredictability
 * - Discipline: Following orders, staying on task
 * - Sociability: Team dynamics, morale effects
 */

// =============================================================================
// PERSONALITY TRAIT DEFINITIONS
// =============================================================================

export interface PersonalityTraits {
  // Core behavioral traits (1-10 scale)
  impatience: number;      // 1 = patient (slow escalation), 10 = impatient (fast escalation)
  initiative: number;      // 1 = waits for orders, 10 = takes own action (auto-return, etc.)
  volatility: number;      // 1 = stable, 10 = unpredictable mood swings
  discipline: number;      // 1 = rebellious, 10 = follows orders exactly
  sociability: number;     // 1 = loner, 10 = team player
  riskTolerance: number;   // 1 = cautious, 10 = reckless
  harmAvoidance: number;   // 1 = will kill easily, 10 = avoids lethal force
}

// =============================================================================
// MBTI TO PERSONALITY TRAITS MAPPING
// =============================================================================

/**
 * Each MBTI type has default trait values
 * These create distinct behavioral patterns
 */
export const MBTI_PERSONALITY_TRAITS: Record<string, PersonalityTraits> = {
  // ANALYSTS - Methodical, cerebral
  'INTJ': { impatience: 3, initiative: 8, volatility: 2, discipline: 9, sociability: 3, riskTolerance: 6, harmAvoidance: 4 },
  'INTP': { impatience: 2, initiative: 4, volatility: 3, discipline: 5, sociability: 2, riskTolerance: 4, harmAvoidance: 6 },
  'ENTJ': { impatience: 7, initiative: 9, volatility: 4, discipline: 8, sociability: 7, riskTolerance: 7, harmAvoidance: 3 },
  'ENTP': { impatience: 6, initiative: 7, volatility: 6, discipline: 4, sociability: 8, riskTolerance: 8, harmAvoidance: 5 },

  // DIPLOMATS - People-focused, idealistic
  'INFJ': { impatience: 3, initiative: 6, volatility: 4, discipline: 7, sociability: 5, riskTolerance: 4, harmAvoidance: 8 },
  'INFP': { impatience: 2, initiative: 3, volatility: 6, discipline: 4, sociability: 4, riskTolerance: 3, harmAvoidance: 9 },
  'ENFJ': { impatience: 5, initiative: 8, volatility: 4, discipline: 7, sociability: 9, riskTolerance: 5, harmAvoidance: 7 },
  'ENFP': { impatience: 6, initiative: 7, volatility: 7, discipline: 3, sociability: 9, riskTolerance: 7, harmAvoidance: 6 },

  // SENTINELS - Dutiful, reliable
  'ISTJ': { impatience: 4, initiative: 5, volatility: 1, discipline: 10, sociability: 4, riskTolerance: 3, harmAvoidance: 5 },
  'ISFJ': { impatience: 3, initiative: 4, volatility: 2, discipline: 8, sociability: 6, riskTolerance: 2, harmAvoidance: 7 },
  'ESTJ': { impatience: 8, initiative: 9, volatility: 3, discipline: 9, sociability: 6, riskTolerance: 6, harmAvoidance: 4 },
  'ESFJ': { impatience: 5, initiative: 6, volatility: 4, discipline: 7, sociability: 9, riskTolerance: 4, harmAvoidance: 6 },

  // EXPLORERS - Adaptable, action-oriented
  'ISTP': { impatience: 5, initiative: 6, volatility: 3, discipline: 5, sociability: 3, riskTolerance: 8, harmAvoidance: 4 },
  'ISFP': { impatience: 3, initiative: 4, volatility: 5, discipline: 4, sociability: 5, riskTolerance: 5, harmAvoidance: 7 },
  'ESTP': { impatience: 9, initiative: 10, volatility: 6, discipline: 3, sociability: 8, riskTolerance: 10, harmAvoidance: 3 },
  'ESFP': { impatience: 7, initiative: 7, volatility: 7, discipline: 3, sociability: 10, riskTolerance: 7, harmAvoidance: 5 },
};

// Default traits if no MBTI
export const DEFAULT_PERSONALITY_TRAITS: PersonalityTraits = {
  impatience: 5,
  initiative: 5,
  volatility: 5,
  discipline: 5,
  sociability: 5,
  riskTolerance: 5,
  harmAvoidance: 5,
};

// =============================================================================
// PERSONALITY-DRIVEN BEHAVIORS
// =============================================================================

/**
 * Get idle escalation multiplier based on impatience
 * Higher impatience = faster escalation (shorter wait times)
 */
export function getImpatienceMultiplier(impatience: number): number {
  // impatience 1 = 2.0x (twice as long to escalate)
  // impatience 5 = 1.0x (normal)
  // impatience 10 = 0.3x (escalates 3x faster)
  const multipliers: Record<number, number> = {
    1: 2.0,
    2: 1.7,
    3: 1.4,
    4: 1.2,
    5: 1.0,
    6: 0.85,
    7: 0.7,
    8: 0.55,
    9: 0.4,
    10: 0.3,
  };
  return multipliers[Math.max(1, Math.min(10, Math.round(impatience)))] ?? 1.0;
}

/**
 * Will this character auto-return to base when idle?
 * Based on initiative and discipline
 */
export function willAutoReturn(traits: PersonalityTraits, vehicleAvailable: boolean): boolean {
  if (!vehicleAvailable) return false;

  // High initiative + high discipline = likely to auto-return
  // High initiative + low discipline = might wander off instead
  const autoReturnScore = (traits.initiative * 0.6) + (traits.discipline * 0.4);

  // Score 7+ = 80% chance, 5-7 = 40% chance, below 5 = 10% chance
  if (autoReturnScore >= 7) return Math.random() < 0.8;
  if (autoReturnScore >= 5) return Math.random() < 0.4;
  return Math.random() < 0.1;
}

/**
 * Get personality-based idle behavior
 */
export type IdleBehavior =
  | 'wait_patiently'      // Stays and waits
  | 'get_restless'        // Normal escalation
  | 'take_initiative'     // Auto-returns or finds something to do
  | 'wander_off'          // Might leave without orders (low discipline)
  | 'complain_loudly';    // Extra notifications (high impatience + high volatility)

export function getIdleBehavior(traits: PersonalityTraits): IdleBehavior {
  // High impatience + high volatility = complain loudly
  if (traits.impatience >= 7 && traits.volatility >= 6) {
    return 'complain_loudly';
  }

  // High initiative + high discipline = take initiative (auto-return)
  if (traits.initiative >= 7 && traits.discipline >= 6) {
    return 'take_initiative';
  }

  // High initiative + low discipline = might wander off
  if (traits.initiative >= 7 && traits.discipline <= 4) {
    return 'wander_off';
  }

  // Low impatience = wait patiently
  if (traits.impatience <= 3) {
    return 'wait_patiently';
  }

  // Default
  return 'get_restless';
}

/**
 * Get impatience meter fill rate (percentage per game minute)
 * Used for visual indicator
 */
export function getImpatienceFillRate(impatience: number): number {
  // Base: 100% fill in 60 minutes (normal escalation)
  // impatience 1 = 0.83%/min (fills in 120 min)
  // impatience 5 = 1.67%/min (fills in 60 min)
  // impatience 10 = 5%/min (fills in 20 min)
  return (impatience / 6) * 1.67;
}

// =============================================================================
// IMPATIENCE STATES
// =============================================================================

export type ImpatienceState = 'calm' | 'waiting' | 'restless' | 'irritated' | 'furious';

export function getImpatienceState(fillPercentage: number): ImpatienceState {
  if (fillPercentage < 20) return 'calm';
  if (fillPercentage < 40) return 'waiting';
  if (fillPercentage < 60) return 'restless';
  if (fillPercentage < 80) return 'irritated';
  return 'furious';
}

export const IMPATIENCE_STATE_COLORS: Record<ImpatienceState, string> = {
  calm: '#22c55e',      // green
  waiting: '#84cc16',   // lime
  restless: '#eab308',  // yellow
  irritated: '#f97316', // orange
  furious: '#ef4444',   // red
};

export const IMPATIENCE_STATE_MESSAGES: Record<ImpatienceState, string[]> = {
  calm: [
    'Standing by.',
    'Ready when you are.',
    'Awaiting orders.',
  ],
  waiting: [
    'Still here...',
    'Waiting for instructions.',
    'What\'s the plan?',
  ],
  restless: [
    'Getting a bit antsy here.',
    'So... what now?',
    'Should I be doing something?',
  ],
  irritated: [
    'Hey, I\'m not a statue.',
    'Hello? Anyone there?',
    'This is getting old.',
  ],
  furious: [
    'SERIOUSLY?!',
    'I have better things to do!',
    'Fine, I\'ll figure it out myself.',
  ],
};

// =============================================================================
// PERSONALITY GENERATION
// =============================================================================

/**
 * Generate random MBTI type with realistic distribution
 */
export function generateMBTI(): string {
  const types = Object.keys(MBTI_PERSONALITY_TRAITS);
  // Weighted distribution - some types are more common
  const weights: Record<string, number> = {
    'ISTJ': 12, 'ISFJ': 14, 'INFJ': 2, 'INTJ': 2,
    'ISTP': 5, 'ISFP': 9, 'INFP': 4, 'INTP': 3,
    'ESTP': 4, 'ESFP': 9, 'ENFP': 8, 'ENTP': 3,
    'ESTJ': 9, 'ESFJ': 12, 'ENFJ': 3, 'ENTJ': 2,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const type of types) {
    random -= weights[type] || 1;
    if (random <= 0) return type;
  }

  return 'ISTJ'; // fallback
}

/**
 * Get personality traits for a character
 */
export function getPersonalityTraits(mbti?: string): PersonalityTraits {
  if (!mbti) return { ...DEFAULT_PERSONALITY_TRAITS };
  return { ...(MBTI_PERSONALITY_TRAITS[mbti] || DEFAULT_PERSONALITY_TRAITS) };
}

/**
 * Add some randomness to base MBTI traits
 * Creates variation within same personality type
 */
export function generatePersonalityWithVariation(mbti?: string): PersonalityTraits {
  const base = getPersonalityTraits(mbti);

  // Add -2 to +2 variation to each trait
  const vary = (val: number) => Math.max(1, Math.min(10, val + Math.floor(Math.random() * 5) - 2));

  return {
    impatience: vary(base.impatience),
    initiative: vary(base.initiative),
    volatility: vary(base.volatility),
    discipline: vary(base.discipline),
    sociability: vary(base.sociability),
    riskTolerance: vary(base.riskTolerance),
    harmAvoidance: vary(base.harmAvoidance),
  };
}

// =============================================================================
// PERSONALITY DESCRIPTIONS
// =============================================================================

export function getPersonalityDescription(traits: PersonalityTraits): string {
  const descriptors: string[] = [];

  if (traits.impatience >= 8) descriptors.push('hot-headed');
  else if (traits.impatience <= 2) descriptors.push('patient');

  if (traits.initiative >= 8) descriptors.push('self-starter');
  else if (traits.initiative <= 2) descriptors.push('needs direction');

  if (traits.volatility >= 8) descriptors.push('unpredictable');
  else if (traits.volatility <= 2) descriptors.push('steady');

  if (traits.discipline >= 8) descriptors.push('disciplined');
  else if (traits.discipline <= 2) descriptors.push('rebellious');

  if (traits.riskTolerance >= 8) descriptors.push('reckless');
  else if (traits.riskTolerance <= 2) descriptors.push('cautious');

  if (traits.harmAvoidance >= 8) descriptors.push('non-lethal');
  else if (traits.harmAvoidance <= 2) descriptors.push('ruthless');

  return descriptors.join(', ') || 'balanced';
}

// =============================================================================
// MBTI TO CALLING ALIGNMENT
// =============================================================================

import { CallingId } from './callingSystem';

/**
 * Each MBTI type has callings that naturally fit their personality.
 * Primary callings are most common, secondary are less common but still fitting.
 */
export const MBTI_CALLING_ALIGNMENT: Record<string, {
  primary: CallingId[];
  secondary: CallingId[];
}> = {
  // ANALYSTS - Rational, strategic thinkers
  'INTJ': {
    primary: ['architect', 'visionary', 'professional'],
    secondary: ['seeker', 'untouchable', 'reformer'],
  },
  'INTP': {
    primary: ['seeker', 'professional', 'collector'],
    secondary: ['reluctant', 'outcast', 'visionary'],
  },
  'ENTJ': {
    primary: ['conqueror', 'architect', 'visionary'],
    secondary: ['soldier', 'legacy', 'reformer'],
  },
  'ENTP': {
    primary: ['thrill_seeker', 'visionary', 'chaos_agent'],
    secondary: ['rival', 'seeker', 'glory_hound'],
  },

  // DIPLOMATS - Empathetic, idealistic
  'INFJ': {
    primary: ['idealist', 'shepherd', 'visionary'],
    secondary: ['protector', 'repentant', 'seeker'],
  },
  'INFP': {
    primary: ['idealist', 'seeker', 'repentant'],
    secondary: ['outcast', 'romantic', 'shepherd'],
  },
  'ENFJ': {
    primary: ['shepherd', 'idealist', 'protector'],
    secondary: ['visionary', 'reformer', 'legacy'],
  },
  'ENFP': {
    primary: ['idealist', 'thrill_seeker', 'liberator'],
    secondary: ['seeker', 'romantic', 'glory_hound'],
  },

  // SENTINELS - Dutiful, reliable
  'ISTJ': {
    primary: ['soldier', 'professional', 'legacy'],
    secondary: ['guardian', 'loyalist', 'protector'],
  },
  'ISFJ': {
    primary: ['guardian', 'protector', 'shepherd'],
    secondary: ['loyalist', 'repentant', 'professional'],
  },
  'ESTJ': {
    primary: ['soldier', 'legacy', 'professional'],
    secondary: ['architect', 'reformer', 'conqueror'],
  },
  'ESFJ': {
    primary: ['protector', 'shepherd', 'loyalist'],
    secondary: ['guardian', 'romantic', 'glory_hound'],
  },

  // EXPLORERS - Adaptable, practical
  'ISTP': {
    primary: ['professional', 'mercenary', 'survivor'],
    secondary: ['thrill_seeker', 'soldier', 'untouchable'],
  },
  'ISFP': {
    primary: ['romantic', 'seeker', 'outcast'],
    secondary: ['idealist', 'reluctant', 'survivor'],
  },
  'ESTP': {
    primary: ['thrill_seeker', 'mercenary', 'glory_hound'],
    secondary: ['predator', 'rival', 'professional'],
  },
  'ESFP': {
    primary: ['thrill_seeker', 'glory_hound', 'romantic'],
    secondary: ['protector', 'liberator', 'born_to_it'],
  },
};

/**
 * Generate a calling that fits the character's MBTI
 */
export function generateCallingForMBTI(mbti?: string): CallingId {
  if (!mbti || !MBTI_CALLING_ALIGNMENT[mbti]) {
    // Random from common callings
    const common: CallingId[] = ['soldier', 'professional', 'mercenary', 'protector', 'survivor'];
    return common[Math.floor(Math.random() * common.length)];
  }

  const alignment = MBTI_CALLING_ALIGNMENT[mbti];

  // 70% primary, 30% secondary
  const pool = Math.random() < 0.7 ? alignment.primary : alignment.secondary;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Check if a calling fits an MBTI type
 */
export function doesCallingFitMBTI(calling: CallingId, mbti: string): 'natural' | 'possible' | 'unusual' {
  const alignment = MBTI_CALLING_ALIGNMENT[mbti];
  if (!alignment) return 'possible';

  if (alignment.primary.includes(calling)) return 'natural';
  if (alignment.secondary.includes(calling)) return 'possible';
  return 'unusual';
}

/**
 * Get personality + calling description for character sheet
 */
export function getFullPersonalityDescription(
  traits: PersonalityTraits,
  calling?: CallingId,
  mbti?: string
): string {
  const traitDesc = getPersonalityDescription(traits);

  if (!calling) return traitDesc;

  const fit = mbti ? doesCallingFitMBTI(calling, mbti) : 'possible';
  const fitNote = fit === 'unusual' ? ' (atypical)' : '';

  return `${traitDesc} — ${calling}${fitNote}`;
}

export default {
  MBTI_PERSONALITY_TRAITS,
  DEFAULT_PERSONALITY_TRAITS,
  getImpatienceMultiplier,
  willAutoReturn,
  getIdleBehavior,
  getImpatienceFillRate,
  getImpatienceState,
  IMPATIENCE_STATE_COLORS,
  IMPATIENCE_STATE_MESSAGES,
  generateMBTI,
  getPersonalityTraits,
  generatePersonalityWithVariation,
  getPersonalityDescription,
  // Calling alignment
  MBTI_CALLING_ALIGNMENT,
  generateCallingForMBTI,
  doesCallingFitMBTI,
  getFullPersonalityDescription,
};

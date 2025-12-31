/**
 * Origin-Based Hospital Healing System
 *
 * Each of the 8 origins has unique hospital mechanics:
 * - Heal Max: Maximum HP % before completing origin research
 * - Healing Roll: Stamina rank modifier (CS = Column Shifts)
 * - Frequency: Hours between healing attempts
 * - Requirement: What unlocks 100% healing capability
 *
 * Healing Roll Results:
 * - Fail = No healing this period
 * - Minor Success = 0.5x healing
 * - Success = 1x healing
 * - Major Success = 2x healing
 */

import { GameCharacter } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type HealingRequirement =
  | 'hospital'              // Just needs hospital status (humans)
  | 'research'              // Needs origin research completion
  | 'research_engineering'  // Needs both research AND engineering
  | 'investigation'         // Needs origin investigation completion
  | 'none';                 // Cannot use hospitals (aliens)

export type HealingRollResult =
  | 'fail'
  | 'minor_success'
  | 'success'
  | 'major_success';

export interface OriginHealing {
  originId: number;
  originName: string;
  healMax: number;                    // 0-100%, percentage before research complete
  healingRollModifier: number;        // CS (column shift) modifier to stamina roll
  healingFrequencyHours: number;      // Hours between healing attempts
  requirementFor100: HealingRequirement;
  canUseHospital: boolean;
  description: string;
  specialNotes?: string[];
}

export interface HealingResult {
  success: boolean;
  rollResult: HealingRollResult;
  hpHealed: number;
  hpCapped: number;                   // HP after applying healMax cap
  maxHealingReached: boolean;         // True if healMax cap is limiting recovery
  nextHealingIn: number;              // Hours until next healing attempt
  message: string;
}

// ============================================================================
// ORIGIN HEALING DATA
// ============================================================================

export const ORIGIN_HEALING: OriginHealing[] = [
  {
    originId: 1,
    originName: 'Skilled Human',
    healMax: 100,
    healingRollModifier: 4,
    healingFrequencyHours: 12,
    requirementFor100: 'hospital',
    canUseHospital: true,
    description: 'Normal human healing with medical advantage.',
    specialNotes: [
      'Fastest healing rate of all origins',
      'Hospital tier significantly affects recovery',
    ],
  },
  {
    originId: 2,
    originName: 'Altered Human',
    healMax: 100,
    healingRollModifier: 2,
    healingFrequencyHours: 24,
    requirementFor100: 'hospital',
    canUseHospital: true,
    description: 'Modified human physiology responds well to standard treatment.',
    specialNotes: [
      'Genetic modifications may complicate some procedures',
    ],
  },
  {
    originId: 3,
    originName: 'Tech Enhancement',
    healMax: 80,
    healingRollModifier: 3,
    healingFrequencyHours: 48,
    requirementFor100: 'research_engineering',
    canUseHospital: true,
    description: 'Cyborg components require specialized repair alongside medical treatment.',
    specialNotes: [
      'Limited to 80% healing until origin R&E complete',
      'May need replacement parts for full repair',
      'Engineering station required for tech components',
    ],
  },
  {
    originId: 4,
    originName: 'Mutated Human',
    healMax: 80,
    healingRollModifier: -3,
    healingFrequencyHours: 48,
    requirementFor100: 'research',
    canUseHospital: true,
    description: 'Unstable mutations make healing unpredictable.',
    specialNotes: [
      'Negative modifier due to mutation instability',
      'Limited to 80% until mutation research complete',
      'Standard medications may have unexpected effects',
    ],
  },
  {
    originId: 5,
    originName: 'Spiritual Enhancement',
    healMax: 30,
    healingRollModifier: 0,
    healingFrequencyHours: 72,
    requirementFor100: 'investigation',
    canUseHospital: true,
    description: 'Spiritual connection limits physical healing. Requires investigation to understand.',
    specialNotes: [
      'SEVERELY limited at 30% until origin investigation complete',
      'Temple healing may be more effective',
      'Must understand spiritual nature before full recovery possible',
      'Investigation reveals how to reconnect with spiritual essence',
    ],
  },
  {
    originId: 6,
    originName: 'Robotic',
    healMax: 20,
    healingRollModifier: 2,
    healingFrequencyHours: 72,
    requirementFor100: 'research_engineering',
    canUseHospital: true,
    description: 'Mechanical body requires parts and technical expertise.',
    specialNotes: [
      'SEVERELY limited at 20% until origin R&E complete',
      'Requires scrap materials for repairs',
      'Hospital provides temporary patches only',
      'Full repair needs engineering bay + research data',
    ],
  },
  {
    originId: 7,
    originName: 'Symbiotic',
    healMax: 50,
    healingRollModifier: 3,
    healingFrequencyHours: 48,
    requirementFor100: 'research',
    canUseHospital: true,
    description: 'Symbiote assists healing but requires research to optimize.',
    specialNotes: [
      'Limited to 50% until symbiote research complete',
      'Symbiote provides passive regeneration bonus',
      'Research unlocks full symbiotic healing potential',
    ],
  },
  {
    originId: 8,
    originName: 'Alien',
    healMax: 0,
    healingRollModifier: 0,
    healingFrequencyHours: 0,
    requirementFor100: 'none',
    canUseHospital: false,
    description: 'Alien physiology incompatible with human medicine.',
    specialNotes: [
      'CANNOT use hospitals at all',
      'Requires alien-specific healing methods',
      'May need to return to native environment',
      'Specialized alien research facility required',
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get healing configuration for a character's origin
 */
export function getOriginHealing(originId: number): OriginHealing | undefined {
  return ORIGIN_HEALING.find(o => o.originId === originId);
}

/**
 * Get healing configuration by origin name
 */
export function getOriginHealingByName(originName: string): OriginHealing | undefined {
  return ORIGIN_HEALING.find(o => o.originName.toLowerCase() === originName.toLowerCase());
}

/**
 * Check if a character's origin research is complete
 * This determines whether they can heal past healMax
 */
export function isOriginResearchComplete(character: GameCharacter): boolean {
  // Check character's completed research/investigation flags
  // This would be tracked in the character or game state
  const originHealing = getOriginHealing(character.origin || 1);
  if (!originHealing) return true;

  switch (originHealing.requirementFor100) {
    case 'hospital':
      return true; // Just needs to be in hospital
    case 'research':
      return character.originResearchComplete || false;
    case 'research_engineering':
      return (character.originResearchComplete && character.originEngineeringComplete) || false;
    case 'investigation':
      return character.originInvestigationComplete || false;
    case 'none':
      return false; // Aliens can never use hospitals
    default:
      return true;
  }
}

/**
 * Get current maximum healing percentage for a character
 */
export function getMaxHealingPercent(character: GameCharacter): number {
  const originHealing = getOriginHealing(character.origin || 1);
  if (!originHealing) return 100;

  if (!originHealing.canUseHospital) return 0;

  if (isOriginResearchComplete(character)) {
    return 100;
  }

  return originHealing.healMax;
}

/**
 * Roll for healing attempt
 * Uses FASERIP-style column shift system
 */
export function rollHealingAttempt(
  character: GameCharacter,
  hospitalTier: number = 1
): HealingRollResult {
  const originHealing = getOriginHealing(character.origin || 1);
  if (!originHealing || !originHealing.canUseHospital) {
    return 'fail';
  }

  // Get character's stamina rank (default to 40 if not specified)
  const staminaRank = character.stamina || 40;

  // Apply column shift modifier
  const csModifier = originHealing.healingRollModifier;

  // Hospital tier bonus (1-4 scale)
  const hospitalBonus = (hospitalTier - 1) * 5;

  // Calculate effective rank
  const effectiveRank = staminaRank + (csModifier * 10) + hospitalBonus;

  // Roll d100
  const roll = Math.floor(Math.random() * 100) + 1;

  // Determine result based on roll vs effective rank
  if (roll > effectiveRank + 30) {
    return 'fail';
  } else if (roll > effectiveRank + 10) {
    return 'minor_success';
  } else if (roll > effectiveRank - 20) {
    return 'success';
  } else {
    return 'major_success';
  }
}

/**
 * Get healing multiplier from roll result
 */
export function getHealingMultiplier(result: HealingRollResult): number {
  switch (result) {
    case 'fail': return 0;
    case 'minor_success': return 0.5;
    case 'success': return 1;
    case 'major_success': return 2;
  }
}

/**
 * Calculate healing for a character in hospital
 */
export function calculateHealing(
  character: GameCharacter,
  hospitalTier: number = 1,
  baseHealingPercent: number = 10
): HealingResult {
  const originHealing = getOriginHealing(character.origin || 1);

  // Check if character can use hospital
  if (!originHealing || !originHealing.canUseHospital) {
    return {
      success: false,
      rollResult: 'fail',
      hpHealed: 0,
      hpCapped: character.health.current,
      maxHealingReached: true,
      nextHealingIn: 0,
      message: `${originHealing?.originName || 'Unknown origin'} cannot use hospitals.`,
    };
  }

  // Roll for healing
  const rollResult = rollHealingAttempt(character, hospitalTier);
  const multiplier = getHealingMultiplier(rollResult);

  // Calculate raw healing amount
  const maxHp = character.health.maximum;
  const baseHealing = Math.floor(maxHp * (baseHealingPercent / 100));
  const rawHealing = Math.floor(baseHealing * multiplier);

  // Apply hospital tier bonus
  const tierMultiplier = 1 + (hospitalTier - 1) * 0.25; // T1: 1x, T2: 1.25x, T3: 1.5x, T4: 1.75x
  const adjustedHealing = Math.floor(rawHealing * tierMultiplier);

  // Calculate maximum allowed HP based on research status
  const maxHealingPercent = getMaxHealingPercent(character);
  const maxAllowedHp = Math.floor(maxHp * (maxHealingPercent / 100));

  // Apply healing
  const newHp = Math.min(character.health.current + adjustedHealing, maxAllowedHp);
  const actualHealing = newHp - character.health.current;

  const maxHealingReached = newHp >= maxAllowedHp && maxHealingPercent < 100;

  // Generate message
  let message = '';
  if (rollResult === 'fail') {
    message = 'Healing attempt unsuccessful. No recovery this period.';
  } else if (maxHealingReached) {
    const requirement = originHealing.requirementFor100;
    const reqText = requirement === 'research' ? 'origin research' :
                   requirement === 'research_engineering' ? 'origin research and engineering' :
                   requirement === 'investigation' ? 'origin investigation' : 'additional treatment';
    message = `Healed ${actualHealing} HP. Maximum healing (${maxHealingPercent}%) reached. Complete ${reqText} for full recovery.`;
  } else {
    const resultText = rollResult === 'minor_success' ? 'Partial' :
                      rollResult === 'major_success' ? 'Excellent' : 'Good';
    message = `${resultText} healing. Recovered ${actualHealing} HP.`;
  }

  return {
    success: rollResult !== 'fail',
    rollResult,
    hpHealed: actualHealing,
    hpCapped: newHp,
    maxHealingReached,
    nextHealingIn: originHealing.healingFrequencyHours,
    message,
  };
}

/**
 * Get hours until next healing attempt based on origin
 */
export function getHealingFrequency(character: GameCharacter): number {
  const originHealing = getOriginHealing(character.origin || 1);
  return originHealing?.healingFrequencyHours || 24;
}

/**
 * Check if character should receive a healing tick
 */
export function shouldHealTick(
  character: GameCharacter,
  hoursInHospital: number
): boolean {
  const frequency = getHealingFrequency(character);
  if (frequency === 0) return false;

  // Tick at each frequency interval
  return hoursInHospital % frequency === 0 && hoursInHospital > 0;
}

/**
 * Get descriptive text for origin's healing requirement
 */
export function getRequirementDescription(requirement: HealingRequirement): string {
  switch (requirement) {
    case 'hospital':
      return 'Hospital treatment';
    case 'research':
      return 'Origin research completion';
    case 'research_engineering':
      return 'Origin research AND engineering completion';
    case 'investigation':
      return 'Origin investigation completion';
    case 'none':
      return 'Cannot use hospitals';
  }
}

/**
 * Get all origins that can use hospitals
 */
export function getHospitalCompatibleOrigins(): OriginHealing[] {
  return ORIGIN_HEALING.filter(o => o.canUseHospital);
}

/**
 * Get origins that need research for full healing
 */
export function getOriginsNeedingResearch(): OriginHealing[] {
  return ORIGIN_HEALING.filter(o =>
    o.requirementFor100 === 'research' ||
    o.requirementFor100 === 'research_engineering'
  );
}

/**
 * Format healing roll modifier for display
 */
export function formatRollModifier(modifier: number): string {
  if (modifier === 0) return 'No modifier';
  if (modifier > 0) return `+${modifier}CS`;
  return `${modifier}CS`;
}

// ============================================================================
// TYPE EXTENSIONS
// ============================================================================

// Extend GameCharacter type with origin research flags
declare module '../types' {
  interface GameCharacter {
    originResearchComplete?: boolean;
    originEngineeringComplete?: boolean;
    originInvestigationComplete?: boolean;
    stamina?: number;
  }
}

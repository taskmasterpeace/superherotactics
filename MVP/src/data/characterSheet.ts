/**
 * Complete Character Sheet System
 *
 * This is THE master character definition that ties everything together:
 * - Primary stats (7)
 * - Derived stats (health, initiative, etc.)
 * - Origin types
 * - Threat levels
 * - Powers
 * - Skills & Talents
 * - Education & Career
 * - Equipment
 * - Health status & injuries
 * - Aging system
 * - Relationships & Reputation
 */

import { EducationLevel } from './educationSystem';
import {
  CharacterHealthStatus,
  BodyPart,
  ActiveInjury,
  ActiveStatusEffect,
} from './characterStatusSystem';
import { generateName } from './nameDatabase';
import {
  Weapon,
  getWeaponRangeModifier,
  getRangeBracketName,
} from './equipmentTypes';

// =============================================================================
// CHARACTER TYPES
// =============================================================================

/**
 * Main character categories
 * - normal: Regular human (Alpha threat level max)
 * - lsw: Lethal Super Weapon (powered individual)
 * - mutant: Born with powers (requires accelerated aging tech to create)
 * - synthetic: Android/Robot/Cyborg
 * - alien: Non-human extraterrestrial
 * - cosmic: Cosmic entity (NPCs mostly)
 */
export type CharacterType = 'normal' | 'lsw' | 'mutant' | 'synthetic' | 'alien' | 'cosmic';

// =============================================================================
// ORIGIN TYPES (9 types)
// =============================================================================

export type OriginType =
  | 'skilled_human'      // Peak human, no powers
  | 'altered_human'      // Genetically/chemically enhanced
  | 'tech_enhancement'   // Technology-based powers
  | 'mutated_human'      // Random mutation at birth
  | 'spiritual'          // Mystical/spiritual powers
  | 'synthetics'         // Android/Robot/AI
  | 'symbiotic'          // Bonded with alien symbiote
  | 'aliens'             // Non-human alien
  | 'scientific_weapon'; // Wielder of advanced tech weapon

export interface OriginInfo {
  id: OriginType;
  name: string;
  description: string;
  characterType: CharacterType;

  // Stat modifiers
  statBonuses?: Partial<Record<string, number>>;

  // Combat modifiers
  combatModifier?: string;

  // Special abilities
  specialAbilities: string[];

  // Restrictions
  restrictions?: string[];

  // Equipment access
  equipmentAccess: string;

  // Generation probability (for random gen)
  generationWeight: number;
}

export const ORIGIN_TYPES: Record<OriginType, OriginInfo> = {
  skilled_human: {
    id: 'skilled_human',
    name: 'Skilled Human',
    description: 'Highly trained normal human at peak capability',
    characterType: 'normal',
    statBonuses: { AGL: 5, INT: 3 },
    combatModifier: '+1CS to learned skills',
    specialAbilities: ['Can learn any skill quickly', 'No power restrictions'],
    equipmentAccess: 'Basic equipment only',
    generationWeight: 30,
  },
  altered_human: {
    id: 'altered_human',
    name: 'Altered Human',
    description: 'Genetically or chemically enhanced human',
    characterType: 'lsw',
    statBonuses: { STR: 3, STA: 3 },
    combatModifier: '+1CS to physical actions',
    specialAbilities: ['Enhanced physical capabilities', 'Medical equipment access'],
    equipmentAccess: 'Standard + Medical',
    generationWeight: 25,
  },
  tech_enhancement: {
    id: 'tech_enhancement',
    name: 'Tech Enhancement',
    description: 'Technology-augmented human',
    characterType: 'lsw',
    statBonuses: { STR: 5, INT: 5 },
    combatModifier: '+2CS to tech-based actions',
    specialAbilities: ['Can interface with technology', 'Advanced tech equipment'],
    restrictions: ['Requires Engineering skill'],
    equipmentAccess: 'Advanced Tech',
    generationWeight: 15,
  },
  mutated_human: {
    id: 'mutated_human',
    name: 'Mutated Human',
    description: 'Genetically mutated at birth with random powers',
    characterType: 'mutant',
    statBonuses: {}, // Random +10 to one stat, -5 to another
    combatModifier: '+3CS to mutation-related powers',
    specialAbilities: ['Unpredictable abilities', 'Power may evolve'],
    restrictions: ['Random power assignment', 'May face discrimination'],
    equipmentAccess: 'Standard',
    generationWeight: 4,
  },
  spiritual: {
    id: 'spiritual',
    name: 'Spiritual Enhancement',
    description: 'Blessed or spiritually enhanced human',
    characterType: 'lsw',
    statBonuses: { CON: 8, INT: 3 },
    combatModifier: '+2CS to spiritual powers',
    specialAbilities: ['Can sense supernatural forces', 'Mystical equipment access'],
    restrictions: ['Requires Religion/Occult skill'],
    equipmentAccess: 'Mystical',
    generationWeight: 10,
  },
  synthetics: {
    id: 'synthetics',
    name: 'Synthetics',
    description: 'Artificial being (android/cyborg/robot)',
    characterType: 'synthetic',
    statBonuses: { STR: 10, STA: 10, INT: 5 },
    combatModifier: '+2CS to logical actions, -2CS to social',
    specialAbilities: ['No food/sleep/air required', 'Built-in tech equipment'],
    restrictions: ['Cannot heal naturally', 'EMP vulnerability'],
    equipmentAccess: 'Tech Built-in',
    generationWeight: 2,
  },
  symbiotic: {
    id: 'symbiotic',
    name: 'Symbiotic',
    description: 'Bonded with alien symbiote',
    characterType: 'lsw',
    combatModifier: '+3CS when symbiote cooperates',
    specialAbilities: ['Symbiote communication', 'Symbiote-provided abilities'],
    restrictions: ['Symbiote may have own agenda', 'Requires relationship management'],
    equipmentAccess: 'Symbiote provides',
    generationWeight: 5,
  },
  aliens: {
    id: 'aliens',
    name: 'Aliens',
    description: 'Non-human alien being',
    characterType: 'alien',
    statBonuses: { STR: 5, AGL: 5, STA: 5, INT: 5, INS: 5, CON: 5 }, // All +5
    combatModifier: 'Alien physiology bonuses',
    specialAbilities: ['Alien technology knowledge', 'Alien equipment access'],
    restrictions: ['May face discrimination', 'Different physiology'],
    equipmentAccess: 'Alien',
    generationWeight: 8,
  },
  scientific_weapon: {
    id: 'scientific_weapon',
    name: 'Scientific Weapon',
    description: 'Wielder of advanced scientific weapons',
    characterType: 'lsw',
    statBonuses: { INT: 8 },
    combatModifier: '+4CS to weapon systems',
    specialAbilities: ['Can create/modify weapons', 'Prototype equipment access'],
    restrictions: ['Requires Science skill'],
    equipmentAccess: 'Prototype',
    generationWeight: 1,
  },
};

// =============================================================================
// THREAT LEVELS
// =============================================================================

export type ThreatLevel = 'alpha' | 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5' | 'cosmic';

export interface ThreatLevelInfo {
  id: ThreatLevel;
  name: string;
  description: string;

  // Stat bonuses
  statBonus: number;           // Added to all stats

  // Power limits
  maxPowers: number;
  powerStrength: string;       // Descriptor

  // Combat effectiveness
  combatEffectiveness: string;

  // Equipment access
  equipmentTier: string;

  // Generation
  generationWeight: number;    // Probability weight
  pointBudget: number;         // For balanced generation
}

export const THREAT_LEVELS: Record<ThreatLevel, ThreatLevelInfo> = {
  alpha: {
    id: 'alpha',
    name: 'Alpha (Peak Human)',
    description: 'Maximum human capability without supernatural enhancement',
    statBonus: 0,
    maxPowers: 0,
    powerStrength: 'None',
    combatEffectiveness: 'Baseline human maximum',
    equipmentTier: 'Standard',
    generationWeight: 40,
    pointBudget: 200,
  },
  level_1: {
    id: 'level_1',
    name: 'Threat Level 1',
    description: 'Low-level superhuman with single ability',
    statBonus: 5,
    maxPowers: 1,
    powerStrength: 'Minor',
    combatEffectiveness: '+5% per stat',
    equipmentTier: 'Enhanced',
    generationWeight: 35,
    pointBudget: 250,
  },
  level_2: {
    id: 'level_2',
    name: 'Threat Level 2',
    description: 'Moderate superhuman with multiple abilities',
    statBonus: 10,
    maxPowers: 3,
    powerStrength: 'Moderate',
    combatEffectiveness: '+10% per stat',
    equipmentTier: 'Military',
    generationWeight: 15,
    pointBudget: 350,
  },
  level_3: {
    id: 'level_3',
    name: 'Threat Level 3',
    description: 'Advanced superhuman with powerful abilities',
    statBonus: 15,
    maxPowers: 2,
    powerStrength: 'Major',
    combatEffectiveness: '+15% per stat',
    equipmentTier: 'Advanced Military',
    generationWeight: 7,
    pointBudget: 450,
  },
  level_4: {
    id: 'level_4',
    name: 'Threat Level 4',
    description: 'High-level superhuman breaking physical laws',
    statBonus: 25,
    maxPowers: 4,
    powerStrength: 'Extreme',
    combatEffectiveness: '+25% per stat',
    equipmentTier: 'Cutting Edge',
    generationWeight: 2.5,
    pointBudget: 600,
  },
  level_5: {
    id: 'level_5',
    name: 'Threat Level 5',
    description: 'Peak superhuman with cosmic implications',
    statBonus: 40,
    maxPowers: 5,
    powerStrength: 'Reality-affecting',
    combatEffectiveness: '+40% per stat',
    equipmentTier: 'Cosmic',
    generationWeight: 0.5,
    pointBudget: 800,
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Entity',
    description: 'Beyond mortal comprehension',
    statBonus: 100,
    maxPowers: 10,
    powerStrength: 'Universal',
    combatEffectiveness: 'Reality-defining',
    equipmentTier: 'Universal',
    generationWeight: 0, // Not randomly generated
    pointBudget: 2000,
  },
};

// =============================================================================
// PRIMARY STATS
// =============================================================================

export interface PrimaryStats {
  MEL: number;  // Melee - hand-to-hand combat
  AGL: number;  // Agility - speed, dexterity, ranged
  STR: number;  // Strength - raw power, damage
  STA: number;  // Stamina - endurance, health base
  INT: number;  // Intelligence - reasoning, tech
  INS: number;  // Instinct - intuition, awareness
  CON: number;  // Concentration - willpower, mental resistance
}

/**
 * Stat value to rank name mapping
 */
export function getStatRank(value: number): string {
  if (value <= 0) return 'None';
  if (value <= 2) return 'Feeble';
  if (value <= 5) return 'Poor';
  if (value <= 10) return 'Typical';
  if (value <= 20) return 'Good';
  if (value <= 30) return 'Excellent';
  if (value <= 40) return 'Remarkable';
  if (value <= 50) return 'Incredible';
  if (value <= 75) return 'Amazing';
  if (value <= 100) return 'Monstrous';
  if (value <= 150) return 'Unearthly';
  if (value <= 250) return 'Shift X';
  if (value <= 500) return 'Shift Y';
  if (value <= 1000) return 'Shift Z';
  if (value <= 2500) return 'Class 1000';
  if (value <= 5000) return 'Class 3000';
  if (value <= 10000) return 'Class 5000';
  return 'Beyond';
}

// =============================================================================
// DERIVED STATS
// =============================================================================

export interface DerivedStats {
  health: number;           // (STA * 2) + STR + baseHealth
  maxHealth: number;        // Same as health when undamaged
  initiative: number;       // (AGL + INS) / 2
  karma: number;            // (INT + INS + CON) / 3
  dodgeMelee: number;       // Based on AGL + INS
  dodgeRanged: number;      // Based on AGL only
  carryCapacity: number;    // Based on STR
  movementSpeed: number;    // Base 6 + modifiers
}

export function calculateDerivedStats(
  primary: PrimaryStats,
  baseHealth: number = 20
): DerivedStats {
  const health = baseHealth + (primary.STA * 2) + primary.STR;

  return {
    health,
    maxHealth: health,
    initiative: Math.floor((primary.AGL + primary.INS) / 2),
    karma: Math.floor((primary.INT + primary.INS + primary.CON) / 3),
    dodgeMelee: calculateDodgeCS(primary.AGL + primary.INS),
    dodgeRanged: calculateDodgeCS(primary.AGL),
    carryCapacity: primary.STR * 10, // In pounds
    movementSpeed: 6, // Base, modified by AGL and powers
  };
}

function calculateDodgeCS(statTotal: number): number {
  // Higher stat = better dodge (positive CS)
  if (statTotal >= 100) return 4;
  if (statTotal >= 80) return 3;
  if (statTotal >= 60) return 2;
  if (statTotal >= 45) return 1;
  if (statTotal >= 30) return 0;
  if (statTotal >= 20) return -1;
  if (statTotal >= 10) return -2;
  return -3;
}

// =============================================================================
// BIRTHDAY SYSTEM
// =============================================================================

export interface Birthday {
  month: number;      // 1-12
  day: number;        // 1-31
  zodiacSign: string; // Aries, Taurus, etc.
}

export const ZODIAC_SIGNS = [
  { sign: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
  { sign: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  { sign: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
  { sign: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  { sign: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  { sign: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  { sign: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  { sign: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  { sign: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  { sign: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  { sign: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  { sign: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
];

export function getZodiacSign(month: number, day: number): string {
  for (const zodiac of ZODIAC_SIGNS) {
    // Handle Capricorn wrapping around year end
    if (zodiac.sign === 'Capricorn') {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return 'Capricorn';
      }
    } else {
      const afterStart = month > zodiac.start.month ||
        (month === zodiac.start.month && day >= zodiac.start.day);
      const beforeEnd = month < zodiac.end.month ||
        (month === zodiac.end.month && day <= zodiac.end.day);
      if (afterStart && beforeEnd) {
        return zodiac.sign;
      }
    }
  }
  return 'Unknown';
}

export function generateRandomBirthday(): Birthday {
  const month = Math.floor(Math.random() * 12) + 1;
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const day = Math.floor(Math.random() * daysInMonth[month - 1]) + 1;
  return {
    month,
    day,
    zodiacSign: getZodiacSign(month, day),
  };
}

export function isBirthday(birthday: Birthday, currentMonth: number, currentDay: number): boolean {
  return birthday.month === currentMonth && birthday.day === currentDay;
}

/**
 * Check if birthday has passed and increment age
 * Call this during game calendar updates
 * Returns true if age was incremented (birthday passed)
 */
export function checkBirthdayAndAge(
  character: CharacterSheet,
  currentMonth: number,
  currentDay: number
): boolean {
  const { birthday } = character.aging;

  // Check if today is the birthday
  if (isBirthday(birthday, currentMonth, currentDay)) {
    // Increment age
    character.aging.currentAge += 1;
    character.aging.biologicalAge = Math.floor(character.aging.currentAge * character.aging.agingRate);
    character.aging.ageCategory = getAgeCategory(character.aging.biologicalAge);

    // Recalculate age modifiers
    character.aging.ageStatModifiers = calculateAgeModifiers(
      character.aging.biologicalAge,
      character.characterType
    );

    // Update timestamp
    character.lastUpdated = Date.now();

    // Birthday morale boost (+5)
    if (character.morale) {
      character.morale.current = Math.min(100, character.morale.current + 5);
      character.morale.level = getMoraleLevel(character.morale.current);
      character.morale.lastChange = Date.now();
      character.morale.lastChangeReason = 'Birthday!';
      character.morale.recentEvents.push({
        type: 'birthday',
        change: 5,
        timestamp: Date.now(),
        description: `${character.realName} turned ${character.aging.currentAge}!`,
      });

      // Keep only last 10 events
      if (character.morale.recentEvents.length > 10) {
        character.morale.recentEvents.shift();
      }
    }

    return true;
  }

  return false;
}

// =============================================================================
// AGING SYSTEM
// =============================================================================

export interface AgingInfo {
  birthDate: number;            // Game timestamp
  birthday: Birthday;           // Month/day for birthday events
  currentAge: number;           // In years
  agingRate: number;            // 1.0 = normal, 2.0 = twice as fast
  lifeExpectancy: number;       // Expected years
  biologicalAge: number;        // May differ from chronological
  ageCategory: AgeCategory;

  // Age-related modifiers
  ageStatModifiers: Partial<PrimaryStats>;

  // Milestones
  peakAgeStart: number;         // When stats are highest
  peakAgeEnd: number;           // When decline begins
  declineRate: number;          // Stat loss per year after peak
}

export type AgeCategory =
  | 'child'       // 0-12
  | 'teenager'    // 13-17
  | 'young_adult' // 18-25
  | 'adult'       // 26-40
  | 'middle_aged' // 41-55
  | 'senior'      // 56-70
  | 'elderly';    // 71+

export function getAgeCategory(age: number): AgeCategory {
  if (age < 13) return 'child';
  if (age < 18) return 'teenager';
  if (age < 26) return 'young_adult';
  if (age < 41) return 'adult';
  if (age < 56) return 'middle_aged';
  if (age < 71) return 'senior';
  return 'elderly';
}

export function calculateAgeModifiers(age: number, characterType: CharacterType): Partial<PrimaryStats> {
  const category = getAgeCategory(age);

  // Synthetics don't age
  if (characterType === 'synthetic') {
    return {};
  }

  // Age-based stat modifiers
  switch (category) {
    case 'child':
      return { STR: -10, STA: -5, INT: -3 };
    case 'teenager':
      return { STR: -3, INT: -1 };
    case 'young_adult':
      return { STR: 2, AGL: 2 }; // Peak physical
    case 'adult':
      return {}; // Baseline
    case 'middle_aged':
      return { STR: -2, AGL: -2, INT: 2, INS: 2 }; // Wisdom > Physical
    case 'senior':
      return { STR: -5, AGL: -5, STA: -3, INT: 3, INS: 3 };
    case 'elderly':
      return { STR: -10, AGL: -10, STA: -8, INT: 2, INS: 5 };
    default:
      return {};
  }
}

export function createAgingInfo(
  birthDate: number,
  currentGameTime: number,
  characterType: CharacterType,
  agingRate: number = 1.0,
  birthday?: Birthday
): AgingInfo {
  // Calculate age from birth date
  const gameYearsPerRealDay = 30 / 365; // 30 game days per real day, 365 days per year
  const timePassed = currentGameTime - birthDate;
  const chronologicalAge = Math.floor(timePassed * gameYearsPerRealDay);
  const biologicalAge = Math.floor(chronologicalAge * agingRate);

  // Life expectancy by type
  let lifeExpectancy = 80; // Human default
  if (characterType === 'synthetic') lifeExpectancy = 500;
  if (characterType === 'alien') lifeExpectancy = 150;
  if (characterType === 'cosmic') lifeExpectancy = 10000;

  // Generate birthday if not provided
  const actualBirthday = birthday || generateRandomBirthday();

  return {
    birthDate,
    birthday: actualBirthday,
    currentAge: chronologicalAge,
    agingRate,
    lifeExpectancy,
    biologicalAge,
    ageCategory: getAgeCategory(biologicalAge),
    ageStatModifiers: calculateAgeModifiers(biologicalAge, characterType),
    peakAgeStart: 18,
    peakAgeEnd: 35,
    declineRate: 0.5, // -0.5 to physical stats per year after 35
  };
}

// =============================================================================
// SKILLS & TALENTS
// =============================================================================

export interface CharacterSkill {
  skillId: string;
  name: string;
  level: number;        // +CS bonus
  source: 'trained' | 'education' | 'career' | 'natural' | 'power';
  experience: number;   // Progress to next level
}

export interface CharacterTalent {
  talentId: string;
  name: string;
  description: string;
  effects: string[];
}

// =============================================================================
// POWERS
// =============================================================================

export type PowerLevel = 'low' | 'medium' | 'high' | 'extreme' | 'cosmic';

export interface CharacterPower {
  powerId: string;
  name: string;
  level: PowerLevel;
  rank: number;         // Power stat value
  description: string;
  effects: string[];
  limitations?: string[];
}

// =============================================================================
// RELATIONSHIPS & REPUTATION
// =============================================================================

export interface Contact {
  contactId: string;
  name: string;
  relationship: 'family' | 'friend' | 'professional' | 'romantic' | 'enemy';
  trust: number;        // -100 to 100
  usefulness: number;   // 0 to 100
  profession: string;
}

export interface FactionStanding {
  factionId: string;
  factionName: string;
  standing: number;     // -100 to 100
  rank?: number;        // If member, their rank
  isMember: boolean;
}

export interface Reputation {
  publicReputation: number;      // -100 to 100 (villain to hero)
  mediaExposure: number;         // 0 to 100 (unknown to celebrity)
  criminalRecord: boolean;
  wantedLevel: number;           // 0 = not wanted, 5 = international manhunt
  notoriety: string[];           // Known for what
}

// =============================================================================
// MORALE SYSTEM
// =============================================================================

export type MoraleLevel = 'ecstatic' | 'high' | 'good' | 'low' | 'very_low' | 'broken';

export interface MoraleState {
  current: number;              // 0-100
  level: MoraleLevel;
  lastChange: number;           // Timestamp
  lastChangeReason: string;

  // Factors affecting morale
  recentEvents: MoraleEvent[];  // Last 10 events
  baselineMorale: number;       // Character's natural resting point (40-60 typically)

  // Combat effects at current level
  accuracyModifier: number;     // % modifier
  damageModifier: number;       // % modifier
  disobedienceRisk: number;     // % chance to refuse orders
  desertionRisk: number;        // % chance per day
}

export interface MoraleEvent {
  type: string;
  change: number;               // + or - value
  timestamp: number;
  description: string;
}

export const MORALE_EFFECTS: Record<MoraleLevel, {
  range: [number, number];
  accuracyMod: number;
  damageMod: number;
  disobedienceRisk: number;
  desertionRisk: number;
}> = {
  ecstatic: { range: [90, 100], accuracyMod: 15, damageMod: 10, disobedienceRisk: 0, desertionRisk: 0 },
  high: { range: [70, 89], accuracyMod: 10, damageMod: 5, disobedienceRisk: 0, desertionRisk: 0 },
  good: { range: [50, 69], accuracyMod: 0, damageMod: 0, disobedienceRisk: 0, desertionRisk: 0 },
  low: { range: [30, 49], accuracyMod: -10, damageMod: -5, disobedienceRisk: 5, desertionRisk: 0 },
  very_low: { range: [10, 29], accuracyMod: -20, damageMod: -10, disobedienceRisk: 15, desertionRisk: 2 },
  broken: { range: [0, 9], accuracyMod: -30, damageMod: -15, disobedienceRisk: 40, desertionRisk: 10 },
};

export const MORALE_EVENTS = {
  // Positive events
  mission_success: { change: 10, description: 'Successful mission' },
  personal_kill: { change: 5, description: 'Personal kill in combat' },
  level_up: { change: 15, description: 'Level up / skill improvement' },
  bonus_pay: { change: 10, description: 'Received bonus payment' },
  ally_saved: { change: 5, description: 'Saved an ally' },
  enemy_leader_killed: { change: 8, description: 'Enemy leader eliminated' },
  base_improvement: { change: 3, description: 'Base facilities improved' },
  good_equipment: { change: 5, description: 'Received good equipment' },
  birthday: { change: 5, description: 'Birthday celebration' },
  romance_positive: { change: 8, description: 'Romantic relationship positive' },

  // Negative events
  mission_failure: { change: -15, description: 'Mission failed' },
  ally_death: { change: -20, description: 'Ally killed' },
  ally_injured: { change: -8, description: 'Ally seriously injured' },
  pay_missed: { change: -25, description: 'Pay not received' },
  retreat_ordered: { change: -10, description: 'Forced to retreat' },
  poor_equipment: { change: -5, description: 'Using poor equipment' },
  long_deployment: { change: -3, description: 'Extended deployment (per week)' },
  leader_killed: { change: -15, description: 'Squad leader killed' },
  romance_negative: { change: -12, description: 'Romantic relationship ended' },
  friendly_fire: { change: -10, description: 'Hit by friendly fire' },
};

export function getMoraleLevel(value: number): MoraleLevel {
  if (value >= 90) return 'ecstatic';
  if (value >= 70) return 'high';
  if (value >= 50) return 'good';
  if (value >= 30) return 'low';
  if (value >= 10) return 'very_low';
  return 'broken';
}

export function createMoraleState(baselineMorale: number = 50): MoraleState {
  const level = getMoraleLevel(baselineMorale);
  const effects = MORALE_EFFECTS[level];

  return {
    current: baselineMorale,
    level,
    lastChange: Date.now(),
    lastChangeReason: 'Initial state',
    recentEvents: [],
    baselineMorale,
    accuracyModifier: effects.accuracyMod,
    damageModifier: effects.damageMod,
    disobedienceRisk: effects.disobedienceRisk,
    desertionRisk: effects.desertionRisk,
  };
}

// =============================================================================
// EMPLOYMENT & PAYMENT SYSTEM
// =============================================================================

export type ContractType = 'daily' | 'weekly' | 'monthly' | 'permanent';

export interface Employment {
  isEmployed: boolean;
  employer?: string;            // Faction or player ID
  contractType: ContractType;
  weeklyPay: number;            // Base weekly salary
  contractStart: number;        // Timestamp
  contractEnd?: number;         // Timestamp (undefined = permanent)
  payOwed: number;              // Unpaid wages
  lastPayment: number;          // Timestamp
  bonusEarned: number;          // Accumulated bonuses

  // Preferences
  minimumPay: number;           // Won't accept less
  preferredContractType: ContractType;
}

export const CONTRACT_DISCOUNTS: Record<ContractType, number> = {
  daily: 0,           // No discount
  weekly: 5,          // 5% off
  monthly: 15,        // 15% off
  permanent: 25,      // 25% off
};

export function calculateWeeklyPay(threatLevel: ThreatLevel): number {
  const basePay: Record<ThreatLevel, number> = {
    alpha: 1500,
    level_1: 2500,
    level_2: 5000,
    level_3: 10000,
    level_4: 25000,
    level_5: 75000,
    cosmic: 0, // Don't pay cosmic entities...
  };
  return basePay[threatLevel];
}

// =============================================================================
// COMBAT RECORD (KILL TRACKING)
// =============================================================================

export interface KillRecord {
  victimId: string;               // Who was killed
  victimName: string;             // For display
  weaponId: string;               // THE MURDER WEAPON - item ID
  weaponName: string;             // For display
  timestamp: number;              // When it happened
  location: string;               // City/sector where it happened
  missionId?: string;             // Which mission (if any)
  wasWitnessed: boolean;          // Were there witnesses?
  isConfirmed: boolean;           // Was body found/confirmed?
}

export interface CombatRecord {
  // Kill counts
  totalKills: number;
  confirmedKills: number;         // Body found/witnessed
  unconfirmedKills: number;       // MIA, assumed dead

  // Kill breakdown by method
  killsByWeaponType: Record<string, number>;  // 'pistol': 5, 'rifle': 12, 'knife': 3, 'unarmed': 1
  killsByPower: number;           // Killed with superpowers

  // Detailed kill log (for investigations, evidence)
  killLog: KillRecord[];          // Every kill with weapon used

  // Non-lethal stats
  knockouts: number;              // Choked out, stunned
  captures: number;               // Enemies captured alive

  // Mission stats
  missionsCompleted: number;
  missionsFailed: number;
  timesWounded: number;
  timesHospitalized: number;

  // Scrutiny (can you be tied to crimes?)
  localScrutiny: Record<string, number>;     // City ID -> suspicion level 0-100
  nationalScrutiny: Record<string, number>;  // Country code -> suspicion level 0-100
  evidenceLeft: string[];                    // Weapon IDs that could be traced to you
}

export function createCombatRecord(): CombatRecord {
  return {
    totalKills: 0,
    confirmedKills: 0,
    unconfirmedKills: 0,
    killsByWeaponType: {},
    killsByPower: 0,
    killLog: [],
    knockouts: 0,
    captures: 0,
    missionsCompleted: 0,
    missionsFailed: 0,
    timesWounded: 0,
    timesHospitalized: 0,
    localScrutiny: {},      // City police suspicion
    nationalScrutiny: {},   // National police/FBI suspicion
    evidenceLeft: [],
  };
}

/**
 * Record a kill - tracks the murder weapon!
 * Call this after combat when processing kills
 */
export function recordKill(
  record: CombatRecord,
  victimId: string,
  victimName: string,
  weaponId: string,
  weaponName: string,
  weaponType: string,          // 'pistol', 'rifle', 'knife', 'unarmed', 'power'
  cityId: string,              // City where it happened
  countryCode: string,         // Country code (for national scrutiny)
  missionId?: string,
  wasWitnessed: boolean = false
): void {
  record.totalKills++;
  record.confirmedKills++;

  // Track by weapon type
  record.killsByWeaponType[weaponType] = (record.killsByWeaponType[weaponType] || 0) + 1;

  if (weaponType === 'power') {
    record.killsByPower++;
  }

  // Add to kill log
  record.killLog.push({
    victimId,
    victimName,
    weaponId,
    weaponName,
    timestamp: Date.now(),
    location: cityId,
    missionId,
    wasWitnessed,
    isConfirmed: true,
  });

  // If witnessed, increase scrutiny
  if (wasWitnessed) {
    // Local police (city level)
    record.localScrutiny[cityId] = (record.localScrutiny[cityId] || 0) + 10;

    // National police (country level) - slower to build but harder to escape
    record.nationalScrutiny[countryCode] = (record.nationalScrutiny[countryCode] || 0) + 3;
  }

  // Track the weapon as potential evidence
  if (!record.evidenceLeft.includes(weaponId)) {
    record.evidenceLeft.push(weaponId);
  }
}

/**
 * Process kills after a battle - called when combat ends
 * Takes the battle results and updates all involved characters
 */
export interface BattleKill {
  killerId: string;
  victimId: string;
  victimName: string;
  weaponId: string;
  weaponName: string;
  weaponType: string;
  wasWitnessed: boolean;
}

export function processBattleKills(
  characters: Map<string, { combatRecord: CombatRecord }>,
  kills: BattleKill[],
  cityId: string,
  countryCode: string,
  missionId?: string
): void {
  for (const kill of kills) {
    const killer = characters.get(kill.killerId);
    if (killer) {
      recordKill(
        killer.combatRecord,
        kill.victimId,
        kill.victimName,
        kill.weaponId,
        kill.weaponName,
        kill.weaponType,
        cityId,
        countryCode,
        missionId,
        kill.wasWitnessed
      );
    }
  }
}

// =============================================================================
// MARTIAL ARTS SYSTEM
// =============================================================================

export type MartialArtStyle =
  | 'muay_thai'       // Striking - clinch brutality
  | 'boxing'          // Striking - precision DPS
  | 'judo'            // Grappling - throws
  | 'bjj'             // Grappling - submissions
  | 'krav_maga'       // Weapons/Control - CQC
  | 'eskrima'         // Weapons/Control - knife/stick
  | 'wrestling'       // Grappling - pins and control
  | 'karate'          // Striking - balanced
  | 'taekwondo';      // Striking - kicks

export type BeltRank = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black' | 'master';

export const BELT_RANKS: BeltRank[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black', 'master'];

export const BELT_REQUIREMENTS: Record<BeltRank, { xpRequired: number; canTeach: boolean; bonusCS: number }> = {
  white:  { xpRequired: 0,     canTeach: false, bonusCS: 0 },
  yellow: { xpRequired: 100,   canTeach: false, bonusCS: 1 },
  orange: { xpRequired: 300,   canTeach: false, bonusCS: 1 },
  green:  { xpRequired: 600,   canTeach: false, bonusCS: 2 },
  blue:   { xpRequired: 1000,  canTeach: false, bonusCS: 2 },
  purple: { xpRequired: 1500,  canTeach: true,  bonusCS: 3 },  // Can teach white-green
  brown:  { xpRequired: 2500,  canTeach: true,  bonusCS: 3 },  // Can teach white-blue
  black:  { xpRequired: 4000,  canTeach: true,  bonusCS: 4 },  // Can teach white-purple
  master: { xpRequired: 7000,  canTeach: true,  bonusCS: 5 },  // Can teach anyone
};

export type MartialArtFamily = 'striking' | 'grappling' | 'weapons_control';

export interface MartialArtStyleInfo {
  id: MartialArtStyle;
  name: string;
  family: MartialArtFamily;
  description: string;
  passives: string[];
  grappleSpecials: string[];

  // Stat bonuses when using this style
  clinchDamageBonus: number;      // % bonus to clinch strikes
  throwBonus: number;             // % bonus to throw success
  chokeBonus: number;             // % bonus to choke/submission
  disarmBonus: number;            // % bonus to disarm
}

export const MARTIAL_ART_STYLES: Record<MartialArtStyle, MartialArtStyleInfo> = {
  muay_thai: {
    id: 'muay_thai',
    name: 'Muay Thai',
    family: 'striking',
    description: 'Thai boxing - devastating clinch strikes with knees and elbows',
    passives: ['+CTH and damage on clinch strikes', 'Bonus Bleed/Stagger chance on head/body'],
    grappleSpecials: ['Clinch Combo', 'Knee to Wall'],
    clinchDamageBonus: 30,
    throwBonus: 0,
    chokeBonus: 0,
    disarmBonus: 0,
  },
  boxing: {
    id: 'boxing',
    name: 'Boxing',
    family: 'striking',
    description: 'Western boxing - precision punches and head movement',
    passives: ['Higher CTH and crit on strikes', 'Better melee defense (dodge/parry)'],
    grappleSpecials: ['Dirty Boxing', 'Counter Clinch'],
    clinchDamageBonus: 15,
    throwBonus: 0,
    chokeBonus: 0,
    disarmBonus: 0,
  },
  judo: {
    id: 'judo',
    name: 'Judo',
    family: 'grappling',
    description: 'Japanese throwing art - use opponent momentum against them',
    passives: ['+knockdown from throws', 'Reduced AP for grapple repositioning'],
    grappleSpecials: ['Directional Throw', 'Sacrifice Throw'],
    clinchDamageBonus: 0,
    throwBonus: 40,
    chokeBonus: 10,
    disarmBonus: 0,
  },
  bjj: {
    id: 'bjj',
    name: 'Brazilian Jiu-Jitsu',
    family: 'grappling',
    description: 'Ground fighting - submissions and positional control',
    passives: ['Big stamina damage bonus', 'Huge control bonus when target is Prone'],
    grappleSpecials: ['Rear Naked Choke', 'Joint Lock'],
    clinchDamageBonus: 0,
    throwBonus: 10,
    chokeBonus: 50,
    disarmBonus: 0,
  },
  krav_maga: {
    id: 'krav_maga',
    name: 'Krav Maga',
    family: 'weapons_control',
    description: 'Israeli military CQC - disarms and gun retention',
    passives: ['Bonus to weapon disarms', 'Reduced AP for Grapple→Disarm→Push sequences'],
    grappleSpecials: ['Gun Strip & Redirect', 'Hostage Position'],
    clinchDamageBonus: 10,
    throwBonus: 10,
    chokeBonus: 0,
    disarmBonus: 40,
  },
  eskrima: {
    id: 'eskrima',
    name: 'Eskrima / Kali',
    family: 'weapons_control',
    description: 'Filipino martial arts - knife and stick fighting',
    passives: ['+CTH and damage with knives/batons in clinch', 'Easy transition armed↔grapple'],
    grappleSpecials: ['Knife Flurry', 'Limb Strip'],
    clinchDamageBonus: 25,
    throwBonus: 0,
    chokeBonus: 0,
    disarmBonus: 30,
  },
  wrestling: {
    id: 'wrestling',
    name: 'Wrestling',
    family: 'grappling',
    description: 'Greco-Roman/Freestyle - takedowns and pins',
    passives: ['Bonus to initiating grapples', '+control in standing grapple'],
    grappleSpecials: ['Double Leg Takedown', 'Pin'],
    clinchDamageBonus: 0,
    throwBonus: 25,
    chokeBonus: 20,
    disarmBonus: 0,
  },
  karate: {
    id: 'karate',
    name: 'Karate',
    family: 'striking',
    description: 'Japanese striking - balanced punches and kicks',
    passives: ['Bonus to counter-attacks', '+damage on first strike'],
    grappleSpecials: ['Palm Strike', 'Sweep'],
    clinchDamageBonus: 10,
    throwBonus: 15,
    chokeBonus: 0,
    disarmBonus: 0,
  },
  taekwondo: {
    id: 'taekwondo',
    name: 'Taekwondo',
    family: 'striking',
    description: 'Korean martial art - powerful kicks and reach',
    passives: ['Extended melee range with kicks', 'Bonus to head kicks'],
    grappleSpecials: ['Spinning Kick', 'Push Kick'],
    clinchDamageBonus: 5,
    throwBonus: 5,
    chokeBonus: 0,
    disarmBonus: 0,
  },
};

export interface StyleProgress {
  styleId: MartialArtStyle;
  belt: BeltRank;
  xp: number;
  totalTrainingHours: number;
  trainer?: string;                // Who taught them
}

export interface MartialArtsTraining {
  // Primary style (main training)
  primaryStyle?: StyleProgress;

  // Secondary styles (cross-training)
  secondaryStyles: StyleProgress[];

  // Can this character teach?
  canTeach: boolean;
  teachingStyles: MartialArtStyle[];  // Styles they can teach

  // Current grapple state (during combat)
  isGrappling: boolean;
  grappledWith?: string;            // Character ID
  grapplePosition: 'standing' | 'ground_top' | 'ground_bottom' | 'mount' | 'back_control';
}

export function createMartialArtsTraining(): MartialArtsTraining {
  return {
    secondaryStyles: [],
    canTeach: false,
    teachingStyles: [],
    isGrappling: false,
    grapplePosition: 'standing',
  };
}

/**
 * Train in a martial art style
 */
export function trainMartialArt(
  training: MartialArtsTraining,
  styleId: MartialArtStyle,
  xpGained: number,
  hoursSpent: number
): { leveledUp: boolean; newBelt?: BeltRank } {
  // Find or create style progress
  let progress = training.primaryStyle?.styleId === styleId
    ? training.primaryStyle
    : training.secondaryStyles.find(s => s.styleId === styleId);

  if (!progress) {
    // Starting new style
    progress = {
      styleId,
      belt: 'white',
      xp: 0,
      totalTrainingHours: 0,
    };

    if (!training.primaryStyle) {
      training.primaryStyle = progress;
    } else {
      training.secondaryStyles.push(progress);
    }
  }

  progress.xp += xpGained;
  progress.totalTrainingHours += hoursSpent;

  // Check for belt promotion
  const currentBeltIndex = BELT_RANKS.indexOf(progress.belt);
  const nextBelt = BELT_RANKS[currentBeltIndex + 1];

  if (nextBelt && progress.xp >= BELT_REQUIREMENTS[nextBelt].xpRequired) {
    progress.belt = nextBelt;

    // Update teaching ability
    if (BELT_REQUIREMENTS[nextBelt].canTeach) {
      training.canTeach = true;
      if (!training.teachingStyles.includes(styleId)) {
        training.teachingStyles.push(styleId);
      }
    }

    return { leveledUp: true, newBelt: nextBelt };
  }

  return { leveledUp: false };
}

/**
 * Get total martial arts bonus for a character
 */
export function getMartialArtsBonus(training: MartialArtsTraining): {
  clinchDamage: number;
  throwBonus: number;
  chokeBonus: number;
  disarmBonus: number;
  csBonus: number;
} {
  let clinchDamage = 0;
  let throwBonus = 0;
  let chokeBonus = 0;
  let disarmBonus = 0;
  let csBonus = 0;

  if (training.primaryStyle) {
    const style = MARTIAL_ART_STYLES[training.primaryStyle.styleId];
    const beltInfo = BELT_REQUIREMENTS[training.primaryStyle.belt];

    clinchDamage += style.clinchDamageBonus;
    throwBonus += style.throwBonus;
    chokeBonus += style.chokeBonus;
    disarmBonus += style.disarmBonus;
    csBonus += beltInfo.bonusCS;
  }

  // Secondary styles give 50% bonus
  for (const secondary of training.secondaryStyles) {
    const style = MARTIAL_ART_STYLES[secondary.styleId];
    const beltInfo = BELT_REQUIREMENTS[secondary.belt];

    clinchDamage += Math.floor(style.clinchDamageBonus * 0.5);
    throwBonus += Math.floor(style.throwBonus * 0.5);
    chokeBonus += Math.floor(style.chokeBonus * 0.5);
    disarmBonus += Math.floor(style.disarmBonus * 0.5);
    csBonus += Math.floor(beltInfo.bonusCS * 0.5);
  }

  return { clinchDamage, throwBonus, chokeBonus, disarmBonus, csBonus };
}

/**
 * Generate random martial arts training for a character
 * Some characters start with martial arts based on type/origin
 */
export function generateRandomMartialArts(
  characterType: CharacterType,
  originType: OriginType
): MartialArtsTraining | undefined {
  // 30% of characters have some martial arts
  // Higher for certain origins
  let martialArtsChance = 0.3;

  if (originType === 'skilled_human') martialArtsChance = 0.6;  // Peak humans often trained
  if (originType === 'altered_human') martialArtsChance = 0.5;  // Super soldiers often trained
  if (characterType === 'alien') martialArtsChance = 0.2;       // Aliens less likely

  if (Math.random() > martialArtsChance) {
    return undefined;
  }

  const training = createMartialArtsTraining();

  // Pick a random style
  const styleIds = Object.keys(MARTIAL_ART_STYLES) as MartialArtStyle[];
  const primaryStyleId = styleIds[Math.floor(Math.random() * styleIds.length)];

  // Generate random belt (most are lower belts)
  const beltRoll = Math.random();
  let startingBelt: BeltRank = 'white';
  let startingXp = 0;

  if (beltRoll > 0.95) {
    startingBelt = 'black'; startingXp = 4000;
  } else if (beltRoll > 0.85) {
    startingBelt = 'brown'; startingXp = 2500;
  } else if (beltRoll > 0.70) {
    startingBelt = 'purple'; startingXp = 1500;
  } else if (beltRoll > 0.55) {
    startingBelt = 'blue'; startingXp = 1000;
  } else if (beltRoll > 0.40) {
    startingBelt = 'green'; startingXp = 600;
  } else if (beltRoll > 0.25) {
    startingBelt = 'orange'; startingXp = 300;
  } else if (beltRoll > 0.15) {
    startingBelt = 'yellow'; startingXp = 100;
  }

  training.primaryStyle = {
    styleId: primaryStyleId,
    belt: startingBelt,
    xp: startingXp + Math.floor(Math.random() * 100),
    totalTrainingHours: startingXp * 2,
  };

  // Update teaching ability
  if (BELT_REQUIREMENTS[startingBelt].canTeach) {
    training.canTeach = true;
    training.teachingStyles.push(primaryStyleId);
  }

  // 20% chance of secondary style if they have at least green belt
  if (BELT_RANKS.indexOf(startingBelt) >= 3 && Math.random() < 0.2) {
    const otherStyles = styleIds.filter(s => s !== primaryStyleId);
    const secondaryStyleId = otherStyles[Math.floor(Math.random() * otherStyles.length)];

    training.secondaryStyles.push({
      styleId: secondaryStyleId,
      belt: 'yellow',
      xp: 100 + Math.floor(Math.random() * 200),
      totalTrainingHours: 200,
    });
  }

  return training;
}

// =============================================================================
// SECRET STASH (HIDDEN INVENTORY)
// =============================================================================

export interface SecretStash {
  slot1?: string;               // Item ID (hidden from inspection)
  slot2?: string;               // Item ID (hidden from inspection)
  isDiscovered: boolean;        // Has player found this stash?
  discoveryDifficulty: number;  // 1-10 (how hard to find)
}

// =============================================================================
// HANDEDNESS (Simple - just left/right for combat)
// =============================================================================

export type Handedness = 'left' | 'right';

export function generateHandedness(): Handedness {
  return Math.random() < 0.9 ? 'right' : 'left';
}

// =============================================================================
// FATIGUE SYSTEM (Simplified)
// =============================================================================

export type FatigueLevel = 'rested' | 'normal' | 'tired' | 'exhausted';

export interface FatigueState {
  current: number;              // 0-100 (100 = exhausted)
  level: FatigueLevel;
  lastRest: number;             // Timestamp
}

export const FATIGUE_EFFECTS: Record<FatigueLevel, { statPenalty: number }> = {
  rested: { statPenalty: 0 },
  normal: { statPenalty: 0 },
  tired: { statPenalty: -1 },      // -1CS when tired
  exhausted: { statPenalty: -2 },  // -2CS when exhausted
};

export function getFatigueLevel(fatigue: number): FatigueLevel {
  if (fatigue <= 20) return 'rested';
  if (fatigue <= 50) return 'normal';
  if (fatigue <= 80) return 'tired';
  return 'exhausted';
}

export function createFatigueState(): FatigueState {
  return {
    current: 0,
    level: 'rested',
    lastRest: Date.now(),
  };
}

// =============================================================================
// SHIELD REGENERATION SYSTEM
// =============================================================================

/**
 * Shield types affect what damage they're good against
 * - energy: Better vs energy weapons, weaker vs ballistics
 * - kinetic: Better vs physical, weaker vs energy
 * - hybrid: Balanced protection
 */
export type ShieldType = 'energy' | 'kinetic' | 'hybrid' | 'none';

/**
 * Shield system for characters - regenerates per round in tactical combat
 *
 * Shields absorb damage BEFORE armor:
 * 1. Incoming damage hits shield first
 * 2. If shield > 0, absorb up to shield amount
 * 3. Remaining damage goes to armor/health
 * 4. Shield regenerates after not taking damage for regenDelay turns
 */
export interface ShieldState {
  // Current shield
  current: number;              // Current shield HP
  max: number;                  // Maximum shield capacity
  shieldType: ShieldType;       // What kind of shield

  // Regeneration
  regenRate: number;            // HP regenerated per turn (when active)
  regenDelay: number;           // Turns after damage before regen starts
  turnsSinceLastDamage: number; // Counter for regen delay

  // Bonuses/penalties by damage type
  energyResistMult: number;     // Multiplier vs energy damage (1.5 = 50% more effective)
  physicalResistMult: number;   // Multiplier vs physical damage
}

/**
 * Shield effectiveness multipliers by type
 */
export const SHIELD_TYPE_MODIFIERS: Record<ShieldType, { energy: number; physical: number }> = {
  energy: { energy: 1.5, physical: 0.75 },    // Good vs energy, weak vs physical
  kinetic: { energy: 0.75, physical: 1.5 },   // Good vs physical, weak vs energy
  hybrid: { energy: 1.0, physical: 1.0 },     // Balanced
  none: { energy: 0, physical: 0 },           // No shield
};

/**
 * Create a new shield state
 */
export function createShieldState(
  maxShield: number = 0,
  shieldType: ShieldType = 'none',
  regenRate: number = 5,
  regenDelay: number = 2
): ShieldState {
  const mods = SHIELD_TYPE_MODIFIERS[shieldType];
  return {
    current: maxShield,
    max: maxShield,
    shieldType,
    regenRate,
    regenDelay,
    turnsSinceLastDamage: regenDelay, // Start able to regen
    energyResistMult: mods.energy,
    physicalResistMult: mods.physical,
  };
}

/**
 * Apply damage to shield, return remaining damage that goes through
 */
export function applyDamageToShield(
  shield: ShieldState,
  damage: number,
  isEnergyDamage: boolean = false
): { shieldDamage: number; remainingDamage: number; shieldBroken: boolean } {
  if (shield.current <= 0 || shield.shieldType === 'none') {
    return { shieldDamage: 0, remainingDamage: damage, shieldBroken: false };
  }

  // Apply resistance multiplier
  const resistMult = isEnergyDamage ? shield.energyResistMult : shield.physicalResistMult;
  const effectiveShield = Math.round(shield.current * resistMult);

  // Reset regen counter - took damage
  shield.turnsSinceLastDamage = 0;

  if (effectiveShield >= damage) {
    // Shield absorbs all damage
    const actualShieldDrain = Math.round(damage / resistMult);
    shield.current = Math.max(0, shield.current - actualShieldDrain);
    return { shieldDamage: actualShieldDrain, remainingDamage: 0, shieldBroken: shield.current <= 0 };
  } else {
    // Shield breaks, remaining damage goes through
    const remainingDamage = damage - effectiveShield;
    const shieldDamage = shield.current;
    shield.current = 0;
    return { shieldDamage, remainingDamage, shieldBroken: true };
  }
}

/**
 * Process shield regeneration at end of turn
 * Call this every tactical combat turn
 */
export function processShieldRegen(shield: ShieldState): { regenAmount: number; isRegenerating: boolean } {
  if (shield.shieldType === 'none' || shield.max <= 0) {
    return { regenAmount: 0, isRegenerating: false };
  }

  // Increment turns since last damage
  shield.turnsSinceLastDamage++;

  // Check if regen delay has passed
  if (shield.turnsSinceLastDamage <= shield.regenDelay) {
    return { regenAmount: 0, isRegenerating: false };
  }

  // Shield is full
  if (shield.current >= shield.max) {
    return { regenAmount: 0, isRegenerating: false };
  }

  // Regenerate
  const regenAmount = Math.min(shield.regenRate, shield.max - shield.current);
  shield.current += regenAmount;

  return { regenAmount, isRegenerating: true };
}

/**
 * Get shield status for display
 */
export function getShieldStatus(shield: ShieldState): {
  percentage: number;
  status: 'full' | 'healthy' | 'damaged' | 'critical' | 'broken' | 'none';
  isRegenerating: boolean;
} {
  if (shield.shieldType === 'none' || shield.max <= 0) {
    return { percentage: 0, status: 'none', isRegenerating: false };
  }

  const percentage = (shield.current / shield.max) * 100;
  const isRegenerating = shield.turnsSinceLastDamage > shield.regenDelay && shield.current < shield.max;

  let status: 'full' | 'healthy' | 'damaged' | 'critical' | 'broken';
  if (percentage >= 100) status = 'full';
  else if (percentage >= 75) status = 'healthy';
  else if (percentage >= 50) status = 'damaged';
  else if (percentage > 0) status = 'critical';
  else status = 'broken';

  return { percentage, status, isRegenerating };
}

// =============================================================================
// HIT CHANCE CALCULATION SYSTEM
// =============================================================================

/**
 * Combat skill categories and their associated skills
 */
export type CombatSkillType =
  | 'firearms'        // General ranged weapons
  | 'sniper'          // Long-range precision
  | 'heavy_weapons'   // Heavy/mounted weapons
  | 'martial_arts'    // Unarmed combat
  | 'melee'           // Melee weapon combat
  | 'throwing';       // Thrown weapons

/**
 * Map skill names to combat skill types
 */
export const SKILL_TO_COMBAT_TYPE: Record<string, CombatSkillType> = {
  // Ranged combat skills
  'Shooting': 'firearms',
  'Marksmanship': 'firearms',
  'Firearms': 'firearms',
  'Pistol': 'firearms',
  'Rifle': 'firearms',
  'Sniper': 'sniper',
  'Sniping': 'sniper',
  'Heavy_Weapons': 'heavy_weapons',
  'Heavy_Arms': 'heavy_weapons',
  'Support_Weapons': 'heavy_weapons',

  // Melee combat skills
  'Martial_Arts': 'martial_arts',
  'Hand_to_Hand': 'martial_arts',
  'Unarmed': 'martial_arts',
  'Boxing': 'martial_arts',
  'Wrestling': 'martial_arts',
  'Melee': 'melee',
  'Blades': 'melee',
  'Bludgeoning': 'melee',

  // Throwing
  'Throwing': 'throwing',
  'Grenades': 'throwing',
};

/**
 * Weapon type to required combat skill type mapping
 */
export const WEAPON_TYPE_TO_SKILL: Record<string, CombatSkillType> = {
  'pistol': 'firearms',
  'smg': 'firearms',
  'rifle': 'firearms',
  'shotgun': 'firearms',
  'sniper_rifle': 'sniper',
  'heavy_machine_gun': 'heavy_weapons',
  'rocket_launcher': 'heavy_weapons',
  'grenade_launcher': 'heavy_weapons',
  'minigun': 'heavy_weapons',
  'knife': 'melee',
  'sword': 'melee',
  'club': 'melee',
  'fist': 'martial_arts',
  'unarmed': 'martial_arts',
  'grenade': 'throwing',
  'thrown': 'throwing',
};

/**
 * Distance modifiers for ranged attacks
 */
export const DISTANCE_MODIFIERS = {
  pointBlank: 15,    // 0-2 tiles: +15% hit chance
  short: 5,          // 3-5 tiles: +5%
  medium: 0,         // 6-10 tiles: no modifier
  long: -10,         // 11-15 tiles: -10%
  extreme: -25,      // 16-20 tiles: -25%
  maxRange: -40,     // 21+ tiles: -40%
};

/**
 * Get distance modifier based on tile distance
 */
export function getDistanceModifier(distance: number): number {
  if (distance <= 2) return DISTANCE_MODIFIERS.pointBlank;
  if (distance <= 5) return DISTANCE_MODIFIERS.short;
  if (distance <= 10) return DISTANCE_MODIFIERS.medium;
  if (distance <= 15) return DISTANCE_MODIFIERS.long;
  if (distance <= 20) return DISTANCE_MODIFIERS.extreme;
  return DISTANCE_MODIFIERS.maxRange;
}

/**
 * Calculate base hit chance from AGL stat
 * AGL 10 (Typical) = 50% base hit chance
 * Each point of AGL above/below 10 = +/-2%
 */
export function getBaseHitChanceFromAGL(agl: number): number {
  const baseChance = 50; // 50% at AGL 10
  const modifier = (agl - 10) * 2;
  return baseChance + modifier;
}

/**
 * Get skill bonus for a specific combat type
 * Skill level directly adds to hit chance %
 * Level 1 = +5%, Level 2 = +10%, Level 3 = +15%, etc.
 */
export function getSkillBonus(
  skills: CharacterSkill[],
  combatType: CombatSkillType
): number {
  // Find all skills that map to this combat type
  const relevantSkills = skills.filter(skill => {
    const mappedType = SKILL_TO_COMBAT_TYPE[skill.name] || SKILL_TO_COMBAT_TYPE[skill.skillId];
    return mappedType === combatType;
  });

  if (relevantSkills.length === 0) {
    return -10; // Penalty for using unfamiliar weapon type
  }

  // Use the highest level skill
  const bestSkill = relevantSkills.reduce((best, current) =>
    current.level > best.level ? current : best
  );

  // Each skill level = +5% hit chance
  return bestSkill.level * 5;
}

/**
 * Additional hit chance modifiers
 */
export interface HitChanceModifiers {
  targetMoving?: boolean;         // -10% if target moved last turn
  targetInCover?: 'partial' | 'full';  // -15% partial, -30% full
  shooterMovedThisTurn?: boolean; // -5% if shooter moved
  targetProne?: boolean;          // +10% for melee, -15% for ranged
  shooterProne?: boolean;         // +5% for sniper, -10% for others
  shooterFlanking?: boolean;      // +15% flanking bonus
  targetSuppressionLevel?: number; // Each suppression stack = -5% to target's dodge
  darkness?: boolean;             // -20% in darkness (unless NV equipped)
  smoke?: boolean;                // -30% through smoke
  aimedShot?: boolean;            // +20% for aimed shot (costs extra AP)
  burstFire?: boolean;            // -10% per shot after first
  autoFire?: boolean;             // -20% per shot after first
}

/**
 * Calculate total hit chance for an attack using weapon-specific range brackets
 *
 * Formula: AGL base + Skill bonus + Weapon Range modifier + Situation modifiers + Morale modifier
 *
 * @param attacker - Character stats
 * @param weapon - The weapon being used (or weaponType string for backwards compat)
 * @param distance - Distance to target in tiles
 * @param isRanged - Whether this is a ranged attack
 * @param modifiers - Situational modifiers
 */
export function calculateHitChance(
  attacker: {
    agl: number;
    skills: CharacterSkill[];
    moraleAccuracyMod?: number;
  },
  weapon: Weapon | string,
  distance: number,
  isRanged: boolean,
  modifiers: HitChanceModifiers = {}
): {
  totalHitChance: number;
  breakdown: {
    aglBase: number;
    skillBonus: number;
    distanceMod: number;
    rangeBracket: string;
    situationalMod: number;
    moraleMod: number;
  };
} {
  // 1. Base from AGL
  const aglBase = getBaseHitChanceFromAGL(attacker.agl);

  // 2. Determine weapon type for skill lookup
  const weaponType = typeof weapon === 'string' ? weapon : weapon.name.toLowerCase();
  const combatType = WEAPON_TYPE_TO_SKILL[weaponType] || 'firearms';
  const skillBonus = getSkillBonus(attacker.skills, combatType);

  // 3. Distance modifier - Use weapon-specific range brackets if Weapon object provided
  let distanceMod = 0;
  let rangeBracket = 'N/A';

  if (isRanged) {
    if (typeof weapon === 'object' && weapon !== null) {
      // Use weapon-specific range brackets
      distanceMod = getWeaponRangeModifier(weapon, distance);
      rangeBracket = getRangeBracketName(weapon, distance);
    } else {
      // Fallback to generic distance modifier for backwards compatibility
      distanceMod = getDistanceModifier(distance);
      if (distance <= 2) rangeBracket = 'Point Blank';
      else if (distance <= 5) rangeBracket = 'Short';
      else if (distance <= 10) rangeBracket = 'Medium';
      else if (distance <= 15) rangeBracket = 'Long';
      else if (distance <= 20) rangeBracket = 'Extreme';
      else rangeBracket = 'Max Range';
    }
  }

  // 4. Situational modifiers
  let situationalMod = 0;

  if (modifiers.targetMoving) situationalMod -= 10;
  if (modifiers.targetInCover === 'partial') situationalMod -= 15;
  if (modifiers.targetInCover === 'full') situationalMod -= 30;
  if (modifiers.shooterMovedThisTurn) situationalMod -= 5;

  if (modifiers.targetProne) {
    situationalMod += isRanged ? -15 : 10;
  }
  if (modifiers.shooterProne) {
    situationalMod += combatType === 'sniper' ? 5 : -10;
  }

  if (modifiers.shooterFlanking) situationalMod += 15;
  if (modifiers.targetSuppressionLevel) {
    situationalMod += modifiers.targetSuppressionLevel * 5; // Suppression helps attacker
  }
  if (modifiers.darkness) situationalMod -= 20;
  if (modifiers.smoke) situationalMod -= 30;
  if (modifiers.aimedShot) situationalMod += 20;
  if (modifiers.burstFire) situationalMod -= 10;
  if (modifiers.autoFire) situationalMod -= 20;

  // 5. Morale modifier
  const moraleMod = attacker.moraleAccuracyMod || 0;

  // Calculate total (out of range = -100 from range modifier = 0% after clamping)
  const totalHitChance = Math.max(0, Math.min(95,
    aglBase + skillBonus + distanceMod + situationalMod + moraleMod
  ));

  return {
    totalHitChance,
    breakdown: {
      aglBase,
      skillBonus,
      distanceMod,
      rangeBracket,
      situationalMod,
      moraleMod,
    },
  };
}

/**
 * Calculate melee hit chance (simpler than ranged)
 * Uses MEL stat instead of AGL for base
 */
export function calculateMeleeHitChance(
  attacker: {
    mel: number;
    agl: number;
    skills: CharacterSkill[];
    moraleAccuracyMod?: number;
  },
  weaponType: string,
  modifiers: HitChanceModifiers = {}
): {
  totalHitChance: number;
  breakdown: {
    melBase: number;
    aglBonus: number;
    skillBonus: number;
    situationalMod: number;
    moraleMod: number;
  };
} {
  // 1. Base from MEL stat
  const melBase = 40 + (attacker.mel - 10) * 2;

  // 2. AGL provides secondary bonus (half effect)
  const aglBonus = Math.floor((attacker.agl - 10));

  // 3. Skill bonus
  const combatType = WEAPON_TYPE_TO_SKILL[weaponType] || 'martial_arts';
  const skillBonus = getSkillBonus(attacker.skills, combatType);

  // 4. Situational modifiers (simplified for melee)
  let situationalMod = 0;
  if (modifiers.targetProne) situationalMod += 15;
  if (modifiers.shooterFlanking) situationalMod += 20; // Flanking very effective in melee
  if (modifiers.darkness) situationalMod -= 10; // Less penalty than ranged

  // 5. Morale modifier
  const moraleMod = attacker.moraleAccuracyMod || 0;

  // Calculate total
  const totalHitChance = Math.max(10, Math.min(95,
    melBase + aglBonus + skillBonus + situationalMod + moraleMod
  ));

  return {
    totalHitChance,
    breakdown: {
      melBase,
      aglBonus,
      skillBonus,
      situationalMod,
      moraleMod,
    },
  };
}

/**
 * Quick helper to get hit chance from a full character sheet
 */
export function getCharacterHitChance(
  character: CharacterSheet,
  weaponType: string,
  distance: number,
  isRanged: boolean,
  modifiers: HitChanceModifiers = {}
): number {
  if (isRanged) {
    const result = calculateHitChance(
      {
        agl: character.currentStats.AGL,
        skills: character.skills,
        moraleAccuracyMod: character.morale.accuracyModifier,
      },
      weaponType,
      distance,
      true,
      modifiers
    );
    return result.totalHitChance;
  } else {
    const result = calculateMeleeHitChance(
      {
        mel: character.currentStats.MEL,
        agl: character.currentStats.AGL,
        skills: character.skills,
        moraleAccuracyMod: character.morale.accuracyModifier,
      },
      weaponType,
      modifiers
    );
    return result.totalHitChance;
  }
}

// =============================================================================
// COMPLETE CHARACTER SHEET
// =============================================================================

export interface CharacterSheet {
  // === IDENTITY ===
  id: string;
  realName: string;
  codeName?: string;              // Hero/villain name
  hasSecretIdentity: boolean;

  // === CLASSIFICATION ===
  characterType: CharacterType;
  originType: OriginType;
  threatLevel: ThreatLevel;

  // === DEMOGRAPHICS ===
  nationality: string;            // Country code
  cultureCode: number;            // 1-14, 101-103
  gender: 'male' | 'female' | 'other';
  currentLocation: string;        // City ID

  // === AGING ===
  aging: AgingInfo;

  // === STATS ===
  baseStats: PrimaryStats;        // Before modifiers
  currentStats: PrimaryStats;     // After all modifiers
  derivedStats: DerivedStats;

  // === POWERS ===
  powers: CharacterPower[];

  // === SKILLS & TALENTS ===
  skills: CharacterSkill[];
  talents: CharacterTalent[];

  // === EDUCATION & CAREER ===
  educationLevel: EducationLevel;
  educationSpecialization?: string;
  currentCareer?: string;
  careerRank: number;
  careerHistory: string[];

  // === EQUIPMENT ===
  equippedWeapon?: string;
  equippedArmor?: string;
  inventory: string[];            // Item IDs
  secretStash: SecretStash;       // Hidden inventory (2 slots)
  wealth: number;                 // Currency

  // === HEALTH ===
  healthStatus: CharacterHealthStatus;

  // === SHIELD (Regenerative Protection) ===
  shield: ShieldState;            // Energy/kinetic shield that regenerates per turn

  // === MORALE & FATIGUE ===
  morale: MoraleState;
  fatigue: FatigueState;

  // === EMPLOYMENT ===
  employment: Employment;

  // === RELATIONSHIPS ===
  contacts: Contact[];
  factionStandings: FactionStanding[];
  reputation: Reputation;

  // === PERSONALITY (INTERNAL - NOT SHOWN TO PLAYER) ===
  // Used for AI behavior decisions, not displayed on character sheet
  personality: {
    type: string;                 // MBTI type
    volatility: number;           // 1-10 (emotional stability)
    motivation: number;           // 1-10 (moral compass)
    harmPotential: number;        // 1-10 (aggression)
  };

  // === HANDEDNESS ===
  handedness: Handedness;

  // === COMBAT RECORD ===
  combatRecord: CombatRecord;

  // === MARTIAL ARTS ===
  martialArts?: MartialArtsTraining;

  // === BACKGROUND ===
  originStory?: string;
  personalHistory?: string;
  motivations: string[];
  weaknesses: string[];

  // === META ===
  createdAt: number;
  lastUpdated: number;
  isPlayerCharacter: boolean;
  isRecruitable: boolean;
  status: 'ready' | 'busy' | 'injured' | 'traveling' | 'hospitalized' | 'on_mission' | 'training' | 'resting';
}

// =============================================================================
// STAT CALCULATION
// =============================================================================

/**
 * Calculate final stats with all modifiers applied
 */
export function calculateFinalStats(character: CharacterSheet): PrimaryStats {
  const base = { ...character.baseStats };

  // Apply origin bonuses
  const origin = ORIGIN_TYPES[character.originType];
  if (origin.statBonuses) {
    for (const [stat, bonus] of Object.entries(origin.statBonuses)) {
      (base as any)[stat] = ((base as any)[stat] || 0) + bonus;
    }
  }

  // Apply threat level bonuses
  const threat = THREAT_LEVELS[character.threatLevel];
  for (const stat of Object.keys(base) as (keyof PrimaryStats)[]) {
    base[stat] += threat.statBonus;
  }

  // Apply age modifiers
  for (const [stat, mod] of Object.entries(character.aging.ageStatModifiers)) {
    (base as any)[stat] = Math.max(1, ((base as any)[stat] || 0) + mod);
  }

  // Apply injury penalties (from health status)
  // This would integrate with characterStatusSystem.ts
  // const effective = calculateEffectiveStats(base, character.healthStatus);

  return base;
}

// =============================================================================
// CHARACTER CREATION HELPERS
// =============================================================================

/**
 * Create a blank character sheet template
 */
export function createBlankCharacter(id: string): CharacterSheet {
  const now = Date.now();

  return {
    id,
    realName: '',
    hasSecretIdentity: false,

    characterType: 'normal',
    originType: 'skilled_human',
    threatLevel: 'alpha',

    nationality: 'US',
    cultureCode: 13,
    gender: 'male',
    currentLocation: '',

    aging: createAgingInfo(now - (25 * 365 * 24 * 60 * 60 * 1000), now, 'normal'),

    baseStats: { MEL: 10, AGL: 10, STR: 10, STA: 10, INT: 10, INS: 10, CON: 10 },
    currentStats: { MEL: 10, AGL: 10, STR: 10, STA: 10, INT: 10, INS: 10, CON: 10 },
    derivedStats: calculateDerivedStats({ MEL: 10, AGL: 10, STR: 10, STA: 10, INT: 10, INS: 10, CON: 10 }),

    powers: [],
    skills: [],
    talents: [],

    educationLevel: 'high_school',
    careerRank: 1,
    careerHistory: [],

    inventory: [],
    secretStash: {
      slot1: undefined,
      slot2: undefined,
      isDiscovered: false,
      discoveryDifficulty: 5,
    },
    wealth: 0,

    healthStatus: {
      characterId: id,
      currentHealth: 50,
      maxHealth: 50,
      statusEffects: [],
      injuries: [],
      isHospitalized: false,
      lastMedicalCheckup: now,
      missingBodyParts: [],
      installedProsthetics: [],
    },

    shield: createShieldState(0, 'none'), // No shield by default

    morale: createMoraleState(50),
    fatigue: createFatigueState(),

    employment: {
      isEmployed: false,
      contractType: 'weekly',
      weeklyPay: 1500,
      contractStart: now,
      payOwed: 0,
      lastPayment: now,
      bonusEarned: 0,
      minimumPay: 1000,
      preferredContractType: 'weekly',
    },

    contacts: [],
    factionStandings: [],
    reputation: {
      publicReputation: 0,
      mediaExposure: 0,
      criminalRecord: false,
      wantedLevel: 0,
      notoriety: [],
    },

    personality: {
      type: 'ISTJ',
      volatility: 5,
      motivation: 5,
      harmPotential: 5,
    },

    handedness: 'right',

    combatRecord: createCombatRecord(),
    martialArts: undefined,  // No martial arts training by default

    motivations: [],
    weaknesses: [],

    createdAt: now,
    lastUpdated: now,
    isPlayerCharacter: false,
    isRecruitable: true,
    status: 'ready',
  };
}

// =============================================================================
// GENERATION PROBABILITIES
// =============================================================================

export const GENERATION_PROBABILITIES = {
  // Origin type weights (must sum to 100)
  origin: {
    skilled_human: 30,
    altered_human: 25,
    tech_enhancement: 15,
    spiritual: 10,
    aliens: 8,
    symbiotic: 5,
    mutated_human: 4,
    synthetics: 2,
    scientific_weapon: 1,
  },

  // Threat level weights
  threatLevel: {
    alpha: 40,
    level_1: 35,
    level_2: 15,
    level_3: 7,
    level_4: 2.5,
    level_5: 0.5,
  },

  // Power count weights
  powerCount: {
    0: 40,  // Alpha characters
    1: 35,  // Single power
    2: 15,  // Two powers
    3: 7,   // Three powers
    4: 2.5, // Four powers
    5: 0.5, // Five powers
  },

  // Gender distribution
  gender: {
    male: 50,
    female: 48,
    other: 2,
  },

  // Age distribution (in years)
  ageRange: {
    min: 18,
    max: 65,
    peak: 30,       // Most common age
    stdDev: 10,     // Standard deviation for bell curve
  },
};

// =============================================================================
// RANDOM GENERATION UTILITIES
// =============================================================================

/**
 * Select randomly from weighted options
 */
function weightedRandomSelect<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const totalWeight = entries.reduce((sum, [_, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) return key;
  }

  // Fallback to first option
  return entries[0][0];
}

/**
 * Generate a random number from normal distribution (bell curve)
 * Uses Box-Muller transform
 */
function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(mean + z * stdDev);
}

/**
 * Generate random age based on bell curve distribution
 */
export function generateRandomAge(): number {
  const { min, max, peak, stdDev } = GENERATION_PROBABILITIES.ageRange;
  let age = normalRandom(peak, stdDev);

  // Clamp to valid range
  return Math.max(min, Math.min(max, age));
}

/**
 * Generate random base stats based on point budget
 * Stats range from 3 (Poor) to 30 (Excellent) for humans
 * Higher threat levels can go higher
 */
export function generateRandomStats(threatLevel: ThreatLevel): PrimaryStats {
  const threat = THREAT_LEVELS[threatLevel];
  const budget = threat.pointBudget;

  // Distribute points across 7 stats
  // Start with minimum of 5 each (35 points)
  const stats: PrimaryStats = {
    MEL: 5,
    AGL: 5,
    STR: 5,
    STA: 5,
    INT: 5,
    INS: 5,
    CON: 5,
  };

  let remaining = budget - 35;
  const statKeys: (keyof PrimaryStats)[] = ['MEL', 'AGL', 'STR', 'STA', 'INT', 'INS', 'CON'];

  // Distribute remaining points randomly with some focus
  // 1/3 chance to "specialize" - put more in fewer stats
  const specialize = Math.random() < 0.33;

  if (specialize) {
    // Pick 2-3 stats to focus on
    const focusCount = Math.floor(Math.random() * 2) + 2;
    const focusStats = [...statKeys].sort(() => Math.random() - 0.5).slice(0, focusCount);

    while (remaining > 0) {
      const stat = focusStats[Math.floor(Math.random() * focusStats.length)];
      const add = Math.min(remaining, Math.floor(Math.random() * 5) + 1);
      stats[stat] += add;
      remaining -= add;
    }
  } else {
    // Spread more evenly
    while (remaining > 0) {
      const stat = statKeys[Math.floor(Math.random() * statKeys.length)];
      const maxAdd = threatLevel === 'alpha' ? 5 : 10;
      const add = Math.min(remaining, Math.floor(Math.random() * maxAdd) + 1);
      stats[stat] += add;
      remaining -= add;
    }
  }

  // Cap stats based on threat level
  const maxStat = threatLevel === 'alpha' ? 30 :
                  threatLevel === 'level_1' ? 40 :
                  threatLevel === 'level_2' ? 50 :
                  threatLevel === 'level_3' ? 75 :
                  threatLevel === 'level_4' ? 100 :
                  threatLevel === 'level_5' ? 150 : 500;

  for (const key of statKeys) {
    stats[key] = Math.min(stats[key], maxStat);
  }

  return stats;
}

/**
 * Determine character type from origin type
 */
export function getCharacterTypeFromOrigin(origin: OriginType): CharacterType {
  return ORIGIN_TYPES[origin].characterType;
}

/**
 * Generate education level based on age and INT
 */
export function generateEducationLevel(age: number, int: number): EducationLevel {
  if (age < 13) return 'elementary';
  if (age < 15) return 'middle_school';
  if (age < 18) return 'high_school';

  // Adults - higher INT = more education
  if (int < 10) return 'high_school';
  if (int < 15) return Math.random() < 0.7 ? 'high_school' : 'associates';
  if (int < 20) return Math.random() < 0.5 ? 'associates' : 'bachelors';
  if (int < 30) return Math.random() < 0.5 ? 'bachelors' : 'masters';
  return Math.random() < 0.7 ? 'masters' : 'doctorate';
}

// =============================================================================
// RANDOM CHARACTER GENERATOR
// =============================================================================

export interface CharacterGenerationOptions {
  // Force specific values (optional)
  forceCharacterType?: CharacterType;
  forceOriginType?: OriginType;
  forceThreatLevel?: ThreatLevel;
  forceGender?: 'male' | 'female' | 'other';
  forceAge?: number;
  forceNationality?: string;
  forceCultureCode?: number;

  // Generation constraints
  minThreatLevel?: ThreatLevel;
  maxThreatLevel?: ThreatLevel;
  minAge?: number;
  maxAge?: number;

  // Special flags
  isPlayerCharacter?: boolean;
  isRecruitable?: boolean;
  isMutant?: boolean;  // Force mutant type (for late game)
}

/**
 * Main random character generation function
 */
export function generateRandomCharacter(
  id: string,
  options: CharacterGenerationOptions = {}
): CharacterSheet {
  const now = Date.now();

  // 1. Determine threat level
  let threatLevel: ThreatLevel;
  if (options.forceThreatLevel) {
    threatLevel = options.forceThreatLevel;
  } else {
    // Filter weights based on min/max constraints
    const threatWeights = { ...GENERATION_PROBABILITIES.threatLevel };

    // Remove cosmic from random generation
    delete (threatWeights as any).cosmic;

    threatLevel = weightedRandomSelect(threatWeights as Record<ThreatLevel, number>);
  }

  // 2. Determine origin type
  let originType: OriginType;
  if (options.forceOriginType) {
    originType = options.forceOriginType;
  } else if (options.isMutant) {
    originType = 'mutated_human';
  } else {
    // Filter origins based on threat level
    const originWeights = { ...GENERATION_PROBABILITIES.origin };

    // Normal humans can only be skilled_human
    if (threatLevel === 'alpha') {
      originType = 'skilled_human';
    } else {
      // Remove mutated_human from early game (only available after research)
      if (!options.isMutant) {
        originWeights.mutated_human = 0;
      }
      originType = weightedRandomSelect(originWeights as Record<OriginType, number>);
    }
  }

  // 3. Derive character type from origin
  const characterType = options.forceCharacterType || getCharacterTypeFromOrigin(originType);

  // 4. Generate demographics
  const gender = options.forceGender || weightedRandomSelect(GENERATION_PROBABILITIES.gender as Record<'male' | 'female' | 'other', number>);

  // Age - use forced, constrained, or random
  let age: number;
  if (options.forceAge) {
    age = options.forceAge;
  } else {
    age = generateRandomAge();
    if (options.minAge) age = Math.max(age, options.minAge);
    if (options.maxAge) age = Math.min(age, options.maxAge);
  }

  // Culture/nationality - use special codes for non-humans
  let cultureCode: number;
  if (options.forceCultureCode) {
    cultureCode = options.forceCultureCode;
  } else if (characterType === 'synthetic') {
    cultureCode = 101; // Android names
  } else if (characterType === 'alien') {
    cultureCode = 102; // Alien names
  } else if (characterType === 'cosmic') {
    cultureCode = 103; // Cosmic entity names
  } else {
    cultureCode = Math.floor(Math.random() * 14) + 1; // Human cultures 1-14
  }
  const nationality = options.forceNationality || 'XX'; // Would map from culture code

  // 5. Generate base stats
  const baseStats = generateRandomStats(threatLevel);

  // 6. Apply origin bonuses
  const origin = ORIGIN_TYPES[originType];
  const statsWithOrigin = { ...baseStats };
  if (origin.statBonuses) {
    for (const [stat, bonus] of Object.entries(origin.statBonuses)) {
      (statsWithOrigin as any)[stat] = ((statsWithOrigin as any)[stat] || 0) + bonus;
    }
  }

  // 7. Create aging info
  const birthTimestamp = now - (age * 365 * 24 * 60 * 60 * 1000);
  const agingRate = characterType === 'mutant' && options.isMutant ? 2.0 : 1.0; // Mutants age faster
  const aging = createAgingInfo(birthTimestamp, now, characterType, agingRate);

  // 8. Apply age modifiers
  const currentStats = { ...statsWithOrigin };
  for (const [stat, mod] of Object.entries(aging.ageStatModifiers)) {
    (currentStats as any)[stat] = Math.max(1, ((currentStats as any)[stat] || 0) + mod);
  }

  // 9. Calculate derived stats
  const derivedStats = calculateDerivedStats(currentStats);

  // 10. Generate education based on age and INT
  const educationLevel = generateEducationLevel(age, currentStats.INT);

  // 11. Generate personality (STAM system)
  const personality = {
    type: generateMBTI(),
    volatility: Math.floor(Math.random() * 10) + 1,
    motivation: Math.floor(Math.random() * 10) + 1,
    harmPotential: Math.floor(Math.random() * 10) + 1,
  };

  // 12. Generate name based on culture code and gender
  const realName = generateName(cultureCode, gender);

  // 13. Generate baseline morale (affected by personality)
  const baselineMorale = 40 + Math.floor(Math.random() * 30); // 40-70

  // 14. Calculate weekly pay based on threat level
  const weeklyPay = calculateWeeklyPay(threatLevel);

  // 15. Build character sheet
  const character: CharacterSheet = {
    id,
    realName,
    hasSecretIdentity: characterType !== 'normal' && Math.random() < 0.6,

    characterType,
    originType,
    threatLevel,

    nationality,
    cultureCode,
    gender,
    currentLocation: '',

    aging,

    baseStats,
    currentStats,
    derivedStats,

    powers: [], // Would generate based on origin/threat level
    skills: [],
    talents: [],

    educationLevel,
    careerRank: 1,
    careerHistory: [],

    inventory: [],
    secretStash: {
      slot1: undefined,
      slot2: undefined,
      isDiscovered: false,
      discoveryDifficulty: Math.floor(Math.random() * 5) + 3, // 3-7
    },
    wealth: Math.floor(Math.random() * 10000),

    healthStatus: {
      characterId: id,
      currentHealth: derivedStats.health,
      maxHealth: derivedStats.maxHealth,
      statusEffects: [],
      injuries: [],
      isHospitalized: false,
      lastMedicalCheckup: now,
      missingBodyParts: [],
      installedProsthetics: [],
    },

    shield: createShieldState(0, 'none'), // Shield comes from equipment, not base character

    morale: createMoraleState(baselineMorale),
    fatigue: createFatigueState(),

    employment: {
      isEmployed: false,
      contractType: 'weekly',
      weeklyPay,
      contractStart: now,
      payOwed: 0,
      lastPayment: now,
      bonusEarned: 0,
      minimumPay: Math.floor(weeklyPay * 0.8), // Will accept 80% of base
      preferredContractType: Math.random() < 0.6 ? 'weekly' : 'monthly',
    },

    contacts: [],
    factionStandings: [],
    reputation: {
      publicReputation: 0,
      mediaExposure: 0,
      criminalRecord: Math.random() < 0.1, // 10% have record
      wantedLevel: 0,
      notoriety: [],
    },

    personality,

    handedness: generateHandedness(),

    combatRecord: createCombatRecord(),
    martialArts: generateRandomMartialArts(characterType, originType),

    motivations: [],
    weaknesses: [],

    createdAt: now,
    lastUpdated: now,
    isPlayerCharacter: options.isPlayerCharacter || false,
    isRecruitable: options.isRecruitable !== undefined ? options.isRecruitable : true,
    status: 'ready',
  };

  return character;
}

/**
 * Generate random MBTI type
 */
function generateMBTI(): string {
  const types = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  ];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Generate multiple random characters
 */
export function generateRandomCharacters(
  count: number,
  options: CharacterGenerationOptions = {}
): CharacterSheet[] {
  const characters: CharacterSheet[] = [];

  for (let i = 0; i < count; i++) {
    const id = `char_${Date.now()}_${i}`;
    characters.push(generateRandomCharacter(id, options));
  }

  return characters;
}

/**
 * Generate a balanced team of characters
 * Creates a mix of threat levels and origins
 */
export function generateBalancedTeam(
  teamSize: number,
  averageThreatLevel: ThreatLevel = 'level_1'
): CharacterSheet[] {
  const team: CharacterSheet[] = [];

  // Distribution based on average threat level
  const threatDistribution: Record<ThreatLevel, number> = {
    alpha: 0,
    level_1: 0,
    level_2: 0,
    level_3: 0,
    level_4: 0,
    level_5: 0,
    cosmic: 0,
  };

  // Set distribution based on average
  switch (averageThreatLevel) {
    case 'alpha':
      threatDistribution.alpha = teamSize;
      break;
    case 'level_1':
      threatDistribution.alpha = Math.floor(teamSize * 0.3);
      threatDistribution.level_1 = Math.floor(teamSize * 0.5);
      threatDistribution.level_2 = teamSize - threatDistribution.alpha - threatDistribution.level_1;
      break;
    case 'level_2':
      threatDistribution.level_1 = Math.floor(teamSize * 0.3);
      threatDistribution.level_2 = Math.floor(teamSize * 0.5);
      threatDistribution.level_3 = teamSize - threatDistribution.level_1 - threatDistribution.level_2;
      break;
    case 'level_3':
      threatDistribution.level_2 = Math.floor(teamSize * 0.3);
      threatDistribution.level_3 = Math.floor(teamSize * 0.5);
      threatDistribution.level_4 = teamSize - threatDistribution.level_2 - threatDistribution.level_3;
      break;
    default:
      threatDistribution.level_1 = teamSize; // Fallback
  }

  // Generate characters per threat level
  for (const [level, count] of Object.entries(threatDistribution)) {
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const id = `team_${Date.now()}_${team.length}`;
        team.push(generateRandomCharacter(id, {
          forceThreatLevel: level as ThreatLevel,
          isRecruitable: true,
        }));
      }
    }
  }

  return team;
}

// =============================================================================
// SOLDIER & CIVILIAN GENERATION
// =============================================================================

/**
 * Military rank based on education and experience
 */
export type MilitaryRank =
  | 'private'           // E-1 to E-3: Basic training
  | 'corporal'          // E-4: Some experience
  | 'sergeant'          // E-5 to E-6: NCO
  | 'staff_sergeant'    // E-7: Senior NCO
  | 'sergeant_major'    // E-8 to E-9: Command sergeant
  | 'lieutenant'        // O-1 to O-2: Junior officer
  | 'captain'           // O-3: Company commander
  | 'major'             // O-4: Field grade
  | 'colonel'           // O-5 to O-6: Senior field grade
  | 'general';          // O-7+: Flag officer

export interface MilitaryRankInfo {
  id: MilitaryRank;
  name: string;
  payGrade: string;
  minAge: number;
  minServiceYears: number;
  requiredEducation: EducationLevel;
  weeklyPay: number;
  commandSize: number;  // How many soldiers they can lead
}

export const MILITARY_RANKS: Record<MilitaryRank, MilitaryRankInfo> = {
  private: {
    id: 'private',
    name: 'Private',
    payGrade: 'E-2',
    minAge: 18,
    minServiceYears: 0,
    requiredEducation: 'military_basic',
    weeklyPay: 500,
    commandSize: 0,
  },
  corporal: {
    id: 'corporal',
    name: 'Corporal',
    payGrade: 'E-4',
    minAge: 20,
    minServiceYears: 2,
    requiredEducation: 'military_basic',
    weeklyPay: 700,
    commandSize: 4,
  },
  sergeant: {
    id: 'sergeant',
    name: 'Sergeant',
    payGrade: 'E-5',
    minAge: 22,
    minServiceYears: 4,
    requiredEducation: 'military_advanced',
    weeklyPay: 900,
    commandSize: 8,
  },
  staff_sergeant: {
    id: 'staff_sergeant',
    name: 'Staff Sergeant',
    payGrade: 'E-7',
    minAge: 26,
    minServiceYears: 8,
    requiredEducation: 'military_advanced',
    weeklyPay: 1200,
    commandSize: 16,
  },
  sergeant_major: {
    id: 'sergeant_major',
    name: 'Sergeant Major',
    payGrade: 'E-9',
    minAge: 32,
    minServiceYears: 14,
    requiredEducation: 'military_special',
    weeklyPay: 1500,
    commandSize: 50,
  },
  lieutenant: {
    id: 'lieutenant',
    name: 'Lieutenant',
    payGrade: 'O-2',
    minAge: 22,
    minServiceYears: 0,  // Can commission directly from academy
    requiredEducation: 'bachelors',  // Officers need degree
    weeklyPay: 1100,
    commandSize: 30,
  },
  captain: {
    id: 'captain',
    name: 'Captain',
    payGrade: 'O-3',
    minAge: 26,
    minServiceYears: 4,
    requiredEducation: 'bachelors',
    weeklyPay: 1400,
    commandSize: 100,
  },
  major: {
    id: 'major',
    name: 'Major',
    payGrade: 'O-4',
    minAge: 30,
    minServiceYears: 10,
    requiredEducation: 'masters',
    weeklyPay: 1800,
    commandSize: 300,
  },
  colonel: {
    id: 'colonel',
    name: 'Colonel',
    payGrade: 'O-6',
    minAge: 38,
    minServiceYears: 18,
    requiredEducation: 'masters',
    weeklyPay: 2500,
    commandSize: 1000,
  },
  general: {
    id: 'general',
    name: 'General',
    payGrade: 'O-8',
    minAge: 45,
    minServiceYears: 25,
    requiredEducation: 'masters',
    weeklyPay: 4000,
    commandSize: 10000,
  },
};

/**
 * Military specialization determines skills and equipment focus
 */
export type MilitarySpecialization =
  | 'infantry'          // Standard ground combat
  | 'marksman'          // Sniper/designated marksman
  | 'heavy_weapons'     // Machine guns, rockets
  | 'medic'             // Combat medic
  | 'engineer'          // Combat engineer, explosives
  | 'communications'    // Radio, signals
  | 'reconnaissance'    // Scout, forward observer
  | 'armor'             // Tank/vehicle crew
  | 'pilot'             // Air support
  | 'special_forces';   // Elite multi-role

export interface MilitarySpecInfo {
  id: MilitarySpecialization;
  name: string;
  description: string;
  statPriorities: (keyof PrimaryStats)[];
  skills: string[];
  requiredEducation: EducationLevel;
}

export const MILITARY_SPECIALIZATIONS: Record<MilitarySpecialization, MilitarySpecInfo> = {
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    description: 'Standard ground combat soldier',
    statPriorities: ['STR', 'STA', 'MEL', 'AGL'],
    skills: ['Shooting', 'Tactics', 'First_Aid', 'Driving'],
    requiredEducation: 'military_basic',
  },
  marksman: {
    id: 'marksman',
    name: 'Marksman',
    description: 'Precision shooter and sniper',
    statPriorities: ['AGL', 'INS', 'CON', 'STA'],
    skills: ['Sniper', 'Stealth', 'Camouflage', 'Spotting'],
    requiredEducation: 'military_advanced',
  },
  heavy_weapons: {
    id: 'heavy_weapons',
    name: 'Heavy Weapons',
    description: 'Machine guns, mortars, and rockets',
    statPriorities: ['STR', 'STA', 'MEL', 'AGL'],
    skills: ['Heavy_Weapons', 'Explosives', 'Tactics', 'Shooting'],
    requiredEducation: 'military_advanced',
  },
  medic: {
    id: 'medic',
    name: 'Combat Medic',
    description: 'Battlefield medical support',
    statPriorities: ['INT', 'INS', 'AGL', 'CON'],
    skills: ['Medicine', 'First_Aid', 'Surgery', 'Shooting'],
    requiredEducation: 'military_advanced',
  },
  engineer: {
    id: 'engineer',
    name: 'Combat Engineer',
    description: 'Explosives and construction',
    statPriorities: ['INT', 'AGL', 'STR', 'INS'],
    skills: ['Explosives', 'Lockpicking', 'Mechanical', 'Construction'],
    requiredEducation: 'military_advanced',
  },
  communications: {
    id: 'communications',
    name: 'Communications',
    description: 'Radio and signals specialist',
    statPriorities: ['INT', 'INS', 'CON', 'AGL'],
    skills: ['Electronics', 'Radio', 'Cryptography', 'Languages'],
    requiredEducation: 'military_advanced',
  },
  reconnaissance: {
    id: 'reconnaissance',
    name: 'Reconnaissance',
    description: 'Scout and forward observer',
    statPriorities: ['AGL', 'INS', 'STA', 'INT'],
    skills: ['Stealth', 'Tracking', 'Navigation', 'Spotting'],
    requiredEducation: 'military_advanced',
  },
  armor: {
    id: 'armor',
    name: 'Armor',
    description: 'Tank and vehicle crew',
    statPriorities: ['INT', 'AGL', 'INS', 'STR'],
    skills: ['Driving', 'Heavy_Weapons', 'Mechanical', 'Tactics'],
    requiredEducation: 'military_advanced',
  },
  pilot: {
    id: 'pilot',
    name: 'Pilot',
    description: 'Aircraft or helicopter pilot',
    statPriorities: ['AGL', 'INT', 'INS', 'CON'],
    skills: ['Pilot', 'Navigation', 'Electronics', 'Radio'],
    requiredEducation: 'military_advanced',
  },
  special_forces: {
    id: 'special_forces',
    name: 'Special Forces',
    description: 'Elite multi-role operator',
    statPriorities: ['AGL', 'STR', 'INS', 'INT', 'MEL', 'STA', 'CON'],
    skills: ['Shooting', 'Stealth', 'Explosives', 'Martial_Arts', 'Survival', 'Languages'],
    requiredEducation: 'military_special',
  },
};

/**
 * Options for soldier generation
 */
export interface SoldierGenerationOptions {
  forceGender?: 'male' | 'female' | 'other';
  forceAge?: number;
  forceNationality?: string;
  forceCultureCode?: number;
  forceRank?: MilitaryRank;
  forceSpecialization?: MilitarySpecialization;
  minAge?: number;
  maxAge?: number;
  isOfficer?: boolean;  // Generate officer vs enlisted
  isRecruitable?: boolean;
}

/**
 * Generate a soldier character (no powers, military trained)
 */
export function generateSoldier(
  id: string,
  options: SoldierGenerationOptions = {}
): CharacterSheet {
  const now = Date.now();

  // Soldiers are always normal humans at alpha threat
  const characterType: CharacterType = 'normal';
  const originType: OriginType = 'skilled_human';
  const threatLevel: ThreatLevel = 'alpha';

  // Gender (military is ~85% male historically, adjusting for game)
  const gender = options.forceGender || (Math.random() < 0.75 ? 'male' : 'female');

  // Age - military service age 18-45
  let age: number;
  if (options.forceAge) {
    age = options.forceAge;
  } else {
    // Weighted toward younger soldiers
    const ageRoll = Math.random();
    if (ageRoll < 0.4) age = 18 + Math.floor(Math.random() * 7);       // 18-24 (40%)
    else if (ageRoll < 0.7) age = 25 + Math.floor(Math.random() * 10); // 25-34 (30%)
    else if (ageRoll < 0.9) age = 35 + Math.floor(Math.random() * 8);  // 35-42 (20%)
    else age = 43 + Math.floor(Math.random() * 7);                      // 43-49 (10%)

    if (options.minAge) age = Math.max(age, options.minAge);
    if (options.maxAge) age = Math.min(age, options.maxAge);
  }

  // Service years (age - 18, capped at reasonable values)
  const serviceYears = Math.max(0, age - 18 - Math.floor(Math.random() * 4));

  // Determine if officer
  const isOfficer = options.isOfficer !== undefined
    ? options.isOfficer
    : (Math.random() < 0.15); // 15% officers

  // Determine rank based on age, service, and officer status
  let rank: MilitaryRank;
  if (options.forceRank) {
    rank = options.forceRank;
  } else if (isOfficer) {
    // Officer ranks
    if (serviceYears >= 25 && age >= 45) rank = 'general';
    else if (serviceYears >= 18 && age >= 38) rank = 'colonel';
    else if (serviceYears >= 10 && age >= 30) rank = 'major';
    else if (serviceYears >= 4 && age >= 26) rank = 'captain';
    else rank = 'lieutenant';
  } else {
    // Enlisted ranks
    if (serviceYears >= 14 && age >= 32) rank = 'sergeant_major';
    else if (serviceYears >= 8 && age >= 26) rank = 'staff_sergeant';
    else if (serviceYears >= 4 && age >= 22) rank = 'sergeant';
    else if (serviceYears >= 2 && age >= 20) rank = 'corporal';
    else rank = 'private';
  }

  const rankInfo = MILITARY_RANKS[rank];

  // Determine specialization
  let specialization: MilitarySpecialization;
  if (options.forceSpecialization) {
    specialization = options.forceSpecialization;
  } else {
    // Weight by commonality
    const specRoll = Math.random();
    if (specRoll < 0.40) specialization = 'infantry';
    else if (specRoll < 0.55) specialization = 'marksman';
    else if (specRoll < 0.65) specialization = 'heavy_weapons';
    else if (specRoll < 0.75) specialization = 'medic';
    else if (specRoll < 0.82) specialization = 'engineer';
    else if (specRoll < 0.88) specialization = 'reconnaissance';
    else if (specRoll < 0.93) specialization = 'armor';
    else if (specRoll < 0.97) specialization = 'pilot';
    else specialization = 'special_forces';
  }

  const specInfo = MILITARY_SPECIALIZATIONS[specialization];

  // Education based on rank and specialization
  let educationLevel: EducationLevel;
  if (isOfficer) {
    // Officers have at least bachelor's
    if (rank === 'major' || rank === 'colonel' || rank === 'general') {
      educationLevel = 'masters';
    } else {
      educationLevel = 'bachelors';
    }
  } else if (specialization === 'special_forces') {
    educationLevel = 'military_special';
  } else if (serviceYears >= 4) {
    educationLevel = 'military_advanced';
  } else {
    educationLevel = 'military_basic';
  }

  // Culture/nationality
  const cultureCode = options.forceCultureCode || Math.floor(Math.random() * 14) + 1;
  const nationality = options.forceNationality || 'XX';

  // Generate stats with specialization priority
  const baseStats: PrimaryStats = {
    MEL: 10 + Math.floor(Math.random() * 15),
    AGL: 10 + Math.floor(Math.random() * 15),
    STR: 10 + Math.floor(Math.random() * 15),
    STA: 10 + Math.floor(Math.random() * 15),
    INT: 8 + Math.floor(Math.random() * 12),
    INS: 8 + Math.floor(Math.random() * 12),
    CON: 8 + Math.floor(Math.random() * 12),
  };

  // Boost priority stats based on specialization
  const statBoostAmount = 3 + Math.floor(serviceYears / 3); // More experience = better stats
  for (let i = 0; i < Math.min(4, specInfo.statPriorities.length); i++) {
    const stat = specInfo.statPriorities[i];
    baseStats[stat] += statBoostAmount - i;
  }

  // Apply origin bonuses (skilled_human: AGL +5, INT +3)
  const statsWithOrigin = { ...baseStats };
  statsWithOrigin.AGL += 5;
  statsWithOrigin.INT += 3;

  // Create aging info
  const birthTimestamp = now - (age * 365 * 24 * 60 * 60 * 1000);
  const aging = createAgingInfo(birthTimestamp, now, characterType, 1.0);

  // Apply age modifiers
  const currentStats = { ...statsWithOrigin };
  for (const [stat, mod] of Object.entries(aging.ageStatModifiers)) {
    (currentStats as any)[stat] = Math.max(1, ((currentStats as any)[stat] || 0) + mod);
  }

  // Calculate derived stats
  const derivedStats = calculateDerivedStats(currentStats);

  // Generate name
  const realName = generateName(cultureCode, gender);

  // Create morale (military tends to be more stable)
  const baselineMorale = 50 + Math.floor(Math.random() * 20); // 50-70

  // Build character
  const character: CharacterSheet = {
    id,
    realName,
    codeName: `${rankInfo.name} ${realName.split(' ').pop()}`,
    hasSecretIdentity: false,

    characterType,
    originType,
    threatLevel,

    nationality,
    cultureCode,
    gender,
    currentLocation: '',

    aging,

    baseStats,
    currentStats,
    derivedStats,

    powers: [],
    skills: specInfo.skills.map(skill => ({
      name: skill,
      level: Math.min(3, 1 + Math.floor(serviceYears / 4)),  // Level 1-3 based on experience
      source: 'military_training',
    })),
    talents: [],

    educationLevel,
    educationSpecialization: specInfo.name,
    currentCareer: `Military - ${specInfo.name}`,
    careerRank: Math.floor(serviceYears / 4) + 1,
    careerHistory: [`Enlisted ${age - serviceYears}`, `${specInfo.name} training`, rankInfo.name],

    inventory: [],
    secretStash: {
      slot1: undefined,
      slot2: undefined,
      isDiscovered: false,
      discoveryDifficulty: 5,
    },
    wealth: rankInfo.weeklyPay * 4, // About a month's pay in savings

    healthStatus: {
      characterId: id,
      currentHealth: derivedStats.health,
      maxHealth: derivedStats.maxHealth,
      statusEffects: [],
      injuries: [],
      isHospitalized: false,
      lastMedicalCheckup: now,
      missingBodyParts: [],
      installedProsthetics: [],
    },

    shield: createShieldState(0, 'none'), // Soldiers don't have shields by default

    morale: createMoraleState(baselineMorale),
    fatigue: createFatigueState(),

    employment: {
      isEmployed: true,
      employer: 'Military',
      contractType: 'permanent',
      weeklyPay: rankInfo.weeklyPay,
      contractStart: now - (serviceYears * 365 * 24 * 60 * 60 * 1000),
      payOwed: 0,
      lastPayment: now,
      bonusEarned: 0,
      minimumPay: rankInfo.weeklyPay,
      preferredContractType: 'permanent',
    },

    contacts: [],
    factionStandings: [],
    reputation: {
      publicReputation: serviceYears * 2,
      mediaExposure: 0,
      criminalRecord: false,
      wantedLevel: 0,
      notoriety: [],
    },

    personality: {
      type: generateMBTI(),
      volatility: 3 + Math.floor(Math.random() * 4), // Military tends to be more stable
      motivation: 5 + Math.floor(Math.random() * 5), // Higher motivation
      harmPotential: 4 + Math.floor(Math.random() * 4),
    },

    handedness: generateHandedness(),
    combatRecord: createCombatRecord(),
    martialArts: specialization === 'special_forces'
      ? { primaryStyle: 'krav_maga', primaryBelt: 'green', xp: 500 }
      : generateRandomMartialArts(characterType, originType),

    motivations: ['Duty', 'Country', 'Comrades'],
    weaknesses: [],

    createdAt: now,
    lastUpdated: now,
    isPlayerCharacter: false,
    isRecruitable: options.isRecruitable !== undefined ? options.isRecruitable : true,
    status: 'ready',

    // Military-specific fields stored in career history
    militaryRank: rank,
    militarySpecialization: specialization,
    serviceYears,
    isOfficer,
  } as CharacterSheet & {
    militaryRank: MilitaryRank;
    militarySpecialization: MilitarySpecialization;
    serviceYears: number;
    isOfficer: boolean;
  };

  return character;
}

/**
 * Civilian career types based on education
 */
export type CivilianCareer =
  | 'unemployed'        // No job
  | 'laborer'           // Manual labor (no education required)
  | 'retail'            // Sales, service
  | 'tradesperson'      // Electrician, plumber, mechanic
  | 'office_worker'     // Admin, clerical
  | 'teacher'           // K-12 teacher
  | 'nurse'             // Healthcare
  | 'police'            // Law enforcement
  | 'firefighter'       // Emergency services
  | 'accountant'        // Finance
  | 'engineer'          // Technical engineering
  | 'programmer'        // Software development
  | 'lawyer'            // Legal
  | 'doctor'            // Physician
  | 'scientist'         // Research scientist
  | 'executive'         // Business leadership
  | 'professor'         // University professor
  | 'journalist';       // Media/writing

export interface CivilianCareerInfo {
  id: CivilianCareer;
  name: string;
  description: string;
  requiredEducation: EducationLevel;
  minINT: number;
  statPriorities: (keyof PrimaryStats)[];
  skills: string[];
  weeklyPay: number;
  socialClass: 'lower' | 'middle' | 'upper';
}

export const CIVILIAN_CAREERS: Record<CivilianCareer, CivilianCareerInfo> = {
  unemployed: {
    id: 'unemployed',
    name: 'Unemployed',
    description: 'Currently without employment',
    requiredEducation: 'none',
    minINT: 0,
    statPriorities: [],
    skills: ['Streetwise'],
    weeklyPay: 0,
    socialClass: 'lower',
  },
  laborer: {
    id: 'laborer',
    name: 'Laborer',
    description: 'Manual labor and physical work',
    requiredEducation: 'none',
    minINT: 5,
    statPriorities: ['STR', 'STA', 'AGL'],
    skills: ['Labor', 'Driving'],
    weeklyPay: 400,
    socialClass: 'lower',
  },
  retail: {
    id: 'retail',
    name: 'Retail Worker',
    description: 'Sales and customer service',
    requiredEducation: 'high_school',
    minINT: 8,
    statPriorities: ['INT', 'INS', 'CON'],
    skills: ['Persuasion', 'Streetwise'],
    weeklyPay: 450,
    socialClass: 'lower',
  },
  tradesperson: {
    id: 'tradesperson',
    name: 'Tradesperson',
    description: 'Skilled trade (electrician, plumber, mechanic)',
    requiredEducation: 'trade_school',
    minINT: 10,
    statPriorities: ['INT', 'AGL', 'STR'],
    skills: ['Mechanical', 'Electrical', 'Construction'],
    weeklyPay: 900,
    socialClass: 'middle',
  },
  office_worker: {
    id: 'office_worker',
    name: 'Office Worker',
    description: 'Administrative and clerical work',
    requiredEducation: 'high_school',
    minINT: 10,
    statPriorities: ['INT', 'CON', 'INS'],
    skills: ['Computer', 'Administration'],
    weeklyPay: 600,
    socialClass: 'middle',
  },
  teacher: {
    id: 'teacher',
    name: 'Teacher',
    description: 'K-12 education',
    requiredEducation: 'bachelors',
    minINT: 15,
    statPriorities: ['INT', 'CON', 'INS'],
    skills: ['Teaching', 'Psychology', 'Leadership'],
    weeklyPay: 800,
    socialClass: 'middle',
  },
  nurse: {
    id: 'nurse',
    name: 'Nurse',
    description: 'Healthcare nursing',
    requiredEducation: 'associates',
    minINT: 12,
    statPriorities: ['INT', 'INS', 'CON', 'AGL'],
    skills: ['Medicine', 'First_Aid', 'Psychology'],
    weeklyPay: 1000,
    socialClass: 'middle',
  },
  police: {
    id: 'police',
    name: 'Police Officer',
    description: 'Law enforcement',
    requiredEducation: 'high_school',
    minINT: 10,
    statPriorities: ['STR', 'AGL', 'INS', 'CON'],
    skills: ['Shooting', 'Investigation', 'Driving', 'Law'],
    weeklyPay: 900,
    socialClass: 'middle',
  },
  firefighter: {
    id: 'firefighter',
    name: 'Firefighter',
    description: 'Fire and rescue services',
    requiredEducation: 'high_school',
    minINT: 10,
    statPriorities: ['STR', 'STA', 'AGL', 'INS'],
    skills: ['First_Aid', 'Driving', 'Rescue'],
    weeklyPay: 850,
    socialClass: 'middle',
  },
  accountant: {
    id: 'accountant',
    name: 'Accountant',
    description: 'Financial accounting',
    requiredEducation: 'bachelors',
    minINT: 15,
    statPriorities: ['INT', 'CON', 'INS'],
    skills: ['Accounting', 'Computer', 'Law'],
    weeklyPay: 1200,
    socialClass: 'middle',
  },
  engineer: {
    id: 'engineer',
    name: 'Engineer',
    description: 'Technical engineering',
    requiredEducation: 'bachelors',
    minINT: 18,
    statPriorities: ['INT', 'INS', 'CON'],
    skills: ['Engineering', 'Computer', 'Mathematics'],
    weeklyPay: 1500,
    socialClass: 'middle',
  },
  programmer: {
    id: 'programmer',
    name: 'Software Developer',
    description: 'Software programming',
    requiredEducation: 'bachelors',
    minINT: 18,
    statPriorities: ['INT', 'CON', 'INS'],
    skills: ['Computer', 'Hacking', 'Engineering'],
    weeklyPay: 1800,
    socialClass: 'middle',
  },
  lawyer: {
    id: 'lawyer',
    name: 'Lawyer',
    description: 'Legal professional',
    requiredEducation: 'doctorate',
    minINT: 25,
    statPriorities: ['INT', 'CON', 'INS'],
    skills: ['Law', 'Persuasion', 'Investigation', 'Research'],
    weeklyPay: 2500,
    socialClass: 'upper',
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    description: 'Medical physician',
    requiredEducation: 'doctorate',
    minINT: 28,
    statPriorities: ['INT', 'INS', 'AGL', 'CON'],
    skills: ['Medicine', 'Surgery', 'Psychology', 'Research'],
    weeklyPay: 3500,
    socialClass: 'upper',
  },
  scientist: {
    id: 'scientist',
    name: 'Scientist',
    description: 'Research scientist',
    requiredEducation: 'doctorate',
    minINT: 28,
    statPriorities: ['INT', 'INS', 'CON'],
    skills: ['Research', 'Science', 'Computer', 'Mathematics'],
    weeklyPay: 2000,
    socialClass: 'upper',
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Business executive',
    requiredEducation: 'masters',
    minINT: 20,
    statPriorities: ['INT', 'CON', 'INS'],
    skills: ['Leadership', 'Persuasion', 'Administration', 'Finance'],
    weeklyPay: 4000,
    socialClass: 'upper',
  },
  professor: {
    id: 'professor',
    name: 'Professor',
    description: 'University professor',
    requiredEducation: 'doctorate',
    minINT: 30,
    statPriorities: ['INT', 'CON', 'INS'],
    skills: ['Teaching', 'Research', 'Writing'],
    weeklyPay: 1800,
    socialClass: 'upper',
  },
  journalist: {
    id: 'journalist',
    name: 'Journalist',
    description: 'News and media',
    requiredEducation: 'bachelors',
    minINT: 15,
    statPriorities: ['INT', 'INS', 'CON'],
    skills: ['Writing', 'Investigation', 'Persuasion', 'Photography'],
    weeklyPay: 1000,
    socialClass: 'middle',
  },
};

/**
 * Options for civilian generation
 */
export interface CivilianGenerationOptions {
  forceGender?: 'male' | 'female' | 'other';
  forceAge?: number;
  forceNationality?: string;
  forceCultureCode?: number;
  forceCareer?: CivilianCareer;
  forceEducation?: EducationLevel;
  minAge?: number;
  maxAge?: number;
  socialClass?: 'lower' | 'middle' | 'upper';
  isRecruitable?: boolean;
}

/**
 * Get appropriate education level based on age and INT
 */
function getEducationForCivilian(age: number, int: number): EducationLevel {
  // Education takes time
  if (age < 18) return int >= 8 ? 'high_school' : 'elementary';
  if (age < 20) return 'high_school';

  // Check what they could have achieved
  if (int >= 35 && age >= 32) return 'post_doctoral';
  if (int >= 30 && age >= 28) return 'doctorate';
  if (int >= 20 && age >= 24) return 'masters';
  if (int >= 15 && age >= 22) return 'bachelors';
  if (int >= 12 && age >= 20) return 'associates';
  if (int >= 10 && age >= 20) return 'trade_school';
  return 'high_school';
}

/**
 * Get appropriate career based on education level
 */
function getCareerForEducation(education: EducationLevel, int: number): CivilianCareer {
  // Find careers that match education
  const eligibleCareers = Object.values(CIVILIAN_CAREERS)
    .filter(c => {
      // Check education requirement
      const eduRank = getEducationRank(education);
      const reqRank = getEducationRank(c.requiredEducation);
      return eduRank >= reqRank && int >= c.minINT;
    });

  if (eligibleCareers.length === 0) return 'unemployed';

  // Weight toward better-paying jobs for higher education
  const weightedCareers = eligibleCareers.sort((a, b) => b.weeklyPay - a.weeklyPay);

  // Top 30% chance for best available, then distributed
  const roll = Math.random();
  if (roll < 0.3) return weightedCareers[0].id;
  if (roll < 0.6 && weightedCareers.length > 1) return weightedCareers[Math.floor(Math.random() * Math.min(3, weightedCareers.length))].id;

  return weightedCareers[Math.floor(Math.random() * weightedCareers.length)].id;
}

/**
 * Get numeric rank for education comparison
 */
function getEducationRank(level: EducationLevel): number {
  const ranks: Record<EducationLevel, number> = {
    'none': 0,
    'elementary': 1,
    'high_school': 2,
    'trade_school': 3,
    'associates': 3,
    'bachelors': 4,
    'masters': 5,
    'doctorate': 6,
    'post_doctoral': 7,
    'military_basic': 2,
    'military_advanced': 3,
    'military_special': 4,
    'intelligence': 4,
  };
  return ranks[level] || 0;
}

/**
 * Generate a civilian character (no powers, career-focused)
 */
export function generateCivilian(
  id: string,
  options: CivilianGenerationOptions = {}
): CharacterSheet {
  const now = Date.now();

  // Civilians are always normal humans at alpha threat
  const characterType: CharacterType = 'normal';
  const originType: OriginType = 'skilled_human';
  const threatLevel: ThreatLevel = 'alpha';

  // Gender (roughly equal)
  const gender = options.forceGender || (Math.random() < 0.5 ? 'male' : 'female');

  // Age - working age 18-70, weighted toward 25-55
  let age: number;
  if (options.forceAge) {
    age = options.forceAge;
  } else {
    const ageRoll = Math.random();
    if (ageRoll < 0.15) age = 18 + Math.floor(Math.random() * 7);       // 18-24 (15%)
    else if (ageRoll < 0.50) age = 25 + Math.floor(Math.random() * 15); // 25-39 (35%)
    else if (ageRoll < 0.80) age = 40 + Math.floor(Math.random() * 15); // 40-54 (30%)
    else age = 55 + Math.floor(Math.random() * 15);                      // 55-69 (20%)

    if (options.minAge) age = Math.max(age, options.minAge);
    if (options.maxAge) age = Math.min(age, options.maxAge);
  }

  // Culture/nationality
  const cultureCode = options.forceCultureCode || Math.floor(Math.random() * 14) + 1;
  const nationality = options.forceNationality || 'XX';

  // Generate base INT first (affects education and career)
  let baseINT: number;
  if (options.socialClass === 'upper') {
    baseINT = 20 + Math.floor(Math.random() * 20); // 20-40 for upper class
  } else if (options.socialClass === 'lower') {
    baseINT = 5 + Math.floor(Math.random() * 15);  // 5-20 for lower class
  } else {
    baseINT = 10 + Math.floor(Math.random() * 20); // 10-30 for middle class
  }

  // Determine education based on age and INT
  const educationLevel = options.forceEducation || getEducationForCivilian(age, baseINT);

  // Determine career based on education
  const career = options.forceCareer || getCareerForEducation(educationLevel, baseINT);
  const careerInfo = CIVILIAN_CAREERS[career];

  // Generate stats with career priority
  const baseStats: PrimaryStats = {
    MEL: 5 + Math.floor(Math.random() * 10),
    AGL: 5 + Math.floor(Math.random() * 10),
    STR: 5 + Math.floor(Math.random() * 10),
    STA: 5 + Math.floor(Math.random() * 10),
    INT: baseINT,
    INS: 5 + Math.floor(Math.random() * 15),
    CON: 5 + Math.floor(Math.random() * 15),
  };

  // Boost priority stats based on career
  const yearsInCareer = Math.max(0, age - 22 - Math.floor(Math.random() * 5));
  const statBoostAmount = 2 + Math.floor(yearsInCareer / 5);
  for (let i = 0; i < Math.min(3, careerInfo.statPriorities.length); i++) {
    const stat = careerInfo.statPriorities[i];
    baseStats[stat] += statBoostAmount - i;
  }

  // Apply origin bonuses (skilled_human: AGL +5, INT +3)
  const statsWithOrigin = { ...baseStats };
  statsWithOrigin.AGL += 5;
  statsWithOrigin.INT += 3;

  // Create aging info
  const birthTimestamp = now - (age * 365 * 24 * 60 * 60 * 1000);
  const aging = createAgingInfo(birthTimestamp, now, characterType, 1.0);

  // Apply age modifiers
  const currentStats = { ...statsWithOrigin };
  for (const [stat, mod] of Object.entries(aging.ageStatModifiers)) {
    (currentStats as any)[stat] = Math.max(1, ((currentStats as any)[stat] || 0) + mod);
  }

  // Calculate derived stats
  const derivedStats = calculateDerivedStats(currentStats);

  // Generate name
  const realName = generateName(cultureCode, gender);

  // Create morale (civilians more variable)
  const baselineMorale = 35 + Math.floor(Math.random() * 35); // 35-70

  // Build character
  const character: CharacterSheet = {
    id,
    realName,
    hasSecretIdentity: false,

    characterType,
    originType,
    threatLevel,

    nationality,
    cultureCode,
    gender,
    currentLocation: '',

    aging,

    baseStats,
    currentStats,
    derivedStats,

    powers: [],
    skills: careerInfo.skills.map(skill => ({
      name: skill,
      level: Math.min(3, 1 + Math.floor(yearsInCareer / 5)),
      source: careerInfo.name,
    })),
    talents: [],

    educationLevel,
    currentCareer: careerInfo.name,
    careerRank: Math.min(5, 1 + Math.floor(yearsInCareer / 5)),
    careerHistory: [careerInfo.name],

    inventory: [],
    secretStash: {
      slot1: undefined,
      slot2: undefined,
      isDiscovered: false,
      discoveryDifficulty: 4,
    },
    wealth: careerInfo.weeklyPay * 8 + Math.floor(Math.random() * careerInfo.weeklyPay * 20),

    healthStatus: {
      characterId: id,
      currentHealth: derivedStats.health,
      maxHealth: derivedStats.maxHealth,
      statusEffects: [],
      injuries: [],
      isHospitalized: false,
      lastMedicalCheckup: now,
      missingBodyParts: [],
      installedProsthetics: [],
    },

    shield: createShieldState(0, 'none'), // Civilians don't have shields by default

    morale: createMoraleState(baselineMorale),
    fatigue: createFatigueState(),

    employment: {
      isEmployed: career !== 'unemployed',
      employer: career !== 'unemployed' ? careerInfo.name : undefined,
      contractType: 'permanent',
      weeklyPay: careerInfo.weeklyPay,
      contractStart: now - (yearsInCareer * 365 * 24 * 60 * 60 * 1000),
      payOwed: 0,
      lastPayment: now,
      bonusEarned: 0,
      minimumPay: Math.floor(careerInfo.weeklyPay * 0.7),
      preferredContractType: 'monthly',
    },

    contacts: [],
    factionStandings: [],
    reputation: {
      publicReputation: careerInfo.socialClass === 'upper' ? 20 : (careerInfo.socialClass === 'middle' ? 5 : 0),
      mediaExposure: 0,
      criminalRecord: Math.random() < 0.05, // 5% have record
      wantedLevel: 0,
      notoriety: [],
    },

    personality: {
      type: generateMBTI(),
      volatility: Math.floor(Math.random() * 10) + 1,
      motivation: Math.floor(Math.random() * 10) + 1,
      harmPotential: Math.floor(Math.random() * 6) + 1, // Civilians tend lower
    },

    handedness: generateHandedness(),
    combatRecord: createCombatRecord(),
    martialArts: generateRandomMartialArts(characterType, originType),

    motivations: ['Family', 'Career', 'Money'],
    weaknesses: [],

    createdAt: now,
    lastUpdated: now,
    isPlayerCharacter: false,
    isRecruitable: options.isRecruitable !== undefined ? options.isRecruitable : true,
    status: 'ready',

    // Civilian-specific fields
    civilianCareer: career,
    socialClass: careerInfo.socialClass,
    yearsInCareer,
  } as CharacterSheet & {
    civilianCareer: CivilianCareer;
    socialClass: 'lower' | 'middle' | 'upper';
    yearsInCareer: number;
  };

  return character;
}

/**
 * Generate multiple soldiers
 */
export function generateSoldiers(
  count: number,
  options: SoldierGenerationOptions = {}
): CharacterSheet[] {
  const soldiers: CharacterSheet[] = [];
  for (let i = 0; i < count; i++) {
    const id = `soldier_${Date.now()}_${i}`;
    soldiers.push(generateSoldier(id, options));
  }
  return soldiers;
}

/**
 * Generate multiple civilians
 */
export function generateCivilians(
  count: number,
  options: CivilianGenerationOptions = {}
): CharacterSheet[] {
  const civilians: CharacterSheet[] = [];
  for (let i = 0; i < count; i++) {
    const id = `civilian_${Date.now()}_${i}`;
    civilians.push(generateCivilian(id, options));
  }
  return civilians;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Constants
  ORIGIN_TYPES,
  THREAT_LEVELS,
  GENERATION_PROBABILITIES,
  MORALE_EFFECTS,
  MORALE_EVENTS,
  CONTRACT_DISCOUNTS,
  ZODIAC_SIGNS,

  // Stat functions
  getStatRank,
  calculateDerivedStats,
  calculateFinalStats,

  // Birthday functions
  getZodiacSign,
  generateRandomBirthday,
  isBirthday,
  checkBirthdayAndAge,

  // Age functions
  getAgeCategory,
  calculateAgeModifiers,
  createAgingInfo,

  // Morale functions
  getMoraleLevel,
  createMoraleState,

  // Fatigue functions
  getFatigueLevel,
  createFatigueState,

  // Employment functions
  calculateWeeklyPay,

  // Generation functions
  generateHandedness,
  generateRandomAge,
  generateRandomStats,
  generateEducationLevel,
  getCharacterTypeFromOrigin,

  // Combat record functions
  createCombatRecord,
  recordKill,

  // Martial arts functions
  MARTIAL_ART_STYLES,
  BELT_RANKS,
  BELT_REQUIREMENTS,
  createMartialArtsTraining,
  trainMartialArt,
  getMartialArtsBonus,
  generateRandomMartialArts,

  // Character creation
  createBlankCharacter,
  generateRandomCharacter,
  generateRandomCharacters,
  generateBalancedTeam,

  // Soldier generation
  MILITARY_RANKS,
  MILITARY_SPECIALIZATIONS,
  generateSoldier,
  generateSoldiers,

  // Civilian generation
  CIVILIAN_CAREERS,
  generateCivilian,
  generateCivilians,

  // Post-battle processing
  processBattleKills,
};

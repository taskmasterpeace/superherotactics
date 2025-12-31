// =============================================================================
// HEALTHCARE SYSTEM
// =============================================================================
// Medical facilities, cloning, augmentation, injuries, and recovery

import type { PrimaryStats } from '../characterSheet';

// =============================================================================
// CRITICAL INJURIES
// =============================================================================

export type BodyPart = 'head' | 'torso' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg' | 'left_hand' | 'right_hand';
export type InjurySeverity = 'minor' | 'major' | 'critical' | 'permanent';

export interface CriticalInjury {
  id: string;
  characterId: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  type: string; // 'fracture', 'laceration', 'burn', 'nerve_damage', etc.
  description: string;
  inflictedDate: Date;
  healTimedays: number; // In-game days to heal (0 for permanent)
  statPenalties: Partial<PrimaryStats>;
  canBeHealed: boolean;
  healedDate?: Date;
}

// Body part hit modifiers (accuracy penalty to target)
export const BODY_PART_HIT_MODIFIER: Record<BodyPart, number> = {
  head: -30,
  torso: 0,
  left_arm: -10,
  right_arm: -10,
  left_leg: -10,
  right_leg: -10,
  left_hand: -20,
  right_hand: -20,
};

// Injury severity effects
export const INJURY_SEVERITY_EFFECTS: Record<InjurySeverity, {
  healTimeMultiplier: number;
  statPenaltyPercent: number;
  permanentChance: number;
}> = {
  minor: { healTimeMultiplier: 1, statPenaltyPercent: 5, permanentChance: 0 },
  major: { healTimeMultiplier: 3, statPenaltyPercent: 20, permanentChance: 10 },
  critical: { healTimeMultiplier: 10, statPenaltyPercent: 50, permanentChance: 40 },
  permanent: { healTimeMultiplier: Infinity, statPenaltyPercent: 30, permanentChance: 100 },
};

// =============================================================================
// HOSPITAL QUALITY
// =============================================================================

export interface HospitalQuality {
  tier: 'field' | 'basic' | 'standard' | 'advanced' | 'world_class';
  healingSpeedMultiplier: number;
  complicationChance: number; // % chance of healing going wrong
  canTreatCritical: boolean;
  canClone: boolean;
  canAugment: boolean;
  dailyCost: number; // Per day
}

export const HOSPITAL_TIERS: Record<string, HospitalQuality> = {
  field: {
    tier: 'field',
    healingSpeedMultiplier: 0.5,
    complicationChance: 20,
    canTreatCritical: false,
    canClone: false,
    canAugment: false,
    dailyCost: 50,
  },
  basic: {
    tier: 'basic',
    healingSpeedMultiplier: 0.75,
    complicationChance: 10,
    canTreatCritical: false,
    canClone: false,
    canAugment: false,
    dailyCost: 200,
  },
  standard: {
    tier: 'standard',
    healingSpeedMultiplier: 1.0,
    complicationChance: 5,
    canTreatCritical: true,
    canClone: false,
    canAugment: false,
    dailyCost: 500,
  },
  advanced: {
    tier: 'advanced',
    healingSpeedMultiplier: 1.5,
    complicationChance: 2,
    canTreatCritical: true,
    canClone: true,
    canAugment: true,
    dailyCost: 2000,
  },
  world_class: {
    tier: 'world_class',
    healingSpeedMultiplier: 2.0,
    complicationChance: 0.5,
    canTreatCritical: true,
    canClone: true,
    canAugment: true,
    dailyCost: 10000,
  },
};

// =============================================================================
// CLONING SYSTEM
// =============================================================================

export interface CloningResult {
  available: boolean;
  quality: number; // 0-100 (clone fidelity)
  waitTimeDays: number;
  cost: number;
  memoryTransfer: number; // 0-100 (% of memories retained)
  statLoss: Partial<PrimaryStats>; // Stats lost in transfer
}

export function calculateCloningAvailability(
  healthcare: number, // 0-100 country stat
  science: number,
  gdp: number
): CloningResult {
  // Combined formula: (Healthcare + Science * 2 + GDP/2) / 3.5
  const combined = (healthcare + science * 2 + gdp / 2) / 3.5;

  // Need 60+ combined for cloning to be available
  const available = combined >= 60;

  if (!available) {
    return {
      available: false,
      quality: 0,
      waitTimeDays: Infinity,
      cost: Infinity,
      memoryTransfer: 0,
      statLoss: {},
    };
  }

  // Quality scales from 50-100 based on combined score
  const quality = Math.min(100, 50 + (combined - 60) * 1.25);

  // Wait time: 30 days at 60 combined, down to 7 days at 100
  const waitTimeDays = Math.max(7, Math.floor(30 - (combined - 60) * 0.575));

  // Cost: $100K at 60, down to $25K at 100
  const cost = Math.max(25000, Math.floor(100000 - (combined - 60) * 1875));

  // Memory transfer: 60% at 60 combined, up to 95% at 100
  const memoryTransfer = Math.min(95, 60 + (combined - 60) * 0.875);

  // Stat loss based on quality
  const statLossPenalty = Math.max(0, Math.floor((100 - quality) / 10));
  const statLoss: Partial<PrimaryStats> = {
    INT: -statLossPenalty,
    INS: -statLossPenalty,
    MEL: -Math.floor(statLossPenalty / 2),
  };

  return {
    available,
    quality,
    waitTimeDays,
    cost,
    memoryTransfer,
    statLoss,
  };
}

// =============================================================================
// AUGMENTATION SYSTEM
// =============================================================================

export type AugmentType = 'cybernetic' | 'biological' | 'nano' | 'genetic';

export interface Augmentation {
  id: string;
  name: string;
  type: AugmentType;
  bodyPart: BodyPart | 'full_body';
  statBonuses: Partial<PrimaryStats>;
  sideEffects: string[];
  cost: number;
  installTimeDays: number;
  recoveryDays: number;
  maintenanceCostMonthly: number;
  requiredTech: number; // Minimum science score to install
}

export const BASIC_AUGMENTATIONS: Augmentation[] = [
  {
    id: 'cyber-arm',
    name: 'Cybernetic Arm',
    type: 'cybernetic',
    bodyPart: 'right_arm',
    statBonuses: { STR: 10, MEL: 5 },
    sideEffects: ['Requires maintenance', 'EMP vulnerability'],
    cost: 50000,
    installTimeDays: 3,
    recoveryDays: 14,
    maintenanceCostMonthly: 500,
    requiredTech: 70,
  },
  {
    id: 'reflex-enhancer',
    name: 'Neural Reflex Enhancer',
    type: 'nano',
    bodyPart: 'full_body',
    statBonuses: { AGL: 8, INS: 5 },
    sideEffects: ['Headaches', 'Requires monthly calibration'],
    cost: 75000,
    installTimeDays: 1,
    recoveryDays: 7,
    maintenanceCostMonthly: 1000,
    requiredTech: 80,
  },
  {
    id: 'muscle-weave',
    name: 'Synthetic Muscle Weave',
    type: 'biological',
    bodyPart: 'full_body',
    statBonuses: { STR: 15, STA: 10 },
    sideEffects: ['Increased appetite', 'Vulnerability to toxins'],
    cost: 100000,
    installTimeDays: 5,
    recoveryDays: 30,
    maintenanceCostMonthly: 200,
    requiredTech: 75,
  },
];

// =============================================================================
// HOSPITAL QUALITY CALCULATION
// =============================================================================

export function calculateHospitalTier(
  healthcare: number,
  gdp: number,
  lifestyle: number
): HospitalQuality {
  // Combined formula
  const combined = (healthcare * 2 + gdp + lifestyle) / 4;

  if (combined >= 85) return HOSPITAL_TIERS.world_class;
  if (combined >= 70) return HOSPITAL_TIERS.advanced;
  if (combined >= 50) return HOSPITAL_TIERS.standard;
  if (combined >= 30) return HOSPITAL_TIERS.basic;
  return HOSPITAL_TIERS.field;
}

// =============================================================================
// INJURY GENERATION
// =============================================================================

export function generateInjury(
  characterId: string,
  bodyPart: BodyPart,
  damageReceived: number,
  damageType: string
): CriticalInjury | null {
  // Only generate injury if damage exceeds threshold
  const threshold = bodyPart === 'head' ? 15 : bodyPart === 'torso' ? 25 : 20;
  if (damageReceived < threshold) return null;

  // Determine severity based on damage
  let severity: InjurySeverity;
  if (damageReceived >= 60) severity = 'critical';
  else if (damageReceived >= 40) severity = 'major';
  else severity = 'minor';

  // Check for permanent injury
  const effects = INJURY_SEVERITY_EFFECTS[severity];
  const permanentRoll = Math.random() * 100;
  if (permanentRoll < effects.permanentChance) {
    severity = 'permanent';
  }

  // Generate injury details
  const injuryTypes: Record<string, string[]> = {
    physical: ['fracture', 'laceration', 'contusion', 'dislocation'],
    bleed: ['deep_laceration', 'arterial_damage', 'hemorrhage'],
    burn: ['first_degree_burn', 'second_degree_burn', 'third_degree_burn'],
    energy: ['nerve_damage', 'radiation_burn', 'internal_damage'],
  };

  const types = injuryTypes[damageType] || injuryTypes.physical;
  const type = types[Math.floor(Math.random() * types.length)];

  // Calculate heal time (base 3 days for minor)
  const baseHealTime = 3;
  const healTimedays = severity === 'permanent' ? 0 :
    Math.floor(baseHealTime * effects.healTimeMultiplier);

  // Calculate stat penalties
  const penaltyAmount = Math.floor(effects.statPenaltyPercent / 5);
  const statPenalties: Partial<PrimaryStats> = {};

  switch (bodyPart) {
    case 'head':
      statPenalties.INT = -penaltyAmount;
      statPenalties.INS = -penaltyAmount;
      break;
    case 'torso':
      statPenalties.STA = -penaltyAmount;
      statPenalties.CON = -penaltyAmount;
      break;
    case 'left_arm':
    case 'right_arm':
      statPenalties.STR = -penaltyAmount;
      statPenalties.MEL = -Math.floor(penaltyAmount / 2);
      break;
    case 'left_leg':
    case 'right_leg':
      statPenalties.AGL = -penaltyAmount;
      statPenalties.STA = -Math.floor(penaltyAmount / 2);
      break;
    case 'left_hand':
    case 'right_hand':
      statPenalties.MEL = -penaltyAmount;
      break;
  }

  return {
    id: `injury-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    characterId,
    bodyPart,
    severity,
    type,
    description: `${severity} ${type.replace('_', ' ')} to ${bodyPart.replace('_', ' ')}`,
    inflictedDate: new Date(),
    healTimedays,
    statPenalties,
    canBeHealed: severity !== 'permanent',
  };
}

/**
 * Character Status, Injury, and Recovery System
 *
 * This system tracks:
 * - Character health and status effects (persistent across battle/world map)
 * - Body-part specific injuries with weapon-appropriate outcomes
 * - Recovery based on location (hospital, base, field) and medical care quality
 * - Prosthetics and permanent disabilities
 */

import type { DamageSubType } from './equipmentTypes';

// =============================================================================
// BODY PARTS & TARGETING
// =============================================================================

export type BodyPart =
  | 'head'
  | 'chest'
  | 'abdomen'
  | 'left_arm'
  | 'right_arm'
  | 'left_leg'
  | 'right_leg'
  | 'left_hand'
  | 'right_hand'
  | 'left_foot'
  | 'right_foot';

export interface BodyPartInfo {
  id: BodyPart;
  name: string;
  targetPenalty: number;      // -CS to hit when targeting this part
  criticalOrgan: boolean;     // Can cause death if destroyed
  vitalityPercent: number;    // What % of health this part represents
  canAmputate: boolean;       // Can this part be removed?
  connectedTo?: BodyPart;     // Parent body part (hand connects to arm)
}

export const BODY_PARTS: Record<BodyPart, BodyPartInfo> = {
  head: {
    id: 'head',
    name: 'Head',
    targetPenalty: -4,
    criticalOrgan: true,
    vitalityPercent: 100,     // Destroy head = death
    canAmputate: false,       // Can't amputate head and survive
  },
  chest: {
    id: 'chest',
    name: 'Chest',
    targetPenalty: 0,         // Default target
    criticalOrgan: true,
    vitalityPercent: 100,
    canAmputate: false,
  },
  abdomen: {
    id: 'abdomen',
    name: 'Abdomen',
    targetPenalty: -1,
    criticalOrgan: true,
    vitalityPercent: 80,
    canAmputate: false,
  },
  left_arm: {
    id: 'left_arm',
    name: 'Left Arm',
    targetPenalty: -2,
    criticalOrgan: false,
    vitalityPercent: 15,
    canAmputate: true,
  },
  right_arm: {
    id: 'right_arm',
    name: 'Right Arm',
    targetPenalty: -2,
    criticalOrgan: false,
    vitalityPercent: 15,
    canAmputate: true,
  },
  left_leg: {
    id: 'left_leg',
    name: 'Left Leg',
    targetPenalty: -2,
    criticalOrgan: false,
    vitalityPercent: 20,
    canAmputate: true,
  },
  right_leg: {
    id: 'right_leg',
    name: 'Right Leg',
    targetPenalty: -2,
    criticalOrgan: false,
    vitalityPercent: 20,
    canAmputate: true,
  },
  left_hand: {
    id: 'left_hand',
    name: 'Left Hand',
    targetPenalty: -3,
    criticalOrgan: false,
    vitalityPercent: 5,
    canAmputate: true,
    connectedTo: 'left_arm',
  },
  right_hand: {
    id: 'right_hand',
    name: 'Right Hand',
    targetPenalty: -3,
    criticalOrgan: false,
    vitalityPercent: 5,
    canAmputate: true,
    connectedTo: 'right_arm',
  },
  left_foot: {
    id: 'left_foot',
    name: 'Left Foot',
    targetPenalty: -3,
    criticalOrgan: false,
    vitalityPercent: 5,
    canAmputate: true,
    connectedTo: 'left_leg',
  },
  right_foot: {
    id: 'right_foot',
    name: 'Right Foot',
    targetPenalty: -3,
    criticalOrgan: false,
    vitalityPercent: 5,
    canAmputate: true,
    connectedTo: 'right_leg',
  },
};

// =============================================================================
// DAMAGE TYPES & WEAPON CATEGORIES
// =============================================================================

export type DamageType =
  | 'blunt'           // Clubs, fists, falls
  | 'piercing'        // Bullets, arrows, stabs
  | 'slashing'        // Swords, knives (cutting)
  | 'explosive'       // Grenades, rockets
  | 'fire'            // Flames, incendiary
  | 'electrical'      // Tasers, lightning
  | 'energy'          // Lasers, plasma
  | 'sonic'           // Sound-based
  | 'cold'            // Ice, cryogenic
  | 'radiation'       // Nuclear
  | 'psychic'         // Mental attacks
  | 'chemical';       // Pepper spray, tear gas, poison gas (no physical injury, status effects only)

/**
 * Maps weapon DamageSubType (from equipmentTypes.ts) to injury DamageType
 * Used when determining what kind of injuries a weapon causes
 */
export const DAMAGE_SUBTYPE_TO_INJURY: Record<DamageSubType, DamageType> = {
  // Melee weapons
  'EDGED_MELEE': 'slashing',      // Swords, axes
  'SMASHING_MELEE': 'blunt',      // Clubs, hammers
  'PIERCING_MELEE': 'piercing',   // Spears, daggers

  // Ranged ballistics
  'GUNFIRE': 'piercing',          // Bullets
  'BUCKSHOT': 'piercing',         // Shotgun pellets
  'SLUG': 'piercing',             // Shotgun slugs
  'ARROW': 'piercing',            // Bow arrows
  'BOLT': 'piercing',             // Crossbow bolts
  'THROWN': 'blunt',              // Thrown objects (can be piercing with knives)

  // Explosives
  'EXPLOSION': 'explosive',       // Direct blast
  'SHRAPNEL': 'piercing',         // Fragmentation

  // Energy weapons
  'LASER': 'energy',              // Laser burns
  'PLASMA': 'energy',             // Plasma burns
  'THERMAL': 'fire',              // Heat-based
  'ICE': 'cold',                  // Cryo weapons
  'ELECTRICAL': 'electrical',     // Tasers, lightning
  'SONIC': 'sonic',               // Sound weapons
  'PURE_ENERGY': 'energy',        // Generic energy
  'DISINTEGRATION': 'energy',     // Disintegrators

  // Special effects
  'CONCUSSIVE': 'blunt',          // Knockback/stun
  'STUN': 'electrical',           // Non-lethal stun
  'FIRE': 'fire',                 // Incendiary
  'FLASH': 'blunt',               // Flashbang (non-damaging but blunt for system)
  'GAS': 'chemical',              // Pepper spray, tear gas - causes blindness/coughing, no physical injury
  'SMOKE': 'blunt',               // Smoke grenades (no damage, just vision block)
  'EMP': 'electrical',            // EMP effects
  'ENTANGLE': 'blunt',            // Nets, webbing
};

/**
 * Damage types that don't cause physical injuries
 * These cause status effects instead of rolling on injury tables
 */
export const NON_INJURY_DAMAGE_TYPES: DamageType[] = ['chemical', 'psychic'];

/**
 * Check if a damage type causes physical injuries or just status effects
 */
export function causesPhysicalInjury(damageType: DamageType): boolean {
  return !NON_INJURY_DAMAGE_TYPES.includes(damageType);
}

/**
 * Converts a weapon's DamageSubType to the injury system's DamageType
 */
export function getInjuryDamageType(weaponSubType: DamageSubType): DamageType {
  return DAMAGE_SUBTYPE_TO_INJURY[weaponSubType] || 'blunt';
}

export type WeaponPower = 'light' | 'medium' | 'heavy' | 'extreme' | 'superhuman';

// What weapon power can cause what injuries
export const WEAPON_POWER_THRESHOLDS = {
  light: { maxDamage: 15, canAmputate: false, canDecapitate: false },      // .22, knife
  medium: { maxDamage: 25, canAmputate: false, canDecapitate: false },     // .38, 9mm
  heavy: { maxDamage: 40, canAmputate: true, canDecapitate: false },       // .45, rifle, shotgun
  extreme: { maxDamage: 60, canAmputate: true, canDecapitate: false },     // Anti-materiel, explosives
  superhuman: { maxDamage: 999, canAmputate: true, canDecapitate: true },  // Super strength, cosmic
};

// =============================================================================
// STATUS EFFECTS
// =============================================================================

export type StatusEffectCategory =
  | 'physical'      // Bleeding, burning, etc.
  | 'mental'        // Fear, confusion, mind control
  | 'medical'       // Disease, poison, radiation
  | 'combat'        // Stunned, prone, grappled
  | 'environmental' // Cold, heat, pressure
  | 'supernatural'; // Magic, psychic, cosmic

export type StatusSeverity = 1 | 2 | 3; // Light, Moderate, Severe

export interface StatusEffect {
  id: string;
  name: string;
  category: StatusEffectCategory;
  severity: StatusSeverity;
  description: string;

  // Duration
  durationType: 'turns' | 'hours' | 'days' | 'until_treated' | 'permanent';
  baseDuration: number;

  // Effects
  healthPerTurn?: number;        // Negative = damage, positive = healing
  movementModifier?: number;     // Squares added/removed
  actionPenalty?: number;        // -CS to actions
  specificPenalties?: Record<string, number>; // Specific stat penalties

  // Recovery
  canSelfRecover: boolean;       // Does it wear off naturally?
  treatmentRequired?: 'first_aid' | 'medical' | 'hospital' | 'surgery' | 'special';
  treatmentDC?: number;          // Difficulty to treat

  // Combat flags
  preventsActions?: boolean;
  preventsMovement?: boolean;
  unconscious?: boolean;
}

export const STATUS_EFFECTS: Record<string, StatusEffect> = {
  // === BLEEDING ===
  bleeding_light: {
    id: 'bleeding_light',
    name: 'Bleeding (Light)',
    category: 'physical',
    severity: 1,
    description: 'Minor cuts causing slow blood loss',
    durationType: 'turns',
    baseDuration: 5,
    healthPerTurn: -3,
    canSelfRecover: true,
    treatmentRequired: 'first_aid',
    treatmentDC: 10,
  },
  bleeding_moderate: {
    id: 'bleeding_moderate',
    name: 'Bleeding (Moderate)',
    category: 'physical',
    severity: 2,
    description: 'Serious wound with significant blood loss',
    durationType: 'until_treated',
    baseDuration: 0,
    healthPerTurn: -8,
    movementModifier: -1,
    actionPenalty: -1,
    canSelfRecover: false,
    treatmentRequired: 'medical',
    treatmentDC: 15,
  },
  bleeding_severe: {
    id: 'bleeding_severe',
    name: 'Bleeding (Severe)',
    category: 'physical',
    severity: 3,
    description: 'Arterial bleeding - will die without immediate intervention',
    durationType: 'until_treated',
    baseDuration: 0,
    healthPerTurn: -15,
    movementModifier: -2,
    actionPenalty: -2,
    canSelfRecover: false,
    treatmentRequired: 'surgery',
    treatmentDC: 20,
  },

  // === PAIN & SHOCK ===
  stunned: {
    id: 'stunned',
    name: 'Stunned',
    category: 'combat',
    severity: 1,
    description: 'Temporarily incapacitated from impact',
    durationType: 'turns',
    baseDuration: 2,
    preventsActions: true,
    preventsMovement: true,
    canSelfRecover: true,
  },
  dazed: {
    id: 'dazed',
    name: 'Dazed',
    category: 'combat',
    severity: 1,
    description: 'Disoriented and sluggish',
    durationType: 'turns',
    baseDuration: 3,
    actionPenalty: -2,
    movementModifier: -2,
    canSelfRecover: true,
  },
  unconscious: {
    id: 'unconscious',
    name: 'Unconscious',
    category: 'combat',
    severity: 2,
    description: 'Knocked out cold',
    durationType: 'until_treated',
    baseDuration: 0,
    preventsActions: true,
    preventsMovement: true,
    unconscious: true,
    canSelfRecover: true, // Will wake up eventually
    treatmentRequired: 'first_aid',
    treatmentDC: 10,
  },

  // === BURNING ===
  burning: {
    id: 'burning',
    name: 'On Fire',
    category: 'physical',
    severity: 2,
    description: 'Clothing or body is on fire',
    durationType: 'turns',
    baseDuration: 4,
    healthPerTurn: -10,
    actionPenalty: -1,
    canSelfRecover: true, // Stop drop roll
    treatmentRequired: 'first_aid',
    treatmentDC: 12,
  },

  // === MENTAL ===
  frightened: {
    id: 'frightened',
    name: 'Frightened',
    category: 'mental',
    severity: 1,
    description: 'Overwhelmed by fear',
    durationType: 'turns',
    baseDuration: 5,
    movementModifier: -2,
    specificPenalties: { 'attack_fear_source': -3 },
    canSelfRecover: true,
  },
  panicked: {
    id: 'panicked',
    name: 'Panicked',
    category: 'mental',
    severity: 2,
    description: 'Complete loss of rational thought',
    durationType: 'turns',
    baseDuration: 3,
    actionPenalty: -3,
    canSelfRecover: true,
    treatmentRequired: 'first_aid', // Calming
    treatmentDC: 15,
  },

  // === GRAPPLING ===
  grappled: {
    id: 'grappled',
    name: 'Grappled',
    category: 'combat',
    severity: 1,
    description: 'Engaged in close-quarters grappling',
    durationType: 'until_treated', // Until escaped
    baseDuration: 0,
    movementModifier: -99, // Can't move normally
    canSelfRecover: true, // Escape attempt
  },
  pinned: {
    id: 'pinned',
    name: 'Pinned',
    category: 'combat',
    severity: 2,
    description: 'Held in dominant wrestling position',
    durationType: 'until_treated',
    baseDuration: 0,
    preventsMovement: true,
    actionPenalty: -2,
    canSelfRecover: true, // Escape attempt at penalty
  },
  choked: {
    id: 'choked',
    name: 'Being Choked',
    category: 'combat',
    severity: 3,
    description: 'Blood or air choke - losing consciousness',
    durationType: 'turns',
    baseDuration: 4, // Unconscious after 4 turns if not escaped
    actionPenalty: -1, // Cumulative per turn
    preventsMovement: true,
    canSelfRecover: true, // Escape or tap out
  },

  // === MEDICAL ===
  poisoned_light: {
    id: 'poisoned_light',
    name: 'Poisoned (Light)',
    category: 'medical',
    severity: 1,
    description: 'Mild toxin affecting performance',
    durationType: 'hours',
    baseDuration: 6,
    healthPerTurn: -2,
    actionPenalty: -1,
    canSelfRecover: true,
    treatmentRequired: 'first_aid',
    treatmentDC: 12,
  },
  poisoned_severe: {
    id: 'poisoned_severe',
    name: 'Poisoned (Severe)',
    category: 'medical',
    severity: 3,
    description: 'Life-threatening toxicity',
    durationType: 'until_treated',
    baseDuration: 0,
    healthPerTurn: -10,
    actionPenalty: -2,
    movementModifier: -2,
    canSelfRecover: false,
    treatmentRequired: 'hospital',
    treatmentDC: 18,
  },
  diseased: {
    id: 'diseased',
    name: 'Diseased',
    category: 'medical',
    severity: 2,
    description: 'Serious infection requiring treatment',
    durationType: 'days',
    baseDuration: 14,
    actionPenalty: -2,
    canSelfRecover: false,
    treatmentRequired: 'hospital',
    treatmentDC: 15,
  },
  radiation_sickness: {
    id: 'radiation_sickness',
    name: 'Radiation Sickness',
    category: 'medical',
    severity: 2,
    description: 'Radiation exposure causing cell damage',
    durationType: 'days',
    baseDuration: 21,
    healthPerTurn: -1, // Slow degradation
    actionPenalty: -2,
    canSelfRecover: false,
    treatmentRequired: 'hospital',
    treatmentDC: 18,
  },

  // === HOSPITALIZED ===
  hospitalized: {
    id: 'hospitalized',
    name: 'Hospitalized',
    category: 'medical',
    severity: 2,
    description: 'Requires extended medical treatment',
    durationType: 'days',
    baseDuration: 7, // Base, modified by injury
    preventsActions: true, // Can't do missions
    preventsMovement: true, // Can't travel
    canSelfRecover: true,
    treatmentRequired: 'hospital',
  },
  critical_condition: {
    id: 'critical_condition',
    name: 'Critical Condition',
    category: 'medical',
    severity: 3,
    description: 'On life support - may die',
    durationType: 'until_treated',
    baseDuration: 0,
    preventsActions: true,
    preventsMovement: true,
    unconscious: true,
    canSelfRecover: false,
    treatmentRequired: 'surgery',
    treatmentDC: 20,
  },

  // === CHEMICAL IRRITANTS (Pepper Spray, Tear Gas) ===
  blinded_chemical: {
    id: 'blinded_chemical',
    name: 'Blinded (Chemical)',
    category: 'physical',
    severity: 2,
    description: 'Eyes burning from pepper spray or tear gas - cannot see',
    durationType: 'turns',
    baseDuration: 4, // 1d4 turns base
    actionPenalty: -3, // Severe accuracy penalty (-3CS)
    specificPenalties: { 'ranged_attack': -5, 'melee_attack': -2, 'perception': -5 },
    canSelfRecover: true, // Wears off naturally
    treatmentRequired: 'first_aid', // Water flush speeds recovery
    treatmentDC: 8,
  },
  blinded_chemical_severe: {
    id: 'blinded_chemical_severe',
    name: 'Blinded (Severe Chemical)',
    category: 'physical',
    severity: 3,
    description: 'Direct hit with chemical agent - completely incapacitated',
    durationType: 'turns',
    baseDuration: 6, // 1d6 turns
    actionPenalty: -5,
    specificPenalties: { 'ranged_attack': -99, 'melee_attack': -4, 'perception': -99 },
    preventsMovement: false, // Can stumble around
    movementModifier: -2, // But slowly
    canSelfRecover: true,
    treatmentRequired: 'first_aid',
    treatmentDC: 10,
  },
  coughing_choking: {
    id: 'coughing_choking',
    name: 'Coughing/Choking',
    category: 'physical',
    severity: 1,
    description: 'Respiratory irritation from chemical agent',
    durationType: 'turns',
    baseDuration: 3,
    actionPenalty: -1,
    canSelfRecover: true,
  },
  tear_gassed: {
    id: 'tear_gassed',
    name: 'Tear Gassed',
    category: 'physical',
    severity: 2,
    description: 'Exposed to CS/CN tear gas - eyes, nose, throat burning',
    durationType: 'turns',
    baseDuration: 5,
    actionPenalty: -2,
    specificPenalties: { 'ranged_attack': -3, 'perception': -3 },
    movementModifier: -1,
    canSelfRecover: true,
    treatmentRequired: 'first_aid',
    treatmentDC: 10,
  },

  // === DYING ===
  dying: {
    id: 'dying',
    name: 'Dying',
    category: 'combat',
    severity: 3,
    description: 'On the verge of death - needs immediate help',
    durationType: 'turns',
    baseDuration: 3, // 3 turns to stabilize or die
    preventsActions: true,
    preventsMovement: true,
    unconscious: true,
    canSelfRecover: false,
    treatmentRequired: 'first_aid',
    treatmentDC: 15,
  },
};

// =============================================================================
// INJURIES (PERSISTENT DAMAGE)
// =============================================================================

export type InjurySeverity =
  | 'minor'       // Bruises, scrapes - heals with rest
  | 'moderate'    // Sprains, cuts - needs first aid
  | 'severe'      // Broken bones, deep wounds - needs medical
  | 'critical'    // Internal damage - needs surgery
  | 'permanent';  // Amputation, organ loss - needs prosthetic/clone

export interface Injury {
  id: string;
  name: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  description: string;

  // Effects while injured
  statPenalties?: Partial<Record<string, number>>;
  movementPenalty?: number;
  actionPenalty?: number;
  canUseBodyPart: boolean;

  // Recovery
  baseRecoveryDays: number;
  treatmentRequired: 'rest' | 'first_aid' | 'medical' | 'hospital' | 'surgery' | 'regeneration' | 'prosthetic';
  treatmentDC?: number;

  // Cause requirements
  minWeaponPower: WeaponPower;
  damageTypes: DamageType[];
}

// Injury tables by body part and severity
export const INJURIES: Record<string, Injury> = {
  // === HEAD INJURIES ===
  head_concussion_mild: {
    id: 'head_concussion_mild',
    name: 'Mild Concussion',
    bodyPart: 'head',
    severity: 'minor',
    description: 'Light head impact causing headache and disorientation',
    statPenalties: { INT: -1, INS: -1 },
    actionPenalty: -1,
    canUseBodyPart: true,
    baseRecoveryDays: 3,
    treatmentRequired: 'rest',
    minWeaponPower: 'light',
    damageTypes: ['blunt', 'explosive'],
  },
  head_concussion_severe: {
    id: 'head_concussion_severe',
    name: 'Severe Concussion',
    bodyPart: 'head',
    severity: 'moderate',
    description: 'Significant head trauma with memory issues',
    statPenalties: { INT: -2, INS: -2 },
    actionPenalty: -2,
    canUseBodyPart: true,
    baseRecoveryDays: 14,
    treatmentRequired: 'medical',
    treatmentDC: 15,
    minWeaponPower: 'medium',
    damageTypes: ['blunt', 'explosive'],
  },
  head_skull_fracture: {
    id: 'head_skull_fracture',
    name: 'Skull Fracture',
    bodyPart: 'head',
    severity: 'critical',
    description: 'Cracked skull requiring surgery',
    statPenalties: { INT: -3, INS: -3, CON: -2 },
    actionPenalty: -3,
    canUseBodyPart: true,
    baseRecoveryDays: 60,
    treatmentRequired: 'surgery',
    treatmentDC: 20,
    minWeaponPower: 'heavy',
    damageTypes: ['blunt', 'explosive', 'piercing'],
  },
  head_brain_damage: {
    id: 'head_brain_damage',
    name: 'Brain Damage',
    bodyPart: 'head',
    severity: 'permanent',
    description: 'Permanent cognitive impairment',
    statPenalties: { INT: -5, INS: -3, CON: -2 },
    actionPenalty: -2,
    canUseBodyPart: true,
    baseRecoveryDays: -1, // Permanent
    treatmentRequired: 'regeneration',
    minWeaponPower: 'heavy',
    damageTypes: ['blunt', 'explosive', 'piercing'],
  },
  head_lost_eye: {
    id: 'head_lost_eye',
    name: 'Lost Eye',
    bodyPart: 'head',
    severity: 'permanent',
    description: 'Eye destroyed - permanent vision loss on one side',
    statPenalties: { INS: -2 },
    actionPenalty: -2, // Ranged attacks
    canUseBodyPart: true,
    baseRecoveryDays: -1,
    treatmentRequired: 'prosthetic',
    minWeaponPower: 'medium',
    damageTypes: ['piercing', 'slashing', 'explosive', 'energy'],
  },
  head_lost_ear: {
    id: 'head_lost_ear',
    name: 'Lost Ear',
    bodyPart: 'head',
    severity: 'permanent',
    description: 'Ear destroyed - hearing impaired',
    statPenalties: { INS: -1 },
    canUseBodyPart: true,
    baseRecoveryDays: -1,
    treatmentRequired: 'prosthetic',
    minWeaponPower: 'medium',
    damageTypes: ['slashing', 'explosive', 'energy'],
  },

  // === CHEST INJURIES ===
  chest_bruised_ribs: {
    id: 'chest_bruised_ribs',
    name: 'Bruised Ribs',
    bodyPart: 'chest',
    severity: 'minor',
    description: 'Painful rib contusion affecting breathing',
    statPenalties: { STA: -1 },
    canUseBodyPart: true,
    baseRecoveryDays: 7,
    treatmentRequired: 'rest',
    minWeaponPower: 'light',
    damageTypes: ['blunt'],
  },
  chest_broken_ribs: {
    id: 'chest_broken_ribs',
    name: 'Broken Ribs',
    bodyPart: 'chest',
    severity: 'moderate',
    description: 'Fractured ribs causing severe pain',
    statPenalties: { STA: -2, AGL: -1 },
    actionPenalty: -1,
    canUseBodyPart: true,
    baseRecoveryDays: 42, // 6 weeks
    treatmentRequired: 'medical',
    treatmentDC: 12,
    minWeaponPower: 'medium',
    damageTypes: ['blunt', 'piercing'],
  },
  chest_punctured_lung: {
    id: 'chest_punctured_lung',
    name: 'Punctured Lung',
    bodyPart: 'chest',
    severity: 'critical',
    description: 'Lung perforated - difficulty breathing',
    statPenalties: { STA: -4, CON: -2 },
    actionPenalty: -2,
    canUseBodyPart: true,
    baseRecoveryDays: 60,
    treatmentRequired: 'surgery',
    treatmentDC: 18,
    minWeaponPower: 'medium',
    damageTypes: ['piercing', 'slashing'],
  },
  chest_internal_bleeding: {
    id: 'chest_internal_bleeding',
    name: 'Internal Bleeding (Chest)',
    bodyPart: 'chest',
    severity: 'critical',
    description: 'Internal hemorrhage requiring immediate surgery',
    statPenalties: { STA: -3, STR: -2 },
    actionPenalty: -2,
    canUseBodyPart: true,
    baseRecoveryDays: 30,
    treatmentRequired: 'surgery',
    treatmentDC: 20,
    minWeaponPower: 'medium',
    damageTypes: ['blunt', 'piercing', 'explosive'],
  },

  // === ARM INJURIES ===
  arm_sprain: {
    id: 'arm_sprain',
    name: 'Sprained Arm',
    bodyPart: 'left_arm', // Will be assigned dynamically
    severity: 'minor',
    description: 'Twisted arm joint causing pain',
    statPenalties: { STR: -1 },
    actionPenalty: -1,
    canUseBodyPart: true,
    baseRecoveryDays: 7,
    treatmentRequired: 'rest',
    minWeaponPower: 'light',
    damageTypes: ['blunt'],
  },
  arm_broken: {
    id: 'arm_broken',
    name: 'Broken Arm',
    bodyPart: 'left_arm',
    severity: 'severe',
    description: 'Arm bone fractured - cannot use two-handed weapons',
    statPenalties: { STR: -2, MEL: -2 },
    actionPenalty: -2,
    canUseBodyPart: false, // Cannot use this arm
    baseRecoveryDays: 56, // 8 weeks
    treatmentRequired: 'hospital',
    treatmentDC: 15,
    minWeaponPower: 'medium',
    damageTypes: ['blunt', 'piercing'],
  },
  arm_severed: {
    id: 'arm_severed',
    name: 'Severed Arm',
    bodyPart: 'left_arm',
    severity: 'permanent',
    description: 'Arm amputated - permanent loss',
    statPenalties: { STR: -3, MEL: -3 },
    actionPenalty: -3,
    canUseBodyPart: false,
    baseRecoveryDays: -1,
    treatmentRequired: 'prosthetic',
    minWeaponPower: 'heavy', // Need heavy weapon or superhuman
    damageTypes: ['slashing', 'explosive'],
  },

  // === LEG INJURIES ===
  leg_sprain: {
    id: 'leg_sprain',
    name: 'Sprained Leg',
    bodyPart: 'left_leg',
    severity: 'minor',
    description: 'Twisted leg joint',
    movementPenalty: -2,
    canUseBodyPart: true,
    baseRecoveryDays: 7,
    treatmentRequired: 'rest',
    minWeaponPower: 'light',
    damageTypes: ['blunt'],
  },
  leg_broken: {
    id: 'leg_broken',
    name: 'Broken Leg',
    bodyPart: 'left_leg',
    severity: 'severe',
    description: 'Leg bone fractured - cannot walk without support',
    statPenalties: { AGL: -3 },
    movementPenalty: -99, // Cannot walk normally
    canUseBodyPart: false,
    baseRecoveryDays: 56,
    treatmentRequired: 'hospital',
    treatmentDC: 15,
    minWeaponPower: 'medium',
    damageTypes: ['blunt', 'piercing'],
  },
  leg_severed: {
    id: 'leg_severed',
    name: 'Severed Leg',
    bodyPart: 'left_leg',
    severity: 'permanent',
    description: 'Leg amputated - permanent loss',
    statPenalties: { AGL: -5 },
    movementPenalty: -99,
    canUseBodyPart: false,
    baseRecoveryDays: -1,
    treatmentRequired: 'prosthetic',
    minWeaponPower: 'heavy',
    damageTypes: ['slashing', 'explosive'],
  },

  // === HAND INJURIES ===
  hand_broken_fingers: {
    id: 'hand_broken_fingers',
    name: 'Broken Fingers',
    bodyPart: 'left_hand',
    severity: 'moderate',
    description: 'Fractured fingers - cannot grip properly',
    statPenalties: { MEL: -1 },
    actionPenalty: -1,
    canUseBodyPart: true,
    baseRecoveryDays: 28,
    treatmentRequired: 'medical',
    treatmentDC: 12,
    minWeaponPower: 'light',
    damageTypes: ['blunt', 'piercing'],
  },
  hand_severed: {
    id: 'hand_severed',
    name: 'Severed Hand',
    bodyPart: 'left_hand',
    severity: 'permanent',
    description: 'Hand amputated - cannot use two-handed weapons',
    statPenalties: { MEL: -2 },
    actionPenalty: -2,
    canUseBodyPart: false,
    baseRecoveryDays: -1,
    treatmentRequired: 'prosthetic',
    minWeaponPower: 'heavy',
    damageTypes: ['slashing', 'explosive'],
  },

  // === FOOT INJURIES ===
  foot_broken: {
    id: 'foot_broken',
    name: 'Broken Foot',
    bodyPart: 'left_foot',
    severity: 'moderate',
    description: 'Foot bones fractured',
    movementPenalty: -3,
    canUseBodyPart: true,
    baseRecoveryDays: 42,
    treatmentRequired: 'medical',
    treatmentDC: 12,
    minWeaponPower: 'light',
    damageTypes: ['blunt', 'piercing'],
  },
  foot_severed: {
    id: 'foot_severed',
    name: 'Severed Foot',
    bodyPart: 'left_foot',
    severity: 'permanent',
    description: 'Foot amputated',
    movementPenalty: -5,
    canUseBodyPart: false,
    baseRecoveryDays: -1,
    treatmentRequired: 'prosthetic',
    minWeaponPower: 'heavy',
    damageTypes: ['slashing', 'explosive'],
  },
};

// =============================================================================
// PROSTHETICS
// =============================================================================

export type ProstheticQuality = 'basic' | 'modern' | 'advanced' | 'cybernetic';

export interface Prosthetic {
  id: string;
  name: string;
  replaces: BodyPart;
  quality: ProstheticQuality;
  description: string;

  // How much function is restored (100% = full function)
  functionPercent: number;

  // Bonuses/penalties
  statModifiers?: Partial<Record<string, number>>;
  movementModifier?: number;

  // Requirements
  cost: number;
  researchRequired?: string; // Research project ID needed
  installationDC: number;

  // Special features
  specialFeatures?: string[];
}

export const PROSTHETICS: Record<string, Prosthetic> = {
  // === BASIC (Low Tech) ===
  basic_wooden_leg: {
    id: 'basic_wooden_leg',
    name: 'Wooden Leg',
    replaces: 'left_leg',
    quality: 'basic',
    description: 'Basic wooden peg leg',
    functionPercent: 40,
    movementModifier: -3,
    cost: 500,
    installationDC: 10,
  },
  basic_hook_hand: {
    id: 'basic_hook_hand',
    name: 'Hook Hand',
    replaces: 'left_hand',
    quality: 'basic',
    description: 'Metal hook replacing hand',
    functionPercent: 30,
    statModifiers: { MEL: -2 },
    cost: 300,
    installationDC: 10,
    specialFeatures: ['Can be used as weapon (+5 damage)'],
  },

  // === MODERN (Current Tech) ===
  modern_prosthetic_leg: {
    id: 'modern_prosthetic_leg',
    name: 'Modern Prosthetic Leg',
    replaces: 'left_leg',
    quality: 'modern',
    description: 'Carbon fiber prosthetic leg',
    functionPercent: 75,
    movementModifier: -1,
    cost: 15000,
    installationDC: 15,
  },
  modern_prosthetic_arm: {
    id: 'modern_prosthetic_arm',
    name: 'Modern Prosthetic Arm',
    replaces: 'left_arm',
    quality: 'modern',
    description: 'Myoelectric prosthetic arm',
    functionPercent: 60,
    statModifiers: { STR: -1 },
    cost: 25000,
    installationDC: 15,
  },
  glass_eye: {
    id: 'glass_eye',
    name: 'Glass Eye',
    replaces: 'head', // Special case for eye
    quality: 'modern',
    description: 'Cosmetic glass eye',
    functionPercent: 0, // No vision restored
    cost: 2000,
    installationDC: 12,
    specialFeatures: ['Cosmetic only - no vision'],
  },

  // === ADVANCED (Near Future) ===
  advanced_bionic_leg: {
    id: 'advanced_bionic_leg',
    name: 'Advanced Bionic Leg',
    replaces: 'left_leg',
    quality: 'advanced',
    description: 'Servo-powered bionic leg',
    functionPercent: 100,
    movementModifier: 0,
    cost: 75000,
    researchRequired: 'PRJ_028', // Exo_Assist_Legs
    installationDC: 18,
  },
  advanced_bionic_arm: {
    id: 'advanced_bionic_arm',
    name: 'Advanced Bionic Arm',
    replaces: 'left_arm',
    quality: 'advanced',
    description: 'Servo-powered bionic arm',
    functionPercent: 100,
    statModifiers: { STR: 0 },
    cost: 100000,
    researchRequired: 'PRJ_027', // Exo_Assist_Arms
    installationDC: 18,
  },

  // === CYBERNETIC (High Tech) ===
  cybernetic_leg: {
    id: 'cybernetic_leg',
    name: 'Cybernetic Leg',
    replaces: 'left_leg',
    quality: 'cybernetic',
    description: 'Military-grade cybernetic leg with enhanced speed',
    functionPercent: 120, // Better than original!
    movementModifier: +2,
    cost: 250000,
    researchRequired: 'PRJ_028',
    installationDC: 20,
    specialFeatures: ['Hidden compartment', 'Jump assist +2 squares'],
  },
  cybernetic_arm: {
    id: 'cybernetic_arm',
    name: 'Cybernetic Arm',
    replaces: 'left_arm',
    quality: 'cybernetic',
    description: 'Military-grade cybernetic arm with enhanced strength',
    functionPercent: 130,
    statModifiers: { STR: +5, MEL: +1 },
    cost: 300000,
    researchRequired: 'PRJ_027',
    installationDC: 20,
    specialFeatures: ['Hidden blade', 'Grip strength 500 lbs'],
  },
  cybernetic_eye: {
    id: 'cybernetic_eye',
    name: 'Cybernetic Eye',
    replaces: 'head',
    quality: 'cybernetic',
    description: 'Advanced optic implant with enhanced features',
    functionPercent: 150,
    statModifiers: { INS: +2 },
    cost: 200000,
    researchRequired: 'PRJ_025', // Visor_HUD
    installationDC: 22,
    specialFeatures: ['Zoom 10x', 'Night vision', 'Thermal overlay', 'HUD display'],
  },
};

// =============================================================================
// MEDICAL CARE QUALITY
// =============================================================================

export interface MedicalCareLevel {
  id: string;
  name: string;
  description: string;

  // Modifiers
  recoverySpeedMultiplier: number;  // 1.0 = normal, 2.0 = twice as fast
  treatmentDCModifier: number;      // Added to treatment DC
  maxTreatableSeverity: InjurySeverity;

  // What's available
  canPerformSurgery: boolean;
  hasMedicalEquipment: boolean;
  hasPharmacy: boolean;

  // Requirements
  requiredFacility?: string;
  requiredCareer?: string;
  requiredCareerRank?: number;
}

export const MEDICAL_CARE_LEVELS: Record<string, MedicalCareLevel> = {
  none: {
    id: 'none',
    name: 'No Medical Care',
    description: 'No access to medical treatment',
    recoverySpeedMultiplier: 0.25,
    treatmentDCModifier: +10,
    maxTreatableSeverity: 'minor',
    canPerformSurgery: false,
    hasMedicalEquipment: false,
    hasPharmacy: false,
  },
  field: {
    id: 'field',
    name: 'Field Medicine',
    description: 'Basic first aid with medkit',
    recoverySpeedMultiplier: 0.5,
    treatmentDCModifier: +5,
    maxTreatableSeverity: 'moderate',
    canPerformSurgery: false,
    hasMedicalEquipment: false,
    hasPharmacy: false,
  },
  clinic: {
    id: 'clinic',
    name: 'Medical Clinic',
    description: 'Basic medical facility',
    recoverySpeedMultiplier: 0.75,
    treatmentDCModifier: +2,
    maxTreatableSeverity: 'severe',
    canPerformSurgery: false,
    hasMedicalEquipment: true,
    hasPharmacy: true,
  },
  hospital_basic: {
    id: 'hospital_basic',
    name: 'Basic Hospital',
    description: 'Standard hospital care',
    recoverySpeedMultiplier: 1.0,
    treatmentDCModifier: 0,
    maxTreatableSeverity: 'critical',
    canPerformSurgery: true,
    hasMedicalEquipment: true,
    hasPharmacy: true,
  },
  hospital_advanced: {
    id: 'hospital_advanced',
    name: 'Advanced Hospital',
    description: 'Top-tier medical facility',
    recoverySpeedMultiplier: 1.5,
    treatmentDCModifier: -2,
    maxTreatableSeverity: 'critical',
    canPerformSurgery: true,
    hasMedicalEquipment: true,
    hasPharmacy: true,
  },
  hospital_elite: {
    id: 'hospital_elite',
    name: 'Elite Medical Center',
    description: 'World-class medical care',
    recoverySpeedMultiplier: 2.0,
    treatmentDCModifier: -5,
    maxTreatableSeverity: 'permanent', // Can do prosthetics
    canPerformSurgery: true,
    hasMedicalEquipment: true,
    hasPharmacy: true,
  },
  base_infirmary: {
    id: 'base_infirmary',
    name: 'Base Infirmary',
    description: 'Team base medical facility',
    recoverySpeedMultiplier: 1.0, // Modified by doctor skill
    treatmentDCModifier: 0,       // Modified by doctor skill
    maxTreatableSeverity: 'severe', // Upgradeable
    canPerformSurgery: false,     // Requires upgrade
    hasMedicalEquipment: true,
    hasPharmacy: true,
    requiredFacility: 'FAC_003', // Medical_Lab
  },
};

// =============================================================================
// CHARACTER STATUS TRACKING
// =============================================================================

export interface ActiveStatusEffect {
  effectId: string;
  appliedAt: number;        // Game time when applied
  remainingDuration: number; // Turns/hours/days remaining
  source?: string;          // What caused it
  severity: StatusSeverity;
}

export interface ActiveInjury {
  injuryId: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  receivedAt: number;       // Game time when received
  recoveryProgress: number; // 0-100%
  treated: boolean;
  treatedBy?: string;       // Character ID of doctor
  installedProsthetic?: string; // Prosthetic ID if applicable
}

export interface CharacterHealthStatus {
  characterId: string;

  // Current health
  currentHealth: number;
  maxHealth: number;

  // Active effects (both battle and persistent)
  statusEffects: ActiveStatusEffect[];

  // Injuries (persistent across time)
  injuries: ActiveInjury[];

  // Medical state
  isHospitalized: boolean;
  hospitalizedAt?: string;   // Location ID
  hospitalizedUntil?: number; // Game time

  // Recovery tracking
  lastMedicalCheckup: number;
  assignedDoctor?: string;   // Character ID

  // Permanent conditions
  missingBodyParts: BodyPart[];
  installedProsthetics: string[]; // Prosthetic IDs
}

// =============================================================================
// HEALTH CALCULATION
// =============================================================================

export interface CharacterStats {
  MEL: number;
  AGL: number;
  STR: number;
  STA: number;
  INT: number;
  INS: number;
  CON: number;
}

/**
 * Calculate max health from stats
 * Formula: Base + (STA × 2) + STR
 * Base provides minimum survivability
 */
export function calculateMaxHealth(stats: CharacterStats, baseHealth: number = 20): number {
  return baseHealth + (stats.STA * 2) + stats.STR;
}

/**
 * Calculate effective stats after injuries and status effects
 */
export function calculateEffectiveStats(
  baseStats: CharacterStats,
  healthStatus: CharacterHealthStatus
): CharacterStats {
  const effective = { ...baseStats };

  // Apply injury penalties
  for (const injury of healthStatus.injuries) {
    const injuryDef = INJURIES[injury.injuryId];
    if (injuryDef?.statPenalties) {
      for (const [stat, penalty] of Object.entries(injuryDef.statPenalties)) {
        if (stat in effective) {
          (effective as any)[stat] = Math.max(1, (effective as any)[stat] + penalty);
        }
      }
    }
  }

  // Apply status effect penalties
  for (const effect of healthStatus.statusEffects) {
    const effectDef = STATUS_EFFECTS[effect.effectId];
    if (effectDef?.specificPenalties) {
      for (const [stat, penalty] of Object.entries(effectDef.specificPenalties)) {
        if (stat in effective) {
          (effective as any)[stat] = Math.max(1, (effective as any)[stat] + penalty);
        }
      }
    }
  }

  // Apply prosthetic bonuses
  for (const prostheticId of healthStatus.installedProsthetics) {
    const prosthetic = PROSTHETICS[prostheticId];
    if (prosthetic?.statModifiers) {
      for (const [stat, mod] of Object.entries(prosthetic.statModifiers)) {
        if (stat in effective) {
          (effective as any)[stat] = (effective as any)[stat] + mod;
        }
      }
    }
  }

  return effective;
}

// =============================================================================
// COUNTRY/CITY HEALTHCARE INTEGRATION
// =============================================================================

/**
 * City types that typically have hospitals
 */
export const CITY_TYPES_WITH_HOSPITALS = [
  'Political',    // Capitals have hospitals
  'Educational',  // University cities have medical schools
  'Military',     // Military bases have medical facilities
];

/**
 * City types that MIGHT have hospitals (if population supports)
 */
export const CITY_TYPES_MAYBE_HOSPITAL = [
  'Industrial',   // Large industrial cities often have hospitals
  'Seaport',      // Major ports have medical facilities
];

/**
 * City types that rarely have hospitals
 */
export const CITY_TYPES_NO_HOSPITAL = [
  'Mining',       // Remote mining towns
  'Resort',       // Tourist areas - clinics only
  'Temple',       // Religious sites - traditional medicine
  'Company',      // Company towns - basic clinic
];

/**
 * Population thresholds for hospital availability
 */
export const HOSPITAL_POPULATION_THRESHOLDS = {
  guaranteedHospital: 500000,     // Mega cities always have hospitals
  likelyHospital: 100000,         // Large cities usually have hospitals
  possibleHospital: 50000,        // Medium cities might have hospitals
  clinicOnly: 10000,              // Small towns have clinics at best
  noMedical: 0,                   // Villages have no medical facilities
};

export interface CityHealthcareInfo {
  cityName: string;
  countryName: string;

  // What's available
  hasHospital: boolean;
  hasClinic: boolean;
  hasMilitaryMedical: boolean;  // Military base medical

  // Care quality
  careLevel: string;            // ID from MEDICAL_CARE_LEVELS
  careLevelName: string;

  // Modifiers
  recoverySpeedMult: number;
  surgeryAvailable: boolean;
  prostheticsAvailable: boolean;

  // Why this level
  reason: string;
}

/**
 * Calculate city-specific healthcare availability
 * NOT EVERY CITY HAS A HOSPITAL!
 */
export function getCityHealthcare(
  cityPopulation: number,
  cityTypes: string[],           // Array of city types (cityType1-4)
  countryHealthcare: number,     // Country's healthcare rating (0-100)
  countryName: string,
  cityName: string
): CityHealthcareInfo {

  // Start with country base level
  let baseLevel = getCountryMedicalCareLevel(countryHealthcare);
  let hasHospital = false;
  let hasClinic = false;
  let hasMilitaryMedical = false;
  let reason = '';

  // Check for military medical (always available if Military city type)
  if (cityTypes.includes('Military')) {
    hasMilitaryMedical = true;
    hasClinic = true;
    reason = 'Military base medical facilities';
  }

  // Mega cities (500k+) always have hospitals
  if (cityPopulation >= HOSPITAL_POPULATION_THRESHOLDS.guaranteedHospital) {
    hasHospital = true;
    hasClinic = true;
    reason = `Major city (pop: ${cityPopulation.toLocaleString()})`;
  }
  // Large cities with hospital-friendly types
  else if (cityPopulation >= HOSPITAL_POPULATION_THRESHOLDS.likelyHospital) {
    const hasHospitalType = cityTypes.some(t => CITY_TYPES_WITH_HOSPITALS.includes(t));
    const hasMaybeType = cityTypes.some(t => CITY_TYPES_MAYBE_HOSPITAL.includes(t));

    if (hasHospitalType) {
      hasHospital = true;
      reason = `Large ${cityTypes.find(t => CITY_TYPES_WITH_HOSPITALS.includes(t))} city`;
    } else if (hasMaybeType && countryHealthcare >= 50) {
      hasHospital = true;
      reason = `Large city with adequate national healthcare`;
    } else {
      hasClinic = true;
      reason = `Large city but no hospital infrastructure`;
    }
  }
  // Medium cities - depends on type and country
  else if (cityPopulation >= HOSPITAL_POPULATION_THRESHOLDS.possibleHospital) {
    const hasHospitalType = cityTypes.some(t => CITY_TYPES_WITH_HOSPITALS.includes(t));

    if (hasHospitalType && countryHealthcare >= 60) {
      hasHospital = true;
      reason = `${cityTypes.find(t => CITY_TYPES_WITH_HOSPITALS.includes(t))} city with good healthcare`;
    } else {
      hasClinic = true;
      reason = `Medium city - clinic only`;
    }
  }
  // Small towns
  else if (cityPopulation >= HOSPITAL_POPULATION_THRESHOLDS.clinicOnly) {
    if (countryHealthcare >= 70) {
      hasClinic = true;
      reason = `Small town in country with good healthcare`;
    } else {
      reason = `Small town - limited medical access`;
    }
  }
  // Villages
  else {
    reason = `Small population - no medical facilities`;
  }

  // Determine actual care level based on what's available
  let careLevel: string;

  if (!hasHospital && !hasClinic && !hasMilitaryMedical) {
    careLevel = 'none';
  } else if (!hasHospital && !hasMilitaryMedical) {
    careLevel = countryHealthcare >= 50 ? 'clinic' : 'field';
  } else if (hasMilitaryMedical && !hasHospital) {
    // Military medical is like a basic hospital
    careLevel = 'hospital_basic';
  } else {
    // Has hospital - level depends on country healthcare
    careLevel = baseLevel;

    // But cap at hospital_basic if country healthcare is low
    if (countryHealthcare < 50 && careLevel !== 'hospital_basic') {
      careLevel = 'hospital_basic';
    }
  }

  const careLevelInfo = MEDICAL_CARE_LEVELS[careLevel];

  return {
    cityName,
    countryName,
    hasHospital,
    hasClinic,
    hasMilitaryMedical,
    careLevel,
    careLevelName: careLevelInfo.name,
    recoverySpeedMult: careLevelInfo.recoverySpeedMultiplier,
    surgeryAvailable: careLevelInfo.canPerformSurgery,
    prostheticsAvailable: careLevel === 'hospital_elite',
    reason,
  };
}

/**
 * Get medical care level based on country healthcare rating
 * Uses country.healthcare stat (0-100)
 */
export function getCountryMedicalCareLevel(healthcareRating: number): string {
  if (healthcareRating >= 90) return 'hospital_elite';
  if (healthcareRating >= 70) return 'hospital_advanced';
  if (healthcareRating >= 50) return 'hospital_basic';
  if (healthcareRating >= 30) return 'clinic';
  if (healthcareRating >= 10) return 'field';
  return 'none';
}

/**
 * Calculate recovery time based on location and care quality
 */
export function calculateRecoveryTime(
  injury: Injury,
  careLevel: MedicalCareLevel,
  doctorSkillBonus: number = 0 // +CS from doctor's Medicine skill
): number {
  if (injury.baseRecoveryDays < 0) {
    return -1; // Permanent, no recovery
  }

  const baseTime = injury.baseRecoveryDays;
  const careMultiplier = careLevel.recoverySpeedMultiplier;
  const doctorBonus = Math.max(0, doctorSkillBonus * 0.1); // Each +1CS = 10% faster

  const recoveryDays = Math.ceil(baseTime / (careMultiplier + doctorBonus));
  return Math.max(1, recoveryDays); // Minimum 1 day
}

/**
 * Check if injury can be treated at given care level
 */
export function canTreatInjury(
  injury: Injury,
  careLevel: MedicalCareLevel
): boolean {
  const severityRank: Record<InjurySeverity, number> = {
    minor: 1,
    moderate: 2,
    severe: 3,
    critical: 4,
    permanent: 5,
  };

  const injurySeverityRank = severityRank[injury.severity];
  const maxTreatableRank = severityRank[careLevel.maxTreatableSeverity];

  // Special case: permanent injuries need prosthetics
  if (injury.severity === 'permanent') {
    return careLevel.id === 'hospital_elite';
  }

  // Surgery required?
  if (injury.treatmentRequired === 'surgery' && !careLevel.canPerformSurgery) {
    return false;
  }

  return injurySeverityRank <= maxTreatableRank;
}

// =============================================================================
// INJURY ROLL SYSTEM
// =============================================================================

export interface InjuryRollResult {
  injury: Injury | null;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  isFatal: boolean;
  description: string;
}

/**
 * Roll for injury based on damage type, weapon power, and body part
 */
export function rollForInjury(
  bodyPart: BodyPart,
  damageType: DamageType,
  weaponPower: WeaponPower,
  damageDealt: number,
  targetMaxHealth: number
): InjuryRollResult {
  const partInfo = BODY_PARTS[bodyPart];
  const powerLimits = WEAPON_POWER_THRESHOLDS[weaponPower];

  // Calculate severity based on damage ratio
  const damageRatio = damageDealt / targetMaxHealth;
  let severity: InjurySeverity = 'minor';

  if (damageRatio >= 0.75) severity = 'critical';
  else if (damageRatio >= 0.5) severity = 'severe';
  else if (damageRatio >= 0.25) severity = 'moderate';

  // Check for fatal hit to critical organ
  if (partInfo.criticalOrgan && damageRatio >= 1.0) {
    return {
      injury: null,
      bodyPart,
      severity: 'critical',
      isFatal: true,
      description: `Fatal wound to ${partInfo.name}`,
    };
  }

  // Check for amputation possibility
  if (partInfo.canAmputate && powerLimits.canAmputate && damageRatio >= 0.6) {
    // High damage with heavy weapon = chance of amputation
    const amputationChance = (damageRatio - 0.6) * 100; // 0-40% chance
    const roll = Math.random() * 100;

    if (roll < amputationChance) {
      severity = 'permanent';
    }
  }

  // Find appropriate injury for this body part, damage type, and severity
  const matchingInjuries = Object.values(INJURIES).filter(inj => {
    // Match body part (or generic version)
    const partMatch = inj.bodyPart === bodyPart ||
      inj.bodyPart.replace('left_', '').replace('right_', '') ===
      bodyPart.replace('left_', '').replace('right_', '');

    // Match severity
    const severityMatch = inj.severity === severity;

    // Match damage type
    const damageMatch = inj.damageTypes.includes(damageType);

    // Match weapon power requirement
    const powerRank: Record<WeaponPower, number> = {
      light: 1, medium: 2, heavy: 3, extreme: 4, superhuman: 5
    };
    const powerMatch = powerRank[weaponPower] >= powerRank[inj.minWeaponPower];

    return partMatch && severityMatch && damageMatch && powerMatch;
  });

  if (matchingInjuries.length === 0) {
    // No specific injury, return generic description
    return {
      injury: null,
      bodyPart,
      severity,
      isFatal: false,
      description: `${severity} wound to ${partInfo.name}`,
    };
  }

  // Pick random matching injury
  const selectedInjury = matchingInjuries[Math.floor(Math.random() * matchingInjuries.length)];

  // Clone and assign correct body part (left/right)
  const finalInjury = {
    ...selectedInjury,
    bodyPart,
  };

  return {
    injury: finalInjury,
    bodyPart,
    severity,
    isFatal: false,
    description: finalInjury.description,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  BODY_PARTS,
  STATUS_EFFECTS,
  INJURIES,
  PROSTHETICS,
  MEDICAL_CARE_LEVELS,
  WEAPON_POWER_THRESHOLDS,
  calculateMaxHealth,
  calculateEffectiveStats,
  getCountryMedicalCareLevel,
  calculateRecoveryTime,
  canTreatInjury,
  rollForInjury,
};

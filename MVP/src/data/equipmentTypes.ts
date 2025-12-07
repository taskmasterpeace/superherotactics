/**
 * Equipment Type System - Unified schemas for all equipment
 *
 * This file defines TypeScript interfaces and enums for:
 * - Weapons (Melee, Ranged, Energy, Grenades)
 * - Armor (Light, Medium, Heavy, Power, Shields)
 * - Gadgets (Sensors, Comms, Hacking, Field Gear, Medical, Drones)
 * - Vehicles (Ground, Air, Water)
 */

// ==================== COMMON ENUMS ====================

export type DamageType =
  | 'PHYSICAL'
  | 'BLEED_PHYSICAL'
  | 'ENERGY'
  | 'SPECIAL';

export type DamageSubType =
  | 'EDGED_MELEE'
  | 'SMASHING_MELEE'
  | 'PIERCING_MELEE'
  | 'GUNFIRE'
  | 'BUCKSHOT'
  | 'SLUG'
  | 'ARROW'
  | 'BOLT'
  | 'THROWN'
  | 'EXPLOSION'
  | 'SHRAPNEL'
  | 'LASER'
  | 'PLASMA'
  | 'THERMAL'
  | 'ICE'
  | 'ELECTRICAL'
  | 'SONIC'
  | 'PURE_ENERGY'
  | 'CONCUSSIVE'
  | 'DISINTEGRATION'
  | 'STUN'
  | 'FIRE'
  | 'FLASH'
  | 'GAS'
  | 'SMOKE'
  | 'EMP'
  | 'ENTANGLE';

export type CostLevel =
  | 'Free'
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Very_High'
  | 'Ultra_High';

export type Availability =
  | 'Abundant'
  | 'Common'
  | 'Restricted'
  | 'Specialized'
  | 'Military'
  | 'Military_Only'
  | 'Law_Enforcement'
  | 'Medical'
  | 'High_Tech'
  | 'Alien_Tech'
  | 'Licensed'
  | 'Commercial'
  | 'VIP'
  | 'Hacker'
  | 'Security'
  | 'Religious';

export type SkillRequirement =
  | 'None'
  | 'Shooting'
  | 'Sniper'
  | 'Heavy_Weapons'
  | 'Bowmaster'
  | 'Katana'
  | 'Staff'
  | 'Martial_Arts'
  | 'Swords'
  | 'Spear'
  | 'Energy_Weapons'
  | 'Flamethrower'
  | 'Rocketman'
  | 'Crossbow'
  | 'Computer'
  | 'Electronics'
  | 'Cryptography'
  | 'Quantum_Physics'
  | 'Medicine'
  | 'Surgery'
  | 'First_Aid'
  | 'Piloting_Ground'
  | 'Piloting_Air'
  | 'Piloting_Water'
  | 'Drone_Operation'
  | 'Lockpicking'
  | 'Demolitions'
  | 'Stealth'
  | 'Engineering'
  | 'Throwing';

// Cost values in dollars for each level
export const COST_VALUES: Record<CostLevel, number> = {
  'Free': 0,
  'Low': 100,
  'Medium': 500,
  'High': 2000,
  'Very_High': 10000,
  'Ultra_High': 50000,
};

// ==================== WEAPON TYPES ====================

export type WeaponCategory =
  | 'Melee_Regular'
  | 'Melee_Skill'
  | 'Ranged_Regular'
  | 'Ranged_Skill'
  | 'Special_Ranged'
  | 'Energy_Weapons'
  | 'Grenades'
  | 'Improvised'
  | 'Thrown';

export interface Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  description?: string;

  // Combat stats
  baseDamage: number;
  damageType: DamageType;
  damageSubType: DamageSubType;
  attackSpeed: number;        // Seconds between attacks
  range: number;              // Squares (tiles)
  accuracyCS: number;         // Column shift (-3 to +3)
  penetrationMult: number;    // Armor penetration multiplier

  // Requirements
  skillRequired: SkillRequirement;
  strRequired: number;

  // Ranged-specific
  reloadTime?: number;        // Seconds
  magazineSize?: number;
  defaultAmmo?: string;

  // Grenade-specific
  blastRadius?: string;       // e.g., "3x3"

  // Meta
  specialEffects: string[];
  costLevel: CostLevel;
  costValue: number;          // Calculated dollar value
  availability: Availability;
  investigationBonus?: string;
  notes?: string;

  // UI
  emoji: string;
}

// ==================== ARMOR TYPES ====================

export type ArmorCategory =
  | 'Light'
  | 'Medium'
  | 'Heavy'
  | 'Power'
  | 'Shield'
  | 'Natural';

export type CoverageType =
  | 'Torso'
  | 'Torso_Arms'
  | 'Full'
  | 'Limbs'
  | 'Head'
  | 'Head_Partial'
  | 'Face'
  | 'Hands'
  | 'Neck'
  | 'Groin'
  | 'Legs'
  | 'Arms'
  | 'Feet'
  | 'Back'
  | 'Shoulders'
  | 'Directional'
  | 'Bubble'
  | 'Surface'
  | 'Any';

export interface Armor {
  id: string;
  name: string;
  category: ArmorCategory;
  description?: string;

  // Protection
  drPhysical: number;         // Damage Reduction vs physical
  drEnergy: number;           // Damage Reduction vs energy
  drMental: number;           // Damage Reduction vs mental/psionic
  coverage: CoverageType;
  conditionMax: number;       // How much damage before breaking

  // Requirements & Penalties
  weight: number;             // Pounds
  strRequired: number;
  movementPenalty: number;    // Negative squares of movement
  stealthPenalty: number;     // CS penalty to stealth

  // Meta
  specialProperties: string[];
  costLevel: CostLevel;
  costValue: number;
  availability: Availability;
  researchRequired?: string;
  notes?: string;

  // UI
  emoji: string;
}

export interface ArmorComponent {
  id: string;
  name: string;
  slot: CoverageType;

  drPhysicalBonus: number;
  drEnergyBonus: number;
  drMentalBonus: number;
  weightAdd: number;

  effect: string;
  compatibleWith: string;
  researchRequired?: string;
  costLevel: CostLevel;
  costValue: number;
  availability: Availability;
  notes?: string;
}

// ==================== GADGET TYPES ====================

export type GadgetCategory =
  | 'Sensor'
  | 'Communication'
  | 'Hacking'
  | 'Field_Gear'
  | 'Medical'
  | 'Surveillance'
  | 'Utility'
  | 'Weapon_Mod';

export type OperationType =
  | 'passive'
  | 'toggle'
  | 'intensity'
  | 'mode_select'
  | 'deploy'
  | 'consumable'
  | 'controlled';

export type UIControl =
  | 'none'
  | 'switch'
  | 'slider'
  | 'dropdown'
  | 'place_button'
  | 'use_button'
  | 'unit_control';

export interface Gadget {
  id: string;
  name: string;
  category: GadgetCategory;
  description?: string;

  // Operation
  operationType: OperationType;
  uiControl: UIControl;
  modes?: string[];           // For mode_select
  intensityRange?: string;    // For intensity, e.g., "0-100"
  deployDuration?: string;    // For deploy
  cooldownTurns: number;
  apCost: number;

  // Stats
  range?: number | string;    // Feet or formula
  duration?: number;          // Hours of battery/use
  uses?: number | string;     // Number of uses or "Reusable"

  // Requirements
  skillRequired: SkillRequirement;

  // Combat Effect
  combatEffect?: string;

  // Meta
  costLevel: CostLevel;
  costValue: number;
  availability: Availability;
  weight?: number;
  detectionRisk?: string;
  notes?: string;

  // UI
  emoji: string;
}

// ==================== VEHICLE TYPES ====================

export type VehicleCategory = 'Ground' | 'Aircraft' | 'Watercraft';

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  description?: string;

  // Performance
  speedMPH: number;
  speedSquaresPerTurn: number;
  altitudeMax?: number;       // For aircraft

  // Capacity
  passengers: number;
  cargoLbs: number;

  // Protection
  armorHP: number;
  armorDR: number;

  // Fuel/Range
  fuelType: string;
  rangeMiles: number;

  // Requirements
  pilotSkill: SkillRequirement;

  // Meta
  specialProperties: string[];
  costLevel: CostLevel;
  costValue: number;
  availability: Availability;
  notes?: string;

  // UI
  emoji: string;
}

// ==================== DRONE TYPES ====================

export interface Drone {
  id: string;
  name: string;
  category: 'Aerial' | 'Ground' | 'Aquatic';
  description?: string;

  // Performance
  speedMPH: number;
  controlRangeFt: number;
  flightTimeMin: number;

  // Capacity
  payloadLbs: number;

  // Protection
  armorHP: number;

  // Equipment
  sensors: string;
  weapons?: string;

  // Operation
  operationType: OperationType;
  apCost: number;
  modes: string[];

  // Meta
  costLevel: CostLevel;
  costValue: number;
  availability: Availability;
  notes?: string;

  // UI
  emoji: string;
}

// ==================== AMMUNITION TYPES ====================

export interface Ammunition {
  id: string;
  name: string;
  caliber: string;

  damageModifier: string;     // e.g., "+25% vs unarmored"
  penetrationMult: number;
  costMult: number;

  specialEffects: string[];
  availability: Availability;
  notes?: string;
}

// ==================== UNIFIED EQUIPMENT ITEM ====================

export type EquipmentType = 'weapon' | 'armor' | 'gadget' | 'vehicle' | 'drone' | 'ammo' | 'component';

export interface EquipmentItem {
  type: EquipmentType;
  data: Weapon | Armor | Gadget | Vehicle | Drone | Ammunition | ArmorComponent;
}

// ==================== CHARACTER EQUIPMENT SLOTS ====================

export interface CharacterEquipment {
  // Weapons
  primaryWeapon?: Weapon;
  secondaryWeapon?: Weapon;
  meleeWeapon?: Weapon;

  // Armor
  bodyArmor?: Armor;
  helmet?: Armor;
  shield?: Armor;

  // Gadgets (up to 8 belt slots)
  beltSlots: (Gadget | null)[];

  // Backpack (additional storage)
  backpack: (EquipmentItem | null)[];

  // Ammunition
  ammunition: { ammo: Ammunition; quantity: number }[];
}

// ==================== ENCYCLOPEDIA ENTRY ====================

export interface EncyclopediaEntry {
  id: string;
  name: string;
  type: EquipmentType;
  category: string;
  description: string;

  // Quick stats for display
  quickStats: { label: string; value: string | number }[];

  // Full data reference
  data: EquipmentItem['data'];

  // UI
  emoji: string;
  tags: string[];
}

// ==================== BALANCE METRICS ====================

export interface BalanceMetrics {
  // Damage per second (DPS)
  dps: number;

  // Effective range
  effectiveRange: number;

  // Cost efficiency (damage per dollar)
  costEfficiency: number;

  // Time to kill (average HP 100 target)
  ttk: number;

  // Availability score (how easy to obtain)
  availabilityScore: number;
}

export function calculateWeaponBalance(weapon: Weapon): BalanceMetrics {
  const dps = weapon.baseDamage / weapon.attackSpeed;
  const effectiveRange = weapon.range;
  const costEfficiency = weapon.baseDamage / (weapon.costValue || 1);
  const ttk = 100 / dps; // Time to kill 100 HP target

  const availabilityScores: Record<Availability, number> = {
    'Abundant': 10,
    'Common': 8,
    'Licensed': 7,
    'Commercial': 7,
    'Restricted': 5,
    'Specialized': 4,
    'Military': 3,
    'Law_Enforcement': 4,
    'Medical': 5,
    'Security': 5,
    'VIP': 3,
    'Hacker': 4,
    'High_Tech': 2,
    'Military_Only': 1,
    'Alien_Tech': 0.5,
    'Religious': 3,
  };

  return {
    dps,
    effectiveRange,
    costEfficiency,
    ttk,
    availabilityScore: availabilityScores[weapon.availability] || 5,
  };
}

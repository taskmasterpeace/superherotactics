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

// Kill/Stun damage modes
export type DamageMode = 'kill' | 'stun';

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

  // Melee-specific
  meleeReach?: number;        // Tiles (1=adjacent, 2=spear/polearm, 3=whip)
  disarmBonus?: number;       // % bonus to disarm (nunchaku, eskrima weapons)
  entangleCapable?: boolean;  // Can entangle/grapple (whip, net, chains)

  // Ranged-specific
  reloadTime?: number;        // Seconds
  magazineSize?: number;
  defaultAmmo?: string;

  // Grenade-specific
  blastRadius?: string;       // e.g., "3x3"

  // Kill/Stun system
  stunCapable: boolean;       // Can toggle between kill/stun modes
  defaultMode: DamageMode;    // Default mode when equipped
  alwaysLethal?: boolean;     // Cannot be set to stun (firearms, edged weapons)
  alwaysNonLethal?: boolean;  // Cannot kill (tasers, stun grenades)

  // Meta
  specialEffects: string[];
  costLevel: CostLevel;
  costValue: number;          // Calculated dollar value
  availability: Availability;
  investigationBonus?: string;
  notes?: string;

  // UI
  emoji: string;

  /**
   * WEAPON-SPECIFIC RANGE BRACKETS
   * Each weapon has its own optimal engagement distances
   * Hit chance modifiers apply based on these brackets
   */
  rangeBrackets?: WeaponRangeBrackets;
}

/**
 * Weapon-specific range brackets for hit chance calculation
 * All distances in tiles (1 tile = ~5 feet / 1.5m)
 *
 * Example - Pistol:
 *   pointBlank: 0-3 tiles (+15%)
 *   short: 4-8 tiles (+5%)
 *   optimal: 9-15 tiles (0%)
 *   long: 16-20 tiles (-10%)
 *   extreme: 21-25 tiles (-25%)
 *   max: 25 (beyond = can't hit)
 *
 * Example - Sniper Rifle:
 *   pointBlank: 0-5 tiles (-10%, too close!)
 *   short: 6-20 tiles (+5%)
 *   optimal: 21-60 tiles (+10%, scope sweet spot)
 *   long: 61-80 tiles (0%)
 *   extreme: 81-100 tiles (-15%)
 *   max: 100
 */
export interface WeaponRangeBrackets {
  pointBlank: number;     // 0 to this distance = point blank
  short: number;          // pointBlank+1 to this = short range
  optimal: number;        // short+1 to this = optimal range (best accuracy)
  long: number;           // optimal+1 to this = long range
  extreme: number;        // long+1 to this = extreme range
  max: number;            // Beyond this = cannot target

  // Hit chance modifiers for each bracket
  pointBlankMod: number;  // Modifier at point blank (can be negative for scoped weapons)
  shortMod: number;       // Modifier at short range
  optimalMod: number;     // Modifier at optimal range (usually 0 or positive)
  longMod: number;        // Modifier at long range (usually negative)
  extremeMod: number;     // Modifier at extreme range (always negative)
}

/**
 * Default range brackets by weapon type
 * Used when weapon doesn't specify custom brackets
 */
export const DEFAULT_RANGE_BRACKETS: Record<string, WeaponRangeBrackets> = {
  // Handguns - good close, mediocre mid, poor far
  pistol: {
    pointBlank: 3, short: 8, optimal: 15, long: 20, extreme: 25, max: 25,
    pointBlankMod: 15, shortMod: 5, optimalMod: 0, longMod: -15, extremeMod: -30,
  },
  revolver: {
    pointBlank: 3, short: 8, optimal: 15, long: 18, extreme: 22, max: 22,
    pointBlankMod: 15, shortMod: 5, optimalMod: 0, longMod: -15, extremeMod: -30,
  },

  // SMGs - best at close-medium, rapid falloff
  smg: {
    pointBlank: 2, short: 6, optimal: 12, long: 18, extreme: 22, max: 22,
    pointBlankMod: 20, shortMod: 10, optimalMod: 0, longMod: -20, extremeMod: -40,
  },

  // Shotguns - devastating close, useless far
  shotgun: {
    pointBlank: 1, short: 3, optimal: 5, long: 8, extreme: 12, max: 12,
    pointBlankMod: 25, shortMod: 15, optimalMod: 5, longMod: -25, extremeMod: -50,
  },
  shotgun_slug: {
    pointBlank: 2, short: 5, optimal: 10, long: 15, extreme: 20, max: 20,
    pointBlankMod: 15, shortMod: 10, optimalMod: 0, longMod: -15, extremeMod: -35,
  },

  // Assault Rifles - versatile, good at most ranges
  assault_rifle: {
    pointBlank: 3, short: 15, optimal: 40, long: 55, extreme: 65, max: 65,
    pointBlankMod: 5, shortMod: 5, optimalMod: 5, longMod: -10, extremeMod: -25,
  },
  battle_rifle: {
    pointBlank: 5, short: 20, optimal: 50, long: 65, extreme: 75, max: 75,
    pointBlankMod: 0, shortMod: 5, optimalMod: 5, longMod: -10, extremeMod: -25,
  },

  // Sniper Rifles - poor close, excellent far
  sniper_rifle: {
    pointBlank: 5, short: 20, optimal: 60, long: 85, extreme: 100, max: 100,
    pointBlankMod: -15, shortMod: 0, optimalMod: 15, longMod: 5, extremeMod: -15,
  },
  anti_materiel: {
    pointBlank: 10, short: 30, optimal: 80, long: 120, extreme: 150, max: 150,
    pointBlankMod: -20, shortMod: -5, optimalMod: 15, longMod: 5, extremeMod: -10,
  },

  // Machine Guns - suppression focused, mediocre accuracy
  machine_gun: {
    pointBlank: 3, short: 10, optimal: 25, long: 40, extreme: 50, max: 50,
    pointBlankMod: 10, shortMod: 5, optimalMod: 0, longMod: -15, extremeMod: -30,
  },
  minigun: {
    pointBlank: 2, short: 8, optimal: 15, long: 25, extreme: 35, max: 35,
    pointBlankMod: 15, shortMod: 5, optimalMod: 0, longMod: -20, extremeMod: -40,
  },

  // Thrown weapons
  thrown: {
    pointBlank: 1, short: 3, optimal: 6, long: 10, extreme: 15, max: 15,
    pointBlankMod: 10, shortMod: 5, optimalMod: 0, longMod: -15, extremeMod: -30,
  },
  grenade: {
    pointBlank: 2, short: 4, optimal: 8, long: 12, extreme: 15, max: 15,
    pointBlankMod: 5, shortMod: 5, optimalMod: 0, longMod: -10, extremeMod: -25,
  },

  // Melee (range = reach, modifiers are for engagement)
  melee: {
    pointBlank: 0, short: 1, optimal: 1, long: 2, extreme: 3, max: 3,
    pointBlankMod: 0, shortMod: 0, optimalMod: 0, longMod: -20, extremeMod: -40,
  },
  polearm: {
    pointBlank: 0, short: 1, optimal: 2, long: 3, extreme: 4, max: 4,
    pointBlankMod: -10, shortMod: 5, optimalMod: 10, longMod: 0, extremeMod: -20,
  },

  // Energy weapons - consistent accuracy
  energy: {
    pointBlank: 3, short: 15, optimal: 40, long: 60, extreme: 80, max: 80,
    pointBlankMod: 10, shortMod: 5, optimalMod: 5, longMod: 0, extremeMod: -15,
  },

  // Rockets/Launchers - need distance to arm
  rocket: {
    pointBlank: 5, short: 15, optimal: 40, long: 70, extreme: 100, max: 100,
    pointBlankMod: -30, shortMod: 0, optimalMod: 10, longMod: 0, extremeMod: -20,
  },
};

/**
 * Get the hit chance modifier for a weapon at a given distance
 */
export function getWeaponRangeModifier(weapon: Weapon, distance: number): number {
  const brackets = weapon.rangeBrackets || getDefaultRangeBrackets(weapon);

  if (distance > brackets.max) {
    return -100; // Cannot hit beyond max range
  }
  if (distance <= brackets.pointBlank) {
    return brackets.pointBlankMod;
  }
  if (distance <= brackets.short) {
    return brackets.shortMod;
  }
  if (distance <= brackets.optimal) {
    return brackets.optimalMod;
  }
  if (distance <= brackets.long) {
    return brackets.longMod;
  }
  return brackets.extremeMod;
}

/**
 * Get range bracket name for display
 */
export function getRangeBracketName(weapon: Weapon, distance: number): string {
  const brackets = weapon.rangeBrackets || getDefaultRangeBrackets(weapon);

  if (distance > brackets.max) return 'Out of Range';
  if (distance <= brackets.pointBlank) return 'Point Blank';
  if (distance <= brackets.short) return 'Short';
  if (distance <= brackets.optimal) return 'Optimal';
  if (distance <= brackets.long) return 'Long';
  return 'Extreme';
}

/**
 * Get default range brackets based on weapon properties
 */
export function getDefaultRangeBrackets(weapon: Weapon): WeaponRangeBrackets {
  const name = weapon.name.toLowerCase();
  const category = weapon.category;

  // Match by name patterns first
  if (name.includes('sniper') || name.includes('marksman')) {
    return DEFAULT_RANGE_BRACKETS.sniper_rifle;
  }
  if (name.includes('anti-materiel') || name.includes('anti materiel') || name.includes('.50')) {
    return DEFAULT_RANGE_BRACKETS.anti_materiel;
  }
  if (name.includes('shotgun') && name.includes('slug')) {
    return DEFAULT_RANGE_BRACKETS.shotgun_slug;
  }
  if (name.includes('shotgun')) {
    return DEFAULT_RANGE_BRACKETS.shotgun;
  }
  if (name.includes('smg') || name.includes('submachine')) {
    return DEFAULT_RANGE_BRACKETS.smg;
  }
  if (name.includes('assault') || name.includes('carbine')) {
    return DEFAULT_RANGE_BRACKETS.assault_rifle;
  }
  if (name.includes('battle rifle') || name.includes('dmr')) {
    return DEFAULT_RANGE_BRACKETS.battle_rifle;
  }
  if (name.includes('machine gun') || name.includes('lmg') || name.includes('hmg')) {
    return DEFAULT_RANGE_BRACKETS.machine_gun;
  }
  if (name.includes('minigun') || name.includes('gatling')) {
    return DEFAULT_RANGE_BRACKETS.minigun;
  }
  if (name.includes('revolver')) {
    return DEFAULT_RANGE_BRACKETS.revolver;
  }
  if (name.includes('pistol') || name.includes('handgun')) {
    return DEFAULT_RANGE_BRACKETS.pistol;
  }
  if (name.includes('rocket') || name.includes('launcher') || name.includes('rpg')) {
    return DEFAULT_RANGE_BRACKETS.rocket;
  }
  if (name.includes('grenade')) {
    return DEFAULT_RANGE_BRACKETS.grenade;
  }
  if (name.includes('spear') || name.includes('polearm') || name.includes('halberd')) {
    return DEFAULT_RANGE_BRACKETS.polearm;
  }

  // Match by category
  if (category === 'Melee_Regular' || category === 'Melee_Skill') {
    return DEFAULT_RANGE_BRACKETS.melee;
  }
  if (category === 'Energy_Weapons') {
    return DEFAULT_RANGE_BRACKETS.energy;
  }
  if (category === 'Thrown' || category === 'Grenades') {
    return DEFAULT_RANGE_BRACKETS.thrown;
  }

  // Default to pistol brackets for unknown ranged
  return DEFAULT_RANGE_BRACKETS.pistol;
}

// ==================== ARMOR TYPES ====================

export type ArmorCategory =
  | 'Light'
  | 'Medium'
  | 'Heavy'
  | 'Power'
  | 'Shield'
  | 'Natural';

/**
 * Caliber classes for armor stopping ratings
 * Armor with a certain caliberRating can reliably stop rounds at or below that class
 */
export type CaliberClass =
  | 'none'           // No ballistic protection (leather, cloth)
  | 'light_pistol'   // .22, .25 ACP (10-15 damage)
  | 'pistol'         // .38, 9mm (20-28 damage)
  | 'heavy_pistol'   // .45 ACP, .357 Magnum (30-38 damage)
  | 'rifle'          // 5.56mm, 7.62mm (35-45 damage)
  | 'heavy_rifle'    // .308, .30-06 (45-55 damage)
  | 'anti_materiel'; // .50 BMG, 12.7mm (60+ damage)

/**
 * Damage thresholds for each caliber class
 * Armor stoppingPower should be >= this to reliably stop rounds in that class
 */
export const CALIBER_STOPPING_THRESHOLDS: Record<CaliberClass, number> = {
  'none': 0,
  'light_pistol': 15,
  'pistol': 28,           // Stops .38 (25), 9mm (28)
  'heavy_pistol': 38,     // Stops .45 (35), .357 (38)
  'rifle': 45,            // Stops 5.56 (40), 7.62x39 (42)
  'heavy_rifle': 55,      // Stops 7.62x51 (48), .308 (50)
  'anti_materiel': 80,    // Stops .50 BMG (65+)
};

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
  drPhysical: number;         // Damage Reduction vs physical (subtracts from damage after stoppingPower check)
  drEnergy: number;           // Damage Reduction vs energy
  drMental: number;           // Damage Reduction vs mental/psionic
  coverage: CoverageType;
  conditionMax: number;       // How much damage before breaking

  /**
   * STOPPING POWER SYSTEM (JA2-inspired)
   *
   * stoppingPower: Maximum damage this armor can COMPLETELY stop (0 damage through)
   * - If incoming damage <= stoppingPower: damage = 0 (stopped)
   * - If incoming damage > stoppingPower: damage = (incoming - drPhysical)
   *
   * Example: Kevlar (stoppingPower: 28, drPhysical: 8)
   * - .38 revolver (25 dmg): 25 <= 28 = 0 damage (completely stopped)
   * - 9mm (28 dmg): 28 <= 28 = 0 damage (stopped at threshold)
   * - .45 ACP (35 dmg): 35 > 28 = 35 - 8 = 27 damage (pierces, DR applies)
   */
  stoppingPower?: number;     // Max damage armor completely blocks (optional for backwards compat)
  caliberRating?: CaliberClass; // What caliber class this armor reliably stops

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

/**
 * Calculate damage after armor stopping power and DR
 * This is the core armor effectiveness calculation
 *
 * @param incomingDamage - Raw damage from weapon
 * @param armor - Armor being worn (optional)
 * @param penetrationMult - Weapon's armor penetration (1.0 = normal, >1 = armor piercing)
 * @returns Final damage after armor
 */
export function calculateDamageAfterArmor(
  incomingDamage: number,
  armor?: Armor,
  penetrationMult: number = 1.0
): { finalDamage: number; stopped: boolean; pierced: boolean } {
  if (!armor) {
    return { finalDamage: incomingDamage, stopped: false, pierced: false };
  }

  // Get effective stopping power (reduced by penetration)
  const effectiveStoppingPower = armor.stoppingPower
    ? Math.round(armor.stoppingPower / penetrationMult)
    : 0;

  // Check if armor completely stops the hit
  if (effectiveStoppingPower > 0 && incomingDamage <= effectiveStoppingPower) {
    return { finalDamage: 0, stopped: true, pierced: false };
  }

  // Armor pierced - apply DR to reduce damage
  const effectiveDR = Math.round(armor.drPhysical / penetrationMult);
  const finalDamage = Math.max(0, incomingDamage - effectiveDR);

  return { finalDamage, stopped: false, pierced: true };
}

/**
 * Get what caliber class a weapon falls into based on damage
 */
export function getWeaponCaliberClass(baseDamage: number): CaliberClass {
  if (baseDamage >= 60) return 'anti_materiel';
  if (baseDamage >= 45) return 'heavy_rifle';
  if (baseDamage >= 35) return 'rifle';
  if (baseDamage >= 30) return 'heavy_pistol';
  if (baseDamage >= 18) return 'pistol';
  if (baseDamage >= 10) return 'light_pistol';
  return 'none';
}

/**
 * Check if armor can stop a weapon's rounds
 */
export function canArmorStopWeapon(armor: Armor, weaponDamage: number, penetrationMult: number = 1.0): boolean {
  if (!armor.stoppingPower) return false;
  const effectiveStoppingPower = Math.round(armor.stoppingPower / penetrationMult);
  return weaponDamage <= effectiveStoppingPower;
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

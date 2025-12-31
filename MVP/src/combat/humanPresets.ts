/**
 * Human Presets - Baseline test scenarios
 *
 * "Test with normal humans first. No supers until humans feel right."
 */

import {
  SimUnit,
  SimWeapon,
  SimArmor,
  UnitPreset,
  calculateHP,
  calculateArmorProtection,
  HUMAN_BASELINE_STATS,
  ARMOR_PRESETS,
} from './types';

// Import full weapon database for conversion
import {
  Weapon,
  WeaponRangeBrackets,
  DEFAULT_RANGE_BRACKETS,
  DamageSubType,
} from '../data/equipmentTypes';
import {
  ALL_WEAPONS,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  THROWN_WEAPONS,
  SPECIAL_WEAPONS,
  ENERGY_WEAPONS,
} from '../data/weapons';

// ============ WEAPON DATABASE CONVERTER ============

/**
 * Convert accuracy column shift (-3 to +3) to percentage (0-100)
 * Base accuracy is 75%, each CS shifts by 5%
 */
function columnShiftToAccuracy(cs: number): number {
  return Math.max(30, Math.min(95, 75 + cs * 5));
}

/**
 * Convert attack speed (seconds) to AP cost
 * Baseline: 1.5 seconds = 4 AP (standard pistol shot)
 */
function attackSpeedToAPCost(speed: number): number {
  return Math.max(2, Math.min(8, Math.round(speed * 2.5)));
}

/**
 * Get default range brackets for a weapon category
 */
function getDefaultBrackets(category: string, damageSubType: DamageSubType): WeaponRangeBrackets | undefined {
  // Map category to bracket type
  if (category.includes('Melee')) {
    return damageSubType === 'PIERCING_MELEE' ? DEFAULT_RANGE_BRACKETS.polearm : DEFAULT_RANGE_BRACKETS.melee;
  }
  if (damageSubType === 'BUCKSHOT' || damageSubType === 'SLUG') {
    return damageSubType === 'SLUG' ? DEFAULT_RANGE_BRACKETS.shotgun_slug : DEFAULT_RANGE_BRACKETS.shotgun;
  }
  if (damageSubType === 'LASER' || damageSubType === 'PLASMA' || damageSubType === 'PURE_ENERGY') {
    return DEFAULT_RANGE_BRACKETS.energy;
  }
  if (damageSubType === 'EXPLOSION' || damageSubType === 'SHRAPNEL') {
    return DEFAULT_RANGE_BRACKETS.grenade;
  }
  if (damageSubType === 'THROWN') {
    return DEFAULT_RANGE_BRACKETS.thrown;
  }
  // Default to pistol for generic ranged
  return DEFAULT_RANGE_BRACKETS.pistol;
}

/**
 * Convert full Weapon from database to SimWeapon for combat engine
 */
export function weaponToSimWeapon(weapon: Weapon): SimWeapon {
  // Get range brackets - use weapon-specific or default
  const brackets = weapon.rangeBrackets || getDefaultBrackets(weapon.category, weapon.damageSubType);

  // Convert to SimWeapon rangeBrackets format (slightly different structure)
  const simBrackets = brackets ? {
    pointBlank: brackets.pointBlank,
    pointBlankMod: brackets.pointBlankMod,
    short: brackets.short,
    shortMod: brackets.shortMod,
    optimal: brackets.optimal,
    optimalMod: brackets.optimalMod,
    long: brackets.long,
    longMod: brackets.longMod,
    max: brackets.max,
    extremeMod: brackets.extremeMod,
  } : undefined;

  // Determine knockback from special effects or damage type
  let knockbackForce: number | undefined;
  if (weapon.specialEffects.some(e => e.toLowerCase().includes('knockback'))) {
    knockbackForce = Math.round(weapon.baseDamage * 2.5);
  }
  if (weapon.damageSubType === 'BUCKSHOT') knockbackForce = 90;
  if (weapon.damageSubType === 'SLUG') knockbackForce = 100;
  if (weapon.damageSubType === 'EXPLOSION') knockbackForce = 150;

  // Check for light attack (fast weapons)
  const isLightAttack = weapon.attackSpeed <= 1.0 || weapon.category.includes('Melee');

  // Build the SimWeapon
  const simWeapon: SimWeapon = {
    name: weapon.name,
    damage: weapon.baseDamage,
    accuracy: columnShiftToAccuracy(weapon.accuracyCS),
    damageType: `${weapon.damageType}_${weapon.damageSubType}`,
    range: weapon.range,
    apCost: attackSpeedToAPCost(weapon.attackSpeed),
  };

  // Add optional properties
  if (knockbackForce) simWeapon.knockbackForce = knockbackForce;
  if (simBrackets) simWeapon.rangeBrackets = simBrackets;
  if (isLightAttack && weapon.category.includes('Melee')) simWeapon.isLightAttack = true;

  // Add melee special properties
  if (weapon.disarmBonus) {
    simWeapon.special = { ...simWeapon.special, disarmBonus: weapon.disarmBonus };
  }
  if (weapon.specialEffects.some(e => e.toLowerCase().includes('knockdown'))) {
    simWeapon.special = { ...simWeapon.special, knockdownChance: 30 };
  }

  return simWeapon;
}

/**
 * Full weapon database converted to SimWeapon format
 * 70+ weapons ready for combat engine use
 */
export const WEAPON_DATABASE: Record<string, SimWeapon> = Object.fromEntries(
  ALL_WEAPONS.map(w => [w.id, weaponToSimWeapon(w)])
);

/**
 * Get a weapon from the database by ID
 */
export function getWeaponById(id: string): SimWeapon | undefined {
  return WEAPON_DATABASE[id];
}

/**
 * Get all weapons of a specific category
 */
export function getWeaponsByCategory(category: 'melee' | 'ranged' | 'thrown' | 'special' | 'energy'): SimWeapon[] {
  const sources: Record<string, Weapon[]> = {
    melee: MELEE_WEAPONS,
    ranged: RANGED_WEAPONS,
    thrown: THROWN_WEAPONS,
    special: SPECIAL_WEAPONS,
    energy: ENERGY_WEAPONS,
  };
  return sources[category].map(weaponToSimWeapon);
}

// ============ WEAPON PRESETS ============

export const WEAPONS: Record<string, SimWeapon> = {
  // Pistols
  lightPistol: {
    name: 'Light Pistol',
    damage: 15,
    accuracy: 70,
    damageType: 'GUNFIRE_BULLET',
    range: 10,
    apCost: 3,   // Was 2 - quick pistol shots
    isLightAttack: true,  // Quick shot - can move after
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 10,
      short: 5, shortMod: 5,
      optimal: 10, optimalMod: 0,
      long: 15, longMod: -10,
      max: 20, extremeMod: -25,
    },
  },
  standardPistol: {
    name: 'Standard Pistol',
    damage: 20,
    accuracy: 70,
    damageType: 'GUNFIRE_BULLET',
    range: 12,
    apCost: 4,   // Was 2 - aimed shots
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 10,
      short: 5, shortMod: 5,
      optimal: 12, optimalMod: 0,
      long: 18, longMod: -10,
      max: 25, extremeMod: -25,
    },
  },
  heavyPistol: {
    name: 'Heavy Pistol',
    damage: 25,
    accuracy: 65,
    damageType: 'GUNFIRE_BULLET',
    range: 10,
    apCost: 5,   // Was 3 - heavy recoil recovery
    knockbackForce: 60,
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 15,
      short: 5, shortMod: 5,
      optimal: 10, optimalMod: 0,
      long: 15, longMod: -15,
      max: 20, extremeMod: -30,
    },
  },

  // Rifles
  assaultRifle: {
    name: 'Assault Rifle',
    damage: 30,
    accuracy: 70,
    damageType: 'GUNFIRE_BULLET',
    range: 20,
    apCost: 5,   // Was 3 - burst fire
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: -25,  // Was -10, rifles are clunky in CQB
      short: 6, shortMod: 5,
      optimal: 15, optimalMod: 10,
      long: 25, longMod: -5,
      max: 35, extremeMod: -20,
    },
  },
  battleRifle: {
    name: 'Battle Rifle',
    damage: 35,
    accuracy: 65,
    damageType: 'GUNFIRE_BULLET',
    range: 25,
    apCost: 6,   // Was 3 - heavy semi-auto
    knockbackForce: 80,
    rangeBrackets: {
      pointBlank: 3, pointBlankMod: -15,
      short: 8, shortMod: 0,
      optimal: 20, optimalMod: 10,
      long: 30, longMod: 0,
      max: 40, extremeMod: -15,
    },
  },
  sniperRifle: {
    name: 'Sniper Rifle',
    damage: 45,
    accuracy: 60,
    damageType: 'GUNFIRE_BULLET',
    range: 40,
    apCost: 8,   // Was 4 - full turn to aim and fire
    rangeBrackets: {
      pointBlank: 3, pointBlankMod: -30,
      short: 8, shortMod: -15,
      optimal: 25, optimalMod: 25,
      long: 40, longMod: 10,
      max: 60, extremeMod: -10,
    },
  },

  // Shotguns
  pumpShotgun: {
    name: 'Pump Shotgun',
    damage: 35,
    accuracy: 60,
    damageType: 'GUNFIRE_BUCKSHOT',
    range: 8,
    apCost: 5,   // Was 3 - pump action cycle
    knockbackForce: 90,
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 30,
      short: 4, shortMod: 15,
      optimal: 6, optimalMod: 0,
      long: 10, longMod: -20,
      max: 15, extremeMod: -40,
    },
  },
  combatShotgun: {
    name: 'Combat Shotgun',
    damage: 30,
    accuracy: 65,
    damageType: 'GUNFIRE_BUCKSHOT',
    range: 10,
    apCost: 4,   // Was 2 - semi-auto shotgun
    knockbackForce: 80,
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 25,
      short: 5, shortMod: 10,
      optimal: 8, optimalMod: 0,
      long: 12, longMod: -15,
      max: 18, extremeMod: -35,
    },
  },

  // SMG
  smg: {
    name: 'SMG',
    damage: 20,
    accuracy: 65,
    damageType: 'GUNFIRE_BULLET',
    range: 12,
    apCost: 3,   // Was 2 - quick burst
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 15,
      short: 5, shortMod: 10,
      optimal: 10, optimalMod: 0,
      long: 15, longMod: -15,
      max: 20, extremeMod: -30,
    },
  },

  // Melee - Blades
  knife: {
    name: 'Combat Knife',
    damage: 12,  // Increased from 10 - lethal blade
    accuracy: 80,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 3,   // Increased from 2 - proper attack, not a jab
    isLightAttack: true,  // Quick stab - can move after
  },
  machete: {
    name: 'Machete',
    damage: 15,
    accuracy: 75,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 4,   // Was 2 - heavier blade
  },

  // ============ UNARMED ATTACKS ============
  // "Trained fighters hit HARD. A boxer's cross can drop someone."
  // Buffed from original - martial artists should be competitive with weapons.

  fist: {
    name: 'Fist',
    damage: 10,  // Trained punch
    accuracy: 88,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,   // Was 1 - scaled for 8 AP budget
    isLightAttack: true,  // Quick punch - can combo into heavy or move
  },
  jab: {
    name: 'Jab',
    damage: 3,   // Was 6 - setup punch, not damage dealer
    accuracy: 95,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,   // Was 1 - quick but still takes time
    knockbackForce: 10,
    isLightAttack: true,  // Setup punch - combo into cross/hook
  },
  cross: {
    name: 'Cross',
    damage: 14,  // Power punch
    accuracy: 85,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 3,   // Was 1 - power punch takes wind-up
    knockbackForce: 40,
  },
  hook: {
    name: 'Hook',
    damage: 16,  // Devastating when it lands
    accuracy: 78,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 4,   // Was 2 - big commitment
    knockbackForce: 60,
  },
  uppercut: {
    name: 'Uppercut',
    damage: 20,  // Knockout punch
    accuracy: 72,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 4,   // Was 2 - big commitment
    knockbackForce: 80,
  },
  kick: {
    name: 'Kick',
    damage: 15,  // Legs are stronger than arms
    accuracy: 80,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 4,   // Was 2 - balance + power
    knockbackForce: 70,
  },
  roundhouseKick: {
    name: 'Roundhouse Kick',
    damage: 22,  // Devastating spinning kick
    accuracy: 68,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 6,   // Was 3 - full spin commitment
    knockbackForce: 100,
  },

  // ============ MARTIAL ARTS WEAPONS ============
  // "Nunchucks excel at disarming. Staff has reach. Tonfa are defensive."

  nunchucks: {
    name: 'Nunchucks',
    damage: 15,  // Increased from 12 - heavy swinging weapon
    accuracy: 75,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 4,   // Heavy swing commitment
    knockbackForce: 40,
    special: { disarmBonus: 25 },  // Excellent at disarming!
  },
  boStaff: {
    name: 'Bo Staff',
    damage: 15,
    accuracy: 80,
    damageType: 'IMPACT_BLUNT',
    range: 2,  // Extra reach!
    apCost: 4,   // Was 2 - sweeping motion
    knockbackForce: 70,
    special: { knockdownChance: 30 },  // Good at sweeping legs
  },
  tonfa: {
    name: 'Tonfa',
    damage: 10,
    accuracy: 85,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,   // Was 1 - quick defensive strikes
    knockbackForce: 30,
    special: { blockBonus: 15 },  // Defensive weapon
    isLightAttack: true,  // Quick defensive strike - can reposition after
  },
  sai: {
    name: 'Sai',
    damage: 14,
    accuracy: 80,
    damageType: 'EDGED_PIERCING',
    range: 1,
    apCost: 4,   // Was 2 - trapping technique
    knockbackForce: 20,
    special: { bladeTrapping: true, disarmBonus: 15 },  // Blade-catching
  },
  brassKnuckles: {
    name: 'Brass Knuckles',
    damage: 10,  // Reduced from 12 - enhanced fist, not power weapon
    accuracy: 90,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,   // Quick punches like fist
    knockbackForce: 40,
    isLightAttack: true,  // Enhanced fist - quick strike
  },
  katana: {
    name: 'Katana',
    damage: 25,
    accuracy: 70,
    damageType: 'EDGED_SLASHING',
    range: 2,
    apCost: 6,   // Was 3 - full sword swing
    knockbackForce: 30,
  },

  // Energy (for later testing)
  laserRifle: {
    name: 'Laser Rifle',
    damage: 40,
    accuracy: 75,
    damageType: 'ELECTROMAGNETIC_LASER',
    range: 30,
    apCost: 3,
    rangeBrackets: {
      pointBlank: 3, pointBlankMod: 0,
      short: 10, shortMod: 5,
      optimal: 25, optimalMod: 10,
      long: 35, longMod: 0,
      max: 50, extremeMod: -10,
    },
  },
  electricRifle: {
    name: 'Electric Rifle',
    damage: 35,
    accuracy: 70,
    damageType: 'ELECTROMAGNETIC_BOLT',
    range: 15,
    apCost: 3,
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 5,
      short: 6, shortMod: 5,
      optimal: 12, optimalMod: 5,
      long: 18, longMod: -5,
      max: 25, extremeMod: -20,
    },
  },

  // ============ HEAVY WEAPONS ============

  lmg: {
    name: 'Light Machine Gun',
    damage: 28,
    accuracy: 55,
    damageType: 'GUNFIRE_BULLET',
    range: 25,
    apCost: 6,   // Full turn to fire
    knockbackForce: 40,
    rangeBrackets: {
      pointBlank: 3, pointBlankMod: -20,  // Too unwieldy up close
      short: 8, shortMod: 0,
      optimal: 18, optimalMod: 10,
      long: 30, longMod: 0,
      max: 40, extremeMod: -15,
    },
  },
  minigun: {
    name: 'Minigun',
    damage: 45,  // Devastating sustained fire
    accuracy: 60,
    damageType: 'GUNFIRE_BULLET',
    range: 20,
    apCost: 5,   // Fast fire rate
    knockbackForce: 60,
    rangeBrackets: {
      pointBlank: 3, pointBlankMod: -10,
      short: 8, shortMod: 5,
      optimal: 15, optimalMod: 10,
      long: 25, longMod: -10,
      max: 35, extremeMod: -30,
    },
  },
  rocketLauncher: {
    name: 'Rocket Launcher',
    damage: 80,
    accuracy: 60,
    damageType: 'EXPLOSIVE_BLAST',
    range: 25,
    apCost: 8,   // Full turn to fire
    knockbackForce: 200,
    rangeBrackets: {
      pointBlank: 5, pointBlankMod: -50,  // Danger close!
      short: 10, shortMod: 0,
      optimal: 20, optimalMod: 10,
      long: 30, longMod: -10,
      max: 40, extremeMod: -25,
    },
  },
  grenadeLauncher: {
    name: 'Grenade Launcher',
    damage: 45,
    accuracy: 65,
    damageType: 'EXPLOSIVE_BLAST',
    range: 20,
    apCost: 5,
    knockbackForce: 120,
    rangeBrackets: {
      pointBlank: 3, pointBlankMod: -40,
      short: 8, shortMod: 0,
      optimal: 15, optimalMod: 10,
      long: 25, longMod: -5,
      max: 30, extremeMod: -20,
    },
  },

  // ============ EXOTIC WEAPONS ============

  flamethrower: {
    name: 'Flamethrower',
    damage: 25,
    accuracy: 80,  // Easy to hit with flames
    damageType: 'THERMAL_FIRE',
    range: 6,      // Short range
    apCost: 4,
    knockbackForce: 20,
    rangeBrackets: {
      pointBlank: 1, pointBlankMod: 20,
      short: 3, shortMod: 10,
      optimal: 5, optimalMod: 0,
      long: 7, longMod: -20,
      max: 10, extremeMod: -50,
    },
  },
  plasmaPistol: {
    name: 'Plasma Pistol',
    damage: 30,
    accuracy: 70,
    damageType: 'ENERGY_PLASMA',
    range: 12,
    apCost: 4,
    knockbackForce: 50,
    rangeBrackets: {
      pointBlank: 2, pointBlankMod: 10,
      short: 5, shortMod: 5,
      optimal: 10, optimalMod: 0,
      long: 15, longMod: -15,
      max: 20, extremeMod: -30,
    },
  },
  plasmaRifle: {
    name: 'Plasma Rifle',
    damage: 40,  // Reduced for balance
    accuracy: 60,
    damageType: 'ENERGY_PLASMA',
    range: 25,
    apCost: 5,   // Faster but less damage
    knockbackForce: 80,
    rangeBrackets: {
      pointBlank: 3, pointBlankMod: 0,
      short: 8, shortMod: 5,
      optimal: 20, optimalMod: 10,
      long: 30, longMod: -5,
      max: 40, extremeMod: -20,
    },
  },
  railgun: {
    name: 'Railgun',
    damage: 100,
    accuracy: 55,
    damageType: 'ENERGY_KINETIC',
    range: 50,
    apCost: 8,   // Full turn - massive weapon
    knockbackForce: 150,
    rangeBrackets: {
      pointBlank: 5, pointBlankMod: -30,
      short: 15, shortMod: -10,
      optimal: 35, optimalMod: 15,
      long: 50, longMod: 5,
      max: 70, extremeMod: -10,
    },
  },

  // ============ MELEE - POWERED ============

  shockBaton: {
    name: 'Shock Baton',
    damage: 12,
    accuracy: 85,
    damageType: 'ELECTROMAGNETIC_BOLT',
    range: 1,
    apCost: 3,
    knockbackForce: 30,
  },
  chainsaw: {
    name: 'Chainsaw',
    damage: 35,
    accuracy: 60,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 5,
    knockbackForce: 40,
  },
  powerFist: {
    name: 'Power Fist',
    damage: 40,
    accuracy: 70,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 5,
    knockbackForce: 120,
  },
  vibroblade: {
    name: 'Vibroblade',
    damage: 30,
    accuracy: 75,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 4,
    knockbackForce: 20,
  },

  // ============ SPECIAL ============

  tazer: {
    name: 'Tazer',
    damage: 5,
    accuracy: 75,
    damageType: 'ELECTROMAGNETIC_BOLT',
    range: 3,
    apCost: 3,
    knockbackForce: 10,
  },
  netGun: {
    name: 'Net Gun',
    damage: 0,
    accuracy: 70,
    damageType: 'SPECIAL',
    range: 10,
    apCost: 4,
    knockbackForce: 0,
  },
};

// ============ UNIT PRESETS ============

export const UNIT_PRESETS: Record<string, UnitPreset> = {
  // Average humans
  civilianPistol: {
    name: 'Civilian (Pistol)',
    description: 'Average person with a light pistol',
    stats: HUMAN_BASELINE_STATS.average,
    hp: 60,
    dr: 0,
    stoppingPower: 0,
    weapon: WEAPONS.lightPistol,
  },

  // Trained soldiers
  soldierRifle: {
    name: 'Soldier (Rifle)',
    description: 'Trained soldier with assault rifle and kevlar',
    stats: HUMAN_BASELINE_STATS.trained,
    hp: 80,
    dr: 10,
    stoppingPower: 5,
    weapon: WEAPONS.assaultRifle,
  },
  soldierShotgun: {
    name: 'Soldier (Shotgun)',
    description: 'Trained soldier with shotgun and kevlar',
    stats: HUMAN_BASELINE_STATS.trained,
    hp: 80,
    dr: 10,
    stoppingPower: 5,
    weapon: WEAPONS.pumpShotgun,
  },
  soldierPistol: {
    name: 'Soldier (Pistol)',
    description: 'Trained soldier with sidearm and light vest',
    stats: HUMAN_BASELINE_STATS.trained,
    hp: 80,
    dr: 5,           // Light vest, not tactical armor
    stoppingPower: 2, // Minimal stopping power
    weapon: WEAPONS.standardPistol,
  },

  // Elite operatives
  operativeSniper: {
    name: 'Operative (Sniper)',
    description: 'Elite sniper with tactical gear',
    stats: HUMAN_BASELINE_STATS.elite,
    hp: 100,
    dr: 15,
    stoppingPower: 8,
    weapon: WEAPONS.sniperRifle,
  },
  operativeSMG: {
    name: 'Operative (SMG)',
    description: 'Elite operative with SMG and tactical gear',
    stats: HUMAN_BASELINE_STATS.elite,
    hp: 100,
    dr: 15,
    stoppingPower: 8,
    weapon: WEAPONS.smg,
  },

  // ============ UNARMED COMBATANTS ============

  brawler: {
    name: 'Street Brawler',
    description: 'Untrained fighter, relies on fists',
    stats: HUMAN_BASELINE_STATS.average,
    hp: 60,
    dr: 0,
    stoppingPower: 0,
    weapon: WEAPONS.fist,
  },
  boxer: {
    name: 'Boxer',
    description: 'Trained boxer with fast hands',
    stats: { MEL: 25, AGL: 25, STR: 20, STA: 20 },
    hp: 90,
    dr: 0,
    stoppingPower: 0,
    weapon: WEAPONS.cross,  // Default to cross, can chain attacks
  },
  kickboxer: {
    name: 'Kickboxer',
    description: 'Trained in strikes and kicks',
    stats: { MEL: 25, AGL: 30, STR: 20, STA: 20 },
    hp: 95,
    dr: 0,
    stoppingPower: 0,
    weapon: WEAPONS.kick,
  },

  // ============ MARTIAL ARTISTS ============

  nunchuckFighter: {
    name: 'Nunchuck Fighter',
    description: 'Skilled with nunchucks - excels at disarming',
    stats: { MEL: 30, AGL: 30, STR: 20, STA: 20 },
    hp: 100,
    dr: 2,
    stoppingPower: 0,
    weapon: WEAPONS.nunchucks,
  },
  staffFighter: {
    name: 'Staff Fighter',
    description: 'Bo staff expert with reach advantage',
    stats: { MEL: 25, AGL: 25, STR: 25, STA: 25 },
    hp: 100,
    dr: 2,
    stoppingPower: 0,
    weapon: WEAPONS.boStaff,
  },
  knifeExpert: {
    name: 'Knife Expert',
    description: 'Fast and deadly with a blade',
    stats: { MEL: 30, AGL: 35, STR: 15, STA: 20 },
    hp: 100,
    dr: 0,
    stoppingPower: 0,
    weapon: WEAPONS.knife,
  },
  samurai: {
    name: 'Samurai',
    description: 'Katana master with devastating strikes',
    stats: { MEL: 35, AGL: 25, STR: 25, STA: 25 },
    hp: 110,
    dr: 5,  // Light armor
    stoppingPower: 0,
    weapon: WEAPONS.katana,
  },

  // ============ STREET ENEMIES ============

  thug: {
    name: 'Street Thug',
    description: 'Low-level criminal with a knife',
    stats: HUMAN_BASELINE_STATS.average,
    hp: 50,
    dr: 0,
    stoppingPower: 0,
    weapon: WEAPONS.knife,
  },
  thugPistol: {
    name: 'Armed Thug',
    description: 'Criminal with a cheap pistol',
    stats: HUMAN_BASELINE_STATS.average,
    hp: 50,
    dr: 0,
    stoppingPower: 0,
    weapon: WEAPONS.lightPistol,
  },
  gangEnforcer: {
    name: 'Gang Enforcer',
    description: 'Experienced street fighter with brass knuckles',
    stats: { MEL: 20, AGL: 18, STR: 22, STA: 20 },
    hp: 70,
    dr: 2,
    stoppingPower: 0,
    weapon: WEAPONS.brassKnuckles,
  },
  gangLeader: {
    name: 'Gang Leader',
    description: 'Hardened criminal with SMG',
    stats: { MEL: 22, AGL: 22, STR: 20, STA: 22 },
    hp: 85,
    dr: 5,
    stoppingPower: 2,
    weapon: WEAPONS.smg,
  },

  // ============ HEAVY UNITS ============

  heavyGunner: {
    name: 'Heavy Gunner',
    description: 'Soldier with LMG and heavy armor',
    stats: { MEL: 15, AGL: 12, STR: 28, STA: 25 },
    hp: 120,
    dr: 12,             // Reduced for balance
    stoppingPower: 8,   // Blocks weak pistols
    weapon: WEAPONS.lmg,
  },
  rocketTrooper: {
    name: 'Rocket Trooper',
    description: 'Anti-vehicle specialist with rocket launcher',
    stats: { MEL: 15, AGL: 15, STR: 25, STA: 22 },
    hp: 100,
    dr: 15,
    stoppingPower: 8,
    weapon: WEAPONS.rocketLauncher,
  },
  flametrooper: {
    name: 'Flametrooper',
    description: 'Close-range specialist with flamethrower',
    stats: { MEL: 18, AGL: 15, STR: 22, STA: 25 },
    hp: 110,
    dr: 18,
    stoppingPower: 8,
    weapon: WEAPONS.flamethrower,
  },

  // ============ ROBOTS ============

  securityBot: {
    name: 'Security Bot',
    description: 'Basic security robot with built-in tazer',
    stats: { MEL: 15, AGL: 15, STR: 18, STA: 18 },
    hp: 70,
    dr: 8,
    stoppingPower: 3,
    weapon: WEAPONS.tazer,
  },
  combatDrone: {
    name: 'Combat Drone',
    description: 'Armed drone with electric rifle',
    stats: { MEL: 10, AGL: 25, STR: 15, STA: 15 },
    hp: 50,
    dr: 6,
    stoppingPower: 2,
    weapon: WEAPONS.electricRifle,  // Less damage than plasma
  },
  warBot: {
    name: 'War Bot',
    description: 'Heavy combat robot with plasma rifle',
    stats: { MEL: 20, AGL: 12, STR: 28, STA: 28 },
    hp: 120,
    dr: 12,             // Reduced for balance
    stoppingPower: 6,   // Allows rifles through
    weapon: WEAPONS.plasmaRifle,
  },
  terminatorBot: {
    name: 'Terminator',
    description: 'Advanced war machine with minigun',
    stats: { MEL: 25, AGL: 18, STR: 35, STA: 35 },
    hp: 180,
    dr: 18,             // Reduced for balance
    stoppingPower: 10,  // Blocks weak weapons
    weapon: WEAPONS.minigun,
  },

  // ============ SUPERHUMANS ============

  mutantBruiser: {
    name: 'Mutant Bruiser',
    description: 'Enhanced strength and durability',
    stats: { MEL: 35, AGL: 20, STR: 40, STA: 35 },
    hp: 180,
    dr: 15,
    stoppingPower: 10,
    weapon: WEAPONS.powerFist,
  },
  psychicAgent: {
    name: 'Psychic Agent',
    description: 'Mind-enhanced operative with railgun',
    stats: { MEL: 20, AGL: 30, STR: 18, STA: 22 },
    hp: 90,
    dr: 8,
    stoppingPower: 5,
    weapon: WEAPONS.railgun,
  },
  cyborgSoldier: {
    name: 'Cyborg Soldier',
    description: 'Human-machine hybrid with plasma rifle',
    stats: { MEL: 28, AGL: 25, STR: 30, STA: 28 },
    hp: 140,
    dr: 22,
    stoppingPower: 12,
    weapon: WEAPONS.plasmaRifle,
  },
  superSpeedster: {
    name: 'Speedster',
    description: 'Super-fast combatant with vibroblade',
    stats: { MEL: 30, AGL: 40, STR: 20, STA: 25 },  // Still fast but not absurd
    hp: 100,
    dr: 5,
    stoppingPower: 0,
    weapon: WEAPONS.vibroblade,
  },

  // ============ BOSSES ============

  bossJuggernaut: {
    name: 'Juggernaut',
    description: 'Unstoppable brute with minigun',
    stats: { MEL: 35, AGL: 20, STR: 45, STA: 45 },  // More agile
    hp: 280,
    dr: 12,             // Rifles do ~5 damage
    stoppingPower: 8,   // Blocks pistols
    weapon: WEAPONS.minigun,
  },
  bossAssassin: {
    name: 'Shadow Assassin',
    description: 'Deadly silent killer with vibroblade',
    stats: { MEL: 40, AGL: 45, STR: 25, STA: 30 },
    hp: 150,
    dr: 10,
    stoppingPower: 5,
    weapon: WEAPONS.vibroblade,
  },
  bossMechsuit: {
    name: 'Mech Pilot',
    description: 'Power armor with rocket launcher',
    stats: { MEL: 25, AGL: 20, STR: 40, STA: 40 },
    hp: 200,
    dr: 22,             // Reduced for balance
    stoppingPower: 15,  // Heavy armor
    weapon: WEAPONS.rocketLauncher,
  },
  bossWarlord: {
    name: 'Warlord',
    description: 'Elite commander with railgun',
    stats: { MEL: 35, AGL: 30, STR: 35, STA: 35 },
    hp: 200,
    dr: 25,
    stoppingPower: 15,
    weapon: WEAPONS.railgun,
  },
};

// ============ UNIT FACTORY ============

let unitIdCounter = 0;

/**
 * Create a unit from a preset.
 */
export function createUnit(
  preset: UnitPreset,
  team: 'blue' | 'red',
  name?: string
): SimUnit {
  const id = `${team}_${++unitIdCounter}`;
  return {
    id,
    name: name || preset.name,
    team,
    hp: preset.hp,
    maxHp: preset.hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: preset.dr,
    stoppingPower: preset.stoppingPower,
    origin: 'biological',
    stats: { ...preset.stats },
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon: { ...preset.weapon },
    disarmed: false,
    alive: true,
    acted: false,
  };
}

/**
 * Create a unit with custom stats.
 */
export function createCustomUnit(
  team: 'blue' | 'red',
  name: string,
  stats: SimUnit['stats'],
  weapon: SimWeapon,
  options: Partial<{
    dr: number;
    stoppingPower: number;
    shieldHp: number;
    armor: SimArmor;        // NEW: Equipped armor
    stance: SimUnit['stance'];
    cover: SimUnit['cover'];
    origin: SimUnit['origin'];
  }> = {}
): SimUnit {
  const id = `${team}_${++unitIdCounter}`;
  const hp = calculateHP(stats);

  // Calculate protection from armor if provided, otherwise use raw values
  const armorProtection = options.armor
    ? calculateArmorProtection(options.armor)
    : { dr: options.dr || 0, stoppingPower: options.stoppingPower || 0, shieldHp: options.shieldHp || 0 };

  return {
    id,
    name,
    team,
    hp,
    maxHp: hp,
    shieldHp: armorProtection.shieldHp,
    maxShieldHp: armorProtection.shieldHp,
    dr: armorProtection.dr,
    stoppingPower: armorProtection.stoppingPower,
    origin: options.origin || 'biological',
    stats: { ...stats },
    stance: options.stance || 'normal',
    cover: options.cover || 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon: { ...weapon },
    armor: options.armor,   // Store armor reference
    disarmed: false,
    alive: true,
    acted: false,
  };
}

/**
 * Create a team of identical units.
 */
export function createTeam(
  preset: UnitPreset,
  team: 'blue' | 'red',
  count: number,
  namePrefix?: string
): SimUnit[] {
  return Array.from({ length: count }, (_, i) =>
    createUnit(preset, team, namePrefix ? `${namePrefix} ${i + 1}` : undefined)
  );
}

// ============ TEST SCENARIOS ============

/**
 * Standard 3v3 soldier test.
 */
export function createSoldierTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  description: string;
} {
  return {
    blue: createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3, 'Blue'),
    red: createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Red'),
    description: '3v3 Soldiers with Assault Rifles (balanced)',
  };
}

/**
 * Rifle vs Pistol test - WEAPON ROLE comparison with equal armor.
 * Tests weapon effectiveness, not armor differences.
 * At "optimal range" (no range mods), rifles should have slight edge
 * due to higher single-shot damage, but pistols get more attacks.
 */
export function createRifleVsPistolTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  description: string;
} {
  // Use same armor on both sides to test pure weapon performance
  const stats = HUMAN_BASELINE_STATS.trained;
  const lightArmor = { dr: 5, stoppingPower: 2 };  // Light armor for both

  const rifleTeam = [
    createCustomUnit('blue', 'Rifle 1', stats, WEAPONS.assaultRifle, lightArmor),
    createCustomUnit('blue', 'Rifle 2', stats, WEAPONS.assaultRifle, lightArmor),
    createCustomUnit('blue', 'Rifle 3', stats, WEAPONS.assaultRifle, lightArmor),
  ];
  const pistolTeam = [
    createCustomUnit('red', 'Pistol 1', stats, WEAPONS.standardPistol, lightArmor),
    createCustomUnit('red', 'Pistol 2', stats, WEAPONS.standardPistol, lightArmor),
    createCustomUnit('red', 'Pistol 3', stats, WEAPONS.standardPistol, lightArmor),
  ];

  return {
    blue: rifleTeam,
    red: pistolTeam,
    description: '3 Rifles vs 3 Pistols (equal armor, rifles ~55-65%)',
  };
}

/**
 * Shotgun vs Rifle test - tests range dynamics.
 */
export function createShotgunVsRifleTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  description: string;
} {
  return {
    blue: createTeam(UNIT_PRESETS.soldierShotgun, 'blue', 3, 'Shotgun'),
    red: createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Rifle'),
    description: '3 Shotguns vs 3 Rifles (no range = shotguns win)',
  };
}

/**
 * Cover effectiveness test.
 */
export function createCoverTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3, 'Cover');
  blue.forEach(u => u.cover = 'half');

  return {
    blue,
    red: createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Open'),
    description: '3 in Half Cover vs 3 in Open (cover should win ~65%)',
  };
}

/**
 * Elite vs Numbers test.
 */
export function createEliteVsNumbersTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  description: string;
} {
  return {
    blue: createTeam(UNIT_PRESETS.operativeSniper, 'blue', 2, 'Elite'),
    red: createTeam(UNIT_PRESETS.civilianPistol, 'red', 5, 'Civilian'),
    description: '2 Elite Snipers vs 5 Armed Civilians',
  };
}

// ============ RANGE-BASED TEST SCENARIOS ============

/**
 * Close range test (3 tiles) - tests CQB dynamics.
 * Shotguns and pistols should excel here.
 */
export function createCloseRangeTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3, 'Blue');
  const red = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Red');

  // Position blue team at (0, 5) and red at (3, 5) - 3 tiles apart
  blue.forEach((u, i) => u.position = { x: 0, y: 5 + i });
  red.forEach((u, i) => u.position = { x: 3, y: 5 + i });

  return {
    blue,
    red,
    distance: 3,
    description: '3v3 Soldiers at Close Range (3 tiles) - rifles suffer point-blank penalty',
  };
}

/**
 * Medium range test (10 tiles) - optimal for rifles.
 */
export function createMediumRangeTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3, 'Blue');
  const red = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Red');

  blue.forEach((u, i) => u.position = { x: 0, y: 5 + i });
  red.forEach((u, i) => u.position = { x: 10, y: 5 + i });

  return {
    blue,
    red,
    distance: 10,
    description: '3v3 Soldiers at Medium Range (10 tiles) - balanced',
  };
}

/**
 * Long range test (25 tiles) - snipers excel, pistols suffer.
 */
export function createLongRangeTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3, 'Blue');
  const red = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Red');

  blue.forEach((u, i) => u.position = { x: 0, y: 5 + i });
  red.forEach((u, i) => u.position = { x: 25, y: 5 + i });

  return {
    blue,
    red,
    distance: 25,
    description: '3v3 Soldiers at Long Range (25 tiles) - rifles suffer long-range penalty',
  };
}

/**
 * Shotgun advantage test - shotguns at close range vs rifles.
 * At 2 tiles: Shotgun +30 accuracy (pointBlank), Rifle -10 accuracy (pointBlank).
 * IMPORTANT: All units at same Y to ensure exactly 2 tile distance for all attacks.
 */
export function createShotgunCloseRangeTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.soldierShotgun, 'blue', 3, 'Shotgun');
  const red = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Rifle');

  // All at same Y to ensure exactly 2 tiles distance for every attack
  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 2, y: 5 });

  return {
    blue,
    red,
    distance: 2,
    description: 'Shotguns vs Rifles at POINT BLANK (2 tiles, same line)',
  };
}

/**
 * Sniper advantage test - snipers at long range vs rifles.
 */
export function createSniperLongRangeTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.operativeSniper, 'blue', 2, 'Sniper');
  const red = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Rifle');

  blue.forEach((u, i) => u.position = { x: 0, y: 5 + i });
  red.forEach((u, i) => u.position = { x: 30, y: 5 + i }); // 30 tiles - sniper optimal

  return {
    blue,
    red,
    distance: 30,
    description: '2 Snipers vs 3 Rifles at 30 tiles (snipers should win)',
  };
}

/**
 * Pistol close range test - pistols at point-blank vs rifles.
 * At 2 tiles: Pistol +10 accuracy (pointBlank), Rifle -10 accuracy (pointBlank).
 * IMPORTANT: All units at same Y to ensure exactly 2 tile distance.
 */
export function createPistolCloseRangeTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  // Use equal armor for fair weapon comparison at close range
  const stats = HUMAN_BASELINE_STATS.trained;
  const lightArmor = { dr: 5, stoppingPower: 2 };

  const blue = [
    createCustomUnit('blue', 'Pistol 1', stats, WEAPONS.standardPistol, lightArmor),
    createCustomUnit('blue', 'Pistol 2', stats, WEAPONS.standardPistol, lightArmor),
    createCustomUnit('blue', 'Pistol 3', stats, WEAPONS.standardPistol, lightArmor),
  ];
  const red = [
    createCustomUnit('red', 'Rifle 1', stats, WEAPONS.assaultRifle, lightArmor),
    createCustomUnit('red', 'Rifle 2', stats, WEAPONS.assaultRifle, lightArmor),
    createCustomUnit('red', 'Rifle 3', stats, WEAPONS.assaultRifle, lightArmor),
  ];

  // All at same Y to ensure exactly 2 tiles distance for every attack
  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 2, y: 5 });

  return {
    blue,
    red,
    distance: 2,
    description: 'Pistols vs Rifles at POINT BLANK (2 tiles, same line)',
  };
}

/**
 * Reset unit ID counter (for clean test runs).
 */
export function resetUnitIds(): void {
  unitIdCounter = 0;
}

// ============ MELEE/CQB TEST SCENARIOS ============

/**
 * Unarmed mirror match - boxers vs boxers.
 * Tests pure melee balance.
 */
export function createUnarmedMirrorTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.boxer, 'blue', 3, 'Boxer');
  const red = createTeam(UNIT_PRESETS.boxer, 'red', 3, 'Boxer');

  // Adjacent units for melee
  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 1, y: 5 });

  return {
    blue,
    red,
    distance: 1,
    description: '3 Boxers vs 3 Boxers at melee range (1 tile)',
  };
}

/**
 * Nunchucks vs knives - martial arts comparison.
 * Nunchucks should be competitive despite lower damage due to high accuracy.
 */
export function createNunchucksVsKnivesTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.nunchuckFighter, 'blue', 3, 'Nunchucks');
  const red = createTeam(UNIT_PRESETS.knifeExpert, 'red', 3, 'Knife');

  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 1, y: 5 });

  return {
    blue,
    red,
    distance: 1,
    description: '3 Nunchuck Fighters vs 3 Knife Experts at melee range',
  };
}

/**
 * Staff vs melee - tests reach advantage.
 * Bo staff (range 2) vs fists (range 1) - staff should have advantage.
 */
export function createStaffVsFistsTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.staffFighter, 'blue', 3, 'Staff');
  const red = createTeam(UNIT_PRESETS.brawler, 'red', 3, 'Brawler');

  // At 2 tiles, staff can attack but fists can't!
  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 2, y: 5 });

  return {
    blue,
    red,
    distance: 2,
    description: '3 Staff Fighters vs 3 Brawlers at 2 tiles (staff reach advantage)',
  };
}

/**
 * Melee vs Pistol (CQB) - close quarters gunfight.
 * Knife experts should be competitive against pistol users at range 1.
 */
export function createMeleeVsPistolTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.knifeExpert, 'blue', 3, 'Knife');
  const red = createTeam(UNIT_PRESETS.civilianPistol, 'red', 3, 'Pistol');

  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 1, y: 5 });

  return {
    blue,
    red,
    distance: 1,
    description: '3 Knife Experts vs 3 Civilians with Pistols at melee range',
  };
}

/**
 * Samurai vs Soldiers - katana vs modern weapons at close range.
 * Tests if high damage melee can compete with firearms.
 */
export function createSamuraiVsSoldiersTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.samurai, 'blue', 2, 'Samurai');
  const red = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Soldier');

  // Close range - samurai territory
  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 2, y: 5 });

  return {
    blue,
    red,
    distance: 2,
    description: '2 Samurai vs 3 Soldiers at 2 tiles (can samurai close the gap?)',
  };
}

/**
 * Kickboxer vs Boxer - pure unarmed comparison.
 * Tests kick damage vs punch speed.
 */
export function createKickboxerVsBoxerTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  distance: number;
  description: string;
} {
  const blue = createTeam(UNIT_PRESETS.kickboxer, 'blue', 3, 'Kickboxer');
  const red = createTeam(UNIT_PRESETS.boxer, 'red', 3, 'Boxer');

  blue.forEach((u, i) => u.position = { x: 0, y: 5 });
  red.forEach((u, i) => u.position = { x: 1, y: 5 });

  return {
    blue,
    red,
    distance: 1,
    description: '3 Kickboxers vs 3 Boxers at melee range (kicks vs punches)',
  };
}

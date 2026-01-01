/**
 * Weapon Database Integration Functions
 * Converts weapons from weapons.ts to CombatScene format
 */

import type { Weapon } from '../../data/equipmentTypes';
import { getDefaultRangeBrackets } from '../../data/equipmentTypes';
import { getWeaponByName, getWeaponById } from '../../data/weapons';

// Import the WEAPONS type from CombatScene (we'll reference it externally)
type CombatWeapon = {
  name: string;
  emoji: string;
  damage: number;
  range: number;
  accuracy: number;
  ap: number;
  visual: {
    type: 'projectile' | 'beam' | 'cone' | 'melee';
    color: number;
    spread?: number;
  };
  sound: {
    decibels: number;
    baseRange: number;
  };
  rangeBrackets: any;
  knockback?: number;
  blastRadius?: number;
  penetrationMult?: number; // 0-2: multiplier to reduce effective armor DR (1.0 = normal, 2.0 = AP rounds)
};

/**
 * Get sound profile based on weapon category and properties (VE-002)
 * Maps weapon categories to appropriate decibel levels and sound ranges
 */
function getSoundProfile(weapon: Weapon): { decibels: number; baseRange: number } {
  const category = weapon.category;
  const name = weapon.name.toLowerCase();

  // Sound profiles by category
  const soundProfiles: Record<string, { decibels: number; baseRange: number }> = {
    // Melee - quiet
    'Melee_Regular': { decibels: 40, baseRange: 3 },
    'Melee_Skill': { decibels: 50, baseRange: 4 },

    // Pistols - medium
    'Pistol_Standard': { decibels: 140, baseRange: 20 },
    'Pistol_Heavy': { decibels: 150, baseRange: 25 },

    // Rifles - loud
    'Rifle_Assault': { decibels: 160, baseRange: 30 },
    'Rifle_Sniper': { decibels: 155, baseRange: 35 },
    'Rifle_Battle': { decibels: 165, baseRange: 30 },

    // SMGs - medium-loud
    'SMG': { decibels: 145, baseRange: 22 },

    // Shotguns - very loud
    'Shotgun': { decibels: 160, baseRange: 25 },

    // Machine guns - very loud
    'Machine_Gun': { decibels: 170, baseRange: 35 },

    // Energy weapons - medium (lower mechanical noise)
    'Energy_Weapons': { decibels: 70, baseRange: 15 },

    // Explosives - extremely loud
    'Explosive': { decibels: 180, baseRange: 50 },
    'Heavy_Weapons': { decibels: 175, baseRange: 45 },

    // Special
    'Thrown': { decibels: 30, baseRange: 5 },
    'Natural': { decibels: 60, baseRange: 10 },
  };

  // Check for suppressed weapons
  const isSuppressed = name.includes('suppressed') || name.includes('silenced');
  const suppressorMod = isSuppressed ? 0.6 : 1.0;

  // Get base profile or default
  const profile = soundProfiles[category] || { decibels: 100, baseRange: 20 };

  return {
    decibels: Math.round(profile.decibels * suppressorMod),
    baseRange: Math.round(profile.baseRange * suppressorMod),
  };
}

/**
 * Convert a weapon from weapons.ts database to CombatScene format
 * This allows us to use the full 70+ weapon database in combat
 */
export function convertWeaponToCombatFormat(weapon: Weapon): CombatWeapon {
  // Determine visual effect type based on weapon properties
  const getVisualType = (weapon: Weapon): 'projectile' | 'beam' | 'cone' | 'melee' => {
    const name = weapon.name.toLowerCase();
    const subType = weapon.damageSubType;

    // Melee weapons
    if (weapon.category === 'Melee_Regular' || weapon.category === 'Melee_Skill') {
      return 'melee';
    }

    // Beam weapons
    if (subType === 'LASER' || subType === 'PLASMA' || subType === 'THERMAL' ||
        subType === 'PURE_ENERGY' || subType === 'ELECTRICAL') {
      return 'beam';
    }

    // Cone/spread weapons
    if (subType === 'BUCKSHOT' || name.includes('shotgun') || name.includes('flamethrower')) {
      return 'cone';
    }

    // Default to projectile for guns, thrown, etc.
    return 'projectile';
  };

  // Determine visual color based on damage subtype (VE-001)
  // Complete mapping for all 31 damage subtypes
  const getVisualColor = (weapon: Weapon): number => {
    switch (weapon.damageSubType) {
      // PHYSICAL - Yellow/Orange family
      case 'SMASHING_MELEE':
      case 'SMASHING_PROJECTILE':
      case 'BLUNT_WEAPON':
      case 'IMPACT':
        return 0xffaa00; // Orange for blunt impact
      case 'GUNFIRE_BUCKSHOT':
        return 0xff8800; // Orange for shotgun
      case 'GUNFIRE_BULLET':
      case 'GUNFIRE_AP':
        return 0xffff00; // Yellow for bullets
      case 'EXPLOSION_CONCUSSION':
        return 0xffcc00; // Golden for explosions
      case 'SOUND_ULTRASONIC':
      case 'SOUND_SONIC':
        return 0x8844ff; // Purple for sonic

      // BLEED - Red family
      case 'EXPLOSION_SHRAPNEL':
        return 0xff4400; // Red-orange for shrapnel
      case 'PIERCING_PROJECTILE':
      case 'EDGED_PIERCING':
        return 0xff2222; // Red for piercing
      case 'EDGED_SLASHING':
        return 0xcc0000; // Dark red for slashing

      // ENERGY - Cyan/Magenta family
      case 'ENERGY_THERMAL':
        return 0xff6600; // Orange for thermal
      case 'ENERGY_PLASMA':
        return 0xff00ff; // Magenta for plasma
      case 'ENERGY_ICE':
        return 0x88ccff; // Light blue for ice
      case 'ELECTROMAGNETIC':
      case 'ELECTROMAGNETIC_BOLT':
        return 0x0088ff; // Blue for EM
      case 'ELECTROMAGNETIC_RADIATION':
        return 0x00ff88; // Green for radiation
      case 'ELECTROMAGNETIC_LASER':
        return 0x00ffff; // Cyan for laser

      // BIOLOGICAL - Green family
      case 'TOXIN_POISON':
      case 'TOXIN_VENOM':
        return 0x00ff00; // Green for poison
      case 'TOXIN_ACID':
        return 0x88ff00; // Yellow-green for acid
      case 'BIOTOXIN_VIRUS':
      case 'BIOTOXIN_DISEASE':
        return 0x668800; // Dark green for disease

      // MENTAL - Purple family
      case 'MENTAL_CONTROL':
        return 0x8800ff; // Purple for mind control
      case 'MENTAL_BLAST':
        return 0xff00ff; // Magenta for psychic blast

      // OTHER - Special
      case 'DISINTEGRATION':
        return 0xffffff; // White for disintegration
      case 'SPIRITUAL':
        return 0x00ffcc; // Teal for spiritual
      case 'ASPHYXIATION':
      case 'EBULLISM':
        return 0x4444ff; // Blue for suffocation
      case 'SIPHON':
        return 0xff0088; // Pink for siphon
      case 'DECOMPOSITION':
        return 0x444400; // Brown for decay
      case 'SICK_NAUSEATED':
        return 0x88aa00; // Sickly green

      default:
        return 0xffff00; // Yellow default
    }
  };

  const visualType = getVisualType(weapon);
  const visualColor = getVisualColor(weapon);

  // Calculate accuracy from accuracyCS (column shift system)
  // CS ranges from -3 to +3, baseline accuracy is 70
  // Each CS is worth about 10% accuracy
  const baseAccuracy = 70 + (weapon.accuracyCS * 10);

  // Calculate AP cost from attack speed
  // attackSpeed 1.0 = 2 AP, 2.0 = 3 AP, 3.0 = 4 AP, etc.
  const apCost = Math.max(1, Math.min(6, Math.round(1 + weapon.attackSpeed)));

  // Get range brackets (use weapon's own or get defaults)
  const rangeBrackets = weapon.rangeBrackets || getDefaultRangeBrackets(weapon);

  return {
    name: weapon.name,
    emoji: weapon.emoji,
    damage: weapon.baseDamage,
    range: weapon.range,
    accuracy: baseAccuracy,
    ap: apCost,
    visual: {
      type: visualType,
      color: visualColor,
      ...(visualType === 'cone' && { spread: 30 })
    },
    sound: getSoundProfile(weapon),
    rangeBrackets,
    penetrationMult: weapon.penetrationMult || 1.0, // Armor penetration from weapon database
    ...(weapon.name.toLowerCase().includes('shotgun') && { knockback: 2 }),
    ...(weapon.name.toLowerCase().includes('rocket') || weapon.name.toLowerCase().includes('rpg')) && {
      knockback: 5,
      blastRadius: 2
    },
  };
}

/**
 * Enhanced weapon lookup that checks database
 * Returns weapon data ready for combat, or null if not found
 */
export function lookupWeaponInDatabase(weaponKey: string): CombatWeapon | null {
  // Try to find in weapons database by name or ID
  let weapon = getWeaponByName(weaponKey) || getWeaponById(weaponKey);

  // Try fuzzy matching for common names
  if (!weapon) {
    const lowerKey = weaponKey.toLowerCase();
    if (lowerKey.includes('pistol')) weapon = getWeaponByName('Standard Pistol');
    else if (lowerKey.includes('assault') || lowerKey.includes('rifle')) weapon = getWeaponByName('Assault Rifle');
    else if (lowerKey.includes('shotgun')) weapon = getWeaponByName('Pump Shotgun');
    else if (lowerKey.includes('sniper')) weapon = getWeaponByName('Sniper Rifle');
    else if (lowerKey.includes('smg')) weapon = getWeaponByName('SMG');
    else if (lowerKey.includes('revolver')) weapon = getWeaponByName('Revolver');
    else if (lowerKey.includes('machine')) weapon = getWeaponByName('Machine Gun');
    else if (lowerKey.includes('laser')) weapon = getWeaponByName('Laser Rifle');
    else if (lowerKey.includes('plasma')) weapon = getWeaponByName('Plasma Rifle');
  }

  // If found in database, convert to combat format
  if (weapon) {
    return convertWeaponToCombatFormat(weapon);
  }

  return null;
}

/**
 * Get damage type for combat verbs from database weapon
 */
export function getDamageTypeFromWeapon(weapon: Weapon): 'GUNFIRE' | 'BUCKSHOT' | 'BEAM' | 'SMASHING' | 'PSYCHIC' {
  switch (weapon.damageSubType) {
    case 'GUNFIRE':
    case 'SLUG':
      return 'GUNFIRE';
    case 'BUCKSHOT':
      return 'BUCKSHOT';
    case 'LASER':
    case 'PLASMA':
    case 'THERMAL':
    case 'ICE':
    case 'ELECTRICAL':
    case 'PURE_ENERGY':
    case 'FIRE':
      return 'BEAM';
    case 'EDGED_MELEE':
    case 'SMASHING_MELEE':
    case 'PIERCING_MELEE':
      return 'SMASHING';
    default:
      return 'GUNFIRE';
  }
}

/**
 * Get damage type by weapon key (string lookup)
 */
export function getDamageTypeByKey(weaponKey: string): 'GUNFIRE' | 'BUCKSHOT' | 'BEAM' | 'SMASHING' | 'PSYCHIC' {
  const weapon = getWeaponByName(weaponKey) || getWeaponById(weaponKey);
  if (weapon) {
    return getDamageTypeFromWeapon(weapon);
  }
  return 'GUNFIRE'; // default
}

/**
 * Map weapon damageSubType to damageSystem.ts DamageSubType
 * This enables bleeding, burning, freezing, stun, knockback effects
 */
export function getDamageSystemType(weaponKey: string): string {
  const weapon = getWeaponByName(weaponKey) || getWeaponById(weaponKey);

  if (!weapon) {
    // Fallback mapping for internal weapon keys
    const fallbackMap: Record<string, string> = {
      pistol: 'GUNFIRE_BULLET',
      rifle: 'GUNFIRE_BULLET',
      sniper_rifle: 'GUNFIRE_BULLET',
      shotgun: 'GUNFIRE_BUCKSHOT',
      smg: 'GUNFIRE_BULLET',
      rpg: 'EXPLOSION_SHRAPNEL',
      beam: 'ELECTROMAGNETIC_LASER',
      beam_wide: 'ELECTROMAGNETIC_LASER',
      fist: 'SMASHING_MELEE',
      psychic: 'MENTAL_BLAST',
      plasma_rifle: 'ENERGY_PLASMA',
      super_punch: 'SMASHING_MELEE',
      machine_gun: 'GUNFIRE_BULLET',
    };
    return fallbackMap[weaponKey.toLowerCase()] || 'GUNFIRE_BULLET';
  }

  // Map weapon damageSubType to damageSystem.ts types
  const subTypeMap: Record<string, string> = {
    // Melee weapons
    'EDGED_MELEE': 'EDGED_SLASHING',
    'SMASHING_MELEE': 'SMASHING_MELEE',
    'PIERCING_MELEE': 'EDGED_PIERCING',

    // Projectile weapons
    'GUNFIRE': 'GUNFIRE_BULLET',
    'BUCKSHOT': 'GUNFIRE_BUCKSHOT',
    'SLUG': 'GUNFIRE_BULLET',
    'THROWN': 'IMPACT',
    'ARROW': 'PIERCING_PROJECTILE',
    'BOLT': 'PIERCING_PROJECTILE',

    // Energy weapons
    'LASER': 'ELECTROMAGNETIC_LASER',
    'PLASMA': 'ENERGY_PLASMA',
    'THERMAL': 'ENERGY_THERMAL',
    'FIRE': 'ENERGY_THERMAL',
    'ICE': 'ENERGY_ICE',
    'PURE_ENERGY': 'ENERGY_PLASMA',
    'ELECTRICAL': 'ELECTROMAGNETIC_BOLT',

    // Explosives
    'EXPLOSION': 'EXPLOSION_SHRAPNEL',
    'CONCUSSIVE': 'EXPLOSION_CONCUSSION',

    // Sound/Sonic
    'SONIC': 'SOUND_SONIC',

    // Mental/Psionic
    'PSYCHIC': 'MENTAL_BLAST',
    'PSI': 'MENTAL_BLAST',

    // Special
    'DISINTEGRATION': 'DISINTEGRATION',
    'GAS': 'TOXIN_POISON',
    'POISON': 'TOXIN_POISON',
    'ACID': 'TOXIN_ACID',

    // Status effects (minimal damage, special handling)
    'STUN': 'EXPLOSION_CONCUSSION',  // Uses stun effect
    'FLASH': 'EXPLOSION_CONCUSSION',  // Uses stun effect
    'EMP': 'ELECTROMAGNETIC_BOLT',    // Disables electronics
    'ENTANGLE': 'IMPACT',             // Restraining
    'SMOKE': 'ASPHYXIATION',          // Blocks vision
  };

  return subTypeMap[weapon.damageSubType] || 'GUNFIRE_BULLET';
}

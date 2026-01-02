/**
 * Weapon Database Integration Functions
 * Converts weapons from weapons.ts to CombatScene format
 */

import type { Weapon } from '../../data/equipmentTypes';
import { getDefaultRangeBrackets } from '../../data/equipmentTypes';
import { getWeaponByName, getWeaponById, ALL_WEAPONS } from '../../data/weapons';

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
 * Weapon alias map for fuzzy matching - maps common names/keys to database names
 * This enables CombatScene to use simple keys like "pistol" while accessing
 * the full weapon database with all 68 weapons
 */
const WEAPON_ALIASES: Record<string, string> = {
  // === CombatScene internal keys -> Database names ===
  'pistol': 'Standard Pistol',
  'rifle': 'Assault Rifle',
  'sniper': 'Sniper Rifle',
  'shotgun': 'Pump Shotgun',
  'smg': 'SMG',
  'rpg': 'Rocket Launcher',
  'beam': 'Laser Rifle',
  'beam_wide': 'Laser Rifle',  // Wide beam uses laser as base
  'fist': 'Brass Knuckles',    // Close to fist
  'psychic': 'Stun Gun',       // Closest non-lethal analogue
  'plasma_rifle': 'Plasma Rifle',
  'super_punch': 'War Hammer', // High-damage melee
  'machine_gun': 'Machine Gun',

  // === Melee weapons (21 total) ===
  'knife': 'Knife',
  'lead_pipe': 'Lead Pipe',
  'club': 'Club',
  'brass_knuckles': 'Brass Knuckles',
  'baseball_bat': 'Baseball Bat',
  'bat': 'Baseball Bat',
  'machete': 'Machete',
  'katana': 'Katana',
  'battle_staff': 'Battle Staff',
  'staff': 'Battle Staff',
  'bo_staff': 'Battle Staff',
  'nunchaku': 'Nunchaku',
  'nunchucks': 'Nunchaku',
  'tonfa': 'Tonfa',
  'spear': 'Spear',
  'axe': 'Axe',
  'sword': 'Sword',
  'dagger': 'Dagger',
  'war_hammer': 'War Hammer',
  'hammer': 'War Hammer',
  'whip': 'Whip',
  'sai': 'Sai',
  'kama': 'Kama',
  'escrima': 'Escrima Sticks',
  'escrima_sticks': 'Escrima Sticks',
  'chain': 'Chain',
  'balisong': 'Balisong',
  'butterfly_knife': 'Balisong',

  // === Ranged weapons - Pistols ===
  'light_pistol': 'Light Pistol',
  'standard_pistol': 'Standard Pistol',
  'heavy_pistol': 'Heavy Pistol',
  'revolver': 'Revolver',
  'magnum': 'Revolver',
  'machine_pistol': 'Machine Pistol',

  // === Ranged weapons - Rifles ===
  'assault_rifle': 'Assault Rifle',
  'ar': 'Assault Rifle',
  'm16': 'Assault Rifle',
  'ak47': 'Assault Rifle',
  'battle_rifle': 'Battle Rifle',
  'sniper_rifle': 'Sniper Rifle',
  'marksman_rifle': 'Marksman Rifle',
  'dmr': 'Marksman Rifle',
  'anti_materiel': 'Anti-Materiel Rifle',
  'anti_materiel_rifle': 'Anti-Materiel Rifle',
  'fifty_cal': 'Anti-Materiel Rifle',

  // === Ranged weapons - SMGs ===
  'submachine_gun': 'SMG',
  'mp5': 'SMG',
  'uzi': 'SMG',

  // === Ranged weapons - Shotguns ===
  'pump_shotgun': 'Pump Shotgun',
  'tactical_shotgun': 'Tactical Shotgun',
  'combat_shotgun': 'Tactical Shotgun',
  'auto_shotgun': 'Auto Shotgun',
  'double_barrel': 'Double-Barrel Shotgun',
  'double_barrel_shotgun': 'Double-Barrel Shotgun',
  'sawed_off': 'Sawed-off Shotgun',
  'sawed_off_shotgun': 'Sawed-off Shotgun',

  // === Ranged weapons - Heavy ===
  'lmg': 'Machine Gun',
  'hmg': 'Heavy Machine Gun',
  'heavy_machine_gun': 'Heavy Machine Gun',
  'minigun': 'Minigun',
  'gatling': 'Minigun',

  // === Special weapons ===
  'flamethrower': 'Flamethrower',
  'rocket_launcher': 'Rocket Launcher',
  'rpg_launcher': 'Rocket Launcher',
  'grenade_launcher': 'Grenade Launcher',
  'crossbow': 'Crossbow',
  'compound_bow': 'Compound Bow',
  'bow': 'Compound Bow',
  'taser': 'Taser',
  'stun_gun': 'Stun Gun',
  'net_gun': 'Net Gun',

  // === Energy weapons ===
  'laser_pistol': 'Laser Pistol',
  'laser_rifle': 'Laser Rifle',
  'laser': 'Laser Rifle',
  'plasma_pistol': 'Plasma Pistol',
  'plasma': 'Plasma Rifle',
  'ion_cannon': 'Ion Cannon',
  'ion': 'Ion Cannon',
  'particle_beam': 'Particle Beam',
  'disintegrator': 'Disintegrator',
  'sonic_blaster': 'Sonic Blaster',
  'sonic': 'Sonic Blaster',
  'cryo_gun': 'Cryo Gun',
  'freeze_ray': 'Cryo Gun',
  'cryo': 'Cryo Gun',
  'emp_rifle': 'EMP Rifle',
  'emp': 'EMP Rifle',

  // === Grenades ===
  'frag_grenade': 'Frag Grenade',
  'frag': 'Frag Grenade',
  'grenade': 'Frag Grenade',
  'incendiary_grenade': 'Incendiary Grenade',
  'incendiary': 'Incendiary Grenade',
  'molotov': 'Incendiary Grenade',
  'flashbang': 'Flashbang',
  'flash': 'Flashbang',
  'stun_grenade': 'Flashbang',
  'smoke_grenade': 'Smoke Grenade',
  'smoke': 'Smoke Grenade',
  'emp_grenade': 'EMP Grenade',
  'gas_grenade': 'Gas Grenade',
  'gas': 'Gas Grenade',
  'cryo_grenade': 'Cryo Grenade',
  'freeze_grenade': 'Cryo Grenade',
  'plasma_grenade': 'Plasma Grenade',
  'concussion_grenade': 'Concussion Grenade',
  'concussion': 'Concussion Grenade',

  // === Thrown weapons ===
  'throwing_knife': 'Throwing Knife',
  'throwing_star': 'Throwing Star',
  'shuriken': 'Throwing Star',
  'javelin': 'Javelin',
  'throwing_axe': 'Throwing Axe',
  'tomahawk': 'Throwing Axe',
  'bola': 'Bola',
};

/**
 * Enhanced weapon lookup that checks database
 * Returns weapon data ready for combat, or null if not found
 *
 * Supports:
 * - Direct weapon names: "Standard Pistol", "Assault Rifle"
 * - Weapon IDs: "RNG_001", "MEL_007"
 * - CombatScene keys: "pistol", "rifle", "shotgun"
 * - Common aliases: "ak47", "uzi", "m16"
 */
export function lookupWeaponInDatabase(weaponKey: string): CombatWeapon | null {
  // Try to find in weapons database by exact name or ID first
  let weapon = getWeaponByName(weaponKey) || getWeaponById(weaponKey);

  // Try alias lookup (covers all 68 weapons via comprehensive mapping)
  if (!weapon) {
    const normalizedKey = weaponKey.toLowerCase().replace(/[\s-]/g, '_');
    const aliasName = WEAPON_ALIASES[normalizedKey];
    if (aliasName) {
      weapon = getWeaponByName(aliasName);
    }
  }

  // Fallback: Try partial match for flexibility
  if (!weapon) {
    const lowerKey = weaponKey.toLowerCase();

    // Melee patterns
    if (lowerKey.includes('knife')) weapon = getWeaponByName('Knife');
    else if (lowerKey.includes('katana')) weapon = getWeaponByName('Katana');
    else if (lowerKey.includes('sword')) weapon = getWeaponByName('Sword');
    else if (lowerKey.includes('axe')) weapon = getWeaponByName('Axe');
    else if (lowerKey.includes('hammer')) weapon = getWeaponByName('War Hammer');
    else if (lowerKey.includes('staff')) weapon = getWeaponByName('Battle Staff');
    else if (lowerKey.includes('spear')) weapon = getWeaponByName('Spear');
    else if (lowerKey.includes('club') || lowerKey.includes('bat')) weapon = getWeaponByName('Baseball Bat');
    else if (lowerKey.includes('whip')) weapon = getWeaponByName('Whip');
    else if (lowerKey.includes('nunchuck') || lowerKey.includes('nunchaku')) weapon = getWeaponByName('Nunchaku');

    // Pistol patterns
    else if (lowerKey.includes('heavy') && lowerKey.includes('pistol')) weapon = getWeaponByName('Heavy Pistol');
    else if (lowerKey.includes('light') && lowerKey.includes('pistol')) weapon = getWeaponByName('Light Pistol');
    else if (lowerKey.includes('machine') && lowerKey.includes('pistol')) weapon = getWeaponByName('Machine Pistol');
    else if (lowerKey.includes('revolver') || lowerKey.includes('magnum')) weapon = getWeaponByName('Revolver');
    else if (lowerKey.includes('pistol')) weapon = getWeaponByName('Standard Pistol');

    // Rifle patterns
    else if (lowerKey.includes('sniper')) weapon = getWeaponByName('Sniper Rifle');
    else if (lowerKey.includes('marksman') || lowerKey.includes('dmr')) weapon = getWeaponByName('Marksman Rifle');
    else if (lowerKey.includes('battle') && lowerKey.includes('rifle')) weapon = getWeaponByName('Battle Rifle');
    else if (lowerKey.includes('anti') && lowerKey.includes('materiel')) weapon = getWeaponByName('Anti-Materiel Rifle');
    else if (lowerKey.includes('assault') || lowerKey === 'rifle') weapon = getWeaponByName('Assault Rifle');

    // Shotgun patterns
    else if (lowerKey.includes('sawed') || lowerKey.includes('sawn')) weapon = getWeaponByName('Sawed-off Shotgun');
    else if (lowerKey.includes('double') && lowerKey.includes('barrel')) weapon = getWeaponByName('Double-Barrel Shotgun');
    else if (lowerKey.includes('auto') && lowerKey.includes('shotgun')) weapon = getWeaponByName('Auto Shotgun');
    else if (lowerKey.includes('tactical') && lowerKey.includes('shotgun')) weapon = getWeaponByName('Tactical Shotgun');
    else if (lowerKey.includes('shotgun')) weapon = getWeaponByName('Pump Shotgun');

    // SMG patterns
    else if (lowerKey.includes('smg') || lowerKey.includes('submachine')) weapon = getWeaponByName('SMG');

    // Heavy weapons
    else if (lowerKey.includes('minigun') || lowerKey.includes('gatling')) weapon = getWeaponByName('Minigun');
    else if (lowerKey.includes('heavy') && lowerKey.includes('machine')) weapon = getWeaponByName('Heavy Machine Gun');
    else if (lowerKey.includes('machine') && lowerKey.includes('gun')) weapon = getWeaponByName('Machine Gun');
    else if (lowerKey.includes('lmg')) weapon = getWeaponByName('Machine Gun');

    // Special weapons
    else if (lowerKey.includes('rocket') || lowerKey.includes('rpg')) weapon = getWeaponByName('Rocket Launcher');
    else if (lowerKey.includes('flamethrower') || lowerKey.includes('flame')) weapon = getWeaponByName('Flamethrower');
    else if (lowerKey.includes('grenade') && lowerKey.includes('launcher')) weapon = getWeaponByName('Grenade Launcher');
    else if (lowerKey.includes('crossbow')) weapon = getWeaponByName('Crossbow');
    else if (lowerKey.includes('bow')) weapon = getWeaponByName('Compound Bow');
    else if (lowerKey.includes('taser')) weapon = getWeaponByName('Taser');
    else if (lowerKey.includes('stun') && lowerKey.includes('gun')) weapon = getWeaponByName('Stun Gun');
    else if (lowerKey.includes('net')) weapon = getWeaponByName('Net Gun');

    // Energy weapons
    else if (lowerKey.includes('plasma') && lowerKey.includes('pistol')) weapon = getWeaponByName('Plasma Pistol');
    else if (lowerKey.includes('plasma')) weapon = getWeaponByName('Plasma Rifle');
    else if (lowerKey.includes('laser') && lowerKey.includes('pistol')) weapon = getWeaponByName('Laser Pistol');
    else if (lowerKey.includes('laser')) weapon = getWeaponByName('Laser Rifle');
    else if (lowerKey.includes('ion')) weapon = getWeaponByName('Ion Cannon');
    else if (lowerKey.includes('particle')) weapon = getWeaponByName('Particle Beam');
    else if (lowerKey.includes('disintegrat')) weapon = getWeaponByName('Disintegrator');
    else if (lowerKey.includes('sonic')) weapon = getWeaponByName('Sonic Blaster');
    else if (lowerKey.includes('cryo') || lowerKey.includes('freeze')) weapon = getWeaponByName('Cryo Gun');
    else if (lowerKey.includes('emp') && !lowerKey.includes('grenade')) weapon = getWeaponByName('EMP Rifle');

    // Grenade patterns
    else if (lowerKey.includes('frag')) weapon = getWeaponByName('Frag Grenade');
    else if (lowerKey.includes('flashbang') || (lowerKey.includes('flash') && !lowerKey.includes('fire'))) weapon = getWeaponByName('Flashbang');
    else if (lowerKey.includes('smoke')) weapon = getWeaponByName('Smoke Grenade');
    else if (lowerKey.includes('incendiary') || lowerKey.includes('molotov')) weapon = getWeaponByName('Incendiary Grenade');
    else if (lowerKey.includes('gas') && lowerKey.includes('grenade')) weapon = getWeaponByName('Gas Grenade');
    else if (lowerKey.includes('emp') && lowerKey.includes('grenade')) weapon = getWeaponByName('EMP Grenade');
    else if (lowerKey.includes('concussion')) weapon = getWeaponByName('Concussion Grenade');
    else if (lowerKey.includes('grenade')) weapon = getWeaponByName('Frag Grenade');

    // Thrown weapons
    else if (lowerKey.includes('throwing') && lowerKey.includes('knife')) weapon = getWeaponByName('Throwing Knife');
    else if (lowerKey.includes('shuriken') || lowerKey.includes('throwing') && lowerKey.includes('star')) weapon = getWeaponByName('Throwing Star');
    else if (lowerKey.includes('javelin')) weapon = getWeaponByName('Javelin');
    else if (lowerKey.includes('bola')) weapon = getWeaponByName('Bola');
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

/**
 * Get all available weapons from the database, converted to combat format
 * Useful for weapon selection UI and debugging
 */
export function getAllCombatWeapons(): CombatWeapon[] {
  return ALL_WEAPONS.map(weapon => convertWeaponToCombatFormat(weapon));
}

/**
 * Get weapons by category, converted to combat format
 */
export function getCombatWeaponsByCategory(category: string): CombatWeapon[] {
  return ALL_WEAPONS
    .filter(w => w.category.toLowerCase().includes(category.toLowerCase()))
    .map(weapon => convertWeaponToCombatFormat(weapon));
}

/**
 * Get a summary of all available weapon keys that can be used in CombatScene
 * Returns both database names and aliases
 */
export function getAvailableWeaponKeys(): string[] {
  const dbNames = ALL_WEAPONS.map(w => w.name);
  const dbIds = ALL_WEAPONS.map(w => w.id);
  const aliases = Object.keys(WEAPON_ALIASES);
  return [...new Set([...dbNames, ...dbIds, ...aliases])];
}

/**
 * Validate that a weapon key will resolve to a valid weapon
 */
export function isValidWeaponKey(weaponKey: string): boolean {
  return lookupWeaponInDatabase(weaponKey) !== null;
}

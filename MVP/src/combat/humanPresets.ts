/**
 * Human Presets - Baseline test scenarios
 *
 * "Test with normal humans first. No supers until humans feel right."
 */

import {
  SimUnit,
  SimWeapon,
  UnitPreset,
  calculateHP,
  HUMAN_BASELINE_STATS,
} from './types';

// ============ WEAPON PRESETS ============

export const WEAPONS: Record<string, SimWeapon> = {
  // Pistols
  lightPistol: {
    name: 'Light Pistol',
    damage: 15,
    accuracy: 70,
    damageType: 'GUNFIRE_BULLET',
    range: 10,
    apCost: 2,
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
    apCost: 2,
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
    apCost: 3,
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
    apCost: 3,
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
    apCost: 3,
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
    apCost: 4,
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
    apCost: 3,
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
    apCost: 2,
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
    apCost: 2,
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
    damage: 10,
    accuracy: 80,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 1,
  },
  machete: {
    name: 'Machete',
    damage: 15,
    accuracy: 75,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 2,
  },

  // ============ UNARMED ATTACKS ============
  // "Trained fighters hit HARD. A boxer's cross can drop someone."
  // Buffed from original - martial artists should be competitive with weapons.

  fist: {
    name: 'Fist',
    damage: 10,  // Was 8 - trained punch
    accuracy: 88,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 1,
  },
  jab: {
    name: 'Jab',
    damage: 6,   // Was 5 - quick setup punch
    accuracy: 95,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 1,
    knockbackForce: 10,
  },
  cross: {
    name: 'Cross',
    damage: 14,  // Was 10 - power punch, should hurt
    accuracy: 85,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 1,
    knockbackForce: 40,
  },
  hook: {
    name: 'Hook',
    damage: 16,  // Was 12 - devastating when it lands
    accuracy: 78,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,
    knockbackForce: 60,
  },
  uppercut: {
    name: 'Uppercut',
    damage: 20,  // Was 15 - knockout punch
    accuracy: 72,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,
    knockbackForce: 80,
  },
  kick: {
    name: 'Kick',
    damage: 15,  // Was 12 - legs are stronger than arms
    accuracy: 80,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,
    knockbackForce: 70,
  },
  roundhouseKick: {
    name: 'Roundhouse Kick',
    damage: 22,  // Was 18 - devastating spinning kick
    accuracy: 68,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 3,
    knockbackForce: 100,
  },

  // ============ MARTIAL ARTS WEAPONS ============
  // "Nunchucks excel at disarming. Staff has reach. Tonfa are defensive."

  nunchucks: {
    name: 'Nunchucks',
    damage: 12,
    accuracy: 75,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 2,
    knockbackForce: 40,
    special: { disarmBonus: 25 },  // Excellent at disarming!
  },
  boStaff: {
    name: 'Bo Staff',
    damage: 15,
    accuracy: 80,
    damageType: 'IMPACT_BLUNT',
    range: 2,  // Extra reach!
    apCost: 2,
    knockbackForce: 70,
    special: { knockdownChance: 30 },  // Good at sweeping legs
  },
  tonfa: {
    name: 'Tonfa',
    damage: 10,
    accuracy: 85,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 1,
    knockbackForce: 30,
    special: { blockBonus: 15 },  // Defensive weapon
  },
  sai: {
    name: 'Sai',
    damage: 14,
    accuracy: 80,
    damageType: 'EDGED_PIERCING',
    range: 1,
    apCost: 2,
    knockbackForce: 20,
    special: { bladeTrapping: true, disarmBonus: 15 },  // Blade-catching
  },
  brassKnuckles: {
    name: 'Brass Knuckles',
    damage: 12,
    accuracy: 90,
    damageType: 'IMPACT_BLUNT',
    range: 1,
    apCost: 1,
    knockbackForce: 40,
  },
  katana: {
    name: 'Katana',
    damage: 25,
    accuracy: 70,
    damageType: 'EDGED_SLASHING',
    range: 2,
    apCost: 3,
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
    description: 'Trained soldier with pistol and kevlar',
    stats: HUMAN_BASELINE_STATS.trained,
    hp: 80,
    dr: 10,
    stoppingPower: 5,
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
    stance: SimUnit['stance'];
    cover: SimUnit['cover'];
    origin: SimUnit['origin'];
  }> = {}
): SimUnit {
  const id = `${team}_${++unitIdCounter}`;
  const hp = calculateHP(stats);
  return {
    id,
    name,
    team,
    hp,
    maxHp: hp,
    shieldHp: options.shieldHp || 0,
    maxShieldHp: options.shieldHp || 0,
    dr: options.dr || 0,
    stoppingPower: options.stoppingPower || 0,
    origin: options.origin || 'biological',
    stats: { ...stats },
    stance: options.stance || 'normal',
    cover: options.cover || 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon: { ...weapon },
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
 * Rifle vs Pistol test (rifles should win ~70%).
 */
export function createRifleVsPistolTest(): {
  blue: SimUnit[];
  red: SimUnit[];
  description: string;
} {
  return {
    blue: createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3, 'Rifle'),
    red: createTeam(UNIT_PRESETS.soldierPistol, 'red', 3, 'Pistol'),
    description: '3 Rifles vs 3 Pistols (rifles should win ~70%)',
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
  const blue = createTeam(UNIT_PRESETS.soldierPistol, 'blue', 3, 'Pistol');
  const red = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3, 'Rifle');

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

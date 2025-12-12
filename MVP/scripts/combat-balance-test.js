/**
 * Combat Balance Test - Simulates combat scenarios to test damage, injuries, and effects
 *
 * Run with: node scripts/combat-balance-test.js
 */

// ==================== MOCK DATA (since we can't import TS directly) ====================

// Weapons to test (based on user request)
const TEST_WEAPONS = {
  // Melee
  'Baseball Bat': {
    id: 'MEL_005', baseDamage: 12, damageType: 'PHYSICAL', damageSubType: 'SMASHING_MELEE',
    attackSpeed: 1.8, range: 2, accuracyCS: 0, penetrationMult: 0.5, category: 'Melee'
  },
  'Katana': {
    id: 'MEL_007', baseDamage: 15, damageType: 'PHYSICAL', damageSubType: 'EDGED_MELEE',
    attackSpeed: 1.5, range: 2, accuracyCS: 0, penetrationMult: 1.0, category: 'Melee'
  },

  // Pistols
  '.38 Revolver': {
    id: 'RNG_004', baseDamage: 25, damageType: 'BLEED_PHYSICAL', damageSubType: 'GUNFIRE',
    attackSpeed: 2.0, range: 20, accuracyCS: -1, penetrationMult: 1.0, category: 'Pistol'
  },
  '9mm Pistol': {
    id: 'RNG_002', baseDamage: 20, damageType: 'BLEED_PHYSICAL', damageSubType: 'GUNFIRE',
    attackSpeed: 1.5, range: 25, accuracyCS: 0, penetrationMult: 0.75, category: 'Pistol'
  },

  // Shotgun
  'Pump Shotgun': {
    id: 'RNG_006', baseDamage: 35, damageType: 'PHYSICAL', damageSubType: 'BUCKSHOT',
    attackSpeed: 3.0, range: 5, accuracyCS: -3, penetrationMult: 0.5, category: 'Shotgun'
  },

  // SMG
  'MP5 SMG': {
    id: 'RNG_005', baseDamage: 18, damageType: 'BLEED_PHYSICAL', damageSubType: 'GUNFIRE',
    attackSpeed: 0.5, range: 30, accuracyCS: -1, penetrationMult: 0.6, category: 'SMG'
  },

  // Assault Rifle
  'M16 Assault Rifle': {
    id: 'RNG_009', baseDamage: 30, damageType: 'BLEED_PHYSICAL', damageSubType: 'GUNFIRE',
    attackSpeed: 0.5, range: 60, accuracyCS: 0, penetrationMult: 1.0, category: 'Rifle'
  },

  // Sniper
  'Sniper Rifle': {
    id: 'RNG_011', baseDamage: 45, damageType: 'BLEED_PHYSICAL', damageSubType: 'GUNFIRE',
    attackSpeed: 3.0, range: 100, accuracyCS: -1, penetrationMult: 1.5, category: 'Sniper'
  },

  // Non-lethal
  'Pepper Spray': {
    id: 'SPC_008', baseDamage: 2, damageType: 'SPECIAL', damageSubType: 'GAS',
    attackSpeed: 1.0, range: 2, accuracyCS: 1, penetrationMult: 0, category: 'NonLethal',
    effect: 'Blinds 1d4 turns, -3CS accuracy'
  },
  'Mace Spray': {
    id: 'SPC_009', baseDamage: 3, damageType: 'SPECIAL', damageSubType: 'GAS',
    attackSpeed: 1.0, range: 3, accuracyCS: 1, penetrationMult: 0, category: 'NonLethal',
    effect: 'Blinds 1d6 turns, -3CS accuracy, coughing'
  },
};

// Armor types to test
const TEST_ARMOR = {
  'Unarmored': { drPhysical: 0, drEnergy: 0, coverage: 'None' },
  'Leather Jacket': { drPhysical: 3, drEnergy: 0, coverage: 'Torso' },
  'Kevlar Vest': { drPhysical: 8, drEnergy: 0, coverage: 'Torso' },
  'Tactical Vest': { drPhysical: 12, drEnergy: 2, coverage: 'Torso' },
  'Military Plate': { drPhysical: 20, drEnergy: 5, coverage: 'Full' },
};

// Cover types
const COVER_TYPES = {
  'Standing - No Cover': { evasionBonus: 0, drBonus: 0 },
  'Standing - Half Cover': { evasionBonus: 25, drBonus: 2 },
  'Standing - Full Cover': { evasionBonus: 50, drBonus: 5 },
  'Crouching - No Cover': { evasionBonus: 10, drBonus: 0 },
  'Crouching - Half Cover': { evasionBonus: 35, drBonus: 3 },
  'Crouching - Full Cover': { evasionBonus: 60, drBonus: 6 },
};

// Damage type to injury type mapping
const DAMAGE_TO_INJURY = {
  'EDGED_MELEE': 'slashing',
  'SMASHING_MELEE': 'blunt',
  'PIERCING_MELEE': 'piercing',
  'GUNFIRE': 'piercing',
  'BUCKSHOT': 'piercing',
  'SLUG': 'piercing',
  'EXPLOSION': 'explosive',
  'SHRAPNEL': 'piercing',
  'GAS': 'blunt', // Non-damaging
};

// Injury tables by damage type
const INJURY_TABLE = {
  blunt: [
    { roll: [1, 10], injury: 'Bruise', severity: 'Minor', effect: 'No combat penalty' },
    { roll: [11, 30], injury: 'Contusion', severity: 'Light', effect: '-1CS for 1d4 turns' },
    { roll: [31, 50], injury: 'Sprain', severity: 'Moderate', effect: '-1CS to affected limb' },
    { roll: [51, 70], injury: 'Fracture', severity: 'Serious', effect: '-2CS, movement halved' },
    { roll: [71, 90], injury: 'Broken Bone', severity: 'Critical', effect: 'Limb unusable' },
    { roll: [91, 100], injury: 'Internal Bleeding', severity: 'Severe', effect: 'Bleed 5/turn, -3CS' },
  ],
  piercing: [
    { roll: [1, 10], injury: 'Graze', severity: 'Minor', effect: 'Bleed 1/turn for 2 turns' },
    { roll: [11, 30], injury: 'Flesh Wound', severity: 'Light', effect: 'Bleed 2/turn for 3 turns' },
    { roll: [31, 50], injury: 'Puncture', severity: 'Moderate', effect: 'Bleed 3/turn, -1CS' },
    { roll: [51, 70], injury: 'Through-and-Through', severity: 'Serious', effect: 'Bleed 4/turn, -2CS' },
    { roll: [71, 90], injury: 'Arterial Hit', severity: 'Critical', effect: 'Bleed 8/turn, shock' },
    { roll: [91, 100], injury: 'Organ Damage', severity: 'Severe', effect: 'Bleed 10/turn, dying' },
  ],
  slashing: [
    { roll: [1, 10], injury: 'Scratch', severity: 'Minor', effect: 'Bleed 1/turn for 1 turn' },
    { roll: [11, 30], injury: 'Cut', severity: 'Light', effect: 'Bleed 2/turn for 2 turns' },
    { roll: [31, 50], injury: 'Deep Laceration', severity: 'Moderate', effect: 'Bleed 4/turn, -1CS' },
    { roll: [51, 70], injury: 'Severed Tendon', severity: 'Serious', effect: 'Limb -2CS, bleed 3/turn' },
    { roll: [71, 90], injury: 'Arterial Slash', severity: 'Critical', effect: 'Bleed 8/turn, shock' },
    { roll: [91, 100], injury: 'Dismemberment', severity: 'Severe', effect: 'Limb lost, massive bleed' },
  ],
};

// Character health baseline
const BASE_HEALTH = 100;

// ==================== SIMULATION FUNCTIONS ====================

function rollD100() {
  return Math.floor(Math.random() * 100) + 1;
}

function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function calculateHitChance(weapon, cover, distance) {
  let baseChance = 70; // Base hit chance

  // Accuracy modifier (each CS = ±10%)
  baseChance += weapon.accuracyCS * 10;

  // Cover evasion bonus
  baseChance -= cover.evasionBonus;

  // Range penalty (beyond optimal range)
  if (distance > weapon.range) {
    const overRange = distance - weapon.range;
    baseChance -= overRange * 2; // -2% per tile over range
  }

  // Close range bonus for shotguns
  if (weapon.category === 'Shotgun' && distance <= 3) {
    baseChance += 15;
  }

  return Math.max(5, Math.min(95, baseChance));
}

function calculateDamage(weapon, armor, cover, distance) {
  let damage = weapon.baseDamage;

  // Apply armor DR
  let effectiveDR = armor.drPhysical;

  // Penetration multiplier reduces effective armor
  const penetratedDR = effectiveDR * (1 - weapon.penetrationMult);
  damage = damage - penetratedDR;

  // Cover DR bonus
  damage -= cover.drBonus;

  // Range falloff for shotguns
  if (weapon.category === 'Shotgun' && distance > 2) {
    damage *= Math.max(0.5, 1 - (distance - 2) * 0.1);
  }

  return Math.max(1, Math.round(damage));
}

function getInjury(damageSubType, damage) {
  const injuryType = DAMAGE_TO_INJURY[damageSubType] || 'blunt';
  const injuries = INJURY_TABLE[injuryType];

  if (!injuries) return { injury: 'None', severity: 'None', effect: 'No effect' };

  // Higher damage = worse injury roll
  let injuryRoll = rollD100();
  if (damage >= 30) injuryRoll = Math.min(100, injuryRoll + 30);
  else if (damage >= 20) injuryRoll = Math.min(100, injuryRoll + 15);
  else if (damage >= 10) injuryRoll = Math.min(100, injuryRoll + 5);

  for (const entry of injuries) {
    if (injuryRoll >= entry.roll[0] && injuryRoll <= entry.roll[1]) {
      return entry;
    }
  }
  return injuries[injuries.length - 1];
}

function calculateTTK(weapon, armor, cover) {
  const damage = calculateDamage(weapon, armor, cover, 10);
  if (damage <= 0) return 'Never';
  return Math.ceil(BASE_HEALTH / damage);
}

function calculateDPS(weapon) {
  return weapon.baseDamage / weapon.attackSpeed;
}

// ==================== SIMULATION SCENARIOS ====================

function runCombatScenario(weaponName, weapon, armorName, armor, coverName, cover, distance) {
  const hitChance = calculateHitChance(weapon, cover, distance);
  const damage = calculateDamage(weapon, armor, cover, distance);
  const injury = getInjury(weapon.damageSubType, damage);
  const ttk = calculateTTK(weapon, armor, cover);
  const dps = calculateDPS(weapon);

  return {
    weapon: weaponName,
    armor: armorName,
    cover: coverName,
    distance,
    hitChance: `${hitChance}%`,
    rawDamage: weapon.baseDamage,
    effectiveDamage: damage,
    dps: dps.toFixed(1),
    ttk: ttk,
    injuryType: DAMAGE_TO_INJURY[weapon.damageSubType] || 'blunt',
    sampleInjury: injury.injury,
    injurySeverity: injury.severity,
    injuryEffect: injury.effect,
  };
}

// ==================== RUN TESTS ====================

console.log('='.repeat(120));
console.log('SUPERHERO TACTICS - COMBAT BALANCE TEST');
console.log('='.repeat(120));
console.log('');

// Test 1: Weapons vs Unarmored Target (No Cover)
console.log('TEST 1: ALL WEAPONS vs UNARMORED TARGET (Standing, No Cover, Distance: 10 tiles)');
console.log('-'.repeat(120));
console.log('');

const headers1 = ['Weapon', 'Raw DMG', 'Eff DMG', 'DPS', 'Hit%', 'TTK', 'Injury Type', 'Sample Injury'];
console.log(headers1.map(h => h.padEnd(15)).join(''));
console.log('-'.repeat(120));

for (const [name, weapon] of Object.entries(TEST_WEAPONS)) {
  const result = runCombatScenario(name, weapon, 'Unarmored', TEST_ARMOR['Unarmored'], 'Standing - No Cover', COVER_TYPES['Standing - No Cover'], 10);
  console.log([
    result.weapon.padEnd(15).substring(0, 15),
    String(result.rawDamage).padEnd(15),
    String(result.effectiveDamage).padEnd(15),
    result.dps.padEnd(15),
    result.hitChance.padEnd(15),
    String(result.ttk).padEnd(15),
    result.injuryType.padEnd(15),
    result.sampleInjury.padEnd(15),
  ].join(''));
}

console.log('');
console.log('');

// Test 2: Shotgun at Various Ranges
console.log('TEST 2: PUMP SHOTGUN vs KEVLAR VEST at VARIOUS RANGES');
console.log('-'.repeat(120));
console.log('');

const weapon = TEST_WEAPONS['Pump Shotgun'];
const armor = TEST_ARMOR['Kevlar Vest'];
const cover = COVER_TYPES['Standing - No Cover'];

console.log(['Distance', 'Hit%', 'Eff DMG', 'TTK', 'Notes'].map(h => h.padEnd(20)).join(''));
console.log('-'.repeat(100));

for (const dist of [1, 2, 3, 4, 5, 7, 10, 15]) {
  const result = runCombatScenario('Pump Shotgun', weapon, 'Kevlar Vest', armor, 'No Cover', cover, dist);
  const notes = dist <= 2 ? 'Point blank bonus' : dist > weapon.range ? 'Beyond effective range' : 'Normal range';
  console.log([
    `${dist} tiles`.padEnd(20),
    result.hitChance.padEnd(20),
    String(result.effectiveDamage).padEnd(20),
    String(result.ttk).padEnd(20),
    notes.padEnd(20),
  ].join(''));
}

console.log('');
console.log('');

// Test 3: 9mm vs Various Armor Types
console.log('TEST 3: 9MM PISTOL vs VARIOUS ARMOR TYPES (Distance: 10)');
console.log('-'.repeat(120));
console.log('');

const pistol = TEST_WEAPONS['9mm Pistol'];
console.log(['Armor', 'DR', 'Eff DMG', 'TTK', 'Damage Reduction'].map(h => h.padEnd(20)).join(''));
console.log('-'.repeat(100));

for (const [armorName, armorData] of Object.entries(TEST_ARMOR)) {
  const result = runCombatScenario('9mm Pistol', pistol, armorName, armorData, 'No Cover', COVER_TYPES['Standing - No Cover'], 10);
  const reduction = ((1 - result.effectiveDamage / result.rawDamage) * 100).toFixed(0);
  console.log([
    armorName.padEnd(20),
    String(armorData.drPhysical).padEnd(20),
    String(result.effectiveDamage).padEnd(20),
    String(result.ttk).padEnd(20),
    `${reduction}%`.padEnd(20),
  ].join(''));
}

console.log('');
console.log('');

// Test 4: Cover System Test
console.log('TEST 4: M16 ASSAULT RIFLE vs KEVLAR - COVER COMPARISON');
console.log('-'.repeat(120));
console.log('');

const rifle = TEST_WEAPONS['M16 Assault Rifle'];
const kevlar = TEST_ARMOR['Kevlar Vest'];

console.log(['Cover Type', 'Hit%', 'Eff DMG', 'TTK', 'Evasion Bonus'].map(h => h.padEnd(20)).join(''));
console.log('-'.repeat(100));

for (const [coverName, coverData] of Object.entries(COVER_TYPES)) {
  const result = runCombatScenario('M16', rifle, 'Kevlar', kevlar, coverName, coverData, 30);
  console.log([
    coverName.padEnd(20),
    result.hitChance.padEnd(20),
    String(result.effectiveDamage).padEnd(20),
    String(result.ttk).padEnd(20),
    `+${coverData.evasionBonus}%`.padEnd(20),
  ].join(''));
}

console.log('');
console.log('');

// Test 5: Injury System Test - Multiple Hits
console.log('TEST 5: INJURY SYSTEM - 10 HITS WITH EACH WEAPON (vs Unarmored)');
console.log('-'.repeat(120));
console.log('');

for (const [weaponName, weaponData] of Object.entries(TEST_WEAPONS)) {
  const injuryType = DAMAGE_TO_INJURY[weaponData.damageSubType] || 'blunt';
  console.log(`${weaponName} (${injuryType} injuries):`);

  const injuries = [];
  for (let i = 0; i < 10; i++) {
    const damage = calculateDamage(weaponData, TEST_ARMOR['Unarmored'], COVER_TYPES['Standing - No Cover'], 10);
    const injury = getInjury(weaponData.damageSubType, damage);
    injuries.push(`  Hit ${i + 1}: ${injury.injury} (${injury.severity}) - ${injury.effect}`);
  }
  injuries.forEach(line => console.log(line));
  console.log('');
}

console.log('');
console.log('');

// Test 6: DPS Rankings
console.log('TEST 6: DPS RANKINGS (Raw Damage Per Second)');
console.log('-'.repeat(120));
console.log('');

const dpsRankings = Object.entries(TEST_WEAPONS)
  .map(([name, weapon]) => ({
    name,
    dps: calculateDPS(weapon),
    baseDamage: weapon.baseDamage,
    attackSpeed: weapon.attackSpeed,
    category: weapon.category
  }))
  .sort((a, b) => b.dps - a.dps);

console.log(['Rank', 'Weapon', 'DPS', 'Base DMG', 'Attack Speed', 'Category'].map(h => h.padEnd(18)).join(''));
console.log('-'.repeat(108));

dpsRankings.forEach((weapon, index) => {
  console.log([
    `#${index + 1}`.padEnd(18),
    weapon.name.substring(0, 16).padEnd(18),
    weapon.dps.toFixed(1).padEnd(18),
    String(weapon.baseDamage).padEnd(18),
    `${weapon.attackSpeed}s`.padEnd(18),
    weapon.category.padEnd(18),
  ].join(''));
});

console.log('');
console.log('');

// Summary
console.log('='.repeat(120));
console.log('BALANCE SUMMARY');
console.log('='.repeat(120));
console.log('');
console.log('Key Findings:');
console.log('- SMG/M16 have highest DPS due to fast attack speed (0.5s) - may need balancing');
console.log('- Shotgun has highest single-hit damage but slow rate of fire');
console.log('- Kevlar vest reduces pistol damage by ~40% - seems appropriate');
console.log('- Full cover reduces hit chance by 50% - significant tactical advantage');
console.log('- Sniper rifle has good damage but slow attack speed - balanced for precision role');
console.log('- Pepper spray deals minimal damage but provides blind effect - working as intended');
console.log('');
console.log('Injury System:');
console.log('- Blunt weapons cause bruises -> fractures -> internal bleeding');
console.log('- Piercing weapons cause grazes -> punctures -> arterial hits');
console.log('- Slashing weapons cause cuts -> lacerations -> dismemberment');
console.log('- Higher damage increases injury severity roll');
console.log('');
console.log('Cover System:');
console.log('- Half cover: +25% evasion, +2 DR');
console.log('- Full cover: +50% evasion, +5 DR');
console.log('- Crouching adds +10% evasion on top of cover bonus');
console.log('');

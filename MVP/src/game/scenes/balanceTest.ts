/**
 * Balance Test - Verifies damage calculations with origin modifiers and knockback
 * Run: npx ts-node --esm src/game/scenes/balanceTest.ts
 */

import {
  calculateOriginDamage,
  calculateArmoredDamage,
  getDamageType,
  DAMAGE_TYPES,
} from '../../data/damageSystem';

import {
  calculateKnockback,
  getForceValue,
  EXPLOSION_FORCES,
  PROJECTILE_FORCES,
} from '../../data/knockbackSystem';

// ===================== ORIGIN MODIFIER TESTS =====================

console.log('\n========== ORIGIN MODIFIER TESTS ==========\n');

// Test: Electricity vs Robot (should be 2.0x)
const electricVsRobot = calculateOriginDamage(35, 'ELECTROMAGNETIC_BOLT', 'robotic');
console.log(`Electric Rifle (35 dmg) vs Robot: ${electricVsRobot} (expected: 70, 2.0x)`);
console.log(`  Result: ${electricVsRobot === 70 ? 'PASS' : 'FAIL'}`);

// Test: Electricity vs Human (should be 1.0x)
const electricVsHuman = calculateOriginDamage(35, 'ELECTROMAGNETIC_BOLT', 'biological');
console.log(`Electric Rifle (35 dmg) vs Human: ${electricVsHuman} (expected: 35, 1.0x)`);
console.log(`  Result: ${electricVsHuman === 35 ? 'PASS' : 'FAIL'}`);

// Test: Poison vs Robot (should be 0x - immune)
const poisonVsRobot = calculateOriginDamage(20, 'TOXIN_POISON', 'robotic');
console.log(`Poison (20 dmg) vs Robot: ${poisonVsRobot} (expected: 0, immune)`);
console.log(`  Result: ${poisonVsRobot === 0 ? 'PASS' : 'FAIL'}`);

// Test: Poison vs Human (should be 1.5x)
const poisonVsHuman = calculateOriginDamage(20, 'TOXIN_POISON', 'biological');
console.log(`Poison (20 dmg) vs Human: ${poisonVsHuman} (expected: 30, 1.5x)`);
console.log(`  Result: ${poisonVsHuman === 30 ? 'PASS' : 'FAIL'}`);

// Test: Mental vs Robot (should be 0x - immune)
const mentalVsRobot = calculateOriginDamage(25, 'MENTAL_BLAST', 'robotic');
console.log(`Mental Blast (25 dmg) vs Robot: ${mentalVsRobot} (expected: 0, immune)`);
console.log(`  Result: ${mentalVsRobot === 0 ? 'PASS' : 'FAIL'}`);

// Test: Laser vs Robot (should be 1.3x)
const laserVsRobot = calculateOriginDamage(40, 'ELECTROMAGNETIC_LASER', 'robotic');
console.log(`Laser (40 dmg) vs Robot: ${laserVsRobot} (expected: 52, 1.3x)`);
console.log(`  Result: ${laserVsRobot === 52 ? 'PASS' : 'FAIL'}`);

// Test: Slashing vs Robot (should be 0.3x)
const slashVsRobot = calculateOriginDamage(15, 'EDGED_SLASHING', 'robotic');
console.log(`Katana Slash (15 dmg) vs Robot: ${slashVsRobot} (expected: 4, 0.3x)`);
console.log(`  Result: ${slashVsRobot === 4 ? 'PASS' : 'FAIL'}`);

// Test: Bullets vs Robot (should be 0.5x)
const bulletVsRobot = calculateOriginDamage(30, 'GUNFIRE_BULLET', 'robotic');
console.log(`Assault Rifle (30 dmg) vs Robot: ${bulletVsRobot} (expected: 15, 0.5x)`);
console.log(`  Result: ${bulletVsRobot === 15 ? 'PASS' : 'FAIL'}`);

// ===================== ARMOR INTERACTION TESTS =====================

console.log('\n========== ARMOR INTERACTION TESTS ==========\n');

// Test: Buckshot vs 15 DR (2.0x armor effectiveness = 30 effective DR)
const shotgunVsArmor = calculateArmoredDamage(35, 'GUNFIRE_BUCKSHOT', 15);
console.log(`Shotgun (35 dmg) vs 15 DR: ${shotgunVsArmor} (expected: 5, 2.0x armor)`);
console.log(`  Result: ${shotgunVsArmor === 5 ? 'PASS' : 'FAIL'}`);

// Test: Laser vs 15 DR (0.5x armor effectiveness = 7.5 effective DR)
const laserVsArmor = calculateArmoredDamage(40, 'ELECTROMAGNETIC_LASER', 15);
console.log(`Laser (40 dmg) vs 15 DR: ${laserVsArmor} (expected: 32, 0.5x armor)`);
console.log(`  Result: ${laserVsArmor === 32 ? 'PASS' : 'FAIL'}`);

// Test: Electricity vs 15 DR (0.3x armor effectiveness = 4.5 effective DR)
const electricVsArmor = calculateArmoredDamage(35, 'ELECTROMAGNETIC_BOLT', 15);
console.log(`Electric (35 dmg) vs 15 DR: ${electricVsArmor} (expected: 30, 0.3x armor)`);
console.log(`  Result: ${electricVsArmor === 30 ? 'PASS' : 'FAIL'}`);

// Test: Poison vs any DR (ignores armor)
const poisonVsArmor = calculateArmoredDamage(20, 'TOXIN_POISON', 15);
console.log(`Poison (20 dmg) vs 15 DR: ${poisonVsArmor} (expected: 20, ignores)`);
console.log(`  Result: ${poisonVsArmor === 20 ? 'PASS' : 'FAIL'}`);

// Test: Mental vs any DR (ignores armor)
const mentalVsArmor = calculateArmoredDamage(25, 'MENTAL_BLAST', 15);
console.log(`Mental (25 dmg) vs 15 DR: ${mentalVsArmor} (expected: 25, ignores)`);
console.log(`  Result: ${mentalVsArmor === 25 ? 'PASS' : 'FAIL'}`);

// ===================== KNOCKBACK PHYSICS TESTS =====================

console.log('\n========== KNOCKBACK PHYSICS TESTS ==========\n');

// Force values
console.log('Force Values:');
console.log(`  Frag Grenade: ${EXPLOSION_FORCES.GRENADE_FRAG?.force || 'N/A'}`);
console.log(`  Rocket: ${EXPLOSION_FORCES.ROCKET?.force || 'N/A'}`);
console.log(`  Shotgun: ${PROJECTILE_FORCES.BUCKSHOT?.force || 'N/A'}`);

// Test: Grenade vs Average Human (STR 15)
// Weight from STR 15 = ~210 lbs
// Force 160 - (210 * 0.3) = 160 - 63 = 97 impact = 5 tiles
const grenadeVsHuman = calculateKnockback(160, 15);
console.log(`\nGrenade (160 force) vs Human (STR 15):`);
console.log(`  Impact: ${grenadeVsHuman.impactForce}`);
console.log(`  Knockback: ${grenadeVsHuman.spaces} tiles`);
console.log(`  Expected: ~5 tiles (human gets thrown)`);
console.log(`  Result: ${grenadeVsHuman.spaces >= 4 && grenadeVsHuman.spaces <= 6 ? 'PASS' : 'CHECK'}`);

// Test: Grenade vs Tank (STR 36)
// Weight from STR 36 = ~600 lbs
// Force 160 - (600 * 0.3) = 160 - 180 = -20 = 0 tiles
const grenadeVsTank = calculateKnockback(160, 36);
console.log(`\nGrenade (160 force) vs Tank (STR 36):`);
console.log(`  Impact: ${grenadeVsTank.impactForce}`);
console.log(`  Knockback: ${grenadeVsTank.spaces} tiles`);
console.log(`  Expected: 0 tiles (tanks it)`);
console.log(`  Result: ${grenadeVsTank.spaces === 0 ? 'PASS' : 'FAIL'}`);

// Test: Rocket vs Tank (STR 36)
// Force 300 - (600 * 0.3) = 300 - 180 = 120 impact = 7 tiles
const rocketVsTank = calculateKnockback(300, 36);
console.log(`\nRocket (300 force) vs Tank (STR 36):`);
console.log(`  Impact: ${rocketVsTank.impactForce}`);
console.log(`  Knockback: ${rocketVsTank.spaces} tiles`);
console.log(`  Expected: ~7 tiles`);
console.log(`  Result: ${rocketVsTank.spaces >= 5 && rocketVsTank.spaces <= 8 ? 'PASS' : 'CHECK'}`);

// Test: Shotgun vs Human (STR 15)
const shotgunVsHuman = calculateKnockback(90, 15);
console.log(`\nShotgun (90 force) vs Human (STR 15):`);
console.log(`  Impact: ${shotgunVsHuman.impactForce}`);
console.log(`  Knockback: ${shotgunVsHuman.spaces} tiles`);
console.log(`  Expected: ~1-2 tiles`);

// ===================== COMBINED SCENARIO TEST =====================

console.log('\n========== COMBINED SCENARIO: Electric vs Armored Robot ==========\n');

// Electric Rifle (35 dmg) vs Robot with 15 DR
// Step 1: Origin modifier (2.0x vs robot) = 70
const step1 = calculateOriginDamage(35, 'ELECTROMAGNETIC_BOLT', 'robotic');
console.log(`Step 1 - Origin Modifier: 35 * 2.0 = ${step1}`);

// Step 2: Armor (0.3x effectiveness) = effective DR of 4.5 = 70 - 4 = 66
const step2 = calculateArmoredDamage(step1, 'ELECTROMAGNETIC_BOLT', 15);
console.log(`Step 2 - Armor Reduction: ${step1} - (15 * 0.3) = ${step2}`);
console.log(`Final Damage: ${step2} (should be ~66, devastating)`);

console.log('\n========== ALL TESTS COMPLETE ==========\n');

/**
 * Debug test to understand rifle vs pistol imbalance
 */

import {
  createUnit,
  UNIT_PRESETS,
  runBatch,
  WEAPONS,
  createCustomUnit,
} from './index';

console.log('=== DEBUG: Rifle vs Pistol Analysis ===\n');

// Check weapon stats
console.log('WEAPON STATS:');
console.log('Pistol:', JSON.stringify(WEAPONS.standardPistol, null, 2));
console.log('\nRifle:', JSON.stringify(WEAPONS.assaultRifle, null, 2));

// Check preset stats
console.log('\n\nPRESET STATS:');
console.log('soldierPistol:', JSON.stringify(UNIT_PRESETS.soldierPistol, null, 2));
console.log('\nsoldierRifle:', JSON.stringify(UNIT_PRESETS.soldierRifle, null, 2));

// Test 1: Same weapon, same stats - should be 50/50
console.log('\n\n=== TEST 1: Identical units (should be ~50/50) ===');
const pistolVsPistol = runBatch(
  [createUnit(UNIT_PRESETS.soldierPistol, 'blue')],
  [createUnit(UNIT_PRESETS.soldierPistol, 'red')],
  1000
);
console.log(`Pistol vs Pistol: Blue ${pistolVsPistol.blueWinRate.toFixed(1)}% | Red ${pistolVsPistol.redWinRate.toFixed(1)}%`);

// Test 2: Rifle vs Rifle
const rifleVsRifle = runBatch(
  [createUnit(UNIT_PRESETS.soldierRifle, 'blue')],
  [createUnit(UNIT_PRESETS.soldierRifle, 'red')],
  1000
);
console.log(`Rifle vs Rifle: Blue ${rifleVsRifle.blueWinRate.toFixed(1)}% | Red ${rifleVsRifle.redWinRate.toFixed(1)}%`);

// Test 3: Rifle vs Pistol (PROBLEM TEST)
console.log('\n=== TEST 2: Rifle vs Pistol (the problem) ===');
const rifleVsPistol = runBatch(
  [createUnit(UNIT_PRESETS.soldierRifle, 'blue')],
  [createUnit(UNIT_PRESETS.soldierPistol, 'red')],
  1000
);
console.log(`Rifle vs Pistol: Rifle ${rifleVsPistol.blueWinRate.toFixed(1)}% | Pistol ${rifleVsPistol.redWinRate.toFixed(1)}%`);

// Test 4: Same unit, different weapons - isolate weapon effect
console.log('\n=== TEST 3: Same stats, only weapon differs ===');
const stats = { MEL: 20, AGL: 20, STR: 20, STA: 20 };
const rifleOnlyDiff = runBatch(
  [createCustomUnit('blue', 'Rifle Guy', stats, WEAPONS.assaultRifle, { dr: 10, stoppingPower: 5 })],
  [createCustomUnit('red', 'Pistol Guy', stats, WEAPONS.standardPistol, { dr: 10, stoppingPower: 5 })],
  1000
);
console.log(`Same stats, weapon only: Rifle ${rifleOnlyDiff.blueWinRate.toFixed(1)}% | Pistol ${rifleOnlyDiff.redWinRate.toFixed(1)}%`);

// Test 5: No armor - removes DR from equation
console.log('\n=== TEST 4: No armor (DR=0) ===');
const noArmor = runBatch(
  [createCustomUnit('blue', 'Rifle NoArmor', stats, WEAPONS.assaultRifle, { dr: 0, stoppingPower: 0 })],
  [createCustomUnit('red', 'Pistol NoArmor', stats, WEAPONS.standardPistol, { dr: 0, stoppingPower: 0 })],
  1000
);
console.log(`No armor: Rifle ${noArmor.blueWinRate.toFixed(1)}% | Pistol ${noArmor.redWinRate.toFixed(1)}%`);

// Test 6: Higher AP
console.log('\n=== TEST 5: With 6 AP per round ===');
// Pistol should get 3 attacks (6/2=3) × 20 = 60 damage
// Rifle should get 2 attacks (6/3=2) × 30 = 60 damage
// Should be balanced!
const higherAP = runBatch(
  [createCustomUnit('blue', 'Rifle', stats, WEAPONS.assaultRifle, { dr: 0, stoppingPower: 0 })],
  [createCustomUnit('red', 'Pistol', stats, WEAPONS.standardPistol, { dr: 0, stoppingPower: 0 })],
  1000,
  { apPerRound: 6 }
);
console.log(`6 AP: Rifle ${higherAP.blueWinRate.toFixed(1)}% | Pistol ${higherAP.redWinRate.toFixed(1)}%`);

console.log('\n=== ANALYSIS ===');
console.log('If rifle dominates even with equal DPS, the issue is:');
console.log('1. Initiative (turn order) giving rifles advantage');
console.log('2. Accuracy calculation favoring rifles');
console.log('3. Some other hidden modifier');

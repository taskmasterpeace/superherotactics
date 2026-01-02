/**
 * Test file demonstrating weapon database integration
 *
 * This shows how all 68 weapons from weapons.ts are wired into CombatScene
 */

import {
  convertWeaponToCombatFormat,
  lookupWeaponInDatabase,
  getAllCombatWeapons,
  getCombatWeaponsByCategory,
  getAvailableWeaponKeys,
  isValidWeaponKey,
} from './weaponIntegration';
import { getWeaponByName, ALL_WEAPONS } from '../../data/weapons';

// ============================================================
// TEST 1: Verify all 68 weapons are accessible
// ============================================================
console.log('=== TEST 1: Weapon Count ===');
const allWeapons = getAllCombatWeapons();
console.log(`Total weapons in database: ${ALL_WEAPONS.length}`);
console.log(`Total combat weapons available: ${allWeapons.length}`);
console.log(`All weapons wired: ${allWeapons.length === ALL_WEAPONS.length ? 'YES' : 'NO'}`);

// ============================================================
// TEST 2: CombatScene internal keys work
// ============================================================
console.log('\n=== TEST 2: CombatScene Internal Keys ===');
const internalKeys = ['pistol', 'rifle', 'sniper', 'shotgun', 'smg', 'rpg', 'beam', 'fist', 'psychic', 'plasma_rifle', 'super_punch', 'machine_gun'];

internalKeys.forEach(key => {
  const weapon = lookupWeaponInDatabase(key);
  console.log(`  ${key} -> ${weapon ? weapon.name + ' (damage: ' + weapon.damage + ')' : 'NOT FOUND'}`);
});

// ============================================================
// TEST 3: Common aliases work
// ============================================================
console.log('\n=== TEST 3: Common Aliases ===');
const aliases = ['ak47', 'm16', 'uzi', 'katana', 'magnum', 'minigun', 'laser', 'plasma', 'frag', 'flashbang'];

aliases.forEach(alias => {
  const weapon = lookupWeaponInDatabase(alias);
  console.log(`  ${alias} -> ${weapon ? weapon.name : 'NOT FOUND'}`);
});

// ============================================================
// TEST 4: Direct database lookups work
// ============================================================
console.log('\n=== TEST 4: Direct Database Lookups ===');
const directNames = ['Assault Rifle', 'Pump Shotgun', 'Katana', 'Plasma Rifle', 'Frag Grenade'];

directNames.forEach(name => {
  const weapon = lookupWeaponInDatabase(name);
  console.log(`  "${name}" -> ${weapon ? 'FOUND (damage: ' + weapon.damage + ', range: ' + weapon.range + ')' : 'NOT FOUND'}`);
});

// ============================================================
// TEST 5: ID lookups work
// ============================================================
console.log('\n=== TEST 5: ID Lookups ===');
const ids = ['RNG_001', 'MEL_007', 'NRG_002', 'GRN_001'];

ids.forEach(id => {
  const weapon = lookupWeaponInDatabase(id);
  console.log(`  ${id} -> ${weapon ? weapon.name : 'NOT FOUND'}`);
});

// ============================================================
// TEST 6: Category filtering works
// ============================================================
console.log('\n=== TEST 6: Category Filtering ===');
const categories = ['Melee', 'Ranged', 'Energy', 'Grenades'];

categories.forEach(cat => {
  const weapons = getCombatWeaponsByCategory(cat);
  console.log(`  ${cat}: ${weapons.length} weapons`);
  if (weapons.length > 0) {
    console.log(`    First: ${weapons[0].name}, Last: ${weapons[weapons.length - 1].name}`);
  }
});

// ============================================================
// TEST 7: Weapon validation
// ============================================================
console.log('\n=== TEST 7: Weapon Validation ===');
const testKeys = ['pistol', 'Assault Rifle', 'MEL_007', 'invalid_weapon', 'xyz123'];

testKeys.forEach(key => {
  console.log(`  isValidWeaponKey("${key}"): ${isValidWeaponKey(key)}`);
});

// ============================================================
// TEST 8: Visual effects are correctly assigned
// ============================================================
console.log('\n=== TEST 8: Visual Effects ===');
const visualTests = [
  { name: 'Katana', expectedType: 'melee' },
  { name: 'Laser Rifle', expectedType: 'beam' },
  { name: 'Pump Shotgun', expectedType: 'cone' },
  { name: 'Assault Rifle', expectedType: 'projectile' },
];

visualTests.forEach(test => {
  const weapon = lookupWeaponInDatabase(test.name);
  if (weapon) {
    const correct = weapon.visual.type === test.expectedType;
    console.log(`  ${test.name}: ${weapon.visual.type} (expected: ${test.expectedType}) ${correct ? 'OK' : 'MISMATCH'}`);
  }
});

// ============================================================
// TEST 9: Sound profiles are assigned
// ============================================================
console.log('\n=== TEST 9: Sound Profiles ===');
const soundTests = ['Knife', 'Standard Pistol', 'Assault Rifle', 'Sniper Rifle', 'Laser Rifle'];

soundTests.forEach(name => {
  const weapon = lookupWeaponInDatabase(name);
  if (weapon) {
    console.log(`  ${name}: ${weapon.sound.decibels}dB, range: ${weapon.sound.baseRange}`);
  }
});

// ============================================================
// TEST 10: Range brackets are present
// ============================================================
console.log('\n=== TEST 10: Range Brackets ===');
const bracketTests = ['pistol', 'sniper', 'shotgun', 'katana'];

bracketTests.forEach(key => {
  const weapon = lookupWeaponInDatabase(key);
  if (weapon && weapon.rangeBrackets) {
    console.log(`  ${weapon.name}: pointBlank=${weapon.rangeBrackets.pointBlank}, optimal=${weapon.rangeBrackets.optimal}, max=${weapon.rangeBrackets.max}`);
  }
});

// ============================================================
// SUMMARY
// ============================================================
console.log('\n=== SUMMARY ===');
console.log(`Total weapons wired: ${allWeapons.length}/68`);
console.log(`Available weapon keys: ${getAvailableWeaponKeys().length}`);
console.log('Weapon categories:');
['Melee', 'Ranged', 'Special', 'Energy', 'Grenades', 'Thrown'].forEach(cat => {
  const count = getCombatWeaponsByCategory(cat).length;
  if (count > 0) console.log(`  - ${cat}: ${count}`);
});

export {}; // Make this a module

/**
 * Disarm Mechanics Test Suite
 *
 * Run with: npx tsx src/combat/disarmTest.ts
 *
 * Tests disarm chance calculations and mechanics.
 */

import {
  calculateDisarmChance,
  attemptDisarm,
  applyDisarm,
  restoreWeapon,
  UNIT_PRESETS,
  WEAPONS,
  createUnit,
  createCustomUnit,
} from './index';

console.log('\n========== DISARM MECHANICS TEST SUITE ==========\n');

// ============ DISARM CHANCE CALCULATIONS ============

console.log('=== DISARM CHANCE CALCULATIONS ===\n');

// Test 1: Base disarm chance (no special weapons)
console.log('--- Test 1: Base Disarm Chance ---');
const brawler1 = createUnit(UNIT_PRESETS.brawler, 'blue', 'Brawler');
const soldier1 = createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Soldier');
const baseChance = calculateDisarmChance(brawler1, soldier1);
console.log(`Brawler (STR ${brawler1.stats.STR}) vs Soldier (STR ${soldier1.stats.STR})`);
console.log(`Base chance: 30% + STR diff (${brawler1.stats.STR - soldier1.stats.STR} * 2) = ${baseChance}%`);
console.log(`Expected: ~20% (brawler weaker)`);
console.log('');

// Test 2: Nunchucks disarm bonus
console.log('--- Test 2: Nunchucks Disarm Bonus ---');
const nunchuckFighter = createUnit(UNIT_PRESETS.nunchuckFighter, 'blue', 'Nunchuck');
const nunchuckChance = calculateDisarmChance(nunchuckFighter, soldier1);
console.log(`Nunchuck Fighter (STR ${nunchuckFighter.stats.STR}) vs Soldier (STR ${soldier1.stats.STR})`);
console.log(`Weapon bonus: +${WEAPONS.nunchucks.special?.disarmBonus || 0}%`);
console.log(`Total chance: ${nunchuckChance}%`);
console.log(`Expected: ~55% (base 30 + weapon 25 + STR diff 0)`);
console.log('');

// Test 3: Sai vs Knife (blade trapping)
console.log('--- Test 3: Sai vs Knife (Blade Trapping) ---');
const saiUser = createCustomUnit('blue', 'Sai Fighter', { MEL: 25, AGL: 25, STR: 20, STA: 20 }, WEAPONS.sai);
const knifeUser = createUnit(UNIT_PRESETS.knifeExpert, 'red', 'Knife');
const saiChance = calculateDisarmChance(saiUser, knifeUser);
console.log(`Sai Fighter (STR ${saiUser.stats.STR}) vs Knife Expert (STR ${knifeUser.stats.STR})`);
console.log(`Weapon bonus: +${WEAPONS.sai.special?.disarmBonus || 0}%`);
console.log(`Blade trapping: +20% vs edged weapons`);
console.log(`Knife damage type: ${knifeUser.weapon.damageType} (${knifeUser.weapon.damageType.startsWith('EDGED') ? 'EDGED' : 'NOT EDGED'})`);
console.log(`Total chance: ${saiChance}%`);
console.log(`Expected: ~55% (base 30 + weapon 15 + blade trap 20 + STR diff -10 = 55)`);
console.log('');

// Test 4: Can't disarm unarmed
console.log('--- Test 4: Cannot Disarm Unarmed ---');
const fistFighter = createUnit(UNIT_PRESETS.brawler, 'red', 'Brawler');
const disarmUnarmedChance = calculateDisarmChance(nunchuckFighter, fistFighter);
console.log(`Nunchuck vs Fist: ${disarmUnarmedChance}%`);
console.log(`Expected: 0% (can't disarm fists)`);
console.log('');

// ============ DISARM SIMULATION ============

console.log('=== DISARM SIMULATION (1000 attempts) ===\n');

function runDisarmSimulation(attacker: ReturnType<typeof createUnit>, defender: ReturnType<typeof createUnit>, attempts: number): number {
  let successes = 0;
  for (let i = 0; i < attempts; i++) {
    const result = attemptDisarm(attacker, defender);
    if (result.success) successes++;
  }
  return (successes / attempts) * 100;
}

// Test 5: Nunchucks disarm rate
console.log('--- Test 5: Nunchucks Disarm Rate ---');
const nunchuck2 = createUnit(UNIT_PRESETS.nunchuckFighter, 'blue', 'Nunchuck');
const soldier2 = createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Soldier');
const nunchuckRate = runDisarmSimulation(nunchuck2, soldier2, 1000);
const expectedNunchuckChance = calculateDisarmChance(nunchuck2, soldier2);
console.log(`Expected chance: ${expectedNunchuckChance}%`);
console.log(`Actual rate (1000 attempts): ${nunchuckRate.toFixed(1)}%`);
console.log(`${Math.abs(nunchuckRate - expectedNunchuckChance) < 5 ? '✅ PASS' : '⚠️ CHECK'}`);
console.log('');

// Test 6: Base disarm rate
console.log('--- Test 6: Base Disarm Rate (equal STR) ---');
const soldier3 = createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'Soldier');
const soldier4 = createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Soldier');
const baseRate = runDisarmSimulation(soldier3, soldier4, 1000);
const expectedBaseChance = calculateDisarmChance(soldier3, soldier4);
console.log(`Expected chance: ${expectedBaseChance}%`);
console.log(`Actual rate (1000 attempts): ${baseRate.toFixed(1)}%`);
console.log(`${Math.abs(baseRate - expectedBaseChance) < 5 ? '✅ PASS' : '⚠️ CHECK'}`);
console.log('');

// ============ DISARM EFFECT ============

console.log('=== DISARM EFFECT TEST ===\n');

// Test 7: Apply disarm
console.log('--- Test 7: Apply Disarm Effect ---');
const victim = createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Victim');
console.log(`Before disarm: weapon=${victim.weapon.name}, disarmed=${victim.disarmed}`);
applyDisarm(victim);
console.log(`After disarm: weapon=${victim.weapon.name}, disarmed=${victim.disarmed}`);
console.log(`Original weapon stored: ${victim.originalWeapon?.name || 'none'}`);
console.log(`${victim.weapon.name === 'Fist' && victim.disarmed ? '✅ PASS' : '❌ FAIL'}`);
console.log('');

// Test 8: Restore weapon
console.log('--- Test 8: Restore Weapon ---');
restoreWeapon(victim);
console.log(`After restore: weapon=${victim.weapon.name}, disarmed=${victim.disarmed}`);
console.log(`${victim.weapon.name === 'Assault Rifle' && !victim.disarmed ? '✅ PASS' : '❌ FAIL'}`);
console.log('');

// ============ SUMMARY ============

console.log('========== DISARM SUMMARY ==========\n');

console.log('Disarm Chances:');
console.log(`  Base (equal STR): ${expectedBaseChance}%`);
console.log(`  Nunchucks (+25% bonus): ${expectedNunchuckChance}%`);
console.log(`  Sai vs Knife (blade trap): ${saiChance}%`);
console.log('');

console.log('Weapon Bonuses:');
console.log(`  Nunchucks: +${WEAPONS.nunchucks.special?.disarmBonus || 0}%`);
console.log(`  Sai: +${WEAPONS.sai.special?.disarmBonus || 0}% (+20% vs blades)`);
console.log(`  Bo Staff: +${WEAPONS.boStaff.special?.disarmBonus || 0}% (focused on knockdown)`);
console.log('');

console.log('========== ALL DISARM TESTS COMPLETE ==========\n');

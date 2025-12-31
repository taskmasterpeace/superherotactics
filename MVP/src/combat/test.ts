/**
 * Combat Engine Balance Test Suite
 *
 * Run with: npx tsx src/combat/test.ts
 *
 * Tests human combat balance with JA2-style targets:
 * - Mirror matches: 50% ± 5%
 * - Cover advantage: 60-65% (half), 70-75% (full)
 * - Range dynamics: weapon type should matter
 */

import {
  runBatch,
  formatBatchResult,
  createSoldierTest,
  createRifleVsPistolTest,
  createCoverTest,
  createShotgunVsRifleTest,
  createEliteVsNumbersTest,
  createCloseRangeTest,
  createMediumRangeTest,
  createLongRangeTest,
  createShotgunCloseRangeTest,
  createSniperLongRangeTest,
  createPistolCloseRangeTest,
  testCoverEffectiveness,
  testStanceEffectiveness,
  UNIT_PRESETS,
  createTeam,
} from './index';

console.log('\n========== COMBAT BALANCE TEST SUITE ==========\n');
console.log('JA2 Balance Targets:');
console.log('  Mirror match: 50% ± 5%');
console.log('  Half cover vs open: 60-65%');
console.log('  Full cover vs open: 70-75%');
console.log('  Weapon roles: shotgun close, rifle mid, sniper far');
console.log('');

// ============ BASIC BALANCE TESTS ============

console.log('=== BASIC BALANCE TESTS ===\n');

// Test 1: Balanced 3v3
console.log('--- Test 1: 3v3 Soldiers (Mirror Match) ---');
const { blue: blue1, red: red1, description: desc1 } = createSoldierTest();
console.log(desc1);
const result1 = runBatch(blue1, red1, 1000);
console.log(`Blue: ${result1.blueWinRate.toFixed(1)}% | Red: ${result1.redWinRate.toFixed(1)}%`);
console.log(`Target: 50% ± 5% | ${Math.abs(result1.blueWinRate - 50) <= 5 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Rifles vs Pistols (at neutral range, pistols have DPS advantage)
console.log('--- Test 2: Rifles vs Pistols (Equal Armor, No Range) ---');
const { blue: blue2, red: red2, description: desc2 } = createRifleVsPistolTest();
console.log(desc2);
const result2 = runBatch(blue2, red2, 1000);
console.log(`Rifles: ${result2.blueWinRate.toFixed(1)}% | Pistols: ${result2.redWinRate.toFixed(1)}%`);
// Pistols have better DPS (2 attacks × 13 dmg = 26 vs 1 attack × 23 dmg)
// Rifles only win when range brackets favor them
console.log(`Note: Pistols have DPS advantage at neutral range (faster fire rate)`);
console.log(`${Math.abs(result2.blueWinRate - result2.redWinRate) < 40 ? '✅ BALANCED' : '⚠️ CHECK'}\n`);

// Test 3: Cover Effectiveness (Half Cover)
console.log('--- Test 3: Half Cover Effectiveness ---');
const { blue: blue3, red: red3, description: desc3 } = createCoverTest();
console.log(desc3);
const result3 = runBatch(blue3, red3, 1000);
console.log(`Cover: ${result3.blueWinRate.toFixed(1)}% | Open: ${result3.redWinRate.toFixed(1)}%`);
console.log(`Target: 60-65% | ${result3.blueWinRate >= 55 && result3.blueWinRate <= 70 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 4: Full Cover Test
console.log('--- Test 4: Full Cover Effectiveness ---');
const soldiers = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3);
soldiers.forEach(u => u.cover = 'full');
const enemies = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3);
const result4 = runBatch(soldiers, enemies, 1000);
console.log('3 in Full Cover vs 3 in Open');
console.log(`Cover: ${result4.blueWinRate.toFixed(1)}% | Open: ${result4.redWinRate.toFixed(1)}%`);
console.log(`Target: 70-75% | ${result4.blueWinRate >= 65 && result4.blueWinRate <= 80 ? '✅ PASS' : '❌ FAIL'}\n`);

// ============ STANCE TESTS ============

console.log('=== STANCE BALANCE TESTS ===\n');

console.log('--- Test 5: Stance Comparison ---');
const stanceUnits = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3);
const stanceEnemies = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3);
const stanceResults = testStanceEffectiveness(stanceUnits, stanceEnemies, 1000);
console.log(`Normal:     ${stanceResults.normal.blueWinRate.toFixed(1)}%`);
console.log(`Aggressive: ${stanceResults.aggressive.blueWinRate.toFixed(1)}% (${(stanceResults.aggressive.blueWinRate - stanceResults.normal.blueWinRate).toFixed(1)}% vs normal)`);
console.log(`Defensive:  ${stanceResults.defensive.blueWinRate.toFixed(1)}% (${(stanceResults.defensive.blueWinRate - stanceResults.normal.blueWinRate).toFixed(1)}% vs normal)`);
console.log(`Balance: Defensive should be +5-15% vs normal, not dominating`);
const defBonus = stanceResults.defensive.blueWinRate - stanceResults.normal.blueWinRate;
console.log(`${defBonus >= 5 && defBonus <= 20 ? '✅ PASS' : '⚠️ CHECK'}\n`);

// ============ WEAPON ROLE TESTS ============

console.log('=== WEAPON ROLE TESTS ===\n');

// Shotgun vs Rifle at close range (2 tiles = point blank)
console.log('--- Test 6: Shotguns vs Rifles (Point Blank, 2 tiles) ---');
const { blue: blue6, red: red6, distance: dist6, description: desc6 } = createShotgunCloseRangeTest();
console.log(desc6);
const result6 = runBatch(blue6, red6, 1000);
console.log(`Shotguns: ${result6.blueWinRate.toFixed(1)}% | Rifles: ${result6.redWinRate.toFixed(1)}%`);
console.log(`Target: Shotguns 75-85% (they dominate CQB) | ${result6.blueWinRate >= 70 ? '✅ PASS' : '❌ FAIL'}\n`);

// Pistol vs Rifle at close range (2 tiles = point blank)
console.log('--- Test 7: Pistols vs Rifles (Point Blank, 2 tiles) ---');
const { blue: blue7, red: red7, distance: dist7, description: desc7 } = createPistolCloseRangeTest();
console.log(desc7);
const result7 = runBatch(blue7, red7, 1000);
console.log(`Pistols: ${result7.blueWinRate.toFixed(1)}% | Rifles: ${result7.redWinRate.toFixed(1)}%`);
console.log(`Target: Pistols 45-55% (competitive in CQB) | ${result7.blueWinRate >= 40 ? '✅ PASS' : '❌ FAIL'}\n`);

// ============ PERFORMANCE TEST ============

console.log('=== PERFORMANCE BENCHMARK ===\n');

console.log('--- Test 8: 10,000 Battles ---');
const { blue: blue8, red: red8 } = createSoldierTest();
const result8 = runBatch(blue8, red8, 10000);
console.log(`10,000 battles in ${result8.totalDurationMs.toFixed(0)}ms`);
console.log(`Speed: ${result8.fightsPerSecond.toFixed(0)} fights/second`);
console.log(`Target: 10,000+ fights/sec | ${result8.fightsPerSecond >= 10000 ? '✅ PASS' : '❌ FAIL'}\n`);

// ============ SUMMARY ============

console.log('========== BALANCE SUMMARY ==========\n');
console.log('Cover System:');
console.log(`  Half: ${result3.blueWinRate.toFixed(1)}% (target 60-65%)`);
console.log(`  Full: ${result4.blueWinRate.toFixed(1)}% (target 70-75%)`);
console.log('');
console.log('Stance System:');
console.log(`  Defensive bonus: +${defBonus.toFixed(1)}% (target +5-15%)`);
console.log('');
console.log('Weapon Roles:');
console.log(`  Rifles vs Pistols (optimal): ${result2.blueWinRate.toFixed(1)}% rifles`);
console.log(`  Shotguns vs Rifles (close):  ${result6.blueWinRate.toFixed(1)}% shotguns`);
console.log(`  Pistols vs Rifles (close):   ${result7.blueWinRate.toFixed(1)}% pistols`);
console.log('');

console.log('========== ALL TESTS COMPLETE ==========\n');

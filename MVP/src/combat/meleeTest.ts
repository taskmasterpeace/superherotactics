/**
 * Melee Combat Balance Test Suite
 *
 * Run with: npx tsx src/combat/meleeTest.ts
 *
 * Tests unarmed combat, martial arts weapons, and CQB dynamics.
 */

import {
  runBatch,
  createUnarmedMirrorTest,
  createNunchucksVsKnivesTest,
  createStaffVsFistsTest,
  createMeleeVsPistolTest,
  createSamuraiVsSoldiersTest,
  createKickboxerVsBoxerTest,
  WEAPONS,
} from './index';

console.log('\n========== MELEE COMBAT BALANCE TEST SUITE ==========\n');

console.log('Weapon Stats (Melee):');
console.log('  Fist:      dmg=8,  acc=85%, ap=1, range=1');
console.log('  Cross:     dmg=10, acc=85%, ap=1, range=1, KB=30');
console.log('  Kick:      dmg=12, acc=80%, ap=2, range=1, KB=60');
console.log('  Knife:     dmg=10, acc=80%, ap=1, range=1');
console.log('  Nunchucks: dmg=12, acc=75%, ap=2, range=1, KB=40 (+25% disarm)');
console.log('  Bo Staff:  dmg=15, acc=80%, ap=2, range=2, KB=70');
console.log('  Katana:    dmg=25, acc=70%, ap=3, range=2');
console.log('');

// ============ MIRROR MATCHES ============

console.log('=== UNARMED MIRROR MATCHES ===\n');

// Test 1: Boxer vs Boxer
console.log('--- Test 1: Boxer vs Boxer (Mirror Match) ---');
const { blue: b1, red: r1, description: d1 } = createUnarmedMirrorTest();
console.log(d1);
const result1 = runBatch(b1, r1, 1000);
console.log(`Blue: ${result1.blueWinRate.toFixed(1)}% | Red: ${result1.redWinRate.toFixed(1)}%`);
console.log(`Target: 50% ± 5% | ${Math.abs(result1.blueWinRate - 50) <= 5 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Kickboxer vs Boxer
console.log('--- Test 2: Kickboxer vs Boxer ---');
const { blue: b2, red: r2, description: d2 } = createKickboxerVsBoxerTest();
console.log(d2);
const result2 = runBatch(b2, r2, 1000);
console.log(`Kickboxers: ${result2.blueWinRate.toFixed(1)}% | Boxers: ${result2.redWinRate.toFixed(1)}%`);
console.log(`Expected: Slight kickboxer advantage (kicks hit harder)\n`);

// ============ MARTIAL ARTS COMPARISONS ============

console.log('=== MARTIAL ARTS COMPARISONS ===\n');

// Test 3: Nunchucks vs Knives
console.log('--- Test 3: Nunchucks vs Knives ---');
const { blue: b3, red: r3, description: d3 } = createNunchucksVsKnivesTest();
console.log(d3);
const result3 = runBatch(b3, r3, 1000);
console.log(`Nunchucks: ${result3.blueWinRate.toFixed(1)}% | Knives: ${result3.redWinRate.toFixed(1)}%`);
console.log(`Expected: Fairly even - nunchucks blunt vs knife slash\n`);

// Test 4: Staff vs Fists (Reach Advantage)
console.log('--- Test 4: Staff vs Fists (Reach Test at 2 tiles) ---');
const { blue: b4, red: r4, description: d4, distance: dist4 } = createStaffVsFistsTest();
console.log(d4);
console.log(`Distance: ${dist4} tiles | Staff range: 2 | Fist range: 1`);
const result4 = runBatch(b4, r4, 1000);
console.log(`Staff: ${result4.blueWinRate.toFixed(1)}% | Fists: ${result4.redWinRate.toFixed(1)}%`);
console.log(`Expected: Staff dominates (fists can't reach!)\n`);

// ============ MELEE VS RANGED ============

console.log('=== MELEE VS RANGED (CQB) ===\n');

// Test 5: Knife vs Pistol
console.log('--- Test 5: Knife Experts vs Civilians with Pistols ---');
const { blue: b5, red: r5, description: d5 } = createMeleeVsPistolTest();
console.log(d5);
const result5 = runBatch(b5, r5, 1000);
console.log(`Knives: ${result5.blueWinRate.toFixed(1)}% | Pistols: ${result5.redWinRate.toFixed(1)}%`);
console.log(`Expected: Knives competitive at melee range (60-70%)\n`);

// Test 6: Samurai vs Soldiers
console.log('--- Test 6: Samurai vs Armed Soldiers ---');
const { blue: b6, red: r6, description: d6, distance: dist6 } = createSamuraiVsSoldiersTest();
console.log(d6);
console.log(`Distance: ${dist6} tiles | 2 Elite Samurai vs 3 Soldiers with Rifles`);
const result6 = runBatch(b6, r6, 1000);
console.log(`Samurai: ${result6.blueWinRate.toFixed(1)}% | Soldiers: ${result6.redWinRate.toFixed(1)}%`);
console.log(`Expected: Soldiers win (rifles outrange katana, armor blocks slashes)\n`);

// ============ SUMMARY ============

console.log('========== MELEE BALANCE SUMMARY ==========\n');

console.log('Mirror Matches:');
console.log(`  Boxer vs Boxer: ${result1.blueWinRate.toFixed(1)}% (target 50%)`);
console.log(`  Kickboxer vs Boxer: ${result2.blueWinRate.toFixed(1)}% kickboxer`);
console.log('');

console.log('Martial Arts:');
console.log(`  Nunchucks vs Knives: ${result3.blueWinRate.toFixed(1)}% nunchucks`);
console.log(`  Staff vs Fists (2 tiles): ${result4.blueWinRate.toFixed(1)}% staff`);
console.log('');

console.log('CQB (Melee vs Ranged):');
console.log(`  Knife vs Pistol: ${result5.blueWinRate.toFixed(1)}% knives`);
console.log(`  Samurai vs Soldiers: ${result6.blueWinRate.toFixed(1)}% samurai`);
console.log('');

console.log('========== ALL MELEE TESTS COMPLETE ==========\n');

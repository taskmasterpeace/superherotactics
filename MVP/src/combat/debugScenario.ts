/**
 * Debug Scenario Test
 */
import { createUnit, UNIT_PRESETS, resetUnitIds } from './humanPresets';
import { runQuickBattle } from './battleRunner';
import { runBatch } from './batchTester';

console.log('=== Comparing runQuickBattle vs runBatch ===\n');

// Test 1: Direct unit creation with runBatch (working)
console.log('Test 1: Direct creation with runBatch');
resetUnitIds();
const soldiers1 = [
  createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S1'),
  createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S2'),
];
const thugs1 = [
  createUnit(UNIT_PRESETS.thug, 'red', 'T1'),
  createUnit(UNIT_PRESETS.thug, 'red', 'T2'),
  createUnit(UNIT_PRESETS.thug, 'red', 'T3'),
];
const batch = runBatch(soldiers1, thugs1, 20);
console.log(`  runBatch: Blue ${batch.blueWinRate.toFixed(0)}% | Red ${batch.redWinRate.toFixed(0)}%`);

// Test 2: Same units with runQuickBattle
console.log('\nTest 2: Direct creation with runQuickBattle loop');
let blueWins = 0;
let redWins = 0;
for (let i = 0; i < 20; i++) {
  resetUnitIds();
  const soldiers = [
    createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S1'),
    createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S2'),
  ];
  const thugs = [
    createUnit(UNIT_PRESETS.thug, 'red', 'T1'),
    createUnit(UNIT_PRESETS.thug, 'red', 'T2'),
    createUnit(UNIT_PRESETS.thug, 'red', 'T3'),
  ];
  const result = runQuickBattle(soldiers, thugs);
  if (result.winner === 'blue') blueWins++;
  else if (result.winner === 'red') redWins++;
}
console.log(`  runQuickBattle: Blue ${(blueWins / 20 * 100).toFixed(0)}% | Red ${(redWins / 20 * 100).toFixed(0)}%`);

// Test 3: Two separate resetUnitIds calls
console.log('\nTest 3: Separate resetUnitIds for each team');
blueWins = 0;
redWins = 0;
for (let i = 0; i < 20; i++) {
  resetUnitIds();
  const thugs = [
    createUnit(UNIT_PRESETS.thug, 'red', 'T1'),
    createUnit(UNIT_PRESETS.thug, 'red', 'T2'),
    createUnit(UNIT_PRESETS.thug, 'red', 'T3'),
  ];
  resetUnitIds();  // Reset again!
  const soldiers = [
    createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S1'),
    createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S2'),
  ];
  const result = runQuickBattle(soldiers, thugs);
  if (result.winner === 'blue') blueWins++;
  else if (result.winner === 'red') redWins++;
}
console.log(`  runQuickBattle: Blue ${(blueWins / 20 * 100).toFixed(0)}% | Red ${(redWins / 20 * 100).toFixed(0)}%`);

console.log('\nChecking unit IDs after separate resets:');
resetUnitIds();
const test_thugs = [
  createUnit(UNIT_PRESETS.thug, 'red', 'T1'),
  createUnit(UNIT_PRESETS.thug, 'red', 'T2'),
];
resetUnitIds();
const test_soldiers = [
  createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S1'),
  createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'S2'),
];
console.log('Thugs:', test_thugs.map(t => t.id).join(', '));
console.log('Soldiers:', test_soldiers.map(s => s.id).join(', '));

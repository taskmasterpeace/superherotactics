/**
 * Test if position stacking causes the melee bias
 */

import { createUnit, UNIT_PRESETS, runBatch, resetUnitIds } from './index';

console.log('=== POSITION BIAS TEST ===\n');

// Test 1: No positions set (default) - this works in boxerBias.ts
resetUnitIds();
const test1Blue = [
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
];
const test1Red = [
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
];
const result1 = runBatch(test1Blue, test1Red, 1000);
console.log('Test 1 - Default positions:');
console.log('  Blue: ' + result1.blueWinRate.toFixed(1) + '% | Red: ' + result1.redWinRate.toFixed(1) + '%');

// Test 2: Stacked positions (like createUnarmedMirrorTest)
resetUnitIds();
const test2Blue = [
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
];
const test2Red = [
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
];
test2Blue.forEach(u => u.position = { x: 0, y: 5 });
test2Red.forEach(u => u.position = { x: 1, y: 5 });
const result2 = runBatch(test2Blue, test2Red, 1000);
console.log('\nTest 2 - Stacked positions (all Blue at 0,5, all Red at 1,5):');
console.log('  Blue: ' + result2.blueWinRate.toFixed(1) + '% | Red: ' + result2.redWinRate.toFixed(1) + '%');

// Test 3: Spread positions
resetUnitIds();
const test3Blue = [
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
];
const test3Red = [
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
];
test3Blue[0].position = { x: 0, y: 0 };
test3Blue[1].position = { x: 0, y: 5 };
test3Blue[2].position = { x: 0, y: 10 };
test3Red[0].position = { x: 1, y: 0 };
test3Red[1].position = { x: 1, y: 5 };
test3Red[2].position = { x: 1, y: 10 };
const result3 = runBatch(test3Blue, test3Red, 1000);
console.log('\nTest 3 - Spread positions (different Y for each):');
console.log('  Blue: ' + result3.blueWinRate.toFixed(1) + '% | Red: ' + result3.redWinRate.toFixed(1) + '%');

console.log('\n=== CONCLUSION ===');
if (result2.blueWinRate > 90) {
  console.log('Position stacking is causing the bias!');
} else {
  console.log('Position stacking is NOT the cause.');
}

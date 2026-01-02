/**
 * Test if boxer bias is caused by array order
 */

import { createUnit, UNIT_PRESETS, runBatch, resetUnitIds } from './index';

console.log('=== BOXER ARRAY ORDER BIAS TEST ===\n');

// Test 1: 1v1 Boxer (standard order)
resetUnitIds();
const blue1 = [createUnit(UNIT_PRESETS.boxer, 'blue')];
const red1 = [createUnit(UNIT_PRESETS.boxer, 'red')];
const result1 = runBatch(blue1, red1, 1000);
console.log('1v1 Boxer: Blue ' + result1.blueWinRate.toFixed(1) + '% | Red ' + result1.redWinRate.toFixed(1) + '%');

// Test 2: 3v3 Boxer
resetUnitIds();
const blue2 = [
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
];
const red2 = [
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
];
const result2 = runBatch(blue2, red2, 1000);
console.log('3v3 Boxer: Blue ' + result2.blueWinRate.toFixed(1) + '% | Red ' + result2.redWinRate.toFixed(1) + '%');

// Test 3: Check if it's the unit ID order causing issues
console.log('\n=== UNIT ID CHECK ===');
resetUnitIds();
const b = createUnit(UNIT_PRESETS.boxer, 'blue');
const r = createUnit(UNIT_PRESETS.boxer, 'red');
console.log('Blue ID:', b.id);
console.log('Red ID:', r.id);

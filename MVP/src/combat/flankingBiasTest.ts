/**
 * Test to confirm flanking is causing the melee bias
 *
 * HYPOTHESIS: Units default to facing right (0°).
 * Blue at x=0, Red at x=1:
 * - Blue faces right → faces Red → FRONTAL attacks (+0%)
 * - Red faces right → faces AWAY from Blue → REAR attacks from Blue (+25% or +40%)
 *
 * This means Blue gets massive flanking bonuses!
 */

import {
  createUnit,
  UNIT_PRESETS,
  runBatch,
  resetUnitIds,
  getFlankingResult,
  getFlankingBonus,
} from './index';

console.log('=== FLANKING BIAS CONFIRMATION TEST ===\n');

// Create units with positions
resetUnitIds();
const blue = createUnit(UNIT_PRESETS.boxer, 'blue');
const red = createUnit(UNIT_PRESETS.boxer, 'red');

// Set positions like createUnarmedMirrorTest does
blue.position = { x: 0, y: 5 };
red.position = { x: 1, y: 5 };

// Check default vision facing
console.log('Default Vision Check:');
console.log('  Blue vision:', blue.vision || 'undefined (will use default facing: 0 = right)');
console.log('  Red vision:', red.vision || 'undefined (will use default facing: 0 = right)');

// Check flanking from each side
console.log('\nFlanking Analysis:');
const blueAttacksRed = getFlankingResult(blue, red);
const blueBonus = getFlankingBonus(blue, red);
console.log(`  Blue attacks Red: ${blueAttacksRed} (+${blueBonus}%)`);

const redAttacksBlue = getFlankingResult(red, blue);
const redBonus = getFlankingBonus(red, blue);
console.log(`  Red attacks Blue: ${redAttacksBlue} (+${redBonus}%)`);

if (blueBonus > redBonus) {
  console.log('\n🔴 CONFIRMED: Blue has flanking advantage!');
  console.log('   This is why Blue wins ~98% of melee battles when positions are set.');
} else if (redBonus > blueBonus) {
  console.log('\n🔴 CONFIRMED: Red has flanking advantage!');
} else {
  console.log('\n✅ No flanking asymmetry detected.');
}

// Test with explicit facing toward each other
console.log('\n=== TEST WITH FIXED FACING ===\n');

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

// Set positions
blue2.forEach(u => u.position = { x: 0, y: 5 });
red2.forEach(u => u.position = { x: 1, y: 5 });

// Set facing toward each other
// Blue at x=0 should face right (0) to look at Red at x=1 ✓ (already default)
// Red at x=1 should face left (180) to look at Blue at x=0 ✗ (default is 0)
blue2.forEach(u => u.vision = { facing: 0, angle: 120, range: 15 });  // Face right
red2.forEach(u => u.vision = { facing: 180, angle: 120, range: 15 }); // Face left

const result2 = runBatch(blue2, red2, 1000);
console.log('With Fixed Facing (both face each other):');
console.log(`  Blue: ${result2.blueWinRate.toFixed(1)}% | Red: ${result2.redWinRate.toFixed(1)}%`);

if (Math.abs(result2.blueWinRate - 50) <= 10) {
  console.log('  ✅ BALANCED! Fixing vision facing solves the problem.');
} else {
  console.log('  ❌ Still biased - need to investigate further.');
}

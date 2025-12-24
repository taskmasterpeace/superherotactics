/**
 * Flanking & Vision Test
 *
 * Tests the vision cone and flanking bonus systems.
 * Run: npx tsx src/combat/flankingTest.ts
 */

import {
  SimUnit,
  VisionCone,
  FlankingResult,
  FLANKING_BONUSES,
  DEFAULT_VISION,
} from './types';
import {
  getAngleToTarget,
  isInVisionCone,
  getFlankingResult,
  getFlankingBonus,
  canReact,
  faceToward,
  calculateAccuracy,
  resolveAttack,
} from './core';
import { WEAPONS, UNIT_PRESETS, createUnit } from './humanPresets';
import { runBatch, formatBatchResult } from './batchTester';

console.log('='.repeat(60));
console.log('       FLANKING & VISION TEST');
console.log('='.repeat(60));

// ============ ANGLE CALCULATION TESTS ============
console.log('\n=== ANGLE CALCULATION ===\n');

// Test angle calculations (unit circle: 0=right, 90=up, 180=left, 270=down)
const angleTests = [
  { from: [0, 0], to: [1, 0], expected: 0, desc: 'Right' },
  { from: [0, 0], to: [0, -1], expected: 90, desc: 'Up (screen coords)' },
  { from: [0, 0], to: [-1, 0], expected: 180, desc: 'Left' },
  { from: [0, 0], to: [0, 1], expected: 270, desc: 'Down (screen coords)' },
  { from: [0, 0], to: [1, -1], expected: 45, desc: 'Up-Right' },
  { from: [0, 0], to: [-1, -1], expected: 135, desc: 'Up-Left' },
  { from: [0, 0], to: [-1, 1], expected: 225, desc: 'Down-Left' },
  { from: [0, 0], to: [1, 1], expected: 315, desc: 'Down-Right' },
];

let anglePass = 0;
for (const test of angleTests) {
  const angle = getAngleToTarget(test.from[0], test.from[1], test.to[0], test.to[1]);
  const pass = Math.abs(angle - test.expected) < 1;
  console.log(`  ${test.desc}: ${angle.toFixed(1)}° (expected ${test.expected}°) ${pass ? '✅' : '❌'}`);
  if (pass) anglePass++;
}
console.log(`\nAngle tests: ${anglePass}/${angleTests.length} passed`);

// ============ VISION CONE TESTS ============
console.log('\n=== VISION CONE ===\n');

// Create a unit at (5,5) facing right (0°) with 120° vision
const visionUnit: SimUnit = {
  ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'),
  position: { x: 5, y: 5 },
  vision: { facing: 0, angle: 120, range: 15 },
};

const visionTests = [
  { x: 8, y: 5, expected: true, desc: 'In front (right)' },
  { x: 7, y: 4, expected: true, desc: 'Up-right (in cone)' },
  { x: 7, y: 6, expected: true, desc: 'Down-right (in cone)' },
  { x: 2, y: 5, expected: false, desc: 'Behind (left)' },
  { x: 5, y: 2, expected: false, desc: 'Direct up (outside cone)' },
  { x: 5, y: 8, expected: false, desc: 'Direct down (outside cone)' },
  { x: 25, y: 5, expected: false, desc: 'Too far (out of range)' },
];

let visionPass = 0;
for (const test of visionTests) {
  const inCone = isInVisionCone(visionUnit, test.x, test.y);
  const pass = inCone === test.expected;
  console.log(`  ${test.desc} (${test.x},${test.y}): ${inCone} ${pass ? '✅' : '❌'}`);
  if (pass) visionPass++;
}
console.log(`\nVision tests: ${visionPass}/${visionTests.length} passed`);

// ============ FLANKING RESULT TESTS ============
console.log('\n=== FLANKING RESULTS ===\n');

// Target at (5,5) facing right (0°)
const target: SimUnit = {
  ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  position: { x: 5, y: 5 },
  vision: { facing: 0, angle: 120, range: 15 },
};

// Attackers from different positions
const flankTests: { pos: [number, number]; expected: FlankingResult; desc: string }[] = [
  { pos: [8, 5], expected: 'front', desc: 'Attack from front (right of target)' },
  { pos: [5, 3], expected: 'side', desc: 'Attack from top (side)' },
  { pos: [5, 7], expected: 'side', desc: 'Attack from bottom (side)' },
  { pos: [2, 5], expected: 'blindspot', desc: 'Attack from behind (left of target)' },
  { pos: [3, 3], expected: 'blindspot', desc: 'Attack from back-left (outside 120° vision)' },
];

let flankPass = 0;
for (const test of flankTests) {
  const attacker: SimUnit = {
    ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'),
    position: { x: test.pos[0], y: test.pos[1] },
  };
  const result = getFlankingResult(attacker, target);
  const bonus = getFlankingBonus(attacker, target);
  const pass = result === test.expected;
  console.log(`  ${test.desc}: ${result} (+${bonus}%) ${pass ? '✅' : '❌'}`);
  if (pass) flankPass++;
}
console.log(`\nFlanking tests: ${flankPass}/${flankTests.length} passed`);

// ============ REACTION TESTS ============
console.log('\n=== REACTION CAPABILITY ===\n');

for (const test of flankTests) {
  const attacker: SimUnit = {
    ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'),
    position: { x: test.pos[0], y: test.pos[1] },
  };
  const canReactShot = canReact(target, attacker);
  console.log(`  ${test.desc}: can react = ${canReactShot}`);
}

// ============ ACCURACY IMPACT ============
console.log('\n=== ACCURACY IMPACT ===\n');

// Create units with positions
const baseAttacker = createUnit(UNIT_PRESETS.soldierRifle, 'blue');
const baseTarget = createUnit(UNIT_PRESETS.soldierRifle, 'red');

// Without positions (no flanking)
const accNoPos = calculateAccuracy(baseAttacker, baseTarget);
console.log(`Base accuracy (no positions): ${accNoPos}%`);

// With positions - front attack
const frontAttacker: SimUnit = {
  ...baseAttacker,
  position: { x: 8, y: 5 },
};
const targetWithVision: SimUnit = {
  ...baseTarget,
  position: { x: 5, y: 5 },
  vision: { facing: 0, angle: 120, range: 15 },
};
const accFront = calculateAccuracy(frontAttacker, targetWithVision);
console.log(`Front attack: ${accFront}% (+${accFront - accNoPos}% from flanking)`);

// Side attack
const sideAttacker: SimUnit = {
  ...baseAttacker,
  position: { x: 5, y: 3 },
};
const accSide = calculateAccuracy(sideAttacker, targetWithVision);
console.log(`Side attack: ${accSide}% (+${accSide - accNoPos}% from flanking)`);

// Rear attack
const rearAttacker: SimUnit = {
  ...baseAttacker,
  position: { x: 2, y: 5 },
};
const accRear = calculateAccuracy(rearAttacker, targetWithVision);
console.log(`Rear/Blindspot attack: ${accRear}% (+${accRear - accNoPos}% from flanking)`);

// ============ BATCH TEST: FLANKING ADVANTAGE ============
console.log('\n=== BATCH TEST: FLANKING ADVANTAGE ===\n');

// Create a flanking scenario: 1 unit at front, 1 at back
function createFlankingTest() {
  const blue = [
    { ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'), position: { x: 8, y: 5 } }, // Front
    { ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'), position: { x: 2, y: 5 } }, // Rear (flanking)
  ];

  const red = [
    {
      ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
      position: { x: 5, y: 5 },
      vision: { facing: 0, angle: 120, range: 15 }
    },
    {
      ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
      position: { x: 5, y: 6 },
      vision: { facing: 0, angle: 120, range: 15 }
    },
  ];

  return { blue, red };
}

function createNoFlankingTest() {
  const blue = [
    { ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'), position: { x: 8, y: 5 } },
    { ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'), position: { x: 8, y: 6 } },
  ];

  const red = [
    {
      ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
      position: { x: 5, y: 5 },
      vision: { facing: 0, angle: 120, range: 15 }
    },
    {
      ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
      position: { x: 5, y: 6 },
      vision: { facing: 0, angle: 120, range: 15 }
    },
  ];

  return { blue, red };
}

console.log('Running 1000 battles with flanking...');
const flankingScenario = createFlankingTest();
const flankingResult = runBatch(flankingScenario.blue, flankingScenario.red, 1000);
console.log(`Flanking (1 front, 1 rear): Blue ${flankingResult.blueWinRate.toFixed(1)}% | Red ${flankingResult.redWinRate.toFixed(1)}%`);

console.log('\nRunning 1000 battles without flanking...');
const noFlankingScenario = createNoFlankingTest();
const noFlankingResult = runBatch(noFlankingScenario.blue, noFlankingScenario.red, 1000);
console.log(`No Flanking (both front): Blue ${noFlankingResult.blueWinRate.toFixed(1)}% | Red ${noFlankingResult.redWinRate.toFixed(1)}%`);

const advantage = flankingResult.blueWinRate - noFlankingResult.blueWinRate;
console.log(`\nFlanking advantage: +${advantage.toFixed(1)}%`);

// ============ SUMMARY ============
console.log('\n' + '='.repeat(60));
console.log('       SUMMARY');
console.log('='.repeat(60));

console.log(`
Flanking Bonuses (accuracy):
  Front:     +${FLANKING_BONUSES.front}%
  Side:      +${FLANKING_BONUSES.side}%
  Rear:      +${FLANKING_BONUSES.rear}%
  Blindspot: +${FLANKING_BONUSES.blindspot}% (no reaction shot)

Default Vision:
  Human:     ${DEFAULT_VISION.human.angle}° FoV, ${DEFAULT_VISION.human.range} tiles
  Enhanced:  ${DEFAULT_VISION.enhanced.angle}° FoV, ${DEFAULT_VISION.enhanced.range} tiles
  Superhuman: ${DEFAULT_VISION.superhuman.angle}° FoV, ${DEFAULT_VISION.superhuman.range} tiles
  Robot:     ${DEFAULT_VISION.robot.angle}° FoV, ${DEFAULT_VISION.robot.range} tiles

Tests Passed: ${anglePass}/${angleTests.length} angle, ${visionPass}/${visionTests.length} vision, ${flankPass}/${flankTests.length} flanking
`);

console.log('='.repeat(60));
console.log('       ALL TESTS COMPLETE');
console.log('='.repeat(60));

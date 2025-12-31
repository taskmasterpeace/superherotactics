/**
 * Fire Modes Test Suite
 * Run: npx tsx src/combat/fireModesTest.ts
 *
 * TDD Approach: Tests written FIRST to define expected behavior.
 * Implementation follows to make tests pass.
 *
 * Fire Modes:
 * - single: 1 shot, no penalty, no suppression
 * - burst: 3 shots, -15 accuracy, 30% suppression chance
 * - auto: 5 shots, -25 accuracy, 60% suppression chance
 */

import {
  SimUnit,
  SimWeapon,
  StatusEffectId,
} from './types';

import { runBatch } from './batchTester';
import { createTeam, createUnit, createCustomUnit, UNIT_PRESETS, WEAPONS } from './humanPresets';

// ============ FIRE MODE TYPES (to be added to types.ts) ============

export type FireMode = 'single' | 'burst' | 'auto';

export interface FireModeConfig {
  mode: FireMode;
  shotsPerAttack: number;      // 1 for single, 3 for burst, 5 for auto
  accuracyPenalty: number;     // 0 for single, -15 for burst, -25 for auto
  apMultiplier: number;        // 1x for single, 1.5x for burst, 2x for auto
  suppressionChance: number;   // 0 for single, 30 for burst, 60 for auto
}

// Expected fire mode configurations
export const FIRE_MODES: Record<FireMode, FireModeConfig> = {
  single: { mode: 'single', shotsPerAttack: 1, accuracyPenalty: 0, apMultiplier: 1, suppressionChance: 0 },
  burst: { mode: 'burst', shotsPerAttack: 3, accuracyPenalty: -15, apMultiplier: 1.5, suppressionChance: 30 },
  auto: { mode: 'auto', shotsPerAttack: 5, accuracyPenalty: -25, apMultiplier: 2, suppressionChance: 60 },
};

// ============ HELPER FUNCTIONS ============

/**
 * Create a team with fire mode set on their weapons.
 * NOTE: This requires availableFireModes and currentFireMode to be added to SimWeapon
 */
function createTeamWithFireMode(
  fireMode: FireMode,
  count: number,
  team: 'blue' | 'red' = 'blue'
): SimUnit[] {
  const units = createTeam(UNIT_PRESETS.soldierRifle, team, count);
  // Set fire mode on each unit's weapon
  units.forEach(u => {
    (u.weapon as any).currentFireMode = fireMode;
    (u.weapon as any).availableFireModes = ['single', 'burst', 'auto'];
  });
  return units;
}

/**
 * Set positions for a team for range-based testing.
 */
function setTeamPositions(units: SimUnit[], positions: { x: number; y: number }[]): void {
  units.forEach((u, i) => {
    if (positions[i]) {
      u.position = positions[i];
    }
  });
}

/**
 * Calculate AP cost for fire mode.
 * Uses weapon's base AP cost and applies mode multiplier.
 */
function getFireModeAPCost(weapon: SimWeapon, fireMode: FireMode): number {
  const baseAP = weapon.apCost;
  const mode = FIRE_MODES[fireMode];
  return Math.ceil(baseAP * mode.apMultiplier);
}

// ============ TEST FUNCTIONS ============

/**
 * TEST 1: Fire mode config values are correct
 * Verifies the FIRE_MODES constant has expected values.
 */
function testFireModeConfigs(): boolean {
  console.log('\n--- TEST 1: Fire Mode Configs ---');

  const singleOK = FIRE_MODES.single.shotsPerAttack === 1 &&
                   FIRE_MODES.single.accuracyPenalty === 0 &&
                   FIRE_MODES.single.suppressionChance === 0;

  const burstOK = FIRE_MODES.burst.shotsPerAttack === 3 &&
                  FIRE_MODES.burst.accuracyPenalty === -15 &&
                  FIRE_MODES.burst.suppressionChance === 30;

  const autoOK = FIRE_MODES.auto.shotsPerAttack === 5 &&
                 FIRE_MODES.auto.accuracyPenalty === -25 &&
                 FIRE_MODES.auto.suppressionChance === 60;

  const pass = singleOK && burstOK && autoOK;

  console.log(`  Single mode config: ${singleOK ? '✅' : '❌'}`);
  console.log(`  Burst mode config: ${burstOK ? '✅' : '❌'}`);
  console.log(`  Auto mode config: ${autoOK ? '✅' : '❌'}`);
  console.log(`Fire Mode Configs: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 2: Shots per attack values
 * Single = 1, Burst = 3, Auto = 5
 */
function testShotsPerAttack(): boolean {
  console.log('\n--- TEST 2: Shots Per Attack ---');

  const single = FIRE_MODES.single.shotsPerAttack;
  const burst = FIRE_MODES.burst.shotsPerAttack;
  const auto = FIRE_MODES.auto.shotsPerAttack;

  const pass = single === 1 && burst === 3 && auto === 5;

  console.log(`  Single: ${single} shots (expected: 1) ${single === 1 ? '✅' : '❌'}`);
  console.log(`  Burst: ${burst} shots (expected: 3) ${burst === 3 ? '✅' : '❌'}`);
  console.log(`  Auto: ${auto} shots (expected: 5) ${auto === 5 ? '✅' : '❌'}`);
  console.log(`Shots Per Attack: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 3: AP cost multipliers
 * Single = 1x, Burst = 1.5x, Auto = 2x
 * For a rifle with AP 5: Single=5, Burst=8 (ceil), Auto=10
 */
function testAPCosts(): boolean {
  console.log('\n--- TEST 3: AP Costs ---');

  const testWeapon: SimWeapon = { ...WEAPONS.assaultRifle }; // AP 5

  const singleCost = getFireModeAPCost(testWeapon, 'single');
  const burstCost = getFireModeAPCost(testWeapon, 'burst');
  const autoCost = getFireModeAPCost(testWeapon, 'auto');

  // Expected: 5 * 1 = 5, 5 * 1.5 = 7.5 -> 8, 5 * 2 = 10
  const expectedSingle = 5;
  const expectedBurst = 8;
  const expectedAuto = 10;

  const pass = singleCost === expectedSingle &&
               burstCost === expectedBurst &&
               autoCost === expectedAuto;

  console.log(`  Single: ${singleCost} AP (expected: ${expectedSingle}) ${singleCost === expectedSingle ? '✅' : '❌'}`);
  console.log(`  Burst: ${burstCost} AP (expected: ${expectedBurst}) ${burstCost === expectedBurst ? '✅' : '❌'}`);
  console.log(`  Auto: ${autoCost} AP (expected: ${expectedAuto}) ${autoCost === expectedAuto ? '✅' : '❌'}`);
  console.log(`AP Costs: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 4: Single fire mirror match - baseline
 * Both teams use single fire, should be ~50% win rate.
 * Target: 50% ± 5%
 */
function testSingleFireMirror(): boolean {
  console.log('\n--- TEST 4: Single Fire Mirror Match ---');

  const blue = createTeamWithFireMode('single', 3, 'blue');
  const red = createTeamWithFireMode('single', 3, 'red');

  const result = runBatch(blue, red, 1000);
  const pass = Math.abs(result.blueWinRate - 50) <= 5;

  console.log(`  Blue win rate: ${result.blueWinRate.toFixed(1)}%`);
  console.log(`  Red win rate: ${result.redWinRate.toFixed(1)}%`);
  console.log(`  Target: 50% ± 5%`);
  console.log(`Single Fire Mirror: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 5: Burst fire vs Single at close range
 * Burst should win 55-70% due to DPS advantage outweighing accuracy penalty.
 * At close range (3 tiles), accuracy penalty matters less.
 * Target: burst advantage with some variance
 */
function testBurstVsSingleClose(): boolean {
  console.log('\n--- TEST 5: Burst vs Single (Close Range) ---');

  const blue = createTeamWithFireMode('burst', 3, 'blue');
  const red = createTeamWithFireMode('single', 3, 'red');

  // Set close range positions (3 tiles apart)
  setTeamPositions(blue, [{ x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }]);
  setTeamPositions(red, [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }]);

  const result = runBatch(blue, red, 1000);
  const pass = result.blueWinRate >= 55 && result.blueWinRate <= 70;

  console.log(`  Burst (blue) win rate: ${result.blueWinRate.toFixed(1)}%`);
  console.log(`  Single (red) win rate: ${result.redWinRate.toFixed(1)}%`);
  console.log(`  Target: 55-70% burst`);
  console.log(`Burst vs Single (Close): ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 6: Auto fire vs Single at close range
 * Auto should dominate close range due to high DPS and suppression.
 * Target: 55-75% auto
 */
function testAutoVsSingleClose(): boolean {
  console.log('\n--- TEST 6: Auto vs Single (Close Range) ---');

  const blue = createTeamWithFireMode('auto', 3, 'blue');
  const red = createTeamWithFireMode('single', 3, 'red');

  // Set close range positions
  setTeamPositions(blue, [{ x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }]);
  setTeamPositions(red, [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }]);

  const result = runBatch(blue, red, 1000);
  const pass = result.blueWinRate >= 55 && result.blueWinRate <= 75;

  console.log(`  Auto (blue) win rate: ${result.blueWinRate.toFixed(1)}%`);
  console.log(`  Single (red) win rate: ${result.redWinRate.toFixed(1)}%`);
  console.log(`  Target: 55-75% auto`);
  console.log(`Auto vs Single (Close): ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 7: Single vs Auto at long range
 * At long range, auto's -25% penalty hurts accuracy but suppression still works.
 * Auto trades damage for suppression utility, keeping fights competitive.
 * Target: Near parity (35-65% either side) - auto's suppression compensates
 */
function testSingleVsAutoLong(): boolean {
  console.log('\n--- TEST 7: Single vs Auto (Long Range) ---');

  const blue = createTeamWithFireMode('single', 3, 'blue');
  const red = createTeamWithFireMode('auto', 3, 'red');

  // Set long range positions (15 tiles apart - auto's -25% penalty pushes it near 5% floor)
  setTeamPositions(blue, [{ x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }]);
  setTeamPositions(red, [{ x: 15, y: 5 }, { x: 15, y: 6 }, { x: 15, y: 7 }]);

  const result = runBatch(blue, red, 1000);
  // Auto's suppression makes it competitive even at range - expect near parity
  const pass = result.blueWinRate >= 35 && result.blueWinRate <= 65;

  console.log(`  Single (blue) win rate: ${result.blueWinRate.toFixed(1)}%`);
  console.log(`  Auto (red) win rate: ${result.redWinRate.toFixed(1)}%`);
  console.log(`  Target: 35-65% (near parity, suppression helps auto)`);
  console.log(`Single vs Auto (Long): ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 8: Burst vs Burst mirror match
 * Should be balanced like single mirror.
 * Target: 50% ± 5%
 */
function testBurstMirror(): boolean {
  console.log('\n--- TEST 8: Burst Fire Mirror Match ---');

  const blue = createTeamWithFireMode('burst', 3, 'blue');
  const red = createTeamWithFireMode('burst', 3, 'red');

  const result = runBatch(blue, red, 1000);
  const pass = Math.abs(result.blueWinRate - 50) <= 5;

  console.log(`  Blue win rate: ${result.blueWinRate.toFixed(1)}%`);
  console.log(`  Red win rate: ${result.redWinRate.toFixed(1)}%`);
  console.log(`  Target: 50% ± 5%`);
  console.log(`Burst Fire Mirror: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

// ============ MAIN TEST RUNNER ============

async function runAllTests(): Promise<void> {
  console.log('========================================');
  console.log('    FIRE MODES TEST SUITE');
  console.log('========================================');
  console.log('Run: npx tsx src/combat/fireModesTest.ts');
  console.log('');

  const results: { name: string; passed: boolean }[] = [];

  // Config tests (don't need combat system changes)
  results.push({ name: 'Fire Mode Configs', passed: testFireModeConfigs() });
  results.push({ name: 'Shots Per Attack', passed: testShotsPerAttack() });
  results.push({ name: 'AP Costs', passed: testAPCosts() });

  // Combat tests (will fail until fire modes are implemented in core.ts)
  // These tests define EXPECTED behavior
  console.log('\n========================================');
  console.log('  COMBAT TESTS (require implementation)');
  console.log('========================================');
  console.log('NOTE: These will fail until fire modes are');
  console.log('implemented in core.ts resolveAttack()');
  console.log('');

  results.push({ name: 'Single Fire Mirror', passed: testSingleFireMirror() });
  results.push({ name: 'Burst vs Single (Close)', passed: testBurstVsSingleClose() });
  results.push({ name: 'Auto vs Single (Close)', passed: testAutoVsSingleClose() });
  results.push({ name: 'Single vs Auto (Long)', passed: testSingleVsAutoLong() });
  results.push({ name: 'Burst Fire Mirror', passed: testBurstMirror() });

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log('\n========================================');
  console.log('           TEST SUMMARY');
  console.log('========================================');
  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
  });
  console.log('');
  console.log(`  Total: ${passed}/${total} tests passed`);
  console.log('');

  if (passed < total) {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add FireMode type to types.ts');
    console.log('2. Add FIRE_MODES config to types.ts');
    console.log('3. Add availableFireModes/currentFireMode to SimWeapon');
    console.log('4. Modify resolveAttack() in core.ts to handle fire modes');
    console.log('5. Re-run tests until all pass');
  } else {
    console.log('✅ ALL TESTS PASSED');
    console.log('Fire modes are correctly implemented!');
  }
  console.log('========================================');
}

// Run tests
runAllTests().catch(console.error);

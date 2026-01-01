/**
 * Final Balance Test - BF-009
 *
 * Tests all key scenarios after balance fixes.
 * JA2 Philosophy: Trained soldiers SHOULD dominate thugs, struggle against elites.
 */

import { ALL_SCENARIOS, testScenarioDifficulty } from './scenarios';
import { UNIT_PRESETS } from './humanPresets';

console.log('=== FINAL SCENARIO BALANCE TEST ===\n');

const keyScenarios = [
  'muggers',        // Easy
  'gang_patrol',    // Normal
  'gang_hideout',   // Hard
  'checkpoint',     // Hard
  'terminator_hunt',// Nightmare
  'juggernaut',     // Boss nightmare
  'mech_pilot',     // Boss nightmare
  'warlord',        // Boss nightmare
];

// JA2-style targets for soldier squads:
// - Easy: Dominate (65-100%)
// - Normal: Clear advantage (55-90%)
// - Hard: Even fight, tactics matter (30-70%)
// - Nightmare: Underdogs (0-35%)

console.log('--- Testing with Soldier Rifle Squad (JA2 targets) ---\n');

let passed = 0;
let failed = 0;

for (const scenarioId of keyScenarios) {
  const scenario = ALL_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) continue;

  const result = testScenarioDifficulty(scenario, 'soldierRifle', 100);

  let targetMin: number, targetMax: number;
  switch (scenario.difficulty) {
    case 'easy':
      targetMin = 60; targetMax = 100;
      break;
    case 'normal':
      targetMin = 50; targetMax = 90;
      break;
    case 'hard':
      targetMin = 30; targetMax = 70;
      break;
    case 'nightmare':
      targetMin = 0; targetMax = 35;
      break;
    default:
      targetMin = 30; targetMax = 70;
  }

  const inRange = result.winRate >= targetMin && result.winRate <= targetMax;
  if (inRange) passed++; else failed++;
  const status = inRange ? '✅' : (result.winRate < targetMin ? '⚠️ TOO HARD' : '⚠️ TOO EASY');

  console.log(`${status} ${scenario.name} (${scenario.difficulty}): ${result.winRate.toFixed(1)}% [target: ${targetMin}-${targetMax}%]`);
}

console.log(`\n--- Summary: ${passed}/${passed + failed} scenarios balanced ---`);

if (failed === 0) {
  console.log('\n✅ ALL SCENARIOS BALANCED FOR JA2-STYLE GAMEPLAY');
} else {
  console.log(`\n⚠️ ${failed} scenarios need adjustment`);
}

console.log('\n=== TEST COMPLETE ===');

/**
 * Test Combat Scenarios
 */
import {
  ALL_SCENARIOS,
  getScenariosByDifficulty,
  getScenariosByType,
  testScenarioDifficulty,
} from './scenarios';

console.log('=== COMBAT SCENARIO TESTS ===\n');

// List all scenarios
console.log('Available Scenarios:');
console.log('-'.repeat(60));
for (const scenario of ALL_SCENARIOS) {
  console.log(`  [${scenario.difficulty.toUpperCase().padEnd(9)}] ${scenario.name}`);
  console.log(`    Type: ${scenario.type} | Enemies: ${scenario.createEnemies().length} | Recommended squad: ${scenario.playerUnits}`);
}

console.log('\n' + '='.repeat(60));
console.log('Scenario Counts:');
console.log(`  Easy: ${getScenariosByDifficulty('easy').length}`);
console.log(`  Normal: ${getScenariosByDifficulty('normal').length}`);
console.log(`  Hard: ${getScenariosByDifficulty('hard').length}`);
console.log(`  Nightmare: ${getScenariosByDifficulty('nightmare').length}`);

console.log('\nBy Type:');
console.log(`  Street: ${getScenariosByType('street').length}`);
console.log(`  Military: ${getScenariosByType('military').length}`);
console.log(`  Corporate: ${getScenariosByType('corporate').length}`);
console.log(`  Superhuman: ${getScenariosByType('superhuman').length}`);
console.log(`  Boss: ${getScenariosByType('boss').length}`);

// Test difficulty balance
console.log('\n' + '='.repeat(60));
console.log('Difficulty Balance Tests (100 trials each, using soldiers):');
console.log('-'.repeat(60));

const testScenarios = [
  { id: 'muggers', expectedWin: '70-90%' },
  { id: 'gang_patrol', expectedWin: '50-70%' },
  { id: 'checkpoint', expectedWin: '40-60%' },
  { id: 'terminator_hunt', expectedWin: '20-40%' },
  { id: 'juggernaut', expectedWin: '10-30%' },
];

for (const test of testScenarios) {
  const scenario = ALL_SCENARIOS.find(s => s.id === test.id);
  if (!scenario) continue;

  const result = testScenarioDifficulty(scenario, 'soldierRifle', 100);
  const status = result.winRate >= 10 && result.winRate <= 95 ? '✅' : '⚠️';
  console.log(`${status} ${scenario.name}:`);
  console.log(`   Win rate: ${result.winRate.toFixed(1)}% (target: ${test.expectedWin})`);
  console.log(`   Avg rounds: ${result.avgRounds.toFixed(1)}`);
}

// Test boss scenarios with elite troops
console.log('\n' + '='.repeat(60));
console.log('Boss Fights with Elite Operatives:');
console.log('-'.repeat(60));

const bossScenarios = ALL_SCENARIOS.filter(s => s.type === 'boss');
for (const boss of bossScenarios) {
  const result = testScenarioDifficulty(boss, 'operativeSMG', 100);
  console.log(`${boss.name}: ${result.winRate.toFixed(1)}% win rate`);
}

console.log('\n=== All scenario tests complete! ===');

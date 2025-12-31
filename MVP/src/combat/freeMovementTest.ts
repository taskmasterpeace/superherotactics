/**
 * Free Movement / Exploration Phase Tests
 * Run: npx tsx src/combat/freeMovementTest.ts
 *
 * TDD Approach: Tests written FIRST to define expected behavior.
 *
 * Combat Phase System:
 * - exploration: Free movement (0 AP cost), no turn order
 * - combat: Standard turn-based combat (movement costs AP)
 * - Combat triggers when enemy is spotted (line of sight)
 */

import {
  SimUnit,
  CombatPhase,
  PhaseConfig,
  PHASE_CONFIGS,
} from './types';

import {
  getMovementCostByPhase,
  canSeeEnemyByRange,
  checkCombatTrigger,
} from './core';

import { createUnit, UNIT_PRESETS } from './humanPresets';

// Re-export types for backwards compatibility
export { CombatPhase, PhaseConfig, PHASE_CONFIGS } from './types';

// ============ HELPER FUNCTIONS ============

// These are now imported from core.ts:
// - getMovementCostByPhase (was getMovementCost)
// - canSeeEnemyByRange (was canSeeEnemy)
// - checkCombatTrigger (was simulateMove)

/**
 * Wrapper for backwards compatibility with tests.
 */
function getMovementCost(distance: number, phase: CombatPhase): number {
  return getMovementCostByPhase(distance, phase);
}

/**
 * Wrapper for backwards compatibility with tests.
 */
function canSeeEnemy(unit: SimUnit, enemy: SimUnit, visionRange: number = 15): boolean {
  return canSeeEnemyByRange(unit, enemy, visionRange);
}

/**
 * Wrapper for backwards compatibility with tests.
 */
function simulateMove(
  unit: SimUnit,
  newPosition: { x: number; y: number },
  enemies: SimUnit[],
  currentPhase: CombatPhase,
  visionRange: number = 15
): { newPhase: CombatPhase; apCost: number; triggered: boolean } {
  return checkCombatTrigger(unit, newPosition, enemies, currentPhase, visionRange);
}

// ============ TEST FUNCTIONS ============

/**
 * TEST 1: Phase configs exist
 * Verifies PHASE_CONFIGS has correct values.
 */
function testPhaseConfigs(): boolean {
  console.log('\n--- TEST 1: Phase Configs ---');

  const explorationOK =
    PHASE_CONFIGS.exploration.movementCostMultiplier === 0 &&
    PHASE_CONFIGS.exploration.turnOrder === false &&
    PHASE_CONFIGS.exploration.enemiesVisible === false;

  const combatOK =
    PHASE_CONFIGS.combat.movementCostMultiplier === 1 &&
    PHASE_CONFIGS.combat.turnOrder === true &&
    PHASE_CONFIGS.combat.enemiesVisible === true;

  const pass = explorationOK && combatOK;

  console.log(`  Exploration config: ${explorationOK ? '✅' : '❌'}`);
  console.log(`  Combat config: ${combatOK ? '✅' : '❌'}`);
  console.log(`Phase Configs: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 2: Free movement in exploration (0 AP)
 * Moving 5 tiles in exploration should cost 0 AP.
 */
function testFreeMovementExploration(): boolean {
  console.log('\n--- TEST 2: Free Movement (Exploration) ---');

  const cost5Tiles = getMovementCost(5, 'exploration');
  const cost10Tiles = getMovementCost(10, 'exploration');
  const cost1Tile = getMovementCost(1, 'exploration');

  const pass = cost5Tiles === 0 && cost10Tiles === 0 && cost1Tile === 0;

  console.log(`  5 tiles: ${cost5Tiles} AP (expected: 0) ${cost5Tiles === 0 ? '✅' : '❌'}`);
  console.log(`  10 tiles: ${cost10Tiles} AP (expected: 0) ${cost10Tiles === 0 ? '✅' : '❌'}`);
  console.log(`  1 tile: ${cost1Tile} AP (expected: 0) ${cost1Tile === 0 ? '✅' : '❌'}`);
  console.log(`Free Movement: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 3: Movement costs AP in combat
 * Moving in combat should cost AP based on distance.
 */
function testCombatMovementCost(): boolean {
  console.log('\n--- TEST 3: Combat Movement Cost ---');

  const cost1Tile = getMovementCost(1, 'combat');
  const cost5Tiles = getMovementCost(5, 'combat');
  const cost3Point5Tiles = getMovementCost(3.5, 'combat');

  const pass = cost1Tile === 1 && cost5Tiles === 5 && cost3Point5Tiles === 4;

  console.log(`  1 tile: ${cost1Tile} AP (expected: 1) ${cost1Tile === 1 ? '✅' : '❌'}`);
  console.log(`  5 tiles: ${cost5Tiles} AP (expected: 5) ${cost5Tiles === 5 ? '✅' : '❌'}`);
  console.log(`  3.5 tiles: ${cost3Point5Tiles} AP (expected: 4 ceil) ${cost3Point5Tiles === 4 ? '✅' : '❌'}`);
  console.log(`Combat Movement Cost: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 4: Combat triggers on enemy sight
 * Moving into line of sight of enemy should trigger combat.
 */
function testCombatTriggerOnSight(): boolean {
  console.log('\n--- TEST 4: Combat Trigger on Sight ---');

  const unit = createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'Scout');
  unit.position = { x: 0, y: 5 };

  const enemy = createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard');
  enemy.position = { x: 20, y: 5 }; // 20 tiles away

  // Move to position 5 tiles from enemy (15 tiles forward)
  // Vision range is 15, so enemy should be visible at distance 5
  const result = simulateMove(
    unit,
    { x: 15, y: 5 }, // Now 5 tiles from enemy
    [enemy],
    'exploration',
    15
  );

  const triggeredCorrectly = result.triggered === true;
  const phaseChanged = result.newPhase === 'combat';
  const noAPCost = result.apCost === 0; // Still free during exploration move

  const pass = triggeredCorrectly && phaseChanged && noAPCost;

  console.log(`  Combat triggered: ${triggeredCorrectly ? '✅' : '❌'}`);
  console.log(`  Phase changed to combat: ${phaseChanged ? '✅' : '❌'}`);
  console.log(`  Movement was free: ${noAPCost ? '✅' : '❌'} (AP: ${result.apCost})`);
  console.log(`Combat Trigger: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 5: No trigger when enemy not visible
 * Moving but staying out of sight should NOT trigger combat.
 */
function testNoTriggerOutOfSight(): boolean {
  console.log('\n--- TEST 5: No Trigger Out of Sight ---');

  const unit = createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'Scout');
  unit.position = { x: 0, y: 5 };

  const enemy = createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard');
  enemy.position = { x: 40, y: 5 }; // 40 tiles away

  // Move forward 5 tiles (still 35 tiles from enemy, beyond 15 tile vision)
  const result = simulateMove(
    unit,
    { x: 5, y: 5 },
    [enemy],
    'exploration',
    15
  );

  const notTriggered = result.triggered === false;
  const stayedExploration = result.newPhase === 'exploration';

  const pass = notTriggered && stayedExploration;

  console.log(`  Combat NOT triggered: ${notTriggered ? '✅' : '❌'}`);
  console.log(`  Phase stayed exploration: ${stayedExploration ? '✅' : '❌'}`);
  console.log(`No Trigger Out of Sight: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 6: Multiple enemies - trigger on any visible
 * If any enemy is in sight, combat triggers.
 */
function testMultipleEnemyTrigger(): boolean {
  console.log('\n--- TEST 6: Multiple Enemies Trigger ---');

  const unit = createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'Scout');
  unit.position = { x: 0, y: 5 };

  const enemies = [
    createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard1'),
    createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard2'),
    createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard3'),
  ];
  enemies[0].position = { x: 50, y: 5 };  // Far away
  enemies[1].position = { x: 12, y: 5 };  // Close - will be seen
  enemies[2].position = { x: 50, y: 10 }; // Far away

  // Move to x=5, now 7 tiles from Guard2 (visible at 15 range)
  const result = simulateMove(
    unit,
    { x: 5, y: 5 },
    enemies,
    'exploration',
    15
  );

  const triggered = result.triggered === true;
  const combatPhase = result.newPhase === 'combat';

  const pass = triggered && combatPhase;

  console.log(`  Triggered by nearby enemy: ${triggered ? '✅' : '❌'}`);
  console.log(`  Phase is combat: ${combatPhase ? '✅' : '❌'}`);
  console.log(`Multiple Enemies: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 7: Vision range affects trigger distance
 * Different vision ranges should affect when combat triggers.
 */
function testVisionRangeAffectsTrigger(): boolean {
  console.log('\n--- TEST 7: Vision Range ---');

  const unit = createUnit(UNIT_PRESETS.soldierRifle, 'blue', 'Scout');
  unit.position = { x: 0, y: 5 };

  const enemy = createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard');
  enemy.position = { x: 12, y: 5 }; // 12 tiles away from origin

  // Move to x=2 (now 10 tiles from enemy)
  const newPos = { x: 2, y: 5 };

  // With vision 15, should trigger (10 < 15)
  const result15 = simulateMove(unit, newPos, [enemy], 'exploration', 15);
  // With vision 8, should NOT trigger (10 > 8)
  const result8 = simulateMove(unit, newPos, [enemy], 'exploration', 8);

  const vision15Triggers = result15.triggered === true;
  const vision8NoTrigger = result8.triggered === false;

  const pass = vision15Triggers && vision8NoTrigger;

  console.log(`  Vision 15, distance 10: triggers=${result15.triggered} ${vision15Triggers ? '✅' : '❌'}`);
  console.log(`  Vision 8, distance 10: triggers=${result8.triggered} ${vision8NoTrigger ? '✅' : '❌'}`);
  console.log(`Vision Range: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

// ============ MAIN TEST RUNNER ============

async function runAllTests(): Promise<void> {
  console.log('========================================');
  console.log('    FREE MOVEMENT TEST SUITE');
  console.log('========================================');
  console.log('Run: npx tsx src/combat/freeMovementTest.ts');
  console.log('');

  const results: { name: string; passed: boolean }[] = [];

  // Phase config tests
  results.push({ name: 'Phase Configs', passed: testPhaseConfigs() });
  results.push({ name: 'Free Movement (Exploration)', passed: testFreeMovementExploration() });
  results.push({ name: 'Combat Movement Cost', passed: testCombatMovementCost() });

  // Combat trigger tests
  console.log('\n========================================');
  console.log('  COMBAT TRIGGER TESTS');
  console.log('========================================');

  results.push({ name: 'Combat Trigger on Sight', passed: testCombatTriggerOnSight() });
  results.push({ name: 'No Trigger Out of Sight', passed: testNoTriggerOutOfSight() });
  results.push({ name: 'Multiple Enemies Trigger', passed: testMultipleEnemyTrigger() });
  results.push({ name: 'Vision Range', passed: testVisionRangeAffectsTrigger() });

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
    console.log('1. Add CombatPhase to types.ts');
    console.log('2. Add PHASE_CONFIGS to types.ts');
    console.log('3. Implement getMovementCost() in core.ts');
    console.log('4. Add combat phase state to BattleState');
    console.log('5. Re-run tests until all pass');
  } else {
    console.log('✅ ALL TESTS PASSED');
    console.log('Free movement system is correctly implemented!');
  }
  console.log('========================================');
}

// Run tests
runAllTests().catch(console.error);

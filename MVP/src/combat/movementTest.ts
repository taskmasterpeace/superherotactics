/**
 * Movement System Test
 *
 * Tests the XCOM-style 2-action movement system.
 */

import { getMaxSpeed, getMovementRange, getDashRange } from './core';
import { SimUnit } from './types';

// Create a minimal unit for testing movement
function createTestUnit(agl: number): SimUnit {
  return {
    id: 'test',
    name: 'Test Unit',
    team: 'blue',
    hp: 60,
    maxHp: 60,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 0,
    stoppingPower: 0,
    origin: 'biological',
    stats: { MEL: 15, AGL: agl, STR: 15, STA: 15 },
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon: { name: 'Fist', damage: 8, accuracy: 85, damageType: 'IMPACT_BLUNT', range: 1, apCost: 2 },
    disarmed: false,
    alive: true,
    acted: false,
  };
}

console.log('=== XCOM-STYLE MOVEMENT SYSTEM TEST ===\n');

console.log('Movement Formula: maxSpeed = 4 + floor((AGL - 10) / 5)');
console.log('Move Range = floor(maxSpeed / 2)');
console.log('Dash Range = maxSpeed\n');

console.log('AGL | Max Speed | Move | Dash | Character Type');
console.log('----|-----------|------|------|---------------');

const testCases = [
  { agl: 10, type: 'Elderly/Frail' },
  { agl: 15, type: 'Soccer Dad' },
  { agl: 20, type: 'Trained Soldier' },
  { agl: 25, type: 'Elite Operative' },
  { agl: 30, type: 'Pro Athlete' },
  { agl: 35, type: 'Olympic Peak' },
  { agl: 40, type: 'Enhanced Human' },
];

for (const { agl, type } of testCases) {
  const unit = createTestUnit(agl);
  const max = getMaxSpeed(unit);
  const move = getMovementRange(unit);
  const dash = getDashRange(unit);

  const aglStr = agl.toString().padStart(2);
  const maxStr = max.toString().padStart(4);
  const moveStr = move.toString().padStart(4);
  const dashStr = dash.toString().padStart(4);

  console.log(` ${aglStr} |    ${maxStr}    | ${moveStr} | ${dashStr} | ${type}`);
}

console.log('\n=== KEY INSIGHTS ===\n');
console.log('1. Move = cautious tactical movement, can still attack after');
console.log('2. Dash = full sprint, uses BOTH actions (no attack)');
console.log('3. Every 5 points of AGL gives +1 max speed');
console.log('4. 1 tile ≈ 2 feet');

console.log('\n=== EXAMPLE TURNS ===\n');
console.log('Trained Soldier (AGL 20, Move 3, Dash 6):');
console.log('  - Move + Attack: Walk 3 tiles, shoot');
console.log('  - Dash: Sprint 6 tiles, no attack');
console.log('  - Overwatch: Skip turn, react to enemy movement');

console.log('\nOlympic Athlete (AGL 35, Move 4, Dash 9):');
console.log('  - Move + Attack: Walk 4 tiles, shoot');
console.log('  - Dash: Sprint 9 tiles, no attack');

console.log('\n=== TEST COMPLETE ===');

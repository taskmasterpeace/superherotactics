/**
 * Debug test to understand boxer mirror match imbalance
 */

import {
  createUnit,
  UNIT_PRESETS,
  runBattle,
  WEAPONS,
} from './index';

console.log('=== BOXER DEBUG ===\n');

// Check boxer stats
console.log('Boxer preset:', JSON.stringify(UNIT_PRESETS.boxer, null, 2));
console.log('\nCross weapon:', JSON.stringify(WEAPONS.cross, null, 2));

// Run a single battle with verbose logging
const blue = [createUnit(UNIT_PRESETS.boxer, 'blue')];
const red = [createUnit(UNIT_PRESETS.boxer, 'red')];

console.log('\n=== RUNNING SINGLE BATTLE ===');
console.log('Blue Boxer HP:', blue[0].hp, 'DR:', blue[0].dr);
console.log('Red Boxer HP:', red[0].hp, 'DR:', red[0].dr);

// Cross: 14 damage, 1 AP, 85% accuracy
// At 4 AP per round: 4 attacks × 14 dmg = 56 damage potential (if all hit)
// At 85% accuracy: 4 × 0.85 × 14 = 47.6 expected damage per round
console.log('\nExpected damage per round: 4 attacks × 14 dmg × 85% = 47.6');
console.log('HP 90, so should die in ~2 rounds');

const result = runBattle(blue, red);
console.log('\nBattle result:', result.winner);
console.log('Rounds:', result.rounds);
console.log('Blue HP remaining:', result.blueDamageDealt);
console.log('Red HP remaining:', result.redDamageDealt);
console.log('Attack log length:', result.log.length);

// Show first few attacks
console.log('\nFirst 10 attacks:');
for (let i = 0; i < Math.min(10, result.log.length); i++) {
  const atk = result.log[i];
  console.log(`${atk.attackerId} → ${atk.targetId}: ${atk.hitResult} for ${atk.finalDamage} dmg`);
}

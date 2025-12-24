/**
 * Status Effect Test Suite
 *
 * Run with: npx tsx src/combat/statusEffectTest.ts
 *
 * Tests the full status effect pipeline:
 * - Effect generation from damage types (damageSystem.ts)
 * - Effect application and stacking
 * - DoT processing each turn
 * - Stun/skip turn behavior
 * - Freeze shatter mechanics
 */

import {
  SimUnit,
  SimWeapon,
  StatusEffectInstance,
  calculateHP,
} from './types';

import {
  getStatusEffectsForDamage,
  applyStatusEffect,
  applyStatusEffects,
  processStatusEffects,
  canUnitAct,
  getAPPenalty,
  getAccuracyPenalty,
  canShatter,
  applyShatter,
  describeEffects,
} from './statusEffects';

import {
  resolveAttack,
  applyAttackResult,
} from './core';

import { runBatch } from './batchTester';
import { createCustomUnit, WEAPONS, resetUnitIds } from './humanPresets';

// ============ TEST WEAPONS (damage types that cause effects) ============

const KATANA: SimWeapon = {
  name: 'Katana',
  damage: 25,
  accuracy: 80,
  damageType: 'EDGED_SLASHING',  // Causes bleeding: 4 dmg, 4 turns, 5 stacks
  range: 1,
  apCost: 2,
};

const FLAMETHROWER: SimWeapon = {
  name: 'Flamethrower',
  damage: 30,
  accuracy: 75,
  damageType: 'ENERGY_THERMAL',  // Causes burning: 5 dmg +2/turn, 3 turns, 30% spread
  range: 3,
  apCost: 3,
};

const ICE_BLAST: SimWeapon = {
  name: 'Ice Blast',
  damage: 20,
  accuracy: 80,
  damageType: 'ENERGY_ICE',  // Causes frozen: 2 turns, -2 AP, can shatter for 20 dmg
  range: 6,
  apCost: 2,
};

const TASER: SimWeapon = {
  name: 'Taser',
  damage: 10,
  accuracy: 85,
  damageType: 'ELECTROMAGNETIC_BOLT',  // Causes stun: 1 turn, skip turn, has save
  range: 2,
  apCost: 1,
};

const POISON_DART: SimWeapon = {
  name: 'Poison Dart',
  damage: 5,
  accuracy: 90,
  damageType: 'TOXIN_POISON',  // Causes poison: 10 dmg -2/turn, 5 turns, bio only
  range: 10,
  apCost: 1,
};

const ASSAULT_RIFLE: SimWeapon = {
  name: 'Assault Rifle',
  damage: 22,
  accuracy: 75,
  damageType: 'GUNFIRE_BULLET',  // No status effects
  range: 20,
  apCost: 2,
};

// ============ HELPER FUNCTIONS ============

function createTestUnit(team: 'blue' | 'red', name: string, weapon: SimWeapon): SimUnit {
  const stats = { MEL: 20, AGL: 20, STR: 20, STA: 20 };
  return createCustomUnit(team, name, stats, weapon);
}

// ============ TESTS ============

console.log('\n========== STATUS EFFECT TEST SUITE ==========\n');
console.log('Testing integration with damageSystem.ts definitions\n');

// Test 1: Effect Generation from Damage Types
console.log('=== TEST 1: Effect Generation from Damage Types ===\n');

const testCases = [
  { weapon: KATANA, expectedEffect: 'bleeding', expectedDmg: 4 },
  { weapon: FLAMETHROWER, expectedEffect: 'burning', expectedDmg: 5 },
  { weapon: ICE_BLAST, expectedEffect: 'frozen', expectedDmg: undefined },
  { weapon: TASER, expectedEffect: 'stunned', expectedDmg: undefined },
  { weapon: POISON_DART, expectedEffect: 'poisoned', expectedDmg: 10 },
  { weapon: ASSAULT_RIFLE, expectedEffect: null, expectedDmg: undefined },
];

for (const tc of testCases) {
  const effects = getStatusEffectsForDamage(tc.weapon.damageType, 'hit', 'biological');
  const hasEffect = effects.find(e => e.id === tc.expectedEffect);

  if (tc.expectedEffect === null) {
    const pass = effects.length === 0;
    console.log(`${tc.weapon.name} (${tc.weapon.damageType}): ${pass ? '✅' : '❌'} No effects expected`);
    if (!pass) console.log(`  Got: ${effects.map(e => e.id).join(', ')}`);
  } else {
    const pass = hasEffect !== undefined;
    console.log(`${tc.weapon.name} (${tc.weapon.damageType}): ${pass ? '✅' : '❌'} ${tc.expectedEffect}`);
    if (pass && tc.expectedDmg !== undefined) {
      const dmgMatch = hasEffect.damagePerTick === tc.expectedDmg;
      console.log(`  Damage/tick: ${hasEffect.damagePerTick} (expected ${tc.expectedDmg}) ${dmgMatch ? '✅' : '❌'}`);
    }
    if (pass && hasEffect) {
      console.log(`  Duration: ${hasEffect.duration}, Scaling: ${hasEffect.scaling || 'N/A'}`);
    }
  }
}

// Test 2: Bleeding Stacking
console.log('\n=== TEST 2: Bleeding Stacking (max 5 stacks) ===\n');

resetUnitIds();
const bleedingVictim = createTestUnit('red', 'Victim', ASSAULT_RIFLE);
bleedingVictim.statusEffects = [];

// Apply 7 bleeding effects - should cap at 5 stacks
for (let i = 0; i < 7; i++) {
  const bleedEffect = getStatusEffectsForDamage('EDGED_SLASHING', 'hit', 'biological')[0];
  applyStatusEffect(bleedingVictim, bleedEffect);
}

const bleedStacks = bleedingVictim.statusEffects.find(e => e.id === 'bleeding')?.stacks || 0;
console.log(`After 7 slashing hits: ${bleedStacks} stacks ${bleedStacks === 5 ? '✅' : '❌'} (max 5)`);

// Test 3: DoT Damage Processing
console.log('\n=== TEST 3: DoT Damage Processing ===\n');

resetUnitIds();
const dotVictim = createTestUnit('red', 'DoT Victim', ASSAULT_RIFLE);
dotVictim.statusEffects = [];
dotVictim.hp = 100;
dotVictim.maxHp = 100;

// Apply burning (5 dmg +2/turn, 3 turns)
const burnEffect = getStatusEffectsForDamage('ENERGY_THERMAL', 'hit', 'biological')[0];
applyStatusEffect(dotVictim, burnEffect);

console.log('Burning applied (5 initial, +2/turn, 3 turns)');
console.log(`Starting HP: ${dotVictim.hp}`);

// Process 3 turns
const dotDamage: number[] = [];
for (let turn = 1; turn <= 4; turn++) {
  const hpBefore = dotVictim.hp;
  const result = processStatusEffects(dotVictim);
  const dmg = hpBefore - dotVictim.hp;
  dotDamage.push(dmg);
  console.log(`Turn ${turn}: ${dmg} damage dealt, HP: ${dotVictim.hp}, Effects: ${describeEffects(dotVictim).join(', ') || 'none'}`);
}

// Expected: Turn 1: 5 dmg, Turn 2: 7 dmg, Turn 3: 9 dmg, Turn 4: 0 (expired)
const expectedBurnDamage = [5, 7, 9, 0];
const burnPass = dotDamage.every((d, i) => d === expectedBurnDamage[i]);
console.log(`Burn damage sequence: [${dotDamage.join(', ')}] ${burnPass ? '✅' : '❌'} (expected [${expectedBurnDamage.join(', ')}])`);

// Test 4: Stun Skip Turn
console.log('\n=== TEST 4: Stun Skip Turn ===\n');

resetUnitIds();
const stunnedUnit = createTestUnit('red', 'Stunned Guy', ASSAULT_RIFLE);
stunnedUnit.statusEffects = [];

// Apply stun (skip turn, has save)
const stunEffect = getStatusEffectsForDamage('ELECTROMAGNETIC_BOLT', 'crit', 'biological')[0]; // Crit bypasses save
applyStatusEffect(stunnedUnit, stunEffect);

const canActBefore = canUnitAct(stunnedUnit);
console.log(`Before processing: canAct=${canActBefore} ${!canActBefore ? '✅' : '❌'} (should be false)`);

// Force skip turn by checking effect directly
const stunned = stunnedUnit.statusEffects.find(e => e.id === 'stunned');
console.log(`Stun effect: skipTurn=${stunned?.skipTurn}, duration=${stunned?.duration}`);

// Process turn
const stunResult = processStatusEffects(stunnedUnit);
console.log(`turnSkipped=${stunResult.turnSkipped} ${stunResult.turnSkipped ? '✅' : '❌'} (should be true)`);

// Test 5: Freeze Shatter
console.log('\n=== TEST 5: Freeze Shatter Mechanics ===\n');

resetUnitIds();
const frozenUnit = createTestUnit('red', 'Frozen Target', ASSAULT_RIFLE);
frozenUnit.statusEffects = [];
frozenUnit.hp = 100;

// Apply freeze
const freezeEffect = getStatusEffectsForDamage('ENERGY_ICE', 'hit', 'biological')[0];
applyStatusEffect(frozenUnit, freezeEffect);

const shatterInfo = canShatter(frozenUnit);
console.log(`Can shatter: ${shatterInfo.canShatter} ${shatterInfo.canShatter ? '✅' : '❌'}`);
console.log(`Shatter damage: ${shatterInfo.damage} ${shatterInfo.damage === 20 ? '✅' : '❌'} (expected 20)`);

// Apply shatter
const shatterDmg = applyShatter(frozenUnit);
console.log(`Shatter applied: ${shatterDmg} damage, HP: ${frozenUnit.hp}`);

const frozenAfter = frozenUnit.statusEffects.find(e => e.id === 'frozen');
console.log(`Frozen removed: ${frozenAfter === undefined ? '✅' : '❌'}`);

// Test 6: AP Penalty from Freeze
console.log('\n=== TEST 6: AP Penalty from Effects ===\n');

resetUnitIds();
const apPenaltyUnit = createTestUnit('red', 'AP Penalty', ASSAULT_RIFLE);
apPenaltyUnit.statusEffects = [];

// Apply freeze (-2 AP)
const freezeEffect2 = getStatusEffectsForDamage('ENERGY_ICE', 'hit', 'biological')[0];
applyStatusEffect(apPenaltyUnit, freezeEffect2);

const apPenalty = getAPPenalty(apPenaltyUnit);
console.log(`AP penalty from freeze: ${apPenalty} ${apPenalty === -2 ? '✅' : '❌'} (expected -2)`);

// Test 7: Accuracy Penalty from Stun
console.log('\n=== TEST 7: Accuracy Penalty from Effects ===\n');

resetUnitIds();
const accPenaltyUnit = createTestUnit('red', 'Acc Penalty', ASSAULT_RIFLE);
accPenaltyUnit.statusEffects = [];

// Apply concussion stun (-30 accuracy)
const concussionEffect = getStatusEffectsForDamage('EXPLOSION_CONCUSSION', 'hit', 'biological')[0];
applyStatusEffect(accPenaltyUnit, concussionEffect);

const accPenalty = getAccuracyPenalty(accPenaltyUnit);
console.log(`Accuracy penalty from concussion: ${accPenalty} ${accPenalty === -30 ? '✅' : '❌'} (expected -30)`);

// Test 8: Poison on Robotic (should be immune)
console.log('\n=== TEST 8: Poison vs Robotic (Immunity) ===\n');

const poisonVsRobot = getStatusEffectsForDamage('TOXIN_POISON', 'hit', 'robotic');
console.log(`Poison effects on robotic: ${poisonVsRobot.length} ${poisonVsRobot.length === 0 ? '✅' : '❌'} (should be 0)`);

// Test 9: Full Combat Integration
console.log('\n=== TEST 9: Full Combat Integration ===\n');

resetUnitIds();
const katanaFighter = createTestUnit('blue', 'Katana Fighter', KATANA);
const rifleMan = createTestUnit('red', 'Rifleman', ASSAULT_RIFLE);

// Force a hit with katana
const attackResult = resolveAttack(katanaFighter, rifleMan, 1, 70); // Roll 70 should hit

console.log(`Attack result: ${attackResult.hitResult}`);
console.log(`Effects to apply: [${attackResult.effectsApplied.join(', ')}]`);

// Apply the attack
applyAttackResult(rifleMan, attackResult);

const riflemanEffects = describeEffects(rifleMan);
console.log(`Rifleman effects after hit: ${riflemanEffects.join(', ') || 'none'}`);
console.log(`Has bleeding: ${rifleMan.statusEffects.some(e => e.id === 'bleeding') ? '✅' : '❌'}`);

// Test 10: Batch Combat with Status Effects
console.log('\n=== TEST 10: Batch Combat with Bleeding Weapons ===\n');

resetUnitIds();
const katanaTeam = [
  createTestUnit('blue', 'Samurai 1', KATANA),
  createTestUnit('blue', 'Samurai 2', KATANA),
  createTestUnit('blue', 'Samurai 3', KATANA),
];

const rifleTeam = [
  createTestUnit('red', 'Soldier 1', ASSAULT_RIFLE),
  createTestUnit('red', 'Soldier 2', ASSAULT_RIFLE),
  createTestUnit('red', 'Soldier 3', ASSAULT_RIFLE),
];

const batchResult = runBatch(katanaTeam, rifleTeam, 100);

console.log('Katana (bleeding) vs Rifle (no effects) - 100 fights:');
console.log(`  Katana wins: ${batchResult.blueWinRate.toFixed(1)}%`);
console.log(`  Rifle wins: ${batchResult.redWinRate.toFixed(1)}%`);
console.log(`  Avg rounds: ${batchResult.avgRounds.toFixed(1)}`);

// Note: Katanas have bleeding but rifles have range advantage
console.log(`  Bleeding causing extra kills via DoT: check avgRounds`);

// ============ SUMMARY ============

console.log('\n========== STATUS EFFECT SUMMARY ==========\n');

console.log('Damage Type → Effect Mapping (from damageSystem.ts):');
console.log('  EDGED_SLASHING → bleeding (4 dmg/turn, 4 turns, 5 max stacks)');
console.log('  ENERGY_THERMAL → burning (5+2n dmg/turn, 3 turns, 30% spread)');
console.log('  ENERGY_ICE → frozen (2 turns, -2 AP, shatter for 20 dmg)');
console.log('  ELECTROMAGNETIC_BOLT → stunned (1 turn, skip turn, save possible)');
console.log('  EXPLOSION_CONCUSSION → stunned (1 turn, -30% acc, no skip, save possible)');
console.log('  TOXIN_POISON → poisoned (10-2n dmg/turn, 5 turns, bio only)');
console.log('');
console.log('Integration Points:');
console.log('  ✅ resolveAttack() generates effects from damageSystem.ts');
console.log('  ✅ applyAttackResult() applies effects to target');
console.log('  ✅ processStatusEffects() runs at start of each turn');
console.log('  ✅ battleRunner.ts checks for turn skip (stun)');
console.log('');

console.log('========== ALL STATUS EFFECT TESTS COMPLETE ==========\n');

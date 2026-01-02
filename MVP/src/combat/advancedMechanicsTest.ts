/**
 * Test for Advanced Combat Mechanics
 */
import { createUnit, UNIT_PRESETS, resetUnitIds } from './humanPresets';
import {
  resolveBurstFire,
  resolveAimedShot,
  setOverwatch,
  resolveOverwatchShot,
  attemptSuppression,
  ATTACK_MODES,
  BODY_PARTS,
} from './advancedMechanics';

console.log('=== ADVANCED COMBAT MECHANICS TEST ===\n');

// Create test units
resetUnitIds();
const soldier = createUnit(UNIT_PRESETS.soldierRifle, 'blue');
const target = createUnit(UNIT_PRESETS.thug, 'red');

console.log('Attack Modes Available:');
for (const [mode, config] of Object.entries(ATTACK_MODES)) {
  console.log(`  ${mode}: ${config.description}`);
  console.log(`    AP: ${config.apMultiplier}x, Acc: ${config.accuracyMod >= 0 ? '+' : ''}${config.accuracyMod}%, Dmg: ${config.damageMultiplier}x, Shots: ${config.shots}`);
}

console.log('\nBody Part Targets:');
for (const [part, config] of Object.entries(BODY_PARTS)) {
  console.log(`  ${part}: ${config.effect}`);
  console.log(`    Acc: ${config.accuracyPenalty}%, Dmg: ${config.damageMultiplier}x`);
}

// Test burst fire
console.log('\n--- BURST FIRE TEST ---');
resetUnitIds();
const burstAttacker = createUnit(UNIT_PRESETS.operativeSMG, 'blue');
const burstTarget = createUnit(UNIT_PRESETS.thug, 'red');

let burstHits = 0;
let burstDamage = 0;
const burstTrials = 100;
for (let i = 0; i < burstTrials; i++) {
  resetUnitIds();
  const a = createUnit(UNIT_PRESETS.operativeSMG, 'blue');
  const t = createUnit(UNIT_PRESETS.thug, 'red');
  const result = resolveBurstFire(a, t);
  burstHits += result.hitsLanded;
  burstDamage += result.totalDamage;
}
console.log(`Burst Fire (100 trials, 3 shots each):`);
console.log(`  Avg hits per burst: ${(burstHits / burstTrials).toFixed(1)} / 3`);
console.log(`  Avg damage per burst: ${(burstDamage / burstTrials).toFixed(1)}`);
console.log(`  AP cost: ${Math.ceil(UNIT_PRESETS.operativeSMG.weapon.apCost * 1.5)}`);

// Test aimed shots
console.log('\n--- AIMED SHOT TEST ---');
let headHits = 0;
let headDamage = 0;
let torsoHits = 0;
let torsoDamage = 0;
const aimedTrials = 100;

for (let i = 0; i < aimedTrials; i++) {
  resetUnitIds();
  const sniper = createUnit(UNIT_PRESETS.operativeSniper, 'blue');
  const victim = createUnit(UNIT_PRESETS.gangEnforcer, 'red');

  const headShot = resolveAimedShot(sniper, victim, 'head');
  if (headShot.hitResult !== 'miss') headHits++;
  headDamage += headShot.finalDamage;

  resetUnitIds();
  const sniper2 = createUnit(UNIT_PRESETS.operativeSniper, 'blue');
  const victim2 = createUnit(UNIT_PRESETS.gangEnforcer, 'red');

  const torsoShot = resolveAimedShot(sniper2, victim2, 'torso');
  if (torsoShot.hitResult !== 'miss') torsoHits++;
  torsoDamage += torsoShot.finalDamage;
}
console.log(`Aimed Shots (100 trials each):`);
console.log(`  Head: ${headHits}% hit, ${(headDamage / aimedTrials).toFixed(1)} avg damage`);
console.log(`  Torso: ${torsoHits}% hit, ${(torsoDamage / aimedTrials).toFixed(1)} avg damage`);
console.log(`  AP cost: ${Math.ceil(UNIT_PRESETS.operativeSniper.weapon.apCost * 2)}`);

// Test overwatch
console.log('\n--- OVERWATCH TEST ---');
resetUnitIds();
const overwatcher = createUnit(UNIT_PRESETS.soldierRifle, 'blue');
const mover = createUnit(UNIT_PRESETS.thug, 'red');

const owState = setOverwatch(overwatcher, 4);
console.log(`Overwatch set: ${owState.shotsRemaining} shots reserved, ${owState.accuracyMod}% accuracy mod`);

let owHits = 0;
let owDamage = 0;
const owTrials = 100;
for (let i = 0; i < owTrials; i++) {
  resetUnitIds();
  const ow = createUnit(UNIT_PRESETS.soldierRifle, 'blue');
  const m = createUnit(UNIT_PRESETS.thug, 'red');
  const state = setOverwatch(ow, 4);
  const result = resolveOverwatchShot(ow, m, state);
  if (result && result.hitResult !== 'miss') owHits++;
  if (result) owDamage += result.finalDamage;
}
console.log(`Overwatch shots (100 trials):`);
console.log(`  Hit rate: ${owHits}% (vs ~70% for normal shots)`);
console.log(`  Avg damage: ${(owDamage / owTrials).toFixed(1)}`);

// Test suppression
console.log('\n--- SUPPRESSION TEST ---');
let suppressedCount = 0;
const suppTrials = 100;
for (let i = 0; i < suppTrials; i++) {
  resetUnitIds();
  const mg = createUnit(UNIT_PRESETS.heavyGunner, 'blue');
  const victim = createUnit(UNIT_PRESETS.thug, 'red');
  const result = attemptSuppression(mg, victim, 5);
  if (result.suppressed) suppressedCount++;
}
console.log(`Suppression (100 trials, 5 shots each):`);
console.log(`  Suppression rate: ${suppressedCount}%`);
console.log(`  Effect: ${ATTACK_MODES.single.description}`);

console.log('\n=== All advanced mechanics tests complete! ===');

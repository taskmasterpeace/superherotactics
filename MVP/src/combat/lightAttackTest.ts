/**
 * Light Attack System Test
 *
 * Tests the martial arts light attack exception system.
 * Light attacks use 1 action but don't end turn, enabling:
 * - jab + cross combo
 * - knife stab + move away
 * - light pistol shot + reposition
 */

import {
  resetTurnState,
  canPerformAction,
  spendAction,
  isTurnComplete,
} from './core';
import { SimUnit } from './types';
import { WEAPONS } from './humanPresets';

// Create a minimal unit for testing
function createTestUnit(weapon: typeof WEAPONS[keyof typeof WEAPONS]): SimUnit {
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
    stats: { MEL: 25, AGL: 25, STR: 20, STA: 20 },
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon: { ...weapon },
    disarmed: false,
    alive: true,
    acted: false,
  };
}

console.log('=== LIGHT ATTACK SYSTEM TEST ===\n');

// Test 1: Jab (light) + Cross (heavy) combo
console.log('TEST 1: Jab + Cross Combo (Boxer)');
console.log('-----------------------------------');
const boxer = createTestUnit(WEAPONS.jab);
resetTurnState(boxer);

console.log(`Initial state: ${boxer.turnState?.actionsRemaining} actions`);
console.log(`Jab isLightAttack: ${WEAPONS.jab.isLightAttack}`);

// Jab (light attack)
console.log('\n> Performing Jab (light attack)...');
spendAction(boxer, 'attack');
console.log(`After jab: ${boxer.turnState?.actionsRemaining} actions, hasAttacked: ${boxer.turnState?.hasAttacked}`);
console.log(`Turn complete: ${isTurnComplete(boxer)}`);

// Switch to cross for finisher
boxer.weapon = { ...WEAPONS.cross };
console.log(`Cross isLightAttack: ${WEAPONS.cross.isLightAttack ?? false}`);
console.log(`Can attack with cross? ${canPerformAction(boxer, 'attack')}`);

// Cross (heavy attack - ends turn)
if (canPerformAction(boxer, 'attack')) {
  console.log('\n> Performing Cross (heavy attack - finisher)...');
  spendAction(boxer, 'attack');
  console.log(`After cross: ${boxer.turnState?.actionsRemaining} actions`);
  console.log(`Turn complete: ${isTurnComplete(boxer)}`);
}

console.log(boxer.turnState?.actionsRemaining === 0 ? '\n✅ Jab + Cross combo works!' : '\n❌ Combo failed');

// Test 2: Knife (light) + Move
console.log('\n\nTEST 2: Knife Stab + Move Away');
console.log('-------------------------------');
const knifeUser = createTestUnit(WEAPONS.knife);
resetTurnState(knifeUser);

console.log(`Initial state: ${knifeUser.turnState?.actionsRemaining} actions`);
console.log(`Knife isLightAttack: ${WEAPONS.knife.isLightAttack}`);

// Knife stab (light attack)
console.log('\n> Performing knife stab (light attack)...');
spendAction(knifeUser, 'attack');
console.log(`After stab: ${knifeUser.turnState?.actionsRemaining} actions, hasAttacked: ${knifeUser.turnState?.hasAttacked}`);
console.log(`Can move away? ${canPerformAction(knifeUser, 'move')}`);

// Move away
if (canPerformAction(knifeUser, 'move')) {
  console.log('\n> Moving away...');
  spendAction(knifeUser, 'move');
  console.log(`After move: ${knifeUser.turnState?.actionsRemaining} actions`);
  console.log(`Turn complete: ${isTurnComplete(knifeUser)}`);
}

console.log(knifeUser.turnState?.actionsRemaining === 0 ? '\n✅ Knife stab + move works!' : '\n❌ Failed');

// Test 3: Light pistol shot + move
console.log('\n\nTEST 3: Light Pistol Shot + Reposition');
console.log('---------------------------------------');
const gunner = createTestUnit(WEAPONS.lightPistol);
resetTurnState(gunner);

console.log(`Initial state: ${gunner.turnState?.actionsRemaining} actions`);
console.log(`Light Pistol isLightAttack: ${WEAPONS.lightPistol.isLightAttack}`);

// Quick shot (light attack)
console.log('\n> Performing quick shot (light attack)...');
spendAction(gunner, 'attack');
console.log(`After shot: ${gunner.turnState?.actionsRemaining} actions`);
console.log(`Can reposition? ${canPerformAction(gunner, 'move')}`);

// Reposition
if (canPerformAction(gunner, 'move')) {
  console.log('\n> Repositioning...');
  spendAction(gunner, 'move');
  console.log(`After move: ${gunner.turnState?.actionsRemaining} actions`);
}

console.log(gunner.turnState?.actionsRemaining === 0 ? '\n✅ Pistol shot + move works!' : '\n❌ Failed');

// Test 4: Heavy attack ends turn immediately
console.log('\n\nTEST 4: Heavy Attack Ends Turn');
console.log('-------------------------------');
const rifleman = createTestUnit(WEAPONS.assaultRifle);
resetTurnState(rifleman);

console.log(`Initial state: ${rifleman.turnState?.actionsRemaining} actions`);
console.log(`Assault Rifle isLightAttack: ${WEAPONS.assaultRifle.isLightAttack ?? false}`);

// Rifle shot (heavy attack)
console.log('\n> Performing rifle shot (heavy attack)...');
spendAction(rifleman, 'attack');
console.log(`After shot: ${rifleman.turnState?.actionsRemaining} actions`);
console.log(`Turn complete: ${isTurnComplete(rifleman)}`);
console.log(`Can move? ${canPerformAction(rifleman, 'move')}`);

console.log(rifleman.turnState?.actionsRemaining === 0 ? '\n✅ Heavy attack ends turn correctly!' : '\n❌ Failed');

// Test 5: Light + Light allowed (holding back)
console.log('\n\nTEST 5: Jab + Jab (Holding Back Mode)');
console.log('--------------------------------------');
const jabber = createTestUnit(WEAPONS.jab);
resetTurnState(jabber);

console.log(`Initial state: ${jabber.turnState?.actionsRemaining} actions`);
console.log('Scenario: Superhero vs civilian - don\'t want to hurt them too bad');

// First jab
console.log('\n> Performing first jab (3 dmg)...');
spendAction(jabber, 'attack');
console.log(`After first jab: ${jabber.turnState?.actionsRemaining} actions`);

// Second jab (should be allowed now!)
const canSecondJab = canPerformAction(jabber, 'attack');
console.log(`Can do second jab? ${canSecondJab}`);

if (canSecondJab) {
  console.log('\n> Performing second jab (3 dmg)...');
  spendAction(jabber, 'attack');
  console.log(`After second jab: ${jabber.turnState?.actionsRemaining} actions`);
  console.log(`Turn complete: ${isTurnComplete(jabber)}`);
  console.log('\nTotal damage: 6 (vs 17 for jab+cross)');
}

console.log(canSecondJab ? '\n✅ Light + Light works! (Holding back enabled)' : '\n❌ Light + Light blocked');

// Summary
console.log('\n\n=== LIGHT ATTACK SYSTEM SUMMARY ===');
console.log('');
console.log('Light Weapons (can act after):');
console.log(`  - Jab: ${WEAPONS.jab.isLightAttack ? '✅' : '❌'}`);
console.log(`  - Fist: ${WEAPONS.fist.isLightAttack ? '✅' : '❌'}`);
console.log(`  - Knife: ${WEAPONS.knife.isLightAttack ? '✅' : '❌'}`);
console.log(`  - Tonfa: ${WEAPONS.tonfa.isLightAttack ? '✅' : '❌'}`);
console.log(`  - Light Pistol: ${WEAPONS.lightPistol.isLightAttack ? '✅' : '❌'}`);
console.log(`  - Brass Knuckles: ${WEAPONS.brassKnuckles.isLightAttack ? '✅' : '❌'}`);
console.log('');
console.log('Heavy Weapons (end turn immediately):');
console.log(`  - Cross: ${WEAPONS.cross.isLightAttack ? '❌ (should be heavy!)' : '✅ Heavy'}`);
console.log(`  - Hook: ${WEAPONS.hook.isLightAttack ? '❌ (should be heavy!)' : '✅ Heavy'}`);
console.log(`  - Uppercut: ${WEAPONS.uppercut.isLightAttack ? '❌ (should be heavy!)' : '✅ Heavy'}`);
console.log(`  - Kick: ${WEAPONS.kick.isLightAttack ? '❌ (should be heavy!)' : '✅ Heavy'}`);
console.log(`  - Assault Rifle: ${WEAPONS.assaultRifle.isLightAttack ? '❌ (should be heavy!)' : '✅ Heavy'}`);
console.log(`  - Katana: ${WEAPONS.katana.isLightAttack ? '❌ (should be heavy!)' : '✅ Heavy'}`);
console.log('');
console.log('=== TEST COMPLETE ===');

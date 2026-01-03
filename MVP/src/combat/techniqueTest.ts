/**
 * Technique System Verification Test
 *
 * Verifies that martial arts techniques are properly executed in combat.
 */

import { runQuickBattle, runBattle } from './battleRunner';
import { SimUnit } from './types';

// Create a martial artist with submission style (like BJJ)
function createSubmissionFighter(name: string, belt: number): SimUnit {
  return {
    id: `sub_${name}_${Date.now()}`,
    name,
    team: 'blue',
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 0, // No armor
    stoppingPower: 0,
    stats: {
      MEL: 22,
      RNG: 12,
      AGL: 18,
      CON: 18,
      INS: 15,
      WIL: 15,
      INT: 12,
    },
    weapon: {
      name: 'Fists',
      damage: 4,
      range: 1,
      damageType: 'blunt',
    },
    statusEffects: [],
    position: { x: 1, y: 1 },
    facing: 90,
    // Martial arts training - must match ID in martial-arts.json
    martialArtsStyle: 'submission',
    beltLevel: belt,
  };
}

// Create an untrained fighter (lower stats than trained)
function createUntrainedFighter(name: string): SimUnit {
  return {
    id: `untrained_${name}_${Date.now()}`,
    name,
    team: 'red',
    hp: 80,  // Lower HP
    maxHp: 80,
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 0, // No armor
    stoppingPower: 0,
    stats: {
      MEL: 12,  // Much lower - no training
      RNG: 10,
      AGL: 12,  // Lower agility
      CON: 14,
      INS: 10,
      WIL: 10,
      INT: 12,
    },
    weapon: {
      name: 'Fists',
      damage: 3,  // Lower damage - weak punches
      range: 1,
      damageType: 'blunt',
    },
    statusEffects: [],
    position: { x: 2, y: 1 },
    facing: 270,
    // NO martial arts training
  };
}

// Create a striking fighter (Muay Thai, Boxing style) - has standalone damage techniques!
function createStrikingFighter(name: string, belt: number): SimUnit {
  return {
    id: `striking_${name}_${Date.now()}`,
    name,
    team: 'blue',
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 0, // No armor
    stoppingPower: 0,
    stats: {
      MEL: 24,
      RNG: 10,
      AGL: 20,
      CON: 18,
      INS: 14,
      WIL: 14,
      INT: 10,
    },
    weapon: {
      name: 'Fists',
      damage: 4,
      range: 1,
      damageType: 'blunt',
    },
    statusEffects: [],
    position: { x: 1, y: 1 },
    facing: 90,
    // Striking style has standalone damage techniques (Jab, Cross, Hook, etc.)
    martialArtsStyle: 'striking',
    beltLevel: belt,
  };
}

async function runTest() {
  console.log('=== TECHNIQUE EXECUTION TEST ===\n');

  // Test 1: Striking Black Belt vs Untrained
  console.log('Test 1: Striking Belt 10 (Jab/Cross/Hook) vs Untrained');
  console.log('Expected: Striker should win - has damage techniques\n');

  let trainedWins = 0;
  let untrainedWins = 0;
  const battles = 100;

  for (let i = 0; i < battles; i++) {
    const trained = createStrikingFighter('Striker', 10);
    const untrained = createUntrainedFighter('Untrained Fighter');

    const result = runQuickBattle([trained], [untrained]);
    if (result.winner === 'blue') trainedWins++;
    else if (result.winner === 'red') untrainedWins++;
  }

  console.log(`Striking Belt 10 wins: ${trainedWins}/${battles} (${trainedWins}%)`);
  console.log(`Untrained wins: ${untrainedWins}/${battles} (${untrainedWins}%)`);
  console.log(`Draws: ${battles - trainedWins - untrainedWins}/${battles}\n`);

  // Test 2: Detailed battle with attack log (using striking)
  console.log('Test 2: Detailed Battle Log (Striking vs Untrained)');
  const trained = createStrikingFighter('Striker Master', 8);
  const untrained = createUntrainedFighter('Street Brawler');

  const detailedResult = runBattle([trained], [untrained], { maxRounds: 10 });

  console.log(`Winner: ${detailedResult.winner}`);
  console.log(`Rounds: ${detailedResult.rounds}`);
  console.log(`Total attacks: ${detailedResult.log.length}`);
  console.log('\nAttack Log (all attacks):');

  for (const attack of detailedResult.log) {
    const attackName = attack.attackName || attack.weapon || attack.attacker;
    const dmg = attack.finalDamage ?? attack.actualDamage ?? attack.damage ?? 0;
    console.log(
      `  ${attackName}: ${attack.hitResult} for ${dmg} damage (raw: ${attack.rawDamage}, final: ${attack.finalDamage})` +
        (attack.statusEffects?.length ? ` [${attack.statusEffects.join(', ')}]` : '')
    );
  }

  // Check technique availability
  console.log('\n--- Technique Debug ---');
  const { getAvailableTechniques, getUsableTechniques } = await import('./technique');
  const available = getAvailableTechniques('striking', 8);
  console.log(`Available techniques for Belt 8 Striking: ${available.length}`);
  available.forEach(t => console.log(`  - ${t.name} (Belt ${t.beltRequired}): ${t.damage || 0} dmg`));

  // Test 3: Striking vs Submission (damage vs setup)
  console.log('\n\nTest 3: Striking (Belt 8) vs Submission (Belt 8)');
  console.log('Expected: Striking should win - has standalone damage techniques\n');

  let strikingWins = 0;
  let submissionWins = 0;

  for (let i = 0; i < battles; i++) {
    const striker = createStrikingFighter('Striker', 8);
    striker.team = 'blue';
    striker.position = { x: 1, y: 1 };

    const submission = createSubmissionFighter('Submission', 8);
    submission.team = 'red';
    submission.position = { x: 2, y: 1 };

    const result = runQuickBattle([striker], [submission]);
    if (result.winner === 'blue') strikingWins++;
    else if (result.winner === 'red') submissionWins++;
  }

  console.log(`Striking wins: ${strikingWins}/${battles} (${strikingWins}%)`);
  console.log(`Submission wins: ${submissionWins}/${battles} (${submissionWins}%)`);
  console.log(`Draws: ${battles - strikingWins - submissionWins}/${battles}\n`);

  // Test 4: Belt level comparison within same style (Striking)
  console.log('Test 4: Striking Belt 3 vs Striking Belt 8');
  console.log('Expected: Belt 8 should win with stronger techniques\n');

  let lowBeltWins = 0;
  let highBeltWins = 0;

  for (let i = 0; i < battles; i++) {
    const lowBelt = createStrikingFighter('Low Belt', 3);
    lowBelt.team = 'blue';
    lowBelt.position = { x: 1, y: 1 };

    const highBelt = createStrikingFighter('High Belt', 8);
    highBelt.team = 'red';
    highBelt.position = { x: 2, y: 1 };

    const result = runQuickBattle([lowBelt], [highBelt]);
    if (result.winner === 'blue') lowBeltWins++;
    else if (result.winner === 'red') highBeltWins++;
  }

  console.log(`Striking Belt 3 wins: ${lowBeltWins}/${battles} (${lowBeltWins}%)`);
  console.log(`Striking Belt 8 wins: ${highBeltWins}/${battles} (${highBeltWins}%)`);
  console.log(`Draws: ${battles - lowBeltWins - highBeltWins}/${battles}\n`);

  console.log('=== TEST COMPLETE ===');
}

runTest();

/**
 * Martial Arts 1v1 Test Suite
 *
 * Run with: npx tsx src/combat/martialArtsTest.ts
 *
 * Tests one-on-one martial arts combat:
 * - Different fighting styles
 * - Weapon specialties (disarm, knockdown, block bonus)
 * - Bleeding from edged weapons
 * - Unarmed vs armed matchups
 */

import {
  SimUnit,
  SimWeapon,
  calculateHP,
} from './types';

import { runBattle } from './battleRunner';
import { createCustomUnit, WEAPONS, resetUnitIds } from './humanPresets';

// ============ MARTIAL ARTS WEAPONS (from humanPresets) ============

// Re-define here for clarity - these match the ones in humanPresets.ts
const NUNCHUCKS: SimWeapon = {
  name: 'Nunchucks',
  damage: 14,
  accuracy: 78,
  damageType: 'IMPACT_BLUNT',
  range: 1,
  apCost: 2,
  special: {
    disarmBonus: 25,  // +25% disarm chance
  },
};

const BO_STAFF: SimWeapon = {
  name: 'Bo Staff',
  damage: 12,
  accuracy: 82,
  damageType: 'IMPACT_BLUNT',
  range: 2,  // Extra reach
  apCost: 2,
  special: {
    knockdownChance: 30,  // 30% knockdown
  },
};

const TONFA: SimWeapon = {
  name: 'Tonfa',
  damage: 10,
  accuracy: 85,
  damageType: 'IMPACT_BLUNT',
  range: 1,
  apCost: 1,
  special: {
    blockBonus: 15,  // +15 evasion when defensive
  },
};

const SAI: SimWeapon = {
  name: 'Sai',
  damage: 16,
  accuracy: 80,
  damageType: 'EDGED_PIERCING',  // Causes bleeding!
  range: 1,
  apCost: 2,
  special: {
    disarmBonus: 15,
    bladeTrapping: true,  // +20% disarm vs edged
  },
};

const KATANA: SimWeapon = {
  name: 'Katana',
  damage: 28,
  accuracy: 78,
  damageType: 'EDGED_SLASHING',  // Causes bleeding!
  range: 1,
  apCost: 2,
};

const BRASS_KNUCKLES: SimWeapon = {
  name: 'Brass Knuckles',
  damage: 12,
  accuracy: 88,
  damageType: 'IMPACT_BLUNT',
  range: 1,
  apCost: 1,
};

const FISTS: SimWeapon = {
  name: 'Fists',
  damage: 8,
  accuracy: 90,
  damageType: 'SMASHING_MELEE',
  range: 1,
  apCost: 1,
};

const COMBAT_KNIFE: SimWeapon = {
  name: 'Combat Knife',
  damage: 18,
  accuracy: 85,
  damageType: 'EDGED_SLASHING',  // Causes bleeding!
  range: 1,
  apCost: 1,
};

// ============ FIGHTER ARCHETYPES ============

// Stats for different martial arts backgrounds
const BOXER_STATS = { MEL: 25, AGL: 22, STR: 24, STA: 24 };      // Strong punches, good endurance
const KICKBOXER_STATS = { MEL: 24, AGL: 26, STR: 22, STA: 22 };  // Fast, good kicks
const KARATE_STATS = { MEL: 24, AGL: 24, STR: 22, STA: 24 };     // Balanced
const KUNG_FU_STATS = { MEL: 22, AGL: 28, STR: 20, STA: 22 };    // Very agile
const SAMURAI_STATS = { MEL: 26, AGL: 22, STR: 24, STA: 26 };    // Strong, disciplined
const NINJA_STATS = { MEL: 22, AGL: 30, STR: 20, STA: 20 };      // Fastest, glass cannon
const BRAWLER_STATS = { MEL: 22, AGL: 18, STR: 28, STA: 26 };    // Strong but slow
const STREET_STATS = { MEL: 20, AGL: 20, STR: 22, STA: 20 };     // Average street fighter

// ============ FIGHTER CREATION ============

function createFighter(
  team: 'blue' | 'red',
  name: string,
  stats: typeof BOXER_STATS,
  weapon: SimWeapon,
  dr: number = 0
): SimUnit {
  const unit = createCustomUnit(team, name, stats, weapon);
  unit.dr = dr;
  return unit;
}

// ============ 1v1 BATTLE FUNCTION ============

interface FightResult {
  fighter1: string;
  fighter2: string;
  winner: string;
  rounds: number;
  fighter1FinalHP: number;
  fighter2FinalHP: number;
  effectsApplied: string[];
}

function run1v1(
  name1: string,
  stats1: typeof BOXER_STATS,
  weapon1: SimWeapon,
  name2: string,
  stats2: typeof BOXER_STATS,
  weapon2: SimWeapon
): FightResult {
  resetUnitIds();
  const fighter1 = createFighter('blue', name1, stats1, weapon1);
  const fighter2 = createFighter('red', name2, stats2, weapon2);

  const result = runBattle([fighter1], [fighter2], { maxRounds: 20 });

  // Collect effects
  const effects: string[] = [];
  for (const attack of result.log) {
    for (const effect of attack.effectsApplied) {
      if (!effects.includes(effect)) effects.push(effect);
    }
  }

  // Estimate final HP
  const f1HP = result.winner === 'blue'
    ? Math.max(1, fighter1.maxHp - result.redDamageDealt)
    : 0;
  const f2HP = result.winner === 'red'
    ? Math.max(1, fighter2.maxHp - result.blueDamageDealt)
    : 0;

  return {
    fighter1: name1,
    fighter2: name2,
    winner: result.winner === 'blue' ? name1 : result.winner === 'red' ? name2 : 'DRAW',
    rounds: result.rounds,
    fighter1FinalHP: f1HP,
    fighter2FinalHP: f2HP,
    effectsApplied: effects,
  };
}

function runMatchup(
  name1: string,
  stats1: typeof BOXER_STATS,
  weapon1: SimWeapon,
  name2: string,
  stats2: typeof BOXER_STATS,
  weapon2: SimWeapon,
  fights: number = 100
): void {
  let wins1 = 0;
  let wins2 = 0;
  let totalRounds = 0;
  let totalEffects: Record<string, number> = {};

  for (let i = 0; i < fights; i++) {
    resetUnitIds();
    const f1 = createFighter('blue', name1, stats1, weapon1);
    const f2 = createFighter('red', name2, stats2, weapon2);
    const result = runBattle([f1], [f2], { maxRounds: 20 });

    if (result.winner === 'blue') wins1++;
    else if (result.winner === 'red') wins2++;
    totalRounds += result.rounds;

    for (const attack of result.log) {
      for (const effect of attack.effectsApplied) {
        totalEffects[effect] = (totalEffects[effect] || 0) + 1;
      }
    }
  }

  const w1Pct = ((wins1 / fights) * 100).toFixed(1);
  const w2Pct = ((wins2 / fights) * 100).toFixed(1);
  const avgRounds = (totalRounds / fights).toFixed(1);

  console.log(`\n${name1} vs ${name2} (${fights} fights):`);
  console.log(`  ${name1}: ${w1Pct}% wins`);
  console.log(`  ${name2}: ${w2Pct}% wins`);
  console.log(`  Avg rounds: ${avgRounds}`);

  if (Object.keys(totalEffects).length > 0) {
    const effectStr = Object.entries(totalEffects)
      .map(([e, c]) => `${e}: ${(c / fights).toFixed(1)}/fight`)
      .join(', ');
    console.log(`  Effects: ${effectStr}`);
  }
}

// ============ SINGLE FIGHT SHOWCASE ============

function showcaseFight(
  name1: string,
  stats1: typeof BOXER_STATS,
  weapon1: SimWeapon,
  name2: string,
  stats2: typeof BOXER_STATS,
  weapon2: SimWeapon
): void {
  resetUnitIds();
  const f1 = createFighter('blue', name1, stats1, weapon1);
  const f2 = createFighter('red', name2, stats2, weapon2);
  const result = runBattle([f1], [f2], { maxRounds: 20 });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`FIGHT: ${name1} (${weapon1.name}) vs ${name2} (${weapon2.name})`);
  console.log(`${'='.repeat(50)}`);

  console.log(`\n${name1}: HP ${f1.maxHp}, MEL ${stats1.MEL}, AGL ${stats1.AGL}`);
  console.log(`${name2}: HP ${f2.maxHp}, MEL ${stats2.MEL}, AGL ${stats2.AGL}`);

  console.log('\n--- ROUND BY ROUND ---');
  let round = 0;
  for (const attack of result.log) {
    round++;
    const hitStr = attack.hitResult.toUpperCase();
    const attacker = attack.attacker.includes('blue') ? name1 : name2;
    const target = attack.target.includes('blue') ? name1 : name2;

    let effectStr = '';
    if (attack.effectsApplied.length > 0) {
      effectStr = ` [${attack.effectsApplied.join(', ')}]`;
    }

    const status = attack.killed ? ' ** KNOCKOUT **' : '';
    console.log(`  R${round}: ${attacker} ${hitStr} ${target} for ${attack.finalDamage} dmg${effectStr}${status}`);
  }

  const winnerName = result.winner === 'blue' ? name1 : result.winner === 'red' ? name2 : 'DRAW';
  const winnerHP = result.winner === 'blue'
    ? Math.max(1, f1.maxHp - result.redDamageDealt)
    : result.winner === 'red'
    ? Math.max(1, f2.maxHp - result.blueDamageDealt)
    : 0;

  console.log(`\nWINNER: ${winnerName} (approx ${winnerHP} HP remaining)`);
}

// ============ MAIN TESTS ============

console.log('\n' + '='.repeat(60));
console.log('       MARTIAL ARTS 1v1 TEST SUITE');
console.log('       One-on-One Combat Showdowns');
console.log('='.repeat(60));

// ============ SHOWCASE FIGHTS ============

console.log('\n\n========== SHOWCASE FIGHTS (Single Battles) ==========');

// Boxer vs Kickboxer - classic standup matchup
showcaseFight('Boxer', BOXER_STATS, BRASS_KNUCKLES, 'Kickboxer', KICKBOXER_STATS, FISTS);

// Samurai vs Ninja - blade vs speed
showcaseFight('Samurai', SAMURAI_STATS, KATANA, 'Ninja', NINJA_STATS, SAI);

// Karate vs Kung Fu - traditional styles
showcaseFight('Karate Master', KARATE_STATS, FISTS, 'Kung Fu Master', KUNG_FU_STATS, NUNCHUCKS);

// ============ STATISTICAL MATCHUPS ============

console.log('\n\n========== STATISTICAL MATCHUPS (100 fights each) ==========');

// Classic boxing matchups
console.log('\n--- STRIKING STYLES ---');
runMatchup('Boxer', BOXER_STATS, BRASS_KNUCKLES, 'Kickboxer', KICKBOXER_STATS, FISTS, 100);
runMatchup('Boxer', BOXER_STATS, BRASS_KNUCKLES, 'Brawler', BRAWLER_STATS, FISTS, 100);
runMatchup('Kickboxer', KICKBOXER_STATS, FISTS, 'Karate Master', KARATE_STATS, FISTS, 100);

// Weapon specialists
console.log('\n--- WEAPON STYLES ---');
runMatchup('Nunchuck Expert', KUNG_FU_STATS, NUNCHUCKS, 'Bo Staff Master', KARATE_STATS, BO_STAFF, 100);
runMatchup('Tonfa Fighter', KARATE_STATS, TONFA, 'Sai Expert', NINJA_STATS, SAI, 100);
runMatchup('Staff vs Nunchucks', KARATE_STATS, BO_STAFF, 'Nunchuck', KUNG_FU_STATS, NUNCHUCKS, 100);

// Blade fighters (bleeding!)
console.log('\n--- BLADE FIGHTERS (Bleeding Weapons) ---');
runMatchup('Samurai', SAMURAI_STATS, KATANA, 'Ninja', NINJA_STATS, SAI, 100);
runMatchup('Samurai', SAMURAI_STATS, KATANA, 'Knife Fighter', STREET_STATS, COMBAT_KNIFE, 100);
runMatchup('Knife Fighter', STREET_STATS, COMBAT_KNIFE, 'Street Brawler', BRAWLER_STATS, FISTS, 100);

// Unarmed vs Armed
console.log('\n--- UNARMED VS ARMED ---');
runMatchup('Boxer (unarmed)', BOXER_STATS, FISTS, 'Knife Fighter', STREET_STATS, COMBAT_KNIFE, 100);
runMatchup('Kung Fu (unarmed)', KUNG_FU_STATS, FISTS, 'Nunchuck Fighter', KUNG_FU_STATS, NUNCHUCKS, 100);
runMatchup('Brawler (unarmed)', BRAWLER_STATS, FISTS, 'Tonfa Fighter', KARATE_STATS, TONFA, 100);

// Speed vs Power
console.log('\n--- SPEED VS POWER ---');
runMatchup('Ninja (fast)', NINJA_STATS, SAI, 'Brawler (strong)', BRAWLER_STATS, BRASS_KNUCKLES, 100);
runMatchup('Kung Fu (agile)', KUNG_FU_STATS, FISTS, 'Boxer (power)', BOXER_STATS, BRASS_KNUCKLES, 100);

// Mirror matches
console.log('\n--- MIRROR MATCHES ---');
runMatchup('Boxer 1', BOXER_STATS, BRASS_KNUCKLES, 'Boxer 2', BOXER_STATS, BRASS_KNUCKLES, 100);
runMatchup('Samurai 1', SAMURAI_STATS, KATANA, 'Samurai 2', SAMURAI_STATS, KATANA, 100);
runMatchup('Ninja 1', NINJA_STATS, SAI, 'Ninja 2', NINJA_STATS, SAI, 100);

// ============ SPECIAL WEAPON PROPERTIES ============

console.log('\n\n========== WEAPON SPECIAL PROPERTIES ==========');

console.log('\nWeapon Special Abilities:');
console.log('  Nunchucks: +25% disarm chance');
console.log('  Bo Staff: 30% knockdown chance, 2-tile reach');
console.log('  Tonfa: +15 evasion when defensive');
console.log('  Sai: +15% disarm, +20% vs blades (trapping)');
console.log('  Katana: High damage + bleeding (4 dmg/turn, 4 turns)');
console.log('  Combat Knife: Good damage + bleeding');

console.log('\nBleeding weapons should show more effects applied:');
console.log('  - Katana (EDGED_SLASHING): 4 dmg/turn constant');
console.log('  - Sai (EDGED_PIERCING): 3 dmg/turn constant');
console.log('  - Combat Knife (EDGED_SLASHING): 4 dmg/turn constant');

// ============ FINAL SUMMARY ============

console.log('\n\n' + '='.repeat(60));
console.log('       MARTIAL ARTS BALANCE SUMMARY');
console.log('='.repeat(60));

console.log('\nExpected Balance:');
console.log('  Mirror matches: ~50% each');
console.log('  Blade vs Unarmed: Blade advantage (bleeding DoT)');
console.log('  Fast vs Slow: Fast advantage (more hits)');
console.log('  Armed vs Unarmed: Armed advantage (more damage)');

console.log('\nStat Impacts:');
console.log('  MEL + AGL = Initiative (who goes first)');
console.log('  STR = +damage (STR/10 bonus)');
console.log('  AGL = Evasion modifier');
console.log('  STA = HP calculation');

console.log('\n' + '='.repeat(60));
console.log('       ALL MARTIAL ARTS TESTS COMPLETE');
console.log('='.repeat(60) + '\n');

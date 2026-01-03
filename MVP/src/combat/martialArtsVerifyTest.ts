/**
 * Martial Arts Verification Test
 *
 * Simple test to verify techniques are being used in combat.
 */

import { runBattle } from './battleRunner';
import { SimUnit } from './types';

// Create a high-belt martial artist
function createMartialArtist(name: string, style: string, belt: number): SimUnit {
  return {
    id: `ma_${name}_${Date.now()}`,
    name,
    team: 'blue',
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    ap: 8, // Extra AP to use techniques
    maxAp: 8,
    alive: true,
    dr: 0,
    stoppingPower: 0,
    stats: { MEL: 25, RNG: 15, AGL: 20, CON: 20, INS: 15, WIL: 15, INT: 12 },
    weapon: { name: 'Fists', damage: 4, range: 1, damageType: 'blunt' },
    statusEffects: [],
    position: { x: 1, y: 1 },
    facing: 90,
    martialArtsStyle: style,
    beltLevel: belt,
  };
}

// Create an untrained fighter
function createUntrained(name: string): SimUnit {
  return {
    id: `untrained_${name}_${Date.now()}`,
    name,
    team: 'red',
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 0,
    stoppingPower: 0,
    stats: { MEL: 15, RNG: 15, AGL: 15, CON: 15, INS: 15, WIL: 15, INT: 15 },
    weapon: { name: 'Fists', damage: 3, range: 1, damageType: 'blunt' },
    statusEffects: [],
    position: { x: 2, y: 1 },
    facing: 270,
  };
}

async function runTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           MARTIAL ARTS TECHNIQUE VERIFICATION              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const styles = ['striking', 'grappling', 'submission', 'counter', 'internal'];

  for (const style of styles) {
    console.log(`\n━━━ Testing ${style.toUpperCase()} Style (Belt 8) ━━━`);

    const artist = createMartialArtist(`${style} Master`, style, 8);
    const opponent = createUntrained('Untrained Fighter');

    const result = runBattle([artist], [opponent], { maxRounds: 10 });

    console.log(`Winner: ${result.winner === 'blue' ? artist.name : opponent.name}`);
    console.log(`Rounds: ${result.rounds}`);
    console.log(`Total Attacks: ${result.log.length}`);

    // Count technique usage
    const techniqueAttacks = result.log.filter(a => a.attackName && a.attackName !== 'Fists');
    const fistAttacks = result.log.filter(a => !a.attackName || a.attackName === 'Fists');

    console.log(`Technique Attacks: ${techniqueAttacks.length}`);
    console.log(`Fist Attacks: ${fistAttacks.length}`);

    // Show technique names used
    if (techniqueAttacks.length > 0) {
      const uniqueTechs = [...new Set(techniqueAttacks.map(a => a.attackName))];
      console.log(`Techniques Used: ${uniqueTechs.join(', ')}`);
    }

    // Show first 5 attacks
    console.log('\nFirst 5 Attacks:');
    for (const attack of result.log.slice(0, 5)) {
      const name = attack.attackName || attack.weapon || 'Attack';
      const hit = attack.hitResult || (attack.finalDamage && attack.finalDamage > 0 ? 'hit' : 'miss');
      const dmg = attack.finalDamage ?? attack.damage ?? 0;
      console.log(`  ${attack.attacker} → ${name}: ${hit} for ${dmg} damage`);
    }
  }

  // Summary test: 100 battles per style
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║               100-BATTLE STATISTICAL TEST                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results: Record<string, { wins: number; techUsed: number; totalAttacks: number }> = {};

  for (const style of styles) {
    results[style] = { wins: 0, techUsed: 0, totalAttacks: 0 };

    for (let i = 0; i < 100; i++) {
      const artist = createMartialArtist(`${style} Fighter`, style, 6);
      const opponent = createUntrained('Opponent');

      const result = runBattle([artist], [opponent], { maxRounds: 20 });

      if (result.winner === 'blue') results[style].wins++;

      results[style].totalAttacks += result.log.length;
      results[style].techUsed += result.log.filter(a => a.attackName && a.attackName !== 'Fists').length;
    }
  }

  console.log('Style       | Win Rate | Technique Usage | Attacks/Battle');
  console.log('────────────────────────────────────────────────────────────');

  for (const [style, data] of Object.entries(results)) {
    const winRate = (data.wins).toFixed(0) + '%';
    const techRate = ((data.techUsed / data.totalAttacks) * 100).toFixed(1) + '%';
    const avgAttacks = (data.totalAttacks / 100).toFixed(1);
    console.log(`${style.padEnd(11)} | ${winRate.padStart(8)} | ${techRate.padStart(15)} | ${avgAttacks.padStart(14)}`);
  }

  // Untrained baseline
  let untrainedWins = 0;
  let totalFistAttacks = 0;
  for (let i = 0; i < 100; i++) {
    const u1 = createUntrained('Fighter A');
    u1.team = 'blue';
    const u2 = createUntrained('Fighter B');
    u2.team = 'red';
    const result = runBattle([u1], [u2], { maxRounds: 20 });
    if (result.winner === 'blue') untrainedWins++;
    totalFistAttacks += result.log.length;
  }

  console.log(`${'untrained'.padEnd(11)} | ${(untrainedWins + '%').padStart(8)} | ${'0.0%'.padStart(15)} | ${(totalFistAttacks / 100).toFixed(1).padStart(14)}`);

  console.log('\n=== TEST COMPLETE ===');
}

runTest();

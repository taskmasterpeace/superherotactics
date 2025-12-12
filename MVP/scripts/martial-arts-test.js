/**
 * Martial Arts Combat Test
 * Tests armed vs unarmed combat with martial arts techniques
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 54322,
  database: 'superhero_tactics',
  user: 'postgres',
  password: 'postgres',
});

// Belt rank bonuses
const BELT_BONUS = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10 };

// Get all characters with their martial arts training
async function getCharactersWithMartialArts() {
  const result = await client.query(`
    SELECT
      c.id, c.alias, c.name, c.mel, c.agl, c.str, c.sta, c.threat_level,
      c.health,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('style', s.name, 'belt', cma.belt_level)
        ) FILTER (WHERE s.name IS NOT NULL),
        '[]'
      ) as martial_arts
    FROM characters c
    LEFT JOIN character_martial_arts cma ON c.id = cma.character_id
    LEFT JOIN martial_arts_styles s ON cma.style_id = s.id
    GROUP BY c.id
    ORDER BY c.threat_level DESC, c.alias
  `);
  return result.rows;
}

// Get techniques for a style at a belt level
async function getTechniques(styleId, beltLevel) {
  const result = await client.query(`
    SELECT * FROM martial_arts_techniques
    WHERE style_id = $1 AND belt_required <= $2
    ORDER BY belt_required DESC
  `, [styleId, beltLevel]);
  return result.rows;
}

// Calculate hit chance
function calculateHitChance(attackerMEL, attackerAGL, defenderAGL, beltBonus = 0) {
  const base = attackerMEL + beltBonus + (attackerAGL / 4) - (defenderAGL / 3) + 30;
  return Math.max(5, Math.min(95, base));
}

// Calculate damage
function calculateDamage(baseDamage, attackerSTR, beltLevel) {
  const strBonus = Math.floor(attackerSTR / 20);
  const beltDamageBonus = Math.floor(beltLevel / 3);
  return (baseDamage || 0) + strBonus + beltDamageBonus;
}

// Simulate armed combat (with powers)
function simulateArmedCombat(char1, char2) {
  let hp1 = char1.health || (char1.sta * 2 + char1.str);
  let hp2 = char2.health || (char2.sta * 2 + char2.str);
  let turn = 0;
  const maxTurns = 50;

  while (hp1 > 0 && hp2 > 0 && turn < maxTurns) {
    turn++;

    // Char1 attacks
    const hitChance1 = calculateHitChance(char1.mel, char1.agl, char2.agl);
    if (Math.random() * 100 < hitChance1) {
      // Use STR as base damage for unarmed, or power damage
      const damage = 15 + Math.floor(char1.str / 5);
      hp2 -= damage;
    }

    if (hp2 <= 0) break;

    // Char2 attacks
    const hitChance2 = calculateHitChance(char2.mel, char2.agl, char1.agl);
    if (Math.random() * 100 < hitChance2) {
      const damage = 15 + Math.floor(char2.str / 5);
      hp1 -= damage;
    }
  }

  return { winner: hp1 > hp2 ? char1 : char2, turns: turn, hp1, hp2 };
}

// Simulate martial arts combat - SKILL DOMINATES IN PURE MA
function simulateMartialArtsCombat(char1, char2) {
  // In pure MA, HP is normalized - skill matters more than size
  // Base HP 100 + (STA / 3) - much less STA dependency
  let hp1 = 100 + Math.floor(char1.sta / 3);
  let hp2 = 100 + Math.floor(char2.sta / 3);
  let turn = 0;
  const maxTurns = 50;

  // Get best martial arts belt level for each character
  const ma1 = char1.martial_arts || [];
  const ma2 = char2.martial_arts || [];
  const bestBelt1 = ma1.length > 0 ? Math.max(...ma1.map(m => m.belt)) : 0;
  const bestBelt2 = ma2.length > 0 ? Math.max(...ma2.map(m => m.belt)) : 0;

  // Belt is EVERYTHING in pure MA combat
  // Higher belt = massively better hit, damage, and defense
  const beltHitBonus1 = (BELT_BONUS[bestBelt1] || 0) * 4;
  const beltHitBonus2 = (BELT_BONUS[bestBelt2] || 0) * 4;

  // Damage scales with belt squared - masters hit HARD
  const beltDmgBonus1 = (BELT_BONUS[bestBelt1] || 0) * 3;
  const beltDmgBonus2 = (BELT_BONUS[bestBelt2] || 0) * 3;

  // Defense from belt - masters are hard to hurt
  const beltDefense1 = (BELT_BONUS[bestBelt1] || 0) * 2;
  const beltDefense2 = (BELT_BONUS[bestBelt2] || 0) * 2;

  // Evasion bonus from belt - masters dodge more
  const beltEvasion1 = (BELT_BONUS[bestBelt1] || 0) * 2;
  const beltEvasion2 = (BELT_BONUS[bestBelt2] || 0) * 2;

  while (hp1 > 0 && hp2 > 0 && turn < maxTurns) {
    turn++;

    // Char1 attacks - MEL + Belt bonus vs defender's evasion
    const hitChance1 = calculateHitChance(char1.mel, char1.agl, char2.agl + beltEvasion2, beltHitBonus1);
    if (Math.random() * 100 < hitChance1) {
      // Damage: Base 5 + Belt x3 + tiny STR bonus
      const rawDamage = 5 + beltDmgBonus1 + Math.floor(char1.str / 20);
      const damage = Math.max(1, rawDamage - beltDefense2);
      hp2 -= damage;
    }

    if (hp2 <= 0) break;

    // Char2 attacks
    const hitChance2 = calculateHitChance(char2.mel, char2.agl, char1.agl + beltEvasion1, beltHitBonus2);
    if (Math.random() * 100 < hitChance2) {
      const rawDamage = 5 + beltDmgBonus2 + Math.floor(char2.str / 20);
      const damage = Math.max(1, rawDamage - beltDefense1);
      hp1 -= damage;
    }
  }

  return { winner: hp1 > hp2 ? char1 : char2, turns: turn, hp1, hp2, belt1: bestBelt1, belt2: bestBelt2 };
}

// Run tournament
async function runTournament(characters, combatType = 'armed') {
  const results = {};
  const simulateFn = combatType === 'martial_arts' ? simulateMartialArtsCombat : simulateArmedCombat;

  // Initialize results
  for (const char of characters) {
    results[char.alias] = { wins: 0, losses: 0, fights: 0, totalTurns: 0 };
  }

  // Round robin
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const char1 = characters[i];
      const char2 = characters[j];

      // Run 10 fights each matchup
      let c1wins = 0, c2wins = 0;
      for (let k = 0; k < 10; k++) {
        const result = simulateFn(char1, char2);
        if (result.winner.id === char1.id) c1wins++;
        else c2wins++;
        results[char1.alias].totalTurns += result.turns;
        results[char2.alias].totalTurns += result.turns;
      }

      results[char1.alias].wins += c1wins;
      results[char1.alias].losses += c2wins;
      results[char1.alias].fights += 10;

      results[char2.alias].wins += c2wins;
      results[char2.alias].losses += c1wins;
      results[char2.alias].fights += 10;
    }
  }

  return results;
}

async function main() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const characters = await getCharactersWithMartialArts();
    console.log(`Loaded ${characters.length} characters\n`);

    // Show martial arts training
    console.log('=== MARTIAL ARTS TRAINING ===\n');
    for (const char of characters) {
      const ma = char.martial_arts || [];
      if (ma.length > 0 && ma[0].style) {
        const styles = ma.map(m => `${m.style} (${m.belt})`).join(', ');
        console.log(`${char.alias}: ${styles}`);
      }
    }

    // Filter to characters with martial arts for MA tournament
    const maCharacters = characters.filter(c =>
      c.martial_arts && c.martial_arts.length > 0 && c.martial_arts[0].style
    );

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('=== MARTIAL ARTS ONLY TOURNAMENT (Unarmed) ===');
    console.log(`${'='.repeat(60)}\n`);

    const maResults = await runTournament(maCharacters, 'martial_arts');

    // Sort by win rate
    const maSorted = Object.entries(maResults)
      .map(([name, stats]) => ({
        name,
        ...stats,
        winRate: stats.fights > 0 ? (stats.wins / stats.fights * 100).toFixed(1) : 0,
        avgTurns: stats.fights > 0 ? (stats.totalTurns / stats.fights).toFixed(1) : 0
      }))
      .sort((a, b) => b.winRate - a.winRate);

    console.log('Rank | Fighter         | W-L      | Win%  | Avg Turns');
    console.log('-----|-----------------|----------|-------|----------');
    maSorted.forEach((r, i) => {
      console.log(
        `${String(i + 1).padStart(4)} | ${r.name.padEnd(15)} | ${String(r.wins).padStart(3)}-${String(r.losses).padEnd(3)} | ${String(r.winRate).padStart(5)}% | ${r.avgTurns}`
      );
    });

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('=== ALL CHARACTERS ARMED COMBAT TOURNAMENT ===');
    console.log(`${'='.repeat(60)}\n`);

    const armedResults = await runTournament(characters, 'armed');

    const armedSorted = Object.entries(armedResults)
      .map(([name, stats]) => ({
        name,
        ...stats,
        winRate: stats.fights > 0 ? (stats.wins / stats.fights * 100).toFixed(1) : 0,
        avgTurns: stats.fights > 0 ? (stats.totalTurns / stats.fights).toFixed(1) : 0
      }))
      .sort((a, b) => b.winRate - a.winRate);

    console.log('Rank | Fighter         | W-L      | Win%  | Avg Turns');
    console.log('-----|-----------------|----------|-------|----------');
    armedSorted.forEach((r, i) => {
      console.log(
        `${String(i + 1).padStart(4)} | ${r.name.padEnd(15)} | ${String(r.wins).padStart(3)}-${String(r.losses).padEnd(3)} | ${String(r.winRate).padStart(5)}% | ${r.avgTurns}`
      );
    });

    // Head-to-head matchups
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('=== HEAD-TO-HEAD MATCHUPS (10 fights each) ===');
    console.log(`${'='.repeat(60)}\n`);

    // Batman vs Wolverine (the classic!)
    const batman = characters.find(c => c.alias === 'Batman');
    const wolverine = characters.find(c => c.alias === 'Wolverine');
    if (batman && wolverine) {
      let batmanWins = 0;
      for (let i = 0; i < 10; i++) {
        const result = simulateMartialArtsCombat(batman, wolverine);
        if (result.winner.alias === 'Batman') batmanWins++;
      }
      console.log(`Batman vs Wolverine (MA only): Batman ${batmanWins}-${10-batmanWins}`);
    }

    // Black Widow vs Green Arrow
    const widow = characters.find(c => c.alias === 'Black Widow');
    const arrow = characters.find(c => c.alias === 'Green Arrow');
    if (widow && arrow) {
      let widowWins = 0;
      for (let i = 0; i < 10; i++) {
        const result = simulateMartialArtsCombat(widow, arrow);
        if (result.winner.alias === 'Black Widow') widowWins++;
      }
      console.log(`Black Widow vs Green Arrow (MA only): Widow ${widowWins}-${10-widowWins}`);
    }

    // Wonder Woman vs Thor
    const wonderwoman = characters.find(c => c.alias === 'Wonder Woman');
    const thor = characters.find(c => c.alias === 'Thor');
    if (wonderwoman && thor) {
      let wwWins = 0;
      for (let i = 0; i < 10; i++) {
        const result = simulateMartialArtsCombat(wonderwoman, thor);
        if (result.winner.alias === 'Wonder Woman') wwWins++;
      }
      console.log(`Wonder Woman vs Thor (MA only): WW ${wwWins}-${10-wwWins}`);
    }

    // Hulk vs Superman (the ultimate!)
    const hulk = characters.find(c => c.alias === 'Hulk');
    const superman = characters.find(c => c.alias === 'Superman');
    if (hulk && superman) {
      let hulkWins = 0;
      for (let i = 0; i < 10; i++) {
        const result = simulateArmedCombat(hulk, superman);
        if (result.winner.alias === 'Hulk') hulkWins++;
      }
      console.log(`Hulk vs Superman (Armed): Hulk ${hulkWins}-${10-hulkWins}`);
    }

    // Batman vs Captain America (skill vs super-soldier)
    const cap = characters.find(c => c.alias === 'Captain America');
    if (batman && cap) {
      let batmanWins = 0;
      for (let i = 0; i < 10; i++) {
        const result = simulateMartialArtsCombat(batman, cap);
        if (result.winner.alias === 'Batman') batmanWins++;
      }
      console.log(`Batman vs Captain America (MA only): Batman ${batmanWins}-${10-batmanWins}`);
    }

    // Iron Man vs Doctor Doom (tech rivalry)
    const ironman = characters.find(c => c.alias === 'Iron Man');
    const doom = characters.find(c => c.alias === 'Doctor Doom');
    if (ironman && doom) {
      let ironmanWins = 0;
      for (let i = 0; i < 10; i++) {
        const result = simulateArmedCombat(ironman, doom);
        if (result.winner.alias === 'Iron Man') ironmanWins++;
      }
      console.log(`Iron Man vs Doctor Doom (Armed): Iron Man ${ironmanWins}-${10-ironmanWins}`);
    }

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();

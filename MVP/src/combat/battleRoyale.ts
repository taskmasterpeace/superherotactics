/**
 * 200-Character Battle Royale Test
 *
 * Tests martial arts system at scale with diverse fighters.
 */

import { runBattle, runQuickBattle } from './battleRunner';
import { SimUnit } from './types';

// Names for fighters
const FIRST_NAMES = [
  'Alex', 'Blake', 'Casey', 'Drew', 'Ellis', 'Finn', 'Gray', 'Harper',
  'Indigo', 'Jordan', 'Kai', 'Lane', 'Morgan', 'Nova', 'Onyx', 'Phoenix',
  'Quinn', 'River', 'Sage', 'Taylor', 'Unity', 'Vale', 'Winter', 'Xen',
  'Yuki', 'Zara', 'Ace', 'Bo', 'Cruz', 'Dax', 'Echo', 'Fox', 'Gage',
  'Hawk', 'Ivy', 'Jett', 'Knox', 'Leo', 'Max', 'Neo', 'Oak', 'Pike',
  'Reign', 'Storm', 'Troy', 'Ursa', 'Vex', 'Wolf', 'Zeke', 'Ash',
];

const LAST_NAMES = [
  'Steel', 'Stone', 'Wolf', 'Hawk', 'Storm', 'Blaze', 'Frost', 'Thunder',
  'Shadow', 'Viper', 'Dragon', 'Phoenix', 'Raven', 'Tiger', 'Panther', 'Cobra',
  'Falcon', 'Bear', 'Lion', 'Eagle', 'Shark', 'Scorpion', 'Blade', 'Iron',
  'Silver', 'Gold', 'Diamond', 'Onyx', 'Jade', 'Ruby', 'Sapphire', 'Emerald',
];

const STYLES = ['striking', 'grappling', 'submission', 'counter', 'internal'] as const;
type StyleId = typeof STYLES[number];

// Realistic belt distribution (most are low belt)
function randomBelt(): number {
  const roll = Math.random() * 100;
  if (roll < 25) return 1;      // 25% White
  if (roll < 45) return 2;      // 20% Yellow
  if (roll < 60) return 3;      // 15% Orange
  if (roll < 72) return 4;      // 12% Green
  if (roll < 82) return 5;      // 10% Blue
  if (roll < 90) return 6;      // 8% Purple
  if (roll < 95) return 7;      // 5% Brown
  if (roll < 98) return 8;      // 3% Red
  if (roll < 99.5) return 9;    // 1.5% Black I
  return 10;                     // 0.5% Black II
}

// Generate stats based on belt level (higher belt = better stats)
function generateStats(belt: number): { MEL: number; RNG: number; AGL: number; CON: number; INS: number; WIL: number; INT: number } {
  const baseLevel = 10 + (belt * 2);
  const variance = 3;
  const randVar = () => Math.floor(Math.random() * (variance * 2 + 1)) - variance;

  return {
    MEL: Math.max(8, Math.min(35, baseLevel + randVar())),
    RNG: Math.max(8, Math.min(35, baseLevel + randVar() - 2)),
    AGL: Math.max(8, Math.min(35, baseLevel + randVar())),
    CON: Math.max(8, Math.min(35, baseLevel + randVar())),
    INS: Math.max(8, Math.min(35, baseLevel + randVar() - 1)),
    WIL: Math.max(8, Math.min(35, baseLevel + randVar() - 1)),
    INT: Math.max(8, Math.min(35, baseLevel + randVar() - 2)),
  };
}

// Create a random fighter
function createFighter(id: number): SimUnit {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${firstName} ${lastName}`;

  const style = STYLES[Math.floor(Math.random() * STYLES.length)];
  const belt = randomBelt();
  const stats = generateStats(belt);

  // Some fighters (30%) have no martial arts training
  const hasMartialArts = Math.random() > 0.3;

  return {
    id: `fighter_${id}_${Date.now()}`,
    name,
    team: 'blue', // Will be reassigned in battles
    hp: 50 + (stats.CON * 2),
    maxHp: 50 + (stats.CON * 2),
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0, // 30% have some armor
    stoppingPower: 0,
    stats,
    weapon: {
      name: 'Fists',
      damage: 4 + Math.floor(stats.MEL / 10),
      range: 1,
      damageType: 'blunt',
    },
    statusEffects: [],
    position: { x: 0, y: 0 }, // Will be set in battles
    facing: 90,
    // Martial arts training
    martialArtsStyle: hasMartialArts ? style : undefined,
    beltLevel: hasMartialArts ? belt : undefined,
  };
}

// Run a single elimination bracket
function runBracket(fighters: SimUnit[]): { winner: SimUnit; rounds: number; log: string[] } {
  const log: string[] = [];
  let remaining = [...fighters];
  let roundNum = 0;

  while (remaining.length > 1) {
    roundNum++;
    log.push(`\n=== ROUND ${roundNum} (${remaining.length} fighters) ===`);

    const nextRound: SimUnit[] = [];

    // Pair up fighters
    for (let i = 0; i < remaining.length; i += 2) {
      if (i + 1 >= remaining.length) {
        // Odd fighter gets a bye
        log.push(`  ${remaining[i].name} gets a bye!`);
        nextRound.push(remaining[i]);
        continue;
      }

      const fighter1 = { ...remaining[i], team: 'blue' as const, hp: remaining[i].maxHp, alive: true, ap: 4, position: { x: 1, y: 1 } };
      const fighter2 = { ...remaining[i + 1], team: 'red' as const, hp: remaining[i + 1].maxHp, alive: true, ap: 4, position: { x: 3, y: 1 } };

      const result = runQuickBattle([fighter1], [fighter2]);

      const winner = result.winner === 'blue' ? fighter1 : fighter2;
      const loser = result.winner === 'blue' ? fighter2 : fighter1;

      const winnerStyle = winner.martialArtsStyle ? `${winner.martialArtsStyle} B${winner.beltLevel}` : 'untrained';
      const loserStyle = loser.martialArtsStyle ? `${loser.martialArtsStyle} B${loser.beltLevel}` : 'untrained';

      log.push(`  ${winner.name} (${winnerStyle}) defeats ${loser.name} (${loserStyle}) in ${result.rounds} rounds`);

      // Winner advances with original stats
      nextRound.push(remaining[result.winner === 'blue' ? i : i + 1]);
    }

    remaining = nextRound;
  }

  return { winner: remaining[0], rounds: roundNum, log };
}

// Analyze style performance
interface StyleStats {
  wins: number;
  losses: number;
  totalFighters: number;
  beltDistribution: number[];
}

function analyzeResults(fighters: SimUnit[], bracketLog: string[]): void {
  const styleStats: Record<string, StyleStats> = {};

  // Initialize
  for (const style of STYLES) {
    styleStats[style] = { wins: 0, losses: 0, totalFighters: 0, beltDistribution: new Array(11).fill(0) };
  }
  styleStats['untrained'] = { wins: 0, losses: 0, totalFighters: 0, beltDistribution: new Array(11).fill(0) };

  // Count fighters
  for (const fighter of fighters) {
    const style = fighter.martialArtsStyle || 'untrained';
    styleStats[style].totalFighters++;
    if (fighter.beltLevel) {
      styleStats[style].beltDistribution[fighter.beltLevel]++;
    }
  }

  // Parse bracket log for wins/losses
  for (const line of bracketLog) {
    const match = line.match(/(\w+) B(\d+)\) defeats.*\((\w+)(?: B(\d+))?\)/);
    if (match) {
      const winnerStyle = match[1];
      const loserStyle = match[3];
      if (styleStats[winnerStyle]) styleStats[winnerStyle].wins++;
      if (styleStats[loserStyle]) styleStats[loserStyle].losses++;
    }
    // Handle untrained
    const untrainedMatch = line.match(/\(untrained\) defeats|\) defeats.*\(untrained\)/);
    if (untrainedMatch) {
      if (line.includes('(untrained) defeats')) {
        styleStats['untrained'].wins++;
      } else {
        styleStats['untrained'].losses++;
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    STYLE ANALYSIS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Style Performance:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Style       | Fighters | Wins | Losses | Win Rate');
  console.log('─────────────────────────────────────────────────────────────');

  for (const [style, stats] of Object.entries(styleStats)) {
    if (stats.totalFighters === 0) continue;
    const winRate = stats.wins + stats.losses > 0
      ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
      : 'N/A';
    console.log(
      `${style.padEnd(11)} | ${String(stats.totalFighters).padStart(8)} | ${String(stats.wins).padStart(4)} | ${String(stats.losses).padStart(6)} | ${winRate}%`
    );
  }

  console.log('\nBelt Distribution:');
  console.log('─────────────────────────────────────────────────────────────');
  const beltNames = ['', 'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black I', 'Black II'];
  let totalByBelt = new Array(11).fill(0);
  for (const stats of Object.values(styleStats)) {
    for (let i = 1; i <= 10; i++) {
      totalByBelt[i] += stats.beltDistribution[i];
    }
  }
  for (let i = 1; i <= 10; i++) {
    if (totalByBelt[i] > 0) {
      console.log(`  Belt ${i} (${beltNames[i].padEnd(8)}): ${totalByBelt[i]} fighters`);
    }
  }
}

// Main battle royale function
async function runBattleRoyale(numFighters: number = 200): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║            200-CHARACTER BATTLE ROYALE                     ║');
  console.log('║         Testing Martial Arts System at Scale               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Generating ${numFighters} fighters...`);

  const fighters: SimUnit[] = [];
  for (let i = 0; i < numFighters; i++) {
    fighters.push(createFighter(i));
  }

  // Count martial artists
  const martialArtists = fighters.filter(f => f.martialArtsStyle);
  const untrained = fighters.filter(f => !f.martialArtsStyle);

  console.log(`\nFighter Breakdown:`);
  console.log(`  Martial Artists: ${martialArtists.length} (${(martialArtists.length/numFighters*100).toFixed(1)}%)`);
  console.log(`  Untrained: ${untrained.length} (${(untrained.length/numFighters*100).toFixed(1)}%)`);

  console.log(`\nStyle Distribution:`);
  for (const style of STYLES) {
    const count = fighters.filter(f => f.martialArtsStyle === style).length;
    console.log(`  ${style.padEnd(12)}: ${count} fighters`);
  }

  console.log(`\n\nRunning elimination bracket...`);

  // Shuffle fighters
  const shuffled = [...fighters].sort(() => Math.random() - 0.5);

  const startTime = Date.now();
  const result = runBracket(shuffled);
  const endTime = Date.now();

  console.log(result.log.slice(0, 20).join('\n')); // First 20 lines
  console.log(`\n... (${result.log.length - 20} more lines)`);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      CHAMPION                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const champ = result.winner;
  console.log(`\n🏆 ${champ.name}`);
  console.log(`   Style: ${champ.martialArtsStyle || 'Untrained'}`);
  console.log(`   Belt: ${champ.beltLevel || 'N/A'}`);
  console.log(`   Stats: MEL ${champ.stats.MEL} | AGL ${champ.stats.AGL} | CON ${champ.stats.CON}`);
  console.log(`   HP: ${champ.maxHp}`);
  console.log(`   Rounds to Victory: ${result.rounds}`);

  console.log(`\n⏱️  Total Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`📊 Battles: ${numFighters - 1}`);

  // Analyze style performance
  analyzeResults(fighters, result.log);

  // Run a detailed battle with the champion
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              EXHIBITION MATCH (Detailed)                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Find a high-belt opponent
  const opponent = fighters.find(f =>
    f.id !== champ.id &&
    f.martialArtsStyle &&
    f.beltLevel &&
    f.beltLevel >= 5
  ) || fighters.find(f => f.id !== champ.id)!;

  const champCopy = { ...champ, team: 'blue' as const, hp: champ.maxHp, alive: true, ap: 4, position: { x: 1, y: 1 } };
  const oppCopy = { ...opponent, team: 'red' as const, hp: opponent.maxHp, alive: true, ap: 4, position: { x: 3, y: 1 } };

  console.log(`${champ.name} (${champ.martialArtsStyle || 'untrained'} B${champ.beltLevel || 0})`);
  console.log(`  vs`);
  console.log(`${opponent.name} (${opponent.martialArtsStyle || 'untrained'} B${opponent.beltLevel || 0})\n`);

  const detailedResult = runBattle([champCopy], [oppCopy], { maxRounds: 15 });

  console.log(`Winner: ${detailedResult.winner === 'blue' ? champ.name : opponent.name}`);
  console.log(`Rounds: ${detailedResult.rounds}`);
  console.log(`\nAttack Log:`);

  for (const attack of detailedResult.log.slice(0, 20)) {
    const attackName = attack.attackName || attack.weapon || 'Attack';
    const dmg = attack.finalDamage ?? attack.damage ?? 0;
    const status = attack.statusEffects?.length ? ` [${attack.statusEffects.join(', ')}]` : '';
    console.log(`  ${attackName}: ${attack.hitResult} for ${dmg} damage${status}`);
  }

  if (detailedResult.log.length > 20) {
    console.log(`  ... (${detailedResult.log.length - 20} more attacks)`);
  }

  console.log('\n=== BATTLE ROYALE COMPLETE ===');
}

// Run the battle royale
runBattleRoyale(200);

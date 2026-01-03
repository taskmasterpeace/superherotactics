/**
 * Combat Lab Tournament Runner
 *
 * 64-fighter tournament with NFL-style season + playoffs.
 * Tests all combat variables and provides balance analysis.
 */

import { runQuickBattle } from './battleRunner';
import { SimUnit } from './types';

// ============ STYLE DEFINITIONS ============

const STYLES = ['striking', 'grappling', 'submission', 'counter', 'internal'] as const;
type StyleId = typeof STYLES[number];

const STYLE_INFO: Record<StyleId, { name: string; role: string }> = {
  striking: { name: 'Striking', role: 'damage' },
  grappling: { name: 'Grappling', role: 'control' },
  submission: { name: 'Submission', role: 'finisher' },
  counter: { name: 'Counter', role: 'defense' },
  internal: { name: 'Internal', role: 'redirection' },
};

// ============ FIGHTER GENERATION ============

interface FighterStats {
  MEL: number;
  RNG: number;
  AGL: number;
  CON: number;
  INS: number;
  WIL: number;
  INT: number;
}

interface Fighter {
  id: string;
  name: string;
  style: StyleId;
  belt: number;
  stats: FighterStats;
  wins: number;
  losses: number;
  draws: number;
  damageDealt: number;
  damageTaken: number;
  knockouts: number;
}

// Name generator
const FIRST_NAMES = [
  'Alex', 'Blake', 'Casey', 'Dana', 'Ellis', 'Flynn', 'Gray', 'Harper',
  'Ivan', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Noel', 'Owen', 'Parker',
  'Quinn', 'Riley', 'Sam', 'Taylor', 'Uri', 'Val', 'West', 'Xander',
  'Yuki', 'Zane', 'Ash', 'Brook', 'Cruz', 'Drew', 'Ember', 'Frost',
  'Gage', 'Haven', 'Indigo', 'Jett', 'Knox', 'Lake', 'Maddox', 'Nash',
  'Onyx', 'Phoenix', 'Reign', 'Sage', 'Tate', 'Urban', 'Valor', 'Wren',
  'Xeno', 'York', 'Zen', 'Arrow', 'Blaze', 'Crane', 'Dusk', 'Echo',
  'Flint', 'Ghost', 'Hawk', 'Iron', 'Jade', 'Koda', 'Lynx', 'Mars'
];

const LAST_NAMES = [
  'Steel', 'Stone', 'Storm', 'Swift', 'Shadow', 'Blade', 'Wolf', 'Hawk',
  'Viper', 'Dragon', 'Thunder', 'Frost', 'Fire', 'Ice', 'Night', 'Dawn',
  'Raven', 'Crow', 'Fox', 'Bear', 'Tiger', 'Lion', 'Eagle', 'Falcon',
  'Striker', 'Hunter', 'Warrior', 'Fighter', 'Champion', 'Master', 'Knight', 'King'
];

function randomName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / 2) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Belt distribution (realistic pyramid)
function generateBelt(): number {
  const roll = Math.random();
  if (roll < 0.25) return 1;       // 25% white
  if (roll < 0.45) return 2;       // 20% yellow
  if (roll < 0.60) return 3;       // 15% orange
  if (roll < 0.72) return 4;       // 12% green
  if (roll < 0.82) return 5;       // 10% blue
  if (roll < 0.90) return 6;       // 8% purple
  if (roll < 0.95) return 7;       // 5% brown
  if (roll < 0.98) return 8;       // 3% red
  if (roll < 0.995) return 9;      // 1.5% black I
  return 10;                        // 0.5% black II
}

// Stats correlate with belt level
function generateStats(belt: number): FighterStats {
  // Base level scales with belt: 12 at belt 1, 28 at belt 10
  const baseLevel = 10 + belt * 2;
  const variance = 4;

  return {
    MEL: Math.max(8, Math.min(35, baseLevel + randomInt(-variance, variance))),
    RNG: Math.max(8, Math.min(35, baseLevel + randomInt(-variance - 2, variance - 2))), // Lower RNG for martial artists
    AGL: Math.max(8, Math.min(35, baseLevel + randomInt(-variance, variance))),
    CON: Math.max(8, Math.min(35, baseLevel + randomInt(-variance, variance))),
    INS: Math.max(8, Math.min(35, baseLevel + randomInt(-variance, variance))),
    WIL: Math.max(8, Math.min(35, baseLevel + randomInt(-variance, variance))),
    INT: Math.max(8, Math.min(35, baseLevel + randomInt(-variance, variance))),
  };
}

function generateFighter(index: number): Fighter {
  const belt = generateBelt();
  const style = STYLES[index % STYLES.length]; // Distribute styles evenly

  return {
    id: `fighter_${index}`,
    name: randomName(index),
    style,
    belt,
    stats: generateStats(belt),
    wins: 0,
    losses: 0,
    draws: 0,
    damageDealt: 0,
    damageTaken: 0,
    knockouts: 0,
  };
}

function fighterToSimUnit(fighter: Fighter, team: 'blue' | 'red', pos: { x: number; y: number }): SimUnit {
  const hp = 50 + fighter.stats.CON * 2;
  return {
    id: fighter.id,
    name: fighter.name,
    team,
    hp,
    maxHp: hp,
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 0,
    stoppingPower: 0,
    stats: fighter.stats,
    weapon: {
      name: 'Fists',
      damage: 4 + Math.floor(fighter.stats.MEL / 10),
      range: 1,
      damageType: 'blunt',
    },
    statusEffects: [],
    position: pos,
    facing: team === 'blue' ? 90 : 270,
    martialArtsStyle: fighter.style,
    beltLevel: fighter.belt,
  };
}

// ============ TOURNAMENT LOGIC ============

interface MatchResult {
  winner: Fighter;
  loser: Fighter;
  draw: boolean;
  rounds: number;
}

function runMatch(fighter1: Fighter, fighter2: Fighter): MatchResult {
  const unit1 = fighterToSimUnit(fighter1, 'blue', { x: 1, y: 1 });
  const unit2 = fighterToSimUnit(fighter2, 'red', { x: 2, y: 1 });

  const result = runQuickBattle([unit1], [unit2]);

  if (result.winner === 'blue') {
    return { winner: fighter1, loser: fighter2, draw: false, rounds: result.rounds };
  } else if (result.winner === 'red') {
    return { winner: fighter2, loser: fighter1, draw: false, rounds: result.rounds };
  } else {
    return { winner: fighter1, loser: fighter2, draw: true, rounds: result.rounds };
  }
}

function runSeasonMatch(fighter1: Fighter, fighter2: Fighter): 'f1' | 'f2' | 'draw' {
  const result = runMatch(fighter1, fighter2);

  if (result.draw) {
    fighter1.draws++;
    fighter2.draws++;
    return 'draw';
  } else {
    result.winner.wins++;
    result.winner.knockouts++;
    result.loser.losses++;
    return result.winner === fighter1 ? 'f1' : 'f2';
  }
}

// ============ ANALYSIS ============

interface TournamentAnalysis {
  totalFighters: number;
  totalMatches: number;

  // Style analysis
  styleWinRates: Record<StyleId, { wins: number; losses: number; winRate: number }>;

  // Belt analysis
  beltWinRates: Record<number, { wins: number; losses: number; winRate: number }>;

  // Top performers
  topFighters: Fighter[];

  // Style matchup matrix
  styleMatchups: Record<StyleId, Record<StyleId, number>>;
}

function analyzeResults(fighters: Fighter[], matchups: Map<string, { wins: number; losses: number }>): TournamentAnalysis {
  // Style win rates
  const styleWinRates: Record<StyleId, { wins: number; losses: number; winRate: number }> = {} as any;
  for (const style of STYLES) {
    const styleFighters = fighters.filter(f => f.style === style);
    const wins = styleFighters.reduce((sum, f) => sum + f.wins, 0);
    const losses = styleFighters.reduce((sum, f) => sum + f.losses, 0);
    const total = wins + losses;
    styleWinRates[style] = { wins, losses, winRate: total > 0 ? wins / total : 0 };
  }

  // Belt win rates
  const beltWinRates: Record<number, { wins: number; losses: number; winRate: number }> = {};
  for (let belt = 1; belt <= 10; belt++) {
    const beltFighters = fighters.filter(f => f.belt === belt);
    const wins = beltFighters.reduce((sum, f) => sum + f.wins, 0);
    const losses = beltFighters.reduce((sum, f) => sum + f.losses, 0);
    const total = wins + losses;
    beltWinRates[belt] = { wins, losses, winRate: total > 0 ? wins / total : 0 };
  }

  // Top performers
  const topFighters = [...fighters]
    .sort((a, b) => {
      const aScore = a.wins * 3 + a.draws;
      const bScore = b.wins * 3 + b.draws;
      return bScore - aScore;
    })
    .slice(0, 10);

  // Style matchup matrix
  const styleMatchups: Record<StyleId, Record<StyleId, number>> = {} as any;
  for (const style1 of STYLES) {
    styleMatchups[style1] = {} as any;
    for (const style2 of STYLES) {
      const key1 = `${style1}_vs_${style2}`;
      const key2 = `${style2}_vs_${style1}`;
      const data1 = matchups.get(key1) || { wins: 0, losses: 0 };
      const data2 = matchups.get(key2) || { wins: 0, losses: 0 };
      const wins = data1.wins + data2.losses;
      const total = data1.wins + data1.losses + data2.wins + data2.losses;
      styleMatchups[style1][style2] = total > 0 ? wins / total : 0.5;
    }
  }

  const totalMatches = fighters.reduce((sum, f) => sum + f.wins + f.losses + f.draws, 0) / 2;

  return {
    totalFighters: fighters.length,
    totalMatches,
    styleWinRates,
    beltWinRates,
    topFighters,
    styleMatchups,
  };
}

// ============ MAIN TOURNAMENT ============

function runTournament(numFighters: number = 64, matchesPerPairing: number = 3): void {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           COMBAT LAB - 64 FIGHTER TOURNAMENT               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Generate fighters
  console.log(`Generating ${numFighters} fighters...`);
  const fighters: Fighter[] = [];
  for (let i = 0; i < numFighters; i++) {
    fighters.push(generateFighter(i));
  }

  // Show belt distribution
  const beltCounts: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) beltCounts[i] = 0;
  fighters.forEach(f => beltCounts[f.belt]++);
  console.log('\nBelt Distribution:');
  for (let belt = 1; belt <= 10; belt++) {
    const count = beltCounts[belt];
    const bar = '█'.repeat(count);
    console.log(`  Belt ${belt.toString().padStart(2)}: ${bar} (${count})`);
  }

  // Show style distribution
  const styleCounts: Record<StyleId, number> = {} as any;
  STYLES.forEach(s => styleCounts[s] = 0);
  fighters.forEach(f => styleCounts[f.style]++);
  console.log('\nStyle Distribution:');
  for (const style of STYLES) {
    console.log(`  ${STYLE_INFO[style].name.padEnd(12)}: ${styleCounts[style]} fighters`);
  }

  // Run round-robin tournament
  console.log(`\n${'─'.repeat(60)}`);
  console.log('Running Round-Robin Season...');
  console.log(`Each pairing fights ${matchesPerPairing} times.`);

  const matchups = new Map<string, { wins: number; losses: number }>();
  let matchCount = 0;
  const totalPairings = (numFighters * (numFighters - 1)) / 2;
  const totalMatches = totalPairings * matchesPerPairing;

  for (let i = 0; i < numFighters; i++) {
    for (let j = i + 1; j < numFighters; j++) {
      const f1 = fighters[i];
      const f2 = fighters[j];

      // Track style matchups
      const key = `${f1.style}_vs_${f2.style}`;
      if (!matchups.has(key)) {
        matchups.set(key, { wins: 0, losses: 0 });
      }

      // Run multiple matches per pairing
      for (let m = 0; m < matchesPerPairing; m++) {
        const matchResult = runSeasonMatch(f1, f2);
        matchCount++;

        // Update matchup stats
        const data = matchups.get(key)!;
        if (matchResult === 'f1') {
          data.wins++;  // f1.style wins against f2.style
        } else if (matchResult === 'f2') {
          data.losses++;  // f1.style loses to f2.style
        }

        // Progress update
        if (matchCount % 500 === 0) {
          const pct = Math.floor((matchCount / totalMatches) * 100);
          process.stdout.write(`\r  Progress: ${matchCount}/${totalMatches} matches (${pct}%)`);
        }
      }
    }
  }
  console.log(`\r  Completed: ${matchCount} matches                    `);

  // Analyze results
  console.log(`\n${'─'.repeat(60)}`);
  console.log('TOURNAMENT RESULTS');
  console.log('─'.repeat(60));

  const analysis = analyzeResults(fighters, matchups);

  // Style Win Rates
  console.log('\n📊 STYLE WIN RATES:');
  const sortedStyles = [...STYLES].sort((a, b) =>
    analysis.styleWinRates[b].winRate - analysis.styleWinRates[a].winRate
  );
  for (const style of sortedStyles) {
    const data = analysis.styleWinRates[style];
    const pct = (data.winRate * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(data.winRate * 20));
    console.log(`  ${STYLE_INFO[style].name.padEnd(12)} ${bar.padEnd(20)} ${pct}% (${data.wins}W-${data.losses}L)`);
  }

  // Belt Win Rates
  console.log('\n🥋 BELT WIN RATES:');
  for (let belt = 1; belt <= 10; belt++) {
    const data = analysis.beltWinRates[belt];
    if (data.wins + data.losses > 0) {
      const pct = (data.winRate * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(data.winRate * 20));
      console.log(`  Belt ${belt.toString().padStart(2)}: ${bar.padEnd(20)} ${pct}% (${data.wins}W-${data.losses}L)`);
    }
  }

  // Top 10 Fighters
  console.log('\n🏆 TOP 10 FIGHTERS:');
  console.log('  Rank  Name                    Style       Belt   W-L-D');
  console.log('  ' + '─'.repeat(56));
  analysis.topFighters.forEach((f, i) => {
    const rank = (i + 1).toString().padStart(2);
    const name = f.name.padEnd(22);
    const style = STYLE_INFO[f.style].name.padEnd(10);
    const belt = f.belt.toString().padStart(2);
    const record = `${f.wins}-${f.losses}-${f.draws}`;
    console.log(`  #${rank}  ${name} ${style} Belt ${belt}  ${record}`);
  });

  // Style Matchup Matrix
  console.log('\n⚔️  STYLE MATCHUP MATRIX (row vs column win%):');
  console.log('           ' + STYLES.map(s => STYLE_INFO[s].name.slice(0, 4).padStart(6)).join(''));
  for (const style1 of STYLES) {
    const row = STYLES.map(style2 => {
      const rate = analysis.styleMatchups[style1][style2];
      return (rate * 100).toFixed(0).padStart(6);
    }).join('');
    console.log(`  ${STYLE_INFO[style1].name.padEnd(10)} ${row}`);
  }

  // Research Questions
  console.log(`\n${'─'.repeat(60)}`);
  console.log('🔬 RESEARCH FINDINGS');
  console.log('─'.repeat(60));

  // Best style
  const bestStyle = sortedStyles[0];
  const worstStyle = sortedStyles[sortedStyles.length - 1];
  console.log(`\n1. Which style dominates?`);
  console.log(`   → ${STYLE_INFO[bestStyle].name} leads with ${(analysis.styleWinRates[bestStyle].winRate * 100).toFixed(1)}% win rate`);
  console.log(`   → ${STYLE_INFO[worstStyle].name} trails at ${(analysis.styleWinRates[worstStyle].winRate * 100).toFixed(1)}% win rate`);

  // Belt impact
  const lowBeltRate = analysis.beltWinRates[1]?.winRate || 0;
  const highBeltRate = analysis.beltWinRates[10]?.winRate || 0;
  console.log(`\n2. Does belt level matter?`);
  console.log(`   → Belt 1: ${(lowBeltRate * 100).toFixed(1)}% win rate`);
  console.log(`   → Belt 10: ${(highBeltRate * 100).toFixed(1)}% win rate`);
  console.log(`   → Belt gives ${((highBeltRate - lowBeltRate) * 100).toFixed(1)}% advantage`);

  // Top fighter analysis
  const champion = analysis.topFighters[0];
  console.log(`\n3. Champion Profile:`);
  console.log(`   → ${champion.name}`);
  console.log(`   → Style: ${STYLE_INFO[champion.style].name}, Belt: ${champion.belt}`);
  console.log(`   → MEL: ${champion.stats.MEL}, AGL: ${champion.stats.AGL}, CON: ${champion.stats.CON}`);
  console.log(`   → Record: ${champion.wins}W-${champion.losses}L-${champion.draws}D`);

  console.log('\n' + '═'.repeat(60));
  console.log('Tournament Complete!');
  console.log('═'.repeat(60));
}

// Run the tournament
runTournament(64, 3);

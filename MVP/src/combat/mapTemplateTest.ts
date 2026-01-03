/**
 * Map Template Test - Test all 18 map templates
 *
 * Run: npx tsx src/combat/mapTemplateTest.ts
 *
 * Tests:
 * - All templates load correctly
 * - Print ASCII visualization
 * - Run battles on each template
 * - Report which maps favor attackers vs defenders
 */

import { MAP_TEMPLATES } from '../data/mapTemplates';
import { parseMapTemplate } from './gridEngine';
import { printEmptyGrid, printGridWithInfo, getGridSummary } from './gridVisualizer';
import { runGridBattle } from './battleRunner';
import { createUnit, UNIT_PRESETS } from './humanPresets';
import { SimUnit } from './types';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

const BATTLES_PER_TEMPLATE = 20;
const TEAM_SIZE = 3;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createBalancedTeam(teamId: 'blue' | 'red', size: number): SimUnit[] {
  const team: SimUnit[] = [];
  // Use soldierRifle preset for balanced combat testing
  const preset = UNIT_PRESETS.soldierRifle;
  for (let i = 0; i < size; i++) {
    team.push(createUnit(preset, teamId, `${teamId}-${i}`));
  }
  return team;
}

// =============================================================================
// MAIN TEST
// =============================================================================

console.log('='.repeat(60));
console.log('MAP TEMPLATE TEST - Testing all 18 tactical maps');
console.log('='.repeat(60));
console.log('');

// Group templates by city type
const templatesByCity = new Map<string, typeof MAP_TEMPLATES>();
for (const template of MAP_TEMPLATES) {
  for (const cityType of template.cityTypes) {
    if (!templatesByCity.has(cityType)) {
      templatesByCity.set(cityType, []);
    }
    templatesByCity.get(cityType)!.push(template);
  }
}

console.log(`Found ${MAP_TEMPLATES.length} templates across ${templatesByCity.size} city types:`);
for (const [cityType, templates] of templatesByCity) {
  console.log(`  ${cityType}: ${templates.map(t => t.name).join(', ')}`);
}
console.log('');

// Test each template
const results: {
  templateId: string;
  name: string;
  cityTypes: string[];
  blueWins: number;
  redWins: number;
  draws: number;
  avgRounds: number;
}[] = [];

for (const template of MAP_TEMPLATES) {
  console.log('-'.repeat(60));
  console.log(`Testing: ${template.name} (${template.id})`);
  console.log(`City Types: ${template.cityTypes.join(', ')}`);
  console.log(`Description: ${template.description}`);
  console.log('');

  // Parse and display
  const map = parseMapTemplate(template);
  console.log(printEmptyGrid(map));
  console.log('');
  console.log(`Summary: ${getGridSummary(map)}`);
  console.log(`Entry Points: Blue=${template.entryPoints.filter(e => e.team === 'blue').length}, Red=${template.entryPoints.filter(e => e.team === 'red').length}`);
  console.log('');

  // Run battles
  let blueWins = 0;
  let redWins = 0;
  let draws = 0;
  let totalRounds = 0;

  for (let i = 0; i < BATTLES_PER_TEMPLATE; i++) {
    const blue = createBalancedTeam('blue', TEAM_SIZE);
    const red = createBalancedTeam('red', TEAM_SIZE);

    const result = runGridBattle(blue, red, {
      mapTemplate: template.id,
      maxRounds: 50,
    });

    if (result.winner === 'blue') blueWins++;
    else if (result.winner === 'red') redWins++;
    else draws++;

    totalRounds += result.rounds;
  }

  const avgRounds = totalRounds / BATTLES_PER_TEMPLATE;

  console.log(`Battle Results (${BATTLES_PER_TEMPLATE} battles, ${TEAM_SIZE}v${TEAM_SIZE}):`);
  console.log(`  Blue Wins: ${blueWins} (${(blueWins / BATTLES_PER_TEMPLATE * 100).toFixed(1)}%)`);
  console.log(`  Red Wins:  ${redWins} (${(redWins / BATTLES_PER_TEMPLATE * 100).toFixed(1)}%)`);
  console.log(`  Draws:     ${draws}`);
  console.log(`  Avg Rounds: ${avgRounds.toFixed(1)}`);

  // Analyze balance
  const bluePct = blueWins / BATTLES_PER_TEMPLATE * 100;
  if (bluePct > 60) {
    console.log(`  ⚠️  Map favors BLUE (attackers)`);
  } else if (bluePct < 40) {
    console.log(`  ⚠️  Map favors RED (defenders)`);
  } else {
    console.log(`  ✓ Map is balanced`);
  }

  results.push({
    templateId: template.id,
    name: template.name,
    cityTypes: template.cityTypes,
    blueWins,
    redWins,
    draws,
    avgRounds,
  });

  console.log('');
}

// =============================================================================
// SUMMARY
// =============================================================================

console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log('');

// Sort by blue win rate
results.sort((a, b) => {
  const aRate = a.blueWins / (a.blueWins + a.redWins + a.draws);
  const bRate = b.blueWins / (b.blueWins + b.redWins + b.draws);
  return bRate - aRate;
});

console.log('Templates by Blue Win Rate:');
console.log('');
console.log('Template                      | Blue   | Red    | Avg Rounds | Balance');
console.log('-'.repeat(75));

for (const r of results) {
  const total = r.blueWins + r.redWins + r.draws;
  const bluePct = (r.blueWins / total * 100).toFixed(1).padStart(5);
  const redPct = (r.redWins / total * 100).toFixed(1).padStart(5);
  const avg = r.avgRounds.toFixed(1).padStart(5);
  const name = r.name.slice(0, 28).padEnd(28);

  let balance = '✓ Balanced';
  const blueRate = r.blueWins / total * 100;
  if (blueRate > 60) balance = '⚠️ Blue+';
  else if (blueRate < 40) balance = '⚠️ Red+';

  console.log(`${name} | ${bluePct}% | ${redPct}% | ${avg}      | ${balance}`);
}

console.log('');
console.log('Test complete!');

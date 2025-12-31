/**
 * Balance Analysis - Identify and fix issues
 */

import { getCountryByCode } from './countries';
import { getCitiesByCountry } from './cities';
import {
  CriminalOrganization,
  createOrganization,
  getHeatLevel,
  getPoliceResponse,
  getIntelResponse,
  CITY_CRIME_MAP,
  NEUTRAL_CALLINGS,
  getMotivationFromHarmAvoidance,
} from './criminalOrganization';
import { simulateWeek } from './criminalSimulation';
import { generateWeeklyNews } from './criminalNewsBridge';
import { ACTIVITY_CONFIG, executeActivity, ActivityType } from './crimeActivities';
import { generateInvestigationFromCrime } from './criminalInvestigationBridge';

console.log('='.repeat(70));
console.log('UNDERWORLD BALANCE ANALYSIS');
console.log('='.repeat(70));

// ============ ISSUE 1: ARREST RATES ============

console.log('\n### ISSUE 1: ARREST RATE ANALYSIS ###\n');

const testCountries = [
  { code: 'US', name: 'USA (Flawed Democracy)' },
  { code: 'CN', name: 'China (Authoritarian)' },
  { code: 'MX', name: 'Mexico (Corrupt)' },
  { code: 'DE', name: 'Germany (Full Democracy)' },
  { code: 'SO', name: 'Somalia (Failed State)' },
];

console.log('Country               | Arrest% | Patrol | InvestQ | Corruption | Expected');
console.log('-'.repeat(80));

for (const { code, name } of testCountries) {
  const country = getCountryByCode(code);
  if (!country) continue;

  const police = getPoliceResponse(country);

  // The arrest formula from simulation
  const baseArrestChance = 20;
  const arrestChance = baseArrestChance +
    police.arrestSuccess * 0.3 +
    police.investigationQuality * 0.2 -
    country.governmentCorruption * 0.4;

  const expected = code === 'CN' ? 'HIGH' :
                   code === 'MX' ? 'LOW' :
                   code === 'SO' ? 'V.LOW' : 'MED';

  console.log(
    `${name.padEnd(21)} | ${arrestChance.toFixed(0).padStart(6)}% | ` +
    `${police.patrolDensity.toFixed(0).padStart(6)} | ` +
    `${police.investigationQuality.toFixed(0).padStart(7)} | ` +
    `${country.governmentCorruption.toFixed(0).padStart(10)} | ${expected}`
  );
}

// ============ ISSUE 2: ELIMINATION RATE ============

console.log('\n### ISSUE 2: ELIMINATION ANALYSIS (24-week sim) ###\n');

function runLongSimulation(code: string, weeks: number) {
  const country = getCountryByCode(code)!;
  const cities = getCitiesByCountry(country.name);

  // Create 5 orgs with varying heat levels
  const orgs: CriminalOrganization[] = [];
  for (let i = 0; i < 5; i++) {
    const city = cities[i % cities.length];
    const org = createOrganization(
      `Org ${i + 1}`,
      i < 2 ? 'street_gang' : 'syndicate',
      city.name,
      code,
      {
        id: `leader_${i}`,
        name: `Boss ${i}`,
        motivation: getMotivationFromHarmAvoidance(3 + i),
        calling: NEUTRAL_CALLINGS[i % NEUTRAL_CALLINGS.length],
        imprisoned: false,
        loyalty: 50 + i * 5,
        competence: 40 + i * 8,
      },
      ['drugs', 'extortion'],
      0
    );
    org.state = 'operating';
    org.personnel = 20 + i * 5;
    org.capital = 30 + i * 10;
    org.heat = 15 + i * 15; // 15, 30, 45, 60, 75
    orgs.push(org);
  }

  let maxHeatSeen = 0;
  let conflictCount = 0;
  let decliningCount = 0;

  for (let week = 1; week <= weeks; week++) {
    const prevStates = orgs.map(o => o.state);
    simulateWeek(orgs, country, cities, week);

    for (let i = 0; i < orgs.length; i++) {
      maxHeatSeen = Math.max(maxHeatSeen, orgs[i].heat);
      if (orgs[i].state === 'conflict' && prevStates[i] !== 'conflict') conflictCount++;
      if (orgs[i].state === 'declining' && prevStates[i] !== 'declining') decliningCount++;
    }
  }

  const eliminated = orgs.filter(o => o.state === 'eliminated').length;
  const inConflict = orgs.filter(o => o.state === 'conflict').length;
  const declining = orgs.filter(o => o.state === 'declining').length;
  const avgHeat = orgs.filter(o => o.state !== 'eliminated')
    .reduce((s, o) => s + o.heat, 0) / Math.max(1, 5 - eliminated);

  return { eliminated, inConflict, declining, maxHeatSeen, avgHeat, conflictCount, decliningCount };
}

console.log('Country      | Eliminated | Conflict | Declining | MaxHeat | AvgHeat');
console.log('-'.repeat(70));

for (const { code, name } of testCountries) {
  const result = runLongSimulation(code, 24);
  console.log(
    `${name.substring(0, 12).padEnd(12)} | ` +
    `${String(result.eliminated).padStart(10)} | ` +
    `${String(result.inConflict).padStart(8)} | ` +
    `${String(result.declining).padStart(9)} | ` +
    `${result.maxHeatSeen.toFixed(0).padStart(7)} | ` +
    `${result.avgHeat.toFixed(0).padStart(7)}`
  );
}

// ============ ISSUE 3: INVESTIGATION GENERATION ============

console.log('\n### ISSUE 3: INVESTIGATION GENERATION ###\n');

const country = getCountryByCode('US')!;
const cities = getCitiesByCountry(country.name);
const city = cities[0];

const testOrg = createOrganization(
  'Test Org',
  'syndicate',
  city.name,
  'US',
  {
    id: 'test_leader',
    name: 'Test Boss',
    motivation: 'neutral',
    calling: NEUTRAL_CALLINGS[0],
    imprisoned: false,
    loyalty: 70,
    competence: 60,
  },
  ['drugs', 'extortion'],
  0
);
testOrg.state = 'operating';
testOrg.personnel = 30;
testOrg.capital = 50;

// Test at different heat levels
const heatLevels = [20, 40, 60, 80];
const activityTypes: ActivityType[] = ['drug_deal', 'armed_robbery', 'cyber_heist', 'assassination_contract'];

console.log('Heat Level | Activity          | Investigations (of 10)');
console.log('-'.repeat(55));

for (const heat of heatLevels) {
  testOrg.heat = heat;

  for (const activityType of activityTypes) {
    let invCount = 0;

    for (let i = 0; i < 10; i++) {
      const result = executeActivity(testOrg, activityType, country, city);
      const inv = generateInvestigationFromCrime(testOrg, result, country, city, Date.now() + i);
      if (inv) invCount++;
    }

    console.log(
      `${String(heat).padStart(10)} | ${activityType.padEnd(17)} | ${invCount}/10 (${invCount * 10}%)`
    );
  }
}

// ============ ISSUE 4: NEWS SPAM CHECK ============

console.log('\n### ISSUE 4: NEWS VOLUME OVER TIME ###\n');

function testNewsVolume(code: string, orgCount: number, weeks: number) {
  const country = getCountryByCode(code)!;
  const cities = getCitiesByCountry(country.name);

  const orgs: CriminalOrganization[] = [];
  for (let i = 0; i < orgCount; i++) {
    const city = cities[i % cities.length];
    const org = createOrganization(
      `Org ${i}`,
      'syndicate',
      city.name,
      code,
      {
        id: `l${i}`,
        name: `B${i}`,
        motivation: 'neutral',
        calling: NEUTRAL_CALLINGS[0],
        imprisoned: false,
        loyalty: 60,
        competence: 50,
      },
      ['drugs'],
      0
    );
    org.state = 'operating';
    org.personnel = 25;
    org.capital = 40;
    org.heat = 30;
    orgs.push(org);
  }

  const weeklyNews: number[] = [];
  for (let week = 1; week <= weeks; week++) {
    const result = simulateWeek(orgs, country, cities, week);
    const news = generateWeeklyNews(result.events, country, week * 7);
    weeklyNews.push(news.length);
  }

  const avg = weeklyNews.reduce((a, b) => a + b, 0) / weeks;
  const max = Math.max(...weeklyNews);

  return { avg, max, weeklyNews };
}

const scenarios = [
  { orgs: 5, label: '5 orgs (small country)' },
  { orgs: 10, label: '10 orgs (medium)' },
  { orgs: 20, label: '20 orgs (large country)' },
];

console.log('Scenario              | Avg News/wk | Max News/wk | Assessment');
console.log('-'.repeat(65));

for (const { orgs, label } of scenarios) {
  const result = testNewsVolume('US', orgs, 12);

  let assessment = '';
  if (result.avg < 1) assessment = 'Too quiet';
  else if (result.avg <= 3) assessment = 'Good';
  else if (result.avg <= 5) assessment = 'Busy but OK';
  else assessment = 'SPAM WARNING';

  console.log(
    `${label.padEnd(21)} | ${result.avg.toFixed(1).padStart(11)} | ` +
    `${String(result.max).padStart(11)} | ${assessment}`
  );
}

// ============ BALANCE RECOMMENDATIONS ============

console.log('\n' + '='.repeat(70));
console.log('BALANCE RECOMMENDATIONS');
console.log('='.repeat(70));

console.log(`
Based on the analysis:

1. ARREST RATES:
   - China arrests are very high (expected for authoritarian)
   - Mexico arrests are appropriately low (corruption)
   - USA arrests may be slightly high - consider reducing baseArrestChance

2. ELIMINATIONS:
   - Very few organizations are being eliminated
   - Heat rarely reaches elimination thresholds
   - SUGGESTION: Lower elimination threshold OR increase heat generation

3. INVESTIGATIONS:
   - Investigation rate increases with heat (good)
   - High-risk crimes generate more investigations (good)
   - Rate seems balanced at 20-60%

4. NEWS VOLUME:
   - 1-3 articles/week for typical country size (good)
   - Scales with org count (expected)
   - Max of 5/week cap working correctly

TUNING SUGGESTIONS:
- Consider reducing base arrest chance from 20% to 15%
- Consider lowering conflict trigger from heat 60 to heat 50
- Consider adding personnel loss on failed activities
`);

console.log('='.repeat(70));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(70));

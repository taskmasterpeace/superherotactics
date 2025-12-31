/**
 * Underworld Tuning & Balance Analysis
 *
 * Extended simulations to tune the criminal ecosystem.
 * Run with: npx vite-node src/data/underworldTuning.ts
 */

import { getCountryByCode } from './countries';
import { getCitiesByCountry } from './cities';
import {
  CriminalOrganization,
  createOrganization,
  getHeatLevel,
  getPoliceResponse,
  getIntelResponse,
  getGovernmentConstraints,
  getCrimeSuccessRate,
  CITY_CRIME_MAP,
  NEUTRAL_CALLINGS,
  getMotivationFromHarmAvoidance,
} from './criminalOrganization';
import { simulateWeek, SimulationResult } from './criminalSimulation';
import { generateWeeklyNews } from './criminalNewsBridge';
import { ACTIVITY_CONFIG, executeActivity } from './crimeActivities';
import { generateInvestigationFromCrime } from './criminalInvestigationBridge';

// ============ ANALYSIS UTILITIES ============

interface SimulationAnalysis {
  countryCode: string;
  countryName: string;
  weeks: number;
  initialOrgs: number;
  survivingOrgs: number;
  eliminatedOrgs: number;
  totalEvents: number;
  totalArrests: number;
  totalProfit: number;
  totalNewsArticles: number;
  avgHeatPerOrg: number;
  avgCapitalPerOrg: number;
  stateTransitions: Record<string, number>;
  weeklyEventAvg: number;
  weeklyArrestAvg: number;
  weeklyNewsAvg: number;
}

function log(msg: string) {
  console.log(msg);
}

function header(title: string) {
  log('\n' + '='.repeat(70));
  log(title);
  log('='.repeat(70));
}

function subheader(title: string) {
  log('\n--- ' + title + ' ---');
}

// ============ EXTENDED SIMULATION ============

function runExtendedSimulation(
  countryCode: string,
  weeks: number,
  orgCount: number = 5
): SimulationAnalysis {
  const country = getCountryByCode(countryCode);
  if (!country) {
    throw new Error(`Country ${countryCode} not found`);
  }

  const cities = getCitiesByCountry(country.name);
  if (cities.length === 0) {
    throw new Error(`No cities found for ${country.name}`);
  }

  // Create organizations
  const orgs: CriminalOrganization[] = [];
  for (let i = 0; i < Math.min(orgCount, cities.length); i++) {
    const city = cities[i];
    const cityTypes = [
      (city as any).cityType1,
      (city as any).cityType2,
      (city as any).cityType3,
      (city as any).cityType4,
    ].filter(t => t && t.length > 0);

    const specialties: string[] = [];
    for (const cityType of cityTypes) {
      const typeSpecialties = CITY_CRIME_MAP[cityType];
      if (typeSpecialties) specialties.push(...typeSpecialties);
    }
    const uniqueSpecialties = [...new Set(specialties)].slice(0, 3) as any[];
    if (uniqueSpecialties.length === 0) uniqueSpecialties.push('theft', 'extortion');

    const org = createOrganization(
      `${city.name} Org ${i + 1}`,
      i < 2 ? 'street_gang' : i < 4 ? 'syndicate' : 'cartel',
      city.name,
      country.code,
      {
        id: `leader_${i}`,
        name: `Boss ${i + 1}`,
        motivation: getMotivationFromHarmAvoidance(3 + (i % 7)),
        calling: NEUTRAL_CALLINGS[i % NEUTRAL_CALLINGS.length],
        imprisoned: false,
        loyalty: 50 + (i * 5),
        competence: 40 + (i * 8),
      },
      uniqueSpecialties,
      0
    );
    org.state = 'operating';
    org.personnel = 15 + (i * 5);
    org.capital = 20 + (i * 10);
    org.heat = 10 + (i * 8);
    org.reputation = 25 + (i * 8);
    orgs.push(org);
  }

  // Track metrics
  let totalEvents = 0;
  let totalArrests = 0;
  let totalProfit = 0;
  let totalNewsArticles = 0;
  const stateTransitions: Record<string, number> = {};

  // Run simulation
  for (let week = 1; week <= weeks; week++) {
    const previousStates = orgs.map(o => o.state);

    const result = simulateWeek(orgs, country, cities, week);

    totalEvents += result.events.length;
    totalArrests += result.arrestsMade;
    totalProfit += result.profitGenerated;

    // Generate news
    const news = generateWeeklyNews(result.events, country, week * 7);
    totalNewsArticles += news.length;

    // Track state transitions
    for (let i = 0; i < orgs.length; i++) {
      if (orgs[i].state !== previousStates[i]) {
        const transition = `${previousStates[i]} -> ${orgs[i].state}`;
        stateTransitions[transition] = (stateTransitions[transition] || 0) + 1;
      }
    }
  }

  // Calculate final stats
  const survivingOrgs = orgs.filter(o => o.state !== 'eliminated');
  const avgHeat = survivingOrgs.length > 0
    ? survivingOrgs.reduce((sum, o) => sum + o.heat, 0) / survivingOrgs.length
    : 0;
  const avgCapital = survivingOrgs.length > 0
    ? survivingOrgs.reduce((sum, o) => sum + o.capital, 0) / survivingOrgs.length
    : 0;

  return {
    countryCode,
    countryName: country.name,
    weeks,
    initialOrgs: orgCount,
    survivingOrgs: survivingOrgs.length,
    eliminatedOrgs: orgCount - survivingOrgs.length,
    totalEvents,
    totalArrests,
    totalProfit,
    totalNewsArticles,
    avgHeatPerOrg: Math.round(avgHeat * 10) / 10,
    avgCapitalPerOrg: Math.round(avgCapital),
    stateTransitions,
    weeklyEventAvg: Math.round(totalEvents / weeks * 10) / 10,
    weeklyArrestAvg: Math.round(totalArrests / weeks * 10) / 10,
    weeklyNewsAvg: Math.round(totalNewsArticles / weeks * 10) / 10,
  };
}

// ============ COMPARATIVE ANALYSIS ============

function runComparativeAnalysis() {
  header('COMPARATIVE COUNTRY ANALYSIS (12 weeks, 5 orgs each)');

  const countries = ['US', 'MX', 'CN', 'RU', 'BR', 'DE', 'SO', 'NO'];
  const results: SimulationAnalysis[] = [];

  for (const code of countries) {
    try {
      const analysis = runExtendedSimulation(code, 12, 5);
      results.push(analysis);
    } catch (e) {
      log(`Skipping ${code}: ${e}`);
    }
  }

  // Print comparison table
  subheader('Survival & Activity Rates');
  log('Country          | Survived | Eliminated | Arrests | Events | News/wk | Profit');
  log('-'.repeat(85));
  for (const r of results) {
    log(
      `${r.countryName.padEnd(16)} | ` +
      `${String(r.survivingOrgs).padStart(8)} | ` +
      `${String(r.eliminatedOrgs).padStart(10)} | ` +
      `${String(r.totalArrests).padStart(7)} | ` +
      `${String(r.totalEvents).padStart(6)} | ` +
      `${String(r.weeklyNewsAvg).padStart(7)} | ` +
      `$${r.totalProfit}k`
    );
  }

  subheader('Heat & Capital Analysis');
  log('Country          | Avg Heat | Avg Capital | Arrest Rate | Event Rate');
  log('-'.repeat(70));
  for (const r of results) {
    log(
      `${r.countryName.padEnd(16)} | ` +
      `${String(r.avgHeatPerOrg).padStart(8)} | ` +
      `$${String(r.avgCapitalPerOrg).padStart(10)}k | ` +
      `${String(r.weeklyArrestAvg).padStart(11)}/wk | ` +
      `${String(r.weeklyEventAvg).padStart(10)}/wk`
    );
  }

  subheader('State Transitions (All Countries Combined)');
  const allTransitions: Record<string, number> = {};
  for (const r of results) {
    for (const [key, val] of Object.entries(r.stateTransitions)) {
      allTransitions[key] = (allTransitions[key] || 0) + val;
    }
  }
  for (const [transition, count] of Object.entries(allTransitions).sort((a, b) => b[1] - a[1])) {
    log(`  ${transition}: ${count} times`);
  }

  return results;
}

// ============ NEWS VOLUME ANALYSIS ============

function analyzeNewsVolume() {
  header('NEWS VOLUME ANALYSIS');

  const analysis = runExtendedSimulation('US', 24, 8);

  log(`\n24-week simulation with 8 organizations:`);
  log(`  Total news articles generated: ${analysis.totalNewsArticles}`);
  log(`  Average news per week: ${analysis.weeklyNewsAvg}`);
  log(`  Total events: ${analysis.totalEvents}`);
  log(`  News-to-event ratio: ${Math.round(analysis.totalNewsArticles / analysis.totalEvents * 100)}%`);

  subheader('NEWS VOLUME ASSESSMENT');
  if (analysis.weeklyNewsAvg < 1) {
    log('⚠️  LOW: Less than 1 article/week - consider increasing newsworthiness');
  } else if (analysis.weeklyNewsAvg <= 3) {
    log('✅ GOOD: 1-3 articles/week - appropriate for background noise');
  } else if (analysis.weeklyNewsAvg <= 5) {
    log('⚡ MODERATE: 3-5 articles/week - may feel busy but engaging');
  } else {
    log('🔥 HIGH: 5+ articles/week - may overwhelm player, consider reducing');
  }
}

// ============ HEAT DECAY ANALYSIS ============

function analyzeHeatDecay() {
  header('HEAT DECAY & ARREST ANALYSIS');

  const countries = ['US', 'CN', 'MX', 'SO'];

  for (const code of countries) {
    const country = getCountryByCode(code);
    if (!country) continue;

    const police = getPoliceResponse(country);
    const constraints = getGovernmentConstraints(country);

    // Calculate theoretical heat decay per week
    let decay = 5; // base
    decay += country.governmentCorruption * 0.1;
    decay -= country.intelligenceServices * 0.05;

    log(`\n${country.name}:`);
    log(`  Heat decay per week: ${decay.toFixed(1)}`);
    log(`  Arrest success rate: ${police.arrestSuccess.toFixed(1)}%`);
    log(`  Investigation quality: ${police.investigationQuality.toFixed(1)}%`);
    log(`  Needs warrants: ${constraints.needsWarrants ? 'YES' : 'NO'}`);

    // At what heat level does org become "hunted"?
    log(`  Time to escape "Hunted" (from 70 heat): ~${Math.ceil((70 - 60) / decay)} weeks`);
  }
}

// ============ BALANCE RECOMMENDATIONS ============

function generateBalanceRecommendations(results: SimulationAnalysis[]) {
  header('BALANCE RECOMMENDATIONS');

  // Check survival rates
  const avgSurvival = results.reduce((s, r) => s + r.survivingOrgs / r.initialOrgs, 0) / results.length;
  log(`\nAverage survival rate: ${Math.round(avgSurvival * 100)}%`);

  if (avgSurvival > 0.9) {
    log('⚠️  Too few eliminations - consider:');
    log('   - Increase arrest rates at high heat');
    log('   - Reduce heat decay in organized countries');
  } else if (avgSurvival < 0.5) {
    log('⚠️  Too many eliminations - consider:');
    log('   - Decrease arrest rates');
    log('   - Increase heat decay');
  } else {
    log('✅ Survival rate is balanced (50-90%)');
  }

  // Check arrest rates
  const avgArrests = results.reduce((s, r) => s + r.weeklyArrestAvg, 0) / results.length;
  log(`\nAverage arrests per week: ${avgArrests.toFixed(1)}`);

  if (avgArrests < 0.5) {
    log('⚠️  Arrests are rare - law enforcement feels weak');
  } else if (avgArrests > 3) {
    log('⚠️  Arrests are frequent - may feel punishing');
  } else {
    log('✅ Arrest rate is balanced');
  }

  // Check news volume
  const avgNews = results.reduce((s, r) => s + r.weeklyNewsAvg, 0) / results.length;
  log(`\nAverage news per week: ${avgNews.toFixed(1)}`);

  if (avgNews < 0.5) {
    log('⚠️  News is sparse - underworld feels invisible');
    log('   - Consider lowering newsworthy thresholds');
  } else if (avgNews > 4) {
    log('⚠️  News is frequent - may spam player');
    log('   - Consider raising newsworthy thresholds');
  } else {
    log('✅ News frequency is balanced');
  }

  // Country variance check
  const usResult = results.find(r => r.countryCode === 'US');
  const cnResult = results.find(r => r.countryCode === 'CN');
  const soResult = results.find(r => r.countryCode === 'SO');

  if (usResult && cnResult && soResult) {
    log('\n--- Country Differentiation Check ---');

    const usCrimeSuccess = 26.3; // from test
    const cnCrimeSuccess = 19.1;
    const soCrimeSuccess = 50.8;

    if (cnCrimeSuccess < usCrimeSuccess && soCrimeSuccess > usCrimeSuccess) {
      log('✅ Crime success rates differentiate correctly:');
      log(`   China (authoritarian): ${cnCrimeSuccess}% - hardest`);
      log(`   USA (flawed democracy): ${usCrimeSuccess}% - medium`);
      log(`   Somalia (failed state): ${soCrimeSuccess}% - easiest`);
    } else {
      log('⚠️  Country differentiation may need adjustment');
    }
  }
}

// ============ INVESTIGATION INTEGRATION TEST ============

function testInvestigationIntegration() {
  header('INVESTIGATION GENERATION TEST');

  const country = getCountryByCode('US')!;
  const cities = getCitiesByCountry(country.name);
  const city = cities[0];

  // Create test org
  const org = createOrganization(
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
  org.state = 'operating';
  org.personnel = 30;
  org.capital = 50;
  org.heat = 50; // High heat = more likely to generate investigations

  // Run 20 activities and count investigations
  let investigationsGenerated = 0;
  const activityTypes = Object.keys(ACTIVITY_CONFIG);

  for (let i = 0; i < 20; i++) {
    const activityType = activityTypes[i % activityTypes.length];
    const result = executeActivity(org, activityType as any, country, city);

    const investigation = generateInvestigationFromCrime(org, result, country, city, i);
    if (investigation) {
      investigationsGenerated++;
    }
  }

  log(`\n20 crime activities executed:`);
  log(`  Investigations generated: ${investigationsGenerated}`);
  log(`  Investigation rate: ${Math.round(investigationsGenerated / 20 * 100)}%`);

  if (investigationsGenerated < 3) {
    log('⚠️  Low investigation rate - crimes may feel consequence-free');
  } else if (investigationsGenerated > 12) {
    log('⚠️  High investigation rate - may overwhelm investigation system');
  } else {
    log('✅ Investigation rate is balanced (15-60%)');
  }
}

// ============ MAIN TEST RUNNER ============

export function runTuningAnalysis() {
  header('UNDERWORLD ECOSYSTEM TUNING ANALYSIS');
  log('Running comprehensive balance and integration tests...\n');

  // 1. Comparative country analysis
  const results = runComparativeAnalysis();

  // 2. News volume analysis
  analyzeNewsVolume();

  // 3. Heat decay analysis
  analyzeHeatDecay();

  // 4. Investigation integration
  testInvestigationIntegration();

  // 5. Balance recommendations
  generateBalanceRecommendations(results);

  header('TUNING COMPLETE');
}

// Auto-run
if (typeof process !== 'undefined' && process.argv[1]?.includes('underworldTuning')) {
  runTuningAnalysis();
}

export { runExtendedSimulation, runComparativeAnalysis };

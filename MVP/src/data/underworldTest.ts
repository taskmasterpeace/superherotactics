/**
 * Underworld Ecosystem Test
 *
 * Standalone test to verify the criminal organization simulation.
 * Run with: npx ts-node src/data/underworldTest.ts
 * Or import and call testUnderworldSystem() from browser console.
 */

import { getCountryByCode, getCountryByName } from './countries';
import { getCitiesByCountry } from './cities';
import {
  CriminalOrganization,
  createOrganization,
  getHeatLevel,
  getPoliceResponse,
  getIntelResponse,
  getGovernmentConstraints,
  getCrimeSuccessRate,
  canBribeAuthorities,
  CITY_CRIME_MAP,
  getMotivationFromHarmAvoidance,
  NEUTRAL_CALLINGS,
} from './criminalOrganization';
import { simulateWeek, SimulationResult } from './criminalSimulation';
import { generateWeeklyNews } from './criminalNewsBridge';

// ============ TEST UTILITIES ============

function log(msg: string) {
  console.log(msg);
}

function header(title: string) {
  log('\n' + '='.repeat(60));
  log(title);
  log('='.repeat(60));
}

function subheader(title: string) {
  log('\n--- ' + title + ' ---');
}

// ============ MAIN TEST ============

export function testUnderworldSystem() {
  header('UNDERWORLD ECOSYSTEM TEST');

  // Test with USA (Flawed Democracy, high law enforcement)
  testCountry('US');

  // Test with Mexico (Hybrid Regime, high corruption)
  testCountry('MX');

  // Test with China (Authoritarian, high surveillance)
  testCountry('CN');

  // Test with Somalia (Failed state)
  testCountry('SO');

  header('SIMULATION TEST');
  runSimulationTest('US', 4); // Run 4 weeks of simulation
}

function testCountry(countryCode: string) {
  const country = getCountryByCode(countryCode);
  if (!country) {
    log(`Country ${countryCode} not found!`);
    return;
  }

  header(`COUNTRY: ${country.name} (${countryCode})`);

  // Government constraints
  subheader('Government Constraints');
  const constraints = getGovernmentConstraints(country);
  log(`Government Type: ${country.governmentPerception}`);
  log(`Media Freedom: ${country.mediaFreedom}`);
  log(`Can Mass Surveil: ${constraints.canMassSurveil ? 'YES' : 'NO'}`);
  log(`Can Disappear: ${constraints.canDisappear ? 'YES' : 'NO'}`);
  log(`Can Torture: ${constraints.canTorture ? 'YES' : 'NO'}`);
  log(`Needs Warrants: ${constraints.needsWarrants ? 'YES' : 'NO'}`);

  // Police response
  subheader('Police Response');
  const police = getPoliceResponse(country);
  log(`Patrol Density: ${police.patrolDensity.toFixed(1)}%`);
  log(`Response Time: ${police.responseTime.toFixed(0)} minutes`);
  log(`Investigation Quality: ${police.investigationQuality.toFixed(1)}%`);
  log(`Arrest Success Rate: ${police.arrestSuccess.toFixed(1)}%`);

  // Intel response
  subheader('Intelligence Response');
  const intel = getIntelResponse(country);
  log(`Tracking Speed: ${intel.trackingSpeed.toFixed(1)}`);
  log(`Undercover Chance: ${intel.undercoverChance.toFixed(1)}%`);
  log(`Surveillance Level: ${intel.surveillanceLevel.toFixed(1)}`);
  log(`Informant Network: ${intel.informantNetwork.toFixed(1)}`);

  // Get cities
  const cities = getCitiesByCountry(country.name);
  log(`\nCities in country: ${cities.length}`);

  if (cities.length > 0) {
    const testCity = cities[0];
    subheader(`Test City: ${testCity.name}`);
    log(`Crime Index: ${testCity.crimeIndex}`);
    log(`Safety Index: ${testCity.safetyIndex}`);
    // Get city types (stored as cityType1, cityType2, etc.)
    const cityTypes = [testCity.cityType1, testCity.cityType2, testCity.cityType3, testCity.cityType4]
      .filter(t => t && t.length > 0);
    log(`City Types: ${cityTypes.join(', ') || 'None'}`);

    // Crime specialties for this city
    const specialties: string[] = [];
    for (const cityType of cityTypes) {
      const typeSpecialties = CITY_CRIME_MAP[cityType];
      if (typeSpecialties) {
        specialties.push(...typeSpecialties);
      }
    }
    log(`Available Crimes: ${[...new Set(specialties)].join(', ') || 'theft, extortion'}`);

    // Create a test organization
    subheader('Test Organization');
    const testOrg = createOrganization(
      'The Test Syndicate',
      'syndicate',
      testCity.name,
      country.code,
      {
        id: 'leader_test',
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
    testOrg.heat = 25;

    log(`Org: ${testOrg.name}`);
    log(`State: ${testOrg.state}`);
    log(`Personnel: ${testOrg.personnel}`);
    log(`Capital: ${testOrg.capital}`);
    log(`Heat: ${testOrg.heat} (${getHeatLevel(testOrg.heat).response})`);

    // Crime success rate
    const successRate = getCrimeSuccessRate(testOrg, country);
    log(`Crime Success Rate: ${successRate.toFixed(1)}%`);

    // Bribery test (run 10 times for average)
    let bribeSuccesses = 0;
    for (let i = 0; i < 10; i++) {
      if (canBribeAuthorities(country, testOrg)) {
        bribeSuccesses++;
      }
    }
    log(`Bribery Success Rate: ${bribeSuccesses * 10}% (10 trials)`);
  }
}

function runSimulationTest(countryCode: string, weeks: number) {
  const country = getCountryByCode(countryCode);
  if (!country) {
    log(`Country ${countryCode} not found!`);
    return;
  }

  const cities = getCitiesByCountry(country.name);
  if (cities.length === 0) {
    log(`No cities found for ${country.name}`);
    return;
  }

  subheader(`Simulating ${weeks} weeks in ${country.name}`);

  // Create initial organizations
  const orgs: CriminalOrganization[] = [];

  // Create 3 test organizations
  for (let i = 0; i < Math.min(3, cities.length); i++) {
    const city = cities[i];
    const org = createOrganization(
      `The ${city.name} ${['Syndicate', 'Cartel', 'Crew'][i]}`,
      'syndicate',
      city.name,
      country.code,
      {
        id: `leader_${i}`,
        name: `Boss ${i + 1}`,
        motivation: getMotivationFromHarmAvoidance(3 + i * 3),
        calling: NEUTRAL_CALLINGS[i % NEUTRAL_CALLINGS.length],
        imprisoned: false,
        loyalty: 60 + i * 10,
        competence: 50 + i * 10,
      },
      ['drugs', 'extortion', 'theft'].slice(0, 2 + i % 2) as any,
      0
    );
    org.state = 'operating';
    org.personnel = 20 + i * 10;
    org.capital = 30 + i * 15;
    org.heat = 10 + i * 15;
    org.reputation = 30 + i * 10;
    orgs.push(org);
  }

  log(`Created ${orgs.length} organizations:`);
  for (const org of orgs) {
    log(`  - ${org.name} (${org.headquarters}): ${org.personnel} personnel, ${org.heat} heat`);
  }

  // Run simulation
  let totalEvents = 0;
  let totalArrests = 0;
  let totalProfit = 0;

  for (let week = 1; week <= weeks; week++) {
    log(`\n[WEEK ${week}]`);

    const result = simulateWeek(orgs, country, cities, week);

    log(`  Activities: ${result.activitiesExecuted}`);
    log(`  Heat Generated: ${result.heatGenerated}`);
    log(`  Profit: $${result.profitGenerated}k`);
    log(`  Arrests: ${result.arrestsMade}`);
    log(`  Events: ${result.events.length}`);

    totalEvents += result.events.length;
    totalArrests += result.arrestsMade;
    totalProfit += result.profitGenerated;

    // Show important events
    for (const event of result.events) {
      if (event.newsworthy) {
        log(`  📰 ${event.headline || event.description}`);
      }
    }

    // Show org status
    for (const org of orgs) {
      if (org.state !== 'eliminated') {
        const heatLevel = getHeatLevel(org.heat);
        log(`  ${org.name}: ${org.state} | P:${org.personnel} C:${org.capital} H:${org.heat}(${heatLevel.response})`);
      } else {
        log(`  ${org.name}: ☠️ ELIMINATED`);
      }
    }

    // Generate news for this week
    const news = generateWeeklyNews(result.events, country, week * 7);
    if (news.length > 0) {
      log(`  News Articles Generated: ${news.length}`);
      for (const article of news) {
        log(`    - [${article.source.name}] ${article.headline}`);
      }
    }
  }

  subheader('SIMULATION SUMMARY');
  log(`Total Weeks: ${weeks}`);
  log(`Total Events: ${totalEvents}`);
  log(`Total Arrests: ${totalArrests}`);
  log(`Total Profit: $${totalProfit}k`);

  const surviving = orgs.filter(o => o.state !== 'eliminated');
  log(`Surviving Organizations: ${surviving.length}/${orgs.length}`);

  for (const org of surviving) {
    log(`  ${org.name}: ${org.personnel} personnel, $${org.capital}k capital, ${org.heat} heat`);
  }
}

// ============ EXPORT FOR BROWSER CONSOLE ============

// Make available on window for browser testing
if (typeof window !== 'undefined') {
  (window as any).testUnderworldSystem = testUnderworldSystem;
  (window as any).testCountry = testCountry;
  (window as any).runSimulationTest = runSimulationTest;
}

// Auto-run when executed with vite-node or directly
// Check if running as main module (works with ESM)
const isMainModule = typeof process !== 'undefined' &&
  process.argv[1]?.includes('underworldTest');

if (isMainModule) {
  testUnderworldSystem();
}

export { testCountry, runSimulationTest };

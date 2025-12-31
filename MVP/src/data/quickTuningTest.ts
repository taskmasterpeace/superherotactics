/**
 * Quick tuning test - simpler version
 */

import { getCountryByCode } from './countries';
import { getCitiesByCountry } from './cities';
import {
  CriminalOrganization,
  createOrganization,
  CITY_CRIME_MAP,
  NEUTRAL_CALLINGS,
  getMotivationFromHarmAvoidance,
} from './criminalOrganization';
import { simulateWeek } from './criminalSimulation';
import { generateWeeklyNews } from './criminalNewsBridge';

console.log('=== QUICK TUNING TEST ===\n');

// Test countries
const countries = ['US', 'CN', 'MX', 'DE'];

for (const code of countries) {
  console.log(`\n--- Testing ${code} ---`);

  const country = getCountryByCode(code);
  if (!country) {
    console.log(`  Country not found: ${code}`);
    continue;
  }

  const cities = getCitiesByCountry(country.name);
  console.log(`  ${country.name}: ${cities.length} cities`);

  if (cities.length === 0) continue;

  // Create 3 orgs
  const orgs: CriminalOrganization[] = [];
  for (let i = 0; i < Math.min(3, cities.length); i++) {
    const city = cities[i];
    const org = createOrganization(
      `${city.name} Gang`,
      'syndicate',
      city.name,
      code,
      {
        id: `leader_${i}`,
        name: `Boss ${i}`,
        motivation: 'neutral',
        calling: NEUTRAL_CALLINGS[0],
        imprisoned: false,
        loyalty: 60,
        competence: 50,
      },
      ['drugs', 'extortion'],
      0
    );
    org.state = 'operating';
    org.personnel = 25;
    org.capital = 40;
    org.heat = 20;
    orgs.push(org);
  }

  console.log(`  Created ${orgs.length} organizations`);

  // Run 8 weeks
  let totalEvents = 0;
  let totalArrests = 0;
  let totalNews = 0;

  for (let week = 1; week <= 8; week++) {
    const result = simulateWeek(orgs, country, cities, week);
    totalEvents += result.events.length;
    totalArrests += result.arrestsMade;

    const news = generateWeeklyNews(result.events, country, week * 7);
    totalNews += news.length;
  }

  const surviving = orgs.filter(o => o.state !== 'eliminated').length;

  console.log(`  8-week results:`);
  console.log(`    Surviving: ${surviving}/${orgs.length}`);
  console.log(`    Events: ${totalEvents} (${(totalEvents/8).toFixed(1)}/wk)`);
  console.log(`    Arrests: ${totalArrests} (${(totalArrests/8).toFixed(1)}/wk)`);
  console.log(`    News: ${totalNews} (${(totalNews/8).toFixed(1)}/wk)`);
}

console.log('\n=== TEST COMPLETE ===');

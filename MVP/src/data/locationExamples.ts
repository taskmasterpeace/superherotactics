/**
 * Location Effects Examples
 * Demonstrating how Country cascades into City
 */

import { getCountryByName, getCountryByCode } from './countries';
import { getCityByName, cities } from './cities';
import { getLocationContext, compareLocations, LocationContext } from './locationEffects';

// ============================================================================
// EXAMPLE: Same city type, different countries
// ============================================================================

export function demonstrateCountryDifferences() {
  console.log('='.repeat(80));
  console.log('COUNTRY EFFECTS DEMONSTRATION');
  console.log('How the same city TYPE plays differently based on COUNTRY');
  console.log('='.repeat(80));

  // Get some representative cities
  const examples = [
    { city: 'Washington D.C.', countryCode: 'US' },
    { city: 'Kabul', countryCode: 'AF' },
    { city: 'Tokyo', countryCode: 'JP' },
    { city: 'Lagos', countryCode: 'NG' },
    { city: 'Moscow', countryCode: 'RU' },
    { city: 'Mogadishu', countryCode: 'SO' },
  ];

  examples.forEach(ex => {
    const city = getCityByName(ex.city);
    const country = getCountryByCode(ex.countryCode);

    if (!city || !country) {
      console.log(`Could not find ${ex.city} or ${ex.countryCode}`);
      return;
    }

    const context = getLocationContext(city, country);
    printLocationSummary(context, city, country);
  });
}

function printLocationSummary(context: LocationContext, city: any, country: any) {
  console.log('\n' + '-'.repeat(60));
  console.log(`📍 ${city.name}, ${country.name}`);
  console.log(`   Types: ${[city.cityType1, city.cityType2, city.cityType3, city.cityType4].filter(t => t).join(', ') || 'None'}`);
  console.log(`   Population: ${city.populationType} (${city.population.toLocaleString()})`);
  console.log('-'.repeat(60));

  // Country effects
  console.log('\n🏛️  COUNTRY EFFECTS:');
  console.log(`   Government: ${country.governmentPerception}`);
  console.log(`   Corruption: ${country.governmentCorruption}/100`);
  console.log(`   LSW Status: ${country.lswRegulations}`);
  console.log(`   Military: ${country.militaryServices}/100 → ${context.country.enemies.militaryQuality} quality`);
  console.log(`   Police: ${country.lawEnforcement}/100 → ${context.country.enemies.policeQuality} quality`);
  console.log(`   Equipment Tier: ${context.country.enemies.equipmentTier}/4`);

  // Starting standings
  console.log('\n👥 STARTING FACTION STANDINGS:');
  Object.entries(context.country.factionStandings).forEach(([faction, standing]) => {
    const label = standing > 0 ? '✅' : standing < 0 ? '❌' : '⚪';
    console.log(`   ${label} ${faction}: ${standing > 0 ? '+' : ''}${standing}`);
  });

  // Prices
  console.log('\n💰 PRICE MULTIPLIERS:');
  console.log(`   Weapons: ${Math.round(context.final.weaponPriceMultiplier * 100)}%`);
  console.log(`   Armor: ${Math.round(context.final.armorPriceMultiplier * 100)}%`);
  console.log(`   Tech: ${Math.round(context.final.techPriceMultiplier * 100)}%`);
  console.log(`   Bribes: $${context.final.bribeCost} base`);

  // Operations
  console.log('\n⚔️  OPERATIONAL CONDITIONS:');
  console.log(`   Danger Rating: ${context.final.dangerRating}/10`);
  console.log(`   Surveillance: ${context.country.operations.surveillanceLevel}/100`);
  console.log(`   Police Response: ${context.final.policeResponseMinutes} minutes`);
  console.log(`   Can Bribe: ${context.final.canBribe ? 'Yes' : 'No'}`);
  console.log(`   Black Market: ${context.final.hasBlackMarket ? 'Available' : 'Not Available'}`);

  // City services
  console.log('\n🏪 AVAILABLE SERVICES:');
  console.log(`   Shops: ${context.city.availableServices.shops.slice(0, 4).join(', ')}${context.city.availableServices.shops.length > 4 ? '...' : ''}`);
  console.log(`   Missions: ${context.city.availableServices.missions.slice(0, 4).join(', ')}${context.city.availableServices.missions.length > 4 ? '...' : ''}`);

  // Crime
  console.log('\n🔫 CRIME ENVIRONMENT:');
  console.log(`   Crime Index: ${city.crimeIndex}/100`);
  console.log(`   Gang Presence: ${context.city.crime.gangPresence}`);
  console.log(`   Police Presence: ${context.city.crime.policePresence}`);
  console.log(`   Encounter Chance: ${context.city.encounters.patrolEncounterChance}% per hour`);
  console.log(`   Average Enemies: ${context.city.encounters.averageEnemyCount}`);
}

// ============================================================================
// COMPARISON: Military cities across different countries
// ============================================================================

export function compareMilitaryCities() {
  console.log('\n' + '='.repeat(80));
  console.log('MILITARY CITY COMPARISON');
  console.log('Same city type, different countries = different gameplay');
  console.log('='.repeat(80));

  // Find military cities in different countries
  const militaryCities = cities.filter(c =>
    c.cityType1 === 'Military' || c.cityType2 === 'Military'
  );

  // Group by country
  const byCountry: Record<string, typeof militaryCities> = {};
  militaryCities.forEach(city => {
    if (!byCountry[city.countryIso]) byCountry[city.countryIso] = [];
    byCountry[city.countryIso].push(city);
  });

  // Pick representative countries
  const representativeCountries = ['US', 'RU', 'CN', 'NG', 'AF', 'JP', 'DE', 'BR'];

  console.log('\nMILITARY CITY EQUIPMENT TIERS:');
  console.log('(Same "Military" city type, but equipment quality varies by country)\n');

  representativeCountries.forEach(code => {
    const country = getCountryByCode(code);
    const citiesInCountry = byCountry[code];

    if (!country || !citiesInCountry?.length) return;

    const city = citiesInCountry[0];
    const context = getLocationContext(city, country);

    const tierLabel = ['', '⚫ Tier 1 (Rusty AKs, old surplus)', '🟤 Tier 2 (Standard military)', '🟡 Tier 3 (Modern equipment)', '🟢 Tier 4 (Cutting edge)'][context.country.enemies.equipmentTier];

    console.log(`${country.name.padEnd(20)} | ${city.name.padEnd(25)} | ${tierLabel}`);
    console.log(`${''.padEnd(20)} | Weapon Price: ${Math.round(context.final.weaponPriceMultiplier * 100)}% | Enemy: ${context.country.enemies.militaryQuality}`);
    console.log('');
  });
}

// ============================================================================
// COMPARISON: High crime vs low crime cities
// ============================================================================

export function compareCrimeEnvironments() {
  console.log('\n' + '='.repeat(80));
  console.log('CRIME ENVIRONMENT COMPARISON');
  console.log('='.repeat(80));

  // Find extremes
  const sortedByCrime = [...cities].sort((a, b) => b.crimeIndex - a.crimeIndex);

  const highCrime = sortedByCrime.slice(0, 3);
  const lowCrime = sortedByCrime.slice(-3).reverse();

  console.log('\n🔴 HIGHEST CRIME CITIES:');
  highCrime.forEach(city => {
    const country = getCountryByCode(city.countryIso);
    if (!country) return;

    const context = getLocationContext(city, country);
    console.log(`\n${city.name}, ${country.name} (Crime: ${city.crimeIndex})`);
    console.log(`  Gang Presence: ${context.city.crime.gangPresence}`);
    console.log(`  Encounter Chance: ${context.city.encounters.patrolEncounterChance}% per hour`);
    console.log(`  Enemy Types: ${context.city.encounters.enemyTypes.join(', ')}`);
    console.log(`  Black Market: ${context.final.hasBlackMarket ? 'YES' : 'No'}`);
  });

  console.log('\n🟢 LOWEST CRIME CITIES:');
  lowCrime.forEach(city => {
    const country = getCountryByCode(city.countryIso);
    if (!country) return;

    const context = getLocationContext(city, country);
    console.log(`\n${city.name}, ${country.name} (Crime: ${city.crimeIndex})`);
    console.log(`  Gang Presence: ${context.city.crime.gangPresence}`);
    console.log(`  Encounter Chance: ${context.city.encounters.patrolEncounterChance}% per hour`);
    console.log(`  Police Presence: ${context.city.crime.policePresence}`);
    console.log(`  Black Market: ${context.final.hasBlackMarket ? 'YES' : 'No'}`);
  });
}

// ============================================================================
// GAMEPLAY SCENARIOS
// ============================================================================

export function getGameplayScenarios() {
  return {
    // When you want cheap weapons
    cheapWeapons: findBestLocationsFor('weapons', 'cheap'),

    // When you want to lay low
    hideout: findBestLocationsFor('hideout', 'safe'),

    // When you want action
    action: findBestLocationsFor('combat', 'frequent'),

    // When you want black market access
    blackMarket: findBestLocationsFor('blackMarket', 'available'),
  };
}

function findBestLocationsFor(need: string, criteria: string): Array<{ city: string; country: string; score: number }> {
  const results: Array<{ city: string; country: string; score: number }> = [];

  // Sample cities (don't process all 1050)
  const sampleCities = cities.filter((_, i) => i % 10 === 0);

  sampleCities.forEach(city => {
    const country = getCountryByCode(city.countryIso);
    if (!country) return;

    const context = getLocationContext(city, country);
    let score = 0;

    switch (need) {
      case 'weapons':
        score = criteria === 'cheap' ? (200 - context.final.weaponPriceMultiplier * 100) : 0;
        break;
      case 'hideout':
        score = criteria === 'safe' ? (city.safetyIndex + (100 - context.country.operations.surveillanceLevel)) : 0;
        break;
      case 'combat':
        score = criteria === 'frequent' ? context.city.encounters.patrolEncounterChance * 2 : 0;
        break;
      case 'blackMarket':
        score = context.final.hasBlackMarket ? 100 : 0;
        break;
    }

    results.push({ city: city.name, country: country.name, score });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ============================================================================
// EXPORT A QUICK SUMMARY FUNCTION
// ============================================================================

export function getLocationSummary(cityName: string): string {
  const city = getCityByName(cityName);
  if (!city) return `City "${cityName}" not found`;

  const country = getCountryByCode(city.countryIso);
  if (!country) return `Country for "${cityName}" not found`;

  const context = getLocationContext(city, country);

  return `
📍 ${city.name}, ${country.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ Country: ${country.governmentPerception} | LSW: ${country.lswRegulations}
🔫 Crime: ${city.crimeIndex}/100 | Danger: ${context.final.dangerRating}/10
💰 Prices: Weapons ${Math.round(context.final.weaponPriceMultiplier * 100)}% | Tech ${Math.round(context.final.techPriceMultiplier * 100)}%
⚔️ Enemies: ${context.country.enemies.militaryQuality} (Tier ${context.country.enemies.equipmentTier})
🚔 Response: ${context.final.policeResponseMinutes} min | Surveillance: ${context.country.operations.surveillanceLevel}/100
🏪 Services: ${context.city.availableServices.shops.length} shops, ${context.city.availableServices.missions.length} mission types
`.trim();
}

// Run demo if executed directly
// demonstrateCountryDifferences();
// compareMilitaryCities();
// compareCrimeEnvironments();

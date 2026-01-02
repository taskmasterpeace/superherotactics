/**
 * Test Enemy Generation System
 *
 * Run with: npx ts-node --esm src/combat/testEnemyGeneration.ts
 * Or just import and run in browser console
 */

import { generateEnemySquad, debugGenerateReport, LocationContext } from './enemyGeneration';
import { getCountryByName } from '../data/countries';
import { getCitiesByCountry, getCityByName } from '../data/cities';

// Test countries with different military profiles
const TEST_CASES = [
  // High military, low corruption
  { country: 'Switzerland', city: 'Zurich' },
  // Low military, high corruption
  { country: 'Nigeria', city: 'Lagos' },
  // High military, high corruption
  { country: 'Russia', city: 'Moscow' },
  // Low everything
  { country: 'Haiti', city: 'Port-au-Prince' },
  // US - balanced
  { country: 'United States', city: 'Washington' },
];

export function runEnemyGenerationTests(): void {
  console.log('='.repeat(80));
  console.log('ENEMY GENERATION TEST SUITE');
  console.log('='.repeat(80));

  for (const testCase of TEST_CASES) {
    const country = getCountryByName(testCase.country);
    if (!country) {
      console.log(`\n❌ Country not found: ${testCase.country}`);
      continue;
    }

    const city = getCityByName(testCase.city);
    if (!city) {
      console.log(`\n❌ City not found: ${testCase.city}`);
      continue;
    }

    const context: LocationContext = {
      country,
      city,
      missionType: 'investigation'
    };

    console.log(debugGenerateReport(context));
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).testEnemyGeneration = runEnemyGenerationTests;
}

// Run if executed directly
// runEnemyGenerationTests();

/**
 * Mission Generation Demo
 * Demonstrates the mission generation system with example outputs
 */

import { generateMissionsForSector, getRecommendedMissions } from './missionGeneration';
import { getCountryByName } from './countries';
import { getCitiesBySector } from './allCities';

/**
 * Demo: Generate missions for a high-crime city
 */
export function demoHighCrimeCity() {
  console.log('='.repeat(80));
  console.log('DEMO: High Crime City - Rio de Janeiro, Brazil');
  console.log('='.repeat(80));

  const country = getCountryByName('Brazil');
  if (!country) {
    console.error('Brazil not found');
    return;
  }

  // Find Rio's sector (should be in the data)
  const rioCities = getCitiesBySector('O2');  // Example sector

  if (rioCities.length === 0) {
    console.log('No cities in sector O2');
    return;
  }

  const missions = generateMissionsForSector('O2', country);

  console.log(`\nCountry Stats:`);
  console.log(`- Corruption: ${country.governmentCorruption}`);
  console.log(`- Law Enforcement: ${country.lawEnforcement}`);
  console.log(`- Military Services: ${country.militaryServices}`);

  console.log(`\nCities in Sector:`);
  rioCities.forEach(city => {
    console.log(`- ${city.name} (Crime: ${city.crimeIndex}, Safety: ${city.safetyIndex})`);
  });

  console.log(`\nGenerated ${missions.length} missions:`);
  missions.forEach((mission, i) => {
    console.log(`\n${i + 1}. ${mission.template.name} [${mission.template.type}]`);
    console.log(`   City: ${mission.city}`);
    console.log(`   Difficulty: ${mission.difficulty}/5, Danger: ${mission.dangerLevel}/10`);
    console.log(`   Reward: $${mission.reward.toLocaleString()}, Fame: ${mission.fameReward}`);
    console.log(`   Squad: ${mission.template.minSquadSize}-${mission.template.maxSquadSize} members`);
    console.log(`   ${mission.briefing.substring(0, 100)}...`);
  });
}

/**
 * Demo: Generate missions for a political capital
 */
export function demoPoliticalCapital() {
  console.log('='.repeat(80));
  console.log('DEMO: Political Capital - Washington DC, USA');
  console.log('='.repeat(80));

  const country = getCountryByName('United States');
  if (!country) {
    console.error('United States not found');
    return;
  }

  // Washington DC sector
  const missions = generateMissionsForSector('K5', country);

  console.log(`\nCountry Stats:`);
  console.log(`- Military Services: ${country.militaryServices}`);
  console.log(`- Intelligence Services: ${country.intelligenceServices}`);
  console.log(`- Law Enforcement: ${country.lawEnforcement}`);
  console.log(`- GDP Per Capita: ${country.gdpPerCapita}`);

  console.log(`\nGenerated ${missions.length} missions:`);
  missions.forEach((mission, i) => {
    console.log(`\n${i + 1}. ${mission.template.name}`);
    console.log(`   Source: ${mission.template.source}`);
    console.log(`   Reward: $${mission.reward.toLocaleString()} (base: $${mission.template.baseReward.toLocaleString()})`);
    console.log(`   Fame: ${mission.fameReward} (base: ${mission.template.fameReward})`);
  });
}

/**
 * Demo: Generate missions for a military city
 */
export function demoMilitaryCity() {
  console.log('='.repeat(80));
  console.log('DEMO: Military City - High Military Budget Country');
  console.log('='.repeat(80));

  const country = getCountryByName('Israel');
  if (!country) {
    console.error('Israel not found');
    return;
  }

  const missions = generateMissionsForSector('M8', country);

  console.log(`\nCountry Military Stats:`);
  console.log(`- Military Services: ${country.militaryServices}`);
  console.log(`- Military Budget: ${country.militaryBudget}`);
  console.log(`- Intelligence Services: ${country.intelligenceServices}`);

  console.log(`\nGenerated ${missions.length} missions:`);
  missions.forEach((mission, i) => {
    console.log(`\n${i + 1}. ${mission.template.name}`);
    console.log(`   Type: ${mission.template.type}`);
    console.log(`   Enemies: ${mission.template.expectedEnemies.min}-${mission.template.expectedEnemies.max}`);
    console.log(`   Combat Required: ${mission.template.combatRequired ? 'Yes' : 'No'}`);
    console.log(`   Stealth Option: ${mission.template.stealthOption ? 'Yes' : 'No'}`);
  });
}

/**
 * Demo: Mission recommendations
 */
export function demoMissionRecommendations() {
  console.log('='.repeat(80));
  console.log('DEMO: Mission Recommendations');
  console.log('='.repeat(80));

  const country = getCountryByName('United States');
  if (!country) return;

  const missions = generateMissionsForSector('K5', country);

  // Simulate different squad compositions
  const scenarios = [
    { name: 'Rookie Squad', threatLevel: 1, squadSize: 4 },
    { name: 'Veteran Squad', threatLevel: 3, squadSize: 6 },
    { name: 'Elite Squad', threatLevel: 5, squadSize: 8 },
    { name: 'Solo Operative', threatLevel: 4, squadSize: 1 },
  ];

  scenarios.forEach(scenario => {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`Scenario: ${scenario.name}`);
    console.log(`Threat Level: ${scenario.threatLevel}, Squad Size: ${scenario.squadSize}`);
    console.log(`${'='.repeat(40)}`);

    const recommendations = getRecommendedMissions(missions, scenario.threatLevel, scenario.squadSize);

    recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`\n${i + 1}. ${rec.mission.template.name} - Suitability: ${rec.suitabilityScore}/100`);

      if (rec.advantages.length > 0) {
        console.log(`   ✓ Advantages:`);
        rec.advantages.forEach(adv => console.log(`     - ${adv}`));
      }

      if (rec.warnings.length > 0) {
        console.log(`   ⚠ Warnings:`);
        rec.warnings.forEach(warn => console.log(`     - ${warn}`));
      }
    });
  });
}

/**
 * Demo: Compare mission generation across different locations
 */
export function demoLocationComparison() {
  console.log('='.repeat(80));
  console.log('DEMO: Mission Generation Across Different Locations');
  console.log('='.repeat(80));

  const locations = [
    { country: 'United States', sector: 'K5', name: 'Washington DC' },
    { country: 'Somalia', sector: 'N9', name: 'Mogadishu' },
    { country: 'Japan', sector: 'Q6', name: 'Tokyo' },
    { country: 'Mexico', sector: 'G4', name: 'Mexico City' },
  ];

  locations.forEach(location => {
    const country = getCountryByName(location.country);
    if (!country) return;

    const missions = generateMissionsForSector(location.sector, country);

    console.log(`\n${'='.repeat(40)}`);
    console.log(`${location.name}, ${location.country}`);
    console.log(`${'='.repeat(40)}`);
    console.log(`Mission Count: ${missions.length}`);

    const missionTypes = missions.reduce((acc: any, m) => {
      acc[m.template.type] = (acc[m.template.type] || 0) + 1;
      return acc;
    }, {});

    console.log(`Mission Types:`);
    Object.entries(missionTypes).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    const avgReward = missions.reduce((sum, m) => sum + m.reward, 0) / missions.length;
    const avgDifficulty = missions.reduce((sum, m) => sum + m.difficulty, 0) / missions.length;
    const avgDanger = missions.reduce((sum, m) => sum + m.dangerLevel, 0) / missions.length;

    console.log(`Averages:`);
    console.log(`  - Reward: $${Math.round(avgReward).toLocaleString()}`);
    console.log(`  - Difficulty: ${avgDifficulty.toFixed(1)}/5`);
    console.log(`  - Danger: ${avgDanger.toFixed(1)}/10`);
  });
}

/**
 * Run all demos
 */
export function runAllDemos() {
  demoHighCrimeCity();
  console.log('\n');
  demoPoliticalCapital();
  console.log('\n');
  demoMilitaryCity();
  console.log('\n');
  demoMissionRecommendations();
  console.log('\n');
  demoLocationComparison();
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).missionDemo = {
    highCrime: demoHighCrimeCity,
    political: demoPoliticalCapital,
    military: demoMilitaryCity,
    recommendations: demoMissionRecommendations,
    comparison: demoLocationComparison,
    runAll: runAllDemos,
  };

  console.log('Mission generation demos available:');
  console.log('- window.missionDemo.highCrime()');
  console.log('- window.missionDemo.political()');
  console.log('- window.missionDemo.military()');
  console.log('- window.missionDemo.recommendations()');
  console.log('- window.missionDemo.comparison()');
  console.log('- window.missionDemo.runAll()');
}

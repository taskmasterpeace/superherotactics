/**
 * Criminal Simulation System
 *
 * Weekly simulation loop that drives the underworld ecosystem.
 * Simulates all criminal organizations in the player's country.
 */

import { Country } from './allCountries';
import { City, getCitiesByCountry } from './cities';
import {
  CriminalOrganization,
  OrgState,
  CrimeSpecialty,
  OrgLeader,
  OrgMotivation,
  createOrganization,
  canSpawnOrganization,
  getCrimeSuccessRate,
  canBribeAuthorities,
  calculateHeatDecay,
  transitionState,
  canTransitionTo,
  getPoliceResponse,
  getIntelResponse,
  getMilitaryResponse,
  getHeatLevel,
  CITY_CRIME_MAP,
  ORG_TYPE_CONFIG,
  NEUTRAL_CALLINGS,
  SELFISH_CALLINGS,
  SELFLESS_CALLINGS,
  getMotivationFromHarmAvoidance,
} from './criminalOrganization';
import {
  ActivityResult,
  executeActivity,
  selectActivitiesForOrg,
} from './crimeActivities';
import { CallingId } from './callingSystem';

// ============ SIMULATION STATE ============

export interface SimulationEvent {
  id: string;
  week: number;
  type: 'crime' | 'arrest' | 'conflict' | 'news' | 'state_change' | 'spawn' | 'eliminated';
  orgId: string;
  orgName: string;
  city: string;
  description: string;
  details: Record<string, unknown>;
  newsworthy: boolean;
  headline?: string;
}

export interface SimulationResult {
  week: number;
  orgsProcessed: number;
  activitiesExecuted: number;
  heatGenerated: number;
  profitGenerated: number;
  arrestsMade: number;
  orgsEliminated: number;
  orgsSpawned: number;
  events: SimulationEvent[];
}

// ============ WEEKLY SIMULATION ============

export function simulateWeek(
  organizations: CriminalOrganization[],
  playerCountry: Country,
  cities: City[],
  currentWeek: number
): SimulationResult {
  const result: SimulationResult = {
    week: currentWeek,
    orgsProcessed: 0,
    activitiesExecuted: 0,
    heatGenerated: 0,
    profitGenerated: 0,
    arrestsMade: 0,
    orgsEliminated: 0,
    orgsSpawned: 0,
    events: [],
  };

  // Process each organization
  for (const org of organizations) {
    if (org.state === 'eliminated') continue;

    result.orgsProcessed++;

    // Find the org's city
    const city = cities.find(c => c.name === org.headquarters);
    if (!city) continue;

    // 1. Update state machine
    const stateResult = updateOrganizationState(org, playerCountry, city, currentWeek);
    if (stateResult.event) {
      result.events.push(stateResult.event);
    }
    if (stateResult.eliminated) {
      result.orgsEliminated++;
      continue;
    }

    // 2. Execute activities if operating
    if (org.state === 'operating') {
      const activities = selectActivitiesForOrg(org, playerCountry, city);

      for (const activityType of activities) {
        const activityResult = executeActivity(org, activityType, playerCountry, city);
        result.activitiesExecuted++;
        result.heatGenerated += activityResult.heatGenerated;
        result.profitGenerated += activityResult.profitGenerated;
        result.arrestsMade += activityResult.personnelLost;

        // Apply results to org
        applyActivityResult(org, activityResult);

        // Generate event
        if (activityResult.newsworthy || !activityResult.success) {
          result.events.push(createActivityEvent(org, city, activityResult, currentWeek));
        }
      }
    }

    // 3. Decay heat
    const heatDecay = calculateHeatDecay(playerCountry);
    org.heat = Math.max(0, org.heat - heatDecay);

    // 4. Law enforcement response based on heat
    const lawResponse = processLawEnforcementResponse(org, playerCountry, city, currentWeek);
    if (lawResponse.event) {
      result.events.push(lawResponse.event);
      result.arrestsMade += lawResponse.arrests;
    }

    // 5. Check for rival conflicts
    const conflictResult = checkRivalConflicts(org, organizations, playerCountry, currentWeek);
    if (conflictResult.event) {
      result.events.push(conflictResult.event);
    }
  }

  // 6. Maybe spawn new organizations
  const spawnResult = maybeSpawnOrganization(organizations, playerCountry, cities, currentWeek);
  if (spawnResult.spawned) {
    result.orgsSpawned++;
    if (spawnResult.event) {
      result.events.push(spawnResult.event);
    }
  }

  return result;
}

// ============ STATE MACHINE UPDATE ============

function updateOrganizationState(
  org: CriminalOrganization,
  country: Country,
  city: City,
  currentWeek: number
): { event?: SimulationEvent; eliminated: boolean } {
  const oldState = org.state;

  switch (org.state) {
    case 'forming':
      // Check if ready to operate
      if (org.personnel >= 15 && org.capital >= 20 && canTransitionTo(org, 'operating', currentWeek)) {
        Object.assign(org, transitionState(org, 'operating', currentWeek));
        return {
          event: {
            id: `evt_${Date.now()}_${Math.random()}`,
            week: currentWeek,
            type: 'state_change',
            orgId: org.id,
            orgName: org.name,
            city: city.name,
            description: `${org.name} has become fully operational`,
            details: { from: oldState, to: 'operating' },
            newsworthy: true,
            headline: `New criminal organization emerges in ${city.name}`,
          },
          eliminated: false,
        };
      }
      // Check for early elimination
      if (org.personnel < 5 || org.heat > 70) {
        Object.assign(org, transitionState(org, 'eliminated', currentWeek));
        return {
          event: {
            id: `evt_${Date.now()}_${Math.random()}`,
            week: currentWeek,
            type: 'eliminated',
            orgId: org.id,
            orgName: org.name,
            city: city.name,
            description: `${org.name} has been dismantled before becoming operational`,
            details: { reason: org.personnel < 5 ? 'insufficient_personnel' : 'high_heat' },
            newsworthy: false,
          },
          eliminated: true,
        };
      }
      break;

    case 'operating':
      // Check for conflict trigger (lowered from 60 to 50 for more action)
      if (org.heat > 50 || (org.enemies.length > 0 && Math.random() > 0.7)) {
        if (canTransitionTo(org, 'conflict', currentWeek)) {
          Object.assign(org, transitionState(org, 'conflict', currentWeek));
          return {
            event: {
              id: `evt_${Date.now()}_${Math.random()}`,
              week: currentWeek,
              type: 'conflict',
              orgId: org.id,
              orgName: org.name,
              city: city.name,
              description: `${org.name} is under pressure from law enforcement`,
              details: { heat: org.heat, enemies: org.enemies },
              newsworthy: true,
              headline: `Authorities crack down on ${org.name}`,
            },
            eliminated: false,
          };
        }
      }
      break;

    case 'conflict':
      // Resolve conflict
      const successRate = getCrimeSuccessRate(org, country);
      const survives = Math.random() * 100 < successRate;

      if (survives && canTransitionTo(org, 'operating', currentWeek)) {
        Object.assign(org, transitionState(org, 'operating', currentWeek));
        return {
          event: {
            id: `evt_${Date.now()}_${Math.random()}`,
            week: currentWeek,
            type: 'state_change',
            orgId: org.id,
            orgName: org.name,
            city: city.name,
            description: `${org.name} has weathered the storm`,
            details: { from: 'conflict', to: 'operating' },
            newsworthy: false,
          },
          eliminated: false,
        };
      } else if (!survives && canTransitionTo(org, 'declining', currentWeek)) {
        Object.assign(org, transitionState(org, 'declining', currentWeek));
        return {
          event: {
            id: `evt_${Date.now()}_${Math.random()}`,
            week: currentWeek,
            type: 'state_change',
            orgId: org.id,
            orgName: org.name,
            city: city.name,
            description: `${org.name} is losing power`,
            details: { from: 'conflict', to: 'declining' },
            newsworthy: true,
            headline: `${org.name} weakened by law enforcement pressure`,
          },
          eliminated: false,
        };
      }
      break;

    case 'declining':
      // Check for recovery or elimination
      // Raised thresholds from 5 to 10, added time-based elimination chance
      const weeksDeclining = currentWeek - (org.stateEnteredAt || 0);
      const eliminationChance = (org.personnel < 10 ? 30 : 0) +
                                 (org.capital < 10 ? 30 : 0) +
                                 (org.leader.imprisoned ? 50 : 0) +
                                 (weeksDeclining > 4 ? 20 : 0); // Long decline = likely death

      if (org.personnel < 10 || org.capital < 10 || org.leader.imprisoned || Math.random() * 100 < eliminationChance) {
        Object.assign(org, transitionState(org, 'eliminated', currentWeek));
        return {
          event: {
            id: `evt_${Date.now()}_${Math.random()}`,
            week: currentWeek,
            type: 'eliminated',
            orgId: org.id,
            orgName: org.name,
            city: city.name,
            description: `${org.name} has been completely dismantled`,
            details: { reason: org.leader.imprisoned ? 'leader_arrested' : 'depleted_resources' },
            newsworthy: true,
            headline: `${org.name} falls: ${city.name} breathes easier`,
          },
          eliminated: true,
        };
      }
      // Check for recovery
      if (org.heat < 30 && org.personnel > 20 && org.capital > 30) {
        if (canTransitionTo(org, 'operating', currentWeek)) {
          Object.assign(org, transitionState(org, 'operating', currentWeek));
          return {
            event: {
              id: `evt_${Date.now()}_${Math.random()}`,
              week: currentWeek,
              type: 'state_change',
              orgId: org.id,
              orgName: org.name,
              city: city.name,
              description: `${org.name} has recovered and resumed operations`,
              details: { from: 'declining', to: 'operating' },
              newsworthy: true,
              headline: `${org.name} resurfaces in ${city.name}`,
            },
            eliminated: false,
          };
        }
      }
      break;
  }

  return { eliminated: false };
}

// ============ APPLY ACTIVITY RESULTS ============

function applyActivityResult(org: CriminalOrganization, result: ActivityResult): void {
  org.heat = Math.min(100, Math.max(0, org.heat + result.heatGenerated));
  org.capital = Math.max(0, org.capital + result.profitGenerated - result.capitalLost);
  org.personnel = Math.max(0, org.personnel - result.personnelLost);
  org.activeOperations++;
  org.totalProfit += Math.max(0, result.profitGenerated);
  org.totalHeatGenerated += Math.max(0, result.heatGenerated);

  if (!result.success) {
    org.arrestsMade += result.personnelLost;
    org.reputation = Math.max(0, org.reputation - 5);
  } else {
    org.reputation = Math.min(100, org.reputation + 2);
  }
}

// ============ CREATE ACTIVITY EVENT ============

function createActivityEvent(
  org: CriminalOrganization,
  city: City,
  result: ActivityResult,
  currentWeek: number
): SimulationEvent {
  return {
    id: `evt_${Date.now()}_${Math.random()}`,
    week: currentWeek,
    type: 'crime',
    orgId: org.id,
    orgName: org.name,
    city: city.name,
    description: result.success
      ? `${org.name} successfully completed ${result.activityType.replace(/_/g, ' ')}`
      : `${org.name}'s ${result.activityType.replace(/_/g, ' ')} was foiled`,
    details: {
      activityType: result.activityType,
      success: result.success,
      heatGenerated: result.heatGenerated,
      profitGenerated: result.profitGenerated,
      consequences: result.consequences,
    },
    newsworthy: result.newsworthy,
    headline: result.newsHeadline,
  };
}

// ============ LAW ENFORCEMENT RESPONSE ============

function processLawEnforcementResponse(
  org: CriminalOrganization,
  country: Country,
  city: City,
  currentWeek: number
): { event?: SimulationEvent; arrests: number } {
  const heatLevel = getHeatLevel(org.heat);
  const police = getPoliceResponse(country);
  const intel = getIntelResponse(country);

  let arrests = 0;

  // Active response at heat 41+
  if (org.heat > 40) {
    // Chance of raid
    const raidChance = (org.heat - 40) * 0.5 + police.investigationQuality * 0.3;

    if (Math.random() * 100 < raidChance) {
      // Raid happens - reduced from 5-15% to 3-10% personnel loss
      arrests = Math.floor(org.personnel * (0.03 + Math.random() * 0.07));
      org.personnel -= arrests;
      org.arrestsMade += arrests;

      // Bribery attempt
      if (org.capital > 20 && canBribeAuthorities(country, org)) {
        // Bribe works, reduce damage
        org.capital -= 15;
        arrests = Math.floor(arrests * 0.5);
        org.heat -= 10;
      }

      return {
        event: {
          id: `evt_${Date.now()}_${Math.random()}`,
          week: currentWeek,
          type: 'arrest',
          orgId: org.id,
          orgName: org.name,
          city: city.name,
          description: `Police raid ${org.name} operations, ${arrests} arrested`,
          details: { arrests, heatBefore: org.heat, policeQuality: police.investigationQuality },
          newsworthy: arrests > 3,
          headline: arrests > 5 ? `Major bust: ${arrests} arrested in ${city.name} raid` : undefined,
        },
        arrests,
      };
    }
  }

  // Military response at heat 80+
  const military = getMilitaryResponse(country, org);
  if (military && org.heat >= military.escalationThreshold) {
    // Military intervention is devastating
    const casualties = Math.floor(org.personnel * (0.2 + Math.random() * 0.3));
    org.personnel -= casualties;
    org.capital -= Math.floor(org.capital * 0.5);

    return {
      event: {
        id: `evt_${Date.now()}_${Math.random()}`,
        week: currentWeek,
        type: 'arrest',
        orgId: org.id,
        orgName: org.name,
        city: city.name,
        description: `Military forces assault ${org.name}, ${casualties} casualties`,
        details: { casualties, militaryForce: military.forceMultiplier },
        newsworthy: true,
        headline: `Military deployed against ${org.name} in ${city.name}`,
      },
      arrests: casualties,
    };
  }

  return { arrests: 0 };
}

// ============ RIVAL CONFLICTS ============

function checkRivalConflicts(
  org: CriminalOrganization,
  allOrgs: CriminalOrganization[],
  country: Country,
  currentWeek: number
): { event?: SimulationEvent } {
  // Check if org has active enemies
  const activeEnemies = allOrgs.filter(
    o => org.enemies.includes(o.id) && o.state === 'operating'
  );

  if (activeEnemies.length === 0) return {};

  // 10% chance of conflict per enemy per week
  for (const enemy of activeEnemies) {
    if (Math.random() < 0.1) {
      // Conflict!
      const ourStrength = org.personnel * (org.reputation / 100);
      const theirStrength = enemy.personnel * (enemy.reputation / 100);

      const weWin = ourStrength > theirStrength * (0.8 + Math.random() * 0.4);

      if (weWin) {
        enemy.personnel -= Math.floor(enemy.personnel * 0.1);
        enemy.territoryLost++;
        org.reputation += 5;
      } else {
        org.personnel -= Math.floor(org.personnel * 0.1);
        org.territoryLost++;
        enemy.reputation += 5;
      }

      // Both gain heat from fighting
      org.heat += 15;
      enemy.heat += 15;

      return {
        event: {
          id: `evt_${Date.now()}_${Math.random()}`,
          week: currentWeek,
          type: 'conflict',
          orgId: org.id,
          orgName: org.name,
          city: org.headquarters,
          description: `Gang war: ${org.name} clashes with ${enemy.name}`,
          details: { enemy: enemy.name, winner: weWin ? org.name : enemy.name },
          newsworthy: true,
          headline: `Gang violence erupts: ${org.name} vs ${enemy.name}`,
        },
      };
    }
  }

  return {};
}

// ============ SPAWN NEW ORGANIZATIONS ============

function maybeSpawnOrganization(
  existingOrgs: CriminalOrganization[],
  country: Country,
  cities: City[],
  currentWeek: number
): { spawned: boolean; org?: CriminalOrganization; event?: SimulationEvent } {
  // Only spawn if there's room (limit based on country size)
  const maxOrgs = Math.floor(cities.length / 5) + 3;
  const activeOrgs = existingOrgs.filter(o => o.state !== 'eliminated');

  if (activeOrgs.length >= maxOrgs) {
    return { spawned: false };
  }

  // Check each city for spawn conditions
  for (const city of cities) {
    // Skip cities that already have an org HQ
    if (activeOrgs.some(o => o.headquarters === city.name)) continue;

    if (canSpawnOrganization(city, country)) {
      // Spawn a new organization!
      const org = generateNewOrganization(city, country, currentWeek);

      return {
        spawned: true,
        org,
        event: {
          id: `evt_${Date.now()}_${Math.random()}`,
          week: currentWeek,
          type: 'spawn',
          orgId: org.id,
          orgName: org.name,
          city: city.name,
          description: `New criminal organization "${org.name}" forming in ${city.name}`,
          details: { type: org.type, specialties: org.specialties },
          newsworthy: false, // Hidden until they become operational
        },
      };
    }
  }

  return { spawned: false };
}

// ============ GENERATE NEW ORGANIZATION ============

function generateNewOrganization(
  city: City,
  country: Country,
  currentWeek: number
): CriminalOrganization {
  // Determine type based on city size
  const type = city.populationRating > 5 ? 'syndicate' : 'street_gang';

  // Generate name
  const name = generateOrgName(city, country);

  // Determine specialties from city types
  const specialties = getSpecialtiesForCity(city);

  // Generate leader
  const leader = generateLeader();

  return createOrganization(
    name,
    type,
    city.name,
    country.code,
    leader,
    specialties,
    currentWeek
  );
}

// ============ NAME GENERATORS ============

const ORG_NAME_PREFIXES = [
  'Black', 'Red', 'Golden', 'Iron', 'Silver', 'Shadow', 'Night', 'Dark', 'Blood',
  'Ghost', 'Crimson', 'Steel', 'Stone', 'Venom', 'Death', 'Silent', 'Jade', 'Scarlet',
];

const ORG_NAME_SUFFIXES = [
  'Dragons', 'Serpents', 'Wolves', 'Lions', 'Tigers', 'Eagles', 'Hawks', 'Vipers',
  'Cobras', 'Scorpions', 'Panthers', 'Jackals', 'Ravens', 'Sharks', 'Falcons',
  'Kings', 'Lords', 'Syndicate', 'Cartel', 'Crew', 'Familia', 'Brotherhood', 'Mafia',
];

function generateOrgName(city: City, country: Country): string {
  const prefix = ORG_NAME_PREFIXES[Math.floor(Math.random() * ORG_NAME_PREFIXES.length)];
  const suffix = ORG_NAME_SUFFIXES[Math.floor(Math.random() * ORG_NAME_SUFFIXES.length)];

  // Sometimes include city name
  if (Math.random() > 0.7) {
    return `The ${city.name} ${suffix}`;
  }

  return `The ${prefix} ${suffix}`;
}

// Helper to get city types from either format
function getCityTypes(city: City): string[] {
  // Handle both formats: cityTypes array or cityType1-4 fields
  if ('cityTypes' in city && Array.isArray((city as any).cityTypes)) {
    return (city as any).cityTypes;
  }
  return [
    (city as any).cityType1,
    (city as any).cityType2,
    (city as any).cityType3,
    (city as any).cityType4,
  ].filter(t => t && t.length > 0);
}

function getSpecialtiesForCity(city: City): CrimeSpecialty[] {
  const specialties: CrimeSpecialty[] = [];
  const cityTypes = getCityTypes(city);

  // Add specialties based on city types
  for (const cityType of cityTypes) {
    const typeSpecialties = CITY_CRIME_MAP[cityType];
    if (typeSpecialties) {
      // Add 1-2 specialties from this type
      const numToAdd = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numToAdd && i < typeSpecialties.length; i++) {
        const specialty = typeSpecialties[Math.floor(Math.random() * typeSpecialties.length)];
        if (!specialties.includes(specialty)) {
          specialties.push(specialty);
        }
      }
    }
  }

  // Ensure at least one specialty
  if (specialties.length === 0) {
    specialties.push('theft', 'extortion');
  }

  return specialties.slice(0, 3); // Max 3 specialties
}

function generateLeader(): OrgLeader {
  // Random harm avoidance determines motivation
  const harmAvoidance = 1 + Math.floor(Math.random() * 10);
  const motivation = getMotivationFromHarmAvoidance(harmAvoidance);

  // Pick calling based on motivation
  let callings: CallingId[];
  switch (motivation) {
    case 'selfless':
      callings = SELFLESS_CALLINGS;
      break;
    case 'selfish':
      callings = SELFISH_CALLINGS;
      break;
    default:
      callings = NEUTRAL_CALLINGS;
  }
  const calling = callings[Math.floor(Math.random() * callings.length)];

  // Generate name (simplified)
  const firstNames = ['Marco', 'Viktor', 'Chen', 'Alejandro', 'Dmitri', 'Yuki', 'Omar', 'Santos', 'Jin', 'Mikhail'];
  const lastNames = ['Rosetti', 'Volkov', 'Zhang', 'Morales', 'Petrov', 'Tanaka', 'Hassan', 'Silva', 'Park', 'Ivanov'];

  return {
    id: `leader_${Date.now()}_${Math.random()}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    motivation,
    calling,
    imprisoned: false,
    loyalty: 50 + Math.floor(Math.random() * 50),
    competence: 40 + Math.floor(Math.random() * 40),
  };
}

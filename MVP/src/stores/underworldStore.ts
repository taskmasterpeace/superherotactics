/**
 * Underworld Store
 *
 * Zustand store for managing the criminal underworld simulation.
 * Tracks all criminal organizations, events, and simulation state.
 */

import { create } from 'zustand';
import { Country, getCountryByCode } from '../data/allCountries';
import { City, getCitiesByCountry } from '../data/cities';
import {
  CriminalOrganization,
  OrgState,
  CrimeSpecialty,
} from '../data/criminalOrganization';
import {
  SimulationEvent,
  SimulationResult,
  simulateWeek,
} from '../data/criminalSimulation';

// ============ STORE STATE ============

export interface UnderworldState {
  // Core Data
  organizations: CriminalOrganization[];
  events: SimulationEvent[];
  playerCountryCode: string;

  // Simulation State
  isSimulating: boolean;
  lastSimulatedWeek: number;
  simulationSpeed: 'paused' | 'slow' | 'normal' | 'fast';
  totalSimulations: number;

  // Statistics
  stats: {
    totalOrgsSpawned: number;
    totalOrgsEliminated: number;
    totalCrimesCommitted: number;
    totalArrestsMade: number;
    totalHeatGenerated: number;
    totalProfitGenerated: number;
  };

  // Filters & UI State
  visibilityFilter: 'all' | 'operating' | 'conflict' | 'declining';
  selectedOrgId: string | null;
}

// ============ STORE ACTIONS ============

export interface UnderworldActions {
  // Initialization
  initializeUnderworld: (playerCountryCode: string) => void;

  // Simulation
  runSimulationWeek: (currentWeek: number) => SimulationResult | null;
  runMultipleWeeks: (currentWeek: number, numWeeks: number) => SimulationResult[];
  setSimulationSpeed: (speed: UnderworldState['simulationSpeed']) => void;

  // Organization Management
  addOrganization: (org: CriminalOrganization) => void;
  removeOrganization: (orgId: string) => void;
  getOrganization: (orgId: string) => CriminalOrganization | undefined;
  getOrganizationsByCity: (cityName: string) => CriminalOrganization[];
  getOrganizationsByState: (state: OrgState) => CriminalOrganization[];

  // Events
  addEvent: (event: SimulationEvent) => void;
  getRecentEvents: (limit: number) => SimulationEvent[];
  getEventsByOrg: (orgId: string) => SimulationEvent[];
  getNewsworthyEvents: () => SimulationEvent[];
  clearOldEvents: (beforeWeek: number) => void;

  // UI
  setVisibilityFilter: (filter: UnderworldState['visibilityFilter']) => void;
  selectOrganization: (orgId: string | null) => void;

  // Queries
  getActiveOrganizations: () => CriminalOrganization[];
  getTotalHeat: () => number;
  getMostWantedOrg: () => CriminalOrganization | undefined;
  getOrgCount: () => { total: number; byState: Record<OrgState, number> };
}

// ============ INITIAL STATE ============

const initialState: UnderworldState = {
  organizations: [],
  events: [],
  playerCountryCode: '',
  isSimulating: false,
  lastSimulatedWeek: 0,
  simulationSpeed: 'normal',
  totalSimulations: 0,
  stats: {
    totalOrgsSpawned: 0,
    totalOrgsEliminated: 0,
    totalCrimesCommitted: 0,
    totalArrestsMade: 0,
    totalHeatGenerated: 0,
    totalProfitGenerated: 0,
  },
  visibilityFilter: 'all',
  selectedOrgId: null,
};

// ============ STORE IMPLEMENTATION ============

export const useUnderworldStore = create<UnderworldState & UnderworldActions>((set, get) => ({
  ...initialState,

  // ============ INITIALIZATION ============

  initializeUnderworld: (playerCountryCode: string) => {
    const country = getCountryByCode(playerCountryCode);
    if (!country) {
      console.error(`Country not found: ${playerCountryCode}`);
      return;
    }

    const cities = getCitiesByCountry(country.name);

    // Generate initial organizations based on country conditions
    const initialOrgs = generateInitialOrganizations(country, cities);

    set({
      organizations: initialOrgs,
      events: [],
      playerCountryCode,
      isSimulating: false,
      lastSimulatedWeek: 0,
      totalSimulations: 0,
      stats: {
        totalOrgsSpawned: initialOrgs.length,
        totalOrgsEliminated: 0,
        totalCrimesCommitted: 0,
        totalArrestsMade: 0,
        totalHeatGenerated: 0,
        totalProfitGenerated: 0,
      },
    });
  },

  // ============ SIMULATION ============

  runSimulationWeek: (currentWeek: number) => {
    const state = get();

    // Don't run if already simulating
    if (state.isSimulating) return null;

    // Get country and cities
    const country = getCountryByCode(state.playerCountryCode);
    if (!country) return null;

    const cities = getCitiesByCountry(country.name);

    set({ isSimulating: true });

    // Run simulation
    const result = simulateWeek(
      state.organizations,
      country,
      cities,
      currentWeek
    );

    // Update state with results
    set((prev) => ({
      isSimulating: false,
      lastSimulatedWeek: currentWeek,
      totalSimulations: prev.totalSimulations + 1,
      events: [...prev.events, ...result.events].slice(-500), // Keep last 500 events
      stats: {
        totalOrgsSpawned: prev.stats.totalOrgsSpawned + result.orgsSpawned,
        totalOrgsEliminated: prev.stats.totalOrgsEliminated + result.orgsEliminated,
        totalCrimesCommitted: prev.stats.totalCrimesCommitted + result.activitiesExecuted,
        totalArrestsMade: prev.stats.totalArrestsMade + result.arrestsMade,
        totalHeatGenerated: prev.stats.totalHeatGenerated + result.heatGenerated,
        totalProfitGenerated: prev.stats.totalProfitGenerated + result.profitGenerated,
      },
    }));

    return result;
  },

  runMultipleWeeks: (currentWeek: number, numWeeks: number) => {
    const results: SimulationResult[] = [];

    for (let i = 0; i < numWeeks; i++) {
      const result = get().runSimulationWeek(currentWeek + i);
      if (result) {
        results.push(result);
      }
    }

    return results;
  },

  setSimulationSpeed: (speed) => {
    set({ simulationSpeed: speed });
  },

  // ============ ORGANIZATION MANAGEMENT ============

  addOrganization: (org) => {
    set((state) => ({
      organizations: [...state.organizations, org],
      stats: {
        ...state.stats,
        totalOrgsSpawned: state.stats.totalOrgsSpawned + 1,
      },
    }));
  },

  removeOrganization: (orgId) => {
    set((state) => ({
      organizations: state.organizations.filter((o) => o.id !== orgId),
    }));
  },

  getOrganization: (orgId) => {
    return get().organizations.find((o) => o.id === orgId);
  },

  getOrganizationsByCity: (cityName) => {
    return get().organizations.filter((o) => o.headquarters === cityName);
  },

  getOrganizationsByState: (state) => {
    return get().organizations.filter((o) => o.state === state);
  },

  // ============ EVENTS ============

  addEvent: (event) => {
    set((state) => ({
      events: [...state.events, event].slice(-500),
    }));
  },

  getRecentEvents: (limit) => {
    return get().events.slice(-limit);
  },

  getEventsByOrg: (orgId) => {
    return get().events.filter((e) => e.orgId === orgId);
  },

  getNewsworthyEvents: () => {
    return get().events.filter((e) => e.newsworthy);
  },

  clearOldEvents: (beforeWeek) => {
    set((state) => ({
      events: state.events.filter((e) => e.week >= beforeWeek),
    }));
  },

  // ============ UI ============

  setVisibilityFilter: (filter) => {
    set({ visibilityFilter: filter });
  },

  selectOrganization: (orgId) => {
    set({ selectedOrgId: orgId });
  },

  // ============ QUERIES ============

  getActiveOrganizations: () => {
    return get().organizations.filter((o) => o.state !== 'eliminated' && o.state !== 'dormant');
  },

  getTotalHeat: () => {
    return get()
      .organizations
      .filter((o) => o.state !== 'eliminated')
      .reduce((sum, o) => sum + o.heat, 0);
  },

  getMostWantedOrg: () => {
    const orgs = get().organizations.filter((o) => o.state !== 'eliminated');
    if (orgs.length === 0) return undefined;

    return orgs.reduce((max, org) => (org.heat > max.heat ? org : max), orgs[0]);
  },

  getOrgCount: () => {
    const orgs = get().organizations;
    const byState: Record<OrgState, number> = {
      dormant: 0,
      forming: 0,
      operating: 0,
      conflict: 0,
      declining: 0,
      eliminated: 0,
    };

    for (const org of orgs) {
      byState[org.state]++;
    }

    return {
      total: orgs.length,
      byState,
    };
  },
}));

// ============ HELPER: GENERATE INITIAL ORGANIZATIONS ============

function generateInitialOrganizations(
  country: Country,
  cities: City[]
): CriminalOrganization[] {
  const orgs: CriminalOrganization[] = [];

  // Number of orgs based on country conditions
  // High crime + high corruption + low law enforcement = more orgs
  const crimeLevel =
    (100 - country.lawEnforcement) * 0.3 +
    country.governmentCorruption * 0.3 +
    (100 - country.gdpPerCapita) * 0.2;

  // Base: 2-5 orgs per country, scaled by crime level
  const numOrgs = Math.floor(2 + (crimeLevel / 25) + Math.random() * 3);

  // Pick cities for HQs (prefer high crime index cities)
  const sortedCities = [...cities].sort((a, b) => b.crimeIndex - a.crimeIndex);

  for (let i = 0; i < Math.min(numOrgs, sortedCities.length); i++) {
    const city = sortedCities[i];

    // Import needed functions
    const {
      createOrganization,
      CITY_CRIME_MAP,
      getMotivationFromHarmAvoidance,
      NEUTRAL_CALLINGS,
      SELFISH_CALLINGS,
      SELFLESS_CALLINGS,
    } = require('../data/criminalOrganization');

    // Determine type
    const type = city.populationRating > 5 ? 'syndicate' : 'street_gang';

    // Generate leader
    const harmAvoidance = 1 + Math.floor(Math.random() * 10);
    const motivation = getMotivationFromHarmAvoidance(harmAvoidance);

    let callings;
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

    const leader = {
      id: `leader_init_${i}`,
      name: generateLeaderName(),
      motivation,
      calling: callings[Math.floor(Math.random() * callings.length)],
      imprisoned: false,
      loyalty: 50 + Math.floor(Math.random() * 50),
      competence: 40 + Math.floor(Math.random() * 40),
    };

    // Determine specialties
    const specialties: CrimeSpecialty[] = [];
    for (const cityType of city.cityTypes) {
      const typeSpecialties = CITY_CRIME_MAP[cityType];
      if (typeSpecialties && typeSpecialties.length > 0) {
        specialties.push(typeSpecialties[Math.floor(Math.random() * typeSpecialties.length)]);
      }
    }
    if (specialties.length === 0) {
      specialties.push('theft', 'extortion');
    }

    // Create org (already in operating state for initial orgs)
    const org = createOrganization(
      generateOrgName(city),
      type,
      city.name,
      country.code,
      leader,
      specialties.slice(0, 3),
      0 // Week 0
    );

    // Set to operating (they're established)
    org.state = 'operating';
    org.personnel = 20 + Math.floor(Math.random() * 30);
    org.capital = 30 + Math.floor(Math.random() * 40);
    org.reputation = 30 + Math.floor(Math.random() * 30);
    org.heat = Math.floor(Math.random() * 30); // Some initial heat

    orgs.push(org);
  }

  return orgs;
}

function generateOrgName(city: City): string {
  const prefixes = ['Black', 'Red', 'Golden', 'Iron', 'Shadow', 'Night', 'Blood', 'Steel'];
  const suffixes = ['Dragons', 'Wolves', 'Lions', 'Vipers', 'Syndicate', 'Crew', 'Familia', 'Cartel'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  if (Math.random() > 0.7) {
    return `The ${city.name} ${suffix}`;
  }
  return `The ${prefix} ${suffix}`;
}

function generateLeaderName(): string {
  const firstNames = ['Marco', 'Viktor', 'Chen', 'Alejandro', 'Dmitri', 'Yuki', 'Omar', 'Santos', 'Jin', 'Mikhail'];
  const lastNames = ['Rosetti', 'Volkov', 'Zhang', 'Morales', 'Petrov', 'Tanaka', 'Hassan', 'Silva', 'Park', 'Ivanov'];

  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// ============ SELECTORS ============

export const selectOrganizations = (state: UnderworldState) => state.organizations;
export const selectEvents = (state: UnderworldState) => state.events;
export const selectStats = (state: UnderworldState) => state.stats;
export const selectIsSimulating = (state: UnderworldState) => state.isSimulating;
export const selectSelectedOrg = (state: UnderworldState) =>
  state.organizations.find((o) => o.id === state.selectedOrgId);

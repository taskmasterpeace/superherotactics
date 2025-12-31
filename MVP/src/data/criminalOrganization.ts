/**
 * Criminal Organization System
 *
 * State machine-based criminal organizations that operate independently.
 * Leverages country/city stats for realistic behavior per location.
 */

import { Country } from './allCountries';
import { City } from './cities';
import { CallingId } from './callingSystem';

// ============ ORGANIZATION TYPES ============

export type OrgType = 'street_gang' | 'syndicate' | 'cartel' | 'shadow_network';

export const ORG_TYPE_CONFIG: Record<OrgType, {
  name: string;
  minCities: number;
  maxCities: number;
  visibility: number;      // 0-100, higher = easier to detect
  corruptionAccess: number; // 0-100, ability to bribe
  growthRate: number;       // 0-100, expansion speed
}> = {
  street_gang: {
    name: 'Street Gang',
    minCities: 1,
    maxCities: 1,
    visibility: 80,
    corruptionAccess: 20,
    growthRate: 80,
  },
  syndicate: {
    name: 'Crime Syndicate',
    minCities: 2,
    maxCities: 5,
    visibility: 50,
    corruptionAccess: 50,
    growthRate: 50,
  },
  cartel: {
    name: 'Cartel',
    minCities: 5,
    maxCities: 15,
    visibility: 30,
    corruptionAccess: 80,
    growthRate: 30,
  },
  shadow_network: {
    name: 'Shadow Network',
    minCities: 15,
    maxCities: 100,
    visibility: 10,
    corruptionAccess: 60, // Selective - they choose carefully
    growthRate: 15,
  },
};

// ============ ORGANIZATION STATES ============

export type OrgState = 'dormant' | 'forming' | 'operating' | 'conflict' | 'declining' | 'eliminated';

export const ORG_STATE_TRANSITIONS: Record<OrgState, {
  description: string;
  canTransitionTo: OrgState[];
  minDurationWeeks: number;
}> = {
  dormant: {
    description: 'No active operations',
    canTransitionTo: ['forming'],
    minDurationWeeks: 0,
  },
  forming: {
    description: 'Recruiting and establishing',
    canTransitionTo: ['operating', 'eliminated'],
    minDurationWeeks: 2,
  },
  operating: {
    description: 'Active criminal operations',
    canTransitionTo: ['conflict', 'declining'],
    minDurationWeeks: 4,
  },
  conflict: {
    description: 'Engaged with rivals or law enforcement',
    canTransitionTo: ['operating', 'declining'],
    minDurationWeeks: 1,
  },
  declining: {
    description: 'Losing power, resources depleted',
    canTransitionTo: ['operating', 'eliminated'],
    minDurationWeeks: 2,
  },
  eliminated: {
    description: 'Destroyed or disbanded',
    canTransitionTo: [],
    minDurationWeeks: 0,
  },
};

// ============ MOTIVATION SYSTEM ============

export type OrgMotivation = 'selfless' | 'neutral' | 'selfish';

export const MOTIVATION_CONFIG: Record<OrgMotivation, {
  harmAvoidanceRange: [number, number];
  heatMultiplier: number;
  targetCivilians: boolean;
  recruitmentPool: string[];
  description: string;
}> = {
  selfless: {
    harmAvoidanceRange: [7, 10],
    heatMultiplier: 0.7,        // Less attention (Robin Hood types)
    targetCivilians: false,
    recruitmentPool: ['idealists', 'community_members', 'reformers'],
    description: 'Community investment, lower violence, harder to investigate',
  },
  neutral: {
    harmAvoidanceRange: [4, 6],
    heatMultiplier: 1.0,
    targetCivilians: false,     // Only when necessary
    recruitmentPool: ['pragmatists', 'opportunists', 'professionals'],
    description: 'Pragmatic, adaptable, balanced approach',
  },
  selfish: {
    harmAvoidanceRange: [1, 3],
    heatMultiplier: 1.5,        // More attention (ruthless)
    targetCivilians: true,
    recruitmentPool: ['thugs', 'psychopaths', 'greedy'],
    description: 'Aggressive expansion, high profits, high heat',
  },
};

// Selfless-aligned callings (Robin Hood criminals)
export const SELFLESS_CALLINGS: CallingId[] = [
  'liberator', 'reformer', 'idealist', 'shepherd', 'protector', 'guardian',
];

// Neutral-aligned callings (pragmatic criminals)
export const NEUTRAL_CALLINGS: CallingId[] = [
  'professional', 'soldier', 'survivor', 'mercenary', 'nomad', 'tactician',
];

// Selfish-aligned callings (ruthless criminals)
export const SELFISH_CALLINGS: CallingId[] = [
  'conqueror', 'predator', 'glory_hound', 'collector', 'nihilist', 'mastermind',
];

// ============ CRIME SPECIALTIES ============

export type CrimeSpecialty =
  | 'drugs'
  | 'arms'
  | 'human_trafficking'
  | 'smuggling'
  | 'extortion'
  | 'theft'
  | 'fraud'
  | 'cyber_crime'
  | 'gambling'
  | 'prostitution'
  | 'piracy'
  | 'kidnapping'
  | 'assassination'
  | 'corruption'
  | 'terrorism';

export const CRIME_SPECIALTY_CONFIG: Record<CrimeSpecialty, {
  heatGeneration: number;
  profitPotential: number;
  requiredCityTypes: string[];
  description: string;
}> = {
  drugs: { heatGeneration: 15, profitPotential: 80, requiredCityTypes: [], description: 'Drug manufacturing and distribution' },
  arms: { heatGeneration: 25, profitPotential: 70, requiredCityTypes: ['Industrial', 'Military'], description: 'Illegal weapons trade' },
  human_trafficking: { heatGeneration: 40, profitPotential: 90, requiredCityTypes: ['Seaport'], description: 'Human trafficking networks' },
  smuggling: { heatGeneration: 10, profitPotential: 50, requiredCityTypes: ['Seaport', 'Mining'], description: 'Contraband smuggling' },
  extortion: { heatGeneration: 20, profitPotential: 60, requiredCityTypes: ['Industrial', 'Company'], description: 'Protection rackets' },
  theft: { heatGeneration: 8, profitPotential: 40, requiredCityTypes: [], description: 'Burglary and robbery' },
  fraud: { heatGeneration: 5, profitPotential: 65, requiredCityTypes: ['Company', 'Political'], description: 'Financial crimes' },
  cyber_crime: { heatGeneration: 8, profitPotential: 75, requiredCityTypes: ['Company'], description: 'Hacking and digital theft' },
  gambling: { heatGeneration: 5, profitPotential: 55, requiredCityTypes: ['Resort'], description: 'Illegal gambling operations' },
  prostitution: { heatGeneration: 10, profitPotential: 45, requiredCityTypes: ['Resort'], description: 'Vice operations' },
  piracy: { heatGeneration: 30, profitPotential: 60, requiredCityTypes: ['Seaport'], description: 'Maritime piracy' },
  kidnapping: { heatGeneration: 35, profitPotential: 85, requiredCityTypes: [], description: 'Kidnapping for ransom' },
  assassination: { heatGeneration: 50, profitPotential: 95, requiredCityTypes: [], description: 'Contract killing' },
  corruption: { heatGeneration: 15, profitPotential: 70, requiredCityTypes: ['Political'], description: 'Bribery and graft' },
  terrorism: { heatGeneration: 100, profitPotential: 20, requiredCityTypes: [], description: 'Political violence' },
};

// City type to crime specialty mapping
export const CITY_CRIME_MAP: Record<string, CrimeSpecialty[]> = {
  'Seaport': ['smuggling', 'piracy', 'human_trafficking'],
  'Industrial': ['theft', 'extortion', 'arms'],
  'Political': ['corruption', 'fraud', 'assassination'],
  'Company': ['fraud', 'cyber_crime', 'extortion'],
  'Resort': ['drugs', 'gambling', 'prostitution'],
  'Mining': ['smuggling', 'theft', 'extortion'],
  'Military': ['arms', 'smuggling', 'corruption'],
  'Educational': ['drugs', 'fraud', 'cyber_crime'],
};

// ============ LEADER INTERFACE ============

export interface OrgLeader {
  id: string;
  name: string;
  motivation: OrgMotivation;
  calling: CallingId;
  imprisoned: boolean;
  prisonSentenceWeeks?: number;
  loyalty: number;          // 0-100
  competence: number;       // 0-100
}

// ============ MAIN ORGANIZATION INTERFACE ============

export interface CriminalOrganization {
  id: string;
  name: string;
  type: OrgType;

  // State Machine
  state: OrgState;
  stateEnteredAt: number;     // Game week when entered current state

  // Territory
  headquarters: string;       // City name
  headquartersCountry: string; // Country code
  territories: string[];      // City names

  // Resources (0-100 each)
  personnel: number;          // Member count (scaled)
  capital: number;            // Liquid funds
  heat: number;               // Law enforcement attention (decays)
  reputation: number;         // Street cred (affects recruitment)

  // Leadership
  leader: OrgLeader;

  // Operations
  specialties: CrimeSpecialty[];
  activeOperations: number;   // Current operations count

  // Relationships
  allies: string[];           // Org IDs
  enemies: string[];          // Org IDs

  // History
  formedAt: number;           // Game week
  arrestsMade: number;
  territoryLost: number;
  totalProfit: number;
  totalHeatGenerated: number;
}

// ============ HEAT SYSTEM ============

export const HEAT_LEVELS = [
  { min: 0, max: 20, response: 'Ignored', effects: [] },
  { min: 21, max: 40, response: 'Monitored', effects: ['investigations_start'] },
  { min: 41, max: 60, response: 'Active', effects: ['raids_possible', 'arrests_likely'] },
  { min: 61, max: 80, response: 'Hunted', effects: ['constant_raids', 'asset_seizure'] },
  { min: 81, max: 100, response: 'War', effects: ['military_response', 'shoot_on_sight'] },
] as const;

export function getHeatLevel(heat: number): typeof HEAT_LEVELS[number] {
  return HEAT_LEVELS.find(level => heat >= level.min && heat <= level.max) || HEAT_LEVELS[0];
}

// ============ GOVERNMENT CONSTRAINTS ============

export interface GovernmentConstraints {
  canMassSurveil: boolean;      // Track everyone's phones/internet
  canDisappear: boolean;        // Extrajudicial detention
  canTorture: boolean;          // "Enhanced interrogation"
  needsWarrants: boolean;       // Must get court approval
  mediaScrutiny: number;        // Public oversight (0-100)
}

export function getGovernmentConstraints(country: Country): GovernmentConstraints {
  const isAuthoritarian = country.governmentPerception === 'Authoritarian Regime';
  const isHybrid = country.governmentPerception === 'Hybrid Regime';
  const lowMediaFreedom = country.mediaFreedom < 40;

  return {
    canMassSurveil: isAuthoritarian || (isHybrid && lowMediaFreedom),
    canDisappear: isAuthoritarian && lowMediaFreedom,
    canTorture: isAuthoritarian && country.mediaFreedom < 30,
    needsWarrants: !isAuthoritarian && country.mediaFreedom > 50,
    mediaScrutiny: country.mediaFreedom,
  };
}

// ============ POLICE RESPONSE ============

export interface PoliceResponse {
  patrolDensity: number;        // How often crimes get witnessed
  responseTime: number;         // Minutes to arrive (affects escape)
  investigationQuality: number; // Evidence gathering skill
  arrestSuccess: number;        // % chance arrest sticks
}

export function getPoliceResponse(country: Country): PoliceResponse {
  return {
    patrolDensity: country.lawEnforcementBudget * 0.8,
    responseTime: Math.max(5, 60 - country.lawEnforcementBudget * 0.5),
    investigationQuality: country.lawEnforcement * 0.7,
    arrestSuccess: country.lawEnforcement * 0.6 + (100 - country.governmentCorruption) * 0.3,
  };
}

// ============ INTELLIGENCE RESPONSE ============

export interface IntelResponse {
  trackingSpeed: number;        // How fast they find org HQ
  undercoverChance: number;     // % chance to infiltrate org
  surveillanceLevel: number;    // Digital monitoring capability
  informantNetwork: number;     // Civilian tips quality
}

export function getIntelResponse(country: Country): IntelResponse {
  return {
    trackingSpeed: country.intelligenceServices * 0.5 + country.cyberCapabilities * 0.3,
    undercoverChance: country.intelligenceServices * 0.4,
    surveillanceLevel: country.cyberCapabilities * 0.7 + (100 - country.mediaFreedom) * 0.2,
    informantNetwork: country.intelligenceServices * 0.3 + (100 - country.governmentCorruption) * 0.2,
  };
}

// ============ MILITARY RESPONSE ============

export interface MilitaryResponse {
  escalationThreshold: number;  // Heat level that triggers military
  forceMultiplier: number;      // How deadly the response is
  collateralDamage: number;     // Civilian casualties risk
}

export function getMilitaryResponse(country: Country, org: CriminalOrganization): MilitaryResponse | null {
  // Military only responds at war-level heat
  if (org.heat < 80) return null;

  // Parse terrorismActivity - it might be a string number
  const terrorismLevel = typeof country.terrorismActivity === 'string'
    ? parseInt(country.terrorismActivity, 10) || 0
    : country.terrorismActivity;

  return {
    escalationThreshold: 80 - (terrorismLevel * 0.2), // Lower in terror-prone countries
    forceMultiplier: country.militaryServices * 0.8,
    collateralDamage: 100 - country.militaryServices * 0.5, // Trained = less collateral
  };
}

// ============ SPAWN CONDITIONS ============

export function canSpawnOrganization(city: City, country: Country): boolean {
  const opportunity =
    (100 - country.lawEnforcement) * 0.3 +
    country.governmentCorruption * 0.3 +
    city.crimeIndex * 0.2 +
    (100 - country.gdpPerCapita) * 0.2; // Poverty breeds crime

  return opportunity > 50 && Math.random() * 100 < opportunity * 0.1;
}

// ============ CRIME SUCCESS RATE ============

export function getCrimeSuccessRate(org: CriminalOrganization, country: Country): number {
  const base = 50;
  const corruptionBonus = country.governmentCorruption * 0.3;
  const lawPenalty = country.lawEnforcement * 0.25;
  const intelPenalty = country.intelligenceServices * 0.15;
  const heatPenalty = org.heat * 0.3;

  return Math.max(10, Math.min(90,
    base + corruptionBonus - lawPenalty - intelPenalty - heatPenalty
  ));
}

// ============ BRIBERY ============

export function canBribeAuthorities(country: Country, org: CriminalOrganization): boolean {
  const bribeChance =
    country.governmentCorruption * 0.6 +
    org.capital * 0.2 -
    country.lawEnforcement * 0.2;

  return Math.random() * 100 < bribeChance;
}

// ============ HEAT DECAY ============

export function calculateHeatDecay(country: Country): number {
  // Base decay per week
  let decay = 5;

  // Corrupt countries forget faster
  decay += country.governmentCorruption * 0.1;

  // Good intel services remember longer
  decay -= country.intelligenceServices * 0.05;

  return Math.max(1, decay);
}

// ============ STATE TRANSITIONS ============

export function canTransitionTo(org: CriminalOrganization, newState: OrgState, currentWeek: number): boolean {
  const currentStateConfig = ORG_STATE_TRANSITIONS[org.state];

  // Check if transition is allowed
  if (!currentStateConfig.canTransitionTo.includes(newState)) {
    return false;
  }

  // Check minimum duration
  const weeksInState = currentWeek - org.stateEnteredAt;
  if (weeksInState < currentStateConfig.minDurationWeeks) {
    return false;
  }

  return true;
}

export function transitionState(org: CriminalOrganization, newState: OrgState, currentWeek: number): CriminalOrganization {
  if (!canTransitionTo(org, newState, currentWeek)) {
    return org;
  }

  return {
    ...org,
    state: newState,
    stateEnteredAt: currentWeek,
  };
}

// ============ ORGANIZATION FACTORY ============

let orgIdCounter = 0;

export function createOrganization(
  name: string,
  type: OrgType,
  headquartersCity: string,
  headquartersCountry: string,
  leader: OrgLeader,
  specialties: CrimeSpecialty[],
  currentWeek: number
): CriminalOrganization {
  orgIdCounter++;

  return {
    id: `org_${orgIdCounter}_${Date.now()}`,
    name,
    type,
    state: 'forming',
    stateEnteredAt: currentWeek,
    headquarters: headquartersCity,
    headquartersCountry,
    territories: [headquartersCity],
    personnel: 10 + Math.floor(Math.random() * 20),
    capital: 20 + Math.floor(Math.random() * 30),
    heat: 0,
    reputation: 10 + Math.floor(Math.random() * 20),
    leader,
    specialties,
    activeOperations: 0,
    allies: [],
    enemies: [],
    formedAt: currentWeek,
    arrestsMade: 0,
    territoryLost: 0,
    totalProfit: 0,
    totalHeatGenerated: 0,
  };
}

// ============ HELPER: MOTIVATION FROM HARM AVOIDANCE ============

export function getMotivationFromHarmAvoidance(harmAvoidance: number): OrgMotivation {
  if (harmAvoidance >= 7) return 'selfless';
  if (harmAvoidance >= 4) return 'neutral';
  return 'selfish';
}

/**
 * Crime Activities System
 *
 * Defines individual crime operations that organizations perform.
 * Each activity has success rates, heat generation, and profit potential.
 */

import { Country } from './allCountries';
import { City } from './cities';
import {
  CriminalOrganization,
  CrimeSpecialty,
  CRIME_SPECIALTY_CONFIG,
  getPoliceResponse,
  getIntelResponse,
  getGovernmentConstraints,
  MOTIVATION_CONFIG,
} from './criminalOrganization';

// ============ ACTIVITY TYPES ============

export type ActivityType =
  | 'drug_deal'
  | 'armed_robbery'
  | 'burglary'
  | 'extortion_collection'
  | 'smuggling_run'
  | 'cyber_heist'
  | 'assassination_contract'
  | 'kidnapping_operation'
  | 'gambling_operation'
  | 'protection_racket'
  | 'arms_deal'
  | 'human_trafficking_run'
  | 'corruption_payoff'
  | 'territory_expansion'
  | 'recruit_members'
  | 'lay_low';

export interface ActivityConfig {
  name: string;
  description: string;
  specialty: CrimeSpecialty | null;   // null = available to all
  baseHeat: number;
  baseProfit: number;
  baseDuration: number;               // In days
  personnelRequired: number;
  capitalRequired: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  canFail: boolean;
  failureConsequences: string[];
}

export const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  drug_deal: {
    name: 'Drug Deal',
    description: 'Street-level drug distribution',
    specialty: 'drugs',
    baseHeat: 5,
    baseProfit: 15,
    baseDuration: 1,
    personnelRequired: 5,
    capitalRequired: 10,
    riskLevel: 'medium',
    canFail: true,
    failureConsequences: ['arrests', 'product_seizure'],
  },
  armed_robbery: {
    name: 'Armed Robbery',
    description: 'Bank or store robbery at gunpoint',
    specialty: 'theft',
    baseHeat: 25,
    baseProfit: 40,
    baseDuration: 1,
    personnelRequired: 8,
    capitalRequired: 5,
    riskLevel: 'high',
    canFail: true,
    failureConsequences: ['arrests', 'shootout', 'casualties'],
  },
  burglary: {
    name: 'Burglary',
    description: 'Breaking and entering for theft',
    specialty: 'theft',
    baseHeat: 8,
    baseProfit: 20,
    baseDuration: 1,
    personnelRequired: 3,
    capitalRequired: 2,
    riskLevel: 'low',
    canFail: true,
    failureConsequences: ['arrests', 'witness_report'],
  },
  extortion_collection: {
    name: 'Extortion Collection',
    description: 'Collecting protection payments',
    specialty: 'extortion',
    baseHeat: 10,
    baseProfit: 25,
    baseDuration: 1,
    personnelRequired: 4,
    capitalRequired: 0,
    riskLevel: 'medium',
    canFail: true,
    failureConsequences: ['resistance', 'police_tip'],
  },
  smuggling_run: {
    name: 'Smuggling Run',
    description: 'Moving contraband across borders',
    specialty: 'smuggling',
    baseHeat: 12,
    baseProfit: 35,
    baseDuration: 3,
    personnelRequired: 6,
    capitalRequired: 15,
    riskLevel: 'medium',
    canFail: true,
    failureConsequences: ['interdiction', 'cargo_seizure', 'arrests'],
  },
  cyber_heist: {
    name: 'Cyber Heist',
    description: 'Digital theft from financial institutions',
    specialty: 'cyber_crime',
    baseHeat: 15,
    baseProfit: 60,
    baseDuration: 7,
    personnelRequired: 3,
    capitalRequired: 20,
    riskLevel: 'medium',
    canFail: true,
    failureConsequences: ['traced', 'funds_frozen'],
  },
  assassination_contract: {
    name: 'Assassination Contract',
    description: 'Contract killing for hire',
    specialty: 'assassination',
    baseHeat: 50,
    baseProfit: 80,
    baseDuration: 7,
    personnelRequired: 2,
    capitalRequired: 10,
    riskLevel: 'extreme',
    canFail: true,
    failureConsequences: ['target_survives', 'witness', 'manhunt'],
  },
  kidnapping_operation: {
    name: 'Kidnapping Operation',
    description: 'Abduction for ransom',
    specialty: 'kidnapping',
    baseHeat: 40,
    baseProfit: 70,
    baseDuration: 14,
    personnelRequired: 6,
    capitalRequired: 15,
    riskLevel: 'high',
    canFail: true,
    failureConsequences: ['rescue_operation', 'hostage_death', 'manhunt'],
  },
  gambling_operation: {
    name: 'Gambling Operation',
    description: 'Running illegal gambling',
    specialty: 'gambling',
    baseHeat: 5,
    baseProfit: 20,
    baseDuration: 7,
    personnelRequired: 4,
    capitalRequired: 25,
    riskLevel: 'low',
    canFail: true,
    failureConsequences: ['raid', 'equipment_seizure'],
  },
  protection_racket: {
    name: 'Protection Racket',
    description: 'Establishing new protection territory',
    specialty: 'extortion',
    baseHeat: 15,
    baseProfit: 30,
    baseDuration: 7,
    personnelRequired: 8,
    capitalRequired: 5,
    riskLevel: 'medium',
    canFail: true,
    failureConsequences: ['resistance', 'rival_conflict', 'police_attention'],
  },
  arms_deal: {
    name: 'Arms Deal',
    description: 'Illegal weapons transaction',
    specialty: 'arms',
    baseHeat: 30,
    baseProfit: 50,
    baseDuration: 3,
    personnelRequired: 5,
    capitalRequired: 40,
    riskLevel: 'high',
    canFail: true,
    failureConsequences: ['sting_operation', 'arrests', 'weapons_seized'],
  },
  human_trafficking_run: {
    name: 'Human Trafficking Run',
    description: 'Moving people illegally',
    specialty: 'human_trafficking',
    baseHeat: 45,
    baseProfit: 75,
    baseDuration: 7,
    personnelRequired: 8,
    capitalRequired: 30,
    riskLevel: 'extreme',
    canFail: true,
    failureConsequences: ['interdiction', 'international_attention', 'manhunt'],
  },
  corruption_payoff: {
    name: 'Corruption Payoff',
    description: 'Bribing officials for protection',
    specialty: 'corruption',
    baseHeat: -10, // Reduces heat!
    baseProfit: -20, // Costs money
    baseDuration: 1,
    personnelRequired: 1,
    capitalRequired: 30,
    riskLevel: 'medium',
    canFail: true,
    failureConsequences: ['official_refuses', 'sting', 'exposure'],
  },
  territory_expansion: {
    name: 'Territory Expansion',
    description: 'Moving into new area',
    specialty: null,
    baseHeat: 20,
    baseProfit: 0,
    baseDuration: 14,
    personnelRequired: 15,
    capitalRequired: 20,
    riskLevel: 'high',
    canFail: true,
    failureConsequences: ['rival_conflict', 'turf_war', 'police_crackdown'],
  },
  recruit_members: {
    name: 'Recruit Members',
    description: 'Bringing in new members',
    specialty: null,
    baseHeat: 3,
    baseProfit: -5,
    baseDuration: 7,
    personnelRequired: 3,
    capitalRequired: 10,
    riskLevel: 'low',
    canFail: true,
    failureConsequences: ['undercover_infiltration', 'informant'],
  },
  lay_low: {
    name: 'Lay Low',
    description: 'Reducing activity to avoid attention',
    specialty: null,
    baseHeat: -10,
    baseProfit: -5,
    baseDuration: 7,
    personnelRequired: 0,
    capitalRequired: 0,
    riskLevel: 'low',
    canFail: false,
    failureConsequences: [],
  },
};

// ============ ACTIVITY RESULT ============

export interface ActivityResult {
  activityType: ActivityType;
  success: boolean;
  heatGenerated: number;
  profitGenerated: number;
  personnelLost: number;
  capitalLost: number;
  consequences: string[];
  witnessReport: boolean;
  newsworthy: boolean;
  newsHeadline?: string;
}

// ============ EXECUTE ACTIVITY ============

export function executeActivity(
  org: CriminalOrganization,
  activityType: ActivityType,
  country: Country,
  city: City
): ActivityResult {
  const config = ACTIVITY_CONFIG[activityType];
  const motivationConfig = MOTIVATION_CONFIG[org.leader.motivation];

  // Base success rate
  let successRate = 60;

  // Apply country modifiers
  const police = getPoliceResponse(country);
  const intel = getIntelResponse(country);

  // Police effectiveness reduces success
  successRate -= police.patrolDensity * 0.2;
  successRate -= police.investigationQuality * 0.1;

  // Intel services reduce success for complex crimes
  if (config.riskLevel === 'high' || config.riskLevel === 'extreme') {
    successRate -= intel.trackingSpeed * 0.15;
  }

  // Corruption helps success
  successRate += country.governmentCorruption * 0.25;

  // Organization reputation helps
  successRate += org.reputation * 0.15;

  // Heat makes everything harder
  successRate -= org.heat * 0.2;

  // City crime index helps (criminals blend in)
  successRate += city.crimeIndex * 0.1;

  // Clamp success rate
  successRate = Math.max(10, Math.min(95, successRate));

  // Roll for success
  const roll = Math.random() * 100;
  const success = !config.canFail || roll < successRate;

  // Calculate heat generated
  let heatGenerated = config.baseHeat;
  heatGenerated *= motivationConfig.heatMultiplier;

  // Higher police presence = more heat for visible crimes
  if (config.riskLevel !== 'low') {
    heatGenerated *= 1 + (police.patrolDensity / 200);
  }

  // Failed crimes generate more heat
  if (!success) {
    heatGenerated *= 1.5;
  }

  // Corruption payoff can reduce heat
  if (activityType === 'corruption_payoff' && success) {
    heatGenerated = -15; // Reduces heat
  }

  // Calculate profit
  let profitGenerated = success ? config.baseProfit : Math.floor(config.baseProfit * 0.2);

  // GDP affects profits (richer targets = more loot)
  profitGenerated *= 1 + (country.gdpPerCapita / 200);

  // Calculate losses on failure
  let personnelLost = 0;
  let capitalLost = 0;
  const consequences: string[] = [];

  if (!success && config.canFail) {
    // Determine which consequences apply
    const applicableConsequences = config.failureConsequences.filter(() => Math.random() > 0.5);
    consequences.push(...applicableConsequences);

    if (consequences.includes('arrests')) {
      personnelLost = Math.floor(config.personnelRequired * (0.2 + Math.random() * 0.3));
    }
    if (consequences.includes('shootout') || consequences.includes('casualties')) {
      personnelLost += Math.floor(config.personnelRequired * (0.1 + Math.random() * 0.2));
    }
    if (consequences.includes('product_seizure') || consequences.includes('cargo_seizure') ||
        consequences.includes('weapons_seized') || consequences.includes('funds_frozen')) {
      capitalLost = Math.floor(config.capitalRequired * (0.5 + Math.random() * 0.5));
    }
  }

  // Check if activity makes news
  const newsworthy = heatGenerated > 20 ||
    config.riskLevel === 'extreme' ||
    (!success && consequences.length > 1);

  // Check for witness reports
  const witnessReport = !success && Math.random() * 100 < police.patrolDensity;

  return {
    activityType,
    success,
    heatGenerated: Math.round(heatGenerated),
    profitGenerated: Math.round(profitGenerated),
    personnelLost,
    capitalLost,
    consequences,
    witnessReport,
    newsworthy,
    newsHeadline: newsworthy ? generateNewsHeadline(config, success, city) : undefined,
  };
}

// ============ NEWS HEADLINE GENERATOR ============

function generateNewsHeadline(config: ActivityConfig, success: boolean, city: City): string {
  const templates = {
    drug_deal: success
      ? [`Drug bust foiled in ${city.name}`, `Narcotics operation expands in ${city.name}`]
      : [`Major drug bust in ${city.name}`, `Authorities seize narcotics in ${city.name}`],
    armed_robbery: success
      ? [`Daring heist in ${city.name}`, `Armed robbers escape with millions`]
      : [`Failed robbery ends in arrests`, `Police foil armed robbery in ${city.name}`],
    assassination_contract: success
      ? [`Prominent figure murdered in ${city.name}`, `Contract killing shocks ${city.name}`]
      : [`Assassination attempt fails`, `Target survives attack in ${city.name}`],
    kidnapping_operation: success
      ? [`Kidnapping reported in ${city.name}`, `Ransom demands after abduction`]
      : [`Hostage rescued in ${city.name}`, `Kidnapping gang arrested`],
    human_trafficking_run: success
      ? [`Human trafficking ring active`, `Border security concerns grow`]
      : [`Human trafficking ring busted`, `Authorities rescue trafficking victims`],
    arms_deal: success
      ? [`Illegal weapons flood streets`, `Arms trafficking concerns grow`]
      : [`Weapons cache seized`, `Arms dealers arrested in sting`],
    default: success
      ? [`Criminal activity reported in ${city.name}`]
      : [`Police make arrests in ${city.name}`],
  };

  const activityTemplates = templates[config.name.toLowerCase().replace(/ /g, '_') as keyof typeof templates]
    || templates.default;

  return activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
}

// ============ SELECT ACTIVITIES FOR ORG ============

export function selectActivitiesForOrg(
  org: CriminalOrganization,
  country: Country,
  city: City
): ActivityType[] {
  const activities: ActivityType[] = [];

  // Check if org should lay low (high heat)
  if (org.heat > 60) {
    if (Math.random() > 0.3) {
      activities.push('lay_low');
      return activities; // Don't do anything else
    }
  }

  // Try corruption if heat is medium-high
  if (org.heat > 40 && org.capital > 30 && Math.random() > 0.5) {
    activities.push('corruption_payoff');
  }

  // Select 1-3 activities based on specialties
  const numActivities = 1 + Math.floor(Math.random() * 2);

  for (let i = 0; i < numActivities; i++) {
    const activity = selectActivityBySpecialty(org, country, city);
    if (activity && !activities.includes(activity)) {
      activities.push(activity);
    }
  }

  // Maybe recruit if personnel is low
  if (org.personnel < 30 && Math.random() > 0.5) {
    activities.push('recruit_members');
  }

  return activities;
}

function selectActivityBySpecialty(
  org: CriminalOrganization,
  country: Country,
  city: City
): ActivityType | null {
  // Map specialties to activities
  const specialtyToActivity: Record<CrimeSpecialty, ActivityType[]> = {
    drugs: ['drug_deal'],
    arms: ['arms_deal'],
    human_trafficking: ['human_trafficking_run'],
    smuggling: ['smuggling_run'],
    extortion: ['extortion_collection', 'protection_racket'],
    theft: ['armed_robbery', 'burglary'],
    fraud: ['cyber_heist'],
    cyber_crime: ['cyber_heist'],
    gambling: ['gambling_operation'],
    prostitution: ['protection_racket'],
    piracy: ['smuggling_run'],
    kidnapping: ['kidnapping_operation'],
    assassination: ['assassination_contract'],
    corruption: ['corruption_payoff'],
    terrorism: ['armed_robbery'], // Placeholder
  };

  // Pick a random specialty from org's list
  if (org.specialties.length === 0) {
    return 'burglary'; // Default
  }

  const specialty = org.specialties[Math.floor(Math.random() * org.specialties.length)];
  const possibleActivities = specialtyToActivity[specialty];

  if (!possibleActivities || possibleActivities.length === 0) {
    return null;
  }

  // Filter by what org can afford
  const affordableActivities = possibleActivities.filter(actType => {
    const config = ACTIVITY_CONFIG[actType];
    return org.personnel >= config.personnelRequired && org.capital >= config.capitalRequired;
  });

  if (affordableActivities.length === 0) {
    return 'burglary'; // Fallback to low-cost activity
  }

  return affordableActivities[Math.floor(Math.random() * affordableActivities.length)];
}

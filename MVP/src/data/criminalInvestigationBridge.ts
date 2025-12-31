/**
 * Criminal Investigation Bridge
 *
 * Connects criminal organization activities to the investigation system.
 * Generates investigations from crimes and links them to organizations.
 */

import { Country } from './allCountries';
import { City } from './cities';
import {
  CriminalOrganization,
  CrimeSpecialty,
  getPoliceResponse,
  getIntelResponse,
} from './criminalOrganization';
import { ActivityType, ACTIVITY_CONFIG, ActivityResult } from './crimeActivities';
import {
  Investigation,
  InvestigationType,
  InvestigationPhase,
  Clue,
} from './investigationSystem';

// ============ HELPER FUNCTIONS ============

// Get city type from either format (cityTypes array or cityType1-4 fields)
function getCityType(city: City): string {
  if ('cityTypes' in city && Array.isArray((city as any).cityTypes)) {
    return (city as any).cityTypes[0] || 'urban';
  }
  return (city as any).cityType1 || (city as any).cityType2 || 'urban';
}

// ============ CRIME TO INVESTIGATION TYPE MAPPING ============

const CRIME_TO_INVESTIGATION_TYPE: Record<CrimeSpecialty, InvestigationType> = {
  drugs: 'crime',
  arms: 'underworld',
  human_trafficking: 'underworld',
  smuggling: 'underworld',
  extortion: 'crime',
  theft: 'crime',
  fraud: 'corporate',
  cyber_crime: 'corporate',
  gambling: 'crime',
  prostitution: 'crime',
  piracy: 'crime',
  kidnapping: 'crime',
  assassination: 'underworld',
  corruption: 'conspiracy',
  terrorism: 'terrorism',
};

// ============ GENERATE INVESTIGATION FROM CRIME ============

export interface GeneratedInvestigation {
  investigation: Investigation;
  linkedOrgId: string;
  linkedActivityType: ActivityType;
}

/**
 * Determines if a crime should generate an investigation based on country stats.
 * Higher law enforcement = more likely to investigate.
 */
export function shouldGenerateInvestigation(
  activityResult: ActivityResult,
  country: Country
): boolean {
  const police = getPoliceResponse(country);
  const config = ACTIVITY_CONFIG[activityResult.activityType];

  // Base chance depends on police quality
  let investigateChance = police.investigationQuality * 0.6;

  // High-profile crimes are more likely to be investigated
  if (config.riskLevel === 'high') investigateChance += 20;
  if (config.riskLevel === 'extreme') investigateChance += 40;

  // Failed crimes with witnesses are more likely to be investigated
  if (!activityResult.success && activityResult.witnessReport) {
    investigateChance += 30;
  }

  // Newsworthy events attract more attention
  if (activityResult.newsworthy) {
    investigateChance += 25;
  }

  // Corruption reduces investigation chance
  investigateChance -= country.governmentCorruption * 0.3;

  // Clamp and roll
  investigateChance = Math.max(5, Math.min(95, investigateChance));
  return Math.random() * 100 < investigateChance;
}

/**
 * Generates an investigation from a criminal activity.
 */
export function generateInvestigationFromCrime(
  org: CriminalOrganization,
  activityResult: ActivityResult,
  country: Country,
  city: City,
  currentTimestamp: number
): GeneratedInvestigation | null {
  if (!shouldGenerateInvestigation(activityResult, country)) {
    return null;
  }

  const config = ACTIVITY_CONFIG[activityResult.activityType];

  // Determine investigation type from org specialties
  const primarySpecialty = org.specialties[0] || 'theft';
  const investigationType = CRIME_TO_INVESTIGATION_TYPE[primarySpecialty] || 'crime';

  // Calculate difficulty based on org reputation and type
  const baseDifficulty = Math.floor(3 + org.reputation / 20);
  const difficulty = Math.min(10, baseDifficulty + (org.type === 'cartel' ? 2 : 0));

  // Generate initial clues
  const clues = generateInitialClues(org, activityResult, city);

  // Create the investigation
  const investigation: Investigation = {
    id: `inv_${org.id}_${Date.now()}`,
    title: generateInvestigationTitle(org, activityResult, city),
    description: generateInvestigationDescription(org, activityResult, city),
    type: investigationType,
    status: 'discovered',

    // Location
    city: city.name,
    country: country.name,
    sector: city.sector,

    // Difficulty
    difficulty,
    dangerLevel: Math.min(10, Math.floor(difficulty * 0.8) + (org.leader.motivation === 'selfish' ? 2 : 0)),

    // Progress
    currentPhase: 'gathering',
    progress: 0,
    cluesGathered: clues,
    decisionsLog: [],

    // Assignment
    assignedCharacters: [],

    // Time constraints
    discoveredAt: currentTimestamp,
    expiresAt: currentTimestamp + (7 * 24 * 60 * 60 * 1000), // 7 days to investigate
    hoursRemaining: 7 * 24,

    // Stakes
    potentialReward: {
      cash: Math.floor(org.capital * 0.2) * 100, // Some of their capital
      fame: Math.floor(10 + org.reputation / 5),
      intel: [`${org.name} operations`, `${org.leader.name} identity`],
      missionUnlocked: activityResult.success ? undefined : `raid_${org.id}`,
    },

    // Consequences
    suspicionLevel: 0,
    publicExposure: activityResult.newsworthy ? 30 : 10,

    // Current state
    availableApproaches: determineAvailableApproaches(org, country),
    lastActionResult: undefined,
  };

  return {
    investigation,
    linkedOrgId: org.id,
    linkedActivityType: activityResult.activityType,
  };
}

// ============ HELPER FUNCTIONS ============

function generateInvestigationTitle(
  org: CriminalOrganization,
  activityResult: ActivityResult,
  city: City
): string {
  const templates = {
    drug_deal: `Drug Ring in ${city.name}`,
    armed_robbery: `${city.name} Robbery Investigation`,
    human_trafficking_run: `Human Trafficking Network`,
    kidnapping_operation: `Kidnapping Case in ${city.name}`,
    assassination_contract: `Contract Killing Investigation`,
    cyber_heist: `Cyber Crime Investigation`,
    extortion_collection: `Extortion Ring in ${city.name}`,
    default: `Criminal Activity in ${city.name}`,
  };

  return templates[activityResult.activityType as keyof typeof templates] || templates.default;
}

function generateInvestigationDescription(
  org: CriminalOrganization,
  activityResult: ActivityResult,
  city: City
): string {
  const config = ACTIVITY_CONFIG[activityResult.activityType];

  if (activityResult.success) {
    return `Authorities are investigating reports of ${config.name.toLowerCase()} in ${city.name}. ` +
      `The perpetrators are believed to be part of an organized criminal network. ` +
      `Initial evidence suggests professional execution.`;
  } else {
    return `A failed ${config.name.toLowerCase()} attempt in ${city.name} has left behind evidence. ` +
      `Witnesses reported seeing multiple suspects fleeing the scene. ` +
      `Police are seeking any information about the suspects.`;
  }
}

function generateInitialClues(
  org: CriminalOrganization,
  activityResult: ActivityResult,
  city: City
): Clue[] {
  const clues: Clue[] = [];

  // Location clue
  clues.push({
    id: `clue_location_${Date.now()}`,
    type: 'location',
    description: `Crime occurred in the ${getCityType(city)} district of ${city.name}`,
    reliability: 90,
    source: 'crime_scene',
    discoveredAt: Date.now(),
    investigationId: '',
    leadsTo: [],
  });

  // Witness clue (if witnessed)
  if (activityResult.witnessReport) {
    clues.push({
      id: `clue_witness_${Date.now()}`,
      type: 'testimony',
      description: `Witnesses reported seeing ${Math.floor(2 + Math.random() * 4)} suspects`,
      reliability: 60 + Math.floor(Math.random() * 20),
      source: 'witness',
      discoveredAt: Date.now(),
      investigationId: '',
      leadsTo: ['suspect_description'],
    });
  }

  // Evidence clue (if failed)
  if (!activityResult.success) {
    clues.push({
      id: `clue_evidence_${Date.now()}`,
      type: 'physical',
      description: `Physical evidence recovered from the scene suggests organized criminal activity`,
      reliability: 80,
      source: 'forensics',
      discoveredAt: Date.now(),
      investigationId: '',
      leadsTo: ['criminal_network'],
    });
  }

  // Organization hint (partial)
  if (org.reputation > 50 || org.heat > 40) {
    clues.push({
      id: `clue_org_${Date.now()}`,
      type: 'intelligence',
      description: `Informants mention a group called "${org.name.split(' ')[1] || 'unknown'}" operating in the area`,
      reliability: 40 + Math.floor(org.reputation / 4),
      source: 'informant',
      discoveredAt: Date.now(),
      investigationId: '',
      leadsTo: ['organization_identity'],
    });
  }

  return clues;
}

function determineAvailableApproaches(
  org: CriminalOrganization,
  country: Country
): Investigation['availableApproaches'] {
  const approaches: Investigation['availableApproaches'] = [];

  // Stealth always available
  approaches.push('stealth');

  // Direct approach depends on law enforcement
  if (country.lawEnforcement > 40) {
    approaches.push('direct');
  }

  // Social approach depends on corruption (informants available)
  if (country.governmentCorruption > 30 || org.reputation > 50) {
    approaches.push('social');
  }

  // Technical approach depends on cyber capabilities
  if (country.cyberCapabilities > 40) {
    approaches.push('technical');
  }

  // Intimidation available if org is less dangerous
  if (org.personnel < 30 && org.type === 'street_gang') {
    approaches.push('intimidation');
  }

  return approaches;
}

// ============ INVESTIGATION OUTCOME EFFECTS ============

/**
 * Apply investigation outcome to criminal organization.
 */
export function applyInvestigationOutcome(
  org: CriminalOrganization,
  investigationSuccess: boolean,
  approachUsed: Investigation['availableApproaches'][number]
): {
  heatChange: number;
  personnelLost: number;
  capitalLost: number;
  leaderArrested: boolean;
} {
  if (!investigationSuccess) {
    // Investigation failed - org gets warned, becomes more careful
    return {
      heatChange: -10, // They lay low
      personnelLost: 0,
      capitalLost: 0,
      leaderArrested: false,
    };
  }

  // Investigation succeeded - apply consequences based on approach
  const result = {
    heatChange: 0,
    personnelLost: 0,
    capitalLost: 0,
    leaderArrested: false,
  };

  switch (approachUsed) {
    case 'direct':
      // Direct approach leads to arrests
      result.personnelLost = Math.floor(org.personnel * 0.2);
      result.heatChange = -20; // Less heat after bust
      result.leaderArrested = Math.random() < 0.2;
      break;

    case 'stealth':
      // Stealth reveals information, less direct impact
      result.heatChange = 10; // They know someone's watching
      break;

    case 'social':
      // Social approach destabilizes from within
      result.personnelLost = Math.floor(org.personnel * 0.1);
      result.capitalLost = Math.floor(org.capital * 0.15);
      break;

    case 'technical':
      // Technical approach seizes assets
      result.capitalLost = Math.floor(org.capital * 0.3);
      break;

    case 'intimidation':
      // Intimidation causes defections
      result.personnelLost = Math.floor(org.personnel * 0.15);
      result.heatChange = 5;
      break;
  }

  return result;
}

// ============ EXPORTS FOR INTEGRATION ============

export {
  CRIME_TO_INVESTIGATION_TYPE,
};

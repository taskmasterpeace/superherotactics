// =============================================================================
// MILITARY SYSTEM
// =============================================================================
// Government forces, special operations, military presence

// =============================================================================
// THREAT LEVELS
// =============================================================================

export type ThreatLevel =
  | 'minimal' // 0-20: Almost no military presence
  | 'low' // 21-40: Light patrols
  | 'moderate' // 41-60: Regular presence
  | 'high' // 61-80: Heavy presence
  | 'critical'; // 81-100: Martial law / Active combat

export const THREAT_LEVEL_EFFECTS: Record<ThreatLevel, {
  patrolFrequency: number; // Encounters per hour in sector
  responseTime: number; // Minutes for reinforcements
  unitStrength: number; // Average unit size
  equipmentTier: number; // 1-5 scale
}> = {
  minimal: { patrolFrequency: 0.1, responseTime: 60, unitStrength: 2, equipmentTier: 1 },
  low: { patrolFrequency: 0.3, responseTime: 30, unitStrength: 4, equipmentTier: 2 },
  moderate: { patrolFrequency: 0.6, responseTime: 15, unitStrength: 6, equipmentTier: 3 },
  high: { patrolFrequency: 1.0, responseTime: 5, unitStrength: 10, equipmentTier: 4 },
  critical: { patrolFrequency: 2.0, responseTime: 2, unitStrength: 20, equipmentTier: 5 },
};

// =============================================================================
// MILITARY UNITS
// =============================================================================

export type MilitaryUnitType =
  | 'police' // Regular law enforcement
  | 'swat' // Special police units
  | 'national_guard' // Reserve military
  | 'army' // Regular military
  | 'special_forces' // Elite military
  | 'intelligence' // Spy agencies
  | 'paramilitary'; // Private military contractors

export interface MilitaryUnit {
  id: string;
  type: MilitaryUnitType;
  name: string;
  country: string;
  strength: number; // Number of personnel
  equipment: string[]; // Equipment IDs
  location: string; // Current sector
  status: 'patrol' | 'alert' | 'engaged' | 'pursuing' | 'standby';
  responseModifier: number; // How quickly they respond (+/- %)
}

export const UNIT_TYPE_STATS: Record<MilitaryUnitType, {
  baseStrength: number;
  equipmentTier: number;
  combatSkill: number; // 1-100
  detectSkill: number; // 1-100
}> = {
  police: { baseStrength: 4, equipmentTier: 2, combatSkill: 40, detectSkill: 50 },
  swat: { baseStrength: 6, equipmentTier: 4, combatSkill: 70, detectSkill: 60 },
  national_guard: { baseStrength: 10, equipmentTier: 3, combatSkill: 50, detectSkill: 40 },
  army: { baseStrength: 12, equipmentTier: 4, combatSkill: 60, detectSkill: 45 },
  special_forces: { baseStrength: 6, equipmentTier: 5, combatSkill: 90, detectSkill: 80 },
  intelligence: { baseStrength: 4, equipmentTier: 4, combatSkill: 60, detectSkill: 95 },
  paramilitary: { baseStrength: 8, equipmentTier: 4, combatSkill: 65, detectSkill: 55 },
};

// =============================================================================
// ALERT SYSTEM
// =============================================================================

export interface AlertState {
  level: number; // 0-100
  source: string; // What triggered it
  affectedAreas: string[]; // Sector codes
  startTime: Date;
  decayRate: number; // Points lost per hour
  isLockdown: boolean;
}

export function calculateAlertLevel(
  incidentSeverity: number, // 0-100
  publicWitnesses: number,
  bodiesLeft: number,
  propertyDamage: number
): number {
  // Base from incident
  let alert = incidentSeverity;

  // Witnesses increase alert
  alert += publicWitnesses * 5;

  // Bodies are bad
  alert += bodiesLeft * 10;

  // Property damage
  alert += propertyDamage * 0.5;

  return Math.min(100, alert);
}

export function getAlertDecay(currentAlert: number, hoursPassed: number): number {
  // Alert decays faster at lower levels
  const baseDecay = 2; // Points per hour
  const decayMultiplier = currentAlert > 50 ? 0.5 : 1.0;

  return Math.max(0, currentAlert - (baseDecay * decayMultiplier * hoursPassed));
}

// =============================================================================
// MILITARY PRESENCE CALCULATION
// =============================================================================

export function calculateMilitaryPresence(
  countryMilitary: number, // 0-100
  countryIntel: number,
  countryLawEnforcement: number,
  currentAlert: number
): {
  threatLevel: ThreatLevel;
  presenceScore: number;
  unitTypes: MilitaryUnitType[];
} {
  // Base presence from stats
  let presence = (countryMilitary * 0.4 + countryLawEnforcement * 0.4 + countryIntel * 0.2);

  // Alert increases presence
  presence += currentAlert * 0.5;

  // Clamp to 0-100
  presence = Math.min(100, Math.max(0, presence));

  // Determine threat level
  let threatLevel: ThreatLevel;
  if (presence <= 20) threatLevel = 'minimal';
  else if (presence <= 40) threatLevel = 'low';
  else if (presence <= 60) threatLevel = 'moderate';
  else if (presence <= 80) threatLevel = 'high';
  else threatLevel = 'critical';

  // Determine which unit types are present
  const unitTypes: MilitaryUnitType[] = ['police'];
  if (presence >= 30) unitTypes.push('national_guard');
  if (presence >= 50) unitTypes.push('army');
  if (presence >= 40 && countryIntel >= 50) unitTypes.push('swat');
  if (presence >= 70) unitTypes.push('special_forces');
  if (countryIntel >= 70) unitTypes.push('intelligence');

  return {
    threatLevel,
    presenceScore: Math.floor(presence),
    unitTypes,
  };
}

// =============================================================================
// SPEC OPS TEAMS
// =============================================================================

export interface SpecOpsTeam {
  id: string;
  name: string;
  country: string;
  specialty: 'counter_terrorism' | 'hostage_rescue' | 'reconnaissance' | 'sabotage' | 'assassination';
  members: number;
  skill: number; // 1-100
  equipment: string[];
  deploymentCost: number;
  isAvailable: boolean;
  cooldownHours: number; // Hours until available after deployment
}

export const FAMOUS_SPEC_OPS: SpecOpsTeam[] = [
  {
    id: 'delta-force',
    name: 'Delta Force',
    country: 'US',
    specialty: 'counter_terrorism',
    members: 6,
    skill: 95,
    equipment: ['m4-carbine', 'night-vision', 'body-armor-heavy'],
    deploymentCost: 100000,
    isAvailable: true,
    cooldownHours: 48,
  },
  {
    id: 'sas',
    name: 'SAS',
    country: 'GB',
    specialty: 'hostage_rescue',
    members: 6,
    skill: 92,
    equipment: ['mp5', 'night-vision', 'body-armor-medium'],
    deploymentCost: 80000,
    isAvailable: true,
    cooldownHours: 48,
  },
  {
    id: 'gign',
    name: 'GIGN',
    country: 'FR',
    specialty: 'hostage_rescue',
    members: 5,
    skill: 88,
    equipment: ['famas', 'breaching-kit', 'body-armor-medium'],
    deploymentCost: 60000,
    isAvailable: true,
    cooldownHours: 36,
  },
  {
    id: 'spetsnaz',
    name: 'Spetsnaz',
    country: 'RU',
    specialty: 'sabotage',
    members: 8,
    skill: 85,
    equipment: ['ak-47', 'explosives', 'body-armor-heavy'],
    deploymentCost: 50000,
    isAvailable: true,
    cooldownHours: 24,
  },
  {
    id: 'mossad-kidon',
    name: 'Mossad Kidon',
    country: 'IL',
    specialty: 'assassination',
    members: 4,
    skill: 93,
    equipment: ['silenced-pistol', 'disguise-kit', 'poison'],
    deploymentCost: 150000,
    isAvailable: true,
    cooldownHours: 72,
  },
];

// =============================================================================
// PLAYER VS MILITARY
// =============================================================================

export interface EncounterResult {
  detected: boolean;
  engaged: boolean;
  reinforcementsCalled: boolean;
  alertIncreased: number;
  combatOccurred: boolean;
}

export function checkMilitaryEncounter(
  threatLevel: ThreatLevel,
  playerStealth: number, // 0-100
  isDay: boolean
): EncounterResult {
  const effects = THREAT_LEVEL_EFFECTS[threatLevel];

  // Detection chance based on patrol frequency and player stealth
  const baseDetection = effects.patrolFrequency * 30;
  const stealthModifier = (100 - playerStealth) / 100;
  const timeModifier = isDay ? 1.2 : 0.8; // Harder to hide in daylight

  const detectionChance = baseDetection * stealthModifier * timeModifier;
  const detected = Math.random() * 100 < detectionChance;

  if (!detected) {
    return {
      detected: false,
      engaged: false,
      reinforcementsCalled: false,
      alertIncreased: 0,
      combatOccurred: false,
    };
  }

  // If detected, chance of engagement
  const engageChance = effects.unitStrength * 5; // Larger units more likely to engage
  const engaged = Math.random() * 100 < engageChance;

  return {
    detected: true,
    engaged,
    reinforcementsCalled: engaged && effects.responseTime < 15,
    alertIncreased: detected ? 10 : 0 + (engaged ? 20 : 0),
    combatOccurred: engaged,
  };
}

// =============================================================================
// MILITARY COOPERATION
// =============================================================================

export function canCooperateWithMilitary(
  playerFame: number, // 0-100
  playerReputation: number, // -100 to +100 (negative = villain)
  countryRelationToPlayer: number // 1-6 scale from geopolitics
): boolean {
  // Need positive reputation
  if (playerReputation < 0) return false;

  // Need fame (they need to know who you are)
  if (playerFame < 30) return false;

  // Need friendly relations
  if (countryRelationToPlayer < 4) return false;

  return true;
}

export function getMilitarySupportLevel(
  playerFame: number,
  playerReputation: number,
  countryRelation: number
): 'none' | 'intel' | 'logistics' | 'backup' | 'full_support' {
  if (!canCooperateWithMilitary(playerFame, playerReputation, countryRelation)) {
    return 'none';
  }

  const supportScore = (playerFame / 2) + playerReputation + (countryRelation * 10);

  if (supportScore >= 120) return 'full_support';
  if (supportScore >= 90) return 'backup';
  if (supportScore >= 60) return 'logistics';
  return 'intel';
}

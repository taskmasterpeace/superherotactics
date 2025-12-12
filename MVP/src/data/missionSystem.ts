/**
 * Mission System
 *
 * Defines mission templates for:
 * - Special Operations (Extract, Escort, Protect, Assassinate, Rescue, Capture & Hold)
 * - Investigations
 * - Patrol
 * - Skirmish (Team vs Team)
 *
 * Mission sources: Police, Military, Special Forces, Underworld, Terrorism
 */

// =============================================================================
// MISSION TYPES
// =============================================================================

export type MissionType =
  | 'extract'           // Get someone/something out
  | 'escort'            // Protect while moving
  | 'protect'           // Defend a location/person
  | 'assassinate'       // Eliminate single target
  | 'skirmish'          // Team vs Team combat
  | 'rescue'            // Save captured person
  | 'capture_hold'      // Take and defend position
  | 'investigate'       // Detective work
  | 'patrol'            // Routine patrol
  | 'infiltrate'        // Stealth insertion
  | 'sabotage';         // Destroy target without direct combat

export type MissionSource =
  | 'police'            // Local law enforcement
  | 'military'          // National military
  | 'special_forces'    // Elite/covert ops
  | 'underworld'        // Criminal organizations
  | 'terrorism'         // Ideological groups
  | 'handler'           // Your government handler
  | 'private';          // Private contracts

export type MissionDifficulty = 1 | 2 | 3 | 4 | 5;  // 1=Easy, 5=Extreme

// =============================================================================
// MISSION TEMPLATE INTERFACE
// =============================================================================

export interface MissionTemplate {
  id: string;
  type: MissionType;
  name: string;
  description: string;
  source: MissionSource;

  // Requirements
  minSquadSize: number;
  maxSquadSize: number;
  recommendedThreatLevel: number;  // 1-9

  // Difficulty factors
  baseDifficulty: MissionDifficulty;
  dangerLevel: number;  // 1-10, affects injury chance

  // Time
  estimatedDurationMinutes: number;
  timeLimit?: number;  // Game minutes, optional

  // Rewards
  baseReward: number;  // Cash
  fameReward: number;  // Fame points
  reputationChange: number;  // -100 to +100

  // Combat settings
  expectedEnemies: { min: number; max: number };
  combatRequired: boolean;
  stealthOption: boolean;

  // Special conditions
  requiresSpecificSkill?: string[];
  requiresEquipment?: string[];
}

// =============================================================================
// MISSION TEMPLATES
// =============================================================================

export const MISSION_TEMPLATES: MissionTemplate[] = [
  // ===================== EXTRACT =====================
  {
    id: 'extract_vip',
    type: 'extract',
    name: 'VIP Extraction',
    description: 'Extract a high-value asset from hostile territory.',
    source: 'handler',
    minSquadSize: 2,
    maxSquadSize: 6,
    recommendedThreatLevel: 2,
    baseDifficulty: 3,
    dangerLevel: 6,
    estimatedDurationMinutes: 45,
    timeLimit: 90,
    baseReward: 15000,
    fameReward: 150,
    reputationChange: 10,
    expectedEnemies: { min: 8, max: 15 },
    combatRequired: false,
    stealthOption: true,
  },
  {
    id: 'extract_data',
    type: 'extract',
    name: 'Data Recovery',
    description: 'Retrieve sensitive data from a secure facility.',
    source: 'handler',
    minSquadSize: 1,
    maxSquadSize: 4,
    recommendedThreatLevel: 2,
    baseDifficulty: 2,
    dangerLevel: 4,
    estimatedDurationMinutes: 30,
    baseReward: 8000,
    fameReward: 75,
    reputationChange: 5,
    expectedEnemies: { min: 4, max: 10 },
    combatRequired: false,
    stealthOption: true,
    requiresSpecificSkill: ['hacking', 'electronics'],
  },

  // ===================== ESCORT =====================
  {
    id: 'escort_convoy',
    type: 'escort',
    name: 'Convoy Escort',
    description: 'Protect a supply convoy through hostile territory.',
    source: 'military',
    minSquadSize: 3,
    maxSquadSize: 8,
    recommendedThreatLevel: 2,
    baseDifficulty: 3,
    dangerLevel: 7,
    estimatedDurationMinutes: 60,
    baseReward: 12000,
    fameReward: 100,
    reputationChange: 8,
    expectedEnemies: { min: 10, max: 20 },
    combatRequired: true,
    stealthOption: false,
  },
  {
    id: 'escort_witness',
    type: 'escort',
    name: 'Witness Protection',
    description: 'Escort a witness safely to a secure location.',
    source: 'police',
    minSquadSize: 2,
    maxSquadSize: 4,
    recommendedThreatLevel: 1,
    baseDifficulty: 2,
    dangerLevel: 5,
    estimatedDurationMinutes: 45,
    baseReward: 6000,
    fameReward: 80,
    reputationChange: 12,
    expectedEnemies: { min: 5, max: 12 },
    combatRequired: false,
    stealthOption: true,
  },

  // ===================== PROTECT =====================
  {
    id: 'protect_location',
    type: 'protect',
    name: 'Location Defense',
    description: 'Defend a strategic location against enemy assault.',
    source: 'military',
    minSquadSize: 4,
    maxSquadSize: 10,
    recommendedThreatLevel: 2,
    baseDifficulty: 3,
    dangerLevel: 8,
    estimatedDurationMinutes: 90,
    baseReward: 20000,
    fameReward: 200,
    reputationChange: 15,
    expectedEnemies: { min: 15, max: 30 },
    combatRequired: true,
    stealthOption: false,
  },
  {
    id: 'protect_dignitary',
    type: 'protect',
    name: 'VIP Protection',
    description: 'Provide security for a high-profile individual.',
    source: 'handler',
    minSquadSize: 2,
    maxSquadSize: 6,
    recommendedThreatLevel: 2,
    baseDifficulty: 2,
    dangerLevel: 5,
    estimatedDurationMinutes: 120,
    baseReward: 10000,
    fameReward: 120,
    reputationChange: 10,
    expectedEnemies: { min: 0, max: 8 },  // May have no combat
    combatRequired: false,
    stealthOption: false,
  },

  // ===================== ASSASSINATE =====================
  {
    id: 'assassinate_target',
    type: 'assassinate',
    name: 'Target Elimination',
    description: 'Eliminate a high-value target. Confirm the kill.',
    source: 'special_forces',
    minSquadSize: 1,
    maxSquadSize: 4,
    recommendedThreatLevel: 3,
    baseDifficulty: 4,
    dangerLevel: 7,
    estimatedDurationMinutes: 40,
    baseReward: 25000,
    fameReward: 50,  // Low fame - covert op
    reputationChange: -5,  // Controversial
    expectedEnemies: { min: 1, max: 1 },  // Single target
    combatRequired: true,
    stealthOption: true,
  },
  {
    id: 'assassinate_warlord',
    type: 'assassinate',
    name: 'Warlord Elimination',
    description: 'Take out a dangerous warlord and their inner circle.',
    source: 'handler',
    minSquadSize: 3,
    maxSquadSize: 6,
    recommendedThreatLevel: 3,
    baseDifficulty: 5,
    dangerLevel: 9,
    estimatedDurationMinutes: 60,
    baseReward: 50000,
    fameReward: 300,
    reputationChange: 20,
    expectedEnemies: { min: 10, max: 25 },
    combatRequired: true,
    stealthOption: true,
  },

  // ===================== SKIRMISH =====================
  {
    id: 'skirmish_gang',
    type: 'skirmish',
    name: 'Gang Takedown',
    description: 'Engage and neutralize a criminal gang operation.',
    source: 'police',
    minSquadSize: 4,
    maxSquadSize: 8,
    recommendedThreatLevel: 1,
    baseDifficulty: 2,
    dangerLevel: 5,
    estimatedDurationMinutes: 30,
    baseReward: 5000,
    fameReward: 100,
    reputationChange: 8,
    expectedEnemies: { min: 6, max: 12 },
    combatRequired: true,
    stealthOption: false,
  },
  {
    id: 'skirmish_militia',
    type: 'skirmish',
    name: 'Militia Engagement',
    description: 'Engage hostile militia forces in open combat.',
    source: 'military',
    minSquadSize: 6,
    maxSquadSize: 12,
    recommendedThreatLevel: 2,
    baseDifficulty: 3,
    dangerLevel: 7,
    estimatedDurationMinutes: 45,
    baseReward: 15000,
    fameReward: 180,
    reputationChange: 12,
    expectedEnemies: { min: 12, max: 24 },
    combatRequired: true,
    stealthOption: false,
  },

  // ===================== RESCUE =====================
  {
    id: 'rescue_hostage',
    type: 'rescue',
    name: 'Hostage Rescue',
    description: 'Rescue hostages from a fortified location.',
    source: 'special_forces',
    minSquadSize: 4,
    maxSquadSize: 8,
    recommendedThreatLevel: 2,
    baseDifficulty: 4,
    dangerLevel: 8,
    estimatedDurationMinutes: 45,
    timeLimit: 60,
    baseReward: 20000,
    fameReward: 250,
    reputationChange: 20,
    expectedEnemies: { min: 10, max: 18 },
    combatRequired: true,
    stealthOption: true,
  },
  {
    id: 'rescue_agent',
    type: 'rescue',
    name: 'Agent Recovery',
    description: 'Rescue a captured operative before they talk.',
    source: 'handler',
    minSquadSize: 2,
    maxSquadSize: 6,
    recommendedThreatLevel: 3,
    baseDifficulty: 4,
    dangerLevel: 7,
    estimatedDurationMinutes: 40,
    timeLimit: 90,
    baseReward: 18000,
    fameReward: 100,
    reputationChange: 10,
    expectedEnemies: { min: 8, max: 14 },
    combatRequired: false,
    stealthOption: true,
  },

  // ===================== CAPTURE & HOLD =====================
  {
    id: 'capture_outpost',
    type: 'capture_hold',
    name: 'Outpost Capture',
    description: 'Capture and hold an enemy outpost.',
    source: 'military',
    minSquadSize: 6,
    maxSquadSize: 12,
    recommendedThreatLevel: 2,
    baseDifficulty: 3,
    dangerLevel: 7,
    estimatedDurationMinutes: 90,
    baseReward: 25000,
    fameReward: 200,
    reputationChange: 15,
    expectedEnemies: { min: 15, max: 25 },
    combatRequired: true,
    stealthOption: false,
  },
  {
    id: 'capture_building',
    type: 'capture_hold',
    name: 'Building Seizure',
    description: 'Seize and secure a strategic building.',
    source: 'special_forces',
    minSquadSize: 4,
    maxSquadSize: 8,
    recommendedThreatLevel: 2,
    baseDifficulty: 3,
    dangerLevel: 6,
    estimatedDurationMinutes: 60,
    baseReward: 15000,
    fameReward: 150,
    reputationChange: 10,
    expectedEnemies: { min: 8, max: 16 },
    combatRequired: true,
    stealthOption: true,
  },

  // ===================== INVESTIGATE =====================
  {
    id: 'investigate_crime',
    type: 'investigate',
    name: 'Crime Investigation',
    description: 'Investigate a crime scene and gather evidence.',
    source: 'police',
    minSquadSize: 1,
    maxSquadSize: 3,
    recommendedThreatLevel: 1,
    baseDifficulty: 2,
    dangerLevel: 2,
    estimatedDurationMinutes: 120,
    baseReward: 3000,
    fameReward: 50,
    reputationChange: 5,
    expectedEnemies: { min: 0, max: 3 },
    combatRequired: false,
    stealthOption: false,
    requiresSpecificSkill: ['investigation', 'forensics'],
  },
  {
    id: 'investigate_conspiracy',
    type: 'investigate',
    name: 'Conspiracy Investigation',
    description: 'Uncover a deep conspiracy within the government.',
    source: 'handler',
    minSquadSize: 1,
    maxSquadSize: 2,
    recommendedThreatLevel: 2,
    baseDifficulty: 4,
    dangerLevel: 5,
    estimatedDurationMinutes: 240,
    baseReward: 10000,
    fameReward: 100,
    reputationChange: 15,
    expectedEnemies: { min: 0, max: 6 },
    combatRequired: false,
    stealthOption: true,
    requiresSpecificSkill: ['investigation', 'intelligence'],
  },

  // ===================== PATROL =====================
  {
    id: 'patrol_city',
    type: 'patrol',
    name: 'City Patrol',
    description: 'Routine patrol to maintain presence and deter crime.',
    source: 'handler',
    minSquadSize: 1,
    maxSquadSize: 4,
    recommendedThreatLevel: 1,
    baseDifficulty: 1,
    dangerLevel: 3,
    estimatedDurationMinutes: 480,  // 8 hours
    baseReward: 1000,
    fameReward: 30,
    reputationChange: 2,
    expectedEnemies: { min: 0, max: 5 },
    combatRequired: false,
    stealthOption: false,
  },
];

// =============================================================================
// MISSION GENERATION
// =============================================================================

export interface GeneratedMission {
  id: string;
  template: MissionTemplate;
  sector: string;
  city?: string;
  targetName?: string;
  briefing: string;
  reward: number;
  fameReward: number;
  difficulty: MissionDifficulty;
  dangerLevel: number;
  timeLimit?: number;
  expiresAt?: number;  // Game timestamp
  status: 'available' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'expired';
}

/**
 * Generate a mission from a template with randomization
 */
export function generateMission(
  template: MissionTemplate,
  sector: string,
  city?: string,
  difficultyModifier: number = 0
): GeneratedMission {
  const modifiedDifficulty = Math.max(1, Math.min(5,
    template.baseDifficulty + difficultyModifier
  )) as MissionDifficulty;

  // Scale rewards based on difficulty
  const difficultyMultiplier = 1 + ((modifiedDifficulty - template.baseDifficulty) * 0.25);

  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    template,
    sector,
    city,
    briefing: template.description,
    reward: Math.round(template.baseReward * difficultyMultiplier),
    fameReward: Math.round(template.fameReward * difficultyMultiplier),
    difficulty: modifiedDifficulty,
    dangerLevel: Math.min(10, template.dangerLevel + difficultyModifier),
    timeLimit: template.timeLimit,
    status: 'available',
  };
}

/**
 * Get missions available for a source
 */
export function getMissionsBySource(source: MissionSource): MissionTemplate[] {
  return MISSION_TEMPLATES.filter(m => m.source === source);
}

/**
 * Get missions by type
 */
export function getMissionsByType(type: MissionType): MissionTemplate[] {
  return MISSION_TEMPLATES.filter(m => m.type === type);
}

// =============================================================================
// MISSION TYPE DESCRIPTIONS
// =============================================================================

export const MISSION_TYPE_INFO: Record<MissionType, { name: string; description: string; icon: string }> = {
  extract: {
    name: 'Extraction',
    description: 'Get someone or something out of a hostile location',
    icon: '🚁',
  },
  escort: {
    name: 'Escort',
    description: 'Protect a person or convoy while moving',
    icon: '🛡️',
  },
  protect: {
    name: 'Protection',
    description: 'Defend a location or person from attack',
    icon: '🏰',
  },
  assassinate: {
    name: 'Assassination',
    description: 'Eliminate a specific target',
    icon: '🎯',
  },
  skirmish: {
    name: 'Skirmish',
    description: 'Engage enemy forces in combat',
    icon: '⚔️',
  },
  rescue: {
    name: 'Rescue',
    description: 'Save captured personnel',
    icon: '🆘',
  },
  capture_hold: {
    name: 'Capture & Hold',
    description: 'Take and defend a position',
    icon: '🚩',
  },
  investigate: {
    name: 'Investigation',
    description: 'Gather intel and uncover secrets',
    icon: '🔍',
  },
  patrol: {
    name: 'Patrol',
    description: 'Routine patrol and presence',
    icon: '👁️',
  },
  infiltrate: {
    name: 'Infiltration',
    description: 'Covert insertion into enemy territory',
    icon: '🥷',
  },
  sabotage: {
    name: 'Sabotage',
    description: 'Destroy target without direct combat',
    icon: '💣',
  },
};

export default {
  MISSION_TEMPLATES,
  MISSION_TYPE_INFO,
  generateMission,
  getMissionsBySource,
  getMissionsByType,
};

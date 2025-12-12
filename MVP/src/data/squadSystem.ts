/**
 * Squad System for SuperHero Tactics
 *
 * Squads are groups of characters assigned to missions.
 * Each squad can be assigned to a vehicle for travel.
 *
 * Squad mechanics like Jagged Alliance 2:
 * - Characters have personalities that affect squad chemistry
 * - Personalities determine behavior in cities (idle activities)
 * - Squad morale affects performance
 */

import { Vehicle, getVehicleById, canFitSquad } from './vehicleSystem';
import { TravelModifier, calculateTravel, TravelMode, TerrainType } from './travelSystem';

// =============================================================================
// PERSONALITY TYPES (MBTI-based, like your docs)
// =============================================================================

export type PersonalityType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

export interface PersonalityInfo {
  type: PersonalityType;
  name: string;                    // Friendly name
  description: string;
  exampleCharacter: string;        // Famous character with this type

  // Combat AI preferences (from your CSV)
  targetPreference: 1 | 2 | 3 | 4 | 5;  // 1=MostHP, 2=LeastHP, 3=MajorThreat, 4=MinorThreat, 5=Random

  // City idle behavior tendencies
  idleBehavior: {
    socialize: number;      // 1-5, tendency to socialize
    train: number;          // 1-5, tendency to train
    explore: number;        // 1-5, tendency to explore
    rest: number;           // 1-5, tendency to rest
    shop: number;           // 1-5, tendency to shop/spend money
    causesTrouble: number;  // 1-5, tendency to get into trouble
  };

  // Team compatibility (affects morale when paired)
  bestWith: PersonalityType[];     // +morale bonus
  conflictsWith: PersonalityType[]; // -morale penalty
}

export const PERSONALITIES: Record<PersonalityType, PersonalityInfo> = {
  ISTJ: {
    type: 'ISTJ',
    name: 'Inspector',
    description: 'Reliable, thorough, dependable. Follows rules and expects others to.',
    exampleCharacter: 'Captain America',
    targetPreference: 1, // Most Health - systematic
    idleBehavior: { socialize: 2, train: 4, explore: 2, rest: 3, shop: 2, causesTrouble: 1 },
    bestWith: ['ESTJ', 'ISFJ', 'ESFJ'],
    conflictsWith: ['ENFP', 'ENTP'],
  },
  ISFJ: {
    type: 'ISFJ',
    name: 'Protector',
    description: 'Caring, supportive, loyal. Puts others first.',
    exampleCharacter: 'Jon Stewart (Green Lantern)',
    targetPreference: 1, // Most Health - protect team
    idleBehavior: { socialize: 4, train: 3, explore: 2, rest: 3, shop: 3, causesTrouble: 1 },
    bestWith: ['ESFJ', 'ISTJ', 'ISFP'],
    conflictsWith: ['ENTP', 'ESTP'],
  },
  INFJ: {
    type: 'INFJ',
    name: 'Counselor',
    description: 'Insightful, principled, compassionate. Seeks meaning and connection.',
    exampleCharacter: 'Vision',
    targetPreference: 3, // Major Threat - strategic
    idleBehavior: { socialize: 3, train: 3, explore: 4, rest: 4, shop: 2, causesTrouble: 1 },
    bestWith: ['ENFJ', 'INFP', 'INTJ'],
    conflictsWith: ['ESTP', 'ISTP'],
  },
  INTJ: {
    type: 'INTJ',
    name: 'Mastermind',
    description: 'Strategic, independent, determined. Always has a plan.',
    exampleCharacter: 'Batman',
    targetPreference: 3, // Major Threat - eliminate biggest danger
    idleBehavior: { socialize: 1, train: 5, explore: 3, rest: 2, shop: 2, causesTrouble: 2 },
    bestWith: ['ENTJ', 'INTP', 'INFJ'],
    conflictsWith: ['ESFP', 'ESFJ'],
  },
  ISTP: {
    type: 'ISTP',
    name: 'Crafter',
    description: 'Practical, observant, analytical. Masters of tools and machines.',
    exampleCharacter: 'Winter Soldier',
    targetPreference: 4, // Minor Threat - efficient cleanup
    idleBehavior: { socialize: 2, train: 4, explore: 3, rest: 3, shop: 3, causesTrouble: 3 },
    bestWith: ['ESTP', 'INTP', 'ISTJ'],
    conflictsWith: ['ENFJ', 'ESFJ'],
  },
  ISFP: {
    type: 'ISFP',
    name: 'Artist',
    description: 'Gentle, sensitive, helpful. Lives in the moment.',
    exampleCharacter: 'Elektra',
    targetPreference: 4, // Minor Threat
    idleBehavior: { socialize: 3, train: 2, explore: 5, rest: 3, shop: 4, causesTrouble: 2 },
    bestWith: ['ESFP', 'ISFJ', 'INFP'],
    conflictsWith: ['ENTJ', 'ESTJ'],
  },
  INFP: {
    type: 'INFP',
    name: 'Idealist',
    description: 'Idealistic, empathetic, creative. Driven by values.',
    exampleCharacter: 'Superman',
    targetPreference: 4, // Minor Threat - merciful
    idleBehavior: { socialize: 3, train: 2, explore: 4, rest: 4, shop: 3, causesTrouble: 1 },
    bestWith: ['ENFP', 'INFJ', 'ISFP'],
    conflictsWith: ['ESTJ', 'ENTJ'],
  },
  INTP: {
    type: 'INTP',
    name: 'Architect',
    description: 'Logical, original, skeptical. Loves complex problems.',
    exampleCharacter: 'Bruce Banner',
    targetPreference: 1, // Most Health - analytical
    idleBehavior: { socialize: 1, train: 3, explore: 5, rest: 3, shop: 2, causesTrouble: 2 },
    bestWith: ['ENTP', 'INTJ', 'ISTP'],
    conflictsWith: ['ESFJ', 'ENFJ'],
  },
  ESTP: {
    type: 'ESTP',
    name: 'Promoter',
    description: 'Energetic, pragmatic, observant. Lives for action.',
    exampleCharacter: 'Wolverine',
    targetPreference: 3, // Major Threat - aggressive
    idleBehavior: { socialize: 5, train: 4, explore: 4, rest: 1, shop: 4, causesTrouble: 5 },
    bestWith: ['ISTP', 'ESFP', 'ESTP'],
    conflictsWith: ['INFJ', 'ISFJ'],
  },
  ESFP: {
    type: 'ESFP',
    name: 'Performer',
    description: 'Spontaneous, energetic, friendly. Center of attention.',
    exampleCharacter: 'Star-Lord',
    targetPreference: 5, // Random - unpredictable
    idleBehavior: { socialize: 5, train: 2, explore: 4, rest: 2, shop: 5, causesTrouble: 4 },
    bestWith: ['ESTP', 'ISFP', 'ENFP'],
    conflictsWith: ['INTJ', 'ISTJ'],
  },
  ENFP: {
    type: 'ENFP',
    name: 'Champion',
    description: 'Enthusiastic, creative, sociable. Sees possibilities everywhere.',
    exampleCharacter: 'Spider-Man',
    targetPreference: 5, // Random - follows instinct
    idleBehavior: { socialize: 5, train: 2, explore: 5, rest: 2, shop: 4, causesTrouble: 3 },
    bestWith: ['INFP', 'ENFJ', 'ENTP'],
    conflictsWith: ['ISTJ', 'ISTP'],
  },
  ENTP: {
    type: 'ENTP',
    name: 'Inventor',
    description: 'Quick, ingenious, outspoken. Loves debate and innovation.',
    exampleCharacter: 'Iron Man',
    targetPreference: 2, // Least Health - opportunistic
    idleBehavior: { socialize: 4, train: 3, explore: 5, rest: 1, shop: 4, causesTrouble: 4 },
    bestWith: ['INTP', 'ENFP', 'ENTJ'],
    conflictsWith: ['ISFJ', 'ISTJ'],
  },
  ESTJ: {
    type: 'ESTJ',
    name: 'Supervisor',
    description: 'Organized, logical, assertive. Natural leader.',
    exampleCharacter: 'Nick Fury (Classic)',
    targetPreference: 4, // Minor Threat - systematic
    idleBehavior: { socialize: 3, train: 4, explore: 2, rest: 2, shop: 3, causesTrouble: 2 },
    bestWith: ['ISTJ', 'ENTJ', 'ESFJ'],
    conflictsWith: ['INFP', 'ISFP'],
  },
  ESFJ: {
    type: 'ESFJ',
    name: 'Provider',
    description: 'Caring, sociable, traditional. Wants harmony.',
    exampleCharacter: 'Luke Cage',
    targetPreference: 2, // Least Health - protect weak
    idleBehavior: { socialize: 5, train: 3, explore: 2, rest: 3, shop: 4, causesTrouble: 1 },
    bestWith: ['ISFJ', 'ESTJ', 'ENFJ'],
    conflictsWith: ['INTP', 'INTJ'],
  },
  ENFJ: {
    type: 'ENFJ',
    name: 'Giver',
    description: 'Charismatic, empathetic, organized. Natural teacher.',
    exampleCharacter: 'Storm',
    targetPreference: 3, // Major Threat - strategic
    idleBehavior: { socialize: 5, train: 3, explore: 3, rest: 2, shop: 3, causesTrouble: 1 },
    bestWith: ['INFJ', 'ENFP', 'ESFJ'],
    conflictsWith: ['ISTP', 'INTP'],
  },
  ENTJ: {
    type: 'ENTJ',
    name: 'Executive',
    description: 'Bold, imaginative, strong-willed. Born commander.',
    exampleCharacter: 'Nick Fury (Modern)',
    targetPreference: 2, // Least Health - decisive
    idleBehavior: { socialize: 4, train: 5, explore: 3, rest: 1, shop: 3, causesTrouble: 3 },
    bestWith: ['INTJ', 'ENTP', 'ESTJ'],
    conflictsWith: ['INFP', 'ISFP'],
  },
};

// =============================================================================
// SQUAD MEMBER
// =============================================================================

export interface SquadMember {
  characterId: string;
  name: string;
  personality: PersonalityType;
  role: 'leader' | 'member';

  // Stats relevant to squad
  health: number;           // Current HP percentage (0-100)
  morale: number;           // Current morale (0-100)
  stamina: number;          // Affects travel speed

  // Skills relevant to travel
  pilotingGround: number;   // 0-100
  pilotingAir: number;      // 0-100
  pilotingWater: number;    // 0-100
  survival: number;         // 0-100
  stealth: number;          // 0-100

  // Active modifiers from powers/equipment
  travelModifiers: TravelModifier[];
}

// =============================================================================
// SQUAD
// =============================================================================

export type SquadStatus =
  | 'idle'          // At base, ready for assignment
  | 'traveling'     // Moving between sectors
  | 'on_mission'    // Currently on a mission
  | 'resting'       // Recovering
  | 'training';     // Training in city

export interface Squad {
  id: string;
  name: string;
  status: SquadStatus;

  // Members
  members: SquadMember[];
  leaderId: string;         // characterId of squad leader

  // Vehicle assignment
  vehicleId?: string;       // Assigned vehicle ID
  vehicle?: Vehicle;        // Cached vehicle data

  // Location
  currentSector: string;    // e.g., "K15"
  destinationSector?: string;

  // Travel state
  travelProgress?: number;  // 0-100% of journey complete
  travelTimeRemaining?: number; // Game days remaining
  travelMode?: TravelMode;

  // Morale
  squadMorale: number;      // 0-100, affects performance
}

// =============================================================================
// SQUAD CHEMISTRY CALCULATIONS
// =============================================================================

/**
 * Calculate squad morale based on personality compatibility
 */
export function calculateSquadMorale(members: SquadMember[]): number {
  if (members.length === 0) return 0;
  if (members.length === 1) return members[0].morale;

  let totalMorale = 0;
  let interactions = 0;

  // Check each pair of members
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const p1 = PERSONALITIES[members[i].personality];
      const p2 = PERSONALITIES[members[j].personality];

      let pairBonus = 0;

      // Best matches: +10 morale
      if (p1.bestWith.includes(members[j].personality)) pairBonus += 10;
      if (p2.bestWith.includes(members[i].personality)) pairBonus += 10;

      // Conflicts: -10 morale
      if (p1.conflictsWith.includes(members[j].personality)) pairBonus -= 10;
      if (p2.conflictsWith.includes(members[i].personality)) pairBonus -= 10;

      totalMorale += pairBonus;
      interactions++;
    }
  }

  // Base morale is average of individual morale
  const baseMorale = members.reduce((sum, m) => sum + m.morale, 0) / members.length;

  // Add chemistry bonus/penalty (capped)
  const chemistryMod = interactions > 0 ? totalMorale / interactions : 0;

  return Math.max(0, Math.min(100, baseMorale + chemistryMod));
}

/**
 * Get idle behavior for squad member in a city
 */
export function getIdleBehavior(member: SquadMember): string {
  const personality = PERSONALITIES[member.personality];
  const behavior = personality.idleBehavior;

  // Weight random selection by tendencies
  const weights = [
    { action: 'socializing', weight: behavior.socialize },
    { action: 'training', weight: behavior.train },
    { action: 'exploring', weight: behavior.explore },
    { action: 'resting', weight: behavior.rest },
    { action: 'shopping', weight: behavior.shop },
    { action: 'causing trouble', weight: behavior.causesTrouble },
  ];

  // Simple weighted random (for now, can make deterministic later)
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of weights) {
    random -= w.weight;
    if (random <= 0) return w.action;
  }

  return 'resting';
}

// =============================================================================
// VEHICLE ASSIGNMENT
// =============================================================================

export interface VehicleAssignmentResult {
  success: boolean;
  reason?: string;
  warnings?: string[];
}

/**
 * Assign a vehicle to a squad
 */
export function assignVehicleToSquad(
  squad: Squad,
  vehicleId: string
): VehicleAssignmentResult {
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) {
    return { success: false, reason: `Vehicle ${vehicleId} not found` };
  }

  const warnings: string[] = [];

  // Check capacity
  if (!canFitSquad(vehicle, squad.members.length)) {
    return {
      success: false,
      reason: `Vehicle capacity (${vehicle.passengers}) is less than squad size (${squad.members.length})`,
    };
  }

  // Check if anyone can pilot it
  const requiredSkill = vehicle.skillRequired;
  if (requiredSkill) {
    const canPilot = squad.members.some(m => {
      if (requiredSkill === 'piloting_ground') return m.pilotingGround >= 30;
      if (requiredSkill === 'piloting_air') return m.pilotingAir >= 50;
      if (requiredSkill === 'piloting_water') return m.pilotingWater >= 40;
      return false;
    });

    if (!canPilot) {
      warnings.push(`No squad member has the required ${requiredSkill} skill`);
    }
  }

  // Assign
  squad.vehicleId = vehicleId;
  squad.vehicle = vehicle;
  squad.travelMode = vehicle.travelMode;

  return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
}

// =============================================================================
// TRAVEL CALCULATIONS FOR SQUAD
// =============================================================================

/**
 * Collect all travel modifiers from squad (powers, skills, equipment, vehicle)
 */
export function collectSquadModifiers(squad: Squad): TravelModifier[] {
  const modifiers: TravelModifier[] = [];

  // Collect from members
  for (const member of squad.members) {
    modifiers.push(...member.travelModifiers);
  }

  // Collect from vehicle
  if (squad.vehicle?.travelModifiers) {
    modifiers.push(...squad.vehicle.travelModifiers);
  }

  return modifiers;
}

/**
 * Calculate if squad can travel through terrain
 */
export function canSquadTraverse(
  squad: Squad,
  terrain: TerrainType
): { canTraverse: boolean; reason?: string } {
  if (!squad.travelMode) {
    return { canTraverse: false, reason: 'No travel mode set (assign a vehicle)' };
  }

  const modifiers = collectSquadModifiers(squad);
  const result = calculateTravel({
    terrain,
    travelMode: squad.travelMode,
    modifiers,
  });

  return {
    canTraverse: result.canTraverse,
    reason: result.reason,
  };
}

// =============================================================================
// SQUAD CREATION HELPERS
// =============================================================================

export function createSquad(
  id: string,
  name: string,
  members: SquadMember[],
  startingSector: string
): Squad {
  // First member is leader by default if no leader set
  const leader = members.find(m => m.role === 'leader') || members[0];
  if (leader) leader.role = 'leader';

  return {
    id,
    name,
    status: 'idle',
    members,
    leaderId: leader?.characterId || '',
    currentSector: startingSector,
    squadMorale: calculateSquadMorale(members),
  };
}

export function addMemberToSquad(squad: Squad, member: SquadMember): boolean {
  // Check vehicle capacity if assigned
  if (squad.vehicle && squad.members.length >= squad.vehicle.passengers) {
    return false;
  }

  squad.members.push(member);
  squad.squadMorale = calculateSquadMorale(squad.members);
  return true;
}

export function removeMemberFromSquad(squad: Squad, characterId: string): boolean {
  const index = squad.members.findIndex(m => m.characterId === characterId);
  if (index === -1) return false;

  squad.members.splice(index, 1);
  squad.squadMorale = calculateSquadMorale(squad.members);

  // If leader was removed, assign new leader
  if (squad.leaderId === characterId && squad.members.length > 0) {
    squad.members[0].role = 'leader';
    squad.leaderId = squad.members[0].characterId;
  }

  return true;
}

// =============================================================================
// GEOPOLITICS SYSTEM
// =============================================================================
// Country relationships, wars, alliances, and international tensions

// Relationship scale: 1=At War, 2=Hostile, 3=Tense, 4=Neutral, 5=Friendly, 6=Allied
export type RelationshipLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const RELATIONSHIP_NAMES: Record<RelationshipLevel, string> = {
  1: 'At War',
  2: 'Hostile',
  3: 'Tense',
  4: 'Neutral',
  5: 'Friendly',
  6: 'Allied',
};

export interface CountryRelation {
  countryA: string; // Country code
  countryB: string;
  level: RelationshipLevel;
  since: Date; // When this status began
  reason?: string; // Why (historical, recent conflict, etc.)
}

export interface ActiveConflict {
  id: string;
  type: 'hot_war' | 'cold_war' | 'civil_war' | 'insurgency' | 'border_skirmish';
  participants: {
    side1: string[]; // Country codes
    side2: string[];
  };
  startDate: Date;
  intensity: number; // 1-100
  location?: string; // Primary theater
  casualties: number;
}

export interface Alliance {
  id: string;
  name: string;
  type: 'military' | 'economic' | 'mutual_defense' | 'trade_bloc';
  members: string[];
  founded: Date;
  strength: number; // 1-100 (how likely to honor commitments)
}

export interface GeopoliticsState {
  relations: CountryRelation[];
  conflicts: ActiveConflict[];
  alliances: Alliance[];
  lastUpdated: Date;
}

// =============================================================================
// DEFAULT RELATIONS (Major powers and significant conflicts)
// =============================================================================

export const DEFAULT_CONFLICTS: ActiveConflict[] = [
  // Major ongoing conflicts (as of game start)
  {
    id: 'conflict-1',
    type: 'cold_war',
    participants: {
      side1: ['US', 'GB', 'FR', 'DE'],
      side2: ['RU', 'CN', 'IR'],
    },
    startDate: new Date('2020-01-01'),
    intensity: 40,
    location: 'Global',
    casualties: 0,
  },
  {
    id: 'conflict-2',
    type: 'civil_war',
    participants: {
      side1: ['SY-GOV'],
      side2: ['SY-REBEL'],
    },
    startDate: new Date('2011-03-15'),
    intensity: 60,
    location: 'Syria',
    casualties: 500000,
  },
];

export const DEFAULT_ALLIANCES: Alliance[] = [
  {
    id: 'nato',
    name: 'NATO',
    type: 'military',
    members: ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'NO', 'DK', 'NL', 'BE'],
    founded: new Date('1949-04-04'),
    strength: 85,
  },
  {
    id: 'eu',
    name: 'European Union',
    type: 'economic',
    members: ['DE', 'FR', 'IT', 'ES', 'PL', 'NL', 'BE', 'AT', 'SE', 'FI', 'PT', 'GR', 'IE'],
    founded: new Date('1993-11-01'),
    strength: 70,
  },
  {
    id: 'five-eyes',
    name: 'Five Eyes',
    type: 'military',
    members: ['US', 'GB', 'CA', 'AU', 'NZ'],
    founded: new Date('1946-01-01'),
    strength: 95,
  },
];

// =============================================================================
// GEOPOLITICS FUNCTIONS
// =============================================================================

export function getRelation(
  state: GeopoliticsState,
  countryA: string,
  countryB: string
): RelationshipLevel {
  if (countryA === countryB) return 6; // Same country = allied

  const relation = state.relations.find(
    r => (r.countryA === countryA && r.countryB === countryB) ||
         (r.countryA === countryB && r.countryB === countryA)
  );

  return relation?.level ?? 4; // Default to neutral
}

export function areAtWar(
  state: GeopoliticsState,
  countryA: string,
  countryB: string
): boolean {
  return getRelation(state, countryA, countryB) === 1;
}

export function areAllied(
  state: GeopoliticsState,
  countryA: string,
  countryB: string
): boolean {
  // Check direct alliance
  if (getRelation(state, countryA, countryB) === 6) return true;

  // Check shared alliance membership
  return state.alliances.some(
    a => a.type === 'military' &&
         a.members.includes(countryA) &&
         a.members.includes(countryB)
  );
}

export function getConflictIntensity(
  state: GeopoliticsState,
  countryCode: string
): number {
  // Find conflicts involving this country
  const involvedConflicts = state.conflicts.filter(c =>
    c.participants.side1.includes(countryCode) ||
    c.participants.side2.includes(countryCode)
  );

  if (involvedConflicts.length === 0) return 0;

  // Return highest intensity
  return Math.max(...involvedConflicts.map(c => c.intensity));
}

// =============================================================================
// GAMEPLAY EFFECTS
// =============================================================================

export interface GeopoliticsEffects {
  travelAllowed: boolean;
  travelDifficulty: number; // 0-100 (0 = easy, 100 = impossible)
  missionModifier: number; // Affects mission availability
  equipmentAccess: number; // Military gear from allied nations
  intelSharing: boolean;
}

export function calculateGeopoliticsEffects(
  state: GeopoliticsState,
  fromCountry: string,
  toCountry: string
): GeopoliticsEffects {
  const relation = getRelation(state, fromCountry, toCountry);
  const warIntensity = getConflictIntensity(state, toCountry);

  // Base effects from relationship level
  const effects: GeopoliticsEffects = {
    travelAllowed: relation > 1,
    travelDifficulty: Math.max(0, (6 - relation) * 20 + warIntensity / 2),
    missionModifier: (relation - 4) * 10, // -30 to +20
    equipmentAccess: relation >= 5 ? 50 + (relation - 5) * 30 : 0,
    intelSharing: relation >= 5,
  };

  // At war = no travel
  if (relation === 1) {
    effects.travelAllowed = false;
    effects.travelDifficulty = 100;
    effects.missionModifier = -50;
  }

  return effects;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

export function createInitialGeopoliticsState(): GeopoliticsState {
  return {
    relations: [], // Will be populated from country data
    conflicts: DEFAULT_CONFLICTS,
    alliances: DEFAULT_ALLIANCES,
    lastUpdated: new Date(),
  };
}

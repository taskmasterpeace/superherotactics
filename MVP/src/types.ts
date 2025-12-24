export interface Country {
    id: number;
    code: string;
    name: string;
    president: string;
    population: number;
    populationRating: number;
    motto: string;
    nationality: string;
    governmentType: string;
    governmentPerception: string;
    governmentCorruption: number;
    presidentialTerm: number;
    leaderTitle: string;
    militaryServices: number;
    militaryBudget: number;
    intelligenceServices: number;
    intelligenceBudget: number;
    capitalPunishment: string;
    mediaFreedom: number;
    lawEnforcement: number;
    lawEnforcementBudget: number;
    gdpNational: number;
    gdpPerCapita: number;
    healthcare: number;
    higherEducation: number;
    socialDevelopment: number;
    lifestyle: number;
    terrorismActivity: string;
    cyberCapabilities: number;
    digitalDevelopment: number;
    science: number;
    cloning: string;
    lswActivity: number;
    lswRegulations: string;
    vigilantism: string;
    leaderGender: string;
    cultureCode: number;
    cultureGroup: string;
}

// =============================================================================
// CITY TYPES
// =============================================================================

export interface City {
    id: string;
    name: string;
    country: string;
    countryCode: string;
    sector: string;
    population: number;
    cityType1?: string;
    cityType2?: string;
    cityType3?: string;
    cityType4?: string;
    lat?: number;
    lng?: number;
}

// =============================================================================
// CHARACTER STATUS SYSTEM (15 statuses)
// =============================================================================

export type CharacterStatus =
    | 'ready'           // Idle, awaiting commands
    | 'preparing'       // Getting ready for an assignment (personality/career affects time)
    | 'hospital'        // Recovering from 0 HP (Origin 1-4)
    | 'investigation'   // Detective work
    | 'covert_ops'      // Investigations outside home country
    | 'personal_life'   // Day job, family time
    | 'training'        // Improve stats, maintain martial arts
    | 'patrol'          // Farm Fame, increase City Familiarity
    | 'off_the_grid'    // Character hiding/captured/missing
    | 'engineering'     // Build/repair tech suits, robots
    | 'research'        // Unlock tech, analyze evidence
    | 'travel'          // In transit
    | 'recruit'         // Use Fame to find vigilantes
    | 'unconscious'     // Temporary incapacitation
    | 'dead';           // Permadeath

// =============================================================================
// CAREER TYPES (affects prep time, skills, behavior)
// =============================================================================

export type CareerType =
    | 'soldier'         // Military - fastest prep, combat focused
    | 'special_forces'  // Elite military - very fast prep, covert ops
    | 'police'          // Law enforcement - fast prep, investigation bonus
    | 'scientist'       // Research focused - slow prep, INT bonus
    | 'engineer'        // Tech focused - medium prep, builds stuff
    | 'medic'           // Medical - medium prep, healing bonus
    | 'intelligence'    // Spy/analyst - medium prep, covert ops bonus
    | 'civilian'        // No training - slowest prep
    | 'mercenary'       // Gun for hire - fast prep, combat focused
    | 'vigilante';      // Self-trained hero - varies by personality

// Prep time in minutes by career (base, before personality modifier)
export const CAREER_PREP_TIME: Record<CareerType, number> = {
    soldier: 5,
    special_forces: 3,
    police: 10,
    scientist: 30,
    engineer: 20,
    medic: 15,
    intelligence: 10,
    civilian: 45,
    mercenary: 8,
    vigilante: 15,
};

// =============================================================================
// PERSONALITY PREP MODIFIERS
// =============================================================================

// MBTI-based prep time multipliers (some personalities are slower/faster)
export const PERSONALITY_PREP_MULTIPLIERS: Record<string, number> = {
    // Analysts - methodical, take their time
    'INTJ': 1.2,  // Architect - plans everything
    'INTP': 1.4,  // Logician - overthinks
    'ENTJ': 0.9,  // Commander - efficient
    'ENTP': 1.1,  // Debater - gets distracted
    // Diplomats - people focused
    'INFJ': 1.1,  // Advocate - careful
    'INFP': 1.3,  // Mediator - daydreams
    'ENFJ': 1.0,  // Protagonist - balanced
    'ENFP': 1.2,  // Campaigner - scattered
    // Sentinels - dutiful, reliable
    'ISTJ': 0.8,  // Logistician - always ready
    'ISFJ': 1.0,  // Defender - steady
    'ESTJ': 0.7,  // Executive - no-nonsense
    'ESFJ': 0.9,  // Consul - organized
    // Explorers - adaptable
    'ISTP': 0.8,  // Virtuoso - action-ready
    'ISFP': 1.1,  // Adventurer - goes with flow
    'ESTP': 0.6,  // Entrepreneur - instant action
    'ESFP': 0.9,  // Entertainer - spontaneous
};

// Default multiplier if no MBTI set
export const DEFAULT_PREP_MULTIPLIER = 1.0;

// =============================================================================
// NOTIFICATION/MESSAGE SYSTEM
// =============================================================================

export type NotificationType =
    | 'arrival'         // Character arrived at destination
    | 'departure'       // Character left location
    | 'status_change'   // Status changed (ready → preparing → travel)
    | 'mission'         // Mission related
    | 'mission_complete' // Mission completed successfully
    | 'mission_failed'  // Mission failed
    | 'combat'          // Combat started/ended
    | 'injury'          // Character injured
    | 'death'           // Character died
    | 'idle_warning'    // Character has been idle too long
    | 'call_incoming'   // Character calling you
    | 'email'           // Email received
    | 'world_event'     // Something happened in the world
    | 'handler'         // Handler message
    | 'investigation_discovered' // New investigation lead found
    | 'investigation_complete'   // Investigation completed
    | 'investigation_failed';    // Investigation failed

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface GameNotification {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    characterId?: string;      // Which character this is about
    characterName?: string;    // For display
    location?: string;         // City/sector
    timestamp: number;         // Game time when created
    realTimestamp: number;     // Real world timestamp
    read: boolean;
    dismissed: boolean;
    // For escalation (idle → text → call)
    escalationLevel?: number;  // 0 = initial, 1 = text, 2 = call
    nextEscalation?: number;   // Game time for next escalation
    // Action data
    actionType?: string;       // What action to take
    actionData?: Record<string, unknown>;
}

// Idle time thresholds (in game minutes)
export const IDLE_ESCALATION = {
    WARNING: 60,      // 1 hour idle → first warning
    TEXT: 120,        // 2 hours idle → text message
    CALL: 180,        // 3 hours idle → phone call
};

// =============================================================================
// ORIGIN TYPES (1-9, affects what happens at 0 HP)
// =============================================================================

export type OriginType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const ORIGIN_NAMES: Record<OriginType, string> = {
    1: 'Skilled Human',
    2: 'Altered Human',
    3: 'Tech Enhancement',
    4: 'Mutated Human',
    5: 'Spiritual Enhancement',
    6: 'Robotic',
    7: 'Symbiotic',
    8: 'Alien',
    9: 'Unknown',
};

// =============================================================================
// CITY FAMILIARITY
// =============================================================================

export interface CityFamiliarity {
    cityId: string;
    cityName: string;
    familiarity: number;  // 0-100
    lastVisited: number;  // Game timestamp (totalMinutes)
}

// =============================================================================
// PRIMARY STATS
// =============================================================================

export interface CharacterStats {
    MEL: number;  // Melee combat
    AGL: number;  // Agility/Dexterity
    STR: number;  // Strength
    STA: number;  // Stamina
    INT: number;  // Intelligence
    INS: number;  // Instinct/Perception
    CON: number;  // Constitution
}

// =============================================================================
// INJURY SYSTEM (from characterStatusSystem.ts)
// =============================================================================

export interface ActiveInjury {
    injuryId: string;
    bodyPart: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical' | 'permanent';
    receivedAt: number;       // Game timestamp
    recoveryProgress: number; // 0-100%
    treated: boolean;
    treatedBy?: string;       // Character ID
    installedProsthetic?: string;
}

// =============================================================================
// ENHANCED CHARACTER (Full character with all new fields)
// =============================================================================

export interface GameCharacter {
    id: string;
    name: string;              // Code name / hero name
    realName: string;          // Real name

    // Origin & Type
    origin: OriginType;
    threatLevel: string;       // THREAT_1 through THREAT_9
    career: CareerType;        // Job/training background (affects prep time)

    // Identity
    secretIdentity: boolean;   // If true, doesn't need personal_life time

    // Birth & Location
    birthCity: string;         // City ID from game's 1050 cities
    birthCountry: string;      // Country code
    nationality: string;       // Display nationality

    // Current Location
    currentCity?: string;      // Current city ID
    currentSector?: string;    // Current sector code (A1-T10)
    currentCountry?: string;   // Current country code

    // City Knowledge
    cityFamiliarities: CityFamiliarity[];

    // Status System (14 statuses)
    status: CharacterStatus;
    statusStartTime?: number;              // When current status began (game minutes)
    statusDuration?: number;               // How long status lasts (minutes)
    statusData?: Record<string, unknown>;  // Status-specific data

    // Primary Stats (1-100)
    stats: CharacterStats;

    // Secondary Stats
    fame: number;      // 0-5000 (earn from patrols, missions)
    wealth: number;    // Personal money (separate from team budget)

    // Health
    health: {
        current: number;
        maximum: number;
    };

    // Defense
    shield?: number;
    maxShield?: number;
    shieldRegen?: number;
    dr?: number;  // Damage Resistance from armor

    // Equipment
    equippedArmor?: string;
    equippedShield?: string;
    equipment: string[];  // Carried items

    // Abilities
    powers: string[];     // Superpowers
    skills?: string[];    // Learned skills
    talents?: string[];   // Natural talents
    martialArts?: {
        style: string;
        rank: number;     // Belt level 1-7
    };

    // Medical
    injuries: ActiveInjury[];
    medicalHistory: unknown[];
    recoveryTime: number;  // Days remaining in hospital
    missingBodyParts?: string[];
    installedProsthetics?: string[];

    // Personality (for merc system)
    personality?: {
        mbti?: string;         // INTJ, ENFP, etc.
        calling?: string;      // CallingId - WHY they fight (protector, mercenary, etc.)
        volatility?: number;   // 1-10, affects mood swings
        harmAvoidance?: number; // 1-10, willingness to kill
    };

    // Reputation
    reputation?: {
        public: number;        // -100 to 100
        media: number;         // -100 to 100
        wanted: number;        // 0-100 (wanted level)
        criminal: number;      // 0-100 (criminal record)
    };

    // Employment (for mercs)
    employment?: {
        contractType?: 'permanent' | 'contract' | 'freelance';
        employer?: string;
        dailyPay?: number;
        contractEnd?: number;  // Game timestamp
        morale?: number;       // 0-100
        fatigue?: number;      // 0-100
    };

    // Portrait/appearance
    portrait?: string;
    gender?: 'male' | 'female' | 'other';
    age?: number;
    handedness?: 'left' | 'right' | 'ambidextrous';
}

// =============================================================================
// CHARACTER GENERATION CONFIG
// =============================================================================

export interface CharacterGenerationConfig {
    // How many cities a character typically knows
    maxFamiliarCities: number;  // Default: 7

    // Bell curve for familiarity distribution
    // Most characters have 1-3 familiar cities, few have 5-7
    familiarCitiesDistribution: {
        weight1to2: number;   // % chance of 1-2 cities (e.g., 50%)
        weight3to4: number;   // % chance of 3-4 cities (e.g., 35%)
        weight5to7: number;   // % chance of 5-7 cities (e.g., 15%)
    };

    // Most people haven't left their country
    chanceLeftCountry: number;  // e.g., 30%

    // If they left, same culture code = more likely
    sameCultureBonus: number;   // e.g., 70% of foreign travel is same culture
}

export const DEFAULT_CHARACTER_GEN_CONFIG: CharacterGenerationConfig = {
    maxFamiliarCities: 7,
    familiarCitiesDistribution: {
        weight1to2: 50,
        weight3to4: 35,
        weight5to7: 15,
    },
    chanceLeftCountry: 30,
    sameCultureBonus: 70,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate how long a character takes to prepare for an assignment
 * Based on career (base time) × personality (multiplier)
 * Returns time in game minutes
 */
export function calculatePrepTime(character: GameCharacter): number {
    const baseTime = CAREER_PREP_TIME[character.career] || CAREER_PREP_TIME.civilian;
    const mbti = character.personality?.mbti;
    const multiplier = mbti
        ? (PERSONALITY_PREP_MULTIPLIERS[mbti] || DEFAULT_PREP_MULTIPLIER)
        : DEFAULT_PREP_MULTIPLIER;

    return Math.round(baseTime * multiplier);
}

/**
 * Get a human-readable description of prep time
 */
export function getPrepTimeDescription(minutes: number): string {
    if (minutes <= 5) return 'Almost instant';
    if (minutes <= 15) return 'Quick';
    if (minutes <= 30) return 'Moderate';
    if (minutes <= 45) return 'Takes a while';
    return 'Slow';
}

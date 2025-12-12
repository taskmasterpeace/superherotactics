/**
 * Travel & Movement System for SuperHero Tactics
 *
 * MODIFIER SYSTEM ARCHITECTURE
 * ============================
 * Base Rules + Modifiers = Final Result
 *
 * Every rule has a base value, but abilities/skills/powers/equipment
 * can add "modifiers" that override or adjust the base rule.
 *
 * This allows characters like "runs on water" without rewriting terrain rules.
 */

// =============================================================================
// TERRAIN TYPES
// =============================================================================

export type TerrainType =
  | 'ocean'      // Deep water - requires water/air travel
  | 'coastal'    // Shallow water - all travel types
  | 'land'       // Standard ground
  | 'arctic'     // Slow ground, slow air
  | 'desert'     // Slow ground, normal air
  | 'mountain'   // Very slow ground, slow air
  | 'jungle'     // Slow ground, can't see from air
  | 'forest'     // Moderate ground
  | 'plains';    // Fast ground, easy air

export type TravelMode = 'ground' | 'air' | 'water';

// =============================================================================
// BASE TERRAIN RULES
// =============================================================================

export interface TerrainRules {
  terrain: TerrainType;
  allowsGround: boolean;      // Can ground vehicles traverse?
  allowsAir: boolean;         // Can aircraft traverse?
  allowsWater: boolean;       // Can watercraft traverse?
  groundSpeedMod: number;     // 1.0 = normal, 0.5 = half speed, 0 = blocked
  airSpeedMod: number;
  waterSpeedMod: number;
  visibilityMod: number;      // 1.0 = clear, 0.5 = reduced
  detectionRisk: number;      // 0-100 chance of being detected while traversing
}

export const BASE_TERRAIN_RULES: Record<TerrainType, TerrainRules> = {
  ocean: {
    terrain: 'ocean',
    allowsGround: false,
    allowsAir: true,
    allowsWater: true,
    groundSpeedMod: 0,
    airSpeedMod: 1.0,
    waterSpeedMod: 1.0,
    visibilityMod: 1.0,
    detectionRisk: 20,
  },
  coastal: {
    terrain: 'coastal',
    allowsGround: true,
    allowsAir: true,
    allowsWater: true,
    groundSpeedMod: 0.8,
    airSpeedMod: 1.0,
    waterSpeedMod: 1.0,
    visibilityMod: 1.0,
    detectionRisk: 40,
  },
  land: {
    terrain: 'land',
    allowsGround: true,
    allowsAir: true,
    allowsWater: false,
    groundSpeedMod: 1.0,
    airSpeedMod: 1.0,
    waterSpeedMod: 0,
    visibilityMod: 1.0,
    detectionRisk: 50,
  },
  arctic: {
    terrain: 'arctic',
    allowsGround: true,  // Slow but possible
    allowsAir: true,
    allowsWater: false,  // Ice blocks ships
    groundSpeedMod: 0.4,
    airSpeedMod: 0.7,    // Weather affects air
    waterSpeedMod: 0,
    visibilityMod: 0.5,  // Blizzards
    detectionRisk: 30,
  },
  desert: {
    terrain: 'desert',
    allowsGround: true,
    allowsAir: true,
    allowsWater: false,
    groundSpeedMod: 0.6,
    airSpeedMod: 1.0,
    waterSpeedMod: 0,
    visibilityMod: 0.8,  // Sandstorms
    detectionRisk: 60,   // Easy to spot
  },
  mountain: {
    terrain: 'mountain',
    allowsGround: true,  // Very slow
    allowsAir: true,     // Slow
    allowsWater: false,
    groundSpeedMod: 0.3,
    airSpeedMod: 0.6,    // Altitude/wind
    waterSpeedMod: 0,
    visibilityMod: 0.7,
    detectionRisk: 30,
  },
  jungle: {
    terrain: 'jungle',
    allowsGround: true,
    allowsAir: true,     // But can't see below
    allowsWater: false,
    groundSpeedMod: 0.4,
    airSpeedMod: 1.0,
    waterSpeedMod: 0,
    visibilityMod: 0.3,  // Dense canopy
    detectionRisk: 20,
  },
  forest: {
    terrain: 'forest',
    allowsGround: true,
    allowsAir: true,
    allowsWater: false,
    groundSpeedMod: 0.7,
    airSpeedMod: 1.0,
    waterSpeedMod: 0,
    visibilityMod: 0.5,
    detectionRisk: 30,
  },
  plains: {
    terrain: 'plains',
    allowsGround: true,
    allowsAir: true,
    allowsWater: false,
    groundSpeedMod: 1.2,  // Easy terrain
    airSpeedMod: 1.0,
    waterSpeedMod: 0,
    visibilityMod: 1.0,
    detectionRisk: 70,   // Nowhere to hide
  },
};

// =============================================================================
// MODIFIER SYSTEM - The "Exceptions to Rules" Architecture
// =============================================================================

export type ModifierSource =
  | 'power'      // LSW powers (flight, super speed, water walking)
  | 'skill'      // Character skills (piloting, survival)
  | 'equipment'  // Gear (jetpack, all-terrain vehicle)
  | 'vehicle'    // Vehicle capabilities
  | 'talent'     // Special talents
  | 'trait';     // Character traits

export interface TravelModifier {
  id: string;
  name: string;
  source: ModifierSource;
  description: string;

  // Override terrain restrictions
  allowsGroundOverride?: boolean;   // If true, can traverse ground-blocked terrain
  allowsAirOverride?: boolean;      // If true, can traverse air-blocked terrain
  allowsWaterOverride?: boolean;    // If true, can traverse water-blocked terrain

  // Speed modifiers (multiplied with base terrain mod)
  groundSpeedBonus?: number;        // e.g., 1.5 = 50% faster
  airSpeedBonus?: number;
  waterSpeedBonus?: number;

  // Detection modifiers
  detectionMod?: number;            // -20 = 20% less likely to be detected
  visibilityBonus?: number;         // Better sight in terrain

  // Terrain-specific modifiers
  terrainOverrides?: Partial<Record<TerrainType, Partial<TerrainRules>>>;

  // Requirements to use this modifier
  requirements?: {
    minSkillLevel?: number;
    requiredPower?: string;
    requiredEquipment?: string;
    healthMinPercent?: number;
  };
}

// =============================================================================
// EXAMPLE MODIFIERS - Powers, Skills, Equipment
// =============================================================================

export const TRAVEL_MODIFIERS: TravelModifier[] = [
  // LSW POWERS
  {
    id: 'power_flight',
    name: 'Flight',
    source: 'power',
    description: 'Ability to fly through the air',
    allowsAirOverride: true,
    airSpeedBonus: 2.0,  // 2x normal air speed
  },
  {
    id: 'power_water_walking',
    name: 'Water Walking',
    source: 'power',
    description: 'Can run across water surfaces',
    allowsGroundOverride: true,  // Can "ground" travel on water
    terrainOverrides: {
      ocean: { allowsGround: true, groundSpeedMod: 0.8 },
      coastal: { groundSpeedMod: 1.0 },
    },
  },
  {
    id: 'power_super_speed',
    name: 'Super Speed',
    source: 'power',
    description: 'Move at superhuman speeds',
    groundSpeedBonus: 5.0,  // 5x normal ground speed
    terrainOverrides: {
      jungle: { groundSpeedMod: 0.8 },   // Speed helps in jungle
      mountain: { groundSpeedMod: 0.6 }, // Speed helps in mountains
    },
  },
  {
    id: 'power_teleportation',
    name: 'Teleportation',
    source: 'power',
    description: 'Instant travel to known locations',
    allowsGroundOverride: true,
    allowsAirOverride: true,
    allowsWaterOverride: true,
    groundSpeedBonus: 100,  // Effectively instant
    airSpeedBonus: 100,
    waterSpeedBonus: 100,
    detectionMod: -100,     // Cannot be detected during teleport
  },
  {
    id: 'power_phasing',
    name: 'Phasing',
    source: 'power',
    description: 'Pass through solid matter',
    allowsGroundOverride: true,
    terrainOverrides: {
      mountain: { groundSpeedMod: 1.0 },  // Phase through mountains
    },
  },
  {
    id: 'power_aquatic',
    name: 'Aquatic Adaptation',
    source: 'power',
    description: 'Can breathe and move freely underwater',
    waterSpeedBonus: 2.0,
    terrainOverrides: {
      ocean: { groundSpeedMod: 0.6 },  // Can "walk" ocean floor
    },
  },

  // SKILLS
  {
    id: 'skill_survival',
    name: 'Survival Training',
    source: 'skill',
    description: 'Expert at surviving harsh environments',
    terrainOverrides: {
      arctic: { groundSpeedMod: 0.6 },   // Better than base 0.4
      desert: { groundSpeedMod: 0.8 },   // Better than base 0.6
      jungle: { groundSpeedMod: 0.6 },   // Better than base 0.4
    },
    detectionMod: -10,
    requirements: { minSkillLevel: 30 },
  },
  {
    id: 'skill_piloting_air',
    name: 'Expert Pilot (Air)',
    source: 'skill',
    description: 'Skilled at flying aircraft',
    airSpeedBonus: 1.2,
    terrainOverrides: {
      mountain: { airSpeedMod: 0.8 },  // Better than base 0.6
      arctic: { airSpeedMod: 0.9 },    // Better than base 0.7
    },
    requirements: { minSkillLevel: 50 },
  },
  {
    id: 'skill_stealth',
    name: 'Stealth Expert',
    source: 'skill',
    description: 'Expert at avoiding detection',
    detectionMod: -30,
    requirements: { minSkillLevel: 40 },
  },

  // EQUIPMENT
  {
    id: 'equip_jetpack',
    name: 'Jetpack',
    source: 'equipment',
    description: 'Personal flight device',
    allowsAirOverride: true,
    airSpeedBonus: 1.0,  // Normal air speed
  },
  {
    id: 'equip_atv',
    name: 'All-Terrain Vehicle',
    source: 'equipment',
    description: 'Vehicle capable of rough terrain',
    terrainOverrides: {
      mountain: { groundSpeedMod: 0.5 },  // Better than base 0.3
      jungle: { groundSpeedMod: 0.6 },    // Better than base 0.4
      forest: { groundSpeedMod: 0.9 },    // Better than base 0.7
    },
  },
  {
    id: 'equip_scuba',
    name: 'SCUBA Gear',
    source: 'equipment',
    description: 'Underwater breathing apparatus',
    terrainOverrides: {
      ocean: { allowsGround: true, groundSpeedMod: 0.3 },
      coastal: { groundSpeedMod: 0.5 },
    },
  },
  {
    id: 'equip_ghillie',
    name: 'Ghillie Suit',
    source: 'equipment',
    description: 'Camouflage suit for concealment',
    detectionMod: -40,
    terrainOverrides: {
      jungle: { detectionRisk: 5 },
      forest: { detectionRisk: 10 },
    },
  },
];

// =============================================================================
// TRAVEL CALCULATION ENGINE
// =============================================================================

export interface TravelCalculationInput {
  terrain: TerrainType;
  travelMode: TravelMode;
  modifiers: TravelModifier[];
}

export interface TravelCalculationResult {
  canTraverse: boolean;
  reason?: string;
  speedMultiplier: number;
  detectionRisk: number;
  visibilityMod: number;
  appliedModifiers: string[];
}

/**
 * Calculate final travel rules after applying all modifiers
 */
export function calculateTravel(input: TravelCalculationInput): TravelCalculationResult {
  const { terrain, travelMode, modifiers } = input;
  const baseRules = { ...BASE_TERRAIN_RULES[terrain] };
  const appliedModifiers: string[] = [];

  // Start with base values
  let canTraverse = false;
  let speedMultiplier = 0;
  let detectionRisk = baseRules.detectionRisk;
  let visibilityMod = baseRules.visibilityMod;

  // Determine base traversability
  switch (travelMode) {
    case 'ground':
      canTraverse = baseRules.allowsGround;
      speedMultiplier = baseRules.groundSpeedMod;
      break;
    case 'air':
      canTraverse = baseRules.allowsAir;
      speedMultiplier = baseRules.airSpeedMod;
      break;
    case 'water':
      canTraverse = baseRules.allowsWater;
      speedMultiplier = baseRules.waterSpeedMod;
      break;
  }

  // Apply modifiers
  for (const mod of modifiers) {
    let applied = false;

    // Check for terrain-specific overrides first
    if (mod.terrainOverrides?.[terrain]) {
      const override = mod.terrainOverrides[terrain];

      // Override traversability
      if (travelMode === 'ground' && override.allowsGround !== undefined) {
        canTraverse = override.allowsGround;
        applied = true;
      }
      if (travelMode === 'air' && override.allowsAir !== undefined) {
        canTraverse = override.allowsAir;
        applied = true;
      }
      if (travelMode === 'water' && override.allowsWater !== undefined) {
        canTraverse = override.allowsWater;
        applied = true;
      }

      // Override speed mods
      if (travelMode === 'ground' && override.groundSpeedMod !== undefined) {
        speedMultiplier = Math.max(speedMultiplier, override.groundSpeedMod);
        applied = true;
      }
      if (travelMode === 'air' && override.airSpeedMod !== undefined) {
        speedMultiplier = Math.max(speedMultiplier, override.airSpeedMod);
        applied = true;
      }
      if (travelMode === 'water' && override.waterSpeedMod !== undefined) {
        speedMultiplier = Math.max(speedMultiplier, override.waterSpeedMod);
        applied = true;
      }

      // Override detection
      if (override.detectionRisk !== undefined) {
        detectionRisk = Math.min(detectionRisk, override.detectionRisk);
        applied = true;
      }
      if (override.visibilityMod !== undefined) {
        visibilityMod = Math.max(visibilityMod, override.visibilityMod);
        applied = true;
      }
    }

    // Apply general overrides
    if (travelMode === 'ground' && mod.allowsGroundOverride && !canTraverse) {
      canTraverse = true;
      speedMultiplier = baseRules.groundSpeedMod || 0.5; // Default to half speed if no base
      applied = true;
    }
    if (travelMode === 'air' && mod.allowsAirOverride && !canTraverse) {
      canTraverse = true;
      speedMultiplier = baseRules.airSpeedMod || 1.0;
      applied = true;
    }
    if (travelMode === 'water' && mod.allowsWaterOverride && !canTraverse) {
      canTraverse = true;
      speedMultiplier = baseRules.waterSpeedMod || 0.5;
      applied = true;
    }

    // Apply speed bonuses
    if (travelMode === 'ground' && mod.groundSpeedBonus) {
      speedMultiplier *= mod.groundSpeedBonus;
      applied = true;
    }
    if (travelMode === 'air' && mod.airSpeedBonus) {
      speedMultiplier *= mod.airSpeedBonus;
      applied = true;
    }
    if (travelMode === 'water' && mod.waterSpeedBonus) {
      speedMultiplier *= mod.waterSpeedBonus;
      applied = true;
    }

    // Apply detection mods
    if (mod.detectionMod) {
      detectionRisk = Math.max(0, detectionRisk + mod.detectionMod);
      applied = true;
    }
    if (mod.visibilityBonus) {
      visibilityMod = Math.min(1.0, visibilityMod + mod.visibilityBonus);
      applied = true;
    }

    if (applied) {
      appliedModifiers.push(mod.name);
    }
  }

  return {
    canTraverse,
    reason: canTraverse ? undefined : `${terrain} terrain blocks ${travelMode} travel`,
    speedMultiplier,
    detectionRisk: Math.max(0, Math.min(100, detectionRisk)),
    visibilityMod: Math.max(0, Math.min(1, visibilityMod)),
    appliedModifiers,
  };
}

// =============================================================================
// TRAVEL TIME CALCULATION
// =============================================================================

// Scale: 1 sector = 500km
// Base speeds (km per game day)
export const BASE_TRAVEL_SPEEDS: Record<string, number> = {
  // Ground vehicles
  walking: 40,           // ~40km/day on foot
  car_standard: 400,     // ~400km/day driving
  car_fast: 600,         // Sports car
  motorcycle: 500,
  truck: 350,
  tank: 200,

  // Aircraft
  helicopter: 800,
  private_jet: 2000,
  commercial: 3000,
  military_transport: 2500,
  fighter_jet: 5000,

  // Watercraft
  boat_small: 200,
  ship_standard: 400,
  ship_fast: 600,
  submarine: 300,

  // LSW Travel (per game day)
  flight_low: 1000,      // Low-level flyer
  flight_high: 3000,     // Supersonic flyer
  super_speed_low: 2000,
  super_speed_high: 10000,
  teleportation: Infinity, // Instant
};

// Game time conversion
export const TIME_CONVERSION = {
  realMinutesToGameDays: 1 / 48,     // 1 real minute = ~30 game minutes
  realHoursToGameDays: 1.25,         // 1 real hour = 1.25 game days
  realDaysToGameDays: 30,            // 1 real day = 30 game days
  sectorDistanceKm: 500,             // Each sector = 500km
};

/**
 * Calculate travel time between sectors
 */
export function calculateTravelTime(
  sectorCount: number,
  vehicleType: keyof typeof BASE_TRAVEL_SPEEDS,
  speedMultiplier: number = 1.0
): { gameDays: number; realMinutes: number } {
  const distanceKm = sectorCount * TIME_CONVERSION.sectorDistanceKm;
  const speedKmPerDay = BASE_TRAVEL_SPEEDS[vehicleType] * speedMultiplier;

  const gameDays = speedKmPerDay === Infinity ? 0 : distanceKm / speedKmPerDay;
  const realMinutes = gameDays / TIME_CONVERSION.realMinutesToGameDays;

  return {
    gameDays: Math.round(gameDays * 100) / 100,
    realMinutes: Math.round(realMinutes),
  };
}

// =============================================================================
// SECTOR CITY DENSITY MODIFIER
// =============================================================================

/**
 * More cities = more traffic = slower travel
 */
export function getCityDensityModifier(cityCount: number): number {
  if (cityCount === 0) return 1.0;      // Empty sector - normal speed
  if (cityCount <= 2) return 0.95;      // Few cities - minor delay
  if (cityCount <= 5) return 0.85;      // Moderate - noticeable delay
  if (cityCount <= 10) return 0.70;     // Dense - significant delay
  return 0.50;                          // Mega-density - half speed
}

/**
 * Vehicle System for SuperHero Tactics
 *
 * Vehicles are assigned to squads for world map travel.
 * Each vehicle has:
 * - Capacity (how many characters)
 * - Speed (for travel time calculation)
 * - Travel mode (ground/air/water)
 * - Special capabilities (modifiers)
 */

import { TravelModifier, TravelMode, TerrainType } from './travelSystem';

// =============================================================================
// VEHICLE TYPES
// =============================================================================

export type VehicleCategory =
  | 'motorcycle'
  | 'car'
  | 'truck'
  | 'bus'
  | 'military_ground'
  | 'helicopter'
  | 'plane'
  | 'military_air'
  | 'boat'
  | 'ship'
  | 'military_naval'
  | 'exotic';

export type VehicleAvailability =
  | 'common'           // Can buy anywhere
  | 'licensed'         // Requires license/permit
  | 'commercial'       // Business use
  | 'law_enforcement'  // Police/government
  | 'military'         // Military access required
  | 'military_only'    // Restricted military
  | 'vip_only'         // Special connections
  | 'high_tech'        // Rare tech
  | 'alien_tech'       // Alien origin
  | 'superhero';       // Custom superhero vehicle

// =============================================================================
// VEHICLE INTERFACE
// =============================================================================

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  travelMode: TravelMode;

  // Capacity
  passengers: number;      // Max characters (driver counts as 1)
  cargoLbs: number;        // Cargo capacity in pounds

  // Performance
  topSpeedMph: number;     // Max speed for travel calculations
  rangeKm: number;         // Max range before refuel (Infinity for nuclear)
  fuelType: 'gasoline' | 'diesel' | 'jet' | 'electric' | 'nuclear' | 'none';

  // Combat stats (for tactical layer)
  hp: number;              // Vehicle health
  dr: number;              // Damage resistance (armor)
  weaponMounts: number;    // How many weapons can be mounted

  // Acquisition
  costLevel: 'low' | 'medium' | 'high' | 'very_high' | 'ultra_high';
  availability: VehicleAvailability;
  skillRequired?: string;  // e.g., 'piloting_air', 'piloting_water'

  // Special properties
  specialProperties: string[];
  travelModifiers?: TravelModifier[];
}

// =============================================================================
// VEHICLE DATABASE
// =============================================================================

export const VEHICLES: Vehicle[] = [
  // ===== MOTORCYCLES =====
  {
    id: 'VG_001',
    name: 'Sport Motorcycle',
    category: 'motorcycle',
    travelMode: 'ground',
    passengers: 1,
    cargoLbs: 25,
    topSpeedMph: 180,
    rangeKm: 320,
    fuelType: 'gasoline',
    hp: 60,
    dr: 5,
    weaponMounts: 0,
    costLevel: 'medium',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['+2CS evasion', 'exposed rider', 'easy to conceal'],
  },
  {
    id: 'VG_002',
    name: 'Cruiser Motorcycle',
    category: 'motorcycle',
    travelMode: 'ground',
    passengers: 2,
    cargoLbs: 100,
    topSpeedMph: 120,
    rangeKm: 560,
    fuelType: 'gasoline',
    hp: 70,
    dr: 8,
    weaponMounts: 0,
    costLevel: 'medium',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['comfortable', 'touring capable'],
  },
  {
    id: 'VG_003',
    name: 'Dirt Bike',
    category: 'motorcycle',
    travelMode: 'ground',
    passengers: 1,
    cargoLbs: 25,
    topSpeedMph: 80,
    rangeKm: 240,
    fuelType: 'gasoline',
    hp: 50,
    dr: 3,
    weaponMounts: 0,
    costLevel: 'medium',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['off-road capable', 'jump capable'],
    travelModifiers: [{
      id: 'dirtbike_terrain',
      name: 'Off-Road Capable',
      source: 'vehicle',
      description: 'Better in rough terrain',
      terrainOverrides: {
        mountain: { groundSpeedMod: 0.5 },
        jungle: { groundSpeedMod: 0.6 },
        forest: { groundSpeedMod: 0.9 },
      },
    }],
  },

  // ===== CARS =====
  {
    id: 'VG_010',
    name: 'Economy Car',
    category: 'car',
    travelMode: 'ground',
    passengers: 4,
    cargoLbs: 300,
    topSpeedMph: 100,
    rangeKm: 720,
    fuelType: 'gasoline',
    hp: 70,
    dr: 5,
    weaponMounts: 0,
    costLevel: 'low',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['fuel efficient', 'reliable'],
  },
  {
    id: 'VG_011',
    name: 'Sedan',
    category: 'car',
    travelMode: 'ground',
    passengers: 5,
    cargoLbs: 500,
    topSpeedMph: 130,
    rangeKm: 640,
    fuelType: 'gasoline',
    hp: 100,
    dr: 8,
    weaponMounts: 0,
    costLevel: 'medium',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['standard vehicle', 'balanced'],
  },
  {
    id: 'VG_012',
    name: 'Sports Car',
    category: 'car',
    travelMode: 'ground',
    passengers: 2,
    cargoLbs: 150,
    topSpeedMph: 200,
    rangeKm: 480,
    fuelType: 'gasoline',
    hp: 80,
    dr: 5,
    weaponMounts: 0,
    costLevel: 'very_high',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['+1CS pursuit', 'low profile'],
  },
  {
    id: 'VG_015',
    name: 'Armored Car',
    category: 'car',
    travelMode: 'ground',
    passengers: 4,
    cargoLbs: 300,
    topSpeedMph: 120,
    rangeKm: 480,
    fuelType: 'gasoline',
    hp: 200,
    dr: 25,
    weaponMounts: 0,
    costLevel: 'ultra_high',
    availability: 'vip_only',
    skillRequired: 'piloting_ground',
    specialProperties: ['bulletproof glass', 'run-flat tires'],
  },

  // ===== TRUCKS & UTILITY =====
  {
    id: 'VG_020',
    name: 'Pickup Truck',
    category: 'truck',
    travelMode: 'ground',
    passengers: 3,
    cargoLbs: 2500,
    topSpeedMph: 110,
    rangeKm: 720,
    fuelType: 'gasoline',
    hp: 130,
    dr: 8,
    weaponMounts: 1,
    costLevel: 'medium',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['towing', 'utility bed', 'durable'],
  },
  {
    id: 'VG_021',
    name: 'SUV',
    category: 'truck',
    travelMode: 'ground',
    passengers: 7,
    cargoLbs: 1000,
    topSpeedMph: 120,
    rangeKm: 640,
    fuelType: 'gasoline',
    hp: 120,
    dr: 10,
    weaponMounts: 0,
    costLevel: 'high',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['all terrain', 'family sized'],
    travelModifiers: [{
      id: 'suv_terrain',
      name: 'All-Terrain',
      source: 'vehicle',
      description: 'Better in rough terrain',
      terrainOverrides: {
        mountain: { groundSpeedMod: 0.4 },
        forest: { groundSpeedMod: 0.8 },
        desert: { groundSpeedMod: 0.7 },
      },
    }],
  },
  {
    id: 'VG_023',
    name: 'Cargo Van',
    category: 'truck',
    travelMode: 'ground',
    passengers: 2,
    cargoLbs: 5000,
    topSpeedMph: 90,
    rangeKm: 640,
    fuelType: 'gasoline',
    hp: 100,
    dr: 5,
    weaponMounts: 0,
    costLevel: 'medium',
    availability: 'commercial',
    skillRequired: 'piloting_ground',
    specialProperties: ['maximum cargo', 'mobile base option'],
  },
  {
    id: 'VG_024',
    name: 'Passenger Van',
    category: 'truck',
    travelMode: 'ground',
    passengers: 12,
    cargoLbs: 500,
    topSpeedMph: 95,
    rangeKm: 640,
    fuelType: 'gasoline',
    hp: 100,
    dr: 5,
    weaponMounts: 0,
    costLevel: 'medium',
    availability: 'common',
    skillRequired: 'piloting_ground',
    specialProperties: ['group transport'],
  },

  // ===== BUSES =====
  {
    id: 'VG_030',
    name: 'City Bus',
    category: 'bus',
    travelMode: 'ground',
    passengers: 40,
    cargoLbs: 1000,
    topSpeedMph: 50,
    rangeKm: 480,
    fuelType: 'diesel',
    hp: 180,
    dr: 8,
    weaponMounts: 0,
    costLevel: 'high',
    availability: 'commercial',
    skillRequired: 'piloting_ground',
    specialProperties: ['mass transit', 'wheelchair accessible'],
  },
  {
    id: 'VG_031',
    name: 'Charter Bus',
    category: 'bus',
    travelMode: 'ground',
    passengers: 50,
    cargoLbs: 2000,
    topSpeedMph: 70,
    rangeKm: 800,
    fuelType: 'diesel',
    hp: 180,
    dr: 8,
    weaponMounts: 0,
    costLevel: 'very_high',
    availability: 'commercial',
    skillRequired: 'piloting_ground',
    specialProperties: ['long distance', 'luggage storage'],
  },

  // ===== MILITARY GROUND =====
  {
    id: 'VG_040',
    name: 'Humvee',
    category: 'military_ground',
    travelMode: 'ground',
    passengers: 4,
    cargoLbs: 2500,
    topSpeedMph: 70,
    rangeKm: 560,
    fuelType: 'diesel',
    hp: 200,
    dr: 20,
    weaponMounts: 1,
    costLevel: 'very_high',
    availability: 'military',
    skillRequired: 'piloting_ground',
    specialProperties: ['all terrain', 'weapon mount'],
    travelModifiers: [{
      id: 'humvee_terrain',
      name: 'Military All-Terrain',
      source: 'vehicle',
      description: 'Military-grade off-road',
      terrainOverrides: {
        mountain: { groundSpeedMod: 0.5 },
        desert: { groundSpeedMod: 0.8 },
        jungle: { groundSpeedMod: 0.5 },
        forest: { groundSpeedMod: 0.8 },
      },
    }],
  },
  {
    id: 'VG_041',
    name: 'APC',
    category: 'military_ground',
    travelMode: 'ground',
    passengers: 12,
    cargoLbs: 500,
    topSpeedMph: 60,
    rangeKm: 560,
    fuelType: 'diesel',
    hp: 300,
    dr: 35,
    weaponMounts: 2,
    costLevel: 'ultra_high',
    availability: 'military',
    skillRequired: 'piloting_ground',
    specialProperties: ['troop transport', 'amphibious option'],
    travelModifiers: [{
      id: 'apc_amphibious',
      name: 'Amphibious',
      source: 'vehicle',
      description: 'Can cross water',
      allowsWaterOverride: true,
      waterSpeedBonus: 0.3,
    }],
  },
  {
    id: 'VG_044',
    name: 'Main Battle Tank',
    category: 'military_ground',
    travelMode: 'ground',
    passengers: 4,
    cargoLbs: 200,
    topSpeedMph: 40,
    rangeKm: 400,
    fuelType: 'diesel',
    hp: 500,
    dr: 60,
    weaponMounts: 3,
    costLevel: 'ultra_high',
    availability: 'military_only',
    skillRequired: 'piloting_ground',
    specialProperties: ['main battle tank', 'heavy armor'],
  },

  // ===== HELICOPTERS =====
  {
    id: 'VA_003',
    name: 'Light Helicopter',
    category: 'helicopter',
    travelMode: 'air',
    passengers: 4,
    cargoLbs: 500,
    topSpeedMph: 150,
    rangeKm: 640,
    fuelType: 'jet',
    hp: 100,
    dr: 8,
    weaponMounts: 0,
    costLevel: 'very_high',
    availability: 'licensed',
    skillRequired: 'piloting_air',
    specialProperties: ['VTOL', 'hover'],
  },
  {
    id: 'VA_004',
    name: 'Medium Helicopter',
    category: 'helicopter',
    travelMode: 'air',
    passengers: 8,
    cargoLbs: 2000,
    topSpeedMph: 180,
    rangeKm: 800,
    fuelType: 'jet',
    hp: 150,
    dr: 12,
    weaponMounts: 0,
    costLevel: 'very_high',
    availability: 'licensed',
    skillRequired: 'piloting_air',
    specialProperties: ['transport', 'tour capable'],
  },
  {
    id: 'VA_010',
    name: 'Attack Helicopter',
    category: 'military_air',
    travelMode: 'air',
    passengers: 2,
    cargoLbs: 500,
    topSpeedMph: 200,
    rangeKm: 640,
    fuelType: 'jet',
    hp: 200,
    dr: 20,
    weaponMounts: 4,
    costLevel: 'ultra_high',
    availability: 'military_only',
    skillRequired: 'piloting_air',
    specialProperties: ['gun', 'rockets', 'missiles'],
  },
  {
    id: 'VA_011',
    name: 'Transport Helicopter',
    category: 'military_air',
    travelMode: 'air',
    passengers: 20,
    cargoLbs: 5000,
    topSpeedMph: 180,
    rangeKm: 800,
    fuelType: 'jet',
    hp: 180,
    dr: 15,
    weaponMounts: 2,
    costLevel: 'ultra_high',
    availability: 'military',
    skillRequired: 'piloting_air',
    specialProperties: ['troop transport', 'door guns'],
  },

  // ===== PLANES =====
  {
    id: 'VA_002',
    name: 'Light Aircraft (Cessna)',
    category: 'plane',
    travelMode: 'air',
    passengers: 3,
    cargoLbs: 500,
    topSpeedMph: 150,
    rangeKm: 1280,
    fuelType: 'gasoline',
    hp: 60,
    dr: 5,
    weaponMounts: 0,
    costLevel: 'high',
    availability: 'licensed',
    skillRequired: 'piloting_air',
    specialProperties: ['light aircraft', 'common'],
  },
  {
    id: 'VA_005',
    name: 'Private Jet',
    category: 'plane',
    travelMode: 'air',
    passengers: 8,
    cargoLbs: 1000,
    topSpeedMph: 500,
    rangeKm: 4800,
    fuelType: 'jet',
    hp: 100,
    dr: 8,
    weaponMounts: 0,
    costLevel: 'ultra_high',
    availability: 'licensed',
    skillRequired: 'piloting_air',
    specialProperties: ['executive', 'fast long range'],
  },
  {
    id: 'VA_012',
    name: 'Fighter Jet',
    category: 'military_air',
    travelMode: 'air',
    passengers: 1,
    cargoLbs: 500,
    topSpeedMph: 1500,
    rangeKm: 3200,
    fuelType: 'jet',
    hp: 150,
    dr: 15,
    weaponMounts: 6,
    costLevel: 'ultra_high',
    availability: 'military_only',
    skillRequired: 'piloting_air',
    specialProperties: ['air superiority', 'supersonic'],
  },
  {
    id: 'VA_014',
    name: 'Military Cargo Plane',
    category: 'military_air',
    travelMode: 'air',
    passengers: 5,
    cargoLbs: 100000,
    topSpeedMph: 400,
    rangeKm: 6400,
    fuelType: 'jet',
    hp: 200,
    dr: 12,
    weaponMounts: 2,
    costLevel: 'ultra_high',
    availability: 'military',
    skillRequired: 'piloting_air',
    specialProperties: ['heavy lift', 'paradrop capable'],
  },

  // ===== BOATS =====
  {
    id: 'VW_001',
    name: 'Jet Ski',
    category: 'boat',
    travelMode: 'water',
    passengers: 2,
    cargoLbs: 50,
    topSpeedMph: 70, // ~60 knots
    rangeKm: 160,
    fuelType: 'gasoline',
    hp: 40,
    dr: 2,
    weaponMounts: 0,
    costLevel: 'medium',
    availability: 'common',
    skillRequired: 'piloting_water',
    specialProperties: ['agile', 'recreational'],
  },
  {
    id: 'VW_002',
    name: 'Speedboat',
    category: 'boat',
    travelMode: 'water',
    passengers: 4,
    cargoLbs: 500,
    topSpeedMph: 58, // ~50 knots
    rangeKm: 320,
    fuelType: 'gasoline',
    hp: 60,
    dr: 5,
    weaponMounts: 0,
    costLevel: 'high',
    availability: 'licensed',
    skillRequired: 'piloting_water',
    specialProperties: ['fast', 'pursuit capable'],
  },
  {
    id: 'VW_005',
    name: 'Small Yacht',
    category: 'boat',
    travelMode: 'water',
    passengers: 12,
    cargoLbs: 2000,
    topSpeedMph: 29, // ~25 knots
    rangeKm: 800,
    fuelType: 'diesel',
    hp: 120,
    dr: 8,
    weaponMounts: 0,
    costLevel: 'very_high',
    availability: 'licensed',
    skillRequired: 'piloting_water',
    specialProperties: ['luxury', 'living quarters'],
  },

  // ===== MILITARY NAVAL =====
  {
    id: 'VW_020',
    name: 'Patrol Boat',
    category: 'military_naval',
    travelMode: 'water',
    passengers: 8,
    cargoLbs: 1000,
    topSpeedMph: 46, // ~40 knots
    rangeKm: 640,
    fuelType: 'diesel',
    hp: 150,
    dr: 15,
    weaponMounts: 2,
    costLevel: 'very_high',
    availability: 'military',
    skillRequired: 'piloting_water',
    specialProperties: ['coast guard', 'law enforcement'],
  },
  {
    id: 'VW_022',
    name: 'Mini Submarine',
    category: 'military_naval',
    travelMode: 'water',
    passengers: 2,
    cargoLbs: 200,
    topSpeedMph: 17, // ~15 knots
    rangeKm: 160,
    fuelType: 'electric',
    hp: 200,
    dr: 25,
    weaponMounts: 0,
    costLevel: 'ultra_high',
    availability: 'military',
    skillRequired: 'piloting_water',
    specialProperties: ['covert insertion', 'stealth'],
    travelModifiers: [{
      id: 'sub_stealth',
      name: 'Submarine Stealth',
      source: 'vehicle',
      description: 'Underwater travel avoids detection',
      detectionMod: -50,
    }],
  },
  {
    id: 'VW_026',
    name: 'RHIB Assault Boat',
    category: 'military_naval',
    travelMode: 'water',
    passengers: 12,
    cargoLbs: 1000,
    topSpeedMph: 52, // ~45 knots
    rangeKm: 320,
    fuelType: 'gasoline',
    hp: 80,
    dr: 8,
    weaponMounts: 1,
    costLevel: 'high',
    availability: 'military',
    skillRequired: 'piloting_water',
    specialProperties: ['fast assault', 'special ops'],
  },

  // ===== EXOTIC =====
  {
    id: 'VE_001',
    name: 'Hover Car',
    category: 'exotic',
    travelMode: 'air',
    passengers: 4,
    cargoLbs: 500,
    topSpeedMph: 200,
    rangeKm: 640,
    fuelType: 'electric',
    hp: 150,
    dr: 15,
    weaponMounts: 0,
    costLevel: 'ultra_high',
    availability: 'high_tech',
    skillRequired: 'piloting_air',
    specialProperties: ['flight at low altitude', 'VTOL'],
    travelModifiers: [{
      id: 'hover_low',
      name: 'Low-Altitude Flight',
      source: 'vehicle',
      description: 'Flies but stays low',
      allowsAirOverride: true,
    }],
  },
  {
    id: 'VE_003',
    name: 'Power Armor (Flight)',
    category: 'exotic',
    travelMode: 'air',
    passengers: 1,
    cargoLbs: 100,
    topSpeedMph: 300,
    rangeKm: 160,
    fuelType: 'electric',
    hp: 300,
    dr: 40,
    weaponMounts: 2,
    costLevel: 'ultra_high',
    availability: 'high_tech',
    skillRequired: 'piloting_air',
    specialProperties: ['personal flight', 'combat capable'],
  },
  {
    id: 'VE_004',
    name: 'Teleporter Pad',
    category: 'exotic',
    travelMode: 'ground', // Technically instant
    passengers: 4,
    cargoLbs: 1000,
    topSpeedMph: Infinity,
    rangeKm: Infinity,
    fuelType: 'none',
    hp: 100,
    dr: 0,
    weaponMounts: 0,
    costLevel: 'ultra_high',
    availability: 'alien_tech',
    specialProperties: ['requires receiving pad', 'instant travel'],
    travelModifiers: [{
      id: 'teleport',
      name: 'Teleportation',
      source: 'vehicle',
      description: 'Instant travel to receiving pad',
      groundSpeedBonus: 1000,
      detectionMod: -100,
    }],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getVehicleById(id: string): Vehicle | undefined {
  return VEHICLES.find(v => v.id === id);
}

export function getVehiclesByCategory(category: VehicleCategory): Vehicle[] {
  return VEHICLES.filter(v => v.category === category);
}

export function getVehiclesByTravelMode(mode: TravelMode): Vehicle[] {
  return VEHICLES.filter(v => v.travelMode === mode);
}

export function getVehiclesByMinPassengers(min: number): Vehicle[] {
  return VEHICLES.filter(v => v.passengers >= min);
}

export function getAvailableVehicles(
  maxCost: Vehicle['costLevel'],
  availability: VehicleAvailability[]
): Vehicle[] {
  const costOrder = ['low', 'medium', 'high', 'very_high', 'ultra_high'];
  const maxCostIndex = costOrder.indexOf(maxCost);

  return VEHICLES.filter(v =>
    costOrder.indexOf(v.costLevel) <= maxCostIndex &&
    availability.includes(v.availability)
  );
}

/**
 * Calculate travel speed in km/hour based on vehicle
 */
export function getVehicleTravelSpeed(vehicle: Vehicle): number {
  // Convert MPH to km/h
  return vehicle.topSpeedMph * 1.609;
}

/**
 * Check if squad can fit in vehicle
 */
export function canFitSquad(vehicle: Vehicle, squadSize: number): boolean {
  return squadSize <= vehicle.passengers;
}

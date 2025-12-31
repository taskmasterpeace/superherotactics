/**
 * Base Building System - SuperHero Tactics
 *
 * Grid-based base building where facilities provide bonuses.
 * Base grid also serves as tactical map when base is attacked.
 *
 * Grid sizes:
 * - Small: 3x3 = 9 slots
 * - Medium: 3x4 = 12 slots
 * - Large: 4x4 = 16 slots
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type BaseType =
  | 'warehouse'       // 3x3, cheap, industrial
  | 'safehouse'       // 3x3, hidden, residential
  | 'mansion'         // 3x4, expensive, high profile
  | 'underground'     // 3x4, secret, defensible
  | 'corporate'       // 3x4, business cover
  | 'compound';       // 4x4, military style, max slots

export type FacilityType =
  // Education-tied
  | 'training_room'     // Combat training, +study speed
  | 'library'           // Research, languages, +study speed
  | 'simulator'         // Vehicle/combat practice, +practical bonus

  // Medical-tied
  | 'medical_bay'       // Healing at base, surgery
  | 'pharmacy'          // Drug production, antidotes

  // Crafting/Repair
  | 'engineering_lab'   // Repair, crafting, vehicle mods
  | 'armory'            // Weapon storage, maintenance, ammo

  // Operations
  | 'intel_center'      // Investigation bonus, surveillance
  | 'communications'    // Hacking, remote coordination
  | 'garage'            // Vehicle storage, quick deploy

  // Support
  | 'living_quarters'   // Team capacity, morale boost
  | 'power_generator'   // Required for high-tech facilities
  | 'security_system';  // Base defense, early warning

export type FacilityLevel = 1 | 2 | 3;

export interface Facility {
  id: string;
  type: FacilityType;
  level: FacilityLevel;
  condition: number;      // 0-100, needs maintenance
  gridX: number;          // Position in grid
  gridY: number;
  isOperational: boolean; // Can be disabled by damage or power loss
  assignedStaff?: string[]; // Character IDs assigned
}

export interface PlayerBase {
  id: string;
  name: string;
  location: string;           // Sector code
  country: string;            // Country code
  type: BaseType;
  gridWidth: number;          // 3 or 4
  gridHeight: number;         // 3 or 4
  grid: (Facility | null)[][]; // 2D array of placed facilities
  security: number;           // Defense rating (0-100)
  discovered: boolean;        // Has enemy found this base?
  monthlyUpkeep: number;      // Auto-calculated
  powerCapacity: number;      // Total power available
  powerUsed: number;          // Current power usage
}

// ============================================================================
// BASE TYPE DEFINITIONS
// ============================================================================

export interface BaseTypeConfig {
  name: string;
  gridWidth: number;
  gridHeight: number;
  totalSlots: number;
  baseSecurity: number;
  monthlyUpkeep: number;
  purchaseCost: number;
  basePower: number;
  description: string;
  pros: string[];
  cons: string[];
}

export const BASE_TYPES: Record<BaseType, BaseTypeConfig> = {
  warehouse: {
    name: 'Warehouse',
    gridWidth: 3,
    gridHeight: 3,
    totalSlots: 9,
    baseSecurity: 20,
    monthlyUpkeep: 2000,
    purchaseCost: 50000,
    basePower: 50,
    description: 'Cheap industrial space. Low profile but minimal security.',
    pros: ['Affordable', 'Large interior space', 'Easy to expand'],
    cons: ['Low security', 'Industrial area', 'Basic utilities'],
  },

  safehouse: {
    name: 'Safehouse',
    gridWidth: 3,
    gridHeight: 3,
    totalSlots: 9,
    baseSecurity: 40,
    monthlyUpkeep: 3000,
    purchaseCost: 75000,
    basePower: 40,
    description: 'Hidden residential property. Hard to find but cramped.',
    pros: ['Hidden location', 'Residential cover', 'Hard to trace'],
    cons: ['Limited space', 'Noise restrictions', 'Power limitations'],
  },

  mansion: {
    name: 'Mansion',
    gridWidth: 3,
    gridHeight: 4,
    totalSlots: 12,
    baseSecurity: 30,
    monthlyUpkeep: 8000,
    purchaseCost: 200000,
    basePower: 100,
    description: 'Luxurious estate. Great cover but high profile.',
    pros: ['Large space', 'Good utilities', 'Social cover'],
    cons: ['High profile', 'Expensive upkeep', 'Nosy neighbors'],
  },

  underground: {
    name: 'Underground Bunker',
    gridWidth: 3,
    gridHeight: 4,
    totalSlots: 12,
    baseSecurity: 60,
    monthlyUpkeep: 5000,
    purchaseCost: 150000,
    basePower: 80,
    description: 'Hidden subterranean base. Excellent defense.',
    pros: ['Highly defensible', 'Hidden', 'Blast resistant'],
    cons: ['Single entry point', 'Damp conditions', 'Claustrophobic'],
  },

  corporate: {
    name: 'Corporate Office',
    gridWidth: 3,
    gridHeight: 4,
    totalSlots: 12,
    baseSecurity: 35,
    monthlyUpkeep: 10000,
    purchaseCost: 250000,
    basePower: 120,
    description: 'Business front. Perfect cover, city access.',
    pros: ['Perfect cover', 'City central', 'Modern utilities'],
    cons: ['High operating cost', 'Business hours activity', 'Paper trail'],
  },

  compound: {
    name: 'Fortified Compound',
    gridWidth: 4,
    gridHeight: 4,
    totalSlots: 16,
    baseSecurity: 70,
    monthlyUpkeep: 15000,
    purchaseCost: 500000,
    basePower: 200,
    description: 'Military-grade facility. Maximum space and security.',
    pros: ['Maximum space', 'Best security', 'Vehicle facilities'],
    cons: ['Very expensive', 'Remote location', 'Obvious target'],
  },
};

// ============================================================================
// FACILITY DEFINITIONS
// ============================================================================

export interface FacilityConfig {
  name: string;
  description: string;
  buildCost: [number, number, number];        // Cost per level [L1, L2, L3]
  buildHours: [number, number, number];       // Hours to build per level
  upkeepCost: [number, number, number];       // Monthly upkeep per level
  powerRequired: [number, number, number];    // Power draw per level
  requiredFacilities?: FacilityType[];        // Must have these first

  // Bonuses (per level: [L1, L2, L3])
  educationBonus?: [number, number, number];  // % bonus to study speed
  healingBonus?: [number, number, number];    // % bonus to healing
  investigationBonus?: [number, number, number];
  craftingBonus?: [number, number, number];
  securityBonus?: [number, number, number];   // Added to base security

  // Education integration
  educationFields?: string[];                 // Which fields benefit

  // Other effects
  teamCapacityBonus?: [number, number, number]; // Extra team members
  vehicleSlots?: [number, number, number];    // Vehicle storage

  // Visual
  icon: string;
  color: string;
}

export const FACILITIES: Record<FacilityType, FacilityConfig> = {
  // EDUCATION-TIED FACILITIES
  training_room: {
    name: 'Training Room',
    description: 'Physical training and combat practice space.',
    buildCost: [10000, 25000, 50000],
    buildHours: [24, 48, 96],
    upkeepCost: [200, 400, 800],
    powerRequired: [5, 10, 20],
    educationBonus: [20, 40, 60],
    educationFields: ['combat_sciences', 'martial_arts', 'military_tactics'],
    icon: '🏋️',
    color: 'red',
  },

  library: {
    name: 'Library & Research Center',
    description: 'Collection of texts, databases, and research materials.',
    buildCost: [8000, 20000, 40000],
    buildHours: [16, 32, 64],
    upkeepCost: [150, 300, 600],
    powerRequired: [3, 6, 12],
    educationBonus: [15, 30, 45],
    investigationBonus: [10, 20, 30],
    educationFields: ['academic', 'languages', 'investigation', 'social_intel'],
    icon: '📚',
    color: 'blue',
  },

  simulator: {
    name: 'Combat Simulator',
    description: 'VR and physical simulation for combat scenarios.',
    buildCost: [30000, 60000, 120000],
    buildHours: [48, 96, 192],
    upkeepCost: [500, 1000, 2000],
    powerRequired: [20, 40, 80],
    requiredFacilities: ['power_generator'],
    educationBonus: [25, 50, 75],
    educationFields: ['vehicle_combat', 'weapons_systems', 'tactical_training'],
    icon: '🎮',
    color: 'purple',
  },

  // MEDICAL FACILITIES
  medical_bay: {
    name: 'Medical Bay',
    description: 'Medical treatment and recovery facility.',
    buildCost: [15000, 35000, 75000],
    buildHours: [32, 64, 128],
    upkeepCost: [300, 600, 1200],
    powerRequired: [10, 20, 40],
    healingBonus: [25, 50, 100],
    educationFields: ['medicine', 'combat_medicine', 'trauma_surgery'],
    icon: '🏥',
    color: 'white',
  },

  pharmacy: {
    name: 'Pharmacy Lab',
    description: 'Drug production, antidotes, and medical supplies.',
    buildCost: [12000, 28000, 55000],
    buildHours: [24, 48, 96],
    upkeepCost: [250, 500, 1000],
    powerRequired: [8, 16, 32],
    requiredFacilities: ['medical_bay'],
    healingBonus: [10, 20, 30],
    craftingBonus: [15, 30, 45],
    educationFields: ['pharmacology', 'chemistry', 'botany'],
    icon: '💊',
    color: 'green',
  },

  // CRAFTING/REPAIR FACILITIES
  engineering_lab: {
    name: 'Engineering Lab',
    description: 'Repair, modification, and fabrication workshop.',
    buildCost: [20000, 45000, 90000],
    buildHours: [36, 72, 144],
    upkeepCost: [400, 800, 1600],
    powerRequired: [15, 30, 60],
    craftingBonus: [20, 40, 60],
    educationFields: ['technical_engineering', 'robotics', 'cybernetics', 'electronics'],
    icon: '🔧',
    color: 'orange',
  },

  armory: {
    name: 'Armory',
    description: 'Weapon storage, maintenance, and ammunition supply.',
    buildCost: [18000, 40000, 80000],
    buildHours: [24, 48, 96],
    upkeepCost: [350, 700, 1400],
    powerRequired: [5, 10, 20],
    craftingBonus: [10, 20, 30],
    securityBonus: [5, 10, 15],
    educationFields: ['weapons_systems', 'demolitions', 'weapons_smithing'],
    icon: '🔫',
    color: 'gray',
  },

  // OPERATIONS FACILITIES
  intel_center: {
    name: 'Intelligence Center',
    description: 'Surveillance, data analysis, and intelligence gathering.',
    buildCost: [25000, 55000, 110000],
    buildHours: [40, 80, 160],
    upkeepCost: [450, 900, 1800],
    powerRequired: [20, 40, 80],
    requiredFacilities: ['communications'],
    investigationBonus: [20, 40, 60],
    securityBonus: [10, 20, 30],
    educationFields: ['investigation', 'tradecraft', 'interrogation'],
    icon: '🕵️',
    color: 'darkblue',
  },

  communications: {
    name: 'Communications Hub',
    description: 'Secure communications and hacking capabilities.',
    buildCost: [15000, 35000, 70000],
    buildHours: [24, 48, 96],
    upkeepCost: [300, 600, 1200],
    powerRequired: [15, 30, 60],
    investigationBonus: [10, 20, 30],
    educationFields: ['hacking', 'cryptography', 'electronics'],
    icon: '📡',
    color: 'cyan',
  },

  garage: {
    name: 'Vehicle Garage',
    description: 'Vehicle storage, maintenance, and quick deployment.',
    buildCost: [12000, 28000, 55000],
    buildHours: [20, 40, 80],
    upkeepCost: [200, 400, 800],
    powerRequired: [5, 10, 20],
    vehicleSlots: [2, 4, 6],
    educationFields: ['vehicle_engineering', 'vehicle_combat'],
    icon: '🚗',
    color: 'brown',
  },

  // SUPPORT FACILITIES
  living_quarters: {
    name: 'Living Quarters',
    description: 'Team housing and rest facilities.',
    buildCost: [8000, 18000, 35000],
    buildHours: [16, 32, 64],
    upkeepCost: [150, 300, 600],
    powerRequired: [5, 10, 20],
    teamCapacityBonus: [2, 4, 6],
    healingBonus: [5, 10, 15], // Rest bonus
    icon: '🛏️',
    color: 'yellow',
  },

  power_generator: {
    name: 'Power Generator',
    description: 'Provides additional power for advanced facilities.',
    buildCost: [20000, 45000, 90000],
    buildHours: [32, 64, 128],
    upkeepCost: [400, 800, 1600],
    powerRequired: [0, 0, 0], // Generates power, doesn't consume
    // Special: adds to power capacity instead of consuming
    icon: '⚡',
    color: 'yellow',
  },

  security_system: {
    name: 'Security System',
    description: 'Automated defense and early warning systems.',
    buildCost: [15000, 35000, 70000],
    buildHours: [24, 48, 96],
    upkeepCost: [250, 500, 1000],
    powerRequired: [10, 20, 40],
    securityBonus: [15, 30, 50],
    icon: '🛡️',
    color: 'red',
  },
};

// Power generated by power_generator per level
export const POWER_GENERATOR_OUTPUT: [number, number, number] = [50, 100, 200];

// ============================================================================
// BASE STATE
// ============================================================================

export interface BaseState {
  bases: PlayerBase[];
  activeBaseId: string | null;
  maxBases: number;
  constructionQueue: ConstructionProject[];
}

export interface ConstructionProject {
  id: string;
  baseId: string;
  facilityType: FacilityType;
  targetLevel: FacilityLevel;
  gridX: number;
  gridY: number;
  hoursRemaining: number;
  totalHours: number;
  cost: number;
  startDay: number;
}

export const DEFAULT_BASE_STATE: BaseState = {
  bases: [],
  activeBaseId: null,
  maxBases: 3,
  constructionQueue: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique base ID
 */
export function generateBaseId(): string {
  return `base_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique facility ID
 */
export function generateFacilityId(): string {
  return `fac_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create empty grid for a base type
 */
export function createEmptyGrid(type: BaseType): (Facility | null)[][] {
  const config = BASE_TYPES[type];
  const grid: (Facility | null)[][] = [];

  for (let y = 0; y < config.gridHeight; y++) {
    grid[y] = [];
    for (let x = 0; x < config.gridWidth; x++) {
      grid[y][x] = null;
    }
  }

  return grid;
}

/**
 * Create a new base
 */
export function createBase(
  type: BaseType,
  name: string,
  location: string,
  country: string
): PlayerBase {
  const config = BASE_TYPES[type];

  return {
    id: generateBaseId(),
    name,
    location,
    country,
    type,
    gridWidth: config.gridWidth,
    gridHeight: config.gridHeight,
    grid: createEmptyGrid(type),
    security: config.baseSecurity,
    discovered: false,
    monthlyUpkeep: config.monthlyUpkeep,
    powerCapacity: config.basePower,
    powerUsed: 0,
  };
}

/**
 * Check if a grid position is valid and empty
 */
export function isPositionAvailable(
  base: PlayerBase,
  x: number,
  y: number
): boolean {
  if (x < 0 || x >= base.gridWidth) return false;
  if (y < 0 || y >= base.gridHeight) return false;
  return base.grid[y][x] === null;
}

/**
 * Get facility at position
 */
export function getFacilityAt(
  base: PlayerBase,
  x: number,
  y: number
): Facility | null {
  if (x < 0 || x >= base.gridWidth) return null;
  if (y < 0 || y >= base.gridHeight) return null;
  return base.grid[y][x];
}

/**
 * Get all facilities in a base
 */
export function getAllFacilities(base: PlayerBase): Facility[] {
  const facilities: Facility[] = [];
  for (let y = 0; y < base.gridHeight; y++) {
    for (let x = 0; x < base.gridWidth; x++) {
      const facility = base.grid[y][x];
      if (facility) facilities.push(facility);
    }
  }
  return facilities;
}

/**
 * Check if required facilities exist for a new facility
 */
export function hasRequiredFacilities(
  base: PlayerBase,
  facilityType: FacilityType
): boolean {
  const config = FACILITIES[facilityType];
  if (!config.requiredFacilities) return true;

  const existing = getAllFacilities(base).map(f => f.type);
  return config.requiredFacilities.every(req => existing.includes(req));
}

/**
 * Calculate power usage for a base
 */
export function calculatePowerUsage(base: PlayerBase): number {
  let usage = 0;
  for (const facility of getAllFacilities(base)) {
    if (facility.type !== 'power_generator' && facility.isOperational) {
      const config = FACILITIES[facility.type];
      usage += config.powerRequired[facility.level - 1];
    }
  }
  return usage;
}

/**
 * Calculate power capacity for a base
 */
export function calculatePowerCapacity(base: PlayerBase): number {
  const baseConfig = BASE_TYPES[base.type];
  let capacity = baseConfig.basePower;

  for (const facility of getAllFacilities(base)) {
    if (facility.type === 'power_generator' && facility.isOperational) {
      capacity += POWER_GENERATOR_OUTPUT[facility.level - 1];
    }
  }

  return capacity;
}

/**
 * Check if base has enough power
 */
export function hasSufficientPower(base: PlayerBase): boolean {
  return calculatePowerCapacity(base) >= calculatePowerUsage(base);
}

/**
 * Calculate monthly upkeep for a base
 */
export function calculateMonthlyUpkeep(base: PlayerBase): number {
  const baseConfig = BASE_TYPES[base.type];
  let upkeep = baseConfig.monthlyUpkeep;

  for (const facility of getAllFacilities(base)) {
    const config = FACILITIES[facility.type];
    upkeep += config.upkeepCost[facility.level - 1];
  }

  return upkeep;
}

/**
 * Calculate base security rating
 */
export function calculateSecurity(base: PlayerBase): number {
  const baseConfig = BASE_TYPES[base.type];
  let security = baseConfig.baseSecurity;

  for (const facility of getAllFacilities(base)) {
    if (facility.isOperational) {
      const config = FACILITIES[facility.type];
      if (config.securityBonus) {
        security += config.securityBonus[facility.level - 1];
      }
    }
  }

  // Cap at 100
  return Math.min(100, security);
}

// ============================================================================
// FACILITY OPERATIONS
// ============================================================================

/**
 * Create a new facility
 */
export function createFacility(
  type: FacilityType,
  level: FacilityLevel,
  x: number,
  y: number
): Facility {
  return {
    id: generateFacilityId(),
    type,
    level,
    condition: 100,
    gridX: x,
    gridY: y,
    isOperational: true,
  };
}

/**
 * Add facility to base
 */
export function addFacility(
  base: PlayerBase,
  facility: Facility
): PlayerBase {
  const newGrid = base.grid.map(row => [...row]);
  newGrid[facility.gridY][facility.gridX] = facility;

  const newBase = {
    ...base,
    grid: newGrid,
  };

  // Recalculate derived values
  newBase.powerUsed = calculatePowerUsage(newBase);
  newBase.powerCapacity = calculatePowerCapacity(newBase);
  newBase.monthlyUpkeep = calculateMonthlyUpkeep(newBase);
  newBase.security = calculateSecurity(newBase);

  return newBase;
}

/**
 * Remove facility from base
 */
export function removeFacility(
  base: PlayerBase,
  x: number,
  y: number
): PlayerBase {
  const newGrid = base.grid.map(row => [...row]);
  newGrid[y][x] = null;

  const newBase = {
    ...base,
    grid: newGrid,
  };

  newBase.powerUsed = calculatePowerUsage(newBase);
  newBase.powerCapacity = calculatePowerCapacity(newBase);
  newBase.monthlyUpkeep = calculateMonthlyUpkeep(newBase);
  newBase.security = calculateSecurity(newBase);

  return newBase;
}

/**
 * Upgrade facility level
 */
export function upgradeFacility(
  base: PlayerBase,
  x: number,
  y: number
): PlayerBase {
  const facility = getFacilityAt(base, x, y);
  if (!facility || facility.level >= 3) return base;

  const newFacility: Facility = {
    ...facility,
    level: (facility.level + 1) as FacilityLevel,
  };

  const newGrid = base.grid.map(row => [...row]);
  newGrid[y][x] = newFacility;

  const newBase = {
    ...base,
    grid: newGrid,
  };

  newBase.powerUsed = calculatePowerUsage(newBase);
  newBase.powerCapacity = calculatePowerCapacity(newBase);
  newBase.monthlyUpkeep = calculateMonthlyUpkeep(newBase);
  newBase.security = calculateSecurity(newBase);

  return newBase;
}

/**
 * Apply damage to facility
 */
export function damageFacility(
  base: PlayerBase,
  x: number,
  y: number,
  damage: number
): PlayerBase {
  const facility = getFacilityAt(base, x, y);
  if (!facility) return base;

  const newCondition = Math.max(0, facility.condition - damage);
  const newFacility: Facility = {
    ...facility,
    condition: newCondition,
    isOperational: newCondition > 0,
  };

  const newGrid = base.grid.map(row => [...row]);
  newGrid[y][x] = newFacility;

  return {
    ...base,
    grid: newGrid,
  };
}

/**
 * Repair facility
 */
export function repairFacility(
  base: PlayerBase,
  x: number,
  y: number,
  repairAmount: number
): PlayerBase {
  const facility = getFacilityAt(base, x, y);
  if (!facility) return base;

  const newCondition = Math.min(100, facility.condition + repairAmount);
  const newFacility: Facility = {
    ...facility,
    condition: newCondition,
    isOperational: newCondition > 0,
  };

  const newGrid = base.grid.map(row => [...row]);
  newGrid[y][x] = newFacility;

  return {
    ...base,
    grid: newGrid,
  };
}

// ============================================================================
// BONUS CALCULATIONS
// ============================================================================

/**
 * Get total education bonus for a field
 */
export function getEducationBonus(
  base: PlayerBase,
  field: string
): number {
  let bonus = 0;

  for (const facility of getAllFacilities(base)) {
    if (!facility.isOperational) continue;

    const config = FACILITIES[facility.type];
    if (config.educationBonus && config.educationFields?.includes(field)) {
      bonus += config.educationBonus[facility.level - 1];
    }
  }

  return bonus;
}

/**
 * Get total healing bonus
 */
export function getHealingBonus(base: PlayerBase): number {
  let bonus = 0;

  for (const facility of getAllFacilities(base)) {
    if (!facility.isOperational) continue;

    const config = FACILITIES[facility.type];
    if (config.healingBonus) {
      bonus += config.healingBonus[facility.level - 1];
    }
  }

  return bonus;
}

/**
 * Get total investigation bonus
 */
export function getInvestigationBonus(base: PlayerBase): number {
  let bonus = 0;

  for (const facility of getAllFacilities(base)) {
    if (!facility.isOperational) continue;

    const config = FACILITIES[facility.type];
    if (config.investigationBonus) {
      bonus += config.investigationBonus[facility.level - 1];
    }
  }

  return bonus;
}

/**
 * Get total crafting bonus
 */
export function getCraftingBonus(base: PlayerBase): number {
  let bonus = 0;

  for (const facility of getAllFacilities(base)) {
    if (!facility.isOperational) continue;

    const config = FACILITIES[facility.type];
    if (config.craftingBonus) {
      bonus += config.craftingBonus[facility.level - 1];
    }
  }

  return bonus;
}

/**
 * Get team capacity bonus
 */
export function getTeamCapacityBonus(base: PlayerBase): number {
  let bonus = 0;

  for (const facility of getAllFacilities(base)) {
    if (!facility.isOperational) continue;

    const config = FACILITIES[facility.type];
    if (config.teamCapacityBonus) {
      bonus += config.teamCapacityBonus[facility.level - 1];
    }
  }

  return bonus;
}

/**
 * Get total vehicle slots
 */
export function getVehicleSlots(base: PlayerBase): number {
  let slots = 0;

  for (const facility of getAllFacilities(base)) {
    if (!facility.isOperational) continue;

    const config = FACILITIES[facility.type];
    if (config.vehicleSlots) {
      slots += config.vehicleSlots[facility.level - 1];
    }
  }

  return slots;
}

// ============================================================================
// CONSTRUCTION
// ============================================================================

/**
 * Start construction project
 */
export function startConstruction(
  state: BaseState,
  baseId: string,
  facilityType: FacilityType,
  level: FacilityLevel,
  x: number,
  y: number,
  currentDay: number
): BaseState {
  const base = state.bases.find(b => b.id === baseId);
  if (!base) return state;

  const config = FACILITIES[facilityType];
  const cost = config.buildCost[level - 1];
  const hours = config.buildHours[level - 1];

  const project: ConstructionProject = {
    id: `proj_${Date.now()}`,
    baseId,
    facilityType,
    targetLevel: level,
    gridX: x,
    gridY: y,
    hoursRemaining: hours,
    totalHours: hours,
    cost,
    startDay: currentDay,
  };

  return {
    ...state,
    constructionQueue: [...state.constructionQueue, project],
  };
}

/**
 * Progress construction by hours
 */
export function progressConstruction(
  state: BaseState,
  hours: number
): { state: BaseState; completedProjects: ConstructionProject[] } {
  const completed: ConstructionProject[] = [];
  const remaining: ConstructionProject[] = [];

  for (const project of state.constructionQueue) {
    const newHours = project.hoursRemaining - hours;

    if (newHours <= 0) {
      completed.push(project);
    } else {
      remaining.push({
        ...project,
        hoursRemaining: newHours,
      });
    }
  }

  // Apply completed projects
  let bases = state.bases;
  for (const project of completed) {
    const baseIndex = bases.findIndex(b => b.id === project.baseId);
    if (baseIndex >= 0) {
      const facility = createFacility(
        project.facilityType,
        project.targetLevel,
        project.gridX,
        project.gridY
      );
      bases = [
        ...bases.slice(0, baseIndex),
        addFacility(bases[baseIndex], facility),
        ...bases.slice(baseIndex + 1),
      ];
    }
  }

  return {
    state: {
      ...state,
      bases,
      constructionQueue: remaining,
    },
    completedProjects: completed,
  };
}

/**
 * Cancel construction project
 */
export function cancelConstruction(
  state: BaseState,
  projectId: string
): { state: BaseState; refundAmount: number } {
  const project = state.constructionQueue.find(p => p.id === projectId);
  if (!project) return { state, refundAmount: 0 };

  // Partial refund based on progress
  const progressPercent = 1 - (project.hoursRemaining / project.totalHours);
  const refund = Math.floor(project.cost * (1 - progressPercent) * 0.75);

  return {
    state: {
      ...state,
      constructionQueue: state.constructionQueue.filter(p => p.id !== projectId),
    },
    refundAmount: refund,
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial base state
 */
export function createInitialBaseState(): BaseState {
  return { ...DEFAULT_BASE_STATE };
}

/**
 * Add base to state
 */
export function addBaseToState(
  state: BaseState,
  base: PlayerBase
): BaseState {
  if (state.bases.length >= state.maxBases) {
    return state; // Can't add more bases
  }

  return {
    ...state,
    bases: [...state.bases, base],
    activeBaseId: state.activeBaseId || base.id,
  };
}

/**
 * Remove base from state
 */
export function removeBaseFromState(
  state: BaseState,
  baseId: string
): BaseState {
  const newBases = state.bases.filter(b => b.id !== baseId);

  return {
    ...state,
    bases: newBases,
    activeBaseId: state.activeBaseId === baseId
      ? (newBases[0]?.id || null)
      : state.activeBaseId,
    constructionQueue: state.constructionQueue.filter(p => p.baseId !== baseId),
  };
}

/**
 * Set active base
 */
export function setActiveBase(
  state: BaseState,
  baseId: string
): BaseState {
  if (!state.bases.find(b => b.id === baseId)) {
    return state;
  }

  return {
    ...state,
    activeBaseId: baseId,
  };
}

/**
 * Get active base
 */
export function getActiveBase(state: BaseState): PlayerBase | null {
  if (!state.activeBaseId) return null;
  return state.bases.find(b => b.id === state.activeBaseId) || null;
}

/**
 * Update base in state
 */
export function updateBase(
  state: BaseState,
  base: PlayerBase
): BaseState {
  const index = state.bases.findIndex(b => b.id === base.id);
  if (index < 0) return state;

  return {
    ...state,
    bases: [
      ...state.bases.slice(0, index),
      base,
      ...state.bases.slice(index + 1),
    ],
  };
}

// ============================================================================
// TACTICAL MAP CONVERSION
// ============================================================================

/**
 * Convert base grid to tactical combat map data
 * Used when base is attacked and becomes a combat map
 */
export interface TacticalMapCell {
  x: number;
  y: number;
  terrain: 'floor' | 'wall' | 'facility' | 'entry';
  facility?: Facility;
  cover: number;      // 0-100 cover value
  movementCost: number;
  spawnPoint?: 'defender' | 'attacker';
}

export function convertBaseToTacticalMap(
  base: PlayerBase
): TacticalMapCell[][] {
  const map: TacticalMapCell[][] = [];

  for (let y = 0; y < base.gridHeight; y++) {
    map[y] = [];
    for (let x = 0; x < base.gridWidth; x++) {
      const facility = base.grid[y][x];

      // Entry points on edges
      const isEdge = x === 0 || x === base.gridWidth - 1 ||
                     y === 0 || y === base.gridHeight - 1;

      if (facility) {
        map[y][x] = {
          x,
          y,
          terrain: 'facility',
          facility,
          cover: 50, // Facilities provide cover
          movementCost: 1,
          spawnPoint: facility.type === 'living_quarters' ? 'defender' : undefined,
        };
      } else {
        map[y][x] = {
          x,
          y,
          terrain: isEdge ? 'entry' : 'floor',
          cover: 0,
          movementCost: 1,
          spawnPoint: isEdge ? 'attacker' : undefined,
        };
      }
    }
  }

  return map;
}

/**
 * Get defender spawn points
 */
export function getDefenderSpawnPoints(map: TacticalMapCell[][]): TacticalMapCell[] {
  return map.flat().filter(cell => cell.spawnPoint === 'defender');
}

/**
 * Get attacker spawn points
 */
export function getAttackerSpawnPoints(map: TacticalMapCell[][]): TacticalMapCell[] {
  return map.flat().filter(cell => cell.spawnPoint === 'attacker');
}

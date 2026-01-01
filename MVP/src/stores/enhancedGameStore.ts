import { create } from 'zustand'
import toast from 'react-hot-toast'
import { GameNotification, NotificationType, NotificationPriority } from '../types'
import {
  getPersonalityTraits,
  getImpatienceMultiplier,
  getImpatienceState,
  IMPATIENCE_STATE_MESSAGES,
} from '../data/personalitySystem'
// News templates (old API removed - using new news system)
import { getCountryByCode } from '../data/countries'
import { calculateMedicalSystem } from '../data/combinedEffects'
import {
  Investigation,
  InvestigationTemplate,
  ApproachType,
  ActionResult,
  generateInvestigation,
  advanceInvestigation,
  INVESTIGATION_TEMPLATES
} from '../data/investigationSystem'
import { GeneratedMission, MISSION_TEMPLATES, generateMission } from '../data/missionSystem'
import {
  createMissionActions,
  shouldRefreshMissions,
  MissionStoreState,
} from './missionStore'

// Underworld System Imports
import {
  CriminalOrganization,
  createOrganization,
  getHeatLevel,
  CITY_CRIME_MAP,
  NEUTRAL_CALLINGS,
  getMotivationFromHarmAvoidance,
} from '../data/criminalOrganization'
import { simulateWeek, SimulationEvent, SimulationResult } from '../data/criminalSimulation'
import { generateWeeklyNews } from '../data/criminalNewsBridge'
import { getCitiesByCountry } from '../data/cities'

// Territory System Imports
import {
  createMilitia,
  trainMilitia,
  getSectorControl,
  getSectorMilitia,
  getFactionMilitia,
  TerritoryControl,
  MilitiaUnit,
  FactionId,
} from '../data/territorySystem'

// New World Systems Imports
import {
  GameTime as NewGameTime,
  GameDate,
  TimeOfDay,
  DayOfWeek,
  ACTIVITY_HOURS,
  createInitialGameTime,
  advanceGameTime as advanceNewTime,
  getTimeOfDay,
  getDayOfWeek,
  formatTime,
  formatDate,
  isWeekend,
} from '../data/timeSystem'
import {
  EconomyState,
  Transaction,
  TransactionCategory,
  createInitialEconomyState,
  processPayday,
  processTransaction,
  makePurchase,
  receiveIncome,
  calculateNetWorth,
  canAfford,
} from '../data/economySystem'
import {
  ReputationState,
  ReputationAxis,
  ReputationTier,
  createInitialReputationState,
  adjustReputation,
  getReputationTier,
  getActiveEffects,
  applyReputationDecay,
  ACTION_REPUTATION_CHANGES,
} from '../data/reputationSystem'
import {
  getVehicleById,
  getVehicleTravelSpeed,
  Vehicle,
  calculateFuelForSectors,
  calculateRefuelCost,
  hasEnoughFuel,
  getTravelIncidentChance,
  generateTravelIncident,
  TravelDamageEvent,
  KM_PER_SECTOR,
} from '../data/vehicleSystem'

// EventBus for game-wide event emission
import { EventBus } from '../data/eventBus'
import {
  NewsState,
  NewsArticle,
  NewsEvent,
  NewsCategory,
  createInitialNewsState,
  addNewsArticle as addArticleToState,
  markArticleRead,
  toggleBookmark,
  getArticlesWithLeads,
  cleanExpiredArticles,
  createNewsArticle,
} from '../data/newsSystem'

// Doom Clock System (XCOM 2 Avatar Project-style urgency)
import {
  DoomClockState,
  ThresholdEvent,
  createInitialDoomClockState,
  calculateWeeklyProgress,
  applySetback,
  revealMastermind,
  getThreatLevel,
  generateDoomClockNews,
} from '../data/doomClockSystem'
import {
  generateMissionNews as genMissionNews,
  generateCrimeNews,
  generateWorldEventNews,
  generateFillerNews,
} from '../data/newsTemplates'
import { getCityByName } from '../data/cities'
import { getArmorById } from '../data/armor'
import { generateNewspaperName } from '../data/newspaperExpansion'
import {
  BaseState,
  PlayerBase,
  Facility,
  FacilityType,
  BaseType,
  createInitialBaseState,
  createBase,
  addFacility,
  removeFacility,
  upgradeFacility,
  addBaseToState,
  removeBaseFromState,
  getActiveBase,
  updateBase,
  getEducationBonus,
  getHealingBonus,
  getInvestigationBonus,
  progressConstruction,
  startConstruction,
  calculateMonthlyUpkeep,
} from '../data/baseSystem'

// Faction Relations System
import {
  FactionType,
  FactionStanding,
  StandingLabel,
  CountryReputation,
  FACTION_NAMES,
  FACTION_ICONS,
  getStandingLabel,
  getStandingColor,
  getPriceModifier,
  getSellPriceModifier,
  getTravelTimeModifier,
  canEnterLegally,
  modifyStanding,
  getRelatedFactionEffects,
  getStandingDecay,
  checkBountyStatus,
  getCountryReputation,
  initializeFactionStandings,
} from '../data/factionSystem'

// Squad System
import {
  Squad,
  SquadMember,
  SquadStatus,
  PersonalityType,
  createSquad,
  addMemberToSquad,
  removeMemberFromSquad,
  calculateSquadMorale,
  assignVehicleToSquad,
  collectSquadModifiers,
} from '../data/squadSystem'

// Character Life Cycle System
import {
  CityFamiliarity,
  ActivityCategory,
  ActivityDesires,
  ActivityRequest,
  ActivityResult,
  DailyActivityReport,
  CityType,
  calculateActivityDesires,
  processIdleDay,
  updateFamiliarityForVisit,
  getCityTypeMoraleModifier,
  getCityPreferences,
  getFamiliarityTier,
  getFamiliarityDiscount,
  createActivityRequest,
  executeActivity,
  shouldAutoExecute,
  getAvailableActivities,
  ACTIVITIES,
} from '../data/characterLifeCycle'

// Travel Unit - represents something traveling on the world map
// Time System Types
export type TimeSpeed = 0 | 1 | 2 | 3 | 4;  // 0=Paused, 1=Normal, 2=Fast, 3=Very Fast, 4=Ultra
export interface GameTime {
  minutes: number;     // 0-1439 (minutes since midnight)
  day: number;         // Day of game (1+)
  year: number;        // Year of game (1+)
}

// Time speed configurations
export const TIME_SPEEDS: Record<TimeSpeed, { label: string; minutesPerTick: number; tickInterval: number }> = {
  0: { label: 'PAUSED', minutesPerTick: 0, tickInterval: 1000 },        // Paused
  1: { label: '1X', minutesPerTick: 1, tickInterval: 1000 },             // 1 minute per second (real-time-ish)
  2: { label: '10X', minutesPerTick: 10, tickInterval: 1000 },           // 10 minutes per second
  3: { label: '60X', minutesPerTick: 60, tickInterval: 1000 },           // 1 hour per second
  4: { label: '360X', minutesPerTick: 360, tickInterval: 1000 },         // 6 hours per second (4 secs = 1 day)
};

export interface TravelingUnit {
  id: string
  type: 'character' | 'squad' | 'vehicle'
  name: string
  originSector: string
  destinationSector: string
  progress: number  // 0-100
  startTime: number  // timestamp when travel started
  estimatedArrival: number  // timestamp for arrival
  speed: number  // sectors per hour
  vehicleId?: string  // if traveling by vehicle
  vehicleType?: 'ground' | 'air' | 'water'
  characterIds: string[]  // characters in this travel group
  direction: number  // rotation angle in degrees (0 = up, 90 = right, etc.)
}

// Fleet Vehicle - tracked vehicle instance with runtime stats
export interface FleetVehicle {
  id: string
  vehicleTemplateId: string  // from vehicleSystem.ts
  name: string
  type: 'aircraft' | 'ground' | 'sea'
  status: 'available' | 'traveling' | 'deployed' | 'maintenance' | 'damaged'
  currentSector: string
  capacity: number
  speed: number  // mph
  assignedCharacters: string[]
  imageUrl?: string  // for PNG rendering

  // Runtime stats
  currentHP: number      // Current health points
  maxHP: number          // Maximum health points
  currentFuel: number    // Current fuel level (0-100%)
  maxRange: number       // Max range in km
  fuelType: 'gasoline' | 'diesel' | 'jet' | 'electric' | 'nuclear' | 'none'
  dr: number             // Damage resistance (armor)
  maintenanceNeeded: boolean
}

// Training/Education Enrollment
export interface TrainingEnrollment {
  id: string
  characterId: string
  characterName: string
  fieldId: string
  institutionId: string
  degreeLevel: 'associate' | 'bachelor' | 'master' | 'doctorate' | 'certificate'
  startDay: number        // Game day when training started
  endDay: number          // Game day when training completes
  progress: number        // 0-100%
  cost: number            // Total cost paid
  status: 'active' | 'completed' | 'dropped'
  statBonuses?: Record<string, number>  // Stats to apply on completion
  skillsUnlocked?: string[]  // Skills to unlock on completion
}

// Enhanced game store with injury system
interface EnhancedGameStore {
  // Game Setup
  gamePhase: 'faction-selection' | 'country-selection' | 'city-selection' | 'recruiting' | 'playing'
  selectedFaction: string
  selectedCountry: string
  selectedCity: string

  // Game State
  currentView: 'world-map' | 'tactical-combat' | 'investigation' | 'investigation-board' | 'characters' | 'combat-lab' | 'news' | 'encyclopedia' | 'balance' | 'world-map-grid' | 'database' | 'data-viewer' | 'sound-config' | 'loadout-editor' | 'sector-editor' | 'world-data' | 'almanac' | 'hospital' | 'equipment-shop' | 'training' | 'base'
  budget: number
  day: number  // Legacy - use gameTime.day instead

  // Time System
  gameTime: GameTime
  timeSpeed: TimeSpeed
  isTimePaused: boolean
  lastTimeTick: number  // Real timestamp of last tick

  // Squad Deployment State
  currentSector: string  // Current sector code (e.g., "K5")
  destinationSector: string | null  // Where squad is heading
  squadStatus: 'idle' | 'traveling' | 'on_mission' | 'in_combat'
  travelProgress: number  // 0-100 for travel progress
  pendingMission: { sector: string; city: string; type: string } | null

  // Enhanced Travel System
  travelingUnits: TravelingUnit[]  // All units currently traveling
  fleetVehicles: FleetVehicle[]  // All available vehicles

  // Enhanced Character System
  characters: any[]
  investigations: Investigation[]
  activeInvestigations: Investigation[]
  investigationLeads: Investigation[]  // Discovered but not started
  worldEvents: any[]
  medicalQueue: any[]

  // Notification System
  notifications: GameNotification[]

  // News System
  newsArticles: NewsArticle[]
  playerFame: number  // 0-1000 (fame score)
  publicOpinion: Record<string, number>  // country code -> opinion (-100 to +100)
  localNewspaperName: string  // Generated newspaper name for home city

  // New World Systems State
  economy: EconomyState
  reputation: ReputationState
  newsState: NewsState
  baseState: BaseState
  factionStandings: FactionStanding[]
  squads: Squad[]  // Multiple squad support

  // Character Life Cycle State
  pendingActivityRequests: ActivityRequest[]
  completedActivityReports: DailyActivityReport[]
  lastDayProcessed: number  // Track which day was last processed to avoid duplicates

  // Training/Education System
  trainingEnrollments: TrainingEnrollment[]

  // Inventory System
  inventory: {
    weapons: string[]      // Weapon IDs owned but not equipped
    armor: string[]        // Armor IDs owned but not equipped
    gadgets: string[]      // Gadget IDs
    consumables: string[]  // Grenades, medkits, etc.
  }

  // Mission System
  availableMissions: Map<string, GeneratedMission[]>  // sector -> missions[]
  activeMissions: GeneratedMission[]  // Missions currently in progress
  completedMissions: GeneratedMission[]  // Mission history
  lastMissionGeneration: number  // Game time when missions were last generated
  missionRefreshInterval: number  // How often missions refresh (in game hours)

  // Mission System Actions
  generateMissionsForSector: (sectorCode: string) => void
  generateMissionsForAllSectors: () => void
  getMissionsForSector: (sectorCode: string) => GeneratedMission[]
  getActiveMissions: () => GeneratedMission[]
  acceptMission: (missionId: string) => void
  completeMissionById: (missionId: string, success: boolean) => void
  abandonMission: (missionId: string) => void
  expireMissions: () => void
  refreshMissions: () => void

  // Underworld System
  criminalOrganizations: CriminalOrganization[]
  underworldEvents: SimulationEvent[]
  lastUnderworldWeek: number  // Track last simulated week to avoid duplicates
  underworldStats: {
    totalArrests: number
    totalProfit: number
    totalEvents: number
  }

  // Underworld Actions
  initializeUnderworld: () => void
  runUnderworldSimulation: () => SimulationResult | null
  getCriminalOrganizations: () => CriminalOrganization[]
  getUnderworldEvents: () => SimulationEvent[]
  getOrganizationsByCity: (cityName: string) => CriminalOrganization[]

  // Doom Clock System (XCOM 2 Avatar Project-style urgency)
  doomClock: DoomClockState
  advanceDoomClock: (shadowNetworkCount?: number, playerMissions?: number) => ThresholdEvent[]
  applyDoomClockSetback: (amount?: number) => void
  revealDoomClockMastermind: () => void
  getDoomClockThreat: () => 'minimal' | 'low' | 'moderate' | 'high' | 'critical'

  // Actions
  setGamePhase: (phase: any) => void
  selectFaction: (faction: string) => void
  selectCountry: (country: string) => void
  selectCity: (city: string) => void
  setCurrentView: (view: any) => void

  // Enhanced functions
  deployTeam: () => void
  contactNetwork: () => void
  emergencyPowers: () => void
  startCombat: () => void
  assignInvestigation: (invId: string) => void

  // Investigation System
  discoverInvestigation: (template: InvestigationTemplate, city: string, country: string, sector: string) => void
  startInvestigation: (investigationId: string, characterId: string) => void
  advanceInvestigationProgress: (investigationId: string, characterId: string, approach: ApproachType) => void
  completeInvestigation: (investigationId: string) => void
  failInvestigation: (investigationId: string) => void
  expireInvestigation: (investigationId: string) => void
  getAvailableInvestigations: () => Investigation[]
  getActiveInvestigations: () => Investigation[]

  // Territory & Militia system
  recruitMilitia: (sectorId: string, size: number, equipment: 'light' | 'medium' | 'heavy') => MilitiaUnit | null
  trainSectorMilitia: (sectorId: string, trainingDays: number) => void
  getSectorMilitiaList: (sectorId: string) => MilitiaUnit[]
  getPlayerMilitia: () => MilitiaUnit[]
  getSectorControlStatus: (sectorId: string) => TerritoryControl | null

  // Medical system
  addInjury: (characterId: string, injury: any) => void
  scheduleHospitalStay: (characterId: string, injury: any) => void
  processRecovery: () => void
  updateCharacterInjuries: (characterId: string, injury: any) => void
  hospitalizeCharacter: (characterId: string, injuries: any[], countryCode?: string) => void
  calculateRecoveryTime: (injury: any, hospitalQuality: number) => number
  getHospitalQuality: (countryCode: string) => number
  transferToHospital: (characterId: string, targetCountryCode: string) => void

  // Character management
  addCharacter: (character: any) => void
  updateCharacter: (characterId: string, updates: any) => void
  removeCharacter: (characterId: string) => void

  // Squad deployment
  deployToSector: (sector: string, city?: string) => void
  startMission: (sector: string, city: string, missionType: string) => void
  enterCombat: () => void
  completeMission: (success: boolean) => void

  // Enhanced Travel System
  startTravel: (characterIds: string[], destinationSector: string, vehicleId?: string) => void
  updateTravelProgress: () => void
  completeTravelUnit: (unitId: string) => void
  cancelTravel: (unitId: string) => void
  assignCharacterToVehicle: (characterId: string, vehicleId: string) => void
  unassignCharacterFromVehicle: (characterId: string, vehicleId: string) => void

  // Notification System
  addNotification: (notification: Omit<GameNotification, 'id' | 'realTimestamp' | 'read' | 'dismissed'>) => void
  dismissNotification: (notificationId: string) => void
  markNotificationRead: (notificationId: string) => void
  clearAllNotifications: () => void
  getUnreadCount: () => number

  // News System
  addNewsArticle: (article: NewsArticle) => void
  markArticleRead: (articleId: string) => void
  generateMissionNews: (missionResult: {
    success: boolean
    collateralDamage: number
    civilianCasualties: number
    city: string
    country: string
    missionType: string
    enemyType: string
    vigilantismLegal: boolean
  }) => void
  updatePublicOpinion: (country: string, change: number) => void

  // Idle Detection System
  checkIdleCharacters: () => void
  setCharacterStatus: (characterId: string, status: string, data?: Record<string, unknown>) => void

  // Inventory System Actions
  buyItem: (itemId: string, itemType: 'weapon' | 'armor' | 'gadget' | 'consumable', cost: number) => void
  sellItem: (itemId: string, itemType: 'weapon' | 'armor' | 'gadget' | 'consumable', sellPrice: number) => void
  addToInventory: (itemId: string, itemType: 'weapon' | 'armor' | 'gadget' | 'consumable') => void
  removeFromInventory: (itemId: string, itemType: 'weapon' | 'armor' | 'gadget' | 'consumable') => void
  equipWeaponToCharacter: (characterId: string, weaponId: string) => void
  equipArmorToCharacter: (characterId: string, armorId: string) => void
  unequipFromCharacter: (characterId: string, slot: 'weapon' | 'armor' | 'shield') => void

  // Time System Actions
  togglePause: () => void
  setTimeSpeed: (speed: TimeSpeed) => void
  cycleTimeSpeed: () => void  // Cycle through speeds (for UI button)
  tickTime: () => void  // Called by interval - advances time based on speed
  advanceTime: (minutes: number) => void  // Manually advance time
  getFormattedTime: () => { time: string; dayOfWeek: string; timeOfDay: 'morning' | 'noon' | 'evening' | 'night' }

  // New World Systems Actions
  // Economy
  recordTransaction: (type: 'income' | 'expense' | 'purchase' | 'sale', category: TransactionCategory, amount: number, description: string) => void
  processWeeklyPayday: () => void
  getEconomyStats: () => { netWorth: number; weeklyIncome: number; weeklyExpenses: number }

  // Reputation
  adjustReputationAxis: (axis: ReputationAxis, delta: number, reason: string) => void
  getReputationEffects: () => string[]
  processReputationDecay: () => void

  // Base Building
  purchaseBase: (type: BaseType, name: string, sectorCode: string, countryCode: string) => void
  buildFacility: (facilityType: FacilityType, gridX: number, gridY: number) => void
  upgradeFacilityAt: (gridX: number, gridY: number) => void
  removeFacilityAt: (gridX: number, gridY: number) => void
  processConstruction: (hours: number) => void
  getBaseBonuses: () => { education: number; healing: number; investigation: number }

  // Faction Relations Actions
  initFactionStandings: () => void
  modifyFactionStanding: (factionType: FactionType, countryCode: string, change: number, reason: string) => void
  getFactionStanding: (factionType: FactionType, countryCode: string) => FactionStanding | undefined
  getCountryReputation: (countryCode: string) => CountryReputation | null
  applyFactionDecay: () => void

  // Squad Management Actions
  initializeSquads: () => void  // Create initial squad from characters
  createNewSquad: (name: string, characterIds: string[]) => Squad | null
  disbandSquad: (squadId: string) => boolean
  assignToSquad: (characterId: string, squadId: string) => boolean
  removeFromSquad: (characterId: string, squadId: string) => boolean
  setActiveSquad: (squadId: string) => void
  getSquadById: (squadId: string) => Squad | undefined
  getSquadForCharacter: (characterId: string) => Squad | undefined
  assignVehicle: (squadId: string, vehicleId: string) => { success: boolean; reason?: string }
  deploySquad: (squadId: string, sector: string) => void

  // Character Life Cycle Actions
  processCharacterIdleDay: (characterId: string) => DailyActivityReport | null
  processAllIdleCharacters: () => DailyActivityReport[]
  approveActivityRequest: (requestId: string) => ActivityResult | null
  denyActivityRequest: (requestId: string) => void
  getCharacterFamiliarity: (characterId: string, cityId: string) => CityFamiliarity | null
  updateCharacterFamiliarity: (characterId: string, cityId: string, change: number) => void
  getPendingRequests: () => ActivityRequest[]
  getCharacterActivityDesires: (characterId: string) => ActivityDesires | null

  // Training/Education System Actions
  enrollCharacter: (enrollment: Omit<TrainingEnrollment, 'id' | 'status'>) => void
  updateEnrollmentProgress: (enrollmentId: string, progress: number) => void
  completeTraining: (enrollmentId: string) => void
  dropTraining: (enrollmentId: string) => void
  getActiveEnrollments: () => TrainingEnrollment[]
  getEnrollmentByCharacter: (characterId: string) => TrainingEnrollment | null
  processTrainingProgress: () => void  // Called on time advancement
}

export const useGameStore = create<EnhancedGameStore>((set, get) => ({
  // Initial State
  gamePhase: 'playing',  // Start directly in playing mode for testing
  selectedFaction: '',
  selectedCountry: 'United States',
  selectedCity: 'Washington DC',

  currentView: 'world-map',
  budget: 75000,
  day: 2472,  // Legacy

  // Time System Initial State
  gameTime: {
    minutes: 8 * 60,  // Start at 8:00 AM (480 minutes)
    day: 1,
    year: 1,
  },
  timeSpeed: 0 as TimeSpeed,  // Start paused
  isTimePaused: true,
  lastTimeTick: Date.now(),

  // Squad Deployment State - Washington DC is in sector K3 (approximate)
  currentSector: 'K3',
  destinationSector: null,
  squadStatus: 'idle' as const,
  travelProgress: 0,
  pendingMission: null,

  // Enhanced Travel System State
  travelingUnits: [] as TravelingUnit[],
  fleetVehicles: [
    {
      id: 'fv1', vehicleTemplateId: 'VA_011', name: 'Blackhawk Alpha', type: 'aircraft',
      status: 'available', currentSector: 'D7', capacity: 20, speed: 180, assignedCharacters: [],
      imageUrl: '/assets/vehicles/helicopter.png',
      currentHP: 200, maxHP: 200, currentFuel: 100, maxRange: 600, fuelType: 'jet', dr: 15, maintenanceNeeded: false
    },
    {
      id: 'fv2', vehicleTemplateId: 'VA_005', name: 'Stealth Jet', type: 'aircraft',
      status: 'available', currentSector: 'D7', capacity: 8, speed: 500, assignedCharacters: [],
      imageUrl: '/assets/vehicles/jet.png',
      currentHP: 300, maxHP: 300, currentFuel: 100, maxRange: 2000, fuelType: 'jet', dr: 20, maintenanceNeeded: false
    },
    {
      id: 'fv3', vehicleTemplateId: 'VG_041', name: 'APC Thunder', type: 'ground',
      status: 'available', currentSector: 'D7', capacity: 12, speed: 60, assignedCharacters: [],
      imageUrl: '/assets/vehicles/apc.png',
      currentHP: 400, maxHP: 400, currentFuel: 100, maxRange: 500, fuelType: 'diesel', dr: 30, maintenanceNeeded: false
    },
    {
      id: 'fv4', vehicleTemplateId: 'VG_040', name: 'Humvee Recon', type: 'ground',
      status: 'available', currentSector: 'D7', capacity: 4, speed: 70, assignedCharacters: [],
      imageUrl: '/assets/vehicles/humvee.png',
      currentHP: 150, maxHP: 150, currentFuel: 100, maxRange: 400, fuelType: 'diesel', dr: 12, maintenanceNeeded: false
    },
    {
      id: 'fv5', vehicleTemplateId: 'VW_020', name: 'Patrol Boat', type: 'sea',
      status: 'available', currentSector: 'H20', capacity: 8, speed: 46, assignedCharacters: [],
      imageUrl: '/assets/vehicles/boat.png',
      currentHP: 180, maxHP: 180, currentFuel: 100, maxRange: 300, fuelType: 'diesel', dr: 10, maintenanceNeeded: false
    },
  ] as FleetVehicle[],

  // Sample Characters with fully equipped loadouts for testing
  characters: [
    {
      id: 'soldier-001',
      name: 'Alpha Squad Leader',
      realName: 'Marcus Kane',
      stats: { MEL: 60, AGL: 55, STR: 58, STA: 65, INT: 50, INS: 52, CON: 60 },
      threatLevel: 'THREAT_2',
      origin: 'Trained Soldier',
      powers: ['Tactical Command', 'Enhanced Reflexes'],
      equipment: ['Energy Pistol', 'Plasma Grenade', 'Plasma Grenade', 'Frag Grenade', 'Frag Grenade', 'Tactical Armor'],
      health: { current: 70, maximum: 70 },
      shield: 30,
      maxShield: 30,
      shieldRegen: 5,
      dr: 12,
      equippedArmor: 'Tactical Armor',
      equippedShield: null,
      status: 'ready',
      statusStartTime: Date.now(),  // Track when became idle
      idleEscalationLevel: 0,
      location: { country: 'United States', city: 'Washington DC' },
      injuries: [],
      medicalHistory: [],
      recoveryTime: 0,
      personality: { mbti: 'ESTJ' },  // Commander type - impatient, disciplined
      fame: 120,
      cityFamiliarities: [{ cityId: 'washington-dc', cityName: 'Washington DC', familiarity: 45, lastVisited: Date.now() }],
    },
    {
      id: 'soldier-002',
      name: 'Bravo Heavy Gunner',
      realName: 'Sarah Rodriguez',
      stats: { MEL: 45, AGL: 40, STR: 70, STA: 68, INT: 45, INS: 48, CON: 65 },
      threatLevel: 'THREAT_2',
      origin: 'Military Veteran',
      powers: ['Heavy Weapons Training', 'Suppressive Fire'],
      equipment: ['Heavy Pistol', 'Concussion Grenade', 'Concussion Grenade', 'EMP Grenade', 'EMP Grenade', 'Heavy Armor'],
      health: { current: 80, maximum: 80 },
      shield: 20,
      maxShield: 20,
      shieldRegen: 3,
      dr: 15,
      equippedArmor: 'Heavy Armor',
      equippedShield: null,
      status: 'ready',
      statusStartTime: Date.now(),
      idleEscalationLevel: 0,
      location: { country: 'United States', city: 'New York' },
      injuries: [],
      medicalHistory: [],
      recoveryTime: 0,
      personality: { mbti: 'ISTP' },  // Virtuoso - patient, practical
      fame: 85,
      cityFamiliarities: [{ cityId: 'new-york', cityName: 'New York', familiarity: 60, lastVisited: Date.now() }],
    },
    {
      id: 'soldier-003',
      name: 'Charlie Sniper',
      realName: 'Jin Park',
      stats: { MEL: 48, AGL: 72, STR: 42, STA: 55, INT: 68, INS: 75, CON: 50 },
      threatLevel: 'THREAT_2',
      origin: 'Elite Marksman',
      powers: ['Dead Eye', 'Stealth Tactics'],
      equipment: ['Revolver', 'Smoke Grenade', 'Smoke Grenade', 'Flashbang', 'Flashbang', 'Light Armor'],
      health: { current: 60, maximum: 60 },
      shield: 15,
      maxShield: 15,
      shieldRegen: 4,
      dr: 8,
      equippedArmor: 'Light Armor',
      equippedShield: null,
      status: 'ready',
      statusStartTime: Date.now(),
      idleEscalationLevel: 0,
      location: { country: 'United States', city: 'Los Angeles' },
      injuries: [],
      medicalHistory: [],
      recoveryTime: 0,
      personality: { mbti: 'INTP' },  // Logician - very patient, analytical
      fame: 45,
      cityFamiliarities: [{ cityId: 'los-angeles', cityName: 'Los Angeles', familiarity: 30, lastVisited: Date.now() }],
    },
    {
      id: 'soldier-004',
      name: 'Delta Demolitions',
      realName: 'Ivan Volkov',
      stats: { MEL: 52, AGL: 50, STR: 62, STA: 60, INT: 72, INS: 55, CON: 58 },
      threatLevel: 'THREAT_3',
      origin: 'Explosives Expert',
      powers: ['Demolitions Master', 'Trap Setting'],
      equipment: ['Standard Pistol', 'Plasma Grenade', 'Plasma Grenade', 'Incendiary Grenade', 'Incendiary Grenade', 'Cryo Grenade', 'Cryo Grenade', 'Drone Controller'],
      health: { current: 65, maximum: 65 },
      shield: 25,
      maxShield: 25,
      shieldRegen: 4,
      dr: 10,
      equippedArmor: 'Blast Suit',
      equippedShield: null,
      status: 'ready',
      statusStartTime: Date.now(),
      idleEscalationLevel: 0,
      location: { country: 'Russia', city: 'Moscow' },
      injuries: [],
      medicalHistory: [],
      recoveryTime: 0,
      personality: { mbti: 'ESTP' },  // Entrepreneur - very impatient, action-oriented
      fame: 200,
      cityFamiliarities: [{ cityId: 'moscow', cityName: 'Moscow', familiarity: 75, lastVisited: Date.now() }],
    }
  ],

  // Investigation System - using new Investigation type
  investigations: [] as Investigation[],
  activeInvestigations: [] as Investigation[],
  investigationLeads: [
    // Start with a couple of discovered leads
    generateInvestigation(
      INVESTIGATION_TEMPLATES[0],  // Drug Distribution Ring
      'Washington DC',
      'United States',
      'K3'
    ),
    generateInvestigation(
      INVESTIGATION_TEMPLATES[3],  // Corporate Cover-up
      'Detroit',
      'United States',
      'J7'
    )
  ] as Investigation[],

  worldEvents: [
    {
      id: 'evt-001',
      title: 'Chinese Naval Buildup',
      description: 'Satellite imagery shows LSW naval exercises in South China Sea',
      location: 'South China Sea',
      severity: 'high',
      time: new Date().toLocaleTimeString()
    }
  ],

  medicalQueue: [],

  // Notification System - start with a welcome message
  notifications: [
    {
      id: 'notif-welcome',
      type: 'handler' as NotificationType,
      priority: 'medium' as NotificationPriority,
      title: 'Welcome, Commander',
      message: 'Your team is ready. Assign them to activities or deploy to a sector.',
      timestamp: 0,
      realTimestamp: Date.now(),
      read: false,
      dismissed: false,
    }
  ] as GameNotification[],

  // News System
  newsArticles: [] as NewsArticle[],
  playerFame: 0,
  publicOpinion: {} as Record<string, number>,
  localNewspaperName: '',

  // New World Systems Initial State
  economy: createInitialEconomyState(),
  reputation: createInitialReputationState(),
  newsState: createInitialNewsState(),
  baseState: createInitialBaseState(),
  factionStandings: [] as FactionStanding[],  // Initialized when country is selected
  squads: [] as Squad[],  // Multi-squad support - initialized with characters

  // Character Life Cycle State - Initial State
  pendingActivityRequests: [] as ActivityRequest[],
  completedActivityReports: [] as DailyActivityReport[],
  lastDayProcessed: 0,

  // Training/Education System - Initial State
  trainingEnrollments: [] as TrainingEnrollment[],

  // Inventory System - Initial State
  inventory: {
    weapons: [],
    armor: [],
    gadgets: [],
    consumables: [],
  },

  // Mission System - Initial State
  availableMissions: new Map<string, GeneratedMission[]>(),
  activeMissions: [] as GeneratedMission[],
  completedMissions: [] as GeneratedMission[],
  lastMissionGeneration: 0,
  missionRefreshInterval: 24,  // Refresh every 24 game hours

  // Underworld System - Initial State
  criminalOrganizations: [] as CriminalOrganization[],
  underworldEvents: [] as SimulationEvent[],
  lastUnderworldWeek: 0,
  underworldStats: {
    totalArrests: 0,
    totalProfit: 0,
    totalEvents: 0,
  },

  // Doom Clock Initial State
  doomClock: createInitialDoomClockState(),

  // WORKING Actions
  setGamePhase: (phase) => {
    set({ gamePhase: phase })
    toast.success(`Phase: ${phase}`)
  },

  selectFaction: (faction) => {
    set({
      selectedFaction: faction,
      gamePhase: 'country-selection'
    })
    toast.success(`Selected ${faction} faction`)
  },

  selectCountry: (country) => {
    set({
      selectedCountry: country,
      gamePhase: 'city-selection'
    })
    // Initialize faction standings for this country
    get().initFactionStandings()
    toast.success(`Operations authorized in ${country}`)
  },

  selectCity: (city) => {
    // Generate newspaper name based on city's culture code
    const cityData = getCityByName(city);
    const newspaperName = cityData
      ? generateNewspaperName(city, cityData.cultureCode)
      : `The ${city} Times`;  // Fallback if city not found

    set({
      selectedCity: city,
      localNewspaperName: newspaperName,
      gamePhase: 'recruiting'
    })
    // Initialize squads with starting characters
    get().initializeSquads()
    toast.success(`Headquarters established in ${city} - Now recruit your team!`)
  },

  setCurrentView: (view) => {
    set({ currentView: view })
    toast.info(`Switched to ${view.replace('-', ' ')}`)
  },

  deployTeam: () => {
    const state = get()
    const availableTeam = state.characters.filter(c => c.status === 'ready')
    if (availableTeam.length > 0) {
      set({
        characters: state.characters.map(char =>
          char.status === 'ready'
            ? { ...char, status: 'busy' }
            : char
        )
      })
      toast.success(`Deploying ${availableTeam.length} operatives to crisis zone`)
    } else {
      toast.error('No available operatives for deployment')
    }
  },

  contactNetwork: () => {
    const state = get()
    const newEvent = {
      id: 'evt-' + Date.now(),
      title: 'Intelligence Network Update',
      description: 'Field agents report suspicious LSW activity in target region',
      location: 'Classified Location',
      severity: 'medium',
      time: new Date().toLocaleTimeString()
    }
    set({
      worldEvents: [newEvent, ...state.worldEvents.slice(0, 9)]
    })
    toast.success('Intelligence network activated - new information received')
  },

  emergencyPowers: () => {
    const state = get()
    if (state.budget >= 10000) {
      const emergency = {
        id: 'inv-emergency-' + Date.now(),
        title: 'Emergency Response Operation',
        description: 'Emergency powers activated - immediate threat response required',
        location: { country: state.selectedCountry, city: state.selectedCity },
        difficulty: 9,
        priority: 'critical',
        timeLimit: 6,
        progress: 0,
        assignedCharacters: []
      }

      set({
        budget: state.budget - 10000,
        investigations: [emergency, ...state.investigations]
      })
      toast.success('Emergency powers activated - $10,000 spent')
    } else {
      toast.error('Insufficient budget for emergency activation')
    }
  },

  startCombat: () => {
    set({ currentView: 'tactical-combat' })
    toast.success('Tactical combat initiated')
  },

  assignInvestigation: (invId) => {
    const state = get()
    const investigation = state.investigations.find(inv => inv.id === invId)
    const availableChar = state.characters.find(c => c.status === 'ready')

    if (investigation && availableChar) {
      set({
        investigations: state.investigations.map(inv =>
          inv.id === invId
            ? { ...inv, assignedCharacters: [availableChar.id], progress: 25 }
            : inv
        ),
        characters: state.characters.map(char =>
          char.id === availableChar.id
            ? { ...char, status: 'busy' }
            : char
        )
      })
      toast.success(`${availableChar.name} assigned to ${investigation.title}`)
    } else {
      toast.error('No available operatives for assignment')
    }
  },

  // Medical System Functions
  addInjury: (characterId, injury) => {
    const state = get()
    set({
      characters: state.characters.map(char =>
        char.id === characterId
          ? {
            ...char,
            injuries: [...(char.injuries || []), injury],
            status: injury.severity === 'critical' ? 'hospitalized' : 'injured'
          }
          : char
      )
    })

    // Schedule hospital stay if needed
    if (injury.medicalCost > 5000) {
      set({
        medicalQueue: [...state.medicalQueue, {
          characterId,
          injury,
          admissionTime: Date.now(),
          cost: injury.medicalCost,
          recoveryTime: injury.healingTime
        }]
      })
    }
  },

  scheduleHospitalStay: (characterId, injury) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)

    if (character) {
      set({
        characters: state.characters.map(char =>
          char.id === characterId
            ? { ...char, status: 'hospitalized', recoveryTime: injury.recoveryDays || 14 }
            : char
        ),
        budget: state.budget - injury.medicalCost
      })

      toast.error(`${character.name} hospitalized - $${injury.medicalCost.toLocaleString()} medical costs`)
    }
  },

  processRecovery: () => {
    const state = get()
    const recovered = []

    const updatedCharacters = state.characters.map(char => {
      // Process both 'hospitalized' (legacy) and 'hospital' (new) status
      if ((char.status === 'hospitalized' || char.status === 'hospital') && char.recoveryTime > 0) {
        // Reduce recovery time by 1 hour per tick
        const newRecoveryTime = char.recoveryTime - 1

        if (newRecoveryTime <= 0) {
          recovered.push(char.name)
          return {
            ...char,
            status: 'ready',
            recoveryTime: 0,
            injuries: [], // Clear injuries upon full recovery
            health: { ...char.health, current: char.health.maximum },
            statusStartTime: Date.now(),
            idleEscalationLevel: 0
          }
        }
        return { ...char, recoveryTime: newRecoveryTime }
      }
      return char
    })

    if (recovered.length > 0) {
      set({ characters: updatedCharacters })
      recovered.forEach(name => {
        toast.success(`${name} has recovered and returned to duty`)

        // Create notification
        get().addNotification({
          type: 'status_change',
          priority: 'medium',
          title: `${name} Discharged`,
          message: `${name} has fully recovered and is ready for duty.`,
          timestamp: state.gameTime.day * 1440 + state.gameTime.minutes,
        })
      })
    }
  },

  updateCharacterInjuries: (characterId, injury) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)

    if (character) {
      // Add injury to character's injuries array
      const updatedInjuries = [...(character.injuries || []), injury]

      // Determine new status based on severity
      let newStatus = character.status
      if (injury.severity === 'FATAL') {
        newStatus = 'incapacitated'
      } else if (injury.severity === 'PERMANENT' || injury.severity === 'SEVERE') {
        newStatus = 'injured'
      }

      set({
        characters: state.characters.map(char =>
          char.id === characterId
            ? {
              ...char,
              injuries: updatedInjuries,
              status: newStatus
            }
            : char
        )
      })

      // Show toast notification for injuries
      const severityEmoji =
        injury.severity === 'FATAL' ? '💀' :
          injury.severity === 'PERMANENT' ? '🦴' :
            injury.severity === 'SEVERE' ? '🤕' :
              injury.severity === 'MODERATE' ? '🩸' : '🟣'

      toast.error(`${severityEmoji} ${character.name}: ${injury.description}`)
    }
  },

  // Hospital Management System
  getHospitalQuality: (countryCode: string) => {
    const country = getCountryByCode(countryCode)
    if (!country) return 50 // Default quality

    // Calculate hospital quality from Healthcare + GDP + Lifestyle (combined effects)
    const medicalSystem = calculateMedicalSystem(country)
    return medicalSystem.healthcareQuality
  },

  calculateRecoveryTime: (injury: any, hospitalQuality: number) => {
    // Base recovery time by severity (in game hours)
    const baseHours: Record<string, number> = {
      minor: 24,       // 1 day
      moderate: 72,    // 3 days
      severe: 168,     // 7 days
      critical: 336,   // 14 days
      permanent: 720   // 30 days
    }

    const base = baseHours[injury.severity] || 72

    // Hospital quality modifier: 50% quality = 2x time, 100% quality = 0.5x time
    const qualityMultiplier = 2 - (hospitalQuality / 100) * 1.5

    // Calculate final recovery time in hours
    const recoveryHours = Math.max(1, Math.round(base * qualityMultiplier))

    return recoveryHours
  },

  hospitalizeCharacter: (characterId: string, injuries: any[], countryCode?: string) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)

    if (!character) {
      toast.error('Character not found')
      return
    }

    // Use character's current country or fallback
    const hospitalCountry = countryCode || character.location?.country || state.selectedCountry
    const country = getCountryByCode(hospitalCountry)

    if (!country) {
      toast.error('Invalid country for hospitalization')
      return
    }

    // Get hospital quality and medical costs
    const medicalSystem = calculateMedicalSystem(country)
    const hospitalQuality = medicalSystem.healthcareQuality

    // Calculate total recovery time and cost
    let totalRecoveryHours = 0
    let totalCost = 0

    injuries.forEach(injury => {
      const recoveryTime = get().calculateRecoveryTime(injury, hospitalQuality)
      totalRecoveryHours += recoveryTime

      // Cost based on severity and country healthcare cost
      const baseCost = {
        minor: medicalSystem.emergencyCareCost * 0.5,
        moderate: medicalSystem.emergencyCareCost,
        severe: medicalSystem.surgeryCost,
        critical: medicalSystem.surgeryCost * 2,
        permanent: medicalSystem.surgeryCost * 3
      }[injury.severity] || medicalSystem.emergencyCareCost

      totalCost += baseCost
    })

    // Calculate cost per hour for long-term care
    const daysInHospital = Math.ceil(totalRecoveryHours / 24)
    if (daysInHospital > 3) {
      totalCost += medicalSystem.longTermCareCost * Math.floor(daysInHospital / 7)
    }

    // Check budget
    if (state.budget < totalCost) {
      toast.error(`Insufficient funds! Hospital costs $${totalCost.toLocaleString()} but you have $${state.budget.toLocaleString()}`)
      return
    }

    // Hospitalize the character
    set({
      characters: state.characters.map(char =>
        char.id === characterId
          ? {
            ...char,
            status: 'hospital',
            recoveryTime: totalRecoveryHours,
            injuries: injuries,
            location: {
              ...char.location,
              country: hospitalCountry,
              city: `Hospital in ${hospitalCountry}`
            }
          }
          : char
      ),
      budget: state.budget - totalCost
    })

    // Create notification
    get().addNotification({
      type: 'injury',
      priority: 'high',
      title: `${character.name} Hospitalized`,
      message: `Admitted to ${country.name} hospital (Tier ${medicalSystem.hospitalTier}). Recovery time: ${Math.ceil(totalRecoveryHours / 24)} days. Cost: $${totalCost.toLocaleString()}`,
      characterId: character.id,
      characterName: character.name,
      location: hospitalCountry,
      timestamp: state.gameTime.day * 1440 + state.gameTime.minutes,
    })

    toast.error(`${character.name} hospitalized in ${country.name}. Recovery: ${Math.ceil(totalRecoveryHours / 24)} days`)
  },

  transferToHospital: (characterId: string, targetCountryCode: string) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)

    if (!character || character.status !== 'hospital') {
      toast.error('Character is not currently hospitalized')
      return
    }

    const targetCountry = getCountryByCode(targetCountryCode)
    if (!targetCountry) {
      toast.error('Invalid target country')
      return
    }

    const currentCountry = character.location?.country || state.selectedCountry
    const currentMedical = calculateMedicalSystem(getCountryByCode(currentCountry)!)
    const targetMedical = calculateMedicalSystem(targetCountry)

    // Calculate transfer costs
    const transferCost = Math.round(5000 * (targetMedical.healthcareCost / currentMedical.healthcareCost))
    const travelTime = 12 // 12 hours base travel time for medical evacuation

    if (state.budget < transferCost) {
      toast.error(`Transfer costs $${transferCost.toLocaleString()} but you have $${state.budget.toLocaleString()}`)
      return
    }

    // Recalculate recovery time with new hospital quality
    const newQuality = targetMedical.healthcareQuality
    const oldQuality = currentMedical.healthcareQuality
    const qualityRatio = oldQuality / newQuality
    const newRecoveryTime = Math.max(1, Math.round(character.recoveryTime * qualityRatio))

    // Transfer the character
    set({
      characters: state.characters.map(char =>
        char.id === characterId
          ? {
            ...char,
            recoveryTime: newRecoveryTime + travelTime, // Add travel time
            location: {
              ...char.location,
              country: targetCountryCode,
              city: `Hospital in ${targetCountryCode}`
            }
          }
          : char
      ),
      budget: state.budget - transferCost
    })

    const timeSaved = character.recoveryTime - newRecoveryTime
    const message = timeSaved > 0
      ? `Transfer complete. Upgraded to Tier ${targetMedical.hospitalTier} hospital. Recovery time reduced by ${Math.ceil(timeSaved / 24)} days.`
      : `Transfer complete. Hospital quality: Tier ${targetMedical.hospitalTier}.`

    get().addNotification({
      type: 'status_change',
      priority: 'medium',
      title: `${character.name} Transferred`,
      message,
      characterId: character.id,
      characterName: character.name,
      location: targetCountryCode,
      timestamp: state.gameTime.day * 1440 + state.gameTime.minutes,
    })

    toast.success(`${character.name} transferred to ${targetCountry.name}. ${timeSaved > 0 ? `Saves ${Math.ceil(timeSaved / 24)} days` : ''}`)
  },

  // Character Management Functions
  addCharacter: (character) => {
    const state = get()
    const newCharacter = {
      id: `char-${Date.now()}`,
      name: character.name || 'New Character',
      realName: character.realName || character.name || 'Unknown',
      stats: character.stats || { MEL: 50, AGL: 50, STR: 50, STA: 50, INT: 50, INS: 50, CON: 50 },
      threatLevel: character.threatLevel || 'THREAT_1',
      origin: character.origin || 'Skilled Human',
      powers: character.powers || [],
      equipment: character.equipment || [],
      health: character.health || { current: 60, maximum: 60 },
      shield: character.shield || 0,
      maxShield: character.maxShield || 0,
      shieldRegen: character.shieldRegen || 0,
      dr: character.dr || 0,
      equippedArmor: character.equippedArmor || null,
      equippedShield: character.equippedShield || null,
      status: 'ready',
      location: character.location || { country: state.selectedCountry || 'United States', city: state.selectedCity || 'Washington DC' },
      injuries: [],
      medicalHistory: [],
      recoveryTime: 0,
      ...character
    }
    set({ characters: [...state.characters, newCharacter] })

    // Emit character recruited event
    EventBus.emit({
      id: `recruit-${newCharacter.id}`,
      type: 'player:character-recruited',
      category: 'player',
      timestamp: Date.now(),
      data: {
        characterId: newCharacter.id,
        characterName: newCharacter.name,
        origin: newCharacter.origin,
        threatLevel: newCharacter.threatLevel,
        location: newCharacter.location
      }
    })

    toast.success(`${newCharacter.name} has joined your team!`)
  },

  updateCharacter: (characterId, updates) => {
    const state = get()
    set({
      characters: state.characters.map(char =>
        char.id === characterId
          ? { ...char, ...updates }
          : char
      )
    })
    toast.info('Character updated')
  },

  removeCharacter: (characterId) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)
    set({
      characters: state.characters.filter(c => c.id !== characterId)
    })
    if (character) {
      toast.info(`${character.name} has left the team`)
    }
  },

  // Squad Deployment Functions
  deployToSector: (sector, city) => {
    const state = get()
    const availableTeam = state.characters.filter(c => c.status === 'ready')

    if (availableTeam.length === 0) {
      toast.error('No operatives available for deployment')
      return
    }

    // Calculate approximate travel time (1 sector = ~6 hours)
    const currentCol = state.currentSector.charCodeAt(0) - 65
    const currentRow = parseInt(state.currentSector.slice(1))
    const destCol = sector.charCodeAt(0) - 65
    const destRow = parseInt(sector.slice(1))
    const distance = Math.abs(destCol - currentCol) + Math.abs(destRow - currentRow)
    const travelHours = distance * 6

    set({
      destinationSector: sector,
      squadStatus: 'traveling',
      travelProgress: 0,
      characters: state.characters.map(char =>
        char.status === 'ready' ? { ...char, status: 'traveling' } : char
      )
    })

    // Emit travel started event
    EventBus.emit({
      id: `travel-${Date.now()}`,
      type: 'player:travel-started',
      category: 'player',
      timestamp: Date.now(),
      data: {
        characterIds: availableTeam.map(c => c.id),
        originSector: state.currentSector,
        destinationSector: sector,
        destinationCity: city,
        travelTimeHours: travelHours,
        vehicleUsed: undefined
      }
    })

    toast.success(`Squad deployed to sector ${sector}. ETA: ${travelHours} hours`)

    // Simulate instant travel for testing (normally would be time-based)
    setTimeout(() => {
      const currentState = get()
      if (currentState.squadStatus === 'traveling') {
        set({
          currentSector: sector,
          destinationSector: null,
          squadStatus: 'on_mission',
          travelProgress: 100,
          pendingMission: city ? { sector, city, type: 'patrol' } : null
        })

        // Emit travel completed event
        EventBus.emit({
          id: `travel-complete-${Date.now()}`,
          type: 'player:travel-completed',
          category: 'player',
          timestamp: Date.now(),
          data: {
            characterIds: availableTeam.map(c => c.id),
            destinationSector: sector,
            destinationCity: city
          }
        })

        toast.success(`Squad arrived at sector ${sector}${city ? ` - ${city}` : ''}`)
      }
    }, 1500)
  },

  startMission: (sector, city, missionType) => {
    const missionId = `mission-${Date.now()}`

    set({
      pendingMission: { sector, city, type: missionType },
      squadStatus: 'on_mission'
    })

    // Emit mission started event
    EventBus.emit({
      id: missionId,
      type: 'mission:started',
      category: 'mission',
      timestamp: Date.now(),
      data: {
        missionId,
        missionType,
        location: { sector, city },
        difficulty: 'medium'
      }
    })

    toast.info(`Mission started: ${missionType} in ${city}`)
  },

  enterCombat: () => {
    const state = get()
    const combatId = `combat-${Date.now()}`

    set({
      squadStatus: 'in_combat',
      currentView: 'combat-lab',
      characters: state.characters.map(char =>
        char.status === 'traveling' ? { ...char, status: 'in_combat' } : char
      )
    })

    // Emit combat started event
    EventBus.emit({
      id: combatId,
      type: 'combat:started',
      category: 'combat',
      timestamp: Date.now(),
      data: {
        combatId,
        location: state.pendingMission ? {
          sector: state.pendingMission.sector,
          city: state.pendingMission.city
        } : undefined,
        playerUnits: state.characters.filter(c => c.status === 'in_combat').map(c => c.id),
        enemyCount: 0  // Will be populated by combat scene
      }
    })

    toast.success('Engaging hostiles!')
  },

  completeMission: (success) => {
    const state = get()
    const reward = success ? 5000 : 0
    const missionData = state.pendingMission

    set({
      squadStatus: 'idle',
      pendingMission: null,
      budget: state.budget + reward,
      currentView: 'world-map',
      characters: state.characters.map(char =>
        char.status === 'in_combat' || char.status === 'traveling'
          ? { ...char, status: 'ready' }
          : char
      )
    })

    // Emit mission completed event
    if (missionData) {
      EventBus.emit({
        id: `mission-complete-${Date.now()}`,
        type: 'mission:completed',
        category: 'mission',
        timestamp: Date.now(),
        data: {
          missionId: `mission-${missionData.sector}-${missionData.city}`,
          outcome: success ? 'success' : 'failure',
          rewards: { money: reward },
          location: { sector: missionData.sector, city: missionData.city }
        }
      })
    }

    // Adjust reputation based on mission outcome
    if (success) {
      get().adjustReputationAxis('heroic', 5, 'Mission success')
      get().adjustReputationAxis('public', 3, 'Mission success')
      toast.success(`Mission complete! +$${reward.toLocaleString()}`)
    } else {
      get().adjustReputationAxis('heroic', -3, 'Mission failed')
      get().adjustReputationAxis('public', -2, 'Mission failed')
      toast.error('Mission failed. Squad returning to base.')
    }
  },

  // Enhanced Travel System Functions
  startTravel: (characterIds, destinationSector, vehicleId) => {
    const state = get()
    const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWX'

    // Get characters
    const travelingChars = state.characters.filter(c => characterIds.includes(c.id))
    if (travelingChars.length === 0) {
      toast.error('No characters selected for travel')
      return
    }

    // Determine origin sector (use first character's sector or currentSector)
    const firstChar = travelingChars[0]
    const originSector = firstChar.sector || state.currentSector

    // Calculate direction angle between sectors
    const getRowCol = (sector: string) => {
      const row = ROW_LABELS.indexOf(sector.charAt(0))
      const col = parseInt(sector.slice(1)) - 1
      return { row, col }
    }

    const origin = getRowCol(originSector)
    const dest = getRowCol(destinationSector)

    // Calculate angle: 0 = up, 90 = right, 180 = down, 270 = left
    const dx = dest.col - origin.col
    const dy = dest.row - origin.row
    const angleRad = Math.atan2(dx, -dy)  // -dy because row 0 is at top
    const angleDeg = (angleRad * 180 / Math.PI + 360) % 360

    // Calculate travel time based on distance and vehicle speed
    // Using GAMEPLAY time: base ~5 seconds per sector on foot, faster with vehicles
    const distance = Math.sqrt(dx * dx + dy * dy)
    let secondsPerSector = 5  // Base: 5 seconds per sector on foot (walking)
    let vehicleType: 'ground' | 'air' | 'water' | undefined

    // Track fuel consumption for this trip
    let fuelConsumed = 0
    let vehicleDataRef: Vehicle | null = null

    if (vehicleId) {
      const fleetVehicle = state.fleetVehicles.find(v => v.id === vehicleId)
      if (fleetVehicle) {
        // Lookup full vehicle data from database for accurate speed
        const vehicleData = getVehicleById(fleetVehicle.vehicleTemplateId)
        if (vehicleData) {
          vehicleDataRef = vehicleData

          // VI-003: Calculate fuel consumption for this trip
          fuelConsumed = calculateFuelForSectors(vehicleData, distance)

          // Check if vehicle has enough fuel
          if (!hasEnoughFuel(fleetVehicle.currentFuel, fuelConsumed)) {
            toast.error(`Not enough fuel! Need ${fuelConsumed.toFixed(1)}%, have ${fleetVehicle.currentFuel.toFixed(1)}%`)
            return
          }

          // Get actual speed in km/h from database
          const speedKmH = getVehicleTravelSpeed(vehicleData)
          // Convert to gameplay seconds per sector (500km = 1 sector)
          // Formula: At 500 km/h, 1 sector takes 1 hour = 3600 seconds
          // But we scale down for gameplay: 3600 / 720 = 5 (walking speed baseline)
          // So vehicle speed ratio: speedKmH / 40 (walking = 40 km/day ~= 1.7 km/h)
          // Faster speed = fewer seconds per sector
          const speedRatio = speedKmH / 100  // 100 km/h baseline
          secondsPerSector = Math.max(0.5, 5 / speedRatio)  // Min 0.5s for supersonic

          // Map travel mode
          if (vehicleData.travelMode === 'air') {
            vehicleType = 'aircraft' as any
          } else if (vehicleData.travelMode === 'water') {
            vehicleType = 'sea' as any
          } else {
            vehicleType = 'ground'
          }
        } else {
          // Fallback to fleet vehicle data if template not found
          if (fleetVehicle.type === 'aircraft') {
            secondsPerSector = fleetVehicle.speed > 300 ? 1 : 2
          } else if (fleetVehicle.type === 'ground') {
            secondsPerSector = fleetVehicle.speed > 60 ? 2.5 : 3
          } else {
            secondsPerSector = 3.5
          }
          vehicleType = fleetVehicle.type
        }
      }
    }

    const travelTimeSeconds = distance * secondsPerSector
    const travelTimeMinutes = travelTimeSeconds / 60
    const startTime = Date.now()
    const estimatedArrival = startTime + travelTimeSeconds * 1000  // Convert to ms

    // Create travel unit
    const travelUnit: TravelingUnit = {
      id: `travel-${Date.now()}`,
      type: characterIds.length > 1 ? 'squad' : 'character',
      name: characterIds.length > 1 ? `Squad (${characterIds.length})` : travelingChars[0].name,
      originSector,
      destinationSector,
      progress: 0,
      startTime,
      estimatedArrival,
      speed: 1 / secondsPerSector,  // sectors per second
      vehicleId,
      vehicleType,
      characterIds,
      direction: angleDeg
    }

    // Update state - including fuel consumption (VI-003)
    set({
      travelingUnits: [...state.travelingUnits, travelUnit],
      characters: state.characters.map(char =>
        characterIds.includes(char.id)
          ? { ...char, status: 'traveling', travelUnitId: travelUnit.id }
          : char
      ),
      fleetVehicles: vehicleId
        ? state.fleetVehicles.map(v =>
            v.id === vehicleId
              ? {
                  ...v,
                  status: 'traveling' as const,
                  assignedCharacters: characterIds,
                  // VI-003: Deduct fuel consumption
                  currentFuel: Math.max(0, v.currentFuel - fuelConsumed)
                }
              : v
          )
        : state.fleetVehicles
    })

    // Log fuel consumption if significant
    if (fuelConsumed > 0) {
      console.log(`[VEHICLE] ${vehicleId}: Consumed ${fuelConsumed.toFixed(1)}% fuel for ${distance.toFixed(1)} sector travel`)
    }

    const etaStr = travelTimeMinutes < 1
      ? `${Math.round(travelTimeSeconds)} seconds`
      : `${travelTimeMinutes.toFixed(1)} minutes`

    // Emit travel started event
    EventBus.emit({
      id: travelUnit.id,
      type: 'player:travel-started',
      category: 'player',
      timestamp: Date.now(),
      data: {
        characterIds,
        originSector,
        destinationSector,
        travelTimeHours: travelTimeMinutes / 60,
        vehicleUsed: vehicleId
      }
    })

    toast.success(`${travelUnit.name} en route to ${destinationSector}. ETA: ${etaStr}`)
  },

  updateTravelProgress: () => {
    const state = get()
    const now = Date.now()

    const updatedUnits = state.travelingUnits.map(unit => {
      const elapsed = now - unit.startTime
      const total = unit.estimatedArrival - unit.startTime
      const progress = Math.min(100, (elapsed / total) * 100)
      return { ...unit, progress }
    })

    // Check for completed travels
    const completed = updatedUnits.filter(u => u.progress >= 100)
    const stillTraveling = updatedUnits.filter(u => u.progress < 100)

    // Process completions
    completed.forEach(unit => {
      // Update characters to arrived status
      set(state => ({
        characters: state.characters.map(char =>
          unit.characterIds.includes(char.id)
            ? { ...char, status: 'ready', sector: unit.destinationSector, travelUnitId: undefined }
            : char
        ),
        // Update vehicle location
        fleetVehicles: unit.vehicleId
          ? state.fleetVehicles.map(v =>
              v.id === unit.vehicleId
                ? { ...v, status: 'available' as const, currentSector: unit.destinationSector, assignedCharacters: [] }
                : v
            )
          : state.fleetVehicles
      }))

      // Emit travel completed event
      EventBus.emit({
        id: `${unit.id}-complete`,
        type: 'player:travel-completed',
        category: 'player',
        timestamp: Date.now(),
        data: {
          characterIds: unit.characterIds,
          destinationSector: unit.destinationSector,
          travelTimeActual: (now - unit.startTime) / 1000 / 60 / 60  // hours
        }
      })

      toast.success(`${unit.name} arrived at ${unit.destinationSector}`)
    })

    set({ travelingUnits: stillTraveling })
  },

  completeTravelUnit: (unitId) => {
    const state = get()
    const unit = state.travelingUnits.find(u => u.id === unitId)
    if (!unit) return

    // Get character names for notification
    const travelingCharacters = state.characters.filter(c => unit.characterIds.includes(c.id))
    const characterNames = travelingCharacters.map(c => c.name).join(', ')
    const firstCharacter = travelingCharacters[0]

    const arrivalTime = Date.now()

    // VI-005: Check for travel incidents and apply vehicle damage
    let incidentDamage = 0
    let incidentDescription = ''

    if (unit.vehicleId) {
      const fleetVehicle = state.fleetVehicles.find(v => v.id === unit.vehicleId)
      if (fleetVehicle) {
        const vehicleData = getVehicleById(fleetVehicle.vehicleTemplateId)
        if (vehicleData) {
          // Calculate distance traveled
          const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWX'
          const getRowCol = (sector: string) => {
            const row = ROW_LABELS.indexOf(sector.charAt(0))
            const col = parseInt(sector.slice(1)) - 1
            return { row, col }
          }
          const origin = getRowCol(unit.originSector)
          const dest = getRowCol(unit.destinationSector)
          const distance = Math.sqrt(
            Math.pow(dest.col - origin.col, 2) + Math.pow(dest.row - origin.row, 2)
          )

          // Roll for incident per sector traveled
          const incidentChance = getTravelIncidentChance(
            vehicleData.travelMode,
            'rural' // Default terrain - could be enhanced with sector terrain data
          )

          // Check each sector for incidents
          for (let i = 0; i < Math.ceil(distance); i++) {
            if (Math.random() < incidentChance) {
              const incident = generateTravelIncident(vehicleData, vehicleData.travelMode)
              if (incident && incident.damage > 0) {
                incidentDamage += incident.damage
                incidentDescription = incident.description
              }
            }
          }
        }
      }
    }

    set({
      travelingUnits: state.travelingUnits.filter(u => u.id !== unitId),
      characters: state.characters.map(char =>
        unit.characterIds.includes(char.id)
          ? { ...char, status: 'ready', sector: unit.destinationSector, travelUnitId: undefined, statusStartTime: arrivalTime, idleEscalationLevel: 0 }
          : char
      ),
      fleetVehicles: unit.vehicleId
        ? state.fleetVehicles.map(v =>
            v.id === unit.vehicleId
              ? {
                  ...v,
                  status: 'available' as const,
                  currentSector: unit.destinationSector,
                  assignedCharacters: [],
                  // VI-005: Apply incident damage to vehicle HP
                  currentHP: Math.max(0, v.currentHP - incidentDamage),
                  // Flag for maintenance if HP drops below 50%
                  maintenanceNeeded: v.maintenanceNeeded || ((v.currentHP - incidentDamage) < v.maxHP * 0.5)
                }
              : v
          )
        : state.fleetVehicles
    })

    // Create arrival notification
    let arrivalMessage = travelingCharacters.length === 1
      ? `${firstCharacter?.name || 'Team'} has arrived and is awaiting orders.`
      : `${characterNames} have arrived and are awaiting orders.`

    // Add incident report if there was damage
    if (incidentDamage > 0) {
      arrivalMessage += ` Travel incident: ${incidentDescription} (${incidentDamage} damage to vehicle)`
    }

    get().addNotification({
      type: 'arrival',
      priority: incidentDamage > 0 ? 'high' : 'medium',
      title: `Arrived at Sector ${unit.destinationSector}`,
      message: arrivalMessage,
      characterId: firstCharacter?.id,
      characterName: firstCharacter?.name,
      location: `Sector ${unit.destinationSector}`,
      timestamp: Date.now(),
    })

    if (incidentDamage > 0) {
      toast.error(`Travel incident: ${incidentDescription} (${incidentDamage} damage)`)
    }
    toast.success(`${unit.name} arrived at ${unit.destinationSector}`)
  },

  cancelTravel: (unitId) => {
    const state = get()
    const unit = state.travelingUnits.find(u => u.id === unitId)
    if (!unit) return

    // Calculate current position based on progress
    const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWX'
    const getRowCol = (sector: string) => {
      const row = ROW_LABELS.indexOf(sector.charAt(0))
      const col = parseInt(sector.slice(1)) - 1
      return { row, col }
    }

    const origin = getRowCol(unit.originSector)
    const dest = getRowCol(unit.destinationSector)
    const progress = unit.progress / 100

    const currentRow = Math.round(origin.row + (dest.row - origin.row) * progress)
    const currentCol = Math.round(origin.col + (dest.col - origin.col) * progress)
    const currentSector = `${ROW_LABELS[Math.max(0, Math.min(23, currentRow))]}${Math.max(1, Math.min(40, currentCol + 1))}`

    set({
      travelingUnits: state.travelingUnits.filter(u => u.id !== unitId),
      characters: state.characters.map(char =>
        unit.characterIds.includes(char.id)
          ? { ...char, status: 'ready', sector: currentSector, travelUnitId: undefined }
          : char
      ),
      fleetVehicles: unit.vehicleId
        ? state.fleetVehicles.map(v =>
            v.id === unit.vehicleId
              ? { ...v, status: 'available' as const, currentSector, assignedCharacters: [] }
              : v
          )
        : state.fleetVehicles
    })

    toast.info(`Travel cancelled. ${unit.name} stopped at ${currentSector}`)
  },

  assignCharacterToVehicle: (characterId, vehicleId) => {
    const state = get()
    const vehicle = state.fleetVehicles.find(v => v.id === vehicleId)
    if (!vehicle) {
      toast.error('Vehicle not found')
      return
    }

    if (vehicle.assignedCharacters.length >= vehicle.capacity) {
      toast.error(`${vehicle.name} is at full capacity (${vehicle.capacity})`)
      return
    }

    set({
      fleetVehicles: state.fleetVehicles.map(v =>
        v.id === vehicleId
          ? { ...v, assignedCharacters: [...v.assignedCharacters, characterId] }
          : v
      )
    })

    const char = state.characters.find(c => c.id === characterId)
    toast.success(`${char?.name || 'Character'} assigned to ${vehicle.name}`)
  },

  unassignCharacterFromVehicle: (characterId, vehicleId) => {
    const state = get()

    set({
      fleetVehicles: state.fleetVehicles.map(v =>
        v.id === vehicleId
          ? { ...v, assignedCharacters: v.assignedCharacters.filter(id => id !== characterId) }
          : v
      )
    })

    const char = state.characters.find(c => c.id === characterId)
    const vehicle = state.fleetVehicles.find(v => v.id === vehicleId)
    toast.info(`${char?.name || 'Character'} removed from ${vehicle?.name || 'vehicle'}`)
  },

  // VI-003: Refuel vehicle
  refuelVehicle: (vehicleId: string, fuelAmount?: number) => {
    const state = get()
    const vehicle = state.fleetVehicles.find(v => v.id === vehicleId)
    if (!vehicle) {
      toast.error('Vehicle not found')
      return
    }

    const vehicleData = getVehicleById(vehicle.vehicleTemplateId)
    if (!vehicleData) {
      toast.error('Vehicle data not found')
      return
    }

    // Calculate how much fuel is needed
    const fuelNeeded = fuelAmount !== undefined
      ? Math.min(fuelAmount, 100 - vehicle.currentFuel)
      : 100 - vehicle.currentFuel

    if (fuelNeeded <= 0) {
      toast.info(`${vehicle.name} is already fully fueled`)
      return
    }

    // Calculate cost using vehicleSystem helper
    const cost = calculateRefuelCost(vehicleData, fuelNeeded)

    // Check if player can afford
    if (state.funds < cost) {
      toast.error(`Not enough funds! Need $${cost.toLocaleString()}`)
      return
    }

    set({
      funds: state.funds - cost,
      fleetVehicles: state.fleetVehicles.map(v =>
        v.id === vehicleId
          ? { ...v, currentFuel: Math.min(100, v.currentFuel + fuelNeeded) }
          : v
      )
    })

    toast.success(`${vehicle.name} refueled (+${fuelNeeded.toFixed(1)}%) for $${cost.toLocaleString()}`)
  },

  // VI-005: Repair vehicle
  repairVehicle: (vehicleId: string, repairAmount?: number) => {
    const state = get()
    const vehicle = state.fleetVehicles.find(v => v.id === vehicleId)
    if (!vehicle) {
      toast.error('Vehicle not found')
      return
    }

    // Calculate how much HP is needed
    const hpNeeded = repairAmount !== undefined
      ? Math.min(repairAmount, vehicle.maxHP - vehicle.currentHP)
      : vehicle.maxHP - vehicle.currentHP

    if (hpNeeded <= 0) {
      toast.info(`${vehicle.name} is already at full health`)
      return
    }

    // Calculate cost: $50 per HP for ground, $100 for air, $75 for sea
    const repairCostPerHP = vehicle.type === 'aircraft' ? 100 : vehicle.type === 'sea' ? 75 : 50
    const cost = Math.round(hpNeeded * repairCostPerHP)

    // Check if player can afford
    if (state.funds < cost) {
      toast.error(`Not enough funds! Need $${cost.toLocaleString()}`)
      return
    }

    set({
      funds: state.funds - cost,
      fleetVehicles: state.fleetVehicles.map(v =>
        v.id === vehicleId
          ? {
              ...v,
              currentHP: Math.min(v.maxHP, v.currentHP + hpNeeded),
              maintenanceNeeded: false  // Clear maintenance flag after repair
            }
          : v
      )
    })

    toast.success(`${vehicle.name} repaired (+${hpNeeded} HP) for $${cost.toLocaleString()}`)
  },

  // =============================================================================
  // NOTIFICATION SYSTEM
  // =============================================================================

  addNotification: (notification) => {
    const newNotification: GameNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      realTimestamp: Date.now(),
      read: false,
      dismissed: false,
    }

    set(state => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50
    }))

    // Show toast for high priority notifications
    if (notification.priority === 'urgent') {
      toast.error(notification.title, { duration: 5000 })
    } else if (notification.priority === 'high') {
      toast.success(notification.title, { duration: 4000 })
    }
  },

  dismissNotification: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, dismissed: true } : n
      )
    }))
  },

  markNotificationRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }))
  },

  clearAllNotifications: () => {
    set({ notifications: [] })
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.read && !n.dismissed).length
  },

  // Idle Detection System - Now uses personality-based impatience
  // Base times adjusted by character's impatience trait
  checkIdleCharacters: () => {
    const state = get()
    const now = Date.now()

    // Base escalation times in milliseconds
    // Impatient characters (ESTP, ENTJ) will escalate faster
    // Patient characters (INTP, INFP) will wait longer
    const BASE_WARNING_MS = 15 * 1000    // 15 seconds base
    const BASE_TEXT_MS = 30 * 1000       // 30 seconds base
    const BASE_CALL_MS = 45 * 1000       // 45 seconds base

    const idleCharacters = state.characters.filter(
      c => c.status === 'ready' && c.statusStartTime
    )

    idleCharacters.forEach(char => {
      const idleTime = now - (char.statusStartTime || now)
      const currentEscalation = char.idleEscalationLevel || 0

      // Get personality-based impatience multiplier
      const traits = getPersonalityTraits(char.personality?.mbti)
      const impatienceMultiplier = getImpatienceMultiplier(traits.impatience)

      // Calculate adjusted escalation times
      const warningTime = BASE_WARNING_MS * impatienceMultiplier
      const textTime = BASE_TEXT_MS * impatienceMultiplier
      const callTime = BASE_CALL_MS * impatienceMultiplier

      // Get personality-based messages
      const impatienceState = getImpatienceState((idleTime / callTime) * 100)
      const messages = IMPATIENCE_STATE_MESSAGES[impatienceState]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]

      // Check if we need to escalate
      if (idleTime >= callTime && currentEscalation < 3) {
        // Level 3: Phone call (urgent)
        const furiousMessages = [
          `"Hey! I've been waiting here forever. What's the plan?"`,
          `"Yo, I'm still here. Are you even paying attention?"`,
          `"Look, I didn't sign up to stand around. Give me something to do!"`,
          `"This is getting ridiculous. I'm calling to find out what's going on."`,
        ]
        get().addNotification({
          type: 'call_incoming',
          priority: 'urgent',
          title: `Incoming Call: ${char.name}`,
          message: furiousMessages[Math.floor(Math.random() * furiousMessages.length)],
          characterId: char.id,
          characterName: char.name,
          location: char.sector ? `Sector ${char.sector}` : undefined,
          timestamp: now,
          escalationLevel: 3,
        })
        set(s => ({
          characters: s.characters.map(c =>
            c.id === char.id ? { ...c, idleEscalationLevel: 3, impatienceState } : c
          )
        }))
      } else if (idleTime >= textTime && currentEscalation < 2) {
        // Level 2: Text message (high priority)
        const textMessages = [
          `"I'm here waiting. Any orders?"`,
          `"Still at location. What's next?"`,
          `"Ready and waiting. What should I do?"`,
          `"Checking in. Need a task."`,
        ]
        get().addNotification({
          type: 'idle_warning',
          priority: 'high',
          title: `Text from ${char.name}`,
          message: textMessages[Math.floor(Math.random() * textMessages.length)],
          characterId: char.id,
          characterName: char.name,
          location: char.sector ? `Sector ${char.sector}` : undefined,
          timestamp: now,
          escalationLevel: 2,
        })
        set(s => ({
          characters: s.characters.map(c =>
            c.id === char.id ? { ...c, idleEscalationLevel: 2, impatienceState } : c
          )
        }))
      } else if (idleTime >= warningTime && currentEscalation < 1) {
        // Level 1: Initial notification (medium priority)
        get().addNotification({
          type: 'idle_warning',
          priority: 'medium',
          title: `${char.name} is waiting`,
          message: `Standing by at location, awaiting orders.`,
          characterId: char.id,
          characterName: char.name,
          location: char.sector ? `Sector ${char.sector}` : undefined,
          timestamp: now,
          escalationLevel: 1,
        })
        set(s => ({
          characters: s.characters.map(c =>
            c.id === char.id ? { ...c, idleEscalationLevel: 1, impatienceState } : c
          )
        }))
      }
    })
  },

  setCharacterStatus: (characterId, status, data) => {
    const now = Date.now()
    set(state => ({
      characters: state.characters.map(char =>
        char.id === characterId
          ? {
              ...char,
              status,
              statusStartTime: now,
              idleEscalationLevel: 0,  // Reset escalation when status changes
              ...data
            }
          : char
      )
    }))
  },

  // =============================================================================
  // INVENTORY SYSTEM
  // =============================================================================

  buyItem: (itemId, itemType, cost) => {
    const state = get()

    if (state.budget < cost) {
      toast.error(`Insufficient funds! Need $${cost.toLocaleString()} but have $${state.budget.toLocaleString()}`)
      return
    }

    // Add to inventory based on type
    const inventoryKey = itemType === 'weapon' ? 'weapons' :
                         itemType === 'armor' ? 'armor' :
                         itemType === 'gadget' ? 'gadgets' : 'consumables'

    set({
      budget: state.budget - cost,
      inventory: {
        ...state.inventory,
        [inventoryKey]: [...state.inventory[inventoryKey], itemId]
      }
    })

    toast.success(`Purchased item for $${cost.toLocaleString()}`)
  },

  sellItem: (itemId, itemType, sellPrice) => {
    const state = get()

    const inventoryKey = itemType === 'weapon' ? 'weapons' :
                         itemType === 'armor' ? 'armor' :
                         itemType === 'gadget' ? 'gadgets' : 'consumables'

    // Check if item is in inventory
    const itemIndex = state.inventory[inventoryKey].indexOf(itemId)
    if (itemIndex === -1) {
      toast.error('Item not found in inventory')
      return
    }

    // Remove from inventory and add money
    const newInventory = [...state.inventory[inventoryKey]]
    newInventory.splice(itemIndex, 1)

    set({
      budget: state.budget + sellPrice,
      inventory: {
        ...state.inventory,
        [inventoryKey]: newInventory
      }
    })

    toast.success(`Sold item for $${sellPrice.toLocaleString()}`)
  },

  addToInventory: (itemId, itemType) => {
    const state = get()

    const inventoryKey = itemType === 'weapon' ? 'weapons' :
                         itemType === 'armor' ? 'armor' :
                         itemType === 'gadget' ? 'gadgets' : 'consumables'

    set({
      inventory: {
        ...state.inventory,
        [inventoryKey]: [...state.inventory[inventoryKey], itemId]
      }
    })
  },

  removeFromInventory: (itemId, itemType) => {
    const state = get()

    const inventoryKey = itemType === 'weapon' ? 'weapons' :
                         itemType === 'armor' ? 'armor' :
                         itemType === 'gadget' ? 'gadgets' : 'consumables'

    const itemIndex = state.inventory[inventoryKey].indexOf(itemId)
    if (itemIndex === -1) return

    const newInventory = [...state.inventory[inventoryKey]]
    newInventory.splice(itemIndex, 1)

    set({
      inventory: {
        ...state.inventory,
        [inventoryKey]: newInventory
      }
    })
  },

  equipWeaponToCharacter: (characterId, weaponId) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)

    if (!character) {
      toast.error('Character not found')
      return
    }

    // Check if weapon is in inventory
    const weaponIndex = state.inventory.weapons.indexOf(weaponId)
    if (weaponIndex === -1) {
      toast.error('Weapon not in inventory')
      return
    }

    // Remove from inventory
    const newWeapons = [...state.inventory.weapons]
    newWeapons.splice(weaponIndex, 1)

    // If character has a weapon equipped, put it back in inventory
    const oldWeapon = character.equipment?.[0]

    set({
      characters: state.characters.map(char =>
        char.id === characterId
          ? { ...char, equipment: [weaponId, ...(char.equipment?.slice(1) || [])] }
          : char
      ),
      inventory: {
        ...state.inventory,
        weapons: oldWeapon ? [...newWeapons, oldWeapon] : newWeapons
      }
    })

    toast.success('Weapon equipped')
  },

  equipArmorToCharacter: (characterId, armorId) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)

    if (!character) {
      toast.error('Character not found')
      return
    }

    // Look up armor in database
    const armorData = getArmorById(armorId)
    if (!armorData) {
      toast.error('Armor not found in database')
      return
    }

    // Check if armor is in inventory
    const armorIndex = state.inventory.armor.indexOf(armorId)
    if (armorIndex === -1) {
      toast.error('Armor not in inventory')
      return
    }

    // Remove from inventory
    const newArmor = [...state.inventory.armor]
    newArmor.splice(armorIndex, 1)

    // If character has armor equipped, put it back in inventory
    const oldArmor = character.equippedArmor

    // Calculate DR from armor (use physical DR as main DR)
    // Add energy DR as separate property if available
    const newDR = armorData.drPhysical || 0
    const stoppingPower = armorData.stoppingPower || 0

    set({
      characters: state.characters.map(char =>
        char.id === characterId
          ? {
              ...char,
              equippedArmor: armorId,
              dr: newDR,
              stoppingPower,  // Wire stopping power from armor
              // Store full armor data for reference
              armorData: {
                drPhysical: armorData.drPhysical,
                drEnergy: armorData.drEnergy,
                drMental: armorData.drMental,
                coverage: armorData.coverage,
                movementPenalty: armorData.movementPenalty,
                stealthPenalty: armorData.stealthPenalty,
              }
            }
          : char
      ),
      inventory: {
        ...state.inventory,
        armor: oldArmor ? [...newArmor, oldArmor] : newArmor
      }
    })

    toast.success(`${armorData.name} equipped (DR: ${newDR}, SP: ${stoppingPower})`)
  },

  unequipFromCharacter: (characterId, slot) => {
    const state = get()
    const character = state.characters.find(c => c.id === characterId)

    if (!character) {
      toast.error('Character not found')
      return
    }

    if (slot === 'weapon') {
      const weapon = character.equipment?.[0]
      if (!weapon) {
        toast.error('No weapon equipped')
        return
      }

      set({
        characters: state.characters.map(char =>
          char.id === characterId
            ? { ...char, equipment: char.equipment?.slice(1) || [] }
            : char
        ),
        inventory: {
          ...state.inventory,
          weapons: [...state.inventory.weapons, weapon]
        }
      })
    } else if (slot === 'armor') {
      const armor = character.equippedArmor
      if (!armor) {
        toast.error('No armor equipped')
        return
      }

      set({
        characters: state.characters.map(char =>
          char.id === characterId
            ? { ...char, equippedArmor: null }
            : char
        ),
        inventory: {
          ...state.inventory,
          armor: [...state.inventory.armor, armor]
        }
      })
    } else if (slot === 'shield') {
      const shield = character.equippedShield
      if (!shield) {
        toast.error('No shield equipped')
        return
      }

      set({
        characters: state.characters.map(char =>
          char.id === characterId
            ? { ...char, equippedShield: null }
            : char
        ),
        inventory: {
          ...state.inventory,
          armor: [...state.inventory.armor, shield]  // Shields go in armor inventory
        }
      })
    }

    toast.success(`${slot} unequipped`)
  },

  // =============================================================================
  // TIME SYSTEM
  // =============================================================================

  togglePause: () => {
    const state = get()
    const newPausedState = !state.isTimePaused
    set({
      isTimePaused: newPausedState,
      // When unpausing, set speed to 1 if it was 0
      timeSpeed: newPausedState ? 0 : (state.timeSpeed === 0 ? 1 : state.timeSpeed) as TimeSpeed,
      lastTimeTick: Date.now(),
    })
  },

  setTimeSpeed: (speed: TimeSpeed) => {
    set({
      timeSpeed: speed,
      isTimePaused: speed === 0,
      lastTimeTick: Date.now(),
    })
  },

  cycleTimeSpeed: () => {
    const state = get()
    // Cycle: 0 (paused) -> 1 -> 2 -> 3 -> 4 -> 1 (skip 0 when cycling)
    const speeds: TimeSpeed[] = [1, 2, 3, 4]
    const currentIndex = speeds.indexOf(state.timeSpeed as TimeSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    const nextSpeed = speeds[nextIndex]

    set({
      timeSpeed: nextSpeed,
      isTimePaused: false,
      lastTimeTick: Date.now(),
    })
  },

  tickTime: () => {
    const state = get()
    if (state.isTimePaused || state.timeSpeed === 0) return

    const config = TIME_SPEEDS[state.timeSpeed]
    const minutesToAdd = config.minutesPerTick

    get().advanceTime(minutesToAdd)

    // Process recovery each tick (reduces recovery time by hours = minutesToAdd / 60)
    const hoursToProcess = minutesToAdd / 60
    const currentRecoveryProcessing = state.characters.filter(
      c => (c.status === 'hospital' || c.status === 'hospitalized') && c.recoveryTime > 0
    )

    if (currentRecoveryProcessing.length > 0) {
      // Process recovery for each hour passed
      for (let i = 0; i < Math.floor(hoursToProcess); i++) {
        get().processRecovery()
      }
    }

    set({ lastTimeTick: Date.now() })
  },

  advanceTime: (minutes: number) => {
    const previousMinutes = get().gameTime.minutes
    const previousHour = Math.floor(previousMinutes / 60)
    const previousDay = get().gameTime.day
    const previousWeek = Math.floor(previousDay / 7)

    set(state => {
      let newMinutes = state.gameTime.minutes + minutes
      let newDay = state.gameTime.day
      let newYear = state.gameTime.year

      // Handle day rollover
      while (newMinutes >= 1440) {  // 24 * 60 = 1440 minutes per day
        newMinutes -= 1440
        newDay += 1
      }

      // Handle year rollover (365 days per year for simplicity)
      while (newDay > 365) {
        newDay -= 365
        newYear += 1
      }

      return {
        gameTime: {
          minutes: newMinutes,
          day: newDay,
          year: newYear,
        },
        day: newDay,  // Keep legacy field in sync
      }
    })

    // Get updated state
    const newState = get()
    const newHour = Math.floor(newState.gameTime.minutes / 60)
    const newDay = newState.gameTime.day
    const newWeek = Math.floor(newDay / 7)

    // ============== EVENTBUS TIME EVENTS ==============

    // Emit hour-passed events for each hour that passed
    if (newHour !== previousHour || newDay !== previousDay) {
      const hoursToEmit = newDay > previousDay
        ? (24 - previousHour) + newHour  // Crossed midnight
        : newHour - previousHour

      for (let i = 0; i < hoursToEmit; i++) {
        const emitHour = (previousHour + i + 1) % 24
        const emitDay = previousHour + i + 1 >= 24 ? newDay : previousDay

        EventBus.emitTimePassed('time:hour-passed', {
          previousTime: {
            hour: previousHour,
            day: previousDay,
            year: newState.gameTime.year
          },
          newTime: {
            hour: emitHour,
            day: emitDay,
            year: newState.gameTime.year
          },
          minutesAdvanced: minutes,
          gameSpeed: newState.timeSpeed,
          isNight: emitHour >= 21 || emitHour < 6
        })
      }
    }

    // Emit day-passed event
    if (newDay > previousDay) {
      const dayOfWeekNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

      EventBus.emitTimePassed('time:day-passed', {
        previousTime: {
          hour: previousHour,
          day: previousDay,
          year: newState.gameTime.year
        },
        newTime: {
          hour: newHour,
          day: newDay,
          year: newState.gameTime.year
        },
        minutesAdvanced: minutes,
        gameSpeed: newState.timeSpeed,
        dayOfWeek: dayOfWeekNames[(newDay - 1) % 7],
        isWeekend: dayOfWeekNames[(newDay - 1) % 7] === 'saturday' || dayOfWeekNames[(newDay - 1) % 7] === 'sunday'
      })

      // Process training progress when day changes
      get().processTrainingProgress()
    }

    // Check if we crossed a week boundary - trigger underworld simulation
    if (newWeek > previousWeek) {
      // Emit week-passed event
      EventBus.emitTimePassed('time:week-passed', {
        previousTime: {
          hour: previousHour,
          day: previousDay,
          year: newState.gameTime.year
        },
        newTime: {
          hour: newHour,
          day: newDay,
          year: newState.gameTime.year
        },
        minutesAdvanced: minutes,
        gameSpeed: newState.timeSpeed,
        weekNumber: newWeek
      })

      // Initialize underworld if not yet done
      if (newState.criminalOrganizations.length === 0) {
        get().initializeUnderworld()
      }
      // Run weekly simulation
      get().runUnderworldSimulation()
    }
  },

  getFormattedTime: () => {
    const state = get()
    const { minutes, day } = state.gameTime

    // Calculate hours and minutes
    const hours24 = Math.floor(minutes / 60)
    const mins = minutes % 60
    const hours12 = hours24 % 12 || 12
    const period = hours24 < 12 ? 'AM' : 'PM'
    const time = `${hours12}:${mins.toString().padStart(2, '0')} ${period}`

    // Day of week (0 = Sunday)
    const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = dayOfWeekNames[(day - 1) % 7]

    // Time of day
    let timeOfDay: 'morning' | 'noon' | 'evening' | 'night'
    if (hours24 >= 5 && hours24 < 12) {
      timeOfDay = 'morning'
    } else if (hours24 >= 12 && hours24 < 17) {
      timeOfDay = 'noon'
    } else if (hours24 >= 17 && hours24 < 21) {
      timeOfDay = 'evening'
    } else {
      timeOfDay = 'night'
    }

    return { time, dayOfWeek, timeOfDay }
  },

  // =============================================================================
  // NEWS SYSTEM
  // =============================================================================

  addNewsArticle: (article) => {
    const state = get()
    set({
      newsArticles: [article, ...state.newsArticles].slice(0, 100)  // Keep last 100 articles
    })
  },

  markArticleRead: (articleId) => {
    const state = get()
    const article = state.newsArticles.find(a => a.id === articleId)
    if (!article || article.isRead) return

    // Mark article as read
    set({
      newsArticles: state.newsArticles.map(a =>
        a.id === articleId ? { ...a, isRead: true } : a
      )
    })

    // Emit event for investigation generation
    const { EventBus } = require('../data/eventBus')
    EventBus.emit({
      id: `news-read-${Date.now()}`,
      type: 'news:article-read',
      category: 'news',
      timestamp: Date.now(),
      location: {
        city: article.location || 'Unknown',
        country: article.country || 'Unknown'
      },
      data: {
        articleId: article.id,
        headline: article.headline,
        category: article.category || 'general',
        hasInvestigationLead: article.hasLead || false,
        investigationType: article.investigationType
      }
    })
  },

  generateMissionNews: (missionResult) => {
    const state = get()
    const {
      success,
      collateralDamage,
      civilianCasualties,
      city,
      country,
      missionType,
      enemyType,
      vigilantismLegal
    } = missionResult

    // Get current fame
    const fame = state.playerFame

    // Convert old format to new MissionCompleteData format
    const missionData = {
      missionId: `mission-${Date.now()}`,
      missionName: missionType || 'Operation',
      outcome: success ? 'success' as const : 'failure' as const,
      visibility: fame >= 300 ? 100 : fame >= 150 ? 75 : fame >= 50 ? 50 : 25,
      location: city || country,
      casualties: civilianCasualties || 0,
      propertyDamage: collateralDamage || 0,
      heroesInvolved: ['Hero'],
      villainsInvolved: enemyType ? [enemyType] : [],
    }

    // Convert gameTime to the format expected by news system
    const gameTimeForNews = {
      day: state.gameTime.day,
      hour: Math.floor(state.gameTime.minutes / 60),
      date: {
        year: state.gameTime.year,
        month: Math.floor(state.gameTime.day / 30) + 1,
        dayOfMonth: (state.gameTime.day % 30) + 1,
        dayOfWeek: (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const)[state.gameTime.day % 7],
      }
    }

    // Generate news article using new system
    const article = genMissionNews(missionData, gameTimeForNews, fame)

    // Calculate fame impact
    let fameImpact = 0
    if (success) {
      fameImpact = 10 + Math.floor(Math.random() * 10)  // +10 to +20
      if (civilianCasualties > 0) fameImpact -= civilianCasualties * 3
      if (collateralDamage > 50000) fameImpact -= 5
    } else {
      fameImpact = -10 - Math.floor(Math.random() * 10)  // -10 to -20
    }

    // Calculate public opinion shift
    let opinionShift = 0
    if (success) {
      opinionShift = vigilantismLegal ? 10 : -5
      if (civilianCasualties > 0) opinionShift -= civilianCasualties * 5
      if (collateralDamage > 100000) opinionShift -= 10
    } else {
      opinionShift = -10
    }

    // Add article to store (both legacy and new systems)
    get().addNewsArticle(article)

    // Update fame
    const newFame = Math.max(0, Math.min(1000, state.playerFame + fameImpact))
    set({ playerFame: newFame })

    // Update public opinion
    get().updatePublicOpinion(country, opinionShift)

    // Show toast notification
    if (Math.abs(fameImpact) >= 15) {
      toast.info(`📰 News: ${article.headline}`)
    }
  },

  updatePublicOpinion: (country, change) => {
    const state = get()
    const currentOpinion = state.publicOpinion[country] || 0
    const newOpinion = Math.max(-100, Math.min(100, currentOpinion + change))

    set({
      publicOpinion: {
        ...state.publicOpinion,
        [country]: newOpinion
      }
    })
  },

  // =============================================================================
  // INVESTIGATION SYSTEM
  // =============================================================================

  discoverInvestigation: (template, city, country, sector) => {
    const state = get()
    const investigation = generateInvestigation(template, city, country, sector)

    set({
      investigationLeads: [...state.investigationLeads, investigation]
    })

    get().addNotification({
      type: 'investigation_discovered',
      priority: investigation.dangerLevel >= 7 ? 'high' : 'medium',
      title: `New Lead Discovered: ${investigation.title}`,
      message: `${investigation.description} (${city}, ${country})`,
      location: `Sector ${sector}`,
      timestamp: Date.now()
    })

    toast.info(`New investigation lead: ${investigation.title}`)
  },

  startInvestigation: (investigationId, characterId) => {
    const state = get()
    const lead = state.investigationLeads.find(inv => inv.id === investigationId)
    const character = state.characters.find(c => c.id === characterId)

    if (!lead || !character) {
      toast.error('Invalid investigation or character')
      return
    }

    if (character.status !== 'ready') {
      toast.error(`${character.name} is not available`)
      return
    }

    // Check education requirements from template
    const template = INVESTIGATION_TEMPLATES.find(t => t.title === lead.title)
    if (template?.requiredEducation && template.requiredEducation.length > 0) {
      // Get character's completed education fields
      const completedEducation = state.trainingEnrollments
        .filter(e => e.characterId === characterId && e.status === 'completed')
        .map(e => e.fieldId.toLowerCase())

      // Check if character has any required education
      const hasRequired = template.requiredEducation.some(req =>
        completedEducation.some(edu => edu.includes(req.toLowerCase()))
      )

      if (!hasRequired) {
        toast.error(`This investigation requires ${template.requiredEducation.join(' or ')} training`)
        return
      }
    }

    // Move from leads to active
    const updatedInvestigation: Investigation = {
      ...lead,
      status: 'active',
      assignedCharacters: [characterId]
    }

    set({
      investigationLeads: state.investigationLeads.filter(inv => inv.id !== investigationId),
      activeInvestigations: [...state.activeInvestigations, updatedInvestigation],
      characters: state.characters.map(char =>
        char.id === characterId
          ? { ...char, status: 'investigating', statusStartTime: Date.now(), idleEscalationLevel: 0 }
          : char
      )
    })

    // Emit investigation started event
    EventBus.emit({
      id: `investigation-${investigationId}`,
      type: 'player:investigation-started',
      category: 'player',
      timestamp: Date.now(),
      data: {
        investigationId,
        investigationTitle: lead.title,
        characterId,
        characterName: character.name,
        location: { city: lead.city, country: lead.country, sector: lead.sector }
      }
    })

    toast.success(`${character.name} begins investigating: ${lead.title}`)
  },

  advanceInvestigationProgress: (investigationId, characterId, approach) => {
    const state = get()
    const investigation = state.activeInvestigations.find(inv => inv.id === investigationId)
    const character = state.characters.find(c => c.id === characterId)

    if (!investigation || !character) {
      toast.error('Investigation or character not found')
      return
    }

    // Perform the investigation action
    const result = advanceInvestigation(investigation, character, approach)

    // Apply education bonuses to progress gained
    const template = INVESTIGATION_TEMPLATES.find(t => t.title === investigation.title)
    if (template?.educationBonuses) {
      // Get character's completed education fields
      const completedEducation = state.trainingEnrollments
        .filter(e => e.characterId === characterId && e.status === 'completed')
        .map(e => e.fieldId.toLowerCase())

      // Find matching education bonus for this approach
      for (const [eduField, bonus] of Object.entries(template.educationBonuses)) {
        if (bonus.approach === approach) {
          // Check if character has this education
          if (completedEducation.some(edu => edu.includes(eduField.toLowerCase()))) {
            // Apply bonus to progress (e.g., +25% means multiply by 1.25)
            result.progressGained = Math.round(result.progressGained * (1 + bonus.bonus / 100))
            break  // Apply only one bonus per action
          }
        }
      }
    }

    // Create decision log entry
    const decision: any = {
      id: `decision-${Date.now()}`,
      timestamp: Date.now(),
      phase: investigation.currentPhase,
      chosenApproach: approach,
      characterId,
      skillRoll: {
        skill: 'Investigation',
        characterValue: character.stats.INT || 50,
        difficulty: investigation.difficulty * 10,
        roll: Math.floor(Math.random() * 100),
        success: result.success
      },
      outcome: result.message,
      consequenceType: result.consequenceType
    }

    // Update investigation
    const updatedInvestigation: Investigation = {
      ...investigation,
      progress: Math.min(100, investigation.progress + result.progressGained),
      cluesGathered: [...investigation.cluesGathered, ...result.cluesFound],
      decisionsLog: [...investigation.decisionsLog, decision],
      suspicionLevel: Math.min(100, investigation.suspicionLevel + result.suspicionChange),
      publicExposure: Math.min(100, investigation.publicExposure + result.exposureChange),
      currentPhase: result.nextPhase || investigation.currentPhase,
      lastActionResult: result
    }

    // Check if investigation complete
    if (updatedInvestigation.currentPhase === 'resolution' && updatedInvestigation.progress >= 100) {
      get().completeInvestigation(investigationId)
      return
    }

    // Check if too much suspicion = failure
    if (updatedInvestigation.suspicionLevel >= 80) {
      get().failInvestigation(investigationId)
      return
    }

    set({
      activeInvestigations: state.activeInvestigations.map(inv =>
        inv.id === investigationId ? updatedInvestigation : inv
      )
    })

    // Show result toast
    if (result.consequenceType === 'critical') {
      toast.success(result.message)
    } else if (result.consequenceType === 'setback') {
      toast.error(result.message)
    } else {
      toast.info(result.message)
    }
  },

  completeInvestigation: (investigationId) => {
    const state = get()
    const investigation = state.activeInvestigations.find(inv => inv.id === investigationId)

    if (!investigation) return

    // Grant rewards
    const reward = investigation.potentialReward
    set({
      budget: state.budget + reward.cash,
      playerFame: state.playerFame + reward.fame,
      activeInvestigations: state.activeInvestigations.filter(inv => inv.id !== investigationId),
      characters: state.characters.map(char =>
        investigation.assignedCharacters.includes(char.id)
          ? { ...char, status: 'ready', statusStartTime: Date.now(), fame: (char.fame || 0) + Math.floor(reward.fame / investigation.assignedCharacters.length) }
          : char
      )
    })

    // WIRE: Generate mission if investigation unlocks one
    if (reward.missionUnlocked) {
      const template = MISSION_TEMPLATES.find(t => t.id === reward.missionUnlocked)
      if (template) {
        const newMission = generateMission(
          template,
          investigation.sector,
          investigation.city,
          Math.floor(investigation.difficulty / 3)  // Scale difficulty from 1-10 to modifier
        )
        // Add to available missions for this sector
        const currentState = get()
        const sectorMissions = currentState.availableMissions.get(investigation.sector) || []
        const updatedMissions = new Map(currentState.availableMissions)
        updatedMissions.set(investigation.sector, [...sectorMissions, newMission])
        set({ availableMissions: updatedMissions })
        console.log(`[Investigation] Generated mission "${template.name}" in sector ${investigation.sector}`)
      }
    }

    get().addNotification({
      type: 'mission_complete',
      priority: 'high',
      title: `Investigation Complete: ${investigation.title}`,
      message: `Earned $${reward.cash.toLocaleString()} and +${reward.fame} fame. ${reward.missionUnlocked ? 'New mission unlocked!' : ''}`,
      location: `${investigation.city}, ${investigation.country}`,
      timestamp: Date.now()
    })

    toast.success(`Investigation complete! +$${reward.cash.toLocaleString()}, +${reward.fame} fame`)

    // Generate news article if public
    if (investigation.publicExposure > 50) {
      get().generateMissionNews({
        success: true,
        collateralDamage: 0,
        civilianCasualties: 0,
        city: investigation.city,
        country: investigation.country,
        missionType: investigation.type,
        enemyType: investigation.type,
        vigilantismLegal: true
      })
    }
  },

  failInvestigation: (investigationId) => {
    const state = get()
    const investigation = state.activeInvestigations.find(inv => inv.id === investigationId)

    if (!investigation) return

    set({
      activeInvestigations: state.activeInvestigations.filter(inv => inv.id !== investigationId),
      characters: state.characters.map(char =>
        investigation.assignedCharacters.includes(char.id)
          ? { ...char, status: 'ready', statusStartTime: Date.now() }
          : char
      )
    })

    get().addNotification({
      type: 'mission_failed',
      priority: 'medium',
      title: `Investigation Failed: ${investigation.title}`,
      message: `The suspects were alerted and the trail went cold.`,
      location: `${investigation.city}, ${investigation.country}`,
      timestamp: Date.now()
    })

    toast.error(`Investigation failed: ${investigation.title}`)
  },

  expireInvestigation: (investigationId) => {
    const state = get()
    const investigation = [...state.investigationLeads, ...state.activeInvestigations].find(inv => inv.id === investigationId)

    if (!investigation) return

    set({
      investigationLeads: state.investigationLeads.filter(inv => inv.id !== investigationId),
      activeInvestigations: state.activeInvestigations.filter(inv => inv.id !== investigationId),
      characters: state.characters.map(char =>
        investigation.assignedCharacters.includes(char.id)
          ? { ...char, status: 'ready', statusStartTime: Date.now() }
          : char
      )
    })

    toast.warning(`Investigation expired: ${investigation.title}`)
  },

  getAvailableInvestigations: () => {
    return get().investigationLeads.filter(inv => inv.status === 'discovered')
  },

  getActiveInvestigations: () => {
    return get().activeInvestigations.filter(inv => inv.status === 'active')
  },

  // =====================================================================
  // TERRITORY & MILITIA ACTIONS
  // =====================================================================

  recruitMilitia: (sectorId, size, equipment) => {
    const state = get()

    // Cost based on size and equipment
    const baseCost = size * 100
    const equipmentMultiplier = equipment === 'heavy' ? 3 : equipment === 'medium' ? 2 : 1
    const totalCost = baseCost * equipmentMultiplier

    if (state.budget < totalCost) {
      toast.error(`Insufficient funds. Need $${totalCost.toLocaleString()}`)
      return null
    }

    // Check if player controls this sector
    const control = getSectorControl(sectorId)
    if (!control || control.controllingFaction !== 'player') {
      toast.error('You can only recruit militia in sectors you control')
      return null
    }

    // Create militia unit
    const militia = createMilitia(sectorId, 'player', size, equipment)
    set({ budget: state.budget - totalCost })

    toast.success(`Recruited ${size} militia in sector ${sectorId}`)
    console.log(`[Militia] Created ${equipment} militia (${size} fighters) in ${sectorId}`)
    return militia
  },

  trainSectorMilitia: (sectorId, trainingDays) => {
    const state = get()
    const trainingCost = trainingDays * 500 // $500 per day of training

    if (state.budget < trainingCost) {
      toast.error(`Insufficient funds. Need $${trainingCost.toLocaleString()}`)
      return
    }

    // Get all player militia in sector
    const militia = getSectorMilitia(sectorId).filter(m => m.faction === 'player')
    if (militia.length === 0) {
      toast.error('No militia in this sector to train')
      return
    }

    // Train each militia unit
    for (const unit of militia) {
      trainMilitia(unit.id, trainingDays)
    }

    set({ budget: state.budget - trainingCost })
    toast.success(`Trained ${militia.length} militia units for ${trainingDays} days`)
    console.log(`[Militia] Trained ${militia.length} units in ${sectorId}`)
  },

  getSectorMilitiaList: (sectorId) => {
    return getSectorMilitia(sectorId)
  },

  getPlayerMilitia: () => {
    return getFactionMilitia('player')
  },

  getSectorControlStatus: (sectorId) => {
    return getSectorControl(sectorId)
  },

  // =====================================================================
  // MISSION SYSTEM ACTIONS
  // =====================================================================
  ...createMissionActions(set, get),

  // =====================================================================
  // UNDERWORLD SYSTEM ACTIONS
  // =====================================================================

  initializeUnderworld: () => {
    const state = get()
    const countryCode = state.selectedCountry

    // Get country data
    const country = getCountryByCode(countryCode)
    if (!country) {
      console.warn(`[Underworld] Country not found: ${countryCode}`)
      return
    }

    // Get all cities in the player's country
    const cities = getCitiesByCountry(country.name)
    if (cities.length === 0) {
      console.warn(`[Underworld] No cities found for: ${country.name}`)
      return
    }

    // Generate initial criminal organizations (1-3 per major city)
    const organizations: CriminalOrganization[] = []
    const majorCities = cities.slice(0, Math.min(10, cities.length)) // Top 10 cities

    for (let i = 0; i < majorCities.length; i++) {
      const city = majorCities[i]
      const orgCount = 1 + Math.floor(Math.random() * 2) // 1-2 orgs per city

      for (let j = 0; j < orgCount; j++) {
        const orgTypes = ['street_gang', 'syndicate', 'cartel'] as const
        const orgType = orgTypes[Math.min(Math.floor(city.crimeIndex / 30), 2)]

        // Get available crime specialties based on city type
        const cityTypes = [
          (city as any).cityType1,
          (city as any).cityType2,
          (city as any).cityType3,
          (city as any).cityType4,
        ].filter(t => t && t.length > 0)

        const specialties: string[] = []
        for (const cityType of cityTypes) {
          const typeSpecialties = CITY_CRIME_MAP[cityType]
          if (typeSpecialties) {
            specialties.push(...typeSpecialties)
          }
        }
        const uniqueSpecialties = [...new Set(specialties)].slice(0, 3) as any[]
        if (uniqueSpecialties.length === 0) {
          uniqueSpecialties.push('theft', 'extortion')
        }

        const org = createOrganization(
          `The ${city.name} ${['Syndicate', 'Cartel', 'Crew', 'Gang', 'Family'][j % 5]}`,
          orgType,
          city.name,
          country.code,
          {
            id: `leader_${city.name}_${j}`,
            name: `Boss ${city.name.substring(0, 3)}`,
            motivation: getMotivationFromHarmAvoidance(3 + Math.floor(Math.random() * 7)),
            calling: NEUTRAL_CALLINGS[Math.floor(Math.random() * NEUTRAL_CALLINGS.length)],
            imprisoned: false,
            loyalty: 50 + Math.floor(Math.random() * 40),
            competence: 40 + Math.floor(Math.random() * 40),
          },
          uniqueSpecialties,
          state.gameTime.day
        )

        // Set initial state based on city crime level
        org.state = 'operating'
        org.personnel = 15 + Math.floor(Math.random() * 30)
        org.capital = 20 + Math.floor(Math.random() * 50)
        org.heat = Math.floor(city.crimeIndex * 0.3 + Math.random() * 20)
        org.reputation = 20 + Math.floor(Math.random() * 40)

        organizations.push(org)
      }
    }

    console.log(`[Underworld] Initialized ${organizations.length} criminal organizations in ${country.name}`)

    set({
      criminalOrganizations: organizations,
      underworldEvents: [],
      lastUnderworldWeek: Math.floor(state.gameTime.day / 7),
      underworldStats: {
        totalArrests: 0,
        totalProfit: 0,
        totalEvents: 0,
      },
    })
  },

  runUnderworldSimulation: () => {
    const state = get()
    const currentWeek = Math.floor(state.gameTime.day / 7)

    // Only simulate once per week
    if (currentWeek <= state.lastUnderworldWeek) {
      return null
    }

    // Get country data
    const country = getCountryByCode(state.selectedCountry)
    if (!country) {
      return null
    }

    const cities = getCitiesByCountry(country.name)
    if (cities.length === 0 || state.criminalOrganizations.length === 0) {
      return null
    }

    // Run the simulation
    const result = simulateWeek(
      state.criminalOrganizations,
      country,
      cities,
      currentWeek
    )

    // Generate news from events
    const newsArticles = generateWeeklyNews(result.events, country, state.gameTime.day)

    // Add news articles to the existing news system
    for (const article of newsArticles) {
      get().addNewsArticle(article)
    }

    // Update state
    set((prev) => ({
      criminalOrganizations: [...prev.criminalOrganizations], // Updated in place by simulation
      underworldEvents: [...prev.underworldEvents, ...result.events].slice(-200),
      lastUnderworldWeek: currentWeek,
      underworldStats: {
        totalArrests: prev.underworldStats.totalArrests + result.arrestsMade,
        totalProfit: prev.underworldStats.totalProfit + result.profitGenerated,
        totalEvents: prev.underworldStats.totalEvents + result.events.length,
      },
    }))

    // Toast notification for major events
    const majorEvents = result.events.filter(e => e.newsworthy)
    if (majorEvents.length > 0) {
      toast(`🌃 Underworld: ${majorEvents.length} criminal events this week`, { icon: '🔪' })
    }

    console.log(`[Underworld] Week ${currentWeek}: ${result.activitiesExecuted} activities, ${result.arrestsMade} arrests, $${result.profitGenerated}k profit`)

    return result
  },

  getCriminalOrganizations: () => {
    return get().criminalOrganizations
  },

  getUnderworldEvents: () => {
    return get().underworldEvents
  },

  getOrganizationsByCity: (cityName: string) => {
    return get().criminalOrganizations.filter(org => org.headquarters === cityName)
  },

  // =====================================================================
  // DOOM CLOCK ACTIONS (XCOM 2 Avatar Project-style urgency)
  // =====================================================================

  advanceDoomClock: (shadowNetworkCount?: number, playerMissions?: number) => {
    const state = get()

    // Count shadow networks from criminal organizations
    const networks = shadowNetworkCount ??
      state.criminalOrganizations.filter(org => org.type === 'shadow_network').length

    // Calculate weekly progress
    const { newProgress, eventsTriggered } = calculateWeeklyProgress(
      state.doomClock,
      networks,
      playerMissions ?? 0
    )

    // Update state with new progress
    const newDoomClock = {
      ...state.doomClock,
      progress: newProgress,
      thresholdsPassed: {
        intel: newProgress >= 25 || state.doomClock.thresholdsPassed.intel,
        alliance: newProgress >= 50 || state.doomClock.thresholdsPassed.alliance,
        crisis: newProgress >= 75 || state.doomClock.thresholdsPassed.crisis,
        endgame: newProgress >= 100 || state.doomClock.thresholdsPassed.endgame,
      },
    }

    set({ doomClock: newDoomClock })

    // Generate news for threshold events
    for (const event of eventsTriggered) {
      const news = generateDoomClockNews(newDoomClock, event)
      toast(`🚨 ${event.name}: ${event.description}`, {
        icon: '⚠️',
        duration: 8000,
      })
      console.log(`[DOOM CLOCK] Threshold crossed: ${event.name} (${event.threshold}%)`)
    }

    // Log progress
    if (newProgress !== state.doomClock.progress) {
      console.log(`[DOOM CLOCK] Progress: ${state.doomClock.progress.toFixed(1)}% -> ${newProgress.toFixed(1)}%`)
    }

    return eventsTriggered
  },

  applyDoomClockSetback: (amount?: number) => {
    const state = get()
    const currentWeek = Math.floor(state.gameTime.day / 7)

    const newDoomClock = applySetback(state.doomClock, amount, currentWeek)
    set({ doomClock: newDoomClock })

    toast.success(`The Plan delayed! Progress reduced by ${amount ?? 5}%`, {
      icon: '🎯',
      duration: 5000,
    })

    console.log(`[DOOM CLOCK] Setback applied: ${state.doomClock.progress.toFixed(1)}% -> ${newDoomClock.progress.toFixed(1)}%`)
  },

  revealDoomClockMastermind: () => {
    const state = get()
    const newDoomClock = revealMastermind(state.doomClock)
    set({ doomClock: newDoomClock })

    toast(`🎭 Mastermind identified: ${newDoomClock.mastermind.name} (${newDoomClock.mastermind.alias})`, {
      icon: '🔍',
      duration: 8000,
    })

    console.log(`[DOOM CLOCK] Mastermind revealed: ${newDoomClock.mastermind.name}`)
  },

  getDoomClockThreat: () => {
    return getThreatLevel(get().doomClock.progress)
  },

  // =====================================================================
  // NEW WORLD SYSTEMS ACTIONS
  // =====================================================================

  // Economy System Actions
  recordTransaction: (type, category, amount, description) => {
    const state = get()
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      timestamp: state.gameTime.day,
      type,
      category,
      amount,
      description,
    }
    set({
      economy: processTransaction(state.economy, transaction),
      budget: type === 'income' || type === 'sale'
        ? state.budget + amount
        : state.budget - amount,
    })
  },

  processWeeklyPayday: () => {
    const state = get()
    // Get team jobs (placeholder - would come from character data)
    const teamJobs = state.characters
      .filter(c => c.dayJob)
      .map(c => c.dayJob)

    const newEconomy = processPayday(state.economy, teamJobs || [], state.gameTime.day)
    const netChange = newEconomy.weeklyIncome - newEconomy.weeklyExpenses

    set({
      economy: newEconomy,
      budget: state.budget + netChange,
    })

    if (netChange >= 0) {
      toast.success(`Payday! +$${netChange.toLocaleString()}`)
    } else {
      toast.error(`Expenses exceeded income: -$${Math.abs(netChange).toLocaleString()}`)
    }

    get().addNotification({
      type: 'status_change',
      priority: netChange >= 0 ? 'medium' : 'high',
      title: 'Weekly Financial Report',
      message: `Income: $${newEconomy.weeklyIncome.toLocaleString()} | Expenses: $${newEconomy.weeklyExpenses.toLocaleString()} | Net: ${netChange >= 0 ? '+' : ''}$${netChange.toLocaleString()}`,
      timestamp: state.gameTime.day * 1440 + state.gameTime.minutes,
    })
  },

  getEconomyStats: () => {
    const state = get()
    return {
      netWorth: calculateNetWorth(state.economy),
      weeklyIncome: state.economy.weeklyIncome,
      weeklyExpenses: state.economy.weeklyExpenses,
    }
  },

  // Reputation System Actions
  adjustReputationAxis: (axis, delta, reason) => {
    const state = get()
    const newReputation = adjustReputation(state.reputation, axis, delta, reason, state.gameTime.day)

    set({ reputation: newReputation })

    // Check for tier change notifications
    const oldTier = getReputationTier(state.reputation[axis])
    const newTier = getReputationTier(newReputation[axis])

    if (oldTier !== newTier) {
      get().addNotification({
        type: 'status_change',
        priority: 'high',
        title: `Reputation ${delta > 0 ? 'Increased' : 'Decreased'}`,
        message: `Your ${axis} reputation is now: ${newTier} (${newReputation[axis] > 0 ? '+' : ''}${newReputation[axis]})`,
        timestamp: state.gameTime.day * 1440 + state.gameTime.minutes,
      })
    }
  },

  getReputationEffects: () => {
    const state = get()
    return getActiveEffects(state.reputation)
  },

  processReputationDecay: () => {
    const state = get()
    set({
      reputation: applyReputationDecay(state.reputation),
    })
  },

  // Base Building Actions
  purchaseBase: (type, name, sectorCode, countryCode) => {
    const state = get()
    const { BASE_TYPES } = require('../data/baseSystem')
    const config = BASE_TYPES[type]

    if (!canAfford(state.economy, config.purchaseCost)) {
      toast.error(`Cannot afford base! Need $${config.purchaseCost.toLocaleString()}`)
      return
    }

    if (state.baseState.bases.length >= state.baseState.maxBases) {
      toast.error(`Maximum bases reached (${state.baseState.maxBases})`)
      return
    }

    const newBase = createBase(type, name, sectorCode, countryCode)

    set({
      baseState: addBaseToState(state.baseState, newBase),
      budget: state.budget - config.purchaseCost,
      economy: processTransaction(state.economy, {
        id: `tx_${Date.now()}`,
        timestamp: state.gameTime.day,
        type: 'purchase',
        category: 'other',
        amount: config.purchaseCost,
        description: `Purchased ${name} (${config.name})`,
      }),
    })

    toast.success(`${name} established in sector ${sectorCode}!`)

    get().addNotification({
      type: 'status_change',
      priority: 'high',
      title: 'New Base Established',
      message: `${name} is now operational in sector ${sectorCode}. ${config.totalSlots} facility slots available.`,
      location: `Sector ${sectorCode}`,
      timestamp: state.gameTime.day * 1440 + state.gameTime.minutes,
    })
  },

  buildFacility: (facilityType, gridX, gridY) => {
    const state = get()
    const activeBase = getActiveBase(state.baseState)

    if (!activeBase) {
      toast.error('No active base selected')
      return
    }

    const { FACILITIES, createFacility, hasRequiredFacilities, isPositionAvailable } = require('../data/baseSystem')
    const config = FACILITIES[facilityType]

    if (!isPositionAvailable(activeBase, gridX, gridY)) {
      toast.error('Position not available')
      return
    }

    if (!hasRequiredFacilities(activeBase, facilityType)) {
      toast.error(`Missing required facilities: ${config.requiredFacilities?.join(', ')}`)
      return
    }

    const cost = config.buildCost[0] // Level 1 cost
    if (!canAfford(state.economy, cost)) {
      toast.error(`Cannot afford! Need $${cost.toLocaleString()}`)
      return
    }

    // Start construction
    const newBaseState = startConstruction(
      state.baseState,
      activeBase.id,
      facilityType,
      1, // Level 1
      gridX,
      gridY,
      state.gameTime.day
    )

    set({
      baseState: newBaseState,
      budget: state.budget - cost,
    })

    toast.success(`Construction started: ${config.name}`)
  },

  upgradeFacilityAt: (gridX, gridY) => {
    const state = get()
    const activeBase = getActiveBase(state.baseState)

    if (!activeBase) {
      toast.error('No active base selected')
      return
    }

    const updatedBase = upgradeFacility(activeBase, gridX, gridY)
    if (updatedBase === activeBase) {
      toast.error('Cannot upgrade facility')
      return
    }

    set({
      baseState: updateBase(state.baseState, updatedBase),
    })

    toast.success('Facility upgraded!')
  },

  removeFacilityAt: (gridX, gridY) => {
    const state = get()
    const activeBase = getActiveBase(state.baseState)

    if (!activeBase) {
      toast.error('No active base selected')
      return
    }

    const updatedBase = removeFacility(activeBase, gridX, gridY)

    set({
      baseState: updateBase(state.baseState, updatedBase),
    })

    toast.info('Facility removed')
  },

  processConstruction: (hours) => {
    const state = get()
    const result = progressConstruction(state.baseState, hours)

    set({ baseState: result.state })

    result.completedProjects.forEach(project => {
      toast.success(`Construction complete: ${project.facilityType}`)

      get().addNotification({
        type: 'status_change',
        priority: 'medium',
        title: 'Construction Complete',
        message: `${project.facilityType} is now operational.`,
        timestamp: state.gameTime.day * 1440 + state.gameTime.minutes,
      })
    })
  },

  getBaseBonuses: () => {
    const state = get()
    const activeBase = getActiveBase(state.baseState)

    if (!activeBase) {
      return { education: 0, healing: 0, investigation: 0 }
    }

    return {
      education: getEducationBonus(activeBase, 'general'),
      healing: getHealingBonus(activeBase),
      investigation: getInvestigationBonus(activeBase),
    }
  },

  // =============================================================================
  // FACTION RELATIONS ACTIONS
  // =============================================================================

  initFactionStandings: () => {
    const state = get()
    const { ALL_COUNTRIES } = require('../data/countries')
    const homeCountry = state.selectedCountry || 'US'

    const standings = initializeFactionStandings(ALL_COUNTRIES, homeCountry)
    set({ factionStandings: standings })

    console.log(`[FACTIONS] Initialized ${standings.length} faction standings for ${ALL_COUNTRIES.length} countries`)
  },

  modifyFactionStanding: (factionType, countryCode, change, reason) => {
    const state = get()
    const factionId = `${factionType}_${countryCode.toLowerCase()}`

    const standing = state.factionStandings.find(s => s.factionId === factionId)
    if (!standing) {
      console.warn(`[FACTIONS] Faction not found: ${factionId}`)
      return
    }

    const timestamp = state.gameTime.day * 1440 + state.gameTime.minutes
    const updatedStanding = modifyStanding(standing, change, reason, timestamp)

    // Check for bounty updates
    const newBounty = checkBountyStatus(updatedStanding, timestamp)
    updatedStanding.activeBounty = newBounty

    // Apply related faction effects
    const relatedEffects = getRelatedFactionEffects(factionType, change)
    const updatedStandings = state.factionStandings.map(s => {
      if (s.factionId === factionId) return updatedStanding
      const related = relatedEffects.find(e =>
        e.factionType === s.factionType && s.countryCode === countryCode
      )
      if (related) {
        return modifyStanding(s, related.change, `Related: ${reason}`, timestamp)
      }
      return s
    })

    set({ factionStandings: updatedStandings })

    // Show toast for significant changes
    if (Math.abs(change) >= 10) {
      const icon = change > 0 ? '📈' : '📉'
      toast.success(`${icon} ${FACTION_NAMES[factionType]} (${countryCode}): ${change > 0 ? '+' : ''}${change}`)
    }

    console.log(`[FACTIONS] ${factionType} in ${countryCode}: ${change > 0 ? '+' : ''}${change} (${reason})`)
  },

  getFactionStanding: (factionType, countryCode) => {
    const state = get()
    const factionId = `${factionType}_${countryCode.toLowerCase()}`
    return state.factionStandings.find(s => s.factionId === factionId)
  },

  getCountryReputation: (countryCode) => {
    const state = get()
    const { getCountryByCode } = require('../data/countries')
    const country = getCountryByCode(countryCode)
    if (!country) return null

    return getCountryReputation(countryCode, country.name, state.factionStandings)
  },

  applyFactionDecay: () => {
    const state = get()
    const updatedStandings = state.factionStandings.map(standing => {
      const decay = getStandingDecay(standing.standing, 1)
      if (decay !== 0) {
        return modifyStanding(
          standing,
          decay,
          'Natural decay',
          state.gameTime.day * 1440 + state.gameTime.minutes
        )
      }
      return standing
    })

    set({ factionStandings: updatedStandings })
  },

  // =============================================================================
  // SQUAD MANAGEMENT ACTIONS
  // =============================================================================

  initializeSquads: () => {
    const state = get()
    if (state.squads.length > 0) return  // Already initialized

    // Create default squad from all characters
    const characters = state.characters
    if (characters.length === 0) return

    // Convert characters to SquadMembers
    const members: SquadMember[] = characters.map((c: any, index: number) => ({
      characterId: c.id,
      name: c.name,
      personality: (c.personality?.mbti || 'ISTJ') as PersonalityType,
      role: index === 0 ? 'leader' : 'member' as const,
      health: c.health?.current ? Math.round((c.health.current / c.health.maximum) * 100) : 100,
      morale: 75,  // Default morale
      stamina: 100,
      pilotingGround: c.stats?.AGL ? Math.round(c.stats.AGL * 0.8) : 40,
      pilotingAir: c.stats?.AGL ? Math.round(c.stats.AGL * 0.5) : 20,
      pilotingWater: c.stats?.AGL ? Math.round(c.stats.AGL * 0.6) : 30,
      survival: c.stats?.INS ? Math.round(c.stats.INS * 0.7) : 35,
      stealth: c.stats?.AGL ? Math.round(c.stats.AGL * 0.7) : 35,
      travelModifiers: [],
    }))

    const initialSquad = createSquad(
      'squad-alpha',
      'Alpha Squad',
      members,
      state.currentSector || 'K3'
    )

    set({ squads: [initialSquad] })
    console.log('[SQUADS] Initialized Alpha Squad with', members.length, 'members')
  },

  createNewSquad: (name, characterIds) => {
    const state = get()

    // Verify characters exist and aren't already in a squad
    const availableChars = characterIds.filter(id => {
      const char = state.characters.find((c: any) => c.id === id)
      const inSquad = state.squads.some(s => s.members.some(m => m.characterId === id))
      return char && !inSquad
    })

    if (availableChars.length === 0) {
      toast.error('No available characters for new squad')
      return null
    }

    const members: SquadMember[] = availableChars.map((id, index) => {
      const c = state.characters.find((char: any) => char.id === id)!
      return {
        characterId: c.id,
        name: c.name,
        personality: (c.personality?.mbti || 'ISTJ') as PersonalityType,
        role: index === 0 ? 'leader' : 'member' as const,
        health: c.health?.current ? Math.round((c.health.current / c.health.maximum) * 100) : 100,
        morale: 75,
        stamina: 100,
        pilotingGround: c.stats?.AGL ? Math.round(c.stats.AGL * 0.8) : 40,
        pilotingAir: c.stats?.AGL ? Math.round(c.stats.AGL * 0.5) : 20,
        pilotingWater: c.stats?.AGL ? Math.round(c.stats.AGL * 0.6) : 30,
        survival: c.stats?.INS ? Math.round(c.stats.INS * 0.7) : 35,
        stealth: c.stats?.AGL ? Math.round(c.stats.AGL * 0.7) : 35,
        travelModifiers: [],
      }
    })

    const newSquad = createSquad(
      `squad-${Date.now()}`,
      name,
      members,
      state.currentSector || 'K3'
    )

    set({ squads: [...state.squads, newSquad] })
    toast.success(`Created ${name} with ${members.length} members`)
    return newSquad
  },

  disbandSquad: (squadId) => {
    const state = get()
    const squad = state.squads.find(s => s.id === squadId)
    if (!squad) return false

    set({ squads: state.squads.filter(s => s.id !== squadId) })
    toast.info(`${squad.name} disbanded`)
    return true
  },

  assignToSquad: (characterId, squadId) => {
    const state = get()
    const squad = state.squads.find(s => s.id === squadId)
    const character = state.characters.find((c: any) => c.id === characterId)

    if (!squad || !character) return false

    // Check if already in a squad
    const currentSquad = state.squads.find(s => s.members.some(m => m.characterId === characterId))
    if (currentSquad) {
      toast.error(`${character.name} is already in ${currentSquad.name}`)
      return false
    }

    const newMember: SquadMember = {
      characterId: character.id,
      name: character.name,
      personality: (character.personality?.mbti || 'ISTJ') as PersonalityType,
      role: 'member',
      health: character.health?.current ? Math.round((character.health.current / character.health.maximum) * 100) : 100,
      morale: 75,
      stamina: 100,
      pilotingGround: character.stats?.AGL ? Math.round(character.stats.AGL * 0.8) : 40,
      pilotingAir: character.stats?.AGL ? Math.round(character.stats.AGL * 0.5) : 20,
      pilotingWater: character.stats?.AGL ? Math.round(character.stats.AGL * 0.6) : 30,
      survival: character.stats?.INS ? Math.round(character.stats.INS * 0.7) : 35,
      stealth: character.stats?.AGL ? Math.round(character.stats.AGL * 0.7) : 35,
      travelModifiers: [],
    }

    const success = addMemberToSquad(squad, newMember)
    if (success) {
      set({ squads: [...state.squads] })  // Trigger re-render
      toast.success(`${character.name} joined ${squad.name}`)
    }
    return success
  },

  removeFromSquad: (characterId, squadId) => {
    const state = get()
    const squad = state.squads.find(s => s.id === squadId)
    if (!squad) return false

    const success = removeMemberFromSquad(squad, characterId)
    if (success) {
      // If squad is empty, disband it
      if (squad.members.length === 0) {
        set({ squads: state.squads.filter(s => s.id !== squadId) })
        toast.info(`${squad.name} disbanded (no members)`)
      } else {
        set({ squads: [...state.squads] })
      }
    }
    return success
  },

  setActiveSquad: (squadId) => {
    const state = get()
    const squad = state.squads.find(s => s.id === squadId)
    if (squad) {
      // Update currentSector to match squad's position
      set({ currentSector: squad.currentSector })
      toast.info(`Active squad: ${squad.name}`)
    }
  },

  getSquadById: (squadId) => {
    return get().squads.find(s => s.id === squadId)
  },

  getSquadForCharacter: (characterId) => {
    return get().squads.find(s => s.members.some(m => m.characterId === characterId))
  },

  assignVehicle: (squadId, vehicleId) => {
    const state = get()
    const squad = state.squads.find(s => s.id === squadId)
    if (!squad) return { success: false, reason: 'Squad not found' }

    const result = assignVehicleToSquad(squad, vehicleId)
    if (result.success) {
      set({ squads: [...state.squads] })
      toast.success(`Vehicle assigned to ${squad.name}`)
    } else {
      toast.error(result.reason || 'Failed to assign vehicle')
    }
    return result
  },

  deploySquad: (squadId, sector) => {
    const state = get()
    const squadIndex = state.squads.findIndex(s => s.id === squadId)
    if (squadIndex === -1) return

    const updatedSquads = [...state.squads]
    updatedSquads[squadIndex] = {
      ...updatedSquads[squadIndex],
      status: 'traveling' as SquadStatus,
      destinationSector: sector,
      travelProgress: 0,
    }

    set({ squads: updatedSquads })
    toast.success(`${updatedSquads[squadIndex].name} deploying to sector ${sector}`)
  },

  // =============================================================================
  // CHARACTER LIFE CYCLE ACTIONS
  // =============================================================================

  processCharacterIdleDay: (characterId: string) => {
    const state = get()
    const character = state.characters.find((c: any) => c.id === characterId)

    if (!character) {
      console.warn(`Character ${characterId} not found`)
      return null
    }

    // Skip if character is on mission or in combat
    if (character.status === 'on_mission' || character.status === 'in_combat') {
      return null
    }

    // Get personality traits
    const personality = character.personality || {
      impatience: 5, initiative: 5, volatility: 5, discipline: 5,
      sociability: 5, riskTolerance: 5, harmAvoidance: 5
    }

    // Get current city info (use selected city or character's location)
    const cityId = character.currentCity || state.selectedCity
    const cityName = cityId

    // For now, use a default city type - later this would come from city data
    const cityTypes: CityType[] = ['Political'] // Washington DC default

    // Process the idle day
    const report = processIdleDay(
      characterId,
      character.name || 'Unknown',
      personality,
      cityTypes,
      cityId,
      cityName,
      state.gameTime.day,
      character.health?.current || 100,
      character.morale || 80,
      character.cityFamiliarity || []
    )

    // Handle auto-executed activities
    for (const activity of report.activitiesExecuted) {
      // Deduct cost
      if (activity.cost > 0) {
        set(state => ({
          economy: processTransaction(
            state.economy,
            'expense',
            activity.category === 'recovery' ? 'medical_expense' :
            activity.category === 'growth' ? 'education_tuition' :
            activity.category === 'social' ? 'travel_expense' : 'equipment_maintenance',
            activity.cost,
            `${character.name}: ${activity.activityName}`
          )
        }))
      }

      // Apply morale change to character
      if (activity.moraleChange !== 0) {
        set(state => ({
          characters: state.characters.map((c: any) =>
            c.id === characterId
              ? { ...c, morale: Math.max(0, Math.min(100, (c.morale || 80) + activity.moraleChange)) }
              : c
          )
        }))
      }
    }

    // Update character's familiarity
    if (report.familiarityChange > 0) {
      set(state => {
        const char = state.characters.find((c: any) => c.id === characterId)
        if (!char) return state

        const existingFamiliarity = [...(char.cityFamiliarity || [])]
        const existingIndex = existingFamiliarity.findIndex(f => f.cityId === cityId)

        if (existingIndex >= 0) {
          existingFamiliarity[existingIndex] = {
            ...existingFamiliarity[existingIndex],
            level: Math.min(100, existingFamiliarity[existingIndex].level + report.familiarityChange),
            lastVisit: state.gameTime.day,
            totalDaysSpent: existingFamiliarity[existingIndex].totalDaysSpent + 1
          }
        } else {
          existingFamiliarity.push({
            cityId,
            cityName,
            level: report.familiarityChange,
            lastVisit: state.gameTime.day,
            totalDaysSpent: 1,
            missionsCompleted: 0,
            contactsMade: 0,
            isHometown: false
          })
        }

        return {
          characters: state.characters.map((c: any) =>
            c.id === characterId ? { ...c, cityFamiliarity: existingFamiliarity } : c
          )
        }
      })
    }

    // Add pending requests
    if (report.requestsCreated.length > 0) {
      set(state => ({
        pendingActivityRequests: [...state.pendingActivityRequests, ...report.requestsCreated]
      }))
    }

    // Store the report
    set(state => ({
      completedActivityReports: [...state.completedActivityReports.slice(-99), report]
    }))

    return report
  },

  processAllIdleCharacters: () => {
    const state = get()
    const reports: DailyActivityReport[] = []

    // Only process if day has changed
    if (state.gameTime.day === state.lastDayProcessed) {
      return reports
    }

    // Update last processed day
    set({ lastDayProcessed: state.gameTime.day })

    // Process each idle character
    for (const character of state.characters) {
      if (character.status !== 'on_mission' && character.status !== 'in_combat') {
        const report = get().processCharacterIdleDay(character.id)
        if (report) {
          reports.push(report)
        }
      }
    }

    return reports
  },

  approveActivityRequest: (requestId: string) => {
    const state = get()
    const request = state.pendingActivityRequests.find(r => r.id === requestId)

    if (!request) {
      console.warn(`Activity request ${requestId} not found`)
      return null
    }

    // Find the activity
    const activity = ACTIVITIES.find(a => a.id === request.activityId)
    if (!activity) {
      console.warn(`Activity ${request.activityId} not found`)
      return null
    }

    // Check if can afford
    if (!canAfford(state.economy, activity.cost)) {
      toast.error(`Cannot afford ${activity.name} ($${activity.cost})`)
      return null
    }

    // Execute the activity
    const character = state.characters.find((c: any) => c.id === request.characterId)
    const result = executeActivity(
      activity,
      request.characterId,
      character?.name || 'Unknown',
      state.gameTime.day
    )

    // Deduct cost
    set(state => ({
      economy: processTransaction(
        state.economy,
        'expense',
        activity.category === 'recovery' ? 'medical_expense' :
        activity.category === 'growth' ? 'education_tuition' :
        activity.category === 'social' ? 'travel_expense' : 'equipment_maintenance',
        activity.cost,
        `${character?.name || 'Unknown'}: ${activity.name}`
      ),
      // Remove from pending
      pendingActivityRequests: state.pendingActivityRequests.filter(r => r.id !== requestId)
    }))

    // Apply results to character
    if (result.moraleChange !== 0 || result.skillProgress) {
      set(state => ({
        characters: state.characters.map((c: any) =>
          c.id === request.characterId
            ? {
                ...c,
                morale: Math.max(0, Math.min(100, (c.morale || 80) + result.moraleChange))
              }
            : c
        )
      }))
    }

    // If 'growth_class' activity and character has active enrollment, boost progress
    if (activity.id === 'growth_class') {
      const enrollment = get().getEnrollmentByCharacter(request.characterId)
      if (enrollment) {
        // Attending class accelerates training by 5% (personality modifiers could apply here)
        const personality = character?.personality
        const disciplineBonus = (personality?.volatility ?? 5) < 4 ? 1.1 : 1.0  // Low volatility = more disciplined
        const progressBoost = Math.round(5 * disciplineBonus)

        get().updateEnrollmentProgress(enrollment.id, enrollment.progress + progressBoost)
        toast.success(`${character?.name}'s training accelerated by ${progressBoost}%`)
      }
    }

    toast.success(`${character?.name} completed: ${activity.name}`)
    return result
  },

  denyActivityRequest: (requestId: string) => {
    set(state => ({
      pendingActivityRequests: state.pendingActivityRequests.filter(r => r.id !== requestId)
    }))
  },

  getCharacterFamiliarity: (characterId: string, cityId: string) => {
    const state = get()
    const character = state.characters.find((c: any) => c.id === characterId)

    if (!character || !character.cityFamiliarity) {
      return null
    }

    return character.cityFamiliarity.find((f: CityFamiliarity) => f.cityId === cityId) || null
  },

  updateCharacterFamiliarity: (characterId: string, cityId: string, change: number) => {
    set(state => {
      const character = state.characters.find((c: any) => c.id === characterId)
      if (!character) return state

      const existingFamiliarity = [...(character.cityFamiliarity || [])]
      const existingIndex = existingFamiliarity.findIndex(f => f.cityId === cityId)

      if (existingIndex >= 0) {
        existingFamiliarity[existingIndex] = {
          ...existingFamiliarity[existingIndex],
          level: Math.max(0, Math.min(100, existingFamiliarity[existingIndex].level + change)),
          lastVisit: state.gameTime.day
        }
      } else if (change > 0) {
        existingFamiliarity.push({
          cityId,
          cityName: cityId,
          level: change,
          lastVisit: state.gameTime.day,
          totalDaysSpent: 1,
          missionsCompleted: 0,
          contactsMade: 0,
          isHometown: false
        })
      }

      return {
        characters: state.characters.map((c: any) =>
          c.id === characterId ? { ...c, cityFamiliarity: existingFamiliarity } : c
        )
      }
    })
  },

  getPendingRequests: () => {
    return get().pendingActivityRequests
  },

  getCharacterActivityDesires: (characterId: string) => {
    const state = get()
    const character = state.characters.find((c: any) => c.id === characterId)

    if (!character) {
      return null
    }

    const personality = character.personality || {
      impatience: 5, initiative: 5, volatility: 5, discipline: 5,
      sociability: 5, riskTolerance: 5, harmAvoidance: 5
    }

    return calculateActivityDesires(
      personality,
      character.health?.current || 100,
      character.morale || 80
    )
  },

  // ===== Training/Education System Actions =====

  enrollCharacter: (enrollment: Omit<TrainingEnrollment, 'id' | 'status'>) => {
    const state = get()

    // Check if character is already training
    const existingEnrollment = state.trainingEnrollments.find(
      e => e.characterId === enrollment.characterId && e.status === 'active'
    )
    if (existingEnrollment) {
      toast.error('Character is already enrolled in training')
      return
    }

    // Check budget
    if (state.budget < enrollment.cost) {
      toast.error('Insufficient funds for training')
      return
    }

    // Check reputation gating for special programs
    const fieldLower = enrollment.fieldId.toLowerCase()
    const institutionLower = enrollment.institutionId.toLowerCase()

    // Government/Military programs require positive government reputation
    const governmentFields = ['government', 'military', 'intelligence', 'law_enforcement', 'federal']
    const isGovernmentProgram = governmentFields.some(f => fieldLower.includes(f) || institutionLower.includes(f))
    if (isGovernmentProgram && state.reputation.government < 25) {
      toast.error('Government programs require Government reputation ≥ 25')
      return
    }

    // Criminal programs require criminal reputation
    const criminalFields = ['underground', 'criminal', 'black_market', 'assassination', 'smuggling']
    const isCriminalProgram = criminalFields.some(f => fieldLower.includes(f))
    if (isCriminalProgram && state.reputation.criminal < 50) {
      toast.error('Criminal training requires Criminal reputation ≥ 50')
      return
    }

    // Elite military programs require higher government standing
    const eliteMilitary = ['elite', 'command', 'special_forces', 'black_ops']
    const isEliteMilitary = eliteMilitary.some(f => fieldLower.includes(f) || enrollment.degreeLevel === 'elite' || enrollment.degreeLevel === 'command')
    if (isEliteMilitary && state.reputation.government < 50) {
      toast.error('Elite military programs require Government reputation ≥ 50')
      return
    }

    // Check facility availability (warning, not blocking)
    // Fields that benefit from specific facilities
    const facilityRequirements: Record<string, string> = {
      'combat_sciences': 'Training Room',
      'martial_arts': 'Training Room',
      'military_tactics': 'Training Room',
      'weapons_systems': 'Armory',
      'demolitions': 'Armory',
      'hacking': 'Comms Center',
      'cryptography': 'Comms Center',
      'medicine': 'Medical Bay',
      'trauma_surgery': 'Medical Bay',
      'vehicle_combat': 'Simulator',
      'vehicle_engineering': 'Garage',
      'technical_engineering': 'Workshop',
      'robotics': 'Workshop',
    }

    const baseBonuses = get().getBaseBonuses()
    const requiredFacility = Object.entries(facilityRequirements)
      .find(([field]) => fieldLower.includes(field))?.[1]

    if (requiredFacility && baseBonuses.education === 0) {
      // Warn but don't block - training will just be slower
      toast(`No ${requiredFacility} facility - training will be slower`, { icon: '⚠️' })
    }

    const newEnrollment: TrainingEnrollment = {
      ...enrollment,
      id: `enroll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'active'
    }

    set({
      trainingEnrollments: [...state.trainingEnrollments, newEnrollment],
      budget: state.budget - enrollment.cost
    })

    // Record the transaction for financial tracking
    get().recordTransaction(
      'expense',
      'education_tuition',
      enrollment.cost,
      `${enrollment.characterName} enrolled in ${enrollment.degreeLevel} ${enrollment.fieldId} at ${enrollment.institutionId}`
    )

    // Set character status to training
    const updatedCharacters = state.characters.map((c: any) =>
      c.id === enrollment.characterId ? { ...c, status: 'training' } : c
    )
    set({ characters: updatedCharacters })

    toast.success(`${enrollment.characterName} enrolled in ${enrollment.fieldId}`)
  },

  updateEnrollmentProgress: (enrollmentId: string, progress: number) => {
    const state = get()
    set({
      trainingEnrollments: state.trainingEnrollments.map(e =>
        e.id === enrollmentId ? { ...e, progress: Math.min(100, Math.max(0, progress)) } : e
      )
    })
  },

  completeTraining: (enrollmentId: string) => {
    const state = get()
    const enrollment = state.trainingEnrollments.find(e => e.id === enrollmentId)
    if (!enrollment) return

    // Apply stat bonuses to character
    const updatedCharacters = state.characters.map((c: any) => {
      if (c.id !== enrollment.characterId) return c

      // Clone the character with updates
      const updates: any = {
        ...c,
        status: 'ready',
        educationLevel: enrollment.degreeLevel,
        // Clone stats object for mutation
        stats: { ...c.stats }
      }

      // Apply stat bonuses to nested stats object
      // Stats use 3-letter codes: MEL, RNG, AGL, CON, INS, WIL, INT
      if (enrollment.statBonuses) {
        for (const [stat, bonus] of Object.entries(enrollment.statBonuses)) {
          const statKey = stat.toUpperCase()
          if (updates.stats && typeof updates.stats[statKey] === 'number') {
            updates.stats[statKey] = Math.min(100, updates.stats[statKey] + (bonus as number))
            console.log(`[Training] ${c.name}: ${statKey} +${bonus} -> ${updates.stats[statKey]}`)
          }
        }
      }

      // Add unlocked skills
      if (enrollment.skillsUnlocked && enrollment.skillsUnlocked.length > 0) {
        updates.skills = [...(c.skills || []), ...enrollment.skillsUnlocked]
      }

      return updates
    })

    // Mark enrollment as completed
    set({
      characters: updatedCharacters,
      trainingEnrollments: state.trainingEnrollments.map(e =>
        e.id === enrollmentId ? { ...e, status: 'completed', progress: 100 } : e
      )
    })

    toast.success(`${enrollment.characterName} completed training in ${enrollment.fieldId}!`)

    // Add notification
    get().addNotification({
      type: 'success' as NotificationType,
      title: 'Training Complete',
      message: `${enrollment.characterName} has completed their ${enrollment.degreeLevel} in ${enrollment.fieldId}`,
      category: 'character',
      priority: 'medium' as NotificationPriority,
      gameTime: state.gameTime
    })

    // Apply reputation changes based on degree level
    const degreeToAction: Record<string, keyof typeof ACTION_REPUTATION_CHANGES> = {
      'certificate': 'education_certificate',
      'associate': 'education_associate',
      'bachelor': 'education_bachelor',
      'master': 'education_master',
      'doctorate': 'education_doctorate',
      // Military tracks
      'basic': 'education_military',
      'advanced': 'education_military',
      'specialist': 'education_military',
      'elite': 'education_military',
      'command': 'education_military',
    }

    const reputationAction = degreeToAction[enrollment.degreeLevel] || 'education_certificate'
    const repChanges = ACTION_REPUTATION_CHANGES[reputationAction]

    // Check if this is a criminal field
    const criminalFields = ['underground', 'criminal', 'black_market', 'assassination']
    const isCriminalField = criminalFields.some(f => enrollment.fieldId.toLowerCase().includes(f))

    if (isCriminalField) {
      // Criminal training has different reputation effects
      const criminalRep = ACTION_REPUTATION_CHANGES['education_criminal']
      get().adjustReputationAxis('public', criminalRep.public, `Criminal training: ${enrollment.fieldId}`)
      get().adjustReputationAxis('government', criminalRep.government, `Criminal training: ${enrollment.fieldId}`)
      get().adjustReputationAxis('criminal', criminalRep.criminal, `Criminal training: ${enrollment.fieldId}`)
      get().adjustReputationAxis('heroic', criminalRep.heroic, `Criminal training: ${enrollment.fieldId}`)
    } else {
      // Normal education reputation gains
      get().adjustReputationAxis('public', repChanges.public, `Education: ${enrollment.degreeLevel} in ${enrollment.fieldId}`)
      get().adjustReputationAxis('government', repChanges.government, `Education: ${enrollment.degreeLevel}`)
      get().adjustReputationAxis('heroic', repChanges.heroic, `Education: ${enrollment.degreeLevel}`)
    }

    // Generate news article for training completion
    // Higher degree levels get more important news coverage
    const degreeImportance: Record<string, 'local' | 'regional' | 'national'> = {
      'certificate': 'local',
      'associate': 'local',
      'bachelor': 'local',
      'master': 'regional',
      'doctorate': 'regional',
      'basic': 'local',
      'advanced': 'local',
      'specialist': 'regional',
      'elite': 'regional',
      'command': 'national',
    }

    const importance = degreeImportance[enrollment.degreeLevel] || 'local'
    const character = state.characters.find(c => c.id === enrollment.characterId)
    const characterName = character?.name || enrollment.characterName

    // Don't publicize criminal training
    if (!isCriminalField) {
      const headline = enrollment.degreeLevel === 'doctorate'
        ? `${characterName} Earns Doctorate in ${enrollment.fieldId}`
        : enrollment.degreeLevel === 'master'
          ? `${characterName} Completes Master's in ${enrollment.fieldId}`
          : `Local Agent Advances Training in ${enrollment.fieldId}`

      const body = `${characterName} has successfully completed their ${enrollment.degreeLevel} training in ${enrollment.fieldId}. ` +
        (enrollment.degreeLevel === 'doctorate'
          ? 'This achievement represents years of dedicated study and positions them as an expert in their field.'
          : enrollment.degreeLevel === 'master'
            ? 'This advanced credential will enhance their operational capabilities.'
            : 'The additional training will improve their effectiveness in the field.')

      const newsArticle = createNewsArticle(
        headline,
        body,
        'local' as NewsCategory,
        importance,
        state.gameTime,
        {
          relatedCharacters: [characterName],
          city: state.selectedCity,
        }
      )

      get().addNewsArticle(newsArticle)
    }
  },

  dropTraining: (enrollmentId: string) => {
    const state = get()
    const enrollment = state.trainingEnrollments.find(e => e.id === enrollmentId)
    if (!enrollment) return

    // Calculate partial refund: 50% of remaining progress
    const remainingProgress = 1 - (enrollment.progress / 100)
    const refundAmount = Math.floor(enrollment.cost * remainingProgress * 0.5)

    // Set character status back to ready
    const updatedCharacters = state.characters.map((c: any) =>
      c.id === enrollment.characterId ? { ...c, status: 'ready' } : c
    )

    set({
      characters: updatedCharacters,
      budget: state.budget + refundAmount,  // Add refund
      trainingEnrollments: state.trainingEnrollments.map(e =>
        e.id === enrollmentId ? { ...e, status: 'dropped' } : e
      )
    })

    // Record the refund transaction
    if (refundAmount > 0) {
      get().recordTransaction(
        'income',
        'education_tuition',
        refundAmount,
        `Partial refund for ${enrollment.characterName} dropping ${enrollment.fieldId} (${enrollment.progress}% completed)`
      )
    }

    // Apply dropout reputation penalty
    const dropoutRep = ACTION_REPUTATION_CHANGES['education_dropout']
    get().adjustReputationAxis('public', dropoutRep.public, `Dropped out: ${enrollment.fieldId}`)
    get().adjustReputationAxis('heroic', dropoutRep.heroic, `Dropped out: ${enrollment.fieldId}`)

    // Generate minor negative news for high-profile dropout (masters/doctorate only)
    if (['master', 'doctorate'].includes(enrollment.degreeLevel)) {
      const dropoutNews = createNewsArticle(
        `Training Program Sees Early Departure`,
        `A candidate has withdrawn from an advanced ${enrollment.fieldId} training program. Sources suggest personal circumstances led to the decision.`,
        'local' as NewsCategory,
        'local',
        state.gameTime,
        {
          city: state.selectedCity,
        }
      )
      get().addNewsArticle(dropoutNews)
    }

    toast(`${enrollment.characterName} dropped out of training`, { icon: '⚠️' })
  },

  getActiveEnrollments: () => {
    return get().trainingEnrollments.filter(e => e.status === 'active')
  },

  getEnrollmentByCharacter: (characterId: string) => {
    return get().trainingEnrollments.find(
      e => e.characterId === characterId && e.status === 'active'
    ) || null
  },

  processTrainingProgress: () => {
    const state = get()
    const currentDay = state.gameTime.day

    // Get facility bonus for training
    const facilityBonus = get().getBaseBonuses().education / 100  // 0-0.75 range

    state.trainingEnrollments.forEach(enrollment => {
      if (enrollment.status !== 'active') return

      // Calculate base progress
      const totalDays = enrollment.endDay - enrollment.startDay
      const daysElapsed = currentDay - enrollment.startDay

      // Apply facility bonus to accelerate progress
      // With max facility bonus (75%), training completes ~43% faster
      const acceleratedProgress = daysElapsed * (1 + facilityBonus)
      const newProgress = Math.min(100, Math.max(0, (acceleratedProgress / totalDays) * 100))

      if (newProgress !== enrollment.progress) {
        get().updateEnrollmentProgress(enrollment.id, newProgress)
      }

      // Check if training is complete (either via progress or time)
      if (newProgress >= 100 || currentDay >= enrollment.endDay) {
        get().completeTraining(enrollment.id)
      }
    })
  },
}))
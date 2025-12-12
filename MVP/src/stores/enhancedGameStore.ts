import { create } from 'zustand'
import toast from 'react-hot-toast'
import { GameNotification, NotificationType, NotificationPriority } from '../types'
import {
  getPersonalityTraits,
  getImpatienceMultiplier,
  getImpatienceState,
  IMPATIENCE_STATE_MESSAGES,
} from '../data/personalitySystem'

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

// Enhanced game store with injury system
interface EnhancedGameStore {
  // Game Setup
  gamePhase: 'faction-selection' | 'country-selection' | 'city-selection' | 'recruiting' | 'playing'
  selectedFaction: string
  selectedCountry: string
  selectedCity: string

  // Game State
  currentView: 'world-map' | 'tactical-combat' | 'investigation' | 'characters' | 'combat-lab' | 'encyclopedia' | 'balance' | 'world-map-grid' | 'database' | 'data-viewer' | 'sound-config' | 'loadout-editor' | 'sector-editor' | 'world-data'
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
  investigations: any[]
  worldEvents: any[]
  medicalQueue: any[]

  // Notification System
  notifications: GameNotification[]

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

  // Medical system
  addInjury: (characterId: string, injury: any) => void
  scheduleHospitalStay: (characterId: string, injury: any) => void
  processRecovery: () => void
  updateCharacterInjuries: (characterId: string, injury: any) => void

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

  // Idle Detection System
  checkIdleCharacters: () => void
  setCharacterStatus: (characterId: string, status: string, data?: Record<string, unknown>) => void

  // Time System Actions
  togglePause: () => void
  setTimeSpeed: (speed: TimeSpeed) => void
  cycleTimeSpeed: () => void  // Cycle through speeds (for UI button)
  tickTime: () => void  // Called by interval - advances time based on speed
  advanceTime: (minutes: number) => void  // Manually advance time
  getFormattedTime: () => { time: string; dayOfWeek: string; timeOfDay: 'morning' | 'noon' | 'evening' | 'night' }
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

  investigations: [
    {
      id: 'inv-001',
      title: 'Corporate Sabotage Investigation',
      description: 'Industrial accidents increasing at suspicious rate in automotive manufacturing',
      location: { country: 'United States', city: 'Detroit' },
      difficulty: 6,
      priority: 'high',
      timeLimit: 48,
      progress: 0,
      assignedCharacters: []
    },
    {
      id: 'inv-002',
      title: 'Missing Government Official',
      description: 'State senator disappeared with access to LSW classification documents',
      location: { country: 'United States', city: 'Sacramento' },
      difficulty: 8,
      priority: 'critical',
      timeLimit: 24,
      progress: 0,
      assignedCharacters: []
    }
  ],

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
    toast.success(`Operations authorized in ${country}`)
  },

  selectCity: (city) => {
    set({
      selectedCity: city,
      gamePhase: 'recruiting'
    })
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
      if (char.status === 'hospitalized' && char.recoveryTime > 0) {
        const newRecoveryTime = char.recoveryTime - 1
        if (newRecoveryTime <= 0) {
          recovered.push(char.name)
          return {
            ...char,
            status: 'ready',
            recoveryTime: 0,
            health: { ...char.health, current: char.health.maximum }
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
        toast.success(`Squad arrived at sector ${sector}${city ? ` - ${city}` : ''}`)
      }
    }, 1500)
  },

  startMission: (sector, city, missionType) => {
    set({
      pendingMission: { sector, city, type: missionType },
      squadStatus: 'on_mission'
    })
    toast.info(`Mission started: ${missionType} in ${city}`)
  },

  enterCombat: () => {
    const state = get()
    set({
      squadStatus: 'in_combat',
      currentView: 'combat-lab',
      characters: state.characters.map(char =>
        char.status === 'traveling' ? { ...char, status: 'in_combat' } : char
      )
    })
    toast.success('Engaging hostiles!')
  },

  completeMission: (success) => {
    const state = get()
    const reward = success ? 5000 : 0

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

    if (success) {
      toast.success(`Mission complete! +$${reward.toLocaleString()}`)
    } else {
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
    let secondsPerSector = 5  // Base: 5 seconds per sector on foot
    let vehicleType: 'ground' | 'air' | 'water' | undefined

    if (vehicleId) {
      const vehicle = state.fleetVehicles.find(v => v.id === vehicleId)
      if (vehicle) {
        // Faster vehicles = fewer seconds per sector
        // Aircraft: ~1-2 sec/sector, Ground: ~2-3 sec/sector, Sea: ~3-4 sec/sector
        if (vehicle.type === 'aircraft') {
          secondsPerSector = vehicle.speed > 300 ? 1 : 2  // Jets are fastest
        } else if (vehicle.type === 'ground') {
          secondsPerSector = vehicle.speed > 60 ? 2.5 : 3
        } else {
          secondsPerSector = 3.5
        }
        vehicleType = vehicle.type
      }
    }

    const travelTimeSeconds = distance * secondsPerSector
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

    // Update state
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
              ? { ...v, status: 'traveling' as const, assignedCharacters: characterIds }
              : v
          )
        : state.fleetVehicles
    })

    const etaStr = travelTimeHours < 1
      ? `${Math.round(travelTimeHours * 60)} minutes`
      : `${travelTimeHours.toFixed(1)} hours`

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
              ? { ...v, status: 'available' as const, currentSector: unit.destinationSector, assignedCharacters: [] }
              : v
          )
        : state.fleetVehicles
    })

    // Create arrival notification
    get().addNotification({
      type: 'arrival',
      priority: 'medium',
      title: `Arrived at Sector ${unit.destinationSector}`,
      message: travelingCharacters.length === 1
        ? `${firstCharacter?.name || 'Team'} has arrived and is awaiting orders.`
        : `${characterNames} have arrived and are awaiting orders.`,
      characterId: firstCharacter?.id,
      characterName: firstCharacter?.name,
      location: `Sector ${unit.destinationSector}`,
      timestamp: Date.now(), // Game time - should be replaced with actual game time later
    })

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
    set({ lastTimeTick: Date.now() })
  },

  advanceTime: (minutes: number) => {
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
}))
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Game State Types
export interface Character {
  id: string
  name: string
  realName?: string
  stats: {
    MEL: number
    AGL: number  
    STR: number
    STA: number
    INT: number
    INS: number
    CON: number
  }
  threatLevel: 'THREAT_A' | 'THREAT_1' | 'THREAT_2' | 'THREAT_3' | 'THREAT_4' | 'THREAT_5'
  origin: string
  powers: string[]
  equipment: string[]
  skills: string[]
  health: {
    current: number
    maximum: number
  }
  status: 'ready' | 'busy' | 'injured' | 'traveling' | 'hospitalized'
  location: {
    country: string
    city: string
    coordinates?: [number, number]
  }
  career: {
    category: string
    rank: number
  }
  experience: number
  relationships: Record<string, number>
}

export interface Investigation {
  id: string
  title: string
  description: string
  location: {
    country: string
    city: string
  }
  difficulty: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  timeLimit: number // hours
  assignedCharacters: string[]
  progress: number
  rewards: string[]
  consequences: string[]
}

export interface WorldState {
  day: number // Countdown from 2472
  globalRelations: Record<string, Record<string, number>>
  economicState: Record<string, number>
  crisisEvents: any[]
  lswPopulation: Record<string, number>
  politicalTensions: Record<string, number>
}

export interface GameStore {
  // Game Setup
  gamePhase: 'faction-selection' | 'country-selection' | 'city-selection' | 'playing'
  selectedFaction: string
  selectedCountry: string  
  selectedCity: string
  
  // Game State
  currentView: 'world-map' | 'tactical-combat' | 'investigation' | 'characters'
  isPaused: boolean
  gameSpeed: number
  
  // Player Data
  playerFaction: string
  playerCountry: string
  playerCity: string
  budget: number
  reputation: Record<string, number>
  authority: Record<string, number>
  
  // Characters & Teams
  characters: Character[]
  activeTeam: string[]
  
  // World Data  
  worldState: WorldState
  investigations: Investigation[]
  activeInvestigations: Investigation[]
  
  // Combat Data
  combatState: {
    active: boolean
    characters: Character[]
    environment: string
    turn: number
    activeCharacter: string
    grid: any[][]
  }
  
  // Mobile/Desktop Detection
  isMobile: boolean
  
  // Actions
  setGamePhase: (phase: string) => void
  selectFaction: (faction: string) => void
  selectCountry: (country: string) => void
  selectCity: (city: string) => void
  setCurrentView: (view: string) => void
  
  // Character Management
  addCharacter: (character: Character) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  assignToInvestigation: (characterId: string, investigationId: string) => void
  
  // World Simulation
  updateWorldState: (updates: Partial<WorldState>) => void
  addInvestigation: (investigation: Investigation) => void
  completeInvestigation: (investigationId: string, outcome: string) => void
  
  // Combat System
  initiateCombat: (characters: Character[], environment: string) => void
  processCombatTurn: (action: any) => void
  endCombat: (result: any) => void
  
  // Real-time Updates
  subscribeToWorldEvents: () => void
  handleCrisisAlert: (alert: any) => void
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    gamePhase: 'faction-selection',
    selectedFaction: '',
    selectedCountry: '',
    selectedCity: '',
    
    currentView: 'world-map',
    isPaused: false,
    gameSpeed: 1,
    
    playerFaction: '',
    playerCountry: '',
    playerCity: '',
    budget: 50000,
    reputation: {},
    authority: {},
    
    characters: [],
    activeTeam: [],
    
    worldState: {
      day: 2472,
      globalRelations: {},
      economicState: {},
      crisisEvents: [],
      lswPopulation: {},
      politicalTensions: {}
    },
    
    investigations: [],
    activeInvestigations: [],
    
    combatState: {
      active: false,
      characters: [],
      environment: '',
      turn: 1,
      activeCharacter: '',
      grid: []
    },
    
    isMobile: window.innerWidth <= 768,
    
    // Actions
    setGamePhase: (phase) => set({ gamePhase: phase }),
    
    selectFaction: (faction) => set((state) => ({
      selectedFaction: faction,
      playerFaction: faction,
      gamePhase: 'country-selection'
    })),
    
    selectCountry: (country) => set((state) => ({
      selectedCountry: country,
      playerCountry: country, 
      gamePhase: 'city-selection'
    })),
    
    selectCity: (city) => set((state) => ({
      selectedCity: city,
      playerCity: city,
      gamePhase: 'playing',
      currentView: 'world-map'
    })),
    
    setCurrentView: (view) => set({ currentView: view }),
    
    addCharacter: (character) => set((state) => ({
      characters: [...state.characters, character]
    })),
    
    updateCharacter: (id, updates) => set((state) => ({
      characters: state.characters.map(char => 
        char.id === id ? { ...char, ...updates } : char
      )
    })),
    
    assignToInvestigation: (characterId, investigationId) => set((state) => {
      // Update character status to busy
      const updatedCharacters = state.characters.map(char =>
        char.id === characterId ? { ...char, status: 'busy' as const } : char
      )
      
      // Update investigation with assigned character
      const updatedInvestigations = state.investigations.map(inv =>
        inv.id === investigationId 
          ? { ...inv, assignedCharacters: [...inv.assignedCharacters, characterId] }
          : inv
      )
      
      return {
        characters: updatedCharacters,
        investigations: updatedInvestigations
      }
    }),
    
    updateWorldState: (updates) => set((state) => ({
      worldState: { ...state.worldState, ...updates }
    })),
    
    addInvestigation: (investigation) => set((state) => ({
      investigations: [...state.investigations, investigation],
      activeInvestigations: [...state.activeInvestigations, investigation]
    })),
    
    completeInvestigation: (investigationId, outcome) => set((state) => {
      // Remove from active investigations
      const activeInvestigations = state.activeInvestigations.filter(
        inv => inv.id !== investigationId
      )
      
      // Update character statuses back to ready
      const investigation = state.investigations.find(inv => inv.id === investigationId)
      const updatedCharacters = state.characters.map(char =>
        investigation?.assignedCharacters.includes(char.id)
          ? { ...char, status: 'ready' as const }
          : char
      )
      
      return {
        activeInvestigations,
        characters: updatedCharacters
      }
    }),
    
    initiateCombat: (characters, environment) => set((state) => ({
      combatState: {
        active: true,
        characters,
        environment,
        turn: 1,
        activeCharacter: characters[0]?.id || '',
        grid: generateCombatGrid(environment)
      },
      currentView: 'tactical-combat'
    })),
    
    processCombatTurn: (action) => set((state) => {
      // Process combat action and update state
      // This would integrate with your CSV combat resolution engine
      return state
    }),
    
    endCombat: (result) => set((state) => ({
      combatState: {
        ...state.combatState,
        active: false
      },
      currentView: 'world-map'
    })),
    
    subscribeToWorldEvents: () => {
      // Real-time world event subscription would go here
      console.log('Subscribing to world events...')
    },
    
    handleCrisisAlert: (alert) => set((state) => ({
      worldState: {
        ...state.worldState,
        crisisEvents: [...state.worldState.crisisEvents, alert]
      }
    }))
  }))
)

// Helper function to generate combat grid
function generateCombatGrid(environment: string) {
  const grid = Array(15).fill(null).map(() => Array(15).fill(null))
  
  // Add environmental objects based on environment type
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (Math.random() < 0.15) {
        switch (environment) {
          case 'urban':
            grid[y][x] = { type: 'car', destructible: true, weight: 2800 }
            break
          case 'warehouse': 
            grid[y][x] = { type: 'crate', destructible: true, weight: 200 }
            break
          case 'industrial':
            grid[y][x] = { type: 'machinery', destructible: true, weight: 5000 }
            break
        }
      }
    }
  }
  
  return grid
}

// Mobile detection utility
export const detectMobile = () => {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Update mobile state on resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    useGameStore.setState({ isMobile: detectMobile() })
  })
}
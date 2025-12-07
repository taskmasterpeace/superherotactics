import { create } from 'zustand'
import toast from 'react-hot-toast'

// Simplified working game store
interface WorkingGameStore {
  // Game Setup
  gamePhase: 'faction-selection' | 'country-selection' | 'city-selection' | 'playing'
  selectedFaction: string
  selectedCountry: string
  selectedCity: string
  
  // Game State
  currentView: 'world-map' | 'tactical-combat' | 'investigation' | 'characters'
  budget: number
  day: number
  
  // Sample Data
  characters: any[]
  investigations: any[]
  worldEvents: any[]
  
  // Actions that ACTUALLY WORK
  setGamePhase: (phase: any) => void
  selectFaction: (faction: string) => void
  selectCountry: (country: string) => void
  selectCity: (city: string) => void
  setCurrentView: (view: any) => void
  
  // Working functions
  deployTeam: () => void
  contactNetwork: () => void
  emergencyPowers: () => void
  startCombat: () => void
  assignInvestigation: (invId: string) => void
}

export const useGameStore = create<WorkingGameStore>((set, get) => ({
  // Initial State
  gamePhase: 'faction-selection',
  selectedFaction: '',
  selectedCountry: '',
  selectedCity: '',
  
  currentView: 'world-map',
  budget: 75000,
  day: 2472,
  
  // Sample Characters
  characters: [
    {
      id: 'char-001',
      name: 'Captain America',
      realName: 'Steve Rogers',
      stats: { MEL: 65, AGL: 55, STR: 60, STA: 70, INT: 45, INS: 50, CON: 65 },
      threatLevel: 'THREAT_2',
      origin: 'Altered Human',
      powers: ['Enhanced Physiology', 'Super Durability'],
      equipment: ['Vibranium Shield', 'Tactical Armor'],
      health: { current: 70, maximum: 70 },
      status: 'ready',
      location: { country: 'United States', city: 'Washington DC' }
    },
    {
      id: 'char-002',
      name: 'Sandra Locke', 
      realName: 'Sandra Locke',
      stats: { MEL: 45, AGL: 70, STR: 35, STA: 60, INT: 85, INS: 90, CON: 55 },
      threatLevel: 'THREAT_3',
      origin: 'Time Enhanced',
      powers: ['Time Travel', 'Temporal Manipulation'],
      equipment: ['Temporal Stabilizer'],
      health: { current: 60, maximum: 60 },
      status: 'ready',
      location: { country: 'United States', city: 'Miami' }
    }
  ],
  
  // Sample Investigations
  investigations: [
    {
      id: 'inv-001',
      title: 'Corporate Sabotage Investigation',
      description: 'Industrial accidents increasing at suspicious rate',
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
      description: 'Senator disappeared with LSW classification access',
      location: { country: 'United States', city: 'Sacramento' },
      difficulty: 8,
      priority: 'critical', 
      timeLimit: 24,
      progress: 0,
      assignedCharacters: []
    }
  ],
  
  // Sample World Events
  worldEvents: [
    {
      id: 'evt-001',
      title: 'Chinese Naval Buildup',
      description: 'Satellite imagery shows LSW naval exercises',
      location: 'South China Sea',
      severity: 'high',
      time: new Date().toLocaleTimeString()
    }
  ],
  
  // WORKING Actions
  setGamePhase: (phase) => {
    set({ gamePhase: phase })
    toast.success(`Switched to ${phase}`)
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
    toast.success(`Selected ${country}`)
  },
  
  selectCity: (city) => {
    set({ 
      selectedCity: city,
      gamePhase: 'playing',
      currentView: 'world-map'
    })
    toast.success(`Headquarters established in ${city}`)
  },
  
  setCurrentView: (view) => {
    set({ currentView: view })
    toast.info(`Switched to ${view}`)
  },
  
  // WORKING Button Functions
  deployTeam: () => {
    const state = get()
    const availableTeam = state.characters.filter(c => c.status === 'ready')
    if (availableTeam.length > 0) {
      toast.success(`Deploying team of ${availableTeam.length} operatives to crisis zone`)
      // Actually update character status
      set({
        characters: state.characters.map(char => 
          char.status === 'ready' 
            ? { ...char, status: 'busy' }
            : char
        )
      })
    } else {
      toast.error('No available team members for deployment')
    }
  },
  
  contactNetwork: () => {
    toast.info('Accessing intelligence network...')
    // Generate new intelligence
    const state = get()
    const newEvent = {
      id: 'evt-' + Date.now(),
      title: 'Intelligence Update',
      description: 'Network contacts report suspicious activity in target region',
      location: 'Classified Location',
      severity: 'medium',
      time: new Date().toLocaleTimeString()
    }
    set({
      worldEvents: [newEvent, ...state.worldEvents.slice(0, 9)]
    })
    toast.success('Intelligence network contacted - new information received')
  },
  
  emergencyPowers: () => {
    const state = get()
    if (state.budget >= 10000) {
      set({ budget: state.budget - 10000 })
      toast.success('Emergency powers activated - additional resources deployed')
      
      // Generate emergency investigation
      const emergency = {
        id: 'inv-emergency-' + Date.now(),
        title: 'Emergency Response Operation',
        description: 'Emergency powers activated for immediate threat response',
        location: { country: state.selectedCountry, city: state.selectedCity },
        difficulty: 9,
        priority: 'critical',
        timeLimit: 6,
        progress: 0,
        assignedCharacters: []
      }
      set({
        investigations: [emergency, ...state.investigations]
      })
    } else {
      toast.error('Insufficient budget for emergency powers')
    }
  },
  
  startCombat: () => {
    const state = get()
    set({ currentView: 'tactical-combat' })
    toast.success('Initiating tactical combat sequence')
    
    // Set up combat with available characters
    const combatChars = state.characters.filter(c => c.status === 'ready').slice(0, 2)
    if (combatChars.length > 0) {
      toast.info(`Combat initiated with ${combatChars.length} operatives`)
    }
  },
  
  assignInvestigation: (invId) => {
    const state = get()
    const investigation = state.investigations.find(inv => inv.id === invId)
    const availableChar = state.characters.find(c => c.status === 'ready')
    
    if (investigation && availableChar) {
      // Actually assign character
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
  }
}))
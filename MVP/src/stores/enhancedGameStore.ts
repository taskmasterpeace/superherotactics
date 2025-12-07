import { create } from 'zustand'
import toast from 'react-hot-toast'

// Enhanced game store with injury system
interface EnhancedGameStore {
  // Game Setup
  gamePhase: 'faction-selection' | 'country-selection' | 'city-selection' | 'recruiting' | 'playing'
  selectedFaction: string
  selectedCountry: string
  selectedCity: string
  
  // Game State
  currentView: 'world-map' | 'tactical-combat' | 'investigation' | 'characters' | 'combat-lab' | 'encyclopedia' | 'balance'
  budget: number
  day: number
  
  // Enhanced Character System
  characters: any[]
  investigations: any[]
  worldEvents: any[]
  medicalQueue: any[]
  
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

  // Character management
  addCharacter: (character: any) => void
  updateCharacter: (characterId: string, updates: any) => void
  removeCharacter: (characterId: string) => void
}

export const useGameStore = create<EnhancedGameStore>((set, get) => ({
  // Initial State
  gamePhase: 'country-selection',
  selectedFaction: '',
  selectedCountry: '',
  selectedCity: '',
  
  currentView: 'world-map',
  budget: 75000,
  day: 2472,
  
  // Sample Characters with enhanced health tracking
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
      location: { country: 'United States', city: 'Washington DC' },
      injuries: [],
      medicalHistory: [],
      recoveryTime: 0
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
      location: { country: 'United States', city: 'Miami' },
      injuries: [],
      medicalHistory: [],
      recoveryTime: 0
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
  }
}))
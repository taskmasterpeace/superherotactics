// World Simulation Engine
import { useGameStore } from '../stores/gameStore'

export function initializeWorld() {
  console.log('🌍 Initializing world simulation...')
  
  // Set initial world state
  useGameStore.setState({
    worldState: {
      day: 2472,
      globalRelations: initializeGlobalRelations(),
      economicState: initializeEconomicState(),
      crisisEvents: [],
      lswPopulation: initializeLSWPopulation(),
      politicalTensions: initializePoliticalTensions()
    }
  })
  
  // Start world simulation loop
  startWorldSimulation()
}

function initializeGlobalRelations() {
  return {
    'US-China': -30,
    'US-India': 65,
    'US-Nigeria': 25,
    'China-India': -20,
    'China-Nigeria': 45,
    'India-Nigeria': 85,
    'Greece-Turkey': -45,
    'Uganda-Kenya': 70
  }
}

function initializeEconomicState() {
  return {
    'US': 95,
    'China': 88,
    'India': 75,
    'Nigeria': 65,
    'Greece': 78,
    'Uganda': 60
  }
}

function initializeLSWPopulation() {
  return {
    'US': 12847,
    'China': 15632,
    'India': 18291,
    'Nigeria': 8794,
    'Greece': 3421,
    'Uganda': 2156
  }
}

function initializePoliticalTensions() {
  return {
    'Global': 45,
    'Asia-Pacific': 65,
    'Europe': 35,
    'Africa': 40,
    'Americas': 30
  }
}

function startWorldSimulation() {
  // Real-time world simulation
  setInterval(() => {
    const state = useGameStore.getState()
    
    // Decrease countdown
    useGameStore.setState({
      worldState: {
        ...state.worldState,
        day: state.worldState.day - 1
      }
    })
    
    // Generate random world events
    if (Math.random() < 0.3) {
      generateWorldEvent()
    }
    
    // Update political tensions
    updatePoliticalTensions()
    
    // Generate investigations
    if (Math.random() < 0.4) {
      generateInvestigation()
    }
    
  }, 2000) // Every 2 seconds for demo
}

function generateWorldEvent() {
  const events = [
    {
      id: 'evt-' + Date.now(),
      title: 'Chinese Naval Buildup',
      description: 'Satellite imagery shows Chinese LSW naval exercises in disputed waters',
      location: 'South China Sea',
      severity: 'high',
      affectedFactions: ['US', 'China', 'India'],
      consequences: { 'US-China': -5, 'tension': +10 }
    },
    {
      id: 'evt-' + Date.now(),
      title: 'Ancient Technology Discovery',
      description: 'Archaeological team in Greece reports alien artifact discovery',
      location: 'Athens, Greece', 
      severity: 'critical',
      affectedFactions: ['Greece', 'US', 'EU'],
      consequences: { 'Greece-power': +15, 'ancient-tech': +1 }
    },
    {
      id: 'evt-' + Date.now(),
      title: 'African Unity Summit',
      description: 'Nigeria calls emergency African Union meeting on LSW cooperation',
      location: 'Lagos, Nigeria',
      severity: 'medium',
      affectedFactions: ['Nigeria', 'Uganda', 'Africa'],
      consequences: { 'Africa-unity': +10, 'continental-authority': +5 }
    }
  ]
  
  const event = events[Math.floor(Math.random() * events.length)]
  
  const state = useGameStore.getState()
  useGameStore.setState({
    worldState: {
      ...state.worldState,
      crisisEvents: [...state.worldState.crisisEvents, event].slice(-10) // Keep last 10
    }
  })
}

function updatePoliticalTensions() {
  const state = useGameStore.getState()
  const tensions = { ...state.worldState.politicalTensions }
  
  // Random tension fluctuations
  Object.keys(tensions).forEach(region => {
    tensions[region] += (Math.random() - 0.5) * 2 // ±1 tension change
    tensions[region] = Math.max(0, Math.min(100, tensions[region]))
  })
  
  useGameStore.setState({
    worldState: {
      ...state.worldState,
      politicalTensions: tensions
    }
  })
}

function generateInvestigation() {
  const investigations = [
    {
      id: 'inv-' + Date.now(),
      title: 'Corporate Espionage Ring',
      description: 'Multinational corporation using LSW employees for industrial espionage',
      location: { country: 'United States', city: 'New York' },
      difficulty: 7,
      priority: 'high' as const,
      timeLimit: 72,
      progress: 0,
      assignedCharacters: [],
      rewards: ['Corporate Intelligence', 'Technology Access', 'Economic Advantage'],
      consequences: ['Corporate Lawsuit Risk', 'Media Attention', 'Government Oversight']
    },
    {
      id: 'inv-' + Date.now(),
      title: 'Ancient Artifact Theft',
      description: 'Sacred artifacts with LSW enhancement properties stolen from Greek temple',
      location: { country: 'Greece', city: 'Athens' },
      difficulty: 8,
      priority: 'critical' as const,
      timeLimit: 24,
      progress: 0,
      assignedCharacters: [],
      rewards: ['Ancient Technology', 'Mystical Enhancement', 'Archaeological Authority'],
      consequences: ['Cultural Sensitivity Issues', 'Religious Opposition', 'Academic Controversy']
    },
    {
      id: 'inv-' + Date.now(),
      title: 'Genetic Research Sabotage',
      description: 'Ugandan genetic research facility suffers suspicious equipment failures',
      location: { country: 'Uganda', city: 'Kampala' },
      difficulty: 6,
      priority: 'medium' as const,
      timeLimit: 96,
      progress: 0,
      assignedCharacters: [],
      rewards: ['Genetic Research', 'Medical Technology', 'African Authority'],
      consequences: ['Scientific Setback', 'Continental Politics', 'Research Delays']
    }
  ]
  
  const investigation = investigations[Math.floor(Math.random() * investigations.length)]
  
  const state = useGameStore.getState()
  useGameStore.setState({
    investigations: [...state.investigations, investigation]
  })
}
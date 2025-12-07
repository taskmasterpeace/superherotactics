// Game Data Loader - Loads all CSV data into memory for fast access
import Papa from 'papaparse'

export interface GameData {
  powers: any[]
  equipment: any[]
  countries: any[]
  cities: any[]
  skills: any[]
  investigations: any[]
  characters: any[]
  factionRelations: any[]
}

let gameData: GameData = {
  powers: [],
  equipment: [],
  countries: [],
  cities: [],
  skills: [],
  investigations: [],
  characters: [],
  factionRelations: []
}

export async function initializeGameData(): Promise<GameData> {
  try {
    console.log('🎮 Loading SuperHero Tactics game data...')
    
    // In a real implementation, these would load from your CSV files
    // For now, we'll use sample data based on your systems
    
    gameData.powers = generateSamplePowers()
    gameData.equipment = generateSampleEquipment()
    gameData.countries = generateSampleCountries()
    gameData.cities = generateSampleCities()
    gameData.skills = generateSampleSkills()
    gameData.investigations = generateSampleInvestigations()
    gameData.characters = generateSampleCharacters()
    gameData.factionRelations = generateFactionRelations()
    
    console.log('✅ Game data loaded successfully')
    console.log(`📊 Loaded: ${gameData.powers.length} powers, ${gameData.countries.length} countries, ${gameData.cities.length} cities`)
    
    return gameData
  } catch (error) {
    console.error('❌ Error loading game data:', error)
    throw error
  }
}

export function getGameData(): GameData {
  return gameData
}

// Sample data generators based on your CSV systems
function generateSamplePowers() {
  return [
    {
      id: 'POW_001',
      name: 'Super Strength',
      category: 'Physical',
      description: 'Enhanced physical power beyond normal human limits',
      combatBonus: '+20 melee damage',
      apCost: 2,
      tags: ['strength', 'physical', 'melee']
    },
    {
      id: 'POW_002', 
      name: 'Super Speed',
      category: 'Physical',
      description: 'Enhanced movement and reaction speed',
      combatBonus: '+30 initiative, multiple actions',
      apCost: 2,
      tags: ['speed', 'movement', 'initiative']
    },
    {
      id: 'POW_003',
      name: 'Flight',
      category: 'Physical', 
      description: 'Aerial mobility and altitude advantage',
      combatBonus: '+20 mobility, altitude tactics',
      apCost: 1,
      tags: ['flight', 'mobility', 'altitude']
    },
    {
      id: 'POW_006',
      name: 'Psychic Persuasion',
      category: 'Mental',
      description: 'Influence thoughts and emotions of others', 
      combatBonus: 'Mind control, bypass armor',
      apCost: 3,
      tags: ['psychic', 'mental', 'control']
    },
    {
      id: 'POW_008',
      name: 'Time Travel',
      category: 'Temporal',
      description: 'Travel to past or future timelines',
      combatBonus: 'Timeline manipulation, precognition',
      apCost: 8,
      tags: ['time', 'temporal', 'manipulation']
    }
  ]
}

function generateSampleEquipment() {
  return [
    {
      id: 'EQ_001',
      name: 'Vibranium Shield',
      category: 'Defense',
      description: 'Alien metal shield with energy absorption',
      stats: 'DR: Special, Throwable weapon',
      cost: 'Ultra High',
      tags: ['shield', 'vibranium', 'defense']
    },
    {
      id: 'EQ_002',
      name: 'Combat Armor',
      category: 'Defense', 
      description: 'Military-grade body armor',
      stats: 'DR: 18, AP: 85',
      cost: 'High',
      tags: ['armor', 'military', 'protection']
    },
    {
      id: 'EQ_003',
      name: 'Energy Rifle',
      category: 'Weapon',
      description: 'Advanced energy weapon with beam projection',
      stats: 'Damage: Variable energy, Range: 50',
      cost: 'Very High',
      tags: ['energy', 'rifle', 'weapon']
    }
  ]
}

function generateSampleCountries() {
  return [
    {
      id: 'US',
      name: 'United States',
      flag: '🇺🇸',
      region: 'North America',
      powerLevel: 'superpower',
      stats: {
        military: 95,
        technology: 92,
        economy: 88,
        education: 85,
        lswActivity: 78
      },
      relations: { China: -30, India: 65, Nigeria: 25 }
    },
    {
      id: 'GR',
      name: 'Greece', 
      flag: '🇬🇷',
      region: 'Europe',
      powerLevel: 'major',
      stats: {
        military: 85,
        technology: 90,
        economy: 75,
        education: 88,
        lswActivity: 92
      },
      relations: { US: 75, Turkey: -45, Cyprus: 85 }
    },
    {
      id: 'UG',
      name: 'Uganda',
      flag: '🇺🇬', 
      region: 'Africa',
      powerLevel: 'major',
      stats: {
        military: 70,
        technology: 85,
        economy: 80,
        education: 75,
        lswActivity: 95
      },
      relations: { Nigeria: 85, Kenya: 70, Sudan: -20 }
    }
  ]
}

function generateSampleCities() {
  return [
    {
      id: 'athens',
      name: 'Athens',
      country: 'Greece',
      type: 'political',
      population: 3700000,
      crime: 25,
      safety: 75,
      description: 'Ancient capital with mystical LSW research centers'
    },
    {
      id: 'kampala',
      name: 'Kampala',
      country: 'Uganda', 
      type: 'political',
      population: 3500000,
      crime: 45,
      safety: 55,
      description: 'Continental capital with genetic research facilities'
    }
  ]
}

function generateSampleSkills() {
  return [
    { id: 'martial-arts', name: 'Martial Arts', bonus: '+2CS unarmed combat' },
    { id: 'shooting', name: 'Shooting', bonus: '+2CS ranged weapons' },
    { id: 'leadership', name: 'Leadership', bonus: '+2CS team coordination' },
    { id: 'detective', name: 'Detective', bonus: '+3CS investigation' }
  ]
}

function generateSampleInvestigations() {
  return [
    {
      id: 'inv-001',
      title: 'Corporate Sabotage Investigation',
      description: 'Industrial accidents increasing at suspicious rate',
      location: { country: 'United States', city: 'Detroit' },
      difficulty: 6,
      priority: 'high' as const,
      timeLimit: 48,
      progress: 35,
      assignedCharacters: []
    }
  ]
}

function generateSampleCharacters() {
  return [
    {
      id: 'char-001',
      name: 'Captain America',
      realName: 'Steve Rogers',
      stats: { MEL: 65, AGL: 55, STR: 60, STA: 70, INT: 45, INS: 50, CON: 65 },
      threatLevel: 'THREAT_2' as const,
      origin: 'Altered Human',
      powers: ['Enhanced Physiology', 'Super Durability'],
      equipment: ['Vibranium Shield', 'Tactical Armor'],
      skills: ['Leadership', 'Shield Combat'],
      health: { current: 70, maximum: 70 },
      status: 'ready' as const,
      location: { country: 'United States', city: 'Washington DC' },
      career: { category: 'Military', rank: 4 },
      experience: 2500,
      relationships: {}
    }
  ]
}

function generateFactionRelations() {
  return [
    { factionA: 'US', factionB: 'China', relation: -30, status: 'Cold War Rivals' },
    { factionA: 'US', factionB: 'India', relation: 65, status: 'Cautious Alliance' },
    { factionA: 'India', factionB: 'Nigeria', relation: 85, status: 'South-South Cooperation' },
    { factionA: 'China', factionB: 'Nigeria', relation: 45, status: 'Economic Partnership' }
  ]
}
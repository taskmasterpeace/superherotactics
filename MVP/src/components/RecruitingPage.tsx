import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { ArrowLeft, Users, Check, Star, Shield, Zap, DollarSign, GraduationCap, MapPin, ChevronRight } from 'lucide-react'
import { getCountryByName, getEducationLevel } from '../data/worldData'

// Character generation data
const FIRST_NAMES_BY_REGION: Record<string, string[]> = {
  US: ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Ashley', 'William', 'Amanda'],
  India: ['Arjun', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Deepa', 'Raj', 'Kavita', 'Sanjay', 'Meera'],
  China: ['Wei', 'Mei', 'Jun', 'Lin', 'Chen', 'Xiu', 'Ming', 'Yan', 'Feng', 'Hui'],
  Nigeria: ['Chidi', 'Amara', 'Emeka', 'Adaeze', 'Obinna', 'Ngozi', 'Chukwu', 'Nneka', 'Ifeanyi', 'Chioma'],
  Japan: ['Takeshi', 'Yuki', 'Kenji', 'Sakura', 'Hiroshi', 'Aiko', 'Ryota', 'Hana', 'Daisuke', 'Mika'],
  Germany: ['Hans', 'Greta', 'Klaus', 'Heidi', 'Wolfgang', 'Ingrid', 'Fritz', 'Helga', 'Otto', 'Liesel'],
  Brazil: ['Carlos', 'Maria', 'Pedro', 'Ana', 'Rafael', 'Juliana', 'Lucas', 'Fernanda', 'Gustavo', 'Camila'],
  UK: ['James', 'Emma', 'Oliver', 'Charlotte', 'Harry', 'Sophie', 'George', 'Olivia', 'William', 'Amelia'],
  Russia: ['Alexei', 'Natasha', 'Dmitri', 'Olga', 'Ivan', 'Anya', 'Boris', 'Svetlana', 'Nikolai', 'Katya'],
  default: ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Reese', 'Drew']
}

const LAST_NAMES_BY_REGION: Record<string, string[]> = {
  US: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor'],
  India: ['Patel', 'Sharma', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Rao', 'Verma', 'Mehta', 'Joshi'],
  China: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou'],
  Nigeria: ['Okonkwo', 'Adeyemi', 'Okafor', 'Nwosu', 'Eze', 'Abubakar', 'Bello', 'Ibrahim', 'Obi', 'Adeola'],
  Japan: ['Tanaka', 'Yamamoto', 'Suzuki', 'Watanabe', 'Sato', 'Nakamura', 'Kobayashi', 'Takahashi', 'Ito', 'Saito'],
  Germany: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'],
  Brazil: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'],
  UK: ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Johnson'],
  Russia: ['Ivanov', 'Petrov', 'Sidorov', 'Smirnov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Volkov', 'Fedorov', 'Morozov'],
  default: ['Walker', 'Stone', 'Fox', 'Cross', 'Grant', 'Chase', 'Storm', 'Frost', 'Black', 'Grey']
}

const POWERS = [
  { name: 'Super Strength', emoji: '💪', threatLevel: 'THREAT_2' },
  { name: 'Flight', emoji: '🦅', threatLevel: 'THREAT_2' },
  { name: 'Super Speed', emoji: '⚡', threatLevel: 'THREAT_3' },
  { name: 'Telepathy', emoji: '🧠', threatLevel: 'THREAT_3' },
  { name: 'Energy Projection', emoji: '✨', threatLevel: 'THREAT_3' },
  { name: 'Invisibility', emoji: '👻', threatLevel: 'THREAT_2' },
  { name: 'Enhanced Senses', emoji: '👁️', threatLevel: 'THREAT_1' },
  { name: 'Healing Factor', emoji: '💚', threatLevel: 'THREAT_2' },
  { name: 'Martial Arts Mastery', emoji: '🥋', threatLevel: 'THREAT_1' },
  { name: 'Tech Genius', emoji: '🔧', threatLevel: 'THREAT_1' },
  { name: 'Elemental Control', emoji: '🔥', threatLevel: 'THREAT_3' },
  { name: 'Shape Shifting', emoji: '🎭', threatLevel: 'THREAT_2' },
  { name: 'Super Durability', emoji: '🛡️', threatLevel: 'THREAT_2' },
  { name: 'Weapon Mastery', emoji: '⚔️', threatLevel: 'THREAT_1' },
  { name: 'Stealth Expert', emoji: '🥷', threatLevel: 'THREAT_1' },
]

const ORIGINS = ['Skilled Human', 'Altered Human', 'Tech Enhanced', 'Mutant', 'Mystic', 'Alien']
const CAREERS = ['Military', 'Law Enforcement', 'Medical', 'Technical', 'Academic', 'Criminal', 'Civilian']

interface GeneratedCharacter {
  id: string
  name: string
  alias: string
  age: number
  gender: string
  identity: 'Secret' | 'Public' | 'Unknown'
  stats: { MEL: number; AGL: number; STR: number; STA: number; INT: number; INS: number; CON: number }
  threatLevel: string
  origin: string
  powers: { name: string; emoji: string; threatLevel: string }[]
  career: string
  careerRank: number
  education: string
  weeklyPay: number
  birthplace: string
  health: { current: number; maximum: number }
}

function generateCharacter(country: string, index: number): GeneratedCharacter {
  // Determine region for names
  const region =
    ['United States', 'Canada'].includes(country) ? 'US' :
    ['India', 'Nepal', 'Bangladesh'].includes(country) ? 'India' :
    ['China', 'Taiwan', 'Singapore'].includes(country) ? 'China' :
    ['Nigeria', 'Ghana', 'Kenya'].includes(country) ? 'Nigeria' :
    ['Japan'].includes(country) ? 'Japan' :
    ['Germany', 'Austria'].includes(country) ? 'Germany' :
    ['Brazil', 'Argentina'].includes(country) ? 'Brazil' :
    ['United Kingdom', 'Australia'].includes(country) ? 'UK' :
    ['Russia', 'Ukraine'].includes(country) ? 'Russia' :
    'default'

  const firstNames = FIRST_NAMES_BY_REGION[region] || FIRST_NAMES_BY_REGION.default
  const lastNames = LAST_NAMES_BY_REGION[region] || LAST_NAMES_BY_REGION.default

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const gender = Math.random() > 0.5 ? 'Male' : 'Female'

  // Generate alias
  const aliasPrefix = ['Shadow', 'Silver', 'Iron', 'Ghost', 'Storm', 'Night', 'Red', 'Blue', 'Gold', 'Dark']
  const aliasSuffix = ['Wolf', 'Hawk', 'Phoenix', 'Tiger', 'Dragon', 'Knight', 'Rider', 'Hunter', 'Guardian', 'Warrior']
  const alias = `${aliasPrefix[Math.floor(Math.random() * aliasPrefix.length)]} ${aliasSuffix[Math.floor(Math.random() * aliasSuffix.length)]}`

  // Generate stats based on threat level (index determines tier)
  const threatTier = index === 0 ? 3 : index < 3 ? 2 : 1
  const baseStats = threatTier === 3 ? 50 : threatTier === 2 ? 40 : 30
  const variance = 15

  const generateStat = () => Math.min(100, Math.max(10, baseStats + Math.floor(Math.random() * variance * 2) - variance))

  const stats = {
    MEL: generateStat(),
    AGL: generateStat(),
    STR: generateStat(),
    STA: generateStat(),
    INT: generateStat(),
    INS: generateStat(),
    CON: generateStat()
  }

  // Generate powers (more powers for higher threat)
  const numPowers = threatTier === 3 ? 3 : threatTier === 2 ? 2 : 1
  const shuffledPowers = [...POWERS].sort(() => Math.random() - 0.5)
  const selectedPowers = shuffledPowers.slice(0, numPowers)

  // Calculate weekly pay based on threat level
  const basePay = threatTier === 3 ? 3000 : threatTier === 2 ? 2000 : 1000
  const weeklyPay = basePay + Math.floor(Math.random() * 500)

  // Career and education
  const career = CAREERS[Math.floor(Math.random() * CAREERS.length)]
  const careerRank = Math.ceil(Math.random() * 5)
  const educationLevels = ['None', 'Primary', 'Secondary', 'Trade', 'University', 'Advanced', 'Elite']
  const education = educationLevels[Math.min(educationLevels.length - 1, Math.floor(Math.random() * (threatTier + 3)))]

  const maxHealth = 50 + stats.STA

  return {
    id: `char-${Date.now()}-${index}`,
    name: `${firstName} ${lastName}`,
    alias,
    age: 20 + Math.floor(Math.random() * 25),
    gender,
    identity: ['Secret', 'Public', 'Unknown'][Math.floor(Math.random() * 3)] as 'Secret' | 'Public' | 'Unknown',
    stats,
    threatLevel: `THREAT_${threatTier}`,
    origin: ORIGINS[Math.floor(Math.random() * ORIGINS.length)],
    powers: selectedPowers,
    career,
    careerRank,
    education,
    weeklyPay,
    birthplace: country,
    health: { current: maxHealth, maximum: maxHealth }
  }
}

export default function RecruitingPage() {
  const { selectedCountry, selectedCity, setGamePhase, setCurrentView } = useGameStore()
  const [selectedRecruits, setSelectedRecruits] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'numbers' | 'stars'>('numbers')
  const [powerMode, setPowerMode] = useState<'text' | 'emoji'>('text')

  const country = getCountryByName(selectedCountry)

  // Generate 5 recruits
  const recruits = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => generateCharacter(selectedCountry, i))
  }, [selectedCountry])

  const toggleRecruit = (id: string) => {
    const newSelected = new Set(selectedRecruits)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else if (newSelected.size < 4) {
      newSelected.add(id)
    }
    setSelectedRecruits(newSelected)
  }

  const handleConfirmTeam = () => {
    if (selectedRecruits.size >= 2) {
      // Add selected recruits to game store
      const selectedChars = recruits.filter(r => selectedRecruits.has(r.id)).map(r => ({
        id: r.id,
        name: r.alias,
        realName: r.name,
        stats: r.stats,
        threatLevel: r.threatLevel,
        origin: r.origin,
        powers: r.powers.map(p => p.name),
        equipment: [],
        health: r.health,
        status: 'ready' as const,
        location: { country: selectedCountry, city: selectedCity },
        injuries: [],
        medicalHistory: [],
        recoveryTime: 0
      }))

      // Update store with new characters
      useGameStore.setState({
        characters: selectedChars,
        gamePhase: 'playing',
        currentView: 'world-map'
      })
    }
  }

  // Convert stat to stars
  const statToStars = (value: number) => {
    const stars = Math.round(value / 20)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setGamePhase('city-selection')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to City
        </button>

        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Recruit Your Team
          </h1>
          <p className="text-gray-400 mt-1">
            Select 2-4 operatives for {selectedCity}, {selectedCountry}
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Step 3 of 3</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            {country?.flag} Selected: {selectedRecruits.size}/4
          </div>
        </div>
      </div>

      {/* View Mode Toggles */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          <button
            className={`px-3 py-1 rounded ${viewMode === 'numbers' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setViewMode('numbers')}
          >
            123
          </button>
          <button
            className={`px-3 py-1 rounded ${viewMode === 'stars' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setViewMode('stars')}
          >
            ★★★
          </button>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          <button
            className={`px-3 py-1 rounded ${powerMode === 'text' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            onClick={() => setPowerMode('text')}
          >
            Text
          </button>
          <button
            className={`px-3 py-1 rounded ${powerMode === 'emoji' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            onClick={() => setPowerMode('emoji')}
          >
            🔥
          </button>
        </div>
      </div>

      {/* Recruits Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {recruits.map((recruit, index) => (
            <motion.div
              key={recruit.id}
              className={`bg-gray-800/80 rounded-xl border-2 transition-all cursor-pointer ${
                selectedRecruits.has(recruit.id)
                  ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
              onClick={() => toggleRecruit(recruit.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Selection Badge */}
              {selectedRecruits.has(recruit.id) && (
                <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                  <Check size={16} className="text-gray-900" />
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="text-center mb-3">
                  <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-1 ${
                    recruit.threatLevel === 'THREAT_3' ? 'bg-red-600' :
                    recruit.threatLevel === 'THREAT_2' ? 'bg-orange-600' :
                    'bg-blue-600'
                  }`}>
                    {recruit.threatLevel.replace('_', ' ')}
                  </div>
                  <h3 className="font-bold text-lg text-white">{recruit.alias}</h3>
                  <p className="text-sm text-gray-400">{recruit.name}</p>
                  <p className="text-xs text-gray-500">
                    Age: {recruit.age} • {recruit.gender} • {recruit.identity}
                  </p>
                </div>

                {/* Stats */}
                <div className="mb-3 text-xs">
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(recruit.stats).map(([stat, value]) => (
                      <div key={stat} className="flex justify-between">
                        <span className="text-gray-400">{stat}:</span>
                        <span className={`font-mono ${value >= 60 ? 'text-green-400' : value >= 40 ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {viewMode === 'stars' ? statToStars(value) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Powers */}
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Powers:</div>
                  <div className="flex flex-wrap gap-1">
                    {recruit.powers.map(power => (
                      <span key={power.name} className="px-2 py-0.5 bg-purple-600/30 rounded text-xs text-purple-300">
                        {powerMode === 'emoji' ? power.emoji : power.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} /> {recruit.birthplace}
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap size={12} /> {recruit.education}
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield size={12} /> {recruit.career} (Rank {recruit.careerRank})
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={12} /> ${recruit.weeklyPay.toLocaleString()}/week
                  </div>
                </div>

                {/* Origin */}
                <div className="mt-2 text-center">
                  <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                    {recruit.origin}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div>
          <div className="text-sm text-gray-400">Team Budget (Weekly):</div>
          <div className="text-xl font-bold text-yellow-400">
            ${recruits.filter(r => selectedRecruits.has(r.id)).reduce((sum, r) => sum + r.weeklyPay, 0).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {selectedRecruits.size < 2 && 'Select at least 2 operatives'}
            {selectedRecruits.size === 2 && 'Minimum team ready!'}
            {selectedRecruits.size === 3 && 'Good team size!'}
            {selectedRecruits.size === 4 && 'Maximum team selected!'}
          </div>
          <motion.button
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 ${
              selectedRecruits.size >= 2
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleConfirmTeam}
            disabled={selectedRecruits.size < 2}
            whileHover={selectedRecruits.size >= 2 ? { scale: 1.05 } : {}}
            whileTap={selectedRecruits.size >= 2 ? { scale: 0.95 } : {}}
          >
            BEGIN OPERATIONS
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

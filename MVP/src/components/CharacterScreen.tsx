import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import toast from 'react-hot-toast'
import {
  User, Shield, Zap, Brain, Heart, Target, Users, MapPin,
  Briefcase, GraduationCap, Swords, Star, Hash, ChevronLeft,
  Activity, Eye, Award, Book, Globe, AlertTriangle, Package,
  UserPlus, Crosshair, Dumbbell, Scale, Wind, Sparkles, Edit3, X,
  RefreshCw, Dice6
} from 'lucide-react'
import { generateCharacter } from '../data/characterGeneration'

// Full Character Interface based on Character_Schema_Complete.md
interface FullCharacter {
  // Identity
  id: string
  character_name: string
  alias?: string
  realName?: string
  nationality: string
  faction: string
  origin_type: string
  threat_level: string
  age: number
  gender?: string

  // Primary Stats
  stats: {
    MEL: number
    AGL: number
    STR: number
    STA: number
    INT: number
    INS: number
    CON: number
  }

  // Derived Stats (calculated)
  health: { current: number; maximum: number }
  initiative?: number
  karma?: number
  dodge_melee?: number
  dodge_ranged?: number
  movement?: number
  carry_cap?: number

  // Threat Assessment
  pcf?: number
  stam?: number
  spam?: number

  // Education & Career
  career_cat?: number
  career_rank?: number
  current_job?: string
  education?: string

  // Powers
  powers: Array<{
    name: string
    level?: 'Low' | 'High'
    rank?: number
  } | string>

  // Skills
  skills?: string[]

  // Talents
  talents?: string[]

  // Equipment
  equipment: string[]
  weapon_1?: string
  weapon_2?: string
  armor?: string

  // Personality
  personality_type?: number
  personality_traits?: string

  // Weaknesses
  weaknesses?: string[]

  // Contacts
  contacts?: Array<{
    name: string
    relationship: string
    usefulness: string
    trust_level: number
  }>

  // Background
  appearance?: string
  backstory?: string
  motivations?: string
  reputation?: number

  // Resources
  resources?: string
  fame?: number
  infamy?: number
  income_source?: string

  // World Position
  location: {
    country: string
    city: string
    location_type?: string
  }
  home_base?: string
  travel_status?: string

  // Faction Relations
  standing_us?: number
  standing_india?: number
  standing_china?: number
  standing_nigeria?: number
  wanted_level?: Record<string, { wanted: boolean; level: number; crimes: string[] }>

  // Status
  status: string
  injuries?: any[]
  medicalHistory?: any[]
  recoveryTime?: number
  experience?: number
}

// Stat rank names based on value
const getStatRank = (value: number): string => {
  if (value <= 5) return 'Feeble'
  if (value <= 10) return 'Poor'
  if (value <= 15) return 'Good'
  if (value <= 25) return 'Excellent'
  if (value <= 35) return 'Remarkable'
  if (value <= 50) return 'Incredible'
  if (value <= 75) return 'Amazing'
  if (value <= 100) return 'Monstrous'
  if (value <= 150) return 'Unearthly'
  return 'Beyond'
}

// Convert stat to stars (5 star scale)
const getStars = (value: number, max: number = 100): string => {
  const ratio = Math.min(value / max, 1)
  const fullStars = Math.floor(ratio * 5)
  const hasHalf = ratio * 5 - fullStars >= 0.5
  let stars = ''
  for (let i = 0; i < fullStars; i++) stars += '★'
  if (hasHalf && fullStars < 5) stars += '☆'
  while (stars.length < 5) stars += '○'
  return stars
}

// Origin type mapping
const ORIGIN_TYPES: Record<number | string, string> = {
  1: 'Skilled Human',
  2: 'Altered Human',
  3: 'Mutant',
  4: 'Tech Enhancement',
  5: 'Mystic',
  6: 'Alien',
  7: 'Cosmic',
  8: 'Divine',
  9: 'Construct',
  'Skilled Human': 'Skilled Human',
  'Altered Human': 'Altered Human',
  'Time Enhanced': 'Time Enhanced',
  'Mutant': 'Mutant',
  'Tech': 'Tech Enhancement',
  'Mystic': 'Mystic',
  'Alien': 'Alien',
  'Cosmic': 'Cosmic',
  'Divine': 'Divine',
  'Robot': 'Construct'
}

// Career categories
const CAREER_CATEGORIES: Record<number, string> = {
  1: 'Medical & Life Sciences',
  2: 'Visual & Performance Arts',
  3: 'Liberal Arts',
  4: 'Engineering/Tech',
  5: 'Business',
  6: 'Psychology',
  7: 'Physical/Practical'
}

// Resource levels
const RESOURCE_LEVELS = ['Poverty', 'Low', 'Medium', 'High', 'Wealthy', 'Elite']

// Tab configuration
type TabId = 'identity' | 'stats' | 'powers' | 'skills' | 'equipment' | 'background' | 'world' | 'faction'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'identity', label: 'Identity', icon: <User size={18} /> },
  { id: 'stats', label: 'Stats', icon: <Activity size={18} /> },
  { id: 'powers', label: 'Powers', icon: <Zap size={18} /> },
  { id: 'skills', label: 'Skills', icon: <Award size={18} /> },
  { id: 'equipment', label: 'Equipment', icon: <Package size={18} /> },
  { id: 'background', label: 'Background', icon: <Book size={18} /> },
  { id: 'world', label: 'World', icon: <Globe size={18} /> },
  { id: 'faction', label: 'Faction', icon: <Users size={18} /> }
]

export default function CharacterScreen() {
  const { characters, setCurrentView, addCharacter, updateCharacter } = useGameStore()
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    characters.length > 0 ? characters[0].id : null
  )
  const [activeTab, setActiveTab] = useState<TabId>('identity')
  const [displayMode, setDisplayMode] = useState<'numbers' | 'stars'>('numbers')
  const [equipmentTab, setEquipmentTab] = useState<'ready' | 'personal' | 'container'>('ready')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const selectedCharacter = useMemo(() => {
    const char = characters.find(c => c.id === selectedCharacterId)
    if (!char) return null

    // Convert to FullCharacter format with derived stats
    const fullChar: FullCharacter = {
      ...char,
      character_name: char.name,
      origin_type: char.origin || 'Unknown',
      nationality: char.location?.country || 'Unknown',
      faction: 'US', // Default
      age: char.age || 30,
      initiative: Math.floor((char.stats.AGL + char.stats.INS) / 2),
      karma: Math.floor((char.stats.INT + char.stats.INS + char.stats.CON) / 3),
      movement: 6 + Math.floor(char.stats.AGL / 10),
      carry_cap: char.stats.STR * 10,
      powers: char.powers?.map((p: string) => typeof p === 'string' ? { name: p, level: 'High' as const } : p) || []
    }
    return fullChar
  }, [selectedCharacterId, characters])

  const handleBack = () => {
    setCurrentView('world-map')
    toast.info('Returning to World Map')
  }

  const handleGenerateRandom = () => {
    const newChar = generateCharacter()
    addCharacter(newChar)
    setSelectedCharacterId(newChar.id)
    toast.success(`Generated: ${newChar.name}`)
  }

  return (
    <div className="h-full flex bg-gray-900">
      {/* Character Roster Sidebar */}
      <motion.div
        className="w-72 bg-gray-900/95 border-r border-cyan-500/30 flex flex-col"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
              <Users size={20} />
              Team Roster
            </h2>
            <button
              onClick={handleBack}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Back to World Map"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {characters.filter(c => c.status === 'ready').length}/{characters.length} Ready
            </div>
            <button
              onClick={handleGenerateRandom}
              className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs font-medium transition-colors"
              title="Generate Random Character"
            >
              <Dice6 size={14} />
              Reroll
            </button>
          </div>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {characters.map((char, idx) => (
            <motion.button
              key={char.id}
              onClick={() => setSelectedCharacterId(char.id)}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                selectedCharacterId === char.id
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  char.status === 'ready' ? 'bg-green-600' :
                  char.status === 'busy' ? 'bg-yellow-600' :
                  char.status === 'injured' ? 'bg-orange-600' :
                  'bg-red-600'
                }`}>
                  {char.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{char.name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {char.origin} • T{char.threatLevel?.replace('THREAT_', '')}
                  </div>
                </div>
              </div>

              {/* Mini HP Bar */}
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  style={{ width: `${(char.health.current / char.health.maximum) * 100}%` }}
                />
              </div>
            </motion.button>
          ))}

          {/* Add Character Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full p-3 rounded-lg border border-dashed border-gray-600 text-gray-500 hover:border-cyan-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Add Character
          </button>
        </div>
      </motion.div>

      {/* Main Character Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCharacter ? (
          <>
            {/* Character Header */}
            <div className="bg-gray-800/80 border-b border-gray-700 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Portrait Placeholder */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-3xl font-bold">
                    {selectedCharacter.character_name.charAt(0)}
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {selectedCharacter.character_name}
                    </h1>
                    {selectedCharacter.alias && (
                      <div className="text-cyan-400 italic">"{selectedCharacter.alias}"</div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedCharacter.status === 'ready' ? 'bg-green-600' :
                        selectedCharacter.status === 'busy' ? 'bg-yellow-600' :
                        selectedCharacter.status === 'injured' ? 'bg-orange-600' :
                        'bg-red-600'
                      }`}>
                        {selectedCharacter.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-purple-600/50 border border-purple-400 rounded text-xs">
                        {selectedCharacter.origin_type}
                      </span>
                      <span className="px-2 py-1 bg-red-600/50 border border-red-400 rounded text-xs">
                        THREAT {selectedCharacter.threat_level?.replace('THREAT_', '')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6">
                  <QuickStat
                    icon={<Heart className="text-red-400" size={20} />}
                    label="Health"
                    value={`${selectedCharacter.health.current}/${selectedCharacter.health.maximum}`}
                    color="red"
                  />
                  <QuickStat
                    icon={<Sparkles className="text-purple-400" size={20} />}
                    label="Karma"
                    value={String(selectedCharacter.karma || 0)}
                    color="purple"
                  />
                  <QuickStat
                    icon={<Wind className="text-cyan-400" size={20} />}
                    label="Initiative"
                    value={String(selectedCharacter.initiative || 0)}
                    color="cyan"
                  />
                  <QuickStat
                    icon={<Star className="text-yellow-400" size={20} />}
                    label="XP"
                    value={String(selectedCharacter.experience || 0)}
                    color="yellow"
                  />
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-4 p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-2"
                    title="Edit Character"
                  >
                    <Edit3 size={18} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gray-800/50 border-b border-gray-700 px-4">
              <div className="flex items-center gap-1">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}

                {/* Display Mode Toggle */}
                <div className="ml-auto flex items-center gap-2 pr-2">
                  <button
                    onClick={() => setDisplayMode('numbers')}
                    className={`p-2 rounded ${displayMode === 'numbers' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    title="Number Mode"
                  >
                    <Hash size={16} />
                  </button>
                  <button
                    onClick={() => setDisplayMode('stars')}
                    className={`p-2 rounded ${displayMode === 'stars' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    title="Star Mode"
                  >
                    <Star size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === 'identity' && (
                    <IdentityTab character={selectedCharacter} displayMode={displayMode} />
                  )}
                  {activeTab === 'stats' && (
                    <StatsTab character={selectedCharacter} displayMode={displayMode} />
                  )}
                  {activeTab === 'powers' && (
                    <PowersTab character={selectedCharacter} />
                  )}
                  {activeTab === 'skills' && (
                    <SkillsTab character={selectedCharacter} />
                  )}
                  {activeTab === 'equipment' && (
                    <EquipmentTab
                      character={selectedCharacter}
                      equipmentTab={equipmentTab}
                      setEquipmentTab={setEquipmentTab}
                    />
                  )}
                  {activeTab === 'background' && (
                    <BackgroundTab character={selectedCharacter} />
                  )}
                  {activeTab === 'world' && (
                    <WorldTab character={selectedCharacter} />
                  )}
                  {activeTab === 'faction' && (
                    <FactionTab character={selectedCharacter} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <User size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl">Select a character from the roster</p>
            </div>
          </div>
        )}
      </div>

      {/* Character Creation Modal */}
      {showCreateModal && (
        <CharacterCreateModal
          onClose={() => setShowCreateModal(false)}
          onSave={(char) => {
            addCharacter(char)
            setShowCreateModal(false)
          }}
        />
      )}

      {/* Character Edit Modal */}
      {isEditing && selectedCharacter && (
        <CharacterEditModal
          character={selectedCharacter}
          onClose={() => setIsEditing(false)}
          onSave={(updates) => {
            updateCharacter(selectedCharacter.id, updates)
            setIsEditing(false)
          }}
        />
      )}
    </div>
  )
}

// Quick Stat Display
function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
      </div>
      <div className={`text-lg font-bold text-${color}-400`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

// IDENTITY TAB
function IdentityTab({ character, displayMode }: { character: FullCharacter; displayMode: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Info */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <User size={20} />
          Basic Information
        </h3>
        <div className="space-y-3">
          <InfoRow label="Character Name" value={character.character_name} />
          {character.alias && <InfoRow label="Alias" value={character.alias} />}
          {character.realName && <InfoRow label="Real Name" value={character.realName} />}
          <InfoRow label="Age" value={String(character.age)} />
          {character.gender && <InfoRow label="Gender" value={character.gender} />}
          <InfoRow label="Nationality" value={character.nationality} />
        </div>
      </div>

      {/* Classification */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
          <Shield size={20} />
          LSW Classification
        </h3>
        <div className="space-y-3">
          <InfoRow label="Origin Type" value={ORIGIN_TYPES[character.origin_type] || character.origin_type} highlight />
          <InfoRow
            label="Threat Level"
            value={character.threat_level?.replace('THREAT_', 'Level ') || 'Unknown'}
            highlight
            color="red"
          />
          <InfoRow label="Faction" value={character.faction} />
          <InfoRow label="Status" value={character.status.toUpperCase()} />
        </div>
      </div>

      {/* Threat Assessment */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 lg:col-span-2">
        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          LeFevre Threat Assessment
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <ThreatBox
            label="PCF"
            sublabel="Power Capability Factor"
            value={character.pcf || calculatePCF(character)}
          />
          <ThreatBox
            label="STAM"
            sublabel="Stability Assessment"
            value={character.stam || 50}
          />
          <ThreatBox
            label="SPAM"
            sublabel="Situational Matrix"
            value={character.spam || 50}
          />
        </div>
      </div>
    </div>
  )
}

function ThreatBox({ label, sublabel, value }: { label: string; sublabel: string; value: number }) {
  const color = value > 70 ? 'red' : value > 40 ? 'yellow' : 'green'
  return (
    <div className={`bg-gray-900/50 rounded-lg p-4 border border-${color}-500/30`}>
      <div className={`text-3xl font-bold text-${color}-400 mb-1`}>{value}</div>
      <div className="text-white font-semibold">{label}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </div>
  )
}

// STATS TAB
function StatsTab({ character, displayMode }: { character: FullCharacter; displayMode: string }) {
  const primaryStats = [
    { key: 'MEL', label: 'Melee', desc: 'Hand-to-hand combat', icon: <Swords size={16} /> },
    { key: 'AGL', label: 'Agility', desc: 'Reflexes, coordination', icon: <Wind size={16} /> },
    { key: 'STR', label: 'Strength', desc: 'Physical power', icon: <Dumbbell size={16} /> },
    { key: 'STA', label: 'Stamina', desc: 'Endurance, health', icon: <Heart size={16} /> },
    { key: 'INT', label: 'Intelligence', desc: 'Reasoning, tech', icon: <Brain size={16} /> },
    { key: 'INS', label: 'Instinct', desc: 'Intuition, awareness', icon: <Eye size={16} /> },
    { key: 'CON', label: 'Concentration', desc: 'Willpower, focus', icon: <Target size={16} /> }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Primary Stats */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Activity size={20} />
          Primary Statistics
        </h3>
        <div className="space-y-4">
          {primaryStats.map(stat => {
            const value = character.stats[stat.key as keyof typeof character.stats] || 0
            return (
              <div key={stat.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{stat.icon}</span>
                    <span className="font-semibold text-white">{stat.label}</span>
                    <span className="text-xs text-gray-500">({stat.key})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {displayMode === 'stars' ? (
                      <span className="text-yellow-400 font-mono">{getStars(value)}</span>
                    ) : (
                      <>
                        <span className="text-sm text-gray-400">{getStatRank(value)}</span>
                        <span className="text-lg font-bold text-cyan-400 w-12 text-right">{value}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all"
                    style={{ width: `${Math.min(value, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Derived Stats */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
          <Scale size={20} />
          Derived Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DerivedStatCard
            label="Health"
            value={character.health.maximum}
            formula="(STA×2) + STR"
            icon={<Heart className="text-red-400" size={20} />}
          />
          <DerivedStatCard
            label="Initiative"
            value={character.initiative || 0}
            formula="(AGL + INS) / 2"
            icon={<Wind className="text-cyan-400" size={20} />}
          />
          <DerivedStatCard
            label="Karma"
            value={character.karma || 0}
            formula="(INT + INS + CON) / 3"
            icon={<Sparkles className="text-purple-400" size={20} />}
          />
          <DerivedStatCard
            label="Movement"
            value={character.movement || 0}
            formula="6 + (AGL / 10)"
            icon={<Activity className="text-green-400" size={20} />}
            unit="sq"
          />
          <DerivedStatCard
            label="Carry Capacity"
            value={character.carry_cap || 0}
            formula="STR × 10"
            icon={<Package className="text-orange-400" size={20} />}
            unit="lbs"
          />
          <DerivedStatCard
            label="Dodge (Melee)"
            value={`+${Math.floor((character.stats.AGL + character.stats.INS) / 20)}`}
            formula="Lookup(AGL+INS)"
            icon={<Shield className="text-blue-400" size={20} />}
            unit="CS"
          />
        </div>
      </div>
    </div>
  )
}

function DerivedStatCard({ label, value, formula, icon, unit = '' }: {
  label: string; value: number | string; formula: string; icon: React.ReactNode; unit?: string
}) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}{unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}</div>
      <div className="text-xs text-gray-500 font-mono">{formula}</div>
    </div>
  )
}

// POWERS TAB
function PowersTab({ character }: { character: FullCharacter }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
          <Zap size={20} />
          LSW Powers ({character.powers.length}/6)
        </h3>

        {character.powers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {character.powers.map((power, idx) => {
              const powerData = typeof power === 'string' ? { name: power, level: 'High' as const } : power
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-purple-300 flex items-center gap-2">
                      <Zap size={16} className="text-yellow-400" />
                      {powerData.name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      powerData.level === 'High' ? 'bg-red-600' : 'bg-yellow-600'
                    }`}>
                      {powerData.level || 'Standard'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {getPowerDescription(powerData.name)}
                  </p>
                  {powerData.rank && (
                    <div className="mt-2 text-xs text-gray-500">
                      Power Rank: {powerData.rank}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Zap size={48} className="mx-auto mb-3 opacity-30" />
            <p>No powers - Skilled Human origin</p>
          </div>
        )}

        {/* Empty Slots */}
        {character.powers.length < 6 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 - character.powers.length }).map((_, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-dashed border-gray-600 text-center text-gray-600 text-sm"
              >
                Empty Slot
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// SKILLS TAB
function SkillsTab({ character }: { character: FullCharacter }) {
  const defaultSkills = ['Martial Arts', 'Detective', 'Stealth']
  const skills = character.skills || defaultSkills
  const talents = character.talents || ['Iron Will', 'Danger Sense']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Skills */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
          <Award size={20} />
          Skills ({skills.length}/5)
        </h3>
        <div className="space-y-2">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-600"
            >
              <span className="text-white font-medium">{skill}</span>
              <span className="text-green-400 font-bold">+2CS</span>
            </div>
          ))}
          {skills.length < 5 && (
            <button className="w-full p-3 rounded-lg border border-dashed border-gray-600 text-gray-500 hover:border-green-400 hover:text-green-400 transition-colors">
              + Add Skill
            </button>
          )}
        </div>
      </div>

      {/* Talents */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
          <Star size={20} />
          Talents ({talents.length}/3)
        </h3>
        <div className="space-y-2">
          {talents.map((talent, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-900/50 rounded-lg border border-gray-600"
            >
              <div className="font-medium text-yellow-300">{talent}</div>
              <div className="text-xs text-gray-500 mt-1">{getTalentDescription(talent)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Career */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 lg:col-span-2">
        <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
          <Briefcase size={20} />
          Education & Career
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoBox label="Education" value={character.education || 'University'} icon={<GraduationCap size={16} />} />
          <InfoBox label="Career Category" value={CAREER_CATEGORIES[character.career_cat || 7] || 'Physical/Practical'} icon={<Briefcase size={16} />} />
          <InfoBox label="Career Rank" value={`Rank ${character.career_rank || 3}`} icon={<Award size={16} />} />
          <InfoBox label="Current Job" value={character.current_job || 'Special Operative'} icon={<User size={16} />} />
        </div>
      </div>
    </div>
  )
}

// EQUIPMENT TAB
function EquipmentTab({ character, equipmentTab, setEquipmentTab }: {
  character: FullCharacter
  equipmentTab: 'ready' | 'personal' | 'container'
  setEquipmentTab: (tab: 'ready' | 'personal' | 'container') => void
}) {
  const equipment = character.equipment || []

  return (
    <div className="space-y-6">
      {/* Gear Tab Selector */}
      <div className="flex gap-2">
        {(['ready', 'personal', 'container'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setEquipmentTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              equipmentTab === tab
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Weapons */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <Crosshair size={20} />
          Weapons
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <WeaponSlot label="Primary" weapon={character.weapon_1 || equipment[0]} />
          <WeaponSlot label="Secondary" weapon={character.weapon_2 || equipment[1]} />
        </div>
      </div>

      {/* Armor */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
          <Shield size={20} />
          Armor
        </h3>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">{character.armor || 'Tactical Vest'}</div>
              <div className="text-xs text-gray-500">DR: 8 | Condition: 100%</div>
            </div>
            <div className="text-green-400 font-bold">Equipped</div>
          </div>
        </div>
      </div>

      {/* Gear Grid */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
          <Package size={20} />
          {equipmentTab.charAt(0).toUpperCase() + equipmentTab.slice(1)} Gear
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {equipment.map((item, idx) => (
            <div
              key={idx}
              className="aspect-square bg-gray-900/50 rounded-lg border border-gray-600 p-3 flex flex-col items-center justify-center text-center hover:border-cyan-400 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-1">{getItemEmoji(item)}</div>
              <div className="text-xs text-gray-300 truncate w-full">{item}</div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 9 - equipment.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="aspect-square bg-gray-900/30 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-2xl"
            >
              +
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WeaponSlot({ label, weapon }: { label: string; weapon?: string }) {
  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-600">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      {weapon ? (
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getItemEmoji(weapon)}</div>
          <div>
            <div className="font-medium text-white">{weapon}</div>
            <div className="text-xs text-gray-500">Dmg: 25 | Range: 6 | ACC: 70%</div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-2">Empty Slot</div>
      )}
    </div>
  )
}

// BACKGROUND TAB
function BackgroundTab({ character }: { character: FullCharacter }) {
  return (
    <div className="space-y-6">
      {/* Appearance */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-cyan-400 mb-4">Appearance</h3>
        <p className="text-gray-300">
          {character.appearance || 'A tall, athletic figure with a commanding presence. Wears tactical gear suited for combat operations.'}
        </p>
      </div>

      {/* Backstory */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-purple-400 mb-4">Backstory</h3>
        <p className="text-gray-300">
          {character.backstory || 'Origin story and background details would be displayed here. This character has a complex history involving their transformation into an LSW.'}
        </p>
      </div>

      {/* Motivations */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-green-400 mb-4">Motivations</h3>
        <p className="text-gray-300">
          {character.motivations || 'Driven by a strong sense of justice and duty to protect the innocent. Believes in using their powers for the greater good.'}
        </p>
      </div>

      {/* Personality & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">Personality</h3>
          <p className="text-gray-300">
            {character.personality_traits || 'Determined, strategic, protective of allies. Type: Protector (targets biggest threats first).'}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-bold text-red-400 mb-4">Weaknesses</h3>
          <div className="space-y-2">
            {(character.weaknesses || ['Protective of civilians', 'Limited ranged options']).map((w, idx) => (
              <div key={idx} className="p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-sm">
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// WORLD TAB
function WorldTab({ character }: { character: FullCharacter }) {
  return (
    <div className="space-y-6">
      {/* Current Location */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <MapPin size={20} />
          Current Location
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoBox label="Country" value={character.location.country} icon={<Globe size={16} />} />
          <InfoBox label="City" value={character.location.city} icon={<MapPin size={16} />} />
          <InfoBox label="Location Type" value={character.location.location_type || 'Headquarters'} icon={<Target size={16} />} />
          <InfoBox label="Travel Status" value={character.travel_status || 'Stationary'} icon={<Activity size={16} />} />
        </div>
      </div>

      {/* Resources */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
          <Star size={20} />
          Resources & Reputation
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoBox label="Resource Level" value={RESOURCE_LEVELS[character.resources ? parseInt(character.resources) : 3]} icon={<Award size={16} />} />
          <InfoBox label="Fame" value={`${character.fame || 50}/100`} icon={<Star size={16} />} />
          <InfoBox label="Infamy" value={`${character.infamy || 10}/100`} icon={<AlertTriangle size={16} />} />
          <InfoBox label="Income" value={character.income_source || 'Agency Salary'} icon={<Briefcase size={16} />} />
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
          <Users size={20} />
          Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(character.contacts || [
            { name: 'Agent Morrison', relationship: 'Handler', usefulness: 'Intel, Resources', trust_level: 4 },
            { name: 'Dr. Chen', relationship: 'Medical', usefulness: 'Healing, Research', trust_level: 3 },
            { name: 'Street Contact', relationship: 'Informant', usefulness: 'Street Info', trust_level: 2 }
          ]).map((contact, idx) => (
            <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-600">
              <div className="font-medium text-white">{contact.name}</div>
              <div className="text-xs text-cyan-400">{contact.relationship}</div>
              <div className="text-xs text-gray-500 mt-1">{contact.usefulness}</div>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < contact.trust_level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// FACTION TAB
function FactionTab({ character }: { character: FullCharacter }) {
  const factions = [
    { id: 'us', name: 'United States', standing: character.standing_us || 75, color: 'blue' },
    { id: 'india', name: 'India', standing: character.standing_india || 25, color: 'orange' },
    { id: 'china', name: 'China', standing: character.standing_china || -10, color: 'red' },
    { id: 'nigeria', name: 'Nigeria', standing: character.standing_nigeria || 50, color: 'green' }
  ]

  const getStandingLabel = (value: number) => {
    if (value <= -75) return 'Hostile'
    if (value <= -25) return 'Unfriendly'
    if (value <= 24) return 'Neutral'
    if (value <= 74) return 'Friendly'
    return 'Allied'
  }

  return (
    <div className="space-y-6">
      {/* Faction Relations */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
          <Globe size={20} />
          Faction Relations
        </h3>
        <div className="space-y-4">
          {factions.map(faction => (
            <div key={faction.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{faction.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    faction.standing >= 75 ? 'bg-green-600' :
                    faction.standing >= 25 ? 'bg-blue-600' :
                    faction.standing >= -24 ? 'bg-gray-600' :
                    faction.standing >= -74 ? 'bg-orange-600' :
                    'bg-red-600'
                  }`}>
                    {getStandingLabel(faction.standing)}
                  </span>
                  <span className="text-sm text-gray-400 w-12 text-right">{faction.standing}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
                <div
                  className={`absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-500`}
                />
                <div
                  className={`h-full transition-all ${
                    faction.standing >= 0
                      ? 'bg-green-500 ml-[50%]'
                      : 'bg-red-500 mr-[50%] float-right'
                  }`}
                  style={{
                    width: `${Math.abs(faction.standing) / 2}%`,
                    marginLeft: faction.standing >= 0 ? '50%' : undefined,
                    marginRight: faction.standing < 0 ? '50%' : undefined
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wanted Status */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          Legal Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {factions.map(faction => {
            const wanted = character.wanted_level?.[faction.id]
            return (
              <div
                key={faction.id}
                className={`p-4 rounded-lg border ${
                  wanted?.wanted
                    ? 'bg-red-900/30 border-red-500/50'
                    : 'bg-gray-900/50 border-gray-600'
                }`}
              >
                <div className="text-sm text-gray-400">{faction.name}</div>
                <div className={`font-bold ${wanted?.wanted ? 'text-red-400' : 'text-green-400'}`}>
                  {wanted?.wanted ? `WANTED (Level ${wanted.level})` : 'Clear'}
                </div>
                {wanted?.crimes && wanted.crimes.length > 0 && (
                  <div className="text-xs text-red-300 mt-1">
                    {wanted.crimes.join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Helper Components
function InfoRow({ label, value, highlight = false, color = 'cyan' }: {
  label: string; value: string; highlight?: boolean; color?: string
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
      <span className="text-gray-400">{label}</span>
      <span className={highlight ? `text-${color}-400 font-semibold` : 'text-white'}>
        {value}
      </span>
    </div>
  )
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-600">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-medium text-white">{value}</div>
    </div>
  )
}

// Helper Functions
function calculatePCF(character: FullCharacter): number {
  // Simplified PCF calculation
  const threatNum = parseInt(character.threat_level?.replace('THREAT_', '') || '1')
  return Math.min(100, threatNum * 20 + (character.powers.length * 5))
}

function getPowerDescription(powerName: string): string {
  const descriptions: Record<string, string> = {
    'Enhanced Physiology': 'Peak human capabilities enhanced beyond normal limits through biological modification.',
    'Super Durability': 'Resistance to physical damage and enhanced survivability in combat situations.',
    'Super Strength': 'Enhanced physical power enabling extraordinary lifting and combat capabilities.',
    'Flight': 'Aerial mobility providing tactical positioning and rapid transit advantages.',
    'Time Travel': 'Temporal manipulation allowing movement through different points in time.',
    'Temporal Manipulation': 'Advanced time control for tactical advantage including slowing or stopping time.',
    'Energy Projection': 'Ability to generate and project various forms of energy.',
    'Telepathy': 'Mental powers allowing communication and influence over other minds.',
    'Telekinesis': 'Ability to move objects with the power of the mind.'
  }
  return descriptions[powerName] || 'Advanced LSW capability with tactical applications.'
}

function getTalentDescription(talentName: string): string {
  const descriptions: Record<string, string> = {
    'Roll With Blow': 'Halve blunt/smashing damage by rolling with impacts.',
    'Block': 'Can parry incoming melee attacks.',
    'Escape Artist': 'Exit combat unseen when not observed.',
    'Iron Will': '+2CS vs interrogation and mental attacks.',
    'Danger Sense': 'Cannot be surprised by ambushes.',
    'Quick Draw': 'Draw weapon as a free action.',
    'Ambidextrous': 'No penalty for off-hand weapon use.',
    'Photographic Memory': 'Perfect recall of visual information.',
    'Speed Reader': 'Research tasks take half time.',
    'Linguist': 'Know additional languages.',
    'Contacts': 'Additional contact slots available.',
    'Resources': 'Higher starting wealth level.'
  }
  return descriptions[talentName] || 'Special ability providing unique combat or investigation benefits.'
}

function getItemEmoji(item: string): string {
  const emojis: Record<string, string> = {
    'Kinetic Shield': '🛡️',
    'Tactical Armor': '🦺',
    'Temporal Stabilizer': '⏰',
    'Pistol': '🔫',
    'Rifle': '🎯',
    'Medkit': '💉',
    'Grenade': '💣',
    'Radio': '📻',
    'Binoculars': '🔭',
    'Grapple Hook': '🪝'
  }

  // Check for partial matches
  for (const [key, emoji] of Object.entries(emojis)) {
    if (item.toLowerCase().includes(key.toLowerCase())) return emoji
  }

  // Default based on type
  if (item.toLowerCase().includes('armor') || item.toLowerCase().includes('shield')) return '🛡️'
  if (item.toLowerCase().includes('gun') || item.toLowerCase().includes('pistol') || item.toLowerCase().includes('rifle')) return '🔫'
  if (item.toLowerCase().includes('med') || item.toLowerCase().includes('heal')) return '💉'

  return '📦'
}

// CHARACTER CREATE MODAL
interface CharacterCreateModalProps {
  onClose: () => void
  onSave: (character: any) => void
}

function CharacterCreateModal({ onClose, onSave }: CharacterCreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    realName: '',
    alias: '',
    origin: 'Skilled Human',
    threatLevel: 'THREAT_1',
    age: 30,
    stats: { MEL: 50, AGL: 50, STR: 50, STA: 50, INT: 50, INS: 50, CON: 50 },
    powers: [] as string[],
    equipment: [] as string[],
  })

  const [newPower, setNewPower] = useState('')
  const [newEquipment, setNewEquipment] = useState('')

  const handleStatChange = (stat: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Math.max(1, Math.min(100, value)) }
    }))
  }

  const addPower = () => {
    if (newPower.trim() && formData.powers.length < 6) {
      setFormData(prev => ({
        ...prev,
        powers: [...prev.powers, newPower.trim()]
      }))
      setNewPower('')
    }
  }

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()]
      }))
      setNewEquipment('')
    }
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Character name is required')
      return
    }
    onSave({
      ...formData,
      health: { current: formData.stats.STA * 2, maximum: formData.stats.STA * 2 }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-cyan-500">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <UserPlus size={24} />
            Create New Character
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Character Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Hero name..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Real Name</label>
              <input
                type="text"
                value={formData.realName}
                onChange={e => setFormData({ ...formData, realName: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Civilian identity..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Origin Type</label>
              <select
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="Skilled Human">Skilled Human</option>
                <option value="Altered Human">Altered Human</option>
                <option value="Mutant">Mutant</option>
                <option value="Tech Enhancement">Tech Enhancement</option>
                <option value="Mystic">Mystic</option>
                <option value="Alien">Alien</option>
                <option value="Cosmic">Cosmic</option>
                <option value="Robot">Robot/Construct</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Threat Level</label>
              <select
                value={formData.threatLevel}
                onChange={e => setFormData({ ...formData, threatLevel: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="THREAT_1">Threat Level 1 (Street)</option>
                <option value="THREAT_2">Threat Level 2 (City)</option>
                <option value="THREAT_3">Threat Level 3 (Regional)</option>
                <option value="THREAT_4">Threat Level 4 (National)</option>
                <option value="THREAT_5">Threat Level 5 (Global)</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Primary Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.stats).map(([stat, value]) => (
                <div key={stat}>
                  <label className="block text-sm text-gray-400 mb-1">{stat}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={value}
                      onChange={e => handleStatChange(stat, parseInt(e.target.value) || 1)}
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
                    />
                    <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Powers */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-purple-400 mb-4">Powers ({formData.powers.length}/6)</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPower}
                onChange={e => setNewPower(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPower()}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Enter power name..."
              />
              <button
                onClick={addPower}
                disabled={formData.powers.length >= 6}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.powers.map((power, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-900/50 border border-purple-500/30 rounded-full text-purple-300 flex items-center gap-2">
                  {power}
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, powers: prev.powers.filter((_, i) => i !== idx) }))}
                    className="hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-orange-400 mb-4">Equipment</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newEquipment}
                onChange={e => setNewEquipment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEquipment()}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Enter equipment name..."
              />
              <button onClick={addEquipment} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded font-medium">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipment.map((item, idx) => (
                <span key={idx} className="px-3 py-1 bg-orange-900/50 border border-orange-500/30 rounded-full text-orange-300 flex items-center gap-2">
                  {item}
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== idx) }))}
                    className="hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-medium">
            Create Character
          </button>
        </div>
      </div>
    </div>
  )
}

// CHARACTER EDIT MODAL
interface CharacterEditModalProps {
  character: FullCharacter
  onClose: () => void
  onSave: (updates: any) => void
}

function CharacterEditModal({ character, onClose, onSave }: CharacterEditModalProps) {
  const [formData, setFormData] = useState({
    name: character.character_name,
    realName: character.realName || '',
    origin: character.origin_type,
    threatLevel: character.threat_level || 'THREAT_1',
    stats: { ...character.stats },
    health: { ...character.health }
  })

  const handleStatChange = (stat: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Math.max(1, Math.min(100, value)) }
    }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Character name is required')
      return
    }
    onSave({
      name: formData.name,
      realName: formData.realName,
      origin: formData.origin,
      threatLevel: formData.threatLevel,
      stats: formData.stats,
      health: {
        current: Math.min(formData.health.current, formData.stats.STA * 2),
        maximum: formData.stats.STA * 2
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-cyan-500">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <Edit3 size={24} />
            Edit {character.character_name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Character Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Real Name</label>
              <input
                type="text"
                value={formData.realName}
                onChange={e => setFormData({ ...formData, realName: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Origin Type</label>
              <select
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="Skilled Human">Skilled Human</option>
                <option value="Altered Human">Altered Human</option>
                <option value="Mutant">Mutant</option>
                <option value="Tech Enhancement">Tech Enhancement</option>
                <option value="Mystic">Mystic</option>
                <option value="Alien">Alien</option>
                <option value="Cosmic">Cosmic</option>
                <option value="Robot">Robot/Construct</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Threat Level</label>
              <select
                value={formData.threatLevel}
                onChange={e => setFormData({ ...formData, threatLevel: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="THREAT_1">Threat Level 1</option>
                <option value="THREAT_2">Threat Level 2</option>
                <option value="THREAT_3">Threat Level 3</option>
                <option value="THREAT_4">Threat Level 4</option>
                <option value="THREAT_5">Threat Level 5</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Primary Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.stats).map(([stat, value]) => (
                <div key={stat}>
                  <label className="block text-sm text-gray-400 mb-1">{stat}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={value}
                      onChange={e => handleStatChange(stat, parseInt(e.target.value) || 1)}
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
                    />
                    <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-red-400 mb-4">Health</h3>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current HP</label>
                <input
                  type="number"
                  min="0"
                  max={formData.stats.STA * 2}
                  value={formData.health.current}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    health: { ...prev.health, current: Math.max(0, parseInt(e.target.value) || 0) }
                  }))}
                  className="w-24 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="text-2xl text-gray-500">/</div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max HP (STA×2)</label>
                <div className="w-24 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-300">
                  {formData.stats.STA * 2}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

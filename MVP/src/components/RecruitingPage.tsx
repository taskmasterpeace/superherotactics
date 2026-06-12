import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { ArrowLeft, Users, Check, Star, Shield, Zap, DollarSign, GraduationCap, MapPin, ChevronRight, Search, Filter, Shuffle, Globe, Target, Cpu, FlaskConical, Microscope, Eye, HeartPulse, RefreshCw, Info } from 'lucide-react'
import { getCountryByName, getEducationLevel } from '../data/worldData'
import { RECRUITABLE_CHARACTERS, RecruitableCharacter } from '../data/recruitableCharacters'
import {
  generateRecruitingPool,
  filterPoolByRole,
  ProfiledCharacter,
  CharacterRole,
  EDUCATION_FIELDS,
} from '../data/characterGeneration'
import { getCountryProfile, ROLE_DESCRIPTIONS } from '../data/countryProfiles'
import { GameCharacter, ORIGIN_NAMES } from '../types'

// Role icons for filter buttons
const ROLE_ICONS: Record<CharacterRole, React.ReactNode> = {
  soldier: <Target size={16} />,
  specialist: <Cpu size={16} />,
  scientist: <FlaskConical size={16} />,
  investigator: <Microscope size={16} />,
  operative: <Eye size={16} />,
  support: <HeartPulse size={16} />,
}

// Role colors for visual distinction
const ROLE_COLORS: Record<CharacterRole, string> = {
  soldier: 'from-red-600 to-orange-600',
  specialist: 'from-blue-600 to-cyan-600',
  scientist: 'from-green-600 to-teal-600',
  investigator: 'from-purple-600 to-pink-600',
  operative: 'from-gray-600 to-slate-600',
  support: 'from-yellow-600 to-amber-600',
}

const ROLE_BG_COLORS: Record<CharacterRole, string> = {
  soldier: 'bg-red-600/20 border-red-500/50',
  specialist: 'bg-blue-600/20 border-blue-500/50',
  scientist: 'bg-green-600/20 border-green-500/50',
  investigator: 'bg-purple-600/20 border-purple-500/50',
  operative: 'bg-gray-600/20 border-gray-500/50',
  support: 'bg-yellow-600/20 border-yellow-500/50',
}

export default function RecruitingPage() {
  const { selectedCountry, selectedCity, setGamePhase, setCurrentView } = useGameStore()
  const [selectedRecruits, setSelectedRecruits] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'numbers' | 'stars'>('numbers')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<CharacterRole | 'all'>('all')
  const [recruitingPool, setRecruitingPool] = useState<ProfiledCharacter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get country profile for flavor display
  const countryProfile = useMemo(() => getCountryProfile(selectedCountry), [selectedCountry])
  const countryData = getCountryByName(selectedCountry)

  // Generate initial recruiting pool
  useEffect(() => {
    setIsLoading(true)
    const pool = generateRecruitingPool(selectedCountry, 10)
    setRecruitingPool(pool)
    setIsLoading(false)
  }, [selectedCountry])

  // Filter pool by search and role
  const filteredPool = useMemo(() => {
    let filtered = roleFilter === 'all' ? recruitingPool : filterPoolByRole(recruitingPool, roleFilter)

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(char =>
        char.name.toLowerCase().includes(lowerSearch) ||
        char.realName.toLowerCase().includes(lowerSearch) ||
        char.role.toLowerCase().includes(lowerSearch) ||
        char.education.some(e => e.toLowerCase().includes(lowerSearch))
      )
    }

    return filtered
  }, [recruitingPool, roleFilter, searchTerm])

  // Role counts for filter badges
  const roleCounts = useMemo(() => {
    const counts: Record<CharacterRole | 'all', number> = {
      all: recruitingPool.length,
      soldier: 0, specialist: 0, scientist: 0,
      investigator: 0, operative: 0, support: 0
    }
    recruitingPool.forEach(c => { counts[c.role]++ })
    return counts
  }, [recruitingPool])

  // Regenerate pool
  const handleRegeneratePool = () => {
    setIsLoading(true)
    setSelectedRecruits(new Set())
    setTimeout(() => {
      const pool = generateRecruitingPool(selectedCountry, 10)
      setRecruitingPool(pool)
      setIsLoading(false)
    }, 100)
  }

  const toggleRecruit = (id: string) => {
    const newSelected = new Set(selectedRecruits)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else if (newSelected.size < 5) {
      newSelected.add(id)
    }
    setSelectedRecruits(newSelected)
  }

  const handleConfirmTeam = () => {
    if (selectedRecruits.size >= 1) {
      const selectedChars = recruitingPool
        .filter(r => selectedRecruits.has(r.id))
        .map(r => ({
          ...r,
          status: 'ready' as const,
          location: { country: selectedCountry, city: selectedCity },
        }))

      useGameStore.setState({
        characters: selectedChars,
        gamePhase: 'playing',
        currentView: 'world-map'
      })
    }
  }

  const statToStars = (value: number) => {
    const stars = Math.round(value / 20)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setGamePhase('city-selection')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to City
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Recruit Operatives
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {filteredPool.length} candidates • Select 1-5 for your team
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Step 3 of 3</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            {countryData?.flag} Selected: {selectedRecruits.size}/5
          </div>
        </div>
      </div>

      {/* Country Profile Header */}
      {countryProfile && (
        <div className="mb-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl border border-blue-500/30 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {countryData?.flag} {selectedCountry}
                <span className="text-sm font-normal text-blue-300">({selectedCity})</span>
              </h2>
              <p className="text-sm text-gray-400 mt-1">{countryProfile.tagline}</p>
              {/* Origin Focus - show top 3 origin types */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Origin Focus:</span>
                {Object.entries(countryProfile.originWeights)
                  .filter(([, weight]) => (weight as number) > 0)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 3)
                  .map(([origin, weight]) => (
                    <span
                      key={origin}
                      className="px-1.5 py-0.5 bg-purple-600/30 border border-purple-500/30 rounded text-[10px] text-purple-200"
                      title={`${weight}% chance`}
                    >
                      {origin.replace(/_/g, ' ')}
                    </span>
                  ))
                }
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-w-md">
              {countryProfile.culturalTraits.map((trait, i) => (
                <span key={i} className="px-2 py-1 bg-blue-600/30 border border-blue-500/30 rounded text-xs text-blue-200">
                  {trait}
                </span>
              ))}
            </div>
            <div className="text-right text-sm">
              <div className="text-gray-400">Stat Bonuses:</div>
              <div className="flex gap-2 mt-1">
                {Object.entries(countryProfile.statTendencies)
                  .filter(([, v]) => v !== 0)
                  .map(([stat, value]) => (
                    <span key={stat} className={`font-mono ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stat}: {value > 0 ? '+' : ''}{value}
                    </span>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by name, role, skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>

        {/* Role Filter Buttons */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              roleFilter === 'all' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-400'
            }`}
            onClick={() => setRoleFilter('all')}
          >
            All ({roleCounts.all})
          </button>
          {(Object.keys(ROLE_ICONS) as CharacterRole[]).map(role => (
            <button
              key={role}
              className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                roleFilter === role
                  ? `bg-gradient-to-r ${ROLE_COLORS[role]} text-white`
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
              onClick={() => setRoleFilter(role)}
              title={ROLE_DESCRIPTIONS[role].description}
            >
              {ROLE_ICONS[role]}
              <span className="hidden sm:inline capitalize">{role}</span>
              <span className="text-[10px] opacity-70">({roleCounts[role]})</span>
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            className={`px-2 py-1 rounded text-xs ${viewMode === 'numbers' ? 'bg-blue-600' : 'hover:bg-gray-700 text-gray-400'}`}
            onClick={() => setViewMode('numbers')}
          >
            123
          </button>
          <button
            className={`px-2 py-1 rounded text-xs ${viewMode === 'stars' ? 'bg-blue-600' : 'hover:bg-gray-700 text-gray-400'}`}
            onClick={() => setViewMode('stars')}
          >
            ★★★
          </button>
        </div>

        {/* Regenerate Button */}
        <button
          onClick={handleRegeneratePool}
          disabled={isLoading}
          className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          New Pool
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw size={48} className="animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-gray-400">Generating candidates from {selectedCountry}...</p>
          </div>
        </div>
      )}

      {/* Recruits Grid */}
      {!isLoading && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredPool.map((char, index) => {
                const isSelected = selectedRecruits.has(char.id)
                const roleInfo = ROLE_DESCRIPTIONS[char.role]

                return (
                  <motion.div
                    key={char.id}
                    className={`relative bg-gray-800/80 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'border-yellow-400 shadow-lg shadow-yellow-400/20 ring-2 ring-yellow-400/30'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => toggleRecruit(char.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    {/* Selection Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                        <Check size={16} className="text-gray-900" />
                      </div>
                    )}

                    {/* Role Badge */}
                    <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 bg-gradient-to-r ${ROLE_COLORS[char.role]} shadow-lg`}>
                      {roleInfo.icon} {roleInfo.name.toUpperCase()}
                    </div>

                    {/* Portrait Area */}
                    <div className={`h-16 flex items-center justify-center ${ROLE_BG_COLORS[char.role]} border-b`}>
                      <div className="text-center pt-4">
                        <span className="text-2xl">{roleInfo.icon}</span>
                      </div>
                    </div>

                    <div className="p-3">
                      {/* Header */}
                      <div className="mb-2">
                        <h3 className="font-bold text-white leading-tight truncate">{char.name}</h3>
                        <p className="text-xs text-gray-400 truncate">{char.realName}</p>
                        <p className="text-[10px] text-gray-500">
                          {char.age}yo • {ORIGIN_NAMES[char.origin] || 'Human'}
                        </p>
                      </div>

                      {/* Why Useful Tooltip */}
                      <div className="mb-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                        <p className="text-[10px] text-gray-300 italic">
                          "{char.roleDescription}"
                        </p>
                      </div>

                      {/* Education/Skills */}
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1">
                          {char.education.map((edu, i) => {
                            const eduInfo = EDUCATION_FIELDS[edu]
                            return (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  eduInfo?.category === 'combat' ? 'bg-red-600/30 text-red-200 border border-red-500/30' :
                                  eduInfo?.category === 'tech' ? 'bg-blue-600/30 text-blue-200 border border-blue-500/30' :
                                  eduInfo?.category === 'science' ? 'bg-green-600/30 text-green-200 border border-green-500/30' :
                                  eduInfo?.category === 'intel' ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30' :
                                  'bg-gray-600/30 text-gray-200 border border-gray-500/30'
                                }`}
                                title={eduInfo?.investigationBonus ? `+${eduInfo.investigationBonus}% investigation` : undefined}
                              >
                                {eduInfo?.label || edu}
                                {eduInfo?.investigationBonus && (
                                  <span className="ml-1 text-yellow-300">+{eduInfo.investigationBonus}%</span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="bg-gray-900/50 rounded p-1.5 mb-2">
                        <div className="grid grid-cols-7 gap-0.5 text-center">
                          {Object.entries(char.stats).map(([stat, value]) => (
                            <div key={stat}>
                              <div className="text-[8px] text-gray-500">{stat}</div>
                              <div className={`text-[10px] font-bold ${
                                value >= 60 ? 'text-green-400' :
                                value >= 40 ? 'text-yellow-400' : 'text-gray-400'
                              }`}>
                                {viewMode === 'stars' ? (value >= 60 ? '★★' : value >= 40 ? '★' : '☆') : value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Location & Salary */}
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {char.birthCity.split('_')[0]}
                        </span>
                        <span className="text-green-400 font-bold">
                          ${Math.floor(char.wealth / 10)}/wk
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {filteredPool.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No candidates match your filters</p>
              <button
                onClick={() => { setRoleFilter('all'); setSearchTerm(''); }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div>
          <div className="text-sm text-gray-400">Selected Team:</div>
          <div className="flex gap-2 mt-1">
            {Array.from(selectedRecruits).map(id => {
              const char = recruitingPool.find(c => c.id === id)
              if (!char) return null
              return (
                <span key={id} className={`px-2 py-1 rounded text-xs bg-gradient-to-r ${ROLE_COLORS[char.role]}`}>
                  {char.name.split(' ')[0]}
                </span>
              )
            })}
            {selectedRecruits.size === 0 && (
              <span className="text-gray-500 text-sm">Select operatives above</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {selectedRecruits.size === 0 && 'Select at least 1 operative'}
            {selectedRecruits.size === 1 && 'Minimum team ready!'}
            {selectedRecruits.size >= 2 && selectedRecruits.size < 5 && `Team of ${selectedRecruits.size} ready!`}
            {selectedRecruits.size === 5 && 'Maximum team selected!'}
          </div>
          <motion.button
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 ${
              selectedRecruits.size >= 1
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleConfirmTeam}
            disabled={selectedRecruits.size < 1}
            whileHover={selectedRecruits.size >= 1 ? { scale: 1.05 } : {}}
            whileTap={selectedRecruits.size >= 1 ? { scale: 0.95 } : {}}
          >
            BEGIN OPERATIONS
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

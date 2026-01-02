import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { ArrowLeft, Users, Check, Star, Shield, Zap, DollarSign, GraduationCap, MapPin, ChevronRight, Search, Filter, Shuffle, Globe } from 'lucide-react'
import { getCountryByName, getEducationLevel } from '../data/worldData'
import { RECRUITABLE_CHARACTERS, RecruitableCharacter } from '../data/recruitableCharacters'
import { generateCharacter, generateCharacterFromCountry } from '../data/characterGeneration'
import { GameCharacter, ORIGIN_NAMES } from '../types'

export default function RecruitingPage() {
  const { selectedCountry, selectedCity, setGamePhase, setCurrentView } = useGameStore()
  const [selectedRecruits, setSelectedRecruits] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'numbers' | 'stars'>('numbers')
  const [powerMode, setPowerMode] = useState<'text' | 'emoji'>('emoji')
  const [searchTerm, setSearchTerm] = useState('')
  const [threatFilter, setThreatFilter] = useState<'ALL' | 'THREAT_1' | 'THREAT_2' | 'THREAT_3'>('ALL')
  const [generatedRecruits, setGeneratedRecruits] = useState<GameCharacter[]>([])
  const [showGenerated, setShowGenerated] = useState(false)

  // Generate random recruits
  const handleGenerateRandom = (count: number = 6, fromCountry: boolean = false) => {
    const newRecruits: GameCharacter[] = []
    for (let i = 0; i < count; i++) {
      const char = fromCountry
        ? generateCharacterFromCountry(selectedCountry)
        : generateCharacter()
      newRecruits.push(char)
    }
    setGeneratedRecruits(newRecruits)
    setShowGenerated(true)
  }

  const country = getCountryByName(selectedCountry)

  // Filter all available characters
  const availableRecruits = useMemo(() => {
    return RECRUITABLE_CHARACTERS.filter(char => {
      const matchesSearch = char.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesThreat = threatFilter === 'ALL' || char.threatLevel === threatFilter
      return matchesSearch && matchesThreat
    })
  }, [searchTerm, threatFilter])

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
      const selectedChars = availableRecruits.filter(r => selectedRecruits.has(r.alias)).map(r => {
        const maxHealth = 50 + r.stats.STA
        return {
          id: `${r.alias}-${Date.now()}`,
          name: r.alias,
          realName: r.name,
          stats: r.stats,
          threatLevel: r.threatLevel,
          origin: r.origin,
          powers: r.powers,
          equipment: [],
          health: { current: maxHealth, maximum: maxHealth },
          shield: r.shield || 0,
          maxShield: r.maxShield || 0,
          shieldRegen: r.shieldRegen || 0,
          dr: r.dr || 0,
          status: 'ready' as const,
          location: { country: selectedCountry, city: selectedCity },
          injuries: [],
          medicalHistory: [],
          recoveryTime: 0
        }
      })

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
            {availableRecruits.length} heroes available • Select 2-4 for {selectedCity}
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Step 3 of 3</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            {country?.flag} Selected: {selectedRecruits.size}/4
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search heroes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Threat Level Filter */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
          {(['ALL', 'THREAT_3', 'THREAT_2', 'THREAT_1'] as const).map(threat => (
            <button
              key={threat}
              className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${threatFilter === threat
                  ? threat === 'THREAT_3' ? 'bg-red-600' :
                    threat === 'THREAT_2' ? 'bg-orange-600' :
                      threat === 'THREAT_1' ? 'bg-blue-600' : 'bg-purple-600'
                  : 'hover:bg-gray-700 text-gray-400'
                }`}
              onClick={() => setThreatFilter(threat)}
            >
              {threat === 'ALL' ? '🌟 ALL' : threat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
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

        {/* Generate Random Buttons */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 flex items-center gap-1 text-sm font-bold"
            onClick={() => handleGenerateRandom(6, true)}
            title="Generate from selected country"
          >
            <Globe size={14} /> Local
          </button>
          <button
            className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 flex items-center gap-1 text-sm font-bold"
            onClick={() => handleGenerateRandom(6, false)}
            title="Generate from anywhere"
          >
            <Shuffle size={14} /> Random
          </button>
        </div>
      </div>

      {/* Generated Recruits Section */}
      {showGenerated && generatedRecruits.length > 0 && (
        <div className="mb-4 bg-gradient-to-r from-purple-900/50 to-green-900/50 rounded-xl border border-purple-500/50 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2">
              <Shuffle size={20} /> Generated Recruits ({generatedRecruits.length})
            </h2>
            <button
              onClick={() => setShowGenerated(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Hide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {generatedRecruits.map((char) => (
              <div
                key={char.id}
                className="bg-gray-800/80 rounded-lg border border-purple-500/30 p-3 hover:border-purple-400 transition-all"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-white">{char.name}</p>
                    <p className="text-xs text-gray-400">{char.realName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    char.threatLevel === 'THREAT_3' ? 'bg-red-600' :
                    char.threatLevel === 'THREAT_2' ? 'bg-orange-600' :
                    char.threatLevel === 'THREAT_1' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {char.threatLevel}
                  </span>
                </div>

                {/* Origin & Location */}
                <div className="mb-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Origin:</span>
                    <span className="text-cyan-300">{ORIGIN_NAMES[char.origin]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-gray-500" />
                    <span className="text-yellow-300">{char.birthCity.split('_')[0]}</span>
                    <span className="text-gray-500">({char.nationality})</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-[10px]">
                  {Object.entries(char.stats).map(([stat, value]) => (
                    <div key={stat} className="text-center">
                      <div className="text-gray-500">{stat}</div>
                      <div className={`font-mono font-bold ${
                        value >= 60 ? 'text-green-400' :
                        value >= 40 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* City Familiarity */}
                <div className="border-t border-gray-700 pt-2">
                  <p className="text-[10px] text-gray-500 mb-1">Cities Known ({char.cityFamiliarities.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {char.cityFamiliarities.slice(0, 5).map((f, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          f.familiarity >= 80 ? 'bg-green-600/50 text-green-200' :
                          f.familiarity >= 50 ? 'bg-yellow-600/50 text-yellow-200' :
                          'bg-gray-600/50 text-gray-300'
                        }`}
                        title={`${f.familiarity}% familiarity`}
                      >
                        {f.cityName} ({f.familiarity}%)
                      </span>
                    ))}
                    {char.cityFamiliarities.length > 5 && (
                      <span className="text-gray-500 text-[10px]">+{char.cityFamiliarities.length - 5} more</span>
                    )}
                  </div>
                </div>

                {/* Secondary Stats */}
                <div className="flex justify-between mt-2 text-[10px] border-t border-gray-700 pt-2">
                  <span className="text-gray-400">Fame: <span className="text-yellow-300">{char.fame}</span></span>
                  <span className="text-gray-400">Wealth: <span className="text-green-300">${char.wealth}</span></span>
                  <span className="text-gray-400">Age: <span className="text-white">{char.age}</span></span>
                </div>
              </div>
            ))}
          </div>

          {/* Regenerate Button */}
          <div className="mt-3 flex justify-center gap-3">
            <button
              onClick={() => handleGenerateRandom(6, true)}
              className="px-4 py-2 bg-green-600/50 hover:bg-green-600 rounded text-sm font-bold flex items-center gap-2"
            >
              <Globe size={16} /> Generate 6 from {selectedCountry}
            </button>
            <button
              onClick={() => handleGenerateRandom(6, false)}
              className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded text-sm font-bold flex items-center gap-2"
            >
              <Shuffle size={16} /> Generate 6 Random
            </button>
          </div>
        </div>
      )}

      {/* Recruits Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableRecruits.map((recruit, index) => {
            const isLocalRecruit = recruit.nationality === selectedCountry
            const originEmoji = recruit.origin === 'mutant' ? '🧬' :
              recruit.origin === 'tech' ? '🤖' :
              recruit.origin === 'magic' ? '✨' :
              recruit.origin === 'alien' ? '👽' :
              recruit.origin === 'enhanced' ? '💪' :
              recruit.origin === 'psychic' ? '🧠' : '🦸'

            return (
              <motion.div
                key={recruit.id}
                className={`relative bg-gray-800/80 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${selectedRecruits.has(recruit.alias)
                  ? 'border-yellow-400 shadow-lg shadow-yellow-400/20 ring-2 ring-yellow-400/30'
                  : 'border-gray-700 hover:border-gray-500'
                  }`}
                onClick={() => toggleRecruit(recruit.alias)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                {/* Selection Badge */}
                {selectedRecruits.has(recruit.alias) && (
                  <div className="absolute top-2 right-2 z-10 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                    <Check size={18} className="text-gray-900" />
                  </div>
                )}

                {/* Local Recruit Badge */}
                {isLocalRecruit && (
                  <div className="absolute top-2 left-2 z-10 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin size={10} /> LOCAL
                  </div>
                )}

                {/* Portrait Area with Origin */}
                <div className={`h-20 flex items-center justify-center ${
                  recruit.origin === 'mutant' ? 'bg-gradient-to-br from-yellow-900/50 to-green-900/50' :
                  recruit.origin === 'tech' ? 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50' :
                  recruit.origin === 'magic' ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' :
                  recruit.origin === 'alien' ? 'bg-gradient-to-br from-green-900/50 to-teal-900/50' :
                  recruit.origin === 'enhanced' ? 'bg-gradient-to-br from-orange-900/50 to-red-900/50' :
                  recruit.origin === 'psychic' ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50' :
                  'bg-gradient-to-br from-gray-800 to-gray-700'
                }`}>
                  <div className="text-center">
                    <span className="text-4xl">{originEmoji}</span>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{recruit.origin}</div>
                  </div>
                </div>

                {/* Threat Badge on portrait */}
                <div className={`absolute top-14 right-2 px-2 py-0.5 rounded text-xs font-bold shadow-lg ${
                  recruit.threatLevel === 'THREAT_3' ? 'bg-red-600' :
                  recruit.threatLevel === 'THREAT_2' ? 'bg-orange-600' :
                  'bg-blue-600'
                }`}>
                  {recruit.threatLevel.replace('THREAT_', 'T')}
                </div>

                <div className="p-4">
                  {/* Header */}
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-lg text-white leading-tight">{recruit.alias}</h3>
                    <p className="text-sm text-gray-400">{recruit.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {recruit.age}yo • {recruit.gender} • {recruit.identity}
                    </p>
                  </div>

                  {/* Stats Grid - More prominent */}
                  <div className="mb-3 bg-gray-900/50 rounded-lg p-2">
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {Object.entries(recruit.stats).slice(0, 4).map(([stat, value]) => (
                        <div key={stat}>
                          <div className="text-[10px] text-gray-500 uppercase">{stat}</div>
                          <div className={`text-sm font-bold ${
                            value >= 60 ? 'text-green-400' :
                            value >= 40 ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            {viewMode === 'stars' ? statToStars(value).slice(0,3) : value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center mt-1 pt-1 border-t border-gray-700">
                      {Object.entries(recruit.stats).slice(4).map(([stat, value]) => (
                        <div key={stat}>
                          <div className="text-[10px] text-gray-500 uppercase">{stat}</div>
                          <div className={`text-sm font-bold ${
                            value >= 60 ? 'text-green-400' :
                            value >= 40 ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            {viewMode === 'stars' ? statToStars(value).slice(0,3) : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Powers - Horizontal scrollable */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {recruit.powers.slice(0, 3).map(power => (
                        <span key={power} className="px-2 py-0.5 bg-purple-600/30 border border-purple-500/30 rounded text-xs text-purple-300">
                          {power}
                        </span>
                      ))}
                      {recruit.powers.length > 3 && (
                        <span className="text-xs text-gray-500">+{recruit.powers.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Info - Two columns for compact display */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-gray-500" />
                      <span className={isLocalRecruit ? 'text-green-400' : ''}>{recruit.nationality}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={11} className="text-green-500" />
                      <span className="text-green-400">${(recruit.weeklyPay/1000).toFixed(0)}K/wk</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <Shield size={11} className="text-gray-500" />
                      {recruit.career} ({recruit.careerRank})
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div>
          <div className="text-sm text-gray-400">Team Budget (Weekly):</div>
          <div className="text-xl font-bold text-yellow-400">
            ${availableRecruits.filter(r => selectedRecruits.has(r.alias)).reduce((sum, r) => sum + r.weeklyPay, 0).toLocaleString()}
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
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 ${selectedRecruits.size >= 2
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

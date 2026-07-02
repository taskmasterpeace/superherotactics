import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  ArrowLeft, Check, ChevronRight, Search, RefreshCw, MapPin,
  Target, Cpu, FlaskConical, Microscope, Eye, HeartPulse,
  Wallet, AlertTriangle, PackageX, Users,
} from 'lucide-react'
import { getCountryByName, codeToFlag } from '../data/allCountries'
import {
  generateRecruitingPool,
  filterPoolByRole,
  computeSigningCost,
  ProfiledCharacter,
  CharacterRole,
  EDUCATION_FIELDS,
} from '../data/characterGeneration'
import { getCountryProfile, ROLE_DESCRIPTIONS } from '../data/countryProfiles'
import { ORIGIN_NAMES } from '../types'
import { RetroPanel, RetroBadge, RetroButton, RetroInput } from './ui'

const MAX_TEAM_SIZE = 5

// Role icons for filter buttons
const ROLE_ICONS: Record<CharacterRole, React.ReactNode> = {
  soldier: <Target size={16} />,
  specialist: <Cpu size={16} />,
  scientist: <FlaskConical size={16} />,
  investigator: <Microscope size={16} />,
  operative: <Eye size={16} />,
  support: <HeartPulse size={16} />,
}

// Role colors for visual distinction (no purple — banned)
const ROLE_COLORS: Record<CharacterRole, string> = {
  soldier: 'from-red-600 to-orange-600',
  specialist: 'from-blue-600 to-cyan-600',
  scientist: 'from-green-600 to-teal-600',
  investigator: 'from-rose-600 to-red-800',
  operative: 'from-gray-600 to-slate-600',
  support: 'from-yellow-600 to-amber-600',
}

const ROLE_BG_COLORS: Record<CharacterRole, string> = {
  soldier: 'bg-red-600/20 border-red-500/50',
  specialist: 'bg-blue-600/20 border-blue-500/50',
  scientist: 'bg-green-600/20 border-green-500/50',
  investigator: 'bg-rose-600/20 border-rose-500/50',
  operative: 'bg-gray-600/20 border-gray-500/50',
  support: 'bg-yellow-600/20 border-yellow-500/50',
}

const STAT_KEYS = ['MEL', 'AGL', 'STR', 'STA', 'INT', 'INS', 'CON'] as const

export default function RecruitingPage() {
  const { selectedCountry, selectedCity, setGamePhase, budget } = useGameStore()
  const [selectedRecruits, setSelectedRecruits] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'numbers' | 'stars'>('numbers')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<CharacterRole | 'all'>('all')
  const [recruitingPool, setRecruitingPool] = useState<ProfiledCharacter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get country profile for flavor display
  const countryProfile = useMemo(() => getCountryProfile(selectedCountry), [selectedCountry])
  const countryData = getCountryByName(selectedCountry)

  // Country stat tendencies -> which stats this nation boosts (tied to stat grid markers)
  const boostedStats = useMemo(() => {
    const map: Record<string, number> = {}
    if (countryProfile) {
      Object.entries(countryProfile.statTendencies).forEach(([stat, value]) => {
        if ((value as number) !== 0) map[stat] = value as number
      })
    }
    return map
  }, [countryProfile])

  // Generate initial recruiting pool
  useEffect(() => {
    setIsLoading(true)
    const pool = generateRecruitingPool(selectedCountry, 10)
    setRecruitingPool(pool)
    setIsLoading(false)
  }, [selectedCountry])

  // Signing cost per candidate (deterministic from quality)
  const signingCosts = useMemo(() => {
    const m = new Map<string, number>()
    recruitingPool.forEach(c => m.set(c.id, computeSigningCost(c)))
    return m
  }, [recruitingPool])

  // Pool average per stat — used to show per-candidate deltas
  const poolAverages = useMemo(() => {
    const avg: Record<string, number> = {}
    if (recruitingPool.length === 0) return avg
    STAT_KEYS.forEach(key => {
      const sum = recruitingPool.reduce((s, c) => s + ((c.stats as Record<string, number>)[key] || 0), 0)
      avg[key] = Math.round(sum / recruitingPool.length)
    })
    return avg
  }, [recruitingPool])

  // Money math for the header bar + confirm gate
  const totalSigningCost = useMemo(
    () => Array.from(selectedRecruits).reduce((sum, id) => sum + (signingCosts.get(id) ?? 0), 0),
    [selectedRecruits, signingCosts]
  )
  const remainingAfterHire = budget - totalSigningCost
  const canAfford = remainingAfterHire >= 0

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
    } else if (newSelected.size < MAX_TEAM_SIZE) {
      newSelected.add(id)
    }
    setSelectedRecruits(newSelected)
  }

  const handleConfirmTeam = () => {
    if (selectedRecruits.size < 1) return

    // Hard gate: cannot sign a team you cannot pay for
    const store = useGameStore.getState()
    if (store.budget < totalSigningCost) return

    const selectedChars = recruitingPool
      .filter(r => selectedRecruits.has(r.id))
      .map(r => ({
        ...r,
        status: 'ready' as const,
        location: { country: selectedCountry, city: selectedCity },
      }))

    useGameStore.setState({
      characters: selectedChars,
      squads: [],            // clear any placeholder squad before rebuilding
      gamePhase: 'playing',
      currentView: 'world-map'
    })
    // Pay the one-time signing costs through the economy ledger
    if (totalSigningCost > 0) {
      useGameStore.getState().recordTransaction('expense', 'merc_hire', totalSigningCost, 'Team signing costs')
    }
    // Form the starting squad (Alpha Squad) from the recruited operatives
    useGameStore.getState().initializeSquads()
  }

  // Top-2 stats per candidate (the differentiators)
  const getTopStats = (char: ProfiledCharacter): string[] =>
    Object.entries(char.stats as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k)

  return (
    <div className="h-screen flex flex-col p-4 overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setGamePhase('city-selection')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={20} />
          Back to City
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Recruit Operatives
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {filteredPool.length} candidates • Select 1-{MAX_TEAM_SIZE} for your team
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Step 3 of 3</div>
          <div className="text-xs text-gray-500">
            {countryData ? codeToFlag(countryData.code) : ''} {selectedCity}
          </div>
        </div>
      </div>

      {/* PERSISTENT BUDGET BAR */}
      <RetroPanel variant="elevated" padding="sm" className="mb-3">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div className="flex items-center gap-3">
            <Wallet className="text-primary" size={24} />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Operating Budget</div>
              <div className="text-2xl font-black font-mono text-primary leading-none mt-0.5">
                ${budget.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-9 w-0.5 bg-black/40 rounded" />

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Users size={10} /> Team
            </div>
            <div className="text-lg font-bold font-mono leading-none mt-1 text-white">
              {selectedRecruits.size}<span className="text-gray-500">/{MAX_TEAM_SIZE}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Signing Cost</div>
            <div className={`text-lg font-bold font-mono leading-none mt-1 ${totalSigningCost > 0 ? 'text-red-400' : 'text-gray-500'}`}>
              {totalSigningCost > 0 ? `-$${totalSigningCost.toLocaleString()}` : '$0'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">After Signing</div>
            <div className={`text-lg font-bold font-mono leading-none mt-1 ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
              {remainingAfterHire < 0 ? '-' : ''}${Math.abs(remainingAfterHire).toLocaleString()}
            </div>
          </div>

          {!canAfford && (
            <RetroBadge variant="destructive" pulse icon={<AlertTriangle size={12} />}>
              OVER BUDGET
            </RetroBadge>
          )}
        </div>
      </RetroPanel>

      {/* Country Profile Header */}
      {countryProfile && (
        <RetroPanel variant="glass" padding="sm" className="mb-3">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {countryData ? codeToFlag(countryData.code) : ''} {selectedCountry}
                <span className="text-sm font-normal text-blue-300">({selectedCity})</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{countryProfile.tagline}</p>
              {/* Origin Focus - show top 3 origin types */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Origin Focus:</span>
                {Object.entries(countryProfile.originWeights)
                  .filter(([, weight]) => (weight as number) > 0)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 3)
                  .map(([origin, weight]) => (
                    <span
                      key={origin}
                      className="px-1.5 py-0.5 bg-amber-600/20 border border-amber-500/40 rounded text-[10px] text-amber-200"
                      title={`${weight}% chance`}
                    >
                      {origin.replace(/_/g, ' ')}
                    </span>
                  ))
                }
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-w-md">
              {countryProfile.culturalTraits.map((trait, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-600/30 border border-blue-500/30 rounded text-[10px] text-blue-200">
                  {trait}
                </span>
              ))}
            </div>

            {/* National stat bias — visually tied to the ▲/▼ markers on each candidate's stat grid */}
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">National Training Bias</div>
              <div className="flex gap-1.5 justify-end flex-wrap">
                {Object.entries(boostedStats).map(([stat, value]) => (
                  <RetroBadge
                    key={stat}
                    size="sm"
                    shadow="none"
                    variant={value > 0 ? 'success' : 'destructive'}
                    title={`${selectedCountry} candidates roll ${value > 0 ? '+' : ''}${value} ${stat}`}
                  >
                    {value > 0 ? '▲' : '▼'} {stat} {value > 0 ? '+' : ''}{value}
                  </RetroBadge>
                ))}
                {Object.keys(boostedStats).length === 0 && (
                  <span className="text-xs text-gray-500">Balanced — no bias</span>
                )}
              </div>
              <div className="text-[9px] text-gray-500 mt-1">
                Marked {'▲▼'} on each candidate's stats below
              </div>
            </div>
          </div>
        </RetroPanel>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-sm">
          <RetroInput
            size="sm"
            leftIcon={<Search size={16} />}
            placeholder="Search by name, role, skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Role Filter Buttons */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border-2 border-black">
          <button
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors duration-200 flex items-center gap-1 ${
              roleFilter === 'all' ? 'bg-primary text-black' : 'hover:bg-gray-700 text-gray-400'
            }`}
            onClick={() => setRoleFilter('all')}
          >
            All ({roleCounts.all})
          </button>
          {(Object.keys(ROLE_ICONS) as CharacterRole[]).map(role => (
            <button
              key={role}
              className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors duration-200 flex items-center gap-1 ${
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
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border-2 border-black">
          <button
            className={`px-2 py-1 rounded text-xs transition-colors duration-200 ${viewMode === 'numbers' ? 'bg-primary text-black font-bold' : 'hover:bg-gray-700 text-gray-400'}`}
            onClick={() => setViewMode('numbers')}
          >
            123
          </button>
          <button
            className={`px-2 py-1 rounded text-xs transition-colors duration-200 ${viewMode === 'stars' ? 'bg-primary text-black font-bold' : 'hover:bg-gray-700 text-gray-400'}`}
            onClick={() => setViewMode('stars')}
          >
            ★★★
          </button>
        </div>

        {/* Regenerate Button */}
        <RetroButton variant="success" size="sm" onClick={handleRegeneratePool} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          New Pool
        </RetroButton>

        {/* Stat legend */}
        <div className="ml-auto text-[10px] text-gray-500 hidden lg:block">
          <span className="text-primary font-bold">Gold</span> = top-2 stat •
          <span className="text-green-400"> +n</span>/<span className="text-red-400">-n</span> vs pool avg •
          <span className="text-green-400"> {'▲'}</span> national bias
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw size={48} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-400">Generating candidates from {selectedCountry}...</p>
          </div>
        </div>
      )}

      {/* Recruits Grid */}
      {!isLoading && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-2">
            <AnimatePresence>
              {filteredPool.map((char, index) => {
                const isSelected = selectedRecruits.has(char.id)
                const roleInfo = ROLE_DESCRIPTIONS[char.role]
                const cost = signingCosts.get(char.id) ?? 0
                const topStats = getTopStats(char)

                return (
                  <motion.div
                    key={char.id}
                    className={`relative rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden bg-gray-800/90 ${
                      isSelected
                        ? 'border-primary shadow-retro-primary'
                        : 'border-black shadow-retro hover:border-primary/60'
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
                      <div className="absolute top-2 right-2 z-10 bg-primary border-2 border-black rounded-full p-1.5 shadow-retro-sm">
                        <Check size={16} className="text-black" />
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
                      {/* Header + Signing Cost */}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-white leading-tight truncate">{char.name}</h3>
                          <p className="text-xs text-gray-400 truncate">{char.realName}</p>
                          <p className="text-[10px] text-gray-500">
                            {char.age}yo • {ORIGIN_NAMES[char.origin] || 'Human'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Signing</div>
                          <div className="text-base font-black font-mono text-primary leading-tight">
                            ${cost.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Why Useful Tooltip */}
                      <div className="mb-2 p-2 bg-gray-900/60 rounded border border-black/60">
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
                                  eduInfo?.category === 'intel' ? 'bg-amber-600/30 text-amber-200 border border-amber-500/30' :
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

                      {/* Stats Grid — top-2 highlighted, delta vs pool avg, national bias markers */}
                      <div className="bg-gray-900/60 border border-black/60 rounded p-1.5 mb-2">
                        <div className="grid grid-cols-7 gap-0.5 text-center">
                          {Object.entries(char.stats as Record<string, number>).map(([stat, value]) => {
                            const isTop = topStats.includes(stat)
                            const delta = value - (poolAverages[stat] ?? value)
                            const bias = boostedStats[stat]
                            return (
                              <div key={stat} className={`rounded transition-colors duration-200 ${isTop ? 'bg-primary/20' : ''}`}>
                                <div className={`text-[8px] ${isTop ? 'text-primary font-bold' : 'text-gray-500'}`}>
                                  {stat}
                                  {bias !== undefined && (
                                    <span
                                      className={bias > 0 ? 'text-green-400' : 'text-red-400'}
                                      title={`${selectedCountry} national bias: ${bias > 0 ? '+' : ''}${bias} ${stat}`}
                                    >
                                      {bias > 0 ? '▲' : '▼'}
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[10px] ${
                                  isTop ? 'text-primary font-extrabold' :
                                  value >= 60 ? 'text-green-400 font-bold' :
                                  value >= 40 ? 'text-yellow-400 font-bold' : 'text-gray-400 font-bold'
                                }`}>
                                  {viewMode === 'stars' ? (value >= 60 ? '★★' : value >= 40 ? '★' : '☆') : value}
                                </div>
                                {viewMode === 'numbers' && (
                                  <div className={`text-[8px] leading-none pb-0.5 ${
                                    delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-600'
                                  }`}>
                                    {delta > 0 ? `+${delta}` : delta < 0 ? delta : '='}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Loadout truth: recruits spawn with no gear */}
                      <RetroBadge
                        variant="warning"
                        size="sm"
                        shadow="none"
                        icon={<PackageX size={11} />}
                        className="w-full justify-center mb-1.5"
                        title="Recruits carry no weapons, armor, or gear — visit the Equipment Shop after deployment"
                      >
                        UNEQUIPPED — SHOP AFTER DEPLOY
                      </RetroBadge>

                      {/* Location & Weekly Wage */}
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {char.birthCity.split('_')[0]}
                        </span>
                        <span>
                          Weekly wage: <span className="text-green-400 font-bold">${Math.floor(char.wealth / 10)}/wk</span>
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
              <RetroButton
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => { setRoleFilter('all'); setSearchTerm(''); }}
              >
                Clear Filters
              </RetroButton>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <RetroPanel variant="elevated" padding="sm" className="mt-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Selected Team</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {Array.from(selectedRecruits).map(id => {
                const char = recruitingPool.find(c => c.id === id)
                if (!char) return null
                return (
                  <span
                    key={id}
                    className={`px-2 py-1 rounded border border-black text-xs text-white flex items-center gap-1.5 bg-gradient-to-r ${ROLE_COLORS[char.role]}`}
                  >
                    {char.name.split(' ')[0]}
                    <span className="font-mono font-bold text-yellow-200">
                      ${(signingCosts.get(id) ?? 0).toLocaleString()}
                    </span>
                  </span>
                )
              })}
              {selectedRecruits.size === 0 && (
                <span className="text-gray-500 text-sm">Select operatives above</span>
              )}
            </div>
            {selectedRecruits.size > 0 && (
              <div className="text-[10px] text-amber-300/90 mt-1.5 flex items-center gap-1">
                <PackageX size={11} />
                All recruits start unequipped — visit the Equipment Shop after deployment.
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-right max-w-[260px]">
              {selectedRecruits.size === 0 && (
                <span className="text-gray-400">Select at least 1 operative</span>
              )}
              {selectedRecruits.size >= 1 && !canAfford && (
                <span className="text-red-400 font-semibold">
                  Insufficient funds: signing costs ${totalSigningCost.toLocaleString()} but you have ${budget.toLocaleString()}. Remove a recruit or pick cheaper candidates.
                </span>
              )}
              {selectedRecruits.size >= 1 && canAfford && (
                <span className="text-gray-300">
                  Team of {selectedRecruits.size} ready — signing costs{' '}
                  <span className="text-primary font-bold font-mono">${totalSigningCost.toLocaleString()}</span>,
                  leaving <span className="text-green-400 font-bold font-mono">${remainingAfterHire.toLocaleString()}</span>
                </span>
              )}
            </div>
            <RetroButton
              size="lg"
              variant={selectedRecruits.size >= 1 && !canAfford ? 'destructive' : 'primary'}
              onClick={handleConfirmTeam}
              disabled={selectedRecruits.size < 1 || !canAfford}
            >
              {selectedRecruits.size >= 1 && !canAfford ? (
                <>OVER BUDGET <AlertTriangle size={18} /></>
              ) : (
                <>
                  SIGN TEAM{totalSigningCost > 0 ? ` — $${totalSigningCost.toLocaleString()}` : ''}
                  <ChevronRight size={20} />
                </>
              )}
            </RetroButton>
          </div>
        </div>
      </RetroPanel>
    </div>
  )
}

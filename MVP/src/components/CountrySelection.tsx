import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Users, Shield, Zap, ChevronLeft, ChevronRight,
  Pin, X, ArrowUpDown, Landmark, Coins, Cpu, Scale,
} from 'lucide-react'
import { useGameStore } from '../stores/enhancedGameStore'
import { ALL_COUNTRIES as COUNTRIES, type Country } from '../data/allCountries'
import { getCitiesByCountry } from '../data/allCities'
import { getEducationLevel } from '../data/worldData'
import { CULTURE_CODES } from '../data/cities'
import {
  RetroPanel, RetroInput, RetroButton, RetroBadge, RetroTabs, RetroTabPanel, RetroModal,
  CountryFlag, type RetroBadgeProps,
} from './ui'
import CountryCompareTable from './CountryCompareTable'

// ---------- Region filter chips (derived from cultureCode 1-14) ----------
const REGIONS: { id: string; label: string; codes: number[] }[] = [
  { id: 'all', label: 'All', codes: [] },
  { id: 'africa', label: 'Africa', codes: [1, 2, 3] },
  { id: 'asia', label: 'Asia', codes: [4, 5, 6] },
  { id: 'europe', label: 'Europe', codes: [9, 10] },
  { id: 'americas', label: 'Americas', codes: [7, 8, 12, 13] },
  { id: 'mideast', label: 'Middle East', codes: [14] },
  { id: 'oceania', label: 'Oceania', codes: [11] },
]

// ---------- Sort options ----------
interface SortOption {
  id: string
  label: string
  short: string
  get: (c: Country) => number | string
  defaultDesc: boolean
}

const SORTS: SortOption[] = [
  { id: 'name', label: 'Name', short: 'POP', get: c => c.name, defaultDesc: false },
  { id: 'population', label: 'Population', short: 'POP', get: c => c.population, defaultDesc: true },
  { id: 'gdp', label: 'GDP', short: 'GDP', get: c => c.gdpNational, defaultDesc: true },
  { id: 'military', label: 'Military', short: 'MIL', get: c => c.militaryBudget, defaultDesc: true },
  { id: 'science', label: 'Science', short: 'SCI', get: c => c.science, defaultDesc: true },
  { id: 'corruption', label: 'Corruption', short: 'COR', get: c => c.governmentCorruption, defaultDesc: false },
]

const fmtPop = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n)

// ---------- Tone helpers (green good -> red bad; invert for corruption etc.) ----------
function toneClasses(value: number, invert = false): { bar: string; text: string } {
  const eff = invert ? 100 - value : value
  if (eff >= 80) return { bar: 'bg-success', text: 'text-success' }
  if (eff >= 50) return { bar: 'bg-primary', text: 'text-primary' }
  if (eff >= 30) return { bar: 'bg-warning', text: 'text-warning' }
  return { bar: 'bg-destructive', text: 'text-destructive' }
}

function perceptionVariant(p: string): RetroBadgeProps['variant'] {
  if (p === 'Full Democracy') return 'success'
  if (p === 'Flawed Democracy') return 'primary'
  if (p === 'Hybrid Regime') return 'warning'
  return 'destructive'
}

function legalityVariant(v: string): RetroBadgeProps['variant'] {
  if (v === 'Legal') return 'success'
  if (v === 'Regulated') return 'warning'
  return 'destructive'
}

function severityVariant(v: string): RetroBadgeProps['variant'] {
  if (v === 'Inactive' || v === 'None') return 'success'
  if (v === 'Rare') return 'warning'
  return 'destructive'
}

// ---------- Small display components ----------
function StatBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const v = Math.max(0, Math.min(100, value))
  const tone = toneClasses(v, invert)
  return (
    <div className="flex items-center gap-3 py-1" title={`${label}: ${v}/100${invert ? ' (lower is better)' : ''}`}>
      <span className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-black/50 border border-black overflow-hidden">
        <div className={`h-full ${tone.bar} transition-all duration-200`} style={{ width: `${v}%` }} />
      </div>
      <span className={`w-9 shrink-0 text-right font-tactical text-sm font-bold ${tone.text}`}>{v}</span>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-black/20 last:border-b-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  )
}

// ---------- Main screen ----------
export default function CountrySelection() {
  const { selectCountry } = useGameStore()

  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('all')
  const [sortId, setSortId] = useState('name')
  const [desc, setDesc] = useState(false)
  const [selected, setSelected] = useState<Country | null>(null)
  const [activeTab, setActiveTab] = useState('govt')
  const [pinned, setPinned] = useState<number[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const sort = SORTS.find(s => s.id === sortId) ?? SORTS[0]

  // Filter + sort the full 168-country roster
  const filtered = useMemo(() => {
    let list = COUNTRIES
    const regionDef = REGIONS.find(r => r.id === region)
    if (regionDef && regionDef.codes.length > 0) {
      list = list.filter(c => regionDef.codes.includes(c.cultureCode))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.nationality.toLowerCase().includes(q))
    }
    const dir = desc ? -1 : 1
    return [...list].sort((a, b) => {
      const av = sort.get(a)
      const bv = sort.get(b)
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir
      }
      return (av - bv) * dir
    })
  }, [search, region, sortId, desc, sort])

  // Always keep a live selection so the detail panel never sits empty
  useEffect(() => {
    if (!selected && filtered.length > 0) setSelected(filtered[0])
  }, [filtered, selected])

  // Keep the selected row visible while rotating
  useEffect(() => {
    if (!selected) return
    const el = listRef.current?.querySelector(`[data-cid="${selected.id}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const selectedIndex = selected ? filtered.findIndex(c => c.id === selected.id) : -1

  const step = useCallback((delta: number) => {
    if (filtered.length === 0) return
    setSelected(prev => {
      const idx = prev ? filtered.findIndex(c => c.id === prev.id) : -1
      if (idx === -1) return filtered[0]
      return filtered[(idx + delta + filtered.length) % filtered.length]
    })
  }, [filtered])

  // Rotate with keyboard left/right
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (compareOpen) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, compareOpen])

  const togglePin = (id: number) => {
    setPinned(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id)
      if (prev.length >= 3) return [...prev.slice(1), id] // rotate out the oldest pin
      return [...prev, id]
    })
  }

  const pinnedCountries = useMemo(
    () => pinned.map(id => COUNTRIES.find(c => c.id === id)).filter((c): c is Country => Boolean(c)),
    [pinned]
  )

  const handleSort = (id: string) => {
    const opt = SORTS.find(s => s.id === id) ?? SORTS[0]
    setSortId(id)
    setDesc(opt.defaultDesc)
  }

  const cities = selected ? getCitiesByCountry(selected.code) : []
  const terrorismNum = selected ? Number(selected.terrorismActivity) : NaN

  const listMetric = (c: Country): string => {
    if (sortId === 'population' || sortId === 'name') return fmtPop(c.population)
    const v = sort.get(c)
    return `${sort.short} ${v}`
  }

  return (
    <div className="h-screen flex flex-col p-4 lg:p-6 gap-4 overflow-hidden">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-4 shrink-0"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight">SELECT YOUR COUNTRY</h1>
          <p className="text-sm text-muted-foreground">
            {COUNTRIES.length} nations available — country stats drive research, recruitment, and political authority
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pinnedCountries.map(c => (
            <button
              key={c.id}
              onClick={() => togglePin(c.id)}
              title={`Unpin ${c.name}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-black bg-surface hover:bg-surface-light shadow-retro-sm transition-all duration-200"
            >
              <CountryFlag code={c.code} name={c.name} size="sm" />
              <X size={12} className="text-muted-foreground" />
            </button>
          ))}
          <RetroButton
            variant={pinnedCountries.length >= 2 ? 'secondary' : 'outline'}
            size="sm"
            disabled={pinnedCountries.length < 2}
            onClick={() => setCompareOpen(true)}
            title={pinnedCountries.length < 2 ? 'Pin 2-3 countries to compare' : 'Open side-by-side comparison'}
          >
            <Scale size={16} />
            COMPARE ({pinnedCountries.length}/3)
          </RetroButton>
          <div className="hidden lg:block text-right text-xs text-muted-foreground pl-2">Step 1 of 3</div>
        </div>
      </motion.div>

      {/* Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr] gap-4">
        {/* LEFT: country browser */}
        <motion.div
          className="min-h-0"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <RetroPanel padding="sm" className="h-full flex flex-col min-h-0" shadow="default">
            <div className="space-y-2 shrink-0">
              <RetroInput
                size="sm"
                placeholder={`Search ${COUNTRIES.length} countries...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search size={16} />}
              />

              {/* Region chips */}
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-md border-2 border-black transition-all duration-200 ${
                      region === r.id
                        ? 'bg-primary text-primary-foreground shadow-retro-sm'
                        : 'bg-surface text-muted-foreground hover:bg-surface-light hover:text-foreground'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <select
                  value={sortId}
                  onChange={e => handleSort(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm font-semibold bg-input text-foreground border-2 border-black rounded-lg shadow-retro-sm cursor-pointer hover:bg-surface-light focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200"
                  title="Sort countries"
                >
                  {SORTS.map(s => (
                    <option key={s.id} value={s.id}>Sort: {s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setDesc(d => !d)}
                  title={desc ? 'Descending — click for ascending' : 'Ascending — click for descending'}
                  className="p-1.5 rounded-lg border-2 border-black bg-surface text-muted-foreground hover:bg-surface-light hover:text-foreground shadow-retro-sm transition-all duration-200"
                >
                  <ArrowUpDown size={16} className={`transition-transform duration-200 ${desc ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                <span>{filtered.length} shown</span>
                <span className="font-tactical">◀ ▶ keys rotate</span>
              </div>
            </div>

            {/* Country list */}
            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto mt-2 -mx-1 px-1 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <MapPin size={32} className="mx-auto mb-2 opacity-40" />
                  No countries match — clear the search or region filter
                </div>
              ) : (
                filtered.map(c => {
                  const isSelected = selected?.id === c.id
                  const isPinned = pinned.includes(c.id)
                  return (
                    <div
                      key={c.id}
                      data-cid={c.id}
                      className={`group flex items-center gap-2 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:border-black hover:bg-surface-light'
                      }`}
                      onClick={() => setSelected(c)}
                    >
                      <button
                        className="flex-1 flex items-center gap-2.5 px-2 py-1.5 text-left min-w-0"
                        onClick={e => { e.stopPropagation(); setSelected(c) }}
                      >
                        <CountryFlag code={c.code} name={c.name} size="md" className="shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {c.name}
                          </span>
                          <span className="block text-[11px] text-muted-foreground truncate">
                            {c.governmentPerception}
                          </span>
                        </span>
                        <span className="shrink-0 font-tactical text-xs text-muted-foreground">{listMetric(c)}</span>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); togglePin(c.id) }}
                        title={isPinned ? `Unpin ${c.name}` : `Pin ${c.name} for compare`}
                        className={`shrink-0 p-1.5 mr-1 rounded-md transition-all duration-200 ${
                          isPinned
                            ? 'text-primary opacity-100'
                            : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-surface'
                        }`}
                      >
                        <Pin size={14} className={isPinned ? 'fill-current' : ''} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </RetroPanel>
        </motion.div>

        {/* RIGHT: detail panel */}
        <motion.div
          className="min-h-0"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <RetroPanel padding="md" className="h-full flex flex-col min-h-0 overflow-hidden" shadow="default">
            {selected ? (
              <motion.div
                key={selected.id}
                className="flex-1 min-h-0 flex flex-col"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Detail header with prev/next rotation */}
                <div className="flex items-start gap-3 shrink-0">
                  <CountryFlag code={selected.code} name={selected.name} size="xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{selected.name}</h2>
                      <RetroBadge variant={perceptionVariant(selected.governmentPerception)} size="sm">
                        {selected.governmentPerception}
                      </RetroBadge>
                    </div>
                    <p className="text-sm text-muted-foreground italic truncate">
                      {selected.motto || 'No official motto'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {fmtPop(selected.population)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {CULTURE_CODES[selected.cultureCode] || 'Unknown region'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Landmark size={12} /> {selected.leaderTitle || 'Leader'}: <span className="text-foreground font-medium">{selected.president}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => step(-1)}
                      title="Previous country (Left arrow)"
                      className="p-2 rounded-lg border-2 border-black bg-surface text-foreground hover:bg-primary hover:text-primary-foreground shadow-retro-sm hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="font-tactical text-xs text-muted-foreground w-16 text-center">
                      {selectedIndex >= 0 ? `${selectedIndex + 1} / ${filtered.length}` : `— / ${filtered.length}`}
                    </span>
                    <button
                      onClick={() => step(1)}
                      title="Next country (Right arrow)"
                      className="p-2 rounded-lg border-2 border-black bg-surface text-foreground hover:bg-primary hover:text-primary-foreground shadow-retro-sm hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => togglePin(selected.id)}
                      title={pinned.includes(selected.id) ? 'Unpin from compare' : 'Pin for compare'}
                      className={`p-2 rounded-lg border-2 border-black shadow-retro-sm hover:-translate-y-0.5 transition-all duration-200 ${
                        pinned.includes(selected.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-light'
                      }`}
                    >
                      <Pin size={18} className={pinned.includes(selected.id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>

                {/* Stat tabs */}
                <RetroTabs
                  className="mt-4 flex-1 min-h-0 flex flex-col"
                  variant="default"
                  size="sm"
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  tabs={[
                    { id: 'govt', label: 'GOVT', icon: <Landmark size={14} /> },
                    { id: 'economy', label: 'ECONOMY', icon: <Coins size={14} /> },
                    { id: 'forces', label: 'FORCES', icon: <Shield size={14} /> },
                    { id: 'tech', label: 'TECH & MEDIA', icon: <Cpu size={14} /> },
                    { id: 'supers', label: 'SUPERS', icon: <Zap size={14} /> },
                  ]}
                >
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <RetroTabPanel id="govt" activeTab={activeTab} padding="sm">
                      <InfoRow label="Government Type">{selected.governmentType}</InfoRow>
                      <InfoRow label="Leader">
                        {selected.leaderTitle || 'Leader'} {selected.president}
                      </InfoRow>
                      <InfoRow label="Term Length">{selected.presidentialTerm} years</InfoRow>
                      <InfoRow label="Perception">
                        <RetroBadge variant={perceptionVariant(selected.governmentPerception)} size="sm">
                          {selected.governmentPerception}
                        </RetroBadge>
                      </InfoRow>
                      <InfoRow label="Capital Punishment">
                        <RetroBadge variant={severityVariant(selected.capitalPunishment)} size="sm">
                          {selected.capitalPunishment || 'Unknown'}
                        </RetroBadge>
                      </InfoRow>
                      <div className="mt-3">
                        <StatBar label="Corruption" value={selected.governmentCorruption} invert />
                      </div>
                    </RetroTabPanel>

                    <RetroTabPanel id="economy" activeTab={activeTab} padding="sm">
                      <InfoRow label="Population">
                        {selected.population.toLocaleString()} (rating {selected.populationRating}/100)
                      </InfoRow>
                      <div className="mt-3 space-y-0.5">
                        <StatBar label="National GDP" value={selected.gdpNational} />
                        <StatBar label="GDP Per Capita" value={selected.gdpPerCapita} />
                        <StatBar label="Social Development" value={selected.socialDevelopment} />
                        <StatBar label="Lifestyle" value={selected.lifestyle} />
                      </div>
                    </RetroTabPanel>

                    <RetroTabPanel id="forces" activeTab={activeTab} padding="sm">
                      <div className="space-y-0.5">
                        <StatBar label="Military Budget" value={selected.militaryBudget} />
                        <StatBar label="Military Services" value={selected.militaryServices} />
                        <StatBar label="Intel Budget" value={selected.intelligenceBudget} />
                        <StatBar label="Intel Services" value={selected.intelligenceServices} />
                        <StatBar label="Law Enforcement" value={selected.lawEnforcement} />
                        <StatBar label="Law Budget" value={selected.lawEnforcementBudget} />
                      </div>
                    </RetroTabPanel>

                    <RetroTabPanel id="tech" activeTab={activeTab} padding="sm">
                      <InfoRow label="Education Level">
                        {getEducationLevel(selected.higherEducation)}
                      </InfoRow>
                      <div className="mt-3 space-y-0.5">
                        <StatBar label="Science" value={selected.science} />
                        <StatBar label="Cyber Capabilities" value={selected.cyberCapabilities} />
                        <StatBar label="Digital Development" value={selected.digitalDevelopment} />
                        <StatBar label="Media Freedom" value={selected.mediaFreedom} />
                        <StatBar label="Higher Education" value={selected.higherEducation} />
                        <StatBar label="Healthcare" value={selected.healthcare} />
                      </div>
                    </RetroTabPanel>

                    <RetroTabPanel id="supers" activeTab={activeTab} padding="sm">
                      <InfoRow label="LSW Regulations">
                        <RetroBadge variant={legalityVariant(selected.lswRegulations)} size="sm">
                          {selected.lswRegulations}
                        </RetroBadge>
                      </InfoRow>
                      <InfoRow label="Vigilantism">
                        <RetroBadge variant={legalityVariant(selected.vigilantism)} size="sm">
                          {selected.vigilantism}
                        </RetroBadge>
                      </InfoRow>
                      <InfoRow label="Cloning">
                        <RetroBadge variant={legalityVariant(selected.cloning)} size="sm">
                          {selected.cloning}
                        </RetroBadge>
                      </InfoRow>
                      {!Number.isFinite(terrorismNum) && (
                        <InfoRow label="Terrorism">
                          <RetroBadge variant={severityVariant(selected.terrorismActivity)} size="sm">
                            {selected.terrorismActivity}
                          </RetroBadge>
                        </InfoRow>
                      )}
                      <div className="mt-3 space-y-0.5">
                        <StatBar label="LSW Activity" value={selected.lswActivity} />
                        {Number.isFinite(terrorismNum) && (
                          <StatBar label="Terrorism" value={terrorismNum} invert />
                        )}
                      </div>
                    </RetroTabPanel>
                  </div>
                </RetroTabs>

                {/* Cities + confirm */}
                <div className="shrink-0 mt-3 pt-3 border-t-2 border-black/30">
                  <div className="flex items-center gap-2 flex-wrap mb-3 min-h-[1.5rem]">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Cities ({cities.length})
                    </span>
                    {cities.slice(0, 5).map(city => (
                      <RetroBadge key={city.name} variant="muted" size="sm" shadow="none">
                        {city.name}
                      </RetroBadge>
                    ))}
                    {cities.length > 5 && (
                      <span className="text-[11px] text-muted-foreground">+{cities.length - 5} more</span>
                    )}
                    {cities.length === 0 && (
                      <span className="text-[11px] text-muted-foreground">No city data yet</span>
                    )}
                  </div>
                  <RetroButton
                    variant="primary"
                    size="lg"
                    className="w-full font-bold tracking-wide"
                    onClick={() => selectCountry(selected.name)}
                  >
                    ESTABLISH OPERATIONS IN {selected.name.toUpperCase()}
                  </RetroButton>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MapPin size={64} className="mb-4 opacity-40" />
                <p className="text-xl">Select a country to view details</p>
                <p className="text-sm mt-2">Search, filter by region, or use the arrow keys</p>
              </div>
            )}
          </RetroPanel>
        </motion.div>
      </div>

      {/* Compare modal */}
      <RetroModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        title={`COMPARE COUNTRIES (${pinnedCountries.length})`}
        description="Best value per stat is highlighted — corruption and terrorism favor the lowest."
        size="full"
      >
        {pinnedCountries.length >= 2 ? (
          <CountryCompareTable
            countries={pinnedCountries}
            onUnpin={id => {
              togglePin(id)
              if (pinnedCountries.length <= 2) setCompareOpen(false)
            }}
            onSelect={name => {
              setCompareOpen(false)
              selectCountry(name)
            }}
          />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Scale size={40} className="mx-auto mb-3 opacity-40" />
            Pin at least two countries (pin icon in the list) to compare them side by side.
          </div>
        )}
      </RetroModal>
    </div>
  )
}

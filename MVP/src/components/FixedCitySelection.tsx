import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  ArrowLeft,
  MapPin,
  Shield,
  AlertTriangle,
  Building,
  ChevronRight,
  Search,
  ArrowUp,
  ArrowDown,
  Crosshair,
  Star,
} from 'lucide-react'
import { getCitiesByCountry, type City } from '../data/allCities'
import { getCountryByName, codeToFlag } from '../data/allCountries'
import { RetroPanel, RetroButton, RetroBadge, RetroInput } from './ui'

// ─────────────────────────────────────────────────────────────────────────────
// City type bonus mapping — single source of truth shared by the comparison
// table (compact badges) and the expanded detail strip (full text).
// ─────────────────────────────────────────────────────────────────────────────
export const CITY_TYPE_BONUSES: Record<string, { short: string; full: string }> = {
  Political: { short: '+2CS Diplomatic', full: '+2CS Political/Diplomatic investigations' },
  Military: { short: '+2CS Military', full: '+2CS Military/Security investigations, +3CS military recruitment' },
  Company: { short: '+2CS Corporate', full: '+2CS Corporate/Financial investigations' },
  Industrial: { short: '+2CS Sabotage', full: '+2CS Corporate/Sabotage investigations' },
  Educational: { short: '+3CS Recruiting', full: '+3CS recruiting intelligent LSWs, +2CS Academic investigations' },
  Temple: { short: '+2CS Mystical', full: '+2CS Religious/Mystical investigations' },
  Resort: { short: '+1CS Social', full: '+1CS Social/Surveillance investigations' },
  Seaport: { short: '+2CS Smuggling', full: '+2CS Smuggling/Maritime investigations' },
  Mining: { short: '+2CS Environmental', full: '+2CS Environmental/Industrial investigations' },
}

const CITY_TYPE_ICONS: Record<string, string> = {
  Political: '🏛️',
  Military: '⚔️',
  Company: '🏢',
  Industrial: '🏭',
  Educational: '🎓',
  Temple: '⛩️',
  Resort: '🏖️',
  Seaport: '⚓',
  Mining: '⛏️',
}

const POP_TYPE_ICONS: Record<string, string> = {
  'Mega City': '🏙️',
  'Large City': '🌆',
  City: '🏢',
  Town: '🏘️',
  'Small Town': '🏡',
}

type SortKey = 'name' | 'population' | 'crime' | 'safety'
type SortDir = 'asc' | 'desc'

// Compact population formatting so numbers stop looking "samey"
function formatPop(pop: number): string {
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`
  if (pop >= 1_000) return `${Math.round(pop / 1_000)}K`
  return pop.toLocaleString()
}

function getCrimeLevel(crimeIndex: number): string {
  if (crimeIndex < 20) return 'Very Low'
  if (crimeIndex < 40) return 'Low'
  if (crimeIndex < 60) return 'Moderate'
  if (crimeIndex < 80) return 'High'
  return 'Very High'
}

// Continuous green→red color scale so stat differences pop.
// invert=true means high value is BAD (crime); false means high is GOOD (safety).
function statHue(value: number, invert: boolean): number {
  const clamped = Math.max(0, Math.min(100, value))
  return invert ? 120 - clamped * 1.2 : clamped * 1.2
}

function StatBar({ value, invert, best }: { value: number; invert: boolean; best: boolean }) {
  const hue = statHue(value, invert)
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2.5 rounded-full bg-black/60 border border-black overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${Math.max(4, Math.min(100, value))}%`,
            backgroundColor: `hsl(${hue} 75% 50%)`,
          }}
        />
      </div>
      <span
        className={`text-sm tabular-nums w-9 text-right ${
          best ? 'font-bold text-primary-light' : 'text-foreground/80'
        }`}
        style={{ color: best ? undefined : `hsl(${hue} 75% 60%)` }}
      >
        {Math.round(value)}
      </span>
      {best && <Star size={12} className="text-primary-light flex-shrink-0" fill="currentColor" />}
    </div>
  )
}

function RatingDots({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 7 }, (_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
            i < rating ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = 'left',
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = activeKey === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      } ${align === 'right' ? 'ml-auto' : ''}`}
    >
      {label}
      {active ? (
        dir === 'asc' ? (
          <ArrowUp size={12} />
        ) : (
          <ArrowDown size={12} />
        )
      ) : (
        <span className="w-3" />
      )}
    </button>
  )
}

export default function FixedCitySelection() {
  const { selectedCountry, setGamePhase, selectCity } = useGameStore()
  const [selectedCityData, setSelectedCityData] = useState<City | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('population')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const country = getCountryByName(selectedCountry)

  // Full city list for this country (unfiltered) — used for best-in-country math
  const countryCities = useMemo(
    () => (country ? getCitiesByCountry(country.code) : []),
    [country]
  )

  // Best-in-country values per column (bolded in the table)
  const best = useMemo(() => {
    if (countryCities.length === 0) return null
    return {
      population: Math.max(...countryCities.map(c => c.population)),
      crime: Math.min(...countryCities.map(c => c.crimeIndex)),
      safety: Math.max(...countryCities.map(c => c.safetyIndex)),
    }
  }, [countryCities])

  // City types present in this country, in canonical order — filter chips
  const availableTypes = useMemo(() => {
    const present = new Set<string>()
    countryCities.forEach(c => c.cityTypes.forEach(t => t && present.add(t)))
    return Object.keys(CITY_TYPE_BONUSES).filter(t => present.has(t))
  }, [countryCities])

  // Search + type filter + sort
  const visibleCities = useMemo(() => {
    let cities = countryCities
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      cities = cities.filter(
        city =>
          city.name.toLowerCase().includes(q) ||
          city.cityTypes.some(t => t?.toLowerCase().includes(q))
      )
    }
    if (activeTypes.size > 0) {
      cities = cities.filter(city => city.cityTypes.some(t => activeTypes.has(t)))
    }
    const dir = sortDir === 'asc' ? 1 : -1
    return [...cities].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'population':
          return (a.population - b.population) * dir
        case 'crime':
          return (a.crimeIndex - b.crimeIndex) * dir
        case 'safety':
          return (a.safetyIndex - b.safetyIndex) * dir
        default:
          return 0
      }
    })
  }, [countryCities, searchTerm, activeTypes, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      // Sensible default direction per column: low crime is good, high pop/safety is good
      setSortDir(key === 'name' || key === 'crime' ? 'asc' : 'desc')
    }
  }

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const handleRowClick = (city: City) => {
    setSelectedCityData(prev => (prev?.name === city.name ? null : city))
  }

  const handleConfirmCity = () => {
    if (selectedCityData) {
      selectCity(selectedCityData.name)
    }
  }

  const makePlaceholderCity = (): City => ({
    id: -1,
    sector: '',
    countryId: country?.id ?? 0,
    countryCode: country?.code ?? '',
    countryName: selectedCountry,
    cultureCode: country?.cultureCode ?? 0,
    name: `${selectedCountry} Capital`,
    population: 1000000,
    populationRating: 5,
    populationType: 'City',
    cityTypes: ['Political'],
    hvt: '',
    crimeIndex: 50,
    safetyIndex: 50,
  })

  // Expanded detail strip content — shared by table rows and placeholder panel
  const renderDetailStrip = (city: City) => (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="border-2 border-black rounded-lg bg-surface-light/60 p-4"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Full bonus breakdown */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            City Bonuses
          </div>
          <div className="space-y-1.5">
            {city.cityTypes.filter(t => t && CITY_TYPE_BONUSES[t]).map(type => (
              <div key={type} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0">{CITY_TYPE_ICONS[type] ?? '🏠'}</span>
                <span>
                  <span className="text-primary-light font-semibold">{type}:</span>{' '}
                  <span className="text-foreground/90">{CITY_TYPE_BONUSES[type].full}</span>
                </span>
              </div>
            ))}
            {city.cityTypes.filter(t => t && CITY_TYPE_BONUSES[t]).length === 0 && (
              <div className="text-sm text-muted-foreground">No special bonuses</div>
            )}
          </div>
        </div>

        {/* Intel column: pop type, HVT, sector */}
        <div className="md:w-56 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span>{POP_TYPE_ICONS[city.populationType] ?? '🏠'}</span>
            <span className="text-muted-foreground">Classification:</span>
            <span className="font-semibold text-foreground">{city.populationType}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Crime: <span className="font-semibold" style={{ color: `hsl(${statHue(city.crimeIndex, true)} 75% 60%)` }}>{getCrimeLevel(city.crimeIndex)}</span>
          </div>
          {city.hvt && (
            <RetroBadge variant="destructive" size="md" icon={<Crosshair size={12} />}>
              HVT: {city.hvt}
            </RetroBadge>
          )}
          {city.sector && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} />
              Grid Sector {city.sector}
            </div>
          )}
        </div>
      </div>

      {/* Establish HQ — prominent, on the selected row itself */}
      <div className="mt-4">
        <RetroButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleConfirmCity}
        >
          ESTABLISH HQ IN {city.name.toUpperCase()}
          <ChevronRight size={20} />
        </RetroButton>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen flex items-start justify-center p-6 overflow-auto">
      <motion.div
        className="max-w-6xl w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <RetroButton
            variant="ghost"
            size="sm"
            shadow="none"
            onClick={() => setGamePhase('country-selection')}
          >
            <ArrowLeft size={18} />
            Back to Countries
          </RetroButton>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary uppercase">
              Select Your City
            </h1>
            <p className="text-muted-foreground mt-1">
              Establish headquarters in {selectedCountry}
            </p>
          </div>

          <div className="text-right">
            <RetroBadge variant="outline" size="md">Step 2 of 3</RetroBadge>
            <div className="text-xs text-muted-foreground mt-1.5">
              {country ? codeToFlag(country.code) : ''} {selectedCountry}
            </div>
          </div>
        </div>

        {countryCities.length > 0 ? (
          <RetroPanel
            variant="default"
            padding="md"
            title={`Cities (${visibleCities.length}/${countryCities.length})`}
            icon={<Building size={20} />}
            actions={
              <div className="w-52">
                <RetroInput
                  size="sm"
                  shadow="none"
                  placeholder="Search cities..."
                  leftIcon={<Search size={14} />}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            }
          >
            {/* City-type filter chips */}
            {availableTypes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
                  Filter:
                </span>
                {availableTypes.map(type => {
                  const active = activeTypes.has(type)
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black rounded-md transition-all duration-200 ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-retro-sm -translate-y-0.5'
                          : 'bg-surface-light text-foreground/80 hover:bg-primary/20 hover:text-foreground hover:-translate-y-0.5'
                      }`}
                    >
                      {CITY_TYPE_ICONS[type] ?? '🏠'} {type}
                    </button>
                  )
                })}
                {activeTypes.size > 0 && (
                  <button
                    onClick={() => setActiveTypes(new Set())}
                    className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors duration-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Comparison table — all stats visible, no click required */}
            <div className="overflow-x-auto max-h-[62vh] overflow-y-auto rounded-lg border-2 border-black">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-surface-light border-b-2 border-black">
                    <th className="px-3 py-2.5">
                      <SortHeader label="City" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-3 py-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</span>
                    </th>
                    <th className="px-3 py-2.5">
                      <SortHeader label="Population" sortKey="population" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-3 py-2.5">
                      <SortHeader label="Crime" sortKey="crime" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-3 py-2.5">
                      <SortHeader label="Safety" sortKey="safety" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-3 py-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bonuses</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCities.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center">
                        <MapPin size={32} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">
                          No cities match your filters
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm('')
                            setActiveTypes(new Set())
                          }}
                          className="mt-2 text-sm text-primary hover:text-primary-light underline underline-offset-2 transition-colors duration-200"
                        >
                          Clear search & filters
                        </button>
                      </td>
                    </tr>
                  )}
                  {visibleCities.map(city => {
                    const isSelected = selectedCityData?.name === city.name
                    const bonusTypes = city.cityTypes.filter(t => t && CITY_TYPE_BONUSES[t])
                    return (
                      <React.Fragment key={city.id}>
                        <tr
                          onClick={() => handleRowClick(city)}
                          className={`cursor-pointer border-b border-black/40 transition-colors duration-200 ${
                            isSelected
                              ? 'bg-primary/15'
                              : 'bg-surface even:bg-surface/60 hover:bg-surface-light'
                          }`}
                        >
                          {/* City name */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{POP_TYPE_ICONS[city.populationType] ?? '🏠'}</span>
                              <div>
                                <div className={`font-bold leading-tight ${isSelected ? 'text-primary-light' : 'text-foreground'}`}>
                                  {city.name}
                                </div>
                                {city.hvt && (
                                  <div className="text-[10px] text-destructive font-semibold uppercase tracking-wide">
                                    HVT Present
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Type badges */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[130px]">
                              {city.cityTypes.filter(t => t).map(type => (
                                <span
                                  key={type}
                                  title={CITY_TYPE_BONUSES[type]?.full ?? type}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-black/40 border border-black rounded text-foreground/80"
                                >
                                  {CITY_TYPE_ICONS[type] ?? '🏠'} {type}
                                </span>
                              ))}
                            </div>
                          </td>
                          {/* Population: formatted + rating dots */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-sm tabular-nums ${
                                  best && city.population === best.population
                                    ? 'font-bold text-primary-light'
                                    : 'text-foreground/90'
                                }`}
                              >
                                {formatPop(city.population)}
                              </span>
                              {best && city.population === best.population && (
                                <Star size={12} className="text-primary-light" fill="currentColor" />
                              )}
                            </div>
                            <RatingDots rating={city.populationRating} />
                          </td>
                          {/* Crime bar (low = good = green) */}
                          <td className="px-3 py-2.5">
                            <StatBar
                              value={city.crimeIndex}
                              invert
                              best={best ? city.crimeIndex === best.crime : false}
                            />
                          </td>
                          {/* Safety bar (high = good = green) */}
                          <td className="px-3 py-2.5">
                            <StatBar
                              value={city.safetyIndex}
                              invert={false}
                              best={best ? city.safetyIndex === best.safety : false}
                            />
                          </td>
                          {/* Compact bonus badges */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[170px]">
                              {bonusTypes.slice(0, 2).map(type => (
                                <span
                                  key={type}
                                  title={CITY_TYPE_BONUSES[type].full}
                                  className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/15 border border-primary/50 rounded text-primary-light whitespace-nowrap"
                                >
                                  {CITY_TYPE_BONUSES[type].short}
                                </span>
                              ))}
                              {bonusTypes.length > 2 && (
                                <span
                                  title={bonusTypes.slice(2).map(t => CITY_TYPE_BONUSES[t].full).join(' • ')}
                                  className="px-1.5 py-0.5 text-[10px] font-bold bg-black/40 border border-black rounded text-muted-foreground"
                                >
                                  +{bonusTypes.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Inline expanded detail strip — directly under the row */}
                        <AnimatePresence>
                          {isSelected && (
                            <tr className="bg-primary/5">
                              <td colSpan={6} className="px-3 py-3 border-b-2 border-black">
                                {renderDetailStrip(city)}
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star size={11} className="text-primary-light" fill="currentColor" /> Best in country
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle size={11} /> Crime: lower is better
              </span>
              <span className="flex items-center gap-1">
                <Shield size={11} /> Safety: higher is better
              </span>
              <span>Click a row for full intel &amp; HQ placement</span>
            </div>
          </RetroPanel>
        ) : (
          /* Placeholder-city fallback for countries with no city data */
          <RetroPanel variant="default" padding="lg" title="No City Data" icon={<MapPin size={20} />}>
            <div className="text-center py-8">
              <MapPin size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground/90">No cities available for {selectedCountry}</p>
              <p className="text-sm text-muted-foreground mt-2">
                City data may not be loaded for this country yet.
              </p>
              {!selectedCityData && (
                <RetroButton
                  variant="secondary"
                  size="md"
                  className="mt-4"
                  onClick={() => setSelectedCityData(makePlaceholderCity())}
                >
                  Use Placeholder City
                </RetroButton>
              )}
            </div>
            {selectedCityData && (
              <div className="mt-2">
                <div className="text-sm font-bold text-foreground mb-2">
                  {POP_TYPE_ICONS[selectedCityData.populationType] ?? '🏠'} {selectedCityData.name}
                </div>
                {renderDetailStrip(selectedCityData)}
              </div>
            )}
          </RetroPanel>
        )}

        {/* Info Footer */}
        <motion.div
          className="text-center mt-4 text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p>City type affects available investigations, recruitment options, and facility bonuses</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

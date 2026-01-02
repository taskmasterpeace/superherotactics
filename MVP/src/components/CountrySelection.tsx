import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { Search, MapPin, Users, Shield, GraduationCap, Heart, Zap, ChevronDown } from 'lucide-react'
import { COUNTRIES, getCitiesByCountry, getEducationLevel, type Country } from '../data/worldData'

export default function CountrySelection() {
  const { setGamePhase, selectCountry } = useGameStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountryData, setSelectedCountryData] = useState<Country | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return COUNTRIES.slice(0, 10); // Show first 10 by default
    const lowQuery = searchTerm.toLowerCase()
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(lowQuery) ||
      c.nationality.toLowerCase().includes(lowQuery)
    ).slice(0, 20)
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCountry = (country: Country) => {
    setSelectedCountryData(country)
    setSearchTerm(country.name)
    setShowDropdown(false)
  }

  const handleConfirmCountry = () => {
    if (selectedCountryData) {
      selectCountry(selectedCountryData.name)
    }
  }

  const cities = selectedCountryData ? getCitiesByCountry(selectedCountryData.name) : []

  return (
    <div className="h-screen flex items-center justify-center p-6 overflow-auto">
      <motion.div
        className="max-w-6xl w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="w-32" /> {/* Spacer */}

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Select Your Country
            </h1>
            <p className="text-gray-400 mt-2">
              Choose any country as your base of operations
            </p>
          </div>

          <div className="text-right w-32">
            <div className="text-sm text-gray-400">Step 1 of 3</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Country Search */}
          <motion.div
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="text-blue-400" size={24} />
              Country Selection
            </h2>

            {/* Autocomplete Search */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type to search countries..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-lg"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowDropdown(true)
                    if (selectedCountryData && e.target.value !== selectedCountryData.name) {
                      setSelectedCountryData(null)
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                <ChevronDown
                  className={`absolute right-3 top-3 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  size={20}
                />
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                  >
                    {filteredCountries.length === 0 ? (
                      <div className="p-4 text-gray-400 text-center">
                        No countries found
                      </div>
                    ) : (
                      filteredCountries.map((country) => (
                        <button
                          key={country.id}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left ${
                            selectedCountryData?.id === country.id ? 'bg-blue-600/20 border-l-4 border-blue-400' : ''
                          }`}
                          onClick={() => handleSelectCountry(country)}
                        >
                          <span className="text-2xl">{country.flag}</span>
                          <div className="flex-1">
                            <div className="font-medium text-white">{country.name}</div>
                            <div className="text-xs text-gray-400">{country.nationality} • {country.governmentPerception}</div>
                          </div>
                        </button>
                      ))
                    )}
                    {searchTerm === '' && (
                      <div className="p-3 text-center text-gray-500 text-sm border-t border-gray-700">
                        Type to search all {COUNTRIES.length} countries
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Filters */}
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">Popular Countries:</div>
              <div className="grid grid-cols-4 gap-2">
                {['United States', 'India', 'China', 'Nigeria', 'Japan', 'Germany', 'Brazil', 'United Kingdom'].map(name => {
                  const country = COUNTRIES.find(c => c.name === name)
                  if (!country) return null
                  const isSelected = selectedCountryData?.name === name
                  return (
                    <button
                      key={name}
                      onClick={() => handleSelectCountry(country)}
                      className={`px-2 py-2 text-xs rounded-lg flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : 'bg-gray-700/50 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="truncate">{name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Right Panel - Country Info */}
          <div
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 relative z-10"
          >
            {selectedCountryData ? (
              <>
                {/* Country Header */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl">{selectedCountryData.flag}</span>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white">{selectedCountryData.name}</h2>
                    <p className="text-gray-400">{selectedCountryData.motto || 'No official motto'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        selectedCountryData.governmentPerception === 'Full Democracy' ? 'bg-green-600' :
                        selectedCountryData.governmentPerception === 'Flawed Democracy' ? 'bg-yellow-600' :
                        selectedCountryData.governmentPerception === 'Hybrid Regime' ? 'bg-orange-600' :
                        'bg-red-600'
                      } text-white`}>
                        {selectedCountryData.governmentPerception}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <StatCard
                    icon={<Users size={20} />}
                    label="Population"
                    value={selectedCountryData.population.toLocaleString()}
                    sublabel={`Rating: ${selectedCountryData.populationRating}/100`}
                  />
                  <StatCard
                    icon={<Shield size={20} />}
                    label="Military"
                    value={`${selectedCountryData.militaryBudget}/100`}
                    sublabel={`Intel: ${selectedCountryData.intelligenceBudget}/100`}
                  />
                  <StatCard
                    icon={<GraduationCap size={20} />}
                    label="Education"
                    value={getEducationLevel(selectedCountryData.higherEducation)}
                    sublabel={`Science: ${selectedCountryData.science}/100`}
                  />
                  <StatCard
                    icon={<Heart size={20} />}
                    label="Healthcare"
                    value={`${selectedCountryData.healthcare}/100`}
                    sublabel={selectedCountryData.cloning > 0 ? `Cloning: ${selectedCountryData.cloning}%` : 'No cloning'}
                  />
                </div>

                {/* LSW Info */}
                <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <Zap size={18} />
                    LSW Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Activity Level:</span>
                      <span className="ml-2 text-white">{selectedCountryData.lswActivity}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Regulations:</span>
                      <span className={`ml-2 ${
                        selectedCountryData.lswRegulations === 'Legal' ? 'text-green-400' :
                        selectedCountryData.lswRegulations === 'Regulated' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{selectedCountryData.lswRegulations}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Vigilantism:</span>
                      <span className={`ml-2 ${
                        selectedCountryData.vigilantism === 'Legal' ? 'text-green-400' :
                        selectedCountryData.vigilantism === 'Regulated' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{selectedCountryData.vigilantism}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Terrorism:</span>
                      <span className={`ml-2 ${
                        selectedCountryData.terrorismActivity === 'Inactive' ? 'text-green-400' :
                        selectedCountryData.terrorismActivity === 'Rare' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{selectedCountryData.terrorismActivity}</span>
                    </div>
                  </div>
                </div>

                {/* Available Cities */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-300 mb-2">Available Cities ({cities.length})</h3>
                  {cities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {cities.slice(0, 6).map(city => (
                        <span key={city.name} className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
                          {city.name}
                        </span>
                      ))}
                      {cities.length > 6 && (
                        <span className="px-2 py-1 text-gray-500 text-sm">+{cities.length - 6} more</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">City data not yet available for this country</p>
                  )}
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold text-lg text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleConfirmCountry}
                >
                  ESTABLISH OPERATIONS IN {selectedCountryData.name.toUpperCase()}
                </button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <MapPin size={64} className="mb-4 opacity-50" />
                <p className="text-xl">Select a country to view details</p>
                <p className="text-sm mt-2">Use the search to find any country</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Footer */}
        <motion.div
          className="text-center mt-8 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>{COUNTRIES.length} countries available • Country affects research speed, LSW recruitment, and political authority</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, sublabel }: { icon: React.ReactNode, label: string, value: string, sublabel: string }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50 hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-2 text-blue-400 mb-1">
        {icon}
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[11px] text-gray-500">{sublabel}</div>
    </div>
  )
}

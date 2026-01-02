import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { ArrowLeft, MapPin, Users, Shield, AlertTriangle, Building, ChevronRight, Search } from 'lucide-react'
import { CITIES, getCountryByName, type City } from '../data/worldData'

export default function FixedCitySelection() {
  const { selectedCountry, setGamePhase, selectCity } = useGameStore()
  const [selectedCityData, setSelectedCityData] = useState<City | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get cities for the selected country, filtered by search
  const availableCities = useMemo(() => {
    const cities = CITIES.filter(city => city.country === selectedCountry)
    if (!searchTerm) return cities
    return cities.filter(city =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.cityTypes.some(t => t?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [selectedCountry, searchTerm])

  const country = getCountryByName(selectedCountry)

  const handleConfirmCity = () => {
    if (selectedCityData) {
      selectCity(selectedCityData.name)
    }
  }

  // Get crime level color
  const getCrimeColor = (crimeIndex: number) => {
    if (crimeIndex < 30) return 'text-green-400'
    if (crimeIndex < 50) return 'text-yellow-400'
    if (crimeIndex < 70) return 'text-orange-400'
    return 'text-red-400'
  }

  // Get crime level text
  const getCrimeLevel = (crimeIndex: number) => {
    if (crimeIndex < 20) return 'Very Low'
    if (crimeIndex < 40) return 'Low'
    if (crimeIndex < 60) return 'Moderate'
    if (crimeIndex < 80) return 'High'
    return 'Very High'
  }

  // Get population type icon
  const getPopIcon = (popType: string) => {
    switch (popType) {
      case 'Mega City': return '🏙️'
      case 'Large City': return '🌆'
      case 'City': return '🏢'
      case 'Town': return '🏘️'
      case 'Small Town': return '🏡'
      default: return '🏠'
    }
  }

  // Get city type icon
  const getCityTypeIcon = (type: string) => {
    switch (type) {
      case 'Political': return '🏛️'
      case 'Military': return '⚔️'
      case 'Company': return '🏢'
      case 'Industrial': return '🏭'
      case 'Educational': return '🎓'
      case 'Temple': return '⛩️'
      case 'Resort': return '🏖️'
      case 'Seaport': return '⚓'
      case 'Mining': return '⛏️'
      default: return '🏠'
    }
  }

  return (
    <div className="h-screen flex items-center justify-center p-6 overflow-auto">
      <motion.div
        className="max-w-6xl w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setGamePhase('country-selection')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Countries
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Select Your City
            </h1>
            <p className="text-gray-400 mt-2">
              Establish headquarters in {selectedCountry}
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">Step 2 of 3</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {country?.flag} {selectedCountry}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* City List */}
          <motion.div
            className="lg:col-span-2 bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building className="text-purple-400" size={24} />
                Cities ({availableCities.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-2 top-2 text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search cities..."
                  className="pl-8 pr-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 w-40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {availableCities.length > 0 ? (
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
                {availableCities.map((city, index) => (
                  <motion.button
                    key={city.name}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      selectedCityData?.name === city.name
                        ? 'bg-purple-600/30 border-purple-400'
                        : 'bg-gray-900/50 border-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedCityData(city)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPopIcon(city.populationType)}</span>
                        <div>
                          <div className="font-bold text-white text-lg">{city.name}</div>
                          <div className="text-sm text-gray-400">
                            {city.populationType} • Pop: {city.population.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getCrimeColor(city.crimeIndex)}`}>
                          {getCrimeLevel(city.crimeIndex)}
                        </div>
                        <div className="text-xs text-gray-500">Crime: {Math.round(city.crimeIndex)}%</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {city.cityTypes.filter(t => t).map(type => (
                        <span key={type} className="px-2 py-0.5 text-xs bg-gray-700 rounded text-gray-300 flex items-center gap-1">
                          {getCityTypeIcon(type)} {type}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No cities available for {selectedCountry}</p>
                <p className="text-sm text-gray-500 mt-2">City data may not be loaded for this country yet.</p>
                <button
                  onClick={() => {
                    // Create a placeholder city
                    const placeholder: City = {
                      sector: '',
                      countryCode: 0,
                      cultureCode: 0,
                      name: `${selectedCountry} Capital`,
                      country: selectedCountry,
                      population: 1000000,
                      populationRating: 5,
                      populationType: 'City',
                      cityTypes: ['Political'],
                      crimeIndex: 50,
                      safetyIndex: 50
                    }
                    setSelectedCityData(placeholder)
                  }}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm"
                >
                  Use Placeholder City
                </button>
              </div>
            )}
          </motion.div>

          {/* City Details Panel */}
          <motion.div
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {selectedCityData ? (
              <>
                {/* City Header */}
                <div className="text-center mb-6">
                  <span className="text-5xl mb-2 block">{getPopIcon(selectedCityData.populationType)}</span>
                  <h2 className="text-2xl font-bold text-white">{selectedCityData.name}</h2>
                  <p className="text-gray-400">{selectedCityData.populationType}</p>
                </div>

                {/* Stats */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users size={18} />
                      <span className="text-sm">Population</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {selectedCityData.population.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Rating: {selectedCityData.populationRating}/7</div>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <AlertTriangle size={18} />
                      <span className="text-sm">Crime Index</span>
                    </div>
                    <div className={`text-xl font-bold ${getCrimeColor(selectedCityData.crimeIndex)}`}>
                      {Math.round(selectedCityData.crimeIndex)}%
                    </div>
                    <div className="text-xs text-gray-500">{getCrimeLevel(selectedCityData.crimeIndex)} Crime</div>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Shield size={18} />
                      <span className="text-sm">Safety Index</span>
                    </div>
                    <div className={`text-xl font-bold ${
                      selectedCityData.safetyIndex > 60 ? 'text-green-400' :
                      selectedCityData.safetyIndex > 40 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {Math.round(selectedCityData.safetyIndex)}%
                    </div>
                  </div>
                </div>

                {/* City Types */}
                <div className="mb-6">
                  <h3 className="text-sm text-gray-400 mb-2">City Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCityData.cityTypes.filter(t => t).map(type => (
                      <span key={type} className="px-3 py-1 bg-purple-600/20 border border-purple-500 rounded-full text-sm text-purple-300 flex items-center gap-1">
                        {getCityTypeIcon(type)} {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* City Type Bonuses */}
                <div className="mb-6 bg-gray-900/30 rounded-lg p-3">
                  <h3 className="text-sm text-yellow-400 mb-2 font-bold">City Bonuses</h3>
                  <div className="space-y-1 text-xs">
                    {selectedCityData.cityTypes.filter(t => t).map(type => (
                      <div key={type} className="text-gray-300">
                        <span className="text-purple-400">{type}:</span>
                        {type === 'Political' && ' +2CS Political/Diplomatic investigations'}
                        {type === 'Military' && ' +2CS Military/Security investigations, +3CS military recruitment'}
                        {type === 'Company' && ' +2CS Corporate/Financial investigations'}
                        {type === 'Industrial' && ' +2CS Corporate/Sabotage investigations'}
                        {type === 'Educational' && ' +3CS recruiting intelligent LSWs, +2CS Academic investigations'}
                        {type === 'Temple' && ' +2CS Religious/Mystical investigations'}
                        {type === 'Resort' && ' +1CS Social/Surveillance investigations'}
                        {type === 'Seaport' && ' +2CS Smuggling/Maritime investigations'}
                        {type === 'Mining' && ' +2CS Environmental/Industrial investigations'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sector Info */}
                {selectedCityData.sector && (
                  <div className="mb-6 text-sm text-gray-500">
                    <span>Sector: {selectedCityData.sector}</span>
                  </div>
                )}

                {/* Confirm Button */}
                <motion.button
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmCity}
                >
                  ESTABLISH HQ IN {selectedCityData.name.toUpperCase()}
                  <ChevronRight size={20} />
                </motion.button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Building size={64} className="mb-4 opacity-50" />
                <p className="text-lg">Select a city</p>
                <p className="text-sm mt-2 text-center">Click on a city to view details and establish your headquarters</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Footer */}
        <motion.div
          className="text-center mt-6 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>City type affects available investigations, recruitment options, and facility bonuses</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

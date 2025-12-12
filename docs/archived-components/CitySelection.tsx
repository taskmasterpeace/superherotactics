import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import { ArrowLeft, MapPin, Users, Shield, Building } from 'lucide-react'

const cities = {
  'US': [
    {
      id: 'washington-dc',
      name: 'Washington DC',
      type: 'political',
      icon: '🏛️',
      population: 6200000,
      crime: 40,
      safety: 60,
      description: 'Federal capital with government LSW oversight and political authority',
      advantages: ['Federal Authority', 'Government Cooperation', 'Political Networks', 'Intelligence Access'],
      operationalBonuses: ['+3CS Government Investigation', '+2CS Federal Authority', 'Military Equipment Access'],
      headquarters: 'Secure government complex with federal protection and classified research facilities'
    },
    {
      id: 'new-york',
      name: 'New York',
      type: 'company', 
      icon: '🏢',
      population: 8400000,
      crime: 55,
      safety: 45,
      description: 'Corporate headquarters and media center with financial networks',
      advantages: ['Corporate Networks', 'Media Control', 'Financial Resources', 'Technology Access'],
      operationalBonuses: ['+3CS Corporate Investigation', '+2CS Media Influence', 'Advanced Equipment'],
      headquarters: 'Corporate skyscraper with media center and financial trading floor'
    },
    {
      id: 'los-angeles',
      name: 'Los Angeles', 
      type: 'company',
      icon: '🎬',
      population: 12400000,
      crime: 60,
      safety: 40,
      description: 'Entertainment industry and tech innovation with celebrity networks',
      advantages: ['Entertainment Industry', 'Tech Innovation', 'Celebrity Networks', 'Cultural Influence'],
      operationalBonuses: ['+3CS Entertainment Investigation', '+2CS Cultural Operations', 'Celebrity Access'],
      headquarters: 'Hollywood studio complex with tech innovation labs and celebrity connections'
    }
  ],
  'GR': [
    {
      id: 'athens',
      name: 'Athens',
      type: 'political',
      icon: '🏛️', 
      population: 3700000,
      crime: 25,
      safety: 75,
      description: 'Ancient capital with mystical LSW research centers and archaeological sites',
      advantages: ['Ancient Technology', 'Mystical Research', 'Archaeological Sites', 'Mediterranean Authority'],
      operationalBonuses: ['+4CS Ancient Investigation', '+3CS Mystical Research', 'Ancient Tech Access'],
      headquarters: 'Ancient temple complex with modern mystical research laboratories'
    },
    {
      id: 'thessaloniki',
      name: 'Thessaloniki',
      type: 'industrial',
      icon: '🏭',
      population: 1100000,
      crime: 35,
      safety: 65, 
      description: 'Industrial port with ancient technology manufacturing and trade networks',
      advantages: ['Ancient Manufacturing', 'Port Authority', 'Trade Networks', 'Industrial Base'],
      operationalBonuses: ['+2CS Industrial Investigation', '+3CS Ancient Manufacturing', 'Port Access'],
      headquarters: 'Industrial complex with ancient technology manufacturing and Mediterranean port access'
    }
  ],
  'UG': [
    {
      id: 'kampala',
      name: 'Kampala',
      type: 'political',
      icon: '🏛️',
      population: 3500000,
      crime: 45,
      safety: 55,
      description: 'Continental capital with genetic research facilities and African authority',
      advantages: ['Continental Authority', 'Genetic Research', 'African Networks', 'Medical Centers'],
      operationalBonuses: ['+4CS Genetic Investigation', '+3CS African Operations', 'Medical Research'],
      headquarters: 'Government complex with genetic research laboratories and continental authority'
    },
    {
      id: 'entebbe',
      name: 'Entebbe',
      type: 'military',
      icon: '⚔️',
      population: 120000,
      crime: 15,
      safety: 85,
      description: 'Secure military base with genetic enhancement laboratories and continental defense',
      advantages: ['Military Security', 'Genetic Labs', 'Continental Defense', 'Research Protection'],
      operationalBonuses: ['+3CS Military Investigation', '+4CS Genetic Research', 'Military Protection'],
      headquarters: 'Secure military base with genetic enhancement laboratories and continental defense authority'
    }
  ]
}

export default function CitySelection() {
  const { selectedFaction, selectedCountry, selectCity, setGamePhase } = useGameStore()
  const [selectedCityData, setSelectedCityData] = useState<any>(null)
  
  const availableCities = cities[selectedCountry as keyof typeof cities] || []
  
  const handleCitySelect = (city: any) => {
    setSelectedCityData(city)
  }
  
  const confirmCity = () => {
    if (selectedCityData) {
      selectCity(selectedCityData.id)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center p-6">
      <motion.div 
        className="max-w-7xl w-full"
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
              Establish Your Headquarters
            </h1>
            <p className="text-gray-400 mt-2">
              Choose your base of operations in <span className="text-sht-primary-400 font-bold">{selectedCountry}</span>
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-400">Step 3 of 3</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* City Selection */}
          <div>
            <h2 className="text-2xl font-bold text-sht-primary-400 mb-6">🏙️ Available Cities</h2>
            <div className="space-y-4">
              {availableCities.map((city, index) => (
                <motion.div
                  key={city.id}
                  className={`faction-card cursor-pointer ${selectedCityData?.id === city.id ? 'selected' : ''}`}
                  onClick={() => handleCitySelect(city)}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 10 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{city.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{city.name}</h3>
                      <p className="text-sm text-sht-primary-400 mb-2">
                        {city.type.charAt(0).toUpperCase() + city.type.slice(1)} City
                      </p>
                      <p className="text-sm text-gray-300 mb-4">{city.description}</p>
                      
                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="text-center">
                          <Users size={16} className="mx-auto mb-1 text-blue-400" />
                          <div className="text-gray-400">Population</div>
                          <div className="font-bold text-blue-400">
                            {(city.population / 1000000).toFixed(1)}M
                          </div>
                        </div>
                        <div className="text-center">
                          <Shield size={16} className="mx-auto mb-1 text-green-400" />
                          <div className="text-gray-400">Safety</div>
                          <div className="font-bold text-green-400">{city.safety}/100</div>
                        </div>
                        <div className="text-center">
                          <Building size={16} className="mx-auto mb-1 text-purple-400" />
                          <div className="text-gray-400">Crime</div>
                          <div className="font-bold text-red-400">{city.crime}/100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* City Details */}
          <div>
            <h2 className="text-2xl font-bold text-sht-secondary-400 mb-6">🎯 Headquarters Details</h2>
            {selectedCityData ? (
              <motion.div 
                className="game-panel p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-3xl">{selectedCityData.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedCityData.name}</h3>
                    <p className="text-sm text-sht-primary-400">{selectedCityData.type} City Headquarters</p>
                  </div>
                </div>

                {/* Headquarters Description */}
                <div className="mb-6">
                  <h4 className="font-bold text-sht-success mb-2">🏢 Headquarters Facility</h4>
                  <p className="text-sm text-gray-300">{selectedCityData.headquarters}</p>
                </div>

                {/* Operational Advantages */}
                <div className="mb-6">
                  <h4 className="font-bold text-sht-accent-400 mb-3">⚡ Operational Bonuses</h4>
                  <div className="space-y-2">
                    {selectedCityData.operationalBonuses.map((bonus: string, i: number) => (
                      <div key={i} className="text-xs text-green-400 flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                        {bonus}
                      </div>
                    ))}
                  </div>
                </div>

                {/* City Advantages */}
                <div className="mb-8">
                  <h4 className="font-bold text-sht-primary-400 mb-3">🌟 Strategic Advantages</h4>
                  <div className="space-y-2">
                    {selectedCityData.advantages.map((advantage: string, i: number) => (
                      <div key={i} className="text-xs text-gray-300 flex items-center gap-2">
                        <div className="w-1 h-1 bg-sht-primary-400 rounded-full"></div>
                        {advantage}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <motion.button
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmCity}
                >
                  🎯 ESTABLISH HEADQUARTERS IN {selectedCityData.name.toUpperCase()}
                </motion.button>
              </motion.div>
            ) : (
              <div className="game-panel p-8 text-center">
                <MapPin size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg text-gray-400 mb-2">Select a City</h3>
                <p className="text-sm text-gray-500">
                  Choose a city to see detailed headquarters information and operational advantages
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
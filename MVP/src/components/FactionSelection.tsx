import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'

const factions = [
  {
    id: 'US',
    name: 'United States',
    codeName: 'FIST',
    flag: '🇺🇸',
    color: 'from-blue-600 to-red-600',
    description: 'Technology Supremacy & Military Power',
    philosophy: 'Advanced technology and federal authority to protect American interests and democratic values worldwide.',
    advantages: [
      '🔬 Advanced Technology Access',
      '🏛️ Federal Government Authority', 
      '⚔️ Military Equipment & Training',
      '🌍 Global Intelligence Networks'
    ],
    stats: {
      technology: 95,
      military: 92, 
      economy: 88,
      diplomacy: 70,
      culture: 75
    },
    startingBudget: 75000,
    specialAbilities: [
      'Technology Research Bonus (+50%)',
      'Military Cooperation (+3CS)',
      'Federal Legal Authority',
      'Advanced Equipment Access'
    ]
  },
  {
    id: 'India',
    name: 'India',
    codeName: 'Establishment 24',
    flag: '🇮🇳', 
    color: 'from-orange-500 to-green-600',
    description: 'Spiritual Enhancement & Cultural Diversity',
    philosophy: 'Harness ancient wisdom and spiritual diversity to create harmonious LSW integration respecting all traditions.',
    advantages: [
      '✨ Mystical Power Enhancement',
      '🕉️ Spiritual LSW Training',
      '🤝 Cultural Diplomacy Networks',
      '🎭 Diverse Power Access'
    ],
    stats: {
      spirituality: 98,
      diplomacy: 90,
      culture: 95, 
      technology: 75,
      military: 70
    },
    startingBudget: 45000,
    specialAbilities: [
      'Spiritual Investigation Bonus (+4CS)',
      'Cultural Authenticity Bonus (+3CS)',
      'Diplomatic Immunity Worldwide',
      'Mystical Enhancement Access'
    ]
  },
  {
    id: 'China',
    name: 'China',
    codeName: 'Collective Strategy',
    flag: '🇨🇳',
    color: 'from-red-600 to-yellow-500',
    description: 'Mass Coordination & State Resources', 
    philosophy: 'Collective coordination and state resources to achieve maximum efficiency in LSW development and deployment.',
    advantages: [
      '🏭 Manufacturing Supremacy',
      '👁️ Mass Surveillance Systems',
      '🤝 Collective LSW Coordination', 
      '🏛️ State Resource Access'
    ],
    stats: {
      organization: 98,
      manufacturing: 95,
      surveillance: 90,
      military: 85,
      diplomacy: 60
    },
    startingBudget: 60000,
    specialAbilities: [
      'Social Network Analysis (+4CS)',
      'Mass Manufacturing Access',
      'State Surveillance Networks', 
      'Collective Team Bonuses (+2CS)'
    ]
  },
  {
    id: 'Nigeria', 
    name: 'Nigeria',
    codeName: 'Adaptive Initiative',
    flag: '🇳🇬',
    color: 'from-green-600 to-white',
    description: 'Continental Unity & Power Diversity',
    philosophy: 'Unite African potential through diversity and adaptation, leveraging continental resources for global influence.',
    advantages: [
      '🌍 African Continental Authority',
      '🎭 Maximum Power Diversity',
      '🤝 Tribal Network Intelligence',
      '💎 Adaptive Strategy Flexibility'
    ],
    stats: {
      adaptability: 95,
      diversity: 90,
      continental: 88,
      culture: 85,
      resources: 70
    },
    startingBudget: 35000,
    specialAbilities: [
      'Tribal Networks (+4CS Africa)',
      'Power Variety Access (All Origins)',
      'Continental Authority',
      'Adaptation Bonus (+2CS Flexibility)'
    ]
  }
]

export default function FactionSelection() {
  const { selectFaction } = useGameStore()

  return (
    <div className="h-screen flex items-center justify-center p-6">
      <motion.div 
        className="max-w-7xl w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-sht-primary-400 via-sht-secondary-400 to-sht-accent-400 bg-clip-text text-transparent">
              SUPERHERO TACTICS
            </span>
          </h1>
          <h2 className="text-2xl text-gray-300 mb-2">Choose Your Faction</h2>
          <p className="text-lg text-gray-400">
            The world has <span className="text-sht-primary-400 font-bold">2472 days</span> to prepare for alien invasion
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Four nations compete to build the ultimate LSW program and save humanity
          </p>
        </motion.div>

        {/* Faction Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
          {factions.map((faction, index) => (
            <motion.div
              key={faction.id}
              className="faction-card group"
              onClick={() => selectFaction(faction.id)}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              whileHover={{ y: -10 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Faction Header */}
              <div className={`bg-gradient-to-r ${faction.color} p-4 rounded-t-xl -m-6 mb-4`}>
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">{faction.flag}</div>
                  <h3 className="text-xl font-bold">{faction.name}</h3>
                  <p className="text-sm opacity-90">{faction.codeName}</p>
                </div>
              </div>

              {/* Faction Description */}
              <div className="mb-6">
                <h4 className="font-bold text-sht-primary-400 mb-2 text-lg">{faction.description}</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{faction.philosophy}</p>
              </div>

              {/* Faction Stats */}
              <div className="mb-6 space-y-3">
                {Object.entries(faction.stats).map(([stat, value]) => (
                  <div key={stat} className="stat-display">
                    <span className="capitalize text-gray-300">{stat}:</span>
                    <div className="stat-bar">
                      <motion.div 
                        className="stat-fill bg-gradient-to-r from-sht-secondary-500 to-sht-primary-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                      />
                    </div>
                    <span className="text-sht-primary-400 font-bold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Faction Advantages */}
              <div className="mb-6">
                <h5 className="font-bold text-sht-secondary-400 mb-3">Faction Advantages:</h5>
                <div className="space-y-2">
                  {faction.advantages.map((advantage, i) => (
                    <motion.div 
                      key={i}
                      className="text-xs text-gray-300 flex items-center gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                    >
                      <div className="w-1 h-1 bg-sht-primary-400 rounded-full"></div>
                      {advantage}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Starting Resources */}
              <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Starting Budget:</span>
                  <span className="text-sht-primary-400 font-bold">
                    ${faction.startingBudget.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Select Button */}
              <motion.button
                className="w-full game-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectFaction(faction.id)}
              >
                SELECT {faction.name.toUpperCase()}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div 
          className="text-center mt-12 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p>Each faction offers unique gameplay advantages and strategic approaches</p>
          <p>Your choice affects available LSW powers, equipment access, and international authority</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
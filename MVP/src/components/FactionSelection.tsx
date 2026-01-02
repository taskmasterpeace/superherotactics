import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { Zap, Shield, Globe, Users, Sparkles } from 'lucide-react'

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
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      <motion.div 
        className="max-w-7xl w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-5xl font-black mb-2">
            <span className="bg-gradient-to-r from-sht-primary-400 via-sht-secondary-400 to-sht-accent-400 bg-clip-text text-transparent">
              SUPERHERO TACTICS
            </span>
          </h1>
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1 max-w-32" />
            <h2 className="text-xl text-gray-300">Choose Your Faction</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1 max-w-32" />
          </div>
          <p className="text-sm text-gray-500">
            <span className="text-red-400 font-bold">2472 days</span> until alien invasion • Four nations compete to save humanity
          </p>
        </motion.div>

        {/* Faction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {factions.map((faction, index) => (
            <motion.div
              key={faction.id}
              className="relative bg-gray-800/80 border border-gray-700 rounded-xl overflow-hidden cursor-pointer group hover:border-gray-500 transition-colors"
              onClick={() => selectFaction(faction.id)}
              onMouseEnter={() => setHoveredFaction(faction.id)}
              onMouseLeave={() => setHoveredFaction(null)}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Faction Header */}
              <div className={`bg-gradient-to-r ${faction.color} p-3`}>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{faction.flag}</div>
                  <div className="text-white">
                    <h3 className="text-lg font-bold leading-tight">{faction.name}</h3>
                    <p className="text-xs opacity-80">{faction.codeName}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs text-white/70">Budget</div>
                    <div className="text-sm font-bold text-white">${(faction.startingBudget/1000)}K</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Description */}
                <div className="mb-3">
                  <h4 className="font-semibold text-sht-primary-400 text-sm mb-1">{faction.description}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{faction.philosophy}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-1 mb-3">
                  {Object.entries(faction.stats).map(([stat, value]) => (
                    <div key={stat} className="text-center">
                      <div className="h-12 bg-gray-700/50 rounded relative overflow-hidden">
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sht-primary-500/80 to-sht-secondary-500/60"
                          initial={{ height: 0 }}
                          animate={{ height: `${value}%` }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white z-10">
                          {value}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5 capitalize truncate">{stat.slice(0,4)}</div>
                    </div>
                  ))}
                </div>

                {/* Advantages */}
                <div className="space-y-1 mb-3">
                  {faction.advantages.slice(0, 3).map((advantage, i) => (
                    <div key={i} className="text-[11px] text-gray-300 flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-sht-primary-400 rounded-full flex-shrink-0" />
                      <span className="truncate">{advantage}</span>
                    </div>
                  ))}
                  {faction.advantages.length > 3 && (
                    <div className="text-[10px] text-gray-500">+{faction.advantages.length - 3} more...</div>
                  )}
                </div>

                {/* Select Button */}
                <button className="w-full py-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 hover:from-sht-primary-600 hover:to-sht-secondary-600 text-white text-xs font-bold transition-all group-hover:shadow-lg">
                  SELECT {faction.name.toUpperCase()}
                </button>
              </div>

              {/* Hover Overlay - Special Abilities */}
              <AnimatePresence>
                {hoveredFaction === faction.id && (
                  <motion.div
                    className="absolute inset-0 bg-gray-900/95 p-4 flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-sht-primary-400" />
                      <h4 className="font-bold text-sht-primary-400 text-sm">Special Abilities</h4>
                    </div>
                    <div className="space-y-2 flex-1">
                      {faction.specialAbilities.map((ability, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-2 text-xs text-gray-200"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Zap size={12} className="text-sht-secondary-400 mt-0.5 flex-shrink-0" />
                          <span>{ability}</span>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-auto pt-3 border-t border-gray-700">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Starting Budget</span>
                        <span className="text-green-400 font-bold">${faction.startingBudget.toLocaleString()}</span>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2.5 rounded-lg bg-gradient-to-r from-sht-primary-500 to-sht-secondary-500 text-white text-sm font-bold shadow-lg">
                      SELECT {faction.name.toUpperCase()}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          className="text-center mt-6 text-gray-600 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Hover over a faction to see special abilities • Your choice affects powers, equipment, and international authority</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
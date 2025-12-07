import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import toast from 'react-hot-toast'

export default function WorkingCharacterManagement() {
  const { characters, setCurrentView, budget } = useGameStore()
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)

  const handleCharacterAction = (action: string, character: any) => {
    switch(action) {
      case 'train':
        toast.success(`${character.name} assigned to training - +50 XP in 3 days`)
        break
      case 'investigate':
        setCurrentView('investigation')
        toast.info(`${character.name} ready for investigation assignment`)
        break
      case 'medical':
        toast.success(`${character.name} scheduled for medical examination`)
        break
      case 'combat':
        setCurrentView('tactical-combat')
        toast.success(`${character.name} prepared for combat deployment`)
        break
    }
  }

  return (
    <div className="h-full flex">
      {/* Character Roster */}
      <motion.div 
        className="w-96 bg-gray-900 bg-opacity-95 border-r border-sht-primary-400 p-6 overflow-y-auto"
        initial={{ x: -384 }}
        animate={{ x: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-sht-primary-400">👥 Team Roster</h2>
          <button 
            onClick={() => {
              setCurrentView('world-map')
              toast.info('Returning to world map')
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            🔙 Back
          </button>
        </div>
        
        <div className="space-y-3">
          {characters.map((character, index) => (
            <motion.div
              key={character.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedCharacter?.id === character.id 
                  ? 'border-sht-primary-400 bg-sht-primary-400 bg-opacity-10' 
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800'
              }`}
              onClick={() => {
                setSelectedCharacter(character)
                toast.info(`Selected: ${character.name}`)
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">{character.name}</h3>
                <div className={`text-xs px-2 py-1 rounded font-bold ${
                  character.status === 'ready' ? 'bg-green-600 text-white' :
                  character.status === 'busy' ? 'bg-yellow-600 text-black' :
                  'bg-red-600 text-white'
                }`}>
                  {character.status.toUpperCase()}
                </div>
              </div>
              
              <div className="text-xs text-gray-400 mb-2">
                {character.origin} • Threat Level {character.threatLevel.replace('THREAT_', '')}
              </div>
              
              <div className="health-bar mb-2">
                <div 
                  className="health-fill"
                  style={{ width: `${(character.health.current / character.health.maximum) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-blue-400">{character.location.city}</span>
                <span className="text-purple-400">{character.experience || 0} XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Character Details */}
      <div className="flex-1 p-6">
        {selectedCharacter ? (
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Character Header */}
            <div className="game-panel p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{selectedCharacter.name}</h1>
                  {selectedCharacter.realName && (
                    <p className="text-lg text-gray-400 mb-2">Real Name: {selectedCharacter.realName}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded">{selectedCharacter.origin}</span>
                    <span className="bg-purple-600 text-white px-3 py-1 rounded">
                      Threat Level {selectedCharacter.threatLevel.replace('THREAT_', '')}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-sht-primary-400">{selectedCharacter.experience || 0} XP</div>
                  <div className="text-sm text-gray-400">Experience Points</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stats & Health */}
              <div className="game-panel p-6">
                <h2 className="text-xl font-bold text-sht-accent-400 mb-4">📊 Statistics</h2>
                
                {/* Health */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-green-400">❤️ Health Status</h3>
                    <span className="text-green-400">{selectedCharacter.health.current}/{selectedCharacter.health.maximum}</span>
                  </div>
                  <div className="health-bar">
                    <div 
                      className="health-fill"
                      style={{ width: `${(selectedCharacter.health.current / selectedCharacter.health.maximum) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Primary Stats */}
                <div className="space-y-3">
                  {Object.entries(selectedCharacter.stats).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between items-center">
                      <span className="text-gray-300 font-semibold">{stat}:</span>
                      <div className="flex-1 mx-3 bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-sht-secondary-500 to-sht-primary-500 transition-all duration-300"
                          style={{ width: `${value as number}%` }}
                        />
                      </div>
                      <span className="text-sht-primary-400 font-bold w-8 text-right">{value as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Powers & Equipment */}
              <div className="space-y-6">
                {/* Powers */}
                <div className="game-panel p-6">
                  <h2 className="text-xl font-bold text-sht-secondary-400 mb-4">⚡ LSW Powers</h2>
                  <div className="space-y-2">
                    {selectedCharacter.powers.map((power: string, index: number) => (
                      <div key={index} className="bg-purple-600 bg-opacity-20 border border-purple-400 p-3 rounded-lg">
                        <h4 className="font-bold text-purple-400">{power}</h4>
                        <p className="text-xs text-gray-300">
                          {getPowerDescription(power)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div className="game-panel p-6">
                  <h2 className="text-xl font-bold text-sht-success mb-4">🛡️ Equipment</h2>
                  <div className="space-y-2">
                    {selectedCharacter.equipment.map((item: string, index: number) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-white font-semibold">{item}</span>
                        <span className="text-xs text-green-400">100%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Character Actions */}
            <div className="game-panel p-6 mt-6">
              <h2 className="text-xl font-bold text-sht-primary-400 mb-4">⚡ Character Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ActionButton 
                  icon="🎯"
                  label="Assign Training"
                  onClick={() => handleCharacterAction('train', selectedCharacter)}
                />
                <ActionButton 
                  icon="🔍"
                  label="Investigation Ready"
                  onClick={() => handleCharacterAction('investigate', selectedCharacter)}
                />
                <ActionButton 
                  icon="🏥"
                  label="Medical Check"
                  onClick={() => handleCharacterAction('medical', selectedCharacter)}
                />
                <ActionButton 
                  icon="⚔️"
                  label="Combat Ready"
                  onClick={() => handleCharacterAction('combat', selectedCharacter)}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-gray-400 mb-2">Select a Character</h2>
              <p className="text-gray-500">Choose a character from your roster to view details and manage</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all group"
    >
      <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-xs text-gray-300 group-hover:text-white text-center">{label}</div>
    </button>
  )
}

function getPowerDescription(power: string): string {
  const descriptions: Record<string, string> = {
    'Enhanced Physiology': 'Peak human capabilities enhanced beyond normal limits',
    'Super Durability': 'Resistance to physical damage and enhanced survivability', 
    'Super Strength': 'Enhanced physical power for lifting and combat superiority',
    'Flight': 'Aerial mobility providing tactical positioning advantages',
    'Time Travel': 'Temporal manipulation and timeline control abilities',
    'Temporal Manipulation': 'Advanced time control for tactical advantage'
  }
  
  return descriptions[power] || 'Advanced LSW capability with tactical applications'
}
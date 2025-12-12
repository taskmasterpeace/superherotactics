import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import { User, Heart, Zap, Shield, Sword, Plus, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CharacterManagement() {
  const { characters } = useGameStore()
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="h-full flex pt-20 pb-20">
      {/* Character Roster */}
      <motion.div 
        className="w-96 bg-gray-900 bg-opacity-95 border-r border-sht-primary-400 p-6 overflow-y-auto"
        initial={{ x: -384 }}
        animate={{ x: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-sht-primary-400">👥 Team Roster</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
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
              onClick={() => setSelectedCharacter(character)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">{character.name}</h3>
                <div className={`status-indicator status-${character.status}`}>
                  {character.status}
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
                <span className="text-purple-400">{character.experience} XP</span>
              </div>
            </motion.div>
          ))}
          
          {/* Add Character Card */}
          <motion.div
            className="p-4 rounded-lg border border-dashed border-gray-600 hover:border-green-400 bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all text-center"
            onClick={() => setShowCreateModal(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: characters.length * 0.05 + 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Plus size={32} className="mx-auto mb-2 text-green-400" />
            <div className="text-sm font-bold text-green-400">Recruit New Operative</div>
            <div className="text-xs text-gray-400">Expand your team</div>
          </motion.div>
        </div>
      </motion.div>

      {/* Character Details */}
      <div className="flex-1 p-6">
        {selectedCharacter ? (
          <CharacterDetails character={selectedCharacter} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <User size={64} className="mx-auto mb-4 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-400 mb-2">Select a Character</h2>
              <p className="text-gray-500">Choose a character from your roster to view details and manage</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CharacterDetails({ character }: { character: any }) {
  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Character Header */}
      <div className="game-panel p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{character.name}</h1>
            {character.realName && (
              <p className="text-lg text-gray-400 mb-2">Real Name: {character.realName}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="bg-blue-600 text-white px-3 py-1 rounded">{character.origin}</span>
              <span className="bg-purple-600 text-white px-3 py-1 rounded">
                Threat Level {character.threatLevel.replace('THREAT_', '')}
              </span>
              <span className={`px-3 py-1 rounded font-bold ${
                character.status === 'ready' ? 'bg-green-600 text-white' :
                character.status === 'busy' ? 'bg-yellow-600 text-black' :
                'bg-red-600 text-white'
              }`}>
                {character.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-sht-primary-400">{character.experience} XP</div>
            <div className="text-sm text-gray-400">Experience Points</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats & Health */}
        <div className="game-panel p-6">
          <h2 className="text-xl font-bold text-sht-accent-400 mb-4">📊 Character Statistics</h2>
          
          {/* Health */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-green-400 flex items-center gap-2">
                <Heart size={16} />
                Health Status
              </h3>
              <span className="text-green-400">{character.health.current}/{character.health.maximum}</span>
            </div>
            <div className="health-bar">
              <div 
                className="health-fill"
                style={{ width: `${(character.health.current / character.health.maximum) * 100}%` }}
              />
            </div>
          </div>

          {/* Primary Stats */}
          <div className="space-y-3">
            {Object.entries(character.stats).map(([stat, value]) => (
              <div key={stat} className="stat-display">
                <span className="text-gray-300 font-semibold">{stat}:</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill bg-gradient-to-r from-sht-secondary-500 to-sht-primary-500"
                    style={{ width: `${value as number}%` }}
                  />
                </div>
                <span className="text-sht-primary-400 font-bold">{value as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Powers & Equipment */}
        <div className="space-y-6">
          {/* Powers */}
          <div className="game-panel p-6">
            <h2 className="text-xl font-bold text-sht-secondary-400 mb-4 flex items-center gap-2">
              <Zap size={20} />
              LSW Powers
            </h2>
            <div className="space-y-2">
              {character.powers.map((power: string, index: number) => (
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
            <h2 className="text-xl font-bold text-sht-success mb-4 flex items-center gap-2">
              <Shield size={20} />
              Equipment
            </h2>
            <div className="space-y-2">
              {character.equipment.map((item: string, index: number) => (
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
            onClick={() => toast.success(`${character.name} assigned to training`)}
          />
          <ActionButton 
            icon="🔍"
            label="Solo Investigation"
            onClick={() => toast.info(`${character.name} begins solo investigation`)}
          />
          <ActionButton 
            icon="🏥"
            label="Medical Check"
            onClick={() => toast.info(`${character.name} scheduled for medical examination`)}
          />
          <ActionButton 
            icon="⚔️"
            label="Combat Ready"
            onClick={() => toast.success(`${character.name} prepared for combat deployment`)}
          />
        </div>
      </div>
    </motion.div>
  )
}

function ActionButton({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
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
    'Psychic Powers': 'Mental abilities affecting minds and bypassing physical defenses'
  }
  
  return descriptions[power] || 'Advanced LSW capability with tactical applications'
}
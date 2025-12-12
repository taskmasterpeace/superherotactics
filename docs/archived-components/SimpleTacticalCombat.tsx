import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import toast from 'react-hot-toast'

export default function SimpleTacticalCombat() {
  const { characters, setCurrentView } = useGameStore()
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [combatLog, setCombatLog] = useState<string[]>(['Combat initialized with 2 characters'])
  const [turn, setTurn] = useState(1)
  const [activeCharacter, setActiveCharacter] = useState(0)
  const [actionPoints, setActionPoints] = useState(6)

  const addLogEntry = (entry: string) => {
    setCombatLog(prev => [...prev, `[Turn ${turn}] ${entry}`])
  }

  const handleAction = (action: string) => {
    if (actionPoints <= 0) {
      toast.error('No action points remaining!')
      return
    }

    setSelectedAction(action)
    
    switch(action) {
      case 'move':
        setActionPoints(prev => prev - 1)
        addLogEntry(`${characters[activeCharacter]?.name} moves to new position (1 AP)`)
        break
        
      case 'attack':
        setActionPoints(prev => prev - 2)
        addLogEntry(`${characters[activeCharacter]?.name} performs attack - Rolling dice...`)
        setTimeout(() => {
          const roll = Math.floor(Math.random() * 100) + 1
          const result = roll > 70 ? 'Critical Hit!' : roll > 40 ? 'Hit' : 'Miss'
          addLogEntry(`Dice roll: ${roll} - ${result}`)
          if (roll > 40) {
            const damage = Math.floor(Math.random() * 30) + 10
            addLogEntry(`Damage dealt: ${damage}`)
          }
        }, 1000)
        break
        
      case 'power':
        setActionPoints(prev => prev - 3)
        addLogEntry(`${characters[activeCharacter]?.name} activates LSW power`)
        setTimeout(() => {
          addLogEntry('Power effect: Area damage + status effect applied')
        }, 1500)
        break
        
      case 'throw':
        setActionPoints(prev => prev - 3)
        addLogEntry(`${characters[activeCharacter]?.name} picks up car (2,800 lbs)`)
        setTimeout(() => {
          addLogEntry('Car thrown 3 squares - hits target for 65 damage!')
          addLogEntry('Legal consequence: $25,000 property damage + Grand Theft Auto')
        }, 2000)
        break
        
      case 'end':
        setTurn(prev => prev + 1)
        setActiveCharacter(prev => prev === 0 ? 1 : 0)
        setActionPoints(6)
        addLogEntry(`Turn ended - ${characters[activeCharacter === 0 ? 1 : 0]?.name}'s turn begins`)
        break
    }
    
    toast.success(`Action: ${action} executed`)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Combat Header */}
      <motion.div 
        className="bg-gray-800 bg-opacity-90 backdrop-blur-sm border-b border-sht-primary-400 p-4"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sht-primary-400">⚔️ Tactical Combat</h1>
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-gray-400">Turn:</span>
              <span className="text-sht-primary-400 font-bold ml-2">{turn}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Active:</span>
              <span className="text-sht-secondary-400 font-bold ml-2">
                {characters[activeCharacter]?.name || 'None'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">AP:</span>
              <span className="text-green-400 font-bold ml-2">{actionPoints}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex">
        {/* Simple 2D Combat Grid */}
        <motion.div 
          className="flex-1 relative bg-gray-800 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-xl font-bold text-sht-success mb-4">🗺️ Combat Grid (15x15)</h2>
          
          {/* Simple Grid Display */}
          <div className="grid grid-cols-15 gap-1 w-fit mx-auto">
            {Array.from({length: 225}, (_, i) => {
              const x = i % 15
              const y = Math.floor(i / 15)
              const hasCharacter = (x === 2 && y === 2) || (x === 12 && y === 12)
              const hasObject = Math.random() > 0.9
              
              return (
                <div 
                  key={i}
                  className={`w-8 h-8 border border-gray-600 cursor-pointer transition-all ${
                    hasCharacter ? 'bg-blue-500' : 
                    hasObject ? 'bg-yellow-600' : 
                    'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => addLogEntry(`Clicked grid position (${x}, ${y})`)}
                >
                  {hasCharacter && (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                      {x === 2 ? 'C1' : 'C2'}
                    </div>
                  )}
                  {hasObject && !hasCharacter && (
                    <div className="w-full h-full flex items-center justify-center text-xs">
                      🚗
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 text-center text-sm text-gray-400">
            Click grid squares to move • Blue squares = Characters • Yellow = Objects
          </div>
        </motion.div>

        {/* Combat Control Panel */}
        <motion.div 
          className="w-80 bg-gray-900 bg-opacity-95 border-l border-sht-primary-400 p-6 overflow-y-auto"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
        >
          {/* Character Status */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-primary-400 mb-4">👥 Characters</h3>
            <div className="space-y-3">
              {characters.slice(0, 2).map((character, index) => (
                <div key={character.id} className={`game-panel p-3 ${index === activeCharacter ? 'border-green-400' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-white">{character.name}</h4>
                    <div className={`text-xs px-2 py-1 rounded ${
                      index === activeCharacter ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {index === activeCharacter ? 'ACTIVE' : 'WAITING'}
                    </div>
                  </div>
                  
                  <div className="health-bar mb-2">
                    <div 
                      className="health-fill"
                      style={{ width: `${(character.health.current / character.health.maximum) * 100}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center">
                      <div className="text-gray-400">STR</div>
                      <div className="font-bold text-red-400">{character.stats.STR}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">AGL</div>
                      <div className="font-bold text-blue-400">{character.stats.AGL}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">INT</div>
                      <div className="font-bold text-purple-400">{character.stats.INT}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Menu */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-accent-400 mb-4">⚡ Actions (AP: {actionPoints})</h3>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleAction('move')}
                className={`p-3 rounded-lg font-bold transition-all ${
                  actionPoints >= 1 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={actionPoints < 1}
              >
                🚶 Move (1 AP)
              </button>
              <button 
                onClick={() => handleAction('attack')}
                className={`p-3 rounded-lg font-bold transition-all ${
                  actionPoints >= 2 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={actionPoints < 2}
              >
                ⚔️ Attack (2 AP)
              </button>
              <button 
                onClick={() => handleAction('power')}
                className={`p-3 rounded-lg font-bold transition-all ${
                  actionPoints >= 3 ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={actionPoints < 3}
              >
                🔥 Use Power (3 AP)
              </button>
              <button 
                onClick={() => handleAction('throw')}
                className={`p-3 rounded-lg font-bold transition-all ${
                  actionPoints >= 3 ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={actionPoints < 3}
              >
                🚗 Throw Car (3 AP)
              </button>
              <button 
                onClick={() => handleAction('end')}
                className="p-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all"
              >
                ⏭️ End Turn
              </button>
            </div>
          </div>

          {/* Combat Log */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-success mb-4">📝 Combat Log</h3>
            <div className="bg-black bg-opacity-50 p-4 rounded-lg h-48 overflow-y-auto">
              {combatLog.map((entry, index) => (
                <div key={index} className="text-xs font-mono text-gray-300 mb-1">
                  {entry}
                </div>
              ))}
            </div>
          </div>

          {/* Exit Combat */}
          <button 
            onClick={() => {
              addLogEntry('Combat ended - returning to world map')
              setCurrentView('world-map')
              toast.success('Combat completed')
            }}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-bold transition-all"
          >
            🚪 Exit Combat
          </button>
        </motion.div>
      </div>
    </div>
  )
}
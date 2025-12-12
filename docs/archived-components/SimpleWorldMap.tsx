import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import toast from 'react-hot-toast'

export default function SimpleWorldMap() {
  const { 
    day,
    investigations, 
    characters,
    setCurrentView,
    selectedFaction,
    worldEvents,
    budget
  } = useGameStore()
  
  const [selectedCountry, setSelectedCountry] = useState<string>('')

  const handleCountryClick = (country: string) => {
    setSelectedCountry(country)
    toast.info(`Selected ${country}`)
  }

  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'investigate':
        setCurrentView('investigation')
        toast.success('Switching to Investigation Center')
        break
      case 'combat':
        setCurrentView('tactical-combat') 
        toast.success('Initiating tactical combat')
        break
      case 'manage':
        setCurrentView('characters')
        toast.success('Opening character management')
        break
    }
  }

  return (
    <div className="h-full flex">
      {/* Main Map Area */}
      <motion.div 
        className="flex-1 relative bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Simplified World Map */}
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <svg width="600" height="400" viewBox="0 0 600 400" className="border border-gray-600 rounded-lg bg-gray-800">
              {/* North America */}
              <rect 
                x="50" y="100" width="120" height="80" 
                fill={selectedCountry === 'US' ? '#facc15' : '#374151'}
                stroke="#6b7280" strokeWidth="2"
                className="cursor-pointer hover:fill-sht-primary-400 transition-all"
                onClick={() => handleCountryClick('US')}
              />
              <text x="110" y="140" fill="white" fontSize="12" textAnchor="middle">🇺🇸 USA</text>
              
              {/* Europe */}
              <rect 
                x="250" y="80" width="100" height="70"
                fill={selectedCountry === 'Greece' ? '#facc15' : '#374151'}
                stroke="#6b7280" strokeWidth="2"
                className="cursor-pointer hover:fill-sht-primary-400 transition-all"
                onClick={() => handleCountryClick('Greece')}
              />
              <text x="300" y="115" fill="white" fontSize="12" textAnchor="middle">🇬🇷 Greece</text>
              
              {/* Asia */}
              <rect 
                x="380" y="90" width="140" height="90"
                fill={selectedCountry === 'China' ? '#facc15' : '#374151'}
                stroke="#6b7280" strokeWidth="2"
                className="cursor-pointer hover:fill-sht-primary-400 transition-all"
                onClick={() => handleCountryClick('China')}
              />
              <text x="450" y="130" fill="white" fontSize="12" textAnchor="middle">🇨🇳 China</text>
              <text x="450" y="145" fill="white" fontSize="12" textAnchor="middle">🇮🇳 India</text>
              
              {/* Africa */}
              <rect 
                x="280" y="200" width="120" height="120"
                fill={selectedCountry === 'Africa' ? '#facc15' : '#374151'}
                stroke="#6b7280" strokeWidth="2"
                className="cursor-pointer hover:fill-sht-primary-400 transition-all"
                onClick={() => handleCountryClick('Africa')}
              />
              <text x="340" y="250" fill="white" fontSize="12" textAnchor="middle">🇳🇬 Nigeria</text>
              <text x="340" y="265" fill="white" fontSize="12" textAnchor="middle">🇺🇬 Uganda</text>
              
              {/* Investigation Markers */}
              {investigations.slice(0, 3).map((inv, index) => (
                <circle 
                  key={inv.id}
                  cx={100 + index * 150} 
                  cy={140 + index * 20}
                  r="8"
                  fill={inv.priority === 'critical' ? '#ef4444' : '#f59e0b'}
                  className="cursor-pointer animate-pulse"
                  onClick={() => {
                    toast.info(`Investigation: ${inv.title}`)
                    setCurrentView('investigation')
                  }}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 left-4">
          <div className="game-panel p-4 space-y-2">
            <h3 className="font-bold text-sht-primary-400">🎮 Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => handleQuickAction('investigate')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold"
              >
                🔍 Investigations
              </button>
              <button 
                onClick={() => handleQuickAction('combat')}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-bold"
              >
                ⚔️ Combat
              </button>
              <button 
                onClick={() => handleQuickAction('manage')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-bold"
              >
                👥 Characters
              </button>
            </div>
          </div>
        </div>

        {/* Global Status */}
        <div className="absolute top-4 right-4">
          <div className="game-panel p-4">
            <h3 className="font-bold text-sht-accent-400 mb-2">🌍 Global Status</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Days Left:</span>
                <span className="text-red-400 font-bold">{day}</span>
              </div>
              <div className="flex justify-between">
                <span>Budget:</span>
                <span className="text-green-400">${budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Cases:</span>
                <span className="text-yellow-400">{investigations.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Team Ready:</span>
                <span className="text-blue-400">{characters.filter(c => c.status === 'ready').length}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Panel - World Events */}
      <motion.div 
        className="w-80 bg-gray-900 bg-opacity-95 border-l border-sht-primary-400 p-6 overflow-y-auto"
        initial={{ x: 320 }}
        animate={{ x: 0 }}
      >
        {/* World Events */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-sht-primary-400 mb-4">📡 World Events</h2>
          <div className="space-y-3">
            {worldEvents.slice(0, 5).map((event, index) => (
              <motion.div 
                key={index}
                className="game-panel p-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <h4 className="font-bold text-white text-sm mb-1">{event.title}</h4>
                <p className="text-xs text-gray-300 mb-2">{event.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400">{event.location}</span>
                  <span className="text-gray-400">{event.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active Investigations */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-sht-secondary-400 mb-4">🔍 Active Cases</h2>
          <div className="space-y-3">
            {investigations.slice(0, 3).map((investigation, index) => (
              <motion.div 
                key={investigation.id}
                className="game-panel p-3 cursor-pointer hover:border-sht-primary-400"
                onClick={() => {
                  setCurrentView('investigation')
                  toast.info(`Opening ${investigation.title}`)
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-sm">{investigation.title}</h4>
                  <div className={`text-xs px-2 py-1 rounded ${
                    investigation.priority === 'critical' ? 'bg-red-600' :
                    investigation.priority === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                  } text-white`}>
                    {investigation.priority}
                  </div>
                </div>
                <p className="text-xs text-gray-300 mb-2">{investigation.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400">{investigation.location.city}</span>
                  <span className="text-green-400">Progress: {investigation.progress}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Faction Relations */}
        <div>
          <h2 className="text-xl font-bold text-sht-success mb-4">🤝 Relations</h2>
          <div className="space-y-2 text-sm">
            <FactionRelationBar faction="US" relation={selectedFaction === 'US' ? 100 : 65} />
            <FactionRelationBar faction="China" relation={selectedFaction === 'China' ? 100 : -20} />
            <FactionRelationBar faction="India" relation={selectedFaction === 'India' ? 100 : 80} />
            <FactionRelationBar faction="Nigeria" relation={selectedFaction === 'Nigeria' ? 100 : 45} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function FactionRelationBar({ faction, relation }: { faction: string, relation: number }) {
  const getRelationColor = (rel: number) => {
    if (rel > 70) return 'bg-green-500'
    if (rel > 30) return 'bg-yellow-500' 
    if (rel > -30) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 text-xs">{faction}</div>
      <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getRelationColor(relation)} transition-all duration-500`}
          style={{ width: `${Math.abs(relation)}%` }}
        />
      </div>
      <div className="w-8 text-xs text-right">{relation}</div>
    </div>
  )
}
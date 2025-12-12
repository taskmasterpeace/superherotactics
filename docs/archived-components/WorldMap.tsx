import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import { MapPin, AlertTriangle, Users, Zap } from 'lucide-react'

// Simplified world map with interactive countries
export default function WorldMap() {
  const { 
    day,
    investigations, 
    characters,
    setCurrentView,
    selectedFaction,
    worldEvents
  } = useGameStore()
  
  const [selectedRegion, setSelectedRegion] = useState<string>('')

  return (
    <div className="h-full flex">
      {/* Main Map Area */}
      <motion.div 
        className="flex-1 relative bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Simplified World Map */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <WorldMapSVG onRegionClick={setSelectedRegion} selectedRegion={selectedRegion} />
            
            {/* Investigation Markers */}
            {investigations.map((investigation, index) => (
              <InvestigationMarker 
                key={investigation.id}
                investigation={investigation}
                position={getCountryPosition(investigation.location.country)}
              />
            ))}
            
            {/* Team Markers */}
            {characters.map((character) => (
              <TeamMarker
                key={character.id}
                character={character}
                position={getCountryPosition(character.location.country)}
              />
            ))}
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10">
          <div className="game-panel p-4 space-y-2">
            <h3 className="font-bold text-sht-primary-400">🎮 Map Controls</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => setSelectedRegion('')}
                className="action-button"
              >
                🌍 Global View
              </button>
              <button 
                onClick={() => setCurrentView('investigation')}
                className="action-button"
              >
                🔍 Investigations
              </button>
              <button 
                onClick={() => setCurrentView('characters')}
                className="action-button"
              >
                👥 Characters
              </button>
              <button 
                onClick={() => setCurrentView('tactical-combat')}
                className="action-button"
              >
                ⚔️ Combat
              </button>
            </div>
          </div>
        </div>

        {/* Global Status */}
        <div className="absolute top-4 right-4 z-10">
          <div className="game-panel p-4 space-y-2">
            <h3 className="font-bold text-sht-accent-400">🌍 Global Status</h3>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Days Left:</span>
                <span className="text-red-400 font-bold">{day}</span>
              </div>
              <div className="flex justify-between">
                <span>Global Tension:</span>
                <span className="text-yellow-400">Rising</span>
              </div>
              <div className="flex justify-between">
                <span>Active Crises:</span>
                <span className="text-orange-400">{worldEvents.length}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Panel - World Events & Intel */}
      <motion.div 
        className="w-96 bg-gray-900 bg-opacity-95 border-l border-sht-primary-400 p-6 overflow-y-auto"
        initial={{ x: 384 }}
        animate={{ x: 0 }}
      >
        {/* Real-time World Events */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-sht-primary-400 mb-4">📡 World Events</h2>
          <div className="space-y-3">
            {worldEvents.map((event, index) => (
              <motion.div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  event.severity === 'critical' ? 'bg-red-900 bg-opacity-50 border-red-400' :
                  event.severity === 'high' ? 'bg-orange-900 bg-opacity-50 border-orange-400' :
                  'bg-blue-900 bg-opacity-50 border-blue-400'
                }`}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-sm">{event.title}</h4>
                  <div className="text-xs text-gray-400">{event.time}</div>
                </div>
                <p className="text-xs text-gray-300 mb-2">{event.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{event.location}</span>
                  <span className={
                    event.severity === 'critical' ? 'text-red-400' :
                    event.severity === 'high' ? 'text-orange-400' :
                    'text-blue-400'
                  }>
                    {event.severity.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active Investigations */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-sht-secondary-400 mb-4">🔍 Active Operations</h2>
          <div className="space-y-3">
            {investigations.slice(0, 3).map((investigation, index) => (
              <motion.div 
                key={investigation.id}
                className="game-panel p-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-sm">{investigation.title}</h4>
                  <div className={`priority-${investigation.priority} px-2 py-1 rounded text-xs`}>
                    {investigation.priority}
                  </div>
                </div>
                <p className="text-xs text-gray-300 mb-3">{investigation.description}</p>
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
          <h2 className="text-xl font-bold text-sht-success mb-4">🤝 Faction Relations</h2>
          <div className="space-y-2">
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
  
  const getRelationText = (rel: number) => {
    if (rel > 70) return 'Allied'
    if (rel > 30) return 'Friendly'
    if (rel > -30) return 'Neutral'
    return 'Hostile'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-sm text-gray-300">{faction}</div>
      <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getRelationColor(relation)} transition-all duration-500`}
          style={{ width: `${Math.abs(relation)}%` }}
        />
      </div>
      <div className="w-16 text-xs text-right">
        <span className={getRelationColor(relation).replace('bg-', 'text-')}>
          {getRelationText(relation)}
        </span>
      </div>
    </div>
  )
}

function WorldMapSVG({ onRegionClick, selectedRegion }: any) {
  return (
    <svg width="800" height="500" viewBox="0 0 800 500" className="border border-gray-600 rounded-lg">
      {/* Simplified world map regions */}
      <g>
        {/* North America */}
        <path 
          d="M 100 150 L 250 120 L 280 200 L 150 250 Z" 
          fill={selectedRegion === 'north-america' ? '#facc15' : '#374151'}
          stroke="#6b7280" 
          strokeWidth="2"
          className="cursor-pointer hover:fill-sht-primary-400 transition-all"
          onClick={() => onRegionClick('north-america')}
        />
        <text x="175" y="185" fill="white" fontSize="14" textAnchor="middle">🇺🇸 USA</text>
        
        {/* Europe */}
        <path 
          d="M 350 120 L 450 110 L 470 180 L 380 190 Z"
          fill={selectedRegion === 'europe' ? '#facc15' : '#374151'}
          stroke="#6b7280"
          strokeWidth="2" 
          className="cursor-pointer hover:fill-sht-primary-400 transition-all"
          onClick={() => onRegionClick('europe')}
        />
        <text x="410" y="150" fill="white" fontSize="14" textAnchor="middle">🇬🇷 Greece</text>
        
        {/* Asia */}
        <path 
          d="M 480 130 L 650 120 L 680 220 L 520 240 Z"
          fill={selectedRegion === 'asia' ? '#facc15' : '#374151'}
          stroke="#6b7280"
          strokeWidth="2"
          className="cursor-pointer hover:fill-sht-primary-400 transition-all" 
          onClick={() => onRegionClick('asia')}
        />
        <text x="580" y="180" fill="white" fontSize="14" textAnchor="middle">🇨🇳 China / 🇮🇳 India</text>
        
        {/* Africa */}
        <path 
          d="M 380 250 L 500 240 L 520 350 L 400 370 Z"
          fill={selectedRegion === 'africa' ? '#facc15' : '#374151'}
          stroke="#6b7280"
          strokeWidth="2"
          className="cursor-pointer hover:fill-sht-primary-400 transition-all"
          onClick={() => onRegionClick('africa')}
        />
        <text x="450" y="305" fill="white" fontSize="14" textAnchor="middle">🇳🇬 Nigeria / 🇺🇬 Uganda</text>
      </g>
    </svg>
  )
}

function InvestigationMarker({ investigation, position }: any) {
  return (
    <motion.div
      className="absolute z-20"
      style={{ left: position.x, top: position.y }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.2 }}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer ${
        investigation.priority === 'critical' ? 'bg-red-500' :
        investigation.priority === 'high' ? 'bg-orange-500' :
        'bg-yellow-500'
      }`}>
        <AlertTriangle size={12} />
      </div>
    </motion.div>
  )
}

function TeamMarker({ character, position }: any) {
  return (
    <motion.div
      className="absolute z-20"
      style={{ left: position.x, top: position.y }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.2 }}
    >
      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer">
        <Users size={12} />
      </div>
    </motion.div>
  )
}

// Helper function to get country positions on map
function getCountryPosition(country: string) {
  const positions: Record<string, { x: number, y: number }> = {
    'United States': { x: 175, y: 185 },
    'Greece': { x: 410, y: 150 },
    'China': { x: 580, y: 180 },
    'India': { x: 550, y: 200 },
    'Nigeria': { x: 420, y: 305 },
    'Uganda': { x: 480, y: 320 }
  }
  
  return positions[country] || { x: 400, y: 250 }
}

function generateWorldEvent() {
  const events = [
    {
      title: 'Technology Breakthrough',
      description: 'Chinese researchers announce quantum LSW enhancement',
      location: 'Beijing, China',
      severity: 'high',
      faction: 'China'
    },
    {
      title: 'Diplomatic Crisis',
      description: 'Border incident between India and Pakistan escalates',
      location: 'Kashmir Region', 
      severity: 'critical',
      faction: 'India'
    },
    {
      title: 'Corporate Scandal',
      description: 'Pharmaceutical company caught experimenting on LSWs',
      location: 'New York, USA',
      severity: 'medium',
      faction: 'US'
    },
    {
      title: 'African Unity Summit',
      description: 'Nigeria calls for continental LSW cooperation',
      location: 'Lagos, Nigeria',
      severity: 'high', 
      faction: 'Nigeria'
    }
  ]
  
  const event = events[Math.floor(Math.random() * events.length)]
  return {
    ...event,
    time: new Date().toLocaleTimeString(),
    id: Math.random().toString(36)
  }
}
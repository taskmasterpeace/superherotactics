import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  Clock,
  DollarSign,
  Users,
  Map,
  Monitor,
  Settings,
  GraduationCap,
  Building2,
  Home,
  Bell,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'

// Check if dev mode is enabled via URL parameter
function isDevModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('dev') === 'true'
}

export default function GameHUD() {
  const {
    day,
    budget,
    characters,
    currentView,
    setCurrentView,
    setGamePhase,
    selectedFaction,
    selectedCountry
  } = useGameStore()

  const [showDevTools, setShowDevTools] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const devModeEnabled = useMemo(() => isDevModeEnabled(), [])

  // Count pending notifications (example: injured characters)
  const notifications = useMemo(() => {
    const injured = characters.filter(c => c.status === 'injured').length
    return injured
  }, [characters])

  return (
    <>
      {/* Top HUD Bar - Compact */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left Side - Game Status (Compact Pills) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-950/50 border border-red-900/50 rounded-md px-2.5 py-1">
              <Clock size={14} className="text-red-400" />
              <span className="text-xs font-bold text-red-400">{day}</span>
              <span className="text-[10px] text-red-400/70">days</span>
            </div>

            <div className="flex items-center gap-1.5 bg-green-950/50 border border-green-900/50 rounded-md px-2.5 py-1">
              <DollarSign size={14} className="text-green-400" />
              <span className="text-xs font-bold text-green-400">${budget.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-950/50 border border-blue-900/50 rounded-md px-2.5 py-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-400">
                {characters.filter(c => c.status === 'ready').length}/{characters.length}
              </span>
              <span className="text-[10px] text-blue-400/70">team</span>
            </div>
          </div>

          {/* Center - Main Navigation */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            <NavButton
              icon={<Map size={14} />}
              label="World"
              active={currentView === 'world-map'}
              onClick={() => setCurrentView('world-map')}
            />
            <NavButton
              icon={<Monitor size={14} />}
              label="Computer"
              active={currentView === 'combat-lab'}
              onClick={() => setCurrentView('combat-lab')}
            />
            <NavButton
              icon={<GraduationCap size={14} />}
              label="Training"
              active={currentView === 'training'}
              onClick={() => setCurrentView('training')}
            />
            <NavButton
              icon={<Building2 size={14} />}
              label="Base"
              active={currentView === 'base'}
              onClick={() => setCurrentView('base')}
            />
          </div>

          {/* Right Side - Status, Settings, Dev Tools */}
          <div className="flex items-center gap-2">
            {/* Faction/Country Badge */}
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-md px-2.5 py-1">
              <div className="text-right">
                <div className="text-xs font-bold text-sht-primary-400">
                  {selectedCountry || selectedFaction}
                </div>
                <div className="text-[9px] text-gray-500">
                  {selectedFaction}
                </div>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              className="relative p-1.5 rounded-md hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell size={16} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-md transition-colors ${showSettings ? 'bg-gray-700 text-white' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}
              title="Settings"
            >
              <Settings size={16} />
            </button>

            {/* Dev Tools Toggle - Only show if ?dev=true */}
            {devModeEnabled && (
              <button
                onClick={() => setShowDevTools(!showDevTools)}
                className={`p-1.5 rounded-md transition-colors ${showDevTools ? 'bg-yellow-600 text-black' : 'hover:bg-gray-800/50 text-yellow-400/70'}`}
                title="Dev Tools"
              >
                <Settings size={16} />
              </button>
            )}

            {/* Main Menu */}
            <button
              onClick={() => setGamePhase('faction-selection')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-xs"
              title="Return to Main Menu"
            >
              <Home size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed top-12 right-16 z-40 w-48"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-300">SETTINGS</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {/* Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-700 transition-colors"
                >
                  <span className="text-xs text-gray-300">Sound Effects</span>
                  {soundEnabled ? (
                    <Volume2 size={16} className="text-green-400" />
                  ) : (
                    <VolumeX size={16} className="text-gray-500" />
                  )}
                </button>
                {/* Combat Speed */}
                <div className="p-2">
                  <span className="text-xs text-gray-400">Combat Speed</span>
                  <div className="flex gap-1 mt-1">
                    {['1x', '2x', '4x'].map(speed => (
                      <button
                        key={speed}
                        className="flex-1 px-2 py-1 text-[10px] rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev Tools Dropdown - Only visible in dev mode */}
      <AnimatePresence>
        {devModeEnabled && showDevTools && (
          <motion.div
            className="fixed top-14 right-4 z-40 w-64"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
              <h3 className="text-xs font-bold text-yellow-400 mb-2">DEV TOOLS</h3>
              <div className="flex flex-col gap-1">
                <DevButton
                  label="Sector Editor"
                  onClick={() => { setCurrentView('sector-editor'); setShowDevTools(false); }}
                />
                <DevButton
                  label="World Data Editor"
                  onClick={() => { setCurrentView('world-data'); setShowDevTools(false); }}
                />
                <DevButton
                  label="Data Viewer"
                  onClick={() => { setCurrentView('data-viewer'); setShowDevTools(false); }}
                />
                <DevButton
                  label="Sound Config"
                  onClick={() => { setCurrentView('sound-config'); setShowDevTools(false); }}
                />
                <DevButton
                  label="Loadout Editor"
                  onClick={() => { setCurrentView('loadout-editor'); setShowDevTools(false); }}
                />
                <DevButton
                  label="Encyclopedia"
                  onClick={() => { setCurrentView('encyclopedia'); setShowDevTools(false); }}
                />
                <DevButton
                  label="Characters"
                  onClick={() => { setCurrentView('characters'); setShowDevTools(false); }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${
        active
          ? 'bg-sht-primary-500 text-black shadow-md shadow-sht-primary-500/30'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function DevButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-2 py-1.5 rounded transition-colors"
    >
      {label}
    </button>
  )
}

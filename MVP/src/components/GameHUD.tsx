import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  Clock,
  DollarSign,
  Users,
  Map,
  FlaskConical,
  Monitor,
  Settings,
  GraduationCap,
  Building2
} from 'lucide-react'

export default function GameHUD() {
  const {
    day,
    budget,
    characters,
    currentView,
    setCurrentView,
    selectedFaction,
    selectedCountry
  } = useGameStore()

  const [showDevTools, setShowDevTools] = useState(false)

  return (
    <>
      {/* Top HUD Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm border-b border-sht-primary-400"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between p-3">
          {/* Left Side - Game Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-red-400" />
              <div>
                <div className="text-sm font-bold text-red-400">
                  {day} DAYS
                </div>
                <div className="text-[10px] text-gray-500">Until Invasion</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-green-400" />
              <div>
                <div className="text-sm font-bold text-green-400">
                  ${budget.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500">Budget</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              <div>
                <div className="text-sm font-bold text-blue-400">
                  {characters.filter(c => c.status === 'ready').length}/{characters.length}
                </div>
                <div className="text-[10px] text-gray-500">Team</div>
              </div>
            </div>
          </div>

          {/* Center - Main Navigation */}
          <div className="flex items-center gap-2">
            <NavButton
              icon={<Map size={18} />}
              label="World Map"
              active={currentView === 'world-map'}
              onClick={() => setCurrentView('world-map')}
            />
            <NavButton
              icon={<Monitor size={18} />}
              label="Computer"
              active={currentView === 'combat-lab'}
              onClick={() => setCurrentView('combat-lab')}
            />
            <NavButton
              icon={<GraduationCap size={18} />}
              label="Training"
              active={currentView === 'training'}
              onClick={() => setCurrentView('training')}
            />
            <NavButton
              icon={<Building2 size={18} />}
              label="Base"
              active={currentView === 'base'}
              onClick={() => setCurrentView('base')}
            />
          </div>

          {/* Right Side - Country & Dev Tools */}
          <div className="flex items-center gap-3">
            {/* Dev Tools Toggle */}
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className={`p-2 rounded-lg transition-colors ${showDevTools ? 'bg-yellow-600 text-black' : 'hover:bg-gray-800 text-gray-400'}`}
              title="Dev Tools"
            >
              <Settings size={18} />
            </button>

            <div className="text-right">
              <div className="text-sm font-bold text-sht-primary-400">
                {selectedCountry || selectedFaction}
              </div>
              <div className="text-[10px] text-gray-500">
                {selectedFaction} Faction
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dev Tools Dropdown */}
      <AnimatePresence>
        {showDevTools && (
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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        active
          ? 'bg-sht-primary-500 text-black font-bold'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
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

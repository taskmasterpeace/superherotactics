import React, { useEffect, useState } from 'react'
import { useGameStore } from './stores/enhancedGameStore'
import { Toaster } from 'react-hot-toast'

// Main Game Components
import FactionSelection from './components/FactionSelection'
import CountrySelection from './components/CountrySelection'
import CitySelection from './components/FixedCitySelection'
import GameHUD from './components/GameHUD'
import WorldMap from './components/SHTWorldMap'
import TacticalCombat from './components/CompleteTacticalCombat'
import CharacterScreen from './components/CharacterScreen'
import InvestigationCenter from './components/WorkingInvestigationCenter'
import MobileInterface from './components/MobileInterface'
import CombatLab from './components/CombatLab'
import HexWorldMap from './components/HexWorldMap'
import RecruitingPage from './components/RecruitingPage'
import Encyclopedia from './components/Encyclopedia'
import BalanceAnalyzer from './components/BalanceAnalyzer'
import WorldMapGrid from './components/WorldMap/WorldMapGrid'

// Tools
import { AssetManager } from './tools/AssetManager'
import DatabaseAdmin from './components/DatabaseAdmin'

function App() {
  const { gamePhase, currentView, setCurrentView, setGamePhase } = useGameStore()
  const [devMode, setDevMode] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [assetManagerOpen, setAssetManagerOpen] = useState(false)

  useEffect(() => {
    console.log('🎮 SuperHero Tactics MVP initialized')

    // Handle resize
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)

    // Dev mode keyboard shortcut (F2)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        setDevMode(d => !d)
      }
      if (e.key === 'F4') {
        e.preventDefault()
        setAssetManagerOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Mobile Interface
  if (isMobile) {
    return (
      <div className="h-screen bg-gray-900">
        <MobileInterface />
        <Toaster position="top-center" />
      </div>
    )
  }

  // Desktop Interface
  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-yellow-500/10 animate-pulse pointer-events-none"></div>

      {/* Dev Mode Panel - F2 to toggle */}
      {devMode && (
        <div className="fixed top-0 left-0 z-50 bg-black/90 text-white p-4 rounded-br-lg border-r border-b border-yellow-500">
          <div className="text-yellow-500 font-bold mb-2">DEV MODE (F2)</div>
          <div className="text-xs text-gray-400 mb-3">Quick Jump:</div>
          <div className="flex flex-col gap-1 text-sm">
            <button onClick={() => setGamePhase('faction-selection')} className="text-left hover:text-yellow-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Faction Selection
            </button>
            <button onClick={() => setGamePhase('country-selection')} className="text-left hover:text-yellow-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Country Selection
            </button>
            <button onClick={() => setGamePhase('city-selection')} className="text-left hover:text-yellow-400 px-2 py-1 hover:bg-gray-800 rounded">
              → City Selection
            </button>
            <button onClick={() => setGamePhase('recruiting')} className="text-left hover:text-orange-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Recruiting
            </button>
            <div className="border-t border-gray-700 my-2"></div>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('world-map'); }} className="text-left hover:text-blue-400 px-2 py-1 hover:bg-gray-800 rounded">
              → World Map
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('tactical-combat'); }} className="text-left hover:text-red-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Tactical Combat
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('combat-lab'); }} className="text-left hover:text-purple-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Combat Lab (Phaser)
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('investigation'); }} className="text-left hover:text-green-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Investigations
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('characters'); }} className="text-left hover:text-cyan-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Characters
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('encyclopedia'); }} className="text-left hover:text-amber-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Encyclopedia
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('balance'); }} className="text-left hover:text-pink-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Balance Analyzer
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('world-map-grid'); }} className="text-left hover:text-emerald-400 px-2 py-1 hover:bg-gray-800 rounded">
              → World Map Grid
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('database'); }} className="text-left hover:text-cyan-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Database Admin
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-3">Phase: {gamePhase} | View: {currentView}</div>
        </div>
      )}

      {/* Asset Manager Floating Button */}
      <button
        onClick={() => setAssetManagerOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        title="Asset Manager (F4)"
      >
        <span className="text-xl">🖼️</span>
      </button>

      {/* Asset Manager Drawer */}
      <AssetManager isOpen={assetManagerOpen} onClose={() => setAssetManagerOpen(false)} />

      {/* Game Setup Phase */}
      {gamePhase === 'faction-selection' && <FactionSelection />}
      {gamePhase === 'country-selection' && <CountrySelection />}
      {gamePhase === 'city-selection' && <CitySelection />}
      {gamePhase === 'recruiting' && <RecruitingPage />}

      {/* Main Game Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Only show HUD for non-fullscreen views */}
          {currentView !== 'combat-lab' && <GameHUD />}
          <div className={currentView !== 'combat-lab' ? 'pt-16' : ''}> {/* Account for HUD */}
            {currentView === 'world-map' && <WorldMap />}
            {currentView === 'investigation' && <InvestigationCenter />}
            {currentView === 'tactical-combat' && <TacticalCombat />}
            {currentView === 'characters' && <CharacterScreen />}
            {currentView === 'combat-lab' && <CombatLab />}
            {currentView === 'encyclopedia' && <Encyclopedia />}
            {currentView === 'balance' && <BalanceAnalyzer />}
            {currentView === 'world-map-grid' && <WorldMapGrid />}
            {currentView === 'database' && <DatabaseAdmin />}
          </div>
        </>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #facc15',
          },
        }}
      />
    </div>
  )
}

export default App
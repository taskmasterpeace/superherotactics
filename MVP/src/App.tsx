import React, { useEffect, useState, useMemo } from 'react'
import { useGameStore } from './stores/enhancedGameStore'
import { Toaster } from 'react-hot-toast'

// Underworld Test - registers testUnderworldSystem() on window for console testing
import './data/underworldTest'

// Notification System
import NotificationBar from './components/NotificationBar'

// Main Game Components
import FactionSelection from './components/FactionSelection'
import CountrySelection from './components/CountrySelection'
import CitySelection from './components/FixedCitySelection'
import GameHUD from './components/GameHUD'
// SHTWorldMap is deprecated - using WorldMapGrid as the primary world map
// import WorldMap from './components/SHTWorldMap'
import TacticalCombat from './components/CompleteTacticalCombat'
import CharacterScreen from './components/CharacterScreen'
import InvestigationCenter from './components/WorkingInvestigationCenter'
import InvestigationBoard from './components/InvestigationBoard'
import MobileInterface from './components/MobileInterface'
import CombatLab from './components/CombatLab'
// import HexWorldMap from './components/HexWorldMap'  // Unused - keeping for reference
import RecruitingPage from './components/RecruitingPage'
import Encyclopedia from './components/Encyclopedia'
import WorldAlmanac from './components/WorldAlmanac'
import BalanceAnalyzer from './components/BalanceAnalyzer'
import WorldMapGrid from './components/WorldMap/WorldMapGrid'
import LoadoutEditor from './components/LoadoutEditor'
import MobilePhone from './components/MobilePhone'
import SquadRoster from './components/SquadRoster'
import QuickCombatSimulator from './components/QuickCombatSimulator'
import InstantCombat from './components/InstantCombat'

// Tools
import { AssetManager } from './tools/AssetManager'
import DatabaseAdmin from './components/DatabaseAdmin'
import DataViewer from './components/DataViewer'
import SoundConfigUI from './components/SoundConfigUI'
import SectorEditor from './tools/SectorEditor'
import WorldDataEditor from './tools/WorldDataEditor'
import NewsBrowser from './components/NewsBrowser'
import HospitalScreen from './components/HospitalScreen'
import EquipmentShop from './components/EquipmentShop'
import TrainingCenter from './components/TrainingCenter'
import BaseManager from './components/BaseManager'
import KeyboardShortcuts from './components/KeyboardShortcuts'

// UI Components
import { ErrorBoundary } from './components/ui'

// News Generator - subscribes to EventBus for automatic news generation
import { initNewsGenerator, cleanupNewsGenerator } from './data/newsGenerator'

// Investigation Generator - subscribes to EventBus for automatic investigation discovery
import { initInvestigationGenerator, cleanupInvestigationGenerator } from './data/investigationGenerator'

// Time Event Generator - fires events on time passage (day/night, encounters, payday)
import { initTimeEventGenerator, cleanupTimeEventGenerator } from './data/timeEventGenerator'

// Economy Event Handler - processes payday, mission rewards, expenses
import { initEconomyEventHandler, cleanupEconomyEventHandler } from './data/economyEventHandler'

// Territory System - tracks sector control, militia, and faction influence
import { initTerritorySystem, cleanupTerritorySystem } from './data/territorySystem'

// Email System - mission briefings, intel reports, contact messages
import { initEmailSystem, cleanupEmailSystem } from './data/emailSystem'

// Combat Results Handler - processes combat completion for XP, loot, fame, injuries
import { initCombatResultsHandler, cleanupCombatResultsHandler } from './stores/combatResultsHandler'

// World Systems - central initialization for all simulation systems
import { initWorldSystems, cleanupWorldSystems } from './data/worldSystemsInit'

// Minimum Width Warning Component
function MinWidthWarning() {
  return (
    <div className="min-width-warning">
      <div className="text-6xl mb-6">🖥️</div>
      <h1 className="text-2xl font-bold text-white mb-4">Desktop Required</h1>
      <p className="text-gray-400 mb-6 max-w-md">
        SuperHero Tactics requires a minimum screen width of <span className="text-yellow-400 font-bold">1024px</span> for the best tactical experience.
      </p>
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-6">
        <div className="text-sm text-gray-500 mb-2">Your current width:</div>
        <div className="text-3xl font-bold text-red-400" id="current-width">
          {typeof window !== 'undefined' ? window.innerWidth : 0}px
        </div>
      </div>
      <div className="text-sm text-gray-500">
        <p>Please:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Rotate your device to landscape mode</li>
          <li>Use a tablet, laptop, or desktop</li>
          <li>Expand your browser window</li>
        </ul>
      </div>
    </div>
  )
}

function App() {
  const { gamePhase, currentView, setCurrentView, setGamePhase } = useGameStore()
  const [devMode, setDevMode] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isBelowMinWidth, setIsBelowMinWidth] = useState(window.innerWidth < 1024)
  const [assetManagerOpen, setAssetManagerOpen] = useState(false)
  const [quickCombatOpen, setQuickCombatOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // Check if dev mode is enabled via URL parameter (?dev=true)
  const devModeEnabled = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('dev') === 'true'
  }, [])
  const [instantCombatOpen, setInstantCombatOpen] = useState(false)

  // Get the idle check function from the store
  const checkIdleCharacters = useGameStore(state => state.checkIdleCharacters)

  useEffect(() => {
    console.log('🎮 SuperHero Tactics MVP initialized')

    // Initialize world systems (NPCs, economy, factions, life events, etc.)
    // This must be called first as other systems depend on it
    initWorldSystems()

    // Initialize news generator (subscribes to EventBus for automatic news)
    initNewsGenerator()

    // Initialize investigation generator (discovers investigations from events)
    initInvestigationGenerator()

    // Initialize time event generator (day/night effects, encounters, payday)
    initTimeEventGenerator()

    // Initialize economy event handler (payday, mission rewards, expenses)
    initEconomyEventHandler()

    // Initialize territory system (sector control, militia, factions)
    initTerritorySystem()

    // Initialize email system (mission briefings, intel, contacts)
    initEmailSystem()

    // Initialize combat results handler (XP, loot, fame, injuries from combat)
    initCombatResultsHandler()

    // Handle resize - track both mobile and minimum width
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      setIsBelowMinWidth(window.innerWidth < 1024)
      // Update the width display if the warning is visible
      const widthEl = document.getElementById('current-width')
      if (widthEl) widthEl.textContent = `${window.innerWidth}px`
    }
    window.addEventListener('resize', handleResize)

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // ? key - Show keyboard shortcuts guide
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShortcutsOpen(o => !o)
      }

      // Escape key - Close modals
      if (e.key === 'Escape') {
        setShortcutsOpen(false)
        setAssetManagerOpen(false)
        setQuickCombatOpen(false)
        setInstantCombatOpen(false)
        setDevMode(false)
      }

      // Dev mode keyboard shortcut (F2) - only works if ?dev=true
      if (e.key === 'F2' && devModeEnabled) {
        e.preventDefault()
        setDevMode(d => !d)
      }

      // F4 - Asset Manager
      if (e.key === 'F4') {
        e.preventDefault()
        setAssetManagerOpen(o => !o)
      }

      // Navigation shortcuts (only when playing)
      if (gamePhase === 'playing') {
        switch (e.key.toLowerCase()) {
          case 'm':
            if (!e.ctrlKey && !e.metaKey) setCurrentView('world-map')
            break
          case 'c':
            if (!e.ctrlKey && !e.metaKey) setCurrentView('characters')
            break
          case 'i':
            if (!e.ctrlKey && !e.metaKey) setCurrentView('investigation')
            break
          case 'n':
            if (!e.ctrlKey && !e.metaKey) setCurrentView('news')
            break
          case 'h':
            if (!e.ctrlKey && !e.metaKey) setCurrentView('hospital')
            break
          case 'e':
            if (!e.ctrlKey && !e.metaKey) setCurrentView('equipment-shop')
            break
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Idle character check interval (every 5 seconds)
    const idleCheckInterval = setInterval(() => {
      checkIdleCharacters()
    }, 5000)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      clearInterval(idleCheckInterval)
      cleanupNewsGenerator()
      cleanupInvestigationGenerator()
      cleanupTimeEventGenerator()
      cleanupEconomyEventHandler()
      cleanupTerritorySystem()
      cleanupEmailSystem()
      cleanupCombatResultsHandler()
      cleanupWorldSystems()
    }
  }, [checkIdleCharacters])

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
      {/* Minimum Width Warning - Shown when screen is too narrow */}
      {isBelowMinWidth && <MinWidthWarning />}

      {/* Game Content - Hidden when below minimum width */}
      <div className={`game-content h-full ${isBelowMinWidth ? 'hidden' : ''}`}>
      {/* Notification Bar - Always visible at top */}
      <NotificationBar />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-yellow-500/10 animate-pulse pointer-events-none"></div>

      {/* Dev Mode Panel - F2 to toggle (only if ?dev=true in URL) */}
      {devModeEnabled && devMode && (
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
            <button onClick={() => { setGamePhase('playing'); setCurrentView('investigation-board'); }} className="text-left hover:text-yellow-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Investigation Board (NEW)
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('characters'); }} className="text-left hover:text-cyan-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Characters
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('hospital'); }} className="text-left hover:text-red-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-red-500 pl-2">
              🏥 Hospital Management
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('equipment-shop'); }} className="text-left hover:text-green-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-green-500 pl-2">
              🏪 Equipment Shop
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('news'); }} className="text-left hover:text-blue-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-blue-500 pl-2">
              📰 News Browser
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('almanac'); }} className="text-left hover:text-amber-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-amber-500 pl-2">
              📚 World Almanac
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('encyclopedia'); }} className="text-left hover:text-amber-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Equipment Encyclopedia
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('balance'); }} className="text-left hover:text-pink-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Balance Analyzer
            </button>
            {/* World Map Grid now is the main world-map view */}
            <button onClick={() => { setGamePhase('playing'); setCurrentView('database'); }} className="text-left hover:text-cyan-400 px-2 py-1 hover:bg-gray-800 rounded">
              → Database Admin (Legacy)
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('data-viewer'); }} className="text-left hover:text-blue-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-blue-500 pl-2">
              → System Data Viewer
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('sound-config'); }} className="text-left hover:text-purple-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-purple-500 pl-2">
              🔊 Sound Config Studio
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('loadout-editor'); }} className="text-left hover:text-orange-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-orange-500 pl-2">
              ⚔️ Equipment Loadout Editor
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('sector-editor'); }} className="text-left hover:text-emerald-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-emerald-500 pl-2">
              🗺️ Sector Editor
            </button>
            <button onClick={() => { setGamePhase('playing'); setCurrentView('world-data'); }} className="text-left hover:text-yellow-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-yellow-500 pl-2">
              🌍 World Data Editor
            </button>
            <button onClick={() => { setQuickCombatOpen(true); setDevMode(false); }} className="text-left hover:text-red-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-red-500 pl-2">
              ⚔️ Quick Combat Simulator
            </button>
            <button onClick={() => { setInstantCombatOpen(true); setDevMode(false); }} className="text-left hover:text-yellow-400 px-2 py-1 hover:bg-gray-800 rounded font-bold border-l-2 border-yellow-500 pl-2">
              ⚡ Instant Combat (Batch)
            </button>
            <div className="border-t border-gray-700 my-2"></div>
            <div className="text-xs text-gray-400 mb-2">Notification Tests:</div>
            <button
              onClick={() => {
                const { addNotification, setCharacterStatus, characters } = useGameStore.getState()
                // Simulate character arriving - set statusStartTime to trigger idle detection
                const char = characters[0]
                if (char) {
                  setCharacterStatus(char.id, 'ready', { sector: 'K5' })
                  addNotification({
                    type: 'arrival',
                    priority: 'medium',
                    title: `${char.name} Arrived`,
                    message: `Has arrived at Sector K5 and is awaiting orders. (Idle escalation will trigger in 10s, 20s, 30s)`,
                    characterId: char.id,
                    characterName: char.name,
                    location: 'Sector K5',
                    timestamp: Date.now(),
                  })
                }
              }}
              className="text-left hover:text-green-400 px-2 py-1 hover:bg-gray-800 rounded border-l-2 border-green-500 pl-2"
            >
              Test: Arrival + Idle Flow
            </button>
            <button
              onClick={() => {
                useGameStore.getState().addNotification({
                  type: 'call_incoming',
                  priority: 'urgent',
                  title: 'Incoming Call: Handler',
                  message: '"We have a situation. Check your email ASAP."',
                  timestamp: Date.now(),
                })
              }}
              className="text-left hover:text-red-400 px-2 py-1 hover:bg-gray-800 rounded"
            >
              Test: Urgent Call
            </button>
            <button
              onClick={() => {
                useGameStore.getState().clearAllNotifications()
              }}
              className="text-left hover:text-gray-400 px-2 py-1 hover:bg-gray-800 rounded"
            >
              Clear All Notifications
            </button>
            <div className="border-t border-gray-700 my-2"></div>
            <div className="text-xs text-gray-400 mb-2">News System Tests:</div>
            <button
              onClick={() => {
                const { generateMissionNews } = useGameStore.getState()
                generateMissionNews({
                  success: true,
                  collateralDamage: 15000,
                  civilianCasualties: 0,
                  city: 'New York',
                  country: 'United States',
                  missionType: 'bank_robbery',
                  enemyType: 'gang_members',
                  vigilantismLegal: true
                })
              }}
              className="text-left hover:text-green-400 px-2 py-1 hover:bg-gray-800 rounded border-l-2 border-green-500 pl-2"
            >
              Generate Success Story
            </button>
            <button
              onClick={() => {
                const { generateMissionNews } = useGameStore.getState()
                generateMissionNews({
                  success: true,
                  collateralDamage: 250000,
                  civilianCasualties: 3,
                  city: 'Los Angeles',
                  country: 'United States',
                  missionType: 'hostage_rescue',
                  enemyType: 'terrorists',
                  vigilantismLegal: true
                })
              }}
              className="text-left hover:text-yellow-400 px-2 py-1 hover:bg-gray-800 rounded"
            >
              Generate Messy Victory
            </button>
            <button
              onClick={() => {
                const { generateMissionNews } = useGameStore.getState()
                generateMissionNews({
                  success: false,
                  collateralDamage: 5000,
                  civilianCasualties: 1,
                  city: 'Chicago',
                  country: 'United States',
                  missionType: 'assassination_attempt',
                  enemyType: 'mercenaries',
                  vigilantismLegal: false
                })
              }}
              className="text-left hover:text-red-400 px-2 py-1 hover:bg-gray-800 rounded"
            >
              Generate Failure Story
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

      {/* Quick Combat Simulator Modal */}
      {quickCombatOpen && <QuickCombatSimulator onClose={() => setQuickCombatOpen(false)} />}

      {/* Instant Combat (Batch Testing) Modal */}
      {instantCombatOpen && <InstantCombat onClose={() => setInstantCombatOpen(false)} />}

      {/* Keyboard Shortcuts Guide - Press ? to toggle */}
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Mobile Phone - Shows texts and calls */}
      <MobilePhone />

      {/* Squad Roster - Shows characters (only in playing phase on world map) */}
      {gamePhase === 'playing' && currentView === 'world-map' && <SquadRoster />}

      {/* Game Setup Phase - wrapped in error boundary */}
      <ErrorBoundary>
      {gamePhase === 'faction-selection' && <FactionSelection />}
      {gamePhase === 'country-selection' && <CountrySelection />}
      {gamePhase === 'city-selection' && <CitySelection />}
      {gamePhase === 'recruiting' && <RecruitingPage />}

      {/* Main Game Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Only show HUD for non-fullscreen views (world-map and combat-lab have their own UI) */}
          {currentView !== 'combat-lab' && currentView !== 'world-map' && <GameHUD />}
          <div className={currentView !== 'combat-lab' && currentView !== 'world-map' ? 'pt-16' : ''}> {/* Account for HUD */}
            {currentView === 'world-map' && <WorldMapGrid />}
            {currentView === 'investigation' && <InvestigationCenter />}
            {currentView === 'investigation-board' && <InvestigationBoard />}
            {currentView === 'tactical-combat' && <TacticalCombat />}
            {currentView === 'characters' && <CharacterScreen />}
            {currentView === 'hospital' && <HospitalScreen />}
            {currentView === 'equipment-shop' && <EquipmentShop />}
            {currentView === 'combat-lab' && <CombatLab />}
            {currentView === 'news' && <NewsBrowser />}
            {currentView === 'encyclopedia' && <Encyclopedia />}
            {currentView === 'almanac' && <WorldAlmanac onClose={() => setCurrentView('world-map')} />}
            {currentView === 'balance' && <BalanceAnalyzer />}
            {/* world-map-grid is now aliased to world-map - WorldMapGrid is the main map */}
            {currentView === 'database' && <DatabaseAdmin />}
            {currentView === 'data-viewer' && <DataViewer onClose={() => setCurrentView('world-map')} />}
            {currentView === 'sound-config' && <SoundConfigUI />}
            {currentView === 'loadout-editor' && <LoadoutEditor />}
            {currentView === 'sector-editor' && <SectorEditor onClose={() => setCurrentView('world-map')} />}
            {currentView === 'world-data' && <WorldDataEditor onClose={() => setCurrentView('world-map')} />}
            {currentView === 'training' && <TrainingCenter />}
            {currentView === 'base' && <BaseManager />}
          </div>
        </>
      )}
      </ErrorBoundary>
      </div> {/* End game-content wrapper */}

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
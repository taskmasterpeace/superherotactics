import React, { useEffect, useState } from 'react'
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

function App() {
  const { gamePhase, currentView, setCurrentView, setGamePhase } = useGameStore()
  const [devMode, setDevMode] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [assetManagerOpen, setAssetManagerOpen] = useState(false)
  const [quickCombatOpen, setQuickCombatOpen] = useState(false)
  const [instantCombatOpen, setInstantCombatOpen] = useState(false)

  // Get the idle check function from the store
  const checkIdleCharacters = useGameStore(state => state.checkIdleCharacters)

  useEffect(() => {
    console.log('🎮 SuperHero Tactics MVP initialized')

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
      {/* Notification Bar - Always visible at top */}
      <NotificationBar />

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

      {/* Mobile Phone - Shows texts and calls */}
      <MobilePhone />

      {/* Squad Roster - Shows characters (only in playing phase on world map) */}
      {gamePhase === 'playing' && currentView === 'world-map' && <SquadRoster />}

      {/* Game Setup Phase */}
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
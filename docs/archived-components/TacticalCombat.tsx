import React, { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Plane } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import * as THREE from 'three'

// 3D Combat Visualization Component
function CombatScene({ combatData }: { combatData: any }) {
  const [cameraMode, setCameraMode] = useState<'isometric' | 'tactical' | 'cinematic'>('isometric')
  
  return (
    <Canvas
      camera={{ 
        position: cameraMode === 'isometric' ? [10, 10, 10] : [0, 15, 0],
        fov: 60 
      }}
      style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={50}
      />
      
      {/* Combat Grid */}
      <CombatGrid />
      
      {/* Characters */}
      {combatData.characters.map((character: any, index: number) => (
        <Character3D 
          key={character.id}
          character={character}
          position={character.position || [index * 2, 0, 0]}
        />
      ))}
      
      {/* Environmental Objects */}
      <EnvironmentalObjects environment={combatData.environment} />
      
      {/* Combat Effects */}
      <CombatEffects />
      
    </Canvas>
  )
}

function CombatGrid() {
  const gridSize = 15
  const cellSize = 1
  
  return (
    <group>
      {/* Grid Base */}
      <Plane 
        args={[gridSize * cellSize, gridSize * cellSize]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
      >
        <meshStandardMaterial color="#1f2937" opacity={0.8} transparent />
      </Plane>
      
      {/* Grid Lines */}
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <group key={`grid-${i}`}>
          {/* Horizontal lines */}
          <Box args={[gridSize * cellSize, 0.01, 0.01]} position={[0, 0, i * cellSize - gridSize * cellSize / 2]}>
            <meshBasicMaterial color="#6b7280" />
          </Box>
          {/* Vertical lines */}
          <Box args={[0.01, 0.01, gridSize * cellSize]} position={[i * cellSize - gridSize * cellSize / 2, 0, 0]}>
            <meshBasicMaterial color="#6b7280" />
          </Box>
        </group>
      ))}
    </group>
  )
}

function Character3D({ character, position }: { character: any, position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isSelected, setIsSelected] = useState(false)
  
  // Character animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.5
    }
  })
  
  // Character color based on faction
  const getCharacterColor = (faction: string) => {
    switch (faction) {
      case 'US': return '#3b82f6'
      case 'China': return '#ef4444' 
      case 'India': return '#f97316'
      case 'Nigeria': return '#22c55e'
      default: return '#8b5cf6'
    }
  }
  
  return (
    <group position={position} onClick={() => setIsSelected(!isSelected)}>
      {/* Character Model */}
      <Box 
        ref={meshRef}
        args={[0.8, 1.6, 0.4]}
        position={[0, 0.8, 0]}
      >
        <meshStandardMaterial 
          color={getCharacterColor(character.faction)} 
          emissive={isSelected ? getCharacterColor(character.faction) : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </Box>
      
      {/* Character Name */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="#facc15"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {character.name}
      </Text>
      
      {/* Health Bar */}
      <HealthBar3D health={character.health} position={[0, 2.2, 0]} />
      
      {/* Altitude Indicator */}
      {character.altitude > 0 && (
        <group position={[0, character.altitude * 2, 0]}>
          <Box args={[0.2, 0.2, 0.2]}>
            <meshBasicMaterial color="#facc15" />
          </Box>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.2}
            color="#facc15"
            anchorX="center"
          >
            ALT {character.altitude}
          </Text>
        </group>
      )}
      
      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}

function HealthBar3D({ health, position }: { health: { current: number, maximum: number }, position: [number, number, number] }) {
  const healthPercent = (health.current / health.maximum) * 100
  const healthColor = healthPercent > 60 ? '#10b981' : healthPercent > 30 ? '#f59e0b' : '#ef4444'
  
  return (
    <group position={position}>
      {/* Background */}
      <Box args={[1.5, 0.1, 0.05]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#374151" />
      </Box>
      {/* Health Fill */}
      <Box args={[(healthPercent / 100) * 1.5, 0.1, 0.05]} position={[-(1.5 - (healthPercent / 100) * 1.5) / 2, 0.01, 0]}>
        <meshBasicMaterial color={healthColor} />
      </Box>
    </group>
  )
}

function EnvironmentalObjects({ environment }: { environment: string }) {
  const objects = getEnvironmentalObjects(environment)
  
  return (
    <group>
      {objects.map((obj, index) => (
        <EnvironmentObject3D key={index} object={obj} />
      ))}
    </group>
  )
}

function EnvironmentObject3D({ object }: { object: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const getObjectModel = (type: string) => {
    switch (type) {
      case 'car':
        return <Box args={[2, 1, 4]} position={object.position}>
          <meshStandardMaterial color="#dc2626" />
        </Box>
      case 'building':
        return <Box args={[3, 6, 3]} position={[object.position[0], 3, object.position[2]]}>
          <meshStandardMaterial color="#6b7280" />
        </Box>
      case 'tree':
        return <group>
          <Box args={[0.5, 4, 0.5]} position={[object.position[0], 2, object.position[2]]}>
            <meshStandardMaterial color="#92400e" />
          </Box>
          <Box args={[2, 2, 2]} position={[object.position[0], 4.5, object.position[2]]}>
            <meshStandardMaterial color="#166534" />
          </Box>
        </group>
      default:
        return <Box args={[1, 1, 1]} position={object.position}>
          <meshStandardMaterial color="#8b5cf6" />
        </Box>
    }
  }
  
  return (
    <group onClick={() => console.log(`Clicked ${object.type}`)}>
      {getObjectModel(object.type)}
    </group>
  )
}

function CombatEffects() {
  // Visual effects for combat actions would go here
  return null
}

function getEnvironmentalObjects(environment: string) {
  const objects = []
  
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 14
    const z = (Math.random() - 0.5) * 14
    
    switch (environment) {
      case 'urban':
        objects.push({
          type: Math.random() > 0.7 ? 'car' : 'building',
          position: [x, 0, z],
          destructible: true
        })
        break
      case 'forest':
        objects.push({
          type: 'tree',
          position: [x, 0, z],
          destructible: true
        })
        break
      default:
        if (Math.random() > 0.8) {
          objects.push({
            type: 'generic',
            position: [x, 0, z],
            destructible: true
          })
        }
    }
  }
  
  return objects
}

export default function TacticalCombat() {
  const { characters, setCurrentView } = useGameStore()
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [combatLog, setCombatLog] = useState<string[]>(['Combat initialized'])
  const [cameraMode, setCameraMode] = useState<'isometric' | 'tactical' | 'cinematic'>('isometric')

  const addLogEntry = (entry: string) => {
    setCombatLog(prev => [...prev, entry])
  }

  const handleAction = (action: string) => {
    setSelectedAction(action)
    addLogEntry(`Selected action: ${action}`)
    
    // Actually process the action
    switch(action) {
      case 'move':
        addLogEntry('Character moves to new position')
        break
      case 'attack':
        addLogEntry('Character performs attack - Rolling dice...')
        setTimeout(() => {
          const roll = Math.floor(Math.random() * 100) + 1
          addLogEntry(`Dice roll: ${roll} - ${roll > 70 ? 'Critical Hit!' : roll > 40 ? 'Hit' : 'Miss'}`)
          if (roll > 40) {
            addLogEntry(`Damage dealt: ${Math.floor(Math.random() * 30) + 10}`)
          }
        }, 1000)
        break
      case 'power':
        addLogEntry('Character activates LSW power')
        setTimeout(() => {
          addLogEntry('Power effect: Area damage + status effect applied')
        }, 1500)
        break
      case 'throw':
        addLogEntry('Character picks up car (2,800 lbs)')
        setTimeout(() => {
          addLogEntry('Car thrown 3 squares - hits target for 65 damage!')
          addLogEntry('Legal consequence: $25,000 property damage + Grand Theft Auto')
        }, 2000)
        break
    }
  }

  return (
    <div className="h-screen flex flex-col">
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
              <span className="text-sht-primary-400 font-bold ml-2">{combatState.turn}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Active:</span>
              <span className="text-sht-secondary-400 font-bold ml-2">
                {combatState.characters.find(c => c.id === combatState.activeCharacter)?.name || 'None'}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCameraMode('isometric')}
                className={`px-3 py-1 rounded text-xs ${cameraMode === 'isometric' ? 'bg-sht-primary-500 text-black' : 'bg-gray-700 text-white'}`}
              >
                📐 Isometric
              </button>
              <button 
                onClick={() => setCameraMode('tactical')}
                className={`px-3 py-1 rounded text-xs ${cameraMode === 'tactical' ? 'bg-sht-primary-500 text-black' : 'bg-gray-700 text-white'}`}
              >
                🎯 Tactical
              </button>
              <button 
                onClick={() => setCameraMode('cinematic')}
                className={`px-3 py-1 rounded text-xs ${cameraMode === 'cinematic' ? 'bg-sht-primary-500 text-black' : 'bg-gray-700 text-white'}`}
              >
                🎬 Cinematic
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex">
        {/* 3D Combat View */}
        <motion.div 
          className="flex-1 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CombatScene combatData={{ characters, environment: 'urban' }} />
          
          {/* Combat Overlay UI */}
          <div className="absolute top-4 left-4 z-10">
            <div className="game-panel p-4 space-y-2">
              <h3 className="text-lg font-bold text-sht-primary-400">🎯 Target Selection</h3>
              <div className="text-sm text-gray-300">
                Click characters or objects to interact
              </div>
              {selectedAction && (
                <div className="text-xs text-sht-secondary-400">
                  Action: {selectedAction}
                </div>
              )}
            </div>
          </div>
          
          {/* Environmental Object Info */}
          <div className="absolute top-4 right-4 z-10">
            <div className="game-panel p-4 space-y-2">
              <h3 className="text-lg font-bold text-sht-accent-400">🚗 Environment</h3>
              <div className="text-sm text-gray-300">
                Urban Terrain
              </div>
              <div className="text-xs space-y-1">
                <div>• Cars available for throwing</div>
                <div>• Buildings provide cover</div>
                <div>• Destructible environment</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Combat Control Panel */}
        <motion.div 
          className="w-80 bg-gray-900 bg-opacity-95 border-l border-sht-primary-400 p-6 overflow-y-auto"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Character Status */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-primary-400 mb-4">👥 Characters</h3>
            <div className="space-y-3">
              {characters.map((character) => (
                <div key={character.id} className="game-panel p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sht-secondary-400">{character.name}</h4>
                    <div className={`status-indicator ${character.status === 'ready' ? 'status-ready' : 'status-busy'}`}>
                      {character.status}
                    </div>
                  </div>
                  
                  {/* Health Bar */}
                  <div className="mb-2">
                    <div className="text-xs text-gray-400 mb-1">Health: {character.health.current}/{character.health.maximum}</div>
                    <div className="health-bar">
                      <div 
                        className="health-fill"
                        style={{ width: `${(character.health.current / character.health.maximum) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
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
            <h3 className="text-xl font-bold text-sht-accent-400 mb-4">⚡ Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleAction('move')}
                className="action-button"
              >
                🚶 Move (1 AP)
              </button>
              <button 
                onClick={() => handleAction('attack')}
                className="action-button"
              >
                ⚔️ Attack (2 AP)
              </button>
              <button 
                onClick={() => handleAction('power')}
                className="action-button"
              >
                🔥 Power (3 AP)
              </button>
              <button 
                onClick={() => handleAction('throw')}
                className="action-button"
              >
                🚗 Throw (3 AP)
              </button>
              <button 
                onClick={() => handleAction('altitude')}
                className="action-button"
              >
                ✈️ Altitude (1 AP)
              </button>
              <button 
                onClick={() => handleAction('item')}
                className="action-button"
              >
                💊 Item (2 AP)
              </button>
            </div>
          </div>

          {/* Combat Log */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-success mb-4">📝 Combat Log</h3>
            <div className="bg-black bg-opacity-50 p-4 rounded-lg h-40 overflow-y-auto">
              {combatLog.map((entry, index) => (
                <div key={index} className="text-xs font-tactical text-gray-300 mb-1">
                  <span className="text-sht-primary-400">[{String(index + 1).padStart(2, '0')}]</span> {entry}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Combat Options */}
          <div className="space-y-2">
            <button 
              onClick={() => addLogEntry('Switched to quick combat mode')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
            >
              ⚡ Quick Combat
            </button>
            <button 
              onClick={() => {
                addLogEntry('Combat ended - returning to world map')
                setCurrentView('world-map')
              }}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg font-bold transition-all"
            >
              🚪 Exit Combat
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
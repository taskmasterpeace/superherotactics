import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import toast from 'react-hot-toast'

// Grid cell component
interface GridCell {
  x: number
  y: number
  character?: any
  object?: any
  terrain: 'ground' | 'cover' | 'hazard'
  altitude: number
}

// Combat state interface
interface CombatState {
  grid: GridCell[][]
  turn: number
  phase: 'movement' | 'action' | 'resolution'
  activeCharacter: any
  actionPoints: number
  combatants: any[]
  selectedAction: string
  selectedTarget: [number, number] | null
}

export default function ProperTacticalCombat() {
  const { characters, setCurrentView } = useGameStore()
  
  // Initialize combat state
  const [combatState, setCombatState] = useState<CombatState>({
    grid: initializeGrid(),
    turn: 1,
    phase: 'movement',
    activeCharacter: characters[0],
    actionPoints: 6,
    combatants: characters.slice(0, 2), // First 2 characters
    selectedAction: '',
    selectedTarget: null
  })
  
  const [combatLog, setCombatLog] = useState<string[]>([
    'Combat initialized',
    `Turn 1 begins - ${characters[0]?.name} acts first`
  ])
  
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  
  // Initialize grid with characters and objects
  function initializeGrid(): GridCell[][] {
    const grid: GridCell[][] = Array(15).fill(null).map((_, y) => 
      Array(15).fill(null).map((_, x) => ({
        x,
        y,
        terrain: 'ground',
        altitude: 0
      }))
    )
    
    // Place characters
    if (characters.length > 0) {
      grid[2][2] = {
        ...grid[2][2],
        character: { ...characters[0], position: [2, 2] }
      }
    }
    
    if (characters.length > 1) {
      grid[12][12] = {
        ...grid[12][12], 
        character: { ...characters[1], position: [12, 12] }
      }
    }
    
    // Add environmental objects
    const objectPositions = [
      [5, 5, 'car'], [8, 3, 'building'], [10, 8, 'car'], 
      [3, 10, 'tree'], [7, 12, 'car'], [11, 6, 'building']
    ]
    
    objectPositions.forEach(([x, y, type]) => {
      if (grid[y] && grid[y][x] && !grid[y][x].character) {
        grid[y][x] = {
          ...grid[y][x],
          object: { type, weight: type === 'car' ? 2800 : type === 'building' ? 50000 : 500 }
        }
      }
    })
    
    return grid
  }

  const addLogEntry = (entry: string) => {
    setCombatLog(prev => [...prev, `[Turn ${combatState.turn}] ${entry}`])
  }

  const handleCellClick = (x: number, y: number) => {
    setSelectedCell([x, y])
    const cell = combatState.grid[y][x]
    
    if (combatState.selectedAction === 'move') {
      handleMovement(x, y)
    } else if (combatState.selectedAction === 'attack' || combatState.selectedAction === 'power') {
      handleAttack(x, y)
    } else if (combatState.selectedAction === 'throw') {
      handleThrowObject(x, y)
    } else {
      // Just show cell info
      if (cell.character) {
        toast.info(`${cell.character.name} at position (${x}, ${y})`)
      } else if (cell.object) {
        toast.info(`${cell.object.type} at (${x}, ${y}) - Weight: ${cell.object.weight} lbs`)
      } else {
        toast.info(`Empty ground at (${x}, ${y})`)
      }
    }
  }

  const handleMovement = (targetX: number, targetY: number) => {
    if (combatState.actionPoints < 1) {
      toast.error('Insufficient Action Points')
      return
    }
    
    const currentChar = combatState.activeCharacter
    if (!currentChar || !currentChar.position) return
    
    const [currentX, currentY] = currentChar.position
    const distance = Math.abs(targetX - currentX) + Math.abs(targetY - currentY)
    
    if (distance > 3) {
      toast.error('Too far to move in one action')
      return
    }
    
    if (combatState.grid[targetY][targetX].character) {
      toast.error('Square occupied by character')
      return
    }
    
    // Move character
    const newGrid = [...combatState.grid]
    newGrid[currentY][currentX] = { ...newGrid[currentY][currentX], character: undefined }
    newGrid[targetY][targetX] = { 
      ...newGrid[targetY][targetX], 
      character: { ...currentChar, position: [targetX, targetY] }
    }
    
    setCombatState(prev => ({
      ...prev,
      grid: newGrid,
      actionPoints: prev.actionPoints - 1,
      selectedAction: ''
    }))
    
    addLogEntry(`${currentChar.name} moves to (${targetX}, ${targetY}) - 1 AP spent`)
    setSelectedCell(null)
  }

  const handleAttack = (targetX: number, targetY: number) => {
    if (combatState.actionPoints < 2) {
      toast.error('Insufficient Action Points for attack')
      return
    }
    
    const target = combatState.grid[targetY][targetX].character
    if (!target) {
      toast.error('No target at selected position')
      return
    }
    
    // Calculate attack using your system
    const attacker = combatState.activeCharacter
    const baseAccuracy = 50 // Base 50% hit chance
    const agilityBonus = Math.floor(attacker.stats.AGL / 10) * 5 // +5% per 10 AGL
    const meleeBonus = combatState.selectedAction === 'attack' ? Math.floor(attacker.stats.MEL / 10) * 5 : 0
    
    const hitChance = baseAccuracy + agilityBonus + meleeBonus
    const roll = Math.floor(Math.random() * 100) + 1
    
    addLogEntry(`${attacker.name} attacks ${target.name}`)
    addLogEntry(`Accuracy calculation: ${baseAccuracy} base + ${agilityBonus} AGL + ${meleeBonus} skill = ${hitChance}%`)
    addLogEntry(`Dice roll: ${roll}`)
    
    if (roll <= hitChance) {
      // Hit! Calculate damage
      let damage = 10 + Math.floor(attacker.stats.STR / 10) // Base damage + STR bonus
      
      if (roll <= 10) {
        // Critical hit (Red result)
        damage *= 2
        addLogEntry(`CRITICAL HIT! Double damage`)
        
        // Roll for critical effect
        const critRoll = Math.floor(Math.random() * 6) + 1
        if (critRoll <= 2) {
          addLogEntry(`Critical effect: ARM BLOW - Target's weapon arm injured (-1CS until healed)`)
        } else if (critRoll <= 4) {
          addLogEntry(`Critical effect: KNOCKED DOWN - Target falls prone`)
        } else {
          addLogEntry(`Critical effect: STUNNED - Target loses next turn`)
        }
      } else if (roll <= 25) {
        // Major hit (Yellow result)
        damage = Math.floor(damage * 1.5)
        addLogEntry(`Major hit! +50% damage`)
      }
      
      addLogEntry(`Damage dealt: ${damage}`)
      
      // Check for knockback if using strength
      if (attacker.stats.STR >= 40 && combatState.selectedAction === 'attack') {
        const knockbackDistance = Math.floor(attacker.stats.STR / 10) - 2 // STR-based knockback
        if (knockbackDistance > 0) {
          addLogEntry(`Knockback: Target knocked back ${knockbackDistance} squares`)
          // TODO: Implement actual knockback movement
        }
      }
      
    } else {
      addLogEntry(`Attack misses`)
    }
    
    setCombatState(prev => ({
      ...prev,
      actionPoints: prev.actionPoints - 2,
      selectedAction: '',
      selectedTarget: null
    }))
    
    setSelectedCell(null)
  }

  const handleThrowObject = (targetX: number, targetY: number) => {
    if (combatState.actionPoints < 3) {
      toast.error('Insufficient Action Points for throwing')
      return
    }
    
    const attacker = combatState.activeCharacter
    const [currentX, currentY] = attacker.position
    
    // Find nearest object
    let nearestObject = null
    let nearestDistance = 999
    
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (combatState.grid[y][x].object) {
          const distance = Math.abs(x - currentX) + Math.abs(y - currentY)
          if (distance < nearestDistance && distance <= 2) {
            nearestObject = { x, y, ...combatState.grid[y][x].object }
            nearestDistance = distance
          }
        }
      }
    }
    
    if (!nearestObject) {
      toast.error('No throwable objects within reach')
      return
    }
    
    // Check if character strong enough to throw object
    const strengthRequired = nearestObject.weight / 100 // Simplified: 100 lbs per STR point
    if (attacker.stats.STR < strengthRequired) {
      toast.error(`Need ${strengthRequired} STR to throw ${nearestObject.type} (${nearestObject.weight} lbs)`)
      return
    }
    
    // Calculate throwing range and damage
    const throwRange = Math.floor((attacker.stats.STR - strengthRequired) / 10) + 1
    const distance = Math.abs(targetX - currentX) + Math.abs(targetY - currentY)
    
    if (distance > throwRange) {
      toast.error(`Object can only be thrown ${throwRange} squares`)
      return
    }
    
    // Execute throw
    const baseDamage = Math.floor(nearestObject.weight / 50) // Weight-based damage
    const strBonus = Math.floor(attacker.stats.STR / 10)
    const totalDamage = baseDamage + strBonus
    
    addLogEntry(`${attacker.name} picks up ${nearestObject.type} (${nearestObject.weight} lbs)`)
    addLogEntry(`Throws ${nearestObject.type} ${distance} squares`)
    addLogEntry(`Impact damage: ${totalDamage} (${baseDamage} base + ${strBonus} STR bonus)`)
    
    // Legal consequences for throwing cars
    if (nearestObject.type === 'car') {
      addLogEntry(`Legal consequence: $25,000 property damage + Grand Theft Auto charges`)
    }
    
    // Remove object from grid
    const newGrid = [...combatState.grid]
    newGrid[nearestObject.y][nearestObject.x] = {
      ...newGrid[nearestObject.y][nearestObject.x],
      object: undefined
    }
    
    setCombatState(prev => ({
      ...prev,
      grid: newGrid,
      actionPoints: prev.actionPoints - 3,
      selectedAction: ''
    }))
    
    setSelectedCell(null)
  }

  const selectAction = (action: string) => {
    setCombatState(prev => ({ ...prev, selectedAction: action }))
    
    switch(action) {
      case 'move':
        toast.info('Click a square to move (1 AP)')
        break
      case 'attack':
        toast.info('Click target to attack (2 AP)')
        break
      case 'power':
        toast.info('Click target for power attack (3+ AP)')
        break
      case 'throw':
        toast.info('Click target location to throw object (3 AP)')
        break
    }
  }

  const endTurn = () => {
    // Switch to next character
    const currentIndex = combatState.combatants.findIndex(c => c.id === combatState.activeCharacter.id)
    const nextIndex = (currentIndex + 1) % combatState.combatants.length
    const nextCharacter = combatState.combatants[nextIndex]
    
    // Calculate initiative for next character (using your system)
    const initiative = nextCharacter.stats.AGL + Math.floor(nextCharacter.stats.INS / 2)
    const actionPoints = 3 + Math.floor(initiative / 30) // Base 3 + initiative bonus
    
    setCombatState(prev => ({
      ...prev,
      turn: nextIndex === 0 ? prev.turn + 1 : prev.turn,
      activeCharacter: nextCharacter,
      actionPoints: actionPoints,
      selectedAction: '',
      selectedTarget: null
    }))
    
    addLogEntry(`Turn ended`)
    addLogEntry(`${nextCharacter.name}'s turn begins (${actionPoints} AP)`)
    setSelectedCell(null)
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
              <span className="text-sht-primary-400 font-bold ml-2">{combatState.turn}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Active:</span>
              <span className="text-sht-secondary-400 font-bold ml-2">
                {combatState.activeCharacter?.name || 'None'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">AP:</span>
              <span className={`font-bold ml-2 ${
                combatState.actionPoints > 3 ? 'text-green-400' :
                combatState.actionPoints > 1 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {combatState.actionPoints}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Phase:</span>
              <span className="text-blue-400 font-bold ml-2 capitalize">{combatState.phase}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex">
        {/* Proper 15x15 Tactical Grid */}
        <motion.div 
          className="flex-1 relative bg-gray-800 p-4 overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-sht-success">🗺️ Tactical Battlefield (15x15)</h2>
            <div className="text-sm text-gray-400">
              {combatState.selectedAction ? `Action: ${combatState.selectedAction}` : 'Select an action below'}
            </div>
          </div>
          
          {/* Grid Container */}
          <div className="flex justify-center">
            <div className="inline-block bg-gray-900 p-4 rounded-lg border border-gray-600">
              {/* Grid using proper flexbox */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(15, 40px)', gap: '1px' }}>
                {combatState.grid.flat().map((cell, index) => {
                  const isSelected = selectedCell && selectedCell[0] === cell.x && selectedCell[1] === cell.y
                  const isValidMove = combatState.selectedAction === 'move' && 
                    combatState.activeCharacter?.position &&
                    Math.abs(cell.x - combatState.activeCharacter.position[0]) + 
                    Math.abs(cell.y - combatState.activeCharacter.position[1]) <= 3
                  
                  return (
                    <div
                      key={`${cell.x}-${cell.y}`}
                      className={`
                        w-10 h-10 border border-gray-600 cursor-pointer relative transition-all duration-200
                        ${isSelected ? 'border-sht-primary-400 bg-sht-primary-400 bg-opacity-30' : ''}
                        ${isValidMove ? 'border-green-400 hover:bg-green-400 hover:bg-opacity-20' : ''}
                        ${cell.character ? 'bg-blue-600 bg-opacity-40' : ''}
                        ${cell.object ? 'bg-yellow-600 bg-opacity-40' : ''}
                        ${!cell.character && !cell.object ? 'bg-gray-700 hover:bg-gray-600' : ''}
                      `}
                      onClick={() => handleCellClick(cell.x, cell.y)}
                      title={`(${cell.x}, ${cell.y})`}
                    >
                      {/* Character Token */}
                      {cell.character && (
                        <div className={`
                          absolute inset-1 rounded-full flex items-center justify-center text-xs font-bold text-white
                          ${cell.character.id === combatState.activeCharacter?.id ? 'bg-green-500' : 'bg-blue-500'}
                        `}>
                          {cell.character.name.substring(0, 2)}
                        </div>
                      )}
                      
                      {/* Environmental Object */}
                      {cell.object && !cell.character && (
                        <div className="absolute inset-0 flex items-center justify-center text-lg">
                          {cell.object.type === 'car' ? '🚗' : 
                           cell.object.type === 'building' ? '🏢' : 
                           cell.object.type === 'tree' ? '🌳' : '📦'}
                        </div>
                      )}
                      
                      {/* Grid Coordinates (for debugging) */}
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500 leading-none">
                        {cell.x},{cell.y}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            Green border = Valid move • Blue = Characters • Yellow = Objects • Click to interact
          </div>
        </motion.div>

        {/* Combat Control Panel */}
        <motion.div 
          className="w-80 bg-gray-900 bg-opacity-95 border-l border-sht-primary-400 p-6 overflow-y-auto"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
        >
          {/* Active Character */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-primary-400 mb-4">🎯 Active Character</h3>
            {combatState.activeCharacter && (
              <div className="game-panel p-4">
                <h4 className="font-bold text-white mb-2">{combatState.activeCharacter.name}</h4>
                <div className="grid grid-cols-3 gap-1 text-xs mb-3">
                  <div className="text-center">
                    <div className="text-gray-400">MEL</div>
                    <div className="font-bold text-red-400">{combatState.activeCharacter.stats.MEL}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">AGL</div>
                    <div className="font-bold text-blue-400">{combatState.activeCharacter.stats.AGL}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">STR</div>
                    <div className="font-bold text-purple-400">{combatState.activeCharacter.stats.STR}</div>
                  </div>
                </div>
                
                <div className="health-bar">
                  <div 
                    className="health-fill"
                    style={{ width: `${(combatState.activeCharacter.health.current / combatState.activeCharacter.health.maximum) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Menu */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-accent-400 mb-4">⚡ Actions</h3>
            <div className="space-y-2">
              <ActionButton 
                action="move"
                label="🚶 Move (1 AP)"
                cost={1}
                available={combatState.actionPoints >= 1}
                selected={combatState.selectedAction === 'move'}
                onClick={() => selectAction('move')}
              />
              <ActionButton 
                action="attack"
                label="⚔️ Attack (2 AP)" 
                cost={2}
                available={combatState.actionPoints >= 2}
                selected={combatState.selectedAction === 'attack'}
                onClick={() => selectAction('attack')}
              />
              <ActionButton 
                action="power"
                label="🔥 LSW Power (3 AP)"
                cost={3}
                available={combatState.actionPoints >= 3}
                selected={combatState.selectedAction === 'power'}
                onClick={() => selectAction('power')}
              />
              <ActionButton 
                action="throw"
                label="🚗 Throw Object (3 AP)"
                cost={3}
                available={combatState.actionPoints >= 3}
                selected={combatState.selectedAction === 'throw'}
                onClick={() => selectAction('throw')}
              />
              
              <button 
                onClick={endTurn}
                className="w-full p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-all"
              >
                ⏭️ End Turn
              </button>
            </div>
          </div>

          {/* Combat Log */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-success mb-4">📝 Combat Log</h3>
            <div className="bg-black bg-opacity-50 p-4 rounded-lg h-64 overflow-y-auto">
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

function ActionButton({ action, label, cost, available, selected, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={!available}
      className={`
        w-full p-3 rounded-lg font-bold transition-all
        ${selected ? 'bg-sht-primary-500 text-black ring-2 ring-sht-primary-400' :
          available ? 'bg-gray-700 hover:bg-gray-600 text-white' : 
          'bg-gray-800 text-gray-500 cursor-not-allowed'}
      `}
    >
      {label}
    </button>
  )
}
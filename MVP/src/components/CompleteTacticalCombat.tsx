import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import toast from 'react-hot-toast'

// Enhanced combat state with injury tracking
interface CombatState {
  grid: GridCell[][]
  turn: number
  phase: 'movement' | 'action' | 'resolution' | 'aftermath'
  activeCharacter: any
  actionPoints: number
  combatants: any[]
  selectedAction: string
  selectedTarget: [number, number] | null
  injuries: any[]
  propertyDamage: number
  combatCompleted: boolean
}

interface GridCell {
  x: number
  y: number
  character?: any
  object?: any
  terrain: 'ground' | 'cover' | 'hazard'
  altitude: number
  destroyed?: boolean
}

export default function CompleteTacticalCombat() {
  const { characters, setCurrentView, budget } = useGameStore()
  
  const [combatState, setCombatState] = useState<CombatState>({
    grid: initializeGrid(),
    turn: 1,
    phase: 'movement',
    activeCharacter: characters[0],
    actionPoints: 6,
    combatants: characters.slice(0, 2).map((char, index) => ({
      ...char,
      position: index === 0 ? [2, 2] : [12, 12],
      currentHealth: char.health.current,
      injuries: [],
      statusEffects: []
    })),
    selectedAction: '',
    selectedTarget: null,
    injuries: [],
    propertyDamage: 0,
    combatCompleted: false
  })
  
  const [combatLog, setCombatLog] = useState<string[]>([
    'Combat initialized - Urban street environment',
    `Initiative: ${characters[0]?.name} (AGL ${characters[0]?.stats?.AGL}) vs ${characters[1]?.name} (AGL ${characters[1]?.stats?.AGL})`,
    `${characters[0]?.name} wins initiative and acts first`
  ])
  
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [showAftermathModal, setShowAftermathModal] = useState(false)

  function initializeGrid(): GridCell[][] {
    const grid: GridCell[][] = Array(15).fill(null).map((_, y) => 
      Array(15).fill(null).map((_, x) => ({
        x, y, terrain: 'ground', altitude: 0
      }))
    )
    
    // Place characters with proper positioning
    if (characters.length > 0) {
      grid[2][2] = { ...grid[2][2], character: { ...characters[0], position: [2, 2] } }
    }
    if (characters.length > 1) {
      grid[12][12] = { ...grid[12][12], character: { ...characters[1], position: [12, 12] } }
    }
    
    // Add environmental objects strategically
    const objects = [
      { x: 5, y: 5, type: 'car', weight: 2800, value: 25000 },
      { x: 8, y: 3, type: 'building', weight: 50000, value: 500000 },
      { x: 10, y: 8, type: 'car', weight: 2800, value: 25000 },
      { x: 3, y: 10, type: 'tree', weight: 500, value: 0 },
      { x: 7, y: 12, type: 'dumpster', weight: 400, value: 800 },
      { x: 11, y: 6, type: 'streetlight', weight: 200, value: 1500 }
    ]
    
    objects.forEach(obj => {
      if (grid[obj.y] && grid[obj.y][obj.x] && !grid[obj.y][obj.x].character) {
        grid[obj.y][obj.x] = { ...grid[obj.y][obj.x], object: obj }
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
    } else if (combatState.selectedAction === 'attack') {
      handleAttack(x, y)
    } else if (combatState.selectedAction === 'power') {
      handlePowerAttack(x, y)
    } else if (combatState.selectedAction === 'throw') {
      handleThrowObject(x, y)
    } else {
      // Show cell information
      if (cell.character) {
        toast.info(`${cell.character.name} - Health: ${cell.character.currentHealth}/${cell.character.health.maximum}`)
      } else if (cell.object) {
        toast.info(`${cell.object.type} - Weight: ${cell.object.weight} lbs, Value: $${cell.object.value.toLocaleString()}`)
      }
    }
  }

  const handleAttack = (targetX: number, targetY: number) => {
    if (combatState.actionPoints < 2) {
      toast.error('Insufficient Action Points')
      return
    }
    
    const target = combatState.grid[targetY][targetX].character
    if (!target) {
      toast.error('No target at selected position')
      return
    }
    
    const attacker = combatState.activeCharacter
    
    // Hit calculation using your system
    const baseHit = 50
    const agilityBonus = Math.floor(attacker.stats.AGL / 10) * 5
    const meleeBonus = Math.floor(attacker.stats.MEL / 10) * 5
    const totalHitChance = baseHit + agilityBonus + meleeBonus
    
    const roll = Math.floor(Math.random() * 100) + 1
    addLogEntry(`${attacker.name} attacks ${target.name}`)
    addLogEntry(`Hit calculation: ${baseHit} base + ${agilityBonus} AGL + ${meleeBonus} MEL = ${totalHitChance}%`)
    addLogEntry(`Dice roll: ${roll}`)
    
    if (roll <= totalHitChance) {
      // Calculate damage
      let baseDamage = 10 + Math.floor(attacker.stats.STR / 10)
      let finalDamage = baseDamage
      let criticalEffect = null
      
      // Determine hit result (your Column Shift system)
      if (roll <= 5) {
        // Red result - Critical Hit
        finalDamage = baseDamage * 2
        addLogEntry(`CRITICAL HIT! Double damage`)
        
        // Roll for body part injury
        const bodyPartRoll = Math.floor(Math.random() * 6) + 1
        if (bodyPartRoll <= 2) {
          criticalEffect = {
            type: 'ARM_BLOW',
            description: 'Weapon arm injured (-1CS until healed)',
            healingTime: '6-8 weeks',
            medicalCost: 15000
          }
          addLogEntry(`Critical effect: ARM BLOW - ${target.name}'s weapon arm injured`)
        } else if (bodyPartRoll <= 4) {
          criticalEffect = {
            type: 'LEG_WOUND',
            description: 'Leg injury reduces movement (-50% speed)',
            healingTime: '4-6 weeks', 
            medicalCost: 12000
          }
          addLogEntry(`Critical effect: LEG WOUND - ${target.name}'s movement impaired`)
        } else {
          criticalEffect = {
            type: 'HEAD_TRAUMA',
            description: 'Head injury affects mental stats (-2 INT)',
            healingTime: '8-12 weeks',
            medicalCost: 25000
          }
          addLogEntry(`Critical effect: HEAD TRAUMA - ${target.name} suffers brain injury`)
        }
        
        // Add injury to combat state
        setCombatState(prev => ({
          ...prev,
          injuries: [...prev.injuries, {
            characterId: target.id,
            injury: criticalEffect,
            turn: prev.turn
          }]
        }))
        
      } else if (roll <= 25) {
        // Yellow result - Major Hit
        finalDamage = Math.floor(baseDamage * 1.5)
        addLogEntry(`Major hit! +50% damage`)
      } else {
        // Green result - Basic Hit
        addLogEntry(`Basic hit`)
      }
      
      addLogEntry(`Damage dealt: ${finalDamage}`)
      
      // Update target health
      const newGrid = [...combatState.grid]
      newGrid[targetY][targetX] = {
        ...newGrid[targetY][targetX],
        character: {
          ...target,
          currentHealth: Math.max(0, target.currentHealth - finalDamage)
        }
      }
      
      // Check for knockback (STR-based)
      if (attacker.stats.STR >= 40) {
        const knockbackDistance = Math.floor(attacker.stats.STR / 10) - 3
        if (knockbackDistance > 0) {
          addLogEntry(`Knockback: ${target.name} knocked back ${knockbackDistance} squares`)
          // TODO: Implement knockback movement
        }
      }
      
      // Check if target is defeated
      if (target.currentHealth - finalDamage <= 0) {
        addLogEntry(`${target.name} is defeated!`)
        setCombatState(prev => ({ ...prev, combatCompleted: true }))
        setTimeout(() => setShowAftermathModal(true), 2000)
      }
      
      setCombatState(prev => ({ ...prev, grid: newGrid }))
      
    } else {
      addLogEntry(`Attack misses`)
    }
    
    setCombatState(prev => ({
      ...prev,
      actionPoints: prev.actionPoints - 2,
      selectedAction: ''
    }))
    
    setSelectedCell(null)
  }

  const handleThrowObject = (targetX: number, targetY: number) => {
    if (combatState.actionPoints < 3) {
      toast.error('Insufficient Action Points')
      return
    }
    
    const attacker = combatState.activeCharacter
    const [currentX, currentY] = attacker.position
    
    // Find nearest throwable object
    let nearestObject = null
    let objectPos = null
    let nearestDistance = 999
    
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const cell = combatState.grid[y][x]
        if (cell.object && !cell.destroyed) {
          const distance = Math.abs(x - currentX) + Math.abs(y - currentY)
          if (distance < nearestDistance && distance <= 2) {
            nearestObject = cell.object
            objectPos = [x, y]
            nearestDistance = distance
          }
        }
      }
    }
    
    if (!nearestObject || !objectPos) {
      toast.error('No throwable objects within reach (2 squares)')
      return
    }
    
    // Check strength requirement
    const strengthRequired = Math.ceil(nearestObject.weight / 100)
    if (attacker.stats.STR < strengthRequired) {
      toast.error(`Need ${strengthRequired} STR to throw ${nearestObject.type} (${nearestObject.weight} lbs)`)
      return
    }
    
    // Calculate throw range and damage
    const throwRange = Math.floor((attacker.stats.STR - strengthRequired) / 10) + 1
    const distance = Math.abs(targetX - currentX) + Math.abs(targetY - currentY)
    
    if (distance > throwRange) {
      toast.error(`${nearestObject.type} can only be thrown ${throwRange} squares`)
      return
    }
    
    // Calculate damage and legal consequences
    const baseDamage = Math.floor(nearestObject.weight / 50)
    const strBonus = Math.floor(attacker.stats.STR / 10)
    const totalDamage = baseDamage + strBonus
    const legalCost = nearestObject.value
    
    addLogEntry(`${attacker.name} picks up ${nearestObject.type} (${nearestObject.weight} lbs)`)
    addLogEntry(`Throws ${nearestObject.type} ${distance} squares to (${targetX}, ${targetY})`)
    addLogEntry(`Impact damage: ${totalDamage} (${baseDamage} base + ${strBonus} STR bonus)`)
    addLogEntry(`Property damage: $${legalCost.toLocaleString()}`)
    
    // Add to property damage total
    setCombatState(prev => ({
      ...prev,
      propertyDamage: prev.propertyDamage + legalCost
    }))
    
    // Legal consequences based on object type
    if (nearestObject.type === 'car') {
      addLogEntry(`Legal consequence: Grand Theft Auto + $${legalCost.toLocaleString()} property damage`)
    } else if (nearestObject.type === 'building') {
      addLogEntry(`Legal consequence: Structural damage + Federal building codes violation`)
    }
    
    // Remove/destroy object
    const newGrid = [...combatState.grid]
    newGrid[objectPos[1]][objectPos[0]] = {
      ...newGrid[objectPos[1]][objectPos[0]],
      object: undefined,
      destroyed: true
    }
    
    // Damage target if hit
    const target = combatState.grid[targetY][targetX].character
    if (target) {
      newGrid[targetY][targetX] = {
        ...newGrid[targetY][targetX],
        character: {
          ...target,
          currentHealth: Math.max(0, target.currentHealth - totalDamage)
        }
      }
      addLogEntry(`${target.name} takes ${totalDamage} impact damage`)
    }
    
    setCombatState(prev => ({
      ...prev,
      grid: newGrid,
      actionPoints: prev.actionPoints - 3,
      selectedAction: ''
    }))
    
    setSelectedCell(null)
  }

  const handleMovement = (targetX: number, targetY: number) => {
    if (combatState.actionPoints < 1) {
      toast.error('Insufficient Action Points')
      return
    }
    
    const currentChar = combatState.activeCharacter
    const [currentX, currentY] = currentChar.position
    const distance = Math.abs(targetX - currentX) + Math.abs(targetY - currentY)
    
    if (distance > 3) {
      toast.error('Maximum movement: 3 squares per action')
      return
    }
    
    const targetCell = combatState.grid[targetY][targetX]
    if (targetCell.character) {
      toast.error('Square occupied')
      return
    }
    
    // Move character
    const newGrid = [...combatState.grid]
    newGrid[currentY][currentX] = { ...newGrid[currentY][currentX], character: undefined }
    newGrid[targetY][targetX] = { 
      ...newGrid[targetY][targetX], 
      character: { ...currentChar, position: [targetX, targetY] }
    }
    
    // Update active character position
    const updatedCombatants = combatState.combatants.map(char =>
      char.id === currentChar.id ? { ...char, position: [targetX, targetY] } : char
    )
    
    setCombatState(prev => ({
      ...prev,
      grid: newGrid,
      combatants: updatedCombatants,
      activeCharacter: { ...currentChar, position: [targetX, targetY] },
      actionPoints: prev.actionPoints - 1,
      selectedAction: ''
    }))
    
    addLogEntry(`${currentChar.name} moves to (${targetX}, ${targetY}) - 1 AP spent`)
    setSelectedCell(null)
  }

  const endTurn = () => {
    const currentIndex = combatState.combatants.findIndex(c => c.id === combatState.activeCharacter.id)
    const nextIndex = (currentIndex + 1) % combatState.combatants.length
    const nextCharacter = combatState.combatants[nextIndex]
    
    // Calculate AP for next character (using your initiative system)
    const initiative = nextCharacter.stats.AGL + Math.floor(nextCharacter.stats.INS / 2)
    const newActionPoints = 3 + Math.floor(initiative / 30)
    
    setCombatState(prev => ({
      ...prev,
      turn: nextIndex === 0 ? prev.turn + 1 : prev.turn,
      activeCharacter: nextCharacter,
      actionPoints: newActionPoints,
      selectedAction: '',
      selectedTarget: null
    }))
    
    addLogEntry(`Turn ended`)
    addLogEntry(`${nextCharacter.name} begins turn with ${newActionPoints} AP`)
    setSelectedCell(null)
  }

  const endCombat = () => {
    setShowAftermathModal(true)
  }

  const selectAction = (action: string) => {
    setCombatState(prev => ({ ...prev, selectedAction: action }))
    
    switch(action) {
      case 'move':
        toast.info('Click destination square (1 AP, 3 square max range)')
        break
      case 'attack':
        toast.info('Click enemy to attack (2 AP)')
        break
      case 'power':
        toast.info('Click target for LSW power (3+ AP)')
        break
      case 'throw':
        toast.info('Click target location to throw nearby object (3 AP)')
        break
    }
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
              <span className="text-sht-secondary-400 font-bold ml-2">{combatState.activeCharacter?.name}</span>
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
              <span className="text-gray-400">Property Damage:</span>
              <span className="text-red-400 font-bold ml-2">${combatState.propertyDamage.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex">
        {/* 15x15 Tactical Grid */}
        <motion.div 
          className="flex-1 relative bg-gray-800 p-4 overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-sht-success">🗺️ Urban Street Battlefield</h2>
            <div className="text-sm text-gray-400">
              {combatState.selectedAction ? `Selected: ${combatState.selectedAction}` : 'Select action then click grid'}
            </div>
          </div>
          
          {/* Perfect Grid */}
          <div className="flex justify-center">
            <div className="inline-block bg-gray-900 p-4 rounded-lg border border-gray-600">
              <div 
                className="grid gap-px"
                style={{ gridTemplateColumns: 'repeat(15, 40px)', gridTemplateRows: 'repeat(15, 40px)' }}
              >
                {combatState.grid.flat().map((cell) => {
                  const isSelected = selectedCell && selectedCell[0] === cell.x && selectedCell[1] === cell.y
                  const isValidMove = combatState.selectedAction === 'move' && 
                    combatState.activeCharacter?.position &&
                    Math.abs(cell.x - combatState.activeCharacter.position[0]) + 
                    Math.abs(cell.y - combatState.activeCharacter.position[1]) <= 3 &&
                    !cell.character
                  
                  return (
                    <div
                      key={`${cell.x}-${cell.y}`}
                      className={`
                        w-10 h-10 border cursor-pointer relative transition-all duration-200 flex items-center justify-center
                        ${isSelected ? 'border-sht-primary-400 bg-sht-primary-400 bg-opacity-30 ring-2 ring-sht-primary-400' : 'border-gray-500'}
                        ${isValidMove ? 'border-green-400 bg-green-400 bg-opacity-20 hover:bg-green-400 hover:bg-opacity-40' : ''}
                        ${cell.character ? 'bg-blue-600 bg-opacity-60' : ''}
                        ${cell.object ? 'bg-yellow-600 bg-opacity-40' : ''}
                        ${cell.destroyed ? 'bg-red-600 bg-opacity-20' : ''}
                        ${!cell.character && !cell.object && !cell.destroyed ? 'bg-gray-700 hover:bg-gray-600' : ''}
                      `}
                      onClick={() => handleCellClick(cell.x, cell.y)}
                      title={`(${cell.x}, ${cell.y})`}
                    >
                      {/* Character Token */}
                      {cell.character && (
                        <div className={`
                          absolute inset-1 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold
                          ${cell.character.id === combatState.activeCharacter?.id ? 'bg-green-500 ring-2 ring-green-300' : 'bg-blue-500'}
                        `}>
                          <div>{cell.character.name.substring(0, 2)}</div>
                          <div className="text-xs">{cell.character.currentHealth}</div>
                        </div>
                      )}
                      
                      {/* Environmental Object */}
                      {cell.object && !cell.character && !cell.destroyed && (
                        <div className="text-lg">
                          {cell.object.type === 'car' ? '🚗' : 
                           cell.object.type === 'building' ? '🏢' : 
                           cell.object.type === 'tree' ? '🌳' :
                           cell.object.type === 'dumpster' ? '🗑️' :
                           cell.object.type === 'streetlight' ? '💡' : '📦'}
                        </div>
                      )}
                      
                      {/* Destroyed Object */}
                      {cell.destroyed && (
                        <div className="text-lg opacity-50">💥</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center space-y-1">
            <div className="text-sm text-gray-400">
              Green = Valid move • Blue = Characters • Yellow = Throwable objects
            </div>
            <div className="text-xs text-gray-500">
              Character health shown under initials • Click objects to see weight/value
            </div>
          </div>
        </motion.div>

        {/* Combat Control Panel */}
        <motion.div 
          className="w-80 bg-gray-900 bg-opacity-95 border-l border-sht-primary-400 p-6 overflow-y-auto"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
        >
          {/* Active Character Status */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-primary-400 mb-4">🎯 Active Character</h3>
            {combatState.activeCharacter && (
              <div className="game-panel p-4">
                <h4 className="font-bold text-white mb-2">{combatState.activeCharacter.name}</h4>
                
                {/* Health with injury indicators */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Health:</span>
                    <span className="text-green-400">
                      {combatState.activeCharacter.currentHealth}/{combatState.activeCharacter.health.maximum}
                    </span>
                  </div>
                  <div className="health-bar">
                    <div 
                      className="health-fill"
                      style={{ width: `${(combatState.activeCharacter.currentHealth / combatState.activeCharacter.health.maximum) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Stats */}
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
                
                {/* Current Injuries */}
                {combatState.injuries.filter(inj => inj.characterId === combatState.activeCharacter.id).length > 0 && (
                  <div className="mt-3 p-2 bg-red-900 bg-opacity-30 rounded border border-red-600">
                    <h5 className="text-red-400 font-bold text-xs mb-1">🏥 Injuries:</h5>
                    {combatState.injuries
                      .filter(inj => inj.characterId === combatState.activeCharacter.id)
                      .map((injury, index) => (
                        <div key={index} className="text-xs text-red-300">
                          {injury.injury.description}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Menu */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-accent-400 mb-4">⚡ Combat Actions</h3>
            <div className="space-y-2">
              <ActionButton 
                action="move"
                label="🚶 Move (1 AP)"
                description="Move up to 3 squares"
                cost={1}
                available={combatState.actionPoints >= 1}
                selected={combatState.selectedAction === 'move'}
                onClick={() => selectAction('move')}
              />
              <ActionButton 
                action="attack"
                label="⚔️ Melee Attack (2 AP)" 
                description="Close combat with weapons"
                cost={2}
                available={combatState.actionPoints >= 2}
                selected={combatState.selectedAction === 'attack'}
                onClick={() => selectAction('attack')}
              />
              <ActionButton 
                action="power"
                label="🔥 LSW Power (3 AP)"
                description="Use superhuman abilities"
                cost={3}
                available={combatState.actionPoints >= 3}
                selected={combatState.selectedAction === 'power'}
                onClick={() => selectAction('power')}
              />
              <ActionButton 
                action="throw"
                label="🚗 Throw Object (3 AP)"
                description="Hurl environmental objects"
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
              
              <button 
                onClick={endCombat}
                className="w-full p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-all"
              >
                🏁 End Combat
              </button>
            </div>
          </div>

          {/* Combat Statistics */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-sht-success mb-4">📊 Combat Stats</h3>
            <div className="game-panel p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Turn:</span>
                <span className="text-blue-400">{combatState.turn}</span>
              </div>
              <div className="flex justify-between">
                <span>Property Damage:</span>
                <span className="text-red-400">${combatState.propertyDamage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Injuries:</span>
                <span className="text-orange-400">{combatState.injuries.length}</span>
              </div>
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
        </motion.div>
      </div>

      {/* Post-Combat Aftermath Modal */}
      <AnimatePresence>
        {showAftermathModal && (
          <PostCombatAftermath 
            combatState={combatState}
            onClose={() => {
              setShowAftermathModal(false)
              setCurrentView('world-map')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ActionButton({ action, label, description, cost, available, selected, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={!available}
      className={`
        w-full p-3 rounded-lg font-bold transition-all text-left
        ${selected ? 'bg-sht-primary-500 text-black ring-2 ring-sht-primary-400' :
          available ? 'bg-gray-700 hover:bg-gray-600 text-white' : 
          'bg-gray-800 text-gray-500 cursor-not-allowed'}
      `}
      title={description}
    >
      <div>{label}</div>
      <div className="text-xs opacity-75">{description}</div>
    </button>
  )
}

// Post-Combat Aftermath System
function PostCombatAftermath({ combatState, onClose }: any) {
  const calculateMedicalCosts = () => {
    return combatState.injuries.reduce((total: number, injury: any) => total + injury.injury.medicalCost, 0)
  }
  
  const calculateLegalConsequences = () => {
    const consequences = []
    if (combatState.propertyDamage > 0) {
      consequences.push(`Property damage: $${combatState.propertyDamage.toLocaleString()}`)
    }
    if (combatState.injuries.length > 0) {
      consequences.push(`Medical costs: $${calculateMedicalCosts().toLocaleString()}`)
      consequences.push(`${combatState.injuries.length} injury lawsuit(s)`)
    }
    return consequences
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-gray-800 p-8 rounded-2xl border border-sht-primary-400 max-w-2xl mx-4 max-h-96 overflow-y-auto"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
      >
        <h2 className="text-3xl font-bold text-center text-white mb-6">🏁 Combat Aftermath</h2>
        
        {/* Combat Summary */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-blue-400 mb-2">📊 Combat Results</h3>
            <div className="space-y-1 text-sm">
              <div>Turns: {combatState.turn}</div>
              <div>Injuries: {combatState.injuries.length}</div>
              <div>Objects destroyed: {combatState.grid.flat().filter(c => c.destroyed).length}</div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-red-400 mb-2">💰 Financial Impact</h3>
            <div className="space-y-1 text-sm">
              <div>Property: ${combatState.propertyDamage.toLocaleString()}</div>
              <div>Medical: ${calculateMedicalCosts().toLocaleString()}</div>
              <div className="font-bold text-red-400">
                Total: ${(combatState.propertyDamage + calculateMedicalCosts()).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Injury Report */}
        {combatState.injuries.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-orange-400 mb-3">🏥 Medical Report</h3>
            <div className="space-y-3">
              {combatState.injuries.map((injury: any, index: number) => {
                const character = combatState.combatants.find((c: any) => c.id === injury.characterId)
                return (
                  <div key={index} className="bg-red-900 bg-opacity-30 p-4 rounded border border-red-600">
                    <h4 className="font-bold text-red-400">{character?.name} - {injury.injury.type.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-300 mb-2">{injury.injury.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400">Recovery Time:</span>
                        <span className="text-yellow-400 ml-1">{injury.injury.healingTime}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Medical Cost:</span>
                        <span className="text-red-400 ml-1">${injury.injury.medicalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Legal Consequences */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-purple-400 mb-3">⚖️ Legal Consequences</h3>
          <div className="space-y-2">
            {calculateLegalConsequences().map((consequence, index) => (
              <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                {consequence}
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <button 
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all"
        >
          📋 Return to Operations
        </button>
      </motion.div>
    </motion.div>
  )
}
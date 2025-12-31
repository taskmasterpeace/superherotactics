/**
 * Territory Control System for SuperHero Tactics
 *
 * Tracks faction control of sectors, militia presence, and liberation status.
 * Subscribes to EventBus for combat outcomes to update territory.
 *
 * USAGE: Call initTerritorySystem() once on app startup.
 */

import { EventBus, GameEvent, CombatEndedEvent } from './eventBus'
import { getSector, getSectorsByCountry, Sector } from './sectors'
import { getAdjacentSectorsForSector } from './sectorHelpers'
import { useGameStore } from '../stores/enhancedGameStore'

// ============================================================================
// TERRITORY TYPES
// ============================================================================

export type FactionId =
  | 'player'       // Player's faction
  | 'criminal'     // Criminal organizations
  | 'government'   // Government forces
  | 'corporate'    // Corporate interests
  | 'rebel'        // Rebel factions
  | 'neutral'      // Unclaimed territory
  | 'contested';   // Being fought over

export type ControlLevel =
  | 'dominated'    // 100% control
  | 'controlled'   // 75-99% control
  | 'contested'    // 25-74% control
  | 'minimal'      // 1-24% control
  | 'none';        // 0% control

export interface TerritoryControl {
  sectorId: string
  controllingFaction: FactionId
  controlPercent: number         // 0-100
  militiaStrength: number        // 0-100 (defending force strength)
  liberationProgress: number     // 0-100 (progress to flip control)
  lastCombatTurn: number         // Game day of last combat
  contestedBy: FactionId | null  // Who is contesting
  bonuses: TerritoryBonus[]
}

export interface TerritoryBonus {
  type: 'income' | 'recruitment' | 'intel' | 'equipment' | 'fame'
  value: number
  description: string
}

export interface MilitiaUnit {
  id: string
  sectorId: string
  faction: FactionId
  strength: number       // 1-10 (combat effectiveness)
  size: number           // Number of fighters
  loyalty: number        // 0-100
  equipment: 'light' | 'medium' | 'heavy'
  status: 'patrol' | 'garrison' | 'alert' | 'engaged'
}

// ============================================================================
// TERRITORY STATE
// ============================================================================

interface TerritorySystemState {
  initialized: boolean
  subscriptionIds: string[]
  territoryControl: Map<string, TerritoryControl>
  militiaUnits: MilitiaUnit[]
}

const state: TerritorySystemState = {
  initialized: false,
  subscriptionIds: [],
  territoryControl: new Map(),
  militiaUnits: []
}

// ============================================================================
// CONTROL LEVEL HELPERS
// ============================================================================

export function getControlLevel(percent: number): ControlLevel {
  if (percent >= 100) return 'dominated'
  if (percent >= 75) return 'controlled'
  if (percent >= 25) return 'contested'
  if (percent > 0) return 'minimal'
  return 'none'
}

export function getControlColor(level: ControlLevel): string {
  switch (level) {
    case 'dominated': return '#00ff00'   // Green
    case 'controlled': return '#88ff88'  // Light green
    case 'contested': return '#ffff00'   // Yellow
    case 'minimal': return '#ff8800'     // Orange
    case 'none': return '#888888'        // Gray
  }
}

// ============================================================================
// TERRITORY CONTROL FUNCTIONS
// ============================================================================

/**
 * Get control status for a sector
 */
export function getSectorControl(sectorId: string): TerritoryControl | null {
  return state.territoryControl.get(sectorId) || null
}

/**
 * Get all sectors controlled by a faction
 */
export function getFactionSectors(faction: FactionId): TerritoryControl[] {
  return Array.from(state.territoryControl.values())
    .filter(tc => tc.controllingFaction === faction)
}

/**
 * Calculate sector bonuses based on control and development
 */
export function calculateSectorBonuses(sectorId: string): TerritoryBonus[] {
  const control = getSectorControl(sectorId)
  if (!control || control.controllingFaction !== 'player') return []

  const bonuses: TerritoryBonus[] = []
  const controlMod = control.controlPercent / 100

  // Base income from controlled territory
  if (control.controlPercent >= 50) {
    bonuses.push({
      type: 'income',
      value: Math.floor(500 * controlMod),
      description: `Weekly income from ${sectorId}`
    })
  }

  // Intel bonus from dominated sectors
  if (control.controlPercent >= 75) {
    bonuses.push({
      type: 'intel',
      value: 10,
      description: 'Local informant network'
    })
  }

  // Fame bonus from fully controlled sectors
  if (control.controlPercent >= 100) {
    bonuses.push({
      type: 'fame',
      value: 5,
      description: 'Known protector of the region'
    })
  }

  return bonuses
}

/**
 * Initialize territory control for a sector
 */
export function initializeSectorControl(
  sectorId: string,
  faction: FactionId = 'neutral',
  controlPercent: number = 0
): TerritoryControl {
  const control: TerritoryControl = {
    sectorId,
    controllingFaction: faction,
    controlPercent: Math.max(0, Math.min(100, controlPercent)),
    militiaStrength: faction !== 'neutral' ? Math.floor(controlPercent / 2) : 0,
    liberationProgress: 0,
    lastCombatTurn: 0,
    contestedBy: null,
    bonuses: []
  }

  state.territoryControl.set(sectorId, control)
  return control
}

/**
 * Apply combat outcome to territory control
 */
export function applyCombatOutcome(
  sectorId: string,
  victor: FactionId,
  loser: FactionId,
  victorCasualties: number,
  loserCasualties: number
): void {
  let control = getSectorControl(sectorId)

  if (!control) {
    control = initializeSectorControl(sectorId, loser, 50)
  }

  const store = useGameStore.getState()
  const gameDay = store.gameTime?.day || 0

  // Calculate control shift based on combat outcome
  const casualtyRatio = loserCasualties / Math.max(1, victorCasualties)
  const controlShift = Math.floor(10 * Math.min(3, casualtyRatio))

  if (victor === control.controllingFaction) {
    // Defender won - reinforce control
    control.controlPercent = Math.min(100, control.controlPercent + controlShift)
    control.contestedBy = null
    control.liberationProgress = Math.max(0, control.liberationProgress - controlShift * 2)
  } else {
    // Attacker won - shift control
    control.liberationProgress += controlShift * 2
    control.contestedBy = victor

    // Check for control flip
    if (control.liberationProgress >= 100) {
      const oldFaction = control.controllingFaction
      control.controllingFaction = victor
      control.controlPercent = 50
      control.liberationProgress = 0
      control.contestedBy = null

      // Emit territory captured event
      EventBus.emit<GameEvent>({
        id: `territory-captured-${sectorId}-${Date.now()}`,
        type: 'territory:captured',
        timestamp: Date.now(),
        location: { sector: sectorId },
        data: {
          sectorId,
          newController: victor,
          previousController: oldFaction
        }
      })

      store.addNotification({
        type: 'mission',
        priority: 'high',
        title: 'Territory Captured!',
        message: `${sectorId} is now under ${victor} control!`,
        data: { sectorId, faction: victor }
      })
    }
  }

  control.lastCombatTurn = gameDay
  control.militiaStrength = Math.max(10, control.controlPercent / 2 - loserCasualties)
  control.bonuses = calculateSectorBonuses(sectorId)

  state.territoryControl.set(sectorId, control)

  // Emit territory updated event
  EventBus.emit<GameEvent>({
    id: `territory-updated-${sectorId}-${Date.now()}`,
    type: 'territory:updated',
    timestamp: Date.now(),
    location: { sector: sectorId },
    data: {
      sectorId,
      control: control.controlPercent,
      faction: control.controllingFaction,
      contested: control.contestedBy !== null
    }
  })
}

// ============================================================================
// MILITIA FUNCTIONS
// ============================================================================

/**
 * Create a militia unit for a faction
 */
export function createMilitia(
  sectorId: string,
  faction: FactionId,
  size: number = 10,
  equipment: 'light' | 'medium' | 'heavy' = 'light'
): MilitiaUnit {
  const militia: MilitiaUnit = {
    id: `militia-${sectorId}-${faction}-${Date.now()}`,
    sectorId,
    faction,
    strength: equipment === 'heavy' ? 8 : equipment === 'medium' ? 5 : 3,
    size,
    loyalty: 50 + Math.floor(Math.random() * 30),
    equipment,
    status: 'patrol'
  }

  state.militiaUnits.push(militia)
  return militia
}

/**
 * Get militia units in a sector
 */
export function getSectorMilitia(sectorId: string): MilitiaUnit[] {
  return state.militiaUnits.filter(m => m.sectorId === sectorId)
}

/**
 * Get militia units for a faction
 */
export function getFactionMilitia(faction: FactionId): MilitiaUnit[] {
  return state.militiaUnits.filter(m => m.faction === faction)
}

/**
 * Train militia to improve strength
 */
export function trainMilitia(militiaId: string, trainingDays: number): void {
  const militia = state.militiaUnits.find(m => m.id === militiaId)
  if (!militia) return

  // Each training day improves strength by 0.5 up to max 10
  militia.strength = Math.min(10, militia.strength + trainingDays * 0.5)
  militia.loyalty = Math.min(100, militia.loyalty + trainingDays * 2)
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle combat ended events to update territory control
 */
function handleCombatEnded(event: CombatEndedEvent): void {
  const { victory, casualties, location } = event.data

  if (!location?.sector) return

  const store = useGameStore.getState()

  // Determine victor faction based on combat outcome
  const playerWon = victory
  const victor: FactionId = playerWon ? 'player' : 'criminal'
  const loser: FactionId = playerWon ? 'criminal' : 'player'

  // Count casualties (simplified)
  const playerCasualties = casualties.filter(
    (c: any) => c.team === 'blue'
  ).length
  const enemyCasualties = casualties.filter(
    (c: any) => c.team === 'red'
  ).length

  applyCombatOutcome(
    location.sector,
    victor,
    loser,
    playerWon ? playerCasualties : enemyCasualties,
    playerWon ? enemyCasualties : playerCasualties
  )
}

/**
 * Handle day passed to process territory decay
 */
function handleDayPassed(event: GameEvent): void {
  // Contested territories slowly decay toward the contesting faction
  state.territoryControl.forEach((control, sectorId) => {
    if (control.contestedBy && control.liberationProgress > 0) {
      // Slow progress even without combat
      control.liberationProgress += 1

      // Check for passive flip
      if (control.liberationProgress >= 100) {
        const oldFaction = control.controllingFaction
        control.controllingFaction = control.contestedBy
        control.controlPercent = 25
        control.liberationProgress = 0
        control.contestedBy = null

        EventBus.emit<GameEvent>({
          id: `territory-flipped-${sectorId}-${Date.now()}`,
          type: 'territory:captured',
          timestamp: Date.now(),
          location: { sector: sectorId },
          data: {
            sectorId,
            newController: control.controllingFaction,
            previousController: oldFaction
          }
        })
      }

      state.territoryControl.set(sectorId, control)
    }
  })
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize territory system and subscribe to EventBus
 * Call this once on app startup
 */
export function initTerritorySystem(): void {
  if (state.initialized) {
    console.log('[TerritorySystem] Already initialized')
    return
  }

  console.log('[TerritorySystem] Initializing...')

  // Subscribe to combat events
  state.subscriptionIds.push(
    EventBus.on<CombatEndedEvent>('combat:ended', handleCombatEnded, { priority: 7 })
  )

  // Subscribe to day passed for territory decay
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('time:day-passed', handleDayPassed, { priority: 3 })
  )

  state.initialized = true
  console.log('[TerritorySystem] Initialized with', state.subscriptionIds.length, 'subscriptions')
}

/**
 * Cleanup territory system subscriptions
 * Call this on app unmount
 */
export function cleanupTerritorySystem(): void {
  if (!state.initialized) return

  console.log('[TerritorySystem] Cleaning up...')

  for (const id of state.subscriptionIds) {
    EventBus.off(id)
  }

  state.subscriptionIds = []
  state.initialized = false
}

/**
 * Check if territory system is initialized
 */
export function isTerritorySystemInitialized(): boolean {
  return state.initialized
}

/**
 * Get territory summary for player
 */
export function getPlayerTerritorySummary(): {
  totalSectors: number
  totalIncome: number
  totalFame: number
  contested: number
} {
  const playerSectors = getFactionSectors('player')

  let totalIncome = 0
  let totalFame = 0
  let contested = 0

  for (const control of playerSectors) {
    for (const bonus of control.bonuses) {
      if (bonus.type === 'income') totalIncome += bonus.value
      if (bonus.type === 'fame') totalFame += bonus.value
    }
    if (control.contestedBy) contested++
  }

  return {
    totalSectors: playerSectors.length,
    totalIncome,
    totalFame,
    contested
  }
}

export default initTerritorySystem

/**
 * Economy Event Handler - EventBus Integration
 *
 * Processes economy-related events:
 * - Payday processing
 * - Mission reward tracking
 * - Expense tracking from various sources
 * - Price modifiers based on location
 *
 * USAGE: Call initEconomyEventHandler() once on app startup.
 */

import {
  EventBus,
  MissionCompletedEvent,
  GameEvent
} from './eventBus'
import {
  EconomyState,
  createTransaction,
  processTransaction,
  processPayday,
  formatCurrency
} from './economySystem'
import { useGameStore } from '../stores/enhancedGameStore'

// ============================================================================
// ECONOMY EVENT HANDLER STATE
// ============================================================================

interface EconomyEventHandlerState {
  initialized: boolean
  subscriptionIds: string[]
}

const state: EconomyEventHandlerState = {
  initialized: false,
  subscriptionIds: []
}

// ============================================================================
// LOCATION-BASED PRICING
// ============================================================================

export interface PriceModifiers {
  equipmentMultiplier: number
  medicalMultiplier: number
  educationMultiplier: number
  vehicleMultiplier: number
  baseUpkeepMultiplier: number
}

/**
 * Calculate price modifiers based on country GDP and other stats
 */
export function calculatePriceModifiers(
  gdpPerCapita: number,
  corruption: number = 50,
  cityPopulation: number = 1000000
): PriceModifiers {
  // Base multiplier from GDP (100 = average)
  // Low GDP = cheaper, High GDP = expensive
  const baseMultiplier = gdpPerCapita / 100

  // Corruption can lower prices (black market access) but also raise some
  const corruptionFactor = corruption > 50
    ? 1 - ((corruption - 50) / 200) // High corruption = cheaper black market
    : 1 + ((50 - corruption) / 200) // Low corruption = legitimate prices

  // City size affects prices (bigger = more options = competitive prices)
  const cityFactor = cityPopulation > 5000000
    ? 0.95 // Big city discount
    : cityPopulation < 500000
    ? 1.10 // Small city premium
    : 1.0

  return {
    equipmentMultiplier: baseMultiplier * corruptionFactor * cityFactor,
    medicalMultiplier: baseMultiplier * 1.2, // Medical always premium
    educationMultiplier: baseMultiplier * (1 + (1 - corruption / 100) * 0.5), // Better education in less corrupt countries
    vehicleMultiplier: baseMultiplier * cityFactor,
    baseUpkeepMultiplier: baseMultiplier * 0.8 // Upkeep cheaper in low GDP
  }
}

/**
 * Apply price modifier to a base price
 */
export function applyPriceModifier(basePrice: number, modifier: number): number {
  return Math.round(basePrice * Math.max(0.5, Math.min(2.0, modifier)))
}

// ============================================================================
// RECURRING EXPENSE CALCULATION
// ============================================================================

/**
 * Calculate weekly recurring expenses for the team
 */
export function calculateRecurringExpenses(): {
  category: string
  amount: number
  description: string
}[] {
  const store = useGameStore.getState()
  const expenses: { category: string; amount: number; description: string }[] = []

  // Base upkeep (headquarters maintenance)
  const baseUpkeep = store.activeBase ? 500 : 200
  expenses.push({
    category: 'base_upkeep',
    amount: baseUpkeep,
    description: 'Base maintenance and utilities'
  })

  // Team salaries (if characters have salary)
  const readyCharacters = store.characters.filter(c => c.status !== 'dead')
  if (readyCharacters.length > 0) {
    const totalSalaries = readyCharacters.length * 100 // $100/week per character
    expenses.push({
      category: 'salary_payment',
      amount: totalSalaries,
      description: `Team salaries (${readyCharacters.length} members)`
    })
  }

  // Medical expenses for hospitalized characters
  const hospitalized = store.characters.filter(c => c.status === 'hospitalized')
  if (hospitalized.length > 0) {
    const medicalCost = hospitalized.length * 250 // $250/week per hospitalized
    expenses.push({
      category: 'medical_expense',
      amount: medicalCost,
      description: `Medical care (${hospitalized.length} patients)`
    })
  }

  // Equipment maintenance
  const totalEquipment = store.characters.reduce((sum, c) =>
    sum + (c.equipment?.length || 0), 0
  )
  if (totalEquipment > 0) {
    const maintenanceCost = Math.floor(totalEquipment * 15) // $15/item/week
    expenses.push({
      category: 'equipment_maintenance',
      amount: maintenanceCost,
      description: `Equipment maintenance (${totalEquipment} items)`
    })
  }

  return expenses
}

/**
 * Calculate weekly income sources
 */
export function calculateWeeklyIncome(): number {
  const store = useGameStore.getState()
  let income = 0

  // Base operations income (from fame)
  income += 500 + Math.floor((store.fame || 0) * 5)

  // Characters with jobs would contribute here
  // TODO: Implement job system

  return income
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle payday event from time system
 */
function handlePayday(event: GameEvent): void {
  const store = useGameStore.getState()
  const gameTime = store.gameTime

  if (!gameTime) {
    console.error('[EconomyEventHandler] No game time available')
    return
  }

  const income = calculateWeeklyIncome()
  const expenses = calculateRecurringExpenses()
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netChange = income - totalExpenses

  // Add income
  if (income > 0) {
    store.addMoney(income)
    store.addNotification({
      type: 'economy',
      priority: 'low',
      title: 'Weekly Income',
      message: `Received ${formatCurrency(income)} from operations`,
      data: { amount: income }
    })
  }

  // Deduct expenses
  for (const expense of expenses) {
    store.addMoney(-expense.amount)
  }

  if (totalExpenses > 0) {
    store.addNotification({
      type: 'economy',
      priority: 'medium',
      title: 'Weekly Expenses',
      message: `Paid ${formatCurrency(totalExpenses)} in expenses. Net: ${formatCurrency(netChange)}`,
      data: { expenses: totalExpenses, net: netChange }
    })
  }

  // Emit economy update event
  EventBus.emit<GameEvent>({
    id: `economy-payday-processed-${Date.now()}`,
    type: 'economy:payday-processed',
    timestamp: Date.now(),
    data: {
      income,
      expenses: totalExpenses,
      netChange,
      newBalance: store.money
    }
  })

  console.log('[EconomyEventHandler] Payday processed:', {
    income,
    expenses: totalExpenses,
    net: netChange
  })
}

/**
 * Handle mission completed - add rewards
 */
function handleMissionCompleted(event: MissionCompletedEvent): void {
  const store = useGameStore.getState()
  const { success, rewards } = event.data

  if (!success || !rewards) return

  // Add cash reward
  if (rewards.cash > 0) {
    store.addMoney(rewards.cash)

    EventBus.emit<GameEvent>({
      id: `economy-mission-reward-${Date.now()}`,
      type: 'economy:income-received',
      timestamp: Date.now(),
      data: {
        category: 'mission_reward',
        amount: rewards.cash,
        source: 'mission',
        missionName: event.data.missionName
      }
    })

    store.addNotification({
      type: 'economy',
      priority: 'medium',
      title: 'Mission Reward',
      message: `Received ${formatCurrency(rewards.cash)} for completing mission`,
      data: { amount: rewards.cash }
    })
  }

  console.log('[EconomyEventHandler] Mission reward processed:', rewards.cash)
}

/**
 * Handle investigation completed - add rewards
 */
function handleInvestigationCompleted(event: GameEvent): void {
  const store = useGameStore.getState()
  const { rewards } = event.data

  if (!rewards?.cash) return

  store.addMoney(rewards.cash)

  EventBus.emit<GameEvent>({
    id: `economy-investigation-reward-${Date.now()}`,
    type: 'economy:income-received',
    timestamp: Date.now(),
    data: {
      category: 'bounty_collected',
      amount: rewards.cash,
      source: 'investigation'
    }
  })

  console.log('[EconomyEventHandler] Investigation reward processed:', rewards.cash)
}

/**
 * Handle combat ended - loot collection
 */
function handleCombatEnded(event: GameEvent): void {
  const store = useGameStore.getState()
  const { victory, loot } = event.data

  if (!victory || !loot?.cash) return

  // Loot from combat
  store.addMoney(loot.cash)

  EventBus.emit<GameEvent>({
    id: `economy-combat-loot-${Date.now()}`,
    type: 'economy:income-received',
    timestamp: Date.now(),
    data: {
      category: 'bounty_collected',
      amount: loot.cash,
      source: 'combat_loot'
    }
  })

  console.log('[EconomyEventHandler] Combat loot collected:', loot.cash)
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize economy event handler and subscribe to EventBus
 * Call this once on app startup
 */
export function initEconomyEventHandler(): void {
  if (state.initialized) {
    console.log('[EconomyEventHandler] Already initialized')
    return
  }

  console.log('[EconomyEventHandler] Initializing...')

  // Subscribe to payday event
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('economy:payday', handlePayday, { priority: 10 })
  )

  // Subscribe to mission completed
  state.subscriptionIds.push(
    EventBus.on<MissionCompletedEvent>('mission:completed', handleMissionCompleted, { priority: 8 })
  )

  // Subscribe to investigation completed
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('investigation:completed', handleInvestigationCompleted, { priority: 8 })
  )

  // Subscribe to combat ended for loot
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('combat:ended', handleCombatEnded, { priority: 5 })
  )

  state.initialized = true
  console.log('[EconomyEventHandler] Initialized with', state.subscriptionIds.length, 'subscriptions')
}

/**
 * Cleanup economy event handler subscriptions
 * Call this on app unmount
 */
export function cleanupEconomyEventHandler(): void {
  if (!state.initialized) return

  console.log('[EconomyEventHandler] Cleaning up...')

  for (const id of state.subscriptionIds) {
    EventBus.off(id)
  }

  state.subscriptionIds = []
  state.initialized = false
}

/**
 * Check if economy event handler is initialized
 */
export function isEconomyEventHandlerInitialized(): boolean {
  return state.initialized
}

/**
 * Get current price modifiers for a location
 */
export function getLocationPriceModifiers(
  countryGDP: number = 100,
  countryCorruption: number = 50,
  cityPopulation: number = 1000000
): PriceModifiers {
  return calculatePriceModifiers(countryGDP, countryCorruption, cityPopulation)
}

export default initEconomyEventHandler

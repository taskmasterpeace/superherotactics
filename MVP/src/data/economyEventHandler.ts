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
  formatCurrency,
  calculateCountryFunding,
  processCountryFunding,
  checkBankruptcy,
  CountryFundingConfig,
  TransactionCategory
} from './economySystem'
import { GameTime } from './timeSystem'
import { getPlayerTerritorySummary } from './territorySystem'
import { getCountryByName, getCountryByCode } from './allCountries'
import { createEmail, EMAIL_SENDERS } from './emailSystem'
import { useGameStore } from '../stores/enhancedGameStore'
import { getActiveBase, getCraftingBonus } from './baseSystem'

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
 * Calculate weekly equipment maintenance
 * Workshop facilities (engineering lab, pharmacy, armory) maintain gear
 * in-house - crafting bonus discounts the cost, floored at 25% of full price
 */
export function calculateEquipmentMaintenance(): {
  itemCount: number
  baseCost: number
  cost: number
  savings: number
} {
  const store = useGameStore.getState()

  const itemCount = store.characters.reduce((sum, c) =>
    sum + (c.equipment?.length || 0), 0
  )
  const baseCost = Math.floor(itemCount * 15) // $15/item/week

  const activeBase = getActiveBase(store.baseState)
  const craftingBonus = activeBase ? getCraftingBonus(activeBase) : 0
  const cost = Math.max(
    Math.floor(baseCost * 0.25),
    Math.floor(baseCost * (1 - craftingBonus / 100))
  )

  return { itemCount, baseCost, cost, savings: baseCost - cost }
}

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

  // Equipment maintenance (discounted by workshop crafting bonus)
  const maintenance = calculateEquipmentMaintenance()
  if (maintenance.itemCount > 0) {
    expenses.push({
      category: 'equipment_maintenance',
      amount: maintenance.cost,
      description: maintenance.savings > 0
        ? `Equipment maintenance (${maintenance.itemCount} items, workshop saved ${formatCurrency(maintenance.savings)})`
        : `Equipment maintenance (${maintenance.itemCount} items)`
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
  income += 500 + Math.floor((store.playerFame || 0) * 5)

  // Territory income from controlled sectors
  income += getPlayerTerritorySummary().totalIncome

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

  const econTime = {
    day: gameTime.day,
    hour: Math.floor((gameTime.minutes || 0) / 60)
  } as GameTime

  const income = calculateWeeklyIncome()
  const expenses = calculateRecurringExpenses()
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netChange = income - totalExpenses

  // Apply income and expenses to both ledgers (economy.cash + budget)
  let economy = store.economy
  if (income > 0) {
    economy = processTransaction(economy, createTransaction(
      'income', 'job_pay', income, 'Weekly operations income', economy.cash, econTime
    ))
  }
  for (const expense of expenses) {
    economy = processTransaction(economy, createTransaction(
      'expense', expense.category as TransactionCategory, expense.amount, expense.description, economy.cash, econTime
    ))
  }
  useGameStore.setState({ economy, budget: store.budget + netChange })

  if (income > 0) {
    store.addNotification({
      type: 'economy',
      priority: 'low',
      title: 'Weekly Income',
      message: `Received ${formatCurrency(income)} from operations`,
      data: { amount: income }
    })
  }

  if (totalExpenses > 0) {
    const maintenance = calculateEquipmentMaintenance()
    store.addNotification({
      type: 'economy',
      priority: 'medium',
      title: 'Weekly Expenses',
      message: maintenance.savings > 0
        ? `Paid ${formatCurrency(totalExpenses)} in expenses. Net: ${formatCurrency(netChange)}. Workshop crews saved ${formatCurrency(maintenance.savings)} on equipment maintenance.`
        : `Paid ${formatCurrency(totalExpenses)} in expenses. Net: ${formatCurrency(netChange)}`,
      data: { expenses: totalExpenses, net: netChange, maintenanceSavings: maintenance.savings }
    })
  }

  // Territory bonuses (income already counted in calculateWeeklyIncome)
  const territory = getPlayerTerritorySummary()
  if (territory.totalIncome > 0) {
    store.addNotification({
      type: 'economy',
      priority: 'low',
      title: 'Territory Income',
      message: `Territory income: +${formatCurrency(territory.totalIncome)} from ${territory.totalSectors} sectors`,
      data: { amount: territory.totalIncome, sectors: territory.totalSectors }
    })
  }
  if (territory.totalFame > 0) {
    const currentFame = useGameStore.getState().playerFame
    useGameStore.setState({
      playerFame: Math.max(0, Math.min(1000, currentFame + territory.totalFame))
    })
    store.addNotification({
      type: 'economy',
      priority: 'low',
      title: 'Territory Influence',
      message: `Territory influence: +${territory.totalFame} fame from controlled sectors`,
      data: { fame: territory.totalFame, sectors: territory.totalSectors }
    })
  }

  // Weekly country funding (JA2 style)
  const country = getCountryByName(store.selectedCountry) || getCountryByCode(store.selectedCountry)
  let fundingConfig: CountryFundingConfig | null = null
  let fundingReceived = 0

  if (country) {
    fundingConfig = {
      ...calculateCountryFunding(country),
      countryCode: country.code,
      countryName: country.name
    }
    const governmentRep = store.reputation?.government ?? 0
    const preFunding = useGameStore.getState()
    const fundingResult = processCountryFunding(preFunding.economy, fundingConfig, governmentRep, econTime)
    fundingReceived = fundingResult.fundingReceived

    if (fundingReceived > 0) {
      useGameStore.setState({
        economy: fundingResult.newState,
        budget: preFunding.budget + fundingReceived
      })
    }

    store.addNotification({
      type: 'economy',
      priority: fundingReceived > 0 ? 'low' : 'high',
      title: fundingReceived > 0 ? 'Country Funding' : 'Funding Suspended',
      message: fundingResult.message,
      data: { amount: fundingReceived, country: fundingConfig.countryName }
    })
  }

  // Bankruptcy check after all payday flows resolve
  if (fundingConfig) {
    const finalState = useGameStore.getState()
    const governmentRep = finalState.reputation?.government ?? 0
    const bankruptcy = checkBankruptcy(finalState.economy, governmentRep, fundingConfig)

    if (bankruptcy.isBankrupt) {
      store.addNotification({
        type: 'economy',
        priority: 'urgent',
        title: 'BANKRUPTCY',
        message: bankruptcy.warning || 'Operations are out of funds and country support has been withdrawn',
        data: { cash: finalState.economy.cash }
      })

      createEmail(
        'admin',
        EMAIL_SENDERS.admin,
        '🚨 FINANCIAL COLLAPSE - Operations at Risk',
        `
FINANCIAL EMERGENCY
==================

Our accounts are empty and ${fundingConfig.countryName} has withdrawn all financial support.

Current balance: ${formatCurrency(finalState.economy.cash)}
Government standing: ${governmentRep}

Without funds we cannot pay salaries, maintain the base, or field operations.

Recover funding immediately: complete missions, improve government standing, or liquidate assets.

- Admin Office
`.trim(),
        { priority: 'urgent' }
      )
    } else if (bankruptcy.warning) {
      store.addNotification({
        type: 'economy',
        priority: 'high',
        title: 'Low Funds Warning',
        message: bankruptcy.warning,
        data: { cash: finalState.economy.cash }
      })
    }
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
      territoryIncome: territory.totalIncome,
      territoryFame: territory.totalFame,
      countryFunding: fundingReceived,
      newBalance: useGameStore.getState().economy.cash
    }
  })

  console.log('[EconomyEventHandler] Payday processed:', {
    income,
    expenses: totalExpenses,
    net: netChange,
    territoryIncome: territory.totalIncome,
    countryFunding: fundingReceived
  })
}

/**
 * Handle mission completed - add rewards
 */
function handleMissionCompleted(event: MissionCompletedEvent): void {
  const store = useGameStore.getState()
  const { success, rewards } = event.data

  if (!success || !rewards) return

  // Add cash reward (event payload uses rewards.money per MissionCompletedEvent)
  const cashReward = rewards.money || 0
  if (cashReward > 0) {
    const gameTime = store.gameTime
    const econTime = {
      day: gameTime.day,
      hour: Math.floor((gameTime.minutes || 0) / 60)
    } as GameTime
    const economy = processTransaction(store.economy, createTransaction(
      'income', 'mission_reward', cashReward,
      `Mission reward: ${event.data.missionName}`, store.economy.cash, econTime
    ))
    useGameStore.setState({ economy, budget: store.budget + cashReward })

    EventBus.emit<GameEvent>({
      id: `economy-mission-reward-${Date.now()}`,
      type: 'economy:income-received',
      timestamp: Date.now(),
      data: {
        category: 'mission_reward',
        amount: cashReward,
        source: 'mission',
        missionName: event.data.missionName
      }
    })

    store.addNotification({
      type: 'economy',
      priority: 'medium',
      title: 'Mission Reward',
      message: `Received ${formatCurrency(cashReward)} for completing mission`,
      data: { amount: cashReward }
    })
  }

  console.log('[EconomyEventHandler] Mission reward processed:', cashReward)
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

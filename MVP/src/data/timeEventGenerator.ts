/**
 * Time Event Generator - EventBus Integration
 *
 * Fires events when time passes: day changes, time of day changes,
 * week changes, payday, etc. Also triggers random encounters.
 *
 * USAGE: Call initTimeEventGenerator() once on app startup.
 */

import {
  EventBus,
  TimePassedEvent,
  GameEvent
} from './eventBus'
import { ALL_WEAPONS } from './weapons'
import { ALL_ARMOR } from './armor'
import {
  GameTime,
  TimeOfDay,
  hasDayChanged,
  hasWeekChanged,
  isPayday,
  getTimeOfDay,
  isWeekend
} from './timeSystem'
import { useGameStore } from '../stores/enhancedGameStore'

// ============================================================================
// TIME EVENT GENERATOR STATE
// ============================================================================

interface TimeEventGeneratorState {
  initialized: boolean
  subscriptionIds: string[]
  lastProcessedTime: GameTime | null
}

const state: TimeEventGeneratorState = {
  initialized: false,
  subscriptionIds: [],
  lastProcessedTime: null
}

// ============================================================================
// DAY/NIGHT EFFECTS
// ============================================================================

interface DayNightEffects {
  visibility: number      // 0-100 (night = low, day = high)
  criminalActivity: number // 0-100 (night = high, day = low)
  civilianDensity: number  // 0-100 (day = high, night = low)
  shopAvailability: boolean
  hospitalAvailability: boolean
}

export function getDayNightEffects(timeOfDay: TimeOfDay): DayNightEffects {
  switch (timeOfDay) {
    case 'night':
      return {
        visibility: 30,
        criminalActivity: 80,
        civilianDensity: 15,
        shopAvailability: false,
        hospitalAvailability: true
      }
    case 'morning':
      return {
        visibility: 90,
        criminalActivity: 20,
        civilianDensity: 60,
        shopAvailability: true,
        hospitalAvailability: true
      }
    case 'afternoon':
      return {
        visibility: 100,
        criminalActivity: 15,
        civilianDensity: 80,
        shopAvailability: true,
        hospitalAvailability: true
      }
    case 'evening':
      return {
        visibility: 60,
        criminalActivity: 50,
        civilianDensity: 50,
        shopAvailability: false,
        hospitalAvailability: true
      }
  }
}

// ============================================================================
// RANDOM ENCOUNTER SYSTEM
// ============================================================================

export type EncounterType =
  | 'crime_in_progress'
  | 'patrol_contact'
  | 'informant_tip'
  | 'emergency_call'
  | 'celebrity_sighting'
  | 'media_interview'
  | 'rival_encounter'

interface RandomEncounter {
  type: EncounterType
  title: string
  description: string
  probability: number
  allowedTimes: TimeOfDay[]
  fameRequired?: number
  effects?: {
    fameChange?: number
    moneyChange?: number
    triggersMission?: boolean
  }
}

const RANDOM_ENCOUNTERS: RandomEncounter[] = [
  {
    type: 'crime_in_progress',
    title: 'Crime in Progress',
    description: 'Witnesses report a crime happening nearby',
    probability: 0.15,
    allowedTimes: ['night', 'evening'],
    effects: {
      fameChange: 10,
      triggersMission: true
    }
  },
  {
    type: 'patrol_contact',
    title: 'Patrol Contact',
    description: 'Local law enforcement wants to coordinate',
    probability: 0.10,
    allowedTimes: ['morning', 'afternoon'],
    fameRequired: 50,
    effects: {
      fameChange: 5
    }
  },
  {
    type: 'informant_tip',
    title: 'Informant Tip',
    description: 'Someone has information about criminal activity',
    probability: 0.12,
    allowedTimes: ['night', 'evening', 'afternoon'],
    effects: {
      triggersMission: true
    }
  },
  {
    type: 'emergency_call',
    title: 'Emergency Call',
    description: 'Urgent situation requires immediate response',
    probability: 0.08,
    allowedTimes: ['morning', 'afternoon', 'evening', 'night'],
    effects: {
      fameChange: 20,
      triggersMission: true
    }
  },
  {
    type: 'celebrity_sighting',
    title: 'Celebrity Encounter',
    description: 'Your presence is noticed by the public',
    probability: 0.05,
    allowedTimes: ['afternoon', 'evening'],
    fameRequired: 100,
    effects: {
      fameChange: 15
    }
  },
  {
    type: 'media_interview',
    title: 'Media Interview Request',
    description: 'A reporter wants to interview you',
    probability: 0.07,
    allowedTimes: ['morning', 'afternoon'],
    fameRequired: 75,
    effects: {
      fameChange: 25
    }
  },
  {
    type: 'rival_encounter',
    title: 'Rival Encounter',
    description: 'Cross paths with a rival operative',
    probability: 0.06,
    allowedTimes: ['afternoon', 'evening', 'night'],
    fameRequired: 150,
    effects: {
      triggersMission: true
    }
  }
]

/**
 * Check for random encounters during time passage
 */
function checkForRandomEncounters(
  timeOfDay: TimeOfDay,
  currentFame: number
): RandomEncounter | null {
  // Filter eligible encounters
  const eligible = RANDOM_ENCOUNTERS.filter(e =>
    e.allowedTimes.includes(timeOfDay) &&
    (!e.fameRequired || currentFame >= e.fameRequired) &&
    Math.random() < e.probability
  )

  if (eligible.length === 0) return null

  // Pick one randomly
  return eligible[Math.floor(Math.random() * eligible.length)]
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle time progression - the main event handler
 */
function handleTimePassed(event: TimePassedEvent): void {
  const store = useGameStore.getState()
  const newTime = event.data.newTime
  const oldTime = event.data.previousTime

  // Store last processed time
  const previousProcessed = state.lastProcessedTime
  state.lastProcessedTime = newTime

  // Check for time of day change
  if (previousProcessed && previousProcessed.timeOfDay !== newTime.timeOfDay) {
    emitTimeOfDayChanged(previousProcessed.timeOfDay, newTime.timeOfDay)
  }

  // Check for day change (already handled by eventBus, but add effects)
  if (oldTime && hasDayChanged(oldTime, newTime)) {
    processDayChange(newTime)
  }

  // Check for week change
  if (oldTime && hasWeekChanged(oldTime, newTime)) {
    processWeekChange(newTime)
  }

  // Check for random encounters (only during significant time passage)
  if (event.data.hoursAdvanced >= 1) {
    const currentFame = store.fame || 0
    const encounter = checkForRandomEncounters(newTime.timeOfDay, currentFame)

    if (encounter) {
      emitRandomEncounter(encounter, newTime)
    }
  }
}

/**
 * Process day change events
 */
function processDayChange(newTime: GameTime): void {
  const store = useGameStore.getState()

  // Emit day start event
  EventBus.emit<GameEvent>({
    id: `day-start-${newTime.day}`,
    type: 'time:day-started',
    timestamp: Date.now(),
    data: {
      day: newTime.day,
      date: newTime.date,
      isWeekend: newTime.isWeekend
    }
  })

  // Check for payday
  if (isPayday(newTime.date)) {
    emitPayday(newTime)
  }

  // Process daily recovery for hospitalized characters
  processHospitalRecovery()

  // Update investigation deadlines
  processInvestigationDeadlines()

  console.log('[TimeEventGenerator] Day changed to', newTime.day, newTime.date)
}

/**
 * Process week change events
 */
function processWeekChange(newTime: GameTime): void {
  EventBus.emit<GameEvent>({
    id: `week-change-${newTime.day}`,
    type: 'time:week-changed',
    timestamp: Date.now(),
    data: {
      day: newTime.day,
      date: newTime.date,
      weekNumber: Math.ceil(newTime.day / 7)
    }
  })

  console.log('[TimeEventGenerator] Week changed')
}

/**
 * Emit time of day changed event
 */
function emitTimeOfDayChanged(oldTimeOfDay: TimeOfDay, newTimeOfDay: TimeOfDay): void {
  const effects = getDayNightEffects(newTimeOfDay)

  EventBus.emit<GameEvent>({
    id: `tod-change-${Date.now()}`,
    type: 'time:time-of-day-changed',
    timestamp: Date.now(),
    data: {
      previousTimeOfDay: oldTimeOfDay,
      newTimeOfDay: newTimeOfDay,
      effects
    }
  })

  console.log('[TimeEventGenerator] Time of day changed:', oldTimeOfDay, '->', newTimeOfDay)
}

/**
 * Emit payday event
 */
function emitPayday(time: GameTime): void {
  const store = useGameStore.getState()

  // Calculate weekly income/expenses
  const income = calculateWeeklyIncome()
  const expenses = calculateWeeklyExpenses()
  const netChange = income - expenses

  EventBus.emit<GameEvent>({
    id: `payday-${time.day}`,
    type: 'economy:payday',
    timestamp: Date.now(),
    data: {
      day: time.day,
      income,
      expenses,
      netChange
    }
  })

  // Apply money change
  if (netChange !== 0) {
    store.addMoney(netChange)
  }

  console.log('[TimeEventGenerator] Payday! Income:', income, 'Expenses:', expenses)
}

/**
 * Emit random encounter event
 */
function emitRandomEncounter(encounter: RandomEncounter, time: GameTime): void {
  const store = useGameStore.getState()

  EventBus.emit<GameEvent>({
    id: `encounter-${Date.now()}`,
    type: 'encounter:random',
    timestamp: Date.now(),
    data: {
      encounterType: encounter.type,
      title: encounter.title,
      description: encounter.description,
      timeOfDay: time.timeOfDay,
      effects: encounter.effects
    }
  })

  // Apply immediate effects
  if (encounter.effects?.fameChange) {
    store.addFame(encounter.effects.fameChange)
  }
  if (encounter.effects?.moneyChange) {
    store.addMoney(encounter.effects.moneyChange)
  }

  // Add notification
  store.addNotification({
    type: 'encounter',
    priority: encounter.effects?.triggersMission ? 'high' : 'medium',
    title: encounter.title,
    message: encounter.description,
    data: { encounterType: encounter.type }
  })

  console.log('[TimeEventGenerator] Random encounter:', encounter.title)
}

/**
 * Process hospital recovery for characters
 */
function processHospitalRecovery(): void {
  const store = useGameStore.getState()

  // Get hospitalized characters
  const hospitalized = store.characters.filter(c => c.status === 'hospitalized')

  for (const char of hospitalized) {
    // Check if recovery time is complete
    const recoveryStart = char.statusStartTime || Date.now()
    const hoursHospitalized = (Date.now() - recoveryStart) / (1000 * 60 * 60)

    // Use the character's calculated recovery time (already set during hospitalization)
    const recoveryTime = char.recoveryTime || 24 // Fallback to 24 hours if not set

    if (hoursHospitalized >= recoveryTime) {
      // Discharge character
      EventBus.emit<GameEvent>({
        id: `hospital-discharge-${char.id}`,
        type: 'character:hospital-discharged',
        timestamp: Date.now(),
        data: {
          characterId: char.id,
          characterName: char.name,
          hoursHospitalized
        }
      })
    }
  }
}

/**
 * Process investigation deadlines
 */
function processInvestigationDeadlines(): void {
  const store = useGameStore.getState()

  // Check leads for expiration
  for (const lead of store.investigationLeads) {
    if (lead.expiresAt && Date.now() > lead.expiresAt) {
      store.expireInvestigation(lead.id)
    }
  }

  // Update hours remaining on active investigations
  for (const inv of store.activeInvestigations) {
    if (inv.hoursRemaining && inv.hoursRemaining > 0) {
      // Decrement by 24 hours
      const newHoursRemaining = inv.hoursRemaining - 24
      if (newHoursRemaining <= 0) {
        store.expireInvestigation(inv.id)
      }
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate weekly income from characters and operations
 */
function calculateWeeklyIncome(): number {
  const store = useGameStore.getState()
  let income = 0

  // Base operations income
  income += 1000 // Base stipend

  // Fame bonus
  income += Math.floor((store.fame || 0) * 10)

  // Completed missions bonus - Calculate bonus from completed missions in last 7 days
  const currentDay = store.gameTime?.day || 0
  const sevenDaysAgo = currentDay - 7
  const weeklyMissions = (store.completedMissions || []).filter(
    (m: any) => m.completedAt && m.completedAt >= sevenDaysAgo && m.status === 'completed'
  ).length
  income += weeklyMissions * 500  // $500 bonus per mission completed this week

  return income
}

/**
 * Calculate weekly expenses
 */
function calculateWeeklyExpenses(): number {
  const store = useGameStore.getState()
  let expenses = 0

  // Character salaries (if applicable)
  expenses += store.characters.length * 100

  // Base maintenance
  expenses += 200

  // Equipment upkeep - calculate from equipped items
  const characters = store.characters || []
  let equipmentMaintenance = 0

  for (const char of characters) {
    // Weapon maintenance (2% of weapon cost per week)
    if (char.equippedWeapon) {
      const weapon = ALL_WEAPONS.find(w => w.id === char.equippedWeapon || w.name === char.equippedWeapon)
      if (weapon?.costValue) {
        equipmentMaintenance += Math.ceil(weapon.costValue * 0.02)
      }
    }

    // Armor maintenance (1.5% of armor cost per week)
    if (char.equippedArmor) {
      const armor = ALL_ARMOR.find(a => a.id === char.equippedArmor || a.name === char.equippedArmor)
      if (armor?.costValue) {
        equipmentMaintenance += Math.ceil(armor.costValue * 0.015)
      }
    }
  }

  // Minimum maintenance cost if any equipment equipped
  if (equipmentMaintenance > 0) {
    equipmentMaintenance = Math.max(50, equipmentMaintenance)  // At least $50
  }

  expenses += equipmentMaintenance

  return expenses
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize time event generator and subscribe to EventBus
 * Call this once on app startup
 */
export function initTimeEventGenerator(): void {
  if (state.initialized) {
    console.log('[TimeEventGenerator] Already initialized')
    return
  }

  console.log('[TimeEventGenerator] Initializing...')

  // Subscribe to time passage events (hour-passed is emitted by the game store)
  state.subscriptionIds.push(
    EventBus.on<TimePassedEvent>('time:hour-passed', handleTimePassed, { priority: 10 })
  )

  state.initialized = true
  console.log('[TimeEventGenerator] Initialized with', state.subscriptionIds.length, 'subscriptions')
}

/**
 * Cleanup time event generator subscriptions
 * Call this on app unmount
 */
export function cleanupTimeEventGenerator(): void {
  if (!state.initialized) return

  console.log('[TimeEventGenerator] Cleaning up...')

  for (const id of state.subscriptionIds) {
    EventBus.off(id)
  }

  state.subscriptionIds = []
  state.lastProcessedTime = null
  state.initialized = false
}

/**
 * Check if time event generator is initialized
 */
export function isTimeEventGeneratorInitialized(): boolean {
  return state.initialized
}

/**
 * Get current day/night effects for the current time
 */
export function getCurrentDayNightEffects(): DayNightEffects {
  const store = useGameStore.getState()
  const timeOfDay = getTimeOfDay(store.gameTime?.hour || 8)
  return getDayNightEffects(timeOfDay)
}

export default initTimeEventGenerator

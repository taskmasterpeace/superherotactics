/**
 * Investigation Generator - EventBus Integration
 *
 * Automatically discovers investigation leads from game events.
 * Subscribes to EventBus and generates investigations when appropriate.
 *
 * USAGE: Call initInvestigationGenerator() once on app startup.
 */

import {
  EventBus,
  CombatEndedEvent,
  MissionCompletedEvent,
  TimePassedEvent,
  NewsArticleReadEvent,
  GameEvent
} from './eventBus'
import {
  Investigation,
  InvestigationTemplate,
  INVESTIGATION_TEMPLATES,
  generateInvestigation,
  InvestigationType
} from './investigationSystem'
import { useGameStore } from '../stores/enhancedGameStore'

// ============================================================================
// INVESTIGATION GENERATOR STATE
// ============================================================================

interface InvestigationGeneratorState {
  initialized: boolean
  subscriptionIds: string[]
  lastDiscoveryTime: number
  discoveryCooldown: number // Minimum ms between discoveries
  maxLeads: number // Maximum pending investigation leads
}

const state: InvestigationGeneratorState = {
  initialized: false,
  subscriptionIds: [],
  lastDiscoveryTime: 0,
  discoveryCooldown: 10000, // 10 second cooldown
  maxLeads: 5 // Max 5 leads at once
}

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

/**
 * Get investigation templates by type
 */
function getTemplatesByType(type: InvestigationType): InvestigationTemplate[] {
  return INVESTIGATION_TEMPLATES.filter(t => t.type === type)
}

/**
 * Get a random template matching difficulty range
 */
function getRandomTemplate(
  types: InvestigationType[],
  minDifficulty: number = 1,
  maxDifficulty: number = 10
): InvestigationTemplate | null {
  const candidates = INVESTIGATION_TEMPLATES.filter(t =>
    types.includes(t.type) &&
    t.difficulty >= minDifficulty &&
    t.difficulty <= maxDifficulty
  )

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Select investigation type based on event context
 */
function selectTypeForContext(
  eventType: string,
  contextData?: { fameChange?: number; casualties?: number }
): InvestigationType[] {
  switch (eventType) {
    case 'combat:ended':
      // Combat outcomes suggest underworld or crime
      return ['crime', 'underworld']
    case 'mission:completed':
      // Mission success might reveal deeper conspiracies
      return ['conspiracy', 'crime', 'espionage']
    case 'time:day-passed':
      // Random daily discoveries
      return ['crime', 'underworld', 'terrorism', 'conspiracy', 'corporate', 'espionage']
    default:
      return ['crime', 'underworld']
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle combat ended events - chance to discover investigation
 */
function handleCombatEnded(event: CombatEndedEvent): void {
  const store = useGameStore.getState()
  const { victory, casualties, fameChange, location } = event.data

  // 25% chance to discover investigation after combat
  if (Math.random() > 0.25) {
    console.log('[InvestigationGenerator] No investigation discovered from combat')
    return
  }

  // Check if we have too many leads already
  if (store.investigationLeads.length >= state.maxLeads) {
    console.log('[InvestigationGenerator] Max leads reached, skipping discovery')
    return
  }

  // Select type based on combat outcome
  const types = selectTypeForContext('combat:ended', {
    fameChange,
    casualties: casualties.length
  })

  // Get appropriate difficulty (harder if tough combat)
  const minDiff = casualties.length > 0 ? 4 : 2
  const maxDiff = casualties.length >= 2 ? 10 : 7

  const template = getRandomTemplate(types, minDiff, maxDiff)
  if (!template) return

  discoverInvestigationWithCooldown(
    template,
    location?.city || 'Unknown City',
    location?.country || 'Unknown Country',
    location?.sector || 'A1'
  )
}

/**
 * Handle mission completed events - higher chance to discover investigations
 */
function handleMissionCompleted(event: MissionCompletedEvent): void {
  const store = useGameStore.getState()
  const { success, missionName } = event.data
  const location = event.location

  // 40% chance on mission success, 15% on failure
  const discoveryChance = success ? 0.40 : 0.15
  if (Math.random() > discoveryChance) {
    console.log('[InvestigationGenerator] No investigation discovered from mission')
    return
  }

  // Check max leads
  if (store.investigationLeads.length >= state.maxLeads) {
    console.log('[InvestigationGenerator] Max leads reached, skipping discovery')
    return
  }

  // Mission completions often reveal conspiracies
  const types = selectTypeForContext('mission:completed')
  const minDiff = success ? 4 : 3
  const maxDiff = success ? 9 : 6

  const template = getRandomTemplate(types, minDiff, maxDiff)
  if (!template) return

  discoverInvestigationWithCooldown(
    template,
    location?.city || 'Unknown City',
    location?.country || 'Unknown Country',
    location?.sector || 'A1'
  )
}

/**
 * Handle daily time events - passive investigation discovery
 */
function handleDayPassed(event: TimePassedEvent): void {
  const store = useGameStore.getState()

  // 10% chance per day to discover investigation passively
  if (Math.random() > 0.10) return

  // Check max leads
  if (store.investigationLeads.length >= state.maxLeads) return

  // Pick a random city where we have presence
  const currentSector = store.currentSector
  const cities = store.cities.filter(c =>
    c.sectorCode === currentSector ||
    Math.random() < 0.3 // 30% chance for any city
  )

  if (cities.length === 0) return
  const city = cities[Math.floor(Math.random() * cities.length)]

  // Any type for daily discoveries
  const types = selectTypeForContext('time:day-passed')
  const template = getRandomTemplate(types, 3, 7)
  if (!template) return

  discoverInvestigationWithCooldown(
    template,
    city.name,
    city.country,
    city.sectorCode
  )
}


/**
 * Handle news article read events - reading news can trigger investigation leads
 * Higher chance for articles with explicit investigation leads
 */
function handleNewsArticleRead(event: NewsArticleReadEvent): void {
  const store = useGameStore.getState()
  const { headline, category, hasInvestigationLead, investigationType } = event.data
  const location = event.location

  // 60% chance if article has explicit lead, 20% otherwise
  const discoveryChance = hasInvestigationLead ? 0.60 : 0.20
  if (Math.random() > discoveryChance) {
    console.log('[InvestigationGenerator] No investigation discovered from news article')
    return
  }

  // Check max leads
  if (store.investigationLeads.length >= state.maxLeads) {
    console.log('[InvestigationGenerator] Max leads reached, skipping discovery')
    return
  }

  // Map news category to investigation types
  let types: InvestigationType[]
  if (investigationType) {
    types = [investigationType as InvestigationType]
  } else {
    switch (category) {
      case 'crime':
        types = ['crime', 'underworld']
        break
      case 'politics':
        types = ['conspiracy', 'espionage']
        break
      case 'business':
        types = ['corporate', 'conspiracy']
        break
      case 'terror':
        types = ['terrorism', 'conspiracy']
        break
      default:
        types = ['crime', 'underworld', 'conspiracy']
    }
  }

  // News-derived investigations tend to be moderate difficulty
  const template = getRandomTemplate(types, 3, 7)
  if (!template) return

  discoverInvestigationWithCooldown(
    template,
    location?.city || 'Unknown City',
    location?.country || 'Unknown Country',
    location?.sector || 'A1'
  )

  console.log('[InvestigationGenerator] Investigation lead discovered from news:', headline)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Discover investigation with cooldown check
 */
function discoverInvestigationWithCooldown(
  template: InvestigationTemplate,
  city: string,
  country: string,
  sector: string
): void {
  const now = Date.now()
  if (now - state.lastDiscoveryTime < state.discoveryCooldown) {
    console.log('[InvestigationGenerator] Cooldown active, skipping discovery')
    return
  }

  state.lastDiscoveryTime = now

  const store = useGameStore.getState()
  store.discoverInvestigation(template, city, country, sector)

  console.log('[InvestigationGenerator] Discovered investigation:', template.title, 'in', city)

  // Emit investigation discovered event
  EventBus.emit<GameEvent>({
    id: `inv-discovery-${Date.now()}`,
    type: 'investigation:discovered',
    timestamp: Date.now(),
    location: { city, country, sector },
    data: {
      investigationType: template.type,
      title: template.title,
      difficulty: template.difficulty
    }
  })
}

// ============================================================================
// INVESTIGATION EVENT EMITTERS
// ============================================================================

/**
 * Emit investigation completed event (for other systems to react)
 */
export function emitInvestigationCompleted(
  investigation: Investigation,
  rewards: { cash: number; fame: number; intel: string[] }
): void {
  EventBus.emit<GameEvent>({
    id: `inv-complete-${investigation.id}`,
    type: 'investigation:completed',
    timestamp: Date.now(),
    location: {
      city: investigation.city,
      country: investigation.country,
      sector: investigation.sector
    },
    data: {
      investigationId: investigation.id,
      investigationType: investigation.type,
      title: investigation.title,
      rewards,
      cluesGathered: investigation.cluesGathered.length,
      decisionsCount: investigation.decisionsLog.length
    }
  })
}

/**
 * Emit investigation failed event
 */
export function emitInvestigationFailed(
  investigation: Investigation,
  reason: 'suspicion' | 'exposure' | 'timeout'
): void {
  EventBus.emit<GameEvent>({
    id: `inv-failed-${investigation.id}`,
    type: 'investigation:failed',
    timestamp: Date.now(),
    location: {
      city: investigation.city,
      country: investigation.country,
      sector: investigation.sector
    },
    data: {
      investigationId: investigation.id,
      investigationType: investigation.type,
      title: investigation.title,
      failureReason: reason,
      suspicionLevel: investigation.suspicionLevel,
      publicExposure: investigation.publicExposure
    }
  })
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize investigation generator and subscribe to EventBus
 * Call this once on app startup
 */
export function initInvestigationGenerator(): void {
  if (state.initialized) {
    console.log('[InvestigationGenerator] Already initialized')
    return
  }

  console.log('[InvestigationGenerator] Initializing...')

  // Subscribe to combat events
  state.subscriptionIds.push(
    EventBus.on<CombatEndedEvent>('combat:ended', handleCombatEnded, { priority: 5 })
  )

  // Subscribe to mission events
  state.subscriptionIds.push(
    EventBus.on<MissionCompletedEvent>('mission:completed', handleMissionCompleted, { priority: 5 })
  )

  // Subscribe to daily time events
  state.subscriptionIds.push(
    EventBus.on<TimePassedEvent>('time:day-passed', handleDayPassed, { priority: 1 })
  )

  // Subscribe to news article read events
  state.subscriptionIds.push(
    EventBus.on<NewsArticleReadEvent>('news:article-read', handleNewsArticleRead, { priority: 5 })
  )

  state.initialized = true
  console.log('[InvestigationGenerator] Initialized with', state.subscriptionIds.length, 'subscriptions')
}

/**
 * Cleanup investigation generator subscriptions
 * Call this on app unmount
 */
export function cleanupInvestigationGenerator(): void {
  if (!state.initialized) return

  console.log('[InvestigationGenerator] Cleaning up...')

  for (const id of state.subscriptionIds) {
    EventBus.off(id)
  }

  state.subscriptionIds = []
  state.initialized = false
}

/**
 * Check if investigation generator is initialized
 */
export function isInvestigationGeneratorInitialized(): boolean {
  return state.initialized
}

/**
 * Force discover a specific investigation type (for debugging/testing)
 */
export function forceDiscoverInvestigation(
  type: InvestigationType,
  city: string,
  country: string,
  sector: string
): void {
  const templates = getTemplatesByType(type)
  if (templates.length === 0) {
    console.error('[InvestigationGenerator] No templates for type:', type)
    return
  }

  const template = templates[Math.floor(Math.random() * templates.length)]
  state.lastDiscoveryTime = 0 // Reset cooldown for force discovery

  discoverInvestigationWithCooldown(template, city, country, sector)
}

export default initInvestigationGenerator

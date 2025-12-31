/**
 * News Generator - EventBus Integration
 *
 * Automatically generates news articles from game events.
 * Subscribes to EventBus and converts events into news articles.
 *
 * USAGE: Call initNewsGenerator() once on app startup.
 */

import {
  EventBus,
  CombatEndedEvent,
  MissionCompletedEvent,
  CharacterHospitalizedEvent,
  ReputationChangedEvent,
  TimePassedEvent,
  GameEvent
} from './eventBus'
import {
  NewsArticle,
  NewsCategory,
  NewsImportance,
  NewsBias,
  NEWS_SOURCES,
  createNewsArticle,
  pickRandomSource,
  getSourcesByBias
} from './newsSystem'
import {
  MISSION_SUCCESS_HEADLINES,
  MISSION_FAILURE_HEADLINES,
  HIGH_CASUALTIES_HEADLINES,
  COMBAT_WITNESSED_HEADLINES,
  getHeadlineForBias,
  HeadlineSet
} from './newsTemplates'
import { useGameStore } from '../stores/enhancedGameStore'

/**
 * Select a random template from an array
 */
function selectTemplate(templates: string[]): string {
  if (!templates || templates.length === 0) {
    return 'News from the scene'
  }
  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * Get headline from HeadlineSet by bias, with fallback
 */
function getHeadlineFromSet(set: HeadlineSet, bias: NewsBias): string {
  const headlines = set[bias] || set.neutral || []
  return selectTemplate(headlines)
}

// ============================================================================
// NEWS GENERATOR STATE
// ============================================================================

interface NewsGeneratorState {
  initialized: boolean
  subscriptionIds: string[]
  lastArticleTime: number
  articleCooldown: number // Minimum ms between articles
}

const state: NewsGeneratorState = {
  initialized: false,
  subscriptionIds: [],
  lastArticleTime: 0,
  articleCooldown: 5000 // 5 second cooldown to prevent spam
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle combat ended events
 */
function handleCombatEnded(event: CombatEndedEvent): void {
  const store = useGameStore.getState()
  const { victory, casualties, fameChange, collateralDamage } = event.data
  const location = event.location

  // Skip if no fame impact (minor skirmish)
  if (Math.abs(fameChange) < 5 && casualties.length === 0) {
    console.log('[NewsGenerator] Skipping minor combat (no news impact)')
    return
  }

  // Determine news importance based on event significance
  let importance: NewsImportance = 'standard'
  if (casualties.length >= 3 || Math.abs(fameChange) >= 30) {
    importance = 'breaking'
  } else if (casualties.length >= 1 || Math.abs(fameChange) >= 15) {
    importance = 'major'
  }

  // Pick bias based on outcome
  let bias: NewsBias = 'neutral'
  if (victory && casualties.length === 0) {
    bias = Math.random() > 0.3 ? 'pro_hero' : 'neutral'
  } else if (!victory || casualties.length > 2) {
    bias = Math.random() > 0.3 ? 'anti_hero' : 'neutral'
  }
  // Sometimes tabloids cover big events
  if (importance === 'breaking' && Math.random() > 0.7) {
    bias = 'tabloid'
  }

  // Generate headline using templates
  let headline: string
  let body: string

  if (victory && casualties.length === 0) {
    headline = getHeadlineFromSet(MISSION_SUCCESS_HEADLINES, bias)
    body = generateCombatBody(event, 'clean_victory')
  } else if (!victory) {
    headline = getHeadlineFromSet(MISSION_FAILURE_HEADLINES, bias)
    body = generateCombatBody(event, 'defeat')
  } else if (casualties.length >= 2) {
    headline = getHeadlineFromSet(HIGH_CASUALTIES_HEADLINES, bias)
    body = generateCombatBody(event, 'high_casualties')
  } else {
    headline = getHeadlineFromSet(COMBAT_WITNESSED_HEADLINES, bias)
    body = generateCombatBody(event, 'combat')
  }

  // Replace template variables
  headline = replaceVariables(headline, {
    location: location?.city || 'unknown location',
    cityName: location?.city || 'the city',
    team: 'local heroes',
    result: victory ? 'triumph' : 'setback'
  })

  // Get appropriate source
  const sources = getSourcesByBias(bias)
  const source = sources.length > 0 ? sources[Math.floor(Math.random() * sources.length)] : pickRandomSource('superhuman')

  const article = createNewsArticle(
    headline,
    body,
    'superhuman',
    importance,
    store.gameTime,
    {
      source,
      region: location?.country,
      city: location?.city,
      sectorCode: location?.sector,
      relatedCharacters: event.data.casualties.map(c => c.id),
      eventType: 'combat_witnessed',
      eventId: event.id,
      reputationEffects: { fame: fameChange }
    }
  )

  addArticleWithCooldown(article)
}

/**
 * Handle mission completed events
 */
function handleMissionCompleted(event: MissionCompletedEvent): void {
  const store = useGameStore.getState()
  const { success, missionName, rewards, casualties } = event.data
  const location = event.location

  // All missions are newsworthy
  const importance: NewsImportance = casualties.length > 0 ? 'major' : (success ? 'standard' : 'major')

  // Pick bias
  let bias: NewsBias = 'neutral'
  if (success && casualties.length === 0) {
    bias = 'pro_hero'
  } else if (!success) {
    bias = Math.random() > 0.5 ? 'anti_hero' : 'neutral'
  }

  // Use the store's mission news generator if available
  store.generateMissionNews({
    success,
    collateralDamage: 0,
    civilianCasualties: 0,
    city: location?.city || 'Unknown City',
    country: location?.country || 'Unknown',
    missionType: event.data.missionType || 'combat',
    enemyType: 'hostiles',
    vigilantismLegal: true
  })
}

/**
 * Handle character hospitalized events
 */
function handleCharacterHospitalized(event: CharacterHospitalizedEvent): void {
  const store = useGameStore.getState()
  const { characterName, injuries, hospitalName } = event.data

  // Only newsworthy if severe injuries
  const severeInjuries = injuries.filter(i =>
    i.severity === 'SEVERE' || i.severity === 'PERMANENT'
  )

  if (severeInjuries.length === 0) return

  const headline = `Local Hero ${characterName} Hospitalized After Combat`
  const injuryList = severeInjuries.map(i => i.bodyPart).join(', ')
  const body = `${characterName} was admitted to ${hospitalName} following injuries sustained during recent superhuman conflict. Medical staff report ${severeInjuries.length > 1 ? 'multiple serious injuries' : `a serious ${injuryList} injury`}. Recovery time is estimated at several days.`

  const article = createNewsArticle(
    headline,
    body,
    'superhuman',
    'standard',
    store.gameTime,
    {
      source: pickRandomSource('local'),
      relatedCharacters: [event.data.characterId],
      eventType: 'mission_complete',
      eventId: event.id
    }
  )

  addArticleWithCooldown(article)
}

/**
 * Handle reputation milestone events
 */
function handleReputationChanged(event: ReputationChangedEvent): void {
  const store = useGameStore.getState()
  const { previousValue, newValue, change, reason } = event.data

  // Only report significant milestones
  const milestones = [100, 250, 500, 750, 1000]
  const crossedMilestone = milestones.find(m =>
    (previousValue < m && newValue >= m) || (previousValue > m && newValue <= m)
  )

  if (!crossedMilestone && Math.abs(change) < 50) return

  const increasing = change > 0
  let headline: string
  let bias: NewsBias = 'neutral'

  if (crossedMilestone) {
    if (increasing) {
      headline = `Public Approval Soars: Heroes Reach ${crossedMilestone} Fame Milestone`
      bias = 'pro_hero'
    } else {
      headline = `Public Trust Shaken: Hero Approval Falls Below ${crossedMilestone}`
      bias = 'anti_hero'
    }
  } else {
    headline = increasing
      ? `Rising Stars: Local Heroes Gain Public Support`
      : `Questions Raised About Local Hero Operations`
    bias = increasing ? 'pro_hero' : 'neutral'
  }

  const body = `Recent ${reason.toLowerCase()} has ${increasing ? 'boosted' : 'impacted'} public perception of local superhuman operatives. Current approval ratings stand at ${newValue}.`

  const article = createNewsArticle(
    headline,
    body,
    'superhuman',
    crossedMilestone ? 'major' : 'standard',
    store.gameTime,
    {
      source: pickRandomSource('politics'),
      eventId: event.id,
      reputationEffects: { fame: change }
    }
  )

  addArticleWithCooldown(article)
}

/**
 * Handle daily time events - generate ambient news
 */
function handleDayPassed(event: TimePassedEvent): void {
  // 30% chance to generate ambient news each day
  if (Math.random() > 0.3) return

  const store = useGameStore.getState()

  // Generate random ambient news
  const ambientNews = generateAmbientNews(store.gameTime)
  if (ambientNews) {
    addArticleWithCooldown(ambientNews)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate combat article body
 */
function generateCombatBody(event: CombatEndedEvent, type: string): string {
  const { victory, casualties, damageDealt, duration, fameChange } = event.data
  const location = event.location

  const locationStr = location?.city ? `in ${location.city}` : 'in the area'

  switch (type) {
    case 'clean_victory':
      return `A confrontation ${locationStr} ended decisively today as local operatives successfully neutralized a threat. The operation lasted approximately ${duration} minutes with no reported casualties among the responding team. Property damage assessments are ongoing.`

    case 'defeat':
      return `Operations ${locationStr} took a difficult turn today as responding teams were forced to withdraw. The engagement lasted ${duration} minutes. Officials have not released details on casualties or injuries. Questions are being raised about operational planning.`

    case 'high_casualties':
      return `A violent confrontation ${locationStr} has left ${casualties.length} operatives dead or incapacitated. The ${duration}-minute battle resulted in significant losses on both sides. Emergency services responded to the scene. Investigations into the incident are ongoing.`

    default:
      return `Witnesses reported superhuman activity ${locationStr} today. The incident lasted approximately ${duration} minutes. Local authorities are investigating. ${victory ? 'No ongoing threat is reported.' : 'Citizens are advised to remain vigilant.'}`
  }
}

/**
 * Generate ambient/filler news
 */
function generateAmbientNews(gameTime: { day: number; hour: number }): NewsArticle | null {
  const categories: NewsCategory[] = ['business', 'science', 'entertainment', 'weather', 'sports']
  const category = categories[Math.floor(Math.random() * categories.length)]

  const ambientHeadlines: Record<string, string[]> = {
    business: [
      'Tech Stocks Rally on AI Breakthrough Hopes',
      'Global Supply Chain Shows Signs of Recovery',
      'New Trade Agreement Announced Between Major Powers',
      'Energy Sector Adapts to Changing Demand',
      'Startup Raises Record Funding for Clean Energy'
    ],
    science: [
      'Researchers Make Progress on Superhuman Gene Study',
      'New Materials Could Revolutionize Armor Technology',
      'Space Agency Announces Ambitious Mars Plans',
      'Climate Scientists Issue New Warnings',
      'Medical Breakthrough Promises Faster Recovery Times'
    ],
    entertainment: [
      'Superhero Biopic Breaks Box Office Records',
      'Celebrity Chef Opens Restaurant in Downtown',
      'Music Festival Announces Stellar Lineup',
      'Streaming Service Launches New Original Series',
      'Art Exhibition Explores Superhuman Experience'
    ],
    weather: [
      'Mild Weather Expected Through Week',
      'Storm System Moving Across Region',
      'Heat Wave Prompts Health Advisory',
      'Clear Skies Perfect for Outdoor Activities',
      'Weather Service Updates Seasonal Forecast'
    ],
    sports: [
      'Local Team Advances to Championship Round',
      'Sports League Debates Superhuman Participation Rules',
      'Record-Breaking Performance at Weekend Meet',
      'New Stadium Plans Move Forward',
      'Youth Sports Program Expands Citywide'
    ]
  }

  const headlines = ambientHeadlines[category] || ambientHeadlines.business
  const headline = headlines[Math.floor(Math.random() * headlines.length)]

  return createNewsArticle(
    headline,
    `${headline}. More details are expected in the coming days.`,
    category,
    'filler',
    gameTime,
    {
      source: pickRandomSource(category)
    }
  )
}

/**
 * Replace template variables in headline
 */
function replaceVariables(text: string, vars: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${key}}`, 'gi'), value)
    result = result.replace(new RegExp(`\\$${key}`, 'gi'), value)
  }
  return result
}

/**
 * Add article with cooldown check
 */
function addArticleWithCooldown(article: NewsArticle): void {
  const now = Date.now()
  if (now - state.lastArticleTime < state.articleCooldown) {
    console.log('[NewsGenerator] Cooldown active, skipping article:', article.headline)
    return
  }

  state.lastArticleTime = now

  const store = useGameStore.getState()
  store.addNewsArticle(article)

  console.log('[NewsGenerator] Added article:', article.headline)
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize news generator and subscribe to EventBus
 * Call this once on app startup
 */
export function initNewsGenerator(): void {
  if (state.initialized) {
    console.log('[NewsGenerator] Already initialized')
    return
  }

  console.log('[NewsGenerator] Initializing...')

  // Subscribe to combat events
  state.subscriptionIds.push(
    EventBus.on<CombatEndedEvent>('combat:ended', handleCombatEnded, { priority: 10 })
  )

  // Subscribe to mission events
  state.subscriptionIds.push(
    EventBus.on<MissionCompletedEvent>('mission:completed', handleMissionCompleted, { priority: 10 })
  )

  // Subscribe to character events
  state.subscriptionIds.push(
    EventBus.on<CharacterHospitalizedEvent>('character:hospitalized', handleCharacterHospitalized, { priority: 5 })
  )

  // Subscribe to reputation events
  state.subscriptionIds.push(
    EventBus.on<ReputationChangedEvent>(
      ['reputation:fame-changed', 'reputation:notoriety-changed'],
      handleReputationChanged,
      { priority: 5 }
    )
  )

  // Subscribe to daily time events for ambient news
  state.subscriptionIds.push(
    EventBus.on<TimePassedEvent>('time:day-passed', handleDayPassed, { priority: 1 })
  )

  state.initialized = true
  console.log('[NewsGenerator] Initialized with', state.subscriptionIds.length, 'subscriptions')
}

/**
 * Cleanup news generator subscriptions
 * Call this on app unmount
 */
export function cleanupNewsGenerator(): void {
  if (!state.initialized) return

  console.log('[NewsGenerator] Cleaning up...')

  for (const id of state.subscriptionIds) {
    EventBus.off(id)
  }

  state.subscriptionIds = []
  state.initialized = false
}

/**
 * Check if news generator is initialized
 */
export function isNewsGeneratorInitialized(): boolean {
  return state.initialized
}

/**
 * Get news generator stats
 */
export function getNewsGeneratorStats(): {
  initialized: boolean
  subscriptionCount: number
  lastArticleTime: number
} {
  return {
    initialized: state.initialized,
    subscriptionCount: state.subscriptionIds.length,
    lastArticleTime: state.lastArticleTime
  }
}

export default initNewsGenerator

/**
 * Email System for SuperHero Tactics
 *
 * Handles mission briefings, contact messages, and intel delivery.
 * Emails are generated from game events and can trigger missions.
 *
 * USAGE: Call initEmailSystem() once on app startup.
 */

import { EventBus, GameEvent, MissionCompletedEvent } from './eventBus'
import { useGameStore } from '../stores/enhancedGameStore'

// ============================================================================
// EMAIL TYPES
// ============================================================================

export type EmailCategory =
  | 'mission_briefing'  // Mission assignments
  | 'intel_report'      // Intelligence updates
  | 'contact'           // Handler/contact messages
  | 'news_tip'          // Anonymous tips
  | 'admin'             // Administrative (salary, base)
  | 'personal';         // Character personal messages

export type EmailPriority = 'urgent' | 'normal' | 'low'

export interface Email {
  id: string
  category: EmailCategory
  priority: EmailPriority
  from: EmailSender
  subject: string
  body: string
  attachments: EmailAttachment[]
  timestamp: number
  read: boolean
  starred: boolean
  archived: boolean
  replyOptions?: EmailReplyOption[]  // If email can be replied to
  actionable?: {
    type: 'accept_mission' | 'decline_mission' | 'view_intel' | 'reply'
    missionId?: string
    data?: any
  }
}

export interface EmailSender {
  name: string
  email: string
  organization?: string
  avatar?: string
}

export interface EmailAttachment {
  id: string
  name: string
  type: 'dossier' | 'map' | 'photo' | 'document' | 'intel'
  data: any
}

export interface EmailReplyOption {
  id: string
  label: string
  response: string
  effect?: {
    reputation?: number
    relationship?: number
    triggersMission?: boolean
  }
}

// ============================================================================
// PREDEFINED SENDERS
// ============================================================================

export const EMAIL_SENDERS: Record<string, EmailSender> = {
  handler: {
    name: 'Agent Handler',
    email: 'handler@ops.secure',
    organization: 'Operations',
    avatar: '👤'
  },
  intel: {
    name: 'Intelligence Division',
    email: 'intel@ops.secure',
    organization: 'Operations',
    avatar: '🔍'
  },
  admin: {
    name: 'Admin Office',
    email: 'admin@ops.secure',
    organization: 'Operations',
    avatar: '📋'
  },
  anonymous: {
    name: 'Anonymous',
    email: 'encrypted@unknown.onion',
    avatar: '🎭'
  },
  news: {
    name: 'News Tip Line',
    email: 'tips@dailynews.com',
    organization: 'Daily News',
    avatar: '📰'
  },
  police: {
    name: 'Police Liaison',
    email: 'liaison@police.gov',
    organization: 'Law Enforcement',
    avatar: '👮'
  }
}

// ============================================================================
// EMAIL STATE
// ============================================================================

interface EmailSystemState {
  initialized: boolean
  subscriptionIds: string[]
  emails: Email[]
  lastEmailId: number
}

const state: EmailSystemState = {
  initialized: false,
  subscriptionIds: [],
  emails: [],
  lastEmailId: 0
}

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

/**
 * Create a new email
 */
export function createEmail(
  category: EmailCategory,
  from: EmailSender,
  subject: string,
  body: string,
  options?: {
    priority?: EmailPriority
    attachments?: EmailAttachment[]
    replyOptions?: EmailReplyOption[]
    actionable?: Email['actionable']
  }
): Email {
  state.lastEmailId++
  const email: Email = {
    id: `email-${state.lastEmailId}-${Date.now()}`,
    category,
    priority: options?.priority || 'normal',
    from,
    subject,
    body,
    attachments: options?.attachments || [],
    timestamp: Date.now(),
    read: false,
    starred: false,
    archived: false,
    replyOptions: options?.replyOptions,
    actionable: options?.actionable
  }

  state.emails.unshift(email)  // Add to front
  return email
}

/**
 * Get all emails
 */
export function getAllEmails(): Email[] {
  return state.emails.filter(e => !e.archived)
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  return state.emails.filter(e => !e.read && !e.archived).length
}

/**
 * Get emails by category
 */
export function getEmailsByCategory(category: EmailCategory): Email[] {
  return state.emails.filter(e => e.category === category && !e.archived)
}

/**
 * Mark email as read
 */
export function markEmailRead(emailId: string): void {
  const email = state.emails.find(e => e.id === emailId)
  if (email) {
    email.read = true
  }
}

/**
 * Star/unstar email
 */
export function toggleEmailStar(emailId: string): void {
  const email = state.emails.find(e => e.id === emailId)
  if (email) {
    email.starred = !email.starred
  }
}

/**
 * Archive email
 */
export function archiveEmail(emailId: string): void {
  const email = state.emails.find(e => e.id === emailId)
  if (email) {
    email.archived = true
  }
}

/**
 * Delete email
 */
export function deleteEmail(emailId: string): void {
  const index = state.emails.findIndex(e => e.id === emailId)
  if (index !== -1) {
    state.emails.splice(index, 1)
  }
}

// ============================================================================
// EMAIL GENERATION
// ============================================================================

/**
 * Generate mission briefing email
 */
export function generateMissionBriefing(
  missionName: string,
  missionId: string,
  description: string,
  location: { city: string; country: string },
  reward: number
): Email {
  const body = `
MISSION BRIEFING
================

Target: ${missionName}
Location: ${location.city}, ${location.country}
Reward: $${reward.toLocaleString()}

SITUATION:
${description}

OBJECTIVE:
Complete the assigned mission objectives.

AUTHORIZATION:
This mission is authorized at the highest level. Proceed with caution.

Report to the Operations Center for deployment.

- Handler
`.trim()

  return createEmail(
    'mission_briefing',
    EMAIL_SENDERS.handler,
    `MISSION: ${missionName}`,
    body,
    {
      priority: 'urgent',
      actionable: {
        type: 'accept_mission',
        missionId
      },
      replyOptions: [
        {
          id: 'accept',
          label: 'Accept Mission',
          response: 'Acknowledged. Preparing for deployment.',
          effect: { triggersMission: true }
        },
        {
          id: 'decline',
          label: 'Decline Mission',
          response: 'Unable to take this mission at this time.',
          effect: { reputation: -5 }
        }
      ]
    }
  )
}

/**
 * Generate intel report email
 */
export function generateIntelReport(
  topic: string,
  intel: string,
  source: string
): Email {
  const body = `
INTELLIGENCE REPORT
==================

Classification: CONFIDENTIAL
Source: ${source}

SUMMARY:
${intel}

This intelligence is time-sensitive. Act accordingly.

- Intel Division
`.trim()

  return createEmail(
    'intel_report',
    EMAIL_SENDERS.intel,
    `INTEL: ${topic}`,
    body,
    {
      priority: 'normal',
      actionable: {
        type: 'view_intel'
      }
    }
  )
}

/**
 * Generate after-action report email
 */
export function generateAfterActionReport(
  missionName: string,
  success: boolean,
  casualties: number,
  reward: number
): Email {
  const body = `
AFTER-ACTION REPORT
==================

Mission: ${missionName}
Status: ${success ? 'SUCCESS' : 'FAILURE'}
Casualties: ${casualties}
Reward: ${success ? `$${reward.toLocaleString()} credited to account` : 'None (mission failed)'}

${success
  ? 'Well done. Your performance has been noted.'
  : 'Mission failure has been logged. Review tactical approach for future operations.'
}

- Operations
`.trim()

  return createEmail(
    'admin',
    EMAIL_SENDERS.handler,
    `AAR: ${missionName} - ${success ? 'SUCCESS' : 'FAILURE'}`,
    body,
    {
      priority: success ? 'normal' : 'urgent'
    }
  )
}

/**
 * Generate tip email from anonymous source
 */
export function generateAnonymousTip(
  topic: string,
  tip: string
): Email {
  const body = `
You don't know me. You shouldn't try to find me.

I have information you need:

${tip}

Do what you want with this. I won't contact you again.
`.trim()

  return createEmail(
    'news_tip',
    EMAIL_SENDERS.anonymous,
    topic,
    body,
    {
      priority: 'normal'
    }
  )
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle mission completed - send after-action report
 */
function handleMissionCompleted(event: MissionCompletedEvent): void {
  const { success, missionName, rewards, casualties } = event.data

  generateAfterActionReport(
    missionName,
    success,
    casualties?.length || 0,
    rewards?.cash || 0
  )

  // Notify the store about new email
  const store = useGameStore.getState()
  store.addNotification({
    type: 'handler',
    priority: 'low',
    title: 'New Email',
    message: `After-action report received for ${missionName}`,
    data: {}
  })
}

/**
 * Handle investigation discovered - send intel tip
 */
function handleInvestigationDiscovered(event: GameEvent): void {
  const { title, difficulty } = event.data

  if (Math.random() < 0.5) {  // 50% chance to get anonymous tip
    generateAnonymousTip(
      'Regarding recent activity...',
      `Word on the street is something's going down. "${title}" might be worth looking into. Be careful.`
    )
  }
}

/**
 * Handle day passed - possible random email
 */
function handleDayPassed(event: GameEvent): void {
  // 10% chance to receive a random email each day
  if (Math.random() > 0.10) return

  const emailTypes = [
    () => generateIntelReport(
      'Weekly Briefing',
      'Routine patrol activities this week. No major incidents to report. Remain vigilant.',
      'OSINT Analysis'
    ),
    () => generateAnonymousTip(
      'Interesting...',
      'Things are heating up in the underworld. Something big is coming. Just thought you should know.'
    )
  ]

  const generator = emailTypes[Math.floor(Math.random() * emailTypes.length)]
  generator()
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize email system and subscribe to EventBus
 * Call this once on app startup
 */
export function initEmailSystem(): void {
  if (state.initialized) {
    console.log('[EmailSystem] Already initialized')
    return
  }

  console.log('[EmailSystem] Initializing...')

  // Create initial welcome email
  createEmail(
    'admin',
    EMAIL_SENDERS.handler,
    'Welcome to Operations',
    `Welcome, operative.

Your secure email account is now active. You will receive mission briefings, intelligence reports, and important communications through this channel.

Keep your inbox monitored. Time-sensitive missions will be sent here.

Stay vigilant.

- Your Handler`,
    { priority: 'normal' }
  )

  // Subscribe to mission completed
  state.subscriptionIds.push(
    EventBus.on<MissionCompletedEvent>('mission:completed', handleMissionCompleted, { priority: 3 })
  )

  // Subscribe to investigation discovered
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('investigation:discovered', handleInvestigationDiscovered, { priority: 3 })
  )

  // Subscribe to day passed for random emails
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('time:day-passed', handleDayPassed, { priority: 2 })
  )

  state.initialized = true
  console.log('[EmailSystem] Initialized with', state.subscriptionIds.length, 'subscriptions')
}

/**
 * Cleanup email system subscriptions
 * Call this on app unmount
 */
export function cleanupEmailSystem(): void {
  if (!state.initialized) return

  console.log('[EmailSystem] Cleaning up...')

  for (const id of state.subscriptionIds) {
    EventBus.off(id)
  }

  state.subscriptionIds = []
  state.initialized = false
}

/**
 * Check if email system is initialized
 */
export function isEmailSystemInitialized(): boolean {
  return state.initialized
}

export default initEmailSystem

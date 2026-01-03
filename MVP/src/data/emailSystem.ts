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

export type AttachmentAspectRatio = '4:3' | '3:4' | '16:9' | '1:1' | 'a4';

// Aspect ratio dimensions for image generation
export const ATTACHMENT_DIMENSIONS: Record<AttachmentAspectRatio, { width: number; height: number }> = {
  '4:3': { width: 800, height: 600 },    // Photo - surveillance, evidence
  '3:4': { width: 600, height: 800 },    // Dossier - character/org portraits
  '16:9': { width: 1280, height: 720 },  // Map - location intel, sector maps
  '1:1': { width: 512, height: 512 },    // Intel - icons, symbols, seals
  'a4': { width: 595, height: 842 },     // Document - reports, files
};

// Default aspect ratio for each attachment type
export const ATTACHMENT_TYPE_RATIOS: Record<string, AttachmentAspectRatio> = {
  photo: '4:3',
  dossier: '3:4',
  map: '16:9',
  intel: '1:1',
  document: 'a4',
};

export interface EmailAttachment {
  id: string
  name: string
  type: 'dossier' | 'map' | 'photo' | 'document' | 'intel'
  aspectRatio: AttachmentAspectRatio
  imageUrl?: string           // Generated image URL
  thumbnailUrl?: string       // Smaller preview version
  caption?: string            // Display caption
  data: any                   // Structured data for display
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
  lastEmailId: number
}

const state: EmailSystemState = {
  initialized: false,
  subscriptionIds: [],
  lastEmailId: 0
}

// Lazy import to avoid circular dependency
let _store: any = null
function getStore() {
  if (!_store) {
    _store = require('../stores/enhancedGameStore').useGameStore
  }
  return _store.getState()
}

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

/**
 * Create a new email (persisted to store)
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

  // Add to store for persistence
  getStore().addEmail(email)
  return email
}

/**
 * Get all emails (from store)
 */
export function getAllEmails(): Email[] {
  return getStore().getEmails()
}

/**
 * Get unread count (from store)
 */
export function getUnreadCount(): number {
  return getStore().getEmailUnreadCount()
}

/**
 * Get emails by category (from store)
 */
export function getEmailsByCategory(category: EmailCategory): Email[] {
  const store = getStore()
  return store.emails.filter((e: Email) => e.category === category && !e.archived)
}

/**
 * Mark email as read (persisted to store)
 */
export function markEmailRead(emailId: string): void {
  getStore().updateEmail(emailId, { read: true })
}

/**
 * Star/unstar email (persisted to store)
 */
export function toggleEmailStar(emailId: string): void {
  const store = getStore()
  const email = store.emails.find((e: Email) => e.id === emailId)
  if (email) {
    store.updateEmail(emailId, { starred: !email.starred })
  }
}

/**
 * Archive email (persisted to store)
 */
export function archiveEmail(emailId: string): void {
  getStore().updateEmail(emailId, { archived: true })
}

/**
 * Delete email (persisted to store)
 */
export function deleteEmail(emailId: string): void {
  getStore().deleteEmail(emailId)
}

/**
 * Create an email attachment with proper aspect ratio
 */
export function createAttachment(
  type: EmailAttachment['type'],
  name: string,
  data: any,
  options?: {
    imageUrl?: string
    thumbnailUrl?: string
    caption?: string
  }
): EmailAttachment {
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    aspectRatio: ATTACHMENT_TYPE_RATIOS[type],
    imageUrl: options?.imageUrl,
    thumbnailUrl: options?.thumbnailUrl,
    caption: options?.caption,
    data,
  }
}

/**
 * Get dimensions for an attachment type (for image generation)
 */
export function getAttachmentDimensions(type: EmailAttachment['type']): { width: number; height: number } {
  const ratio = ATTACHMENT_TYPE_RATIOS[type];
  return ATTACHMENT_DIMENSIONS[ratio];
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

/**
 * Generate faction reaction email when standing changes
 * Shaun Lyng: "Decisions should have visible consequences"
 */
export function generateFactionReactionEmail(
  factionName: string,
  factionType: 'government' | 'criminal' | 'corporate' | 'civilian' | 'superhuman',
  standingChange: number,
  newStanding: number,
  reason: string
): Email {
  // Determine reaction tone based on standing change
  const positive = standingChange > 0
  const threshold = newStanding >= 75 ? 'allied' :
                   newStanding >= 50 ? 'friendly' :
                   newStanding >= 25 ? 'neutral' :
                   newStanding >= 0 ? 'suspicious' : 'hostile'

  // Generate appropriate sender based on faction type
  const senders: Record<string, EmailSender> = {
    government: { name: 'Government Liaison', email: 'liaison@gov.secure', organization: factionName, avatar: '🏛️' },
    criminal: { name: 'Unknown Contact', email: 'anon@darkweb.onion', organization: 'Underground', avatar: '🎭' },
    corporate: { name: 'Corporate Affairs', email: 'pr@corp.secure', organization: factionName, avatar: '🏢' },
    civilian: { name: 'Community Rep', email: 'community@local.org', organization: 'Citizens', avatar: '👥' },
    superhuman: { name: 'Meta Affairs', email: 'meta@registry.gov', organization: 'Meta Registry', avatar: '⚡' }
  }

  const sender = senders[factionType] || EMAIL_SENDERS.anonymous

  // Generate body based on reaction
  let body: string
  if (positive) {
    body = `
FACTION STANDING UPDATE
=======================

${factionName} - Standing: ${threshold.toUpperCase()}

Your recent actions have been noted favorably:
"${reason}"

Current standing with ${factionName}: ${newStanding}%
${newStanding >= 75 ? '\nYou are now considered an ally. Special opportunities may become available.' : ''}
${newStanding >= 50 && newStanding < 75 ? '\nYou are viewed positively. Continue building trust.' : ''}

- ${factionName} Relations
`.trim()
  } else {
    body = `
FACTION STANDING UPDATE
=======================

${factionName} - Standing: ${threshold.toUpperCase()}

Your recent actions have caused concern:
"${reason}"

Current standing with ${factionName}: ${newStanding}%
${newStanding < 0 ? '\n⚠️ WARNING: You are now considered hostile. Expect consequences.' : ''}
${newStanding >= 0 && newStanding < 25 ? '\nYou are being watched closely. Further incidents will escalate.' : ''}

- ${factionName} Relations
`.trim()
  }

  return createEmail(
    'intel_report',
    sender,
    `${factionName}: ${positive ? '↑' : '↓'} Standing ${standingChange > 0 ? '+' : ''}${standingChange}%`,
    body,
    {
      priority: newStanding < 0 ? 'urgent' : 'normal'
    }
  )
}

/**
 * Generate consequence warning email
 * Shaun Lyng: "Foreshadow consequences through character messages"
 */
export function generateConsequenceEmail(
  consequenceType: 'police_response' | 'swat_alert' | 'bounty_posted' | 'faction_retaliation' | 'media_attention',
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: { location?: string; timeframe?: string; source?: string; amount?: number }
): Email {
  const templates: Record<string, { subject: string; body: string; sender: EmailSender }> = {
    police_response: {
      subject: '⚠️ Police Activity Alert',
      body: `
URGENT INTELLIGENCE
==================

Local law enforcement is responding to recent activity${details.location ? ` in ${details.location}` : ''}.

Expected response level: ${severity.toUpperCase()}
${details.timeframe ? `ETA: ${details.timeframe}` : 'Response is imminent.'}

Recommend extraction or laying low until heat dies down.

- Intel Division
`.trim(),
      sender: EMAIL_SENDERS.intel
    },
    swat_alert: {
      subject: '🚨 SWAT TEAM EN ROUTE',
      body: `
CRITICAL INTELLIGENCE
====================

SWAT tactical team has been deployed${details.location ? ` to ${details.location}` : ''}.

Threat level: ${severity.toUpperCase()}
${details.timeframe ? `ETA: ${details.timeframe}` : 'Arrival imminent.'}

This is not a drill. Recommend immediate extraction.

Heavy resistance expected. Avoid engagement if possible.

- Intel Division
`.trim(),
      sender: EMAIL_SENDERS.intel
    },
    bounty_posted: {
      subject: '💰 Bounty Alert',
      body: `
INTELLIGENCE REPORT
==================

A bounty has been posted${details.source ? ` by ${details.source}` : ''}.

Amount: $${(details.amount || 50000).toLocaleString()}
Priority: ${severity.toUpperCase()}

${severity === 'critical' ? 'Expect professional hunters. Watch your back.' : 'Low-level operatives may attempt collection.'}

- Intel Division
`.trim(),
      sender: EMAIL_SENDERS.intel
    },
    faction_retaliation: {
      subject: '⚔️ Retaliation Warning',
      body: `
URGENT INTELLIGENCE
==================

${details.source || 'Hostile faction'} is planning retaliation${details.location ? ` targeting ${details.location}` : ''}.

Threat level: ${severity.toUpperCase()}
${details.timeframe ? `Expected timeframe: ${details.timeframe}` : 'Timing unknown.'}

Increase security posture. Consider preemptive measures.

- Intel Division
`.trim(),
      sender: EMAIL_SENDERS.intel
    },
    media_attention: {
      subject: '📰 Media Coverage Alert',
      body: `
INTELLIGENCE REPORT
==================

Your activities have attracted media attention.

Coverage level: ${severity.toUpperCase()}
${details.source ? `Primary source: ${details.source}` : 'Multiple outlets covering.'}

${severity === 'critical' ? 'You are now a major news story. Public opinion will shift.' :
  severity === 'high' ? 'Expect increased scrutiny. Consider media management.' :
  'Minor coverage. May affect local reputation.'}

- Intel Division
`.trim(),
      sender: EMAIL_SENDERS.news
    }
  }

  const template = templates[consequenceType] || templates.police_response

  return createEmail(
    'intel_report',
    template.sender,
    template.subject,
    template.body,
    {
      priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'urgent' : 'normal'
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

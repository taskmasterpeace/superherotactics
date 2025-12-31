/**
 * Investigation Patterns - Pattern Detection for Investigation Board
 *
 * Patterns are detected when articles/clues on the board share common tags
 * and are connected. When a pattern is detected, it unlocks a hidden investigation.
 */

// =============================================================================
// BOARD ITEM TYPES
// =============================================================================

export interface BoardItem {
  id: string
  type: 'article' | 'clue' | 'note'
  sourceId: string          // Article ID, Clue ID, or generated for notes
  position: { x: number; y: number }
  title: string
  summary: string
  tags: string[]            // For pattern matching: 'gang', 'violence', 'politician', etc.
  pinned: boolean
  color?: string            // Optional custom color
  createdAt: number
}

// =============================================================================
// CONNECTION TYPES
// =============================================================================

export type ConnectionType = 'suspect' | 'location' | 'method' | 'timing' | 'motive' | 'evidence' | 'custom'

export interface BoardConnection {
  id: string
  fromId: string
  toId: string
  connectionType: ConnectionType
  label?: string
  color: string
}

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  suspect: '#dc2626',      // Red
  location: '#2563eb',     // Blue
  method: '#16a34a',       // Green
  timing: '#ca8a04',       // Yellow
  motive: '#9333ea',       // Purple
  evidence: '#0891b2',     // Cyan
  custom: '#6b7280',       // Gray
}

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  suspect: 'Same Suspect',
  location: 'Same Location',
  method: 'Similar Method',
  timing: 'Same Timeframe',
  motive: 'Related Motive',
  evidence: 'Shared Evidence',
  custom: 'Connected',
}

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

export interface InvestigationPattern {
  id: string
  name: string
  description: string
  requiredTags: string[]          // Tags that must be present across items
  requiredConnections: number     // Minimum connections needed
  minItems: number                // Minimum items needed
  unlocksInvestigationId: string  // ID of investigation template to unlock
  difficulty: number              // 1-10
  reward: {
    fame: number
    cash: number
    intel?: string
  }
}

// All detectable patterns
export const INVESTIGATION_PATTERNS: InvestigationPattern[] = [
  // Crime Patterns
  {
    id: 'gang_war_pattern',
    name: 'Gang War Brewing',
    description: 'Multiple gang-related incidents suggest territorial conflict is imminent',
    requiredTags: ['gang', 'violence', 'territory'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'gang_war_brewing',
    difficulty: 4,
    reward: { fame: 25, cash: 5000 },
  },
  {
    id: 'drug_network_pattern',
    name: 'Drug Distribution Network',
    description: 'Pattern of drug activity suggests organized distribution operation',
    requiredTags: ['drugs', 'trafficking', 'money'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'drug_distribution_ring',
    difficulty: 5,
    reward: { fame: 30, cash: 8000 },
  },
  {
    id: 'serial_crimes_pattern',
    name: 'Serial Criminal',
    description: 'Similar crimes across locations suggest a single perpetrator',
    requiredTags: ['crime', 'pattern', 'serial'],
    requiredConnections: 3,
    minItems: 3,
    unlocksInvestigationId: 'serial_robbery_crew',
    difficulty: 6,
    reward: { fame: 40, cash: 10000, intel: 'criminal_modus_operandi' },
  },

  // Conspiracy Patterns
  {
    id: 'corruption_pattern',
    name: 'Political Corruption Ring',
    description: 'Suspicious financial dealings involving government officials',
    requiredTags: ['politician', 'money', 'contract'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'political_corruption_ring',
    difficulty: 8,
    reward: { fame: 50, cash: 15000, intel: 'political_blackmail' },
  },
  {
    id: 'corporate_coverup_pattern',
    name: 'Corporate Cover-up',
    description: 'Evidence of systematic corporate malfeasance being hidden',
    requiredTags: ['corporation', 'scandal', 'coverup'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'corporate_coverup',
    difficulty: 6,
    reward: { fame: 35, cash: 12000, intel: 'corporate_secrets' },
  },
  {
    id: 'missing_persons_pattern',
    name: 'Missing Persons Network',
    description: 'Multiple disappearances suggest organized criminal activity',
    requiredTags: ['missing', 'kidnapping', 'trafficking'],
    requiredConnections: 3,
    minItems: 3,
    unlocksInvestigationId: 'human_trafficking_operation',
    difficulty: 7,
    reward: { fame: 60, cash: 20000, intel: 'trafficking_routes' },
  },

  // Terrorism Patterns
  {
    id: 'terror_cell_pattern',
    name: 'Terror Cell Activity',
    description: 'Coordinated activities suggest terrorist network presence',
    requiredTags: ['extremist', 'weapons', 'plot'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'extremist_recruitment_cell',
    difficulty: 8,
    reward: { fame: 70, cash: 25000, intel: 'terror_network' },
  },
  {
    id: 'bomb_threat_pattern',
    name: 'Bomb Threat Intelligence',
    description: 'Evidence of explosives acquisition and target planning',
    requiredTags: ['explosives', 'target', 'attack'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'bomb_threat_intelligence',
    difficulty: 9,
    reward: { fame: 80, cash: 30000, intel: 'bomb_locations' },
  },

  // Underworld Patterns
  {
    id: 'new_boss_pattern',
    name: 'New Crime Boss Rising',
    description: 'Power shift in criminal underworld detected',
    requiredTags: ['crime', 'power', 'takeover'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'new_crime_boss_rising',
    difficulty: 6,
    reward: { fame: 35, cash: 10000, intel: 'crime_hierarchy' },
  },

  // Espionage Patterns
  {
    id: 'spy_ring_pattern',
    name: 'Foreign Intelligence Operation',
    description: 'Evidence of foreign spy activity in the area',
    requiredTags: ['spy', 'intelligence', 'foreign'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'foreign_intelligence_operation',
    difficulty: 9,
    reward: { fame: 60, cash: 25000, intel: 'spy_identities' },
  },
  {
    id: 'industrial_espionage_pattern',
    name: 'Industrial Espionage',
    description: 'Corporate secrets being stolen and sold',
    requiredTags: ['corporate', 'theft', 'secrets'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'industrial_espionage',
    difficulty: 7,
    reward: { fame: 40, cash: 18000, intel: 'corporate_intel' },
  },

  // Supernatural Patterns (NEW)
  {
    id: 'cult_activity_pattern',
    name: 'Cult Ritual Activity',
    description: 'Strange occurrences suggest occult group activity',
    requiredTags: ['occult', 'ritual', 'supernatural'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'cult_ritual_activity',
    difficulty: 7,
    reward: { fame: 45, cash: 12000, intel: 'occult_knowledge' },
  },
  {
    id: 'rogue_superhuman_pattern',
    name: 'Rogue Superhuman',
    description: 'Powered individual operating outside the law',
    requiredTags: ['superhuman', 'powers', 'crime'],
    requiredConnections: 2,
    minItems: 2,
    unlocksInvestigationId: 'rogue_superhuman',
    difficulty: 8,
    reward: { fame: 55, cash: 20000, intel: 'power_analysis' },
  },
  {
    id: 'alien_activity_pattern',
    name: 'Alien Activity Cover-up',
    description: 'Evidence of extraterrestrial presence being hidden',
    requiredTags: ['alien', 'coverup', 'government'],
    requiredConnections: 3,
    minItems: 3,
    unlocksInvestigationId: 'alien_activity_coverup',
    difficulty: 10,
    reward: { fame: 100, cash: 50000, intel: 'alien_tech' },
  },
]

// =============================================================================
// BOARD STATE
// =============================================================================

export interface InvestigationBoard {
  id: string
  name: string
  items: BoardItem[]
  connections: BoardConnection[]
  detectedPatterns: string[]    // Pattern IDs that have been found
  unlockedInvestigations: string[]  // Investigation IDs unlocked from this board
  createdAt: number
  lastModified: number
}

// =============================================================================
// TAG CATEGORIES (for filtering/organizing)
// =============================================================================

export const TAG_CATEGORIES = {
  crime: ['gang', 'violence', 'drugs', 'trafficking', 'crime', 'serial', 'theft', 'robbery'],
  political: ['politician', 'government', 'contract', 'corruption', 'coverup', 'scandal'],
  business: ['corporation', 'corporate', 'money', 'business', 'secrets', 'espionage'],
  terror: ['extremist', 'weapons', 'explosives', 'attack', 'plot', 'target', 'bomb'],
  supernatural: ['occult', 'ritual', 'supernatural', 'superhuman', 'powers', 'alien'],
  locations: ['territory', 'border', 'transport', 'warehouse', 'hideout'],
  people: ['missing', 'kidnapping', 'witness', 'suspect', 'victim'],
  intelligence: ['spy', 'intelligence', 'foreign', 'classified', 'intel'],
}

// =============================================================================
// PATTERN DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if a set of items matches a pattern
 */
export function checkPatternMatch(
  items: BoardItem[],
  connections: BoardConnection[],
  pattern: InvestigationPattern
): boolean {
  // Check minimum items
  if (items.length < pattern.minItems) {
    return false
  }

  // Collect all tags from items
  const allTags = new Set<string>()
  items.forEach(item => item.tags.forEach(tag => allTags.add(tag.toLowerCase())))

  // Check if all required tags are present
  const hasAllTags = pattern.requiredTags.every(tag =>
    allTags.has(tag.toLowerCase())
  )

  if (!hasAllTags) {
    return false
  }

  // Count connections between these items
  const itemIds = new Set(items.map(i => i.id))
  const relevantConnections = connections.filter(
    conn => itemIds.has(conn.fromId) && itemIds.has(conn.toId)
  )

  // Check minimum connections
  if (relevantConnections.length < pattern.requiredConnections) {
    return false
  }

  return true
}

/**
 * Scan board for all matching patterns
 */
export function detectPatterns(board: InvestigationBoard): InvestigationPattern[] {
  const detectedPatterns: InvestigationPattern[] = []

  for (const pattern of INVESTIGATION_PATTERNS) {
    // Skip already detected patterns
    if (board.detectedPatterns.includes(pattern.id)) {
      continue
    }

    // Check all possible subsets of items that could match
    if (checkPatternMatch(board.items, board.connections, pattern)) {
      detectedPatterns.push(pattern)
    }
  }

  return detectedPatterns
}

/**
 * Get pattern by ID
 */
export function getPatternById(patternId: string): InvestigationPattern | undefined {
  return INVESTIGATION_PATTERNS.find(p => p.id === patternId)
}

/**
 * Get all patterns that could potentially match with current items
 * (shows which patterns are "close" to being detected)
 */
export function getNearPatterns(board: InvestigationBoard): Array<{
  pattern: InvestigationPattern
  matchedTags: string[]
  missingTags: string[]
  connectionCount: number
  connectionsNeeded: number
}> {
  const results: Array<{
    pattern: InvestigationPattern
    matchedTags: string[]
    missingTags: string[]
    connectionCount: number
    connectionsNeeded: number
  }> = []

  // Collect all tags
  const allTags = new Set<string>()
  board.items.forEach(item => item.tags.forEach(tag => allTags.add(tag.toLowerCase())))

  for (const pattern of INVESTIGATION_PATTERNS) {
    // Skip already detected
    if (board.detectedPatterns.includes(pattern.id)) {
      continue
    }

    const matchedTags = pattern.requiredTags.filter(tag => allTags.has(tag.toLowerCase()))
    const missingTags = pattern.requiredTags.filter(tag => !allTags.has(tag.toLowerCase()))

    // Only show patterns that have at least 1 matching tag
    if (matchedTags.length > 0) {
      results.push({
        pattern,
        matchedTags,
        missingTags,
        connectionCount: board.connections.length,
        connectionsNeeded: pattern.requiredConnections,
      })
    }
  }

  // Sort by how close to completion (fewer missing tags first)
  results.sort((a, b) => a.missingTags.length - b.missingTags.length)

  return results
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a new empty board
 */
export function createBoard(name: string): InvestigationBoard {
  return {
    id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    items: [],
    connections: [],
    detectedPatterns: [],
    unlockedInvestigations: [],
    createdAt: Date.now(),
    lastModified: Date.now(),
  }
}

/**
 * Create a board item from a news article
 */
export function createArticleItem(
  article: { id: string; headline: string; summary?: string; tags?: string[] },
  position: { x: number; y: number }
): BoardItem {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'article',
    sourceId: article.id,
    position,
    title: article.headline,
    summary: article.summary || '',
    tags: article.tags || [],
    pinned: true,
    createdAt: Date.now(),
  }
}

/**
 * Create a board item from an investigation clue
 */
export function createClueItem(
  clue: { id: string; description: string; relatesTo?: string[] },
  position: { x: number; y: number }
): BoardItem {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'clue',
    sourceId: clue.id,
    position,
    title: 'Clue',
    summary: clue.description,
    tags: clue.relatesTo || [],
    pinned: true,
    createdAt: Date.now(),
  }
}

/**
 * Create a custom note item
 */
export function createNoteItem(
  text: string,
  position: { x: number; y: number },
  tags: string[] = []
): BoardItem {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'note',
    sourceId: '',
    position,
    title: 'Note',
    summary: text,
    tags,
    pinned: true,
    createdAt: Date.now(),
  }
}

/**
 * Create a connection between two items
 */
export function createConnection(
  fromId: string,
  toId: string,
  connectionType: ConnectionType,
  label?: string
): BoardConnection {
  return {
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fromId,
    toId,
    connectionType,
    label,
    color: CONNECTION_COLORS[connectionType],
  }
}

/**
 * Export the board data for sharing/saving
 */
export function exportBoard(board: InvestigationBoard): string {
  return JSON.stringify(board, null, 2)
}

/**
 * Import a board from JSON
 */
export function importBoard(json: string): InvestigationBoard | null {
  try {
    const board = JSON.parse(json) as InvestigationBoard
    // Validate required fields
    if (!board.id || !board.name || !Array.isArray(board.items)) {
      return null
    }
    return board
  } catch {
    return null
  }
}

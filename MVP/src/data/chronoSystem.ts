/**
 * Chronos System - Diegetic time-travel save/load
 *
 * The only save/load in the game: your nation's time traveler jumps the
 * timeline back to a captured anchor. Rewinds cost sanity, shrink the
 * destination horizon, and are recovered by playing forward (realignment).
 *
 * Snapshots capture the FULL game state (enhancedGameStore + underworldStore
 * + territory system) from outside the stores via getState/setState, so no
 * store code needs to know about Chronos. Design source: docs/design/29.
 */

import { useGameStore } from '../stores/enhancedGameStore'
import { useUnderworldStore } from '../stores/underworldStore'
import { EventBus, TimePassedEvent } from './eventBus'
import { getTerritorySnapshot, restoreTerritorySnapshot } from './territorySystem'
import { createNewsArticle } from './newsSystem'

// ============================================================================
// TUNABLES (docs/design/29-time-travel-save.md §3.1 — RULING values)
// ============================================================================

export const CHRONO_TUNABLES = {
  SANITY_MAX: 100,
  SANITY_START: 100,
  MADNESS_FLOOR: 20,             // sanity <= floor => 'mad', rewinds locked
  SANITY_COST_PAST_REWIND: 20,   // 4 free rewinds from full before madness
  DESTINATION_START: 8,          // reachable checkpoints at campaign start
  DESTINATION_LOSS_PER_JUMP: 1,  // horizon shrinks per rewind
  DESTINATION_FLOOR: 1,          // never lose the most recent checkpoint
  REALIGN_DAYS_PER_REFUND: 30,   // clean game-days (no rewinds) per refund tick
  REALIGN_SANITY_PER_REFUND: 10,
  REALIGN_DESTINATION_PER_REFUND: 1,
  MAX_SNAPSHOTS: 20,             // ring buffer cap (criteria B3)
} as const

// ============================================================================
// TYPES
// ============================================================================

export type SnapshotCause = 'auto_daily' | 'auto_mission' | 'auto_combat' | 'manual' | 'system'

export interface TimelineSnapshot {
  snapshotId: string
  schemaVersion: 1
  gameDay: number
  gameHour: number
  realCapturedAt: number         // real-world ms, for travel-timestamp rebasing
  label: string
  cause: SnapshotCause
  reachable: boolean
  pinned: boolean
  integrityHash: string
  budget: number                 // header info for the UI list
  squadStatus: string
  rosterSize: number
  state: SerializedBlob          // enhancedGameStore data slices
  underworld: SerializedBlob     // underworldStore data slices
  territory: SerializedBlob      // territorySystem module state
}

export interface TimeWalkerState {
  travelerId: string
  travelerName: string
  nationIso: string
  sanity: number
  sanityMax: number
  jumpsTaken: number
  destinationRefunds: number
  cleanDayCounter: number        // consecutive game-days without a rewind
  lastSeenDay: number
  state: 'present' | 'mad'
}

export type RewindResult =
  | { ok: true; landedDay: number; sanityAfter: number; destinationsAfter: number }
  | { ok: false; reason: 'walker_mad' | 'unreachable_destination' | 'no_snapshot' | 'corrupt_snapshot' }

type SerializedBlob = Record<string, any>

const STORAGE_KEY = 'sht_chronos_v1'
const MAP_MARKER = '__sht_map__'

// ============================================================================
// MODULE STATE (deliberately OUTSIDE the snapshot — the meter must remember
// the rewind happened even after state is restored; spec §3.5 E5)
// ============================================================================

interface ChronoState {
  initialized: boolean
  subscriptionIds: string[]
  snapshots: TimelineSnapshot[]
  walker: TimeWalkerState
  lastDailyCaptureDay: number
}

const chrono: ChronoState = {
  initialized: false,
  subscriptionIds: [],
  snapshots: [],
  walker: defaultWalker(),
  lastDailyCaptureDay: 0,
}

function defaultWalker(): TimeWalkerState {
  return {
    travelerId: 'the_visitor',
    travelerName: 'The Visitor',
    nationIso: '',
    sanity: CHRONO_TUNABLES.SANITY_START,
    sanityMax: CHRONO_TUNABLES.SANITY_MAX,
    jumpsTaken: 0,
    destinationRefunds: 0,
    cleanDayCounter: 0,
    lastSeenDay: 0,
    state: 'present',
  }
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/** Deep-copy a store state object, dropping functions and converting Maps. */
function serializeState(src: Record<string, any>): SerializedBlob {
  const out: SerializedBlob = {}
  for (const [key, value] of Object.entries(src)) {
    if (typeof value === 'function') continue
    out[key] = encodeValue(value)
  }
  return out
}

function encodeValue(value: any): any {
  if (value instanceof Map) {
    return { [MAP_MARKER]: Array.from(value.entries()).map(([k, v]) => [k, encodeValue(v)]) }
  }
  if (Array.isArray(value)) return value.map(encodeValue)
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'function') continue
      out[k] = encodeValue(v)
    }
    return out
  }
  return value
}

function decodeValue(value: any): any {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) return value.map(decodeValue)
    if (MAP_MARKER in value) {
      return new Map((value[MAP_MARKER] as [any, any][]).map(([k, v]) => [k, decodeValue(v)]))
    }
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) out[k] = decodeValue(v)
    return out
  }
  return value
}

function hashBlob(blob: SerializedBlob): string {
  const str = JSON.stringify(blob)
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash.toString(36)
}

// ============================================================================
// DESTINATION HORIZON (§3.3)
// ============================================================================

export function getDestinationCount(): number {
  const t = CHRONO_TUNABLES
  const raw = t.DESTINATION_START
    - chrono.walker.jumpsTaken * t.DESTINATION_LOSS_PER_JUMP
    + chrono.walker.destinationRefunds
  return Math.max(t.DESTINATION_FLOOR, Math.min(t.DESTINATION_START, raw))
}

/** Recompute reachable flags: the N most recent snapshots plus all pins. */
function recomputeReachability(): void {
  const reachableCount = getDestinationCount()
  const byNewest = [...chrono.snapshots].sort((a, b) => b.realCapturedAt - a.realCapturedAt)
  byNewest.forEach((snap, idx) => {
    snap.reachable = snap.pinned || idx < reachableCount
  })
}

function pruneSnapshots(): void {
  if (chrono.snapshots.length <= CHRONO_TUNABLES.MAX_SNAPSHOTS) return
  const byOldest = [...chrono.snapshots].sort((a, b) => a.realCapturedAt - b.realCapturedAt)
  for (const snap of byOldest) {
    if (chrono.snapshots.length <= CHRONO_TUNABLES.MAX_SNAPSHOTS) break
    if (snap.pinned) continue
    chrono.snapshots = chrono.snapshots.filter(s => s.snapshotId !== snap.snapshotId)
  }
}

// ============================================================================
// CAPTURE
// ============================================================================

let snapshotCounter = 0

export function captureSnapshot(cause: SnapshotCause, label?: string): TimelineSnapshot {
  const game = useGameStore.getState() as Record<string, any>
  const underworld = useUnderworldStore.getState() as Record<string, any>

  const state = serializeState(game)
  const day = game.gameTime?.day ?? 0
  const hour = game.gameTime?.hour ?? 0

  const snapshot: TimelineSnapshot = {
    snapshotId: `chrono_${Date.now()}_${snapshotCounter++}`,
    schemaVersion: 1,
    gameDay: day,
    gameHour: hour,
    realCapturedAt: Date.now(),
    label: label || autoLabel(cause, game),
    cause,
    reachable: true,
    pinned: cause === 'manual',
    integrityHash: hashBlob(state),
    budget: game.budget ?? 0,
    squadStatus: game.squadStatus ?? 'idle',
    rosterSize: Array.isArray(game.characters) ? game.characters.length : 0,
    state,
    underworld: serializeState(underworld),
    territory: encodeValue(getTerritorySnapshot()),
  }

  chrono.snapshots.push(snapshot)
  pruneSnapshots()
  recomputeReachability()
  persist()
  return snapshot
}

function autoLabel(cause: SnapshotCause, game: Record<string, any>): string {
  const day = game.gameTime?.day ?? 0
  switch (cause) {
    case 'auto_daily': return `Dawn of Day ${day}`
    case 'auto_combat': return `Before the ${game.pendingMission?.city || game.currentSector || 'engagement'} fight`
    case 'auto_mission': return `After the operation — Day ${day}`
    case 'system': return `Timeline origin — Day ${day}`
    default: return `Anchor — Day ${day}`
  }
}

// ============================================================================
// REWIND (§3.5)
// ============================================================================

export function rewind(snapshotId: string): RewindResult {
  const t = CHRONO_TUNABLES
  if (chrono.walker.state === 'mad') return { ok: false, reason: 'walker_mad' }

  const snapshot = chrono.snapshots.find(s => s.snapshotId === snapshotId)
  if (!snapshot) return { ok: false, reason: 'no_snapshot' }
  if (!snapshot.reachable) return { ok: false, reason: 'unreachable_destination' }
  if (hashBlob(snapshot.state) !== snapshot.integrityHash) {
    return { ok: false, reason: 'corrupt_snapshot' }
  }

  // Spend sanity FIRST — the meter remembers the rewind even though the
  // world forgets (single mutation point for sanity).
  chrono.walker.sanity = Math.max(0, chrono.walker.sanity - t.SANITY_COST_PAST_REWIND)
  chrono.walker.jumpsTaken += 1
  chrono.walker.cleanDayCounter = 0
  if (chrono.walker.sanity <= t.MADNESS_FLOOR) chrono.walker.state = 'mad'
  recomputeReachability()

  // Restore the world.
  const restored = decodeValue(snapshot.state) as Record<string, any>

  // Rebase real-time travel timestamps so in-flight travel resumes sanely.
  const delta = Date.now() - snapshot.realCapturedAt
  if (Array.isArray(restored.travelingUnits)) {
    restored.travelingUnits = restored.travelingUnits.map((u: any) => ({
      ...u,
      startTime: typeof u.startTime === 'number' ? u.startTime + delta : u.startTime,
      estimatedArrival: typeof u.estimatedArrival === 'number' ? u.estimatedArrival + delta : u.estimatedArrival,
    }))
  }
  restored.isTimePaused = true
  restored.timeSpeed = 0

  useGameStore.setState(restored)
  useUnderworldStore.setState(decodeValue(snapshot.underworld))
  restoreTerritorySnapshot(decodeValue(snapshot.territory))
  persist()

  // The jump lives inside the fiction: anomaly news + notification.
  const store = useGameStore.getState()
  try {
    const article = createNewsArticle(
      'Temporal Anomaly Detected Over ' + (store.selectedCountry || 'Home Nation'),
      'Instruments at three observatories registered an identical chroniton spike before resetting. ' +
      'Officials deny any connection to superhuman activity. Witnesses report a moment of deja vu.',
      'superhuman',
      'major',
      store.gameTime,
      { source: 'Global Science Monitor' }
    )
    store.addNewsArticle(article)
  } catch (e) {
    console.warn('[Chronos] Could not publish anomaly news:', e)
  }

  EventBus.emit({
    id: `chronos-rewind-${Date.now()}`,
    type: 'system:game-loaded',
    category: 'system',
    timestamp: Date.now(),
    data: { snapshotId, landedDay: snapshot.gameDay },
  } as any)

  return {
    ok: true,
    landedDay: snapshot.gameDay,
    sanityAfter: chrono.walker.sanity,
    destinationsAfter: getDestinationCount(),
  }
}

// ============================================================================
// REALIGNMENT (§3.4) — play forward cleanly to recover sanity/destinations
// ============================================================================

function handleDayPassed(event: TimePassedEvent): void {
  const day = event.data?.newTime?.day ?? useGameStore.getState().gameTime.day
  if (day === chrono.walker.lastSeenDay) return
  chrono.walker.lastSeenDay = day

  // Passive realignment tick
  chrono.walker.cleanDayCounter += 1
  if (chrono.walker.cleanDayCounter >= CHRONO_TUNABLES.REALIGN_DAYS_PER_REFUND) {
    chrono.walker.cleanDayCounter = 0
    const t = CHRONO_TUNABLES
    chrono.walker.sanity = Math.min(t.SANITY_MAX, chrono.walker.sanity + t.REALIGN_SANITY_PER_REFUND)
    chrono.walker.destinationRefunds = Math.min(
      t.DESTINATION_START,
      chrono.walker.destinationRefunds + t.REALIGN_DESTINATION_PER_REFUND
    )
    if (chrono.walker.state === 'mad' && chrono.walker.sanity > t.MADNESS_FLOOR) {
      chrono.walker.state = 'present'
    }
    recomputeReachability()
  }

  // One auto anchor per day rollover
  if (day !== chrono.lastDailyCaptureDay) {
    chrono.lastDailyCaptureDay = day
    captureSnapshot('auto_daily')
  }
}

// ============================================================================
// PERSISTENCE (criteria B3: survives refresh, capped)
// ============================================================================

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      snapshots: chrono.snapshots,
      walker: chrono.walker,
      lastDailyCaptureDay: chrono.lastDailyCaptureDay,
    }))
  } catch (e) {
    // Quota: drop the oldest unpinned snapshot and retry once
    const byOldest = [...chrono.snapshots].sort((a, b) => a.realCapturedAt - b.realCapturedAt)
    const victim = byOldest.find(s => !s.pinned)
    if (victim) {
      chrono.snapshots = chrono.snapshots.filter(s => s.snapshotId !== victim.snapshotId)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          snapshots: chrono.snapshots,
          walker: chrono.walker,
          lastDailyCaptureDay: chrono.lastDailyCaptureDay,
        }))
      } catch {
        console.warn('[Chronos] Persistence failed even after pruning')
      }
    }
  }
}

function load(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.snapshots)) chrono.snapshots = parsed.snapshots
    if (parsed.walker) chrono.walker = { ...defaultWalker(), ...parsed.walker }
    if (typeof parsed.lastDailyCaptureDay === 'number') chrono.lastDailyCaptureDay = parsed.lastDailyCaptureDay
    recomputeReachability()
  } catch (e) {
    console.warn('[Chronos] Could not load timeline from storage:', e)
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function initChronoSystem(): void {
  if (chrono.initialized) return
  chrono.initialized = true
  load()

  // The traveler belongs to the player's nation (B5). A flagged roster
  // character takes the role if present; the default Visitor asset means the
  // player is never hard-locked out of time travel.
  const game = useGameStore.getState() as Record<string, any>
  chrono.walker.nationIso = game.selectedCountry || ''
  const rosterTraveler = (game.characters || []).find((c: any) => c.isTimeTraveler)
  if (rosterTraveler) {
    chrono.walker.travelerId = rosterTraveler.id
    chrono.walker.travelerName = rosterTraveler.name
  }

  chrono.subscriptionIds.push(
    EventBus.on('time:day-passed', handleDayPassed as any, { priority: 0 }),
    // Capture BEFORE combat mutates anything (high priority runs first)
    EventBus.on('combat:started', (() => captureSnapshot('auto_combat')) as any, { priority: 10 }),
    EventBus.on('mission:completed', (() => captureSnapshot('auto_mission')) as any, { priority: 0 }),
  )

  // Timeline origin anchor for fresh campaigns
  if (chrono.snapshots.length === 0 && game.gamePhase === 'playing') {
    captureSnapshot('system')
  }

  console.log('⏳ Chronos system initialized —', chrono.snapshots.length, 'anchors,',
    chrono.walker.sanity, 'sanity')
}

export function cleanupChronoSystem(): void {
  chrono.subscriptionIds.forEach(id => EventBus.off(id))
  chrono.subscriptionIds = []
  chrono.initialized = false
}

export function listSnapshots(): TimelineSnapshot[] {
  return [...chrono.snapshots].sort((a, b) => b.realCapturedAt - a.realCapturedAt)
}

export function getTimeWalker(): Readonly<TimeWalkerState> {
  return { ...chrono.walker }
}

export function createManualAnchor(label?: string): TimelineSnapshot {
  return captureSnapshot('manual', label)
}

export function togglePin(snapshotId: string): void {
  const snap = chrono.snapshots.find(s => s.snapshotId === snapshotId)
  if (!snap) return
  snap.pinned = !snap.pinned
  recomputeReachability()
  persist()
}

export function canRewind(): { allowed: boolean; reason?: string } {
  if (chrono.walker.state === 'mad') {
    return { allowed: false, reason: `${chrono.walker.travelerName} is lost in the timestream. Play forward to realign.` }
  }
  return { allowed: true }
}

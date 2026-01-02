/**
 * Combat Results Handler
 * Processes combat completion and integrates results into strategic layer
 *
 * EVENTBUS INTEGRATION: Emits events for News, Hospital, Reputation systems
 *
 * INIT/CLEANUP: Call initCombatResultsHandler() in App.tsx to wire up
 */

import toast from 'react-hot-toast'
import { EnhancedCombatResult, CombatResult, MercDeathEvent } from '../game/EventBridge'
import { EventBridge } from '../game/EventBridge'
import { useGameStore } from './enhancedGameStore'
import { getWeaponsByAvailability, getWeaponsByCost } from '../data/weapons'
import { ALL_ARMOR } from '../data/armor'
import { Weapon, Armor } from '../data/equipmentTypes'
import { EventBus, createCombatEndedEvent } from '../data/eventBus'
import { getDeathConsequencesManager } from '../data/deathConsequences'

// Unsubscribe function for cleanup
let unsubscribeCombatEnded: (() => void) | null = null
let unsubscribeMercDied: (() => void) | null = null

// Track pending death notifications for funeral UI
export const pendingDeathNotifications: MercDeathEvent[] = []

export interface ProcessedCombatResult {
  experienceGained: Array<{
    characterId: string
    characterName: string
    xp: number
    reason: string
  }>
  lootGained: Array<{
    itemId: string
    itemName: string
    itemType: 'weapon' | 'armor' | 'gadget' | 'consumable'
    quantity: number
  }>
  fameChange: number
  collateralDamage: number
  civilianCasualties: number
}

/**
 * Calculate XP rewards for combat participants
 */
export function calculateCombatXP(
  survivors: EnhancedCombatResult['survivors'],
  victory: boolean,
  rounds: number
): ProcessedCombatResult['experienceGained'] {
  const experienceGained: ProcessedCombatResult['experienceGained'] = []

  survivors.forEach(survivor => {
    let totalXP = 0
    const reasons: string[] = []

    // Base XP for survival
    const survivalXP = 10
    totalXP += survivalXP
    reasons.push('survival')

    // XP for kills (20 XP per kill)
    if (survivor.kills > 0) {
      const killXP = survivor.kills * 20
      totalXP += killXP
      reasons.push(`${survivor.kills} kill${survivor.kills > 1 ? 's' : ''}`)
    }

    // XP for damage dealt (1 XP per 10 damage)
    if (survivor.damageDealt > 0) {
      const damageXP = Math.floor(survivor.damageDealt / 10)
      totalXP += damageXP
      reasons.push('damage dealt')
    }

    // Bonus XP for victory (50% bonus)
    if (victory) {
      const victoryBonus = Math.floor(totalXP * 0.5)
      totalXP += victoryBonus
      reasons.push('victory')
    }

    // Penalty for long combat (discourage grinding)
    if (rounds > 10) {
      const penalty = Math.floor(totalXP * 0.2)
      totalXP = Math.max(10, totalXP - penalty)
    }

    experienceGained.push({
      characterId: survivor.characterId,
      characterName: survivor.characterName,
      xp: totalXP,
      reason: reasons.join(', ')
    })
  })

  return experienceGained
}

/**
 * Get random weapon for loot (Common or Restricted only)
 */
function getRandomLootWeapon(): Weapon | null {
  // Get common/restricted weapons that could drop as loot
  const commonWeapons = getWeaponsByAvailability('Common')
  const restrictedWeapons = getWeaponsByAvailability('Restricted')
  const lootableWeapons = [...commonWeapons, ...restrictedWeapons]
    .filter(w => w.costLevel !== 'Ultra_High' && w.costLevel !== 'Very_High')

  if (lootableWeapons.length === 0) return null
  return lootableWeapons[Math.floor(Math.random() * lootableWeapons.length)]
}

/**
 * Get random armor for loot
 */
function getRandomLootArmor(): Armor | null {
  // Get common armor only
  const lootableArmor = ALL_ARMOR.filter(
    a => a.availability === 'Common' &&
         a.costLevel !== 'Ultra_High' &&
         a.costLevel !== 'Very_High'
  )

  if (lootableArmor.length === 0) return null
  return lootableArmor[Math.floor(Math.random() * lootableArmor.length)]
}

/**
 * Enemy casualty info for loot extraction
 */
export interface EnemyCasualty {
  enemyId: string
  enemyName: string
  faction?: string
  outcome: 'killed' | 'surrendered' | 'fled' | 'unconscious'
  equipment: {
    weapons: string[]
    armor: string | null
    items: string[]
  }
}

/**
 * Generate loot from ACTUAL enemy equipment
 * Only loot from killed or surrendered enemies - fled enemies keep their gear!
 */
export function generateCombatLoot(
  victory: boolean,
  enemyCasualties: EnemyCasualty[] = [],
  rounds: number
): ProcessedCombatResult['lootGained'] {
  if (!victory) return []

  const loot: ProcessedCombatResult['lootGained'] = []
  const lootMap = new Map<string, { name: string; type: 'weapon' | 'armor' | 'consumable'; count: number }>()

  // Only loot from killed or surrendered enemies
  const lootableEnemies = enemyCasualties.filter(
    e => e.outcome === 'killed' || e.outcome === 'surrendered'
  )

  // Extract actual equipment from each lootable enemy
  for (const enemy of lootableEnemies) {
    // Get weapons - look up actual weapon data
    for (const weaponId of enemy.equipment.weapons) {
      const weapon = getWeaponById(weaponId)
      if (weapon) {
        const key = weapon.id
        const existing = lootMap.get(key)
        if (existing) {
          existing.count++
        } else {
          lootMap.set(key, { name: weapon.name, type: 'weapon', count: 1 })
        }
      }
    }

    // Get armor - look up actual armor data
    if (enemy.equipment.armor) {
      const armor = getArmorById(enemy.equipment.armor)
      if (armor) {
        const key = armor.id
        const existing = lootMap.get(key)
        if (existing) {
          existing.count++
        } else {
          lootMap.set(key, { name: armor.name, type: 'armor', count: 1 })
        }
      }
    }

    // Get other items (ammo, consumables)
    for (const itemId of enemy.equipment.items) {
      const existing = lootMap.get(itemId)
      if (existing) {
        existing.count++
      } else {
        // Assume it's a consumable if not weapon/armor
        lootMap.set(itemId, { name: itemId, type: 'consumable', count: 1 })
      }
    }
  }

  // Convert map to loot array
  for (const [itemId, data] of lootMap.entries()) {
    loot.push({
      itemId,
      itemName: data.name,
      itemType: data.type,
      quantity: data.count
    })
  }

  // If no enemy data provided (legacy support), fall back to random loot
  if (enemyCasualties.length === 0) {
    console.warn('[LOOT] No enemy casualty data - using legacy random loot')
    return generateLegacyRandomLoot(rounds)
  }

  return loot
}

/**
 * Legacy random loot for backwards compatibility
 */
function generateLegacyRandomLoot(rounds: number): ProcessedCombatResult['lootGained'] {
  const loot: ProcessedCombatResult['lootGained'] = []

  // Random weapon chance
  if (Math.random() < 0.3) {
    const weapon = getRandomLootWeapon()
    if (weapon) {
      loot.push({ itemId: weapon.id, itemName: weapon.name, itemType: 'weapon', quantity: 1 })
    }
  }

  // Random armor chance
  if (Math.random() < 0.2) {
    const armor = getRandomLootArmor()
    if (armor) {
      loot.push({ itemId: armor.id, itemName: armor.name, itemType: 'armor', quantity: 1 })
    }
  }

  // Some medkits
  loot.push({ itemId: 'medkit', itemName: 'Medkit', itemType: 'consumable', quantity: 1 })

  return loot
}

/**
 * Get weapon by ID from database
 */
function getWeaponById(weaponId: string): Weapon | null {
  const allWeapons = [...getWeaponsByAvailability('Common'), ...getWeaponsByAvailability('Restricted'), ...getWeaponsByAvailability('Military')]
  return allWeapons.find(w => w.id === weaponId || w.name.replace(/\s+/g, '_') === weaponId) || null
}

/**
 * Get armor by ID from database
 */
function getArmorById(armorId: string): Armor | null {
  return ALL_ARMOR.find(a => a.id === armorId || a.name.replace(/\s+/g, '_') === armorId) || null
}

/**
 * Calculate fame change based on combat outcome
 */
export function calculateFameChange(
  victory: boolean,
  casualties: number,
  civilianCasualties: number,
  collateralDamage: number,
  currentFame: number
): number {
  let fameChange = 0

  if (victory) {
    // Base fame for victory
    fameChange = 15 + Math.floor(Math.random() * 10) // 15-25

    // Bonus for clean victory (no civilian casualties)
    if (civilianCasualties === 0) {
      fameChange += 10
    }

    // Penalty for civilian casualties (severe)
    if (civilianCasualties > 0) {
      fameChange -= civilianCasualties * 10
    }

    // Penalty for collateral damage
    if (collateralDamage > 50000) {
      fameChange -= Math.floor(collateralDamage / 10000)
    }

    // Diminishing returns at high fame
    if (currentFame > 500) {
      fameChange = Math.floor(fameChange * 0.5)
    }
  } else {
    // Lost combat = fame loss
    fameChange = -20 - Math.floor(Math.random() * 15) // -20 to -35

    // Additional penalty if you had civilian casualties while losing
    if (civilianCasualties > 0) {
      fameChange -= civilianCasualties * 5
    }
  }

  return fameChange
}

/**
 * Main handler for combat completion
 * Integrates all combat results into strategic layer
 */
export function handleCombatComplete(result: EnhancedCombatResult): void {
  const store = useGameStore.getState()

  console.log('[COMBAT RESULTS] Processing combat completion:', result)

  // Calculate derived results
  const experienceGained = calculateCombatXP(
    result.survivors,
    result.victory,
    result.rounds
  )

  // Convert enemy casualties to loot format
  const enemyCasualtiesForLoot: EnemyCasualty[] = (result.enemyCasualties || []).map(e => ({
    enemyId: e.enemyId,
    enemyName: e.enemyName,
    faction: e.faction,
    outcome: e.outcome,
    equipment: e.equipment
  }))

  const lootGained = generateCombatLoot(
    result.victory,
    enemyCasualtiesForLoot,
    result.rounds
  )

  const fameChange = calculateFameChange(
    result.victory,
    result.casualties.length,
    result.civilianCasualties || 0,
    result.collateralDamage || 0,
    store.playerFame
  )

  // Update character states
  const updatedCharacters = store.characters.map(char => {
    // Handle casualties
    const casualty = result.casualties.find(c => c.characterId === char.id)
    if (casualty) {
      return {
        ...char,
        status: casualty.status === 'dead' ? 'dead' : 'unconscious',
        health: { current: 0, maximum: char.health.maximum }
      }
    }

    // Handle injuries
    const characterInjuries = result.injuries.filter(inj => inj.characterId === char.id)
    if (characterInjuries.length > 0) {
      const severeInjury = characterInjuries.find(
        inj => inj.severity === 'SEVERE' || inj.severity === 'PERMANENT' || inj.severity === 'FATAL'
      )

      return {
        ...char,
        injuries: [...(char.injuries || []), ...characterInjuries],
        status: severeInjury ? 'hospitalized' : 'injured',
        recoveryTime: severeInjury?.healingTime || 0
      }
    }

    // Handle survivors (update HP and XP)
    const survivor = result.survivors.find(s => s.characterId === char.id)
    if (survivor) {
      const xpGain = experienceGained.find(xp => xp.characterId === char.id)

      return {
        ...char,
        health: {
          current: survivor.currentHp,
          maximum: survivor.maxHp
        },
        experience: (char.experience || 0) + (xpGain?.xp || 0),
        status: survivor.currentHp < survivor.maxHp * 0.5 ? 'injured' : 'ready'
      }
    }

    return char
  })

  // Update equipment inventory (add loot to inventory)
  lootGained.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      store.addToInventory(item.itemId, item.itemType)
    }
  })

  // Advance game time (combat duration)
  // Assume ~5 minutes per round of combat
  const combatDuration = result.timeElapsed || (result.rounds * 5)

  // Update store state
  useGameStore.setState({
    characters: updatedCharacters,
    playerFame: Math.max(0, Math.min(1000, store.playerFame + fameChange)),
    squadStatus: 'idle',
    currentView: 'world-map',
    budget: store.budget + (result.victory ? 5000 : 0) // Victory bonus
  })

  // Advance time
  store.advanceTime(combatDuration)

  // Generate news article if mission context available
  if (result.missionLocation) {
    store.generateMissionNews({
      success: result.victory,
      collateralDamage: result.collateralDamage || 0,
      civilianCasualties: result.civilianCasualties || 0,
      city: result.missionLocation.city,
      country: result.missionLocation.country,
      missionType: 'combat',
      enemyType: 'hostiles',
      vigilantismLegal: true // Would check country.LSW policy
    })
  }

  // Show summary notifications
  const outcomeEmoji = result.victory ? '🎉' : '💀'
  const outcomeText = result.victory ? 'VICTORY' : 'DEFEAT'

  toast.success(`${outcomeEmoji} ${outcomeText}! ${result.rounds} rounds`, { duration: 5000 })

  if (fameChange > 0) {
    toast.success(`+${fameChange} Fame`, { duration: 4000 })
  } else if (fameChange < 0) {
    toast.error(`${fameChange} Fame`, { duration: 4000 })
  }

  // Show XP gains
  experienceGained.forEach(xp => {
    if (xp.xp > 0) {
      toast.info(`${xp.characterName}: +${xp.xp} XP (${xp.reason})`, { duration: 3000 })
    }
  })

  // Show loot
  if (lootGained.length > 0) {
    const lootSummary = lootGained
      .map(item => `${item.quantity}x ${item.itemName}`)
      .join(', ')
    toast.success(`Loot: ${lootSummary}`, { duration: 4000 })
  }

  // Show casualties
  if (result.casualties.length > 0) {
    result.casualties.forEach(casualty => {
      const emoji = casualty.status === 'dead' ? '💀' : '😵'
      toast.error(`${emoji} ${casualty.characterName} ${casualty.status}!`, { duration: 5000 })
    })
  }

  // Show serious injuries
  result.injuries
    .filter(inj => inj.severity === 'SEVERE' || inj.severity === 'PERMANENT')
    .forEach(inj => {
      toast.error(`🩸 ${inj.characterName}: ${inj.description}`, { duration: 5000 })
    })

  console.log('[COMBAT RESULTS] Processing complete', {
    fameChange,
    experienceGained,
    lootGained,
    timeAdvanced: combatDuration
  })

  // ============== EVENTBUS INTEGRATION ==============
  // Emit combat ended event for News, Hospital, Reputation systems

  const combatEvent = createCombatEndedEvent(
    {
      victory: result.victory,
      casualties: result.casualties,
      injuries: result.injuries,
      survivors: result.survivors,
      totalDamageDealt: result.totalDamageDealt,
      totalDamageTaken: result.totalDamageTaken || 0,
      rounds: result.rounds,
      fameChange,
      collateralDamage: result.collateralDamage
    },
    result.missionLocation
  )

  EventBus.emit(combatEvent)
  console.log('[EVENTBUS] Combat ended event emitted:', combatEvent.id)

  // Emit individual events for each hospitalized character
  result.injuries
    .filter(inj => inj.severity === 'SEVERE' || inj.severity === 'PERMANENT')
    .forEach(injury => {
      EventBus.emitCharacterHospitalized({
        characterId: injury.characterId,
        characterName: injury.characterName,
        injuries: [{
          bodyPart: injury.bodyPart,
          severity: injury.severity,
          healingDays: injury.healingTime || 7
        }],
        hospitalName: result.missionLocation?.city
          ? `${result.missionLocation.city} General Hospital`
          : 'Field Hospital',
        estimatedRecovery: injury.healingTime || 7
      })
    })

  // Emit reputation change event
  if (fameChange !== 0) {
    EventBus.emitReputationChanged('fame', {
      previousValue: store.playerFame,
      newValue: Math.max(0, Math.min(1000, store.playerFame + fameChange)),
      change: fameChange,
      reason: result.victory ? 'Combat victory' : 'Combat defeat',
      sourceEventId: combatEvent.id
    })
  }

  // ============== MISSION COMPLETION ==============
  // Emit mission:completed when combat ends as part of a mission
  if (result.missionLocation) {
    const missionRewards = {
      money: result.victory ? 5000 + Math.floor(Math.random() * 5000) : 0,
      xp: experienceGained.reduce((sum, xp) => sum + xp.xp, 0),
      items: lootGained.map(item => item.itemId),
      fameChange
    }

    EventBus.emitMissionCompleted(
      {
        missionId: `mission_${combatEvent.id}`,
        missionName: `Combat in ${result.missionLocation.city}`,
        missionType: 'combat',
        success: result.victory,
        rewards: missionRewards,
        casualties: result.casualties.map(c => c.characterId)
      },
      result.missionLocation
    )
    console.log('[EVENTBUS] Mission completed event emitted for:', result.missionLocation.city)
  }
}

/**
 * Generate injuries from damage taken by survivors
 * Creates realistic injuries based on HP loss
 */
function generateInjuriesFromDamage(
  survivors: Array<{ characterId: string; characterName: string; currentHp: number; maxHp: number; damageTaken: number }>
): EnhancedCombatResult['injuries'] {
  const injuries: EnhancedCombatResult['injuries'] = []
  const bodyParts = ['head', 'torso', 'left arm', 'right arm', 'left leg', 'right leg']

  for (const survivor of survivors) {
    const hpPercentage = survivor.currentHp / survivor.maxHp
    const damageTaken = survivor.damageTaken

    // Only generate injuries if significant damage taken
    if (damageTaken < 10 && hpPercentage > 0.8) continue

    // Determine severity based on remaining HP percentage
    let severity: 'LIGHT' | 'MODERATE' | 'SEVERE' | 'PERMANENT' = 'LIGHT'
    let healingTime = 1

    if (hpPercentage <= 0.2) {
      severity = 'SEVERE'
      healingTime = 14 + Math.floor(Math.random() * 14) // 14-28 days
    } else if (hpPercentage <= 0.4) {
      severity = 'MODERATE'
      healingTime = 7 + Math.floor(Math.random() * 7) // 7-14 days
    } else if (hpPercentage <= 0.6) {
      severity = 'LIGHT'
      healingTime = 1 + Math.floor(Math.random() * 6) // 1-7 days
    } else {
      // Above 60% HP - minor scrapes only
      continue
    }

    // Random body part
    const bodyPart = bodyParts[Math.floor(Math.random() * bodyParts.length)]

    // Generate description
    const descriptions: Record<string, string[]> = {
      LIGHT: ['Minor bruising', 'Superficial cuts', 'Light strain', 'Minor contusion'],
      MODERATE: ['Deep laceration', 'Fractured bone', 'Muscle tear', 'Internal bruising'],
      SEVERE: ['Compound fracture', 'Severe internal bleeding', 'Crushed tissue', 'Multiple fractures'],
      PERMANENT: ['Permanent nerve damage', 'Lost limb function', 'Chronic damage', 'Disfiguring injury']
    }
    const description = descriptions[severity][Math.floor(Math.random() * descriptions[severity].length)]

    injuries.push({
      characterId: survivor.characterId,
      characterName: survivor.characterName,
      bodyPart,
      severity,
      description: `${description} to ${bodyPart}`,
      healingTime,
      permanent: severity === 'PERMANENT'
    })
  }

  return injuries
}

/**
 * Convert basic CombatResult (from CombatScene) to EnhancedCombatResult
 * This bridges the gap between Phaser's simple emission and strategic layer needs
 */
function convertToEnhancedResult(basicResult: CombatResult): EnhancedCombatResult {
  const store = useGameStore.getState()
  const victory = basicResult.winner === 'blue'

  // Resolve character names from store
  const getCharacterName = (unitId: string): string => {
    const char = store.characters.find(c => c.id === unitId)
    return char?.name || unitId
  }

  // Resolve character max HP from store
  const getCharacterMaxHp = (unitId: string): number => {
    const char = store.characters.find(c => c.id === unitId)
    return char?.health?.maximum || 100
  }

  // Map casualties from basic format with resolved names
  const casualties = (basicResult.casualties || [])
    .filter(c => c.team === 'blue') // Only track player team casualties
    .map(c => ({
      characterId: c.unitId,
      characterName: getCharacterName(c.unitId),
      status: 'dead' as const,
      killedBy: undefined
    }))

  // Calculate damage stats from surviving units
  // Estimate damage taken based on HP loss
  const survivingUnits = basicResult.survivingUnits || []
  const blueSurvivors = survivingUnits.filter(s => s.team === 'blue')
  const redSurvivors = survivingUnits.filter(s => s.team === 'red')

  // Estimate total damage dealt/taken based on casualties and HP loss
  const totalRedCasualties = (basicResult.casualties || []).filter(c => c.team === 'red').length
  const estimatedDamageDealt = totalRedCasualties * 100 + redSurvivors.reduce((sum, s) => sum + (100 - s.hp), 0)
  const estimatedDamageTaken = casualties.length * 100 + blueSurvivors.reduce((sum, s) => sum + (getCharacterMaxHp(s.unitId) - s.hp), 0)

  // Map survivors from basic format with estimated damage stats
  const survivors = blueSurvivors.map(s => {
    const maxHp = getCharacterMaxHp(s.unitId)
    const damageTaken = Math.max(0, maxHp - s.hp)
    // Estimate kills proportionally if victory, otherwise 0
    const estimatedKills = victory ? Math.ceil(totalRedCasualties / Math.max(1, blueSurvivors.length)) : 0

    return {
      characterId: s.unitId,
      characterName: getCharacterName(s.unitId),
      currentHp: s.hp,
      maxHp,
      damageDealt: victory ? Math.floor(estimatedDamageDealt / Math.max(1, blueSurvivors.length)) : 0,
      damageTaken,
      kills: estimatedKills
    }
  })

  // Generate injuries from damage taken
  const injuries = generateInjuriesFromDamage(survivors)

  // Get current sector info for mission location
  const missionLocation = store.currentSector ? {
    sector: store.currentSector,
    city: store.selectedCity || 'Unknown',
    country: store.selectedCountry || 'Unknown'
  } : undefined

  // Estimate combat time (5-10 minutes per round)
  const timeElapsed = basicResult.rounds * (5 + Math.floor(Math.random() * 5))

  // Scale collateral damage based on rounds and casualties
  const baseCollateral = 5000 + (basicResult.rounds * 2000) + (totalRedCasualties * 3000)
  const collateralDamage = Math.floor(baseCollateral * (0.5 + Math.random()))

  // Civilian casualties only in long fights with high collateral
  const civilianCasualties = (basicResult.rounds > 5 && collateralDamage > 30000)
    ? Math.floor(Math.random() * 2)
    : 0

  // Calculate fame change
  const baseFame = victory ? 15 : -20
  const fameChange = baseFame - (civilianCasualties * 10) - Math.floor(collateralDamage / 10000)

  // Calculate accuracy (estimate based on damage dealt vs expected)
  const accuracyRate = victory ? 0.5 + Math.random() * 0.3 : 0.3 + Math.random() * 0.2

  return {
    victory,
    winner: basicResult.winner as 'blue' | 'red',
    rounds: basicResult.rounds,
    timeElapsed,
    casualties,
    injuries,
    survivors,
    experienceGained: [], // Will be calculated by handleCombatComplete
    lootGained: [], // Will be generated by handleCombatComplete
    fameChange,
    publicOpinionChange: {},
    missionLocation,
    totalDamageDealt: estimatedDamageDealt,
    totalDamageTaken: estimatedDamageTaken,
    accuracyRate,
    collateralDamage,
    civilianCasualties
  }
}

/**
 * Handle mercenary death - triggers funeral/family system
 */
function handleMercDied(data: MercDeathEvent): void {
  console.log('[COMBAT RESULTS] Mercenary died:', data.unitName, 'killed by', data.killedBy)

  // Store pending death notification for UI
  pendingDeathNotifications.push(data)

  // Process through death consequences system
  const deathManager = getDeathConsequencesManager()

  // If we have an NPC ID, record the death properly
  if (data.npcId) {
    const result = deathManager.recordDeath(
      data.npcId,
      `killed_in_combat_${data.weapon}`,
      data.location?.cityName || 'unknown location',
      data.killedBy,
      data.weapon,
      data.witnesses
    )

    if (result) {
      console.log('[COMBAT RESULTS] Death recorded:', result.record.id)
      console.log('[COMBAT RESULTS] Notification:', result.notification.headline)

      // Show toast notification
      toast.error(`${data.unitName} has fallen in combat`, {
        duration: 5000,
        icon: '💀',
      })
    }
  } else {
    // No NPC ID - still show notification but can't track funeral
    console.warn('[COMBAT RESULTS] No npcId for', data.unitName, '- death consequences limited')

    toast.error(`${data.unitName} has fallen in combat`, {
      duration: 5000,
      icon: '💀',
    })
  }

  // Emit event for other systems (morale, news, etc.)
  EventBus.emit({
    type: 'merc_died',
    payload: {
      npcId: data.npcId,
      unitName: data.unitName,
      killedBy: data.killedBy,
      weapon: data.weapon,
      location: data.location,
      witnesses: data.witnesses,
    },
  })
}

/**
 * Get pending death notifications for funeral UI
 */
export function getPendingDeathNotifications(): MercDeathEvent[] {
  return [...pendingDeathNotifications]
}

/**
 * Clear a death notification after it's been handled
 */
export function clearDeathNotification(unitId: string): void {
  const index = pendingDeathNotifications.findIndex(n => n.unitId === unitId)
  if (index >= 0) {
    pendingDeathNotifications.splice(index, 1)
  }
}

/**
 * Check if there are pending death notifications
 */
export function hasPendingDeathNotifications(): boolean {
  return pendingDeathNotifications.length > 0
}

/**
 * Initialize combat results handler
 * Subscribes to EventBridge 'combat-ended' and 'merc-died' events
 */
export function initCombatResultsHandler(): void {
  console.log('[COMBAT RESULTS] Initializing handler...')

  // Subscribe to combat-ended events from CombatScene
  unsubscribeCombatEnded = EventBridge.on('combat-ended', (data: CombatResult) => {
    console.log('[COMBAT RESULTS] Received combat-ended event:', data)

    // Convert basic result to enhanced result
    const enhancedResult = convertToEnhancedResult(data)

    // Process through main handler
    handleCombatComplete(enhancedResult)
  })

  // Subscribe to merc-died events for funeral/family system
  unsubscribeMercDied = EventBridge.on('merc-died', (data: MercDeathEvent) => {
    console.log('[COMBAT RESULTS] Received merc-died event:', data)
    handleMercDied(data)
  })

  console.log('[COMBAT RESULTS] Handler initialized and subscribed to combat events')
}

/**
 * Cleanup combat results handler
 * Unsubscribes from events
 */
export function cleanupCombatResultsHandler(): void {
  if (unsubscribeCombatEnded) {
    unsubscribeCombatEnded()
    unsubscribeCombatEnded = null
  }
  if (unsubscribeMercDied) {
    unsubscribeMercDied()
    unsubscribeMercDied = null
  }
  console.log('[COMBAT RESULTS] Handler cleaned up')
}

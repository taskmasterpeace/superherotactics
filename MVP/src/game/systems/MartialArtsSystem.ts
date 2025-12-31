/**
 * Martial Arts System
 * Handles belt rank bonuses, technique execution, and grapple state machine
 */

import { GrappleState, MartialArtsStyleId, GrappleInteraction } from '../EventBridge';
import martialArtsData from '../../data/martial-arts.json';

export interface CharacterMartialArtsTraining {
  styleId: MartialArtsStyleId;
  beltLevel: number;
}

export interface TechniqueResult {
  success: boolean;
  damage: number;
  statusApplied: string[];
  newGrappleState?: GrappleState;
  message: string;
}

/**
 * Get belt rank bonus for a character in a specific style
 */
export function getBeltBonus(beltLevel: number): number {
  const rank = martialArtsData.beltRanks.find(r => r.rank === beltLevel);
  return rank ? rank.bonus : 0;
}

/**
 * Get belt name for display
 */
export function getBeltName(beltLevel: number): string {
  const rank = martialArtsData.beltRanks.find(r => r.rank === beltLevel);
  return rank ? rank.label : 'Untrained';
}

/**
 * Get tier label for display (Novice, Trained, Skilled, Expert, Master, Grandmaster)
 * Used in combat tooltips for less "martial arts specific" display
 */
export function getTierLabel(beltLevel: number): string {
  const rank = martialArtsData.beltRanks.find(r => r.rank === beltLevel) as { tier?: string } | undefined;
  return rank?.tier || 'Untrained';
}

/**
 * Get belt emoji for visual display
 */
export function getBeltEmoji(beltLevel: number): string {
  const rank = martialArtsData.beltRanks.find(r => r.rank === beltLevel) as { emoji?: string } | undefined;
  return rank?.emoji || '🥋';
}

/**
 * Get formatted display string with both belt and tier
 * e.g., "🟣 Purple Belt - Expert"
 */
export function getFullBeltDisplay(beltLevel: number): string {
  const rank = martialArtsData.beltRanks.find(r => r.rank === beltLevel) as { emoji?: string; label?: string; tier?: string } | undefined;
  if (!rank) return '🥋 Untrained';
  return `${rank.emoji || '🥋'} ${rank.label || 'Untrained'} - ${rank.tier || 'Novice'}`;
}

/**
 * Get all techniques a character can use based on their belt level
 */
export function getAvailableTechniques(
  styleId: MartialArtsStyleId,
  beltLevel: number
): typeof martialArtsData.styles[0]['techniques'] {
  const style = martialArtsData.styles.find(s => s.id === styleId);
  if (!style) return [];

  return style.techniques.filter(tech => tech.beltRequired <= beltLevel);
}

/**
 * Get style information
 */
export function getStyle(styleId: MartialArtsStyleId) {
  return martialArtsData.styles.find(s => s.id === styleId);
}

/**
 * Calculate technique hit chance with belt bonus
 * Base formula: MEL + Belt Bonus + Style Primary Stat / 4
 */
export function calculateTechniqueHitChance(
  attackerMEL: number,
  attackerStats: { STR: number; AGL: number; INS: number },
  styleId: MartialArtsStyleId,
  beltLevel: number,
  defenderAGL: number
): number {
  const style = getStyle(styleId);
  if (!style) return 30;

  const beltBonus = getBeltBonus(beltLevel);

  // Get primary stat bonus
  let primaryBonus = 0;
  switch (style.primaryStat) {
    case 'STR': primaryBonus = attackerStats.STR / 4; break;
    case 'AGL': primaryBonus = attackerStats.AGL / 4; break;
    case 'INS': primaryBonus = attackerStats.INS / 4; break;
    case 'MEL': primaryBonus = attackerMEL / 4; break;
  }

  // Base hit chance
  const baseChance = attackerMEL + beltBonus + primaryBonus - (defenderAGL / 3) + 30;

  return Math.max(5, Math.min(95, baseChance));
}

/**
 * Calculate technique damage with STR bonus where applicable
 */
export function calculateTechniqueDamage(
  technique: typeof martialArtsData.styles[0]['techniques'][0],
  attackerSTR: number,
  beltLevel: number
): number {
  if (!technique.damage) return 0;

  // Slam technique uses STR directly
  if (technique.id === 'tech_slam') {
    return Math.floor(attackerSTR * 0.5);
  }

  // Other techniques get small STR bonus at higher belts
  const strBonus = Math.floor(attackerSTR / 20);
  const beltDamageBonus = Math.floor(beltLevel / 3);

  return technique.damage + strBonus + beltDamageBonus;
}

/**
 * Check if a technique can be used in current situation
 */
export function canUseTechnique(
  technique: typeof martialArtsData.styles[0]['techniques'][0],
  currentGrappleState: GrappleState,
  isAttackerStanding: boolean,
  isTargetRestrained: boolean
): { canUse: boolean; reason?: string } {
  // Check standing requirement
  if (technique.requiresStanding && !isAttackerStanding) {
    return { canUse: false, reason: 'Must be standing' };
  }

  // Check prone requirement
  if (technique.requiresProne && isAttackerStanding) {
    return { canUse: false, reason: 'Must be on ground' };
  }

  // Check grapple requirement
  if (technique.requiresGrapple && currentGrappleState === GrappleState.NONE) {
    return { canUse: false, reason: 'Must be grappling' };
  }

  // Check restrained requirement
  if (technique.requiresRestrained && !isTargetRestrained) {
    return { canUse: false, reason: 'Target must be restrained' };
  }

  return { canUse: true };
}

/**
 * Grapple State Machine - determines valid transitions
 */
export const GRAPPLE_TRANSITIONS: Record<GrappleState, GrappleState[]> = {
  [GrappleState.NONE]: [GrappleState.STANDING, GrappleState.GROUND],
  [GrappleState.STANDING]: [GrappleState.NONE, GrappleState.GROUND, GrappleState.PINNED],
  [GrappleState.GROUND]: [GrappleState.NONE, GrappleState.STANDING, GrappleState.PINNED, GrappleState.SUBMISSION],
  [GrappleState.PINNED]: [GrappleState.NONE, GrappleState.GROUND, GrappleState.RESTRAINED, GrappleState.SUBMISSION],
  [GrappleState.RESTRAINED]: [GrappleState.NONE, GrappleState.PINNED, GrappleState.CARRIED, GrappleState.SUBMISSION],
  [GrappleState.CARRIED]: [GrappleState.NONE, GrappleState.GROUND, GrappleState.RESTRAINED],
  [GrappleState.SUBMISSION]: [GrappleState.NONE, GrappleState.GROUND, GrappleState.PINNED]
};

/**
 * Check if a grapple state transition is valid
 */
export function canTransitionGrapple(from: GrappleState, to: GrappleState): boolean {
  return GRAPPLE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Calculate escape difficulty
 * Escape DC = Attacker's MEL + Belt Bonus
 */
export function calculateEscapeDifficulty(
  attackerMEL: number,
  attackerStyleId: MartialArtsStyleId,
  attackerBeltLevel: number
): number {
  const beltBonus = getBeltBonus(attackerBeltLevel);
  return attackerMEL + beltBonus;
}

/**
 * Attempt to escape from grapple
 * Defender rolls: STR + (AGL / 2) vs Escape DC
 */
export function attemptEscape(
  defenderSTR: number,
  defenderAGL: number,
  escapeDC: number
): { success: boolean; roll: number; dc: number } {
  const escapeRoll = defenderSTR + (defenderAGL / 2) + Math.floor(Math.random() * 20) + 1;
  return {
    success: escapeRoll >= escapeDC,
    roll: Math.floor(escapeRoll),
    dc: escapeDC
  };
}

/**
 * Check if choke submission causes unconsciousness
 */
export function checkChokeProgress(turnsInChoke: number, chokeType: 'blood' | 'air'): boolean {
  // Blood choke: unconscious in 2 turns
  if (chokeType === 'blood' && turnsInChoke >= 2) return true;
  // Air choke: unconscious in 3 turns
  if (chokeType === 'air' && turnsInChoke >= 3) return true;
  return false;
}

/**
 * Get all styles
 */
export function getAllStyles() {
  return martialArtsData.styles;
}

/**
 * Get belt ranks
 */
export function getBeltRanks() {
  return martialArtsData.beltRanks;
}

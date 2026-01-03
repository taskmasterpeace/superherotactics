/**
 * Grapple System - State Machine for Grappling Combat
 *
 * Manages grapple state transitions between units.
 * States: NONE -> STANDING -> GROUND -> PINNED -> RESTRAINED -> SUBMISSION
 */

import { SimUnit, GrappleStateType } from './types';

// ============ GRAPPLE STATE TRANSITIONS ============

/**
 * Valid state transitions for the grapple state machine.
 * Each state can only transition to certain other states.
 */
export const GRAPPLE_TRANSITIONS: Record<GrappleStateType, GrappleStateType[]> = {
  'none': ['standing', 'ground'],
  'standing': ['none', 'ground', 'pinned'],
  'ground': ['none', 'standing', 'pinned', 'submission'],
  'pinned': ['none', 'ground', 'restrained', 'submission'],
  'restrained': ['none', 'pinned', 'carried', 'submission'],
  'carried': ['none', 'ground', 'restrained'],
  'submission': ['none', 'ground', 'pinned'],
};

/**
 * Escape difficulty by grapple state.
 * Higher = harder to escape.
 */
export const GRAPPLE_ESCAPE_DC: Record<GrappleStateType, number> = {
  'none': 0,
  'standing': 10,
  'ground': 15,
  'pinned': 20,
  'restrained': 25,
  'carried': 20,
  'submission': 30,
};

// ============ GRAPPLE FUNCTIONS ============

/**
 * Get the current grapple state of a unit.
 */
export function getGrappleState(unit: SimUnit): GrappleStateType {
  return unit.grappleState || 'none';
}

/**
 * Check if a unit is in any grapple state.
 */
export function isGrappling(unit: SimUnit): boolean {
  return unit.grappleState !== undefined && unit.grappleState !== 'none';
}

/**
 * Check if a state transition is valid.
 */
export function canTransitionGrapple(
  from: GrappleStateType,
  to: GrappleStateType
): boolean {
  return GRAPPLE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Attempt to transition to a new grapple state.
 * Returns success and applies the change if valid.
 */
export function transitionGrapple(
  attacker: SimUnit,
  target: SimUnit,
  newState: GrappleStateType
): { success: boolean; reason?: string } {
  const currentState = getGrappleState(attacker);

  // Check if transition is valid
  if (!canTransitionGrapple(currentState, newState)) {
    return {
      success: false,
      reason: `Cannot transition from ${currentState} to ${newState}`,
    };
  }

  // Apply the transition
  if (newState === 'none') {
    // Breaking free from grapple
    attacker.grappleState = 'none';
    attacker.grapplePartner = undefined;
    target.grappleState = 'none';
    target.grapplePartner = undefined;
  } else {
    // Entering or changing grapple state
    attacker.grappleState = newState;
    attacker.grapplePartner = target.id;
    target.grappleState = newState;
    target.grapplePartner = attacker.id;
  }

  return { success: true };
}

/**
 * Calculate escape difficulty for a grapple.
 * Based on grapple state and attacker's MEL + belt bonus.
 */
export function calculateEscapeDC(
  grappleState: GrappleStateType,
  attackerMEL: number,
  attackerBeltLevel: number = 1
): number {
  const baseDC = GRAPPLE_ESCAPE_DC[grappleState] || 10;
  const melBonus = Math.floor((attackerMEL - 15) / 2);
  const beltBonus = attackerBeltLevel;

  return baseDC + melBonus + beltBonus;
}

/**
 * Attempt to escape from a grapple.
 * Roll against escape DC using AGL + MEL.
 */
export function attemptEscape(
  escaper: SimUnit,
  grappler: SimUnit
): { success: boolean; roll: number; dc: number } {
  const grappleState = getGrappleState(escaper);

  if (grappleState === 'none') {
    return { success: true, roll: 0, dc: 0 };
  }

  const dc = calculateEscapeDC(
    grappleState,
    grappler.stats.MEL,
    grappler.beltLevel || 1
  );

  // Escape roll: AGL + MEL / 2 + d20
  const baseRoll = escaper.stats.AGL + Math.floor(escaper.stats.MEL / 2);
  const roll = baseRoll + Math.floor(Math.random() * 20) + 1;

  if (roll >= dc) {
    // Successful escape
    escaper.grappleState = 'none';
    escaper.grapplePartner = undefined;
    grappler.grappleState = 'none';
    grappler.grapplePartner = undefined;
    return { success: true, roll, dc };
  }

  return { success: false, roll, dc };
}

/**
 * Initiate a grapple (enter clinch from neutral).
 * Requires both units to be in 'none' state and adjacent.
 */
export function initiateGrapple(
  initiator: SimUnit,
  target: SimUnit
): { success: boolean; reason?: string } {
  if (isGrappling(initiator)) {
    return { success: false, reason: 'Initiator is already grappling' };
  }

  if (isGrappling(target)) {
    return { success: false, reason: 'Target is already grappling' };
  }

  // Enter standing grapple (clinch)
  initiator.grappleState = 'standing';
  initiator.grapplePartner = target.id;
  target.grappleState = 'standing';
  target.grapplePartner = initiator.id;

  return { success: true };
}

/**
 * Break free from a grapple (reset to none).
 */
export function breakGrapple(unit: SimUnit, partner: SimUnit): void {
  unit.grappleState = 'none';
  unit.grapplePartner = undefined;
  partner.grappleState = 'none';
  partner.grapplePartner = undefined;
}

/**
 * Check if a technique can be used in the current grapple state.
 */
export function canUseTechniqueInState(
  requiresGrapple: boolean | undefined,
  requiresStanding: boolean | undefined,
  requiresProne: boolean | undefined,
  currentState: GrappleStateType,
  isProne: boolean
): { canUse: boolean; reason?: string } {
  // Technique requires grapple but we're not grappling
  if (requiresGrapple && currentState === 'none') {
    return { canUse: false, reason: 'Must be in grapple' };
  }

  // Technique requires standing but we're prone
  if (requiresStanding && isProne) {
    return { canUse: false, reason: 'Must be standing' };
  }

  // Technique requires prone but we're standing
  if (requiresProne && !isProne) {
    return { canUse: false, reason: 'Must be on ground' };
  }

  return { canUse: true };
}

// ============ EXPORTS ============

export default {
  GRAPPLE_TRANSITIONS,
  GRAPPLE_ESCAPE_DC,
  getGrappleState,
  isGrappling,
  canTransitionGrapple,
  transitionGrapple,
  calculateEscapeDC,
  attemptEscape,
  initiateGrapple,
  breakGrapple,
  canUseTechniqueInState,
};

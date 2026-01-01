/**
 * Calling Combat Bonuses
 *
 * Evaluates character callings to apply combat modifiers.
 * Each calling has a condition that determines when bonuses activate.
 *
 * Used by CombatScene to modify:
 * - Accuracy (hit chance)
 * - Damage (dealt)
 * - Evasion (dodge chance)
 */

import { CallingId, CALLINGS, CombatBonus } from '../data/callingSystem';

// Combat context for evaluating calling conditions
export interface CombatContext {
  // Attacker info
  attackerId: string;
  attackerCalling?: CallingId;
  attackerHealth: number;
  attackerMaxHealth: number;
  attackerTeam: 'blue' | 'red';

  // Defender info
  defenderCalling?: CallingId;
  defenderHealth: number;
  defenderMaxHealth: number;
  defenderTeam: 'blue' | 'red';

  // Situational
  isDefendingCivilians?: boolean;
  isFollowingOrders?: boolean;
  isOutnumbered?: boolean;
  isOutgunned?: boolean;
  hasMedeaPresent?: boolean;
  isBelovedInDanger?: boolean;
  isFightingRival?: boolean;
  isNearHomeTerritory?: boolean;
  isPursuitingIsolatedPrey?: boolean;
  isFightingForCause?: boolean;
  isFightingOppressors?: boolean;
  isFightingWrongdoers?: boolean;
  isUsingSignatureAbilities?: boolean;
  allyNearby?: boolean;
  loyaltyObjectNearby?: boolean;
}

// Result of calling bonus evaluation
export interface CallingBonusResult {
  accuracyMod: number;
  damageMod: number;
  evasionMod: number;
  moraleImmune: boolean;
  activated: boolean;
  message?: string;
}

/**
 * Evaluate if a calling's condition is met
 */
function evaluateCondition(
  calling: CallingId,
  context: CombatContext,
  isAttacker: boolean
): { met: boolean; description: string } {
  const callingData = CALLINGS[calling];
  if (!callingData.effects.combatBonus) {
    return { met: false, description: '' };
  }

  const condition = callingData.effects.combatBonus.condition.toLowerCase();

  // PROTECTOR: "Defending civilians or allies"
  if (calling === 'protector') {
    if (context.isDefendingCivilians || context.allyNearby) {
      return { met: true, description: 'defending the innocent' };
    }
  }

  // GUARDIAN: "Fighting near their ward or home territory"
  if (calling === 'guardian') {
    if (context.isNearHomeTerritory) {
      return { met: true, description: 'defending home territory' };
    }
  }

  // AVENGER: "Fighting someone who harmed innocents"
  if (calling === 'avenger') {
    if (context.isFightingWrongdoers) {
      return { met: true, description: 'avenging the innocent' };
    }
    // Default: always slight bonus against red team (enemies)
    if (context.defenderTeam === 'red' && isAttacker) {
      return { met: true, description: 'punishing wrongdoers' };
    }
  }

  // LIBERATOR: "Fighting slavers, dictators, or captors"
  if (calling === 'liberator') {
    if (context.isFightingOppressors) {
      return { met: true, description: 'fighting for freedom' };
    }
  }

  // SURVIVOR: "Below 25% health"
  if (calling === 'survivor') {
    const healthPercent = isAttacker
      ? context.attackerHealth / context.attackerMaxHealth
      : context.defenderHealth / context.defenderMaxHealth;
    if (healthPercent <= 0.25) {
      return { met: true, description: 'survival instincts activated' };
    }
  }

  // SOLDIER: "Following direct orders"
  if (calling === 'soldier') {
    if (context.isFollowingOrders !== false) {
      // Default to true - soldiers always fight with discipline
      return { met: true, description: 'following orders' };
    }
  }

  // THRILL_SEEKER: "Outnumbered or outgunned"
  if (calling === 'thrill_seeker') {
    if (context.isOutnumbered || context.isOutgunned) {
      return { met: true, description: 'loving the danger' };
    }
  }

  // GLORY_HOUND: "Media or witnesses present"
  if (calling === 'glory_hound') {
    if (context.hasMedeaPresent) {
      return { met: true, description: 'performing for the cameras' };
    }
  }

  // IDEALIST: "Fighting for their cause"
  if (calling === 'idealist') {
    if (context.isFightingForCause !== false) {
      return { met: true, description: 'fighting for what they believe' };
    }
  }

  // ZEALOT: "Fighting enemies of their cause"
  if (calling === 'zealot') {
    if (context.isFightingForCause !== false) {
      return { met: true, description: 'zealous fury' };
    }
  }

  // CONQUEROR: "Fighting to conquer"
  if (calling === 'conqueror') {
    // Conquerors always fight to dominate
    return { met: true, description: 'dominating the battlefield' };
  }

  // UNTOUCHABLE: "Fighting to protect themselves"
  if (calling === 'untouchable' && !isAttacker) {
    // Always applies to defenders
    return { met: true, description: 'self-preservation instincts' };
  }

  // OUTCAST: "Fighting those who rejected them"
  if (calling === 'outcast') {
    // Outcasts fight harder against authority
    return { met: true, description: 'proving their worth' };
  }

  // BORN_TO_IT: "Using signature abilities"
  if (calling === 'born_to_it') {
    if (context.isUsingSignatureAbilities !== false) {
      return { met: true, description: 'embracing their destiny' };
    }
  }

  // LOYALIST: "Fighting alongside or for loyalty object"
  if (calling === 'loyalist') {
    if (context.loyaltyObjectNearby || context.allyNearby) {
      return { met: true, description: 'fighting for their lord' };
    }
  }

  // RIVAL: "Fighting rival directly"
  if (calling === 'rival') {
    if (context.isFightingRival) {
      return { met: true, description: 'settling the score' };
    }
  }

  // ROMANTIC: "Beloved is in danger"
  if (calling === 'romantic') {
    if (context.isBelovedInDanger) {
      return { met: true, description: 'protecting their love' };
    }
  }

  // PREDATOR: "Hunting isolated prey"
  if (calling === 'predator') {
    if (context.isPursuitingIsolatedPrey) {
      return { met: true, description: 'hunting their prey' };
    }
  }

  // CHAOS_AGENT: "Outnumbered and outgunned"
  if (calling === 'chaos_agent') {
    if (context.isOutnumbered && context.isOutgunned) {
      return { met: true, description: 'reveling in chaos' };
    }
  }

  return { met: false, description: '' };
}

/**
 * Get combat bonuses for an attacker based on their calling
 */
export function getAttackerCallingBonus(context: CombatContext): CallingBonusResult {
  const result: CallingBonusResult = {
    accuracyMod: 0,
    damageMod: 0,
    evasionMod: 0,
    moraleImmune: false,
    activated: false,
  };

  if (!context.attackerCalling) return result;

  const callingData = CALLINGS[context.attackerCalling];
  if (!callingData?.effects.combatBonus) return result;

  const { met, description } = evaluateCondition(context.attackerCalling, context, true);

  if (met) {
    const bonus = callingData.effects.combatBonus;
    result.accuracyMod = bonus.accuracyMod || 0;
    result.damageMod = bonus.damageMod || 0;
    // Attacker can still get evasion bonus for counterattacks
    result.evasionMod = 0; // Evasion is typically for defenders
    result.moraleImmune = bonus.moraleImmune || false;
    result.activated = true;
    result.message = `${callingData.name}: ${description}`;
  }

  return result;
}

/**
 * Get combat bonuses for a defender based on their calling
 */
export function getDefenderCallingBonus(context: CombatContext): CallingBonusResult {
  const result: CallingBonusResult = {
    accuracyMod: 0,
    damageMod: 0,
    evasionMod: 0,
    moraleImmune: false,
    activated: false,
  };

  if (!context.defenderCalling) return result;

  const callingData = CALLINGS[context.defenderCalling];
  if (!callingData?.effects.combatBonus) return result;

  const { met, description } = evaluateCondition(context.defenderCalling, context, false);

  if (met) {
    const bonus = callingData.effects.combatBonus;
    result.evasionMod = bonus.evasionMod || 0;
    result.moraleImmune = bonus.moraleImmune || false;
    result.activated = true;
    result.message = `${callingData.name}: ${description}`;
  }

  return result;
}

/**
 * Simple evaluation for common combat situations
 * Returns combined bonuses for both attacker and defender callings
 */
export function evaluateCallingBonuses(
  attackerCalling: string | undefined,
  defenderCalling: string | undefined,
  attackerHealthPercent: number,
  defenderHealthPercent: number,
  teamSituation: {
    blueTeamSize: number;
    redTeamSize: number;
    attackerTeam: 'blue' | 'red';
  }
): {
  attackerBonus: CallingBonusResult;
  defenderBonus: CallingBonusResult;
} {
  const isOutnumbered = teamSituation.attackerTeam === 'blue'
    ? teamSituation.blueTeamSize < teamSituation.redTeamSize
    : teamSituation.redTeamSize < teamSituation.blueTeamSize;

  const context: CombatContext = {
    attackerId: 'attacker',
    attackerCalling: attackerCalling as CallingId | undefined,
    attackerHealth: attackerHealthPercent * 100,
    attackerMaxHealth: 100,
    attackerTeam: teamSituation.attackerTeam,
    defenderCalling: defenderCalling as CallingId | undefined,
    defenderHealth: defenderHealthPercent * 100,
    defenderMaxHealth: 100,
    defenderTeam: teamSituation.attackerTeam === 'blue' ? 'red' : 'blue',
    isOutnumbered,
    isOutgunned: isOutnumbered, // Simplified
    allyNearby: true, // Assume allies are nearby in tactical combat
  };

  return {
    attackerBonus: getAttackerCallingBonus(context),
    defenderBonus: getDefenderCallingBonus(context),
  };
}

export default {
  evaluateCallingBonuses,
  getAttackerCallingBonus,
  getDefenderCallingBonus,
};

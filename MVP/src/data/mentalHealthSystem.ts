/**
 * MENTAL HEALTH SYSTEM — owner directive P5.
 *
 * Grief and depression are real states, not flavor. Personalities set
 * SUSCEPTIBILITY (P3): a volatile, harm-avoidant character breaks harder.
 *
 *  GRIEF      — event-triggered (teammate death). Time-limited, decays, but
 *               can CONVERT to depression in susceptible people.
 *  DEPRESSION — persistent. Daily morale drain, CS penalty, refuse-deploy
 *               risk. Does not decay on its own: needs hospital care, a
 *               therapy stay, or a long stretch of good living.
 *  ANXIETY    — lighter, from repeated combat stress / injuries.
 *
 * Tone lock: hardcore, dark, JA2-heroic. People break. You manage it.
 */

export type MentalConditionType = 'grief' | 'depression' | 'anxiety';

export interface MentalCondition {
  id: string;
  type: MentalConditionType;
  severity: 1 | 2 | 3;          // mild / serious / severe
  cause: string;                 // "Death of Bravo Heavy Gunner"
  startDay: number;
  /** grief/anxiety decay after this many days; depression has none */
  durationDays?: number;
}

export const CONDITION_META: Record<MentalConditionType, { icon: string; label: string; color: string }> = {
  grief:      { icon: '🖤', label: 'Grieving',  color: '#94a3b8' },
  depression: { icon: '🌧️', label: 'Depressed', color: '#60a5fa' },
  anxiety:    { icon: '😥', label: 'Anxious',   color: '#facc15' },
};

/** Daily morale drain per condition (scaled by severity). */
export function dailyMoraleDrain(c: MentalCondition): number {
  const base = c.type === 'depression' ? 2 : c.type === 'grief' ? 3 : 1;
  return base * c.severity;
}

/** Column-shift penalty the condition imposes in the field. */
export function conditionCSPenalty(conditions: MentalCondition[] | undefined): number {
  if (!conditions?.length) return 0;
  return Math.min(3, conditions.reduce((s, c) => s + (c.severity >= 2 ? 1 : 0), 0));
}

/** Chance (0-1) this character refuses deployment today. */
export function refuseDeployChance(conditions: MentalCondition[] | undefined): number {
  if (!conditions?.length) return 0;
  const dep = conditions.find(c => c.type === 'depression');
  if (!dep) return 0;
  return dep.severity === 3 ? 0.35 : dep.severity === 2 ? 0.15 : 0.05;
}

/**
 * Susceptibility 0-1 from personality (P3: personality sets susceptibility).
 * High volatility + high harm-avoidance = fragile; steady types shrug more off.
 */
export function susceptibility(char: any): number {
  const p = char?.personality || {};
  const volatility = (p.volatility ?? 5) / 10;              // 0-1
  // harmAvoidance directly if present; else invert aggression; else neutral
  const harmAvoidRaw = p.harmAvoidance ?? (p.harmPotential != null ? 10 - p.harmPotential : 5);
  const harmAvoid = harmAvoidRaw / 10;
  return Math.max(0.1, Math.min(1, volatility * 0.6 + harmAvoid * 0.4));
}

let seq = 0;
function cid(): string { return `mc_${Date.now().toString(36)}_${(seq++).toString(36)}`; }

/**
 * A teammate died. Everyone grieves; how hard depends on personality.
 * (When the relationship system deepens, BONDED pairs amplify this.)
 */
export function griefFromDeath(survivor: any, deadName: string, gameDay: number): MentalCondition | null {
  const s = susceptibility(survivor);
  // Everyone at least notices; fragile people take real grief.
  const severity: 1 | 2 | 3 = s > 0.75 ? 3 : s > 0.45 ? 2 : 1;
  return {
    id: cid(),
    type: 'grief',
    severity,
    cause: `Death of ${deadName}`,
    startDay: gameDay,
    durationDays: 5 + severity * 5, // 10/15/20 days of mourning
  };
}

/**
 * Daily processing for one character. Returns the updated condition list plus
 * what happened (for texts/notifications).
 */
export function tickConditions(
  char: any,
  gameDay: number
): { conditions: MentalCondition[]; converted?: MentalCondition; recovered: MentalCondition[] } {
  const list: MentalCondition[] = [...(char.mentalConditions || [])];
  const recovered: MentalCondition[] = [];
  let converted: MentalCondition | undefined;
  const out: MentalCondition[] = [];

  for (const c of list) {
    const expired = c.durationDays != null && gameDay - c.startDay >= c.durationDays;
    if (expired) {
      // Grief can curdle into depression in susceptible people (once).
      if (c.type === 'grief' && !list.some(x => x.type === 'depression') && Math.random() < susceptibility(char) * 0.5) {
        converted = {
          id: cid(), type: 'depression',
          severity: (Math.max(1, c.severity - 1)) as 1 | 2 | 3,
          cause: c.cause, startDay: gameDay,
        };
        out.push(converted);
      } else {
        recovered.push(c);
      }
      continue;
    }
    out.push(c);
  }
  return { conditions: out, converted, recovered };
}

/** Hospital / therapy: each treated day has a chance to step depression down. */
export function treatDepression(conditions: MentalCondition[]): { conditions: MentalCondition[]; improved: boolean } {
  const dep = conditions.find(c => c.type === 'depression');
  if (!dep || Math.random() > 0.35) return { conditions, improved: false };
  if (dep.severity <= 1) {
    return { conditions: conditions.filter(c => c.id !== dep.id), improved: true };
  }
  return {
    conditions: conditions.map(c => c.id === dep.id ? { ...c, severity: (c.severity - 1) as 1 | 2 | 3 } : c),
    improved: true,
  };
}

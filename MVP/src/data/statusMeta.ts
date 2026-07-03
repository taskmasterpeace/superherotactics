/**
 * STATUS PALETTE (plan C3 / spec 06) — one visual identity per character
 * status, replacing the old 3-color badge. Icon + label + color for all 15
 * statuses so every board reads the same language.
 */

import type { CharacterStatus } from '../types';

export const STATUS_META: Record<CharacterStatus, { icon: string; label: string; color: string; blurb: string }> = {
  ready:         { icon: '🟢', label: 'Ready',         color: '#22c55e', blurb: 'Idle — awaiting orders' },
  preparing:     { icon: '🎒', label: 'Preparing',     color: '#a3e635', blurb: 'Gearing up for an assignment' },
  hospital:      { icon: '🏥', label: 'Hospital',      color: '#ef4444', blurb: 'Under medical care' },
  investigation: { icon: '🔍', label: 'Investigating', color: '#38bdf8', blurb: 'Working a case' },
  covert_ops:    { icon: '🕶️', label: 'Covert Ops',    color: '#818cf8', blurb: 'Operating abroad, off the books' },
  personal_life: { icon: '💼', label: 'Day Job',       color: '#fbbf24', blurb: 'Working their cover / family time' },
  training:      { icon: '🎓', label: 'Training',      color: '#34d399', blurb: 'In a study or training program' },
  patrol:        { icon: '🚨', label: 'Patrol',        color: '#f59e0b', blurb: 'Walking the beat — fame & familiarity' },
  off_the_grid:  { icon: '📵', label: 'Off the Grid',  color: '#6b7280', blurb: 'Missing / hiding / unreachable' },
  engineering:   { icon: '🔧', label: 'Engineering',   color: '#22d3ee', blurb: 'Building or repairing tech' },
  research:      { icon: '🧪', label: 'Research',      color: '#2dd4bf', blurb: 'Lab work — tech & evidence' },
  travel:        { icon: '✈️', label: 'Traveling',     color: '#94a3b8', blurb: 'In transit' },
  recruit:       { icon: '📣', label: 'Recruiting',    color: '#fb923c', blurb: 'Using fame to find talent' },
  unconscious:   { icon: '😵', label: 'Unconscious',   color: '#f87171', blurb: 'Down — needs help' },
  dead:          { icon: '🪦', label: 'KIA',           color: '#525252', blurb: 'Killed in action' },
};

// Statuses the player can assign from the personnel board (activity scheduler
// lite — each has a real wired payoff; the rest come from dedicated screens).
export const ASSIGNABLE_ACTIVITIES: { status: CharacterStatus; payoff: string }[] = [
  { status: 'patrol',        payoff: '+fame, +city familiarity daily; slightly tiring' },
  { status: 'personal_life', payoff: '+morale daily; keeps cover-job income flowing' },
  { status: 'ready',         payoff: 'Recall to standby' },
];

export function getStatusMeta(status: string) {
  return (STATUS_META as any)[status] || { icon: '❔', label: status, color: '#9ca3af', blurb: '' };
}

/**
 * ALIEN INVASION ENDGAME (spec 111) — the immovable wall.
 *
 * Owner-locked rules: the armada arrives at Day 2472, FIXED (L4 — difficulty
 * never moves the date). There is no diplomatic avert: FIGHT or FUTURE-JUMP
 * (L1). Under-prepared players get a playable doomed last stand (L3) — you
 * go down swinging.
 *
 * This module is the clock, the phases, the readiness math and the final
 * fork. The finale battle chain itself mounts on the tactical layer.
 */

import type { ForkEvent } from './forkSystem';

export const ARMADA_ARRIVAL_DAY = 2472; // canon, fixed (L4)

export type InvasionPhase =
  | 'distant_signals'      // > 1800 days out — anomalies, rumor-tier
  | 'confirmed_trajectory' // 1800-1001 — astronomers agree, governments deny
  | 'global_alarm'         // 1000-401 — the world knows; politics convulse
  | 'final_preparations'   // 400-61 — everything is about readiness now
  | 'arrival_imminent'     // 60-1 — the sky is wrong
  | 'invasion';            // Day 2472+

export function getInvasionPhase(day: number): InvasionPhase {
  const left = ARMADA_ARRIVAL_DAY - day;
  if (left > 1800) return 'distant_signals';
  if (left > 1000) return 'confirmed_trajectory';
  if (left > 400) return 'global_alarm';
  if (left > 60) return 'final_preparations';
  if (left > 0) return 'arrival_imminent';
  return 'invasion';
}

export const PHASE_META: Record<InvasionPhase, { label: string; icon: string; note: string }> = {
  distant_signals:      { label: 'Distant Signals',      icon: '📡', note: 'Deep-space anomalies. Nobody serious is worried. Yet.' },
  confirmed_trajectory: { label: 'Confirmed Trajectory', icon: '🔭', note: 'The math is public. The denials are louder.' },
  global_alarm:         { label: 'Global Alarm',         icon: '🚨', note: 'Every government re-arms. LSW politics turn existential.' },
  final_preparations:   { label: 'Final Preparations',   icon: '⚙️', note: 'Readiness is the only number that matters now.' },
  arrival_imminent:     { label: 'Arrival Imminent',     icon: '🌘', note: 'The armada decelerates. Weeks, not years.' },
  invasion:             { label: 'INVASION',             icon: '👁️', note: 'They are here.' },
};

/** Newspaper world-wire foreshadowing per phase (the engine mixes these in). */
export const INVASION_WIRE: Record<InvasionPhase, string[]> = {
  distant_signals: [
    'Observatory Logs "Repeating Structure" in Deep-Space Noise',
    'Radio Telescope Grant Doubled After Classified Briefing',
  ],
  confirmed_trajectory: [
    'Seventeen Nations Sign Joint Deep-Space Monitoring Pact',
    'Leaked Memo: Object Cluster "Decelerating Against Physics"',
  ],
  global_alarm: [
    'UN Emergency Session Ends in Shouting Over Orbital Defense Funding',
    'Markets Crater as Armada Trajectory Confirmed by Fifth Independent Team',
    'Governments Begin Registering LSWs "For Planetary Defense"',
  ],
  final_preparations: [
    'Last Orbital Defense Platform Comes Online — Analysts Call It "Symbolic"',
    'Enlistment Offices Overwhelmed; LSW Volunteers Triple',
  ],
  arrival_imminent: [
    'The Lights In The Sky Are Not Stars — Live Coverage Continues',
    'World Leaders Address Nations; Several Simply Say Goodbye',
  ],
  invasion: [
    'CONTACT. FIRST CITIES REPORT LANDINGS.',
  ],
};

/**
 * READINESS 0-100 — the number the finale judges you by (L3: under-prepared
 * = playable doomed last stand). Roster mass + quality, tech tree depth,
 * infrastructure, and how much the world believes in you.
 */
export function computeReadiness(state: {
  characters?: any[]; unlockedResearch?: string[]; baseState?: any; playerFame?: number; customArmors?: any[];
}): number {
  const roster = (state.characters || []).filter(c => c.status !== 'dead');
  const rosterMass = Math.min(30, roster.length * 5);                       // 6+ operatives = full marks
  const avgStat = roster.length
    ? roster.reduce((s, c) => s + (Object.values(c.stats || {}) as number[]).reduce((a: number, b: number) => a + (b || 0), 0) / 7, 0) / roster.length
    : 0;
  const quality = Math.min(20, Math.round((avgStat / 80) * 20));            // avg 80 = full marks
  const tech = Math.min(25, (state.unlockedResearch?.length || 0) * 4 + (state.customArmors?.length || 0) * 3);
  const bases = Math.min(15, ((state.baseState?.bases?.length || 0) * 8));
  const fame = Math.min(10, Math.round((state.playerFame || 0) / 50));
  return Math.max(0, Math.min(100, rosterMass + quality + tech + bases + fame));
}

/** The final fork (L1): fight, or future-jump — no third door. */
export function arrivalFork(readiness: number, sanity: number, gameDay: number): ForkEvent {
  const canJump = sanity >= 40;
  return {
    id: `fork_invasion_${gameDay}`,
    title: 'THE ARMADA IS HERE',
    situation: `Day ${ARMADA_ARRIVAL_DAY}. The sky over every capital is hull-metal. Readiness assessment: ${readiness}/100. ${readiness >= 60 ? 'Your people are as ready as anyone on Earth.' : readiness >= 30 ? 'You are not ready. You will fight anyway.' : 'This will be a last stand. Make it a story they tell.'} There is no negotiating with the wall.`,
    icon: '👁️',
    context: 'interrupt',
    createdDay: gameDay,
    status: 'pending',
    defaultOptionId: 'fight',
    options: [
      {
        id: 'fight',
        label: readiness >= 60 ? 'Fight — humanity stands' : 'Fight — go down swinging',
        detail: readiness >= 60
          ? 'Lead the defense. Your readiness gives Earth a real chance.'
          : 'Under-prepared, outgunned, and absolutely not backing down. The doomed last stand is still yours to play.',
        effect: { tag: 'invasion:fight', moraleTeam: readiness >= 60 ? 10 : 5 },
        foresight: 'The finale chain scales to your readiness — roster, research, suits, bases all count.',
      },
      {
        id: 'jump',
        label: canJump ? 'Future-jump the Time Walker' : 'Future-jump (INSUFFICIENT SANITY)',
        detail: canJump
          ? 'One shot per campaign. Send the Time Walker past the invasion to bring back what wins it — knowing they come back CHANGED.'
          : 'The Time Walker\'s mind cannot take the jump. Fight is all that remains.',
        effect: { tag: canJump ? 'invasion:future_jump' : 'invasion:fight' },
        foresight: 'H4: the Time Walker returns changed — cyborg arm, cryptic warnings, maybe a duplicate.',
      },
    ],
  };
}

/**
 * MOOD / EMOTION LAYER
 *
 * A cheap, derived read of how a character *feels* right now. It reads existing
 * state — morale, mental-trauma injuries, personality (volatility / aggression /
 * motivation) — plus optional live context (in combat, intoxicated), and unifies
 * them into a single Mood.
 *
 * Two consumers:
 *   1. The Personnel condition board — the mental-state chip (emoji + color).
 *   2. The speech-bubble engine — `moodToBubbleEmotion` picks the bubble style
 *      so a character's spoken lines *sound* like their current state without
 *      anyone hand-tagging every line.
 *
 * Connect-not-invent: no new persisted state. Mood is computed on demand.
 */

import type { BubbleEmotion } from '../speech-bubbles/types';

export type Mood =
  | 'content'    // riding high, no cares
  | 'focused'    // high morale + driven; mission-ready
  | 'calm'       // baseline, steady
  | 'stressed'   // strained but holding
  | 'sarcastic'  // coping through dry wit (stable temperaments under mild strain)
  | 'afraid'     // fear response (fearful disposition under threat)
  | 'angry'      // aggression response (aggressive disposition under strain)
  | 'shaken'     // one mental trauma / genuinely rattled
  | 'broken'     // multiple traumas / morale collapse
  | 'drunk';     // intoxicated

export interface MoodRead {
  mood: Mood;
  label: string;
  color: string;   // shares the condition-board palette (green/yellow/orange/red)
  emoji: string;
}

export const MOOD_META: Record<Mood, { label: string; color: string; emoji: string }> = {
  content:   { label: 'Content',   color: '#22c55e', emoji: '😌' },
  focused:   { label: 'Focused',   color: '#22c55e', emoji: '🎯' },
  calm:      { label: 'Calm',      color: '#22c55e', emoji: '🙂' },
  stressed:  { label: 'Stressed',  color: '#eab308', emoji: '😟' },
  sarcastic: { label: 'Sarcastic', color: '#eab308', emoji: '😏' },
  afraid:    { label: 'Afraid',    color: '#f97316', emoji: '😨' },
  angry:     { label: 'Angry',     color: '#f97316', emoji: '😠' },
  shaken:    { label: 'Shaken',    color: '#f97316', emoji: '😰' },
  broken:    { label: 'Broken',    color: '#ef4444', emoji: '😞' },
  drunk:     { label: 'Drunk',     color: '#eab308', emoji: '🥴' },
};

export interface MoodContext {
  intoxicated?: boolean;
  inCombat?: boolean;
  threatened?: boolean;
}

// Read whatever morale shape the character carries (object or bare number).
function readMorale(char: any): number {
  if (typeof char?.morale === 'number') return char.morale;
  if (typeof char?.morale?.current === 'number') return char.morale.current;
  return 75;
}

function countMentalTraumas(char: any): number {
  return (char?.activeInjuries ?? []).filter(
    (i: any) => !i.hidden && i.severity === 'MentalTrauma'
  ).length;
}

/**
 * The character's current mood. Priority order runs from most-acute (drunk,
 * collapse, trauma) down to steady-state, so the strongest signal wins.
 */
export function getMood(char: any, ctx: MoodContext = {}): MoodRead {
  const morale = readMorale(char);
  const traumas = countMentalTraumas(char);
  const p = char?.personality || {};
  const volatility = p.volatility ?? 5;      // 1-10, higher = less stable
  const aggression = p.harmPotential ?? 5;   // 1-10, higher = lashes out
  const motivation = p.motivation ?? 5;      // 1-10, higher = driven

  const aggressive = aggression >= 6;
  const fearful = aggression <= 4 || volatility >= 7;

  let mood: Mood = 'calm';

  if (ctx.intoxicated) {
    mood = 'drunk';
  } else if (traumas >= 2 || morale < 15) {
    mood = 'broken';
  } else if (traumas >= 1) {
    mood = 'shaken';
  } else if (morale < 30 || (ctx.threatened && morale < 45)) {
    mood = aggressive ? 'angry' : 'afraid';
  } else if (ctx.inCombat && morale < 55) {
    mood = aggressive ? 'angry' : fearful ? 'afraid' : 'stressed';
  } else if (morale < 50) {
    mood = volatility <= 4 ? 'sarcastic' : 'stressed';
  } else if (morale >= 80 && motivation >= 7) {
    mood = 'focused';
  } else if (morale >= 70) {
    mood = 'content';
  } else {
    mood = 'calm';
  }

  return { mood, ...MOOD_META[mood] };
}

/** Map a mood onto the 6 bubble styles the speech engine can render. */
export function moodToBubbleEmotion(mood: Mood): BubbleEmotion {
  switch (mood) {
    case 'angry':     return 'angry';
    case 'afraid':    return 'afraid';
    case 'shaken':    return 'afraid';
    case 'broken':    return 'panic';
    case 'drunk':     return 'drunk';
    case 'sarcastic': return 'sarcastic';
    default:          return 'calm'; // content / focused / calm / stressed
  }
}

/** Convenience: the bubble emotion a character would speak with right now. */
export function getSpeechEmotion(char: any, ctx: MoodContext = {}): BubbleEmotion {
  return moodToBubbleEmotion(getMood(char, ctx).mood);
}

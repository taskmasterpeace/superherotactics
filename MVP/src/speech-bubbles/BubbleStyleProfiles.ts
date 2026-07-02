/**
 * Bubble style as DATA. The whole visual language of the comic dialogue system
 * lives in this one table — new modes are a data edit, not new render code.
 */

import type { BubbleMode, BubbleStyleProfile, DialogueBubbleEvent, BubbleEmotion } from './types';

// A single comic-forward font stack. Comic Neue is SIL-OFL (free for commercial);
// bundle it later if desired. Impact/system-ui are safe fallbacks everywhere.
const COMIC = '"Comic Neue", "Comic Sans MS", "Bangers", system-ui, sans-serif';
const IMPACT = '"Bangers", Impact, "Comic Neue", system-ui, sans-serif';
const MONO = '"Courier New", monospace';

export const BUBBLE_STYLES: Record<BubbleMode, BubbleStyleProfile> = {
  normal: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 3,
    fontFamily: COMIC, fontSize: 18, fontWeight: 700, textColor: '#111111',
    paddingX: 22, paddingY: 16, shape: 'rounded', outline: 'solid', tail: 'speech',
    animation: 'pop', maxTextWidth: 260,
  },
  whisper: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 2,
    fontFamily: COMIC, fontSize: 16, fontWeight: 500, textColor: '#444444',
    paddingX: 20, paddingY: 14, shape: 'rounded', outline: 'dashed', tail: 'speech',
    animation: 'fade', maxTextWidth: 240,
  },
  yell: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 4,
    fontFamily: IMPACT, fontSize: 24, fontWeight: 900, textColor: '#111111',
    paddingX: 30, paddingY: 24, shape: 'jagged', outline: 'solid', tail: 'speech',
    textTransform: 'uppercase', jitter: 8, animation: 'shake', maxTextWidth: 280,
  },
  angry: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 5,
    fontFamily: IMPACT, fontSize: 26, fontWeight: 900, textColor: '#111111',
    paddingX: 32, paddingY: 26, shape: 'jagged', outline: 'rough', tail: 'speech',
    textTransform: 'uppercase', jitter: 12, animation: 'shake', maxTextWidth: 280,
  },
  thought: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 3,
    fontFamily: COMIC, fontSize: 17, fontWeight: 600, textColor: '#111111',
    paddingX: 26, paddingY: 22, shape: 'cloud', outline: 'solid', tail: 'thought',
    animation: 'drift', maxTextWidth: 250,
  },
  drunk: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 3,
    fontFamily: COMIC, fontSize: 18, fontWeight: 700, textColor: '#111111',
    paddingX: 24, paddingY: 18, shape: 'wavy', outline: 'rough', tail: 'speech',
    wobble: 10, animation: 'pulse', maxTextWidth: 250,
  },
  radio: {
    fill: '#f5f5f5', stroke: '#111111', strokeWidth: 3,
    fontFamily: MONO, fontSize: 15, fontWeight: 700, textColor: '#111111',
    paddingX: 20, paddingY: 14, shape: 'rect', outline: 'solid', tail: 'radio',
    maxTextWidth: 300,
  },
  announcement: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 4,
    fontFamily: IMPACT, fontSize: 22, fontWeight: 900, textColor: '#111111',
    paddingX: 30, paddingY: 20, shape: 'jagged', outline: 'solid', tail: 'none',
    textTransform: 'uppercase', maxTextWidth: 340,
  },
  negative: {
    fill: '#111111', stroke: '#000000', strokeWidth: 3,
    fontFamily: IMPACT, fontSize: 20, fontWeight: 900, textColor: '#ffffff',
    paddingX: 26, paddingY: 18, shape: 'rounded', outline: 'solid', tail: 'speech',
    animation: 'shake', maxTextWidth: 260,
  },
  offscreen: {
    fill: '#ffffff', stroke: '#111111', strokeWidth: 3,
    fontFamily: COMIC, fontSize: 17, fontWeight: 700, textColor: '#111111',
    paddingX: 22, paddingY: 16, shape: 'rounded', outline: 'solid', tail: 'speech',
    animation: 'pop', maxTextWidth: 240,
  },
};

/**
 * Emotion/tactical-state -> bubble mode. Lets game systems say
 * `merc.morale = 'panic'; merc.says("We're surrounded!")` and get the right look
 * WITHOUT specifying a mode by hand. This is where the feature becomes game-feel.
 */
export function resolveBubbleMode(line: {
  isRadio?: boolean;
  isThought?: boolean;
  isOffscreen?: boolean;
  volume?: 'whisper' | 'normal' | 'shout';
  emotion?: BubbleEmotion;
  isAnnouncement?: boolean;
}): BubbleMode {
  if (line.isAnnouncement) return 'announcement';
  if (line.isRadio) return 'radio';
  if (line.isThought) return 'thought';
  if (line.isOffscreen) return 'offscreen';
  if (line.emotion === 'panic') return 'negative';
  if (line.emotion === 'angry') return 'angry';
  if (line.emotion === 'drunk') return 'drunk';
  if (line.volume === 'whisper') return 'whisper';
  if (line.volume === 'shout') return 'yell';
  return 'normal';
}

export function getStyle(event: DialogueBubbleEvent): BubbleStyleProfile {
  return BUBBLE_STYLES[event.mode] ?? BUBBLE_STYLES.normal;
}

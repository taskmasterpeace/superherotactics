/**
 * CHARACTER SPEECH BRIDGE
 *
 * Turns "this character says X" into a fully-styled speech bubble, choosing the
 * bubble's emotion from the speaker's current MOOD unless one is given. This is
 * the seam the phone-call dialogue screen (and combat barks) speak through, so
 * a rattled operative *sounds* rattled without anyone tagging every line.
 */

import { showBubble } from '../speech-bubbles/BubbleManager';
import type { BubbleMode, BubbleEmotion, DialogueBubbleEvent } from '../speech-bubbles/types';
import { getSpeechEmotion, MoodContext } from './moodSystem';

// When the caller doesn't pick a bubble mode, let the emotion suggest one.
function modeFromEmotion(emotion: BubbleEmotion, fallback: BubbleMode): BubbleMode {
  switch (emotion) {
    case 'angry': return 'angry';
    case 'drunk': return 'drunk';
    case 'panic': return 'yell';
    default:      return fallback;
  }
}

export interface SpeakOptions {
  mode?: BubbleMode;
  emotion?: BubbleEmotion;   // override the mood-derived emotion
  ctx?: MoodContext;         // combat/threatened/intoxicated hints for mood
  worldX?: number;
  worldY?: number;
  portraitUrl?: string;
  durationMs?: number;
  priority?: number;
  /** Default bubble mode when none is given (phone calls use 'radio'). */
  defaultMode?: BubbleMode;
}

/**
 * Fire a speech bubble for a character. Returns the bubble id.
 * `char` only needs id/name plus whatever mood inputs it has (morale,
 * personality, activeInjuries) — missing fields fall back to sensible defaults.
 */
export function speakAsCharacter(char: any, text: string, opts: SpeakOptions = {}): string {
  const emotion = opts.emotion ?? getSpeechEmotion(char, opts.ctx);
  const mode = opts.mode ?? modeFromEmotion(emotion, opts.defaultMode ?? 'normal');

  const event: DialogueBubbleEvent = {
    speakerId: String(char?.id ?? char?.name ?? char?.realName ?? 'unknown'),
    text,
    mode,
    emotion,
    worldX: opts.worldX ?? 0,
    worldY: opts.worldY ?? 0,
    portraitUrl: opts.portraitUrl ?? char?.portrait?.url,
    durationMs: opts.durationMs,
    priority: opts.priority,
  };
  return showBubble(event);
}

/** A phone-call line: same as speakAsCharacter but defaults to the radio style. */
export function speakOnCall(char: any, text: string, opts: SpeakOptions = {}): string {
  return speakAsCharacter(char, text, { defaultMode: 'radio', ...opts });
}

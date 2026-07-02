/**
 * Central speech-bubble manager. In a Jagged-Alliance-style game, dialogue comes
 * from mercs, enemies, radio, the narrator, morale reactions, overwatch warnings,
 * death screams — if each system spawns bubbles independently the UI is chaos.
 * Everything routes through here: lifetime, replacement-per-speaker, priority.
 *
 * The manager is world-space aware: it stores each bubble's world anchor; the
 * render layer projects to screen every frame (so bubbles track the camera).
 */

import { create } from 'zustand';
import type { DialogueBubbleEvent, ActiveBubble } from './types';
import { getStyle } from './BubbleStyleProfiles';
import { layoutText } from './TextLayout';

const DEFAULT_MS = 3200;
const MAX_BUBBLES = 12;

let counter = 0;

interface BubbleState {
  bubbles: ActiveBubble[];
  show: (event: DialogueBubbleEvent) => string;
  clearSpeaker: (speakerId: string) => void;
  remove: (id: string) => void;
  tick: (now: number) => void;
  clearAll: () => void;
}

export const useBubbleStore = create<BubbleState>((set, get) => ({
  bubbles: [],

  show: (event) => {
    const style = getStyle(event);
    const layout = layoutText(event.text, style);
    const now = Date.now();
    const id = `bubble_${now}_${counter++}`;
    const bubble: ActiveBubble = {
      id, event, style, layout,
      createdAt: now,
      expiresAt: now + (event.durationMs ?? DEFAULT_MS),
    };
    set(s => {
      // One bubble per speaker at a time (new line replaces the old).
      let next = s.bubbles.filter(b => b.event.speakerId !== event.speakerId);
      next.push(bubble);
      // Cap total; drop the lowest-priority / oldest first.
      if (next.length > MAX_BUBBLES) {
        next = next
          .sort((a, b) => (a.event.priority ?? 0) - (b.event.priority ?? 0) || a.createdAt - b.createdAt)
          .slice(next.length - MAX_BUBBLES);
      }
      return { bubbles: next };
    });
    return id;
  },

  clearSpeaker: (speakerId) =>
    set(s => ({ bubbles: s.bubbles.filter(b => b.event.speakerId !== speakerId) })),

  remove: (id) => set(s => ({ bubbles: s.bubbles.filter(b => b.id !== id) })),

  tick: (now) => {
    const expired = get().bubbles.some(b => b.expiresAt <= now);
    if (expired) set(s => ({ bubbles: s.bubbles.filter(b => b.expiresAt > now) }));
  },

  clearAll: () => set({ bubbles: [] }),
}));

/** Convenience: fire a bubble from anywhere in the game. */
export function showBubble(event: DialogueBubbleEvent): string {
  return useBubbleStore.getState().show(event);
}

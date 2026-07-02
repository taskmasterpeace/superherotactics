/**
 * Screen-space placement. Bubbles anchor to a speaker's SCREEN position (already
 * projected from world coords by the caller), sit above them when there's room,
 * flip below/beside when clamped, stay inside the viewport, and push apart when
 * they overlap. Never anchor bubbles directly in world space — camera pan/zoom
 * would break them; project first, then solve here.
 */

export interface Rect { x: number; y: number; w: number; h: number }
export interface Point { x: number; y: number }

export interface PlacementInput {
  anchor: Point;                 // speaker screen position (tail target)
  bubbleW: number;
  bubbleH: number;
  viewport: { w: number; h: number };
  occupied?: Rect[];             // already-placed bubble body rects
  gap?: number;                  // pixels between speaker head and bubble
  margin?: number;               // keep-inside-viewport margin
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Returns the bubble BODY CENTER in screen space + its body rect (for stacking). */
export function solvePlacement(input: PlacementInput): { center: Point; rect: Rect } {
  const gap = input.gap ?? 28;
  const margin = input.margin ?? 8;
  const { anchor, bubbleW, bubbleH, viewport, occupied = [] } = input;

  // Prefer above the speaker.
  let cx = anchor.x;
  let cy = anchor.y - gap - bubbleH / 2;

  // If it would clip the top, place below instead.
  if (cy - bubbleH / 2 < margin) cy = anchor.y + gap + bubbleH / 2;

  // Clamp inside viewport.
  cx = clamp(cx, margin + bubbleW / 2, viewport.w - margin - bubbleW / 2);
  cy = clamp(cy, margin + bubbleH / 2, viewport.h - margin - bubbleH / 2);

  // Resolve overlaps by nudging upward (then sideways) a few times.
  const rectAt = (x: number, y: number): Rect => ({ x: x - bubbleW / 2, y: y - bubbleH / 2, w: bubbleW, h: bubbleH });
  let rect = rectAt(cx, cy);
  for (let i = 0; i < 8; i++) {
    const hit = occupied.find(o => overlaps(rect, o));
    if (!hit) break;
    cy = hit.y - bubbleH / 2 - 6;           // stack above the thing we hit
    if (cy - bubbleH / 2 < margin) {         // no room above -> nudge sideways
      cy = clamp(cy, margin + bubbleH / 2, viewport.h - margin - bubbleH / 2);
      cx += bubbleW * 0.5;
      cx = clamp(cx, margin + bubbleW / 2, viewport.w - margin - bubbleW / 2);
    }
    rect = rectAt(cx, cy);
  }

  return { center: { x: cx, y: cy }, rect };
}

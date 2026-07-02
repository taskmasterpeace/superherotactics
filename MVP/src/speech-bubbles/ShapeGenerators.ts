/**
 * Procedural SVG path generators. Given the safe inner text box + style, produce
 * a BubbleGeometry: a body outline path, a tail toward the speaker, and (for
 * thought bubbles) the trailing dots. Jitter/wobble are DETERMINISTIC per bubble
 * (seeded by text) so the shape is stable across re-renders, not reshuffling.
 */

import type { BubbleStyleProfile, BubbleGeometry } from './types';

type Side = 'top' | 'right' | 'bottom' | 'left';

// Small deterministic PRNG (mulberry32) seeded per-bubble.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashText(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function sideFromToward(dx: number, dy: number): Side {
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

const TAIL_LEN = 24;

export interface ShapeInput {
  textWidth: number;
  textHeight: number;
  style: BubbleStyleProfile;
  /** Direction from bubble center to the speaker (screen space). Defaults down. */
  towardDx?: number;
  towardDy?: number;
  /** Stable seed source (usually the text). */
  seedKey: string;
}

export function generateBubble(input: ShapeInput): BubbleGeometry {
  const { style } = input;
  const rand = seeded(hashText(input.seedKey + style.shape));
  const bodyW = Math.round(input.textWidth + style.paddingX * 2);
  const bodyH = Math.round(input.textHeight + style.paddingY * 2);

  const towardDx = input.towardDx ?? 0;
  const towardDy = input.towardDy ?? 1;
  const side: Side = style.tail === 'none' ? 'bottom' : sideFromToward(towardDx, towardDy);

  // Margins reserve room for spikes/wobble + the tail on its side.
  const spike = style.shape === 'jagged' ? (style.jitter ?? 8) : style.shape === 'wavy' ? (style.wobble ?? 8) : 0;
  const m = Math.ceil(spike + style.strokeWidth + 2);
  const tail = style.tail !== 'none';
  const marginL = m + (side === 'left' && tail ? TAIL_LEN : 0);
  const marginT = m + (side === 'top' && tail ? TAIL_LEN : 0);
  const marginR = m + (side === 'right' && tail ? TAIL_LEN : 0);
  const marginB = m + (side === 'bottom' && tail ? TAIL_LEN : 0);

  const bx = marginL;
  const by = marginT;
  const svgWidth = marginL + bodyW + marginR;
  const svgHeight = marginT + bodyH + marginB;

  let bodyPath: string;
  switch (style.shape) {
    case 'rect': bodyPath = roundedRect(bx, by, bodyW, bodyH, 4); break;
    case 'rounded': bodyPath = roundedRect(bx, by, bodyW, bodyH, Math.min(22, bodyH / 2)); break;
    case 'jagged': bodyPath = jagged(bx, by, bodyW, bodyH, style.jitter ?? 8, rand); break;
    case 'wavy': bodyPath = wavy(bx, by, bodyW, bodyH, style.wobble ?? 8); break;
    case 'cloud': bodyPath = cloud(bx, by, bodyW, bodyH); break;
    default: bodyPath = roundedRect(bx, by, bodyW, bodyH, 16);
  }

  const thoughtDots: BubbleGeometry['thoughtDots'] = [];
  let tailPath = '';
  if (tail) {
    if (style.tail === 'thought') {
      thoughtDots.push(...thoughtTrail(bx, by, bodyW, bodyH, side));
    } else if (style.tail === 'radio') {
      tailPath = radioTail(bx, by, bodyW, bodyH, side);
    } else {
      tailPath = speechTail(bx, by, bodyW, bodyH, side);
    }
  }

  return {
    svgWidth, svgHeight,
    bodyX: bx, bodyY: by, bodyWidth: bodyW, bodyHeight: bodyH,
    bodyPath, tailPath, thoughtDots,
    textX: bx + style.paddingX,
    textY: by + style.paddingY,
  };
}

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return [
    `M ${x + rr} ${y}`,
    `H ${x + w - rr}`, `A ${rr} ${rr} 0 0 1 ${x + w} ${y + rr}`,
    `V ${y + h - rr}`, `A ${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}`,
    `H ${x + rr}`, `A ${rr} ${rr} 0 0 1 ${x} ${y + h - rr}`,
    `V ${y + rr}`, `A ${rr} ${rr} 0 0 1 ${x + rr} ${y}`,
    'Z',
  ].join(' ');
}

// Starburst around the body ellipse — alternating outer/inner radii + jitter.
function jagged(x: number, y: number, w: number, h: number, jit: number, rand: () => number): string {
  const cx = x + w / 2, cy = y + h / 2;
  const rx = w / 2, ry = h / 2;
  const spikes = Math.max(16, Math.round((w + h) / 28));
  let d = '';
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI * 2 * i) / (spikes * 2);
    const outer = i % 2 === 0;
    const j = (rand() - 0.5) * jit;
    const radX = rx + (outer ? jit + j : -jit * 0.4);
    const radY = ry + (outer ? jit + j : -jit * 0.4);
    const px = cx + Math.cos(angle) * radX;
    const py = cy + Math.sin(angle) * radY;
    d += i === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d + ' Z';
}

// Rounded body with a sine wobble along the perimeter (drunk).
function wavy(x: number, y: number, w: number, h: number, amp: number): string {
  const cx = x + w / 2, cy = y + h / 2;
  const rx = w / 2, ry = h / 2;
  const steps = 48;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * 2 * i) / steps;
    const wob = Math.sin(t * 3) * amp;
    const px = cx + Math.cos(t) * (rx + wob);
    const py = cy + Math.sin(t) * (ry + wob);
    d += i === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d + ' Z';
}

// Thought cloud — overlapping bumps around a rounded body.
function cloud(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2, cy = y + h / 2;
  const rx = w / 2, ry = h / 2;
  const bumps = Math.max(10, Math.round((w + h) / 34));
  const bump = Math.min(w, h) / 6 + 6;
  let d = '';
  for (let i = 0; i <= bumps; i++) {
    const t = (Math.PI * 2 * i) / bumps;
    const px = cx + Math.cos(t) * rx;
    const py = cy + Math.sin(t) * ry;
    if (i === 0) { d += `M ${px.toFixed(1)} ${py.toFixed(1)}`; continue; }
    const pt = (Math.PI * 2 * (i - 0.5)) / bumps;
    const mxp = cx + Math.cos(pt) * (rx + bump);
    const myp = cy + Math.sin(pt) * (ry + bump);
    d += ` Q ${mxp.toFixed(1)} ${myp.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d + ' Z';
}

function edgeMid(x: number, y: number, w: number, h: number, side: Side) {
  switch (side) {
    case 'bottom': return { ex: x + w * 0.5, ey: y + h, nx: 0, ny: 1 };
    case 'top': return { ex: x + w * 0.5, ey: y, nx: 0, ny: -1 };
    case 'left': return { ex: x, ey: y + h * 0.5, nx: -1, ny: 0 };
    case 'right': return { ex: x + w, ey: y + h * 0.5, nx: 1, ny: 0 };
  }
}

// Tails are OPEN paths (no base edge): fill closes implicitly for a solid
// triangle, but the stroke only draws the two sides — so the body outline
// underneath is covered by the tail fill and there's no seam line at the root.
// Base points are inset INTO the body so the overlap hides the body stroke.
const TAIL_INSET = 5;

function speechTail(x: number, y: number, w: number, h: number, side: Side): string {
  const { ex, ey, nx, ny } = edgeMid(x, y, w, h, side);
  const along = side === 'bottom' || side === 'top' ? { ax: 1, ay: 0 } : { ax: 0, ay: 1 };
  const base = 13;
  const ix = ex - nx * TAIL_INSET, iy = ey - ny * TAIL_INSET; // inset toward body center
  const b1x = ix - along.ax * base, b1y = iy - along.ay * base;
  const b2x = ix + along.ax * base * 0.35, b2y = iy + along.ay * base * 0.35;
  const tx = ex + nx * TAIL_LEN + along.ax * TAIL_LEN * 0.25;
  const ty = ey + ny * TAIL_LEN + along.ay * TAIL_LEN * 0.25;
  return `M ${b1x.toFixed(1)} ${b1y.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)} L ${b2x.toFixed(1)} ${b2y.toFixed(1)}`;
}

function radioTail(x: number, y: number, w: number, h: number, side: Side): string {
  const { ex, ey, nx, ny } = edgeMid(x, y, w, h, side);
  const along = side === 'bottom' || side === 'top' ? { ax: 1, ay: 0 } : { ax: 0, ay: 1 };
  const base = 9;
  const ix = ex - nx * TAIL_INSET, iy = ey - ny * TAIL_INSET;
  const b1x = ix - along.ax * base, b1y = iy - along.ay * base;
  const b2x = ix + along.ax * base, b2y = iy + along.ay * base;
  const tx = ex + nx * TAIL_LEN, ty = ey + ny * TAIL_LEN;
  return `M ${b1x.toFixed(1)} ${b1y.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)} L ${b2x.toFixed(1)} ${b2y.toFixed(1)}`;
}

function thoughtTrail(x: number, y: number, w: number, h: number, side: Side) {
  const { ex, ey, nx, ny } = edgeMid(x, y, w, h, side);
  const dots: Array<{ cx: number; cy: number; r: number }> = [];
  const radii = [6, 4.5, 3];
  let dist = 8;
  for (const r of radii) {
    dots.push({ cx: ex + nx * dist, cy: ey + ny * dist, r });
    dist += r * 2 + 4;
  }
  return dots;
}

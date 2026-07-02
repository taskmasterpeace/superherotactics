/**
 * Text-fitting engine. The bubble grows around the text; the text lives in a
 * safe inner rectangle (we do NOT try to flow text along a jagged outline —
 * that's a swamp). Wrap -> measure -> auto-size -> shrink-to-fit.
 */

import type { BubbleStyleProfile, TextLayoutResult } from './types';

// One shared offscreen canvas for measurement (canvas.measureText is accurate
// and cheap). Created lazily so this module is import-safe in non-DOM contexts.
let measureCtx: CanvasRenderingContext2D | null = null;
function ctx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d');
  }
  if (!measureCtx) throw new Error('speech-bubbles: no 2d canvas context for text measurement');
  return measureCtx;
}

function setFont(g: CanvasRenderingContext2D, style: BubbleStyleProfile, fontSize: number) {
  g.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
}

function measure(g: CanvasRenderingContext2D, text: string): number {
  return g.measureText(text).width;
}

/** Break a single over-long word so it never overflows the box. */
function hardBreak(g: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of word) {
    if (measure(g, cur + ch) > maxWidth && cur) {
      out.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function wrap(g: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (measure(g, word) > maxWidth) {
      // flush current line, then hard-break the giant word
      if (line) { lines.push(line); line = ''; }
      const pieces = hardBreak(g, word, maxWidth);
      lines.push(...pieces.slice(0, -1));
      line = pieces[pieces.length - 1] ?? '';
      continue;
    }
    const test = line ? `${line} ${word}` : word;
    if (measure(g, test) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export interface LayoutOptions {
  /** Override the style's maxTextWidth. */
  maxWidth?: number;
  /** Lower bound before we stop shrinking. */
  minFontSize?: number;
}

/**
 * Lay out text into the safe inner box. Wraps at the target width; if the result
 * is very tall (many lines) relative to width, shrinks the font a step at a time
 * so bubbles stay readable rather than becoming tall ribbons.
 */
export function layoutText(
  rawText: string,
  style: BubbleStyleProfile,
  opts: LayoutOptions = {}
): TextLayoutResult {
  const g = ctx();
  const maxWidth = Math.max(60, opts.maxWidth ?? style.maxTextWidth ?? 260);
  const minFont = opts.minFontSize ?? Math.max(11, Math.round(style.fontSize * 0.7));
  const text = (style.textTransform === 'uppercase' ? rawText.toUpperCase() : rawText).trim() || ' ';

  let fontSize = style.fontSize;
  let lines: string[] = [];
  let width = 0;

  // Shrink until the box is not absurdly tall, or we hit the min font.
  // (Tall ribbon heuristic: more than ~6 lines OR height > 2.2x width.)
  for (;;) {
    setFont(g, style, fontSize);
    lines = wrap(g, text, maxWidth);
    width = Math.max(...lines.map(l => measure(g, l)), 1);
    const lineHeight = Math.round(fontSize * 1.25);
    const height = lines.length * lineHeight;
    const tooTall = lines.length > 6 || height > width * 2.2 + fontSize;
    if (!tooTall || fontSize <= minFont) break;
    fontSize -= 1;
  }

  const lineHeight = Math.round(fontSize * 1.25);
  return {
    lines,
    width: Math.ceil(width),
    height: lines.length * lineHeight,
    fontSize,
    lineHeight,
  };
}

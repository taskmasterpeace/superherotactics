/**
 * Dynamic Comic Speech Bubble System — shared types.
 *
 * A procedural SVG bubble ENGINE (not hand-made images): every spoken line is a
 * structured dialogue event; the renderer resolves style -> lays out text ->
 * generates an SVG path -> solves screen placement -> renders. Style is DATA
 * (BubbleStyleProfile), so new expressive modes are cheap.
 *
 * Architecture (owner spec): types -> {StyleProfiles, ShapeGenerators, TextLayout,
 * PlacementSolver} -> Renderer -> {Manager, BubbleLab}.
 */

export type BubbleMode =
  | 'normal'
  | 'whisper'
  | 'yell'
  | 'angry'
  | 'thought'
  | 'drunk'
  | 'radio'
  | 'announcement'
  | 'negative'
  | 'offscreen';

export type BubbleEmotion =
  | 'calm'
  | 'afraid'
  | 'angry'
  | 'panic'
  | 'drunk'
  | 'sarcastic';

/** The structured event every spoken line becomes. */
export interface DialogueBubbleEvent {
  speakerId: string;
  text: string;
  mode: BubbleMode;
  emotion?: BubbleEmotion;
  /** World-space anchor the tail points to (tactical map coords). */
  worldX: number;
  worldY: number;
  portraitUrl?: string;
  durationMs?: number;
  /** Higher wins when bubbles collide / must be culled. */
  priority?: number;
}

export type BubbleShape = 'rounded' | 'cloud' | 'jagged' | 'wavy' | 'rect';
export type BubbleOutline = 'solid' | 'dashed' | 'rough' | 'double';
export type BubbleTail = 'speech' | 'thought' | 'radio' | 'none';
export type BubbleAnimation = 'pop' | 'shake' | 'fade' | 'pulse' | 'drift';

/** Bubble style as data — the whole visual language lives here. */
export interface BubbleStyleProfile {
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  textColor: string;
  paddingX: number;
  paddingY: number;
  shape: BubbleShape;
  outline: BubbleOutline;
  tail: BubbleTail;
  textTransform?: 'uppercase' | 'normal';
  /** Jagged spike amplitude (yell/angry). */
  jitter?: number;
  /** Wavy outline amplitude (drunk). */
  wobble?: number;
  animation?: BubbleAnimation;
  /** Max text box width in px before wrapping (soft cap; bubble grows to fit). */
  maxTextWidth?: number;
}

/** Result of the text-fitting engine — the safe inner box lines. */
export interface TextLayoutResult {
  lines: string[];
  /** Inner text box width (not including padding). */
  width: number;
  /** Inner text box height. */
  height: number;
  fontSize: number;
  lineHeight: number;
}

/** Where a bubble should point. */
export interface BubbleAnchor {
  targetScreenX: number;
  targetScreenY: number;
  preferredSide?: 'top' | 'right' | 'bottom' | 'left';
}

/** A generated bubble geometry ready to render. */
export interface BubbleGeometry {
  /** Total SVG canvas size (body + tail bounds). */
  svgWidth: number;
  svgHeight: number;
  /** Body box within the SVG (top-left origin). */
  bodyX: number;
  bodyY: number;
  bodyWidth: number;
  bodyHeight: number;
  /** SVG path for the body outline. */
  bodyPath: string;
  /** SVG path for the tail (empty when tail === 'none'). */
  tailPath: string;
  /** Trailing thought dots (cx,cy,r), empty unless tail === 'thought'. */
  thoughtDots: Array<{ cx: number; cy: number; r: number }>;
  /** Inner text box origin (where text tspans start). */
  textX: number;
  textY: number;
}

/** A live bubble the manager is tracking. */
export interface ActiveBubble {
  id: string;
  event: DialogueBubbleEvent;
  style: BubbleStyleProfile;
  layout: TextLayoutResult;
  createdAt: number;
  expiresAt: number;
}

// Dynamic Comic Speech Bubble System — public API.
export * from './types';
export { BUBBLE_STYLES, resolveBubbleMode, getStyle } from './BubbleStyleProfiles';
export { generateBubble } from './ShapeGenerators';
export { layoutText } from './TextLayout';
export { solvePlacement } from './PlacementSolver';
export { useBubbleStore, showBubble } from './BubbleManager';
export { SpeechBubble } from './SpeechBubbleRenderer';
export { default as BubbleLab } from './BubbleLab';

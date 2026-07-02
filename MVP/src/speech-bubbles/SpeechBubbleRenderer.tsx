import React, { useMemo } from 'react';
import type { DialogueBubbleEvent, BubbleOutline } from './types';
import { getStyle } from './BubbleStyleProfiles';
import { layoutText } from './TextLayout';
import { generateBubble } from './ShapeGenerators';
import './BubbleAnimations.css';

interface SpeechBubbleProps {
  event: DialogueBubbleEvent;
  /** Screen point where the bubble BODY should be centered. */
  bubbleCenter: { x: number; y: number };
  /** Screen point the tail should point to (the speaker). */
  anchor: { x: number; y: number };
  /** Play the entrance animation (default true). */
  animate?: boolean;
  exiting?: boolean;
  className?: string;
}

function dashArray(outline: BubbleOutline, strokeWidth: number): string | undefined {
  if (outline === 'dashed') return '6 5';
  return undefined;
}

/**
 * One rendered comic bubble as an absolutely-positioned SVG. Body outline +
 * seamless tail + centered text. Placement (bubbleCenter/anchor) is decided by
 * the caller (BubbleManager or the lab); this component is pure rendering.
 */
export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  event, bubbleCenter, anchor, animate = true, exiting = false, className,
}) => {
  const geo = useMemo(() => {
    const style = getStyle(event);
    const layout = layoutText(event.text, style);
    const towardDx = anchor.x - bubbleCenter.x;
    const towardDy = anchor.y - bubbleCenter.y;
    const g = generateBubble({
      textWidth: layout.width, textHeight: layout.height, style,
      towardDx, towardDy, seedKey: event.text + event.mode,
    });
    return { style, layout, g };
  }, [event.text, event.mode, anchor.x, anchor.y, bubbleCenter.x, bubbleCenter.y]);

  const { style, layout, g } = geo;

  // Position the SVG so the body's center lands on bubbleCenter.
  const bodyCx = g.bodyX + g.bodyWidth / 2;
  const bodyCy = g.bodyY + g.bodyHeight / 2;
  const left = Math.round(bubbleCenter.x - bodyCx);
  const top = Math.round(bubbleCenter.y - bodyCy);

  // Center text block vertically inside the body box.
  const firstBaseline = g.bodyY + (g.bodyHeight - layout.height) / 2 + layout.fontSize * 0.82;
  const cx = g.bodyX + g.bodyWidth / 2;

  const animClass = animate && style.animation ? `sb-anim-${style.animation}` : '';
  const dash = dashArray(style.outline, style.strokeWidth);

  return (
    <div
      className={`${animClass} ${exiting ? 'sb-exit' : ''} ${className ?? ''}`}
      style={{ position: 'absolute', left, top, pointerEvents: 'none', willChange: 'transform, opacity' }}
    >
      <svg width={g.svgWidth} height={g.svgHeight} style={{ overflow: 'visible', display: 'block' }}>
        {/* Body fill + outline */}
        <path
          d={g.bodyPath}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
        {/* Tail: open path so fill covers the body seam and stroke skips the base */}
        {g.tailPath && (
          <path
            d={g.tailPath}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {/* Thought trail dots */}
        {g.thoughtDots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r}
            fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} />
        ))}
        {/* Text */}
        <text
          x={cx}
          y={firstBaseline}
          textAnchor="middle"
          fontFamily={style.fontFamily}
          fontSize={layout.fontSize}
          fontWeight={style.fontWeight as number}
          fill={style.textColor}
          style={{ letterSpacing: '0.02em' }}
        >
          {layout.lines.map((line, i) => (
            <tspan key={i} x={cx} dy={i === 0 ? 0 : layout.lineHeight}>{line}</tspan>
          ))}
        </text>
      </svg>
    </div>
  );
};

export default SpeechBubble;

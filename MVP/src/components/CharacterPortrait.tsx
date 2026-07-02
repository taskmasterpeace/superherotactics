import React from 'react';
import { resolvePortrait } from '../data/characterSheet';

/**
 * A character's face. Renders real portrait art when the character's portrait
 * slot has a url; otherwise a deterministic placeholder (name initials + origin
 * glyph badge + stable non-purple tint). Drop real art into `portrait.url` later
 * and every CharacterPortrait upgrades with no other changes. Ready for the
 * phone-call screen (portrait on the side) and the roster.
 */
export interface CharacterPortraitProps {
  character: { id?: string; realName?: string; originType?: number; origin?: number; portrait?: any };
  size?: number;
  rounded?: boolean;
  showOriginBadge?: boolean;
  className?: string;
}

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  character, size = 48, rounded = false, showOriginBadge = true, className = '',
}) => {
  const p = resolvePortrait(character);
  const radius = rounded ? '9999px' : '10px';

  if (p.url) {
    return (
      <img
        src={p.url}
        alt={character.realName || 'portrait'}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: radius, objectFit: 'cover', border: '2px solid #000', display: 'block' }}
      />
    );
  }

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        border: '2px solid #000',
        // stable, non-purple tint from the deterministic hue
        background: `linear-gradient(150deg, oklch(0.42 0.09 ${p.hue}), oklch(0.28 0.07 ${p.hue}))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      title={character.realName}
    >
      <span
        style={{ fontSize: size * 0.42, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}
      >
        {p.initials}
      </span>
      {showOriginBadge && (
        <span
          style={{
            position: 'absolute', right: 0, bottom: 0,
            fontSize: Math.max(10, size * 0.28),
            background: 'rgba(0,0,0,0.65)', borderTopLeftRadius: 6, padding: '0 2px', lineHeight: 1.1,
          }}
        >
          {p.emoji}
        </span>
      )}
    </div>
  );
};

export default CharacterPortrait;

import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * Country flag with graceful fallback.
 *
 * Art lives in /public/assets/flags/<iso2>.png (currently the flagcdn.com set,
 * public domain, no attribution required). To restyle the whole game's flags
 * (e.g. the flaticon cartoon look), just replace the PNGs — every consumer
 * goes through this component. Unknown/fictional codes render a styled
 * two-letter badge instead, so nothing ever looks broken.
 */

const SIZES = {
  sm: 'w-5 h-[15px] text-[7px]',
  md: 'w-8 h-6 text-[9px]',
  lg: 'w-12 h-9 text-xs',
  xl: 'w-20 h-[60px] text-base',
} as const;

export interface CountryFlagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 2-letter ISO country code (any case). */
  code: string;
  /** Country name for alt text / tooltip. */
  name?: string;
  size?: keyof typeof SIZES;
  /** Hard retro border (default true to match the kit). */
  bordered?: boolean;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  name,
  size = 'md',
  bordered = true,
  className,
  ...props
}) => {
  const [failed, setFailed] = React.useState(false);
  const iso = (code || '').trim().toLowerCase();

  const frame = cn(
    'inline-flex items-center justify-center overflow-hidden align-middle shrink-0',
    bordered && 'border-2 border-black shadow-retro-sm',
    SIZES[size],
    className
  );

  if (!iso || iso.length !== 2 || failed) {
    return (
      <span
        className={cn(frame, 'bg-surface-light font-mono font-bold text-muted-foreground')}
        title={name || code}
        {...props}
      >
        {(code || '??').slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className={frame} title={name || code.toUpperCase()} {...props}>
      <img
        src={`/assets/flags/${iso}.png`}
        alt={name ? `Flag of ${name}` : `Flag ${code.toUpperCase()}`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  );
};

export default CountryFlag;

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 font-bold border-2 border-black rounded-md transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-surface text-foreground',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        accent: 'bg-accent text-accent-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'bg-transparent text-foreground',
        muted: 'bg-muted text-muted-foreground border-muted-foreground/30',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      shadow: {
        default: 'shadow-retro-sm',
        none: 'shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shadow: 'default',
    },
  }
);

export interface RetroBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

const RetroBadge = React.forwardRef<HTMLSpanElement, RetroBadgeProps>(
  ({ className, variant, size, shadow, icon, pulse, children, ...props }, ref) => {
    return (
      <span
        className={cn(
          badgeVariants({ variant, size, shadow, className }),
          pulse && 'animate-pulse'
        )}
        ref={ref}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

RetroBadge.displayName = 'RetroBadge';

// Status Badge - preconfigured for common game statuses
interface RetroStatusBadgeProps extends Omit<RetroBadgeProps, 'variant'> {
  status: 'ready' | 'busy' | 'injured' | 'traveling' | 'combat' | 'dead' | 'resting';
}

const statusConfig: Record<RetroStatusBadgeProps['status'], { variant: RetroBadgeProps['variant']; label: string }> = {
  ready: { variant: 'success', label: 'Ready' },
  busy: { variant: 'warning', label: 'Busy' },
  injured: { variant: 'destructive', label: 'Injured' },
  traveling: { variant: 'secondary', label: 'Traveling' },
  combat: { variant: 'accent', label: 'In Combat' },
  dead: { variant: 'muted', label: 'KIA' },
  resting: { variant: 'primary', label: 'Resting' },
};

const RetroStatusBadge = React.forwardRef<HTMLSpanElement, RetroStatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const config = statusConfig[status];
    return (
      <RetroBadge ref={ref} variant={config.variant} {...props}>
        {children || config.label}
      </RetroBadge>
    );
  }
);

RetroStatusBadge.displayName = 'RetroStatusBadge';

// Stat Badge - for displaying character stats
interface RetroStatBadgeProps extends Omit<RetroBadgeProps, 'variant'> {
  statName: string;
  value: number;
  maxValue?: number;
}

const RetroStatBadge = React.forwardRef<HTMLSpanElement, RetroStatBadgeProps>(
  ({ statName, value, maxValue = 100, ...props }, ref) => {
    const percentage = (value / maxValue) * 100;
    let variant: RetroBadgeProps['variant'] = 'default';

    if (percentage >= 80) variant = 'success';
    else if (percentage >= 50) variant = 'primary';
    else if (percentage >= 30) variant = 'warning';
    else variant = 'destructive';

    return (
      <RetroBadge ref={ref} variant={variant} {...props}>
        <span className="font-normal opacity-75">{statName}</span>
        <span>{value}</span>
      </RetroBadge>
    );
  }
);

RetroStatBadge.displayName = 'RetroStatBadge';

export { RetroBadge, RetroStatusBadge, RetroStatBadge, badgeVariants };

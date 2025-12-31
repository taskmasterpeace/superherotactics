import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const cardVariants = cva(
  'border-2 border-black rounded-lg transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        surface: 'bg-surface text-foreground',
        elevated: 'bg-surface-light text-foreground',
        primary: 'bg-primary/10 text-foreground border-primary',
        success: 'bg-success/10 text-foreground border-success',
        warning: 'bg-warning/10 text-foreground border-warning',
        destructive: 'bg-destructive/10 text-foreground border-destructive',
      },
      shadow: {
        default: 'shadow-retro',
        hover: 'shadow-retro hover:shadow-retro-hover hover:-translate-y-0.5',
        none: 'shadow-none',
        sm: 'shadow-retro-sm',
        lg: 'shadow-retro-lg',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      shadow: 'default',
      padding: 'md',
    },
  }
);

export interface RetroCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: React.ElementType;
}

const RetroCard = React.forwardRef<HTMLDivElement, RetroCardProps>(
  ({ className, variant, shadow, padding, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        className={cn(cardVariants({ variant, shadow, padding, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

RetroCard.displayName = 'RetroCard';

// Card Header subcomponent
const RetroCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4 border-b-2 border-black mb-4', className)}
    {...props}
  />
));
RetroCardHeader.displayName = 'RetroCardHeader';

// Card Title subcomponent
const RetroCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-bold leading-none tracking-tight text-primary', className)}
    {...props}
  />
));
RetroCardTitle.displayName = 'RetroCardTitle';

// Card Description subcomponent
const RetroCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
RetroCardDescription.displayName = 'RetroCardDescription';

// Card Content subcomponent
const RetroCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
RetroCardContent.displayName = 'RetroCardContent';

// Card Footer subcomponent
const RetroCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t-2 border-black mt-4', className)}
    {...props}
  />
));
RetroCardFooter.displayName = 'RetroCardFooter';

export {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardDescription,
  RetroCardContent,
  RetroCardFooter,
  cardVariants,
};

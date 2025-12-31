import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 font-semibold border-2 border-black rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
        outline: 'bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground',
        ghost: 'bg-transparent text-foreground hover:bg-surface-light border-transparent shadow-none',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        success: 'bg-success text-success-foreground hover:opacity-90',
        warning: 'bg-warning text-warning-foreground hover:opacity-90',
        accent: 'bg-accent text-accent-foreground hover:opacity-90',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        icon: 'p-2 w-10 h-10',
      },
      shadow: {
        default: 'shadow-retro hover:shadow-retro-hover active:shadow-retro-active hover:-translate-y-0.5 active:translate-y-0.5',
        none: 'shadow-none',
        sm: 'shadow-retro-sm hover:shadow-retro active:shadow-none hover:-translate-y-0.5 active:translate-y-0.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shadow: 'default',
    },
  }
);

export interface RetroButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const RetroButton = React.forwardRef<HTMLButtonElement, RetroButtonProps>(
  ({ className, variant, size, shadow, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, shadow, className }))}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

RetroButton.displayName = 'RetroButton';

export { RetroButton, buttonVariants };

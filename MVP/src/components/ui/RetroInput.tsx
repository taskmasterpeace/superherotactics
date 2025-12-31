import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inputVariants = cva(
  'w-full border-2 border-black rounded-lg bg-input text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-3 text-lg',
      },
      shadow: {
        default: 'shadow-retro-sm focus:shadow-retro',
        none: 'shadow-none',
      },
      state: {
        default: '',
        error: 'border-destructive focus:ring-destructive',
        success: 'border-success focus:ring-success',
      },
    },
    defaultVariants: {
      size: 'md',
      shadow: 'default',
      state: 'default',
    },
  }
);

export interface RetroInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const RetroInput = React.forwardRef<HTMLInputElement, RetroInputProps>(
  (
    {
      className,
      size,
      shadow,
      state,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const actualState = error ? 'error' : state;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            className={cn(
              inputVariants({ size, shadow, state: actualState, className }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10'
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-destructive font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);

RetroInput.displayName = 'RetroInput';

// Textarea variant
const textareaVariants = cva(
  'w-full border-2 border-black rounded-lg bg-input text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed resize-none',
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-sm min-h-[80px]',
        md: 'px-4 py-2 text-base min-h-[120px]',
        lg: 'px-5 py-3 text-lg min-h-[160px]',
      },
      shadow: {
        default: 'shadow-retro-sm focus:shadow-retro',
        none: 'shadow-none',
      },
      state: {
        default: '',
        error: 'border-destructive focus:ring-destructive',
        success: 'border-success focus:ring-success',
      },
    },
    defaultVariants: {
      size: 'md',
      shadow: 'default',
      state: 'default',
    },
  }
);

export interface RetroTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  hint?: string;
}

const RetroTextarea = React.forwardRef<HTMLTextAreaElement, RetroTextareaProps>(
  ({ className, size, shadow, state, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    const actualState = error ? 'error' : state;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(textareaVariants({ size, shadow, state: actualState, className }))}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-destructive font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);

RetroTextarea.displayName = 'RetroTextarea';

export { RetroInput, RetroTextarea, inputVariants, textareaVariants };

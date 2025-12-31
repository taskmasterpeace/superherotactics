import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const panelVariants = cva(
  'border-2 border-black rounded-xl transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-surface text-foreground',
        elevated: 'bg-surface-light text-foreground',
        card: 'bg-card text-card-foreground',
        primary: 'bg-primary/5 border-primary',
        glass: 'bg-surface/80 backdrop-blur-sm',
      },
      shadow: {
        default: 'shadow-retro',
        hover: 'shadow-retro hover:shadow-retro-hover hover:-translate-y-0.5',
        none: 'shadow-none',
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

export interface RetroPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const RetroPanel = React.forwardRef<HTMLDivElement, RetroPanelProps>(
  ({ className, variant, shadow, padding, title, icon, actions, children, ...props }, ref) => {
    const hasHeader = title || icon || actions;

    return (
      <div
        className={cn(panelVariants({ variant, shadow, padding, className }))}
        ref={ref}
        {...props}
      >
        {hasHeader && (
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black/30">
            <div className="flex items-center gap-2">
              {icon && <span className="text-primary">{icon}</span>}
              {title && (
                <h3 className="text-lg font-bold text-primary">{title}</h3>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

RetroPanel.displayName = 'RetroPanel';

// Collapsible Panel variant
interface RetroCollapsiblePanelProps extends RetroPanelProps {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const RetroCollapsiblePanel = React.forwardRef<HTMLDivElement, RetroCollapsiblePanelProps>(
  ({ title, icon, actions, children, defaultOpen = true, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    const handleToggle = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      onOpenChange?.(newState);
    };

    return (
      <RetroPanel ref={ref} {...props}>
        <div
          className="flex items-center justify-between cursor-pointer pb-3 mb-3 border-b-2 border-black/30"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            {title && (
              <h3 className="text-lg font-bold text-primary">{title}</h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <span
              className={cn(
                'text-primary transition-transform duration-200',
                isOpen ? 'rotate-180' : ''
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
        <div
          className={cn(
            'transition-all duration-200 overflow-hidden',
            isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          {children}
        </div>
      </RetroPanel>
    );
  }
);

RetroCollapsiblePanel.displayName = 'RetroCollapsiblePanel';

export { RetroPanel, RetroCollapsiblePanel, panelVariants };

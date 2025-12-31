import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tab List Container
const tabListVariants = cva(
  'flex border-2 border-black rounded-lg overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-surface',
        filled: 'bg-card',
        minimal: 'bg-transparent border-none gap-1',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Individual Tab
const tabVariants = cva(
  'relative flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all duration-200 border-r-2 border-black last:border-r-0',
  {
    variants: {
      variant: {
        default: 'bg-surface hover:bg-surface-light data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        filled: 'bg-card hover:bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        minimal: 'bg-transparent border-2 border-black rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-surface-light',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Tab Panel
const tabPanelVariants = cva(
  'mt-4 focus:outline-none',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      padding: 'none',
    },
  }
);

// Types
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

interface RetroTabsProps extends VariantProps<typeof tabListVariants> {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  children?: React.ReactNode;
}

interface RetroTabPanelProps extends VariantProps<typeof tabPanelVariants> {
  id: string;
  activeTab: string;
  className?: string;
  children?: React.ReactNode;
}

// Main Tabs Component
const RetroTabs = React.forwardRef<HTMLDivElement, RetroTabsProps>(
  ({ tabs, activeTab, onTabChange, variant, size, className, children }, ref) => {
    return (
      <div ref={ref} className={className}>
        <div
          role="tablist"
          className={cn(tabListVariants({ variant }))}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              data-state={activeTab === tab.id ? 'active' : 'inactive'}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={cn(
                tabVariants({ variant, size }),
                tab.disabled && 'opacity-50 cursor-not-allowed',
                variant === 'minimal' && 'border-r-0'
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge}
            </button>
          ))}
        </div>
        {children}
      </div>
    );
  }
);

RetroTabs.displayName = 'RetroTabs';

// Tab Panel Component
const RetroTabPanel = React.forwardRef<HTMLDivElement, RetroTabPanelProps>(
  ({ id, activeTab, padding, className, children }, ref) => {
    if (activeTab !== id) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`panel-${id}`}
        aria-labelledby={id}
        tabIndex={0}
        className={cn(tabPanelVariants({ padding, className }))}
      >
        {children}
      </div>
    );
  }
);

RetroTabPanel.displayName = 'RetroTabPanel';

// Simple Tab Context for convenience
interface RetroTabContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const RetroTabContext = React.createContext<RetroTabContextValue | null>(null);

const useRetroTabs = () => {
  const context = React.useContext(RetroTabContext);
  if (!context) {
    throw new Error('useRetroTabs must be used within a RetroTabProvider');
  }
  return context;
};

interface RetroTabProviderProps {
  defaultTab: string;
  children: React.ReactNode;
}

const RetroTabProvider: React.FC<RetroTabProviderProps> = ({ defaultTab, children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  return (
    <RetroTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </RetroTabContext.Provider>
  );
};

export {
  RetroTabs,
  RetroTabPanel,
  RetroTabProvider,
  useRetroTabs,
  tabListVariants,
  tabVariants,
  tabPanelVariants,
};

export type { Tab, RetroTabsProps, RetroTabPanelProps };

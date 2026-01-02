// RetroUI Component Library
// SuperHero Tactics - NeoBrutalism Purple Theme

// Button
export { RetroButton, buttonVariants } from './RetroButton';
export type { RetroButtonProps } from './RetroButton';

// Card
export {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardDescription,
  RetroCardContent,
  RetroCardFooter,
  cardVariants,
} from './RetroCard';
export type { RetroCardProps } from './RetroCard';

// Panel
export { RetroPanel, RetroCollapsiblePanel, panelVariants } from './RetroPanel';
export type { RetroPanelProps } from './RetroPanel';

// Input
export { RetroInput, RetroTextarea, inputVariants, textareaVariants } from './RetroInput';
export type { RetroInputProps, RetroTextareaProps } from './RetroInput';

// Badge
export { RetroBadge, RetroStatusBadge, RetroStatBadge, badgeVariants } from './RetroBadge';
export type { RetroBadgeProps } from './RetroBadge';

// Tabs
export {
  RetroTabs,
  RetroTabPanel,
  RetroTabProvider,
  useRetroTabs,
  tabListVariants,
  tabVariants,
  tabPanelVariants,
} from './RetroTabs';
export type { Tab, RetroTabsProps, RetroTabPanelProps } from './RetroTabs';

// Modal
export { RetroModal, RetroConfirmDialog, RetroAlertDialog, modalVariants } from './RetroModal';

// Device Components (Laptop & Phone)
export {
  DeviceStatusBar,
  AppIcon,
  AppGrid,
  RetroPhone,
  RetroLaptop,
  PhoneHomeScreen,
  LaptopDesktop,
} from './RetroDevice';

// Loading States
export {
  LoadingSpinner,
  LoadingOverlay,
  LoadingCard,
  SkeletonList,
  LoadingButton,
  EmptyState,
  ProgressLoader,
  SuspenseFallback,
} from './LoadingStates';

// Error Handling
export { default as ErrorBoundary, withErrorBoundary, ErrorFallback } from './ErrorBoundary';

// Utility: cn function for className merging
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

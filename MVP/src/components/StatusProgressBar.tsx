/**
 * StatusProgressBar Component
 *
 * Simple progress bar for character activities:
 * - Patrol progress
 * - Research progress
 * - Hospital recovery
 * - Training
 * - Travel
 *
 * Just shows what they're doing and how far along.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Shield,
  BookOpen,
  Heart,
  Plane,
  Search,
  Crosshair,
  Coffee,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type ActivityType =
  | 'idle'
  | 'patrol'
  | 'travel'
  | 'training'
  | 'research'
  | 'hospital'
  | 'mission'
  | 'rest';

interface StatusProgressBarProps {
  activity: ActivityType;
  progress: number;  // 0-100
  label?: string;    // Custom label override
  timeRemaining?: string;  // "2h 30m" etc
  compact?: boolean;
  className?: string;
}

// =============================================================================
// ACTIVITY CONFIG
// =============================================================================

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  defaultLabel: string;
}> = {
  idle: {
    icon: <Coffee className="w-3 h-3" />,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-700',
    defaultLabel: 'Standing By',
  },
  patrol: {
    icon: <Shield className="w-3 h-3" />,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-900/30',
    defaultLabel: 'Patrolling',
  },
  travel: {
    icon: <Plane className="w-3 h-3" />,
    color: 'bg-cyan-500',
    bgColor: 'bg-cyan-900/30',
    defaultLabel: 'Traveling',
  },
  training: {
    icon: <BookOpen className="w-3 h-3" />,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-900/30',
    defaultLabel: 'Training',
  },
  research: {
    icon: <Search className="w-3 h-3" />,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-900/30',
    defaultLabel: 'Researching',
  },
  hospital: {
    icon: <Heart className="w-3 h-3" />,
    color: 'bg-red-500',
    bgColor: 'bg-red-900/30',
    defaultLabel: 'Recovering',
  },
  mission: {
    icon: <Crosshair className="w-3 h-3" />,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-900/30',
    defaultLabel: 'On Mission',
  },
  rest: {
    icon: <Coffee className="w-3 h-3" />,
    color: 'bg-green-500',
    bgColor: 'bg-green-900/30',
    defaultLabel: 'Resting',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const StatusProgressBar: React.FC<StatusProgressBarProps> = ({
  activity,
  progress,
  label,
  timeRemaining,
  compact = false,
  className = '',
}) => {
  const config = ACTIVITY_CONFIG[activity];
  const displayLabel = label || config.defaultLabel;

  if (compact) {
    // Ultra-compact: just the bar
    return (
      <div className={`w-full h-1.5 ${config.bgColor} rounded-full overflow-hidden ${className}`}>
        <motion.div
          className={`h-full ${config.color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} rounded-lg p-2 ${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`${config.color.replace('bg-', 'text-')}`}>
            {config.icon}
          </span>
          <span className="text-xs font-medium text-gray-200">
            {displayLabel}
          </span>
        </div>
        {timeRemaining && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            {timeRemaining}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${config.color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Percentage */}
      <div className="text-right text-[10px] text-gray-500 mt-0.5">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

// =============================================================================
// MINI VERSION - For character cards
// =============================================================================

interface MiniStatusBarProps {
  activity: ActivityType;
  progress: number;
  showIcon?: boolean;
}

export const MiniStatusBar: React.FC<MiniStatusBarProps> = ({
  activity,
  progress,
  showIcon = true,
}) => {
  const config = ACTIVITY_CONFIG[activity];

  return (
    <div className="flex items-center gap-1.5 w-full">
      {showIcon && (
        <span className={`${config.color.replace('bg-', 'text-')} flex-shrink-0`}>
          {config.icon}
        </span>
      )}
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.color} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[9px] text-gray-500 w-6 text-right">
        {Math.round(progress)}%
      </span>
    </div>
  );
};

// =============================================================================
// HELPER: Calculate progress from timestamps
// =============================================================================

export function calculateProgress(startTime: number, endTime: number, now: number = Date.now()): number {
  if (now >= endTime) return 100;
  if (now <= startTime) return 0;

  const total = endTime - startTime;
  const elapsed = now - startTime;
  return Math.round((elapsed / total) * 100);
}

export function formatTimeRemaining(endTime: number, now: number = Date.now()): string {
  const remaining = Math.max(0, endTime - now);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default StatusProgressBar;

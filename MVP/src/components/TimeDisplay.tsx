import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sunrise, Sunset, Play, Pause, FastForward, Clock } from 'lucide-react';
import { TIME_SPEEDS, TimeSpeed } from '../stores/enhancedGameStore';
import { getTimeEngine } from '../data/timeEngine';
import type { TimeOfDay } from '../data/timeSystem';

// ============================================================================
// PROPS-BASED INTERFACE (original)
// ============================================================================

interface TimeDisplayProps {
  // Time data
  minutes: number;      // 0-1439 (minutes since midnight)
  day: number;          // Day of game (1+)
  year: number;         // Year of game (1+)

  // Time control
  timeSpeed: TimeSpeed;
  isPaused: boolean;
  onTogglePause: () => void;
  onSpeedChange: () => void;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  minutes,
  day,
  year,
  timeSpeed,
  isPaused,
  onTogglePause,
  onSpeedChange,
}) => {
  // Calculate hours and minutes
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hours12 = hours24 % 12 || 12;
  const period = hours24 < 12 ? 'AM' : 'PM';
  const timeString = `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;

  // Day of week (0 = Sunday)
  const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = dayOfWeekNames[(day - 1) % 7];

  // Determine time period and icon
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  let TimeIcon: typeof Sun;
  let iconColor: string;
  let timeLabel: string;

  if (hours24 >= 6 && hours24 < 12) {
    timeOfDay = 'morning';
    TimeIcon = Sunrise;
    iconColor = 'text-orange-400';
    timeLabel = 'Morning';
  } else if (hours24 >= 12 && hours24 < 18) {
    timeOfDay = 'afternoon';
    TimeIcon = Sun;
    iconColor = 'text-yellow-400';
    timeLabel = 'Afternoon';
  } else if (hours24 >= 18 && hours24 < 22) {
    timeOfDay = 'evening';
    TimeIcon = Sunset;
    iconColor = 'text-orange-500';
    timeLabel = 'Evening';
  } else {
    timeOfDay = 'night';
    TimeIcon = Moon;
    iconColor = 'text-blue-300';
    timeLabel = 'Night';
  }

  const speedLabel = TIME_SPEEDS[timeSpeed]?.label || 'PAUSED';

  return (
    <div className="flex items-center gap-3 bg-[#0d1a2d]/95 border border-cyan-600/40 rounded-lg p-2 shadow-lg">
      {/* Play/Pause and Speed Controls */}
      <div className="flex items-center gap-1 bg-[#1a2a3d] rounded-lg p-1 border border-cyan-600/30">
        <button
          onClick={onTogglePause}
          className={`p-1.5 rounded transition-colors ${
            isPaused
              ? 'bg-green-600 text-white hover:bg-green-500'
              : 'bg-yellow-600 text-white hover:bg-yellow-500'
          }`}
          title={isPaused ? 'Play (Resume time)' : 'Pause'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        <button
          onClick={onSpeedChange}
          className="px-2 py-1.5 rounded bg-cyan-700 text-white hover:bg-cyan-600 transition-colors flex items-center gap-1"
          title="Change speed (1X → 10X → 60X → 360X)"
        >
          <FastForward className="w-4 h-4" />
          <span className="text-xs font-bold min-w-[32px] text-center">{speedLabel}</span>
        </button>
      </div>

      {/* Time of Day Icon and Current Time */}
      <div className="flex items-center gap-2 bg-[#1a2a3d] rounded-lg px-3 py-2 border border-cyan-600/30">
        <TimeIcon className={`w-5 h-5 ${iconColor}`} />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-white font-mono text-base font-bold">{timeString}</span>
          <span className="text-cyan-300 text-xs uppercase tracking-wide">{timeLabel}</span>
        </div>
      </div>

      {/* Day of Week */}
      <div className="flex flex-col items-center bg-[#1a2a3d] rounded-lg px-3 py-2 border border-cyan-600/30">
        <Clock className="w-4 h-4 text-cyan-400 mb-0.5" />
        <span className="text-white font-bold text-sm">{dayOfWeek}</span>
      </div>

      {/* Date (Day X of Year Y) */}
      <div className="flex flex-col items-start bg-[#1a2a3d] rounded-lg px-3 py-2 border border-cyan-600/30">
        <span className="text-white font-mono text-base font-bold leading-tight">Day {day}</span>
        <span className="text-cyan-400 text-xs uppercase leading-tight">Year {year}</span>
      </div>
    </div>
  );
};

export default TimeDisplay;

// ============================================================================
// TIME ENGINE INTEGRATED COMPONENTS (TA-008)
// ============================================================================

/**
 * Standalone TimeEngine display - pulls time from TimeEngine singleton
 * Use when you don't want to pass time props manually
 */
export interface TimeEngineDisplayProps {
  /** Show compact version (icon + time only) */
  compact?: boolean;
  /** Show date along with time */
  showDate?: boolean;
  /** Show time controls (wait buttons) */
  showControls?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const TimeEngineDisplay: React.FC<TimeEngineDisplayProps> = ({
  compact = false,
  showDate = true,
  showControls = false,
  className = '',
}) => {
  const [, forceUpdate] = useState({});
  const timeEngine = getTimeEngine();

  // Subscribe to time changes
  useEffect(() => {
    const unsubscribe = timeEngine.on('tick', () => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [timeEngine]);

  const gameTime = timeEngine.getTime();
  const hour = gameTime.hour;
  const mins = Math.floor((gameTime.totalHours % 1) * 60);

  // Time of day styling
  let TimeIcon: typeof Sun;
  let iconColor: string;
  let timeLabel: string;
  let bgGradient: string;

  switch (gameTime.timeOfDay) {
    case 'morning':
      TimeIcon = Sunrise;
      iconColor = 'text-orange-400';
      timeLabel = 'Morning';
      bgGradient = 'from-orange-900/50 to-yellow-900/50';
      break;
    case 'afternoon':
      TimeIcon = Sun;
      iconColor = 'text-yellow-400';
      timeLabel = 'Afternoon';
      bgGradient = 'from-yellow-900/50 to-amber-900/50';
      break;
    case 'evening':
      TimeIcon = Sunset;
      iconColor = 'text-orange-500';
      timeLabel = 'Evening';
      bgGradient = 'from-orange-900/50 to-purple-900/50';
      break;
    case 'night':
    default:
      TimeIcon = Moon;
      iconColor = 'text-blue-300';
      timeLabel = 'Night';
      bgGradient = 'from-indigo-900/50 to-purple-900/50';
      break;
  }

  const hours12 = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';
  const timeString = `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;

  // Day of week
  const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = dayOfWeekNames[gameTime.date.dayOfWeek];

  // Compact mode
  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-2 px-2 py-1 rounded
          bg-gradient-to-r ${bgGradient}
          border border-cyan-600/40
          ${className}
        `}
      >
        <TimeIcon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-white font-mono text-sm font-bold">{timeString}</span>
        {gameTime.isWeekend && (
          <span className="text-cyan-300 text-xs">🅆</span>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className={`
        flex items-center gap-3 bg-gradient-to-r ${bgGradient}
        border border-cyan-600/40 rounded-lg p-3 shadow-lg
      `}>
        {/* Time of day icon and current time */}
        <div className="flex items-center gap-2 flex-1">
          <TimeIcon className={`w-6 h-6 ${iconColor}`} />
          <div className="flex flex-col leading-tight">
            <span className="text-white font-mono text-lg font-bold">{timeString}</span>
            <span className="text-cyan-300 text-xs uppercase">{timeLabel}</span>
          </div>
        </div>

        {/* Day of week */}
        <div className="flex flex-col items-center px-2">
          <span className="text-white font-bold text-sm">{dayOfWeek}</span>
          {gameTime.isWeekend && (
            <span className="text-cyan-400 text-xs">Weekend</span>
          )}
        </div>

        {/* Date */}
        {showDate && (
          <div className="flex flex-col items-end">
            <span className="text-white font-mono text-sm font-bold">
              {gameTime.date.day} {getMonthName(gameTime.date.month)}
            </span>
            <span className="text-cyan-400 text-xs">{gameTime.date.year}</span>
          </div>
        )}
      </div>

      {/* Time controls */}
      {showControls && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Wait:</span>
          {[1, 6, 12, 24].map((hours) => (
            <button
              key={hours}
              onClick={() => timeEngine.advanceTime(hours)}
              className="px-2 py-1 rounded text-xs font-medium
                bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              {hours}h
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Get month name from month number (1-12)
 */
function getMonthName(month: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || 'Jan';
}

/**
 * Mini time badge for HUD overlay
 */
export const TimeBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [, forceUpdate] = useState({});
  const timeEngine = getTimeEngine();

  useEffect(() => {
    const unsub = timeEngine.on('hour_change', () => forceUpdate({}));
    return unsub;
  }, [timeEngine]);

  const gameTime = timeEngine.getTime();
  const hour = gameTime.hour;
  const hours12 = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';

  let icon: string;
  switch (gameTime.timeOfDay) {
    case 'morning': icon = '🌅'; break;
    case 'afternoon': icon = '☀️'; break;
    case 'evening': icon = '🌆'; break;
    case 'night': default: icon = '🌙'; break;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      bg-gray-800/80 text-white text-xs font-mono ${className}`}>
      {icon} {hours12}:00 {period}
    </span>
  );
};

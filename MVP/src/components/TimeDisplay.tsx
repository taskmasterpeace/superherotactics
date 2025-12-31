import React from 'react';
import { Sun, Moon, Sunrise, Sunset, Play, Pause, FastForward, Clock } from 'lucide-react';
import { TIME_SPEEDS, TimeSpeed } from '../stores/enhancedGameStore';

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

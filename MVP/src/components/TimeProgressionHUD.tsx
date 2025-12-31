import React, { useState } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import TimeDisplay from './TimeDisplay';
import CalendarWidget from './CalendarWidget';
import { Calendar, X } from 'lucide-react';

/**
 * TimeProgressionHUD - Comprehensive time progression UI component
 *
 * Features:
 * - TimeDisplay: Current time, day/night icon, speed controls
 * - CalendarWidget: Mini calendar (toggleable)
 * - Integrates with enhancedGameStore time system
 *
 * Usage:
 * - Add to WorldMapGrid top bar or any view that needs time controls
 * - Automatically syncs with store time state
 */
export const TimeProgressionHUD: React.FC = () => {
  const [showCalendar, setShowCalendar] = useState(false);

  // Get time system from store
  const {
    gameTime,
    timeSpeed,
    isTimePaused,
    togglePause,
    cycleTimeSpeed,
  } = useGameStore();

  return (
    <div className="relative">
      {/* Time Display - Always Visible */}
      <div className="flex items-center gap-2">
        <TimeDisplay
          minutes={gameTime.minutes}
          day={gameTime.day}
          year={gameTime.year}
          timeSpeed={timeSpeed}
          isPaused={isTimePaused}
          onTogglePause={togglePause}
          onSpeedChange={cycleTimeSpeed}
        />

        {/* Calendar Toggle Button */}
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`p-2 rounded-lg border transition-colors ${
            showCalendar
              ? 'bg-cyan-600 border-cyan-400 text-white'
              : 'bg-[#1a2a3d] border-cyan-600/30 text-cyan-400 hover:bg-cyan-700 hover:text-white'
          }`}
          title="Toggle Calendar"
        >
          <Calendar className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Widget - Popup */}
      {showCalendar && (
        <div className="absolute top-full mt-2 right-0 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setShowCalendar(false)}
              className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg"
              title="Close Calendar"
            >
              <X className="w-4 h-4" />
            </button>

            <CalendarWidget
              currentDay={gameTime.day}
              currentYear={gameTime.year}
              scheduledEvents={[
                // Example events - in a real implementation, these would come from:
                // - travelingUnits (arrival times)
                // - medicalQueue (recovery completion)
                // - scheduled missions
                // For now, empty array
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeProgressionHUD;

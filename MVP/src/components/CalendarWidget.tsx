import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Circle } from 'lucide-react';

interface CalendarWidgetProps {
  currentDay: number;     // Day of year (1-365)
  currentYear: number;
  scheduledEvents?: {     // Optional: future feature for marking days with events
    day: number;
    year: number;
    type: 'mission' | 'arrival' | 'recovery' | 'other';
  }[];
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  currentDay,
  currentYear,
  scheduledEvents = [],
}) => {
  // Calculate which month and day-of-month we're in
  // Using simplified 30-day months for game calendar
  const DAYS_PER_MONTH = 30;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const currentMonth = Math.floor((currentDay - 1) / DAYS_PER_MONTH);
  const dayOfMonth = ((currentDay - 1) % DAYS_PER_MONTH) + 1;
  const monthName = MONTHS[currentMonth] || 'Month ' + (currentMonth + 1);

  // Build calendar grid for current month (30 days, starting on Sunday)
  // Calculate first day of month
  const firstDayOfMonth = currentMonth * DAYS_PER_MONTH + 1;
  const startDayOfWeek = (firstDayOfMonth - 1) % 7; // 0 = Sunday

  // Generate calendar cells (includes padding for week alignment)
  const calendarCells: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= DAYS_PER_MONTH; i++) {
    calendarCells.push(i);
  }

  // Check if a day has scheduled events
  const hasEvent = (dayOfMonth: number) => {
    const dayOfYear = currentMonth * DAYS_PER_MONTH + dayOfMonth;
    return scheduledEvents.some(
      event => event.day === dayOfYear && event.year === currentYear
    );
  };

  return (
    <div className="bg-[#0d1a2d]/95 border border-cyan-600/40 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-700 to-cyan-600 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">{monthName} Year {currentYear}</span>
        </div>
        <div className="flex gap-1">
          <button className="p-1 rounded hover:bg-white/20 transition-colors text-white">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button className="p-1 rounded hover:bg-white/20 transition-colors text-white">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div
              key={idx}
              className="text-center text-cyan-400 text-[10px] font-bold"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar dates */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            const isToday = day === dayOfMonth;
            const hasEventMarker = day ? hasEvent(day) : false;

            return (
              <div
                key={idx}
                className={`
                  aspect-square flex items-center justify-center relative rounded text-xs
                  ${!day ? 'invisible' : ''}
                  ${isToday
                    ? 'bg-yellow-500 text-black font-bold ring-2 ring-yellow-300'
                    : 'bg-[#1a2a3d] text-cyan-100 hover:bg-cyan-900/40'
                  }
                  transition-colors cursor-pointer
                `}
                title={day ? `Day ${currentMonth * DAYS_PER_MONTH + day}` : ''}
              >
                {day}
                {hasEventMarker && (
                  <Circle className="absolute top-0.5 right-0.5 w-1.5 h-1.5 fill-green-400 text-green-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Date Summary */}
      <div className="bg-[#1a2a3d] px-3 py-2 border-t border-cyan-600/30">
        <div className="flex items-center justify-between">
          <span className="text-cyan-400 text-xs">Today:</span>
          <span className="text-white font-mono font-bold text-sm">
            {monthName} {dayOfMonth}, Y{currentYear}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-cyan-400 text-xs">Day of Year:</span>
          <span className="text-cyan-300 font-mono text-sm">{currentDay}/365</span>
        </div>
      </div>

      {/* Event Legend (if there are events) */}
      {scheduledEvents.length > 0 && (
        <div className="bg-[#1a2a3d]/50 px-3 py-2 border-t border-cyan-600/20">
          <div className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-green-400 text-green-400" />
            <span className="text-cyan-400/70 text-[10px]">Scheduled Event</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;

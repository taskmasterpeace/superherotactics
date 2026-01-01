/**
 * Event Log Component (WE-008)
 *
 * Displays recent world events from the WorldSimulation.
 * Shows active events, their effects, and expiration times.
 */

import React, { useState, useEffect } from 'react';
import { getWorldSimulation } from '../data/worldSimulation';
import { getTimeEngine } from '../data/timeEngine';
import {
  getEventLogEntries,
  EventLogEntry,
  EVENT_CATEGORY_DISPLAY,
  EVENT_IMPORTANCE_DISPLAY,
} from '../data/worldNewsIntegration';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface EventLogProps {
  /** Maximum events to display */
  maxEvents?: number;
  /** Show only active events */
  activeOnly?: boolean;
  /** Filter by category */
  categoryFilter?: string;
  /** Compact mode (less detail) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// EVENT LOG COMPONENT
// ============================================================================

export const EventLog: React.FC<EventLogProps> = ({
  maxEvents = 10,
  activeOnly = false,
  categoryFilter,
  compact = false,
  className = '',
}) => {
  const [entries, setEntries] = useState<EventLogEntry[]>([]);

  // Refresh entries on time changes
  useEffect(() => {
    const refreshEntries = () => {
      let allEntries = getEventLogEntries(maxEvents * 2); // Get more to filter

      if (activeOnly) {
        allEntries = allEntries.filter(e => e.isActive);
      }

      if (categoryFilter) {
        allEntries = allEntries.filter(e => e.category === categoryFilter);
      }

      setEntries(allEntries.slice(0, maxEvents));
    };

    refreshEntries();

    // Subscribe to time changes
    const engine = getTimeEngine();
    const unsubscribe = engine.on('hour_change', refreshEntries);

    return unsubscribe;
  }, [maxEvents, activeOnly, categoryFilter]);

  if (entries.length === 0) {
    return (
      <div className={`p-4 text-gray-400 text-center ${className}`}>
        No recent world events
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {entries.map(entry => (
          <CompactEventEntry key={entry.id} entry={entry} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {entries.map(entry => (
        <FullEventEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
};

// ============================================================================
// EVENT ENTRY COMPONENTS
// ============================================================================

const CompactEventEntry: React.FC<{ entry: EventLogEntry }> = ({ entry }) => {
  const categoryInfo = EVENT_CATEGORY_DISPLAY[entry.category];
  const importanceInfo = EVENT_IMPORTANCE_DISPLAY[entry.importance];

  return (
    <div className={`
      flex items-center gap-2 px-2 py-1 rounded
      ${entry.isActive ? 'bg-gray-800/50' : 'bg-gray-900/30 opacity-60'}
      border-l-2 ${entry.importance === 'critical' ? 'border-red-500' : 'border-transparent'}
    `}>
      <span className="text-sm">{categoryInfo.icon}</span>
      <span className={`text-sm flex-1 truncate ${importanceInfo.color}`}>
        {entry.headline}
      </span>
      {entry.isActive && entry.expiresIn !== undefined && entry.expiresIn > 0 && (
        <span className="text-xs text-gray-500">{entry.expiresIn}h</span>
      )}
    </div>
  );
};

const FullEventEntry: React.FC<{ entry: EventLogEntry }> = ({ entry }) => {
  const categoryInfo = EVENT_CATEGORY_DISPLAY[entry.category];
  const importanceInfo = EVENT_IMPORTANCE_DISPLAY[entry.importance];

  return (
    <div className={`
      p-3 rounded-lg
      ${entry.isActive ? 'bg-gray-800/70' : 'bg-gray-900/50 opacity-70'}
      ${entry.importance === 'critical' ? 'border border-red-500/50' : 'border border-gray-700/30'}
    `}>
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className="text-xl">{categoryInfo.icon}</span>
        <div className="flex-1">
          <h3 className={`font-medium ${importanceInfo.color}`}>
            {entry.headline}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span className={categoryInfo.color}>{categoryInfo.label}</span>
            <span>•</span>
            <span>{entry.location}</span>
            <span>•</span>
            <span>{entry.timestamp}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      {entry.isActive && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded">
            Active
          </span>
          {entry.expiresIn !== undefined && entry.expiresIn > 0 && (
            <span className="text-gray-400">
              Expires in {entry.expiresIn}h
            </span>
          )}
          {entry.expiresIn === undefined && (
            <span className="text-gray-400">
              Permanent change
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EVENT PANEL (Full Panel with Header)
// ============================================================================

export interface EventPanelProps {
  title?: string;
  maxEvents?: number;
  showFilters?: boolean;
  className?: string;
}

export const EventPanel: React.FC<EventPanelProps> = ({
  title = 'World Events',
  maxEvents = 10,
  showFilters = true,
  className = '',
}) => {
  const [activeOnly, setActiveOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  const categories = Object.entries(EVENT_CATEGORY_DISPLAY);

  return (
    <div className={`bg-gray-900/80 rounded-lg border border-cyan-600/30 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {showFilters && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveOnly(!activeOnly)}
              className={`px-2 py-1 text-xs rounded transition-colors
                ${activeOnly
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              Active Only
            </button>
          </div>
        )}
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-700/30">
          <button
            onClick={() => setCategoryFilter(undefined)}
            className={`px-2 py-1 text-xs rounded transition-colors
              ${!categoryFilter
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            All
          </button>
          {categories.map(([key, info]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1
                ${categoryFilter === key
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              <span>{info.icon}</span>
              <span className="hidden sm:inline">{info.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Event List */}
      <div className="p-2 max-h-96 overflow-y-auto">
        <EventLog
          maxEvents={maxEvents}
          activeOnly={activeOnly}
          categoryFilter={categoryFilter}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MINI EVENT TICKER (for HUD)
// ============================================================================

export const EventTicker: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [entries, setEntries] = useState<EventLogEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const allEntries = getEventLogEntries(5);
      setEntries(allEntries.filter(e => e.importance === 'major' || e.importance === 'critical'));
    };

    refresh();
    const engine = getTimeEngine();
    const unsub = engine.on('hour_change', refresh);
    return unsub;
  }, []);

  // Rotate through entries
  useEffect(() => {
    if (entries.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % entries.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [entries.length]);

  if (entries.length === 0) return null;

  const entry = entries[currentIndex];
  const categoryInfo = EVENT_CATEGORY_DISPLAY[entry.category];

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1 rounded
      bg-gray-900/80 border border-cyan-600/30
      ${className}
    `}>
      <span className="text-sm">{categoryInfo.icon}</span>
      <span className="text-xs text-cyan-300 font-medium truncate max-w-xs">
        {entry.headline}
      </span>
      {entries.length > 1 && (
        <span className="text-xs text-gray-500">
          {currentIndex + 1}/{entries.length}
        </span>
      )}
    </div>
  );
};

export default EventLog;

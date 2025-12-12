/**
 * ImpatienceMeter Component
 *
 * Visual indicator showing how impatient a character is getting.
 * Fills up based on idle time and personality traits.
 *
 * States: calm -> waiting -> restless -> irritated -> furious
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  getImpatienceState,
  getImpatienceFillRate,
  IMPATIENCE_STATE_COLORS,
  IMPATIENCE_STATE_MESSAGES,
  ImpatienceState,
  getPersonalityTraits,
} from '../data/personalitySystem';

interface ImpatienceMeterProps {
  // Character data
  characterId: string;
  characterName: string;
  mbti?: string;

  // Time data
  idleStartTime?: number;  // Timestamp when idle started
  currentTime?: number;    // Current timestamp (default: Date.now())

  // Display options
  showLabel?: boolean;
  showMessage?: boolean;
  compact?: boolean;
  className?: string;
}

export const ImpatienceMeter: React.FC<ImpatienceMeterProps> = ({
  characterId,
  characterName,
  mbti,
  idleStartTime,
  currentTime = Date.now(),
  showLabel = true,
  showMessage = true,
  compact = false,
  className = '',
}) => {
  // Get personality traits
  const traits = useMemo(() => getPersonalityTraits(mbti), [mbti]);

  // Calculate fill percentage
  const { fillPercentage, state, timeIdle } = useMemo(() => {
    if (!idleStartTime) {
      return { fillPercentage: 0, state: 'calm' as ImpatienceState, timeIdle: 0 };
    }

    const idleMs = currentTime - idleStartTime;
    const idleMinutes = idleMs / (1000 * 60);  // Convert to minutes

    // Fill rate based on impatience trait
    const fillRate = getImpatienceFillRate(traits.impatience);

    // Calculate fill (max 100%)
    const fill = Math.min(100, idleMinutes * fillRate);

    return {
      fillPercentage: fill,
      state: getImpatienceState(fill),
      timeIdle: Math.round(idleMinutes),
    };
  }, [idleStartTime, currentTime, traits.impatience]);

  // Get random message for state
  const message = useMemo(() => {
    const messages = IMPATIENCE_STATE_MESSAGES[state];
    return messages[Math.floor(Math.random() * messages.length)];
  }, [state]);

  const color = IMPATIENCE_STATE_COLORS[state];

  // State icons
  const stateIcons: Record<ImpatienceState, string> = {
    calm: '😌',
    waiting: '🙂',
    restless: '😐',
    irritated: '😠',
    furious: '🤬',
  };

  if (compact) {
    // Compact version - just the meter bar
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm">{stateIcons[state]}</span>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-3 ${className}`}>
      {/* Header */}
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{stateIcons[state]}</span>
            <span className="text-sm font-medium text-gray-300">
              {characterName}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {timeIdle > 0 ? `${timeIdle}m idle` : 'Ready'}
          </span>
        </div>
      )}

      {/* Meter */}
      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* State markers */}
        <div className="absolute inset-0 flex">
          {[20, 40, 60, 80].map((marker) => (
            <div
              key={marker}
              className="h-full border-r border-gray-600"
              style={{ marginLeft: `${marker}%`, width: 0 }}
            />
          ))}
        </div>

        {/* Label inside bar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: fillPercentage > 50 ? 'white' : color,
              textShadow: fillPercentage > 50 ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {state}
          </span>
        </div>
      </div>

      {/* State Labels */}
      <div className="flex justify-between mt-1 text-[8px] text-gray-500 uppercase">
        <span>Calm</span>
        <span>Waiting</span>
        <span>Restless</span>
        <span>Irritated</span>
        <span>Furious</span>
      </div>

      {/* Message */}
      {showMessage && state !== 'calm' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 rounded bg-gray-900/50 border-l-2"
          style={{ borderColor: color }}
        >
          <p className="text-xs italic text-gray-300">"{message}"</p>
        </motion.div>
      )}

      {/* Personality info */}
      <div className="mt-2 flex justify-between text-[10px] text-gray-500">
        <span>
          Impatience: {traits.impatience}/10
        </span>
        {mbti && (
          <span className="text-gray-400">{mbti}</span>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MINI VERSION - For lists
// =============================================================================

interface MiniImpatienceMeterProps {
  fillPercentage: number;
  state: ImpatienceState;
  size?: 'sm' | 'md';
}

export const MiniImpatienceMeter: React.FC<MiniImpatienceMeterProps> = ({
  fillPercentage,
  state,
  size = 'sm',
}) => {
  const color = IMPATIENCE_STATE_COLORS[state];
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={`w-full ${height} bg-gray-700 rounded-full overflow-hidden`}>
      <motion.div
        className={`${height} rounded-full`}
        style={{ backgroundColor: color, width: `${fillPercentage}%` }}
        initial={false}
        animate={{ width: `${fillPercentage}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

// =============================================================================
// HOOK - Calculate impatience from character data
// =============================================================================

export function useImpatienceCalculation(
  statusStartTime?: number,
  mbti?: string,
  currentTime: number = Date.now()
) {
  const traits = getPersonalityTraits(mbti);

  if (!statusStartTime) {
    return {
      fillPercentage: 0,
      state: 'calm' as ImpatienceState,
      timeIdleMinutes: 0,
      traits,
    };
  }

  const idleMs = currentTime - statusStartTime;
  const idleMinutes = idleMs / (1000 * 60);
  const fillRate = getImpatienceFillRate(traits.impatience);
  const fillPercentage = Math.min(100, idleMinutes * fillRate);

  return {
    fillPercentage,
    state: getImpatienceState(fillPercentage),
    timeIdleMinutes: Math.round(idleMinutes),
    traits,
  };
}

export default ImpatienceMeter;

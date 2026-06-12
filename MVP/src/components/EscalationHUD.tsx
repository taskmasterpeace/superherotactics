/**
 * EscalationHUD - Combat escalation display component
 *
 * Displays:
 * - Heat bar (0-100) with star indicators (0-5)
 * - Incoming reinforcement waves with ETA
 * - Available extraction/escape options
 * - Character opinions at choice points
 *
 * Subscribes to EventBridge escalation events
 */

import React, { useState, useEffect } from 'react';
import {
  EventBridge,
  EscalationDisplayState,
  EscalationWave,
  EscapeOption,
  CharacterEscalationOpinion,
} from '../game/EventBridge';
import { Flame, Star, Shield, Truck, MapPin, Users, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface EscalationHUDProps {
  visible?: boolean;
  compact?: boolean;  // Compact mode for smaller displays
  onEscapeSelected?: (optionId: string) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Heat bar visualization
 */
const HeatBar: React.FC<{ heat: number; maxHeat: number }> = ({ heat, maxHeat }) => {
  const percentage = Math.min(100, (heat / maxHeat) * 100);

  // Color based on heat level
  const getBarColor = () => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-orange-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <Flame className="w-4 h-4 text-orange-400" />
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 w-16 text-right">
        {heat}/{maxHeat}
      </span>
    </div>
  );
};

/**
 * Star level indicator (GTA-style wanted level)
 */
const StarsDisplay: React.FC<{ stars: number; maxStars?: number }> = ({ stars, maxStars = 5 }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < stars
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Incoming wave display
 */
const WaveDisplay: React.FC<{ wave: EscalationWave; currentTurn: number }> = ({ wave, currentTurn }) => {
  const turnsUntil = wave.turnToArrive - currentTurn;

  const getFactionIcon = () => {
    switch (wave.factionId) {
      case 'police': return '🚔';
      case 'swat': return '🚨';
      case 'military': return '🪖';
      default: return '⚠️';
    }
  };

  const getFactionColor = () => {
    switch (wave.factionId) {
      case 'police': return 'text-blue-400';
      case 'swat': return 'text-blue-300';
      case 'military': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`flex items-center justify-between text-sm ${getFactionColor()}`}>
      <span>
        {getFactionIcon()} {wave.factionId.toUpperCase()} ({wave.unitCount})
      </span>
      <span className={turnsUntil <= 2 ? 'text-red-400 font-bold animate-pulse' : ''}>
        {turnsUntil} turn{turnsUntil !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

/**
 * Escape option button
 */
const EscapeButton: React.FC<{
  option: EscapeOption;
  onSelect: () => void;
}> = ({ option, onSelect }) => {
  const getIcon = () => {
    switch (option.type) {
      case 'extract_north':
      case 'extract_south':
      case 'extract_east':
      case 'extract_west':
        return <MapPin className="w-3 h-3" />;
      case 'rooftop':
        return '🚁';
      case 'underground':
        return '🚇';
      case 'vehicle':
        return <Truck className="w-3 h-3" />;
      case 'bribe':
        return '💰';
      case 'negotiate':
        return '🤝';
      case 'blend_in':
        return '👤';
      default:
        return '🚪';
    }
  };

  if (!option.available) {
    return (
      <button
        disabled
        className="px-2 py-1 text-xs bg-gray-700 text-gray-500 rounded cursor-not-allowed"
        title={option.requirements || 'Not available'}
      >
        {typeof getIcon() === 'string' ? getIcon() : getIcon()}
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className="px-2 py-1 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded transition-colors"
      title={option.description}
    >
      {typeof getIcon() === 'string' ? getIcon() : getIcon()}
      <span className="ml-1">{option.label}</span>
    </button>
  );
};

/**
 * Character opinion bubble
 */
const OpinionBubble: React.FC<{ opinion: CharacterEscalationOpinion }> = ({ opinion }) => {
  const getRecommendationColor = () => {
    switch (opinion.recommendation) {
      case 'fight': return 'border-red-500 bg-red-900/30';
      case 'flee': return 'border-green-500 bg-green-900/30';
      case 'negotiate': return 'border-yellow-500 bg-yellow-900/30';
      default: return 'border-gray-500 bg-gray-900/30';
    }
  };

  const getRecommendationIcon = () => {
    switch (opinion.recommendation) {
      case 'fight': return '⚔️';
      case 'flee': return '🏃';
      case 'negotiate': return '🤝';
      default: return '🤷';
    }
  };

  return (
    <div className={`p-2 rounded border ${getRecommendationColor()} text-sm`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-white">{opinion.characterName}</span>
        <span className="text-xs text-gray-400">({opinion.calling})</span>
        <span>{getRecommendationIcon()}</span>
      </div>
      <p className="text-gray-300 italic text-xs">"{opinion.quote}"</p>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-xs text-gray-400">Confidence:</span>
        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500"
            style={{ width: `${opinion.confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EscalationHUD: React.FC<EscalationHUDProps> = ({
  visible = true,
  compact = false,
  onEscapeSelected,
}) => {
  const [state, setState] = useState<EscalationDisplayState | null>(null);
  const [showOpinions, setShowOpinions] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(1);

  // Subscribe to escalation events
  useEffect(() => {
    const unsubUpdate = EventBridge.on('escalation:update', (data: EscalationDisplayState) => {
      setState(data);
    });

    const unsubWaveWarning = EventBridge.on('escalation:wave-warning', (data: any) => {
      // Could show toast/notification here
      console.log('[ESCALATION HUD] Wave warning:', data.message);
    });

    const unsubWaveArrived = EventBridge.on('escalation:wave-arrived', (data: any) => {
      // Could show toast/notification here
      console.log('[ESCALATION HUD] Wave arrived:', data.message);
    });

    const unsubChoiceRequired = EventBridge.on('escalation:choice-required', (data: any) => {
      setState(prev => prev ? {
        ...prev,
        isChoicePoint: true,
        escapeOptions: data.options,
        characterOpinions: data.opinions,
      } : null);
      setShowOpinions(true);
    });

    const unsubTurnChanged = EventBridge.on('turn-changed', (data: any) => {
      setCurrentTurn(data.round || 1);
    });

    // Request current state
    EventBridge.emit('escalation:request-state');

    return () => {
      unsubUpdate();
      unsubWaveWarning();
      unsubWaveArrived();
      unsubChoiceRequired();
      unsubTurnChanged();
    };
  }, []);

  const handleEscapeSelect = (optionId: string) => {
    EventBridge.emit('escalation:choose-option', { optionId });
    onEscapeSelected?.(optionId);
    setShowOpinions(false);
  };

  // Don't render if not visible or no state
  if (!visible || !state) return null;

  // Don't render if no escalation (heat = 0, no waves)
  if (state.heat === 0 && state.incomingWaves.length === 0 && state.stars === 0) {
    return null;
  }

  if (compact) {
    // Compact mode - just heat bar and stars
    return (
      <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-2 shadow-lg">
        <div className="flex items-center gap-3">
          <HeatBar heat={state.heat} maxHeat={state.maxHeat} />
          <StarsDisplay stars={state.stars} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 border border-cyan-700 rounded-lg p-3 shadow-xl min-w-72">
      {/* Header with heat and stars */}
      <div className="flex items-center justify-between mb-2">
        <HeatBar heat={state.heat} maxHeat={state.maxHeat} />
        <div className="ml-3">
          <StarsDisplay stars={state.stars} />
        </div>
      </div>

      {/* Incoming waves */}
      {state.incomingWaves.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Shield className="w-3 h-3" />
            <span>INCOMING:</span>
          </div>
          <div className="space-y-1">
            {state.incomingWaves.map(wave => (
              <WaveDisplay
                key={wave.id}
                wave={wave}
                currentTurn={currentTurn}
              />
            ))}
          </div>
        </div>
      )}

      {/* Extraction options */}
      {state.escapeOptions.filter(o => o.available).length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <MapPin className="w-3 h-3" />
            <span>EXTRACTION:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {state.escapeOptions
              .filter(o => o.available)
              .map(option => (
                <EscapeButton
                  key={option.id}
                  option={option}
                  onSelect={() => handleEscapeSelect(option.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Character opinions toggle */}
      {state.characterOpinions && state.characterOpinions.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <button
            onClick={() => setShowOpinions(!showOpinions)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            <Users className="w-3 h-3" />
            <span>Squad Opinions ({state.characterOpinions.length})</span>
          </button>

          {showOpinions && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {state.characterOpinions.map(opinion => (
                <OpinionBubble key={opinion.characterId} opinion={opinion} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Choice point indicator */}
      {state.isChoicePoint && (
        <div className="mt-3 pt-2 border-t border-red-700 text-center">
          <span className="text-red-400 text-sm font-bold animate-pulse">
            ⚠️ DECISION REQUIRED
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CHOICE MODAL
// ============================================================================

interface EscalationChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: EscapeOption[];
  opinions: CharacterEscalationOpinion[];
  onSelect: (optionId: string) => void;
}

export const EscalationChoiceModal: React.FC<EscalationChoiceModalProps> = ({
  isOpen,
  onClose,
  options,
  opinions,
  onSelect,
}) => {
  if (!isOpen) return null;

  // Count recommendations
  const fightVotes = opinions.filter(o => o.recommendation === 'fight').length;
  const fleeVotes = opinions.filter(o => o.recommendation === 'flee').length;
  const negotiateVotes = opinions.filter(o => o.recommendation === 'negotiate').length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-cyan-400">⚠️ Escalation Decision</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-300 mb-4">
          The situation is escalating. Your squad must decide how to proceed.
        </p>

        {/* Squad consensus */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h3 className="text-sm font-bold text-gray-400 mb-2">Squad Consensus:</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-red-400">⚔️ Fight: {fightVotes}</span>
            <span className="text-green-400">🏃 Flee: {fleeVotes}</span>
            <span className="text-yellow-400">🤝 Negotiate: {negotiateVotes}</span>
          </div>
        </div>

        {/* Character opinions */}
        <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
          {opinions.map(opinion => (
            <OpinionBubble key={opinion.characterId} opinion={opinion} />
          ))}
        </div>

        {/* Options */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-400">Available Options:</h3>
          <div className="grid grid-cols-2 gap-2">
            {options.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
                disabled={!option.available}
                className={`p-3 rounded border text-left transition-colors ${option.available
                  ? 'border-cyan-600 bg-gray-800 hover:bg-gray-700 text-white'
                  : 'border-gray-700 bg-gray-900 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="font-bold">{option.label}</div>
                <div className="text-xs text-gray-400">{option.description}</div>
                {option.successChance !== undefined && (
                  <div className="text-xs text-cyan-400 mt-1">
                    Success: {option.successChance}%
                  </div>
                )}
                {!option.available && option.requirements && (
                  <div className="text-xs text-red-400 mt-1">
                    Requires: {option.requirements}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscalationHUD;

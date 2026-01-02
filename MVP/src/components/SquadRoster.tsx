/**
 * SquadRoster Component
 *
 * Shows all squad members with:
 * - Status (ready, traveling, on_mission, in_combat)
 * - Health bar
 * - Impatience meter (for idle characters)
 * - Location
 * - Personality type
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/enhancedGameStore';
import { MiniImpatienceMeter, useImpatienceCalculation } from './ImpatienceMeter';
import {
  Users,
  ChevronRight,
  ChevronLeft,
  Heart,
  Shield,
  MapPin,
  Clock,
  User,
  Crosshair,
  Plane,
  AlertTriangle,
} from 'lucide-react';

// Status colors and icons
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  ready: { color: 'text-green-400', bg: 'bg-green-900/30', icon: <Clock className="w-3 h-3" />, label: 'Ready' },
  traveling: { color: 'text-blue-400', bg: 'bg-blue-900/30', icon: <Plane className="w-3 h-3" />, label: 'Traveling' },
  on_mission: { color: 'text-yellow-400', bg: 'bg-yellow-900/30', icon: <Crosshair className="w-3 h-3" />, label: 'On Mission' },
  in_combat: { color: 'text-red-400', bg: 'bg-red-900/30', icon: <AlertTriangle className="w-3 h-3" />, label: 'In Combat' },
  injured: { color: 'text-orange-400', bg: 'bg-orange-900/30', icon: <Heart className="w-3 h-3" />, label: 'Injured' },
  hospitalized: { color: 'text-pink-400', bg: 'bg-pink-900/30', icon: <Heart className="w-3 h-3" />, label: 'Hospital' },
};

// Character card component
const CharacterCard: React.FC<{ character: any; isExpanded: boolean }> = ({ character, isExpanded }) => {
  const statusConfig = STATUS_CONFIG[character.status] || STATUS_CONFIG.ready;

  // Calculate impatience for idle characters
  const { fillPercentage, state: impatienceState } = useImpatienceCalculation(
    character.statusStartTime,
    character.personality?.mbti
  );

  const healthPercent = (character.health.current / character.health.maximum) * 100;
  const shieldPercent = character.maxShield > 0 ? (character.shield / character.maxShield) * 100 : 0;

  // Get threat level number
  const threatNum = character.threatLevel?.replace('THREAT_', '') || '?';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`${statusConfig.bg} border border-gray-700/50 rounded-lg overflow-hidden`}
    >
      {/* Header */}
      <div className="p-2 flex items-center gap-2">
        {/* Avatar placeholder */}
        <div className={`w-8 h-8 rounded-full ${statusConfig.bg} border ${statusConfig.color.replace('text-', 'border-')} flex items-center justify-center`}>
          <User className={`w-4 h-4 ${statusConfig.color}`} />
        </div>

        {/* Name and status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white truncate">{character.name}</span>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-1 rounded">T{threatNum}</span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] ${statusConfig.color}`}>
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
            {character.personality?.mbti && (
              <span className="text-gray-500 ml-1">{character.personality.mbti}</span>
            )}
          </div>
        </div>
      </div>

      {/* Health and Shield bars */}
      <div className="px-2 pb-1 space-y-1">
        {/* Health */}
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 text-red-400" />
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400 w-8 text-right">
            {character.health.current}/{character.health.maximum}
          </span>
        </div>

        {/* Shield (if has shield) */}
        {character.maxShield > 0 && (
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" />
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400 w-8 text-right">
              {character.shield}/{character.maxShield}
            </span>
          </div>
        )}

        {/* Impatience meter (only for ready/idle characters) */}
        {character.status === 'ready' && character.statusStartTime && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-yellow-400" />
            <div className="flex-1">
              <MiniImpatienceMeter fillPercentage={fillPercentage} state={impatienceState} />
            </div>
            <span className="text-[9px] text-gray-400 capitalize">{impatienceState}</span>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-2 pb-2 border-t border-gray-700/50 pt-2"
        >
          {/* Location */}
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
            <MapPin className="w-3 h-3" />
            <span>{character.location?.city}, {character.location?.country}</span>
          </div>

          {/* DR */}
          {character.dr > 0 && (
            <div className="text-[10px] text-gray-400">
              DR: {character.dr} ({character.equippedArmor || 'None'})
            </div>
          )}

          {/* Equipment count */}
          <div className="text-[10px] text-gray-400">
            Equipment: {character.equipment?.length || 0} items
          </div>

          {/* Powers */}
          {character.powers?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {character.powers.slice(0, 2).map((power: string, i: number) => (
                <span key={i} className="text-[9px] bg-purple-900/50 text-purple-300 px-1 rounded">
                  {power}
                </span>
              ))}
              {character.powers.length > 2 && (
                <span className="text-[9px] text-gray-500">+{character.powers.length - 2}</span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export const SquadRoster: React.FC = () => {
  const characters = useGameStore(state => state.characters);
  const squadStatus = useGameStore(state => state.squadStatus);
  const currentSector = useGameStore(state => state.currentSector);

  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null);

  // Group characters by status
  const groupedCharacters = useMemo(() => {
    const groups: Record<string, typeof characters> = {
      in_combat: [],
      on_mission: [],
      traveling: [],
      ready: [],
      injured: [],
      hospitalized: [],
    };

    characters.forEach(char => {
      const status = char.status || 'ready';
      if (groups[status]) {
        groups[status].push(char);
      } else {
        groups.ready.push(char);
      }
    });

    return groups;
  }, [characters]);

  // Count by status
  const statusCounts = useMemo(() => ({
    total: characters.length,
    ready: groupedCharacters.ready.length,
    active: groupedCharacters.in_combat.length + groupedCharacters.on_mission.length + groupedCharacters.traveling.length,
    injured: groupedCharacters.injured.length + groupedCharacters.hospitalized.length,
  }), [characters, groupedCharacters]);

  if (!isExpanded) {
    // Collapsed view - just show icon with counts
    return (
      <motion.div
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-r-lg p-2 hover:bg-gray-700 transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-white">{statusCounts.total}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed left-0 top-16 bottom-4 z-30 w-44"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
    >
      <div className="h-full bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-2 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Squad</span>
            <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">
              {statusCounts.total}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Status summary */}
        <div className="p-2 border-b border-gray-700 flex gap-2 text-[10px]">
          <span className="text-green-400">{statusCounts.ready} Ready</span>
          <span className="text-yellow-400">{statusCounts.active} Active</span>
          {statusCounts.injured > 0 && (
            <span className="text-red-400">{statusCounts.injured} Injured</span>
          )}
        </div>

        {/* Squad status */}
        <div className="p-2 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Squad Status:</span>
            <span className={`font-bold ${
              squadStatus === 'idle' ? 'text-green-400' :
              squadStatus === 'traveling' ? 'text-blue-400' :
              squadStatus === 'on_mission' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {squadStatus.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-gray-400">Sector:</span>
            <span className="text-white font-mono">{currentSector}</span>
          </div>
        </div>

        {/* Character list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* In Combat */}
          {groupedCharacters.in_combat.length > 0 && (
            <div>
              <div className="text-[10px] text-red-400 font-bold mb-1 uppercase">In Combat</div>
              {groupedCharacters.in_combat.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isExpanded={expandedCharacterId === char.id}
                />
              ))}
            </div>
          )}

          {/* On Mission */}
          {groupedCharacters.on_mission.length > 0 && (
            <div>
              <div className="text-[10px] text-yellow-400 font-bold mb-1 uppercase">On Mission</div>
              {groupedCharacters.on_mission.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isExpanded={expandedCharacterId === char.id}
                />
              ))}
            </div>
          )}

          {/* Traveling */}
          {groupedCharacters.traveling.length > 0 && (
            <div>
              <div className="text-[10px] text-blue-400 font-bold mb-1 uppercase">Traveling</div>
              {groupedCharacters.traveling.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isExpanded={expandedCharacterId === char.id}
                />
              ))}
            </div>
          )}

          {/* Ready */}
          {groupedCharacters.ready.length > 0 && (
            <div>
              <div className="text-[10px] text-green-400 font-bold mb-1 uppercase">Ready</div>
              {groupedCharacters.ready.map(char => (
                <div
                  key={char.id}
                  onClick={() => setExpandedCharacterId(expandedCharacterId === char.id ? null : char.id)}
                  className="cursor-pointer"
                >
                  <CharacterCard
                    character={char}
                    isExpanded={expandedCharacterId === char.id}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Injured/Hospitalized */}
          {(groupedCharacters.injured.length > 0 || groupedCharacters.hospitalized.length > 0) && (
            <div>
              <div className="text-[10px] text-orange-400 font-bold mb-1 uppercase">Recovering</div>
              {[...groupedCharacters.injured, ...groupedCharacters.hospitalized].map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isExpanded={expandedCharacterId === char.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-700 text-[10px] text-gray-500 text-center">
          Click character to expand
        </div>
      </div>
    </motion.div>
  );
};

export default SquadRoster;

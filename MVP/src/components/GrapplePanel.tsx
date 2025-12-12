/**
 * GrapplePanel - Displays martial arts grappling state and available techniques
 * Shows current grapple state, positions, available techniques, escape options,
 * and submission progress for martial arts combat
 */

import React from 'react';
import { GrappleState, GrappleInteraction, MartialArtsTechnique, CharacterMartialArts } from '../game/EventBridge';
import { EventBridge } from '../game/EventBridge';
import martialArtsData from '../data/martial-arts.json';

// Grapple state colors
const GRAPPLE_STATE_COLORS: Record<GrappleState, { bg: string; border: string; text: string }> = {
  [GrappleState.NONE]: { bg: 'bg-gray-800', border: 'border-gray-600', text: 'text-gray-400' },
  [GrappleState.STANDING]: { bg: 'bg-cyan-900', border: 'border-cyan-600', text: 'text-cyan-300' },
  [GrappleState.GROUND]: { bg: 'bg-blue-900', border: 'border-blue-600', text: 'text-blue-300' },
  [GrappleState.PINNED]: { bg: 'bg-orange-900', border: 'border-orange-600', text: 'text-orange-300' },
  [GrappleState.RESTRAINED]: { bg: 'bg-red-900', border: 'border-red-600', text: 'text-red-300' },
  [GrappleState.CARRIED]: { bg: 'bg-yellow-900', border: 'border-yellow-600', text: 'text-yellow-300' },
  [GrappleState.SUBMISSION]: { bg: 'bg-purple-900', border: 'border-purple-600', text: 'text-purple-300' },
};

// Position icons and descriptions
const POSITION_ICONS: Record<string, string> = {
  top: '⬆️',
  bottom: '⬇️',
  back: '🔄',
  side: '↔️',
};

const POSITION_DESCRIPTIONS: Record<string, { attacker: string; defender: string }> = {
  top: {
    attacker: 'Mount (Dominant)',
    defender: 'Bottom (Being Mounted)'
  },
  bottom: {
    attacker: 'Guard (On Bottom)',
    defender: 'In Opponent\'s Guard'
  },
  back: {
    attacker: 'Back Control (Dominant)',
    defender: 'Back Taken (Vulnerable)'
  },
  side: {
    attacker: 'Side Control',
    defender: 'Side Controlled'
  },
};

// Grapple state emojis
const GRAPPLE_EMOJIS: Record<GrappleState, string> = {
  [GrappleState.NONE]: '🤝',
  [GrappleState.STANDING]: '🤼',
  [GrappleState.GROUND]: '🥋',
  [GrappleState.PINNED]: '📌',
  [GrappleState.RESTRAINED]: '⛓️',
  [GrappleState.CARRIED]: '🏋️',
  [GrappleState.SUBMISSION]: '🔒',
};

interface GrapplePanelProps {
  unitId: string;
  unitName: string;
  grappleState: GrappleInteraction | null;
  martialArts: CharacterMartialArts | null;
  currentAp: number;
  isAttacker: boolean; // Is this unit the attacker in the grapple?
  stats: {
    STR: number;
    MEL: number;
    AGL: number;
    INS: number;
  };
}

export const GrapplePanel: React.FC<GrapplePanelProps> = ({
  unitId,
  unitName,
  grappleState,
  martialArts,
  currentAp,
  isAttacker,
  stats,
}) => {
  // If no martial arts training, don't show panel
  if (!martialArts) {
    return null;
  }

  // Find the martial arts style
  const style = martialArtsData.styles.find(s => s.id === martialArts.styleId);
  if (!style) {
    return null;
  }

  // Get belt information
  const beltInfo = martialArtsData.beltRanks.find(b => b.rank === martialArts.beltLevel);

  // Filter available techniques based on belt level
  const availableTechniques = style.techniques.filter(
    tech => tech.beltRequired <= martialArts.beltLevel
  );

  // Further filter based on current grapple state AND role (attacker/defender)
  const usableTechniques = availableTechniques.filter(tech => {
    // Check grapple requirements
    if (tech.requiresGrapple && !grappleState) return false;
    if (tech.requiresProne && grappleState?.state !== GrappleState.GROUND && grappleState?.state !== GrappleState.PINNED) return false;
    if (tech.requiresRestrained && grappleState?.state !== GrappleState.RESTRAINED && grappleState?.state !== GrappleState.CARRIED) return false;

    // Check standing requirement (default true for most techniques)
    if (tech.requiresStanding !== false && grappleState?.state === GrappleState.GROUND) return false;

    // Reaction and passive techniques shown separately
    if (tech.isReaction || tech.isPassive) return false;

    // Role-based filtering
    if (grappleState) {
      // Defenders can use escapes and reversals more easily
      if (!isAttacker && tech.name.toLowerCase().includes('escape')) {
        return true; // Always allow escape techniques for defenders
      }

      // Attackers have easier time with submissions and advances
      if (isAttacker && (tech.name.toLowerCase().includes('submission') || tech.name.toLowerCase().includes('choke'))) {
        return true; // Always allow submission techniques for attackers
      }

      // Position-based restrictions
      const isInBadPosition = !isAttacker && (grappleState.attackerPosition === 'top' || grappleState.attackerPosition === 'back');
      if (isInBadPosition && tech.requiresControl) {
        return false; // Can't use control techniques when being controlled
      }
    }

    return true;
  });

  // Calculate escape probability
  const calculateEscapeProbability = (): number => {
    if (!grappleState) return 0;

    // Base escape chance based on state
    const baseChance: Record<GrappleState, number> = {
      [GrappleState.NONE]: 0,
      [GrappleState.STANDING]: 60,
      [GrappleState.GROUND]: 40,
      [GrappleState.PINNED]: 25,
      [GrappleState.RESTRAINED]: 15,
      [GrappleState.CARRIED]: 20,
      [GrappleState.SUBMISSION]: 10,
    };

    let chance = baseChance[grappleState.state];

    // Modify by position (defender has advantage from top)
    if (!isAttacker) {
      if (grappleState.attackerPosition === 'top') chance -= 15;
      if (grappleState.attackerPosition === 'bottom') chance += 15;
    }

    // Modify by stats (AGL and STR help escape)
    const statBonus = Math.floor((stats.AGL + stats.STR) / 2) - 5;
    chance += statBonus * 2;

    return Math.max(5, Math.min(95, chance));
  };

  const handleTechniqueClick = (technique: MartialArtsTechnique) => {
    if (currentAp < technique.apCost) {
      return; // Not enough AP
    }

    EventBridge.emit('use-technique', {
      unitId,
      techniqueId: technique.id,
      targetId: grappleState?.defenderId === unitId ? grappleState?.attackerId : grappleState?.defenderId,
    });
  };

  const handleEscapeAttempt = () => {
    if (!grappleState || currentAp < 2) return;

    EventBridge.emit('attempt-escape', { unitId });
  };

  // Current grapple state display
  const currentState = grappleState?.state || GrappleState.NONE;
  const stateColors = GRAPPLE_STATE_COLORS[currentState];

  return (
    <div className="bg-[#1a1a2e] border border-cyan-600 rounded-lg p-3">
      {/* Header */}
      <div className="text-sm text-cyan-400 font-bold mb-3 flex items-center gap-2">
        <span>🥋</span>
        <span>{style.name}</span>
        <span className="text-gray-500 text-xs">({beltInfo?.label})</span>
        {grappleState && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
            isAttacker ? 'bg-orange-700 text-orange-200' : 'bg-blue-700 text-blue-200'
          }`}>
            {isAttacker ? 'ATTACKER' : 'DEFENDER'}
          </span>
        )}
      </div>

      {/* Current Grapple State */}
      <div className={`${stateColors.bg} ${stateColors.border} border rounded-lg p-2 mb-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{GRAPPLE_EMOJIS[currentState]}</span>
            <div>
              <div className={`text-sm font-bold ${stateColors.text}`}>
                {currentState.toUpperCase()}
              </div>
              {grappleState && (
                <div className="text-xs text-gray-400">
                  {isAttacker ? 'Controlling' : 'Defending'}
                </div>
              )}
            </div>
          </div>

          {/* Position indicator */}
          {grappleState && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Position</div>
              <div className="flex items-center gap-1">
                <span>{POSITION_ICONS[grappleState.attackerPosition]}</span>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-cyan-300 leading-tight">
                    {isAttacker
                      ? POSITION_DESCRIPTIONS[grappleState.attackerPosition]?.attacker
                      : POSITION_DESCRIPTIONS[grappleState.attackerPosition]?.defender}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submission Progress Bar */}
        {grappleState?.submissionProgress && grappleState.submissionProgress > 0 && (
          <div className="mt-2 pt-2 border-t border-purple-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-purple-300 font-bold">SUBMISSION</span>
              <span className="text-xs text-orange-400">
                {grappleState.submissionProgress} turn{grappleState.submissionProgress !== 1 ? 's' : ''} until KO
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(grappleState.submissionProgress / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Escape Option */}
      {grappleState && currentState !== GrappleState.NONE && (
        <div className="mb-3">
          <button
            onClick={handleEscapeAttempt}
            disabled={currentAp < 2}
            className={`
              w-full px-3 py-2 rounded border transition-all
              ${
                currentAp >= 2
                  ? 'bg-orange-900 border-orange-600 text-orange-300 hover:brightness-125 cursor-pointer'
                  : 'bg-gray-700 border-gray-600 text-gray-500 opacity-40 cursor-not-allowed'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🏃</span>
                <span className="font-bold">Attempt Escape</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-400">2 AP</span>
                <span className="text-yellow-400">{calculateEscapeProbability()}%</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Available Techniques */}
      <div>
        <div className="text-xs text-cyan-400 font-bold mb-2">AVAILABLE TECHNIQUES</div>

        {usableTechniques.length === 0 ? (
          <div className="text-xs text-gray-500 italic py-2">
            No techniques available in current state
          </div>
        ) : (
          <div className="space-y-2">
            {usableTechniques.map(technique => {
              const canUse = currentAp >= technique.apCost;
              const isSubmission = technique.setsGrappleState === GrappleState.SUBMISSION;
              const colors = isSubmission
                ? { bg: 'bg-purple-900', border: 'border-purple-600', text: 'text-purple-300' }
                : canUse
                ? { bg: 'bg-cyan-900', border: 'border-cyan-600', text: 'text-cyan-300' }
                : { bg: 'bg-gray-700', border: 'border-gray-600', text: 'text-gray-500' };

              return (
                <button
                  key={technique.id}
                  onClick={() => handleTechniqueClick(technique)}
                  disabled={!canUse}
                  className={`
                    w-full px-3 py-2 rounded border transition-all text-left
                    ${
                      !canUse
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:brightness-125 cursor-pointer'
                    }
                    ${colors.bg} ${colors.border}
                  `}
                  title={technique.effect}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm ${colors.text}`}>
                      {technique.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-blue-400">{technique.apCost} AP</span>
                      {technique.damage && technique.damage > 0 && (
                        <span className="text-red-400">{technique.damage} DMG</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-300 mb-1">
                    {technique.effect}
                  </div>

                  {/* Effects Preview */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {technique.statusApplied && technique.statusApplied.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-orange-400">Status:</span>
                        <span className="text-orange-300">
                          {technique.statusApplied.join(', ')}
                        </span>
                      </div>
                    )}
                    {technique.setsGrappleState && (
                      <div className="flex items-center gap-1">
                        <span className="text-purple-400">→</span>
                        <span className="text-purple-300">
                          {technique.setsGrappleState.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Passive and Reaction Techniques Info */}
      {availableTechniques.filter(t => t.isPassive || t.isReaction).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <span className="font-bold">Active:</span>
            {' '}
            {availableTechniques
              .filter(t => t.isPassive || t.isReaction)
              .map(t => t.name)
              .join(', ')}
          </div>
        </div>
      )}

      {/* Style Info Footer */}
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold">Role:</span> {style.role}
          </div>
          <div>
            <span className="font-bold">Stats:</span> {style.primaryStat}
            {style.secondaryStat && ` / ${style.secondaryStat}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrapplePanel;

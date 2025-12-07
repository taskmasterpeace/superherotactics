/**
 * PowersPanel - Displays available powers for the selected unit
 * Shows power emoji, name, AP cost, cooldown status, and category
 * Allows clicking to activate powers
 */

import React from 'react';
import { PowerData } from '../game/EventBridge';
import { EventBridge } from '../game/EventBridge';

// Role colors for visual distinction
const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  offense: { bg: 'bg-red-900', border: 'border-red-600', text: 'text-red-300' },
  defense: { bg: 'bg-blue-900', border: 'border-blue-600', text: 'text-blue-300' },
  mobility: { bg: 'bg-purple-900', border: 'border-purple-600', text: 'text-purple-300' },
  support: { bg: 'bg-green-900', border: 'border-green-600', text: 'text-green-300' },
  control: { bg: 'bg-yellow-900', border: 'border-yellow-600', text: 'text-yellow-300' },
  utility: { bg: 'bg-gray-700', border: 'border-gray-500', text: 'text-gray-300' },
};

// Role emoji shortcuts
const ROLE_EMOJI: Record<string, string> = {
  offense: '⚔️',
  defense: '🛡️',
  mobility: '🏃',
  support: '💚',
  control: '🎯',
  utility: '🔧',
};

// Manifest type icons
const MANIFEST_ICONS: Record<string, string> = {
  beam: '─→',
  blast: '💥',
  touch: '✋',
  aura: '○',
  zone: '⬡',
  self: '⟳',
  target: '◎',
  summon: '☆',
  portal: '🚪',
};

interface PowersPanelProps {
  unitId: string;
  unitName: string;
  powers: PowerData[];
  currentAp: number;
}

export const PowersPanel: React.FC<PowersPanelProps> = ({
  unitId,
  unitName,
  powers,
  currentAp,
}) => {
  if (!powers || powers.length === 0) {
    return null;
  }

  const handlePowerClick = (power: PowerData) => {
    // Check if power is available
    if (power.currentCooldown > 0) {
      return; // On cooldown
    }
    if (currentAp < power.apCost) {
      return; // Not enough AP
    }

    // Emit event to activate power
    EventBridge.emit('activate-power', {
      unitId,
      powerId: power.id,
    });
  };

  // Group powers by role
  const powersByRole: Record<string, PowerData[]> = {};
  powers.forEach(power => {
    const role = power.role || 'utility';
    if (!powersByRole[role]) powersByRole[role] = [];
    powersByRole[role].push(power);
  });

  return (
    <div className="bg-gray-800 border border-purple-600 rounded-lg p-2">
      <div className="text-xs text-purple-400 font-bold mb-2 flex items-center gap-1">
        <span>⚡</span>
        <span>POWERS</span>
        <span className="text-gray-500 ml-2">({powers.length})</span>
      </div>

      {/* Render powers grouped by role */}
      {Object.entries(powersByRole).map(([role, rolePowers]) => (
        <div key={role} className="mb-2">
          {/* Role header */}
          <div className={`text-xs font-bold mb-1 flex items-center gap-1 ${ROLE_COLORS[role]?.text || 'text-gray-400'}`}>
            <span>{ROLE_EMOJI[role] || '•'}</span>
            <span className="uppercase">{role}</span>
          </div>

          {/* Powers in this role */}
          <div className="flex flex-wrap gap-2">
            {rolePowers.map((power) => {
              const isOnCooldown = power.currentCooldown > 0;
              const notEnoughAp = currentAp < power.apCost;
              const isDisabled = isOnCooldown || notEnoughAp;
              const colors = ROLE_COLORS[power.role || 'utility'] || ROLE_COLORS.utility;

              return (
                <button
                  key={power.id}
                  onClick={() => handlePowerClick(power)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded border transition-all
                    ${
                      isDisabled
                        ? 'bg-gray-700 border-gray-600 opacity-40 cursor-not-allowed'
                        : `${colors.bg} ${colors.border} hover:brightness-125 cursor-pointer`
                    }
                  `}
                  title={`${power.description}\n[${power.role?.toUpperCase()}] [${power.type?.toUpperCase()}] [${power.manifest?.toUpperCase()}]`}
                >
                  {/* Power emoji */}
                  <span className="text-xl">{power.emoji}</span>

                  {/* Power info */}
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-white">{power.name}</span>
                      {/* Manifest type indicator */}
                      {power.manifest && (
                        <span className="text-xs text-gray-400" title={power.manifest}>
                          {MANIFEST_ICONS[power.manifest] || ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {/* AP Cost */}
                      <span className="text-blue-400">{power.apCost} AP</span>

                      {/* Cooldown status */}
                      {isOnCooldown ? (
                        <span className="text-red-400 font-bold">
                          CD: {power.currentCooldown}
                        </span>
                      ) : (
                        <span className="text-green-400">Ready</span>
                      )}

                      {/* Type badge */}
                      {power.type && (
                        <span className="text-xs text-gray-500 capitalize">
                          {power.type}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PowersPanel;

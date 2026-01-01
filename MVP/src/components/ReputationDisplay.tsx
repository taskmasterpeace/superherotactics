/**
 * Reputation Display Component (FM-008)
 *
 * Shows player reputation with factions, fame/infamy, and heat levels.
 * For use in character sheet and world map HUD.
 */

import React, { useState, useEffect } from 'react';
import {
  FactionType,
  FactionStanding,
  FACTION_NAMES,
  FACTION_ICONS,
  getStandingLabel,
  getStandingColor,
  CountryReputation,
  getCountryReputation,
  Bounty,
} from '../data/factionSystem';
import {
  FameState,
  FameLevel,
  FAME_THRESHOLDS,
  getFameManager,
} from '../data/fameSystem';
import {
  HeatLevel,
  getHeatManager,
  HEAT_LEVEL_DISPLAY,
} from '../data/heatSystem';
import { getHuntMissionManager, HuntMission } from '../data/factionHuntMissions';
import { getAllyManager, AvailableBenefit, getBenefitTypeIcon } from '../data/factionAllies';

// =============================================================================
// STANDING BAR COMPONENT
// =============================================================================

interface StandingBarProps {
  factionType: FactionType;
  standing: number;
  compact?: boolean;
}

export const StandingBar: React.FC<StandingBarProps> = ({
  factionType,
  standing,
  compact = false,
}) => {
  const label = getStandingLabel(standing);
  const color = getStandingColor(standing);
  const icon = FACTION_ICONS[factionType];
  const name = FACTION_NAMES[factionType];

  // Convert -100 to 100 scale to 0 to 100 for bar
  const barValue = (standing + 100) / 2;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{icon}</span>
        <span className="w-20 truncate">{name}</span>
        <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${barValue}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span className="w-8 text-right" style={{ color }}>
          {standing > 0 ? '+' : ''}{standing}
        </span>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gray-800/50 rounded border border-gray-700/30">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-white">{name}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="h-3 bg-gray-700 rounded overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${barValue}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>-100</span>
        <span style={{ color }}>{standing > 0 ? '+' : ''}{standing}</span>
        <span>+100</span>
      </div>
    </div>
  );
};

// =============================================================================
// FAME BADGE COMPONENT
// =============================================================================

interface FameBadgeProps {
  className?: string;
}

export const FameBadge: React.FC<FameBadgeProps> = ({ className = '' }) => {
  const fameManager = getFameManager();
  const display = fameManager.getFameDisplay();

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded bg-gray-800/70 ${className}`}>
      <span className="text-lg">{display.icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">Fame</span>
        <span className="text-sm font-medium" style={{ color: display.color }}>
          {display.level.charAt(0).toUpperCase() + display.level.slice(1)}
        </span>
      </div>
      <div className="ml-2 flex flex-col">
        <span className="text-xs text-gray-400">Rep</span>
        <span className="text-sm font-medium" style={{ color: display.color }}>
          {display.reputation > 0 ? '+' : ''}{display.reputation}
        </span>
      </div>
    </div>
  );
};

// =============================================================================
// HEAT INDICATOR COMPONENT
// =============================================================================

interface HeatIndicatorProps {
  countryCode: string;
  compact?: boolean;
  className?: string;
}

export const HeatIndicator: React.FC<HeatIndicatorProps> = ({
  countryCode,
  compact = false,
  className = '',
}) => {
  const heatManager = getHeatManager();
  const levels = heatManager.getHeatLevels(countryCode);

  // Get highest heat level
  const allFactions: FactionType[] = ['police', 'military', 'government', 'media', 'corporations', 'underworld'];
  let maxHeat = 0;
  let maxFaction: FactionType = 'police';

  for (const faction of allFactions) {
    const heat = levels[faction] || 0;
    if (heat > maxHeat) {
      maxHeat = heat;
      maxFaction = faction;
    }
  }

  const heatLevel = heatManager.getHeatLevel(maxHeat);
  const display = HEAT_LEVEL_DISPLAY[heatLevel];

  if (compact) {
    if (maxHeat < 10) return null; // Don't show if cold

    return (
      <div
        className={`px-2 py-1 rounded text-xs font-medium ${className}`}
        style={{ backgroundColor: `${display.color}20`, color: display.color }}
      >
        {display.icon} {display.label}
      </div>
    );
  }

  return (
    <div className={`p-3 rounded bg-gray-800/70 border border-gray-700/30 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Heat Level</span>
        <span className="text-lg font-bold" style={{ color: display.color }}>
          {display.icon} {display.label}
        </span>
      </div>

      {/* Heat bars per faction */}
      <div className="space-y-1">
        {allFactions.map(faction => {
          const heat = levels[faction] || 0;
          if (heat < 5) return null;

          return (
            <div key={faction} className="flex items-center gap-2 text-xs">
              <span className="w-4">{FACTION_ICONS[faction]}</span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${heat}%`,
                    backgroundColor: display.color,
                  }}
                />
              </div>
              <span className="w-6 text-right text-gray-400">{heat}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// BOUNTY ALERT COMPONENT
// =============================================================================

interface BountyAlertProps {
  bounties: Bounty[];
  className?: string;
}

export const BountyAlert: React.FC<BountyAlertProps> = ({
  bounties,
  className = '',
}) => {
  if (bounties.length === 0) return null;

  const totalBounty = bounties.reduce((sum, b) => sum + b.amount, 0);
  const highestLevel = bounties.reduce((level, b) => {
    if (b.level === 'extreme') return 'extreme';
    if (b.level === 'major' && level !== 'extreme') return 'major';
    return level;
  }, 'minor' as Bounty['level']);

  const colors = {
    minor: '#eab308',
    major: '#f97316',
    extreme: '#ef4444',
  };

  return (
    <div
      className={`p-3 rounded border ${className}`}
      style={{
        backgroundColor: `${colors[highestLevel]}10`,
        borderColor: `${colors[highestLevel]}50`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🎯</span>
        <span className="font-bold" style={{ color: colors[highestLevel] }}>
          WANTED
        </span>
        <span className="ml-auto text-lg font-bold text-white">
          ${totalBounty.toLocaleString()}
        </span>
      </div>

      <div className="text-sm text-gray-300">
        {bounties.map((bounty, i) => (
          <div key={bounty.id} className="flex justify-between">
            <span>{FACTION_ICONS[bounty.factionType]} {FACTION_NAMES[bounty.factionType]}</span>
            <span>${bounty.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// HUNT WARNING COMPONENT
// =============================================================================

interface HuntWarningProps {
  countryCode: string;
  className?: string;
}

export const HuntWarning: React.FC<HuntWarningProps> = ({
  countryCode,
  className = '',
}) => {
  const huntManager = getHuntMissionManager();
  const warnings = huntManager.getHuntWarnings(countryCode);

  if (warnings.length === 0) return null;

  return (
    <div className={`p-2 bg-red-900/30 border border-red-500/50 rounded ${className}`}>
      <div className="text-xs font-bold text-red-400 mb-1">⚠️ ACTIVE THREATS</div>
      {warnings.map((warning, i) => (
        <div key={i} className="text-sm text-red-300">{warning}</div>
      ))}
    </div>
  );
};

// =============================================================================
// ALLY BENEFITS PANEL
// =============================================================================

interface AllyBenefitsPanelProps {
  factionType: FactionType;
  standing: number;
  currentTimestamp: number;
  onUseBenefit?: (benefitId: string) => void;
  className?: string;
}

export const AllyBenefitsPanel: React.FC<AllyBenefitsPanelProps> = ({
  factionType,
  standing,
  currentTimestamp,
  onUseBenefit,
  className = '',
}) => {
  const allyManager = getAllyManager();
  const benefits = allyManager.getBenefitsForFaction(factionType, standing, currentTimestamp);

  if (standing < 25) {
    return (
      <div className={`p-3 text-center text-gray-400 text-sm ${className}`}>
        Improve standing to {FACTION_NAMES[factionType]} to unlock benefits
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {benefits.map(benefit => (
        <div
          key={benefit.id}
          className={`p-2 rounded border transition-colors ${
            benefit.available
              ? 'bg-gray-800/50 border-cyan-600/30 cursor-pointer hover:bg-gray-700/50'
              : 'bg-gray-900/50 border-gray-700/20 opacity-50'
          }`}
          onClick={() => benefit.available && onUseBenefit?.(benefit.id)}
        >
          <div className="flex items-center gap-2">
            <span>{getBenefitTypeIcon(benefit.type)}</span>
            <span className="font-medium text-white">{benefit.name}</span>
            {benefit.cost && (
              <span className="ml-auto text-xs text-yellow-400">
                ${benefit.cost.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{benefit.description}</p>
          {!benefit.available && benefit.reasonUnavailable && (
            <p className="text-xs text-red-400 mt-1">{benefit.reasonUnavailable}</p>
          )}
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// COUNTRY REPUTATION CARD
// =============================================================================

interface CountryReputationCardProps {
  countryCode: string;
  countryName: string;
  standings: FactionStanding[];
  className?: string;
}

export const CountryReputationCard: React.FC<CountryReputationCardProps> = ({
  countryCode,
  countryName,
  standings,
  className = '',
}) => {
  const reputation = getCountryReputation(countryCode, countryName, standings);

  return (
    <div className={`p-4 bg-gray-900/80 rounded-lg border border-gray-700/30 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">{countryName}</h3>
        <span
          className="px-2 py-1 rounded text-sm font-medium"
          style={{
            backgroundColor: `${getStandingColor(reputation.overallReputation)}20`,
            color: getStandingColor(reputation.overallReputation),
          }}
        >
          {reputation.overallLabel}
        </span>
      </div>

      {/* Bounty alert */}
      {reputation.activeBounties.length > 0 && (
        <BountyAlert bounties={reputation.activeBounties} className="mb-3" />
      )}

      {/* Heat indicator */}
      <HeatIndicator countryCode={countryCode} className="mb-3" />

      {/* Hunt warnings */}
      <HuntWarning countryCode={countryCode} className="mb-3" />

      {/* Faction standings */}
      <div className="space-y-2">
        {Object.entries(reputation.factions).map(([faction, standing]) => (
          <StandingBar
            key={faction}
            factionType={faction as FactionType}
            standing={standing}
            compact
          />
        ))}
      </div>

      {/* Effects summary */}
      <div className="mt-3 pt-3 border-t border-gray-700/30 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Travel time</span>
          <span>{reputation.borderControlModifier === 1 ? 'Normal' :
            `${Math.round((reputation.borderControlModifier - 1) * 100)}%${reputation.borderControlModifier > 1 ? ' slower' : ' faster'}`}</span>
        </div>
        <div className="flex justify-between">
          <span>Prices</span>
          <span>{reputation.priceModifier === 1 ? 'Normal' :
            `${Math.round((reputation.priceModifier - 1) * 100)}%${reputation.priceModifier > 1 ? ' higher' : ' discount'}`}</span>
        </div>
        {!reputation.canEnterLegally && (
          <div className="text-red-400 font-bold mt-1">⚠️ Cannot enter legally</div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// FULL REPUTATION PANEL
// =============================================================================

interface ReputationPanelProps {
  standings: FactionStanding[];
  currentCountryCode: string;
  currentCountryName: string;
  className?: string;
}

export const ReputationPanel: React.FC<ReputationPanelProps> = ({
  standings,
  currentCountryCode,
  currentCountryName,
  className = '',
}) => {
  const [selectedFaction, setSelectedFaction] = useState<FactionType | null>(null);
  const fameManager = getFameManager();
  const fameDisplay = fameManager.getFameDisplay();

  const countryStandings = standings.filter(s => s.countryCode === currentCountryCode);

  return (
    <div className={`bg-gray-900/80 rounded-lg border border-cyan-600/30 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white">Reputation</h2>
        <div className="flex items-center gap-4 mt-2">
          <FameBadge />
        </div>
      </div>

      {/* Current country */}
      <div className="p-4">
        <CountryReputationCard
          countryCode={currentCountryCode}
          countryName={currentCountryName}
          standings={standings}
        />
      </div>

      {/* Ally benefits */}
      {selectedFaction && (
        <div className="p-4 border-t border-gray-700/50">
          <h3 className="text-lg font-medium text-white mb-2">
            {FACTION_ICONS[selectedFaction]} {FACTION_NAMES[selectedFaction]} Benefits
          </h3>
          <AllyBenefitsPanel
            factionType={selectedFaction}
            standing={countryStandings.find(s => s.factionType === selectedFaction)?.standing ?? 0}
            currentTimestamp={Date.now()}
          />
        </div>
      )}

      {/* Faction selector */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex flex-wrap gap-2">
          {(['police', 'military', 'government', 'media', 'corporations', 'underworld'] as FactionType[]).map(faction => (
            <button
              key={faction}
              onClick={() => setSelectedFaction(selectedFaction === faction ? null : faction)}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFaction === faction
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {FACTION_ICONS[faction]} {FACTION_NAMES[faction]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MINI REPUTATION HUD
// =============================================================================

interface ReputationHUDProps {
  standings: FactionStanding[];
  currentCountryCode: string;
  className?: string;
}

export const ReputationHUD: React.FC<ReputationHUDProps> = ({
  standings,
  currentCountryCode,
  className = '',
}) => {
  const countryStandings = standings.filter(s => s.countryCode === currentCountryCode);
  const heatManager = getHeatManager();

  // Get overall standing
  const avgStanding = Math.round(
    countryStandings.reduce((sum, s) => sum + s.standing, 0) / Math.max(1, countryStandings.length)
  );

  // Check for bounties
  const hasBounty = countryStandings.some(s => s.activeBounty?.status === 'active');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <FameBadge />
      <HeatIndicator countryCode={currentCountryCode} compact />
      {hasBounty && (
        <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-bold">
          🎯 WANTED
        </span>
      )}
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  StandingBar,
  FameBadge,
  HeatIndicator,
  BountyAlert,
  HuntWarning,
  AllyBenefitsPanel,
  CountryReputationCard,
  ReputationPanel,
  ReputationHUD,
};

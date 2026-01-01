/**
 * Mercenary Recruitment UI Component
 *
 * JA2-style merc hiring interface:
 * - Browse available mercenaries in current country
 * - View stats, specialty, reputation, and daily rate
 * - Hire/fire mercenaries for your team
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  getMercenaryPoolManager,
  MercenaryListing,
  MercenarySpecialty,
} from '../data/mercenaryPool';
import { NPCEntity } from '../data/npcSystem';
import { getCountryByCode, Country } from '../data/countries';
import { PrimaryStats } from '../data/characterSheet';

// ============================================================================
// TYPES
// ============================================================================

interface MercRecruitmentProps {
  countryCode: string;
  playerMoney: number;
  onHire: (mercId: string, dailyRate: number) => void;
  onFire: (mercId: string) => void;
  onClose?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const SPECIALTY_ICONS: Record<MercenarySpecialty, string> = {
  assault: '🔫',
  sniper: '🎯',
  heavy: '💥',
  demolitions: '💣',
  medic: '🩹',
  tech: '🔧',
  stealth: '🥷',
  all_rounder: '⭐',
};

const SPECIALTY_LABELS: Record<MercenarySpecialty, string> = {
  assault: 'Assault',
  sniper: 'Sniper',
  heavy: 'Heavy Weapons',
  demolitions: 'Demolitions',
  medic: 'Combat Medic',
  tech: 'Tech Specialist',
  stealth: 'Stealth Ops',
  all_rounder: 'All-Rounder',
};

function getStatColor(value: number): string {
  if (value >= 80) return 'text-green-400';
  if (value >= 60) return 'text-blue-400';
  if (value >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getRatingStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MercCardProps {
  listing: MercenaryListing;
  isSelected: boolean;
  canAfford: boolean;
  onSelect: () => void;
}

const MercCard: React.FC<MercCardProps> = ({
  listing,
  isSelected,
  canAfford,
  onSelect,
}) => {
  const { npc, specialty, dailyRate, rating, reputation, contractsCompleted } = listing;

  const borderColor = isSelected
    ? 'border-blue-500'
    : canAfford
    ? 'border-slate-600 hover:border-slate-500'
    : 'border-red-900 opacity-60';

  const bgColor = isSelected ? 'bg-blue-900/30' : 'bg-slate-800/50';

  return (
    <button
      onClick={onSelect}
      disabled={!canAfford}
      className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor} text-left transition-all w-full`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-white">{npc.name}</h4>
          {npc.nickname && (
            <span className="text-sm text-slate-400">"{npc.nickname}"</span>
          )}
        </div>
        <div className="text-right">
          <span className={`font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
            ${dailyRate}/day
          </span>
        </div>
      </div>

      {/* Specialty & Rating */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{SPECIALTY_ICONS[specialty]}</span>
        <span className="text-sm text-slate-300">{SPECIALTY_LABELS[specialty]}</span>
        <span className="ml-auto text-yellow-400 text-sm">{getRatingStars(rating)}</span>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
        <StatBadge label="MEL" value={npc.stats.MEL} />
        <StatBadge label="AGL" value={npc.stats.AGL} />
        <StatBadge label="STR" value={npc.stats.STR} />
        <StatBadge label="INT" value={npc.stats.INT} />
      </div>

      {/* Reputation */}
      <div className="text-xs text-slate-400">
        <span className="text-slate-500">Rep:</span> {reputation}
        {contractsCompleted > 0 && (
          <span className="ml-2">
            ({contractsCompleted} contract{contractsCompleted !== 1 ? 's' : ''})
          </span>
        )}
      </div>
    </button>
  );
};

const StatBadge: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="text-center">
    <div className="text-slate-500">{label}</div>
    <div className={`font-bold ${getStatColor(value)}`}>{value}</div>
  </div>
);

interface MercDetailsPanelProps {
  listing: MercenaryListing;
  canAfford: boolean;
  onHire: () => void;
}

const MercDetailsPanel: React.FC<MercDetailsPanelProps> = ({
  listing,
  canAfford,
  onHire,
}) => {
  const { npc, specialty, dailyRate, rating, reputation, contractsCompleted } = listing;

  return (
    <div className="bg-slate-900/80 rounded-lg p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-5xl">{SPECIALTY_ICONS[specialty]}</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white">{npc.name}</h3>
          {npc.nickname && (
            <p className="text-slate-400">"{npc.nickname}"</p>
          )}
          <p className="text-sm text-slate-500">
            Age {npc.age} | {SPECIALTY_LABELS[specialty]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 text-lg">{getRatingStars(rating)}</div>
          <div className={`text-2xl font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
            ${dailyRate}/day
          </div>
        </div>
      </div>

      {/* Full Stats */}
      <div className="mb-6">
        <h4 className="font-bold text-slate-400 mb-3">Combat Stats</h4>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {Object.entries(npc.stats).map(([stat, value]) => (
            <div key={stat} className="text-center p-2 bg-slate-800 rounded">
              <div className="text-slate-500 text-xs">{stat}</div>
              <div className={`font-bold text-lg ${getStatColor(value)}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-slate-500">Origin:</span>
          <span className="text-slate-300 ml-2">{npc.homeCountry}</span>
        </div>
        <div>
          <span className="text-slate-500">Location:</span>
          <span className="text-slate-300 ml-2">{npc.currentCity}</span>
        </div>
        <div>
          <span className="text-slate-500">Reputation:</span>
          <span className="text-slate-300 ml-2">{reputation}</span>
        </div>
        <div>
          <span className="text-slate-500">Contracts:</span>
          <span className="text-slate-300 ml-2">{contractsCompleted}</span>
        </div>
      </div>

      {/* Personality */}
      <div className="mb-6">
        <h4 className="font-bold text-slate-400 mb-2">Personality</h4>
        <div className="text-sm text-slate-300">
          <span className="text-slate-500">Type:</span> {npc.personality?.mbti || 'Unknown'}
          {npc.calling && (
            <span className="ml-4">
              <span className="text-slate-500">Calling:</span> {npc.calling}
            </span>
          )}
        </div>
      </div>

      {/* Hire Button */}
      <button
        onClick={onHire}
        disabled={!canAfford}
        className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
          canAfford
            ? 'bg-green-600 text-white hover:bg-green-500'
            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
        }`}
      >
        {canAfford ? `Hire for $${dailyRate}/day` : 'Cannot Afford'}
      </button>
    </div>
  );
};

interface PlayerTeamPanelProps {
  mercs: NPCEntity[];
  onFire: (mercId: string) => void;
}

const PlayerTeamPanel: React.FC<PlayerTeamPanelProps> = ({ mercs, onFire }) => {
  if (mercs.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-400 text-center">No mercenaries hired yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h4 className="font-bold text-slate-400 mb-3">Your Team ({mercs.length})</h4>
      <div className="space-y-2">
        {mercs.map((merc) => (
          <div
            key={merc.id}
            className="flex items-center justify-between p-2 bg-slate-700/50 rounded"
          >
            <div>
              <span className="text-white font-medium">{merc.name}</span>
              <span className="text-slate-400 text-sm ml-2">
                ${merc.salary}/day
              </span>
            </div>
            <button
              onClick={() => onFire(merc.id)}
              className="px-3 py-1 text-sm bg-red-900/50 text-red-400 rounded hover:bg-red-800/50 transition-colors"
            >
              Release
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MercRecruitment: React.FC<MercRecruitmentProps> = ({
  countryCode,
  playerMoney,
  onHire,
  onFire,
  onClose,
}) => {
  const [selectedMercId, setSelectedMercId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MercenarySpecialty | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'name'>('rating');

  const mercPool = useMemo(() => getMercenaryPoolManager(), []);
  const country = useMemo(() => getCountryByCode(countryCode), [countryCode]);

  // Get available mercs
  const availableMercs = useMemo(() => {
    let mercs = mercPool.getAvailableMercs(countryCode);

    // Filter by specialty
    if (filter !== 'all') {
      mercs = mercs.filter((m) => m.specialty === filter);
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        mercs.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        mercs.sort((a, b) => a.dailyRate - b.dailyRate);
        break;
      case 'name':
        mercs.sort((a, b) => a.npc.name.localeCompare(b.npc.name));
        break;
    }

    return mercs;
  }, [mercPool, countryCode, filter, sortBy]);

  const selectedListing = useMemo(() => {
    if (!selectedMercId) return null;
    return availableMercs.find((m) => m.npc.id === selectedMercId) || null;
  }, [availableMercs, selectedMercId]);

  const playerMercs = useMemo(() => mercPool.getPlayerMercs(), [mercPool]);

  const handleHire = useCallback(() => {
    if (selectedListing) {
      const contract = mercPool.hireMercenary(selectedListing.npc.id, 'player');
      if (contract) {
        onHire(selectedListing.npc.id, contract.dailyRate);
        setSelectedMercId(null);
      }
    }
  }, [selectedListing, mercPool, onHire]);

  const handleFire = useCallback(
    (mercId: string) => {
      if (mercPool.fireMercenary(mercId)) {
        onFire(mercId);
      }
    },
    [mercPool, onFire]
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Mercenary Recruitment</h2>
              <p className="text-slate-400">
                {country?.name || countryCode} | {availableMercs.length} available
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-slate-500 text-sm">Your Funds:</span>
                <span className="text-green-400 font-mono ml-2 text-lg">
                  ${playerMoney.toLocaleString()}
                </span>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div>
              <label className="text-sm text-slate-500 mr-2">Specialty:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as MercenarySpecialty | 'all')}
                className="bg-slate-700 text-white rounded px-3 py-1"
              >
                <option value="all">All</option>
                {Object.entries(SPECIALTY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-500 mr-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'name')}
                className="bg-slate-700 text-white rounded px-3 py-1"
              >
                <option value="rating">Rating</option>
                <option value="price">Price (Low to High)</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Mercenary List */}
          <div className="w-1/3 border-r border-slate-700 overflow-y-auto p-4">
            {availableMercs.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p>No mercenaries available in this country.</p>
                <p className="text-sm mt-2">Try checking back later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableMercs.map((listing) => (
                  <MercCard
                    key={listing.npc.id}
                    listing={listing}
                    isSelected={selectedMercId === listing.npc.id}
                    canAfford={playerMoney >= listing.dailyRate}
                    onSelect={() => setSelectedMercId(listing.npc.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Team */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedListing ? (
              <MercDetailsPanel
                listing={selectedListing}
                canAfford={playerMoney >= selectedListing.dailyRate}
                onHire={handleHire}
              />
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 text-center">
                <p className="text-slate-400">Select a mercenary to view details</p>
              </div>
            )}

            <PlayerTeamPanel mercs={playerMercs} onFire={handleFire} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default MercRecruitment;

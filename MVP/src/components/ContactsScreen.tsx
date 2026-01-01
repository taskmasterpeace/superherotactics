/**
 * ContactsScreen Component (NL-008)
 *
 * Displays all NPC contacts, their status, and life events.
 * Shows:
 * - Active contacts with relationship status
 * - Intel freshness indicators
 * - Hired mercenaries
 * - Recent NPC life events
 * - Returning enemies warnings
 */

import React, { useState, useMemo } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import { Contact, IntelItem, getContactManager } from '../data/contactSystem';
import { NPCEntity, getNPCManager } from '../data/npcSystem';
import { MercenaryListing, getMercenaryPoolManager } from '../data/mercenaryPool';
import { LifeEvent, getLifeEventManager } from '../data/npcLifeEvents';
import { getTimeEngine } from '../data/timeEngine';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ContactCardProps {
  contact: Contact;
  npc?: NPCEntity;
  currentTime: number;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, npc, currentTime }) => {
  const trustColor = contact.trustLevel >= 80 ? 'text-green-400' :
    contact.trustLevel >= 50 ? 'text-yellow-400' :
      contact.trustLevel >= 30 ? 'text-orange-400' : 'text-red-400';

  const relationshipIcon = {
    ally: '🤝',
    friendly: '😊',
    neutral: '😐',
    unfriendly: '😠',
    hostile: '⚔️',
    unknown: '❓',
  }[contact.relationship];

  return (
    <div className={`p-4 rounded-lg border transition-all hover:border-blue-400 ${
      contact.isCompromised
        ? 'bg-red-900/30 border-red-500/50'
        : 'bg-slate-800/50 border-slate-600/50'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {relationshipIcon} {npc?.name || contact.npcId}
            {contact.isCompromised && (
              <span className="text-xs bg-red-600 px-2 py-0.5 rounded animate-pulse">
                COMPROMISED
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-400">
            {npc?.currentCity}, {npc?.currentCountry}
          </p>
        </div>
        <div className="text-right">
          <div className={`font-bold ${trustColor}`}>
            Trust: {contact.trustLevel}%
          </div>
          <div className="text-xs text-slate-500">
            Burn Risk: {contact.burnRisk}%
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1 mb-3">
        {contact.specialties.map(spec => (
          <span
            key={spec}
            className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded"
          >
            {spec}
          </span>
        ))}
      </div>

      {/* Active Intel */}
      {contact.intelProvided.length > 0 && (
        <div className="mt-3 border-t border-slate-700 pt-3">
          <div className="text-xs text-slate-400 mb-2">Recent Intel:</div>
          {contact.intelProvided.slice(-3).map(intel => (
            <IntelBadge key={intel.id} intel={intel} currentTime={currentTime} />
          ))}
        </div>
      )}

      {/* NPC Stats Preview */}
      {npc && (
        <div className="mt-3 grid grid-cols-7 gap-1 text-xs">
          {(['MEL', 'AGL', 'STR', 'STA', 'INT', 'INS', 'CON'] as const).map(stat => (
            <div key={stat} className="text-center">
              <div className="text-slate-500">{stat}</div>
              <div className="text-slate-300">{npc.stats[stat]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface IntelBadgeProps {
  intel: IntelItem;
  currentTime: number;
}

const IntelBadge: React.FC<IntelBadgeProps> = ({ intel, currentTime }) => {
  const hoursElapsed = currentTime - intel.timestamp;
  const validityHours = {
    gang_activity: 72,
    police_movements: 48,
    superhuman_sightings: 24,
    political_intel: 168,
    economic_intel: 336,
    safe_houses: 336,
    equipment_sources: 168,
    mission_intel: 48,
    personal_info: 720,
    blackmail_material: 2160,
  }[intel.category] || 168;

  const freshness = Math.max(0, 100 - (hoursElapsed / validityHours) * 100);
  const isStale = freshness <= 0;
  const isExpiring = freshness > 0 && freshness <= 25;

  const freshnessColor = isStale ? 'bg-red-900/50 border-red-500' :
    isExpiring ? 'bg-yellow-900/50 border-yellow-500' :
      freshness > 75 ? 'bg-green-900/50 border-green-500' :
        'bg-slate-800/50 border-slate-600';

  return (
    <div className={`text-xs p-2 rounded border ${freshnessColor} mb-1`}>
      <div className="flex justify-between">
        <span className="text-slate-300">{intel.category.replace('_', ' ')}</span>
        <span className={isStale ? 'text-red-400' : 'text-slate-400'}>
          {isStale ? 'STALE' : `${Math.round(freshness)}% fresh`}
        </span>
      </div>
      <div className="text-slate-500 truncate">{intel.description}</div>
    </div>
  );
};

interface MercenaryCardProps {
  listing: MercenaryListing;
  isHired: boolean;
}

const MercenaryCard: React.FC<MercenaryCardProps> = ({ listing, isHired }) => {
  const { npc, specialty, dailyRate, rating, reputation, availability } = listing;

  const availabilityColors = {
    available: 'text-green-400',
    on_contract: 'text-blue-400',
    injured: 'text-orange-400',
    unavailable: 'text-red-400',
  };

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      isHired
        ? 'bg-blue-900/30 border-blue-500/50'
        : 'bg-slate-800/50 border-slate-600/50 hover:border-green-500/50'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-white">{npc.name}</h3>
          <p className="text-xs text-slate-400">{npc.currentCity}</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400">{stars}</div>
          <div className="text-xs text-slate-400">{reputation}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-sm">
          {specialty}
        </span>
        <span className={`text-sm ${availabilityColors[availability]}`}>
          {availability.replace('_', ' ')}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">Daily Rate:</span>
        <span className="text-green-400 font-bold">${dailyRate}</span>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-xs">
        {(['MEL', 'AGL', 'STR', 'STA', 'INT', 'INS', 'CON'] as const).map(stat => (
          <div key={stat} className="text-center">
            <div className="text-slate-500">{stat}</div>
            <div className="text-slate-300">{npc.stats[stat]}</div>
          </div>
        ))}
      </div>

      {isHired && (
        <div className="mt-3 text-center text-xs bg-blue-800/50 rounded py-1 text-blue-300">
          EMPLOYED
        </div>
      )}
    </div>
  );
};

interface LifeEventCardProps {
  event: LifeEvent;
}

const LifeEventCard: React.FC<LifeEventCardProps> = ({ event }) => {
  const eventIcons: Record<string, string> = {
    relocated: '📦',
    left_country: '✈️',
    arrested: '🚔',
    released: '🔓',
    injured: '🏥',
    recovered: '💪',
    promoted: '📈',
    demoted: '📉',
    betrayed: '🗡️',
    compromised: '🔓',
    retired: '🏖️',
    died: '💀',
    returned: '⚠️',
    upgraded: '⬆️',
    recruited: '📋',
    fired: '📤',
    married: '💒',
    divorced: '💔',
  };

  const eventColors: Record<string, string> = {
    died: 'border-red-500 bg-red-900/30',
    arrested: 'border-orange-500 bg-orange-900/30',
    returned: 'border-yellow-500 bg-yellow-900/30 animate-pulse',
    upgraded: 'border-yellow-500 bg-yellow-900/30',
    betrayed: 'border-purple-500 bg-purple-900/30',
    compromised: 'border-red-500 bg-red-900/30',
  };

  const defaultColor = 'border-slate-600 bg-slate-800/50';
  const colorClass = eventColors[event.type] || defaultColor;

  return (
    <div className={`p-3 rounded-lg border ${colorClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{eventIcons[event.type] || '📌'}</span>
        <span className="font-bold text-white">{event.npcName}</span>
        <span className="text-xs text-slate-400 ml-auto">
          {event.type.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-slate-300">{event.description}</p>
      {event.details && (
        <p className="text-xs text-slate-500 mt-1">{event.details}</p>
      )}
      {event.newLocation && (
        <p className="text-xs text-blue-400 mt-1">
          📍 Now in {event.newLocation.city}, {event.newLocation.country}
        </p>
      )}
    </div>
  );
};

interface EnemyWarningProps {
  enemies: NPCEntity[];
}

const EnemyWarning: React.FC<EnemyWarningProps> = ({ enemies }) => {
  if (enemies.length === 0) return null;

  return (
    <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 animate-pulse">
      <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
        ⚠️ RETURNING ENEMIES
      </h3>
      <p className="text-sm text-red-300 mb-3">
        Enemies you spared have grown stronger and may seek revenge.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {enemies.map(enemy => (
          <div
            key={enemy.id}
            className="flex justify-between items-center bg-red-950/50 rounded p-2"
          >
            <div>
              <span className="text-white font-bold">{enemy.name}</span>
              <span className="text-xs text-red-300 ml-2">
                Spared {enemy.timesSpared}x · +{enemy.levelUps} levels
              </span>
            </div>
            <span className="text-xs text-red-400">
              {enemy.currentCity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type TabType = 'contacts' | 'mercenaries' | 'events';

const ContactsScreen: React.FC = () => {
  const { currentCountry } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [searchTerm, setSearchTerm] = useState('');

  // Get managers
  const contactManager = useMemo(() => getContactManager(), []);
  const npcManager = useMemo(() => getNPCManager(), []);
  const mercManager = useMemo(() => getMercenaryPoolManager(), []);
  const lifeEventManager = useMemo(() => getLifeEventManager(), []);
  const timeEngine = useMemo(() => getTimeEngine(), []);
  const currentTime = timeEngine.getTime().totalHours;

  // Get data
  const allContacts = contactManager.getAllContacts();
  const playerMercs = mercManager.getPlayerMercs();
  const availableMercs = currentCountry ? mercManager.getAvailableMercs(currentCountry) : [];
  const recentEvents = lifeEventManager.getRecentEvents(20);
  const returningEnemies = npcManager.getReturningEnemies(currentTime);

  // Filter by search
  const filteredContacts = allContacts.filter(c =>
    c.npcId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tabs = [
    { id: 'contacts' as TabType, label: 'Contacts', count: allContacts.length },
    { id: 'mercenaries' as TabType, label: 'Mercenaries', count: playerMercs.length },
    { id: 'events' as TabType, label: 'Life Events', count: recentEvents.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Network & Contacts</h1>
          <p className="text-purple-300">Manage your network of contacts, mercenaries, and track NPC events</p>
        </div>

        {/* Enemy Warning */}
        <EnemyWarning enemies={returningEnemies} />

        {/* Stats Bar */}
        <div className="flex gap-4 mb-6">
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-purple-500/30">
            <span className="text-purple-300">Active Contacts:</span>
            <span className="ml-2 text-white font-bold">
              {allContacts.filter(c => !c.isCompromised).length}
            </span>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-blue-500/30">
            <span className="text-blue-300">Hired Mercs:</span>
            <span className="ml-2 text-white font-bold">{playerMercs.length}</span>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-green-500/30">
            <span className="text-green-300">Available ({currentCountry}):</span>
            <span className="ml-2 text-white font-bold">{availableMercs.length}</span>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-red-500/30">
            <span className="text-red-300">Enemies Returning:</span>
            <span className="ml-2 text-white font-bold">{returningEnemies.length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search (for contacts tab) */}
        {activeTab === 'contacts' && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search contacts by name or specialty..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
            />
          </div>
        )}

        {/* Content */}
        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <p className="text-xl mb-2">No contacts yet</p>
                <p className="text-sm">Build your network by meeting NPCs in the world.</p>
              </div>
            ) : (
              filteredContacts.map(contact => {
                const npc = npcManager.getNPC(contact.npcId);
                return (
                  <ContactCard
                    key={contact.npcId}
                    contact={contact}
                    npc={npc}
                    currentTime={currentTime}
                  />
                );
              })
            )}
          </div>
        )}

        {activeTab === 'mercenaries' && (
          <>
            {/* Hired Mercs */}
            {playerMercs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Your Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playerMercs.map(merc => {
                    // Find the listing for this merc
                    const listing = availableMercs.find(l => l.npc.id === merc.id) || {
                      npc: merc,
                      specialty: 'generalist' as const,
                      dailyRate: merc.salary || 200,
                      availability: 'on_contract' as const,
                      rating: 3,
                      reputation: 'Employed',
                      contractsCompleted: 0,
                    };
                    return (
                      <MercenaryCard key={merc.id} listing={listing} isHired={true} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Mercs */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">
                Available in {currentCountry || 'Current Location'}
              </h2>
              {availableMercs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-xl mb-2">No mercenaries available</p>
                  <p className="text-sm">Try a different country with higher military strength.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableMercs.map(listing => (
                    <MercenaryCard
                      key={listing.npc.id}
                      listing={listing}
                      isHired={playerMercs.some(m => m.id === listing.npc.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-xl mb-2">No recent events</p>
                <p className="text-sm">NPC life events will appear here as time passes.</p>
              </div>
            ) : (
              recentEvents.map(event => (
                <LifeEventCard key={event.id} event={event} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsScreen;

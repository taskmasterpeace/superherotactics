/**
 * Funeral Decision UI Component
 *
 * Displays funeral options when a team member dies in combat.
 * JA2-style emotional weight to character deaths:
 * - Choose funeral type (full honors to mass grave)
 * - See family notification
 * - Understand morale impact
 */

import React, { useState, useMemo } from 'react';
import { MercDeathEvent } from '../game/EventBridge';
import {
  FUNERAL_OPTIONS,
  FuneralType,
  DeathRecord,
  getDeathConsequencesManager,
  calculateMoraleImpact,
} from '../data/deathConsequences';
import {
  getPendingDeathNotifications,
  clearDeathNotification,
} from '../stores/combatResultsHandler';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FuneralOptionCardProps {
  option: typeof FUNERAL_OPTIONS[number];
  selected: boolean;
  canAfford: boolean;
  onSelect: () => void;
}

const FuneralOptionCard: React.FC<FuneralOptionCardProps> = ({
  option,
  selected,
  canAfford,
  onSelect,
}) => {
  const borderColor = selected
    ? 'border-blue-500'
    : canAfford
    ? 'border-slate-600 hover:border-slate-500'
    : 'border-red-900 opacity-50';

  const bgColor = selected ? 'bg-blue-900/30' : 'bg-slate-800/50';

  return (
    <button
      onClick={onSelect}
      disabled={!canAfford}
      className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor} text-left transition-all w-full`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white capitalize">
          {option.type.replace('_', ' ')}
        </h4>
        <span className={`font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
          ${option.cost.toLocaleString()}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-3">{option.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Morale:</span>
          <span className={option.moraleRecovery >= 0 ? 'text-green-400' : 'text-red-400'}>
            {option.moraleRecovery >= 0 ? '+' : ''}{option.moraleRecovery}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Family:</span>
          <span className={
            option.familyReaction === 'grateful' ? 'text-green-400' :
            option.familyReaction === 'neutral' ? 'text-slate-400' : 'text-red-400'
          }>
            {option.familyReaction}
          </span>
        </div>
      </div>

      {option.publicOpinion !== 0 && (
        <div className="mt-2 text-xs">
          <span className="text-slate-500">Public Opinion:</span>
          <span className={option.publicOpinion > 0 ? 'text-green-400' : 'text-red-400'}>
            {' '}{option.publicOpinion > 0 ? '+' : ''}{option.publicOpinion}
          </span>
        </div>
      )}
    </button>
  );
};

interface DeathSummaryProps {
  deathEvent: MercDeathEvent;
  deathRecord?: DeathRecord | null;
}

const DeathSummary: React.FC<DeathSummaryProps> = ({ deathEvent, deathRecord }) => {
  return (
    <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-4xl">💀</div>
        <div>
          <h3 className="text-xl font-bold text-white">{deathEvent.unitName}</h3>
          <p className="text-sm text-slate-400">
            Killed by {deathEvent.killedBy} with {deathEvent.weapon}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500">Location:</span>
          <span className="text-slate-300 ml-2">
            {deathEvent.location?.cityName || 'Unknown'}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Round:</span>
          <span className="text-slate-300 ml-2">{deathEvent.round}</span>
        </div>
        {deathEvent.homeCountry && (
          <div>
            <span className="text-slate-500">Home Country:</span>
            <span className="text-slate-300 ml-2">{deathEvent.homeCountry}</span>
          </div>
        )}
        {deathEvent.witnesses.length > 0 && (
          <div className="col-span-2">
            <span className="text-slate-500">Witnessed by:</span>
            <span className="text-slate-300 ml-2">
              {deathEvent.witnesses.join(', ')}
            </span>
          </div>
        )}
      </div>

      {deathRecord?.lastWords && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-600 italic text-slate-300">
          "{deathRecord.lastWords}"
        </div>
      )}
    </div>
  );
};

interface MoralePreviewProps {
  funeralType: FuneralType;
  witnesses: string[];
}

const MoralePreview: React.FC<MoralePreviewProps> = ({ funeralType, witnesses }) => {
  const option = FUNERAL_OPTIONS.find(o => o.type === funeralType);
  if (!option) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h4 className="font-bold text-slate-400 mb-3">Team Morale Impact</h4>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Base Death Impact:</span>
          <span className="text-red-400">-30</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Funeral Recovery:</span>
          <span className={option.moraleRecovery >= 0 ? 'text-green-400' : 'text-red-400'}>
            {option.moraleRecovery >= 0 ? '+' : ''}{option.moraleRecovery}
          </span>
        </div>

        <div className="border-t border-slate-600 pt-2 flex justify-between font-bold">
          <span className="text-white">Net Impact:</span>
          <span className={-30 + option.moraleRecovery >= 0 ? 'text-green-400' : 'text-red-400'}>
            {-30 + option.moraleRecovery}
          </span>
        </div>
      </div>

      {witnesses.length > 0 && (
        <div className="mt-3 text-xs text-slate-500">
          Witnesses ({witnesses.length}) will have additional trauma effects.
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface FuneralDecisionProps {
  playerMoney: number;
  onDecisionMade: (unitId: string, funeralType: FuneralType, cost: number) => void;
  onClose?: () => void;
}

export const FuneralDecision: React.FC<FuneralDecisionProps> = ({
  playerMoney,
  onDecisionMade,
  onClose,
}) => {
  const pendingDeaths = useMemo(() => getPendingDeathNotifications(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFuneral, setSelectedFuneral] = useState<FuneralType>('standard');

  const currentDeath = pendingDeaths[currentIndex];

  if (!currentDeath) {
    return null;
  }

  const deathManager = getDeathConsequencesManager();
  const deathRecords = deathManager.getDeathRecords();
  const currentRecord = deathRecords.find(r => r.npcId === currentDeath.npcId);

  const handleConfirm = () => {
    const option = FUNERAL_OPTIONS.find(o => o.type === selectedFuneral);
    if (!option) return;

    // Process funeral through death consequences system
    if (currentDeath.npcId && currentRecord) {
      deathManager.handleFuneralDecision(currentRecord.id, selectedFuneral, true);
    }

    // Clear this notification
    clearDeathNotification(currentDeath.unitId);

    // Notify parent
    onDecisionMade(currentDeath.unitId, selectedFuneral, option.cost);

    // Move to next death or close
    if (currentIndex < pendingDeaths.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedFuneral('standard');
    } else if (onClose) {
      onClose();
    }
  };

  const canAfford = (cost: number) => playerMoney >= cost;
  const selectedOption = FUNERAL_OPTIONS.find(o => o.type === selectedFuneral);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Memorial Services Required</h2>
            <div className="text-sm text-slate-400">
              {currentIndex + 1} of {pendingDeaths.length} fallen
            </div>
          </div>
          <p className="text-slate-400 mt-2">
            A member of your team has fallen in combat. How would you like to honor their memory?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Death Info */}
          <div className="space-y-4">
            <DeathSummary deathEvent={currentDeath} deathRecord={currentRecord} />
            <MoralePreview
              funeralType={selectedFuneral}
              witnesses={currentDeath.witnesses}
            />
          </div>

          {/* Right Column - Funeral Options */}
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-400">Choose Memorial</h4>
              <div className="text-sm">
                <span className="text-slate-500">Your funds:</span>
                <span className="text-green-400 font-mono ml-2">
                  ${playerMoney.toLocaleString()}
                </span>
              </div>
            </div>

            {FUNERAL_OPTIONS.map((option) => (
              <FuneralOptionCard
                key={option.type}
                option={option}
                selected={selectedFuneral === option.type}
                canAfford={canAfford(option.cost)}
                onSelect={() => setSelectedFuneral(option.type)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            {selectedOption && (
              <span>
                Cost: <span className="text-white font-mono">${selectedOption.cost.toLocaleString()}</span>
                {' '} | Family: <span className={
                  selectedOption.familyReaction === 'grateful' ? 'text-green-400' :
                  selectedOption.familyReaction === 'neutral' ? 'text-slate-400' : 'text-red-400'
                }>{selectedOption.familyReaction}</span>
              </span>
            )}
          </div>

          <div className="flex gap-3">
            {pendingDeaths.length > 1 && currentIndex < pendingDeaths.length - 1 && (
              <button
                onClick={() => {
                  setCurrentIndex(currentIndex + 1);
                  setSelectedFuneral('standard');
                }}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >
                Skip for Now
              </button>
            )}

            <button
              onClick={handleConfirm}
              disabled={!canAfford(selectedOption?.cost || 0)}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                canAfford(selectedOption?.cost || 0)
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              Confirm {selectedFuneral.replace('_', ' ')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPACT VERSION FOR NOTIFICATIONS
// ============================================================================

interface FuneralNotificationProps {
  deathEvent: MercDeathEvent;
  onViewDetails: () => void;
}

export const FuneralNotification: React.FC<FuneralNotificationProps> = ({
  deathEvent,
  onViewDetails,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-red-800 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="text-2xl">💀</div>
        <div className="flex-1">
          <h4 className="font-bold text-white">{deathEvent.unitName} has fallen</h4>
          <p className="text-sm text-slate-400">
            Killed by {deathEvent.killedBy}
          </p>
        </div>
        <button
          onClick={onViewDetails}
          className="px-3 py-1.5 rounded bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors"
        >
          Arrange Memorial
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default FuneralDecision;

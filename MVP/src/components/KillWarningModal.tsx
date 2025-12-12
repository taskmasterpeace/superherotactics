import React from 'react';

interface KillWarningModalProps {
  isOpen: boolean;
  targetName: string;
  targetCurrentHP: number;
  targetMaxHP: number;
  incomingDamage: number;
  onConfirmKill: () => void;
  onCancel: () => void;
  onStunInstead: () => void;
}

export const KillWarningModal: React.FC<KillWarningModalProps> = ({
  isOpen,
  targetName,
  targetCurrentHP,
  targetMaxHP,
  incomingDamage,
  onConfirmKill,
  onCancel,
  onStunInstead,
}) => {
  if (!isOpen) return null;

  const resultingHP = targetCurrentHP - incomingDamage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
      />

      {/* Modal content */}
      <div className="relative bg-gray-800 border-2 border-red-500 rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 rounded-t-lg">
          <h2 className="text-2xl font-bold text-white text-center">
            ⚠️ LETHAL DAMAGE WARNING
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Target Info */}
          <div className="bg-gray-900 rounded p-4 space-y-2">
            <div className="text-lg font-semibold text-white">
              Target: <span className="text-red-400">{targetName}</span>
            </div>
            <div className="text-sm text-gray-300">
              Current HP: <span className="text-green-400 font-mono">{targetCurrentHP}</span> / {targetMaxHP}
            </div>
            <div className="text-sm text-gray-300">
              Incoming Damage: <span className="text-orange-400 font-mono">{incomingDamage}</span>
            </div>
          </div>

          {/* Result Preview */}
          <div className="bg-red-900/30 border border-red-500 rounded p-4">
            <div className="text-center text-lg font-bold">
              <span className="text-gray-300">HP: </span>
              <span className="text-green-400 font-mono">{targetCurrentHP}</span>
              <span className="text-gray-400 mx-2">→</span>
              <span className="text-red-500 font-mono">{resultingHP}</span>
              <span className="text-red-400 ml-2">(DEATH)</span>
            </div>
          </div>

          {/* Warning Message */}
          <p className="text-sm text-gray-400 text-center italic">
            This attack will kill the target. Choose your action:
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          {/* Confirm Kill Button */}
          <button
            onClick={onConfirmKill}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 border-2 border-red-500 hover:border-red-400"
          >
            Confirm Kill
          </button>

          {/* Stun Instead Button */}
          <button
            onClick={onStunInstead}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 border-2 border-blue-500 hover:border-blue-400"
          >
            Stun Instead (Non-Lethal)
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 border-2 border-gray-500 hover:border-gray-400"
          >
            Cancel Attack
          </button>
        </div>
      </div>
    </div>
  );
};

export default KillWarningModal;

import React, { useState } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import { getCountryByCode, ALL_COUNTRIES } from '../data/countries';
import { calculateMedicalSystem } from '../data/combinedEffects';
import {
  getOriginHealing,
  getMaxHealingPercent,
  getHealingFrequency,
  formatRollModifier,
  getRequirementDescription,
  isOriginResearchComplete,
} from '../data/originHealingSystem';

const HospitalScreen: React.FC = () => {
  const {
    characters,
    budget,
    getHospitalQuality,
    transferToHospital,
  } = useGameStore();

  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetCountry, setTargetCountry] = useState<string>('');

  // Get all hospitalized characters
  const hospitalizedCharacters = characters.filter(
    c => c.status === 'hospital' || c.status === 'hospitalized'
  );

  // Get top hospital countries
  const topHospitalCountries = ALL_COUNTRIES
    .map(country => ({
      country,
      medicalSystem: calculateMedicalSystem(country),
    }))
    .filter(({ medicalSystem }) => medicalSystem.hospitalTier >= 3)
    .sort((a, b) => {
      // Sort by medical tourism score (quality vs cost)
      return b.medicalSystem.medicalTourismScore - a.medicalSystem.medicalTourismScore;
    })
    .slice(0, 10);

  const handleTransfer = () => {
    if (!selectedCharacter || !targetCountry) return;
    transferToHospital(selectedCharacter, targetCountry);
    setShowTransferModal(false);
    setSelectedCharacter(null);
    setTargetCountry('');
  };

  const formatTime = (hours: number): string => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'severe': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      case 'permanent': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Hospital Management</h1>
          <p className="text-blue-300">Medical Treatment & Recovery</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-blue-500/30">
              <span className="text-blue-300">Budget:</span>
              <span className="ml-2 text-white font-bold">${budget.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-blue-500/30">
              <span className="text-blue-300">Hospitalized:</span>
              <span className="ml-2 text-white font-bold">{hospitalizedCharacters.length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hospitalized Characters */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/80 rounded-lg border border-blue-500/30 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Hospitalized Characters</h2>

              {hospitalizedCharacters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏥</div>
                  <p className="text-blue-300 text-lg">No characters currently hospitalized</p>
                  <p className="text-gray-400 text-sm mt-2">Characters will appear here when injured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hospitalizedCharacters.map(char => {
                    const country = getCountryByCode(char.location?.country || 'US');
                    const medicalSystem = country ? calculateMedicalSystem(country) : null;
                    const daysRemaining = Math.ceil((char.recoveryTime || 0) / 24);
                    const hoursRemaining = Math.floor((char.recoveryTime || 0) % 24);

                    return (
                      <div
                        key={char.id}
                        className="bg-slate-700/50 rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{char.name}</h3>
                              <span className="text-sm text-gray-400">({char.realName})</span>
                            </div>

                            {/* Hospital Info */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-300">Location:</span>
                                <span className="text-white font-semibold">
                                  {country?.name || 'Unknown'}
                                </span>
                              </div>
                              {medicalSystem && (
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-300">Hospital Tier:</span>
                                  <span className="text-white font-bold">
                                    {medicalSystem.hospitalTier}
                                  </span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(tier => (
                                      <div
                                        key={tier}
                                        className={`w-2 h-2 rounded-full ${
                                          tier <= medicalSystem.hospitalTier
                                            ? 'bg-green-500'
                                            : 'bg-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Recovery Time */}
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-blue-300">Recovery Time:</span>
                                <span className="text-white font-bold">
                                  {daysRemaining > 0 && `${daysRemaining} days `}
                                  {hoursRemaining > 0 && `${hoursRemaining} hours`}
                                </span>
                              </div>
                              {/* Progress Bar */}
                              <div className="w-full bg-slate-600 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${Math.max(0, 100 - ((char.recoveryTime || 0) / (char.recoveryTime || 1)) * 100)}%`
                                  }}
                                />
                              </div>
                            </div>

                            {/* Injuries */}
                            {char.injuries && char.injuries.length > 0 && (
                              <div className="mb-3">
                                <span className="text-blue-300 text-sm">Injuries:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {char.injuries.map((injury: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(injury.severity)} bg-slate-800/50 border border-current`}
                                    >
                                      {injury.bodyPart || injury.description || 'Unknown'} ({injury.severity})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Health Stats */}
                            <div className="flex gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">HP:</span>
                                <span className="ml-1 text-white">{char.health?.current || 0}/{char.health?.maximum || 100}</span>
                              </div>
                              {medicalSystem && (
                                <>
                                  <div>
                                    <span className="text-gray-400">Quality:</span>
                                    <span className="ml-1 text-white">{medicalSystem.healthcareQuality}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Recovery Speed:</span>
                                    <span className="ml-1 text-white">{medicalSystem.recoverySpeedMultiplier.toFixed(1)}x</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Origin Healing Info */}
                            {(() => {
                              const originHealing = getOriginHealing(char.origin || 1);
                              if (!originHealing) return null;

                              const maxHealPercent = getMaxHealingPercent(char);
                              const healingFreq = getHealingFrequency(char);
                              const researchComplete = isOriginResearchComplete(char);
                              const canUseHospital = originHealing.canUseHospital;

                              return (
                                <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-purple-300 font-semibold text-sm">
                                      Origin: {originHealing.originName}
                                    </span>
                                    {!canUseHospital && (
                                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                                        CANNOT USE HOSPITAL
                                      </span>
                                    )}
                                  </div>

                                  {canUseHospital && (
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <span className="text-gray-400">Max Healing:</span>
                                        <span className={`ml-1 font-bold ${maxHealPercent < 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                                          {maxHealPercent}%
                                        </span>
                                        {maxHealPercent < 100 && !researchComplete && (
                                          <div className="text-yellow-400/70 text-[10px] mt-0.5">
                                            Complete {getRequirementDescription(originHealing.requirementFor100)} for 100%
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Healing Roll:</span>
                                        <span className="ml-1 text-white font-bold">
                                          {formatRollModifier(originHealing.healingRollModifier)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Frequency:</span>
                                        <span className="ml-1 text-white font-bold">Every {healingFreq}h</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Research:</span>
                                        <span className={`ml-1 font-bold ${researchComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                                          {researchComplete ? 'Complete' : 'Pending'}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {originHealing.specialNotes && originHealing.specialNotes.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-700">
                                      <ul className="text-[10px] text-gray-400 space-y-0.5">
                                        {originHealing.specialNotes.slice(0, 2).map((note, idx) => (
                                          <li key={idx}>* {note}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Transfer Button */}
                          <button
                            onClick={() => {
                              setSelectedCharacter(char.id);
                              setShowTransferModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                          >
                            Transfer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Hospitals Sidebar */}
          <div>
            <div className="bg-slate-800/80 rounded-lg border border-blue-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Top Medical Facilities</h2>
              <p className="text-sm text-blue-300 mb-4">Best quality/cost ratio worldwide</p>

              <div className="space-y-3">
                {topHospitalCountries.map(({ country, medicalSystem }) => (
                  <div
                    key={country.code}
                    className="bg-slate-700/50 rounded-lg p-3 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">{country.name}</h3>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(tier => (
                          <div
                            key={tier}
                            className={`w-1.5 h-1.5 rounded-full ${
                              tier <= medicalSystem.hospitalTier
                                ? 'bg-green-500'
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Quality:</span>
                        <span className="ml-1 text-white">{medicalSystem.healthcareQuality}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Speed:</span>
                        <span className="ml-1 text-white">{medicalSystem.recoverySpeedMultiplier.toFixed(1)}x</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Cost:</span>
                        <span className="ml-1 text-white">{Math.round(medicalSystem.healthcareCost * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Tourism:</span>
                        <span className="ml-1 text-green-400">{medicalSystem.medicalTourismScore}</span>
                      </div>
                    </div>
                    {medicalSystem.cybernetics && (
                      <div className="mt-2 text-xs text-purple-400">
                        Cybernetics available
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedCharacter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-lg border border-blue-500/50 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Transfer to Better Hospital</h2>

            <div className="mb-4">
              <label className="block text-blue-300 mb-2">Select Destination Country:</label>
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="w-full bg-slate-700 text-white border border-blue-500/30 rounded px-3 py-2"
              >
                <option value="">-- Select Country --</option>
                {ALL_COUNTRIES
                  .filter(c => {
                    const char = characters.find(ch => ch.id === selectedCharacter);
                    return c.code !== char?.location?.country;
                  })
                  .sort((a, b) => {
                    const medA = calculateMedicalSystem(a);
                    const medB = calculateMedicalSystem(b);
                    return medB.medicalTourismScore - medA.medicalTourismScore;
                  })
                  .slice(0, 50) // Show top 50
                  .map(country => {
                    const medical = calculateMedicalSystem(country);
                    return (
                      <option key={country.code} value={country.code}>
                        {country.name} - Tier {medical.hospitalTier} ({medical.healthcareQuality}% quality)
                      </option>
                    );
                  })}
              </select>
            </div>

            {targetCountry && (
              <div className="bg-slate-700/50 rounded p-4 mb-4">
                {(() => {
                  const char = characters.find(c => c.id === selectedCharacter);
                  const currentCountry = getCountryByCode(char?.location?.country || 'US');
                  const target = getCountryByCode(targetCountry);
                  if (!currentCountry || !target) return null;

                  const currentMed = calculateMedicalSystem(currentCountry);
                  const targetMed = calculateMedicalSystem(target);
                  const transferCost = Math.round(5000 * (targetMed.healthcareCost / currentMed.healthcareCost));
                  const qualityRatio = currentMed.healthcareQuality / targetMed.healthcareQuality;
                  const newRecoveryTime = Math.max(1, Math.round((char?.recoveryTime || 0) * qualityRatio));
                  const timeSaved = (char?.recoveryTime || 0) - newRecoveryTime;

                  return (
                    <>
                      <h3 className="text-white font-bold mb-2">Transfer Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Hospital:</span>
                          <span className="text-white">{currentCountry.name} (Tier {currentMed.hospitalTier})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Target Hospital:</span>
                          <span className="text-white">{target.name} (Tier {targetMed.hospitalTier})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Transfer Cost:</span>
                          <span className="text-white font-bold">${transferCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Recovery:</span>
                          <span className="text-white">{formatTime(char?.recoveryTime || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">New Recovery:</span>
                          <span className={timeSaved > 0 ? 'text-green-400 font-bold' : 'text-white'}>
                            {formatTime(newRecoveryTime + 12)} {/* +12 for travel */}
                          </span>
                        </div>
                        {timeSaved > 0 && (
                          <div className="flex justify-between border-t border-blue-500/30 pt-2">
                            <span className="text-green-400">Time Saved:</span>
                            <span className="text-green-400 font-bold">{formatTime(timeSaved)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTransfer}
                disabled={!targetCountry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Confirm Transfer
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedCharacter(null);
                  setTargetCountry('');
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalScreen;

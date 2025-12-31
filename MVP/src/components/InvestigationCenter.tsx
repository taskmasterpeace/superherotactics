import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { Investigation, ApproachType, APPROACH_CONFIGS } from '../data/investigationSystem'
import toast from 'react-hot-toast'

export default function InvestigationCenter() {
  const {
    investigationLeads,
    activeInvestigations,
    characters,
    startInvestigation,
    advanceInvestigationProgress,
    setCurrentView
  } = useGameStore()

  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null)
  const [selectedTab, setSelectedTab] = useState<'leads' | 'active'>('leads')

  const allInvestigations = selectedTab === 'leads' ? investigationLeads : activeInvestigations

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Investigation List Panel */}
      <motion.div
        className="w-96 bg-gray-900 bg-opacity-95 border-r border-sht-primary-400 p-6 overflow-y-auto"
        initial={{ x: -384 }}
        animate={{ x: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-sht-primary-400">Investigation Board</h2>
          <button
            onClick={() => {
              setCurrentView('world-map')
              toast.info('Returning to world map')
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            Back
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedTab('leads')}
            className={`flex-1 py-2 px-4 rounded font-bold transition-all ${
              selectedTab === 'leads'
                ? 'bg-sht-primary-400 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Leads ({investigationLeads.length})
          </button>
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex-1 py-2 px-4 rounded font-bold transition-all ${
              selectedTab === 'active'
                ? 'bg-sht-primary-400 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Active ({activeInvestigations.length})
          </button>
        </div>

        {/* Investigation Cards */}
        <div className="space-y-3">
          {allInvestigations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-gray-400">
                {selectedTab === 'leads' ? 'No leads available' : 'No active investigations'}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {selectedTab === 'leads'
                  ? 'Patrol cities to discover new investigation leads'
                  : 'Start an investigation from your leads'}
              </div>
            </div>
          ) : (
            allInvestigations.map((investigation, index) => (
              <InvestigationCard
                key={investigation.id}
                investigation={investigation}
                isSelected={selectedInvestigation?.id === investigation.id}
                onSelect={() => setSelectedInvestigation(investigation)}
                delay={index * 0.1}
              />
            ))
          )}
        </div>
      </motion.div>

      {/* Investigation Details Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedInvestigation ? (
          <InvestigationDetails investigation={selectedInvestigation} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}

// Investigation Card Component
function InvestigationCard({
  investigation,
  isSelected,
  onSelect,
  delay
}: {
  investigation: Investigation
  isSelected: boolean
  onSelect: () => void
  delay: number
}) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'crime':
        return 'text-orange-400'
      case 'conspiracy':
        return 'text-purple-400'
      case 'terrorism':
        return 'text-red-400'
      case 'underworld':
        return 'text-yellow-400'
      case 'corporate':
        return 'text-blue-400'
      case 'espionage':
        return 'text-green-400'
      default:
        return 'text-gray-400'
    }
  }

  const getDangerColor = (danger: number) => {
    if (danger >= 8) return 'text-red-500'
    if (danger >= 5) return 'text-orange-500'
    return 'text-yellow-500'
  }

  return (
    <motion.div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-sht-primary-400 bg-sht-primary-400 bg-opacity-10'
          : 'border-gray-600 hover:border-gray-500 bg-gray-800'
      }`}
      onClick={onSelect}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-white text-sm">{investigation.title}</h3>
        <div className={`text-xs font-bold uppercase ${getTypeColor(investigation.type)}`}>
          {investigation.type}
        </div>
      </div>

      <p className="text-xs text-gray-300 mb-3 line-clamp-2">{investigation.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div>
          <span className="text-gray-400">Location:</span>
          <div className="text-blue-400 font-bold">{investigation.city}</div>
        </div>
        <div>
          <span className="text-gray-400">Danger:</span>
          <div className={`font-bold ${getDangerColor(investigation.dangerLevel)}`}>
            {investigation.dangerLevel}/10
          </div>
        </div>
      </div>

      {/* Progress Bar for Active Investigations */}
      {investigation.status === 'active' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Progress: {investigation.currentPhase}</span>
            <span className="text-green-400">{investigation.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
              style={{ width: `${investigation.progress}%` }}
            />
          </div>

          {/* Suspicion and Exposure meters */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <div className="text-xs text-gray-400 mb-1">Suspicion: {investigation.suspicionLevel}%</div>
              <div className="w-full bg-gray-700 h-1 rounded-full">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${investigation.suspicionLevel}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Exposure: {investigation.publicExposure}%</div>
              <div className="w-full bg-gray-700 h-1 rounded-full">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${investigation.publicExposure}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Characters */}
      {investigation.assignedCharacters.length > 0 && (
        <div className="mt-2 text-xs text-green-400">
          Assigned: {investigation.assignedCharacters.length} investigator(s)
        </div>
      )}
    </motion.div>
  )
}

// Investigation Details Component
function InvestigationDetails({ investigation }: { investigation: Investigation }) {
  const {
    characters,
    startInvestigation,
    advanceInvestigationProgress
  } = useGameStore()

  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [selectedApproach, setSelectedApproach] = useState<ApproachType | null>(null)

  const availableCharacters = characters.filter(c => c.status === 'ready' || c.status === 'investigating')
  const assignedCharacters = characters.filter(c => investigation.assignedCharacters.includes(c.id))

  const handleStartInvestigation = () => {
    if (!selectedCharacter) {
      toast.error('Select an investigator first')
      return
    }
    startInvestigation(investigation.id, selectedCharacter)
  }

  const handleAdvanceInvestigation = () => {
    if (!selectedCharacter || !selectedApproach) {
      toast.error('Select investigator and approach')
      return
    }
    advanceInvestigationProgress(investigation.id, selectedCharacter, selectedApproach)
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Investigation Header */}
      <div className="game-panel p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{investigation.title}</h1>
            <div className="text-sm text-gray-400 uppercase tracking-wide">{investigation.type} Investigation</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Phase</div>
            <div className="text-lg font-bold text-sht-primary-400 capitalize">{investigation.currentPhase}</div>
          </div>
        </div>

        <p className="text-gray-300 leading-relaxed mb-4">{investigation.description}</p>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Location</div>
            <div className="font-bold text-blue-400">{investigation.city}</div>
            <div className="text-xs text-gray-500">Sector {investigation.sector}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Difficulty</div>
            <div className="font-bold text-orange-400">{investigation.difficulty}/10</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Danger Level</div>
            <div className="font-bold text-red-400">{investigation.dangerLevel}/10</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Reward</div>
            <div className="font-bold text-green-400">${(investigation.potentialReward.cash / 1000).toFixed(0)}k</div>
          </div>
        </div>
      </div>

      {/* Investigation Status - Only for Active */}
      {investigation.status === 'active' && (
        <div className="game-panel p-6 mb-6">
          <h2 className="text-xl font-bold text-sht-secondary-400 mb-4">Investigation Status</h2>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Progress</div>
              <div className="text-2xl font-bold text-green-400">{investigation.progress}%</div>
              <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${investigation.progress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Suspicion</div>
              <div className="text-2xl font-bold text-red-400">{investigation.suspicionLevel}%</div>
              <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${investigation.suspicionLevel}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Public Exposure</div>
              <div className="text-2xl font-bold text-yellow-400">{investigation.publicExposure}%</div>
              <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${investigation.publicExposure}%` }}
                />
              </div>
            </div>
          </div>

          {investigation.lastActionResult && (
            <div className={`p-4 rounded-lg ${
              investigation.lastActionResult.success ? 'bg-green-900 bg-opacity-30 border border-green-700' : 'bg-red-900 bg-opacity-30 border border-red-700'
            }`}>
              <div className="text-sm font-bold mb-2">Last Action Result:</div>
              <div className="text-sm">{investigation.lastActionResult.message}</div>
            </div>
          )}
        </div>
      )}

      {/* Clues Gathered */}
      {investigation.cluesGathered.length > 0 && (
        <div className="game-panel p-6 mb-6">
          <h2 className="text-xl font-bold text-sht-accent-400 mb-4">Clues Gathered ({investigation.cluesGathered.length})</h2>
          <div className="space-y-2">
            {investigation.cluesGathered.map((clue, index) => (
              <div key={clue.id} className="bg-gray-700 p-3 rounded flex items-start gap-3">
                <div className={`text-2xl ${
                  clue.quality === 'strong' ? 'text-green-400' :
                  clue.quality === 'moderate' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {clue.quality === 'strong' ? '⭐' : clue.quality === 'moderate' ? '📌' : '📎'}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white">{clue.description}</div>
                  <div className="text-xs text-gray-400 mt-1">Quality: {clue.quality} • Phase: {clue.relatesTo.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Investigator (for leads) */}
      {investigation.status === 'discovered' && (
        <div className="game-panel p-6 mb-6">
          <h2 className="text-xl font-bold text-sht-secondary-400 mb-4">Assign Investigator</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {availableCharacters.map((character) => (
              <div
                key={character.id}
                className={`bg-gray-700 p-4 rounded-lg cursor-pointer transition-all ${
                  selectedCharacter === character.id ? 'ring-2 ring-sht-primary-400' : 'hover:bg-gray-600'
                }`}
                onClick={() => setSelectedCharacter(character.id)}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white">{character.name}</h3>
                  <div className={`text-xs px-2 py-1 rounded ${
                    character.status === 'ready' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'
                  }`}>
                    {character.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div className="text-center">
                    <div className="text-gray-400">INT</div>
                    <div className="font-bold text-purple-400">{character.stats.INT}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">INS</div>
                    <div className="font-bold text-blue-400">{character.stats.INS}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">CON</div>
                    <div className="font-bold text-green-400">{character.stats.CON}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartInvestigation}
            disabled={!selectedCharacter}
            className="w-full bg-sht-primary-400 hover:bg-sht-primary-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded transition-all"
          >
            START INVESTIGATION
          </button>
        </div>
      )}

      {/* Investigation Approaches (for active investigations) */}
      {investigation.status === 'active' && (
        <div className="game-panel p-6">
          <h2 className="text-xl font-bold text-sht-accent-400 mb-4">Choose Approach</h2>

          {/* Character selector for active investigation */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Select Investigator:</h3>
            <div className="grid grid-cols-2 gap-2">
              {assignedCharacters.map(char => (
                <div
                  key={char.id}
                  className={`p-3 rounded cursor-pointer ${
                    selectedCharacter === char.id
                      ? 'bg-sht-primary-400 text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedCharacter(char.id)}
                >
                  <div className="font-bold">{char.name}</div>
                  <div className="text-xs opacity-75">INT {char.stats.INT} • INS {char.stats.INS}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {investigation.availableApproaches.map((approach) => {
              const config = APPROACH_CONFIGS[approach]
              return (
                <ApproachCard
                  key={approach}
                  approach={approach}
                  config={config}
                  isSelected={selectedApproach === approach}
                  onSelect={() => setSelectedApproach(approach)}
                />
              )
            })}
          </div>

          <button
            onClick={handleAdvanceInvestigation}
            disabled={!selectedCharacter || !selectedApproach}
            className="w-full bg-sht-accent-400 hover:bg-sht-accent-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded transition-all"
          >
            EXECUTE APPROACH
          </button>
        </div>
      )}
    </motion.div>
  )
}

// Approach Card Component
function ApproachCard({
  approach,
  config,
  isSelected,
  onSelect
}: {
  approach: ApproachType
  config: any
  isSelected: boolean
  onSelect: () => void
}) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-orange-400'
      case 'extreme':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-sht-accent-400 text-black ring-2 ring-sht-accent-500'
          : 'bg-gray-700 text-white hover:bg-gray-600'
      }`}
      onClick={onSelect}
    >
      <h4 className="font-bold mb-2">{config.name}</h4>
      <p className={`text-xs mb-4 ${isSelected ? 'text-gray-800' : 'text-gray-300'}`}>
        {config.description}
      </p>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className={isSelected ? 'text-gray-700' : 'text-gray-400'}>Progress Gain:</span>
          <span className="font-bold text-green-600">+{config.successBonuses.progressGain}%</span>
        </div>
        <div className="flex justify-between">
          <span className={isSelected ? 'text-gray-700' : 'text-gray-400'}>Risk Level:</span>
          <span className={`font-bold ${getRiskColor(config.riskLevel)}`}>{config.riskLevel.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className={isSelected ? 'text-gray-700' : 'text-gray-400'}>Skills:</span>
          <span className="font-bold text-purple-600 text-xs">{config.primarySkills.slice(0, 2).join(', ')}</span>
        </div>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-400 mb-2">Select an Investigation</h2>
        <p className="text-gray-500">Choose a case from the list to view details and take action</p>
        <div className="mt-8 bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
          <h3 className="text-lg font-bold text-sht-primary-400 mb-3">Investigation Board</h3>
          <p className="text-sm text-gray-400 text-left">
            Use this board to:
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Discover investigation leads through patrols</li>
              <li>Assign investigators to active cases</li>
              <li>Choose investigation approaches</li>
              <li>Track clues and progress</li>
              <li>Complete investigations for rewards</li>
            </ul>
          </p>
        </div>
      </div>
    </div>
  )
}

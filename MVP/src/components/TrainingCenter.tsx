/**
 * Training Center Component
 *
 * UI for education/training enrollment and progress tracking.
 * Wired to educationSystem.ts for degree programs, institutions, and learning.
 */

import React, { useState, useMemo } from 'react'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  FIELDS_OF_STUDY,
  INSTITUTIONS,
  DEGREE_LEVEL_DATA,
  FieldOfStudy,
  Institution,
  EducationTrack,
  DegreeLevel,
  getFieldsByCategory,
  getInstitutionsForField,
  calculateDegreeCost,
  calculateDegreeTime,
  formatDegreeLevel,
} from '../data/educationSystem'

// ============================================================================
// TYPES
// ============================================================================

interface TrainingEnrollment {
  characterId: string
  characterName: string
  fieldId: string
  institutionId: string
  level: DegreeLevel
  progress: number
  startDay: number
  weeksRemaining: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TrainingCenter: React.FC = () => {
  const characters = useGameStore((state) => state.characters)
  const money = useGameStore((state) => state.money)
  const gameTime = useGameStore((state) => state.gameTime)

  // Local state
  const [selectedTrack, setSelectedTrack] = useState<EducationTrack | 'all'>('all')
  const [selectedField, setSelectedField] = useState<FieldOfStudy | null>(null)
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<DegreeLevel>('basic')
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([])

  // Filter fields by track
  const filteredFields = useMemo(() => {
    if (selectedTrack === 'all') return FIELDS_OF_STUDY
    return FIELDS_OF_STUDY.filter((field) => {
      if (selectedTrack === 'academic') {
        return ['life_sciences', 'social_intel', 'super_science'].includes(field.category)
      }
      if (selectedTrack === 'vocational') {
        return ['technical_engineering'].includes(field.category)
      }
      if (selectedTrack === 'military') {
        return ['combat_sciences'].includes(field.category)
      }
      return true
    })
  }, [selectedTrack])

  // Available institutions for selected field
  const availableInstitutions = useMemo(() => {
    if (!selectedField) return INSTITUTIONS
    return getInstitutionsForField(selectedField.id)
  }, [selectedField])

  // Available characters (not in training)
  const availableCharacters = useMemo(() => {
    const enrolledIds = new Set(enrollments.map((e) => e.characterId))
    return characters.filter(
      (c) => c.status === 'ready' && !enrolledIds.has(c.id)
    )
  }, [characters, enrollments])

  // Calculate cost and time for current selection
  const estimatedCost = useMemo(() => {
    if (!selectedField || !selectedInstitution) return 0
    const baseCost = DEGREE_LEVEL_DATA[selectedLevel].baseWeeks * 1000
    return calculateDegreeCost(baseCost, selectedInstitution)
  }, [selectedField, selectedInstitution, selectedLevel])

  const estimatedWeeks = useMemo(() => {
    if (!selectedField || !selectedInstitution) return 0
    const baseWeeks = DEGREE_LEVEL_DATA[selectedLevel].baseWeeks
    // Use average stat values for estimate
    const avgStat = 50
    const optimalStat = selectedField.optimalStatValue
    return Math.ceil(calculateDegreeTime(baseWeeks, selectedInstitution, avgStat, optimalStat))
  }, [selectedField, selectedInstitution, selectedLevel])

  // Enroll character
  const handleEnroll = () => {
    if (!selectedField || !selectedInstitution || !selectedCharacter) return
    if (money < estimatedCost) return

    const character = characters.find((c) => c.id === selectedCharacter)
    if (!character) return

    const newEnrollment: TrainingEnrollment = {
      characterId: selectedCharacter,
      characterName: character.name,
      fieldId: selectedField.id,
      institutionId: selectedInstitution.id,
      level: selectedLevel,
      progress: 0,
      startDay: gameTime?.day || 0,
      weeksRemaining: estimatedWeeks,
    }

    setEnrollments((prev) => [...prev, newEnrollment])
    setSelectedCharacter(null)

    // Deduct cost (would wire to store in full implementation)
    useGameStore.getState().addMoney(-estimatedCost)
  }

  // Get level options based on track
  const levelOptions = useMemo(() => {
    if (selectedTrack === 'military') {
      return ['basic', 'advanced', 'specialist', 'elite', 'command'] as DegreeLevel[]
    }
    if (selectedTrack === 'vocational') {
      return ['certificate', 'diploma', 'trade_license', 'master_craftsman'] as DegreeLevel[]
    }
    return ['associate', 'bachelor', 'master', 'doctorate', 'postdoc'] as DegreeLevel[]
  }, [selectedTrack])

  return (
    <div className="bg-gray-900 text-white p-6 min-h-full">
      <h1 className="text-2xl font-bold mb-6 text-cyan-400">Training Center</h1>

      {/* Current Enrollments */}
      {enrollments.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 text-yellow-400">
            Active Training ({enrollments.length})
          </h2>
          <div className="space-y-2">
            {enrollments.map((enrollment) => {
              const field = FIELDS_OF_STUDY.find((f) => f.id === enrollment.fieldId)
              const institution = INSTITUTIONS.find((i) => i.id === enrollment.institutionId)
              return (
                <div
                  key={enrollment.characterId}
                  className="bg-gray-700 rounded p-3 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium text-cyan-300">
                      {enrollment.characterName}
                    </span>
                    <span className="text-gray-400 mx-2">→</span>
                    <span className="text-white">{field?.name || 'Unknown'}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      @ {institution?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {formatDegreeLevel(enrollment.level)}
                    </div>
                    <div className="text-xs text-yellow-500">
                      {enrollment.weeksRemaining} weeks remaining
                    </div>
                    <div className="w-32 h-2 bg-gray-600 rounded mt-1">
                      <div
                        className="h-full bg-cyan-500 rounded"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Enrollment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Field Selection */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Select Training Program</h2>

          {/* Track Filter */}
          <div className="flex gap-2 mb-4">
            {(['all', 'military', 'vocational', 'academic'] as const).map((track) => (
              <button
                key={track}
                onClick={() => {
                  setSelectedTrack(track)
                  setSelectedField(null)
                  setSelectedLevel(
                    track === 'military' ? 'basic' :
                    track === 'vocational' ? 'certificate' : 'associate'
                  )
                }}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  selectedTrack === track
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {track}
              </button>
            ))}
          </div>

          {/* Field List */}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredFields.map((field) => (
              <button
                key={field.id}
                onClick={() => {
                  setSelectedField(field)
                  setSelectedInstitution(null)
                }}
                className={`w-full text-left px-3 py-2 rounded ${
                  selectedField?.id === field.id
                    ? 'bg-cyan-700 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">{field.name}</div>
                <div className="text-xs text-gray-400">
                  {field.category.replace(/_/g, ' ')} • {field.primaryStat}
                  {field.isRestricted && (
                    <span className="ml-2 text-red-400">[RESTRICTED]</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Field Description */}
          {selectedField && (
            <div className="mt-4 p-3 bg-gray-700 rounded">
              <h3 className="font-medium text-cyan-300">{selectedField.name}</h3>
              <p className="text-sm text-gray-300 mt-1">{selectedField.description}</p>
              <div className="text-xs text-gray-400 mt-2">
                Primary Stat: {selectedField.primaryStat} (min {selectedField.minStatValue})
                {selectedField.secondaryStat && ` • Secondary: ${selectedField.secondaryStat}`}
              </div>
              {selectedField.specializations.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Specializations:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedField.specializations.map((spec) => (
                      <span
                        key={spec.id}
                        className="text-xs bg-gray-600 px-2 py-0.5 rounded"
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Institution & Enrollment */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Institution & Enrollment</h2>

          {/* Institution Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Institution</label>
            <select
              value={selectedInstitution?.id || ''}
              onChange={(e) => {
                const inst = INSTITUTIONS.find((i) => i.id === e.target.value)
                setSelectedInstitution(inst || null)
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="">Select an institution...</option>
              {availableInstitutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} (Tier {inst.tier}) - {inst.country}
                </option>
              ))}
            </select>
          </div>

          {/* Institution Details */}
          {selectedInstitution && (
            <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
              <div className="flex justify-between">
                <span className="text-cyan-300">{selectedInstitution.name}</span>
                <span className="text-yellow-400">Tier {selectedInstitution.tier}</span>
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {selectedInstitution.city}, {selectedInstitution.country}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>
                  <span className="text-gray-500">Time:</span>{' '}
                  <span className={selectedInstitution.timeModifier < 1 ? 'text-green-400' : 'text-red-400'}>
                    {(selectedInstitution.timeModifier * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Cost:</span>{' '}
                  <span className={selectedInstitution.costModifier > 1 ? 'text-red-400' : 'text-green-400'}>
                    {(selectedInstitution.costModifier * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Quality:</span>{' '}
                  <span className="text-cyan-400">
                    {(selectedInstitution.qualityModifier * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              {selectedInstitution.uniqueBenefits && (
                <div className="mt-2 text-xs text-green-400">
                  {selectedInstitution.uniqueBenefits.join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* Level Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Degree Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as DegreeLevel)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {formatDegreeLevel(level)} ({DEGREE_LEVEL_DATA[level].baseWeeks} weeks base)
                </option>
              ))}
            </select>
          </div>

          {/* Character Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Character to Enroll</label>
            <select
              value={selectedCharacter || ''}
              onChange={(e) => setSelectedCharacter(e.target.value || null)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="">Select a character...</option>
              {availableCharacters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} - {char.status}
                </option>
              ))}
            </select>
          </div>

          {/* Cost & Time Summary */}
          {selectedField && selectedInstitution && (
            <div className="mb-4 p-3 bg-gray-700 rounded">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated Cost:</span>
                <span className={money >= estimatedCost ? 'text-green-400' : 'text-red-400'}>
                  ${estimatedCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Duration:</span>
                <span className="text-cyan-400">{estimatedWeeks} weeks</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Your Funds:</span>
                <span className="text-yellow-400">${money.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Enroll Button */}
          <button
            onClick={handleEnroll}
            disabled={
              !selectedField ||
              !selectedInstitution ||
              !selectedCharacter ||
              money < estimatedCost
            }
            className={`w-full py-3 rounded font-semibold ${
              selectedField && selectedInstitution && selectedCharacter && money >= estimatedCost
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {money < estimatedCost
              ? 'Insufficient Funds'
              : !selectedCharacter
              ? 'Select Character'
              : 'Enroll in Training'}
          </button>
        </div>
      </div>

      {/* Stats Reference */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-400">Stat Requirements Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {['STR', 'AGL', 'INT', 'INS', 'CON', 'STA', 'WIL'].map((stat) => (
            <div key={stat} className="bg-gray-700 rounded p-2 text-center">
              <div className="font-bold text-cyan-300">{stat}</div>
              <div className="text-gray-400 text-[10px] mt-1">
                {stat === 'STR' && 'Melee Damage'}
                {stat === 'AGL' && 'Dodge/Init'}
                {stat === 'INT' && 'Accuracy/Learn'}
                {stat === 'INS' && 'Perception'}
                {stat === 'CON' && 'Health'}
                {stat === 'STA' && 'AP Pool'}
                {stat === 'WIL' && 'Morale'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrainingCenter

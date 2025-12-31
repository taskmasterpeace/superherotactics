/**
 * Base Manager Component
 *
 * UI for base building and facility management.
 * Features:
 * - Base purchase/selection
 * - Grid-based facility placement
 * - Power/security/upkeep tracking
 * - Construction progress
 */

import React, { useState, useMemo } from 'react'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  BASE_TYPES,
  FACILITIES,
  BaseType,
  FacilityType,
  PlayerBase,
  Facility,
  getActiveBase,
  calculatePowerUsage,
  calculatePowerCapacity,
  calculateSecurity,
  calculateMonthlyUpkeep,
  getEducationBonus,
  getHealingBonus,
  getInvestigationBonus,
  getCraftingBonus,
  getTeamCapacityBonus,
  getVehicleSlots,
} from '../data/baseSystem'

// ============================================================================
// COMPONENT
// ============================================================================

export const BaseManager: React.FC = () => {
  const money = useGameStore((state) => state.money)
  const baseState = useGameStore((state) => state.baseState)
  const purchaseBase = useGameStore((state) => state.purchaseBase)
  const buildFacility = useGameStore((state) => state.buildFacility)
  const upgradeFacilityAt = useGameStore((state) => state.upgradeFacilityAt)
  const removeFacilityAt = useGameStore((state) => state.removeFacilityAt)

  // Local state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null)
  const [newBaseName, setNewBaseName] = useState('')
  const [selectedBaseType, setSelectedBaseType] = useState<BaseType>('warehouse')

  // Get active base
  const activeBase = useMemo(() => {
    return getActiveBase(baseState)
  }, [baseState])

  // Calculate stats for active base
  const baseStats = useMemo(() => {
    if (!activeBase) return null
    return {
      powerUsed: calculatePowerUsage(activeBase),
      powerCapacity: calculatePowerCapacity(activeBase),
      security: calculateSecurity(activeBase),
      upkeep: calculateMonthlyUpkeep(activeBase),
      educationBonus: getEducationBonus(activeBase, 'general'),
      healingBonus: getHealingBonus(activeBase),
      investigationBonus: getInvestigationBonus(activeBase),
      craftingBonus: getCraftingBonus(activeBase),
      teamCapacity: getTeamCapacityBonus(activeBase),
      vehicleSlots: getVehicleSlots(activeBase),
    }
  }, [activeBase])

  // Handle base purchase
  const handlePurchaseBase = () => {
    if (!newBaseName.trim()) return
    purchaseBase(selectedBaseType, newBaseName, 'B3', 'US') // Default sector
    setShowPurchaseModal(false)
    setNewBaseName('')
  }

  // Handle facility build
  const handleBuildFacility = () => {
    if (!selectedFacilityType || !selectedCell) return
    buildFacility(selectedFacilityType, selectedCell.x, selectedCell.y)
    setSelectedFacilityType(null)
    setSelectedCell(null)
  }

  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    if (!activeBase) return
    const facility = activeBase.grid[y]?.[x]

    if (facility) {
      // Cell has a facility - show upgrade/remove options
      setSelectedCell({ x, y })
      setSelectedFacilityType(null)
    } else {
      // Empty cell - ready for building
      setSelectedCell({ x, y })
    }
  }

  // Facility types by category
  const facilityCategories = useMemo(() => {
    return {
      'Education': ['training_room', 'library', 'simulator'] as FacilityType[],
      'Medical': ['medical_bay', 'pharmacy'] as FacilityType[],
      'Crafting': ['engineering_lab', 'armory'] as FacilityType[],
      'Operations': ['intel_center', 'communications', 'garage'] as FacilityType[],
      'Support': ['living_quarters', 'power_generator', 'security_system'] as FacilityType[],
    }
  }, [])

  return (
    <div className="bg-gray-900 text-white p-6 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">Base Management</h1>
        <div className="flex gap-4 items-center">
          <span className="text-yellow-400">${money.toLocaleString()}</span>
          {baseState.bases.length < baseState.maxBases && (
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-semibold"
            >
              Purchase New Base
            </button>
          )}
        </div>
      </div>

      {/* No Bases State */}
      {baseState.bases.length === 0 && (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-xl text-gray-400 mb-4">No bases established</p>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-semibold text-lg"
          >
            Purchase Your First Base
          </button>
        </div>
      )}

      {/* Active Base View */}
      {activeBase && baseStats && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Base Grid */}
          <div className="xl:col-span-2 bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-cyan-300">{activeBase.name}</h2>
                <p className="text-sm text-gray-400">
                  {BASE_TYPES[activeBase.type].name} • {activeBase.location}
                </p>
              </div>
              <div className="text-right text-sm">
                <div className={baseStats.powerUsed > baseStats.powerCapacity ? 'text-red-400' : 'text-green-400'}>
                  Power: {baseStats.powerUsed}/{baseStats.powerCapacity}
                </div>
                <div className="text-yellow-400">Security: {baseStats.security}%</div>
              </div>
            </div>

            {/* Base Grid */}
            <div
              className="grid gap-2 mb-4"
              style={{
                gridTemplateColumns: `repeat(${activeBase.gridWidth}, 1fr)`,
              }}
            >
              {Array.from({ length: activeBase.gridHeight }).map((_, y) =>
                Array.from({ length: activeBase.gridWidth }).map((_, x) => {
                  const facility = activeBase.grid[y]?.[x]
                  const isSelected = selectedCell?.x === x && selectedCell?.y === y
                  const config = facility ? FACILITIES[facility.type] : null

                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => handleCellClick(x, y)}
                      className={`
                        aspect-square rounded-lg border-2 flex flex-col items-center justify-center
                        transition-all hover:scale-105
                        ${isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-gray-600'}
                        ${facility
                          ? 'bg-gray-700'
                          : 'bg-gray-800 hover:bg-gray-700 border-dashed'
                        }
                      `}
                    >
                      {facility ? (
                        <>
                          <span className="text-2xl">{config?.icon || '?'}</span>
                          <span className="text-xs text-gray-300 mt-1">{config?.name || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">Lv.{facility.level}</span>
                        </>
                      ) : (
                        <span className="text-gray-600 text-2xl">+</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Selected Cell Actions */}
            {selectedCell && (
              <div className="bg-gray-700 rounded p-4">
                {activeBase.grid[selectedCell.y]?.[selectedCell.x] ? (
                  // Existing facility actions
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">
                        {FACILITIES[activeBase.grid[selectedCell.y][selectedCell.x]!.type].name}
                        {' '}(Level {activeBase.grid[selectedCell.y][selectedCell.x]!.level})
                      </span>
                      <button
                        onClick={() => setSelectedCell(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          upgradeFacilityAt(selectedCell.x, selectedCell.y)
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
                      >
                        Upgrade
                      </button>
                      <button
                        onClick={() => {
                          removeFacilityAt(selectedCell.x, selectedCell.y)
                          setSelectedCell(null)
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  // Empty cell - build options
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Build Facility at ({selectedCell.x}, {selectedCell.y})</span>
                      <button
                        onClick={() => setSelectedCell(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    {selectedFacilityType ? (
                      <div>
                        <div className="mb-3 p-2 bg-gray-600 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{FACILITIES[selectedFacilityType].icon}</span>
                            <span className="font-medium">{FACILITIES[selectedFacilityType].name}</span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            {FACILITIES[selectedFacilityType].description}
                          </p>
                          <div className="text-sm text-gray-400 mt-2">
                            Cost: ${FACILITIES[selectedFacilityType].buildCost[0].toLocaleString()}
                            {' • '}Power: {FACILITIES[selectedFacilityType].powerRequired[0]}
                          </div>
                        </div>
                        <button
                          onClick={handleBuildFacility}
                          disabled={money < FACILITIES[selectedFacilityType].buildCost[0]}
                          className={`w-full py-2 rounded font-semibold ${
                            money >= FACILITIES[selectedFacilityType].buildCost[0]
                              ? 'bg-cyan-600 hover:bg-cyan-500'
                              : 'bg-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Build Facility
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {Object.entries(facilityCategories).map(([category, types]) => (
                          <div key={category}>
                            <div className="text-xs text-gray-500 mb-1">{category}</div>
                            <div className="flex flex-wrap gap-1">
                              {types.map((type) => (
                                <button
                                  key={type}
                                  onClick={() => setSelectedFacilityType(type)}
                                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm flex items-center gap-1"
                                >
                                  <span>{FACILITIES[type].icon}</span>
                                  <span>{FACILITIES[type].name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Stats Panel */}
          <div className="space-y-4">
            {/* Base Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-300 mb-3">Base Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Upkeep:</span>
                  <span className="text-red-400">${baseStats.upkeep.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Power:</span>
                  <span className={baseStats.powerUsed > baseStats.powerCapacity ? 'text-red-400' : 'text-green-400'}>
                    {baseStats.powerUsed} / {baseStats.powerCapacity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Security:</span>
                  <span className="text-cyan-400">{baseStats.security}%</span>
                </div>
              </div>
            </div>

            {/* Bonuses */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-300 mb-3">Active Bonuses</h3>
              <div className="space-y-2 text-sm">
                {baseStats.educationBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Education:</span>
                    <span className="text-green-400">+{baseStats.educationBonus}%</span>
                  </div>
                )}
                {baseStats.healingBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Healing:</span>
                    <span className="text-green-400">+{baseStats.healingBonus}%</span>
                  </div>
                )}
                {baseStats.investigationBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Investigation:</span>
                    <span className="text-green-400">+{baseStats.investigationBonus}%</span>
                  </div>
                )}
                {baseStats.craftingBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Crafting:</span>
                    <span className="text-green-400">+{baseStats.craftingBonus}%</span>
                  </div>
                )}
                {baseStats.teamCapacity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team Capacity:</span>
                    <span className="text-cyan-400">+{baseStats.teamCapacity}</span>
                  </div>
                )}
                {baseStats.vehicleSlots > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vehicle Slots:</span>
                    <span className="text-cyan-400">{baseStats.vehicleSlots}</span>
                  </div>
                )}
                {baseStats.educationBonus === 0 && baseStats.healingBonus === 0 &&
                 baseStats.investigationBonus === 0 && baseStats.craftingBonus === 0 && (
                  <p className="text-gray-500 italic">No bonuses - build facilities!</p>
                )}
              </div>
            </div>

            {/* Base List */}
            {baseState.bases.length > 1 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-300 mb-3">Your Bases</h3>
                <div className="space-y-2">
                  {baseState.bases.map((base) => (
                    <button
                      key={base.id}
                      className={`w-full text-left p-2 rounded ${
                        base.id === activeBase?.id
                          ? 'bg-cyan-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">{base.name}</div>
                      <div className="text-xs text-gray-400">
                        {BASE_TYPES[base.type].name} • {base.location}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Purchase New Base</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Base Name Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Base Name</label>
              <input
                type="text"
                value={newBaseName}
                onChange={(e) => setNewBaseName(e.target.value)}
                placeholder="Enter base name..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            {/* Base Type Selection */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Base Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(BASE_TYPES) as [BaseType, typeof BASE_TYPES[BaseType]][]).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedBaseType(type)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      selectedBaseType === type
                        ? 'border-cyan-400 bg-gray-700'
                        : 'border-gray-600 bg-gray-750 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{config.name}</div>
                        <div className="text-sm text-gray-400">{config.gridWidth}x{config.gridHeight} ({config.totalSlots} slots)</div>
                      </div>
                      <div className={`text-right ${money >= config.purchaseCost ? 'text-green-400' : 'text-red-400'}`}>
                        ${config.purchaseCost.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{config.description}</p>
                    <div className="mt-2 flex gap-4 text-xs">
                      <span className="text-cyan-400">Security: {config.baseSecurity}%</span>
                      <span className="text-yellow-400">Power: {config.basePower}</span>
                      <span className="text-red-400">Upkeep: ${config.monthlyUpkeep}/mo</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseBase}
                disabled={!newBaseName.trim() || money < BASE_TYPES[selectedBaseType].purchaseCost}
                className={`px-6 py-2 rounded font-semibold ${
                  newBaseName.trim() && money >= BASE_TYPES[selectedBaseType].purchaseCost
                    ? 'bg-cyan-600 hover:bg-cyan-500'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Purchase (${BASE_TYPES[selectedBaseType].purchaseCost.toLocaleString()})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BaseManager

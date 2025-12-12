/**
 * Encyclopedia - Comprehensive equipment browser
 *
 * Features:
 * - Full searchable table of all equipment
 * - Filter by type, category, availability, cost
 * - Sort by any column
 * - Detail panel for selected item
 * - Balance metrics display
 */

import React, { useState, useMemo } from 'react';
import {
  getAllEquipmentEntries,
  EquipmentEntry,
  getEquipmentStats,
  EQUIPMENT_COUNTS,
  Weapon,
  Armor,
  Gadget,
  Vehicle,
  Drone,
  calculateDPS,
  calculateEffectiveProtection,
  calculateWeaponBalance,
  COST_VALUES,
} from '../data';

type SortField =
  | 'name'
  | 'type'
  | 'category'
  | 'costValue'
  | 'availability';
type SortDirection = 'asc' | 'desc';

interface EncyclopediaProps {
  onSelectEquipment?: (entry: EquipmentEntry) => void;
  showBalanceMetrics?: boolean;
}

export const Encyclopedia: React.FC<EncyclopediaProps> = ({
  onSelectEquipment,
  showBalanceMetrics = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [maxCost, setMaxCost] = useState<number>(100000);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedEntry, setSelectedEntry] = useState<EquipmentEntry | null>(
    null
  );
  const [showStats, setShowStats] = useState(false);

  // Get all equipment entries
  const allEntries = useMemo(() => getAllEquipmentEntries(), []);

  // Get unique availabilities for filter
  const availabilities = useMemo(() => {
    const set = new Set(allEntries.map((e) => e.availability));
    return Array.from(set).sort();
  }, [allEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          (e.description && e.description.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      entries = entries.filter((e) => e.type === typeFilter);
    }

    // Availability filter
    if (availabilityFilter !== 'all') {
      entries = entries.filter((e) => e.availability === availabilityFilter);
    }

    // Cost filter
    entries = entries.filter((e) => e.costValue <= maxCost);

    // Sort
    entries.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return entries;
  }, [
    allEntries,
    searchQuery,
    typeFilter,
    availabilityFilter,
    maxCost,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelect = (entry: EquipmentEntry) => {
    setSelectedEntry(entry);
    if (onSelectEquipment) {
      onSelectEquipment(entry);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const formatCost = (value: number) => {
    if (value === 0) return 'Free';
    if (value >= 10000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weapon':
        return 'text-red-400';
      case 'armor':
        return 'text-blue-400';
      case 'gadget':
        return 'text-green-400';
      case 'vehicle':
        return 'text-yellow-400';
      case 'drone':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const stats = useMemo(() => getEquipmentStats(), []);

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Main content */}
      <div className="flex-1 flex flex-col">{/* Removed overflow-hidden to enable scrolling */}
        {/* Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Equipment Encyclopedia</h2>
            <div className="text-sm text-gray-400">
              {EQUIPMENT_COUNTS.total} items total
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="weapon">Weapons ({EQUIPMENT_COUNTS.weapons})</option>
              <option value="armor">Armor ({EQUIPMENT_COUNTS.armor})</option>
              <option value="gadget">Gadgets ({EQUIPMENT_COUNTS.gadgets})</option>
              <option value="vehicle">Vehicles ({EQUIPMENT_COUNTS.vehicles})</option>
              <option value="drone">Drones ({EQUIPMENT_COUNTS.drones})</option>
            </select>

            {/* Availability filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Availability</option>
              {availabilities.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            {/* Cost filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Max:</span>
              <select
                value={maxCost}
                onChange={(e) => setMaxCost(Number(e.target.value))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value={100}>$100</option>
                <option value={500}>$500</option>
                <option value={2000}>$2,000</option>
                <option value={10000}>$10,000</option>
                <option value={50000}>$50,000</option>
                <option value={100000}>Any</option>
              </select>
            </div>

            {/* Stats toggle */}
            {showBalanceMetrics && (
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-3 py-2 rounded ${showStats
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                  }`}
              >
                Stats
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredEntries.length} of {allEntries.length} items
          </div>
        </div>

        {/* Stats panel */}
        {showStats && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h3 className="text-lg font-bold mb-2">Balance Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Weapon DPS Range</div>
                <div>
                  {stats.weaponDPSRange.min.toFixed(1)} -{' '}
                  {stats.weaponDPSRange.max.toFixed(1)}
                </div>
                <div className="text-gray-500">
                  Avg: {stats.weaponDPSRange.avg.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Armor DR Range</div>
                <div>
                  {stats.armorDRRange.min.toFixed(1)} -{' '}
                  {stats.armorDRRange.max.toFixed(1)}
                </div>
                <div className="text-gray-500">
                  Avg: {stats.armorDRRange.avg.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Average Cost</div>
                <div>{formatCost(stats.averageCost)}</div>
              </div>
              <div>
                <div className="text-gray-400">By Availability</div>
                <div className="text-xs">
                  Common: {stats.byAvailability['Common'] || 0} | Military:{' '}
                  {stats.byAvailability['Military'] || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                <th className="p-2 text-left w-10"></th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('name')}
                >
                  Name{renderSortIndicator('name')}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('type')}
                >
                  Type{renderSortIndicator('type')}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('category')}
                >
                  Category{renderSortIndicator('category')}
                </th>
                <th
                  className="p-2 text-right cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('costValue')}
                >
                  Cost{renderSortIndicator('costValue')}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('availability')}
                >
                  Availability{renderSortIndicator('availability')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => handleSelect(entry)}
                  className={`cursor-pointer hover:bg-gray-700 border-b border-gray-800 ${selectedEntry?.id === entry.id ? 'bg-gray-700' : ''
                    }`}
                >
                  <td className="p-2 text-center text-xl">{entry.emoji}</td>
                  <td className="p-2 font-medium">{entry.name}</td>
                  <td className={`p-2 ${getTypeColor(entry.type)}`}>
                    {entry.type}
                  </td>
                  <td className="p-2 text-gray-400">
                    {entry.category.replace(/_/g, ' ')}
                  </td>
                  <td className="p-2 text-right text-yellow-400">
                    {formatCost(entry.costValue)}
                  </td>
                  <td className="p-2 text-gray-400">
                    {entry.availability.replace(/_/g, ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selectedEntry && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <DetailPanel entry={selectedEntry} />
        </div>
      )}
    </div>
  );
};

interface DetailPanelProps {
  entry: EquipmentEntry;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ entry }) => {
  const renderWeaponDetails = (weapon: Weapon) => {
    const dps = calculateDPS(weapon);
    const balance = calculateWeaponBalance(weapon);

    return (
      <>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Damage</div>
            <div className="text-red-400">{weapon.baseDamage}</div>
          </div>
          <div>
            <div className="text-gray-400">DPS</div>
            <div className="text-orange-400">{dps.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-gray-400">Range</div>
            <div>{weapon.range} sq</div>
          </div>
          <div>
            <div className="text-gray-400">Speed</div>
            <div>{weapon.attackSpeed}s</div>
          </div>
          <div>
            <div className="text-gray-400">Accuracy</div>
            <div>
              {weapon.accuracyCS >= 0 ? '+' : ''}
              {weapon.accuracyCS}CS
            </div>
          </div>
          <div>
            <div className="text-gray-400">Penetration</div>
            <div>{weapon.penetrationMult}x</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-gray-400 text-sm mb-1">Damage Type</div>
          <div className="flex gap-1">
            <span className="px-2 py-1 bg-gray-700 rounded text-xs">
              {weapon.damageType}
            </span>
            <span className="px-2 py-1 bg-gray-700 rounded text-xs">
              {weapon.damageSubType.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {weapon.magazineSize && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Magazine</div>
            <div>
              {weapon.magazineSize} rounds | {weapon.reloadTime}s reload
            </div>
          </div>
        )}

        {weapon.skillRequired !== 'None' && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Skill Required</div>
            <div>{weapon.skillRequired.replace(/_/g, ' ')}</div>
          </div>
        )}

        {weapon.strRequired > 0 && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">STR Required</div>
            <div>{weapon.strRequired}</div>
          </div>
        )}

        {weapon.specialEffects.length > 0 && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Special Effects</div>
            <ul className="list-disc list-inside text-sm">
              {weapon.specialEffects.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Balance Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-500">TTK (100 HP)</div>
              <div>{balance.ttk.toFixed(1)}s</div>
            </div>
            <div>
              <div className="text-gray-500">Cost Efficiency</div>
              <div>{balance.costEfficiency.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">Availability Score</div>
              <div>{balance.availabilityScore}/10</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderArmorDetails = (armor: Armor) => {
    const protection = calculateEffectiveProtection(armor);

    return (
      <>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Physical</div>
            <div className="text-blue-400">{armor.drPhysical} DR</div>
          </div>
          <div>
            <div className="text-gray-400">Energy</div>
            <div className="text-yellow-400">{armor.drEnergy} DR</div>
          </div>
          <div>
            <div className="text-gray-400">Mental</div>
            <div className="text-purple-400">{armor.drMental} DR</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Effective Protection</div>
            <div className="text-green-400">{protection.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-gray-400">Coverage</div>
            <div>{armor.coverage.replace(/_/g, ' ')}</div>
          </div>
          <div>
            <div className="text-gray-400">Condition</div>
            <div>
              {armor.conditionMax === Infinity ? 'Infinite' : armor.conditionMax}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Weight</div>
            <div>{armor.weight} lbs</div>
          </div>
        </div>

        {(armor.movementPenalty !== 0 || armor.stealthPenalty !== 0) && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Penalties</div>
            <div className="text-sm text-red-400">
              {armor.movementPenalty !== 0 &&
                `Movement: ${armor.movementPenalty} sq`}
              {armor.movementPenalty !== 0 && armor.stealthPenalty !== 0 && ' | '}
              {armor.stealthPenalty !== 0 && `Stealth: ${armor.stealthPenalty}CS`}
            </div>
          </div>
        )}

        {armor.strRequired > 0 && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">STR Required</div>
            <div>{armor.strRequired}</div>
          </div>
        )}

        {armor.specialProperties.length > 0 && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Special Properties</div>
            <ul className="list-disc list-inside text-sm">
              {armor.specialProperties.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  const renderGadgetDetails = (gadget: Gadget) => {
    return (
      <>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Operation</div>
            <div className="capitalize">{gadget.operationType}</div>
          </div>
          <div>
            <div className="text-gray-400">AP Cost</div>
            <div>{gadget.apCost}</div>
          </div>
          {gadget.cooldownTurns > 0 && (
            <div>
              <div className="text-gray-400">Cooldown</div>
              <div>{gadget.cooldownTurns} turns</div>
            </div>
          )}
          {gadget.range && (
            <div>
              <div className="text-gray-400">Range</div>
              <div>{gadget.range} ft</div>
            </div>
          )}
          {gadget.duration && (
            <div>
              <div className="text-gray-400">Duration</div>
              <div>{gadget.duration} hrs</div>
            </div>
          )}
          {gadget.uses && (
            <div>
              <div className="text-gray-400">Uses</div>
              <div>{gadget.uses}</div>
            </div>
          )}
        </div>

        {gadget.modes && gadget.modes.length > 0 && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Modes</div>
            <div className="flex flex-wrap gap-1">
              {gadget.modes.map((m, i) => (
                <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {gadget.skillRequired !== 'None' && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Skill Required</div>
            <div>{gadget.skillRequired.replace(/_/g, ' ')}</div>
          </div>
        )}

        {gadget.combatEffect && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Combat Effect</div>
            <div className="text-sm">{gadget.combatEffect}</div>
          </div>
        )}
      </>
    );
  };

  const renderVehicleDetails = (vehicle: Vehicle) => {
    return (
      <>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Speed</div>
            <div>{vehicle.speedMPH} mph</div>
          </div>
          <div>
            <div className="text-gray-400">Movement</div>
            <div>{vehicle.speedSquaresPerTurn} sq/turn</div>
          </div>
          <div>
            <div className="text-gray-400">Passengers</div>
            <div>{vehicle.passengers}</div>
          </div>
          <div>
            <div className="text-gray-400">Cargo</div>
            <div>{vehicle.cargoLbs} lbs</div>
          </div>
          <div>
            <div className="text-gray-400">Armor HP</div>
            <div>{vehicle.armorHP}</div>
          </div>
          <div>
            <div className="text-gray-400">Armor DR</div>
            <div>{vehicle.armorDR}</div>
          </div>
          <div>
            <div className="text-gray-400">Range</div>
            <div>{vehicle.rangeMiles} mi</div>
          </div>
          <div>
            <div className="text-gray-400">Fuel</div>
            <div>{vehicle.fuelType.replace(/_/g, ' ')}</div>
          </div>
        </div>

        {vehicle.altitudeMax && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Max Altitude</div>
            <div>{vehicle.altitudeMax.toLocaleString()} ft</div>
          </div>
        )}

        {vehicle.pilotSkill !== 'None' && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Pilot Skill</div>
            <div>{vehicle.pilotSkill.replace(/_/g, ' ')}</div>
          </div>
        )}

        {vehicle.specialProperties.length > 0 && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Special Properties</div>
            <ul className="list-disc list-inside text-sm">
              {vehicle.specialProperties.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  const renderDroneDetails = (drone: Drone) => {
    return (
      <>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Speed</div>
            <div>{drone.speedMPH} mph</div>
          </div>
          <div>
            <div className="text-gray-400">Control Range</div>
            <div>{drone.controlRangeFt} ft</div>
          </div>
          <div>
            <div className="text-gray-400">Flight Time</div>
            <div>{drone.flightTimeMin} min</div>
          </div>
          <div>
            <div className="text-gray-400">Payload</div>
            <div>{drone.payloadLbs} lbs</div>
          </div>
          <div>
            <div className="text-gray-400">Armor HP</div>
            <div>{drone.armorHP}</div>
          </div>
          <div>
            <div className="text-gray-400">AP Cost</div>
            <div>{drone.apCost}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-gray-400 text-sm mb-1">Sensors</div>
          <div>{drone.sensors.replace(/_/g, ' ')}</div>
        </div>

        {drone.weapons && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-1">Weapons</div>
            <div>{drone.weapons.replace(/_/g, ' ')}</div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-gray-400 text-sm mb-1">Modes</div>
          <div className="flex flex-wrap gap-1">
            {drone.modes.map((m, i) => (
              <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs">
                {m}
              </span>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{entry.emoji}</span>
        <div>
          <h3 className="text-xl font-bold">{entry.name}</h3>
          <div className="text-sm text-gray-400">
            {entry.type.toUpperCase()} - {entry.category.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Description */}
      {entry.description && (
        <p className="text-sm text-gray-300 mb-4">{entry.description}</p>
      )}

      {/* Cost and Availability */}
      <div className="flex justify-between mb-4 p-2 bg-gray-700 rounded">
        <div>
          <div className="text-gray-400 text-xs">Cost</div>
          <div className="text-yellow-400 font-bold">
            ${entry.costValue.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-xs">Availability</div>
          <div>{entry.availability.replace(/_/g, ' ')}</div>
        </div>
      </div>

      {/* Type-specific details */}
      {entry.type === 'weapon' && renderWeaponDetails(entry.data as Weapon)}
      {entry.type === 'armor' && renderArmorDetails(entry.data as Armor)}
      {entry.type === 'gadget' && renderGadgetDetails(entry.data as Gadget)}
      {entry.type === 'vehicle' && renderVehicleDetails(entry.data as Vehicle)}
      {entry.type === 'drone' && renderDroneDetails(entry.data as Drone)}

      {/* Notes */}
      {(entry.data as any).notes && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Notes</div>
          <div className="text-sm italic text-gray-300">
            {(entry.data as any).notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default Encyclopedia;

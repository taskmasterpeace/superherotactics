/**
 * BalanceAnalyzer - Equipment balance testing and analysis
 *
 * Features:
 * - Weapon DPS comparison charts
 * - Armor protection efficiency
 * - Cost/value analysis
 * - Time-to-kill simulations
 * - Recommendations for balance adjustments
 */

import React, { useMemo, useState } from 'react';
import {
  ALL_WEAPONS,
  ALL_ARMOR,
  ALL_GADGETS,
  ALL_VEHICLES,
  DRONES,
  Weapon,
  Armor,
  calculateDPS,
  calculateWeaponBalance,
  calculateEffectiveProtection,
  calculateArmorEfficiency,
  getEquipmentStats,
} from '../data';

interface BalanceIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  item: string;
  issue: string;
  recommendation: string;
}

export const BalanceAnalyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'weapons' | 'armor' | 'issues'
  >('overview');

  const stats = useMemo(() => getEquipmentStats(), []);

  // Calculate balance issues
  const balanceIssues = useMemo(() => {
    const issues: BalanceIssue[] = [];

    // Check weapons
    ALL_WEAPONS.forEach((w) => {
      const dps = calculateDPS(w);
      const balance = calculateWeaponBalance(w);

      // Check for extremely high DPS
      if (dps > 50) {
        issues.push({
          severity: 'high',
          item: w.name,
          issue: `Very high DPS (${dps.toFixed(1)}) may be overpowered`,
          recommendation: 'Consider reducing base damage or increasing attack speed',
        });
      }

      // Check for very low TTK on expensive weapons
      if (balance.ttk < 2 && w.costValue < 5000) {
        issues.push({
          severity: 'medium',
          item: w.name,
          issue: `Low TTK (${balance.ttk.toFixed(1)}s) for cost ($${w.costValue})`,
          recommendation: 'Consider increasing cost or reducing damage',
        });
      }

      // Check for poor cost efficiency on expensive items
      if (balance.costEfficiency < 0.005 && w.costValue > 2000) {
        issues.push({
          severity: 'low',
          item: w.name,
          issue: 'Low cost efficiency may make this underused',
          recommendation: 'Consider reducing cost or improving stats',
        });
      }
    });

    // Check armor
    ALL_ARMOR.forEach((a) => {
      const protection = calculateEffectiveProtection(a);

      // Check for high protection with no penalties
      if (
        protection > 25 &&
        a.movementPenalty >= 0 &&
        a.stealthPenalty >= 0 &&
        a.category !== 'Natural'
      ) {
        issues.push({
          severity: 'medium',
          item: a.name,
          issue: `High protection (${protection.toFixed(1)}) with no penalties`,
          recommendation: 'Consider adding movement or stealth penalty',
        });
      }

      // Check for power armor balance
      if (a.category === 'Power' && a.costValue < 30000) {
        issues.push({
          severity: 'low',
          item: a.name,
          issue: 'Power armor may be underpriced',
          recommendation: 'Consider increasing cost for balance',
        });
      }
    });

    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, []);

  // Weapon analysis data
  const weaponAnalysis = useMemo(() => {
    return ALL_WEAPONS.map((w) => ({
      weapon: w,
      dps: calculateDPS(w),
      balance: calculateWeaponBalance(w),
    }))
      .sort((a, b) => b.dps - a.dps)
      .slice(0, 20);
  }, []);

  // Armor analysis data
  const armorAnalysis = useMemo(() => {
    return ALL_ARMOR.map((a) => ({
      armor: a,
      protection: calculateEffectiveProtection(a),
      efficiency: calculateArmorEfficiency(a),
    }))
      .sort((a, b) => b.protection - a.protection)
      .slice(0, 20);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-blue-400 bg-blue-500/20';
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-900 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-2xl font-bold mb-2">Balance Analyzer</h2>
        <p className="text-gray-400 text-sm">
          Analyze equipment balance and identify potential issues
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-gray-700">
        {(['overview', 'weapons', 'armor', 'issues'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize ${
              activeTab === tab
                ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab}
            {tab === 'issues' && balanceIssues.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {balanceIssues.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Items */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Equipment Totals</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Weapons</span>
                  <span className="text-red-400">{stats.byType['weapon'] || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Armor</span>
                  <span className="text-blue-400">{stats.byType['armor'] || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gadgets</span>
                  <span className="text-green-400">{stats.byType['gadget'] || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vehicles</span>
                  <span className="text-yellow-400">{stats.byType['vehicle'] || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Drones</span>
                  <span className="text-purple-400">{stats.byType['drone'] || 0}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{stats.totalItems}</span>
                </div>
              </div>
            </div>

            {/* Weapon Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Weapon DPS Range</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Min DPS</span>
                    <span className="text-green-400">
                      {stats.weaponDPSRange.min.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(stats.weaponDPSRange.min / stats.weaponDPSRange.max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Avg DPS</span>
                    <span className="text-yellow-400">
                      {stats.weaponDPSRange.avg.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${(stats.weaponDPSRange.avg / stats.weaponDPSRange.max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Max DPS</span>
                    <span className="text-red-400">
                      {stats.weaponDPSRange.max.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Armor Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Armor DR Range</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Min DR</span>
                    <span className="text-green-400">
                      {stats.armorDRRange.min.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(stats.armorDRRange.min / stats.armorDRRange.max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Avg DR</span>
                    <span className="text-yellow-400">
                      {stats.armorDRRange.avg.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${(stats.armorDRRange.avg / stats.armorDRRange.max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Max DR</span>
                    <span className="text-blue-400">
                      {stats.armorDRRange.max.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Distribution */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Cost Distribution</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(stats.byCostLevel).map(([level, count]) => (
                  <div key={level} className="flex justify-between items-center">
                    <span className="text-gray-400">{level.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="bg-yellow-500 h-2 rounded"
                        style={{
                          width: `${(count / stats.totalItems) * 200}px`,
                        }}
                      />
                      <span className="w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Distribution */}
            <div className="bg-gray-800 rounded-lg p-4 col-span-2">
              <h3 className="text-lg font-bold mb-3">Availability Distribution</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {Object.entries(stats.byAvailability)
                  .sort((a, b) => b[1] - a[1])
                  .map(([avail, count]) => (
                    <div
                      key={avail}
                      className="flex justify-between p-2 bg-gray-700 rounded"
                    >
                      <span className="text-gray-400">
                        {avail.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Weapons Tab */}
        {activeTab === 'weapons' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Top 20 Weapons by DPS</h3>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2 text-left">Weapon</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-right">Damage</th>
                  <th className="p-2 text-right">Speed</th>
                  <th className="p-2 text-right">DPS</th>
                  <th className="p-2 text-right">TTK</th>
                  <th className="p-2 text-right">Cost</th>
                  <th className="p-2 text-right">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {weaponAnalysis.map(({ weapon, dps, balance }) => (
                  <tr key={weapon.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="p-2">
                      {weapon.emoji} {weapon.name}
                    </td>
                    <td className="p-2 text-gray-400">
                      {weapon.category.replace(/_/g, ' ')}
                    </td>
                    <td className="p-2 text-right text-red-400">{weapon.baseDamage}</td>
                    <td className="p-2 text-right">{weapon.attackSpeed}s</td>
                    <td className="p-2 text-right text-orange-400 font-bold">
                      {dps.toFixed(1)}
                    </td>
                    <td className="p-2 text-right">{balance.ttk.toFixed(1)}s</td>
                    <td className="p-2 text-right text-yellow-400">
                      ${weapon.costValue}
                    </td>
                    <td className="p-2 text-right text-green-400">
                      {balance.costEfficiency.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Armor Tab */}
        {activeTab === 'armor' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Top 20 Armor by Protection</h3>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2 text-left">Armor</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-right">Phys DR</th>
                  <th className="p-2 text-right">Energy DR</th>
                  <th className="p-2 text-right">Effective</th>
                  <th className="p-2 text-right">Weight</th>
                  <th className="p-2 text-right">Efficiency</th>
                  <th className="p-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {armorAnalysis.map(({ armor, protection, efficiency }) => (
                  <tr key={armor.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="p-2">
                      {armor.emoji} {armor.name}
                    </td>
                    <td className="p-2 text-gray-400">{armor.category}</td>
                    <td className="p-2 text-right text-blue-400">{armor.drPhysical}</td>
                    <td className="p-2 text-right text-yellow-400">{armor.drEnergy}</td>
                    <td className="p-2 text-right text-green-400 font-bold">
                      {protection.toFixed(1)}
                    </td>
                    <td className="p-2 text-right">{armor.weight} lbs</td>
                    <td className="p-2 text-right text-purple-400">
                      {efficiency.toFixed(2)}
                    </td>
                    <td className="p-2 text-right text-yellow-400">
                      ${armor.costValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Balance Issues</h3>
              <div className="text-sm text-gray-400">
                {balanceIssues.length} issues found
              </div>
            </div>

            {balanceIssues.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No balance issues detected!
              </div>
            ) : (
              <div className="space-y-3">
                {balanceIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-lg p-4 border-l-4"
                    style={{
                      borderColor:
                        issue.severity === 'critical'
                          ? '#ef4444'
                          : issue.severity === 'high'
                            ? '#f97316'
                            : issue.severity === 'medium'
                              ? '#eab308'
                              : '#3b82f6',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getSeverityColor(issue.severity)}`}
                          >
                            {issue.severity}
                          </span>
                          <span className="font-bold">{issue.item}</span>
                        </div>
                        <p className="text-gray-300">{issue.issue}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Recommendation: {issue.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceAnalyzer;

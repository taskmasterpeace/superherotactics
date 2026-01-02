/**
 * Budget Display Component
 *
 * Shows income vs expenses breakdown with transaction history.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Briefcase,
  Shield,
  Building2,
  HeartPulse,
  GraduationCap,
} from 'lucide-react';

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  mission_reward: <Shield size={14} />,
  mission_bonus: <Shield size={14} />,
  salary: <Briefcase size={14} />,
  contract: <Briefcase size={14} />,
  mission_expense: <Shield size={14} />,
  travel_expense: <Calendar size={14} />,
  equipment: <Building2 size={14} />,
  equipment_maintenance: <Building2 size={14} />,
  medical_expense: <HeartPulse size={14} />,
  training: <GraduationCap size={14} />,
  base_upkeep: <Building2 size={14} />,
};

export const BudgetDisplay: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const budget = useGameStore(state => state.budget);
  const economy = useGameStore(state => state.economy);
  const [showDetails, setShowDetails] = useState(false);

  const weeklyNet = (economy?.weeklyIncome || 0) - (economy?.weeklyExpenses || 0);
  const isPositive = weeklyNet >= 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <DollarSign size={16} className="text-green-400" />
          <span className="font-bold text-green-400">${budget.toLocaleString()}</span>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span className="text-xs">
            {isPositive ? '+' : ''}${weeklyNet.toLocaleString()}/wk
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <DollarSign size={20} className="text-green-400" />
          Financial Overview
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Current Budget */}
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Current Budget</div>
          <div className="text-xl font-bold text-green-400">
            ${budget.toLocaleString()}
          </div>
        </div>

        {/* Weekly Income */}
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
            <ArrowUpCircle size={12} className="text-green-400" />
            Weekly Income
          </div>
          <div className="text-lg font-bold text-green-400">
            +${(economy?.weeklyIncome || 0).toLocaleString()}
          </div>
        </div>

        {/* Weekly Expenses */}
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
            <ArrowDownCircle size={12} className="text-red-400" />
            Weekly Expenses
          </div>
          <div className="text-lg font-bold text-red-400">
            -${(economy?.weeklyExpenses || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Net Flow */}
      <div className={`p-3 rounded-lg flex items-center justify-center gap-2 ${
        isPositive ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
      }`}>
        {isPositive ? (
          <TrendingUp size={18} className="text-green-400" />
        ) : (
          <TrendingDown size={18} className="text-red-400" />
        )}
        <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          Weekly Net: {isPositive ? '+' : ''}${weeklyNet.toLocaleString()}
        </span>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          {/* Income Sources */}
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
              <ArrowUpCircle size={14} />
              Income Sources
            </h4>
            <div className="space-y-1">
              {economy?.incomeSources?.map((source, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-800 rounded px-2 py-1">
                  <span className="flex items-center gap-2 text-gray-300">
                    {CATEGORY_ICONS[source.category] || <DollarSign size={14} />}
                    {source.description}
                  </span>
                  <span className="text-green-400">+${source.amount.toLocaleString()}</span>
                </div>
              )) || (
                <div className="text-gray-500 text-sm italic">No income sources</div>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
              <ArrowDownCircle size={14} />
              Expenses
            </h4>
            <div className="space-y-1">
              {economy?.expenseCategories?.map((expense, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-800 rounded px-2 py-1">
                  <span className="flex items-center gap-2 text-gray-300">
                    {CATEGORY_ICONS[expense.category] || <DollarSign size={14} />}
                    {expense.description}
                  </span>
                  <span className="text-red-400">-${expense.amount.toLocaleString()}</span>
                </div>
              )) || (
                <div className="text-gray-500 text-sm italic">No expenses</div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          {economy?.recentTransactions && economy.recentTransactions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Transactions</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {economy.recentTransactions.slice(0, 5).map((tx, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-800 rounded px-2 py-1">
                    <span className="text-gray-400">{tx.description}</span>
                    <span className={tx.type === 'income' || tx.type === 'sale' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type === 'income' || tx.type === 'sale' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetDisplay;

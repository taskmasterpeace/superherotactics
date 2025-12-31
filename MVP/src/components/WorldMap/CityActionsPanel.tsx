/**
 * City Actions Panel Component
 *
 * Displays available actions based on city types in the selected sector.
 * Integrates with the city actions system to show what players can do.
 */

import React, { useState, useMemo } from 'react';
import { City } from '../../data/cities';
import { Country, getCountryByName } from '../../data/countries';
import {
  CityAction,
  ActionCategory,
  getActionsForCity,
  getActionCost,
  getActionSuccessChance,
  isActionAvailable,
  formatDuration,
} from '../../data/cityActions';
import { RetroButton, RetroBadge, cn } from '../ui';
import {
  Building2,
  GraduationCap,
  Shield,
  Factory,
  Ship,
  Mountain,
  Palmtree,
  Church,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
} from 'lucide-react';

interface CityActionsPanelProps {
  selectedCity: City | null;
  country: Country | null;
  onActionSelect?: (action: CityAction, city: City) => void;
  playerFame?: number;
  playerBudget?: number;
}

// City type icons
const CITY_TYPE_ICONS: Record<string, React.ReactNode> = {
  Political: <Building2 className="w-4 h-4" />,
  Educational: <GraduationCap className="w-4 h-4" />,
  Military: <Shield className="w-4 h-4" />,
  Industrial: <Factory className="w-4 h-4" />,
  Seaport: <Ship className="w-4 h-4" />,
  Mining: <Mountain className="w-4 h-4" />,
  Resort: <Palmtree className="w-4 h-4" />,
  Temple: <Church className="w-4 h-4" />,
  Company: <Briefcase className="w-4 h-4" />,
};

// Category colors
const CATEGORY_COLORS: Record<ActionCategory, string> = {
  governance: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  training: 'bg-green-500/20 text-green-400 border-green-500/40',
  recruitment: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  equipment: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  logistics: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  stealth: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
  healing: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  intel: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  criminal: 'bg-red-500/20 text-red-400 border-red-500/40',
};

const CityActionsPanel: React.FC<CityActionsPanelProps> = ({
  selectedCity,
  country,
  onActionSelect,
  playerFame = 0,
  playerBudget = 0,
}) => {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'all'>('all');

  // Get city types
  const cityTypes = useMemo(() => {
    if (!selectedCity) return [];
    return [
      selectedCity.cityType1,
      selectedCity.cityType2,
      selectedCity.cityType3,
      selectedCity.cityType4,
    ].filter(type => type && type !== '');
  }, [selectedCity]);

  // Get available actions for this city
  const availableActions = useMemo(() => {
    if (!selectedCity) return [];
    return getActionsForCity(selectedCity);
  }, [selectedCity]);

  // Filter actions by category
  const filteredActions = useMemo(() => {
    if (selectedCategory === 'all') return availableActions;
    return availableActions.filter(action => action.category === selectedCategory);
  }, [availableActions, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(availableActions.map(a => a.category));
    return Array.from(cats).sort();
  }, [availableActions]);

  // Check if action can be afforded
  const canAfford = (action: CityAction): boolean => {
    if (!country) return true;
    const cost = getActionCost(action, country);
    return playerBudget >= cost;
  };

  // Check if action meets fame requirement
  const meetsFameReq = (action: CityAction): boolean => {
    return !action.fameRequired || playerFame >= action.fameRequired;
  };

  if (!selectedCity) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a city to view available actions</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border-2 border-black overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-primary border-b-2 border-black">
        <div className="flex items-center justify-between">
          <span className="text-primary-foreground font-bold text-sm tracking-wider">
            CITY ACTIONS
          </span>
          <span className="text-primary-foreground/70 text-xs">
            {filteredActions.length} available
          </span>
        </div>
      </div>

      {/* City Types */}
      <div className="px-3 py-2 border-b-2 border-black/20 bg-background">
        <p className="text-xs text-muted-foreground uppercase mb-1">City Types</p>
        <div className="flex flex-wrap gap-1">
          {cityTypes.map((type, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2 py-1 bg-surface rounded border border-black/20 text-xs"
            >
              {CITY_TYPE_ICONS[type] || <Building2 className="w-3 h-3" />}
              <span>{type}</span>
            </div>
          ))}
          {cityTypes.length === 0 && (
            <span className="text-muted-foreground text-xs italic">No special types</span>
          )}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="px-3 py-2 border-b-2 border-black/20 bg-background">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors border",
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-black'
                  : 'bg-surface text-foreground border-black/20 hover:bg-surface-light'
              )}
            >
              All ({availableActions.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium transition-colors border capitalize",
                  selectedCategory === cat
                    ? CATEGORY_COLORS[cat]
                    : 'bg-surface text-foreground border-black/20 hover:bg-surface-light'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="max-h-[300px] overflow-y-auto">
        {filteredActions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No actions available in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {filteredActions.map(action => {
              const isExpanded = expandedActionId === action.id;
              const cost = country ? getActionCost(action, country) : action.baseCost;
              const successChance = country ? getActionSuccessChance(action, country) : 70;
              const isAvailable = country ? isActionAvailable(action, country) : true;
              const affordable = canAfford(action);
              const fameOk = meetsFameReq(action);
              const canExecute = isAvailable && affordable && fameOk;

              return (
                <div key={action.id} className="bg-background">
                  {/* Action Header */}
                  <button
                    onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
                    className={cn(
                      "w-full px-3 py-2 flex items-center gap-2 transition-colors",
                      canExecute ? "hover:bg-surface-light" : "opacity-60"
                    )}
                  >
                    <span className="text-xl">{action.emoji}</span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {action.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDuration(action.duration)}
                        </span>
                        {cost > 0 && (
                          <span className={cn(
                            "flex items-center gap-0.5",
                            affordable ? "text-green-400" : "text-red-400"
                          )}>
                            <DollarSign className="w-3 h-3" />
                            {cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                        CATEGORY_COLORS[action.category]
                      )}>
                        {action.category}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 bg-surface/50 border-t border-black/10">
                      {/* Description */}
                      <p className="text-xs text-muted-foreground mt-2">
                        {action.description}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-background rounded p-2 border border-black/10">
                          <p className="text-[10px] text-muted-foreground uppercase">Success Rate</p>
                          <p className={cn(
                            "text-sm font-bold",
                            successChance >= 70 ? "text-green-400" :
                            successChance >= 50 ? "text-yellow-400" : "text-red-400"
                          )}>
                            {successChance}%
                          </p>
                        </div>
                        {action.fameRequired && (
                          <div className="bg-background rounded p-2 border border-black/10">
                            <p className="text-[10px] text-muted-foreground uppercase">Fame Required</p>
                            <p className={cn(
                              "text-sm font-bold",
                              fameOk ? "text-green-400" : "text-red-400"
                            )}>
                              {action.fameRequired} {fameOk ? "✓" : "✗"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Risks */}
                      {action.risks && action.risks.length > 0 && (
                        <div className="bg-red-500/10 rounded p-2 border border-red-500/30">
                          <p className="text-[10px] text-red-400 uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Risks
                          </p>
                          {action.risks.map((risk, idx) => (
                            <p key={idx} className="text-xs text-red-300">
                              {risk.chance}% chance: {risk.consequence}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Outcomes */}
                      {action.outcomes && (
                        <div className="bg-green-500/10 rounded p-2 border border-green-500/30">
                          <p className="text-[10px] text-green-400 uppercase flex items-center gap-1">
                            <Target className="w-3 h-3" /> Outcomes
                          </p>
                          <p className="text-xs text-green-300">{action.outcomes.success}</p>
                          {action.outcomes.criticalSuccess && (
                            <p className="text-xs text-green-200 mt-1">
                              ⭐ Critical: {action.outcomes.criticalSuccess}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Unlocks */}
                      {action.unlocks && action.unlocks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-muted-foreground">Unlocks:</span>
                          {action.unlocks.map((unlock, idx) => (
                            <RetroBadge key={idx} variant="secondary" size="sm">
                              {unlock.replace(/_/g, ' ')}
                            </RetroBadge>
                          ))}
                        </div>
                      )}

                      {/* Execute Button */}
                      <div className="pt-2">
                        <RetroButton
                          variant={canExecute ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full"
                          disabled={!canExecute}
                          onClick={() => onActionSelect?.(action, selectedCity)}
                        >
                          {!affordable ? "Cannot Afford" :
                           !fameOk ? "Fame Too Low" :
                           !isAvailable ? "Not Available" :
                           "EXECUTE ACTION"}
                        </RetroButton>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CityActionsPanel;

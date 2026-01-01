/**
 * Price Trend Indicator Component (EL-007)
 *
 * Shows price trends, market conditions, and active events in shop UI.
 * Displays:
 * - Market condition badge
 * - Category price trends (up/down/stable arrows)
 * - Active price events
 * - Currency exchange info
 */

import React, { useMemo } from 'react';
import { getDynamicEconomyManager, GoodsCategory, MarketCondition } from '../data/dynamicEconomy';
import { getPriceEventManager, PriceEvent } from '../data/priceFluctuation';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MarketConditionBadgeProps {
  condition: MarketCondition;
  description: string;
}

const MarketConditionBadge: React.FC<MarketConditionBadgeProps> = ({ condition, description }) => {
  const colors: Record<MarketCondition, string> = {
    boom: 'bg-green-600 text-white',
    normal: 'bg-slate-600 text-white',
    recession: 'bg-yellow-600 text-white',
    crisis: 'bg-red-600 text-white',
    shortage: 'bg-orange-600 text-white',
    flooded: 'bg-blue-600 text-white',
  };

  const icons: Record<MarketCondition, string> = {
    boom: '📈',
    normal: '📊',
    recession: '📉',
    crisis: '🔥',
    shortage: '⚠️',
    flooded: '🌊',
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg ${colors[condition]} flex items-center gap-2`}>
      <span>{icons[condition]}</span>
      <div>
        <div className="font-bold text-sm capitalize">{condition}</div>
        <div className="text-xs opacity-80">{description}</div>
      </div>
    </div>
  );
};

interface CategoryTrendProps {
  category: GoodsCategory;
  supply: number;
  demand: number;
  priceMultiplier: number;
  trend: 'up' | 'down' | 'stable';
}

const CategoryTrend: React.FC<CategoryTrendProps> = ({
  category,
  supply,
  demand,
  priceMultiplier,
  trend,
}) => {
  const categoryIcons: Record<GoodsCategory, string> = {
    weapons: '🔫',
    armor: '🛡️',
    medical: '💉',
    electronics: '💻',
    vehicles: '🚗',
    ammunition: '📦',
    explosives: '💣',
    contraband: '🕶️',
  };

  const trendColors = {
    up: 'text-red-400',
    down: 'text-green-400',
    stable: 'text-slate-400',
  };

  const trendArrows = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  const priceChange = Math.round((priceMultiplier - 1) * 100);
  const priceLabel = priceChange > 0 ? `+${priceChange}%` : `${priceChange}%`;

  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700">
      <div className="flex items-center gap-2">
        <span>{categoryIcons[category]}</span>
        <span className="text-sm text-slate-300 capitalize">{category}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-500">
          S:{Math.round(supply)} D:{Math.round(demand)}
        </div>
        <div className={`font-bold ${trendColors[trend]}`}>
          {trendArrows[trend]} {priceLabel}
        </div>
      </div>
    </div>
  );
};

interface ActiveEventCardProps {
  event: PriceEvent;
}

const ActiveEventCard: React.FC<ActiveEventCardProps> = ({ event }) => {
  const eventTypeColors: Partial<Record<string, string>> = {
    coup: 'border-red-500 bg-red-900/30',
    civil_war: 'border-red-600 bg-red-900/40',
    sanctions: 'border-orange-500 bg-orange-900/30',
    natural_disaster: 'border-yellow-500 bg-yellow-900/30',
    pandemic: 'border-purple-500 bg-purple-900/30',
    arms_deal: 'border-green-500 bg-green-900/30',
    boom: 'border-green-400 bg-green-900/20',
    recession: 'border-yellow-400 bg-yellow-900/20',
  };

  const colorClass = eventTypeColors[event.type] || 'border-slate-500 bg-slate-800/50';

  return (
    <div className={`p-3 rounded-lg border ${colorClass}`}>
      <div className="font-bold text-white text-sm mb-1">{event.headline}</div>
      <div className="text-xs text-slate-400">
        {event.effects.map(e => (
          <span key={e.category} className="mr-2">
            {e.category}: {e.multiplier < 1 ? '↓' : '↑'}
            {Math.round(Math.abs(1 - e.multiplier) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
};

interface CurrencyInfoProps {
  code: string;
  name: string;
  exchangeRate: number;
  inflation: number;
}

const CurrencyInfo: React.FC<CurrencyInfoProps> = ({ code, name, exchangeRate, inflation }) => {
  return (
    <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-bold text-white">{code}</span>
          <span className="text-xs text-slate-400 ml-2">{name}</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-300">
            {exchangeRate.toFixed(exchangeRate >= 10 ? 0 : 2)} / USD
          </div>
          <div className="text-xs text-slate-500">
            {(inflation * 100).toFixed(1)}% inflation
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

interface PriceTrendPanelProps {
  countryCode: string;
  compact?: boolean;
}

export const PriceTrendPanel: React.FC<PriceTrendPanelProps> = ({ countryCode, compact = false }) => {
  const economyManager = useMemo(() => getDynamicEconomyManager(), []);
  const eventManager = useMemo(() => getPriceEventManager(), []);

  const marketSummary = economyManager.getMarketSummary(countryCode);
  const activeEvents = eventManager.getActiveEvents(countryCode);

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <MarketConditionBadge
          condition={marketSummary.condition}
          description={marketSummary.conditionDescription}
        />
        {activeEvents.length > 0 && (
          <div className="text-xs text-yellow-400">
            ⚡ {activeEvents.length} active event{activeEvents.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4">
      <h3 className="text-lg font-bold text-white mb-4">Market Conditions</h3>

      {/* Market Condition */}
      <div className="mb-4">
        <MarketConditionBadge
          condition={marketSummary.condition}
          description={marketSummary.conditionDescription}
        />
      </div>

      {/* Currency Info */}
      <div className="mb-4">
        <CurrencyInfo
          code={marketSummary.currency.code}
          name={marketSummary.currency.name}
          exchangeRate={marketSummary.currency.exchangeRate}
          inflation={marketSummary.currency.inflation}
        />
      </div>

      {/* Category Trends */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-400 mb-2">Price Trends</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {marketSummary.categories.map(cat => (
            <CategoryTrend
              key={cat.category}
              category={cat.category}
              supply={cat.supply}
              demand={cat.demand}
              priceMultiplier={cat.priceMultiplier}
              trend={cat.trend}
            />
          ))}
        </div>
      </div>

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-400 mb-2">Active Events</h4>
          <div className="space-y-2">
            {activeEvents.map(event => (
              <ActiveEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PriceBreakdownProps {
  basePrice: number;
  category: GoodsCategory;
  countryCode: string;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  basePrice,
  category,
  countryCode,
}) => {
  const economyManager = useMemo(() => getDynamicEconomyManager(), []);
  const { finalPrice, breakdown } = economyManager.calculatePrice(basePrice, category, countryCode);

  const totalChange = Math.round((finalPrice / basePrice - 1) * 100);

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400">Base Price:</span>
        <span className="text-slate-300">${basePrice.toLocaleString()}</span>
      </div>

      {breakdown.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center text-xs py-0.5">
          <span className="text-slate-500">{item.factor}</span>
          <span className={item.multiplier < 1 ? 'text-green-400' : item.multiplier > 1 ? 'text-red-400' : 'text-slate-400'}>
            {item.multiplier < 1 ? '−' : item.multiplier > 1 ? '+' : ''}
            {Math.abs(Math.round((item.multiplier - 1) * 100))}%
          </span>
        </div>
      ))}

      <div className="border-t border-slate-600 mt-2 pt-2 flex justify-between items-center">
        <span className="font-bold text-white">Final Price:</span>
        <div className="text-right">
          <span className="font-bold text-white text-lg">${finalPrice.toLocaleString()}</span>
          <span className={`ml-2 text-xs ${totalChange < 0 ? 'text-green-400' : totalChange > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            ({totalChange > 0 ? '+' : ''}{totalChange}%)
          </span>
        </div>
      </div>
    </div>
  );
};

interface ShopPriceTagProps {
  basePrice: number;
  category: GoodsCategory;
  countryCode: string;
  showTrend?: boolean;
}

export const ShopPriceTag: React.FC<ShopPriceTagProps> = ({
  basePrice,
  category,
  countryCode,
  showTrend = true,
}) => {
  const economyManager = useMemo(() => getDynamicEconomyManager(), []);
  const { finalPrice } = economyManager.calculatePrice(basePrice, category, countryCode);
  const marketSummary = economyManager.getMarketSummary(countryCode);

  const categoryData = marketSummary.categories.find(c => c.category === category);
  const trend = categoryData?.trend || 'stable';

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '',
  };

  const trendColors = {
    up: 'text-red-400',
    down: 'text-green-400',
    stable: 'text-slate-400',
  };

  const changePercent = Math.round((finalPrice / basePrice - 1) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-white">${finalPrice.toLocaleString()}</span>
      {showTrend && changePercent !== 0 && (
        <span className={`text-xs ${trendColors[trend]}`}>
          {trendIcons[trend]}{changePercent > 0 ? '+' : ''}{changePercent}%
        </span>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default PriceTrendPanel;

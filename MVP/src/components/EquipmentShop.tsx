import React, { useState, useMemo } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import {
  Shop,
  ShopItem,
  getShopsForCity,
  getAllShopItems,
  getBuyPrice,
  getSellPrice,
  formatPrice,
  SHOP_INFO,
  AVAILABILITY_INFO,
} from '../data/shopSystem';
import { getWeaponById } from '../data/weapons';
import { getArmorById } from '../data/armor';
import { Weapon, Armor } from '../data/equipmentTypes';

type ShopTab = 'weapons' | 'armor' | 'sell';

const EquipmentShop: React.FC = () => {
  const {
    budget,
    inventory,
    selectedCity,
    buyItem,
    sellItem,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<ShopTab>('weapons');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get shops available in current city
  const availableShops = useMemo(() => {
    return getShopsForCity(selectedCity || 'Washington DC');
  }, [selectedCity]);

  // Auto-select first shop if none selected
  React.useEffect(() => {
    if (availableShops.length > 0 && !selectedShop) {
      setSelectedShop(availableShops[0]);
    }
  }, [availableShops, selectedShop]);

  // Get items for current shop
  const shopItems = useMemo(() => {
    if (!selectedShop) return [];
    return getAllShopItems(selectedShop);
  }, [selectedShop]);

  // Filter items by tab and search
  const filteredItems = useMemo(() => {
    let items = shopItems;

    // Filter by tab
    if (activeTab === 'weapons') {
      items = items.filter(item => item.type === 'weapon');
    } else if (activeTab === 'armor') {
      items = items.filter(item => item.type === 'armor');
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.availability.toLowerCase().includes(query)
      );
    }

    return items;
  }, [shopItems, activeTab, searchQuery]);

  // Get inventory items for sell tab
  const inventoryItems = useMemo(() => {
    if (activeTab !== 'sell') return [];

    const items: Array<{ item: ShopItem; originalItem: Weapon | Armor }> = [];

    // Map weapon IDs to items
    inventory.weapons.forEach(weaponId => {
      const weapon = getWeaponById(weaponId);
      if (weapon) {
        items.push({
          item: {
            id: weapon.id,
            name: weapon.name,
            type: 'weapon',
            costValue: weapon.costValue,
            costLevel: weapon.costLevel,
            availability: weapon.availability,
            emoji: weapon.emoji,
            data: weapon,
          },
          originalItem: weapon,
        });
      }
    });

    // Map armor IDs to items
    inventory.armor.forEach(armorId => {
      const armor = getArmorById(armorId);
      if (armor) {
        items.push({
          item: {
            id: armor.id,
            name: armor.name,
            type: 'armor',
            costValue: armor.costValue,
            costLevel: armor.costLevel,
            availability: armor.availability,
            emoji: armor.emoji,
            data: armor,
          },
          originalItem: armor,
        });
      }
    });

    return items;
  }, [inventory, activeTab]);

  const handleBuy = (item: ShopItem) => {
    if (!selectedShop) return;
    const price = getBuyPrice(item, selectedShop);
    buyItem(item.id, item.type, price);
  };

  const handleSell = (item: ShopItem) => {
    if (!selectedShop) return;
    const price = getSellPrice(item, selectedShop);
    sellItem(item.id, item.type, price);
  };

  const getAvailabilityColor = (availability: string): string => {
    const info = AVAILABILITY_INFO[availability as keyof typeof AVAILABILITY_INFO];
    if (!info) return 'text-gray-400';

    switch (info.color) {
      case 'green': return 'text-green-400';
      case 'blue': return 'text-blue-400';
      case 'yellow': return 'text-yellow-400';
      case 'orange': return 'text-orange-400';
      case 'red': return 'text-red-400';
      case 'purple': return 'text-purple-400';
      case 'magenta': return 'text-pink-400';
      case 'cyan': return 'text-cyan-400';
      case 'lime': return 'text-lime-400';
      case 'gold': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  const renderWeaponStats = (weapon: Weapon) => (
    <div className="flex gap-4 text-sm text-gray-400">
      <span>DMG: {weapon.baseDamage}</span>
      <span>RNG: {weapon.range}</span>
      <span>SPD: {weapon.attackSpeed}s</span>
    </div>
  );

  const renderArmorStats = (armor: Armor) => (
    <div className="flex gap-4 text-sm text-gray-400">
      <span>DR: {armor.drPhysical}</span>
      {armor.stoppingPower && <span>SP: {armor.stoppingPower}</span>}
      <span>WGT: {armor.weight}lb</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Equipment Shop</h1>
          <p className="text-indigo-300">Buy and sell weapons, armor, and gear</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-green-500/30">
              <span className="text-green-300">Budget:</span>
              <span className="ml-2 text-white font-bold">${budget.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-blue-500/30">
              <span className="text-blue-300">Location:</span>
              <span className="ml-2 text-white font-bold">{selectedCity || 'Washington DC'}</span>
            </div>
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-purple-500/30">
              <span className="text-purple-300">Inventory:</span>
              <span className="ml-2 text-white font-bold">
                {inventory.weapons.length + inventory.armor.length} items
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Shop Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/80 rounded-lg border border-indigo-500/30 p-4">
              <h2 className="text-xl font-bold text-white mb-4">Available Shops</h2>
              <div className="space-y-2">
                {availableShops.map(shop => {
                  const info = SHOP_INFO[shop.type];
                  const isSelected = selectedShop?.id === shop.id;
                  return (
                    <button
                      key={shop.id}
                      onClick={() => setSelectedShop(shop)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-indigo-600/50 border border-indigo-400'
                          : 'bg-slate-700/50 hover:bg-slate-600/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.emoji}</span>
                        <div>
                          <div className="text-white font-medium">{info.name}</div>
                          <div className="text-xs text-gray-400">{info.description}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-indigo-300">
                        Markup: {Math.round(shop.markupMultiplier * 100)}%
                      </div>
                    </button>
                  );
                })}
              </div>

              {availableShops.length === 0 && (
                <p className="text-gray-400 text-center py-4">No shops available</p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/80 rounded-lg border border-indigo-500/30 p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('weapons')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'weapons'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Weapons ({shopItems.filter(i => i.type === 'weapon').length})
                </button>
                <button
                  onClick={() => setActiveTab('armor')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'armor'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Armor ({shopItems.filter(i => i.type === 'armor').length})
                </button>
                <button
                  onClick={() => setActiveTab('sell')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'sell'
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Sell ({inventory.weapons.length + inventory.armor.length})
                </button>
              </div>

              {/* Search */}
              {activeTab !== 'sell' && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Item List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {activeTab !== 'sell' ? (
                  // Buy tab
                  filteredItems.length > 0 ? (
                    filteredItems.map(item => {
                      const price = selectedShop ? getBuyPrice(item, selectedShop) : item.costValue;
                      const canAfford = budget >= price;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-indigo-500/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{item.emoji}</span>
                            <div>
                              <div className="text-white font-medium">{item.name}</div>
                              {item.type === 'weapon' && renderWeaponStats(item.data as Weapon)}
                              {item.type === 'armor' && renderArmorStats(item.data as Armor)}
                              <div className={`text-xs mt-1 ${getAvailabilityColor(item.availability)}`}>
                                {AVAILABILITY_INFO[item.availability]?.label || item.availability}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`text-lg font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPrice(price)}
                              </div>
                              <div className="text-xs text-gray-400">{item.costLevel}</div>
                            </div>
                            <button
                              onClick={() => handleBuy(item)}
                              disabled={!canAfford}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                canAfford
                                  ? 'bg-green-600 hover:bg-green-500 text-white'
                                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">
                        {activeTab === 'weapons' ? '🔫' : '🛡️'}
                      </div>
                      <p className="text-gray-400">No items available</p>
                    </div>
                  )
                ) : (
                  // Sell tab
                  inventoryItems.length > 0 ? (
                    inventoryItems.map(({ item }, index) => {
                      const sellPrice = selectedShop ? getSellPrice(item, selectedShop) : Math.round(item.costValue * 0.5);

                      return (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-orange-500/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{item.emoji}</span>
                            <div>
                              <div className="text-white font-medium">{item.name}</div>
                              {item.type === 'weapon' && renderWeaponStats(item.data as Weapon)}
                              {item.type === 'armor' && renderArmorStats(item.data as Armor)}
                              <div className={`text-xs mt-1 ${getAvailabilityColor(item.availability)}`}>
                                {AVAILABILITY_INFO[item.availability]?.label || item.availability}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-400">
                                {formatPrice(sellPrice)}
                              </div>
                              <div className="text-xs text-gray-400">50% of value</div>
                            </div>
                            <button
                              onClick={() => handleSell(item)}
                              className="px-4 py-2 rounded-lg font-medium bg-orange-600 hover:bg-orange-500 text-white transition-all"
                            >
                              Sell
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-400">No items in inventory to sell</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Win combat to collect loot, or buy items first
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentShop;

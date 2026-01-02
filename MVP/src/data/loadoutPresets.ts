/**
 * Loadout Preset System for SuperHero Tactics
 *
 * Saves and manages squad equipment configurations.
 * Allows players to quickly equip squads with predefined loadouts.
 */

// =============================================================================
// LOADOUT PRESET TYPES
// =============================================================================

export interface LoadoutPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  slots: LoadoutSlot[];
}

export interface LoadoutSlot {
  slotIndex: number;
  role: 'leader' | 'rifleman' | 'support' | 'heavy' | 'medic' | 'sniper' | 'scout';
  primaryWeapon?: string;
  secondaryWeapon?: string;
  armor?: string;
  helmet?: string;
  grenades?: { type: string; count: number }[];
  medkits?: number;
}

// =============================================================================
// PRESET STORAGE
// =============================================================================

const loadoutPresets: Map<string, LoadoutPreset> = new Map();

// =============================================================================
// PRESET FUNCTIONS
// =============================================================================

export function createLoadoutPreset(
  name: string,
  slots: LoadoutSlot[],
  description?: string
): LoadoutPreset {
  const preset: LoadoutPreset = {
    id: `preset-${Date.now()}`,
    name,
    description,
    createdAt: Date.now(),
    slots,
  };
  loadoutPresets.set(preset.id, preset);
  return preset;
}

export function getLoadoutPresets(): LoadoutPreset[] {
  return Array.from(loadoutPresets.values());
}

export function getLoadoutPreset(presetId: string): LoadoutPreset | undefined {
  return loadoutPresets.get(presetId);
}

export function deleteLoadoutPreset(presetId: string): boolean {
  return loadoutPresets.delete(presetId);
}

export function updateLoadoutPreset(
  presetId: string,
  updates: Partial<Omit<LoadoutPreset, 'id' | 'createdAt'>>
): LoadoutPreset | undefined {
  const preset = loadoutPresets.get(presetId);
  if (!preset) return undefined;

  const updated = { ...preset, ...updates };
  loadoutPresets.set(presetId, updated);
  return updated;
}

// =============================================================================
// DEFAULT PRESETS
// =============================================================================

const DEFAULT_PRESETS: LoadoutPreset[] = [
  {
    id: 'preset-assault',
    name: 'Assault Team',
    description: 'Fast-moving close quarters combat squad',
    createdAt: 0,
    slots: [
      { slotIndex: 0, role: 'leader', primaryWeapon: 'M4_Carbine', secondaryWeapon: 'Glock17', armor: 'kevlar_vest' },
      { slotIndex: 1, role: 'rifleman', primaryWeapon: 'M4_Carbine', armor: 'kevlar_vest' },
      { slotIndex: 2, role: 'rifleman', primaryWeapon: 'M4_Carbine', armor: 'kevlar_vest' },
      { slotIndex: 3, role: 'support', primaryWeapon: 'M249_SAW', armor: 'tactical_plate_carrier' },
      { slotIndex: 4, role: 'medic', primaryWeapon: 'MP5', armor: 'kevlar_vest', medkits: 3 },
    ]
  },
  {
    id: 'preset-stealth',
    name: 'Stealth Ops',
    description: 'Low-profile infiltration loadout',
    createdAt: 0,
    slots: [
      { slotIndex: 0, role: 'leader', primaryWeapon: 'MP5SD', secondaryWeapon: 'suppressed_pistol', armor: 'light_vest' },
      { slotIndex: 1, role: 'scout', primaryWeapon: 'MP5SD', armor: 'light_vest' },
      { slotIndex: 2, role: 'sniper', primaryWeapon: 'AWM', secondaryWeapon: 'suppressed_pistol', armor: 'ghillie_suit' },
      { slotIndex: 3, role: 'scout', primaryWeapon: 'UMP45', armor: 'light_vest' },
    ]
  },
  {
    id: 'preset-heavy',
    name: 'Heavy Assault',
    description: 'Maximum firepower for tough encounters',
    createdAt: 0,
    slots: [
      { slotIndex: 0, role: 'leader', primaryWeapon: 'FN_SCAR_H', armor: 'tactical_plate_carrier' },
      { slotIndex: 1, role: 'heavy', primaryWeapon: 'M249_SAW', armor: 'heavy_plate_carrier' },
      { slotIndex: 2, role: 'heavy', primaryWeapon: 'M60', armor: 'heavy_plate_carrier' },
      { slotIndex: 3, role: 'rifleman', primaryWeapon: 'AK47', armor: 'tactical_plate_carrier' },
      { slotIndex: 4, role: 'medic', primaryWeapon: 'MP5', armor: 'tactical_plate_carrier', medkits: 4 },
    ]
  },
  {
    id: 'preset-balanced',
    name: 'Balanced Squad',
    description: 'Well-rounded team for any situation',
    createdAt: 0,
    slots: [
      { slotIndex: 0, role: 'leader', primaryWeapon: 'M4_Carbine', secondaryWeapon: 'Glock17', armor: 'tactical_plate_carrier' },
      { slotIndex: 1, role: 'rifleman', primaryWeapon: 'AK47', armor: 'kevlar_vest' },
      { slotIndex: 2, role: 'sniper', primaryWeapon: 'M24_SWS', armor: 'kevlar_vest' },
      { slotIndex: 3, role: 'support', primaryWeapon: 'M249_SAW', armor: 'tactical_plate_carrier' },
      { slotIndex: 4, role: 'medic', primaryWeapon: 'MP5', armor: 'kevlar_vest', medkits: 2 },
    ]
  },
];

// Initialize default presets
DEFAULT_PRESETS.forEach(p => loadoutPresets.set(p.id, p));

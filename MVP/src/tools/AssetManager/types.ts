/**
 * Asset Manager Types
 */

export interface SpriteData {
  index: number;
  col: number;
  row: number;
  name: string;
  category: string;
  tags: string[];
  dataUrl: string;
  width: number;
  height: number;
  selected: boolean;
  // Custom crop offsets for individual cell adjustment
  cropOffsets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface AssetCategory {
  id: string;
  name: string;
  folder: string;
  color: string;
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'character_portrait', name: 'Character Portraits', folder: 'character_portrait', color: '#3b82f6' },
  { id: 'character_token', name: 'Combat Tokens', folder: 'character_token', color: '#ef4444' },
  { id: 'weapon_melee', name: 'Melee Weapons', folder: 'weapon_melee', color: '#f97316' },
  { id: 'weapon_ranged', name: 'Ranged Weapons', folder: 'weapon_ranged', color: '#eab308' },
  { id: 'armor_body', name: 'Body Armor', folder: 'armor_body', color: '#22c55e' },
  { id: 'armor_helmet', name: 'Helmets', folder: 'armor_helmet', color: '#14b8a6' },
  { id: 'gadget_electronic', name: 'Electronic Gadgets', folder: 'gadget_electronic', color: '#06b6d4' },
  { id: 'gadget_explosive', name: 'Explosives', folder: 'gadget_explosive', color: '#f43f5e' },
  { id: 'item_medical', name: 'Medical Items', folder: 'item_medical', color: '#ec4899' },
  { id: 'item_ammo', name: 'Ammunition', folder: 'item_ammo', color: '#8b5cf6' },
  { id: 'ui_icon', name: 'UI Icons', folder: 'ui_icon', color: '#6366f1' },
  { id: 'ui_status', name: 'Status Effects', folder: 'ui_status', color: '#a855f7' },
  { id: 'faction_emblem', name: 'Faction Emblems', folder: 'faction_emblem', color: '#84cc16' },
  { id: 'animal', name: 'Animals', folder: 'animal', color: '#65a30d' },
  { id: 'vehicle', name: 'Vehicles', folder: 'vehicle', color: '#0ea5e9' },
  { id: 'misc', name: 'Miscellaneous', folder: 'misc', color: '#6b7280' },
];

export interface AssetManifest {
  version: string;
  generated: string;
  assets: {
    [category: string]: AssetEntry[];
  };
}

export interface AssetEntry {
  id: string;
  file: string;
  width: number;
  height: number;
  tags: string[];
}

export type AnchorPosition = 'center' | 'bottom' | 'top';

export interface ProcessingOptions {
  removeBackground: boolean;
  backgroundColor: { r: number; g: number; b: number };
  tolerance: number;
  trimTransparent: boolean;
  // Smart crop options
  smartCrop: boolean;
  targetSize: number; // 0 = auto-fit, 64/128/256/512 = fixed square size
  padding: number; // Pixels of padding around content
  anchor: AnchorPosition; // Where to anchor content in output
  aspectRatio: number; // 0 = auto, otherwise width/height ratio (0.714 = 5:7)
}

export const ASPECT_RATIO_PRESETS = [
  { id: 'auto', name: 'Auto (keep original)', value: 0 },
  { id: 'square', name: 'Square (1:1)', value: 1 },
  { id: 'token_5x7', name: 'Token (5:7)', value: 0.714 }, // Character tokens
  { id: 'portrait_2x3', name: 'Portrait (2:3)', value: 0.667 }, // Character portraits
  { id: 'portrait_3x4', name: 'Portrait (3:4)', value: 0.75 },
  { id: 'landscape', name: 'Landscape (4:3)', value: 1.333 },
  { id: 'wide', name: 'Wide (16:9)', value: 1.778 },
];

export const OUTPUT_SIZE_PRESETS = [
  { id: 'auto', name: 'Auto (fit content)', size: 0 },
  { id: '64', name: '64 x 64', size: 64 },
  { id: '128', name: '128 x 128', size: 128 },
  { id: '256', name: '256 x 256', size: 256 },
  { id: '512', name: '512 x 512', size: 512 },
];

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  removeBackground: true,
  backgroundColor: { r: 45, g: 35, b: 60 }, // #2D233C
  tolerance: 15,
  trimTransparent: false,
  smartCrop: true,
  targetSize: 0, // Auto-fit by default
  padding: 4, // 4px padding
  anchor: 'bottom', // Bottom anchor for character sprites
  aspectRatio: 0.714, // 5:7 for character tokens
};

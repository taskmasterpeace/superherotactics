/**
 * ENGINEERING SYSTEM — the Design → Research → Fabricate spine.
 *
 * The rule the whole loop enforces: DESIGNING something is different from
 * MAKING it.
 *
 *  1. DESIGN     — a scientist/specialist drafts a Blueprint for a custom
 *                  suit. The designer's INT and tech aptitude set the
 *                  blueprint's quality; smart designers draft faster.
 *  2. RESEARCH   — the 14 research projects that armor has referenced since
 *                  forever (Metallurgy_1, Stealth_2, Alien_Tech…) become an
 *                  actual tech tree. Completing one unlocks every catalog
 *                  item gated behind it.
 *  3. FABRICATE  — an engineer (the Engineering skill finally does a thing)
 *                  builds a designed blueprint into a REAL armor item at the
 *                  Engineering Lab; craftingBonus speeds the build.
 *
 * Pure data + math. The store owns state; the Engineering Bay renders it.
 */

import type { Armor } from './equipmentTypes';
import { getRoleEffectiveness } from './characterRoles';

// ---------------------------------------------------------------------------
// Research tree — the formerly-dangling researchRequired ids, made real
// ---------------------------------------------------------------------------

export interface ResearchProject {
  id: string;
  name: string;
  field: string;
  tier: number;          // 1-3 (suffix), exotics = 3
  hours: number;         // researcher-hours at INT 50
  cost: number;          // lab materials
  description: string;
  prerequisite?: string; // earlier tier in the same field
}

export const RESEARCH_PROJECTS: ResearchProject[] = [
  { id: 'Metallurgy_1', name: 'Advanced Metallurgy I', field: 'Metallurgy', tier: 1, hours: 48, cost: 8000, description: 'Hardened alloys — unlocks reinforced plate inserts.' },
  { id: 'Metallurgy_2', name: 'Advanced Metallurgy II', field: 'Metallurgy', tier: 2, hours: 96, cost: 20000, description: 'Titanium working and exotic tempering.', prerequisite: 'Metallurgy_1' },
  { id: 'Materials_1', name: 'Composite Materials I', field: 'Materials', tier: 1, hours: 48, cost: 8000, description: 'Carbon fiber lay-ups for light protection.' },
  { id: 'Materials_2', name: 'Composite Materials II', field: 'Materials', tier: 2, hours: 96, cost: 20000, description: 'Ceramic composite armor plates.', prerequisite: 'Materials_1' },
  { id: 'Materials_3', name: 'Composite Materials III', field: 'Materials', tier: 3, hours: 168, cost: 55000, description: 'Graphene weaves — near-weightless protection.', prerequisite: 'Materials_2' },
  { id: 'Electronics_1', name: 'Combat Electronics I', field: 'Electronics', tier: 1, hours: 36, cost: 6000, description: 'Optics and sensor modules (night vision).' },
  { id: 'Electronics_2', name: 'Combat Electronics II', field: 'Electronics', tier: 2, hours: 72, cost: 16000, description: 'HUD visors and thermal imaging.', prerequisite: 'Electronics_1' },
  { id: 'Propulsion_2', name: 'Propulsion Systems II', field: 'Propulsion', tier: 2, hours: 96, cost: 25000, description: 'Jump-jet assisted mobility.' },
  { id: 'Propulsion_3', name: 'Propulsion Systems III', field: 'Propulsion', tier: 3, hours: 168, cost: 60000, description: 'Sustained flight packs.', prerequisite: 'Propulsion_2' },
  { id: 'Stealth_2', name: 'Stealth Systems', field: 'Stealth', tier: 2, hours: 96, cost: 30000, description: 'Signature-dampening coatings.' },
  { id: 'Energy_Tech_2', name: 'Energy Technology', field: 'Energy', tier: 2, hours: 96, cost: 30000, description: 'Energy-dissipating armor layers.' },
  { id: 'Nano_Tech_3', name: 'Nanotechnology', field: 'Nano', tier: 3, hours: 192, cost: 80000, description: 'Self-repairing nano-weaves.' },
  { id: 'Bio_Tech_3', name: 'Biotechnology', field: 'Bio', tier: 3, hours: 192, cost: 80000, description: 'Bio-adaptive armor systems.' },
  { id: 'Alien_Tech', name: 'Xenotechnology', field: 'Xeno', tier: 3, hours: 240, cost: 120000, description: 'Reverse-engineering recovered alien material (Absorbium).' },
];

export function getResearchProject(id: string): ResearchProject | undefined {
  return RESEARCH_PROJECTS.find(p => p.id === id);
}

// ---------------------------------------------------------------------------
// Suit archetypes — what a designer can draft (v1: armor / super-suits)
// ---------------------------------------------------------------------------

export interface SuitArchetype {
  id: string;
  name: string;
  icon: string;
  description: string;
  designHours: number;      // at INT 50; smart designers go faster
  fabricateHours: number;   // at Engineering skill baseline
  materialCost: number;
  // Baseline stats at design quality 50 — quality scales these
  base: { drPhysical: number; drEnergy: number; stoppingPower: number; weight: number; movementPenalty: number; stealthPenalty: number };
  requiredResearch?: string; // gate exotic archetypes behind the tree
}

export const SUIT_ARCHETYPES: SuitArchetype[] = [
  {
    id: 'recon_weave', name: 'Recon Weave', icon: '🥷',
    description: 'Light custom suit — mobility and stealth first, protection second.',
    designHours: 24, fabricateHours: 36, materialCost: 12000,
    base: { drPhysical: 6, drEnergy: 4, stoppingPower: 18, weight: 6, movementPenalty: 0, stealthPenalty: -10 },
  },
  {
    id: 'assault_plate', name: 'Assault Plate', icon: '🛡️',
    description: 'Balanced tactical suit — serious protection a squad can still move in.',
    designHours: 36, fabricateHours: 48, materialCost: 25000,
    base: { drPhysical: 14, drEnergy: 8, stoppingPower: 30, weight: 18, movementPenalty: 1, stealthPenalty: 5 },
  },
  {
    id: 'aegis_bulwark', name: 'Aegis Bulwark', icon: '🏰',
    description: 'Heavy super-suit — walking cover. Requires composite research.',
    designHours: 48, fabricateHours: 72, materialCost: 60000,
    base: { drPhysical: 22, drEnergy: 14, stoppingPower: 45, weight: 35, movementPenalty: 2, stealthPenalty: 15 },
    requiredResearch: 'Materials_2',
  },
  {
    id: 'wraith_shroud', name: 'Wraith Shroud', icon: '👻',
    description: 'Infiltration super-suit with signature dampening. Requires stealth research.',
    designHours: 48, fabricateHours: 60, materialCost: 45000,
    base: { drPhysical: 8, drEnergy: 10, stoppingPower: 22, weight: 8, movementPenalty: 0, stealthPenalty: -20 },
    requiredResearch: 'Stealth_2',
  },
];

// ---------------------------------------------------------------------------
// Blueprints & projects
// ---------------------------------------------------------------------------

export interface Blueprint {
  id: string;
  name: string;              // player-named ("The Kane Rig")
  archetypeId: string;
  designerId: string;
  designerName: string;
  quality: number;           // 0-100 — scales the archetype's base stats
  status: 'drafting' | 'designed' | 'fabricated';
  createdDay: number;
}

export type EngineeringKind = 'design' | 'research' | 'fabricate';

export interface EngineeringProject {
  id: string;
  kind: EngineeringKind;
  label: string;
  characterId: string;
  characterName: string;
  blueprintId?: string;      // design/fabricate
  researchId?: string;       // research
  hoursRemaining: number;
  totalHours: number;
}

// ---------------------------------------------------------------------------
// Math — who you assign MATTERS
// ---------------------------------------------------------------------------

/** Designer quality: INT is the spine, tech-domain aptitude the muscle. */
export function designQuality(char: any): number {
  const int = char?.stats?.INT ?? 50;
  const tech = getRoleEffectiveness(char).tech; // 0-100
  return Math.max(10, Math.min(100, Math.round(int * 0.6 + tech * 0.4)));
}

/** Speed multiplier from INT (design/research): INT 100 = 2x speed, INT 0 = 0.5x. */
export function brainSpeed(char: any): number {
  const int = char?.stats?.INT ?? 50;
  return 0.5 + (int / 100) * 1.5;
}

/** Fabrication speed: the Engineering skill finally does a thing (+25%/level), tech aptitude helps. */
export function engineerSpeed(char: any, craftingBonusPct: number = 0): number {
  const hasSkill = (char?.skills || []).some((s: any) =>
    String(typeof s === 'string' ? s : s?.name || '').toLowerCase().includes('engineer'));
  const skillLevel = hasSkill ? 1 : 0;
  const tech = getRoleEffectiveness(char).tech;
  return (0.75 + skillLevel * 0.25 + (tech / 100) * 0.5) * (1 + craftingBonusPct / 100);
}

/** Turn a finished blueprint into a REAL armor item, stats scaled by quality. */
export function fabricateArmor(blueprint: Blueprint): Armor {
  const arch = SUIT_ARCHETYPES.find(a => a.id === blueprint.archetypeId) || SUIT_ARCHETYPES[0];
  const q = blueprint.quality / 50; // quality 50 = 1.0x, 100 = 2.0x
  const scale = (n: number) => Math.round(n * (0.75 + q * 0.25 + (q - 1) * 0.35));
  return {
    id: `custom_${blueprint.id}`,
    name: blueprint.name,
    category: 'tactical' as any,
    description: `Custom ${arch.name} designed by ${blueprint.designerName} (quality ${blueprint.quality}).`,
    drPhysical: Math.max(1, scale(arch.base.drPhysical)),
    drEnergy: Math.max(0, scale(arch.base.drEnergy)),
    drMental: 0,
    coverage: 'full_body' as any,
    conditionMax: 100 + blueprint.quality,
    stoppingPower: Math.max(5, scale(arch.base.stoppingPower)),
    weight: arch.base.weight,
    strRequired: arch.base.weight > 25 ? 60 : 0,
    movementPenalty: arch.base.movementPenalty,
    stealthPenalty: arch.base.stealthPenalty,
    specialProperties: [
      `Custom-built (${arch.name})`,
      ...(blueprint.quality >= 80 ? ['Masterwork fit: +1CS vs targeting'] : []),
    ],
    costLevel: 'high' as any,
    costValue: arch.materialCost * 2, // resale/valuation
    availability: 'unique' as any,
    emoji: arch.icon,
  } as unknown as Armor;
}

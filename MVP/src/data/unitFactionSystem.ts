/**
 * UNIT FACTIONS (owner "Unit Factions" list) — the STRATEGIC/campaign identity
 * a combat unit belongs to: SPEAR, FIST heroes, the People's World Army, the
 * African Union, Establishment 24, criminals, terrorists, LSWs, civilians.
 *
 * This is deliberately SEPARATE from combat/enemyFactions.ts FactionId, which
 * is the TACTICAL behaviour/equipment archetype (military/police/gang/…). A
 * unit is tagged with BOTH: UnitFaction (who they are in the world / news /
 * diplomacy) + FactionId (how they fight). This layer maps onto the 168
 * per-country organizations already authored in countryOrganizations.ts.
 */

import type { FactionId } from '../combat/enemyFactions';

export type UnitFaction =
  | 'spear'                    // ?? shadow org
  | 'fist_hero'                // US — FIST heroes
  | 'peoples_world_army'       // China
  | 'african_union'            // Nigeria
  | 'establishment_24'         // India
  | 'local_police'
  | 'national_police'
  | 'jackal'
  | 'fist_mercenary'
  | 'hero'
  | 'vigilante'
  | 'super_criminal'
  | 'criminal'
  | 'mercenary'
  | 'terrorist'
  | 'military'
  | 'living_super_weapon'
  | 'vip_civilian'
  | 'civilian';

export interface UnitFactionInfo {
  id: UnitFaction;
  label: string;
  /** country ISO2 when this faction is a specific nation's arm */
  country?: string;
  /** default tactical archetype units of this faction fight as */
  tactics: FactionId;
  hostileToPlayer: boolean;    // default disposition (sandbox can override)
  isCivilian?: boolean;
}

export const UNIT_FACTIONS: Record<UnitFaction, UnitFactionInfo> = {
  spear:               { id: 'spear',               label: 'SPEAR',                     tactics: 'military',  hostileToPlayer: true },
  fist_hero:           { id: 'fist_hero',           label: 'FIST Hero',      country: 'US', tactics: 'military', hostileToPlayer: false },
  peoples_world_army:  { id: 'peoples_world_army',  label: "People's World Army", country: 'CN', tactics: 'military', hostileToPlayer: true },
  african_union:       { id: 'african_union',       label: 'African Union',  country: 'NG', tactics: 'military', hostileToPlayer: false },
  establishment_24:    { id: 'establishment_24',    label: 'Establishment 24', country: 'IN', tactics: 'corporate', hostileToPlayer: false },
  local_police:        { id: 'local_police',        label: 'Local Police Enforcement',    tactics: 'police',    hostileToPlayer: false },
  national_police:     { id: 'national_police',     label: 'National Police Enforcement', tactics: 'police',    hostileToPlayer: false },
  jackal:              { id: 'jackal',              label: 'Jackal',                    tactics: 'cartel',    hostileToPlayer: true },
  fist_mercenary:      { id: 'fist_mercenary',      label: 'FIST Mercenary', country: 'US', tactics: 'mercenary', hostileToPlayer: false },
  hero:                { id: 'hero',                label: 'Hero',                      tactics: 'military',  hostileToPlayer: false },
  vigilante:           { id: 'vigilante',           label: 'Vigilante',                 tactics: 'militia',   hostileToPlayer: false },
  super_criminal:      { id: 'super_criminal',      label: 'Super Criminal',            tactics: 'cartel',    hostileToPlayer: true },
  criminal:            { id: 'criminal',            label: 'Criminal',                  tactics: 'gang',      hostileToPlayer: true },
  mercenary:           { id: 'mercenary',           label: 'Mercenary',                 tactics: 'mercenary', hostileToPlayer: false },
  terrorist:           { id: 'terrorist',           label: 'Terrorist',                 tactics: 'terrorist', hostileToPlayer: true },
  military:            { id: 'military',            label: 'Military',                  tactics: 'military',  hostileToPlayer: false },
  living_super_weapon: { id: 'living_super_weapon', label: 'Living Super Weapon',       tactics: 'military',  hostileToPlayer: true },
  vip_civilian:        { id: 'vip_civilian',        label: 'VIP Civilian',              tactics: 'police',    hostileToPlayer: false, isCivilian: true },
  civilian:            { id: 'civilian',            label: 'Civilians',                 tactics: 'police',    hostileToPlayer: false, isCivilian: true },
};

export function getUnitFaction(id: UnitFaction): UnitFactionInfo {
  return UNIT_FACTIONS[id] || UNIT_FACTIONS.civilian;
}

/** Country ISO2 → its national-arm UnitFaction (bridges to countryOrganizations). */
const COUNTRY_TO_UNIT_FACTION: Record<string, UnitFaction> = {
  US: 'fist_hero', CN: 'peoples_world_army', NG: 'african_union', IN: 'establishment_24',
};
export function unitFactionForCountry(code: string | undefined): UnitFaction {
  if (!code) return 'national_police';
  return COUNTRY_TO_UNIT_FACTION[code.toUpperCase()] || 'national_police';
}

/** Every unit carries BOTH tags: strategic identity + tactical archetype. */
export interface UnitFactionTag {
  unitFaction: UnitFaction;
  tacticalFaction: FactionId;
  hostile: boolean;
}
export function tagUnit(id: UnitFaction, hostileOverride?: boolean): UnitFactionTag {
  const info = getUnitFaction(id);
  return {
    unitFaction: id,
    tacticalFaction: info.tactics,
    hostile: hostileOverride ?? info.hostileToPlayer,
  };
}

/**
 * TRAVEL SPEED (owner 0–9 enum). A squad's strategic-map movement class,
 * from a city-bound walker to a cosmic flyer. Distinct from a vehicle's
 * travelMode (ground/air/water). A squad's effective speed = the best of its
 * vehicle and its members' own movement powers (e.g. a flyer needs no jet).
 *
 * NOTE the owner scale deliberately SKIPS 6 (Planet is 5, Planet-Fast is 7).
 */

export enum TravelSpeed {
  None = 0,
  City = 1,
  CityFast = 2,
  Nation = 3,       // default
  NationFast = 4,
  Planet = 5,
  PlanetFast = 7,
  Cosmic = 8,
  CosmicFast = 9,
}

export const TRAVEL_SPEED_NAME: Record<number, string> = {
  0: 'None', 1: 'City', 2: 'City (Fast)', 3: 'Nation', 4: 'Nation (Fast)',
  5: 'Planet', 7: 'Planet (Fast)', 8: 'Cosmic', 9: 'Cosmic (Fast)',
};

export function getTravelSpeedName(s: number): string {
  return TRAVEL_SPEED_NAME[s] ?? 'Unknown';
}

/** Multiplier applied to base strategic travel time (higher class = faster). */
export function getTravelSpeedMultiplier(s: number): number {
  switch (s) {
    case TravelSpeed.None: return 0;          // cannot self-travel
    case TravelSpeed.City: return 1;
    case TravelSpeed.CityFast: return 1.5;
    case TravelSpeed.Nation: return 2;
    case TravelSpeed.NationFast: return 3;
    case TravelSpeed.Planet: return 5;
    case TravelSpeed.PlanetFast: return 8;
    case TravelSpeed.Cosmic: return 15;
    case TravelSpeed.CosmicFast: return 30;
    default: return 2;
  }
}

/** A character's own movement class from their powers (flyers/speedsters/teleporters). */
export function getCharacterTravelSpeed(char: any): TravelSpeed {
  const names = (char?.powers || []).map((p: any) => String(typeof p === 'string' ? p : p?.name || '').toLowerCase());
  if (names.some((n: string) => /teleport|portal|warp/.test(n))) return TravelSpeed.PlanetFast;
  if (names.some((n: string) => /cosmic|space flight|interstellar/.test(n))) return TravelSpeed.Cosmic;
  if (names.some((n: string) => /super speed|super-speed|lightspeed/.test(n))) return TravelSpeed.NationFast;
  if (names.some((n: string) => /flight|\bfly\b|flight pack/.test(n))) return TravelSpeed.Nation;
  return TravelSpeed.City; // baseline humans walk/drive locally
}

/** A squad's effective class = best of its members and its assigned vehicle. */
export function getSquadTravelSpeed(members: any[], vehicleSpeed: TravelSpeed = TravelSpeed.Nation): TravelSpeed {
  const memberBest = (members || []).reduce<number>((best, m) => Math.max(best, getCharacterTravelSpeed(m)), TravelSpeed.None);
  return Math.max(memberBest, vehicleSpeed) as TravelSpeed;
}

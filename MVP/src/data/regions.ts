/**
 * Cultural regions — the owner's canonical 14-region taxonomy.
 *
 * This is the SINGLE SOURCE OF TRUTH for which region a country belongs to.
 * The raw `cultureCode` fields on cities/countries are historically inconsistent
 * (e.g. US cities mis-tagged 14, Mexico's country record mis-tagged 13), so every
 * system that needs a region — name banks, criminal world, newspaper flavor —
 * should resolve it through here by ISO country code, NOT trust the stored field.
 *
 * Codes & abbreviations are the owner's canonical list.
 */

export interface RegionInfo {
  code: number;
  name: string;
  abbr: string;
}

export const REGIONS: Record<number, RegionInfo> = {
  1: { code: 1, name: 'North Africa', abbr: 'NA' },
  2: { code: 2, name: 'Central Africa', abbr: 'CA' },
  3: { code: 3, name: 'Southern Africa', abbr: 'SAF' },
  4: { code: 4, name: 'Central Asia', abbr: 'CAS' },
  5: { code: 5, name: 'South Asia', abbr: 'SAS' },
  6: { code: 6, name: 'East + South East Asia', abbr: 'SEA' },
  7: { code: 7, name: 'The Caribbean', abbr: 'PAS' },
  8: { code: 8, name: 'Central America', abbr: 'CAM' },
  9: { code: 9, name: 'West Europe', abbr: 'WEU' },
  10: { code: 10, name: 'East Europe', abbr: 'EEU' },
  11: { code: 11, name: 'Oceania', abbr: 'OCE' },
  12: { code: 12, name: 'South America', abbr: 'SAM' },
  13: { code: 13, name: 'North America', abbr: 'NAM' },
  14: { code: 14, name: 'Middle Eastern', abbr: 'MDE' },
};

/**
 * Complete ISO-2 → region-code map for all 167 game countries.
 * Extends the authored crime-region map to full coverage. Africa is split
 * North(1) / sub-Saharan West+Central+East(2) / Southern(3) per the owner's
 * three African codes; Central/Eastern Europe folds into East Europe(10).
 */
export const COUNTRY_REGION: Record<string, number> = {
  // North America (13)
  US: 13, CA: 13,
  // Central America (8)
  MX: 8, GT: 8, HN: 8, SV: 8, NI: 8, PA: 8, BZ: 8, CR: 8,
  // The Caribbean (7)
  CU: 7, HT: 7, DO: 7, JM: 7, TT: 7, BS: 7, PR: 7,
  // South America (12)
  BR: 12, CO: 12, PE: 12, VE: 12, EC: 12, BO: 12, PY: 12, CL: 12, AR: 12, UY: 12, GY: 12, SR: 12,
  // West Europe (9)
  GB: 9, IE: 9, FR: 9, DE: 9, IT: 9, ES: 9, PT: 9, NL: 9, BE: 9, CH: 9, AT: 9, GR: 9,
  NO: 9, SE: 9, FI: 9, DK: 9, IS: 9, AD: 9, MC: 9,
  // East Europe (10)
  RU: 10, UA: 10, BY: 10, PL: 10, RO: 10, BG: 10, RS: 10, HU: 10, CZ: 10, SK: 10,
  HR: 10, AL: 10, MD: 10, GE: 10, AM: 10, AZ: 10, BA: 10, MK: 10, ME: 10, SI: 10,
  EE: 10, LV: 10, LT: 10,
  // Middle Eastern (14)
  SA: 14, IR: 14, IQ: 14, TR: 14, IL: 14, AE: 14, SY: 14, JO: 14, LB: 14, YE: 14,
  OM: 14, QA: 14, KW: 14, BH: 14, PS: 14,
  // Central Asia (4)
  KZ: 4, UZ: 4, TM: 4, KG: 4, TJ: 4, AF: 4,
  // South Asia (5)
  IN: 5, PK: 5, BD: 5, LK: 5, NP: 5, BT: 5,
  // East + South East Asia (6)
  CN: 6, JP: 6, KR: 6, KP: 6, TW: 6, HK: 6, MN: 6, TH: 6, VN: 6, MY: 6, SG: 6,
  ID: 6, PH: 6, MM: 6, KH: 6, LA: 6, BN: 6,
  // Oceania (11)
  AU: 11, NZ: 11, FJ: 11, PG: 11, SB: 11,
  // North Africa (1)
  EG: 1, DZ: 1, MA: 1, TN: 1, LY: 1, SD: 1, EH: 1, MR: 1,
  // Sub-Saharan West/Central/East Africa (2)
  NG: 2, GH: 2, CD: 2, CG: 2, CM: 2, CI: 2, KE: 2, ET: 2, SN: 2, ML: 2, UG: 2, TZ: 2,
  BF: 2, BI: 2, BJ: 2, CF: 2, DJ: 2, ER: 2, GA: 2, GN: 2, GQ: 2, GW: 2, LR: 2, NE: 2,
  RW: 2, SL: 2, SO: 2, SS: 2, ST: 2, TD: 2, TG: 2,
  // Southern Africa (3)
  ZA: 3, ZW: 3, NA: 3, BW: 3, MZ: 3, ZM: 3, AO: 3, SZ: 3, MG: 3, MW: 3,
};

/** Resolve a country's region code from its ISO-2 code (case-insensitive). */
export function getRegionForCountryCode(code: string | undefined | null): number {
  if (!code) return 13;
  return COUNTRY_REGION[code.toUpperCase()] ?? 13;
}

/** Region info (name + abbr) for a region code, with a safe fallback. */
export function getRegionInfo(regionCode: number): RegionInfo {
  return REGIONS[regionCode] ?? REGIONS[13];
}

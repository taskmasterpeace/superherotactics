/**
 * Mercenary Pool System (NL-002)
 *
 * CRITICAL: Mercenaries are COUNTRY-LOCKED.
 * You can only recruit mercenaries from your current country.
 * They are citizens of that nation and won't leave.
 *
 * This creates strategic depth:
 * - Nigeria has different mercs than Switzerland
 * - You must plan team composition before traveling
 * - Local talent varies by country stats (military, education)
 */

import {
  NPCEntity,
  NPCRole,
  generateNPC,
  getNPCManager,
  processNPCCombat,
} from './npcSystem';
import { Country, ALL_COUNTRIES } from './countries';
import { City, getCitiesByCountryCode } from './cities';
import { ThreatLevel } from './characterSheet';
import { getTimeEngine } from './timeEngine';

// =============================================================================
// MERCENARY TYPES
// =============================================================================

export type MercenarySpecialty =
  | 'assault'          // Front-line fighters
  | 'sniper'           // Long-range specialists
  | 'medic'            // Combat medics
  | 'engineer'         // Tech/explosives
  | 'scout'            // Recon/stealth
  | 'heavy'            // Heavy weapons
  | 'driver'           // Vehicle specialists
  | 'generalist';      // Jack of all trades

export interface MercenaryListing {
  npc: NPCEntity;
  specialty: MercenarySpecialty;
  dailyRate: number;
  availability: 'available' | 'on_contract' | 'injured' | 'unavailable';
  rating: number;        // 1-5 stars based on stats
  contractsCompleted: number;
  reputation: string;    // Descriptor
}

export interface MercenaryContract {
  mercenaryId: string;
  employerId: string;    // Player ID or faction
  startDate: number;     // Game timestamp
  endDate?: number;      // Undefined = indefinite
  dailyRate: number;
  totalPaid: number;
  missionsCompleted: number;
  status: 'active' | 'terminated' | 'expired' | 'deserted';
}

// =============================================================================
// COUNTRY POOL CONFIGURATION
// =============================================================================

/**
 * How many mercenaries a country has available
 * Based on military strength, population, corruption
 */
export function calculatePoolSize(country: Country): number {
  // Base pool from military index
  const militaryBase = Math.floor((country.militaryStrength || 50) / 10);

  // Corruption increases black market merc availability
  const corruptionBonus = Math.floor((country.corruption || 50) / 20);

  // Law enforcement reduces illegal merc activity
  const lawPenalty = Math.floor((country.lawEnforcement || 50) / 25);

  // Population matters (more people = more potential mercs)
  // Using GDP as proxy for development
  const populationFactor = Math.min(5, Math.floor((country.gdpPerCapita || 30) / 20));

  const poolSize = Math.max(2, militaryBase + corruptionBonus - lawPenalty + populationFactor);
  return Math.min(15, poolSize); // Cap at 15
}

/**
 * Get threat level distribution for a country
 */
export function getThreatDistribution(country: Country): Record<ThreatLevel, number> {
  const militaryStrength = country.militaryStrength || 50;
  const scienceTech = country.scienceTechnology || 50;

  // High-tech/military countries have better mercs
  if (militaryStrength >= 70 && scienceTech >= 60) {
    return {
      alpha: 0.3,
      level_1: 0.4,
      level_2: 0.2,
      level_3: 0.08,
      level_4: 0.02,
      level_5: 0,
      cosmic: 0,
    };
  }

  // Militarized countries
  if (militaryStrength >= 60) {
    return {
      alpha: 0.4,
      level_1: 0.4,
      level_2: 0.15,
      level_3: 0.05,
      level_4: 0,
      level_5: 0,
      cosmic: 0,
    };
  }

  // Developing countries
  return {
    alpha: 0.6,
    level_1: 0.3,
    level_2: 0.08,
    level_3: 0.02,
    level_4: 0,
    level_5: 0,
    cosmic: 0,
  };
}

/**
 * Determine merc specialty based on stats
 */
function determineSpecialty(npc: NPCEntity): MercenarySpecialty {
  const { MEL, AGL, STR, STA, INT, INS, CON } = npc.stats;

  // Sniper: High AGL + INS
  if (AGL >= 25 && INS >= 25 && AGL + INS > MEL + STR) {
    return 'sniper';
  }

  // Medic: High INT + CON
  if (INT >= 25 && CON >= 20) {
    return 'medic';
  }

  // Engineer: High INT + moderate physical
  if (INT >= 28) {
    return 'engineer';
  }

  // Heavy: High STR + STA
  if (STR >= 28 && STA >= 25) {
    return 'heavy';
  }

  // Scout: High AGL + INS, low STR
  if (AGL >= 22 && INS >= 22 && STR < 20) {
    return 'scout';
  }

  // Assault: High MEL + balanced
  if (MEL >= 22 && AGL >= 18 && STR >= 18) {
    return 'assault';
  }

  // Driver: Moderate all, high INS
  if (INS >= 20 && AGL >= 18) {
    return 'driver';
  }

  return 'generalist';
}

/**
 * Calculate mercenary rating (1-5 stars)
 */
function calculateRating(npc: NPCEntity): number {
  const { MEL, AGL, STR, STA, INT, INS, CON } = npc.stats;
  const avgStat = (MEL + AGL + STR + STA + INT + INS + CON) / 7;

  if (avgStat >= 40) return 5;
  if (avgStat >= 32) return 4;
  if (avgStat >= 24) return 3;
  if (avgStat >= 16) return 2;
  return 1;
}

/**
 * Get reputation descriptor
 */
function getReputationDesc(npc: NPCEntity, contractsCompleted: number): string {
  if (contractsCompleted >= 20) return 'Legendary';
  if (contractsCompleted >= 10) return 'Veteran';
  if (contractsCompleted >= 5) return 'Experienced';
  if (contractsCompleted >= 1) return 'Proven';

  // New mercs get desc based on stats
  const rating = calculateRating(npc);
  if (rating >= 4) return 'Promising';
  if (rating >= 3) return 'Competent';
  return 'Green';
}

// =============================================================================
// MERCENARY POOL MANAGER
// =============================================================================

let poolManagerInstance: MercenaryPoolManager | null = null;

export class MercenaryPoolManager {
  private pools: Map<string, MercenaryListing[]> = new Map();
  private contracts: Map<string, MercenaryContract> = new Map();
  private playerMercs: Set<string> = new Set();
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    // Refresh pools weekly
    const timeEngine = getTimeEngine();
    timeEngine.on('day_change', (time) => {
      if (time.date.day % 7 === 1) {
        this.refreshAllPools();
      }
    });
  }

  /**
   * Initialize pool for a country
   */
  initializePool(country: Country): void {
    const poolSize = calculatePoolSize(country);
    const cities = getCitiesByCountryCode(country.code);
    const distribution = getThreatDistribution(country);

    const listings: MercenaryListing[] = [];

    for (let i = 0; i < poolSize; i++) {
      // Pick random city in country
      const city = cities[Math.floor(Math.random() * cities.length)];
      if (!city) continue;

      // Determine threat level
      const roll = Math.random();
      let cumulative = 0;
      let threatLevel: ThreatLevel = 'alpha';

      for (const [level, prob] of Object.entries(distribution)) {
        cumulative += prob;
        if (roll <= cumulative) {
          threatLevel = level as ThreatLevel;
          break;
        }
      }

      // Generate merc NPC
      const npc = generateNPC(country, city, 'mercenary', {
        threatLevel,
        minAge: 22,
        maxAge: 50,
      });

      // Add to NPC manager
      getNPCManager().addNPC(npc);

      // Create listing
      const specialty = determineSpecialty(npc);
      const rating = calculateRating(npc);

      listings.push({
        npc,
        specialty,
        dailyRate: npc.salary || 200,
        availability: 'available',
        rating,
        contractsCompleted: Math.floor(Math.random() * 5),
        reputation: getReputationDesc(npc, 0),
      });
    }

    this.pools.set(country.code, listings);
  }

  /**
   * Get available mercenaries in a country
   * COUNTRY-LOCKED: Only returns mercs from specified country
   */
  getAvailableMercs(countryCode: string): MercenaryListing[] {
    let pool = this.pools.get(countryCode);

    // Initialize pool if doesn't exist
    if (!pool) {
      const countries = ALL_COUNTRIES;
      const country = countries.find(c => c.code === countryCode);
      if (country) {
        this.initializePool(country);
        pool = this.pools.get(countryCode);
      }
    }

    return (pool || []).filter(
      listing => listing.availability === 'available'
    );
  }

  /**
   * Get all mercenaries in a country (including unavailable)
   */
  getAllMercsInCountry(countryCode: string): MercenaryListing[] {
    return this.pools.get(countryCode) || [];
  }

  /**
   * Hire a mercenary
   * Returns contract or null if unavailable
   */
  hireMercenary(
    mercenaryId: string,
    employerId: string,
    dailyRate?: number
  ): MercenaryContract | null {
    // Find the merc
    for (const [countryCode, pool] of this.pools) {
      const listing = pool.find(l => l.npc.id === mercenaryId);
      if (listing && listing.availability === 'available') {
        const timeEngine = getTimeEngine();
        const timestamp = timeEngine.getTime().totalHours;

        // Create contract
        const contract: MercenaryContract = {
          mercenaryId,
          employerId,
          startDate: timestamp,
          dailyRate: dailyRate ?? listing.dailyRate,
          totalPaid: 0,
          missionsCompleted: 0,
          status: 'active',
        };

        // Update listing
        listing.availability = 'on_contract';

        // Update NPC
        const npcManager = getNPCManager();
        const npc = npcManager.getNPC(mercenaryId);
        if (npc) {
          npc.isEmployed = true;
          npc.employer = employerId;
          npc.salary = contract.dailyRate;
          npcManager.updateNPC(npc);
        }

        // Store contract
        this.contracts.set(mercenaryId, contract);

        if (employerId === 'player') {
          this.playerMercs.add(mercenaryId);
        }

        return contract;
      }
    }

    return null;
  }

  /**
   * Fire/release a mercenary
   */
  fireMercenary(mercenaryId: string): boolean {
    const contract = this.contracts.get(mercenaryId);
    if (!contract || contract.status !== 'active') return false;

    // Update contract
    const timeEngine = getTimeEngine();
    contract.endDate = timeEngine.getTime().totalHours;
    contract.status = 'terminated';

    // Find and update listing
    for (const [countryCode, pool] of this.pools) {
      const listing = pool.find(l => l.npc.id === mercenaryId);
      if (listing) {
        listing.availability = 'available';
        listing.contractsCompleted++;
        listing.reputation = getReputationDesc(listing.npc, listing.contractsCompleted);
        break;
      }
    }

    // Update NPC
    const npcManager = getNPCManager();
    const npc = npcManager.getNPC(mercenaryId);
    if (npc) {
      npc.isEmployed = false;
      npc.employer = undefined;
      npcManager.updateNPC(npc);
    }

    this.playerMercs.delete(mercenaryId);

    return true;
  }

  /**
   * Get player's hired mercenaries
   */
  getPlayerMercs(): NPCEntity[] {
    const npcManager = getNPCManager();
    return Array.from(this.playerMercs)
      .map(id => npcManager.getNPC(id))
      .filter((npc): npc is NPCEntity => npc !== undefined && npc.isAlive);
  }

  /**
   * Process merc combat result
   */
  processMercCombat(
    mercenaryId: string,
    outcome: {
      npcWon: boolean;
      npcKilled: boolean;
      playerSparedNPC: boolean;
      damageTaken: number;
    }
  ): void {
    const contract = this.contracts.get(mercenaryId);
    if (!contract) return;

    const npcManager = getNPCManager();
    let npc = npcManager.getNPC(mercenaryId);
    if (!npc) return;

    // Process combat
    npc = processNPCCombat(npc, outcome);
    npcManager.updateNPC(npc);

    // Update contract
    if (!outcome.npcKilled) {
      contract.missionsCompleted++;
    }

    // Update listing availability
    for (const pool of this.pools.values()) {
      const listing = pool.find(l => l.npc.id === mercenaryId);
      if (listing) {
        if (outcome.npcKilled) {
          listing.availability = 'unavailable';
        } else if (npc.isHospitalized) {
          listing.availability = 'injured';
        }
        break;
      }
    }

    // If killed, remove from player mercs
    if (outcome.npcKilled) {
      this.playerMercs.delete(mercenaryId);
      contract.status = 'terminated';
    }
  }

  /**
   * Pay daily wages to all employed mercs
   */
  payDailyWages(): number {
    let totalPaid = 0;

    for (const mercId of this.playerMercs) {
      const contract = this.contracts.get(mercId);
      if (contract && contract.status === 'active') {
        contract.totalPaid += contract.dailyRate;
        totalPaid += contract.dailyRate;
      }
    }

    return totalPaid;
  }

  /**
   * Refresh all pools (add new mercs, process changes)
   */
  private refreshAllPools(): void {
    for (const [countryCode, pool] of this.pools) {
      // Remove dead/unavailable mercs
      const activePool = pool.filter(l =>
        l.availability !== 'unavailable' && l.npc.isAlive
      );

      // Check if we need to add new mercs
      const countries = ALL_COUNTRIES;
      const country = countries.find(c => c.code === countryCode);
      if (country) {
        const targetSize = calculatePoolSize(country);
        const availableCount = activePool.filter(l => l.availability === 'available').length;

        // Add new mercs if pool is depleted
        if (availableCount < targetSize * 0.5) {
          const newCount = Math.min(3, targetSize - availableCount);
          const cities = getCitiesByCountryCode(countryCode);

          for (let i = 0; i < newCount; i++) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            if (!city) continue;

            const npc = generateNPC(country, city, 'mercenary', {
              minAge: 22,
              maxAge: 50,
            });

            getNPCManager().addNPC(npc);

            activePool.push({
              npc,
              specialty: determineSpecialty(npc),
              dailyRate: npc.salary || 200,
              availability: 'available',
              rating: calculateRating(npc),
              contractsCompleted: 0,
              reputation: getReputationDesc(npc, 0),
            });
          }
        }
      }

      this.pools.set(countryCode, activePool);
    }
  }

  /**
   * Get hiring cost for a country (reflects local economy)
   */
  getHiringBonus(countryCode: string): number {
    const countries = ALL_COUNTRIES;
    const country = countries.find(c => c.code === countryCode);
    if (!country) return 0;

    // Corrupt countries have cheaper mercs
    const corruptionDiscount = (country.corruption || 50) / 200;

    // High law enforcement means premium prices
    const lawPremium = (country.lawEnforcement || 50) / 100;

    return corruptionDiscount - lawPremium;
  }
}

export function getMercenaryPoolManager(): MercenaryPoolManager {
  if (!poolManagerInstance) {
    poolManagerInstance = new MercenaryPoolManager();
  }
  return poolManagerInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  calculatePoolSize,
  getThreatDistribution,
  getMercenaryPoolManager,
};

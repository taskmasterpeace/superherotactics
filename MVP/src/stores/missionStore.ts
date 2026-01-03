/**
 * Mission Store Extension
 * Adds mission generation and management to the game store
 */

import { GeneratedMission } from '../data/missionSystem';
import {
  generateMissionsForSector,
  generateMissionsForCountry,
  refreshSectorMissions,
  getRecommendedMissions,
  MissionRecommendation,
} from '../data/missionGeneration';
import { getCountryByName } from '../data/countries';
import { generateMissionBriefing } from '../data/emailSystem';

// =============================================================================
// MISSION STORE STATE
// =============================================================================

export interface MissionStoreState {
  // Mission data
  availableMissions: Map<string, GeneratedMission[]>;  // sector -> missions[]
  activeMissions: GeneratedMission[];  // Missions currently in progress
  completedMissions: GeneratedMission[];  // Mission history

  // Mission generation settings
  lastMissionGeneration: number;  // Game time when missions were last generated
  missionRefreshInterval: number;  // How often missions refresh (in game hours)
}

export interface MissionStoreActions {
  // Mission generation
  generateMissionsForSector: (sectorCode: string) => void;
  generateMissionsForAllSectors: () => void;

  // Mission retrieval
  getMissionsForSector: (sectorCode: string) => GeneratedMission[];
  getActiveMissions: () => GeneratedMission[];
  getRecommendations: (squadThreatLevel: number, squadSize: number) => MissionRecommendation[];

  // Mission management
  acceptMission: (missionId: string) => void;
  completeMissionById: (missionId: string, success: boolean) => void;
  abandonMission: (missionId: string) => void;

  // Mission lifecycle
  expireMissions: () => void;  // Called by time system to expire old missions
  refreshMissions: () => void;  // Refresh all missions
}

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialMissionState: MissionStoreState = {
  availableMissions: new Map(),
  activeMissions: [],
  completedMissions: [],
  lastMissionGeneration: 0,
  missionRefreshInterval: 24,  // Refresh every 24 game hours
};

// =============================================================================
// MISSION STORE ACTIONS (to be integrated into main store)
// =============================================================================

export function createMissionActions(set: any, get: any): MissionStoreActions {
  return {
    /**
     * Generate missions for a specific sector
     */
    generateMissionsForSector: (sectorCode: string) => {
      const state = get();
      const country = getCountryByName(state.selectedCountry);

      if (!country) {
        console.warn(`Country not found: ${state.selectedCountry}`);
        return;
      }

      const missions = generateMissionsForSector(sectorCode, country);

      set((state: any) => {
        const newAvailableMissions = new Map(state.availableMissions);
        newAvailableMissions.set(sectorCode, missions);

        return {
          availableMissions: newAvailableMissions,
        };
      });

      console.log(`Generated ${missions.length} missions for sector ${sectorCode}`);
    },

    /**
     * Generate missions for all sectors
     */
    generateMissionsForAllSectors: () => {
      const state = get();
      const country = getCountryByName(state.selectedCountry);

      if (!country) {
        console.warn(`Country not found: ${state.selectedCountry}`);
        return;
      }

      const allMissions = generateMissionsForCountry(country);

      set({
        availableMissions: allMissions,
        lastMissionGeneration: state.gameTime.minutes + (state.gameTime.day * 1440),
      });

      const totalMissions = Array.from(allMissions.values()).reduce((sum, missions) => sum + missions.length, 0);
      console.log(`Generated ${totalMissions} missions across all sectors`);
    },

    /**
     * Get missions for a specific sector
     */
    getMissionsForSector: (sectorCode: string): GeneratedMission[] => {
      const state = get();
      return state.availableMissions.get(sectorCode) ?? [];
    },

    /**
     * Get all active missions
     */
    getActiveMissions: (): GeneratedMission[] => {
      const state = get();
      return state.activeMissions;
    },

    /**
     * Get mission recommendations for current squad
     */
    getRecommendations: (squadThreatLevel: number, squadSize: number): MissionRecommendation[] => {
      const state = get();
      const currentSectorMissions = state.availableMissions.get(state.currentSector) ?? [];

      return getRecommendedMissions(currentSectorMissions, squadThreatLevel, squadSize);
    },

    /**
     * Accept a mission
     */
    acceptMission: (missionId: string) => {
      set((state: any) => {
        // Find the mission in available missions
        let foundMission: GeneratedMission | null = null;
        const newAvailableMissions = new Map(state.availableMissions);

        for (const [sector, missions] of newAvailableMissions.entries()) {
          const missionIndex = missions.findIndex((m: GeneratedMission) => m.id === missionId);
          if (missionIndex !== -1) {
            foundMission = missions[missionIndex];

            // Remove from available missions
            const updatedMissions = [...missions];
            updatedMissions.splice(missionIndex, 1);
            newAvailableMissions.set(sector, updatedMissions);
            break;
          }
        }

        if (!foundMission) {
          console.warn(`Mission not found: ${missionId}`);
          return state;
        }

        // Update mission status
        foundMission.status = 'accepted';

        // Generate mission briefing email
        generateMissionBriefing(
          foundMission.name,
          foundMission.id,
          foundMission.briefing || foundMission.description,
          {
            city: foundMission.targetCity,
            country: foundMission.targetCountry
          },
          foundMission.rewards?.cash || 0
        );

        return {
          availableMissions: newAvailableMissions,
          activeMissions: [...state.activeMissions, foundMission],
        };
      });
    },

    /**
     * Complete a mission
     */
    completeMissionById: (missionId: string, success: boolean) => {
      set((state: any) => {
        const missionIndex = state.activeMissions.findIndex((m: GeneratedMission) => m.id === missionId);

        if (missionIndex === -1) {
          console.warn(`Active mission not found: ${missionId}`);
          return state;
        }

        const mission = state.activeMissions[missionIndex];
        mission.status = success ? 'completed' : 'failed';

        // Set completion timestamp for weekly tracking
        if (success) {
          const gameStore = (window as any).__gameStore || {};
          mission.completedAt = gameStore.gameTime?.day || 0;
        }

        // Remove from active missions
        const newActiveMissions = [...state.activeMissions];
        newActiveMissions.splice(missionIndex, 1);

        return {
          activeMissions: newActiveMissions,
          completedMissions: [...state.completedMissions, mission],
        };
      });
    },

    /**
     * Abandon a mission
     */
    abandonMission: (missionId: string) => {
      set((state: any) => {
        const missionIndex = state.activeMissions.findIndex((m: GeneratedMission) => m.id === missionId);

        if (missionIndex === -1) {
          console.warn(`Active mission not found: ${missionId}`);
          return state;
        }

        // Remove from active missions (could add to failed missions)
        const newActiveMissions = [...state.activeMissions];
        newActiveMissions.splice(missionIndex, 1);

        return {
          activeMissions: newActiveMissions,
        };
      });
    },

    /**
     * Expire old missions (called by time system)
     */
    expireMissions: () => {
      const state = get();
      const currentGameTime = state.gameTime.minutes + (state.gameTime.day * 1440);

      set((state: any) => {
        const newAvailableMissions = new Map(state.availableMissions);
        let expiredCount = 0;

        // Check each sector's missions
        for (const [sector, missions] of newAvailableMissions.entries()) {
          const validMissions = missions.filter((mission: GeneratedMission) => {
            if (mission.expiresAt && mission.expiresAt < currentGameTime) {
              expiredCount++;
              return false;
            }
            return true;
          });

          newAvailableMissions.set(sector, validMissions);
        }

        if (expiredCount > 0) {
          console.log(`Expired ${expiredCount} missions`);
        }

        return {
          availableMissions: newAvailableMissions,
        };
      });
    },

    /**
     * Refresh all missions (regenerate)
     */
    refreshMissions: () => {
      const actions = createMissionActions(set, get);
      actions.generateMissionsForAllSectors();
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if missions need refreshing based on time
 */
export function shouldRefreshMissions(state: MissionStoreState & { gameTime: any }): boolean {
  const currentGameTime = state.gameTime.minutes + (state.gameTime.day * 1440);
  const timeSinceLastGeneration = currentGameTime - state.lastMissionGeneration;
  const refreshIntervalMinutes = state.missionRefreshInterval * 60;

  return timeSinceLastGeneration >= refreshIntervalMinutes;
}

/**
 * Get mission statistics
 */
export function getMissionStatistics(state: MissionStoreState): {
  totalAvailable: number;
  totalActive: number;
  totalCompleted: number;
  successRate: number;
} {
  const totalAvailable = Array.from(state.availableMissions.values())
    .reduce((sum, missions) => sum + missions.length, 0);

  const totalActive = state.activeMissions.length;
  const totalCompleted = state.completedMissions.length;

  const successfulMissions = state.completedMissions.filter(
    (m: GeneratedMission) => m.status === 'completed'
  ).length;

  const successRate = totalCompleted > 0 ? (successfulMissions / totalCompleted) * 100 : 0;

  return {
    totalAvailable,
    totalActive,
    totalCompleted,
    successRate,
  };
}

// =============================================================================
// CHARACTER REGISTRY
// =============================================================================
// Track every character in the game world - alive, dead, relationships

import type { PrimaryStats } from '../characterSheet';

// =============================================================================
// CHARACTER STATUS
// =============================================================================

export type CharacterStatus =
  | 'alive'
  | 'injured'
  | 'critical'
  | 'missing'
  | 'captured'
  | 'dead'
  | 'unknown';

export type CharacterFaction =
  | 'player' // Player's organization
  | 'ally' // Allied NPCs
  | 'neutral' // Civilians, unaligned
  | 'hostile' // Enemies
  | 'government' // Law enforcement, military
  | 'criminal'; // Underworld

export interface RegisteredCharacter {
  id: string;
  name: string;
  codename?: string;
  faction: CharacterFaction;
  status: CharacterStatus;

  // Timestamps
  createdDate: Date;
  lastSeenDate: Date;
  deathDate?: Date;

  // Location
  lastKnownLocation?: string; // City or sector
  homeBase?: string;

  // Stats snapshot (for dead/missing - preserves their state)
  statsSnapshot?: Partial<PrimaryStats>;

  // Cause of death if applicable
  causeOfDeath?: string;
  killedBy?: string; // Character ID of killer

  // Metadata
  isImportant: boolean; // Story-critical character
  biography?: string;
  notes: string[];
}

// =============================================================================
// RELATIONSHIPS
// =============================================================================

export type RelationshipType =
  | 'family' // Blood relatives
  | 'romantic' // Partners, spouses
  | 'friend' // Close friends
  | 'colleague' // Work relationship
  | 'mentor' // Teacher/student
  | 'rival' // Competition
  | 'enemy' // Active hostility
  | 'acquaintance'; // Know each other

export interface CharacterRelationship {
  id: string;
  characterA: string; // Character ID
  characterB: string; // Character ID
  type: RelationshipType;
  strength: number; // -100 to +100
  since: Date;
  description?: string;
  isMutual: boolean; // Same on both sides?
}

// =============================================================================
// REGISTRY STATE
// =============================================================================

export interface CharacterRegistryState {
  characters: Map<string, RegisteredCharacter>;
  relationships: CharacterRelationship[];
  deathLog: DeathLogEntry[];
}

export interface DeathLogEntry {
  characterId: string;
  characterName: string;
  date: Date;
  cause: string;
  location: string;
  killedBy?: string;
  witnessed: boolean; // Did player witness this?
}

// =============================================================================
// REGISTRY FUNCTIONS
// =============================================================================

export function createCharacterRegistry(): CharacterRegistryState {
  return {
    characters: new Map(),
    relationships: [],
    deathLog: [],
  };
}

export function registerCharacter(
  registry: CharacterRegistryState,
  character: Omit<RegisteredCharacter, 'id' | 'createdDate' | 'lastSeenDate' | 'notes'>
): RegisteredCharacter {
  const id = `char-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = new Date();

  const registered: RegisteredCharacter = {
    ...character,
    id,
    createdDate: now,
    lastSeenDate: now,
    notes: [],
  };

  registry.characters.set(id, registered);
  return registered;
}

export function updateCharacterStatus(
  registry: CharacterRegistryState,
  characterId: string,
  status: CharacterStatus,
  details?: {
    causeOfDeath?: string;
    killedBy?: string;
    location?: string;
  }
): void {
  const character = registry.characters.get(characterId);
  if (!character) return;

  character.status = status;
  character.lastSeenDate = new Date();

  if (status === 'dead' && details) {
    character.deathDate = new Date();
    character.causeOfDeath = details.causeOfDeath;
    character.killedBy = details.killedBy;

    // Add to death log
    registry.deathLog.push({
      characterId,
      characterName: character.name,
      date: new Date(),
      cause: details.causeOfDeath || 'Unknown',
      location: details.location || character.lastKnownLocation || 'Unknown',
      killedBy: details.killedBy,
      witnessed: false,
    });
  }
}

export function addRelationship(
  registry: CharacterRegistryState,
  characterA: string,
  characterB: string,
  type: RelationshipType,
  strength: number = 50,
  isMutual: boolean = true
): CharacterRelationship {
  const relationship: CharacterRelationship = {
    id: `rel-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    characterA,
    characterB,
    type,
    strength: Math.max(-100, Math.min(100, strength)),
    since: new Date(),
    isMutual,
  };

  registry.relationships.push(relationship);
  return relationship;
}

export function getRelationshipsBetween(
  registry: CharacterRegistryState,
  characterA: string,
  characterB: string
): CharacterRelationship[] {
  return registry.relationships.filter(
    r => (r.characterA === characterA && r.characterB === characterB) ||
         (r.characterA === characterB && r.characterB === characterA && r.isMutual)
  );
}

export function getCharacterRelationships(
  registry: CharacterRegistryState,
  characterId: string
): CharacterRelationship[] {
  return registry.relationships.filter(
    r => r.characterA === characterId ||
         (r.characterB === characterId && r.isMutual)
  );
}

// =============================================================================
// QUERIES
// =============================================================================

export function getAliveCharacters(
  registry: CharacterRegistryState,
  faction?: CharacterFaction
): RegisteredCharacter[] {
  const results: RegisteredCharacter[] = [];

  registry.characters.forEach(char => {
    if (char.status === 'alive' || char.status === 'injured') {
      if (!faction || char.faction === faction) {
        results.push(char);
      }
    }
  });

  return results;
}

export function getDeadCharacters(
  registry: CharacterRegistryState,
  faction?: CharacterFaction
): RegisteredCharacter[] {
  const results: RegisteredCharacter[] = [];

  registry.characters.forEach(char => {
    if (char.status === 'dead') {
      if (!faction || char.faction === faction) {
        results.push(char);
      }
    }
  });

  return results;
}

export function getKillCount(
  registry: CharacterRegistryState,
  killerCharacterId: string
): number {
  return registry.deathLog.filter(d => d.killedBy === killerCharacterId).length;
}

export function getCharacterHistory(
  registry: CharacterRegistryState,
  characterId: string
): {
  character: RegisteredCharacter | undefined;
  relationships: CharacterRelationship[];
  kills: DeathLogEntry[];
  killedBy?: DeathLogEntry;
} {
  const character = registry.characters.get(characterId);
  const relationships = getCharacterRelationships(registry, characterId);
  const kills = registry.deathLog.filter(d => d.killedBy === characterId);
  const killedBy = registry.deathLog.find(d => d.characterId === characterId);

  return { character, relationships, kills, killedBy };
}

// =============================================================================
// RELATIONSHIP MODIFIERS
// =============================================================================

export const RELATIONSHIP_EVENTS = {
  // Positive events
  saved_life: { modifier: 30, description: 'Saved their life' },
  completed_mission_together: { modifier: 10, description: 'Completed mission together' },
  shared_secret: { modifier: 15, description: 'Shared a secret' },
  gift_given: { modifier: 5, description: 'Gave a gift' },
  defended_reputation: { modifier: 10, description: 'Defended their reputation' },

  // Negative events
  betrayed: { modifier: -50, description: 'Betrayal' },
  friendly_fire: { modifier: -20, description: 'Friendly fire incident' },
  left_behind: { modifier: -30, description: 'Left behind in danger' },
  insult: { modifier: -10, description: 'Insulted them' },
  killed_friend: { modifier: -40, description: 'Killed their friend' },
} as const;

export function modifyRelationship(
  registry: CharacterRegistryState,
  characterA: string,
  characterB: string,
  event: keyof typeof RELATIONSHIP_EVENTS
): void {
  const relationships = getRelationshipsBetween(registry, characterA, characterB);
  const modifier = RELATIONSHIP_EVENTS[event].modifier;

  relationships.forEach(rel => {
    rel.strength = Math.max(-100, Math.min(100, rel.strength + modifier));
  });

  // If no relationship exists, create one
  if (relationships.length === 0) {
    addRelationship(
      registry,
      characterA,
      characterB,
      modifier > 0 ? 'acquaintance' : 'rival',
      50 + modifier
    );
  }
}

// =============================================================================
// CHARACTER REGISTRY MANAGER (Singleton)
// =============================================================================

let characterRegistryManagerInstance: CharacterRegistryManager | null = null;

/**
 * Manager wrapper for the character registry.
 * Provides singleton access and wires to other game systems.
 */
export class CharacterRegistryManager {
  private registry: CharacterRegistryState;
  private started: boolean = false;

  constructor() {
    this.registry = createCharacterRegistry();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    console.log('[CHARACTER REGISTRY] Started');
  }

  // =========================================================================
  // REGISTRATION
  // =========================================================================

  /**
   * Register a new character in the game world
   */
  register(
    character: Omit<RegisteredCharacter, 'id' | 'createdDate' | 'lastSeenDate' | 'notes'>
  ): RegisteredCharacter {
    return registerCharacter(this.registry, character);
  }

  /**
   * Get a character by ID
   */
  getCharacter(id: string): RegisteredCharacter | undefined {
    return this.registry.characters.get(id);
  }

  /**
   * Get all characters
   */
  getAllCharacters(): RegisteredCharacter[] {
    return Array.from(this.registry.characters.values());
  }

  // =========================================================================
  // STATUS UPDATES
  // =========================================================================

  /**
   * Update a character's status (alive, injured, dead, etc.)
   */
  updateStatus(
    characterId: string,
    status: CharacterStatus,
    details?: {
      causeOfDeath?: string;
      killedBy?: string;
      location?: string;
    }
  ): void {
    updateCharacterStatus(this.registry, characterId, status, details);
  }

  /**
   * Record a character's death
   */
  recordDeath(
    characterId: string,
    cause: string,
    location: string,
    killedBy?: string,
    witnessed: boolean = false
  ): void {
    const character = this.registry.characters.get(characterId);
    if (!character) return;

    updateCharacterStatus(this.registry, characterId, 'dead', {
      causeOfDeath: cause,
      killedBy,
      location,
    });

    // Update witnessed flag
    const deathEntry = this.registry.deathLog.find(d => d.characterId === characterId);
    if (deathEntry) {
      deathEntry.witnessed = witnessed;
    }
  }

  // =========================================================================
  // RELATIONSHIPS
  // =========================================================================

  /**
   * Create a relationship between two characters
   */
  createRelationship(
    characterA: string,
    characterB: string,
    type: RelationshipType,
    strength: number = 50,
    isMutual: boolean = true
  ): CharacterRelationship {
    return addRelationship(this.registry, characterA, characterB, type, strength, isMutual);
  }

  /**
   * Modify a relationship based on an event
   */
  applyRelationshipEvent(
    characterA: string,
    characterB: string,
    event: keyof typeof RELATIONSHIP_EVENTS
  ): void {
    modifyRelationship(this.registry, characterA, characterB, event);
  }

  /**
   * Get all relationships for a character
   */
  getRelationships(characterId: string): CharacterRelationship[] {
    return getCharacterRelationships(this.registry, characterId);
  }

  // =========================================================================
  // QUERIES
  // =========================================================================

  /**
   * Get all living characters, optionally filtered by faction
   */
  getLivingCharacters(faction?: CharacterFaction): RegisteredCharacter[] {
    return getAliveCharacters(this.registry, faction);
  }

  /**
   * Get all dead characters, optionally filtered by faction
   */
  getDeceasedCharacters(faction?: CharacterFaction): RegisteredCharacter[] {
    return getDeadCharacters(this.registry, faction);
  }

  /**
   * Get the death log
   */
  getDeathLog(): DeathLogEntry[] {
    return [...this.registry.deathLog];
  }

  /**
   * Get a character's full history
   */
  getHistory(characterId: string) {
    return getCharacterHistory(this.registry, characterId);
  }

  /**
   * Get kill count for a character
   */
  getKills(characterId: string): number {
    return getKillCount(this.registry, characterId);
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  /**
   * Serialize state for saving
   */
  serialize(): object {
    return {
      characters: Array.from(this.registry.characters.entries()),
      relationships: this.registry.relationships,
      deathLog: this.registry.deathLog,
    };
  }

  /**
   * Deserialize state from save
   */
  deserialize(data: any): void {
    if (data.characters) {
      this.registry.characters = new Map(data.characters);
    }
    if (data.relationships) {
      this.registry.relationships = data.relationships;
    }
    if (data.deathLog) {
      this.registry.deathLog = data.deathLog;
    }
  }
}

/**
 * Get the singleton character registry manager
 */
export function getCharacterRegistryManager(): CharacterRegistryManager {
  if (!characterRegistryManagerInstance) {
    characterRegistryManagerInstance = new CharacterRegistryManager();
  }
  return characterRegistryManagerInstance;
}

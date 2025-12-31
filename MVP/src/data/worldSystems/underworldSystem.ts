// =============================================================================
// UNDERWORLD SYSTEM
// =============================================================================
// Black market, smuggling, criminal contacts, and illegal operations

// =============================================================================
// TYPES
// =============================================================================

export interface BlackMarketAccess {
  available: boolean;
  accessLevel: number; // 0-100
  priceMultiplier: number; // 1.5-3x normal prices
  stingRisk: number; // % chance of law enforcement trap
  availableCategories: EquipmentCategory[];
}

export type EquipmentCategory =
  | 'small_arms'
  | 'heavy_weapons'
  | 'explosives'
  | 'armor'
  | 'vehicles'
  | 'drugs'
  | 'fake_documents'
  | 'surveillance'
  | 'restricted_tech';

export interface SmugglerContact {
  id: string;
  name: string;
  codename: string;
  specialties: EquipmentCategory[];
  reliability: number; // 0-100 (will they deliver?)
  discretion: number; // 0-100 (will they rat you out?)
  priceModifier: number; // 0.8-1.5 (discount/markup from base)
  location: string; // City where they operate
  isCompromised: boolean;
}

export interface UnderworldDeal {
  id: string;
  contactId: string;
  items: { itemId: string; quantity: number }[];
  totalPrice: number;
  deliveryDays: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'seized' | 'failed';
  risk: number;
}

// =============================================================================
// BLACK MARKET ACCESS CALCULATION
// =============================================================================

export function calculateBlackMarketAccess(
  corruption: number, // 0-100
  military: number, // 0-100 (higher = more weapons circulating)
  lawEnforcement: number // 0-100 (higher = harder to access)
): BlackMarketAccess {
  // Formula: Access = (Corruption + Military/2 - LawEnforcement) clamped 0-100
  const accessLevel = Math.max(0, Math.min(100,
    corruption + (military / 2) - lawEnforcement
  ));

  // Need 20+ access for any black market
  const available = accessLevel >= 20;

  if (!available) {
    return {
      available: false,
      accessLevel: 0,
      priceMultiplier: 3,
      stingRisk: 50,
      availableCategories: [],
    };
  }

  // Price multiplier: 3x at 20 access, down to 1.3x at 100
  const priceMultiplier = Math.max(1.3, 3 - (accessLevel - 20) * 0.02125);

  // Sting risk: 40% at 20 access, down to 2% at 100
  const stingRisk = Math.max(2, 40 - (accessLevel - 20) * 0.475);

  // Categories unlock at different access levels
  const availableCategories: EquipmentCategory[] = [];
  if (accessLevel >= 20) availableCategories.push('small_arms', 'fake_documents');
  if (accessLevel >= 35) availableCategories.push('armor', 'drugs');
  if (accessLevel >= 50) availableCategories.push('heavy_weapons', 'surveillance');
  if (accessLevel >= 70) availableCategories.push('explosives', 'vehicles');
  if (accessLevel >= 85) availableCategories.push('restricted_tech');

  return {
    available,
    accessLevel,
    priceMultiplier,
    stingRisk,
    availableCategories,
  };
}

// =============================================================================
// SMUGGLER NETWORK
// =============================================================================

export interface SmugglerNetwork {
  contacts: SmugglerContact[];
  reputation: number; // Player's rep with underworld (0-100)
  activeDeals: UnderworldDeal[];
  completedDeals: number;
  failedDeals: number;
}

export function createInitialSmugglerNetwork(): SmugglerNetwork {
  return {
    contacts: [],
    reputation: 0,
    activeDeals: [],
    completedDeals: 0,
    failedDeals: 0,
  };
}

// Generate contacts based on location
export function generateSmugglerContact(
  city: string,
  blackMarketAccess: BlackMarketAccess
): SmugglerContact | null {
  if (!blackMarketAccess.available) return null;

  // Higher access = better contacts
  const baseReliability = 30 + (blackMarketAccess.accessLevel * 0.5);
  const baseDiscretion = 40 + (blackMarketAccess.accessLevel * 0.4);

  // Random variance
  const reliability = Math.min(95, baseReliability + (Math.random() * 20 - 10));
  const discretion = Math.min(95, baseDiscretion + (Math.random() * 20 - 10));

  // Specialties based on access level
  const numSpecialties = Math.min(4, 1 + Math.floor(blackMarketAccess.accessLevel / 30));
  const specialties = blackMarketAccess.availableCategories
    .sort(() => Math.random() - 0.5)
    .slice(0, numSpecialties);

  const codenames = [
    'Ghost', 'Whisper', 'Shadow', 'Viper', 'Jackal', 'Raven', 'Wolf',
    'Phantom', 'Specter', 'Cipher', 'Wraith', 'Cobra', 'Hawk', 'Fox',
  ];

  return {
    id: `smuggler-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '[REDACTED]', // Real name hidden until trust is earned
    codename: codenames[Math.floor(Math.random() * codenames.length)],
    specialties,
    reliability: Math.floor(reliability),
    discretion: Math.floor(discretion),
    priceModifier: 0.9 + (Math.random() * 0.4), // 0.9-1.3
    location: city,
    isCompromised: false,
  };
}

// =============================================================================
// DEAL EXECUTION
// =============================================================================

export interface DealOutcome {
  success: boolean;
  itemsReceived: boolean;
  caughtByLaw: boolean;
  contactCompromised: boolean;
  additionalCosts: number;
  message: string;
}

export function executeDeal(
  deal: UnderworldDeal,
  contact: SmugglerContact,
  blackMarketAccess: BlackMarketAccess,
  playerReputation: number
): DealOutcome {
  // Base success chance from contact reliability
  let successChance = contact.reliability;

  // Modify by player reputation (higher rep = smoother deals)
  successChance += (playerReputation - 50) * 0.3;

  // Sting check (separate from deal success)
  const stingChance = blackMarketAccess.stingRisk * (1 - contact.discretion / 100);
  const isSting = Math.random() * 100 < stingChance;

  if (isSting) {
    return {
      success: false,
      itemsReceived: false,
      caughtByLaw: true,
      contactCompromised: true,
      additionalCosts: deal.totalPrice, // Lose the money
      message: 'Law enforcement sting operation! Deal compromised.',
    };
  }

  // Regular deal success check
  const dealSucceeds = Math.random() * 100 < successChance;

  if (!dealSucceeds) {
    // Failed but not a sting - various reasons
    const reasons = [
      'Supplier got cold feet',
      'Shipment seized at border',
      'Internal gang conflict',
      'Payment dispute',
    ];
    return {
      success: false,
      itemsReceived: false,
      caughtByLaw: false,
      contactCompromised: Math.random() < 0.1,
      additionalCosts: deal.totalPrice * 0.5, // Partial refund
      message: reasons[Math.floor(Math.random() * reasons.length)],
    };
  }

  return {
    success: true,
    itemsReceived: true,
    caughtByLaw: false,
    contactCompromised: false,
    additionalCosts: 0,
    message: 'Deal completed successfully.',
  };
}

// =============================================================================
// ORGANIZED CRIME FACTIONS
// =============================================================================

export interface CrimeFaction {
  id: string;
  name: string;
  type: 'mafia' | 'cartel' | 'triad' | 'yakuza' | 'gang' | 'syndicate';
  territories: string[]; // Country codes
  specialties: EquipmentCategory[];
  hostileFactions: string[]; // Faction IDs
  playerRelation: number; // -100 to +100
}

export const MAJOR_CRIME_FACTIONS: CrimeFaction[] = [
  {
    id: 'italian-mafia',
    name: 'Italian-American Mafia',
    type: 'mafia',
    territories: ['US', 'IT'],
    specialties: ['small_arms', 'drugs', 'fake_documents'],
    hostileFactions: ['russian-mob'],
    playerRelation: 0,
  },
  {
    id: 'russian-mob',
    name: 'Russian Bratva',
    type: 'syndicate',
    territories: ['RU', 'UA', 'BY'],
    specialties: ['heavy_weapons', 'vehicles', 'restricted_tech'],
    hostileFactions: ['italian-mafia'],
    playerRelation: 0,
  },
  {
    id: 'mexican-cartel',
    name: 'Mexican Cartels',
    type: 'cartel',
    territories: ['MX', 'CO', 'GT'],
    specialties: ['drugs', 'explosives', 'heavy_weapons'],
    hostileFactions: [],
    playerRelation: 0,
  },
  {
    id: 'chinese-triad',
    name: 'Chinese Triads',
    type: 'triad',
    territories: ['CN', 'HK', 'TW', 'SG'],
    specialties: ['small_arms', 'fake_documents', 'surveillance'],
    hostileFactions: ['yakuza'],
    playerRelation: 0,
  },
  {
    id: 'yakuza',
    name: 'Japanese Yakuza',
    type: 'yakuza',
    territories: ['JP'],
    specialties: ['small_arms', 'vehicles', 'restricted_tech'],
    hostileFactions: ['chinese-triad'],
    playerRelation: 0,
  },
];

/**
 * Location Effects System
 * Country stats cascade into city effects
 * A Military city in USA ≠ Military city in Chad
 *
 * COUNTRY STAT → GAMEPLAY EFFECT MAPPING:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * MILITARY:
 *   MilitaryServices (0-100)  → Soldier skill level, tactics quality
 *   MilitaryBudget (0-100)    → Equipment tier, vehicle quality, weapon availability
 *
 * INTELLIGENCE:
 *   IntelligenceServices (0-100) → How quickly they FIND you (tracking speed)
 *   IntelligenceBudget (0-100)   → Surveillance tech quality (cameras, drones, satellites)
 *
 * LAW ENFORCEMENT:
 *   LawEnforcement (0-100)       → Police skill, response QUALITY
 *   LawEnforcementBudget (0-100) → Response TIME (more budget = faster response)
 *
 * ECONOMY:
 *   GDPNational (0-100)     → Country wealth, infrastructure quality
 *   GDPPerCapita (0-100)    → Price multiplier (rich = expensive)
 *
 * SOCIETY:
 *   Healthcare (0-100)      → Hospital recovery speed, medical supply quality
 *   HigherEducation (0-100) → Training course quality, research speed
 *   SocialDevelopment (0-100) → Civilian cooperation, witness reliability
 *   Lifestyle (0-100)       → Available amenities, safe house quality
 *
 * CORRUPTION:
 *   GovernmentCorruption (0-100) → Bribe effectiveness (HIGH = cheap bribes)
 *                                → Black market access
 *                                → Underworld faction starting standing
 *
 * MEDIA:
 *   MediaFreedom (0-100)    → How fast news spreads about your actions
 *                          → Media faction starting standing
 *                          → Fame change multiplier
 *
 * THREATS:
 *   TerrorismActivity       → Terrorist encounter chance, terrorist missions available
 *   LSWActivity (0-100)     → Superhuman presence (allies and enemies)
 *   Vigilantism             → How vigilantes are treated (affects you)
 *
 * TECH:
 *   CyberCapabilities (0-100)   → Hacking difficulty, digital surveillance
 *   DigitalDevelopment (0-100)  → Internet access, communications quality
 *   Science (0-100)             → Research project availability, tech prices
 *
 * LEGAL:
 *   LSWRegulations          → Starting standing with Police/Government
 *   Cloning                 → Clone availability (recruitment)
 *   CapitalPunishment       → Death penalty risk if captured
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Country } from './countries';
import { City } from './cities';

// ============================================================================
// COUNTRY EFFECTS - The operating environment
// ============================================================================

export interface CountryEffects {
  // Identity
  countryCode: string;
  countryName: string;

  // Starting faction standings (based on LSW, corruption, media freedom)
  factionStandings: {
    police: number;      // LSW + LawEnforcement
    military: number;    // LSW + MilitaryServices
    government: number;  // LSW + GovernmentPerception
    underworld: number;  // GovernmentCorruption (high = they like you)
    corporations: number; // GDPPerCapita (rich countries = corporate power)
    media: number;       // MediaFreedom (free media = neutral, controlled = government aligned)
  };

  // MILITARY EFFECTS (from MilitaryServices + MilitaryBudget)
  military: {
    soldierSkill: number;        // MilitaryServices → 0-100
    equipmentTier: 1 | 2 | 3 | 4; // MilitaryBudget → weapon/armor quality
    vehicleQuality: number;      // MilitaryBudget → vehicle stats multiplier
    responseMinutes: number;     // MilitaryBudget → how fast military arrives
    weaponPriceModifier: number; // MilitaryBudget → high = cheaper weapons locally
  };

  // INTELLIGENCE EFFECTS (from IntelligenceServices + IntelligenceBudget)
  intelligence: {
    trackingSpeed: number;       // IntelligenceServices → hours to find you after incident
    surveillanceLevel: number;   // IntelligenceBudget → camera density, 0-100
    hackingDifficulty: number;   // IntelligenceBudget + CyberCapabilities
    canInterceptComms: boolean;  // IntelligenceBudget > 60
    satelliteCoverage: boolean;  // IntelligenceBudget > 80
  };

  // LAW ENFORCEMENT EFFECTS (from LawEnforcement + LawEnforcementBudget)
  police: {
    copSkill: number;            // LawEnforcement → 0-100
    responseMinutes: number;     // LawEnforcementBudget → how fast cops arrive
    patrolDensity: number;       // LawEnforcementBudget → chance of random cop encounter
    investigationSpeed: number;  // LawEnforcement → how fast they solve crimes
    canBeBribed: boolean;        // GovernmentCorruption > 40
    bribeCostMultiplier: number; // Inverse of corruption
  };

  // ECONOMY EFFECTS (from GDP stats)
  economy: {
    priceMultiplier: number;     // GDPPerCapita → base price modifier
    blackMarketAccess: boolean;  // Corruption > 30 OR LawEnforcement < 50
    infrastructureQuality: number; // GDPNational → travel speed, comms reliability
    jobPayMultiplier: number;    // GDPPerCapita → mission rewards scale
  };

  // SOCIETY EFFECTS (from social stats)
  society: {
    hospitalQuality: number;     // Healthcare → recovery speed multiplier
    hospitalCost: number;        // Healthcare + GDPPerCapita
    trainingQuality: number;     // HigherEducation → skill gain multiplier
    trainingCost: number;        // HigherEducation + GDPPerCapita
    civilianCooperation: number; // SocialDevelopment → witness help chance
    safeHouseQuality: number;    // Lifestyle → rest recovery bonus
  };

  // MEDIA EFFECTS (from MediaFreedom)
  media: {
    newsSpreadSpeed: number;     // MediaFreedom → hours until your actions hit news
    fameChangeMultiplier: number; // MediaFreedom → how much fame changes
    canBeCensored: boolean;      // MediaFreedom < 40 (government can suppress stories)
    journalistAccess: boolean;   // MediaFreedom > 50 (can do interviews)
  };

  // THREAT EFFECTS (from terrorism, LSW activity)
  threats: {
    terroristEncounterChance: number; // TerrorismActivity
    terroristMissionsAvailable: boolean;
    superhumanPresence: number;  // LSWActivity → chance of super encounters
    vigilanteStatus: 'legal' | 'tolerated' | 'illegal' | 'shoot_on_sight';
  };

  // TECH EFFECTS (from cyber/digital/science)
  tech: {
    internetQuality: number;     // DigitalDevelopment → comms reliability
    hackingDifficulty: number;   // CyberCapabilities → security systems
    researchSpeedBonus: number;  // Science → research project speed
    techPriceModifier: number;   // Science + DigitalDevelopment → gadget prices
    dronePresence: boolean;      // CyberCapabilities > 60
  };

  // LEGAL CONSEQUENCES
  legal: {
    deathPenaltyRisk: boolean;   // CapitalPunishment !== 'Abolished'
    cloningAvailable: boolean;   // Cloning === 'Legal'
    prisonEscapeDifficulty: number; // LawEnforcement + IntelligenceServices
  };

  // ENEMY TEMPLATES (computed from above)
  enemies: {
    policeQuality: 'militia' | 'standard' | 'trained' | 'elite';
    militaryQuality: 'militia' | 'standard' | 'trained' | 'elite';
    gangQuality: 'street' | 'organized' | 'cartel' | 'syndicate';
    terroristQuality: 'cell' | 'network' | 'army';
  };
}

export function calculateCountryEffects(country: Country): CountryEffects {
  // =========================================================================
  // FACTION STANDINGS - Who likes you when you arrive?
  // =========================================================================

  // LSW regulations set the base
  const lswStanding = {
    'Legal': 25,
    'Regulated': 0,
    'Banned': -25,
  }[country.lswRegulations] ?? -50;

  // Government type affects government/military standings
  const govBonus = {
    'Full Democracy': 10,
    'Flawed Democracy': 0,
    'Hybrid Regime': -10,
    'Authoritarian Regime': -20,
  }[country.governmentPerception] ?? 0;

  // Corruption affects underworld (high corruption = criminals flourish = they like you)
  const underworldBonus = Math.floor((country.governmentCorruption - 50) / 5);

  // Rich countries have powerful corporations
  const corpBonus = country.gdpPerCapita > 60 ? 10 : country.gdpPerCapita > 40 ? 0 : -10;

  // Media freedom affects media faction (free media = neutral, state media = gov aligned)
  const mediaBonus = country.mediaFreedom > 60 ? 10 : country.mediaFreedom < 40 ? -20 : 0;

  // =========================================================================
  // MILITARY - From MilitaryServices + MilitaryBudget
  // =========================================================================

  const getEquipmentTier = (): 1 | 2 | 3 | 4 => {
    // Equipment tier based on BUDGET (money buys gear)
    if (country.militaryBudget >= 75) return 4;
    if (country.militaryBudget >= 50) return 3;
    if (country.militaryBudget >= 25) return 2;
    return 1;
  };

  // Military response time: high budget = fast response (helicopters, etc)
  const militaryResponseMinutes = Math.max(10, 120 - country.militaryBudget);

  // Weapon prices: high military budget = surplus = cheaper weapons
  const weaponPriceModifier = country.militaryBudget > 60 ? 0.7 :
                              country.militaryBudget > 40 ? 0.85 : 1.0;

  // =========================================================================
  // INTELLIGENCE - From IntelligenceServices + IntelligenceBudget
  // =========================================================================

  // Tracking speed: how many hours until they find you after an incident
  // High IntelligenceServices = fast tracking
  const trackingHours = Math.max(1, 48 - (country.intelligenceServices * 0.4));

  // Surveillance level: camera density, monitoring (from budget)
  const surveillanceLevel = country.intelligenceBudget;

  // Hacking difficulty combines intel + cyber capabilities
  const hackingDifficulty = (country.intelligenceBudget + country.cyberCapabilities) / 2;

  // =========================================================================
  // LAW ENFORCEMENT - From LawEnforcement + LawEnforcementBudget
  // =========================================================================

  // Response time from BUDGET (money = cars, radios, manpower)
  const policeResponseMinutes = Math.max(3, 60 - (country.lawEnforcementBudget * 0.5));

  // Patrol density from budget (more budget = more cops on street)
  const patrolDensity = country.lawEnforcementBudget;

  // Investigation speed from SKILL (LawEnforcement stat)
  const investigationSpeed = country.lawEnforcement;

  // Bribe cost: HIGH corruption = CHEAP bribes
  const bribeCostMultiplier = Math.max(0.2, 2.0 - (country.governmentCorruption / 50));

  // =========================================================================
  // ECONOMY - From GDP stats
  // =========================================================================

  // Base price multiplier from per capita GDP (rich = expensive)
  const priceMultiplier = 0.4 + (country.gdpPerCapita / 100) * 1.2;

  // Black market: corruption OR weak law enforcement
  const blackMarketAccess = country.governmentCorruption > 35 || country.lawEnforcement < 45;

  // Infrastructure from national GDP (roads, airports, comms)
  const infrastructureQuality = country.gdpNational;

  // Job pay scales with local economy
  const jobPayMultiplier = 0.5 + (country.gdpPerCapita / 100);

  // =========================================================================
  // SOCIETY - From social stats
  // =========================================================================

  // Hospital quality from Healthcare stat
  const hospitalQuality = country.healthcare;

  // Hospital cost combines quality + local prices
  const hospitalCostMultiplier = priceMultiplier * (country.healthcare > 50 ? 1.2 : 0.8);

  // Training quality from HigherEducation
  const trainingQuality = country.higherEducation;

  // Training cost
  const trainingCostMultiplier = priceMultiplier * (country.higherEducation > 50 ? 1.3 : 0.7);

  // Civilian cooperation from SocialDevelopment (will they help or ignore you?)
  const civilianCooperation = country.socialDevelopment;

  // Safe house quality from Lifestyle
  const safeHouseQuality = country.lifestyle;

  // =========================================================================
  // MEDIA - From MediaFreedom
  // =========================================================================

  // News spread speed: FREE media = FAST spread (hours)
  const newsSpreadHours = Math.max(1, 24 - (country.mediaFreedom * 0.2));

  // Fame change multiplier: free media = bigger fame swings
  const fameChangeMultiplier = 0.5 + (country.mediaFreedom / 100);

  // =========================================================================
  // THREATS - From TerrorismActivity, LSWActivity, Vigilantism
  // =========================================================================

  // Parse terrorism activity (could be string or number)
  const terrorismValue = typeof country.terrorismActivity === 'string'
    ? (country.terrorismActivity === 'Active' ? 75 : country.terrorismActivity === 'Rare' ? 25 : parseInt(country.terrorismActivity) || 0)
    : country.terrorismActivity;

  // Terrorist encounter chance
  const terroristEncounterChance = terrorismValue * 0.3;

  // Vigilante status from regulations
  const vigilanteStatus: 'legal' | 'tolerated' | 'illegal' | 'shoot_on_sight' =
    country.lswRegulations === 'Legal' ? 'legal' :
    country.lswRegulations === 'Regulated' ? 'tolerated' :
    country.vigilantism === 'Tolerated' ? 'tolerated' :
    country.governmentPerception === 'Authoritarian Regime' ? 'shoot_on_sight' : 'illegal';

  // =========================================================================
  // TECH - From CyberCapabilities, DigitalDevelopment, Science
  // =========================================================================

  // Internet quality from DigitalDevelopment
  const internetQuality = country.digitalDevelopment;

  // Research speed bonus from Science stat
  const researchSpeedBonus = country.science / 100;

  // Tech prices: high science/digital = cheaper tech
  const techPriceModifier = priceMultiplier * (
    (country.science + country.digitalDevelopment) / 2 > 60 ? 0.75 : 1.1
  );

  // =========================================================================
  // LEGAL CONSEQUENCES
  // =========================================================================

  const deathPenaltyRisk = country.capitalPunishment !== 'Abolished' &&
                           country.capitalPunishment !== 'None';

  const cloningAvailable = country.cloning === 'Legal';

  // Prison escape difficulty
  const prisonEscapeDifficulty = (country.lawEnforcement + country.intelligenceServices) / 2;

  // =========================================================================
  // ENEMY QUALITY TEMPLATES
  // =========================================================================

  const getPoliceQuality = (): 'militia' | 'standard' | 'trained' | 'elite' => {
    if (country.lawEnforcement >= 80) return 'elite';
    if (country.lawEnforcement >= 60) return 'trained';
    if (country.lawEnforcement >= 40) return 'standard';
    return 'militia';
  };

  const getMilitaryQuality = (): 'militia' | 'standard' | 'trained' | 'elite' => {
    if (country.militaryServices >= 80) return 'elite';
    if (country.militaryServices >= 60) return 'trained';
    if (country.militaryServices >= 40) return 'standard';
    return 'militia';
  };

  const getGangQuality = (): 'street' | 'organized' | 'cartel' | 'syndicate' => {
    // Higher corruption + lower law enforcement = more organized crime
    const organizedScore = country.governmentCorruption - country.lawEnforcement;
    if (organizedScore >= 30) return 'syndicate';
    if (organizedScore >= 10) return 'cartel';
    if (organizedScore >= -10) return 'organized';
    return 'street';
  };

  const getTerroristQuality = (): 'cell' | 'network' | 'army' => {
    if (terrorismValue >= 70) return 'army';
    if (terrorismValue >= 40) return 'network';
    return 'cell';
  };

  // =========================================================================
  // RETURN COMPLETE COUNTRY EFFECTS
  // =========================================================================

  return {
    countryCode: country.code,
    countryName: country.name,

    factionStandings: {
      police: lswStanding + govBonus,
      military: lswStanding + govBonus,
      government: lswStanding + govBonus * 2,
      underworld: underworldBonus,
      corporations: corpBonus,
      media: mediaBonus,
    },

    military: {
      soldierSkill: country.militaryServices,
      equipmentTier: getEquipmentTier(),
      vehicleQuality: country.militaryBudget,
      responseMinutes: militaryResponseMinutes,
      weaponPriceModifier,
    },

    intelligence: {
      trackingSpeed: trackingHours,
      surveillanceLevel,
      hackingDifficulty,
      canInterceptComms: country.intelligenceBudget > 60,
      satelliteCoverage: country.intelligenceBudget > 80,
    },

    police: {
      copSkill: country.lawEnforcement,
      responseMinutes: policeResponseMinutes,
      patrolDensity,
      investigationSpeed,
      canBeBribed: country.governmentCorruption > 40,
      bribeCostMultiplier,
    },

    economy: {
      priceMultiplier,
      blackMarketAccess,
      infrastructureQuality,
      jobPayMultiplier,
    },

    society: {
      hospitalQuality,
      hospitalCost: hospitalCostMultiplier,
      trainingQuality,
      trainingCost: trainingCostMultiplier,
      civilianCooperation,
      safeHouseQuality,
    },

    media: {
      newsSpreadSpeed: newsSpreadHours,
      fameChangeMultiplier,
      canBeCensored: country.mediaFreedom < 40,
      journalistAccess: country.mediaFreedom > 50,
    },

    threats: {
      terroristEncounterChance,
      terroristMissionsAvailable: terrorismValue > 30,
      superhumanPresence: country.lswActivity,
      vigilanteStatus,
    },

    tech: {
      internetQuality,
      hackingDifficulty,
      researchSpeedBonus,
      techPriceModifier,
      dronePresence: country.cyberCapabilities > 60,
    },

    legal: {
      deathPenaltyRisk,
      cloningAvailable,
      prisonEscapeDifficulty,
    },

    enemies: {
      policeQuality: getPoliceQuality(),
      militaryQuality: getMilitaryQuality(),
      gangQuality: getGangQuality(),
      terroristQuality: getTerroristQuality(),
    },
  };
}

// ============================================================================
// CITY EFFECTS - The tactical playground (modified by country)
// ============================================================================

export interface CityTypeServices {
  shops: string[];
  recruitment: string[];
  missions: string[];
  specialFeatures: string[];
}

export const CITY_TYPE_SERVICES: Record<string, CityTypeServices> = {
  'Political': {
    shops: ['Government Surplus', 'Formal Wear', 'Secure Communications'],
    recruitment: ['Politicians', 'Diplomats', 'Bureaucrats', 'Bodyguards'],
    missions: ['Assassination', 'Espionage', 'Protection Detail', 'Regime Change', 'Evidence Planting'],
    specialFeatures: ['Embassy Access', 'Government Contracts', 'Diplomatic Immunity (purchasable)'],
  },
  'Military': {
    shops: ['Weapons Dealer', 'Armor Supplier', 'Military Surplus', 'Ammunition Depot'],
    recruitment: ['Soldiers', 'Veterans', 'Mercenaries', 'Drill Sergeants'],
    missions: ['Base Defense', 'Equipment Recovery', 'Escort', 'Counter-Terrorism', 'Weapons Heist'],
    specialFeatures: ['Firing Range (+accuracy training)', 'Military Intel', 'Vehicle Access'],
  },
  'Industrial': {
    shops: ['Salvage Yard', 'Vehicle Parts', 'Tool Shop', 'Chemical Supplies'],
    recruitment: ['Engineers', 'Mechanics', 'Factory Workers', 'Union Leaders'],
    missions: ['Sabotage', 'Corporate Theft', 'Labor Disputes', 'Environmental Crime'],
    specialFeatures: ['Vehicle Repair', 'Custom Modifications', 'Bulk Discounts'],
  },
  'Educational': {
    shops: ['Bookstore', 'Lab Equipment', 'Research Materials'],
    recruitment: ['Scientists', 'Professors', 'Students', 'Researchers'],
    missions: ['Professor Rescue', 'Tech Theft', 'Student Protests', 'Research Sabotage'],
    specialFeatures: ['Training Courses', 'Research Projects', 'University Library (intel)'],
  },
  'Temple': {
    shops: ['Relic Dealer', 'Mystical Items', 'Traditional Medicine'],
    recruitment: ['Monks', 'Priests', 'Cult Contacts', 'Historians'],
    missions: ['Artifact Recovery', 'Cult Investigation', 'Exorcism', 'Religious Protection'],
    specialFeatures: ['Sanctuary (safe rest)', 'Mystical Training', 'Ancient Knowledge'],
  },
  'Mining': {
    shops: ['Explosives Dealer', 'Heavy Equipment', 'Mineral Trader'],
    recruitment: ['Miners', 'Demolition Experts', 'Geologists'],
    missions: ['Resource Protection', 'Company Conflicts', 'Environmental Sabotage', 'Hostage Rescue'],
    specialFeatures: ['Explosives Access', 'Remote Hideouts', 'Mineral Trade'],
  },
  'Company': { // Tech Hub
    shops: ['Electronics Store', 'Gadget Shop', 'Software Vendor', 'Drone Dealer'],
    recruitment: ['Hackers', 'Programmers', 'Tech Entrepreneurs', 'Security Experts'],
    missions: ['Data Theft', 'Corporate Espionage', 'AI Containment', 'Whistleblower Protection'],
    specialFeatures: ['Hacking Services', 'Custom Gadgets', 'Digital Surveillance'],
  },
  'Resort': {
    shops: ['Luxury Goods', 'Disguise Shop', 'Yacht Dealer'],
    recruitment: ['Celebrities', 'Socialites', 'Hotel Staff', 'Tour Guides'],
    missions: ['Celebrity Protection', 'Kidnapping Rescue', 'Undercover Operations', 'Art Theft'],
    specialFeatures: ['Cover Identity', 'High Society Access', 'Tourist Blend-in'],
  },
  'Seaport': {
    shops: ['Ship Supplies', 'Smuggled Goods', 'Fishing Equipment', 'Naval Weapons'],
    recruitment: ['Sailors', 'Smugglers', 'Dock Workers', 'Ship Captains'],
    missions: ['Piracy Interdiction', 'Smuggling', 'Trafficking Bust', 'Cargo Protection'],
    specialFeatures: ['International Travel', 'Smuggling Routes', 'Naval Vehicle Access'],
  },
};

export interface CityEffects {
  // Identity
  cityName: string;
  countryCode: string;
  sector: string;

  // Combined services from all city types
  availableServices: CityTypeServices;

  // Encounter generation
  encounters: {
    patrolEncounterChance: number;  // 0-100 per hour
    encounterTypes: string[];
    averageEnemyCount: number;
    enemyTypes: string[];
  };

  // Prices (base * country multiplier * city modifier)
  priceModifiers: {
    weapons: number;
    armor: number;
    medical: number;
    tech: number;
    general: number;
  };

  // Population effects
  population: {
    size: string;           // Mega City, Large City, etc.
    witnessChance: number;  // Chance of being seen during ops
    crowdCover: number;     // Bonus to hiding in crowds
    serviceAvailability: number; // % of services actually available
  };

  // Crime environment
  crime: {
    index: number;
    gangPresence: 'none' | 'light' | 'moderate' | 'heavy' | 'controlled';
    policePresence: 'none' | 'light' | 'moderate' | 'heavy' | 'martial_law';
    blackMarket: boolean;
  };
}

export function calculateCityEffects(city: City, countryEffects: CountryEffects): CityEffects {
  // Combine services from all city types
  const cityTypes = [city.cityType1, city.cityType2, city.cityType3, city.cityType4].filter(t => t);

  const combinedServices: CityTypeServices = {
    shops: [],
    recruitment: [],
    missions: [],
    specialFeatures: [],
  };

  cityTypes.forEach(type => {
    const services = CITY_TYPE_SERVICES[type];
    if (services) {
      combinedServices.shops.push(...services.shops);
      combinedServices.recruitment.push(...services.recruitment);
      combinedServices.missions.push(...services.missions);
      combinedServices.specialFeatures.push(...services.specialFeatures);
    }
  });

  // Remove duplicates
  combinedServices.shops = [...new Set(combinedServices.shops)];
  combinedServices.recruitment = [...new Set(combinedServices.recruitment)];
  combinedServices.missions = [...new Set(combinedServices.missions)];
  combinedServices.specialFeatures = [...new Set(combinedServices.specialFeatures)];

  // Population effects
  const popEffects = {
    'Mega City': { witnessChance: 90, crowdCover: 40, serviceAvailability: 100 },
    'Large City': { witnessChance: 70, crowdCover: 30, serviceAvailability: 90 },
    'City': { witnessChance: 50, crowdCover: 20, serviceAvailability: 75 },
    'Town': { witnessChance: 30, crowdCover: 10, serviceAvailability: 50 },
    'Small Town': { witnessChance: 80, crowdCover: 0, serviceAvailability: 25 }, // Everyone knows everyone
  }[city.populationType] ?? { witnessChance: 50, crowdCover: 15, serviceAvailability: 60 };

  // Crime determines gang presence
  const getGangPresence = (): 'none' | 'light' | 'moderate' | 'heavy' | 'controlled' => {
    if (city.crimeIndex >= 80) return 'controlled';
    if (city.crimeIndex >= 60) return 'heavy';
    if (city.crimeIndex >= 40) return 'moderate';
    if (city.crimeIndex >= 20) return 'light';
    return 'none';
  };

  // Police presence based on patrol density from country
  const getPolicePresence = (): 'none' | 'light' | 'moderate' | 'heavy' | 'martial_law' => {
    const patrolLevel = countryEffects.police.patrolDensity;
    if (city.crimeIndex >= 80 && patrolLevel >= 70) return 'martial_law';
    if (patrolLevel >= 70) return 'heavy';
    if (patrolLevel >= 50) return 'moderate';
    if (patrolLevel >= 30) return 'light';
    return 'none';
  };

  // Encounter chance based on crime index
  const patrolEncounterChance = Math.min(50, city.crimeIndex * 0.5);

  // Enemy count scales with population and crime
  const popMultiplier = {
    'Mega City': 1.5,
    'Large City': 1.3,
    'City': 1.0,
    'Town': 0.8,
    'Small Town': 0.6,
  }[city.populationType] ?? 1.0;

  const averageEnemyCount = Math.max(1, Math.floor(2 + (city.crimeIndex / 30) * popMultiplier));

  // Encounter types based on crime level and city types
  const encounterTypes: string[] = [];
  if (city.crimeIndex >= 20) encounterTypes.push('mugging', 'theft');
  if (city.crimeIndex >= 40) encounterTypes.push('gang_fight', 'drug_deal');
  if (city.crimeIndex >= 60) encounterTypes.push('armed_robbery', 'shootout');
  if (city.crimeIndex >= 80) encounterTypes.push('gang_war', 'cartel_activity');
  if (cityTypes.includes('Seaport')) encounterTypes.push('smuggling', 'piracy');
  if (cityTypes.includes('Temple')) encounterTypes.push('cult_activity', 'relic_theft');
  if (cityTypes.includes('Company')) encounterTypes.push('corporate_espionage', 'hacking');

  // Enemy types based on country quality and crime
  const enemyTypes: string[] = [];
  switch (countryEffects.enemies.gangQuality) {
    case 'syndicate':
      enemyTypes.push('syndicate_enforcer', 'professional_hitman', 'cartel_soldier');
      break;
    case 'cartel':
      enemyTypes.push('cartel_member', 'gang_lieutenant', 'armed_thug');
      break;
    case 'organized':
      enemyTypes.push('gang_member', 'armed_criminal', 'drug_dealer');
      break;
    default:
      enemyTypes.push('street_thug', 'petty_criminal', 'mugger');
  }

  // City type modifiers for prices
  let weaponMod = 1.0;
  let armorMod = 1.0;
  let techMod = 1.0;
  let medicalMod = 1.0;

  if (cityTypes.includes('Military')) { weaponMod *= 0.85; armorMod *= 0.85; }
  if (cityTypes.includes('Industrial')) { weaponMod *= 0.95; armorMod *= 0.90; }
  if (cityTypes.includes('Company')) { techMod *= 0.80; }
  if (cityTypes.includes('Educational')) { medicalMod *= 0.90; }
  if (cityTypes.includes('Resort')) { weaponMod *= 1.3; techMod *= 1.2; } // Everything expensive in resorts

  return {
    cityName: city.name,
    countryCode: city.countryIso,
    sector: city.sector,

    availableServices: combinedServices,

    encounters: {
      patrolEncounterChance,
      encounterTypes,
      averageEnemyCount,
      enemyTypes,
    },

    priceModifiers: {
      // Country base price * military weapon discount * city type modifier
      weapons: countryEffects.economy.priceMultiplier * countryEffects.military.weaponPriceModifier * weaponMod,
      armor: countryEffects.economy.priceMultiplier * armorMod,
      medical: countryEffects.economy.priceMultiplier * (countryEffects.society.hospitalQuality > 50 ? 0.9 : 1.1) * medicalMod,
      tech: countryEffects.tech.techPriceModifier * techMod,
      general: countryEffects.economy.priceMultiplier,
    },

    population: {
      size: city.populationType,
      witnessChance: popEffects.witnessChance,
      crowdCover: popEffects.crowdCover,
      serviceAvailability: popEffects.serviceAvailability,
    },

    crime: {
      index: city.crimeIndex,
      gangPresence: getGangPresence(),
      policePresence: getPolicePresence(),
      blackMarket: city.crimeIndex > 50 || countryEffects.economy.blackMarketAccess,
    },
  };
}

// ============================================================================
// COMBINED LOCATION - Everything about where you are
// ============================================================================

export interface LocationContext {
  country: CountryEffects;
  city: CityEffects;

  // Calculated final values
  final: {
    // Prices with all modifiers applied
    weaponPriceMultiplier: number;
    armorPriceMultiplier: number;
    techPriceMultiplier: number;
    medicalPriceMultiplier: number;
    bribeCost: number;  // Base cost for a standard bribe

    // Danger level
    dangerRating: number;  // 1-10
    heatLevel: number;     // How much attention you're getting

    // Available actions
    canBribe: boolean;
    hasBlackMarket: boolean;
    hasTerroristMissions: boolean;

    // Response times
    policeResponseMinutes: number;
    militaryResponseMinutes: number;
  };
}

export function getLocationContext(city: City, country: Country): LocationContext {
  const countryEffects = calculateCountryEffects(country);
  const cityEffects = calculateCityEffects(city, countryEffects);

  // Calculate danger rating (1-10)
  const dangerFactors = [
    city.crimeIndex / 20,                           // Crime contributes up to 5
    (100 - city.safetyIndex) / 40,                  // Safety inverse contributes up to 2.5
    countryEffects.military.equipmentTier / 2,      // Enemy gear contributes up to 2
    countryEffects.threats.terroristMissionsAvailable ? 0.5 : 0,
  ];
  const dangerRating = Math.min(10, Math.max(1, Math.round(dangerFactors.reduce((a, b) => a + b, 0))));

  return {
    country: countryEffects,
    city: cityEffects,

    final: {
      weaponPriceMultiplier: cityEffects.priceModifiers.weapons,
      armorPriceMultiplier: cityEffects.priceModifiers.armor,
      techPriceMultiplier: cityEffects.priceModifiers.tech,
      medicalPriceMultiplier: cityEffects.priceModifiers.medical,
      bribeCost: Math.round(500 * countryEffects.police.bribeCostMultiplier),

      dangerRating,
      heatLevel: 0, // Starts at 0, increases with actions

      canBribe: countryEffects.police.canBeBribed,
      hasBlackMarket: cityEffects.crime.blackMarket,
      hasTerroristMissions: countryEffects.threats.terroristMissionsAvailable,

      policeResponseMinutes: countryEffects.police.responseMinutes,
      militaryResponseMinutes: countryEffects.military.responseMinutes,
    },
  };
}

// ============================================================================
// COMPARISON HELPERS - See the difference between locations
// ============================================================================

export interface LocationComparison {
  locationA: { city: string; country: string };
  locationB: { city: string; country: string };
  differences: {
    category: string;
    aspect: string;
    valueA: string | number;
    valueB: string | number;
    advantage: 'A' | 'B' | 'equal';
  }[];
}

export function compareLocations(
  cityA: City, countryA: Country,
  cityB: City, countryB: Country
): LocationComparison {
  const contextA = getLocationContext(cityA, countryA);
  const contextB = getLocationContext(cityB, countryB);

  const differences: LocationComparison['differences'] = [];

  // Price comparisons (lower is better)
  differences.push({
    category: 'Prices',
    aspect: 'Weapons',
    valueA: `${Math.round(contextA.final.weaponPriceMultiplier * 100)}%`,
    valueB: `${Math.round(contextB.final.weaponPriceMultiplier * 100)}%`,
    advantage: contextA.final.weaponPriceMultiplier < contextB.final.weaponPriceMultiplier ? 'A' :
               contextA.final.weaponPriceMultiplier > contextB.final.weaponPriceMultiplier ? 'B' : 'equal',
  });

  differences.push({
    category: 'Prices',
    aspect: 'Tech',
    valueA: `${Math.round(contextA.final.techPriceMultiplier * 100)}%`,
    valueB: `${Math.round(contextB.final.techPriceMultiplier * 100)}%`,
    advantage: contextA.final.techPriceMultiplier < contextB.final.techPriceMultiplier ? 'A' :
               contextA.final.techPriceMultiplier > contextB.final.techPriceMultiplier ? 'B' : 'equal',
  });

  differences.push({
    category: 'Prices',
    aspect: 'Bribes',
    valueA: `$${contextA.final.bribeCost}`,
    valueB: `$${contextB.final.bribeCost}`,
    advantage: contextA.final.bribeCost < contextB.final.bribeCost ? 'A' :
               contextA.final.bribeCost > contextB.final.bribeCost ? 'B' : 'equal',
  });

  // Danger comparison (context dependent - sometimes you want danger)
  differences.push({
    category: 'Environment',
    aspect: 'Danger Rating',
    valueA: contextA.final.dangerRating,
    valueB: contextB.final.dangerRating,
    advantage: 'equal', // Depends on what you want
  });

  // Response time (higher is better for criminals)
  differences.push({
    category: 'Environment',
    aspect: 'Police Response',
    valueA: `${contextA.final.policeResponseMinutes} min`,
    valueB: `${contextB.final.policeResponseMinutes} min`,
    advantage: contextA.final.policeResponseMinutes > contextB.final.policeResponseMinutes ? 'A' :
               contextA.final.policeResponseMinutes < contextB.final.policeResponseMinutes ? 'B' : 'equal',
  });

  // Services comparison
  differences.push({
    category: 'Services',
    aspect: 'Available Shops',
    valueA: contextA.city.availableServices.shops.length,
    valueB: contextB.city.availableServices.shops.length,
    advantage: contextA.city.availableServices.shops.length > contextB.city.availableServices.shops.length ? 'A' :
               contextA.city.availableServices.shops.length < contextB.city.availableServices.shops.length ? 'B' : 'equal',
  });

  differences.push({
    category: 'Services',
    aspect: 'Mission Types',
    valueA: contextA.city.availableServices.missions.length,
    valueB: contextB.city.availableServices.missions.length,
    advantage: contextA.city.availableServices.missions.length > contextB.city.availableServices.missions.length ? 'A' :
               contextA.city.availableServices.missions.length < contextB.city.availableServices.missions.length ? 'B' : 'equal',
  });

  // Black market
  differences.push({
    category: 'Access',
    aspect: 'Black Market',
    valueA: contextA.final.hasBlackMarket ? 'Yes' : 'No',
    valueB: contextB.final.hasBlackMarket ? 'Yes' : 'No',
    advantage: contextA.final.hasBlackMarket && !contextB.final.hasBlackMarket ? 'A' :
               !contextA.final.hasBlackMarket && contextB.final.hasBlackMarket ? 'B' : 'equal',
  });

  return {
    locationA: { city: cityA.name, country: countryA.name },
    locationB: { city: cityB.name, country: countryB.name },
    differences,
  };
}

// ============================================================================
// QUICK LOOKUP FUNCTIONS
// ============================================================================

export function getWeaponPrice(basePrice: number, context: LocationContext): number {
  return Math.round(basePrice * context.final.weaponPriceMultiplier);
}

export function getArmorPrice(basePrice: number, context: LocationContext): number {
  return Math.round(basePrice * context.final.armorPriceMultiplier);
}

export function getTechPrice(basePrice: number, context: LocationContext): number {
  return Math.round(basePrice * context.final.techPriceMultiplier);
}

export function getMedicalPrice(basePrice: number, context: LocationContext): number {
  return Math.round(basePrice * context.final.medicalPriceMultiplier);
}

export function canAccessService(service: string, context: LocationContext): boolean {
  const allServices = [
    ...context.city.availableServices.shops,
    ...context.city.availableServices.recruitment,
    ...context.city.availableServices.missions,
    ...context.city.availableServices.specialFeatures,
  ];
  return allServices.some(s => s.toLowerCase().includes(service.toLowerCase()));
}

export function getAvailableMissions(context: LocationContext): string[] {
  return context.city.availableServices.missions;
}

export function getRecruitmentPool(context: LocationContext): string[] {
  return context.city.availableServices.recruitment;
}

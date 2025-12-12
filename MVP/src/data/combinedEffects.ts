/**
 * Combined Effects System
 * Multiple country stats combine to create emergent gameplay
 *
 * PHILOSOPHY: Single stats = weak. Combinations = rich gameplay.
 *
 * EXAMPLES:
 *   Cloning + Healthcare + Science = Clone quality, availability, pricing
 *   Military + Corruption = Black market weapons
 *   Intelligence + Cyber + MediaFreedom = Surveillance state
 *   Healthcare + GDP + Lifestyle = Medical tourism
 */

import { Country } from './countries';
import { CountryEffects } from './locationEffects';

// ============================================================================
// CLONING SYSTEM
// Combines: Cloning regulation + Healthcare + Science + GDP
// ============================================================================

export interface CloningSystem {
  // Is cloning available at all?
  available: boolean;
  regulation: 'banned' | 'restricted' | 'regulated' | 'legal';

  // Quality of clones (Healthcare + Science)
  cloneQuality: number;           // 0-100: Stats, lifespan, stability
  degradationRate: number;        // % stat loss per clone generation

  // Pricing (GDP + Science infrastructure)
  baseCost: number;               // Base cost for a basic clone
  premiumCost: number;            // Cost for enhanced clone

  // Availability
  waitTime: number;               // Days to get a clone
  facilityCount: 'none' | 'rare' | 'uncommon' | 'common';

  // Special features
  canCloneSupers: boolean;        // Can clone powered individuals?
  memoryTransfer: boolean;        // Can transfer memories?
  organHarvesting: boolean;       // Clone organs available?

  // Risks
  blackMarketClones: boolean;     // Illegal clones available?
  cloneDefectChance: number;      // % chance of defective clone
}

export function calculateCloningSystem(country: Country): CloningSystem {
  const isLegal = country.cloning === 'Legal';
  const isRegulated = country.cloning === 'Regulated';
  const isBanned = country.cloning === 'Banned';

  // Clone quality from Healthcare + Science (both needed)
  const cloneQuality = Math.round((country.healthcare + country.science) / 2);

  // Degradation: high science = stable clones
  const degradationRate = Math.max(5, 30 - (country.science * 0.25));

  // Base cost scales with GDP (rich = expensive) but high science = efficient
  const baseCost = Math.round(
    50000 * (country.gdpPerCapita / 50) * (1.5 - country.science / 200)
  );

  // Premium clones (enhanced stats) cost 5x base
  const premiumCost = baseCost * 5;

  // Wait time: high healthcare = more facilities = faster
  const waitTime = Math.max(7, Math.round(60 - (country.healthcare * 0.5)));

  // Facility count
  const facilityScore = (country.healthcare + country.science) / 2;
  const facilityCount: CloningSystem['facilityCount'] =
    !isLegal && !isRegulated ? 'none' :
    facilityScore >= 70 ? 'common' :
    facilityScore >= 50 ? 'uncommon' : 'rare';

  // Advanced features require high science
  const canCloneSupers = country.science >= 80 && isLegal;
  const memoryTransfer = country.science >= 70 && country.cyberCapabilities >= 60;

  // Organ harvesting: legal where healthcare is prioritized but ethics are... flexible
  const organHarvesting = isLegal && country.healthcare >= 50;

  // Black market clones exist where: banned + corruption + some science capability
  const blackMarketClones = isBanned && country.governmentCorruption >= 50 && country.science >= 30;

  // Defect chance: low science OR black market = high defects
  const cloneDefectChance = blackMarketClones ? 25 : Math.max(2, 20 - (country.science * 0.2));

  return {
    available: isLegal || isRegulated || blackMarketClones,
    regulation: isBanned ? 'banned' : isRegulated ? 'regulated' : isLegal ? 'legal' : 'restricted',
    cloneQuality,
    degradationRate,
    baseCost,
    premiumCost,
    waitTime,
    facilityCount,
    canCloneSupers,
    memoryTransfer,
    organHarvesting,
    blackMarketClones,
    cloneDefectChance,
  };
}

// ============================================================================
// BLACK MARKET SYSTEM
// Combines: Corruption + Military + LawEnforcement + GDP
// ============================================================================

export interface BlackMarketSystem {
  // Access
  available: boolean;
  accessDifficulty: 'open' | 'contacts_needed' | 'deep_underworld' | 'impossible';

  // Weapons
  militaryWeaponsAvailable: boolean;  // Surplus from military budget + corruption
  weaponPriceModifier: number;        // 0.5 = cheap, 2.0 = expensive
  weaponQualityRange: [number, number]; // min-max quality (1-4 tier)

  // Contraband
  drugsAvailable: boolean;
  stolenGoodsAvailable: boolean;
  forgedDocumentsAvailable: boolean;
  illegalTechAvailable: boolean;

  // Services
  hitmenAvailable: boolean;
  hitmanCost: number;
  smugglingRoutes: boolean;
  safehousesForRent: boolean;

  // Risks
  policeRaidChance: number;           // % chance of raid when visiting
  scamChance: number;                 // % chance of getting scammed
  fedInfiltrationRisk: boolean;       // Feds might be watching
}

export function calculateBlackMarket(country: Country): BlackMarketSystem {
  // Black market thrives where: high corruption + low law enforcement
  const blackMarketStrength = country.governmentCorruption - (country.lawEnforcement * 0.5);
  const available = blackMarketStrength > 0 || country.governmentCorruption > 40;

  // Access difficulty
  const accessDifficulty: BlackMarketSystem['accessDifficulty'] =
    !available ? 'impossible' :
    blackMarketStrength >= 40 ? 'open' :
    blackMarketStrength >= 20 ? 'contacts_needed' : 'deep_underworld';

  // Military weapons leak where: high military budget + corruption
  const militaryWeaponsAvailable = country.militaryBudget >= 40 && country.governmentCorruption >= 40;

  // Prices: high corruption = cheap (lots of supply), low GDP = cheap
  const weaponPriceModifier = Math.max(0.4, 1.5 - (country.governmentCorruption / 100) - (0.5 - country.gdpPerCapita / 200));

  // Quality depends on military budget (what's available to steal)
  const minTier = country.militaryBudget >= 50 ? 2 : 1;
  const maxTier = country.militaryBudget >= 75 ? 4 : country.militaryBudget >= 50 ? 3 : 2;

  // Contraband availability
  const drugsAvailable = country.governmentCorruption >= 30;
  const stolenGoodsAvailable = available;
  const forgedDocumentsAvailable = country.governmentCorruption >= 50;
  const illegalTechAvailable = country.cyberCapabilities >= 40 && country.governmentCorruption >= 40;

  // Services
  const hitmenAvailable = blackMarketStrength >= 20;
  const hitmanCost = Math.round(10000 * (2 - country.governmentCorruption / 100) * (country.gdpPerCapita / 50));
  const smugglingRoutes = available && (country.governmentCorruption >= 40 || country.lawEnforcement <= 40);
  const safehousesForRent = available;

  // Risks: higher law enforcement = more raids
  const policeRaidChance = Math.max(0, country.lawEnforcement - country.governmentCorruption) * 0.3;
  const scamChance = Math.max(5, 25 - (country.governmentCorruption * 0.2)); // Ironic: more corrupt = more honest criminals
  const fedInfiltrationRisk = country.intelligenceServices >= 60 && country.lawEnforcement >= 50;

  return {
    available,
    accessDifficulty,
    militaryWeaponsAvailable,
    weaponPriceModifier,
    weaponQualityRange: [minTier as 1|2|3|4, maxTier as 1|2|3|4],
    drugsAvailable,
    stolenGoodsAvailable,
    forgedDocumentsAvailable,
    illegalTechAvailable,
    hitmenAvailable,
    hitmanCost,
    smugglingRoutes,
    safehousesForRent,
    policeRaidChance,
    scamChance,
    fedInfiltrationRisk,
  };
}

// ============================================================================
// SURVEILLANCE STATE SYSTEM
// Combines: Intelligence + Cyber + MediaFreedom + LawEnforcement
// ============================================================================

export interface SurveillanceSystem {
  // Overall level
  surveillanceScore: number;          // 0-100: How watched are you?
  privacyLevel: 'none' | 'minimal' | 'moderate' | 'good' | 'excellent';

  // Tracking capabilities
  facialRecognition: boolean;
  phoneTracking: boolean;
  financialMonitoring: boolean;
  socialMediaMonitoring: boolean;
  satelliteSurveillance: boolean;
  dronePatrols: boolean;

  // Counter-surveillance
  canGoOffGrid: boolean;              // Can you disappear?
  offGridCost: number;                // Cost to go dark
  canBribeToDisappear: boolean;       // Can corruption help?

  // Information control
  internetCensorship: boolean;
  vpnBlocked: boolean;
  mediaControlled: boolean;
  propagandaLevel: number;            // 0-100

  // Gameplay effects
  heatDecayRate: number;              // How fast does heat cool down?
  identityChangeEffectiveness: number; // How well does new ID work? 0-100
  witnessReliability: number;         // How reliable are witness IDs?
}

export function calculateSurveillance(country: Country): SurveillanceSystem {
  // Surveillance score: Intelligence + Cyber + (inverse of MediaFreedom)
  const surveillanceScore = Math.round(
    (country.intelligenceServices * 0.4) +
    (country.cyberCapabilities * 0.3) +
    ((100 - country.mediaFreedom) * 0.3)
  );

  const privacyLevel: SurveillanceSystem['privacyLevel'] =
    surveillanceScore >= 80 ? 'none' :
    surveillanceScore >= 60 ? 'minimal' :
    surveillanceScore >= 40 ? 'moderate' :
    surveillanceScore >= 20 ? 'good' : 'excellent';

  // Tracking tech based on cyber + budget
  const facialRecognition = country.cyberCapabilities >= 60;
  const phoneTracking = country.intelligenceServices >= 40;
  const financialMonitoring = country.intelligenceServices >= 50;
  const socialMediaMonitoring = country.cyberCapabilities >= 50;
  const satelliteSurveillance = country.intelligenceBudget >= 80;
  const dronePatrols = country.cyberCapabilities >= 70;

  // Can you go off grid? Needs: corruption OR low surveillance OR remote areas
  const canGoOffGrid = country.governmentCorruption >= 50 || surveillanceScore <= 40;
  const offGridCost = Math.round(5000 * (surveillanceScore / 50));
  const canBribeToDisappear = country.governmentCorruption >= 60;

  // Information control
  const internetCensorship = country.mediaFreedom <= 40;
  const vpnBlocked = country.mediaFreedom <= 30 && country.cyberCapabilities >= 50;
  const mediaControlled = country.mediaFreedom <= 40;
  const propagandaLevel = Math.max(0, 100 - country.mediaFreedom);

  // Gameplay effects
  const heatDecayRate = Math.max(1, 10 - (surveillanceScore / 20)); // % per day
  const identityChangeEffectiveness = Math.max(10, 100 - surveillanceScore);
  const witnessReliability = Math.min(90, country.socialDevelopment + (surveillanceScore * 0.3));

  return {
    surveillanceScore,
    privacyLevel,
    facialRecognition,
    phoneTracking,
    financialMonitoring,
    socialMediaMonitoring,
    satelliteSurveillance,
    dronePatrols,
    canGoOffGrid,
    offGridCost,
    canBribeToDisappear,
    internetCensorship,
    vpnBlocked,
    mediaControlled,
    propagandaLevel,
    heatDecayRate,
    identityChangeEffectiveness,
    witnessReliability,
  };
}

// ============================================================================
// MEDICAL TOURISM SYSTEM
// Combines: Healthcare + GDP + Lifestyle + Science
// ============================================================================

export interface MedicalSystem {
  // Quality vs Cost balance
  healthcareQuality: number;          // 0-100
  healthcareCost: number;             // Multiplier (0.5 = cheap, 2.0 = expensive)
  medicalTourismScore: number;        // Quality / Cost ratio - high = good destination

  // Facilities
  hospitalTier: 1 | 2 | 3 | 4;        // 1 = field hospital, 4 = world class
  specialistAvailable: boolean;
  surgeryAvailable: boolean;
  cybernetics: boolean;               // Cybernetic enhancements
  geneticTherapy: boolean;

  // Recovery
  recoverySpeedMultiplier: number;    // 1.0 = normal, 2.0 = twice as fast
  infectionRisk: number;              // % chance of complications

  // Costs
  emergencyCareCost: number;          // Per incident
  surgeryCost: number;
  longTermCareCost: number;           // Per week

  // Availability
  ruralAccess: boolean;               // Healthcare outside major cities?
  emergencyResponse: number;          // Minutes for ambulance
}

export function calculateMedicalSystem(country: Country): MedicalSystem {
  const healthcareQuality = country.healthcare;

  // Cost based on GDP and healthcare investment
  // High healthcare + Low GDP = medical tourism paradise
  // High healthcare + High GDP = expensive but good
  const healthcareCost = (country.gdpPerCapita / 50) * (country.healthcare > 60 ? 1.3 : 0.8);

  // Medical tourism score: quality / cost (higher = better value)
  const medicalTourismScore = Math.round((healthcareQuality / healthcareCost) * (country.lifestyle / 50));

  // Hospital tier
  const hospitalTier: MedicalSystem['hospitalTier'] =
    healthcareQuality >= 80 ? 4 :
    healthcareQuality >= 60 ? 3 :
    healthcareQuality >= 40 ? 2 : 1;

  // Advanced services
  const specialistAvailable = healthcareQuality >= 50;
  const surgeryAvailable = healthcareQuality >= 40;
  const cybernetics = healthcareQuality >= 70 && country.science >= 60;
  const geneticTherapy = healthcareQuality >= 80 && country.science >= 70;

  // Recovery
  const recoverySpeedMultiplier = 0.5 + (healthcareQuality / 100) + (country.lifestyle / 200);
  const infectionRisk = Math.max(1, 20 - (healthcareQuality * 0.2));

  // Costs
  const baseCostMultiplier = country.gdpPerCapita / 50;
  const emergencyCareCost = Math.round(2000 * baseCostMultiplier);
  const surgeryCost = Math.round(15000 * baseCostMultiplier);
  const longTermCareCost = Math.round(3000 * baseCostMultiplier);

  // Availability
  const ruralAccess = healthcareQuality >= 60 && country.gdpNational >= 50;
  const emergencyResponse = Math.max(5, 60 - (healthcareQuality * 0.5) - (country.gdpNational * 0.2));

  return {
    healthcareQuality,
    healthcareCost,
    medicalTourismScore,
    hospitalTier,
    specialistAvailable,
    surgeryAvailable,
    cybernetics,
    geneticTherapy,
    recoverySpeedMultiplier,
    infectionRisk,
    emergencyCareCost,
    surgeryCost,
    longTermCareCost,
    ruralAccess,
    emergencyResponse,
  };
}

// ============================================================================
// RESEARCH & TECH SYSTEM
// Combines: Science + HigherEducation + GDP + CyberCapabilities
// ============================================================================

export interface ResearchSystem {
  // Research capability
  researchTier: 1 | 2 | 3 | 4;        // 1 = basic, 4 = cutting edge
  researchSpeedMultiplier: number;

  // Available research types
  weaponResearch: boolean;
  armorResearch: boolean;
  medicalResearch: boolean;
  cyberResearch: boolean;
  powerResearch: boolean;             // Superhuman power research

  // Education
  universityAccess: boolean;
  trainingQuality: number;            // Skill gain multiplier
  specialistRecruitment: string[];    // What specialists can you hire?

  // Tech market
  techAvailability: 'black_market_only' | 'limited' | 'standard' | 'cutting_edge';
  techPriceModifier: number;

  // Brain drain/gain
  talentPool: 'exodus' | 'low' | 'moderate' | 'high' | 'global_hub';
}

export function calculateResearchSystem(country: Country): ResearchSystem {
  const researchScore = (country.science + country.higherEducation + country.cyberCapabilities) / 3;

  const researchTier: ResearchSystem['researchTier'] =
    researchScore >= 75 ? 4 :
    researchScore >= 55 ? 3 :
    researchScore >= 35 ? 2 : 1;

  const researchSpeedMultiplier = 0.5 + (researchScore / 100);

  // Research types available
  const weaponResearch = country.militaryBudget >= 40 && country.science >= 40;
  const armorResearch = country.science >= 35;
  const medicalResearch = country.healthcare >= 50 && country.science >= 40;
  const cyberResearch = country.cyberCapabilities >= 50;
  const powerResearch = country.science >= 70 && country.lswActivity >= 50;

  // Education
  const universityAccess = country.higherEducation >= 40;
  const trainingQuality = country.higherEducation / 100;

  // Specialist recruitment based on education + science
  const specialists: string[] = [];
  if (country.higherEducation >= 30) specialists.push('Technicians');
  if (country.higherEducation >= 50) specialists.push('Engineers', 'Doctors');
  if (country.higherEducation >= 60) specialists.push('Scientists', 'Hackers');
  if (country.higherEducation >= 70) specialists.push('Researchers', 'Specialists');
  if (country.higherEducation >= 80) specialists.push('World Experts', 'Geniuses');

  // Tech market
  const techAvailability: ResearchSystem['techAvailability'] =
    researchScore >= 70 ? 'cutting_edge' :
    researchScore >= 50 ? 'standard' :
    researchScore >= 30 ? 'limited' : 'black_market_only';

  const techPriceModifier = (country.gdpPerCapita / 50) * (researchScore >= 60 ? 0.8 : 1.2);

  // Brain drain: high science + low GDP = talent leaves
  // Brain gain: high science + high GDP = talent comes
  const talentScore = country.science - Math.abs(country.gdpPerCapita - country.science) * 0.5;
  const talentPool: ResearchSystem['talentPool'] =
    talentScore >= 70 ? 'global_hub' :
    talentScore >= 50 ? 'high' :
    talentScore >= 30 ? 'moderate' :
    talentScore >= 10 ? 'low' : 'exodus';

  return {
    researchTier,
    researchSpeedMultiplier,
    weaponResearch,
    armorResearch,
    medicalResearch,
    cyberResearch,
    powerResearch,
    universityAccess,
    trainingQuality,
    specialistRecruitment: specialists,
    techAvailability,
    techPriceModifier,
    talentPool,
  };
}

// ============================================================================
// ORGANIZED CRIME SYSTEM
// Combines: Corruption + LawEnforcement + GDP + TerrorismActivity
// ============================================================================

export interface OrganizedCrimeSystem {
  // Crime organization level
  crimeOrganization: 'street_gangs' | 'local_crews' | 'organized' | 'cartel' | 'syndicate';
  crimePower: number;                 // 0-100: How powerful is organized crime?

  // Types of crime active
  drugTrafficking: boolean;
  humanTrafficking: boolean;
  armsTrafficking: boolean;
  cyberCrime: boolean;
  extortion: boolean;
  kidnapping: boolean;

  // Interaction options
  canPayProtection: boolean;          // Pay to be left alone
  protectionCost: number;             // Weekly cost
  canHireMusclE: boolean;
  muscleQuality: 'thugs' | 'enforcers' | 'professionals' | 'elite';

  // Risks
  randomExtortionChance: number;      // % chance of being shaken down
  territoryDisputes: boolean;         // Gang wars happening?

  // Connection to government
  governmentCollusion: boolean;       // Criminals and gov work together
  policeOnPayroll: boolean;
}

export function calculateOrganizedCrime(country: Country): OrganizedCrimeSystem {
  // Crime power: high corruption + low law enforcement
  const crimePower = Math.max(0,
    (country.governmentCorruption * 0.6) +
    ((100 - country.lawEnforcement) * 0.4)
  );

  const crimeOrganization: OrganizedCrimeSystem['crimeOrganization'] =
    crimePower >= 80 ? 'syndicate' :
    crimePower >= 60 ? 'cartel' :
    crimePower >= 40 ? 'organized' :
    crimePower >= 20 ? 'local_crews' : 'street_gangs';

  // Crime types
  const drugTrafficking = crimePower >= 20;
  const humanTrafficking = crimePower >= 40 && country.lawEnforcement <= 50;
  const armsTrafficking = crimePower >= 30 && country.militaryBudget >= 30;
  const cyberCrime = crimePower >= 30 && country.cyberCapabilities >= 40;
  const extortion = crimePower >= 25;
  const kidnapping = crimePower >= 35;

  // Interaction
  const canPayProtection = crimePower >= 30;
  const protectionCost = Math.round(500 + (crimePower * 20) * (country.gdpPerCapita / 50));
  const canHireMusclE = crimePower >= 20;

  const muscleQuality: OrganizedCrimeSystem['muscleQuality'] =
    crimePower >= 70 ? 'elite' :
    crimePower >= 50 ? 'professionals' :
    crimePower >= 30 ? 'enforcers' : 'thugs';

  // Risks
  const randomExtortionChance = Math.min(30, crimePower * 0.3);
  const territoryDisputes = crimePower >= 50 && country.lawEnforcement <= 60;

  // Government connection
  const governmentCollusion = country.governmentCorruption >= 70;
  const policeOnPayroll = country.governmentCorruption >= 50 && country.lawEnforcement <= 60;

  return {
    crimeOrganization,
    crimePower,
    drugTrafficking,
    humanTrafficking,
    armsTrafficking,
    cyberCrime,
    extortion,
    kidnapping,
    canPayProtection,
    protectionCost,
    canHireMusclE,
    muscleQuality,
    randomExtortionChance,
    territoryDisputes,
    governmentCollusion,
    policeOnPayroll,
  };
}

// ============================================================================
// MERCENARY RECRUITMENT SYSTEM
// Combines: Military + GDP + Corruption + WarStatus
// ============================================================================

export interface MercenarySystem {
  // Availability
  mercenariesAvailable: boolean;
  recruitmentDifficulty: 'easy' | 'moderate' | 'hard' | 'impossible';
  poolSize: 'none' | 'scarce' | 'limited' | 'moderate' | 'abundant';

  // Quality tiers available
  canHireThugs: boolean;          // Basic muscle
  canHireVeterans: boolean;       // Ex-military
  canHireElite: boolean;          // Special forces
  canHireSupers: boolean;         // Powered mercenaries

  // Pricing
  thugCostPerDay: number;
  veteranCostPerDay: number;
  eliteCostPerDay: number;
  superCostPerDay: number;

  // Quality modifiers
  averageSkillLevel: number;      // 1-10
  equipmentQuality: 1 | 2 | 3 | 4;
  loyaltyRating: number;          // 0-100 (how likely to betray)

  // Special
  canFormPMC: boolean;            // Can register a PMC here?
  warVeteransAvailable: boolean;  // Recent conflict = experienced fighters
  foreignLegionPresence: boolean; // French Foreign Legion style recruitment
}

export function calculateMercenarySystem(country: Country): MercenarySystem {
  // Mercenary availability: high military + corruption = lots of ex-soldiers for hire
  const mercScore = (country.militaryServices * 0.4) + (country.governmentCorruption * 0.3) + ((100 - country.lawEnforcement) * 0.3);

  const mercenariesAvailable = mercScore >= 30 || country.governmentCorruption >= 50;

  const recruitmentDifficulty: MercenarySystem['recruitmentDifficulty'] =
    !mercenariesAvailable ? 'impossible' :
    mercScore >= 60 ? 'easy' :
    mercScore >= 40 ? 'moderate' : 'hard';

  const poolSize: MercenarySystem['poolSize'] =
    !mercenariesAvailable ? 'none' :
    mercScore >= 70 ? 'abundant' :
    mercScore >= 50 ? 'moderate' :
    mercScore >= 35 ? 'limited' : 'scarce';

  // Quality tiers
  const canHireThugs = mercenariesAvailable;
  const canHireVeterans = mercenariesAvailable && country.militaryServices >= 40;
  const canHireElite = mercenariesAvailable && country.militaryServices >= 60 && country.governmentCorruption >= 40;
  const canHireSupers = mercenariesAvailable && country.lswActivity >= 60 && country.governmentCorruption >= 50;

  // Pricing based on GDP (rich countries = expensive mercs)
  const gdpFactor = country.gdpPerCapita / 50;
  const thugCostPerDay = Math.round(100 * gdpFactor);
  const veteranCostPerDay = Math.round(500 * gdpFactor);
  const eliteCostPerDay = Math.round(2000 * gdpFactor);
  const superCostPerDay = Math.round(10000 * gdpFactor);

  // Quality
  const averageSkillLevel = Math.min(10, 3 + (country.militaryServices / 20));
  const equipmentQuality: 1 | 2 | 3 | 4 =
    country.militaryBudget >= 75 ? 4 :
    country.militaryBudget >= 50 ? 3 :
    country.militaryBudget >= 25 ? 2 : 1;

  // Loyalty: low corruption = professional, high corruption = might switch sides
  const loyaltyRating = Math.max(20, 100 - country.governmentCorruption * 0.8);

  // Specials
  const canFormPMC = country.governmentCorruption >= 40 && country.militaryServices >= 50;
  const warVeteransAvailable = country.terrorismActivity >= 40 || country.militaryBudget >= 60;
  const foreignLegionPresence = country.iso === 'FR' || country.governmentCorruption >= 70;

  return {
    mercenariesAvailable,
    recruitmentDifficulty,
    poolSize,
    canHireThugs,
    canHireVeterans,
    canHireElite,
    canHireSupers,
    thugCostPerDay,
    veteranCostPerDay,
    eliteCostPerDay,
    superCostPerDay,
    averageSkillLevel,
    equipmentQuality,
    loyaltyRating,
    canFormPMC,
    warVeteransAvailable,
    foreignLegionPresence,
  };
}

// ============================================================================
// SAFE HOUSE SYSTEM
// Combines: Corruption + GDP + LawEnforcement + Surveillance
// ============================================================================

export interface SafeHouseSystem {
  // Availability
  safeHousesAvailable: boolean;
  availability: 'none' | 'rare' | 'uncommon' | 'common' | 'plentiful';

  // Quality tiers
  flophouseAvailable: boolean;    // Basic hiding spot
  apartmentAvailable: boolean;    // Decent cover
  safehouseAvailable: boolean;    // Secure location
  fortressAvailable: boolean;     // Hardened bunker

  // Pricing (per week)
  flophouseCost: number;
  apartmentCost: number;
  safehouseCost: number;
  fortressCost: number;

  // Security ratings
  flophouseSecurity: number;      // 0-100 chance of staying hidden
  apartmentSecurity: number;
  safehouseSecurity: number;
  fortressSecurity: number;

  // Special features
  canBribeForInfo: boolean;       // Pay landlord to warn you
  tunnelNetworkAccess: boolean;   // Escape routes
  falseWallsAvailable: boolean;   // Hidden rooms
  antiSurveillanceAvailable: boolean;
}

export function calculateSafeHouseSystem(country: Country): SafeHouseSystem {
  // Safe houses thrive in: corrupt places with low surveillance
  const safeHouseScore = (country.governmentCorruption * 0.4) + ((100 - country.lawEnforcement) * 0.3) + ((100 - country.intelligenceServices) * 0.3);

  const safeHousesAvailable = safeHouseScore >= 20;

  const availability: SafeHouseSystem['availability'] =
    !safeHousesAvailable ? 'none' :
    safeHouseScore >= 70 ? 'plentiful' :
    safeHouseScore >= 55 ? 'common' :
    safeHouseScore >= 40 ? 'uncommon' : 'rare';

  // Tiers
  const flophouseAvailable = safeHousesAvailable;
  const apartmentAvailable = safeHousesAvailable && safeHouseScore >= 30;
  const safehouseAvailable = safeHousesAvailable && safeHouseScore >= 50;
  const fortressAvailable = safeHousesAvailable && safeHouseScore >= 70 && country.governmentCorruption >= 60;

  // Pricing based on GDP
  const gdpFactor = country.gdpPerCapita / 50;
  const flophouseCost = Math.round(50 * gdpFactor);
  const apartmentCost = Math.round(300 * gdpFactor);
  const safehouseCost = Math.round(1500 * gdpFactor);
  const fortressCost = Math.round(10000 * gdpFactor);

  // Security: base + bonus from corruption (people look the other way)
  const corruptionBonus = country.governmentCorruption * 0.3;
  const surveillancePenalty = country.intelligenceServices * 0.2;

  const flophouseSecurity = Math.min(95, 30 + corruptionBonus - surveillancePenalty);
  const apartmentSecurity = Math.min(95, 50 + corruptionBonus - surveillancePenalty);
  const safehouseSecurity = Math.min(95, 70 + corruptionBonus - surveillancePenalty);
  const fortressSecurity = Math.min(98, 85 + corruptionBonus - surveillancePenalty);

  // Features
  const canBribeForInfo = country.governmentCorruption >= 40;
  const tunnelNetworkAccess = country.governmentCorruption >= 60 && country.gdpNational >= 40;
  const falseWallsAvailable = safeHouseScore >= 50;
  const antiSurveillanceAvailable = country.cyberCapabilities >= 50 && safeHouseScore >= 40;

  return {
    safeHousesAvailable,
    availability,
    flophouseAvailable,
    apartmentAvailable,
    safehouseAvailable,
    fortressAvailable,
    flophouseCost,
    apartmentCost,
    safehouseCost,
    fortressCost,
    flophouseSecurity,
    apartmentSecurity,
    safehouseSecurity,
    fortressSecurity,
    canBribeForInfo,
    tunnelNetworkAccess,
    falseWallsAvailable,
    antiSurveillanceAvailable,
  };
}

// ============================================================================
// BORDER CONTROL SYSTEM
// Combines: Military + Intelligence + GDP + Geographic factors
// ============================================================================

export interface BorderControlSystem {
  // Overall security
  borderSecurityLevel: number;    // 0-100
  porosity: 'porous' | 'weak' | 'moderate' | 'strong' | 'fortress';

  // Entry methods
  legalEntryDifficulty: number;   // 0-100
  visaRequired: boolean;
  visaCost: number;
  visaWaitDays: number;

  // Illegal entry
  illegalEntryCost: number;       // Smuggler fee
  illegalEntryRisk: number;       // % chance of getting caught
  smugglerAvailable: boolean;
  tunnelRoutes: boolean;
  seaRoutes: boolean;
  airRoutes: boolean;

  // At the border
  passportCheckThoroughness: number;  // 0-100
  biometricScanning: boolean;
  luggageSearchChance: number;    // %
  bribeBorderGuards: boolean;
  bribeCost: number;

  // Escape routes
  canFleeCountry: boolean;
  fleeingDifficulty: 'trivial' | 'easy' | 'moderate' | 'hard' | 'nearly_impossible';
}

export function calculateBorderControl(country: Country): BorderControlSystem {
  // Border security from military + intel + law enforcement
  const borderSecurityLevel = Math.round(
    (country.militaryServices * 0.3) +
    (country.intelligenceServices * 0.3) +
    (country.lawEnforcement * 0.4)
  );

  const porosity: BorderControlSystem['porosity'] =
    borderSecurityLevel >= 80 ? 'fortress' :
    borderSecurityLevel >= 60 ? 'strong' :
    borderSecurityLevel >= 40 ? 'moderate' :
    borderSecurityLevel >= 20 ? 'weak' : 'porous';

  // Legal entry
  const legalEntryDifficulty = borderSecurityLevel;
  const visaRequired = borderSecurityLevel >= 40;
  const visaCost = Math.round(50 + (borderSecurityLevel * 2));
  const visaWaitDays = Math.max(1, Math.round(borderSecurityLevel / 5));

  // Illegal entry
  const illegalEntryCost = Math.round(500 + (borderSecurityLevel * 50));
  const illegalEntryRisk = Math.min(90, borderSecurityLevel);
  const smugglerAvailable = country.governmentCorruption >= 30 || borderSecurityLevel <= 50;
  const tunnelRoutes = country.governmentCorruption >= 50 && borderSecurityLevel <= 60;
  const seaRoutes = country.coastline > 0 && borderSecurityLevel <= 70;
  const airRoutes = country.governmentCorruption >= 60 || borderSecurityLevel <= 40;

  // At border
  const passportCheckThoroughness = borderSecurityLevel;
  const biometricScanning = country.cyberCapabilities >= 60 && borderSecurityLevel >= 50;
  const luggageSearchChance = Math.min(80, borderSecurityLevel * 0.8);
  const bribeBorderGuards = country.governmentCorruption >= 40;
  const bribeCost = Math.round(200 * (100 - country.governmentCorruption) / 100 * (country.gdpPerCapita / 50));

  // Escape
  const canFleeCountry = borderSecurityLevel <= 90 || country.governmentCorruption >= 50;
  const fleeingDifficulty: BorderControlSystem['fleeingDifficulty'] =
    borderSecurityLevel >= 80 && country.governmentCorruption < 50 ? 'nearly_impossible' :
    borderSecurityLevel >= 60 ? 'hard' :
    borderSecurityLevel >= 40 ? 'moderate' :
    borderSecurityLevel >= 20 ? 'easy' : 'trivial';

  return {
    borderSecurityLevel,
    porosity,
    legalEntryDifficulty,
    visaRequired,
    visaCost,
    visaWaitDays,
    illegalEntryCost,
    illegalEntryRisk,
    smugglerAvailable,
    tunnelRoutes,
    seaRoutes,
    airRoutes,
    passportCheckThoroughness,
    biometricScanning,
    luggageSearchChance,
    bribeBorderGuards,
    bribeCost,
    canFleeCountry,
    fleeingDifficulty,
  };
}

// ============================================================================
// MEDIA & PROPAGANDA SYSTEM
// Combines: MediaFreedom + Corruption + GDP + Internet
// ============================================================================

export interface MediaSystem {
  // Freedom level
  pressFreedom: number;           // 0-100
  journalismQuality: 'propaganda' | 'biased' | 'mixed' | 'professional' | 'excellent';

  // Your ability to manipulate
  canPlantStories: boolean;
  storyPlantCost: number;
  canBuryStories: boolean;
  storyBuryCost: number;
  canBribeJournalists: boolean;
  journalistBribeCost: number;

  // Public opinion
  publicOpinionVolatility: number; // How fast opinion changes
  fakenewsEffectiveness: number;   // How well does misinformation spread?
  factCheckingStrength: number;    // How fast are lies exposed?

  // Internet/social
  socialMediaPenetration: number;
  viralSpreadRate: number;        // How fast do stories go viral?
  canControlNarrative: boolean;
  trollFarmAvailable: boolean;
  trollFarmCost: number;

  // Censorship
  canCensorStories: boolean;
  censorshipSpeed: number;        // Hours to suppress a story
  censorshipCost: number;
}

export function calculateMediaSystem(country: Country): MediaSystem {
  const pressFreedom = country.mediaFreedom;

  const journalismQuality: MediaSystem['journalismQuality'] =
    pressFreedom >= 80 ? 'excellent' :
    pressFreedom >= 60 ? 'professional' :
    pressFreedom >= 40 ? 'mixed' :
    pressFreedom >= 20 ? 'biased' : 'propaganda';

  // Manipulation: easier with corruption + low press freedom
  const manipulationEase = (country.governmentCorruption + (100 - pressFreedom)) / 2;

  const canPlantStories = manipulationEase >= 40;
  const storyPlantCost = Math.round(5000 * (100 - manipulationEase) / 100 * (country.gdpPerCapita / 50));
  const canBuryStories = manipulationEase >= 50;
  const storyBuryCost = Math.round(10000 * (100 - manipulationEase) / 100 * (country.gdpPerCapita / 50));
  const canBribeJournalists = country.governmentCorruption >= 40;
  const journalistBribeCost = Math.round(2000 * (country.gdpPerCapita / 50));

  // Public opinion
  const publicOpinionVolatility = 100 - (pressFreedom * 0.5); // Low freedom = easy to sway
  const fakenewsEffectiveness = Math.max(10, 100 - pressFreedom - (country.higherEducation * 0.3));
  const factCheckingStrength = (pressFreedom + country.higherEducation) / 2;

  // Internet
  const socialMediaPenetration = Math.min(95, country.cyberCapabilities + (country.gdpPerCapita * 0.3));
  const viralSpreadRate = socialMediaPenetration * 0.8;
  const canControlNarrative = pressFreedom <= 40 || country.governmentCorruption >= 70;
  const trollFarmAvailable = country.cyberCapabilities >= 40 && country.governmentCorruption >= 40;
  const trollFarmCost = Math.round(1000 * (country.gdpPerCapita / 50));

  // Censorship
  const canCensorStories = pressFreedom <= 50 || country.governmentCorruption >= 60;
  const censorshipSpeed = Math.max(1, 48 - (country.intelligenceServices * 0.4) - ((100 - pressFreedom) * 0.2));
  const censorshipCost = Math.round(3000 * (pressFreedom / 100) * (country.gdpPerCapita / 50));

  return {
    pressFreedom,
    journalismQuality,
    canPlantStories,
    storyPlantCost,
    canBuryStories,
    storyBuryCost,
    canBribeJournalists,
    journalistBribeCost,
    publicOpinionVolatility,
    fakenewsEffectiveness,
    factCheckingStrength,
    socialMediaPenetration,
    viralSpreadRate,
    canControlNarrative,
    trollFarmAvailable,
    trollFarmCost,
    canCensorStories,
    censorshipSpeed,
    censorshipCost,
  };
}

// ============================================================================
// POLITICAL INFLUENCE SYSTEM
// Combines: GDP + Corruption + MediaFreedom + GovernmentType
// ============================================================================

export interface PoliticalSystem {
  // Government stability
  stabilityRating: number;        // 0-100
  coupRisk: 'none' | 'low' | 'moderate' | 'high' | 'imminent';
  revolutionRisk: number;         // %

  // Your influence options
  canLobby: boolean;
  lobbyCost: number;
  canBribePoliticians: boolean;
  politicianBribeCost: number;
  canFundCampaigns: boolean;
  campaignFundingEffect: number;  // How much does money sway elections?

  // Political access
  canMeetOfficials: boolean;
  officialAccessDifficulty: 'impossible' | 'hard' | 'moderate' | 'easy';
  canGetGovernmentContracts: boolean;
  contractCorruptionMultiplier: number; // Kickback expected

  // Legal system
  canBribeJudges: boolean;
  judgeBribeCost: number;
  lawsuitCost: number;
  legalSystemSpeed: number;       // Days for case resolution

  // Special
  canRunForOffice: boolean;
  canStageCoup: boolean;
  coupCost: number;
  coupSuccessChance: number;
}

export function calculatePoliticalSystem(country: Country): PoliticalSystem {
  // Stability based on multiple factors
  const stabilityRating = Math.round(
    (100 - country.governmentCorruption * 0.3) +
    (country.gdpPerCapita * 0.2) +
    (country.socialDevelopment * 0.3) +
    ((100 - country.terrorismActivity) * 0.2)
  ) / 4 * 100 / 100;

  const coupRisk: PoliticalSystem['coupRisk'] =
    stabilityRating >= 80 ? 'none' :
    stabilityRating >= 60 ? 'low' :
    stabilityRating >= 40 ? 'moderate' :
    stabilityRating >= 20 ? 'high' : 'imminent';

  const revolutionRisk = Math.max(0, 100 - stabilityRating - (country.lawEnforcement * 0.3));

  // Influence based on corruption
  const canLobby = country.gdpPerCapita >= 30; // Need some economy
  const lobbyCost = Math.round(50000 * (country.gdpPerCapita / 50));
  const canBribePoliticians = country.governmentCorruption >= 40;
  const politicianBribeCost = Math.round(20000 * (100 - country.governmentCorruption) / 100 * (country.gdpPerCapita / 50));
  const canFundCampaigns = country.mediaFreedom >= 30;
  const campaignFundingEffect = (100 - country.mediaFreedom) + country.governmentCorruption;

  // Access
  const accessScore = country.governmentCorruption + (100 - country.lawEnforcement);
  const canMeetOfficials = accessScore >= 50 || country.gdpPerCapita >= 60;
  const officialAccessDifficulty: PoliticalSystem['officialAccessDifficulty'] =
    accessScore >= 80 ? 'easy' :
    accessScore >= 50 ? 'moderate' :
    accessScore >= 30 ? 'hard' : 'impossible';
  const canGetGovernmentContracts = country.governmentCorruption >= 30 || country.gdpPerCapita >= 50;
  const contractCorruptionMultiplier = 1 + (country.governmentCorruption / 100);

  // Legal
  const canBribeJudges = country.governmentCorruption >= 50;
  const judgeBribeCost = Math.round(30000 * (100 - country.governmentCorruption) / 100 * (country.gdpPerCapita / 50));
  const lawsuitCost = Math.round(10000 * (country.gdpPerCapita / 50));
  const legalSystemSpeed = Math.max(7, 365 - (country.gdpPerCapita * 2) - (country.lawEnforcement * 2));

  // Special
  const canRunForOffice = country.mediaFreedom >= 40;
  const canStageCoup = stabilityRating <= 50 && country.governmentCorruption >= 40;
  const coupCost = Math.round(1000000 * (stabilityRating / 100));
  const coupSuccessChance = Math.max(5, 100 - stabilityRating - (country.militaryServices * 0.3));

  return {
    stabilityRating,
    coupRisk,
    revolutionRisk,
    canLobby,
    lobbyCost,
    canBribePoliticians,
    politicianBribeCost,
    canFundCampaigns,
    campaignFundingEffect,
    canMeetOfficials,
    officialAccessDifficulty,
    canGetGovernmentContracts,
    contractCorruptionMultiplier,
    canBribeJudges,
    judgeBribeCost,
    lawsuitCost,
    legalSystemSpeed,
    canRunForOffice,
    canStageCoup,
    coupCost,
    coupSuccessChance,
  };
}

// ============================================================================
// SUPERHUMAN AFFAIRS SYSTEM
// Combines: LSW + Intelligence + Military + Science
// ============================================================================

export interface SuperhumanAffairsSystem {
  // Registration status
  registrationRequired: boolean;
  registrationEnforcement: 'none' | 'voluntary' | 'encouraged' | 'mandatory' | 'hunted';

  // Government stance
  governmentAttitude: 'hostile' | 'suspicious' | 'neutral' | 'supportive' | 'recruiting';
  superheroLegalStatus: 'illegal' | 'gray_area' | 'licensed' | 'encouraged' | 'state_sponsored';

  // Tracking
  superhumanDatabase: boolean;
  trackingTechnology: boolean;
  powerNullifiers: boolean;
  containmentFacilities: boolean;

  // Opportunities
  canJoinGovernment: boolean;
  governmentPayGrade: number;     // Salary multiplier
  canOperateFreely: boolean;
  vigilanteResponse: 'shoot_on_sight' | 'arrest' | 'investigate' | 'tolerate' | 'support';

  // Research
  powerResearchActive: boolean;
  enhancementProgramsAvailable: boolean;
  powerSuppressionResearch: boolean;

  // Underground
  undergroundSuperCommunity: boolean;
  safeHousesForSupers: boolean;
  antiSuperheroGroups: boolean;

  // Public
  publicOpinionOfSupers: number;  // -100 to +100
  mediaPortrayal: 'villains' | 'threats' | 'mixed' | 'heroes' | 'celebrities';
}

export function calculateSuperhumanAffairs(country: Country): SuperhumanAffairsSystem {
  const lswPolicy = country.lswRegulations;

  const registrationRequired = lswPolicy === 'Registration' || lswPolicy === 'Banned';
  const registrationEnforcement: SuperhumanAffairsSystem['registrationEnforcement'] =
    lswPolicy === 'Banned' ? 'hunted' :
    lswPolicy === 'Registration' ? 'mandatory' :
    lswPolicy === 'Regulated' ? 'encouraged' :
    lswPolicy === 'Legal' ? 'voluntary' : 'none';

  // Government attitude based on LSW + intelligence (paranoia)
  const governmentAttitude: SuperhumanAffairsSystem['governmentAttitude'] =
    lswPolicy === 'Banned' ? 'hostile' :
    lswPolicy === 'Registration' && country.intelligenceServices >= 60 ? 'suspicious' :
    lswPolicy === 'Regulated' ? 'neutral' :
    lswPolicy === 'Legal' && country.militaryServices >= 50 ? 'recruiting' : 'supportive';

  const superheroLegalStatus: SuperhumanAffairsSystem['superheroLegalStatus'] =
    lswPolicy === 'Banned' ? 'illegal' :
    lswPolicy === 'Registration' ? 'licensed' :
    lswPolicy === 'Regulated' ? 'gray_area' :
    country.militaryServices >= 60 ? 'state_sponsored' : 'encouraged';

  // Tracking technology
  const superhumanDatabase = lswPolicy === 'Registration' || (country.intelligenceServices >= 60 && lswPolicy !== 'Legal');
  const trackingTechnology = country.cyberCapabilities >= 60 && country.intelligenceServices >= 50;
  const powerNullifiers = country.science >= 70 && (lswPolicy === 'Banned' || lswPolicy === 'Registration');
  const containmentFacilities = country.militaryServices >= 50 && lswPolicy !== 'Legal';

  // Opportunities
  const canJoinGovernment = lswPolicy !== 'Banned' && country.militaryServices >= 40;
  const governmentPayGrade = lswPolicy === 'Legal' ? 3 : lswPolicy === 'Regulated' ? 2 : 1;
  const canOperateFreely = lswPolicy === 'Legal' || (lswPolicy === 'Regulated' && country.governmentCorruption >= 40);

  const vigilanteResponse: SuperhumanAffairsSystem['vigilanteResponse'] =
    lswPolicy === 'Banned' ? 'shoot_on_sight' :
    lswPolicy === 'Registration' && country.lawEnforcement >= 60 ? 'arrest' :
    lswPolicy === 'Regulated' ? 'investigate' :
    country.governmentPerception === 'Supportive' ? 'support' : 'tolerate';

  // Research
  const powerResearchActive = country.science >= 60 && country.lswActivity >= 40;
  const enhancementProgramsAvailable = country.science >= 70 && lswPolicy !== 'Banned';
  const powerSuppressionResearch = country.science >= 50 && (lswPolicy === 'Banned' || lswPolicy === 'Registration');

  // Underground
  const undergroundSuperCommunity = lswPolicy === 'Banned' || (lswPolicy === 'Registration' && country.governmentCorruption >= 40);
  const safeHousesForSupers = undergroundSuperCommunity && country.governmentCorruption >= 50;
  const antiSuperheroGroups = lswPolicy === 'Banned' || country.terrorismActivity >= 40;

  // Public opinion: influenced by media freedom and government stance
  const baseOpinion = lswPolicy === 'Legal' ? 50 : lswPolicy === 'Regulated' ? 20 : lswPolicy === 'Registration' ? -10 : -50;
  const publicOpinionOfSupers = Math.max(-100, Math.min(100, baseOpinion + (country.mediaFreedom - 50)));

  const mediaPortrayal: SuperhumanAffairsSystem['mediaPortrayal'] =
    publicOpinionOfSupers >= 60 ? 'celebrities' :
    publicOpinionOfSupers >= 30 ? 'heroes' :
    publicOpinionOfSupers >= -20 ? 'mixed' :
    publicOpinionOfSupers >= -50 ? 'threats' : 'villains';

  return {
    registrationRequired,
    registrationEnforcement,
    governmentAttitude,
    superheroLegalStatus,
    superhumanDatabase,
    trackingTechnology,
    powerNullifiers,
    containmentFacilities,
    canJoinGovernment,
    governmentPayGrade,
    canOperateFreely,
    vigilanteResponse,
    powerResearchActive,
    enhancementProgramsAvailable,
    powerSuppressionResearch,
    undergroundSuperCommunity,
    safeHousesForSupers,
    antiSuperheroGroups,
    publicOpinionOfSupers,
    mediaPortrayal,
  };
}

// ============================================================================
// MASTER COMBINED EFFECTS
// All systems in one place - 12 combined systems!
// ============================================================================

export interface CombinedEffects {
  cloning: CloningSystem;
  blackMarket: BlackMarketSystem;
  surveillance: SurveillanceSystem;
  medical: MedicalSystem;
  research: ResearchSystem;
  organizedCrime: OrganizedCrimeSystem;
  mercenaries: MercenarySystem;
  safeHouses: SafeHouseSystem;
  borders: BorderControlSystem;
  media: MediaSystem;
  politics: PoliticalSystem;
  superhuman: SuperhumanAffairsSystem;
}

export function calculateAllCombinedEffects(country: Country): CombinedEffects {
  return {
    cloning: calculateCloningSystem(country),
    blackMarket: calculateBlackMarket(country),
    surveillance: calculateSurveillance(country),
    medical: calculateMedicalSystem(country),
    research: calculateResearchSystem(country),
    organizedCrime: calculateOrganizedCrime(country),
    mercenaries: calculateMercenarySystem(country),
    safeHouses: calculateSafeHouseSystem(country),
    borders: calculateBorderControl(country),
    media: calculateMediaSystem(country),
    politics: calculatePoliticalSystem(country),
    superhuman: calculateSuperhumanAffairs(country),
  };
}

// ============================================================================
// NEWS/AD GENERATION HOOKS
// These generate content for the news system based on combined effects
// ============================================================================

export interface LocalAds {
  category: string;
  headline: string;
  details: string;
  price?: number;
}

export function generateLocalAds(country: Country, combined: CombinedEffects): LocalAds[] {
  const ads: LocalAds[] = [];

  // Cloning ads
  if (combined.cloning.available && combined.cloning.regulation !== 'banned') {
    ads.push({
      category: 'Cloning Services',
      headline: combined.cloning.cloneQuality >= 70
        ? 'Premium Clone Solutions - 99.8% Genetic Fidelity'
        : 'Affordable Cloning Services - New Life, New You',
      details: `Full body clone in ${combined.cloning.waitTime} days. Memory transfer ${combined.cloning.memoryTransfer ? 'available' : 'not available'}.`,
      price: combined.cloning.baseCost,
    });

    if (combined.cloning.organHarvesting) {
      ads.push({
        category: 'Medical',
        headline: 'Replacement Organs - No Waiting List',
        details: 'Clone-grown organs. Perfect genetic match. Same-day availability.',
        price: Math.round(combined.cloning.baseCost * 0.3),
      });
    }
  }

  if (combined.cloning.blackMarketClones) {
    ads.push({
      category: 'Classified',
      headline: 'DISCRETE REPLICATION SERVICES',
      details: `No questions asked. Meet at the docks. ${combined.cloning.cloneDefectChance}% satisfaction rate.`,
      price: Math.round(combined.cloning.baseCost * 0.5),
    });
  }

  // Medical tourism
  if (combined.medical.medicalTourismScore >= 60) {
    ads.push({
      category: 'Medical Tourism',
      headline: `World-Class Healthcare at ${Math.round(combined.medical.healthcareCost * 100)}% International Prices`,
      details: `Tier ${combined.medical.hospitalTier} facilities. ${combined.medical.recoverySpeedMultiplier >= 1.5 ? 'Accelerated recovery programs.' : ''}`,
      price: combined.medical.surgeryCost,
    });
  }

  if (combined.medical.cybernetics) {
    ads.push({
      category: 'Enhancement',
      headline: 'CYBERNETIC ENHANCEMENT CENTER',
      details: 'Military-grade implants. Neural interfaces. Strength augmentation.',
      price: Math.round(combined.medical.surgeryCost * 3),
    });
  }

  // Research/Tech
  if (combined.research.techAvailability === 'cutting_edge') {
    ads.push({
      category: 'Technology',
      headline: 'Latest Tech - Before It Hits Global Markets',
      details: 'Prototype gadgets, experimental gear, bleeding-edge equipment.',
    });
  }

  // Black market (subtle ads)
  if (combined.blackMarket.available && combined.blackMarket.accessDifficulty !== 'impossible') {
    if (combined.blackMarket.forgedDocumentsAvailable) {
      ads.push({
        category: 'Travel Services',
        headline: 'NEW IDENTITY SOLUTIONS - Fast Processing',
        details: 'Passports, visas, work permits. All nationalities available.',
        price: 5000,
      });
    }

    if (combined.blackMarket.militaryWeaponsAvailable) {
      ads.push({
        category: 'Security',
        headline: 'MILITARY SURPLUS - Direct From Source',
        details: `Quality gear at ${Math.round(combined.blackMarket.weaponPriceModifier * 100)}% market prices.`,
      });
    }
  }

  // Mercenary ads
  if (combined.mercenaries.mercenariesAvailable) {
    if (combined.mercenaries.canHireElite) {
      ads.push({
        category: 'Security Contractors',
        headline: 'ELITE OPERATORS AVAILABLE - Discreet. Professional. Effective.',
        details: `Former special forces. Tier ${combined.mercenaries.equipmentQuality} equipment. ${combined.mercenaries.loyaltyRating}% loyalty rating.`,
        price: combined.mercenaries.eliteCostPerDay * 7,
      });
    }
    if (combined.mercenaries.canFormPMC) {
      ads.push({
        category: 'Business Services',
        headline: 'PMC REGISTRATION SERVICES - Go Legit',
        details: 'Full incorporation, licensing, and government contract assistance.',
        price: 50000,
      });
    }
  }

  // Safe house ads
  if (combined.safeHouses.safeHousesAvailable) {
    if (combined.safeHouses.fortressAvailable) {
      ads.push({
        category: 'Real Estate',
        headline: 'SECURE COMPOUND - Privacy Guaranteed',
        details: `${combined.safeHouses.fortressSecurity}% security rating. ${combined.safeHouses.tunnelNetworkAccess ? 'Multiple exit routes.' : 'Reinforced perimeter.'}`,
        price: combined.safeHouses.fortressCost * 4,
      });
    } else if (combined.safeHouses.safehouseAvailable) {
      ads.push({
        category: 'Real Estate',
        headline: 'QUIET RENTAL - No Questions Asked',
        details: 'Perfect for those who value their privacy. Weekly rates available.',
        price: combined.safeHouses.safehouseCost,
      });
    }
  }

  // Border services
  if (combined.borders.smugglerAvailable) {
    ads.push({
      category: 'Travel',
      headline: 'ALTERNATIVE TRAVEL ARRANGEMENTS',
      details: `Skip the lines. ${combined.borders.tunnelRoutes ? 'Multiple routes available.' : 'Discrete transportation.'} ${Math.round(100 - combined.borders.illegalEntryRisk)}% success rate.`,
      price: combined.borders.illegalEntryCost,
    });
  }

  // Media manipulation
  if (combined.media.trollFarmAvailable) {
    ads.push({
      category: 'Marketing',
      headline: 'REPUTATION MANAGEMENT SERVICES',
      details: `Social media campaigns. Narrative control. ${combined.media.fakenewsEffectiveness >= 60 ? 'High impact guaranteed.' : 'Results may vary.'}`,
      price: combined.media.trollFarmCost * 30,
    });
  }

  if (combined.media.canPlantStories) {
    ads.push({
      category: 'PR Services',
      headline: 'MEDIA PLACEMENT - Get Your Story Out',
      details: 'Guaranteed coverage. All major outlets. Fast turnaround.',
      price: combined.media.storyPlantCost,
    });
  }

  // Political services
  if (combined.politics.canBribePoliticians) {
    ads.push({
      category: 'Consulting',
      headline: 'GOVERNMENT RELATIONS CONSULTING',
      details: `Legislative access. Regulatory assistance. ${combined.politics.officialAccessDifficulty === 'easy' ? 'Direct lines to decision makers.' : 'We know the right people.'}`,
      price: combined.politics.lobbyCost,
    });
  }

  // Superhuman services
  if (combined.superhuman.enhancementProgramsAvailable) {
    ads.push({
      category: 'Research',
      headline: 'ENHANCEMENT RESEARCH PROGRAM - Volunteers Needed',
      details: 'Cutting-edge genetic research. Compensation provided. Results not guaranteed.',
      price: -10000, // They pay you!
    });
  }

  if (combined.superhuman.undergroundSuperCommunity && combined.superhuman.safeHousesForSupers) {
    ads.push({
      category: 'Community',
      headline: 'SPECIAL COMMUNITY CENTER - You Know If You Belong',
      details: 'Safe space. Like-minded individuals. No questions.',
    });
  }

  // Organized crime services
  if (combined.organizedCrime.canPayProtection) {
    ads.push({
      category: 'Insurance',
      headline: `"PROTECTION" SERVICES - ${combined.organizedCrime.crimeOrganization.toUpperCase()} APPROVED`,
      details: `Guaranteed safety in our territory. Weekly rates. ${combined.organizedCrime.territoryDisputes ? 'Competitive pricing due to market conditions.' : 'Stable rates.'}`,
      price: combined.organizedCrime.protectionCost,
    });
  }

  if (combined.organizedCrime.hitmenAvailable) {
    ads.push({
      category: 'Problem Solving',
      headline: 'PERMANENT SOLUTIONS TO TEMPORARY PROBLEMS',
      details: `${combined.organizedCrime.muscleQuality} available. Discrete. Professional.`,
      price: combined.blackMarket.hitmanCost,
    });
  }

  return ads;
}

// ============================================================================
// QUICK COMPARISON FUNCTION
// Show how different countries play differently
// ============================================================================

export function compareCountries(countryA: Country, countryB: Country): string {
  const effectsA = calculateAllCombinedEffects(countryA);
  const effectsB = calculateAllCombinedEffects(countryB);

  const lines: string[] = [
    `\n=== ${countryA.name} vs ${countryB.name} ===\n`,
    `| System | ${countryA.iso} | ${countryB.iso} |`,
    `|--------|-----|-----|`,
    `| Cloning Available | ${effectsA.cloning.available ? 'YES' : 'NO'} | ${effectsB.cloning.available ? 'YES' : 'NO'} |`,
    `| Clone Quality | ${effectsA.cloning.cloneQuality}% | ${effectsB.cloning.cloneQuality}% |`,
    `| Black Market | ${effectsA.blackMarket.accessDifficulty} | ${effectsB.blackMarket.accessDifficulty} |`,
    `| Surveillance | ${effectsA.surveillance.privacyLevel} | ${effectsB.surveillance.privacyLevel} |`,
    `| Hospital Tier | ${effectsA.medical.hospitalTier} | ${effectsB.medical.hospitalTier} |`,
    `| Research Tier | ${effectsA.research.researchTier} | ${effectsB.research.researchTier} |`,
    `| Merc Availability | ${effectsA.mercenaries.poolSize} | ${effectsB.mercenaries.poolSize} |`,
    `| Safe Houses | ${effectsA.safeHouses.availability} | ${effectsB.safeHouses.availability} |`,
    `| Border Security | ${effectsA.borders.porosity} | ${effectsB.borders.porosity} |`,
    `| Media Freedom | ${effectsA.media.journalismQuality} | ${effectsB.media.journalismQuality} |`,
    `| Political Stability | ${effectsA.politics.coupRisk} | ${effectsB.politics.coupRisk} |`,
    `| Super Legal Status | ${effectsA.superhuman.superheroLegalStatus} | ${effectsB.superhuman.superheroLegalStatus} |`,
  ];

  return lines.join('\n');
}

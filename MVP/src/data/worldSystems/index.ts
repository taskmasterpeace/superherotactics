// =============================================================================
// WORLD SYSTEMS - Central Hub
// =============================================================================
// Comprehensive world simulation combining country stats for emergent gameplay

export * from './geopoliticsSystem';
export * from './healthcareSystem';
export * from './underworldSystem';
export * from './characterRegistry';
export * from './educationSystem';
export * from './militarySystem';

// =============================================================================
// WORLD SYSTEMS OVERVIEW
// =============================================================================
//
// These systems use the COMBINED EFFECTS philosophy:
// Single stats are WEAK. Combined stats create RICH gameplay.
//
// Each system combines 2-4 country/city stats to create emergent mechanics:
//
// GEOPOLITICS: Uses Intel + Military + GDP + MediaFreedom
//   - Country relationship matrix (1-6 scale)
//   - Hot wars, cold wars, alliances
//   - Affects: travel, missions, faction availability
//
// HEALTHCARE: Uses Healthcare + Science + GDP + Lifestyle
//   - Hospital quality, recovery time
//   - Cloning availability and quality
//   - Augmentation/cybernetics
//   - Critical injuries tracking
//
// UNDERWORLD: Uses Corruption + Military - LawEnforcement
//   - Black market access
//   - Illegal equipment availability
//   - Smuggling contacts
//   - Risk of sting operations
//
// CHARACTER REGISTRY: Global NPC tracking
//   - Every character (alive/dead)
//   - Relationships between characters
//   - History and actions
//
// EDUCATION: Uses Education + Science + GDP
//   - Training facilities
//   - Skill development
//   - Certification systems
//
// MILITARY: Uses Military + Intel + LawEnforcement
//   - Government response levels
//   - Special forces availability
//   - Military bases and operations
// =============================================================================

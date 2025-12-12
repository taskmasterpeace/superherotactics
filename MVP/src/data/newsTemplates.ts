/**
 * NEWS TEMPLATES AND GENERATION DATA
 *
 * Template-based headline and article generation for the News System.
 * Used by newsGenerator.ts to create dynamic, contextual news articles.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface NewsArticle {
  id: string;
  headline: string;
  source: NewsSource;
  category: NewsCategory;
  bias: NewsBias;
  generatedFrom: NewsOrigin;
  fullText?: string;
  imageUrl?: string;
  relatedCountries: string[];
  relatedFactions: string[];
  timestamp: number; // game time
  expirationTime?: number; // when article becomes old
  fameImpact?: number;
  publicOpinionShift?: Record<string, number>; // country -> opinion delta
  missionOpportunity?: any; // MissionSeed
}

export type NewsCategory =
  | 'world'
  | 'local'
  | 'crime'
  | 'politics'
  | 'sports'
  | 'entertainment';

export type NewsBias =
  | 'pro-player'
  | 'anti-player'
  | 'neutral'
  | 'pro-regulation'
  | 'anti-regulation';

export type NewsSource =
  | 'Global News Network'
  | 'Eastern Times'
  | 'Independent Wire'
  | 'Social Truth Network'
  | string; // Allow procedural city newspapers

export interface NewsOrigin {
  type: 'player_action' | 'world_event' | 'random_event' | 'rumor';
  missionId?: string;
  characterId?: string;
  faction?: string;
  eventType?: string;
}

// =============================================================================
// NEWS SOURCES (168 procedural + 4 major)
// =============================================================================

export const MAJOR_NEWS_SOURCES = {
  GNN: {
    name: 'Global News Network',
    bias: 'pro-regulation' as const,
    coverage: 'international',
    credibility: 85,
    alignment: 'US-aligned'
  },
  EASTERN: {
    name: 'Eastern Times',
    bias: 'anti-player' as const,
    coverage: 'international',
    credibility: 70,
    alignment: 'China-Russia-aligned'
  },
  INDEPENDENT: {
    name: 'Independent Wire',
    bias: 'neutral' as const,
    coverage: 'international',
    credibility: 95,
    alignment: 'neutral'
  },
  SOCIAL_TRUTH: {
    name: 'Social Truth Network',
    bias: 'anti-regulation' as const,
    coverage: 'internet',
    credibility: 40,
    alignment: 'conspiracy-leaning'
  }
};

// Generate local newspaper names procedurally
export function getLocalNewspaper(city: string, country: string): NewsSource {
  const formats = [
    `${city} Daily Tribune`,
    `${city} Herald`,
    `${city} Times`,
    `${city} Post`,
    `The ${city} Observer`,
    `${city} News Network`
  ];
  return formats[Math.floor(Math.random() * formats.length)];
}

// =============================================================================
// HEADLINE TEMPLATES
// =============================================================================

export const HEADLINE_TEMPLATES = {
  // SUCCESS - Low Collateral
  mission_success_clean: [
    "Vigilante Stops {crime} in {city}",
    "{descriptor} Thwarts {crime}, No Casualties",
    "Masked Hero Intervenes in {city} {crime}",
    "{city} {crime}: {descriptor} Saves the Day",
    "Local Hero Prevents {crime} Tragedy",
    "{descriptor} Stops {threat}, Praised by {city} Police",
  ],

  // SUCCESS - High Collateral
  mission_success_messy: [
    "Hero Stops {crime} But Causes ${amount} in Damages",
    "{descriptor}'s Reckless Tactics Cost {city} Dearly",
    "{crime} Thwarted, But at What Cost?",
    "Vigilante Destroys {target} While Stopping {crime}",
    "{city} in Ruins After {descriptor}'s Intervention",
    "Hero Saves Day, Taxpayers Foot ${amount} Bill",
  ],

  // SUCCESS - Casualties
  mission_success_casualties: [
    "{crime} Stopped, {casualties} Civilians Killed",
    "Tragic Victory: {descriptor} Saves Hostages, Bystanders Die",
    "{city} Mourns {casualties} Dead After Vigilante Action",
    "Hero's Methods Questioned After {casualties} Deaths",
    "{descriptor} Under Fire for Civilian Casualties",
  ],

  // FAILURE
  mission_failure: [
    "Vigilante Fails to Stop {crime} in {city}",
    "{threat} Escapes Despite Hero's Efforts",
    "Amateur Vigilante Outmatched in {city}",
    "{crime} Successful, {descriptor} Nowhere to Be Found",
    "{city} Police Criticize Vigilante's Failed Intervention",
    "{threat} Makes Mockery of Local Hero",
  ],

  // INTERNATIONAL INCIDENT
  illegal_operation: [
    "Foreign Operative Violates {country} Sovereignty",
    "{country} Government Condemns Unauthorized Vigilante",
    "Diplomatic Crisis: {descriptor} Operates Illegally in {city}",
    "{country} Issues Arrest Warrant for Masked Vigilante",
    "International Incident Sparked by Rogue Hero",
  ],

  // HIGH FAME
  celebrity_hero: [
    "Legendary {heroName} Strikes Again in {city}",
    "Icon {heroName} Saves {city} From {threat}",
    "{heroName}: The Hero {city} Needed",
    "Global Celebrity {heroName} Visits {city}, Stops {crime}",
    "{heroName} Cements Status as World's Greatest Hero",
  ],

  // WORLD EVENTS - Villain Attack
  villain_attack: [
    "{faction} Attacks {city} - {casualties} Dead",
    "Terrorist Strike: {faction} Claims Responsibility",
    "{city} Under Siege by {threat}",
    "LSW Terrorist Attack Leaves {city} in Chaos",
    "{faction} Emerges as Major Threat After {city} Attack",
  ],

  // WORLD EVENTS - Political
  political_change: [
    "{country} Passes Controversial LSW Registration Act",
    "New {country} Government Vows to 'Regulate Vigilantes'",
    "{leaderTitle} {leader} Signs Anti-Vigilante Legislation",
    "{country} Election Results: LSW Policy Shift Expected",
    "Breaking: {country} Bans All Vigilante Activity",
  ],

  // RUMOR SEEDS
  rumor_vague: [
    "Strange Lights Seen Over {city} Warehouse District",
    "Local Resident Reports Unusual Activity in {sector}",
    "Is Something Happening in {city}?",
    "Anonymous Tip: {threat} Spotted in {sector}",
    "Police Baffled by Series of {city} Incidents",
  ],

  // FILLER - Sports
  sports: [
    "Superhuman Olympics: {country} Team Takes Gold",
    "LSW Athlete Breaks World Record in {event}",
    "{city} Arena Hosts Controversial LSW Exhibition Match",
    "Powered Individual Banned from Professional Sports",
  ],

  // FILLER - Entertainment
  entertainment: [
    "LSW Celebrity 'Thunderstrike' Announces Retirement",
    "{city} Comic-Con Features Real-Life Heroes",
    "New Documentary Explores Life of {heroName}",
    "Hollywood Adapts {city} Hero's Story to Film",
  ],
};

// =============================================================================
// ARTICLE BODY TEMPLATES
// =============================================================================

export const ARTICLE_BODY_TEMPLATES = {
  mission_success: `
{city}, {country} - {descriptor} successfully intervened in a {crime} yesterday, preventing what authorities describe as a potentially catastrophic situation.

The incident occurred at approximately {time} when {threat} attempted to {action}. Witnesses report seeing {descriptor} arrive on the scene and engage the suspects.

{outcome_description}

Local law enforcement officials have {police_reaction}. This marks the {nth} time vigilante activity has been reported in {city} this year.

{country}'s stance on vigilantism remains {vigilantism_legal}. Legal experts suggest {legal_implications}.

The incident has sparked debate about the role of LSW individuals in law enforcement. Public opinion remains divided.
  `.trim(),

  mission_failure: `
{city}, {country} - A vigilante's attempt to stop a {crime} ended in failure yesterday, with suspects successfully escaping the scene.

The unidentified individual, described by witnesses as {descriptor}, engaged with {threat} at {location} but was reportedly {failure_reason}.

{casualties_or_damage}

Police arrived shortly after the incident concluded and are currently investigating. No suspects are currently in custody.

Critics of vigilante activity point to this incident as evidence of the dangers of untrained individuals attempting law enforcement. "This is exactly why we have trained professionals," said {police_spokesperson}.

{country}'s vigilantism laws classify such actions as {legal_status}.
  `.trim(),

  world_event_attack: `
{city}, {country} - {faction} claimed responsibility for a devastating attack on {target} that left {casualties} dead and hundreds more injured.

The attack, which occurred at {time}, involved {attack_method}. Authorities believe it was orchestrated by LSW individuals affiliated with the {faction} organization.

Emergency services responded to the scene, but the scale of destruction has overwhelmed local resources. {country_leader} has declared a state of emergency and activated military LSW response protocols.

This marks the largest {faction} attack in {country} to date. Intelligence agencies had warned of increased activity but were unable to prevent the incident.

International leaders have condemned the attack. {allied_country} has offered humanitarian assistance.

Security experts warn this may signal an escalation in {faction}'s operations. Citizens are advised to remain vigilant and report suspicious activity.
  `.trim(),
};

// =============================================================================
// DESCRIPTOR SELECTION (Based on Fame)
// =============================================================================

export function selectDescriptor(fame: number, heroName?: string): string {
  if (fame >= 300 && heroName) {
    return heroName; // Celebrity status - use hero name
  }
  if (fame >= 150) {
    return heroName || 'The Vigilante'; // National recognition
  }
  if (fame >= 50) {
    const descriptors = [
      'The Armored Operative',
      'Known Vigilante',
      'Local Hero',
      'The Masked Defender'
    ];
    return descriptors[Math.floor(Math.random() * descriptors.length)];
  }
  // Low fame - anonymous
  const descriptors = [
    'Unknown Vigilante',
    'Masked Individual',
    'Unidentified Hero',
    'Mystery Operative',
    'Anonymous Defender'
  ];
  return descriptors[Math.floor(Math.random() * descriptors.length)];
}

// =============================================================================
// TEMPLATE REPLACEMENT
// =============================================================================

export function fillTemplate(
  template: string,
  replacements: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

// =============================================================================
// HEADLINE GENERATION
// =============================================================================

export interface HeadlineContext {
  success: boolean;
  collateralDamage: number;
  civilianCasualties: number;
  fame: number;
  city: string;
  country: string;
  crime: string;
  threat: string;
  vigilantismLegal: boolean;
  heroName?: string;
  faction?: string;
}

export function generateHeadline(context: HeadlineContext): string {
  const {
    success,
    collateralDamage,
    civilianCasualties,
    fame,
    city,
    country,
    crime,
    threat,
    vigilantismLegal,
    heroName
  } = context;

  let templates: string[];

  // Select template category
  if (!success) {
    templates = HEADLINE_TEMPLATES.mission_failure;
  } else if (civilianCasualties > 0) {
    templates = HEADLINE_TEMPLATES.mission_success_casualties;
  } else if (collateralDamage > 50000) {
    templates = HEADLINE_TEMPLATES.mission_success_messy;
  } else if (!vigilantismLegal) {
    templates = HEADLINE_TEMPLATES.illegal_operation;
  } else if (fame >= 300 && heroName) {
    templates = HEADLINE_TEMPLATES.celebrity_hero;
  } else {
    templates = HEADLINE_TEMPLATES.mission_success_clean;
  }

  // Select random template from category
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Fill in placeholders
  const descriptor = selectDescriptor(fame, heroName);
  const amount = Math.floor(collateralDamage / 1000) + 'K';
  const casualties = civilianCasualties;

  return fillTemplate(template, {
    descriptor,
    city,
    country,
    crime,
    threat,
    amount,
    casualties,
    heroName: heroName || 'Unknown Hero',
  });
}

// =============================================================================
// NEWS SOURCE SELECTION
// =============================================================================

export function selectNewsSource(
  fameTier: 'local' | 'regional' | 'national' | 'global',
  country: string,
  city: string,
  bias?: NewsBias
): NewsSource {
  // Local fame = local newspaper
  if (fameTier === 'local') {
    return getLocalNewspaper(city, country);
  }

  // Regional/National = national or major source
  if (fameTier === 'regional' || fameTier === 'national') {
    // 70% chance of major source, 30% local
    if (Math.random() < 0.7) {
      return bias === 'anti-player'
        ? MAJOR_NEWS_SOURCES.EASTERN.name
        : MAJOR_NEWS_SOURCES.GNN.name;
    }
    return getLocalNewspaper(city, country);
  }

  // Global fame = always major international source
  if (bias === 'neutral') return MAJOR_NEWS_SOURCES.INDEPENDENT.name;
  if (bias === 'anti-player') return MAJOR_NEWS_SOURCES.EASTERN.name;
  return MAJOR_NEWS_SOURCES.GNN.name;
}

// =============================================================================
// SOCIAL MEDIA TEMPLATES
// =============================================================================

export const SOCIAL_TEMPLATES = {
  positive_reaction: [
    "Just saw that hero stop a bank robbery! Finally someone doing something about crime! 💪",
    "That vigilante just saved my neighborhood. Not all heroes wear capes!",
    "I was there when {descriptor} stopped those criminals. THANK YOU! 🙏",
    "Finally some good news in {city}. We need more heroes like this!",
    "That was INSANE! Did anyone else see {descriptor} in action?! 🔥",
  ],

  negative_reaction: [
    "That vigilante destroyed my car during that fight. No insurance covers this! 😡",
    "Who gave them permission to operate here? This is reckless!",
    "My street is a warzone thanks to that 'hero'. When does it end?",
    "Cool origin story bro, but my apartment is destroyed. Who pays?",
    "Hot take: vigilantes cause more problems than they solve. Fight me.",
  ],

  conspiracy_theory: [
    "Nobody else think it's weird how that hero showed up RIGHT when the robbery started? 🤔",
    "I'm calling it now - that vigilante is working WITH the criminals. It's all staged.",
    "Government definitely knows who this is. They're letting it happen for a reason...",
    "Another 'heroic save'. Another distraction. Wake up people! #FalseFlag",
  ],

  recruitment_hint: [
    "I built something incredible. If you're fighting the good fight, DM me. [ENCRYPTED]",
    "Tired of standing by while criminals run free. Anyone recruiting? I have skills.",
    "That hero needs backup. I can help. Serious inquiries only.",
    "Former military, looking to make a difference. Who's hiring vigilantes? 👀",
  ],

  villain_taunt: [
    "I see you've been busy in {city}, little hero. Impressive. But you're not ready for me yet.",
    "Enjoy your moment in the spotlight. When you're ready for a REAL challenge, you know where to find me. ⚡",
    "That was cute. Let's see how you handle a Threat Level 7. Sector {sector}. Tonight.",
    "You stopped my lieutenant. Congratulations. But I'm coming for you next. Be ready.",
  ],

  celebrity_gossip: [
    "Spotted: {heroName} at {city} restaurant! So down to earth! 🌟",
    "{heroName} merchandise sales hit $50M this quarter. Hero or brand? 💰",
    "Sources say {heroName} is dating another LSW celebrity. Details at 11!",
    "Hot take: {heroName} hasn't done anything impressive in weeks. Overrated?",
  ],
};

// =============================================================================
// RUMOR TEMPLATES
// =============================================================================

export const RUMOR_TEMPLATES = {
  villain_hideout: [
    { day: 1, text: "Strange lights seen over abandoned warehouse in {sector}" },
    { day: 2, text: "Local resident reports unusual activity near industrial district" },
    { day: 3, text: "Police scanner: '10-10 suspicious activity, warehouse district'" },
    { day: 4, text: "MISSION UNLOCKED: Investigate {faction} Hideout" },
  ],

  tech_theft: [
    { day: 1, text: "Chemical plant reports missing materials" },
    { day: 2, text: "Second lab reports break-in, specialized equipment stolen" },
    { day: 3, text: "Pattern emerging: someone building something dangerous" },
    { day: 4, text: "MISSION UNLOCKED: Stop {threat} Before It's Too Late" },
  ],

  kidnapping_chain: [
    { day: 1, text: "Missing person report: local scientist" },
    { day: 2, text: "Another scientist disappears under mysterious circumstances" },
    { day: 3, text: "Is someone targeting {country}'s scientific community?" },
    { day: 4, text: "MISSION UNLOCKED: Rescue Kidnapped Scientists" },
  ],
};

// =============================================================================
// WORLD EVENT TEMPLATES
// =============================================================================

export interface WorldEventTemplate {
  type: 'election' | 'disaster' | 'villain_attack' | 'tech_breakthrough' | 'political_crisis';
  headline: string;
  consequences: Record<string, any>;
  missionOpportunity?: any;
}

export const WORLD_EVENT_TEMPLATES: Record<string, WorldEventTemplate[]> = {
  election: [
    {
      type: 'election',
      headline: "New {country} President Vows to 'Crack Down on Vigilantes'",
      consequences: {
        vigilantism: 'banned',
        lsw_regulations: 'strict',
      },
    },
    {
      type: 'election',
      headline: "{country} Elects Pro-LSW Candidate",
      consequences: {
        vigilantism: 'legal',
        lsw_regulations: 'relaxed',
      },
    },
  ],

  villain_attack: [
    {
      type: 'villain_attack',
      headline: "{faction} Attacks {city} Power Grid - {casualties} Dead",
      consequences: {
        lsw_activity: 10,
      },
      missionOpportunity: {
        type: 'counter_terrorism',
        difficulty: 8,
        reward: 30000,
      },
    },
  ],

  tech_breakthrough: [
    {
      type: 'tech_breakthrough',
      headline: "{country} Scientists Develop Prototype Exo-Suit",
      consequences: {
        science: 5,
      },
    },
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getCrimeTypeDescription(missionType: string): string {
  const crimes: Record<string, string> = {
    'bank_robbery': 'Bank Robbery',
    'hostage_rescue': 'Hostage Situation',
    'assassination_attempt': 'Assassination Attempt',
    'terrorist_attack': 'Terrorist Attack',
    'arms_deal': 'Illegal Arms Deal',
    'kidnapping': 'Kidnapping',
    'gang_war': 'Gang Violence',
    'lsw_rampage': 'LSW Rampage',
  };
  return crimes[missionType] || 'Criminal Activity';
}

export function getThreatDescription(enemyType: string): string {
  const threats: Record<string, string> = {
    'gang_members': 'Armed Gang Members',
    'terrorists': 'Terrorist Cell',
    'mercenaries': 'Professional Mercenaries',
    'lsw_villain': 'Powered Individual',
    'corporate_security': 'Corporate Security Forces',
  };
  return threats[enemyType] || 'Armed Suspects';
}

// =============================================================================
// EXPORT
// =============================================================================

export const NewsTemplates = {
  HEADLINE_TEMPLATES,
  ARTICLE_BODY_TEMPLATES,
  SOCIAL_TEMPLATES,
  RUMOR_TEMPLATES,
  WORLD_EVENT_TEMPLATES,
  MAJOR_NEWS_SOURCES,

  // Functions
  generateHeadline,
  selectDescriptor,
  selectNewsSource,
  fillTemplate,
  getLocalNewspaper,
  getCrimeTypeDescription,
  getThreatDescription,
};

export default NewsTemplates;

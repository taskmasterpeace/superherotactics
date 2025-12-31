/**
 * NEWS TEMPLATES AND GENERATION DATA
 *
 * Template-based headline and article generation for the News System.
 * Works with newsSystem.ts types for consistent article generation.
 *
 * Features:
 * - Bias-based headline variants (pro-hero, anti-hero, neutral, tabloid, etc.)
 * - Context-aware article bodies
 * - Social media reactions
 * - Mission-to-news conversion
 * - World event generation
 */

import {
  NewsArticle,
  NewsCategory,
  NewsImportance,
  NewsSource,
  NewsEvent,
  NewsEventType,
  NewsBias,
  NEWS_SOURCES,
  createNewsArticle,
  pickRandomSource,
  getSourcesByBias,
  MissionCompleteData,
  MissionFailedData,
  CombatWitnessedData,
  ReputationMilestoneData,
  CrimeReportedData,
  SuperhumanSightingData,
  FactionActionData,
  WorldEventData,
} from './newsSystem';
import { GameTime } from './timeSystem';
import { ReputationAxis } from './reputationSystem';

// =============================================================================
// HEADLINE TEMPLATES BY EVENT TYPE
// =============================================================================

export interface HeadlineSet {
  pro_hero: string[];
  anti_hero: string[];
  neutral: string[];
  tabloid: string[];
  government: string[];
  corporate: string[];
  independent: string[];
}

export const MISSION_SUCCESS_HEADLINES: HeadlineSet = {
  pro_hero: [
    '{heroName} Saves the Day in {city}!',
    'Heroes Triumph: {missionName} Success',
    'Brave Heroes Put Stop to {villain} in {city}',
    '{heroName} Leads Successful Operation',
    'Local Hero Prevents {crime} Tragedy',
    '{heroName} Stops {threat}, Praised by {city} Police',
    'Vigilante Stops {crime} in {city}',
    'Masked Hero Intervenes Successfully in {city}',
  ],
  anti_hero: [
    'Vigilantes Cause Chaos in {city}',
    'Unsanctioned "Heroes" Take Law Into Own Hands',
    'Property Damage Mounts as Supers Battle in {city}',
    'Who Will Pay for ${damage} in Damages?',
    '{heroName}\'s Reckless Tactics Cost {city} Dearly',
    '{crime} Thwarted, But at What Cost?',
  ],
  neutral: [
    'Superhuman Conflict Resolved in {city}',
    '{missionName}: Situation Contained',
    'Incident in {city} Ends, {casualties} Affected',
    'Operation Concludes in {city}',
    'Superhuman Response Ends {crime} in {city}',
  ],
  tabloid: [
    'EXCLUSIVE: Inside the {city} Showdown!',
    '{heroName}\'s Secret Battle Tactics REVEALED',
    'You Won\'t BELIEVE What Happened in {city}!',
    'PHOTOS: Aftermath of {city} Battle',
    'INSANE! {heroName} Goes Full Beast Mode! 🔥',
  ],
  government: [
    'Authorized Response Successful in {city}',
    'Registered Heroes Complete Operation',
    'Government-Sanctioned Team Resolves {missionName}',
    'Official Statement on {city} Incident',
  ],
  corporate: [
    'Corporate Security Team Handles {city} Threat',
    'Sponsored Heroes Deliver Results',
    'Insurance Implications of {city} Incident',
    'Business Continuity Restored in {city}',
  ],
  independent: [
    'What Really Happened in {city}?',
    'The Untold Story of {missionName}',
    'Witnesses Share Account of {city} Battle',
    'Community Speaks Out on Super Activity',
  ],
};

export const MISSION_FAILURE_HEADLINES: HeadlineSet = {
  pro_hero: [
    'Heroes Regroup After Setback in {city}',
    'Brave Effort Falls Short in {missionName}',
    '{heroName} Vows to Return After {city} Retreat',
    'Even Heroes Have Bad Days',
    'Valiant Attempt Comes Up Short',
  ],
  anti_hero: [
    'Vigilante Incompetence on Full Display',
    '"Heroes" Fail Spectacularly in {city}',
    'Super-Powered Amateurs Bungle Operation',
    'When Will We Learn? Another Hero Failure',
    'Amateur Vigilante Outmatched in {city}',
    '{threat} Escapes Despite Hero\'s Efforts',
  ],
  neutral: [
    'Operation Unsuccessful in {city}',
    '{missionName} Ends Without Resolution',
    'Superhuman Response Fails to Contain Threat',
    'Situation in {city} Remains Unresolved',
    'Vigilante Fails to Stop {crime} in {city}',
  ],
  tabloid: [
    'DISASTER: {heroName} HUMILIATED in {city}!',
    'SHOCKING FAILURE - Inside the {city} Fiasco',
    'Is {heroName} WASHED? Fans React to Embarrassing Loss',
    'EXPOSED: The REAL Reason Heroes Failed',
    '{threat} Makes Mockery of Local Hero',
  ],
  government: [
    'Review Ordered After {city} Operation Failure',
    'Officials Express Concern Over Failed Response',
    'Regulatory Review Following {missionName} Outcome',
    'Department Investigating Operational Shortcomings',
  ],
  corporate: [
    'Contracted Team Falls Short of Objectives',
    'Stakeholders Disappointed by {city} Results',
    'Performance Review Pending After Failed Operation',
    'Insurance Complications Expected',
  ],
  independent: [
    'Community Questions Hero Priorities After Failure',
    'What Went Wrong in {city}?',
    'Locals Left Vulnerable After Hero Retreat',
    'The Real Cost of Super-Heroics',
  ],
};

export const HIGH_CASUALTIES_HEADLINES: HeadlineSet = {
  pro_hero: [
    'Tragic Day: Heroes Couldn\'t Save Everyone',
    'Despite Heroic Efforts, Lives Lost in {city}',
    '{heroName} Devastated by Casualties',
  ],
  anti_hero: [
    '{crime} Stopped, {casualties} Civilians Killed',
    'Tragic Victory: {heroName} Saves Hostages, Bystanders Die',
    '{city} Mourns {casualties} Dead After Vigilante Action',
    'Hero\'s Methods Questioned After {casualties} Deaths',
    '{heroName} Under Fire for Civilian Casualties',
  ],
  neutral: [
    '{city} Incident Leaves {casualties} Dead',
    'Casualties Reported Following Superhuman Battle',
    '{missionName} Ends with Loss of Life',
  ],
  tabloid: [
    'TRAGEDY: {casualties} DEAD in {city} Chaos!',
    'Blood on {heroName}\'s Hands?! {casualties} KILLED!',
    'HORRIFIC: The Human Cost of Heroism',
  ],
  government: [
    'Casualty Report from {city} Incident Released',
    'Investigation into {casualties} Deaths Ongoing',
    'Government Demands Answers After {city} Tragedy',
  ],
  corporate: [
    'Liability Review Following {casualties} Casualties',
    'Corporate Response to {city} Tragedy',
    'Insurance Claims Filed After Deadly Incident',
  ],
  independent: [
    'Families Mourn: The Real Victims of {city}',
    '{casualties} Lives Lost - Was It Worth It?',
    'Community Devastated by Superhuman Battle',
  ],
};

export const COMBAT_WITNESSED_HEADLINES: HeadlineSet = {
  pro_hero: [
    'Heroes Engage Threat in {city}',
    'Brave Battle in {city} Streets',
    'Defenders Step Up in {city}',
  ],
  anti_hero: [
    'Super-Powered Brawl Endangers {city}',
    'Reckless Combat Puts Civilians at Risk',
    'Another Day, Another Super Fight',
  ],
  neutral: [
    'Superhuman Combat Reported in {city}',
    'Battle in {city} Leaves {casualties} Affected',
    'Conflict Erupts in {city} Sector',
  ],
  tabloid: [
    'WILD FIGHT Breaks Out in {city}!',
    'You Have to SEE This {city} Throwdown!',
    'CAUGHT ON CAMERA: Super Battle!',
  ],
  government: [
    'Unauthorized Combat in {city} Under Review',
    'Department Monitoring {city} Incident',
    'Authorities Responding to {city} Battle',
  ],
  corporate: [
    'Business District Impact from {city} Fight',
    'Commercial Disruption in {city}',
    'Economic Impact Assessment Underway',
  ],
  independent: [
    'Community Caught in Crossfire',
    'Residents Describe {city} Battle',
    'Local Voices on Superhuman Combat',
  ],
};

export const CRIME_HEADLINES: HeadlineSet = {
  pro_hero: [
    '{crime} in {city} - Heroes Needed',
    'Crime Strikes {city} - Who Will Respond?',
    'Villains Target {city}',
  ],
  anti_hero: [
    'Another Crime While Heroes Look Away',
    'Where Were the "Heroes"?',
    'Crime Rises Despite Super Presence',
  ],
  neutral: [
    '{crime} Reported in {city}',
    '{severity} Incident in {city}',
    'Police Investigating {city} Crime',
  ],
  tabloid: [
    'SHOCKING Crime in {city}!',
    'DARING Heist Hits {city}!',
    'Criminals Strike AGAIN!',
  ],
  government: [
    'Law Enforcement Responding to {city}',
    'Investigation Opened in {city}',
    'Authorities Pursuing {city} Suspects',
  ],
  corporate: [
    'Business Security Concerns After {city} Crime',
    'Corporate Assets Targeted',
    'Private Security on Alert',
  ],
  independent: [
    'Community Reports Crime Wave',
    '{city} Residents Demand Action',
    'Local Crime Concerns Growing',
  ],
};

export const SUPERHUMAN_SIGHTING_HEADLINES: HeadlineSet = {
  pro_hero: [
    '{characterName} Spotted in {city}!',
    'Beloved Hero Seen in {city}',
    '{characterName} Makes Appearance',
  ],
  anti_hero: [
    'Known Vigilante Sighted in {city}',
    '{characterName} Raises Concerns',
    'Unregistered Super Active in {city}',
  ],
  neutral: [
    'Superhuman Individual Seen in {city}',
    '{characterName} Reported in {city}',
    'Super Sighting in {city}',
  ],
  tabloid: [
    '{characterName} SPOTTED! Where Were They Going?!',
    'OMG! {characterName} Sighting in {city}!',
    'EXCLUSIVE: {characterName} Photo!',
  ],
  government: [
    'Superhuman Activity Logged in {city}',
    'Department Tracking {characterName}',
    'Registration Status of {characterName} Under Review',
  ],
  corporate: [
    'Market Watches {characterName} Movements',
    'Super Appearance Affects {city} Business',
    'Corporate Interest in {characterName} Activity',
  ],
  independent: [
    'Community Reacts to {characterName} Presence',
    'Locals Weigh In on Super Sighting',
    'What Does {characterName}\'s Presence Mean for {city}?',
  ],
};

// =============================================================================
// ARTICLE BODY TEMPLATES
// =============================================================================

export const ARTICLE_BODIES: Record<string, Record<NewsBias, string[]>> = {
  mission_success: {
    pro_hero: [
      '{city}, {country} - In a stunning display of heroism, {heroName} and allies successfully completed {missionName} today. Despite facing dangerous opposition, the heroes prevailed with minimal civilian casualties. "{quote}" said witnesses at the scene.',
      '{city}, {country} - The city can rest easy tonight after {heroName} put a stop to {villain}\'s plans. The operation, which lasted approximately {duration} minutes, ended with all civilians safely evacuated.',
    ],
    anti_hero: [
      '{city}, {country} - Once again, so-called "heroes" have taken the law into their own hands. The unsanctioned operation resulted in an estimated ${damage} in property damage. Local authorities were not consulted before the vigilante action.',
      '{city}, {country} - Critics are speaking out after another superhuman battle left residents picking up the pieces. "Who asked them to intervene?" asked one affected business owner. The incident has reignited debates about superhuman regulation.',
    ],
    neutral: [
      '{city}, {country} - A superhuman operation concluded today with the resolution of {missionName}. According to witnesses, the conflict lasted approximately {duration} minutes. Authorities are assessing the situation.',
      '{city}, {country} - The incident has been contained following intervention by superhuman individuals. Details remain limited as officials gather information. Property damage estimates are ongoing.',
    ],
    tabloid: [
      'OMG you guys, you will NOT believe what just went down in {city}! Our sources are saying {heroName} was there and it was INTENSE. One witness said they saw {villain} get absolutely DESTROYED. We have exclusive photos!',
      'BREAKING TEA: {heroName} was spotted in {city} in what insiders are calling the battle of the YEAR. Our sources say there\'s drama behind the scenes - stay tuned for updates!',
    ],
    government: [
      '{city}, {country} - The Department of Superhuman Affairs confirms that a registered team successfully completed an authorized operation. All proper protocols were followed. A full report will be filed with the appropriate oversight committees.',
      '{city}, {country} - Officials have released a statement regarding the incident. The operation was conducted within legal parameters by registered heroes. Coordination with local law enforcement was maintained throughout.',
    ],
    corporate: [
      '{city}, {country} - A sponsored hero team operating under corporate protocols successfully resolved the situation. The operation demonstrates the value of properly trained and equipped super-assets. Our thoughts are with affected businesses.',
      '{city}, {country} - Corporate security consultants have confirmed the successful completion of the {missionName} operation. All contractual obligations were met. Insurance representatives are on scene to process claims.',
    ],
    independent: [
      '{city}, {country} - Local witnesses tell a different story than official sources about what happened. "They didn\'t ask anyone if we wanted their help," said one resident. Questions remain about accountability and community consent.',
      '{city}, {country} - Community organizers are calling for a town hall following the incident. "We have a right to know what\'s happening in our neighborhood," said a local activist. Multiple perspectives are emerging.',
    ],
  },

  mission_failure: {
    pro_hero: [
      '{city}, {country} - Despite their best efforts, {heroName} and team were unable to complete {missionName} today. The heroes faced overwhelming opposition and made the difficult decision to withdraw. They have pledged to return better prepared.',
      '{city}, {country} - Even the greatest heroes face setbacks. Today\'s operation did not go as planned, but sources close to the team say they are already strategizing their next move.',
    ],
    anti_hero: [
      '{city}, {country} - The so-called heroes have failed again. The bungled operation leaves the community worse off than before. Perhaps if these vigilantes had proper training - or bothered to coordinate with actual authorities - things would have gone differently.',
      '{city}, {country} - Add another failure to the growing list of superhuman incompetence. The {city} debacle proves once again that unchecked "hero" activity does more harm than good.',
    ],
    neutral: [
      '{city}, {country} - An operation by superhuman individuals ended unsuccessfully today. The exact circumstances leading to the failure are still being determined. The original threat remains unresolved at this time.',
      '{city}, {country} - Authorities confirm that the {missionName} operation did not achieve its objectives. The situation is being monitored. Additional information will be released as it becomes available.',
    ],
    tabloid: [
      'OH NO THEY DIDN\'T! {heroName} just had the most EMBARRASSING moment of their career in {city}! Our sources are saying the whole thing was a COMPLETE disaster. Click through for all the cringe-worthy details!',
      'This is NOT the main character moment {heroName} was hoping for! The operation went SO wrong and fans are DRAGGING them on social media. Some are even calling for retirement!',
    ],
    government: [
      '{city}, {country} - The Department of Superhuman Affairs has initiated a review of the failed operation. All registered heroes involved will be required to submit detailed reports. The public is advised that the situation remains fluid.',
      '{city}, {country} - Officials are concerned about the outcome of the {missionName} operation and have ordered a full investigation. Questions about authorization, coordination, and protocol adherence are being examined.',
    ],
    corporate: [
      '{city}, {country} - Corporate sponsors are reviewing their agreements following the unsuccessful operation. Performance metrics indicate objectives were not met. A cost-benefit analysis of continued support is underway.',
      '{city}, {country} - Stockholders have been briefed on the operational failure. The contracted team failed to deliver on promised outcomes. Legal is reviewing liability exposure.',
    ],
    independent: [
      '{city}, {country} - Community members are asking hard questions after heroes failed to protect {city}. "We put our faith in them and now what?" asked one affected resident. The failure raises questions about who really has the community\'s interests at heart.',
      '{city}, {country} - Independent investigators are examining what went wrong. Initial findings suggest a disconnect between hero priorities and community needs. More transparency is needed.',
    ],
  },
};

// =============================================================================
// SOCIAL MEDIA / REACTIONS TEMPLATES
// =============================================================================

export const SOCIAL_REACTIONS = {
  positive: [
    'Just saw that hero stop a bank robbery! Finally someone doing something about crime! 💪',
    'That vigilante just saved my neighborhood. Not all heroes wear capes!',
    'I was there when {heroName} stopped those criminals. THANK YOU! 🙏',
    'Finally some good news in {city}. We need more heroes like this!',
    'That was INSANE! Did anyone else see {heroName} in action?! 🔥',
    'We stan a true hero! {heroName} for president! 🦸',
  ],

  negative: [
    'That vigilante destroyed my car during that fight. No insurance covers this! 😡',
    'Who gave them permission to operate here? This is reckless!',
    'My street is a warzone thanks to that "hero". When does it end?',
    'Cool origin story bro, but my apartment is destroyed. Who pays?',
    'Hot take: vigilantes cause more problems than they solve. Fight me.',
    'Insurance won\'t cover "superhuman activity". Thanks for nothing, {heroName}.',
  ],

  conspiracy: [
    'Nobody else think it\'s weird how that hero showed up RIGHT when the robbery started? 🤔',
    'I\'m calling it now - that vigilante is working WITH the criminals. It\'s all staged.',
    'Government definitely knows who this is. They\'re letting it happen for a reason...',
    'Another "heroic save". Another distraction. Wake up people! #FalseFlag',
    'Follow the money. Who REALLY benefits from {heroName}\'s "heroics"?',
  ],

  celebrity_gossip: [
    'Spotted: {heroName} at {city} restaurant! So down to earth! 🌟',
    '{heroName} merchandise sales hit $50M this quarter. Hero or brand? 💰',
    'Sources say {heroName} is dating another LSW celebrity. Details at 11!',
    'Hot take: {heroName} hasn\'t done anything impressive in weeks. Overrated?',
    '{heroName}\'s new costume is giving SERVE 💅',
  ],

  villain_taunts: [
    'I see you\'ve been busy in {city}, little hero. Impressive. But you\'re not ready for me yet.',
    'Enjoy your moment in the spotlight. When you\'re ready for a REAL challenge, you know where to find me. ⚡',
    'You stopped my lieutenant. Congratulations. But I\'m coming for you next. Be ready.',
    'Cute show in {city}. Let\'s see how you handle Threat Level 7. Tonight.',
  ],
};

// =============================================================================
// WORLD EVENT TEMPLATES
// =============================================================================

export interface WorldEventTemplate {
  id: string;
  category: NewsCategory;
  headlines: Partial<HeadlineSet>;
  bodies: Partial<Record<NewsBias, string[]>>;
  importance: NewsImportance;
  regions?: string[];
  investigationChance: number;
}

export const WORLD_EVENTS: WorldEventTemplate[] = [
  // Weather/Disaster
  {
    id: 'natural_disaster',
    category: 'weather',
    headlines: {
      neutral: [
        'Severe Weather Hits {region}',
        'Storm System Impacts {region}',
        'Weather Emergency in {region}',
      ],
      tabloid: [
        'DISASTER: {region} Struck by EXTREME Weather!',
        'Nature\'s FURY Unleashed on {region}!',
      ],
    },
    bodies: {
      neutral: [
        'A severe weather system has impacted {region}, causing widespread disruption. Emergency services are responding. Residents are advised to stay indoors and monitor official channels.',
      ],
    },
    importance: 'major',
    investigationChance: 0,
  },

  // Political
  {
    id: 'political_scandal',
    category: 'politics',
    headlines: {
      neutral: [
        'Political Controversy Rocks {region}',
        'Officials Under Fire in {region}',
        'Scandal Emerges in {region} Government',
      ],
      tabloid: [
        'BOMBSHELL: {region} Political SCANDAL!',
        'EXPOSED: Corruption in {region}!',
      ],
      government: [
        'Statement on {region} Political Situation',
        'Official Response to {region} Allegations',
      ],
    },
    bodies: {
      neutral: [
        'Political tensions are rising in {region} following allegations against government officials. An investigation is underway. Further details are expected in the coming days.',
      ],
    },
    importance: 'major',
    investigationChance: 0.3,
  },

  // LSW Policy Changes
  {
    id: 'lsw_policy_change',
    category: 'politics',
    headlines: {
      neutral: [
        '{region} Updates Superhuman Registration Laws',
        'New LSW Policies Announced in {region}',
        '{region} Government Addresses Vigilante Activity',
      ],
      government: [
        '{region} Official: "New Era of Superhuman Regulation"',
        'Registration Requirements Tightened in {region}',
      ],
      independent: [
        'What the New {region} LSW Laws Mean for You',
        'Heroes Respond to {region} Policy Changes',
      ],
    },
    bodies: {
      neutral: [
        '{region} has announced significant changes to its policies regarding superhuman individuals. The new regulations are expected to affect both registered heroes and vigilantes operating in the region.',
      ],
    },
    importance: 'major',
    investigationChance: 0,
  },

  // Scientific
  {
    id: 'scientific_discovery',
    category: 'science',
    headlines: {
      neutral: [
        'Scientific Discovery in {region}',
        'Researchers Announce Breakthrough',
        'New Technology Emerges from {region}',
      ],
      corporate: [
        'Investment Opportunity in New Tech',
        'Market Watches {region} Research',
      ],
    },
    bodies: {
      neutral: [
        'Scientists in {region} have announced a significant discovery. The breakthrough could have implications for various fields including superhuman studies. Peer review is ongoing.',
      ],
    },
    importance: 'standard',
    investigationChance: 0.1,
  },

  // Economic
  {
    id: 'economic_shift',
    category: 'business',
    headlines: {
      neutral: [
        '{region} Economy Shows Signs of Change',
        'Market Movement in {region}',
        'Economic Indicators Shift in {region}',
      ],
      corporate: [
        'Business Opportunities in {region}',
        'Investors Eye {region} Market',
      ],
    },
    bodies: {
      neutral: [
        'Economic analysts are noting significant changes in the {region} market. The shifts could affect various sectors including superhuman-related industries. Experts advise monitoring the situation.',
      ],
    },
    importance: 'standard',
    investigationChance: 0,
  },

  // Villain Activity
  {
    id: 'villain_attack',
    category: 'superhuman',
    headlines: {
      neutral: [
        '{faction} Attacks {region} - {casualties} Dead',
        'Terrorist Strike in {region}',
        '{region} Under Siege by {villain}',
      ],
      tabloid: [
        'TERROR: {faction} Claims Responsibility!',
        '{region} in CHAOS After Attack!',
      ],
      government: [
        'Government Response to {region} Attack',
        'Emergency Protocols Activated in {region}',
      ],
    },
    bodies: {
      neutral: [
        '{faction} has claimed responsibility for an attack in {region} that left {casualties} dead. Emergency services are responding. Government officials have declared a state of emergency.',
      ],
    },
    importance: 'breaking',
    investigationChance: 0.6,
  },

  // Entertainment/Filler
  {
    id: 'celebrity_hero',
    category: 'entertainment',
    headlines: {
      neutral: [
        'Famous Hero Spotted in {region}',
        'Celebrity Super Makes Appearance',
        'Entertainment News: Hero Sighting',
      ],
      tabloid: [
        'OMG {heroName} Was Spotted in {region}!',
        'EXCLUSIVE: Celebrity Hero Photos!',
      ],
    },
    bodies: {
      tabloid: [
        'The entertainment world is buzzing after a famous superhero was spotted in {region}! Details are scarce but our sources are ON IT. Stay tuned for updates on this developing story!',
      ],
    },
    importance: 'minor',
    investigationChance: 0,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Pick random item from array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Replace variables in template strings
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Get headline for a specific bias with fallback to neutral
 */
export function getHeadlineForBias(
  headlines: Partial<HeadlineSet>,
  bias: NewsBias
): string {
  const biasHeadlines = headlines[bias] || headlines.neutral || ['News Update'];
  return pickRandom(biasHeadlines);
}

/**
 * Get article body for a bias with fallback to neutral
 */
export function getBodyForBias(
  bodies: Partial<Record<NewsBias, string[]>>,
  bias: NewsBias
): string {
  const biasBodies = bodies[bias] || bodies.neutral || ['Details are still emerging.'];
  return pickRandom(biasBodies);
}

/**
 * Generate descriptor based on fame level
 */
export function selectDescriptor(fame: number, heroName?: string): string {
  if (fame >= 75 && heroName) return heroName;
  if (fame >= 50) return heroName || 'The Vigilante';

  if (fame >= 25) {
    return pickRandom([
      'The Armored Operative',
      'Known Vigilante',
      'Local Hero',
      'The Masked Defender',
    ]);
  }

  return pickRandom([
    'Unknown Vigilante',
    'Masked Individual',
    'Unidentified Hero',
    'Mystery Operative',
    'Anonymous Defender',
  ]);
}

/**
 * Generate random witness quote
 */
export function generateWitnessQuote(): string {
  return pickRandom([
    'It all happened so fast',
    "I've never seen anything like it",
    "We're just glad everyone is safe",
    'It was incredible',
    "I couldn't believe my eyes",
    'They saved our lives',
    'The whole street was chaos',
  ]);
}

// =============================================================================
// NEWS GENERATION FROM EVENTS
// =============================================================================

/**
 * Generate news article from mission completion
 */
export function generateMissionNews(
  data: MissionCompleteData,
  gameTime: GameTime,
  fame: number = 0
): NewsArticle {
  const isSuccess = data.outcome === 'success';
  const hasHighCasualties = data.casualties > 5;
  const hasHighDamage = data.propertyDamage > 100000;

  // Select headline set based on outcome
  let headlines: Partial<HeadlineSet>;
  if (hasHighCasualties) {
    headlines = HIGH_CASUALTIES_HEADLINES;
  } else if (isSuccess) {
    headlines = MISSION_SUCCESS_HEADLINES;
  } else {
    headlines = MISSION_FAILURE_HEADLINES;
  }

  // Determine importance
  let importance: NewsImportance = 'standard';
  if (hasHighCasualties) importance = 'breaking';
  else if (isSuccess && fame >= 50) importance = 'major';
  else if (!isSuccess) importance = 'major';

  // Pick source based on outcome
  const source = isSuccess
    ? pickRandomSource('superhuman')
    : pickRandom(getSourcesByBias('anti_hero'));

  // Build variables
  const heroName = data.heroesInvolved[0] || selectDescriptor(fame);
  const variables = {
    heroName,
    city: data.location,
    country: data.location,
    missionName: data.missionName,
    crime: data.missionName,
    threat: data.villainsInvolved[0] || 'hostile forces',
    villain: data.villainsInvolved[0] || 'criminals',
    casualties: data.casualties,
    damage: data.propertyDamage.toLocaleString(),
    duration: Math.floor(Math.random() * 30) + 10,
    quote: generateWitnessQuote(),
  };

  const headline = substituteVariables(
    getHeadlineForBias(headlines, source.bias),
    variables
  );

  const bodyKey = isSuccess ? 'mission_success' : 'mission_failure';
  const body = substituteVariables(
    getBodyForBias(ARTICLE_BODIES[bodyKey] || {}, source.bias),
    variables
  );

  // Determine investigation lead
  const investigationLead = !isSuccess && Math.random() < 0.4
    ? `inv_${data.missionId}_followup`
    : undefined;

  return createNewsArticle(
    headline,
    body,
    'superhuman',
    importance,
    gameTime,
    {
      source,
      region: data.location,
      relatedCharacters: [...data.heroesInvolved, ...data.villainsInvolved],
      investigationLead,
      eventType: isSuccess ? 'mission_complete' : 'mission_failed',
      eventId: data.missionId,
      reputationEffects: isSuccess
        ? { public: hasHighCasualties ? -3 : 5, heroic: hasHighDamage ? -2 : 3 }
        : { public: -3, heroic: -5 },
    }
  );
}

/**
 * Generate news from crime report
 */
export function generateCrimeNews(
  data: CrimeReportedData,
  gameTime: GameTime
): NewsArticle {
  const source = pickRandomSource('crime');
  const variables = {
    crime: data.crimeType,
    city: data.location,
    severity: data.severity,
    victims: data.victims || 0,
  };

  const headline = substituteVariables(
    getHeadlineForBias(CRIME_HEADLINES, source.bias),
    variables
  );

  const body = `A ${data.severity} ${data.crimeType} has been reported in ${data.location}. ` +
    `${data.victims ? `${data.victims} individuals were affected. ` : ''}` +
    `Authorities are investigating the incident.`;

  const investigationLead = data.investigationPossible
    ? `inv_crime_${Date.now()}`
    : undefined;

  return createNewsArticle(
    headline,
    body,
    'crime',
    data.severity === 'catastrophic' ? 'breaking' : data.severity === 'major' ? 'major' : 'standard',
    gameTime,
    {
      source,
      region: data.location,
      investigationLead,
      eventType: 'crime_reported',
    }
  );
}

/**
 * Generate world event news
 */
export function generateWorldEventNews(
  templateId: string,
  variables: Record<string, string>,
  gameTime: GameTime
): NewsArticle | null {
  const template = WORLD_EVENTS.find(e => e.id === templateId);
  if (!template) return null;

  const source = pickRandomSource(template.category);
  const headline = substituteVariables(
    getHeadlineForBias(template.headlines, source.bias),
    variables
  );

  const body = substituteVariables(
    getBodyForBias(template.bodies, source.bias),
    variables
  );

  const investigationLead = Math.random() < template.investigationChance
    ? `inv_world_${templateId}_${Date.now()}`
    : undefined;

  return createNewsArticle(
    headline,
    body,
    template.category,
    template.importance,
    gameTime,
    {
      source,
      region: variables.region,
      investigationLead,
      eventType: 'world_event',
    }
  );
}

/**
 * Generate filler/random news
 */
export function generateFillerNews(gameTime: GameTime): NewsArticle {
  const templates = WORLD_EVENTS.filter(e =>
    e.importance === 'minor' || e.importance === 'filler'
  );
  const template = templates.length > 0
    ? pickRandom(templates)
    : WORLD_EVENTS[0];

  const regions = ['the city', 'downtown', 'the suburbs', 'the metro area', 'nearby'];
  const variables = {
    region: pickRandom(regions),
  };

  return generateWorldEventNews(template.id, variables, gameTime)!;
}

/**
 * Generate social media reaction based on event
 */
export function generateSocialReaction(
  type: 'positive' | 'negative' | 'conspiracy' | 'celebrity' | 'villain',
  variables: Record<string, string> = {}
): string {
  let templates: string[];
  switch (type) {
    case 'positive': templates = SOCIAL_REACTIONS.positive; break;
    case 'negative': templates = SOCIAL_REACTIONS.negative; break;
    case 'conspiracy': templates = SOCIAL_REACTIONS.conspiracy; break;
    case 'celebrity': templates = SOCIAL_REACTIONS.celebrity_gossip; break;
    case 'villain': templates = SOCIAL_REACTIONS.villain_taunts; break;
    default: templates = SOCIAL_REACTIONS.positive;
  }

  return substituteVariables(pickRandom(templates), variables);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const NewsTemplates = {
  // Headline sets
  MISSION_SUCCESS_HEADLINES,
  MISSION_FAILURE_HEADLINES,
  HIGH_CASUALTIES_HEADLINES,
  COMBAT_WITNESSED_HEADLINES,
  CRIME_HEADLINES,
  SUPERHUMAN_SIGHTING_HEADLINES,

  // Body templates
  ARTICLE_BODIES,

  // Social reactions
  SOCIAL_REACTIONS,

  // World events
  WORLD_EVENTS,

  // Functions
  substituteVariables,
  getHeadlineForBias,
  getBodyForBias,
  selectDescriptor,
  generateWitnessQuote,
  generateMissionNews,
  generateCrimeNews,
  generateWorldEventNews,
  generateFillerNews,
  generateSocialReaction,
};

export default NewsTemplates;

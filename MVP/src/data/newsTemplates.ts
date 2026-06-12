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
// ESCALATION NEWS TEMPLATES
// News generated from police/SWAT/military confrontations
// =============================================================================

export const ESCALATION_HEADLINES: Record<string, HeadlineSet> = {
  // Police killed during escalation
  escalation_police_killed: {
    pro_hero: [
      'Tragic Confrontation: Officers Down in {city}',
      '{heroName} Clash with Police Turns Deadly',
      'Chaos in {city}: {casualties} Officers Killed',
    ],
    anti_hero: [
      'COP KILLER: {heroName} Murders {casualties} Officers',
      'Vigilante Rampage Leaves {casualties} Police Dead',
      '"Hero" Turns Villain: {casualties} Officers Slain in {city}',
      'Blood on Their Hands: {city} Police Massacred',
    ],
    neutral: [
      '{casualties} Officers Killed in {city} Incident',
      'Deadly Confrontation in {city}: Police Officers Dead',
      '{city} Mourns Fallen Officers After Vigilante Encounter',
    ],
    tabloid: [
      'MASSACRE: {casualties} COPS DEAD After {heroName} Shootout!',
      'BLOODBATH in {city}! Heroes vs Police - {casualties} DEAD!',
      'SHOCKING: The Hero Who Became a COP KILLER 💀',
    ],
    government: [
      'Officer Deaths in {city} Under Federal Review',
      '{casualties} Law Enforcement Casualties Reported',
      'Government Condemns Violence Against Police in {city}',
    ],
    corporate: [
      'Market Instability Following {city} Police Deaths',
      'Insurance Implications After Officer Casualties',
    ],
    independent: [
      'Community Divided After Officers Killed in {city}',
      'What Led to {casualties} Police Deaths in {city}?',
      'Witnesses Describe Deadly {city} Confrontation',
    ],
  },

  // SWAT team killed
  escalation_swat_killed: {
    pro_hero: [
      'Devastating Loss: SWAT Team Falls in {city}',
      'Tactical Tragedy in {city}',
    ],
    anti_hero: [
      'SWAT SLAUGHTER: {casualties} Elite Officers Down',
      'Vigilante Annihilates Tactical Team in {city}',
      '"Heroes" Wipe Out SWAT Unit - {casualties} Dead',
    ],
    neutral: [
      'SWAT Team Casualties in {city} Operation',
      '{casualties} Tactical Officers Killed in {city}',
      'Deadly Engagement Leaves SWAT Team Devastated',
    ],
    tabloid: [
      'HORROR: Entire SWAT Team DESTROYED! 😱',
      'THEY KILLED THE ELITE: {casualties} SWAT Officers MASSACRED!',
      'TERMINATOR-Style RAMPAGE Claims SWAT Lives!',
    ],
    government: [
      'National Guard Deployment Considered After SWAT Losses',
      'Federal Response to {city} SWAT Casualties',
    ],
    corporate: [],
    independent: [
      'How Did This Happen? Inside the {city} SWAT Disaster',
    ],
  },

  // Military killed
  escalation_military_killed: {
    pro_hero: [
      'Soldiers Fall in {city} - A Dark Day',
    ],
    anti_hero: [
      'TERROR: Military Personnel Killed by Vigilantes',
      'Domestic Terrorism? {casualties} Soldiers Dead in {city}',
      'ENEMY OF THE STATE: {heroName} Kills Military',
    ],
    neutral: [
      '{casualties} Military Personnel Killed in {city}',
      'Armed Forces Suffer Casualties in {city} Operation',
      'Military Engagement in {city} Turns Fatal',
    ],
    tabloid: [
      'UNTHINKABLE: Heroes KILL {casualties} SOLDIERS!',
      'WAR ON THE STREETS: Military vs Vigilantes!',
    ],
    government: [
      'President Addresses {city} Military Casualties',
      'National Security Alert Following Military Deaths',
      'Defense Department Statement on {city} Incident',
    ],
    corporate: [],
    independent: [
      'Why Were Troops in {city}? Inside the Military Operation',
    ],
  },

  // Civilian casualties during escalation
  escalation_civilian_casualties: {
    pro_hero: [
      'Tragedy Strikes: Civilians Lost in {city} Battle',
      '{heroName} Mourns Civilian Deaths',
    ],
    anti_hero: [
      'INNOCENT BLOOD: {casualties} Civilians Killed by "Heroes"',
      'Vigilante Violence Claims {casualties} Innocent Lives',
      'Collateral Damage: {casualties} Dead, {heroName} Responsible',
    ],
    neutral: [
      '{casualties} Civilians Killed in {city} Incident',
      'Civilian Casualties Mount in {city}',
      'Bystanders Pay Ultimate Price in {city} Battle',
    ],
    tabloid: [
      'HORROR: {casualties} INNOCENTS DEAD! Blood on {heroName}\'s Hands!',
      'MASSACRE of the INNOCENT in {city}! 💔',
    ],
    government: [
      'Investigation Launched After Civilian Deaths',
      'Government Demands Answers for {city} Tragedy',
    ],
    corporate: [],
    independent: [
      'Victims\' Families Speak Out After {city} Tragedy',
      'Who Will Answer for {casualties} Civilian Deaths?',
    ],
  },

  // Major incident (high heat, no faction kills)
  escalation_major_incident: {
    pro_hero: [
      'Major Operation in {city} Draws Attention',
      'Heroes Make Waves in {city}',
    ],
    anti_hero: [
      'Chaos in {city}: Vigilantes Run Wild',
      'Massive Property Damage in {city} Super-Battle',
    ],
    neutral: [
      'Significant Superhuman Activity in {city}',
      'Major Incident Reported in {city}',
      '{city} Rocked by Superhuman Conflict',
    ],
    tabloid: [
      'INSANE Battle Rocks {city}! 🔥',
      'WILD Superpowered Showdown in {city}!',
    ],
    government: [
      '{city} Incident Under Review',
      'Authorities Respond to {city} Disturbance',
    ],
    corporate: [
      'Business Disruption in {city} After Incident',
    ],
    independent: [
      'What Really Happened in {city}?',
    ],
  },

  // Minor incident (low heat)
  escalation_minor: {
    pro_hero: [],
    anti_hero: [],
    neutral: [
      'Minor Incident Reported in {city}',
      'Authorities Respond to {city} Disturbance',
    ],
    tabloid: [],
    government: [],
    corporate: [],
    independent: [],
  },
};

export const ESCALATION_BODIES: Record<string, Record<NewsBias, string[]>> = {
  escalation_police_killed: {
    pro_hero: [
      '{city}, {country} - A tragic confrontation today left {casualties} officers dead. Sources indicate the incident escalated rapidly, leaving heroes with few options. Witnesses describe a chaotic scene.',
    ],
    anti_hero: [
      '{city}, {country} - In a shocking display of brutality, vigilantes murdered {casualties} police officers responding to reports of superhuman activity. The victims, dedicated servants of the community, were cut down in what witnesses describe as a one-sided slaughter. How many more must die before we stop these so-called "heroes"?',
    ],
    neutral: [
      '{city}, {country} - {casualties} police officers were killed today following an encounter with superhuman individuals. The incident began when officers responded to reports of disturbance. An investigation is underway.',
    ],
    tabloid: [
      'OMG you guys, the absolute CHAOS in {city} today! {casualties} cops are DEAD after running into {heroName}. Our sources are saying it was BRUTAL. We have the footage and it\'s NOT pretty! 💀',
    ],
    government: [
      '{city}, {country} - The Department of Justice has opened an investigation into the deaths of {casualties} law enforcement officers. Federal authorities are considering enhanced charges. A statement from the Attorney General is expected.',
    ],
    corporate: [
      '{city}, {country} - Insurance adjusters are on scene following the incident. Liability claims related to officer deaths may impact municipal budgets. Private security firms report increased inquiry volume.',
    ],
    independent: [
      '{city}, {country} - Local residents are still processing what happened. "We heard the shooting," said one witness. "It didn\'t stop for minutes." Questions remain about why the situation escalated to such deadly force.',
    ],
  },

  escalation_swat_killed: {
    pro_hero: [
      '{city}, {country} - A tactical operation went tragically wrong today, resulting in the deaths of {casualties} elite SWAT officers. The circumstances remain unclear as investigators work to understand how such a well-trained unit was overwhelmed.',
    ],
    anti_hero: [
      '{city}, {country} - Our most elite tactical officers are dead. {casualties} SWAT team members were slaughtered today by individuals who claim to be "heroes." These were the best of the best, trained for the worst scenarios. They never stood a chance against these monsters.',
    ],
    neutral: [
      '{city}, {country} - A tactical response team suffered {casualties} casualties during an operation today. The SWAT unit was deployed following reports of superhuman activity. Details of the engagement remain under investigation.',
    ],
    tabloid: [
      'UNREAL! A whole SWAT team got WIPED OUT in {city}! We\'re talking full tactical gear, armored vehicles, the works - and they got DESTROYED. {casualties} dead! This is like something out of a movie! 😱',
    ],
    government: [
      '{city}, {country} - The loss of {casualties} SWAT officers represents a significant blow to local law enforcement capabilities. Federal assistance has been requested. The Governor has ordered flags to half-staff.',
    ],
    corporate: [],
    independent: [
      '{city}, {country} - Community members are asking difficult questions after {casualties} elite officers were killed. "They were supposed to be the last line," said one resident. "If they can\'t stop them, who can?"',
    ],
  },

  escalation_military_killed: {
    pro_hero: [
      '{city}, {country} - Military personnel have fallen in what authorities are calling an unprecedented domestic engagement. {casualties} service members gave their lives. The nation mourns.',
    ],
    anti_hero: [
      '{city}, {country} - Domestic terrorists have murdered {casualties} American soldiers on American soil. These vigilantes have crossed every line. They are no longer heroes - they are enemies of the state who must be stopped by any means necessary.',
    ],
    neutral: [
      '{city}, {country} - {casualties} military personnel were killed during an operation in {city} today. The circumstances that led to military involvement remain classified. Next of kin have been notified.',
    ],
    tabloid: [
      'This is INSANE! {casualties} SOLDIERS are DEAD after going up against {heroName}! The MILITARY couldn\'t stop them! What is even happening?! Are we watching the start of a superhuman WAR?! 🔥',
    ],
    government: [
      '{city}, {country} - The President has been briefed on the loss of {casualties} military personnel. The National Security Council convened an emergency session. Martial law options are reportedly under discussion.',
    ],
    corporate: [],
    independent: [
      '{city}, {country} - The presence of military forces in a civilian area raises serious constitutional questions. "Who authorized this?" asks one civil rights attorney. "And why did {casualties} soldiers die on our streets?"',
    ],
  },

  escalation_civilian_casualties: {
    pro_hero: [
      '{city}, {country} - Tragedy struck today as {casualties} innocent civilians lost their lives during a superhuman confrontation. Heroes have expressed profound grief over the losses, which occurred despite efforts to protect bystanders.',
    ],
    anti_hero: [
      '{city}, {country} - {casualties} innocent people are dead today because vigilantes couldn\'t be bothered to fight somewhere else. Children, families, workers - all dead because "heroes" decided our neighborhood was their battleground. No apology will bring them back.',
    ],
    neutral: [
      '{city}, {country} - {casualties} civilians were killed during a superhuman incident today. Emergency services responded to multiple casualty reports. Grief counselors have been deployed to the affected area.',
    ],
    tabloid: [
      'We can\'t believe we\'re writing this 💔 {casualties} people who were just going about their day are GONE. Caught in the crossfire of a hero battle. The faces of the victims are heartbreaking...',
    ],
    government: [
      '{city}, {country} - The government has announced a full investigation into circumstances that led to {casualties} civilian deaths. Victim compensation programs are being discussed. New restrictions on superhuman activity may follow.',
    ],
    corporate: [],
    independent: [
      '{city}, {country} - Candlelight vigils are being organized for the {casualties} victims. "They were my neighbors," said one resident through tears. "They didn\'t ask for any of this." The community demands answers.',
    ],
  },

  escalation_major_incident: {
    pro_hero: [
      '{city}, {country} - A significant operation unfolded in the city today, drawing attention from authorities and media alike. While details remain limited, heroes appear to have successfully managed a challenging situation.',
    ],
    anti_hero: [
      '{city}, {country} - Yet another day disrupted by vigilante activity. Streets closed, businesses shuttered, residents frightened - all so self-appointed "heroes" could play out their fantasy. When will this end?',
    ],
    neutral: [
      '{city}, {country} - A major incident involving superhuman individuals occurred in the city today. Multiple agencies responded. The situation has been contained. Residents are advised to check with local authorities before returning to the area.',
    ],
    tabloid: [
      'WILD scene in {city} today! Explosions, super-powers flying everywhere, the whole nine yards! We\'ve got video and it\'s INSANE! Check out these shots! 🔥',
    ],
    government: [
      '{city}, {country} - Authorities are reviewing the incident that occurred in {city} today. A formal assessment of property damage and response effectiveness will be conducted.',
    ],
    corporate: [
      '{city}, {country} - Business leaders are assessing the economic impact of today\'s incident. Early estimates suggest significant disruption to commerce in the affected area. Insurance adjusters are on scene.',
    ],
    independent: [
      '{city}, {country} - Residents are sharing their experiences from today\'s incident on social media. Stories range from gratitude to frustration. The community conversation continues.',
    ],
  },

  escalation_minor: {
    pro_hero: [],
    anti_hero: [],
    neutral: [
      '{city}, {country} - A minor incident involving superhuman activity was reported today. No significant casualties or damage reported. Authorities continue to monitor the situation.',
    ],
    tabloid: [],
    government: [],
    corporate: [],
    independent: [],
  },
};

/**
 * Generate news from escalation outcome
 */
export function generateEscalationNews(
  templateId: string,
  data: {
    cityName: string;
    countryName: string;
    heroName?: string;
    casualties: number;
    propertyDamage?: number;
  },
  gameTime: GameTime,
  fame: number = 0
): NewsArticle {
  const headlines = ESCALATION_HEADLINES[templateId] || ESCALATION_HEADLINES.escalation_minor;
  const bodies = ESCALATION_BODIES[templateId] || ESCALATION_BODIES.escalation_minor;

  // Determine importance based on template
  let importance: NewsImportance = 'standard';
  if (templateId.includes('military') || templateId.includes('swat')) {
    importance = 'breaking';
  } else if (templateId.includes('police') || templateId.includes('civilian')) {
    importance = 'major';
  }

  // Pick source based on fame - negative fame = more anti-hero coverage
  const source = fame < -25
    ? pickRandomSource('anti_hero')
    : fame < 0
      ? pickRandomSource('neutral')
      : pickRandomSource('pro_hero');

  const descriptor = selectDescriptor(fame, data.heroName);

  const variables: Record<string, string | number> = {
    city: data.cityName,
    country: data.countryName,
    heroName: descriptor,
    casualties: data.casualties,
    damage: data.propertyDamage?.toLocaleString() || '0',
    quote: generateWitnessQuote(),
  };

  const headline = substituteVariables(
    getHeadlineForBias(headlines, source.bias),
    variables
  );

  const body = substituteVariables(
    getBodyForBias(bodies, source.bias),
    variables
  );

  return createNewsArticle({
    headline,
    body,
    category: 'superhuman',
    importance,
    source,
    publishTime: gameTime,
  });
}

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

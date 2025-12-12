/**
 * Election System
 *
 * Tracks elections for each country:
 * - Years until next election (based on presidential term)
 * - Leader changes when election happens
 * - Potential policy shifts after elections
 * - Newspaper-worthy events
 */

import { Country } from '../types';

// =============================================================================
// ELECTION STATE INTERFACE
// =============================================================================

export interface CountryElectionState {
  countryCode: string;
  currentLeader: string;
  leaderTitle: string;
  yearsUntilElection: number;
  termLength: number;  // From country.presidentialTerm
  electionHistory: ElectionResult[];
  currentParty?: string;
  oppositionStrength: number;  // 0-100, affects election uncertainty
}

export interface ElectionResult {
  year: number;
  winner: string;
  loser: string;
  winnerParty?: string;
  loserParty?: string;
  marginOfVictory: number;  // 0-100 percentage points
  wasIncumbent: boolean;
  wasLandslide: boolean;  // >20% margin
  wasContested: boolean;  // <2% margin
}

export interface ElectionOutcome {
  countryCode: string;
  countryName: string;
  previousLeader: string;
  newLeader: string;
  leaderChanged: boolean;
  marginOfVictory: number;
  policyShifts: PolicyShift[];
  newsHeadline: string;
  newsBody: string;
}

export interface PolicyShift {
  policy: string;
  direction: 'increase' | 'decrease' | 'unchanged';
  magnitude: number;  // 1-10
  description: string;
}

// =============================================================================
// ELECTION INITIALIZATION
// =============================================================================

/**
 * Initialize election state for a country
 */
export function initializeElectionState(country: Country): CountryElectionState {
  // Start with random years until election (1 to term length)
  const termLength = country.presidentialTerm || 4;
  const yearsUntilElection = 1 + Math.floor(Math.random() * termLength);

  return {
    countryCode: country.code,
    currentLeader: country.president,
    leaderTitle: country.leaderTitle,
    yearsUntilElection,
    termLength,
    electionHistory: [],
    oppositionStrength: 30 + Math.floor(Math.random() * 40),  // 30-70 base
  };
}

/**
 * Initialize election states for all countries
 */
export function initializeAllElections(countries: Country[]): Map<string, CountryElectionState> {
  const elections = new Map<string, CountryElectionState>();

  countries.forEach(country => {
    elections.set(country.code, initializeElectionState(country));
  });

  return elections;
}

// =============================================================================
// ELECTION SIMULATION
// =============================================================================

/**
 * Generate a random leader name based on culture
 */
function generateLeaderName(cultureCode: number, gender: string): string {
  // Simplified name generation - could be expanded with culture-specific names
  const maleFirstNames = [
    'James', 'Robert', 'Michael', 'David', 'John', 'Richard', 'Charles', 'Thomas',
    'Alexander', 'William', 'Daniel', 'Andrew', 'Joseph', 'Benjamin', 'Christopher',
    'Ivan', 'Dmitri', 'Vladimir', 'Sergei', 'Alexei',
    'Ahmed', 'Mohammed', 'Hassan', 'Ali', 'Omar',
    'Wei', 'Chen', 'Li', 'Zhang', 'Wang',
    'Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Satoshi',
  ];

  const femaleFirstNames = [
    'Elizabeth', 'Victoria', 'Catherine', 'Margaret', 'Sarah', 'Angela', 'Patricia',
    'Maria', 'Ana', 'Isabella', 'Sofia', 'Valentina',
    'Aisha', 'Fatima', 'Zainab', 'Amina',
    'Mei', 'Xiu', 'Ling', 'Yan',
    'Yuki', 'Sakura', 'Aiko', 'Hana',
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Petrov', 'Ivanov', 'Smirnov', 'Volkov', 'Sokolov',
    'Al-Rahman', 'Al-Hassan', 'Al-Mahmoud', 'Ibn Rashid',
    'Chen', 'Wang', 'Li', 'Zhang', 'Liu',
    'Tanaka', 'Yamamoto', 'Suzuki', 'Watanabe', 'Sato',
  ];

  const firstNames = gender === 'female' ? femaleFirstNames : maleFirstNames;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

/**
 * Simulate an election for a country
 */
export function simulateElection(
  state: CountryElectionState,
  country: Country,
  gameYear: number
): ElectionOutcome {
  // Calculate incumbent advantage
  const incumbentBonus = 10;  // Incumbents have natural advantage

  // Base incumbent strength (affected by government perception, corruption)
  let incumbentStrength = 50 + incumbentBonus;
  if (country.governmentPerception === 'Positive') incumbentStrength += 10;
  if (country.governmentPerception === 'Negative') incumbentStrength -= 15;
  incumbentStrength -= country.governmentCorruption / 5;  // Corruption hurts incumbent

  // Opposition strength
  let oppositionStrength = state.oppositionStrength;

  // Add randomness
  incumbentStrength += (Math.random() - 0.5) * 30;  // +/- 15
  oppositionStrength += (Math.random() - 0.5) * 30;

  // Determine winner
  const total = incumbentStrength + oppositionStrength;
  const incumbentShare = (incumbentStrength / total) * 100;
  const oppositionShare = (oppositionStrength / total) * 100;

  const incumbentWins = incumbentShare > oppositionShare;
  const marginOfVictory = Math.abs(incumbentShare - oppositionShare);

  // Generate new leader if opposition wins
  const newLeader = incumbentWins
    ? state.currentLeader
    : generateLeaderName(country.cultureCode, Math.random() > 0.7 ? 'female' : 'male');

  const leaderChanged = !incumbentWins;

  // Generate policy shifts if leader changed
  const policyShifts: PolicyShift[] = [];
  if (leaderChanged) {
    // Random policy shifts
    const policies = [
      { name: 'Military Budget', key: 'militaryBudget' },
      { name: 'Law Enforcement', key: 'lawEnforcement' },
      { name: 'Intelligence Services', key: 'intelligenceServices' },
      { name: 'LSW Regulations', key: 'lswRegulations' },
      { name: 'Media Freedom', key: 'mediaFreedom' },
    ];

    // 2-3 policy shifts
    const numShifts = 2 + Math.floor(Math.random() * 2);
    const selectedPolicies = [...policies].sort(() => Math.random() - 0.5).slice(0, numShifts);

    selectedPolicies.forEach(policy => {
      const direction = Math.random() > 0.5 ? 'increase' : 'decrease';
      const magnitude = 1 + Math.floor(Math.random() * 5);  // 1-5

      policyShifts.push({
        policy: policy.name,
        direction,
        magnitude,
        description: `${policy.name} will ${direction === 'increase' ? 'increase' : 'decrease'} by ${magnitude} points`,
      });
    });
  }

  // Generate news
  const wasLandslide = marginOfVictory > 20;
  const wasContested = marginOfVictory < 2;

  let newsHeadline: string;
  let newsBody: string;

  if (leaderChanged) {
    if (wasLandslide) {
      newsHeadline = `LANDSLIDE: ${newLeader} Sweeps to Victory in ${country.name}`;
      newsBody = `In a decisive victory, ${newLeader} has been elected as the new ${country.leaderTitle} of ${country.name}, defeating incumbent ${state.currentLeader} by a margin of ${marginOfVictory.toFixed(1)}%. The election marks a significant shift in the nation's political landscape.`;
    } else if (wasContested) {
      newsHeadline = `RAZOR-THIN: ${newLeader} Narrowly Wins ${country.name} Election`;
      newsBody = `After a nail-biting election, ${newLeader} has emerged victorious in ${country.name} by just ${marginOfVictory.toFixed(1)}%. The extremely close race has sparked calls for recounts in several districts.`;
    } else {
      newsHeadline = `${country.name} Elects New Leader: ${newLeader}`;
      newsBody = `${newLeader} has been elected as the new ${country.leaderTitle} of ${country.name}, defeating incumbent ${state.currentLeader}. The new administration is expected to bring policy changes in the coming months.`;
    }
  } else {
    if (wasLandslide) {
      newsHeadline = `${state.currentLeader} Wins Landslide Re-election in ${country.name}`;
      newsBody = `${state.currentLeader} has secured another term as ${country.leaderTitle} of ${country.name} with a commanding ${marginOfVictory.toFixed(1)}% margin of victory.`;
    } else {
      newsHeadline = `${state.currentLeader} Re-elected in ${country.name}`;
      newsBody = `${state.currentLeader} has been re-elected as ${country.leaderTitle} of ${country.name}, defeating the opposition by ${marginOfVictory.toFixed(1)}%.`;
    }
  }

  // Record election result
  state.electionHistory.push({
    year: gameYear,
    winner: incumbentWins ? state.currentLeader : newLeader,
    loser: incumbentWins ? 'Opposition Candidate' : state.currentLeader,
    marginOfVictory,
    wasIncumbent: incumbentWins,
    wasLandslide,
    wasContested,
  });

  return {
    countryCode: country.code,
    countryName: country.name,
    previousLeader: state.currentLeader,
    newLeader,
    leaderChanged,
    marginOfVictory,
    policyShifts,
    newsHeadline,
    newsBody,
  };
}

/**
 * Advance election timer by one year, trigger election if needed
 */
export function advanceElectionYear(
  state: CountryElectionState,
  country: Country,
  gameYear: number
): ElectionOutcome | null {
  state.yearsUntilElection--;

  if (state.yearsUntilElection <= 0) {
    // Election time!
    const outcome = simulateElection(state, country, gameYear);

    // Update state
    state.currentLeader = outcome.newLeader;
    state.yearsUntilElection = state.termLength;

    // Adjust opposition strength based on result
    if (outcome.leaderChanged) {
      // New leader starts with lower opposition
      state.oppositionStrength = 25 + Math.floor(Math.random() * 20);
    } else {
      // Failed opposition gets stronger or weaker randomly
      state.oppositionStrength = Math.max(10, Math.min(80,
        state.oppositionStrength + (Math.random() > 0.5 ? 10 : -10)
      ));
    }

    return outcome;
  }

  return null;
}

// =============================================================================
// ELECTION INFO DISPLAY
// =============================================================================

export function getElectionStatusText(yearsUntilElection: number): string {
  if (yearsUntilElection <= 0) return 'Election Year!';
  if (yearsUntilElection === 1) return 'Election next year';
  return `${yearsUntilElection} years until election`;
}

export function getElectionUrgencyColor(yearsUntilElection: number): string {
  if (yearsUntilElection <= 0) return '#ef4444';  // red
  if (yearsUntilElection === 1) return '#f97316';  // orange
  if (yearsUntilElection === 2) return '#eab308';  // yellow
  return '#22c55e';  // green
}

export default {
  initializeElectionState,
  initializeAllElections,
  simulateElection,
  advanceElectionYear,
  getElectionStatusText,
  getElectionUrgencyColor,
};

/**
 * Time System - SuperHero Tactics
 *
 * Hour-based time tracking (0-24 hours per day).
 * Activities consume specific hours, allowing multiple activities per day.
 *
 * Time of Day:
 * - Night: 0-5 (6 hours)
 * - Morning: 6-11 (6 hours)
 * - Afternoon: 12-17 (6 hours)
 * - Evening: 18-23 (6 hours)
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type TimeOfDay = 'night' | 'morning' | 'afternoon' | 'evening';

export type Month =
  | 'january'
  | 'february'
  | 'march'
  | 'april'
  | 'may'
  | 'june'
  | 'july'
  | 'august'
  | 'september'
  | 'october'
  | 'november'
  | 'december';

export interface GameDate {
  year: number;
  month: number;        // 1-12
  dayOfMonth: number;   // 1-31
  dayOfWeek: DayOfWeek;
}

export interface GameTime {
  // Absolute tracking
  totalHours: number;   // Total hours since game start
  day: number;          // Day count from game start (1-indexed)
  hour: number;         // Current hour (0-23)

  // Calendar
  date: GameDate;

  // Convenience
  timeOfDay: TimeOfDay;
  isWeekend: boolean;
}

// ============================================================================
// ACTIVITY SYSTEM
// ============================================================================

export type ActivityCategory =
  | 'study'
  | 'work'
  | 'recovery'
  | 'operations'
  | 'base'
  | 'personal';

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  hoursRequired: number;
  allowedTimeSlots?: TimeOfDay[];     // If empty, any time
  blockedTimeSlots?: TimeOfDay[];     // Cannot do during these times
  conflicts?: string[];               // Cannot do while these are active
  description: string;
}

// ============================================================================
// ACTIVITY HOUR COSTS
// ============================================================================

export const ACTIVITY_HOURS = {
  // STUDY (Education System)
  fullStudy: 8,
  partTimeStudy: 4,
  intensiveStudy: 12,
  onlineStudy: 6,
  practicalLab: 8,
  examTaking: 4,

  // WORK (Day Jobs)
  fullTimeJob: 8,
  partTimeJob: 4,
  overtimeJob: 10,

  // RECOVERY
  sleep: 8,              // Required daily or penalties
  shortRest: 4,          // Light recovery
  hospitalCare: 24,      // Full day in hospital (character unavailable)
  therapy: 2,            // Mental health recovery

  // OPERATIONS
  travelPerSector: 6,    // 6 hours per sector traveled
  missionBriefing: 2,
  missionPrep: 2,
  combatMissionBase: 4,  // Base time, can vary
  investigationSession: 4,
  surveillance: 6,
  infiltration: 4,

  // BASE ACTIVITIES
  training: 4,
  craftingSession: 4,
  repairWork: 2,
  facilityMaintenance: 2,
  baseDefenseSetup: 4,

  // PERSONAL
  shopping: 2,
  socializing: 3,
  personalBusiness: 2,
} as const;

// ============================================================================
// PREDEFINED ACTIVITIES
// ============================================================================

export const ACTIVITIES: Activity[] = [
  // STUDY
  {
    id: 'full_study',
    name: 'Full Study Session',
    category: 'study',
    hoursRequired: ACTIVITY_HOURS.fullStudy,
    allowedTimeSlots: ['morning', 'afternoon'],
    description: 'Full day of focused study at an institution or home base.',
  },
  {
    id: 'part_time_study',
    name: 'Part-Time Study',
    category: 'study',
    hoursRequired: ACTIVITY_HOURS.partTimeStudy,
    description: 'Half-day study session, can combine with work.',
  },
  {
    id: 'intensive_study',
    name: 'Intensive Study',
    category: 'study',
    hoursRequired: ACTIVITY_HOURS.intensiveStudy,
    description: 'Extended cram session. Exhaustion risk.',
  },
  {
    id: 'online_study',
    name: 'Online Study',
    category: 'study',
    hoursRequired: ACTIVITY_HOURS.onlineStudy,
    description: 'Remote learning. Available anywhere with internet.',
  },
  {
    id: 'practical_lab',
    name: 'Practical Lab',
    category: 'study',
    hoursRequired: ACTIVITY_HOURS.practicalLab,
    allowedTimeSlots: ['morning', 'afternoon'],
    description: 'Hands-on practice session. Requires facility access.',
  },

  // WORK
  {
    id: 'full_time_job',
    name: 'Full-Time Work',
    category: 'work',
    hoursRequired: ACTIVITY_HOURS.fullTimeJob,
    allowedTimeSlots: ['morning', 'afternoon'],
    blockedTimeSlots: ['night'],
    description: 'Standard work day at your job.',
  },
  {
    id: 'part_time_job',
    name: 'Part-Time Work',
    category: 'work',
    hoursRequired: ACTIVITY_HOURS.partTimeJob,
    description: 'Half-day work shift.',
  },

  // RECOVERY
  {
    id: 'sleep',
    name: 'Sleep',
    category: 'recovery',
    hoursRequired: ACTIVITY_HOURS.sleep,
    allowedTimeSlots: ['night', 'evening'],
    description: 'Required rest. Skipping causes penalties.',
  },
  {
    id: 'short_rest',
    name: 'Rest',
    category: 'recovery',
    hoursRequired: ACTIVITY_HOURS.shortRest,
    description: 'Light recovery period.',
  },
  {
    id: 'hospital_care',
    name: 'Hospital Care',
    category: 'recovery',
    hoursRequired: ACTIVITY_HOURS.hospitalCare,
    description: 'Full day of medical care. Character unavailable.',
  },

  // OPERATIONS
  {
    id: 'mission_briefing',
    name: 'Mission Briefing',
    category: 'operations',
    hoursRequired: ACTIVITY_HOURS.missionBriefing,
    description: 'Review mission parameters and objectives.',
  },
  {
    id: 'combat_mission',
    name: 'Combat Mission',
    category: 'operations',
    hoursRequired: ACTIVITY_HOURS.combatMissionBase,
    description: 'Active combat operation.',
  },
  {
    id: 'investigation_session',
    name: 'Investigation',
    category: 'operations',
    hoursRequired: ACTIVITY_HOURS.investigationSession,
    description: 'Work on an active case.',
  },
  {
    id: 'surveillance',
    name: 'Surveillance',
    category: 'operations',
    hoursRequired: ACTIVITY_HOURS.surveillance,
    description: 'Monitor a target or location.',
  },

  // BASE
  {
    id: 'training',
    name: 'Base Training',
    category: 'base',
    hoursRequired: ACTIVITY_HOURS.training,
    description: 'Physical or skill training at base.',
  },
  {
    id: 'crafting',
    name: 'Crafting',
    category: 'base',
    hoursRequired: ACTIVITY_HOURS.craftingSession,
    description: 'Create or modify equipment.',
  },
  {
    id: 'repair_work',
    name: 'Repair Work',
    category: 'base',
    hoursRequired: ACTIVITY_HOURS.repairWork,
    description: 'Repair damaged equipment or vehicles.',
  },

  // PERSONAL
  {
    id: 'shopping',
    name: 'Shopping',
    category: 'personal',
    hoursRequired: ACTIVITY_HOURS.shopping,
    allowedTimeSlots: ['morning', 'afternoon'],
    description: 'Purchase supplies or equipment.',
  },
  {
    id: 'socializing',
    name: 'Socializing',
    category: 'personal',
    hoursRequired: ACTIVITY_HOURS.socializing,
    allowedTimeSlots: ['afternoon', 'evening'],
    description: 'Improve morale through social activity.',
  },
];

// ============================================================================
// CALENDAR DATA
// ============================================================================

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const MONTHS: Month[] = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export const MONTH_NAMES: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

export const DAYS_IN_MONTH: Record<number, number> = {
  1: 31,  // January
  2: 28,  // February (non-leap)
  3: 31,  // March
  4: 30,  // April
  5: 31,  // May
  6: 30,  // June
  7: 31,  // July
  8: 31,  // August
  9: 30,  // September
  10: 31, // October
  11: 30, // November
  12: 31, // December
};

// ============================================================================
// DEFAULT START DATE
// ============================================================================

export const DEFAULT_START_DATE: GameDate = {
  year: 2025,
  month: 1,        // January
  dayOfMonth: 1,   // 1st
  dayOfWeek: 'wednesday',
};

export const DEFAULT_START_HOUR = 8; // Start at 8 AM

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get time of day from hour (0-23)
 */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 0 && hour < 6) return 'night';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Get hour range for a time of day
 */
export function getTimeOfDayRange(timeOfDay: TimeOfDay): [number, number] {
  switch (timeOfDay) {
    case 'night': return [0, 5];
    case 'morning': return [6, 11];
    case 'afternoon': return [12, 17];
    case 'evening': return [18, 23];
  }
}

/**
 * Check if an hour is within a time of day
 */
export function isHourInTimeOfDay(hour: number, timeOfDay: TimeOfDay): boolean {
  const [start, end] = getTimeOfDayRange(timeOfDay);
  return hour >= start && hour <= end;
}

/**
 * Check if a day of week is a weekend
 */
export function isWeekend(dayOfWeek: DayOfWeek): boolean {
  return dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get days in a specific month (accounting for leap years)
 */
export function getDaysInMonth(month: number, year: number): number {
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return DAYS_IN_MONTH[month] || 30;
}

/**
 * Get the next day of week
 */
export function getNextDayOfWeek(current: DayOfWeek): DayOfWeek {
  const currentIndex = DAYS_OF_WEEK.indexOf(current);
  return DAYS_OF_WEEK[(currentIndex + 1) % 7];
}

/**
 * Advance a date by one day
 */
export function advanceDate(date: GameDate): GameDate {
  const daysInCurrentMonth = getDaysInMonth(date.month, date.year);
  let newDay = date.dayOfMonth + 1;
  let newMonth = date.month;
  let newYear = date.year;

  if (newDay > daysInCurrentMonth) {
    newDay = 1;
    newMonth++;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
  }

  return {
    year: newYear,
    month: newMonth,
    dayOfMonth: newDay,
    dayOfWeek: getNextDayOfWeek(date.dayOfWeek),
  };
}

/**
 * Create initial game time state
 */
export function createInitialGameTime(
  startDate: GameDate = DEFAULT_START_DATE,
  startHour: number = DEFAULT_START_HOUR
): GameTime {
  return {
    totalHours: 0,
    day: 1,
    hour: startHour,
    date: { ...startDate },
    timeOfDay: getTimeOfDay(startHour),
    isWeekend: isWeekend(startDate.dayOfWeek),
  };
}

/**
 * Advance game time by a number of hours
 */
export function advanceGameTime(current: GameTime, hours: number): GameTime {
  if (hours <= 0) return current;

  let newTotalHours = current.totalHours + hours;
  let newHour = current.hour + hours;
  let newDay = current.day;
  let newDate = { ...current.date };

  // Handle day overflow
  while (newHour >= 24) {
    newHour -= 24;
    newDay++;
    newDate = advanceDate(newDate);
  }

  return {
    totalHours: newTotalHours,
    day: newDay,
    hour: newHour,
    date: newDate,
    timeOfDay: getTimeOfDay(newHour),
    isWeekend: isWeekend(newDate.dayOfWeek),
  };
}

/**
 * Calculate hours between two game times
 */
export function getHoursBetween(start: GameTime, end: GameTime): number {
  return end.totalHours - start.totalHours;
}

/**
 * Calculate days between two game times
 */
export function getDaysBetween(start: GameTime, end: GameTime): number {
  return Math.floor(getHoursBetween(start, end) / 24);
}

/**
 * Calculate weeks between two game times
 */
export function getWeeksBetween(start: GameTime, end: GameTime): number {
  return Math.floor(getDaysBetween(start, end) / 7);
}

/**
 * Check if a day boundary has been crossed (for daily events)
 */
export function hasDayChanged(oldTime: GameTime, newTime: GameTime): boolean {
  return newTime.day > oldTime.day;
}

/**
 * Check if a week boundary has been crossed (for weekly events like payday)
 */
export function hasWeekChanged(oldTime: GameTime, newTime: GameTime): boolean {
  // Week changes on Monday
  if (oldTime.day === newTime.day) return false;

  // Check if we crossed a Monday
  let tempDate = { ...oldTime.date };
  let tempDay = oldTime.day;

  while (tempDay < newTime.day) {
    tempDate = advanceDate(tempDate);
    tempDay++;
    if (tempDate.dayOfWeek === 'monday') {
      return true;
    }
  }

  return false;
}

/**
 * Check if an activity can be performed at the current time
 */
export function canPerformActivity(
  activity: Activity,
  currentTime: GameTime,
  hoursAvailable: number = 24 - currentTime.hour
): { canPerform: boolean; reason?: string } {
  // Check if enough hours remain in the day
  if (activity.hoursRequired > hoursAvailable) {
    return {
      canPerform: false,
      reason: `Not enough hours today. Need ${activity.hoursRequired}, have ${hoursAvailable}.`,
    };
  }

  // Check blocked time slots
  if (activity.blockedTimeSlots?.includes(currentTime.timeOfDay)) {
    return {
      canPerform: false,
      reason: `Cannot perform ${activity.name} during ${currentTime.timeOfDay}.`,
    };
  }

  // Check allowed time slots (if specified)
  if (activity.allowedTimeSlots && activity.allowedTimeSlots.length > 0) {
    if (!activity.allowedTimeSlots.includes(currentTime.timeOfDay)) {
      return {
        canPerform: false,
        reason: `${activity.name} can only be done during: ${activity.allowedTimeSlots.join(', ')}.`,
      };
    }
  }

  return { canPerform: true };
}

/**
 * Get activity by ID
 */
export function getActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find(a => a.id === id);
}

/**
 * Get activities by category
 */
export function getActivitiesByCategory(category: ActivityCategory): Activity[] {
  return ACTIVITIES.filter(a => a.category === category);
}

/**
 * Format time for display (e.g., "8:00 AM")
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/**
 * Format date for display (e.g., "Wednesday, January 1, 2025")
 */
export function formatDate(date: GameDate): string {
  const dayName = date.dayOfWeek.charAt(0).toUpperCase() + date.dayOfWeek.slice(1);
  const monthName = MONTH_NAMES[date.month];
  return `${dayName}, ${monthName} ${date.dayOfMonth}, ${date.year}`;
}

/**
 * Format short date (e.g., "Jan 1")
 */
export function formatShortDate(date: GameDate): string {
  const monthName = MONTH_NAMES[date.month].substring(0, 3);
  return `${monthName} ${date.dayOfMonth}`;
}

/**
 * Format time of day for display
 */
export function formatTimeOfDay(timeOfDay: TimeOfDay): string {
  return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
}

/**
 * Get hours remaining in current day
 */
export function getHoursRemainingToday(currentHour: number): number {
  return 24 - currentHour;
}

/**
 * Get hours until a specific time of day
 */
export function getHoursUntilTimeOfDay(
  currentHour: number,
  targetTimeOfDay: TimeOfDay
): number {
  const [targetStart] = getTimeOfDayRange(targetTimeOfDay);

  if (currentHour < targetStart) {
    return targetStart - currentHour;
  }

  // Need to wait until tomorrow
  return (24 - currentHour) + targetStart;
}

/**
 * Calculate travel time between sectors
 */
export function calculateTravelTime(sectorDistance: number): number {
  return sectorDistance * ACTIVITY_HOURS.travelPerSector;
}

/**
 * Get day number for weekly cycle (0 = start of week, 6 = end of week)
 */
export function getDayOfWeekIndex(dayOfWeek: DayOfWeek): number {
  return DAYS_OF_WEEK.indexOf(dayOfWeek);
}

/**
 * Check if it's payday (Monday)
 */
export function isPayday(date: GameDate): boolean {
  return date.dayOfWeek === 'monday';
}

/**
 * Get days until next payday
 */
export function getDaysUntilPayday(currentDayOfWeek: DayOfWeek): number {
  const currentIndex = getDayOfWeekIndex(currentDayOfWeek);
  const mondayIndex = 1; // Monday

  if (currentIndex < mondayIndex) {
    return mondayIndex - currentIndex;
  }
  if (currentIndex === mondayIndex) {
    return 0; // It's payday!
  }
  return 7 - currentIndex + mondayIndex;
}

// ============================================================================
// SCHEDULE TRACKING
// ============================================================================

export interface ScheduledActivity {
  activityId: string;
  characterId: string;
  startHour: number;
  endHour: number;
  day: number;
}

export interface DaySchedule {
  day: number;
  date: GameDate;
  activities: ScheduledActivity[];
  hoursUsed: number;
  hoursFree: number;
}

/**
 * Create an empty day schedule
 */
export function createDaySchedule(day: number, date: GameDate): DaySchedule {
  return {
    day,
    date,
    activities: [],
    hoursUsed: 0,
    hoursFree: 24,
  };
}

/**
 * Add activity to schedule (validation included)
 */
export function scheduleActivity(
  schedule: DaySchedule,
  activityId: string,
  characterId: string,
  startHour: number
): { success: boolean; schedule: DaySchedule; reason?: string } {
  const activity = getActivityById(activityId);
  if (!activity) {
    return { success: false, schedule, reason: 'Activity not found.' };
  }

  const endHour = startHour + activity.hoursRequired;

  // Check if it fits in the day
  if (endHour > 24) {
    return {
      success: false,
      schedule,
      reason: 'Activity would extend past midnight.',
    };
  }

  // Check for overlapping activities for this character
  const hasOverlap = schedule.activities.some(
    a =>
      a.characterId === characterId &&
      ((startHour >= a.startHour && startHour < a.endHour) ||
        (endHour > a.startHour && endHour <= a.endHour) ||
        (startHour <= a.startHour && endHour >= a.endHour))
  );

  if (hasOverlap) {
    return {
      success: false,
      schedule,
      reason: 'Character already has a scheduled activity during this time.',
    };
  }

  const newSchedule: DaySchedule = {
    ...schedule,
    activities: [
      ...schedule.activities,
      {
        activityId,
        characterId,
        startHour,
        endHour,
        day: schedule.day,
      },
    ],
    hoursUsed: schedule.hoursUsed + activity.hoursRequired,
    hoursFree: schedule.hoursFree - activity.hoursRequired,
  };

  return { success: true, schedule: newSchedule };
}

// ============================================================================
// SLEEP & FATIGUE
// ============================================================================

export const SLEEP_REQUIREMENTS = {
  minSleepHours: 6,
  recommendedSleepHours: 8,
  maxAwakeHours: 20,

  // Penalties for lack of sleep
  tiredPenalty: -5,      // After 16 hours awake
  exhaustedPenalty: -15, // After 20 hours awake
  collapsePenalty: -30,  // After 24 hours awake (forced rest)
};

export type FatigueLevel = 'rested' | 'normal' | 'tired' | 'exhausted' | 'collapsed';

/**
 * Calculate fatigue level from hours awake
 */
export function getFatigueLevel(hoursAwake: number): FatigueLevel {
  if (hoursAwake <= 8) return 'rested';
  if (hoursAwake <= 16) return 'normal';
  if (hoursAwake <= 20) return 'tired';
  if (hoursAwake <= 24) return 'exhausted';
  return 'collapsed';
}

/**
 * Get stat penalty from fatigue
 */
export function getFatiguePenalty(fatigueLevel: FatigueLevel): number {
  switch (fatigueLevel) {
    case 'rested': return 5;  // Small bonus
    case 'normal': return 0;
    case 'tired': return SLEEP_REQUIREMENTS.tiredPenalty;
    case 'exhausted': return SLEEP_REQUIREMENTS.exhaustedPenalty;
    case 'collapsed': return SLEEP_REQUIREMENTS.collapsePenalty;
  }
}

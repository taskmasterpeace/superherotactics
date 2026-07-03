/**
 * CHARACTER STATUS TEXTS — the living-world membrane (spec 01 / plan A3).
 *
 * Characters proactively text the player when their life changes: they arrive
 * somewhere, finish training, get hurt, crack a case. Lines are FIRST-PERSON
 * and flavored by the character's current MOOD, so the same event reads
 * differently from a Focused soldier vs a Broken one.
 *
 * Pure data — the store's sendCharacterText action wraps these into phone
 * notifications (type 'text_message').
 */

import { getMood, Mood } from './moodSystem';

export type TextEvent =
  | 'arrival'
  | 'training_complete'
  | 'injured'
  | 'hospitalized'
  | 'recovered'
  | 'investigation_lead'
  | 'investigation_complete'
  | 'mission_complete'
  | 'downtime';

// Buckets keep the matrix small: most moods read "steady", strained moods get
// their own voice, wrecked moods theirs.
type MoodBucket = 'up' | 'steady' | 'strained' | 'wrecked' | 'drunk';

function bucketOf(mood: Mood): MoodBucket {
  switch (mood) {
    case 'content': case 'focused': return 'up';
    case 'calm': return 'steady';
    case 'stressed': case 'sarcastic': case 'angry': case 'afraid': return 'strained';
    case 'shaken': case 'broken': return 'wrecked';
    case 'drunk': return 'drunk';
  }
}

// {place} and {detail} are substituted when provided.
const TEXT_BANK: Record<TextEvent, Record<MoodBucket, string>> = {
  arrival: {
    up: "Touched down in {place}. Already scouting — this is going to go well. 👊",
    steady: "Arrived at {place}. Setting up and getting the lay of the land.",
    strained: "Made it to {place}. Long trip. Give me an hour before the next thing.",
    wrecked: "In {place}. I'll do my job, but I'm running on empty.",
    drunk: "Landed in {place}!! The bar here is EXCELLENT. On the clock tomorrow, promise.",
  },
  training_complete: {
    up: "Done with {detail} — top of the class. Put it to work, boss. 🎓",
    steady: "Finished the {detail} program. Certificate's real. What's next?",
    strained: "Got through {detail}. Barely slept. Hope it was worth it.",
    wrecked: "Completed {detail}. Can't say I feel any smarter. Or better.",
    drunk: "PASSED {detail}!! Celebrating!! 🍻",
  },
  injured: {
    up: "Took a hit — {detail}. It's nothing, I've had worse. Still in the fight.",
    steady: "Got hurt out here. {detail}. Patched up for now but flagging it.",
    strained: "I'm hit. {detail}. Could really use an extraction plan.",
    wrecked: "Hurt again. {detail}. I don't know how much more of this I've got.",
    drunk: "Ok funny story, I'm slightly injured?? {detail}. It's FINE.",
  },
  hospitalized: {
    up: "Checked into the hospital — {detail}. I'll be back before you miss me.",
    steady: "In the hospital for {detail}. Doctors say it's treatable. Keep me posted.",
    strained: "Hospital. {detail}. Hate lying here while the team's out there.",
    wrecked: "They admitted me. {detail}. Maybe it's better I'm off the board.",
    drunk: "In hospital. Nurses confiscated my flask. Rude. ({detail})",
  },
  recovered: {
    up: "Cleared by the docs — 100% and itching to move. Point me at something. 💪",
    steady: "Back on my feet. Ready for assignment.",
    strained: "Discharged. Body works. Head... give it a few days.",
    wrecked: "They say I'm healed. Doesn't feel like it. Reporting in anyway.",
    drunk: "FREE! Celebrated my discharge appropriately. See you tomorrow(ish).",
  },
  investigation_lead: {
    up: "Found something on the case — {detail}. Told you I'd crack it. 🔍",
    steady: "New lead: {detail}. Following it up.",
    strained: "Dug up a lead — {detail}. This case is getting under my skin.",
    wrecked: "There's a lead. {detail}. Somebody else should probably run with it.",
    drunk: "Sooo I found a clue?? {detail}. Writing it down before I forget.",
  },
  investigation_complete: {
    up: "Case CLOSED. {detail}. Next mystery please. 🎯",
    steady: "Investigation wrapped: {detail}. Full report on your desk.",
    strained: "It's done. {detail}. I need a week off after this one.",
    wrecked: "Closed the case. {detail}. Can't feel good about any of it.",
    drunk: "SOLVED IT!! {detail}!! Drinks are on me!!",
  },
  mission_complete: {
    up: "Mission done, clean sweep. Team performed like champions. 🏆",
    steady: "Objective complete. Heading back. Debrief when we land.",
    strained: "It's done. Got messy out there. We need to talk about support.",
    wrecked: "Mission's over. We made it out. That's all I can say right now.",
    drunk: "MISSION ACCOMPLISHED!! Team's at the bar. You're paying!!",
  },
  downtime: {
    up: "Took the afternoon for {detail}. Recharged and ready. 😎",
    steady: "FYI — spent some downtime on {detail}. Back on call now.",
    strained: "Needed a break. Did {detail}. Don't read into it.",
    wrecked: "Tried {detail} to clear my head. Didn't really work.",
    drunk: "Sooo {detail} turned into a WHOLE thing. Details later. Or never.",
  },
};

/**
 * Build the first-person text a character sends for an event, flavored by
 * their live mood. `place`/`detail` fill the template slots when relevant.
 */
export function generateStatusText(
  char: any,
  event: TextEvent,
  slots: { place?: string; detail?: string } = {}
): { message: string; mood: Mood } {
  const mood = getMood(char).mood;
  const line = TEXT_BANK[event][bucketOf(mood)]
    .replace('{place}', slots.place || 'the sector')
    .replace('{detail}', slots.detail || 'the details are in my report');
  return { message: line, mood };
}

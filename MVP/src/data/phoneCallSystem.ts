/**
 * PHONE-CALL DIALOGUE SYSTEM
 *
 * A character (or contact) calls the player. Their portrait shows on the phone,
 * they speak — lines styled by their current MOOD via the speech-bubble engine —
 * and the player answers by picking from choices (accept / decline / ask / calm).
 *
 * A call is a tiny node graph: each node is a line the caller says + the choices
 * the player can give back. Choices carry declarative EFFECTS the store applies
 * (morale nudges, accepting a mission), so this file stays pure data — no store,
 * no React. Content is generated from live character state, so the SAME character
 * calls differently when they're Focused vs Afraid vs Broken.
 */

import { getMood, Mood } from './moodSystem';

export type CallEffectType =
  | 'none'
  | 'morale'          // amount: +/- morale to the caller
  | 'acceptMission'   // missionId
  | 'declineMission'  // missionId
  | 'reassure'        // small morale boost + relationship
  | 'custom';         // key resolved by the caller's context

export interface CallEffect {
  type: CallEffectType;
  amount?: number;
  missionId?: string;
  key?: string;
}

export interface CallChoice {
  text: string;          // what the PLAYER says back
  next?: string;         // node id to advance to (omit + end:true to hang up)
  end?: boolean;         // ends the call after this choice
  effect?: CallEffect;   // applied when chosen
  tone?: 'warm' | 'firm' | 'neutral'; // affects styling / caller reaction
}

export interface CallNode {
  id: string;
  text: string;          // what the CALLER says — rendered as a speech bubble
  choices?: CallChoice[]; // player options; empty/absent => a hang-up node
}

export type CallKind = 'check_in' | 'mission_offer' | 'morale_crisis' | 'report';

export interface PhoneCall {
  id: string;
  kind: CallKind;
  callerId: string;      // character/contact id
  callerName: string;
  topic: string;         // short header shown on the phone
  startNode: string;
  nodes: Record<string, CallNode>;
  /** The caller's mood at dial time — the UI styles bubbles from this. */
  callerMood: Mood;
}

// ---------------------------------------------------------------------------
// Mood-flavored line banks. The caller's opening line changes with how they feel.
// ---------------------------------------------------------------------------

const CHECK_IN_OPENERS: Record<Mood, string> = {
  content:   "Hey, checking in — things are quiet and I'm feeling good out here.",
  focused:   "Reporting in. I'm locked on and ready for whatever's next.",
  calm:      "Just calling to check in. Nothing to report, all steady.",
  stressed:  "Checking in... it's been a long stretch. Could use a breather soon.",
  sarcastic: "Checking in. Still alive, still underpaid. You're welcome.",
  afraid:    "Hey— it's me. I'll be honest, I'm rattled out here. Talk to me.",
  angry:     "You wanted a check-in? Fine. I'm fed up and I need something to change.",
  shaken:    "I... I needed to hear a voice. Things got bad. I'm not okay.",
  broken:    "I can't keep doing this. I'm done. I mean it this time.",
  drunk:     "Heyyy boss. I mighta had a few. But I'm FINE. Totally fine.",
};

const CHECK_IN_ASK_RESPONSES: Record<Mood, string> = {
  content:   "Honestly? No complaints. Keep me in the rotation.",
  focused:   "Give me the hard job. I want it.",
  calm:      "I'm good. Whatever the team needs.",
  stressed:  "I just need a lighter week. That's all.",
  sarcastic: "Oh, you know — the usual near-death experiences. Building character.",
  afraid:    "The last op shook me. I keep replaying it. I don't want to freeze up.",
  angry:     "What's wrong is I'm carrying this team and nobody's noticing.",
  shaken:    "I keep seeing it when I close my eyes. I don't think I slept.",
  broken:    "Everything's wrong. I've got nothing left to give.",
  drunk:     "Wrong? Nothin's wrong! We should get the WHOLE team out here.",
};

function pid(char: any): string {
  return String(char?.id ?? char?.name ?? char?.realName ?? 'unknown');
}
function pname(char: any): string {
  return String(char?.name ?? char?.realName ?? 'Operative');
}

/**
 * A status check-in call. The caller opens according to their mood; the player
 * can reassure them (morale up), ask what's wrong (a mood-flavored reply), or
 * cut it short. Broken/shaken callers offer a reassure that matters more.
 */
export function generateCheckInCall(char: any): PhoneCall {
  const mood = getMood(char).mood;
  const id = pid(char);
  const name = pname(char);
  const rattled = mood === 'afraid' || mood === 'shaken' || mood === 'broken';

  const nodes: Record<string, CallNode> = {
    start: {
      id: 'start',
      text: CHECK_IN_OPENERS[mood],
      choices: [
        { text: "What's going on out there?", next: 'ask', tone: 'neutral' },
        rattled
          ? { text: "Hang in there — I've got your back.", next: 'reassure', tone: 'warm',
              effect: { type: 'reassure', amount: 8 } }
          : { text: "Good work. Stay sharp.", next: 'praise', tone: 'warm',
              effect: { type: 'morale', amount: 3 } },
        { text: "Not now. Stay on mission.", end: true, tone: 'firm',
          effect: mood === 'broken' ? { type: 'morale', amount: -4 } : { type: 'none' } },
      ],
    },
    ask: {
      id: 'ask',
      text: CHECK_IN_ASK_RESPONSES[mood],
      choices: [
        rattled
          ? { text: "You're not alone. We'll get you home.", end: true, tone: 'warm',
              effect: { type: 'reassure', amount: 10 } }
          : { text: "Understood. I'll factor that in.", end: true, tone: 'neutral',
              effect: { type: 'morale', amount: 2 } },
        { text: "Toughen up. This is the job.", end: true, tone: 'firm',
          effect: { type: 'morale', amount: rattled ? -6 : -2 } },
      ],
    },
    reassure: {
      id: 'reassure',
      text: "...Thanks. That actually helps. I've got this.",
      choices: [{ text: "Damn right you do.", end: true, tone: 'warm', effect: { type: 'morale', amount: 3 } }],
    },
    praise: {
      id: 'praise',
      text: "Appreciate it. I'll keep the pressure on.",
      choices: [{ text: "Out.", end: true, tone: 'neutral' }],
    },
  };

  return {
    id: `call-checkin-${id}`,
    kind: mood === 'broken' || mood === 'shaken' ? 'morale_crisis' : 'check_in',
    callerId: id,
    callerName: name,
    topic: mood === 'broken' || mood === 'shaken' ? 'Urgent — needs to talk' : 'Checking in',
    startNode: 'start',
    nodes,
    callerMood: mood,
  };
}

/**
 * A mission-offer call from a contact/handler. Player can accept, decline, or
 * ask for detail (which loops back to the offer). Effects reference the mission.
 */
export function generateMissionOfferCall(
  caller: { id?: string; name?: string; morale?: any; personality?: any; activeInjuries?: any },
  mission: { id: string; name: string; reward?: number; location?: string; summary?: string }
): PhoneCall {
  const mood = getMood(caller).mood;
  const id = pid(caller);
  const name = pname(caller);
  const reward = mission.reward ? `$${mission.reward.toLocaleString()}` : 'good money';

  const nodes: Record<string, CallNode> = {
    start: {
      id: 'start',
      text: `Got work for you: ${mission.name}${mission.location ? ` in ${mission.location}` : ''}. Pays ${reward}. You in?`,
      choices: [
        { text: "We're in. Send the details.", end: true, tone: 'firm',
          effect: { type: 'acceptMission', missionId: mission.id } },
        { text: "Tell me more first.", next: 'detail', tone: 'neutral' },
        { text: "Pass. Not our kind of job.", end: true, tone: 'firm',
          effect: { type: 'declineMission', missionId: mission.id } },
      ],
    },
    detail: {
      id: 'detail',
      text: mission.summary || "It's sensitive. In and out, minimal noise. The pay reflects the risk.",
      choices: [
        { text: "Alright. We'll take it.", end: true, tone: 'firm',
          effect: { type: 'acceptMission', missionId: mission.id } },
        { text: "Too hot. We'll sit this one out.", end: true, tone: 'firm',
          effect: { type: 'declineMission', missionId: mission.id } },
      ],
    },
  };

  return {
    id: `call-offer-${mission.id}`,
    kind: 'mission_offer',
    callerId: id,
    callerName: name,
    topic: `Job offer: ${mission.name}`,
    startNode: 'start',
    nodes,
    callerMood: mood,
  };
}

/** Resolve the node a choice leads to; null means the call ends. */
export function nextNode(call: PhoneCall, choice: CallChoice): CallNode | null {
  if (choice.end || !choice.next) return null;
  return call.nodes[choice.next] ?? null;
}

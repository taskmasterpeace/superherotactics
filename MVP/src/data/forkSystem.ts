/**
 * FORK IN THE ROAD (spec 110) — the decision-event primitive.
 *
 * A fork is a pause-worthy choice: a situation, 2-4 options with declarative
 * consequences, an optional deadline, and a default that fires if you sit on
 * it (inaction IS a choice). Critical forks interrupt (modal, clock stops);
 * the rest queue politely.
 *
 * Producers anywhere in the game emit forks; the store presents and resolves
 * them. First producers: prisoners taken after combat (spec 109) and legal
 * fallout from collateral damage (spec 17).
 */

export interface ForkEffect {
  budget?: number;                                  // +/- cash (via ledger)
  fame?: number;
  standing?: { factionType: string; delta: number }; // home-country faction
  moraleTeam?: number;                              // whole roster morale nudge
  addPrisoners?: { name: string; threat: number; orgId?: string }[];
  legalCase?: { title: string; severity: 1 | 2 | 3; settleCost: number };
  releasePrisoners?: boolean;
  flipPrisoners?: boolean;                          // on-probation recruits (J2)
  tag?: string;                                     // custom handling hook
}

export interface ForkOption {
  id: string;
  label: string;          // the button
  detail: string;         // what it means (tone: hardcore, plain)
  effect: ForkEffect;
  /** Intel-gated foresight (K4): shown only when player INT/investigation reveals it */
  foresight?: string;
}

export interface ForkEvent {
  id: string;
  title: string;
  situation: string;      // 2-3 sentences of the mess you're in
  icon: string;
  context: 'interrupt' | 'inbox';
  options: ForkOption[];
  defaultOptionId: string; // fires on expiry — inaction is a choice
  expiresDay?: number;
  createdDay: number;
  status: 'pending' | 'resolved' | 'expired';
  resolvedOptionId?: string;
}

let seq = 0;
function fid(): string { return `fork_${Date.now().toString(36)}_${(seq++).toString(36)}`; }

// ---------------------------------------------------------------------------
// Producers
// ---------------------------------------------------------------------------

/** After a victory with surrendered enemies: what do you do with them? (109 + J2/J3) */
export function prisonersFork(count: number, orgName: string | undefined, gameDay: number): ForkEvent {
  const names = Array.from({ length: count }, (_, i) => `${orgName || 'Enemy'} ${['soldier', 'lieutenant', 'enforcer', 'operative'][i % 4]} #${i + 1}`);
  return {
    id: fid(),
    title: `${count} prisoner${count === 1 ? '' : 's'} taken`,
    situation: `${count} enemy combatant${count === 1 ? '' : 's'}${orgName ? ` from ${orgName}` : ''} surrendered. They're zip-tied in the transport. Nobody official knows yet — what happens next is your call.`,
    icon: '⛓️',
    context: 'interrupt',
    createdDay: gameDay,
    expiresDay: gameDay + 2,
    status: 'pending',
    defaultOptionId: 'hold',
    options: [
      {
        id: 'hold',
        label: 'Hold for interrogation',
        detail: 'Cage them at base. Intel over days — and heat if word gets out. (Dark methods are on the table; this outfit does not run an ethics committee.)',
        effect: { addPrisoners: names.map(n => ({ name: n, threat: 1 + Math.floor(Math.random() * 3), orgId: undefined })), standing: { factionType: 'police', delta: -3 } },
        foresight: 'Interrogated prisoners feed investigation progress; holding them risks a rescue attempt.',
      },
      {
        id: 'flip',
        label: 'Offer them a deal',
        detail: 'Flip the willing ones — on-probation recruits with a betrayal risk. A gamble, not a free upgrade.',
        effect: { flipPrisoners: true, addPrisoners: names.slice(0, Math.max(1, Math.floor(count / 2))).map(n => ({ name: n, threat: 2 })), fame: -5 },
        foresight: 'Roughly half take the deal. Probationers can defect under pressure.',
      },
      {
        id: 'release',
        label: 'Cut them loose',
        detail: 'No prisoners. It plays well with the public — and every one of them goes home knowing your faces.',
        effect: { releasePrisoners: true, fame: 8, standing: { factionType: 'government', delta: 2 } },
      },
      {
        id: 'handover',
        label: 'Hand them to the authorities',
        detail: 'By the book. The police take the credit and the bodies. Clean hands, thin intel.',
        effect: { standing: { factionType: 'police', delta: 6 }, fame: 3 },
      },
    ],
  };
}

/** Collateral damage caught up with you: the lawyers are calling. (17-lite) */
export function legalFalloutFork(damageDesc: string, severity: 1 | 2 | 3, gameDay: number): ForkEvent {
  const settle = severity * 15000;
  return {
    id: fid(),
    title: 'Legal fallout',
    situation: `${damageDesc} A claim has been filed against your organization. Your handler suggests you make this go away — one way or another.`,
    icon: '⚖️',
    context: 'inbox',
    createdDay: gameDay,
    expiresDay: gameDay + 5,
    status: 'pending',
    defaultOptionId: 'stall',
    options: [
      {
        id: 'settle',
        label: `Settle quietly ($${settle.toLocaleString()})`,
        detail: 'Pay, sign the NDA, bury it. Expensive and final.',
        effect: { budget: -settle, legalCase: undefined as any },
      },
      {
        id: 'fight',
        label: 'Fight it in court',
        detail: 'Months of process. Cheaper if you win; a circus either way.',
        effect: { legalCase: { title: damageDesc, severity, settleCost: settle }, fame: -3 },
        foresight: 'Court runs 30-90 days; verdict scales with severity and your government standing.',
      },
      {
        id: 'stall',
        label: 'Let the lawyers stall',
        detail: 'Do nothing. It festers — standing bleeds until it resolves.',
        effect: { standing: { factionType: 'government', delta: -4 }, legalCase: { title: damageDesc, severity, settleCost: Math.round(settle * 1.5) } },
      },
    ],
  };
}

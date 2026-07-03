/**
 * HANDLER SYSTEM — your home government's standing gets a face.
 *
 * Every team works FOR someone. The Handler is the human voice of your home
 * country's government faction: a deterministic persona per country who
 * texts you when your standing moves and leans on you when you burn
 * goodwill. Reuses the phone (text_message) membrane.
 */

const FIRST = ['Adrian', 'Marta', 'Kwame', 'Yuki', 'Elena', 'Farid', 'Ingrid', 'Mateo', 'Priya', 'Viktor', 'Amara', 'Denis'];
const LAST = ['Voss', 'Okafor', 'Lindqvist', 'Marchetti', 'Tanaka', 'Petrov', 'Haddad', 'Silva', 'Kaur', 'Novak', 'Mensah', 'Ferrer'];

/** Deterministic handler persona per country (stable across sessions). */
export function getHandler(countryName: string): { name: string; title: string; id: string } {
  let h = 0;
  for (let i = 0; i < countryName.length; i++) h = (h * 31 + countryName.charCodeAt(i)) >>> 0;
  const name = `${FIRST[h % FIRST.length]} ${LAST[(h >>> 4) % LAST.length]}`;
  return { name, title: 'Government Handler', id: `handler_${countryName.toLowerCase().replace(/\W+/g, '_')}` };
}

const RISE_LINES = [
  "Good work out there. The minister noticed. Keep this up and doors open for you.",
  "Your stock is rising upstairs. Don't waste it.",
  "That last move played well in the briefing room. More of that.",
];

const FALL_LINES = [
  "We need to talk. People upstairs are asking questions about your operation.",
  "You're burning goodwill fast. I can only cover for you so long.",
  "That did not land well with the ministry. Clean it up.",
];

const CRISIS_LINES = [
  "Listen carefully: one more incident and they'll cut you loose. Officially you don't exist, remember?",
  "The ministry is drafting your termination order. Give me ONE win to stop it.",
];

export function handlerLineForChange(change: number, newStanding: number): string | null {
  if (change >= 5) return RISE_LINES[Math.floor(Math.random() * RISE_LINES.length)];
  if (change <= -5) {
    if (newStanding <= -20) return CRISIS_LINES[Math.floor(Math.random() * CRISIS_LINES.length)];
    return FALL_LINES[Math.floor(Math.random() * FALL_LINES.length)];
  }
  return null;
}

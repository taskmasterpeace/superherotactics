import React from 'react';
import { PhoneOff } from 'lucide-react';
import { useGameStore } from '../stores/enhancedGameStore';
import { CharacterPortrait } from './CharacterPortrait';
import { MOOD_META } from '../data/moodSystem';
import type { CallChoice } from '../data/phoneCallSystem';

/**
 * PHONE-CALL SCREEN — a character rings the player. Their portrait fills a 9:16
 * phone frame, they speak in a chat bubble tinted by their current MOOD, and the
 * player answers by picking a choice (accept / decline / ask / reassure). Choice
 * effects are applied by the store's answerCall action.
 *
 * Renders as a full-screen overlay only while `activePhoneCall` is set.
 */
const TONE_STYLE: Record<string, string> = {
  warm: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
  firm: 'border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
  neutral: 'border-border bg-card text-foreground hover:bg-muted',
};

const PhoneCallScreen: React.FC = () => {
  const call = useGameStore(s => s.activePhoneCall);
  const nodeId = useGameStore(s => s.phoneCallNodeId);
  const answerCall = useGameStore(s => s.answerCall);
  const endCall = useGameStore(s => s.endCall);
  const characters = useGameStore(s => s.characters);

  if (!call || !nodeId) return null;
  const node = call.nodes[nodeId];
  if (!node) return null;

  const caller = characters.find((c: any) => c.id === call.callerId) || { id: call.callerId, realName: call.callerName };
  const mood = MOOD_META[call.callerMood];
  const choices = node.choices ?? [];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* 9:16 phone frame */}
      <div
        className="relative flex flex-col overflow-hidden rounded-[28px] border-4 border-black bg-background shadow-2xl"
        style={{ width: 'min(92vw, 380px)', height: 'min(92vh, 676px)' }}
      >
        {/* Status strip */}
        <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>● Live Call</span>
          <span>{call.topic}</span>
        </div>

        {/* Caller portrait + identity */}
        <div className="flex flex-col items-center gap-2 px-6 pt-3 pb-4">
          <div className="relative">
            <span
              className="absolute -inset-2 rounded-full opacity-60 animate-ping"
              style={{ background: `${mood.color}33` }}
            />
            <div className="relative">
              <CharacterPortrait character={caller as any} size={140} rounded showOriginBadge />
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tracking-tight text-foreground">{call.callerName}</div>
            <span
              className="mt-1 inline-flex items-center gap-1 rounded-full border border-black px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: `${mood.color}26`, color: mood.color }}
            >
              {mood.emoji} {mood.label}
            </span>
          </div>
        </div>

        {/* Spoken line — a mood-tinted chat bubble */}
        <div className="flex-1 overflow-y-auto px-5">
          <div
            className="relative rounded-2xl rounded-tl-sm border-2 px-4 py-3 text-sm leading-snug text-foreground"
            style={{ borderColor: mood.color, background: `${mood.color}14` }}
          >
            {node.text}
          </div>
        </div>

        {/* Player choices */}
        <div className="space-y-2 p-4">
          {choices.map((choice: CallChoice, i: number) => (
            <button
              key={i}
              onClick={() => answerCall(choice)}
              className={`w-full rounded-xl border-2 px-4 py-2.5 text-left text-sm font-semibold transition-colors ${TONE_STYLE[choice.tone || 'neutral']}`}
            >
              {choice.text}
            </button>
          ))}
          {choices.length === 0 && (
            <button
              onClick={endCall}
              className="w-full rounded-xl border-2 border-red-500/60 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20"
            >
              Hang up
            </button>
          )}
          <button
            onClick={endCall}
            title="End call"
            className="mx-auto mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-red-600 text-white hover:bg-red-700"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneCallScreen;

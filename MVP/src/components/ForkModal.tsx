import React from 'react';
import { useGameStore } from '../stores/enhancedGameStore';

/**
 * FORK IN THE ROAD modal (spec 110) — the clock stops, you choose.
 * Foresight lines (K4) are intel-gated: your best analyst's INT reveals what
 * an option probably leads to; a dumb roster chooses blind.
 */
const ForkModal: React.FC = () => {
  const fork = useGameStore(s => s.activeFork);
  const resolveFork = useGameStore(s => s.resolveFork);
  const characters = useGameStore(s => s.characters);
  const gameDay = useGameStore(s => s.gameTime?.day ?? 1);

  if (!fork) return null;

  // K4: intel-gated foresight — need one sharp mind on the roster
  const bestINT = Math.max(0, ...characters.map((c: any) => c?.stats?.INT ?? 0));
  const showForesight = bestINT >= 65;
  const daysLeft = fork.expiresDay != null ? fork.expiresDay - gameDay : null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border-4 border-black bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b-2 border-black bg-amber-950/60 px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-amber-200">
              <span className="text-2xl">{fork.icon}</span> {fork.title.toUpperCase()}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
              ⏸ world paused{daysLeft != null ? ` · defaults in ${daysLeft}d` : ''}
            </span>
          </div>
        </div>

        {/* Situation */}
        <p className="px-5 py-4 text-sm leading-relaxed text-gray-200">{fork.situation}</p>

        {/* Options */}
        <div className="space-y-2 px-5 pb-5">
          {fork.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => resolveFork(opt.id)}
              className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                opt.id === fork.defaultOptionId
                  ? 'border-gray-500 bg-gray-800 hover:border-amber-400'
                  : 'border-gray-700 bg-gray-800/60 hover:border-amber-400'
              }`}
            >
              <span className="block text-sm font-bold text-white">
                {opt.label}
                {opt.id === fork.defaultOptionId && (
                  <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-gray-500">default on expiry</span>
                )}
              </span>
              <span className="mt-0.5 block text-xs text-gray-400">{opt.detail}</span>
              {opt.foresight && (
                showForesight ? (
                  <span className="mt-1 block text-[11px] text-cyan-300">🔎 {opt.foresight}</span>
                ) : (
                  <span className="mt-1 block text-[11px] italic text-gray-600" title="A sharper analyst (INT 65+) could predict this option's fallout">
                    🔎 consequences unclear — no one on the roster can game this out
                  </span>
                )
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForkModal;

import React from 'react';
import { Brain, Heart, Flame, Compass, Briefcase, Map as MapIcon, GraduationCap } from 'lucide-react';
import { getMood } from '../data/moodSystem';
import { getRoleEffectiveness, DOMAIN_LABEL, DOMAIN_ICON, RoleDomain } from '../data/characterRoles';
import { getCharacterDayJob } from '../data/educationSystem';
import { getFamiliarityTierInfo } from '../data/characterLifeCycle';

/**
 * PSYCHE TAB — the hidden/emotional layer, surfaced (plan C2).
 *
 * The JA2 promise: you KNOW your people. Mood right now, morale and where it
 * rests, the personality under it (MBTI + volatility/motivation/aggression),
 * why they fight (calling), what they're actually good at (role domains),
 * their civilian cover, the cities they know, the degrees they've earned.
 * Every section renders only when the character carries the data.
 */

const Bar: React.FC<{ value: number; max?: number; color: string }> = ({ value, max = 10, color }) => (
  <div className="h-2 flex-1 rounded-full bg-gray-800 overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
  </div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cyan-400 mb-3">
      {icon} {title}
    </h3>
    {children}
  </div>
);

export const PsycheTab: React.FC<{ character: any }> = ({ character: c }) => {
  const mood = getMood(c);
  const morale = typeof c.morale === 'number' ? c.morale : c.morale?.current ?? null;
  const baseline = c.morale?.baselineMorale;
  const p = c.personality;
  const eff = getRoleEffectiveness(c);
  const coverJob = getCharacterDayJob(c);
  const fams: any[] = c.cityFamiliarity || [];
  const degrees: any[] = c.completedDegrees || [];
  const calling = c.calling?.name || c.calling || c.motivation_text;

  return (
    <div className="space-y-4">
      {/* Current state of mind */}
      <Section icon={<Brain size={16} />} title="State of Mind">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-lg font-bold"
            style={{ borderColor: mood.color, background: `${mood.color}1a`, color: mood.color }}
          >
            <span className="text-2xl">{mood.emoji}</span> {mood.label}
          </div>
          {morale != null && (
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Morale</span>
                <span>{morale}/100{baseline != null ? ` (rests at ${baseline})` : ''}</span>
              </div>
              <Bar value={morale} max={100} color={mood.color} />
            </div>
          )}
        </div>
        {c.morale?.lastChangeReason && (
          <p className="mt-2 text-xs text-gray-400">Last change: {c.morale.lastChangeReason}</p>
        )}
      </Section>

      {/* Personality under the hood */}
      {p && (
        <Section icon={<Flame size={16} />} title="Personality">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {p.type && (
              <div className="flex items-center justify-between sm:col-span-2">
                <span className="text-sm text-gray-300">Type</span>
                <span className="font-mono font-bold text-white bg-gray-700 px-2 py-0.5 rounded">{p.type}</span>
              </div>
            )}
            {typeof p.volatility === 'number' && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-400">Volatility</span>
                <Bar value={p.volatility} color={p.volatility >= 7 ? '#ef4444' : p.volatility >= 4 ? '#eab308' : '#22c55e'} />
                <span className="w-6 text-right text-xs font-bold text-gray-300">{p.volatility}</span>
              </div>
            )}
            {typeof p.motivation === 'number' && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-400">Drive</span>
                <Bar value={p.motivation} color="#38bdf8" />
                <span className="w-6 text-right text-xs font-bold text-gray-300">{p.motivation}</span>
              </div>
            )}
            {typeof p.harmPotential === 'number' && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-400">Aggression</span>
                <Bar value={p.harmPotential} color={p.harmPotential >= 7 ? '#f97316' : '#a3a3a3'} />
                <span className="w-6 text-right text-xs font-bold text-gray-300">{p.harmPotential}</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-500 italic">
            {p.volatility >= 7 ? 'Runs hot — expect strong reactions under pressure.'
              : p.volatility <= 3 ? 'Even-keeled — copes with dry humor rather than outbursts.'
              : 'Emotionally steady under normal conditions.'}
          </p>
        </Section>
      )}

      {/* Why they fight */}
      {calling && (
        <Section icon={<Compass size={16} />} title="Calling">
          <p className="text-sm text-gray-200">{String(calling)}</p>
          {c.calling?.description && <p className="mt-1 text-xs text-gray-400">{c.calling.description}</p>}
        </Section>
      )}

      {/* What they're good at */}
      <Section icon={<Heart size={16} />} title="Effectiveness">
        <div className="space-y-2">
          {(Object.keys(eff) as RoleDomain[])
            .sort((a, b) => eff[b] - eff[a])
            .map(d => (
              <div key={d} className="flex items-center gap-3">
                <span className="w-40 text-xs text-gray-300">{DOMAIN_ICON[d]} {DOMAIN_LABEL[d]}</span>
                <Bar value={eff[d]} max={100} color={eff[d] >= 70 ? '#22c55e' : eff[d] >= 45 ? '#eab308' : '#6b7280'} />
                <span className="w-8 text-right text-xs font-bold text-gray-300">{eff[d]}</span>
              </div>
            ))}
        </div>
      </Section>

      {/* Civilian cover */}
      {coverJob && (
        <Section icon={<Briefcase size={16} />} title="Cover Identity">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{coverJob.name}</p>
              <p className="text-xs text-gray-400">{coverJob.coverBenefit}</p>
            </div>
            <span className="font-bold text-emerald-400">${coverJob.weeklyPay}/wk</span>
          </div>
        </Section>
      )}

      {/* Cities they know */}
      {fams.length > 0 && (
        <Section icon={<MapIcon size={16} />} title="City Knowledge">
          <div className="flex flex-wrap gap-2">
            {fams.map((f, i) => {
              const tier = getFamiliarityTierInfo(f.level ?? f.familiarity ?? 0);
              return (
                <span
                  key={i}
                  title={tier.description}
                  className="rounded-lg border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
                >
                  {f.cityName || f.cityId} · <span className="font-bold">{tier.label}</span>
                  {(f.isHometown || f.homeTown) && ' 🏠'}
                </span>
              );
            })}
          </div>
        </Section>
      )}

      {/* Earned degrees */}
      {degrees.length > 0 && (
        <Section icon={<GraduationCap size={16} />} title="Earned Degrees">
          <div className="flex flex-wrap gap-2">
            {degrees.map((d, i) => (
              <span key={i} className="rounded-lg border border-cyan-800 bg-cyan-900/30 px-2 py-1 text-xs text-cyan-200">
                {d.degreeLevel} · {String(d.fieldId).replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default PsycheTab;

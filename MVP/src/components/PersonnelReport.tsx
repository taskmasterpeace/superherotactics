import React from 'react';
import { Stethoscope, AlertTriangle, EyeOff, Phone } from 'lucide-react';
import { useGameStore } from '../stores/enhancedGameStore';
import { CharacterPortrait } from './CharacterPortrait';
import { RetroPanel } from './ui';
import {
  getPhysicalState, AppliedInjury, SEVERITY_COLOR,
} from '../data/injuryEngine';
import { getStrengths } from '../data/characterRoles';
import { getCharacterDayJob } from '../data/educationSystem';
import { getMood } from '../data/moodSystem';
import { getCharacterCityFamiliarity, getFamiliarityTierInfo, getFamiliarityOpModifier } from '../data/characterLifeCycle';
import { getStatusMeta, ASSIGNABLE_ACTIVITIES } from '../data/statusMeta';

/**
 * PERSONNEL — the color-coded condition board. One row per character: portrait,
 * physical state and mental state as colored chips, every visible injury as a
 * severity-colored tag, and a "needs diagnosis" marker when internal damage is
 * hidden until a hospital visit. The at-a-glance JA2 medical report.
 */
const PersonnelReport: React.FC = () => {
  const characters = useGameStore(s => s.characters);
  const setCurrentView = useGameStore(s => s.setCurrentView);
  const startCharacterCall = useGameStore(s => s.startCharacterCall);
  const setCharacterStatus = useGameStore(s => s.setCharacterStatus);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);

  const roster = characters.filter((c: any) => c.status !== 'dead');
  const fallen = characters.filter((c: any) => c.status === 'dead');

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">PERSONNEL — CONDITION REPORT</h1>
            <p className="text-xs text-muted-foreground">
              Physical & mental state at a glance. Internal damage stays unknown until a hospital diagnosis.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {(['#22c55e', '#eab308', '#f97316', '#ef4444'] as const).map((c, i) => (
              <span key={c} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full border border-black" style={{ background: c }} />
                {['OK', 'Hurt', 'Bad', 'Critical'][i]}
              </span>
            ))}
          </div>
        </div>

        {roster.map((char: any) => {
          const phys = getPhysicalState({
            activeInjuries: char.activeInjuries,
            health: char.health?.current ?? char.health,
            maxHealth: char.health?.maximum ?? char.maxHealth,
          });
          const mood = getMood(char); // emotional read — feeds this chip + speech bubbles
          const injuries: AppliedInjury[] = char.activeInjuries ?? [];
          const visible = injuries.filter(i => !i.hidden);
          const hiddenCount = injuries.length - visible.length;
          const strengths = getStrengths(char, 2); // what this person is good at
          const coverJob = getCharacterDayJob(char); // education → cover + income
          // City familiarity: unknown ground carries an op penalty; home turf a bonus.
          const cityKey = char.currentLocation || char.location?.city;
          const hasFamRecord = !!(cityKey && char.cityFamiliarity?.length);
          const famLevel = hasFamRecord ? getCharacterCityFamiliarity(char, cityKey) : null;
          const famTier = famLevel != null ? getFamiliarityTierInfo(famLevel) : null;
          const famMod = famLevel != null ? getFamiliarityOpModifier(famLevel) : 0;

          return (
            <RetroPanel key={char.id} padding="sm">
              <div className="flex items-center gap-3">
                <CharacterPortrait character={char} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground truncate">{char.name || char.realName}</span>
                    {/* Full status palette (spec 06) — icon + color per state */}
                    {(() => {
                      const sm = getStatusMeta(char.status);
                      return (
                        <span
                          title={sm.blurb}
                          className="flex items-center gap-1 rounded-md border border-black px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{ background: `${sm.color}26`, color: sm.color }}
                        >
                          {sm.icon} {sm.label}
                        </span>
                      );
                    })()}
                    {char.recoveryTime > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        recovery ~{Math.ceil(char.recoveryTime)}h
                      </span>
                    )}
                    {/* Role strengths — "everyone is effective at something" */}
                    {strengths.map(s => (
                      <span
                        key={s.domain}
                        title={`${s.label}: ${s.score}/100`}
                        className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                      >
                        {s.icon} {s.label} {s.score}
                      </span>
                    ))}
                    {coverJob && (
                      <span
                        title={`Cover: ${coverJob.coverBenefit} · pays $${coverJob.weeklyPay}/wk when home`}
                        className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400"
                      >
                        💼 {coverJob.name} ${coverJob.weeklyPay}/wk
                      </span>
                    )}
                    {famTier && (
                      <span
                        title={`${famTier.label} in ${cityKey} — ${famTier.description}. Field-op modifier ${famMod > 0 ? '+' : ''}${famMod}%`}
                        className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          borderColor: famMod < 0 ? '#f9731688' : famMod > 0 ? '#22c55e88' : '#88888888',
                          background: famMod < 0 ? '#f9731614' : famMod > 0 ? '#22c55e14' : 'transparent',
                          color: famMod < 0 ? '#f97316' : famMod > 0 ? '#22c55e' : '#a1a1aa',
                        }}
                      >
                        🗺️ {famTier.label} {famMod > 0 ? '+' : ''}{famMod}%
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    {/* Physical + mental state chips — THE color read */}
                    <span
                      className="flex items-center gap-1 rounded-md border border-black px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${phys.color}26`, color: phys.color }}
                    >
                      <Stethoscope size={10} /> {phys.state}
                    </span>
                    <span
                      title="Current mood — drives how they speak on calls"
                      className="flex items-center gap-1 rounded-md border border-black px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${mood.color}26`, color: mood.color }}
                    >
                      <span className="text-[11px] leading-none">{mood.emoji}</span> {mood.label}
                    </span>
                    {/* Injury tags, severity-colored */}
                    {visible.map(inj => (
                      <span
                        key={inj.id}
                        title={`${inj.effect}\nTreatment: ${inj.treatment} · ${inj.duration}`}
                        className="rounded border border-black/60 px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${SEVERITY_COLOR[inj.severity]}22`, color: SEVERITY_COLOR[inj.severity] }}
                      >
                        {inj.permanent && '● '}{inj.name}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => setCurrentView('hospital')}
                        title="Internal damage detected — hospital diagnosis required"
                        className="flex items-center gap-1 rounded border border-warning/70 bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning hover:bg-warning/25 transition-colors"
                      >
                        <EyeOff size={10} /> {hiddenCount} undiagnosed
                      </button>
                    )}
                    {injuries.length === 0 && (
                      <span className="text-[10px] text-muted-foreground">no injuries on record</span>
                    )}
                  </div>
                </div>
                <div className="relative flex shrink-0 items-center gap-2">
                  {/* Assign activity (activity-scheduler lite) */}
                  {['ready', 'patrol', 'personal_life'].includes(char.status) && (
                    <button
                      onClick={() => setAssigningId(assigningId === char.id ? null : char.id)}
                      title="Assign activity"
                      className="rounded-lg border-2 border-black bg-surface px-2 py-1.5 text-[10px] font-bold uppercase text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Assign ▾
                    </button>
                  )}
                  <button
                    onClick={() => startCharacterCall(char.id)}
                    title={`Call ${char.name || char.realName}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    <Phone size={15} />
                  </button>
                  {assigningId === char.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border-2 border-black bg-card p-1 shadow-xl">
                      {ASSIGNABLE_ACTIVITIES.filter(a => a.status !== char.status).map(a => {
                        const sm = getStatusMeta(a.status);
                        return (
                          <button
                            key={a.status}
                            onClick={() => { setCharacterStatus(char.id, a.status); setAssigningId(null); }}
                            className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface transition-colors"
                          >
                            <span>{sm.icon}</span>
                            <span>
                              <span className="block text-xs font-bold" style={{ color: sm.color }}>{sm.label}</span>
                              <span className="block text-[10px] text-muted-foreground">{a.payoff}</span>
                            </span>
                          </button>
                        );
                      })}
                      <div className="my-1 border-t border-black/20" />
                      <button
                        onClick={() => { setAssigningId(null); setCurrentView('training'); }}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface transition-colors"
                      >
                        <span>🎓</span>
                        <span className="block text-xs font-bold text-emerald-400">Training Center →</span>
                      </button>
                      <button
                        onClick={() => { setAssigningId(null); setCurrentView('investigation'); }}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface transition-colors"
                      >
                        <span>🔍</span>
                        <span className="block text-xs font-bold text-sky-400">Investigations →</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </RetroPanel>
          );
        })}

        {fallen.length > 0 && (
          <RetroPanel padding="sm" className="opacity-70">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertTriangle size={14} /> FALLEN ({fallen.length})
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {fallen.map((c: any) => (
                <span key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CharacterPortrait character={c} size={22} /> {c.name || c.realName}
                </span>
              ))}
            </div>
          </RetroPanel>
        )}

        {roster.length === 0 && fallen.length === 0 && (
          <RetroPanel><p className="py-8 text-center text-sm text-muted-foreground">No personnel on the roster yet.</p></RetroPanel>
        )}
      </div>
    </div>
  );
};

export default PersonnelReport;

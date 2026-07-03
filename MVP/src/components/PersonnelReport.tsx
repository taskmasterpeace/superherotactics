import React from 'react';
import { Stethoscope, Brain, AlertTriangle, EyeOff } from 'lucide-react';
import { useGameStore } from '../stores/enhancedGameStore';
import { CharacterPortrait } from './CharacterPortrait';
import { RetroPanel, RetroBadge } from './ui';
import {
  getPhysicalState, getMentalState, AppliedInjury, SEVERITY_COLOR,
} from '../data/injuryEngine';

/**
 * PERSONNEL — the color-coded condition board. One row per character: portrait,
 * physical state and mental state as colored chips, every visible injury as a
 * severity-colored tag, and a "needs diagnosis" marker when internal damage is
 * hidden until a hospital visit. The at-a-glance JA2 medical report.
 */
const PersonnelReport: React.FC = () => {
  const characters = useGameStore(s => s.characters);
  const setCurrentView = useGameStore(s => s.setCurrentView);

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
          const mental = getMentalState({ activeInjuries: char.activeInjuries, morale: char.morale });
          const injuries: AppliedInjury[] = char.activeInjuries ?? [];
          const visible = injuries.filter(i => !i.hidden);
          const hiddenCount = injuries.length - visible.length;

          return (
            <RetroPanel key={char.id} padding="sm">
              <div className="flex items-center gap-3">
                <CharacterPortrait character={char} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground truncate">{char.name || char.realName}</span>
                    <RetroBadge size="sm" variant="default">{char.status}</RetroBadge>
                    {char.recoveryTime > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        recovery ~{Math.ceil(char.recoveryTime)}h
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
                      className="flex items-center gap-1 rounded-md border border-black px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${mental.color}26`, color: mental.color }}
                    >
                      <Brain size={10} /> {mental.state}
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

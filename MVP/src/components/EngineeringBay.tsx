import React, { useMemo, useState } from 'react';
import { Wrench, FlaskConical, PencilRuler, Hammer, Lock, Check, Loader } from 'lucide-react';
import { useGameStore } from '../stores/enhancedGameStore';
import { CharacterPortrait } from './CharacterPortrait';
import {
  SUIT_ARCHETYPES, RESEARCH_PROJECTS, designQuality, getResearchProject,
} from '../data/engineeringSystem';
import { getRoleEffectiveness } from '../data/characterRoles';

/**
 * ENGINEERING BAY — where "design it" and "build it" are different jobs.
 *
 *  DESIGN     pick an archetype + a designer → a Blueprint (quality = the
 *             designer's INT + tech aptitude; better brains, better suits)
 *  RESEARCH   the tech tree (Metallurgy → Materials → …) that unlocks the
 *             catalog's locked gear and exotic archetypes
 *  FABRICATE  an engineer turns a finished blueprint into a real suit
 *
 * Assigned characters go to 'research'/'engineering' status and come back
 * when the bench work is done (day-tick driven).
 */

type BayTab = 'design' | 'research' | 'fabricate';

const EngineeringBay: React.FC = () => {
  const characters = useGameStore(s => s.characters);
  const blueprints = useGameStore(s => s.blueprints);
  const projects = useGameStore(s => s.engineeringProjects);
  const unlocked = useGameStore(s => s.unlockedResearch);
  const budget = useGameStore(s => s.budget);
  const startDesignProject = useGameStore(s => s.startDesignProject);
  const startResearchProject = useGameStore(s => s.startResearchProject);
  const startFabrication = useGameStore(s => s.startFabrication);

  const [tab, setTab] = useState<BayTab>('design');
  const [archetypeId, setArchetypeId] = useState(SUIT_ARCHETYPES[0].id);
  const [suitName, setSuitName] = useState('');
  const [workerId, setWorkerId] = useState<string>('');

  const ready = useMemo(() => characters.filter((c: any) => c.status === 'ready'), [characters]);
  const worker = ready.find((c: any) => c.id === workerId) || ready[0];

  const WorkerPicker: React.FC<{ hint: string }> = ({ hint }) => (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {ready.length === 0 && <p className="text-xs text-gray-500 italic">No idle operatives — everyone is busy.</p>}
        {ready.map((c: any) => {
          const tech = getRoleEffectiveness(c).tech;
          const active = (worker?.id === c.id);
          return (
            <button
              key={c.id}
              onClick={() => setWorkerId(c.id)}
              className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1.5 transition-colors ${
                active ? 'border-cyan-400 bg-cyan-900/30' : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <CharacterPortrait character={c} size={28} />
              <span className="text-left">
                <span className="block text-xs font-bold text-white">{c.name}</span>
                <span className="block text-[10px] text-gray-400">INT {c.stats?.INT ?? '?'} · Tech {tech}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-4 text-gray-100">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <Wrench className="text-cyan-400" size={22} /> ENGINEERING BAY
            </h1>
            <p className="text-xs text-gray-400">Design a suit. Research the tech. Build the thing. Three different jobs — assign the right people.</p>
          </div>
          <span className="font-mono text-sm text-emerald-400">${budget.toLocaleString()}</span>
        </div>

        {/* Active benches */}
        {projects.length > 0 && (
          <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 p-3">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Loader size={13} className="animate-spin" /> Active bench work
            </h2>
            <div className="space-y-2">
              {projects.map(p => {
                const pct = Math.round(((p.totalHours - p.hoursRemaining) / p.totalHours) * 100);
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-200">{p.label} <span className="text-gray-500">— {p.characterName}</span></span>
                      <span className="text-amber-300">{pct}% · ~{Math.ceil(p.hoursRemaining / 24)}d left</span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-800">
                      <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-700">
          {([
            { id: 'design', label: 'Design', icon: <PencilRuler size={14} /> },
            { id: 'research', label: 'Research', icon: <FlaskConical size={14} /> },
            { id: 'fabricate', label: 'Fabricate', icon: <Hammer size={14} /> },
          ] as { id: BayTab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-gray-800 text-cyan-300 border border-b-0 border-gray-700' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* DESIGN */}
        {tab === 'design' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SUIT_ARCHETYPES.map(a => {
                const locked = a.requiredResearch && !unlocked.includes(a.requiredResearch);
                const active = archetypeId === a.id;
                return (
                  <button
                    key={a.id}
                    disabled={!!locked}
                    onClick={() => setArchetypeId(a.id)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      locked ? 'border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed'
                        : active ? 'border-cyan-400 bg-cyan-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{a.icon} {a.name}</span>
                      {locked
                        ? <span className="flex items-center gap-1 text-[10px] text-red-400"><Lock size={10} /> {getResearchProject(a.requiredResearch!)?.name}</span>
                        : <span className="text-[10px] text-gray-400">~{Math.ceil(a.designHours / 24)}d design · ${a.materialCost.toLocaleString()} to build</span>}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{a.description}</p>
                    <p className="mt-1 text-[10px] font-mono text-gray-500">
                      DR {a.base.drPhysical}/{a.base.drEnergy} · SP {a.base.stoppingPower} · {a.base.weight}lb
                    </p>
                  </button>
                );
              })}
            </div>
            <input
              value={suitName}
              onChange={e => setSuitName(e.target.value)}
              placeholder="Name the suit (e.g. 'Nightshade Mk I')"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none"
            />
            <WorkerPicker hint="Pick the DESIGNER — INT + tech aptitude set blueprint quality" />
            {worker && (
              <p className="text-xs text-gray-400">
                Projected blueprint quality with {worker.name}: <span className="font-bold text-cyan-300">{designQuality(worker)}</span>/100
              </p>
            )}
            <button
              disabled={!worker}
              onClick={() => worker && startDesignProject(worker.id, archetypeId, suitName.trim())}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-40"
            >
              <PencilRuler size={14} className="mr-1 inline" /> Start Design
            </button>
          </div>
        )}

        {/* RESEARCH */}
        {tab === 'research' && (
          <div className="space-y-4">
            <WorkerPicker hint="Pick the RESEARCHER — INT drives research speed" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RESEARCH_PROJECTS.map(rp => {
                const done = unlocked.includes(rp.id);
                const blocked = rp.prerequisite && !unlocked.includes(rp.prerequisite);
                const inProgress = projects.some(p => p.researchId === rp.id);
                return (
                  <div key={rp.id} className={`rounded-lg border p-3 ${done ? 'border-emerald-700 bg-emerald-950/30' : blocked ? 'border-gray-800 bg-gray-900 opacity-60' : 'border-gray-700 bg-gray-800'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{rp.name}</span>
                      {done ? <Check size={14} className="text-emerald-400" />
                        : inProgress ? <Loader size={13} className="animate-spin text-amber-400" />
                        : blocked ? <span className="flex items-center gap-1 text-[10px] text-gray-500"><Lock size={10} /> {getResearchProject(rp.prerequisite!)?.name}</span>
                        : (
                          <button
                            disabled={!worker || budget < rp.cost}
                            onClick={() => worker && startResearchProject(worker.id, rp.id)}
                            className="rounded bg-cyan-700 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-cyan-600 disabled:opacity-40"
                          >
                            ${(rp.cost / 1000).toFixed(0)}k · ~{Math.ceil(rp.hours / 24)}d
                          </button>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{rp.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FABRICATE */}
        {tab === 'fabricate' && (
          <div className="space-y-4">
            <WorkerPicker hint="Pick the ENGINEER — the Engineering skill + lab crafting bonus set build speed" />
            {blueprints.filter(b => b.status !== 'drafting').length === 0 && (
              <p className="text-sm text-gray-500 italic">No finished blueprints yet — design one first.</p>
            )}
            <div className="space-y-2">
              {blueprints.filter(b => b.status !== 'drafting').map(bp => {
                const arch = SUIT_ARCHETYPES.find(a => a.id === bp.archetypeId);
                return (
                  <div key={bp.id} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-3">
                    <div>
                      <p className="text-sm font-bold text-white">{arch?.icon} {bp.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {arch?.name} · quality <span className="text-cyan-300 font-bold">{bp.quality}</span> · designed by {bp.designerName}
                      </p>
                    </div>
                    {bp.status === 'fabricated' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400"><Check size={13} /> BUILT — in armory</span>
                    ) : (
                      <button
                        disabled={!worker || budget < (arch?.materialCost || 0)}
                        onClick={() => worker && startFabrication(worker.id, bp.id)}
                        className="rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40"
                      >
                        <Hammer size={12} className="mr-1 inline" />
                        Build (${(arch?.materialCost || 0).toLocaleString()})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineeringBay;

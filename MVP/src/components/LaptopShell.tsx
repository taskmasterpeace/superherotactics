import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper, Users, Search, Building2, Heart, GraduationCap, ShoppingBag,
  Award, History, BookOpen, Globe2, Map, Power, Wifi, BatteryFull,
} from 'lucide-react';
import { useGameStore } from '../stores/enhancedGameStore';

/**
 * LaptopShell — the meta-game hub, framed like an actual laptop.
 *
 * The world map + combat are "the field" (rendered bare, outside this shell).
 * Every desk app (newspaper, characters, investigations, base, hospital, …)
 * mounts INSIDE this frame: a menu bar on top, a persistent dock on the bottom,
 * and a home screen of app tiles when nothing specific is open. Opening the
 * laptop pauses the world clock (GDD "when the player opens the laptop time is
 * paused"); returning to the field (Map / power) resumes it.
 */

export type LaptopView =
  | 'laptop' | 'news' | 'characters' | 'investigation' | 'base' | 'hospital'
  | 'training' | 'equipment-shop' | 'reputation' | 'chronos' | 'encyclopedia' | 'almanac';

interface AppDef {
  view: LaptopView;
  label: string;
  icon: React.ReactNode;
  blurb: string;
  accent: string; // tile icon tint
}

// Ordered desk apps. `laptop` (home) is implicit; Map is an exit affordance.
const APPS: AppDef[] = [
  { view: 'news', label: 'Newspaper', icon: <Newspaper className="w-full h-full" />, blurb: 'Your country & the world', accent: 'text-amber-400' },
  { view: 'characters', label: 'Operatives', icon: <Users className="w-full h-full" />, blurb: 'Roster, stats, loadouts', accent: 'text-cyan-400' },
  { view: 'investigation', label: 'Investigations', icon: <Search className="w-full h-full" />, blurb: 'Cases & leads', accent: 'text-emerald-400' },
  { view: 'base', label: 'Base', icon: <Building2 className="w-full h-full" />, blurb: 'Facilities & upgrades', accent: 'text-orange-400' },
  { view: 'hospital', label: 'Hospital', icon: <Heart className="w-full h-full" />, blurb: 'Recovery & cloning', accent: 'text-rose-400' },
  { view: 'training', label: 'Training', icon: <GraduationCap className="w-full h-full" />, blurb: 'Skills & martial arts', accent: 'text-sky-400' },
  { view: 'equipment-shop', label: 'Market', icon: <ShoppingBag className="w-full h-full" />, blurb: 'Buy & sell gear', accent: 'text-yellow-400' },
  { view: 'reputation', label: 'Standings', icon: <Award className="w-full h-full" />, blurb: 'Factions & bounties', accent: 'text-lime-400' },
  { view: 'chronos', label: 'Chronos', icon: <History className="w-full h-full" />, blurb: 'Timeline & rewind', accent: 'text-teal-400' },
  { view: 'encyclopedia', label: 'Encyclopedia', icon: <BookOpen className="w-full h-full" />, blurb: 'World reference', accent: 'text-indigo-300' },
  { view: 'almanac', label: 'Almanac', icon: <Globe2 className="w-full h-full" />, blurb: 'Nations & data', accent: 'text-green-400' },
];

// Dock = the most-used apps for quick switching (subset of APPS + Home + Map).
const DOCK_VIEWS: LaptopView[] = ['news', 'characters', 'investigation', 'base', 'hospital', 'reputation', 'chronos'];

const TITLES: Record<string, string> = {
  laptop: 'Home',
  ...Object.fromEntries(APPS.map(a => [a.view, a.label])),
};

interface LaptopShellProps {
  currentView: string;
  setCurrentView: (v: string) => void;
  children: React.ReactNode; // the active app's screen (null on home)
}

const LaptopShell: React.FC<LaptopShellProps> = ({ currentView, setCurrentView, children }) => {
  const gameTime = useGameStore(s => s.gameTime);
  const budget = useGameStore(s => s.budget);
  const selectedCountry = useGameStore(s => s.selectedCountry);

  // Opening the laptop pauses the world clock; leaving to the field resumes it.
  useEffect(() => {
    useGameStore.setState({ isTimePaused: true });
    return () => { useGameStore.setState({ isTimePaused: false }); };
  }, []);

  const isHome = currentView === 'laptop';
  const hour = Math.floor((gameTime?.minutes ?? 0) / 60);
  const clock = `Day ${gameTime?.day ?? 0} · ${String(hour).padStart(2, '0')}:00`;

  const exitToField = () => {
    useGameStore.setState({ isTimePaused: false });
    setCurrentView('world-map');
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black p-2 sm:p-4">
      {/* Laptop body */}
      <div className="flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-xl border-4 border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Menu bar */}
        <div className="flex items-center justify-between border-b-2 border-black bg-neutral-950 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-primary">
            <span className="text-sm">◈ SHT-OS</span>
            <span className="text-muted-foreground">/ {TITLES[currentView] ?? 'App'}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-muted-foreground">
            <span className="hidden sm:inline">{selectedCountry}</span>
            <span className="text-red-400">{clock}</span>
            <span className="text-green-400">${budget.toLocaleString()}</span>
            <Wifi className="w-3.5 h-3.5" />
            <BatteryFull className="w-3.5 h-3.5" />
            <button
              onClick={exitToField}
              title="Close laptop → back to the field"
              className="ml-1 flex items-center gap-1 rounded border border-red-900/60 bg-red-950/50 px-1.5 py-0.5 text-red-300 hover:bg-red-900 hover:text-white transition-colors"
            >
              <Power className="w-3 h-3" /> Close
            </button>
          </div>
        </div>

        {/* Screen area */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-background">
          {isHome ? (
            <HomeScreen setCurrentView={setCurrentView} exitToField={exitToField} clock={clock} />
          ) : (
            <div className="h-full w-full overflow-y-auto">{children}</div>
          )}
        </div>

        {/* Dock */}
        <div className="flex items-center justify-center gap-1 border-t-2 border-black bg-neutral-950/95 px-2 py-1.5">
          <DockButton
            label="Home" active={isHome} onClick={() => setCurrentView('laptop')}
            icon={<span className="text-base leading-none">◈</span>}
          />
          {DOCK_VIEWS.map(v => {
            const app = APPS.find(a => a.view === v)!;
            return (
              <DockButton
                key={v} label={app.label} active={currentView === v}
                onClick={() => setCurrentView(v)}
                icon={<span className={`block w-4 h-4 ${app.accent}`}>{app.icon}</span>}
              />
            );
          })}
          <DockButton
            label="Map" active={false} onClick={exitToField}
            icon={<Map className="w-4 h-4 text-primary" />}
          />
        </div>
      </div>
    </div>
  );
};

const DockButton: React.FC<{ label: string; active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    title={label}
    className={`group relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all duration-150 ${
      active
        ? 'border-primary bg-primary/20 -translate-y-0.5'
        : 'border-transparent bg-neutral-800/60 hover:bg-neutral-700 hover:-translate-y-0.5'
    }`}
  >
    {icon}
    <span className="pointer-events-none absolute -top-6 whitespace-nowrap rounded bg-black px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
      {label}
    </span>
  </button>
);

const HomeScreen: React.FC<{ setCurrentView: (v: string) => void; exitToField: () => void; clock: string }> = ({ setCurrentView, exitToField, clock }) => (
  <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-neutral-900 via-background to-neutral-900 p-6">
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations Terminal</h1>
          <p className="text-sm text-muted-foreground">{clock} · world clock paused while the laptop is open</p>
        </div>
        <button
          onClick={exitToField}
          className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground shadow-retro-sm hover:-translate-y-0.5 transition-transform"
        >
          <Map className="w-4 h-4" /> Go to World Map
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {APPS.map((app, i) => (
          <motion.button
            key={app.view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setCurrentView(app.view)}
            className="group flex flex-col items-start gap-2 rounded-xl border-2 border-black bg-surface p-4 text-left shadow-retro-sm hover:-translate-y-1 hover:shadow-retro transition-all duration-200"
          >
            <span className={`block h-8 w-8 ${app.accent}`}>{app.icon}</span>
            <span className="text-sm font-bold text-foreground">{app.label}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{app.blurb}</span>
          </motion.button>
        ))}
      </div>
    </div>
  </div>
);

export default LaptopShell;
export { APPS as LAPTOP_APPS };

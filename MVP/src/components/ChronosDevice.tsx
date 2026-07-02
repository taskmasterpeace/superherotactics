import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  History,
  Anchor,
  Pin,
  PinOff,
  Brain,
  AlertTriangle,
  Users,
  DollarSign,
  X,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGameStore } from '../stores/enhancedGameStore';
import { RetroPanel, RetroButton, RetroBadge } from './ui';
import {
  listSnapshots,
  rewind,
  createManualAnchor,
  togglePin,
  getTimeWalker,
  getDestinationCount,
  canRewind,
  CHRONO_TUNABLES,
  TimelineSnapshot,
} from '../data/chronoSystem';

const CAUSE_LABELS: Record<string, string> = {
  auto_daily: 'DAILY',
  auto_combat: 'PRE-COMBAT',
  auto_mission: 'MISSION',
  manual: 'ANCHOR',
  system: 'ORIGIN',
};

const ChronosDevice: React.FC = () => {
  const setCurrentView = useGameStore(s => s.setCurrentView);
  const gameTime = useGameStore(s => s.gameTime);
  const [confirmTarget, setConfirmTarget] = useState<TimelineSnapshot | null>(null);
  const [, forceRefresh] = useState(0);

  const walker = getTimeWalker();
  const snapshots = listSnapshots();
  const destinations = getDestinationCount();
  const gate = canRewind();
  const sanityPct = Math.round((walker.sanity / walker.sanityMax) * 100);
  const sanityColor =
    walker.sanity <= CHRONO_TUNABLES.MADNESS_FLOOR ? 'bg-destructive' :
    walker.sanity <= 40 ? 'bg-warning' : 'bg-success';

  const handleAnchor = () => {
    const snap = createManualAnchor(`Anchor — Day ${gameTime.day}, ${String(gameTime.hour).padStart(2, '0')}:00`);
    toast.success(`Timeline anchored: ${snap.label}`);
    forceRefresh(n => n + 1);
  };

  const handleRewind = (snap: TimelineSnapshot) => {
    const result = rewind(snap.snapshotId);
    setConfirmTarget(null);
    if (result.ok) {
      toast.success(
        `${walker.travelerName} pulled the timeline back to Day ${result.landedDay}. ` +
        `Sanity ${result.sanityAfter}/${walker.sanityMax} · ${result.destinationsAfter} destinations left.`,
        { duration: 6000 }
      );
      setCurrentView('world-map');
    } else {
      const reasons: Record<string, string> = {
        walker_mad: `${walker.travelerName} is lost in the timestream. Play forward to realign.`,
        unreachable_destination: 'The timeline no longer reaches that far back.',
        no_snapshot: 'That moment has been pruned from the timeline.',
        corrupt_snapshot: 'Temporal interference — that anchor is corrupted.',
      };
      toast.error(reasons[result.reason] || 'The jump failed.');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">CHRONOS</h1>
              <p className="text-xs text-muted-foreground">
                Temporal operations — {walker.travelerName}
                {walker.nationIso ? ` · ${walker.nationIso}` : ''}
              </p>
            </div>
          </div>
          <RetroButton variant="ghost" size="sm" onClick={() => setCurrentView('world-map')}>
            <X className="h-4 w-4" />
          </RetroButton>
        </div>

        {/* Walker status */}
        <RetroPanel title="TIME WALKER STATUS" icon={<Brain className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">SANITY</span>
                <span>{walker.sanity}/{walker.sanityMax}</span>
              </div>
              <div className="h-3 w-full border border-border bg-surface-light">
                <div
                  className={`h-full transition-all ${sanityColor}`}
                  style={{ width: `${sanityPct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Each rewind costs {CHRONO_TUNABLES.SANITY_COST_PAST_REWIND}. Below{' '}
                {CHRONO_TUNABLES.MADNESS_FLOOR} the walker goes mad.
              </p>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">DESTINATIONS</div>
              <div className="text-2xl font-bold">{destinations}</div>
              <p className="text-[10px] text-muted-foreground">
                Reachable anchors. Shrinks each jump; recovers as you play forward.
              </p>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">REALIGNMENT</div>
              <div className="text-2xl font-bold">
                {walker.cleanDayCounter}/{CHRONO_TUNABLES.REALIGN_DAYS_PER_REFUND}
                <span className="ml-1 text-xs font-normal text-muted-foreground">clean days</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                +{CHRONO_TUNABLES.REALIGN_SANITY_PER_REFUND} sanity, +1 destination per full cycle.
              </p>
            </div>
          </div>
          {walker.state === 'mad' && (
            <div className="mt-3 flex items-center gap-2 border border-destructive bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {walker.travelerName} is lost in the timestream. Rewinds are locked until sanity
              recovers above {CHRONO_TUNABLES.MADNESS_FLOOR}.
            </div>
          )}
        </RetroPanel>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {snapshots.length} anchors on the timeline · {snapshots.filter(s => s.reachable).length} reachable
          </p>
          <RetroButton variant="primary" size="sm" onClick={handleAnchor}>
            <Anchor className="mr-1 h-4 w-4" /> ANCHOR THIS MOMENT
          </RetroButton>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <AnimatePresence>
            {snapshots.length === 0 && (
              <RetroPanel>
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No anchors yet. The timeline records itself at dawn each day, before
                    combat, and whenever you anchor a moment manually.
                  </p>
                </div>
              </RetroPanel>
            )}
            {snapshots.map(snap => (
              <motion.div
                key={snap.snapshotId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <RetroPanel
                  className={snap.reachable ? '' : 'opacity-45'}
                  padding="sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <RetroBadge size="sm" variant={snap.cause === 'manual' ? 'primary' : 'default'}>
                          {CAUSE_LABELS[snap.cause] || snap.cause}
                        </RetroBadge>
                        <span className="truncate text-sm font-semibold">{snap.label}</span>
                        {snap.pinned && <Pin className="h-3 w-3 shrink-0 text-warning" />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Day {snap.gameDay}, {String(snap.gameHour).padStart(2, '0')}:00
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {snap.rosterSize} operatives · {snap.squadStatus}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> {snap.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <RetroButton
                        variant="ghost"
                        size="sm"
                        title={snap.pinned ? 'Unpin (may prune)' : 'Pin (never prunes)'}
                        onClick={() => { togglePin(snap.snapshotId); forceRefresh(n => n + 1); }}
                      >
                        {snap.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </RetroButton>
                      <RetroButton
                        variant="warning"
                        size="sm"
                        disabled={!snap.reachable || !gate.allowed}
                        title={!snap.reachable ? 'Beyond the destination horizon' : gate.reason}
                        onClick={() => setConfirmTarget(snap)}
                      >
                        <RotateCcw className="mr-1 h-4 w-4" /> REWIND
                      </RetroButton>
                    </div>
                  </div>
                </RetroPanel>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Confirm modal */}
        <AnimatePresence>
          {confirmTarget && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmTarget(null)}
            >
              <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
                <RetroPanel title="CONFIRM TEMPORAL JUMP" icon={<AlertTriangle className="h-4 w-4" />}>
                  <p className="text-sm">
                    {walker.travelerName} will pull the timeline back to{' '}
                    <span className="font-semibold">{confirmTarget.label}</span> (Day{' '}
                    {confirmTarget.gameDay}). Everything since will un-happen — only the
                    walker remembers.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <li>· Sanity: {walker.sanity} → {Math.max(0, walker.sanity - CHRONO_TUNABLES.SANITY_COST_PAST_REWIND)}</li>
                    <li>· Destinations after jump: {Math.max(CHRONO_TUNABLES.DESTINATION_FLOOR, destinations - 1)}</li>
                    <li>· Realignment counter resets to 0</li>
                  </ul>
                  <div className="mt-4 flex justify-end gap-2">
                    <RetroButton variant="ghost" size="sm" onClick={() => setConfirmTarget(null)}>
                      CANCEL
                    </RetroButton>
                    <RetroButton variant="warning" size="sm" onClick={() => handleRewind(confirmTarget)}>
                      <RotateCcw className="mr-1 h-4 w-4" /> JUMP
                    </RetroButton>
                  </div>
                </RetroPanel>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChronosDevice;

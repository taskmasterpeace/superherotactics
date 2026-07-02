import React, { useState, useRef, useCallback } from 'react';
import type { BubbleMode, BubbleEmotion, DialogueBubbleEvent } from './types';
import { BUBBLE_STYLES, resolveBubbleMode } from './BubbleStyleProfiles';
import { SpeechBubble } from './SpeechBubbleRenderer';
import { solvePlacement } from './PlacementSolver';

const MODES: BubbleMode[] = [
  'normal', 'whisper', 'yell', 'angry', 'thought', 'drunk', 'radio', 'announcement', 'negative', 'offscreen',
];
const EMOTIONS: (BubbleEmotion | 'none')[] = ['none', 'calm', 'afraid', 'angry', 'panic', 'drunk', 'sarcastic'];

const SAMPLE_LINES: Record<BubbleMode, string> = {
  normal: 'I hear movement behind that wall.',
  whisper: "Stay quiet. Two guards, ten meters out.",
  yell: "They're flanking us from the east!",
  angry: "Get down NOW or I swear—",
  thought: 'If I flank left, I can catch them in the open…',
  drunk: "I'm totally fine to drive the tank, boss.",
  radio: 'Contact! Enemy patrol north-east, over.',
  announcement: 'Objective secured. Extraction in 5.',
  negative: "We're surrounded. This is it.",
  offscreen: 'Sniper on the roof — I see him!',
};

const BG = {
  map: 'repeating-linear-gradient(45deg, #1f2937 0 12px, #263143 12px 24px)',
  light: '#e5e7eb',
  dark: '#0b0f16',
};

/**
 * /bubble-lab — the mandatory design/dev playground. Tune the whole engine
 * without launching the game: type text, pick a mode, drag the speaker to aim
 * the tail, replay animations, and see every mode side-by-side in the gallery.
 */
const BubbleLab: React.FC = () => {
  const [text, setText] = useState("They're flanking us from the east!");
  const [mode, setMode] = useState<BubbleMode>('yell');
  const [emotion, setEmotion] = useState<BubbleEmotion | 'none'>('none');
  const [maxWidth, setMaxWidth] = useState(260);
  const [bg, setBg] = useState<keyof typeof BG>('map');
  const [zoom, setZoom] = useState(1);
  const [replayKey, setReplayKey] = useState(0);
  const [speaker, setSpeaker] = useState({ x: 420, y: 420 });
  const [extraSpeakers, setExtraSpeakers] = useState<{ x: number; y: number; mode: BubbleMode; text: string }[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);

  const effectiveMode: BubbleMode = emotion === 'none'
    ? mode
    : resolveBubbleMode({ emotion, volume: 'normal' });

  const event: DialogueBubbleEvent = {
    speakerId: 'lab', text, mode: effectiveMode, emotion: emotion === 'none' ? undefined : emotion,
    worldX: 0, worldY: 0,
  };

  const stageClick = useCallback((e: React.MouseEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpeaker({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom });
    setReplayKey(k => k + 1);
  }, [zoom]);

  const viewport = { w: (stageRef.current?.clientWidth ?? 900) / zoom, h: (stageRef.current?.clientHeight ?? 600) / zoom };
  // Rough bubble size for placement (renderer refines exact geometry).
  const approxW = Math.min(maxWidth + 64, 360);
  const approxH = 120;
  const placement = solvePlacement({ anchor: speaker, bubbleW: approxW, bubbleH: approxH, viewport });

  const spawnGallerySpeaker = () => {
    setExtraSpeakers(prev => [
      ...prev,
      { x: 120 + prev.length * 60, y: 160 + (prev.length % 3) * 40, mode: MODES[prev.length % MODES.length], text: 'Barking line ' + (prev.length + 1) },
    ]);
  };

  return (
    <div className="h-full w-full overflow-hidden bg-neutral-900 text-neutral-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black bg-neutral-950 px-4 py-2">
        <div className="font-mono font-bold text-primary">💬 BUBBLE LAB — procedural speech-bubble engine</div>
        <div className="text-xs text-neutral-400">Click the stage to move the speaker · tail auto-aims</div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Controls */}
        <div className="w-72 shrink-0 overflow-y-auto border-r border-black bg-neutral-950/60 p-3 space-y-3 text-sm">
          <label className="block">
            <span className="text-xs font-bold text-neutral-400">TEXT</span>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); }}
              rows={3}
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-neutral-400">MODE</span>
            <select
              value={mode}
              onChange={e => { setMode(e.target.value as BubbleMode); setText(SAMPLE_LINES[e.target.value as BubbleMode]); setReplayKey(k => k + 1); }}
              disabled={emotion !== 'none'}
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 p-1.5 text-white disabled:opacity-40"
            >
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-neutral-400">EMOTION (overrides mode)</span>
            <select
              value={emotion}
              onChange={e => { setEmotion(e.target.value as any); setReplayKey(k => k + 1); }}
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 p-1.5 text-white"
            >
              {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
            <span className="mt-1 block text-[10px] text-neutral-500">resolves to: <b className="text-primary">{effectiveMode}</b></span>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-neutral-400">MAX TEXT WIDTH: {maxWidth}px</span>
            <input type="range" min={120} max={360} value={maxWidth}
              onChange={e => setMaxWidth(Number(e.target.value))} className="mt-1 w-full" />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-neutral-400">CAMERA ZOOM: {zoom.toFixed(2)}x</span>
            <input type="range" min={0.6} max={2} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))} className="mt-1 w-full" />
          </label>

          <div>
            <span className="text-xs font-bold text-neutral-400">BACKGROUND</span>
            <div className="mt-1 flex gap-1">
              {(['map', 'light', 'dark'] as const).map(b => (
                <button key={b} onClick={() => setBg(b)}
                  className={`flex-1 rounded border px-2 py-1 text-xs ${bg === b ? 'border-primary bg-primary/20 text-primary' : 'border-neutral-700 bg-neutral-800 text-neutral-300'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setReplayKey(k => k + 1)}
              className="flex-1 rounded bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90">
              ▶ Replay
            </button>
            <button onClick={spawnGallerySpeaker}
              className="flex-1 rounded bg-neutral-700 px-2 py-1.5 text-xs font-bold text-white hover:bg-neutral-600">
              + Add bubble
            </button>
          </div>
          {extraSpeakers.length > 0 && (
            <button onClick={() => setExtraSpeakers([])}
              className="w-full rounded bg-red-900/60 px-2 py-1 text-xs text-red-200 hover:bg-red-900">
              Clear extra bubbles ({extraSpeakers.length})
            </button>
          )}

          <div className="border-t border-neutral-800 pt-2 text-[10px] text-neutral-500 leading-relaxed">
            Style is data ({Object.keys(BUBBLE_STYLES).length} modes). Shapes are procedural SVG paths.
            Text is measured &amp; wrapped, bubble grows to fit, tail aims at the speaker.
          </div>
        </div>

        {/* Stage */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            ref={stageRef}
            onClick={stageClick}
            className="relative flex-1 min-h-0 cursor-crosshair overflow-hidden"
            style={{ background: BG[bg] }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'absolute', inset: 0 }}>
              {/* Speaker marker */}
              <div style={{ position: 'absolute', left: speaker.x - 8, top: speaker.y - 8 }}
                className="h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow" />
              <div style={{ position: 'absolute', left: speaker.x - 20, top: speaker.y + 10 }}
                className="whitespace-nowrap text-[10px] font-bold text-white/70">speaker</div>

              {/* Main interactive bubble */}
              <SpeechBubble key={replayKey}
                event={{ ...event, text }}
                bubbleCenter={placement.center}
                anchor={speaker}
              />

              {/* Extra bubbles (stacking test) */}
              {extraSpeakers.map((s, i) => {
                const p = solvePlacement({ anchor: s, bubbleW: 220, bubbleH: 90, viewport });
                return (
                  <React.Fragment key={i}>
                    <div style={{ position: 'absolute', left: s.x - 5, top: s.y - 5 }}
                      className="h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />
                    <SpeechBubble event={{ speakerId: 'extra' + i, text: s.text, mode: s.mode, worldX: 0, worldY: 0 }}
                      bubbleCenter={p.center} anchor={s} animate={false} />
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Gallery: every mode at a glance */}
          <div className="h-44 shrink-0 overflow-x-auto border-t border-black bg-neutral-950 p-2">
            <div className="flex gap-2 h-full">
              {MODES.map(m => (
                <div key={m} className="relative flex h-full min-w-[180px] flex-col items-center justify-center rounded border border-neutral-800 bg-neutral-800/40"
                  style={{ background: BG.map }}>
                  <div className="absolute left-1 top-1 text-[9px] font-bold uppercase text-white/70">{m}</div>
                  <SpeechBubble
                    event={{ speakerId: 'g_' + m, text: SAMPLE_LINES[m], mode: m, worldX: 0, worldY: 0 }}
                    bubbleCenter={{ x: 90, y: 78 }}
                    anchor={{ x: 90, y: 150 }}
                    animate={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BubbleLab;

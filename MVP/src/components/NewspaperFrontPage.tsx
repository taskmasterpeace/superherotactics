import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import type { NewspaperEdition, EditionStory } from '../data/newspaperEngine';

/**
 * NEWSPAPER FRONT PAGE — renders a daily edition like actual print: serif
 * masthead, dateline rule, a lead story spanning columns, section blocks
 * (NATIONAL / LSW DESK / WORLD / BUSINESS), censorship stamps under
 * propaganda regimes, and a back-issue shelf.
 *
 * Stories that came from real game events link into the article reader via
 * onOpenArticle; ambient stories expand inline.
 */

const SECTION_LABEL: Record<string, string> = {
  politics: 'POLITICS', crime: 'CRIME', superhuman: 'LSW DESK',
  economy: 'BUSINESS', world: 'WORLD', local: 'NATIONAL',
};

const Story: React.FC<{
  story: EditionStory;
  lead?: boolean;
  onOpenArticle?: (articleId: string) => void;
}> = ({ story, lead, onOpenArticle }) => {
  const [open, setOpen] = useState(false);
  const clickable = !!story.articleId || !!story.body || !!story.summary;

  return (
    <div
      className={`${lead ? '' : 'border-t border-neutral-400/60 pt-2'} ${clickable ? 'cursor-pointer group' : ''} ${story.isCensored ? 'opacity-80' : ''}`}
      onClick={() => {
        if (story.articleId && onOpenArticle) onOpenArticle(story.articleId);
        else setOpen(o => !o);
      }}
    >
      <div className="flex items-start gap-2">
        {story.isBreaking && !story.isCensored && (
          <span className="mt-0.5 shrink-0 bg-red-700 text-white text-[9px] font-bold px-1 py-px tracking-wider">BREAKING</span>
        )}
        {story.isPlayerRelated && (
          <span className="mt-0.5 shrink-0 bg-neutral-900 text-amber-300 text-[9px] font-bold px-1 py-px tracking-wider" title="This story came from your operations">EXCLUSIVE</span>
        )}
        <h3
          className={`font-serif font-bold leading-snug text-neutral-900 group-hover:underline ${
            lead ? 'text-2xl md:text-3xl' : 'text-base'
          } ${story.isCensored ? 'text-red-900 tracking-widest' : ''}`}
        >
          {story.headline}
        </h3>
      </div>
      {(lead || open) && (
        <p className={`mt-1 font-serif text-neutral-700 ${lead ? 'text-sm' : 'text-xs'}`}>
          {story.summary}
        </p>
      )}
      <div className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-wider text-neutral-500">
        <span>{SECTION_LABEL[story.category] || story.category}</span>
        {story.sourceNote && <span>· {story.sourceNote}</span>}
        {story.articleId && <span className="text-blue-800 group-hover:underline">· full story →</span>}
      </div>
    </div>
  );
};

const SectionBlock: React.FC<{
  title: string;
  stories: EditionStory[];
  onOpenArticle?: (id: string) => void;
}> = ({ title, stories, onOpenArticle }) => {
  if (!stories.length) return null;
  return (
    <div>
      <div className="border-y-2 border-neutral-900 py-0.5 mb-2">
        <h2 className="font-serif font-black text-neutral-900 text-sm tracking-[0.2em]">{title}</h2>
      </div>
      <div className="space-y-2">
        {stories.map(s => <Story key={s.id} story={s} onOpenArticle={onOpenArticle} />)}
      </div>
    </div>
  );
};

export const NewspaperFrontPage: React.FC<{ onOpenArticle?: (articleId: string) => void }> = ({ onOpenArticle }) => {
  const editions = useGameStore(s => s.editions);
  const generateTodaysEdition = useGameStore(s => s.generateTodaysEdition);
  const gameDay = useGameStore(s => s.gameTime?.day ?? 1);
  const [issueDay, setIssueDay] = useState<number | null>(null); // null = latest

  // Ensure today's paper exists the first time the stand is visited
  useEffect(() => {
    if (!editions.some(e => e.day === gameDay)) {
      generateTodaysEdition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameDay]);

  const edition: NewspaperEdition | undefined = useMemo(() => {
    if (issueDay != null) return editions.find(e => e.day === issueDay);
    return editions[0];
  }, [editions, issueDay]);

  if (!edition) {
    return (
      <div className="p-8 text-center text-neutral-400">
        The presses are warming up… (no edition yet — advance time)
      </div>
    );
  }

  const [leadStory, ...restFront] = edition.frontPage;

  return (
    <div className="mx-auto max-w-5xl bg-[#f4efe4] text-neutral-900 shadow-2xl border border-neutral-400 my-4">
      {/* Masthead */}
      <div className="px-6 pt-5 pb-2 text-center border-b-4 border-double border-neutral-900">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-600">
          <span>{edition.motto}</span>
          <span>Press freedom: {edition.pressFreedom}/100 · {edition.quality}</span>
        </div>
        <h1 className="font-serif font-black text-4xl md:text-5xl tracking-tight mt-1">{edition.masthead}</h1>
        <div className="mt-1 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest text-neutral-700 border-t border-neutral-400 pt-1">
          <span>{edition.dateline}</span>
          <span>· Single copy: 2 credits ·</span>
          {/* Back-issue shelf */}
          <select
            className="bg-transparent border border-neutral-400 rounded px-1 text-[11px]"
            value={issueDay ?? edition.day}
            onChange={e => setIssueDay(Number(e.target.value))}
            onClick={e => e.stopPropagation()}
          >
            {editions.map(e => (
              <option key={e.id} value={e.day}>Day {e.day} issue</option>
            ))}
          </select>
        </div>
        {edition.censorshipNote && (
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-800">
            ⚠ {edition.censorshipNote}
          </div>
        )}
      </div>

      {/* Front page */}
      <div className="px-6 py-4">
        {leadStory && <Story story={leadStory} lead onOpenArticle={onOpenArticle} />}
        {restFront.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-t-2 border-neutral-900 pt-3">
            {restFront.map(s => <Story key={s.id} story={s} onOpenArticle={onOpenArticle} />)}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <SectionBlock title="NATIONAL" stories={edition.national} onOpenArticle={onOpenArticle} />
        <SectionBlock title="LSW DESK" stories={edition.lswDesk} onOpenArticle={onOpenArticle} />
        <SectionBlock title="WORLD" stories={edition.world} onOpenArticle={onOpenArticle} />
        <SectionBlock title="BUSINESS" stories={edition.business} onOpenArticle={onOpenArticle} />
      </div>

      {/* Colophon */}
      <div className="border-t border-neutral-400 px-6 py-2 text-center text-[9px] uppercase tracking-widest text-neutral-500">
        {edition.masthead} · printed at dawn, day {edition.day} · {edition.countryName}
      </div>
    </div>
  );
};

export default NewspaperFrontPage;

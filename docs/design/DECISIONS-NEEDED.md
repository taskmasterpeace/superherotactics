# SHT — Decisions Needed (Owner Forks)

> These are the **only** choices the source data couldn't settle — genuine product/tone/scope calls. Everything else is being specced from your data automatically. Each has a **→ Rec** (my recommendation) and, where the spec already picked something to keep moving, the **current default**.
> **How to use:** skim, then just tell me your answers in batches (e.g. "P1 keep 20, P2 hidden, …"). Anything you don't answer keeps the noted default.
>
> **Status:** this is a LIVING list. It currently holds forks from the 12 systems specced in run 1. The 29 core systems (combat/spine/management) are being written now in run `w1bh5y4ds` and will add more forks here when they finish.

---

## ✅ ANSWERED (locked by owner)
- **P1 → keep 20 types**; ids 17–20 are 4 SHT-native *extended* types, non-human/construct-leaning (owner: "robot and stuff"). Names TBD (draft for approval).
- **P2 → HIDE** stats/personality at recruit; revealed as you play (JA2 "learn the merc").
- **P3 → friction is EVENT-TRIGGERED, not automatic.** Personalities only set *susceptibility*; a NEMESIS/refuse-to-deploy state requires a triggered relationship occurrence (shared trauma, betrayal, rivalry). Once triggered it can escalate to refuse-to-deploy.
- **P5 → GRIEF**, routed through the injury system **+ a new MENTAL-HEALTH / DEPRESSION subsystem** (owner directive: build it — depression, mental status, etc.).
- **P6 → idle characters AUTO-take activities (can surprise you), personality-gated**; they actively "do stuff" when in towns/cities.
- **O1 → TIGHT budgets with a WIDE inter-faction spread** (US notably higher than others). Exact numbers: economy spec to set within that rule.
- **O2 → FULL SANDBOX, always.** Any faction / any country from the start, every time. No canon lock.
- **T1 → USA & ANY country playable in single-player, any time.** **NEW DIRECTIVE:** every country needs its OWN **named organization + its own politics** (not just the 4 named factions). → add a *Per-Country Organizations & Politics* generator; run agents to name + politically define all ~168.
- **E1 → PURE DETERMINISTIC difficulty.** No rubber-banding / auto-adjust; challenge fixed by tier + world state. Max competitive integrity (hardcore).
- **E5 → REWIND RESETS CLEANLY.** Time-travel-back is a clean do-over; cost is only sanity + fewer destinations (the world does NOT escalate on rewind).
- **H4 → Time Walker comes back CHANGED** (future-jump twist: cyborg arm, cryptic warnings, possible teammate duplicate).
- **I1 → CLONEABLE where facilities allow**, self-limited by cost + generational degradation.
- **K4 → INTEL-GATED foresight** — consequence visibility before a choice scales with investigation/INT.
- **L1 → FIGHT or FUTURE-JUMP only** — no diplomatic avert; the armada is an immovable wall.
- **I3 → HARSH clone memory** — a clone without memory transfer loses trained skills too (must retrain); body ≠ person.
- **J2 → flipped criminals are ON-PROBATION** (supervised, betrayal risk) — capture-and-flip is a gamble.
- **J3 → LEAN INTO darker interrogation** — coercion is a blunt mechanic, mature rating, no ethical toggle.
- **L3 → PLAYABLE DOOMED LAST STAND** at Day 2472 if under-prepared (go down swinging).
- **TONE LOCK:** hardcore · dark/mature · JA2-heroic · competitive-integrity. Apply this lens to all specs.
- **All OTHER forks (groups C–L not listed above) → keep the → Rec default** for now; owner can override any. Reconciliation pass will apply the locked answers above to the already-written specs (personality, hospital-cloning, prisoners, ai-director, fork-in-the-road, endgame) so they match.
- **NEW SYSTEMS to spec (from owner answers):** (1) Mental-Health / Depression subsystem; (2) Per-Country Organizations & Politics generator.
- *Deferred (data/numbers, not blocking):* P4 (relations-code legend — confirm later), O6 (base prices — set later).

---

## A. Personality & Relationships
- **P1. Personality count/labels.** The combat table has **20** slots but the source only names 16 temperaments (ids 17–20 unnamed). Keep 20 (author 4 extended types), collapse to 16, or author 20 bespoke SHT names? **→ Rec: keep 20**, author 4 SHT-native extended types (no MBTI dependency).
- **P2. Stat/personality visibility.** Show STAM + personality at recruit time, hide until played (JA2 "you learn the merc"), or only infer from behavior? **→ Rec: partially hidden** — show archetype, hide exact ratings until you've run missions with them (the JA2 feel).
- **P3. Relationship friction severity.** Are NEMESIS pairs flavor/morale only, or hard mechanics (refuse to deploy together, −CS, desertion)? **→ Rec: hard but escapable** — morale hit always; refuse-to-deploy + desertion only at extreme friction.
- **P4. `countryrelationships.csv` legend (codes 1–6).** The file ships bare integers; spec reverse-engineered 1=war … 6=special bloc. Confirm meaning — especially **what code 6 is** (special bloc / embargo / vassal?). **→ Needs your confirmation (data question).**
- **P5. Bonded-partner death payoff.** How hard does a BONDED partner's death hit the survivor — grief −CS, berserk risk, or leave-the-team risk? **→ Rec: temporary grief −CS + small berserk/leave risk scaled by bond strength.**
- **P6. Idle directiveness.** Do idle characters auto-take activities (sim-like, can surprise you) or only **suggest via the phone** and wait? **→ Rec: suggest-and-confirm by default**; high-autonomy personalities may auto-act (and tell you after). Fits "a living world that talks to you."

## B. New-Game / Onboarding
- **O1. Starting budget size.** Tight JA2 economy (US 15K … NG 7.5K) or smoother ramp (US 75K … NG 35K)? Data supports either. **→ Rec: tight (15K…7.5K)** for JA2 tension; tune up if playtests feel punishing.
- **O2. Canon-lock vs free faction.** First-time default hard-locks US/FIST in the USA (with the other 3 + 168 countries as explicit Sandbox), or all four factions equal from the title? **→ Rec: canon-lock US/FIST for first play, Sandbox unlock after** — teaches the story, then opens up.
- **O3. Difficulty surface at onboarding.** Expose permadeath / rewind-budget / economy / scaling toggles up front, or behind an Advanced wall? **→ Rec: Advanced wall** — clean first impression; sensible defaults visible.
- **O4. Tutorial coupling.** Is the first boot email a forced tutorial mission, an optional skip, or absent? **→ Rec: optional-skip scripted intro** (Player_Scaling implies a tutorial unlock exists).
- **O5. Quickstart roster.** Auto-fill with thematic faction-canon characters or random faction-appropriate rolls? **→ Rec: canon characters** so new players meet the hand-authored personalities immediately.
- **O6. Base-type prices.** Not in source tables — must be set, only constrained so the cheapest base is affordable on the smallest budget (NG 7.5K). **→ Needs your numbers (or "you pick, keep it affordable").**

## C. Tutorial / First Hour
- **T1. USA selectable in single-player?** GDD reserves the USA as the non-selectable MP "target." Does that apply to SP too? If yes, US faction starts in Canada/UK. **→ Rec: USA selectable in SP**, reserved only in MP (FIST is literally US-based). *(Current default: selectable in SP.)*
- **T2. Skip-tutorial vs gameplay tips.** Does "Skip Tutorial" also suppress later first-time tips (flight, wrestling, save-is-time-travel), or are tips a separate toggle? **→ Rec: separate toggle, tips on by default.**
- **T3. Tactical combat on mobile at all?** Source marks combat Desktop-primary. Is mobile combat in scope? **→ Rec: desktop-only tactical for v1**; phone/world-map/laptop are the mobile experience.
- **T4. Intro VO vs text.** Voiced intro beats or text-only for v1? **→ Rec: text-only v1** (matches your "voice parked" call).
- **T5. Hand-holding posture.** Strict rails (safer for JA2-newcomers) vs soft guide (dismissible hints, respects veterans)? **→ Rec: soft guide** — only the 4 verb-teaching beats block; rest dismissible.

## D. Audio / Voice
- **D1. Voiced VO scope at ship.** (a) VO for named cast + text generics, (b) text-only at ship + VO post-launch, (c) full VO? **→ Rec: (b) text-only at ship** (you parked voice); engine reserves the hook.
- **D2. Run-time TTS for un-voiced lines?** Cheap universal talk vs off-brand/robotic risk + dependency. **→ Rec: no TTS at ship**; revisit with ElevenLabs later.
- **D3. Barks audible to enemies (stealth)?** Always-on (hardcore JA2), Easy-mode toggle, or off? **→ Rec: on, with an accessibility/Easy toggle.**
- **D4. Per-faction accent/language reach.** Full localized casts vs English-with-accent vs universal? **→ Rec: English-with-accent beds** (US/NG/CN/IN), defer full localization.
- **D5. Music/score ownership.** In the Audio Director, a separate system, or out of design scope now? **→ Rec: separate system, reserve a `music` slot now.**

## E. AI Director / Difficulty
- **E1. Difficulty philosophy.** Disclosed bounded ±2 auto-adjust, pure deterministic tier-cap (max competitive integrity), or classic Story/Normal/Brutal? **→ Rec: Story/Normal/Brutal wrapper that sets the bias range** — best of both; Normal = the disclosed ±2.
- **E2. Heat/Pressure visibility.** Numeric world-map overlay, diegetic-only (news/email intensity), or a "forecast" metaphor? **→ Rec: forecast metaphor** + optional numeric overlay in Advanced.
- **E3. Deliberate too-hard fights?** Should the Director ever route you into a "you're not ready" beat? **→ Rec: no** — it foreshadows and suggests tiering up. *(Spec default: no.)*
- **E4. Relief pacing.** Tune breathing room after a spike (JA2 grind vs CK air). **→ Rec: needs playtest; keep current 2/3/4-day values as placeholder.**
- **E5. ⭐ Rewind vs Heat (big tonal lever).** On rewind, does pressure reset (escaped threat returns identically) or **ESCALATE** (the timeline "remembers," pushing harder — save-scumming becomes dangerous)? **→ Rec: ESCALATE** — fits the diegetic-only, sanity-cost save fantasy you chose.
- **E6. Per-nation vs shared MP Director.** Keep one Director per nation (MP-ready), or design a shared-world Director now for the MP dimension? **→ Rec: per-nation now** (matches MP-stub).

## F. Accessibility / Settings
- **F1. Dyslexia/legible fonts** bundled, runtime-fetched, or generic system font only? **→ Rec: bundle Atkinson Hyperlegible** (open license, small).
- **F2. "No-fail timing" reach.** Grace-mode that pauses real-time deadline alerts — floor for everyone, opt-in, or off for hardcore? **→ Rec: accessibility opt-in, off by default.**
- **F3. Speaker/LOUD-COMIC bubble** purely cosmetic, or does it interact with the dB stealth model? **→ Rec: cosmetic** (keep it in settings, no mechanics).
- **F4. Phone "cheat-code" numbers** — surface an onboarding cheat-sheet or keep diegetic discovery? **→ Rec: diegetic discovery**, optional accessibility reveal.
- **F5. MP timing-assist policy** — do auto-pause/grace settings carry into shared MP sessions later? **→ Rec: reserve the stance: MP imposes a common pace** (decide fully at MP time).

## G. Modding / Data Pipeline
- **G1. Source-of-truth workflow.** Authors edit Google Sheets → export CSVs, or edit repo CSVs directly (sheet as view)? **→ Rec: repo CSVs are authoritative**, sheets are a view/import.
- **G2. Auto-balance unattended writes?** Allow in nightly/dev (flagged, never in release) or always human-gated? **→ Rec: always human-gated** (auto-suggest, human commits).
- **G3. Mod support tier.** Public modding SDK, tolerate (load-if-valid), or locked? **→ Rec: tolerate now, publish schemas later.**
- **G4. Export-format scope for MVP.** JSON/CSV only, or invest in PDF/Excel/HTML balance reports? **→ Rec: JSON/CSV only for MVP.**
- **G5. Balance philosophy targets.** Keep the "chess depth / every build viable" win-rate bands (50/70/85/95/99), or a more power-fantasy feel (lopsided high-tier blowouts)? **→ Rec: keep competitive bands**, with high-tier power-fantasy as an explicit difficulty/sandbox option.

## H. Multiplayer-Dimension Stub
- **H1. Reserved (non-claimable) nations.** Only the USA, or others too (by GDP/military/hand-picked)? **→ Rec: USA only for now** *(current default)*; revisit at MP design.
- **H2. Catch-up generosity** beyond the +50% mentoring (resource/info sharing numbers undefined). **→ Rec: capability flags only now**, tune at MP time.
- **H3. Seeding granularity** for new-player separation — faction-set (4 regions), continent, or finer? **→ Rec: faction-set** *(current default)*.
- **H4. ⭐ Time-Chain bad return?** Does sending the Time Walker risk the "comes back changed / cyborg arm / don't-trust-the-hammer-man" twist, or pure +1-power upside? **→ Rec: risk the twist** — it's the most memorable bit of your GDD.
- **H5. Networking vendor (deferred).** Epic Online Services, Steamworks, or socket.io? **→ Rec: leave open** (interface is vendor-agnostic); pick at MP build.

## I. Hospital / Death / Cloning
- **I1. Permadeath hardness.** Cloneable anywhere with a facility, or rare/precious (home Medical Center only / once per character)? **→ Rec: cloneable where facilities allow, self-limited by generational degradation + cost.**
- **I2. Clone enemy LSWs too?** (advanced band hints "clone army possible") or player roster only? **→ Rec: player roster only now**; enemy clone-armies a later world-sim feature.
- **I3. Memory-loss clone severity** (when no memory transfer) — lose trained skills (harsh) or only relationships/history (softer)? **→ Rec: lose relationships + Memory_Loss_II, keep trained stats.**
- **I4. Cloning in a Banned-cloning country** = moral/legal/reputation event? **→ Rec: yes**, scaled by the country's LSWRegulations.
- **I5. Time-Walker vs cloning.** Does the diegetic save bypass cloning (free un-kill) or coexist? **→ Rec: coexist** — Time-Walker = rare "undo the timeline," cloning = routine "buy one back."
- **I6. Real-time death pressure** given 1:30 (a 30-day clone wait ≈ 1 real day) — keep 1:30 or slow during medical crises? **→ Rec: base 1:30; optional 1:15 only while a player merc is actively Dying.**

## J. Prisoners / Capture / Interrogation
- **J1. Personality→surrender mapping** — which of the 20 types surrender vs fight to the death (tone, not a number). **→ Needs your tone call** (I can draft a mapping for approval).
- **J2. Flipped-criminal trust.** Turned super-criminals = full roster or permanently on-probation (betrayal risk)? **→ Rec: on-probation** — capture-and-flip as a risky play, not a free upgrade.
- **J3. Torture-as-mechanic tone/rating.** How explicit/punished is coercive interrogation; is there an "ethical mode" that disables it? **→ Rec: implied not graphic; ethical-mode toggle; coercion carries reputation/legal cost.**
- **J4. Capture cosmic/divine beings?** Can you ever cage a Threat-5, and what unlocks it? **→ Rec: only via late black-site research** — keeps the finale special.
- **J5. Reciprocity — can enemies capture YOUR heroes?** (rescue/ransom/rewind). **→ Rec: yes** — ties into the time-travel save tension; high-stakes.
- **J6. Execution + high-cloning country** — does an executed prisoner resurrect? **→ Rec: tie to I2** — enemies don't auto-clone now.

## K. Fork-in-the-Road (Decision Event UI)
- **K1. Interrupt threshold.** Do all high-priority forks force a pause-the-clock modal, or only critical ones? **→ Rec: only critical/combat interrupt; high = inbox + toast** *(current default)*.
- **K2. Rewind cost per fork class.** Does reversing a major fork (faction betrayal) cost more sanity than a combat-loss rewind; are "irreversible-ripple" forks un-rewindable? **→ Rec: yes, tiered cost; some forks un-rewindable** — makes choices weigh.
- **K3. Legal/financial severity curve.** Punishing (years-long debt, JA2-harsh) or recoverable? **→ Rec: harsh-but-recoverable** (ties to O1 economy).
- **K4. Consequence visibility before choosing.** Full predicted deltas (transparent), flavor-only (mysterious), or intel-stat-gated foresight? **→ Rec: intel-gated foresight** — makes investigation/INT valuable and is the most distinctive option.
- **K5. Delayed/queued replies?** Can you queue "send in 3 days," or immediate-only? **→ Rec: allow queue** — fits the email-as-dialogue, real-time-with-pause feel.
- **K6. MP coupling.** Reserve hooks for cross-dimension fork sharing later? **→ Rec: reserve hooks, don't build.**

## L. Alien-Invasion Endgame
- **L1. Diplomatic win path?** Can you avert the invasion via UN summit / first-contact (reason with the Greys), or is the armada an immovable wall (fight or future-jump only)? **→ Rec: enable a hard-to-reach diplomatic path** — payoff for a politics-heavy playstyle. *(Spec default: OFF until you decide.)*
- **L2. Future-jump one-shot or repeatable** (with escalating madness)? **→ Rec: one-shot per campaign** *(default)* — keeps it climactic.
- **L3. Hard fail at Day 2472, or a playable doomed last-stand** that loses anyway? **→ Rec: playable doomed finale** (more JA2/heroic).
- **L4. Countdown scales with difficulty** (Easy stretches, Hard compresses) or fixed 2,472 canon? **→ Rec: fixed 2,472**; express difficulty via readiness thresholds + threat caps instead.
- **L5. Off-world finale** (defend Earth OR strike the mothership — different risk/reward) or cosmetic alt-environment? **→ Rec: meaningful strategic choice** if budget allows; cosmetic fallback.

## M. Investigations (doc 09)
- **M1. Resource_Cost $ scale.** Method cost tiers default to Low $5k / Medium $20k / High $75k / Very High $200k (anchored to research economics + Player_Scaling street-tier funding; ties to onboarding O1). Keep tight JA2 feel or smoother ramp? **→ Rec: keep as-is, expose as CSV-tunable `Method_Cost_Tiers`.** *(Spec default: the 4 numbers above.)*
- **M2. Personality-driven auto-method.** Does the assigned investigator's personality auto-*suggest* (or auto-pick for high-autonomy types) a method? **→ Rec: suggest-only, never auto-commit** (matches P6). *(Default: suggest-only.)*
- **M3. Psychic/force interrogation reputation cost.** Ethically-flagged methods (Psychic Persuasion/Blast, force interrogation) cost −5 `heroic` reputation. Right tone, or cost-free in a grim setting? **→ Rec: keep the small heroic cost.** *(Default: −5 heroic.)*
- **M4. Authored investigation breadth at ship.** Ship the 25 authored templates only, or let the Event Engine (doc 02) spawn additional parameterized investigations? **→ Rec: 25 authored as spine; doc 02 spawns variants only for `Any`-type/world-state cases.**
- **M5. Time-Anomaly ↔ save-economy coupling.** How much does resolving INV_022 restore Time-Walker sanity/destinations? **→ Rec: small capped sanity refund with diminishing returns; exact numbers deferred to save-system spec (doc 11/108).**

---

*More decisions will be appended here as the 29 core systems finish speccing.*

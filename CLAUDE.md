# Cassie's Gym Coach

A personal, phone-first workout coach for machine training at Lifetime (Plymouth, MN). It's one self-contained HTML file (`index.html`) with vanilla JS and no build step. It was first built as a claude.ai artifact and moved here to keep developing.

## Who it's for and how it's used
- Cassie: goals are strength, health and longevity. No injuries. She uses machines only, plus core work on the mat with dumbbells. She dislikes calf machines and ab machines. There's no hip thrust machine at her gym, so the glute kickback machine is used instead.
- Three gym visits a week, run as a 6-week program (see The program). She opens the app and it tells her today's focus; she can override it.
- She checks in with energy (1–5) and time (10/20/30/40 min, and the treadmill walk counts toward that time), then works through the plan set by set on her phone.

## Design
- Muted and sophisticated. Mostly cream with thin black lines, plus a muted fall palette used per section. Gold is reserved for things she earns.
- Fonts: Fraunces for headings and italics, Figtree for body text. Google Fonts, with fallback stacks.
- All color tokens are on `:root`, with dark-mode overrides. Style through tokens, never literal colors.
- Tone of copy: short, warm, understated. No exclamation points, no confetti. Avoid anything that feels adolescent. She doesn't want points for doing the basics.

## Architecture (all inside the one `<script>`)
- `LIB`: exercise library (machines, dumbbell core, bodyweight core). `ORDER`: rotation per day type (`lower`, `upper`, `light`, `core`). `ENERGY`: how energy changes weight, sets and rest.
- **The program** (`BLOCK`, `WEEK_DAYS`, `slotInfo`): 6-week blocks of Foundation (10–12) ×2, Build (8–10) ×2 (week 4 adds a 4th set on main lifts), Strength (6–8 main, 8–10 others), Deload (2 sets at ~80%). Three sessions per training week: lower, upper, recovery. Main lifts are `ORDER[type].fixed`.
- It's a sequence, not a calendar. Programmed sessions store `s.slot`; `programState()` finds the first open slot in the current training week, so a missed day just waits.
- `coachToday()` decides today: the next slot, or, if she picks another focus, a **swap** (another open slot this week; light counts as the recovery slot when that's next) or a **bonus** day (`s.bonus`, no slot; the program stays put). It also eases 10% after a 10+ day gap and 5% when the same muscles were trained yesterday.
- `repRange()` gives each exercise its phase range; `prescribe()` converts working weight through Epley e1RM when the range changes. Sessions store `ex.range` so `evaluate()` replays with the right range. Deload sessions (`s.deload`) don't move the numbers.
- UI: `focusCard()` ("Your focus for today" / "Next up" / "Your pick today" + coach's adjustment) at the top of Today; `programView()` on My plan.
- `buildPlan()` sizes the workout to the time budget. `ui.focus`: `auto` (follows the program), `lower`, `upper`, `recovery`, `light`, or `mix` (Surprise me, a seeded random shuffle stored in `localStorage` under `coach.mix`).
- `draft`: the workout in progress, saved to `localStorage` (`coach.draft`) until the whole session is saved. The header dot turns red while logged sets are unsaved.
- One workout a day. Once today's workout is started (logged sets, a reopened draft, or `coach.live` has a start) or saved, the overview shows only: today's workout (in progress → Resume; saved → `savedTodayCard` with Reopen to finish), a read-only `nextUpCard` for the following session, and the flowers. The focus chips and energy/time check-in come back on the next gym day.
- Today has two modes. The overview (`renderToday`: focus card, flowers, check-in, `todayPreview` with a **Start workout** button) and workout mode (`renderLive`), which hides the header, week strip and tabs (`body.live`) and shows a sticky bar with ‹ Overview, the workout name and an elapsed clock. `coach.live` `{date,on,acc,since,walkDone,rating}` in localStorage brings her back into workout mode after a reload; saving ends it. The clock only runs in workout mode (`acc` seconds banked + time since `since`); it pauses on the overview, is saved as `s.duration` (seconds), and a reopened workout continues from it. There's no post-save toast; the saved card is the confirmation.
- Guided set flow: stepper inputs, pick how it felt (Easy / Just right / Hard, default Just right, stored as `d.pick`), tap **Log set N**, then a rest timer. The open exercise is tinted apricot (24% `--apricot` over `--surface`). Log set is white with a black border, black on hover or tap. Finished exercises fade (white, 55% opacity name and weight) so the active one is the only tinted row. After each set (and after editing or deleting one), `carryLast()` prefills the steppers with the last logged set. Sets can be edited or deleted.
- Timed moves (`LIB[id].timed`: forearm plank, side plank) are logged only by the hold timer (`holdTimer`, `ui.hold`); there's no seconds box. Start → 5-second get-set countdown with beeps → the timer runs and chimes at the goal. Forearm plank is one hold that keeps counting until Stop. Side plank starts on the left; at the goal (or End left side early) it moves to the right, which auto-finishes at the goal; the weaker side is logged. The result sits in `d.heldNow` (with Redo) until the set is logged; feel + Log set only appear after that.
- Workout mode extras live in `coach.live`: `walkDone` (the butter treadmill card is a check-off, no timer; saved `walk` minutes only count if checked) and `rating` (1–5 stars, saved as `s.rating`, shown in History). The rating is feedback on the programming, not effort: if the last session of a type was rated 1–2, `buildPlan` leads with different accessory machines next time and says so.
- "Last time" (`lastNote`) is a compact two-liner below the Log set button on set 1: last sets, then the coach's call for today.
- A workout saved today shows on the overview with **Reopen to finish** (`reopenSession`). It's removed from history into `draft` (with `draft.reopen` carrying id, createdAt and program fields, so re-saving replaces it in place), and a copy sits in `coach.reopened`; `store.init` puts that copy back if the reopened draft is never re-saved.
- **Progression is derived, never stored.** `computeAll()` replays every session (plus manual overrides in `state.manual`, keyed by timestamp) through `evaluate()`:
  - The "proven" weight is the heaviest weight where the goal reps were hit and it wasn't hard, or was hard only on the final set.
  - A single heavier set that felt hard means "meet in the middle" next time.
  - Double progression in the 8–12 rep range: +2 reps, and at 12 reps add weight and reset to 8. If every set was easy, add weight right away. Tired and light days never lower the numbers.
- `computeDistinctions()` replays the history and produces:
  - Distinction events: one-off types plus "ladders" (visits, treadmill hours, gym hours, lifetime lb, weeks in a row, plank, per-machine weight goals).
  - Goals: the next step on each ladder.
  - Unearned distinctions are never shown. Only the wall of earned ones appears.
- The weekly arrangement:
  - `MOODS`: 12 curated sets of three fall flowers and colors. `moodFor(weekKey)` picks one by hash without repeating the previous week.
  - Each visit (a distinct date, weeks run Monday to Sunday) reveals one stem. The third visit completes the week.
  - `arrangementSVG()` draws it from hand-built SVG flowers in `FDRAW`.
  - The monthly arrangement (`monthCard`/`monthSVG`, on Progress): every stem from the weeks whose Monday falls in this month (4–5 weeks, 3 stems each; weeks before her first workout don't count) in one large vase. Unearned stems are dashed outlines (`MONTH_POS` has 15 spots), completed weeks add their greens, and a full month gets a gold base.

## Data
- Model: `state` `{manual:{[exerciseId]:{w,reps,at}}}` and `sessions` `[{id, v:3, date, type, minutes, energy, walk, note, createdAt, slot?, bonus?, deload?, block, week, phase, exercises:[{id, target:{w,reps}, planned, range:{lo,hi}, sets:[{w,reps,grade}], note}]}]`.
- **Local storage only, by design.** `store` reads and writes `localStorage` (`coach.state`, `coach.sessions`) and asks for persistent storage. There is no backend and no sync. On iPhone the home-screen app has its own storage, separate from Safari, so data moves in and out only through **My plan → Export / Import backup**.
- Export format: `{app:"cassie-gym-coach", version:3, exportedAt, manual, sessions}`. On iPhone, export opens the share sheet (`navigator.share` with a File, so she can pick "Save to Files"). Elsewhere it's a Blob download, and it falls back to text to copy.
- `coach.lastBackup` records the last export or import. The header nudges "time for a backup" after 14 days.
- Personal data (`data/`, any `*.json` except the manifest) is gitignored. The repo is public, but the data is not.

## Hosting (GitHub Pages)
- Published as a static site from the repo root. All paths are relative, so it works under `/<repo-name>/`.
- `manifest.webmanifest` + `icons/` + Apple meta tags make it installable (Safari → Share → Add to Home Screen).
- `sw.js` caches the app for offline use at the gym. App files are network-first (3 s timeout), so a published update shows up on the next open with signal. Fonts are cache-first. Bump `CACHE` in `sw.js` when you change the list of cached files.

## Likely next steps
1. Winter, spring and summer flower lists (only fall `MOODS` exist so far).

## Working here
- There's no build step. Open `index.html` in a browser. For testing, serve the folder (`python3 -m http.server`); the service worker only runs over http(s).
- Keep it one file unless there's a good reason to split it.

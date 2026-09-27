# Cassie's Gym Coach

A personal, phone-first workout coach for machine training at Lifetime (Plymouth, MN). It's one self-contained HTML file (`index.html`) with vanilla JS and no build step. It was first built as a claude.ai artifact and moved here to keep developing.

## Who it's for and how it's used
- Cassie: goals are strength, health and longevity. No injuries. She uses machines only, plus core work on the mat with dumbbells. She dislikes calf machines and ab machines. There's no hip thrust machine at her gym, so the glute kickback machine is used instead.
- Three gym visits a week: legs & glutes, chest/back/arms, then recovery (or an optional light full-body day).
- She checks in with energy (1–5) and time (10/20/30/40 min, and the treadmill walk counts toward that time), then works through the plan set by set on her phone.

## Design
- Muted and sophisticated. Mostly cream with thin black lines, plus a muted fall palette used per section. Gold is reserved for things she earns.
- Fonts: Fraunces for headings and italics, Figtree for body text. Google Fonts, with fallback stacks.
- All color tokens are on `:root`, with dark-mode overrides. Style through tokens, never literal colors.
- Tone of copy: short, warm, understated. No exclamation points, no confetti. Avoid anything that feels adolescent. She doesn't want points for doing the basics.

## Architecture (all inside the one `<script>`)
- `LIB`: exercise library (machines, dumbbell core, bodyweight core). `ORDER`: rotation per day type (`lower`, `upper`, `light`, `core`). `ENERGY`: how energy changes weight, sets and rest.
- `buildPlan()` sizes the workout to the time budget. `ui.focus`: `auto` (the week's suggested type), `lower`, `upper`, `recovery`, `light`, or `mix` (Surprise me, a seeded random shuffle stored in `localStorage` under `coach.mix`).
- `draft`: the workout in progress, saved to `localStorage` (`coach.draft`) until the whole session is saved. The header dot turns red while logged sets are unsaved.
- Guided set flow: stepper inputs, then log the set as Easy / Just right / Hard, then a rest timer. There's also a treadmill timer. Sets can be edited or deleted.
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

## Data
- Model: `state` `{manual:{[exerciseId]:{w,reps,at}}}` and `sessions` `[{id, v:3, date, type, minutes, energy, walk, note, createdAt, exercises:[{id, target:{w,reps}, planned, sets:[{w,reps,grade}], note}]}]`.
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

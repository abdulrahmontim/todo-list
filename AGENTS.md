# AGENTS.md

Guidance for AI coding agents working in this repo. Read this before making changes.

## Project overview

A frontend-only todo app that goes beyond basic CRUD: smart task capture, a "what should I do now?" recommendation, and ambient/floating display modes. It is deployed as a static site on Vercel. **There is no backend.**

## Hard constraints

- Frontend only. Do not add a server, database, or API routes unless explicitly asked.
- All data lives in the browser (IndexedDB). Never assume network access for core features.
- Must deploy to Vercel with zero extra configuration (`npm run build` outputs a static bundle).
- Core todo functionality (add, edit, complete, delete, persist) must always keep working. Never break it for a new feature.

## Tech stack

<!-- Edit to match what you actually choose -->
- Vite + React + TypeScript
- Storage: IndexedDB via `idb` (or Dexie)
- Date parsing: `chrono-node`
- Styling: [Tailwind CSS / CSS Modules], with all colors coming from CSS variable tokens (see Theming)
- Tests: Vitest + Testing Library

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # production build (must pass before finishing any task)
npm run preview    # preview the production build
npm run lint       # lint
npm run test       # run unit tests
```

Before declaring a task done, run `npm run lint`, `npm run test`, and `npm run build`.

## Project structure

```
src/
  components/     # UI components (one folder per component)
  features/       # feature modules: capture/, scoring/, ambient/, stats/
  lib/            # pure logic: parser, scoring, recurrence (no React imports)
  db/             # IndexedDB schema and access layer
  hooks/          # reusable React hooks
  types/          # shared TypeScript types
public/           # static assets, manifest, service worker
```

Keep business logic in `lib/` as pure functions so it can be unit tested without the UI.

## Data model

```ts
type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;        // epoch ms
  dueAt?: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  note?: string;            // free text; key omitted when empty
  estimateMins?: number;
  actualMins?: number;
  dependsOn?: string[];     // task ids
  scheduledStart?: number;  // time blocking, epoch ms
  scheduledEnd?: number;
  completedAt?: number;     // used for streaks and XP
  updatedAt: number;        // used for cross-tab conflict resolution
};
```

Changing this shape requires a DB version bump and a migration in `src/db/`.

## Code conventions

- TypeScript strict mode. No `any`; use `unknown` and narrow.
- Functional components and hooks only.
- Small, single-purpose components and functions.
- Name files after their main export (`TaskItem.tsx`, `parseTask.ts`).
- Prefer editing existing code over adding new abstractions. Do not add dependencies without a clear reason, and mention any new dependency in your summary.
- No `localStorage` for task data; use the IndexedDB layer. `localStorage` is fine only for small UI preferences (theme, last tab).
- Wrap all browser API usage (Notifications, Wake Lock, Picture-in-Picture) in feature detection with a graceful fallback.

## Feature notes

- **Natural-language capture:** input like `submit lab report friday 5pm #coursework !high` is parsed into title, due date, tag, priority. Parser lives in `lib/parseTask.ts` and must have unit tests covering edge cases.
- **"What now?" scoring:** ranks tasks by deadline urgency, priority, estimate, and dependencies. Must be deterministic and unit tested.
- **Ambient mode:** fullscreen view of the current task with a color that shifts as the deadline nears. Uses the Screen Wake Lock API where supported.
- **Floating widget:** Document Picture-in-Picture (Chromium only). Must degrade gracefully elsewhere.

## Theming and color settings

- Three theme modes: **Light**, **Dark**, and **System** (default, follows `prefers-color-scheme`).
- Themes are driven by CSS custom properties (design tokens) on `:root`, switched with a `data-theme="light|dark"` attribute on `<html>`. Never hardcode colors in components; always use tokens like `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--accent`.
- Prevent a flash of the wrong theme: an inline script in `index.html` reads the saved preference and sets `data-theme` before first paint.
- The choice persists in `localStorage` (allowed for UI preferences) and reacts live to OS theme changes when set to System.
- **Accent color:** a picker with preset swatches plus a custom color input. Store it as a single value and derive hover/active shades from it.
- **Priority colors** (low/medium/high) must be defined per theme and remain distinguishable without relying on color alone (add an icon or label).
- All text and interactive elements must meet WCAG AA contrast (4.5:1 for body text) in both themes and with any accent color. Warn or auto-adjust when a custom accent fails.
- Offer an optional **high-contrast** mode.
- Transitions between themes should be subtle and disabled under `prefers-reduced-motion`.

## Settings page

All settings persist locally and apply instantly:

- Theme (Light / Dark / System), accent color, high contrast
- Density (compact / comfortable) and font size
- Default view (list, board, calendar) and default sort
- Week start day (Sunday/Monday) and 12h/24h time
- Notifications on/off and reminder lead time
- Sound and haptics on/off
- Data: export JSON, import JSON, reset all data (with confirmation)

Keep settings in a typed `Settings` object in one place (`src/features/settings/`) with defaults, so adding a setting is a one-file change.

## Signature features

These are what make the project stand out. Build them after the core todo works, and keep each one isolated in its own `features/` module so it can be removed without breaking the app.

### 1. Time blocking with `.ics` export (`features/planner/`)

- A day timeline where tasks can be dragged onto time slots. Slot length defaults to the task's `estimateMins`.
- Scheduled blocks are stored on the task as `scheduledStart` and `scheduledEnd` (epoch ms). Adding these fields requires a DB version bump and migration.
- Detect and prevent overlapping blocks, and show a warning when a block runs past the task's due date.
- **Export:** generate a valid iCalendar (`.ics`) file client-side, one `VEVENT` per block, with stable `UID`s, correct timezone handling, and proper line folding and escaping. Offer "export day" and "export week".
- Build the `.ics` generator as a pure function in `lib/ics.ts` with unit tests (escaping commas/semicolons, all-day vs timed events, timezone edge cases). Do not add a dependency for this unless the hand-written version becomes unmaintainable.

### 2. Voice input (`features/voice/`)

- Use the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with feature detection. Hide the mic button when unsupported (e.g. Firefox).
- The transcript is passed through the same natural-language parser as typed input (`lib/parseTask.ts`), so "remind me to email the lecturer tomorrow at 9" creates a task with a due date.
- Show a live interim transcript and let the user confirm or edit before saving. Never auto-save without confirmation.
- Handle permission denied, no speech detected, and network errors with clear messages. Note that recognition may send audio to the browser vendor's service; mention this in the settings page next to the toggle.
- Voice is opt-in via a setting, and it needs HTTPS (Vercel provides this).

### 3. Gamification (`features/gamification/`)

- XP for completing tasks, scaled by priority and whether the task was completed on time. Levels are derived from total XP by a pure function in `lib/xp.ts`.
- Daily streaks (a day counts if at least one task was completed) and a completion heatmap.
- Achievements defined as data (id, title, description, condition function), for example "7-day streak", "cleared all overdue", "first 10 tasks". Unlocks show a toast.
- XP and achievements must be computed from task history where possible, so they cannot drift out of sync. Store only what cannot be derived.
- Guard against abuse: no XP for tasks created and completed within seconds, and cap daily XP.
- Provide a setting to turn gamification off completely. It must never block or nag.
- Celebration effects (confetti, sounds) respect `prefers-reduced-motion` and the sound setting.

### 4. Cross-tab sync (`features/sync/`)

- Use `BroadcastChannel` to notify other tabs when data changes, with a fallback to the `storage` event if unavailable.
- IndexedDB is the source of truth. Messages only say "something changed" (plus the affected ids); other tabs re-read from the database. Do not send full task payloads over the channel.
- Handle concurrent edits with last-write-wins using an `updatedAt` timestamp on each task. Add `updatedAt` to the data model.
- Settings (theme, accent) also sync across tabs so a theme change applies everywhere instantly.
- Avoid echo loops: a tab must not re-broadcast a change it just received.
- Test with two tabs open: add, edit, complete, delete, and undo in one tab and verify the other.

### Shared rules for signature features

- Each feature has a toggle in Settings and degrades gracefully when its browser API is missing.
- Each feature's logic lives in `lib/` as pure, tested functions, with UI kept thin.
- Note in the README which features need a Chromium browser.

## Additional features (backlog)

Build in roughly this order after the core works:

1. Search, filters (by tag, priority, due date, status), and sorting
2. Subtasks and checklists
3. Drag-and-drop reordering
4. Undo/redo for delete and complete (with a toast)
5. Recurring tasks with proper rules (e.g. every second Tuesday)
6. Projects/lists and color-coded tags
7. Calendar view and a "Today / Upcoming / Overdue" smart view
8. Archive and bulk actions (multi-select complete/delete/tag)
9. Stats dashboard: completion heatmap, streaks, estimated vs actual time
10. Focus timer linked to a task
11. Shareable list via URL hash (no backend)

## Testing

- Unit test everything in `lib/`.
- Add a component test for any new interactive component.
- When fixing a bug, add a test that fails before the fix.

## Accessibility and UX

- Everything reachable and usable by keyboard.
- Semantic HTML and ARIA labels on icon-only buttons.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Works on mobile widths.

## Git and PRs

- Small, focused commits with clear messages (`feat: add task parser`, `fix: due date timezone bug`).
- One feature or fix per branch.

## Boundaries

**Always:** run lint, tests, and build before finishing; keep changes scoped to the request; explain non-obvious decisions.

**Ask first:** adding dependencies, changing the data model, adding any backend or serverless function, restructuring folders.

**Never:** commit secrets or API keys, delete user data paths without a migration, disable lint or type checks to make something pass.

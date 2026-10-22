# Spec: Thinking Time Bomb

DAVE3625 – Mandatory Assignment 3: Vibe Coding. Solo project.

## Problem

Students lose focus when studying for long stretches, and at the end of a week
they rarely know how much time they actually spent on each course. Generic
Pomodoro timers help with focus but say nothing about *where* the time went.

## Target user

A student juggling 3–5 courses who studies on a laptop or phone and wants to
see, per course, how much focused time they put in this week.

## Core idea

A Pomodoro timer where every focus session is tagged with a course. Completed
sessions are logged, and a stats view shows focus time per course.

## Look and feel

Brand: **Thinking Time Bomb** (logo handoff: icon that is a clock and a bomb,
slanted Archivo 900 wordmark, ink #111418 and light blue #6cbcec).

- The timer is drawn as the bomb-clock: the fuse burns down, the hand sweeps
  round and a light-blue wedge shows the time left.
- The spark flickers while running; the bomb wobbles in the last 10 seconds
  of a focus session; a "boom" burst plays when a focus session ends.
- Focus uses the light (or chosen) theme; breaks always use the dark screen.
- Playful copy: Light the fuse / Hold / Relight / Re-arm / Defuse.
- Animations are turned off when the system asks for reduced motion.

## Features and acceptance criteria

### F1 – Timer

- Three phases: **focus** (default 25 min), **short break** (default 5 min),
  **long break** (default 15 min).
- After every Nth completed focus session (default 4, configurable 2–8) the
  next break is a long break; otherwise it is a short break. After any break the next phase is focus.
- Controls: start, pause, resume, reset (current phase back to full length),
  skip (jump to the next phase).
- A skipped or reset focus session is **not** logged as completed.
- When a phase ends: a sound plays, a browser notification is shown (if
  permission was granted), and the next phase is ready. It starts
  automatically only if the matching auto-start setting is on (breaks and
  focus have separate switches, both off by default).
- The remaining time is shown in the page and in the browser tab title.
- Remaining time is calculated from timestamps, not by counting ticks, so the
  timer stays correct when the tab is in the background or the laptop sleeps.
- Reloading the page mid-phase restores the phase, remaining time and
  running/paused state.
- Settings panel (gear icon): durations (focus 1–90 min, breaks 1–30 min),
  sessions before a long break (2–8), auto-start switches, "Pop out when the
  fuse is lit" (only where F4 works), sound (chime, bell or off) with volume
  and a test button, appearance (system, light, dark).
  Invalid input is rejected with a message and nothing is saved; Cancel
  discards changes.
- Keyboard shortcuts: Space start/pause, R reset, S skip. They work but are
  not shown on the page, to keep it clean.

### F2 – Courses and session log

- The user can add, rename and delete courses (e.g. "DAVE3625").
- A course must be selected before a focus session can start.
- When a focus session completes, an entry is saved with: course, start time,
  end time and duration.
- Deleting a course keeps its logged sessions (shown as the old course name).
  Adding a course with the name of a deleted one brings it back, so old and
  new sessions count together.
- The course of a focus session that is running or paused can't be changed or
  deleted.
- All data is stored locally in the browser. Nothing is sent to a server.

### F3 – Stats

- **Today:** number of completed focus sessions and total focus minutes.
- **Time per course:** focus time per course in hours and minutes, sorted
  highest first, shown as a simple bar chart. A switch shows either **this
  week** (Monday–Sunday) or **all time**.
- **Streak:** consecutive days with at least one completed focus session. If
  there is no session yet today, the streak counts up to yesterday.
- A session counts towards the local date on which it **ended**.

### F4 – Picture-in-picture mini timer

- A "Pop out" button opens a small always-on-top window showing only the
  animated bomb, the current phase and the remaining time, so the timer stays
  visible while the user works in other tabs or apps.
- The user can drag the window anywhere on screen and resize it; the bomb and
  the time scale with the window. The browser always draws the window's frame
  and top bar; a web page can't remove them.
- Clicking the mini window closes it and brings the timer's tab back to the
  front. The "Pop in" button on the page also closes it.
- The mini window and the main page always show the same time.
- When a phase ends while the mini window is open, it shows the new phase.
- Closing the mini window does not stop or change the timer.
- The window can only be opened by a click or key press (browser rule). It
  opens from the "Pop out" button, and also when a focus session is started
  if the setting "Pop out when the fuse is lit" is on (default on). It can't
  open by itself when the user switches tabs; browsers block that.
- The mini window can't be scrolled.
- In browsers that do not support it, the "Pop out" button is hidden and the
  rest of the app works as normal.
- If the browser has the feature but still refuses to open the window (seen
  in some embedded browsers), a message says it works in desktop Chrome and
  Edge.

### Stretch goals (only if F1–F4 are done and tested)

- Picture-in-picture fallback for browsers without document picture-in-picture
  (for example Safari): the timer drawn on a video, display only.
- Keyboard shortcuts (space = start/pause, S = skip).
- Installable on a phone (PWA).
- Export the session log as CSV.

## Non-goals

- User accounts, sync between devices, or any backend.
- AI features inside the app.
- Publishing to an app store.

## Technical constraints

- Plain HTML, CSS and JavaScript (ES modules). No framework, no build step.
- Data in `localStorage`.
- Hosted on GitHub Pages; the same repository is the source-code link.
- Timer and stats logic live in pure modules with no DOM access, so they can be
  unit-tested with Node's built-in test runner (`node --test`) using a fake
  clock.
- Works in current Chrome, Firefox and Safari, on desktop and phone widths.
  F4 picture-in-picture is expected to work only in desktop Chrome and Edge;
  browser support must be checked when it is built.

## Testing plan

- **Unit tests:** phase transitions, the long-break rule, pause/resume
  arithmetic, skip/reset not logging, duration validation, weekly totals, week
  boundaries, streak calculation, sessions ending after midnight.
- **Manual checklist** (in `docs/testing.md`): background tab, laptop sleep,
  reload mid-session, notification permission denied, phone layout, empty
  state with no courses or sessions, mini window kept open for 30+ minutes
  with the main tab in the background, mini window in an unsupported browser.
- Bugs found during testing are recorded in `docs/ai-log.md` with the fix.

## Submission

- Demo link: https://makinatorr.github.io/thinking-time-bomb/
- Source code: https://github.com/makinatorr/thinking-time-bomb
- Short description: from `README.md`.
- Deadline: Saturday 25 October 2026, 23:00.
- Submitted: Friday 23 October 2026 (demo and source links).

## Open decisions

- None at the moment.

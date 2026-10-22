# AI log

How AI was used to plan, build, test and improve this app. One entry per
working session: what I asked for, what the AI produced, what was wrong, and
what I changed.

**Tool:** Claude Code (Claude Opus 5.5), used in the terminal/desktop app.

---

## 2026-10-18/19 – Choosing the idea and planning

**What I asked:** I gave the AI the assignment text and asked it to help me
plan before writing any code.

**What the AI did:**

- Pointed out that the grading criteria include *how AI was used* and *how the
  app was tested and improved*, and suggested keeping this log and a testing
  document from day one.
- Suggested four ideas (deadline tracker, expense splitter, commute helper,
  event sign-up).
- I first suggested continuing my existing grade-calculator browser extension.
  The AI reviewed the code and flagged problems for this assignment: graders
  could not run it without logging into StudentWeb with real grades (personal
  data), it contained an undisclosed usage ping, and its logic was not
  testable.
- I switched to a Pomodoro app. The AI proposed the angle of tagging each
  focus session with a course and showing time per course, so it is more than
  a generic timer.

**Decisions:**

- Plain HTML/CSS/JS, `localStorage`, GitHub Pages. No backend, no keys.
- Features F1 timer, F2 courses and session log, F3 stats (see `spec.md`).

**Risk noted up front:** timers built with `setInterval` drift or freeze when
the browser throttles background tabs. The spec requires remaining time to be
calculated from timestamps instead, and we will test this explicitly.

---

## 2026-10-22 – F1: timer

**What I asked:** "Let's continue the work on the assignment": build F1 from
the spec.

**What the AI produced:**

- `js/timer.js`: pure timer logic (start, pause, reset, skip, phase end,
  long-break rule, duration validation). No DOM and no `Date.now()` inside;
  the current time is passed in, so it can be tested with a fake clock.
- `test/timer.test.js`: 18 unit tests, written before the page.
- `index.html`, `css/style.css`, `js/app.js`: the page. State is saved to
  `localStorage` after every change.
- `js/alerts.js`: a chime generated with the Web Audio API (no sound file) and
  browser notifications.

**Design choices the AI explained:**

- Remaining time = `endsAt - now`, so the timer is right after sleep or
  background throttling (the risk noted on day 1).
- A separate one-shot `setTimeout` for the exact end time, because browsers
  throttle repeating timers in background tabs harder than one-off timers.
  Not yet verified in a long background run (testing checklist #11).
- A finished session gets the time it actually ran out as its end time, not
  the time the page noticed. This matters for F3 (sessions after midnight).
- A phase that ended more than a minute ago (page closed) completes silently
  instead of ringing when the page opens.

**What was wrong / what I tested:**

- The AI's first version of "skip" computed the next phase with the
  long-break rule and then overrode it. It simplified this to: skipping focus
  always gives a short break, skipping a break gives focus. A unit test now
  covers skipping after 3 completed sessions.
- The browser preview could not start the local server: macOS blocked Python
  from reading the Desktop folder. The AI started the server from the
  terminal instead.
- Tested in the browser by the AI: start/pause, reload, phase end, a
  "laptop was asleep" case (by editing the saved state), settings
  validation, phone width. Results in `testing.md`.

**What I changed after reviewing it:**

- Asked the AI to remove comment bloat and duplicate code. It shortened the
  comments, merged repeated "check if the phase ended, then redraw" code
  into one `update()` function, made status messages part of `setState`, and
  reused the phase names for the settings error messages instead of
  repeating them. All 18 tests still passed afterwards.
- Asked for a light blue design instead of the first warm red/beige one.

**Still to test myself:** sound and notification at a real phase end,
background tab for 30+ minutes, Firefox and Safari.

---

## 2026-10-22 – Redesign: Thinking Time Bomb brand

**What I asked:** I didn't like the UX and wanted it minimal but nicer, with
more ways to customise it. I then gave the AI a logo handoff I had made
(Thinking Time Bomb: a clock that is also a bomb, slanted Archivo wordmark,
black and light blue) and asked for a creative UX based on the brand.

**What the AI produced:**

- The timer is now the logo itself, animated: the fuse burns down, the clock
  hand sweeps round, a light-blue wedge shows the time left, the spark
  flickers while running, the bomb wobbles in the last 10 seconds and a
  "boom" burst plays when a focus session ends (`js/bomb.js`).
- Breaks switch to the dark version of the brand ("cool-down screen").
- Playful copy: Light the fuse, Hold, Relight, Re-arm, Defuse.
- A settings drawer with new options: sessions before a long break,
  auto-start switches, sound choice (chime, bell, off), volume, and
  light/dark/system appearance. Keyboard shortcuts.
- Timer logic got `getProgress`, `shouldAutoStart` and a configurable long
  break; 5 new unit tests (23 in total).

**What was wrong / what I tested:**

- The AI noticed that progress would be wrong if durations change in the
  middle of a phase, so each phase now remembers the length it started with.
  A unit test covers this.
- The phase label in light blue was hard to read on the light background, so
  it uses black in light mode and light blue only on dark screens.
- The first gear icon looked like a sun and was replaced.
- I reviewed the settings panel myself: the number fields were not aligned
  and the browser's built-in up/down arrows looked bad on hover. The AI
  replaced them with − / + steppers of equal width (hold to repeat, arrow
  keys work, buttons disable at the limits) and shortened a label that
  wrapped. It also stopped the close button from getting a big focus ring
  every time the panel opened.
- During testing a break seemed to start by itself. The AI recorded the click
  events and found it was me clicking in the preview, not a bug.

---

<!-- Template for later entries:

## YYYY-MM-DD – <topic>

**What I asked:**
**What the AI produced:**
**What was wrong / what I tested:**
**What I changed:**

-->

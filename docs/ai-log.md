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
- I switched to a Pomodoro app with my own angle: tagging each focus session
  with a course and showing time per course, so it is more than a generic
  timer. The AI helped turn it into the spec.

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

## 2026-10-22 – F2 courses and F3 stats

**What I asked:** Build F2 (courses and session log). I also asked for a view
of how many hours and minutes I have studied per course, so F3 was built in
the same step.

**What the AI produced:**

- `js/courses.js` and `js/stats.js`: pure logic for courses (add, rename,
  delete, name checks) and stats (today, this week, all time, streak).
  19 new unit tests (42 in total).
- `js/study.js`: the course picker under the timer and a "Study log" drawer
  (chart icon) with today's numbers, time per course as bars with a
  This week / All time switch, and the course list.
- `js/storage.js`: the `localStorage` helpers, moved out of `app.js` so both
  modules use them.

**Design choices the AI explained:**

- A deleted course is only marked as deleted, so its sessions keep the name.
  Adding the same name again brings the course back instead of making a
  second course with the same name in the stats.
- The course is locked while a focus session runs, so a session can't change
  course halfway.
- Dates use the browser's local time and `setDate` instead of adding 24 hours,
  because clocks change in Norway on 25 October, inside the test week. The
  tests were run in four time zones.

**What was wrong / what I tested:**

- Renaming a course rebuilt the list and lost keyboard focus when tabbing
  out of the field. The AI changed it so a rename doesn't rebuild the list.
- After a rejected course name, the text stayed in the field and the next
  name was typed after it. The field now selects the text after an error.
- Tested in the browser by the AI with sample data (and my own data restored
  afterwards). Results in `testing.md`.

**What I changed after reviewing it:**

- I found it hard to see that there were courses and settings, because the
  header only had two small icons. The AI changed them to labelled
  "Courses" and "Settings" buttons, renamed the "Study log" panel to
  "Courses", and put a "Studying" label in front of the course picker. On
  phones the wordmark next to the logo hides so the buttons fit.

---

## 2026-10-22 – F4: pop-out mini timer

**What I asked:** Build F4. While it was being built I asked for the mini
window to show the Thinking Time Bomb with the time next to it, and to be
movable anywhere.

**What the AI produced:**

- `js/mini.js`: a "Pop out" button opens an always-on-top window (Document
  Picture-in-Picture) with a copy of the animated bomb, the phase, the time,
  the course and two buttons (later slimmed down, see below). It reuses the page's stylesheet and is redrawn
  by the same code as the page, so the two always match. "Pop in" closes it.
- `js/bomb.js` now draws any copy of the bomb, so the page and the pop-out
  each animate their own.
- The window can be dragged anywhere on screen and resized; the bomb and the
  time scale with it.

**Design choices the AI explained:**

- The display update runs from the pop-out window's own timer, because
  browsers slow down timers in background tabs, but the pop-out stays
  visible.
- The button is hidden in browsers without the feature (Firefox, Safari).

**What was wrong / what I tested:**

- The Claude app's built-in browser says it supports the feature but cannot
  open the window. The AI found the real error ("no window") and changed the
  message to say the pop-out works in desktop Chrome and Edge.
- To test anyway, the AI temporarily replaced the window with a frame of the
  same size inside the page. Buttons, matching times, the break screen, the
  boom at the end of a session and closing all worked. A real Chrome run is
  still on my list (`testing.md`).
- The local server let the browser cache old JavaScript, so the first test
  ran the old code. Reloading the files fixed it.

**What I changed after reviewing it:**

- I asked whether the pop-out could be just the icon. The AI explained that
  the browser always draws the window frame, but the content can be minimal.
  The mini window now shows only the bomb, the phase and the time, without
  buttons or course name, and clicking it goes back to the timer's tab.
- I asked whether the pop-out could open by itself when I switch to another
  tab. The AI explained that browsers only allow it on a click or key press
  (Chrome's automatic picture-in-picture is only for pages playing media or
  in video calls) and suggested opening it on the "Light the fuse" click
  instead. It is now a setting, on by default. If the browser can't open the
  window, the timer starts anyway with no error message.
- I asked that the pop-out can't be scrolled. While testing, the AI found
  that the boom burst made the content taller than the window, which made it
  scrollable; scrolling is now turned off there.
- I asked what the small buttons and the line at the bottom were. The line
  was the keyboard shortcut hint, which I didn't want on the page; it was
  removed, and the shortcuts still work.

---

<!-- Template for later entries:

## YYYY-MM-DD – <topic>

**What I asked:**
**What the AI produced:**
**What was wrong / what I tested:**
**What I changed:**

-->

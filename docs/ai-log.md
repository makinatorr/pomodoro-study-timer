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

<!-- Template for later entries:

## YYYY-MM-DD – <topic>

**What I asked:**
**What the AI produced:**
**What was wrong / what I tested:**
**What I changed:**

-->

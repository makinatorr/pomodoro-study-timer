# Thinking Time Bomb

A Pomodoro study timer for students. Light the fuse, focus until the bomb goes
off, then cool down on the break screen. Every focus session is tagged with a
course, so at the end of the week you can see where your study time went.

**Demo:** https://makinatorr.github.io/thinking-time-bomb/
**Source:** https://github.com/makinatorr/thinking-time-bomb

Built for DAVE3625 Mandatory Assignment 3 (Vibe Coding) at OsloMet.

## Why

Students lose focus in long study sessions and rarely know how much time
they actually spent on each course. Ordinary Pomodoro timers help with focus
but say nothing about where the time went.

## Features

- **Timer:** focus, short break, and a long break after every 4th session
  (can be changed). The timer is an animated bomb: the fuse burns down, it wobbles in
  the last 10 seconds and goes boom when the session ends. Sound and browser
  notification at the end of each phase. Keeps the right time in background
  tabs, after sleep and across reloads.
- **Courses:** add, rename and delete courses, and pick one before each focus
  session. Every completed session is logged with course, start, end and
  length.
- **Stats** (Courses panel): today's sessions and focus time, a day streak,
  and time per course for this week or all time.
- **Pop out:** a small always-on-top window with the bomb and the time, so it
  stays visible in other tabs and apps. Opens when you light the fuse (can be
  turned off) or with the Pop out button. Desktop Chrome and Edge only; the
  button is hidden in other browsers.
- **Settings:** durations, sessions before a long break, auto-start, sound and
  volume, light/dark/system theme. Keyboard: Space start/pause, R reset,
  S skip.

All data stays in your browser (`localStorage`). There is no account and no
server.

## Run locally

Needs Python 3 for the local server and Node 18+ for the tests. Nothing to
install.

```bash
npm start
```

Open http://localhost:8000. (Opening `index.html` directly doesn't work,
because ES modules don't load from `file://`.)

```bash
npm test
```

## How it's built

Plain HTML, CSS and JavaScript modules, no framework and no build step,
hosted on GitHub Pages. The timer, course and stats logic are pure modules
(`js/timer.js`, `js/courses.js`, `js/stats.js`) with no DOM access, tested
with Node's built-in test runner and a fake clock.

## Testing

- 42 unit tests: phase changes, the long-break rule, pause/resume, skip and
  reset not being logged, input checks, course rules, weekly totals, week
  boundaries, streaks and sessions ending after midnight. They also pass in
  four time zones, because clocks change in Norway on 25 October.
- A manual checklist with results and bugs found:
  [docs/testing.md](docs/testing.md).

## How AI was used

The idea, a Pomodoro timer that logs study time per course, is mine. I
planned and built the app with Claude Code: we turned the idea into a spec
before any code, then the AI wrote most of the code and tests and explained
its choices, and I reviewed each step, tested it and asked for changes (for
example the redesign around my own logo, clearer buttons and a slimmer
pop-out). What I asked for, what it produced, what was wrong and what I
changed is logged per session in [docs/ai-log.md](docs/ai-log.md).

## Docs

- [docs/spec.md](docs/spec.md): problem, features and acceptance criteria
- [docs/testing.md](docs/testing.md): unit tests, manual checklist, bugs
- [docs/ai-log.md](docs/ai-log.md): how AI was used

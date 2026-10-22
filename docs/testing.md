# Testing

## Unit tests

Run from the project folder (Node 18+; no packages to install):

```bash
npm test
```

| Date | Feature | Tests | Result |
|---|---|---|---|
| 2026-10-22 | F1 timer (`test/timer.test.js`) | 18 | 18 pass |
| 2026-10-22 | F1 after redesign: progress, auto-start, sessions before long break | 23 | 23 pass |

The timer tests use a fake clock: every timer function takes the current time
as an argument, so a 25-minute session is tested instantly.

## Running the app locally

```bash
npm start
```

Then open <http://localhost:8000>. (ES modules do not load from `file://`, so
opening `index.html` directly does not work.)

## Manual checklist

Status: ✅ pass · ❌ fail · ⏳ not tested yet

### F1 – Timer

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Start counts down; button changes to Pause; tab title shows time | ✅ 2026-10-22 | Title "24:58 · Focus" after ~2 s |
| 2 | Pause freezes the time; button shows Resume; title says "(paused)" | ✅ 2026-10-22 | |
| 3 | Reload while paused keeps phase, time and Resume state | ✅ 2026-10-22 | |
| 4 | Phase end: moves to short break, waits for Start, shows message | ✅ 2026-10-22 | Simulated with a phase ending 2 s after reload |
| 5 | Phase ended 3 h ago (laptop asleep / page closed): completes on open without ringing | ✅ 2026-10-22 | Saved state edited to end 3 h in the past |
| 6 | Invalid duration (0) shows an error and keeps the old settings | ✅ 2026-10-22 | |
| 7 | Valid durations save; idle phase updates immediately | ✅ 2026-10-22 | Short break 10 → shows 10:00 |
| 8 | Phone width (375 px): no horizontal scroll, buttons usable | ✅ 2026-10-22 | |
| 8a | Redesign: fuse, hand and wedge match the time left (60 % elapsed) | ✅ 2026-10-22 | |
| 8b | Last 10 s of focus: bomb wobbles; at 0: boom burst, dark break screen, "Boom!" message | ✅ 2026-10-22 | |
| 8c | Break screen: "Start break" / "Skip break" labels, dots show 2 of 4 done | ✅ 2026-10-22 | |
| 8d | Settings panel: invalid "sessions before long break" (9) shows error and keeps panel open | ✅ 2026-10-22 | |
| 8e | Settings panel: saving focus 30 while running keeps 25 for the current session | ✅ 2026-10-22 | |
| 8f | Settings panel: dark theme, bell, volume, auto-start breaks saved and survive reload | ✅ 2026-10-22 | |
| 8g | Settings panel at phone width (375 px): fits, no horizontal scroll | ✅ 2026-10-22 | |
| 8h | Keyboard: S skips, Space starts | ✅ 2026-10-22 | |
| 8h2 | Settings: all controls line up in one column; + / − step by one, hold repeats, arrow keys step, + disabled at max (8 sessions) | ✅ 2026-10-22 | After the stepper fix |
| 8h3 | Settings: typing 0 for focus shows an error, Cancel discards, saved value stays 25 | ✅ 2026-10-22 | |
| 8i | Auto-start breaks: break starts by itself after focus ends | ⏳ | |
| 8j | Test sound button plays chime and bell at the chosen volume | ⏳ | Needs real speakers |
| 8k | Reduced motion (system setting): no flicker, wobble or burst | ⏳ | |
| 9 | Chime plays and notification appears at phase end | ⏳ | Needs a real run with sound on; check notification permission prompt |
| 10 | Notification permission denied: chime and title still work | ⏳ | |
| 11 | Background tab for 30+ min: alert arrives on time | ⏳ | Set focus to 30 min, switch tab, note when the chime plays |
| 12 | Laptop lid closed mid-session, reopened after end | ⏳ | |
| 13 | Firefox and Safari | ⏳ | |

### F2 – Courses and session log

⏳ Not built yet.

### F3 – Stats

⏳ Not built yet.

### F4 – Picture-in-picture

⏳ Not built yet.

## Bugs found

| Date | Bug | How found | Fix |
|---|---|---|---|
| 2026-10-22 | Settings fields not aligned (one had no "min" unit); native number spinners looked bad on hover; close button showed a big focus ring when the panel opened | My own review of the panel | Custom − / + steppers of equal width, shorter "Long break after … sessions" label, focus moves to the panel title on open |
| 2026-10-22 | Local server could not start from the app's preview launcher (`PermissionError` reading the Desktop folder, a macOS privacy restriction) | Starting the dev server | Start it from the terminal with `npm start` instead |

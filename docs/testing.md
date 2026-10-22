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
| 2026-10-22 | F2 courses (`test/courses.test.js`), F3 stats (`test/stats.test.js`) | 42 | 42 pass, also with `TZ` set to Europe/Oslo, America/New_York, Pacific/Auckland and UTC |

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
| 1 | Start counts down; button changes to Hold; tab title shows time | ✅ 2026-10-22 | Title "24:58 · Focus" after ~2 s |
| 2 | Hold freezes the time; button shows Relight; title says "(paused)" | ✅ 2026-10-22 | |
| 3 | Reload while paused keeps phase, time and Relight state | ✅ 2026-10-22 | |
| 4 | Phase end: moves to short break, waits for Start, shows message | ✅ 2026-10-22 | Simulated with a phase ending 2 s after reload |
| 5 | Phase ended 3 h ago (laptop asleep / page closed): completes on open without ringing | ✅ 2026-10-22 | Saved state edited to end 3 h in the past |
| 6 | Invalid duration (0) shows an error and keeps the old settings | ✅ 2026-10-22 | |
| 7 | Valid durations save; idle phase updates immediately | ✅ 2026-10-22 | Short break 10 → shows 10:00 |
| 8 | Phone width (375 px): no horizontal scroll, buttons usable | ✅ 2026-10-22 | |
| 9 | Redesign: fuse, hand and wedge match the time left (60 % elapsed) | ✅ 2026-10-22 | |
| 10 | Last 10 s of focus: bomb wobbles; at 0: boom burst, dark break screen, "Boom!" message | ✅ 2026-10-22 | |
| 11 | Break screen: "Start break" / "Skip break" labels, dots show 2 of 4 done | ✅ 2026-10-22 | |
| 12 | Settings panel: invalid "sessions before long break" (9) shows error and keeps panel open | ✅ 2026-10-22 | |
| 13 | Settings panel: saving focus 30 while running keeps 25 for the current session | ✅ 2026-10-22 | |
| 14 | Settings panel: dark theme, bell, volume, auto-start breaks saved and survive reload | ✅ 2026-10-22 | |
| 15 | Settings panel at phone width (375 px): fits, no horizontal scroll | ✅ 2026-10-22 | |
| 16 | Keyboard: S skips, Space starts | ✅ 2026-10-22 | |
| 17 | Settings: all controls line up in one column; + / − step by one, hold repeats, arrow keys step, + disabled at max (8 sessions) | ✅ 2026-10-22 | After the stepper fix |
| 18 | Settings: typing 0 for focus shows an error, Cancel discards, saved value stays 25 | ✅ 2026-10-22 | |
| 19 | Auto-start breaks: break starts by itself after focus ends | ⏳ | |
| 20 | Test sound button plays chime and bell at the chosen volume | ⏳ | Needs real speakers |
| 21 | Reduced motion (system setting): no flicker, wobble or burst | ⏳ | |
| 22 | Chime plays and notification appears at phase end | ⏳ | Needs a real run with sound on; check notification permission prompt |
| 23 | Notification permission denied: chime and title still work | ⏳ | |
| 24 | Background tab for 30+ min: alert arrives on time | ⏳ | Set focus to 30 min, switch tab, note when the chime plays |
| 25 | Laptop lid closed mid-session, reopened after end | ⏳ | |
| 26 | Firefox and Safari | ⏳ | |

### F2 – Courses and session log

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | No courses: Light the fuse opens the Courses panel with the add field focused and says "Add a course first" | ✅ 2026-10-22 | |
| 2 | Add a course: it appears in the list and is selected in the picker | ✅ 2026-10-22 | |
| 3 | Adding a duplicate name (other letter case) shows an error and adds nothing | ✅ 2026-10-22 | |
| 4 | Rename: saves on Tab or Enter, picker updates, focus moves on normally | ✅ 2026-10-22 | |
| 5 | While focus runs: picker disabled, that course's delete button disabled | ✅ 2026-10-22 | |
| 6 | Focus ends: entry saved with course, start, end and duration; message "Session logged" | ✅ 2026-10-22 | Saved state edited to end 2 s after reload |
| 7 | Delete a course: gone from list and picker, its time still shows in stats under the old name | ✅ 2026-10-22 | |
| 8 | Delete the selected course: picker goes back to "Pick a course" | ✅ 2026-10-22 | |
| 9 | Re-adding a deleted course's name brings back its old sessions | ✅ 2026-10-22 | |
| 10 | Skip and re-arm during focus log nothing | ⏳ | Covered by unit tests; not checked in the page |
| 11 | Auto-start focus with no course selected does not start | ⏳ | |

### F3 – Stats

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Today tiles: sessions, focused time, day streak | ✅ 2026-10-22 | 1 session, 25 min, streak 3 with sample data |
| 2 | This week vs All time switch: totals per course, highest first, Sunday of last week left out of this week | ✅ 2026-10-22 | Sample sessions added to storage |
| 3 | Empty state: "No focus sessions yet" | ✅ 2026-10-22 | |
| 4 | Light and dark mode, phone width (375 px) with no horizontal scroll | ✅ 2026-10-22 | |
| 6 | Header shows labelled "Courses" and "Settings" buttons; on a phone (375 px) the wordmark hides and both still fit | ✅ 2026-10-22 | |
| 5 | Session that ends after midnight counts for the new day | ⏳ | Covered by unit tests; not checked in the page |

### F4 – Picture-in-picture

The Claude app's built-in browser has the feature but cannot open the window
("Internal error: no window"). Checks 1–6 were run there with the pop-out
window replaced by a frame of the same size in the page, which runs the same code.
They still need a run in real desktop Chrome.

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Pop out shows only the bomb, phase and time; button on the page changes to "Pop in" | ✅ 2026-10-23 | In the frame, 280×150 |
| 2 | Times in the mini window and on the page match while running | ✅ 2026-10-22 | In the frame; 24:58 in both |
| 3 | Skipping focus: mini window switches to the dark break screen | ✅ 2026-10-22 | In the frame, skipped with the Defuse button the first version of the mini window had |
| 4 | Focus ends with the mini window open: boom in both, mini shows the break | ✅ 2026-10-22 | In the frame; no errors |
| 5 | Clicking the mini window closes it; phase and time unchanged | ✅ 2026-10-23 | In the frame |
| 6 | Browser that can't open it: message "works in desktop Chrome and Edge" | ✅ 2026-10-22 | Built-in browser |
| 6a | Light the fuse with "Pop out when the fuse is lit" on: pop-out opens from that click; Hold and Relight don't open a second one | ✅ 2026-10-23 | In the frame; the browser counted it as part of the click |
| 6b | Setting off: Light the fuse doesn't open it | ✅ 2026-10-23 | In the frame |
| 6c | Setting on in a browser that can't open it: timer starts, no error message | ✅ 2026-10-23 | Built-in browser |
| 6d | Mini window can't be scrolled, even while the boom burst flies past its edges | ✅ 2026-10-23 | In the frame: content 236 px tall during the burst in a 148 px window, scroll stays at 0 |
| 7 | Real window in desktop Chrome: opens, can be dragged and resized, bomb and time scale; clicking it brings the tab to the front | ⏳ | |
| 8 | Closing the window with its own close button doesn't change the timer | ⏳ | |
| 9 | Mini window open 30+ min with the main tab in the background: time stays right | ⏳ | |
| 10 | Firefox and Safari: Pop out button hidden | ⏳ | |

## Bugs found

| Date | Bug | How found | Fix |
|---|---|---|---|
| 2026-10-22 | Settings fields not aligned (one had no "min" unit); native number spinners looked bad on hover; close button showed a big focus ring when the panel opened | My own review of the panel | Custom − / + steppers of equal width, shorter "Long break after … sessions" label, focus moves to the panel title on open |
| 2026-10-22 | Local server could not start from the app's preview launcher (`PermissionError` reading the Desktop folder, a macOS privacy restriction) | Starting the dev server | Start it from the terminal with `npm start` instead |

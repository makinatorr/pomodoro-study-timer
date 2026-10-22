import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOCUS, SHORT_BREAK, LONG_BREAK, DEFAULT_SETTINGS,
  createTimer, start, pause, reset, skip, tick, getRemaining,
  validateSetting, applySettings, formatTime, nextPhase, getProgress, shouldAutoStart,
} from '../js/timer.js';

const MIN = 60 * 1000;
const T0 = Date.UTC(2026, 9, 20, 8, 0, 0); // fixed fake clock start

// Runs the current phase to its end and returns the result of tick().
function finishPhase(state, now) {
  const running = start(state, now);
  return tick(running, running.endsAt);
}

test('new timer starts idle in focus with the full default duration', () => {
  const t = createTimer();
  assert.equal(t.phase, FOCUS);
  assert.equal(t.status, 'idle');
  assert.equal(getRemaining(t, T0), 25 * MIN);
});

test('remaining time is computed from timestamps while running', () => {
  const t = start(createTimer(), T0);
  assert.equal(getRemaining(t, T0 + 10 * MIN), 15 * MIN);
  assert.equal(getRemaining(t, T0 + 30 * MIN), 0, 'never negative');
});

test('pause freezes remaining time and resume continues from it', () => {
  let t = start(createTimer(), T0);
  t = pause(t, T0 + 5 * MIN);
  assert.equal(t.status, 'paused');
  // Time passing while paused does not change anything.
  assert.equal(getRemaining(t, T0 + 60 * MIN), 20 * MIN);
  t = start(t, T0 + 60 * MIN);
  assert.equal(getRemaining(t, T0 + 70 * MIN), 10 * MIN);
  assert.equal(t.endsAt, T0 + 80 * MIN);
});

test('phaseStartedAt keeps the first start time across pauses', () => {
  let t = start(createTimer(), T0);
  t = pause(t, T0 + MIN);
  t = start(t, T0 + 10 * MIN);
  assert.equal(t.phaseStartedAt, T0);
});

test('a long gap (sleeping laptop) completes the phase on the next tick', () => {
  const t = start(createTimer(), T0);
  const { state, completed } = tick(t, T0 + 3 * 60 * MIN);
  assert.equal(completed.phase, FOCUS);
  assert.equal(completed.endedAt, T0 + 25 * MIN, 'ended when time ran out, not when we noticed');
  assert.equal(state.phase, SHORT_BREAK);
});

test('tick before the end does nothing', () => {
  const t = start(createTimer(), T0);
  const result = tick(t, T0 + 24 * MIN);
  assert.equal(result.completed, null);
  assert.equal(result.state, t);
});

test('completing focus logs start, end and duration, and the next phase waits', () => {
  const { state, completed } = finishPhase(createTimer(), T0);
  assert.deepEqual(completed, {
    phase: FOCUS, startedAt: T0, endedAt: T0 + 25 * MIN, durationMs: 25 * MIN,
  });
  assert.equal(state.phase, SHORT_BREAK);
  assert.equal(state.status, 'idle', 'next phase does not auto-start');
  assert.equal(state.completedFocus, 1);
});

test('every 4th completed focus session is followed by a long break', () => {
  let t = createTimer();
  let now = T0;
  const phases = [];
  for (let i = 0; i < 8; i++) {
    const { state } = finishPhase(t, now);
    now += 30 * MIN;
    t = state;
    phases.push(t.phase);
  }
  assert.deepEqual(phases, [
    SHORT_BREAK, FOCUS, SHORT_BREAK, FOCUS, SHORT_BREAK, FOCUS, LONG_BREAK, FOCUS,
  ]);
});

test('nextPhase: after any break comes focus', () => {
  assert.equal(nextPhase(SHORT_BREAK, 3, 4), FOCUS);
  assert.equal(nextPhase(LONG_BREAK, 4, 4), FOCUS);
});

test('skipping focus is not logged, not counted, and gives a short break', () => {
  let t = start(createTimer(), T0);
  t = skip(t);
  assert.equal(t.phase, SHORT_BREAK);
  assert.equal(t.status, 'idle');
  assert.equal(t.completedFocus, 0);
});

test('skipping focus after 3 completed sessions still gives a short break', () => {
  let t = createTimer();
  for (let i = 0; i < 6; i++) t = finishPhase(t, T0).state; // 3 focus + 3 breaks
  assert.equal(t.phase, FOCUS);
  assert.equal(t.completedFocus, 3);
  t = skip(t);
  assert.equal(t.phase, SHORT_BREAK);
});

test('skipping a break goes to focus', () => {
  const t = skip(finishPhase(createTimer(), T0).state);
  assert.equal(t.phase, FOCUS);
});

test('reset returns the current phase to full length without logging', () => {
  let t = start(createTimer(), T0);
  t = reset(t);
  assert.equal(t.phase, FOCUS);
  assert.equal(t.status, 'idle');
  assert.equal(t.phaseStartedAt, null);
  assert.equal(getRemaining(t, T0 + 10 * MIN), 25 * MIN);
});

test('start while running changes nothing', () => {
  const t = start(createTimer(), T0);
  assert.equal(start(t, T0 + MIN), t);
});

test('validateSetting accepts whole numbers inside the limits', () => {
  assert.deepEqual(validateSetting('focusMin', '50'), { ok: true, value: 50 });
  assert.deepEqual(validateSetting('focusMin', 1), { ok: true, value: 1 });
  assert.deepEqual(validateSetting('shortBreakMin', '30'), { ok: true, value: 30 });
});

test('validateSetting rejects empty, decimals, text and out-of-range values', () => {
  for (const bad of ['', '  ', '0', '91', '2.5', 'abc', '-5']) {
    assert.equal(validateSetting('focusMin', bad).ok, false, `"${bad}" should be rejected`);
  }
  assert.equal(validateSetting('longBreakMin', '31').ok, false);
  assert.match(validateSetting('focusMin', '0').error, /1 to 90/);
});

test('new settings apply now when idle, and from the next phase when running', () => {
  const settings = { ...DEFAULT_SETTINGS, focusMin: 50, shortBreakMin: 10 };

  const idle = applySettings(createTimer(), settings);
  assert.equal(getRemaining(idle, T0), 50 * MIN);

  let running = start(createTimer(), T0);
  running = applySettings(running, settings);
  assert.equal(getRemaining(running, T0), 25 * MIN, 'current phase unchanged');
  const { state } = tick(running, running.endsAt);
  assert.equal(getRemaining(state, T0), 10 * MIN, 'next phase uses new setting');
});

test('formatTime rounds up to whole seconds and pads', () => {
  assert.equal(formatTime(25 * MIN), '25:00');
  assert.equal(formatTime(61 * 1000), '01:01');
  assert.equal(formatTime(500), '00:01', 'shows 00:01 until it is really over');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(90 * MIN), '90:00');
});

test('validateSetting checks sessions before a long break (2-8)', () => {
  assert.deepEqual(validateSetting('longBreakEvery', '3'), { ok: true, value: 3 });
  assert.equal(validateSetting('longBreakEvery', '1').ok, false);
  assert.match(validateSetting('longBreakEvery', '9').error, /2 to 8 sessions/);
});

test('long break follows the configured number of sessions', () => {
  let t = createTimer({ ...DEFAULT_SETTINGS, longBreakEvery: 2 });
  t = finishPhase(t, T0).state; // focus 1 -> short
  t = finishPhase(t, T0).state; // short -> focus
  t = finishPhase(t, T0).state; // focus 2 -> long
  assert.equal(t.phase, LONG_BREAK);
});

test('getProgress goes from 0 to 1 over the phase', () => {
  const t = start(createTimer(), T0);
  assert.equal(getProgress(t, T0), 0);
  assert.equal(getProgress(t, T0 + 12.5 * MIN), 0.5);
  assert.equal(getProgress(t, T0 + 99 * MIN), 1);
});

test('progress and logged duration use the length the phase started with', () => {
  let t = start(createTimer(), T0);
  t = applySettings(t, { ...DEFAULT_SETTINGS, focusMin: 50 });
  assert.equal(getProgress(t, T0 + 12.5 * MIN), 0.5);
  assert.equal(tick(t, t.endsAt).completed.durationMs, 25 * MIN);
});

test('shouldAutoStart follows the auto-start settings for the next phase', () => {
  const settings = { ...DEFAULT_SETTINGS, autoStartBreaks: true, autoStartFocus: false };
  const afterFocus = finishPhase(createTimer(settings), T0).state;
  assert.equal(shouldAutoStart(afterFocus), true, 'break auto-starts');
  const afterBreak = finishPhase(afterFocus, T0).state;
  assert.equal(shouldAutoStart(afterBreak), false, 'focus waits');
  assert.equal(shouldAutoStart(createTimer()), false, 'off by default');
});

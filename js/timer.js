// Pure timer logic: no DOM, and the current time is always passed in as
// `now`, so tests can use a fake clock. Remaining time is derived from
// timestamps, never from counting ticks, so throttled tabs and sleep are safe.

export const FOCUS = 'focus';
export const SHORT_BREAK = 'shortBreak';
export const LONG_BREAK = 'longBreak';

export const PHASE_LABELS = {
  [FOCUS]: 'Focus',
  [SHORT_BREAK]: 'Short break',
  [LONG_BREAK]: 'Long break',
};

export const DEFAULT_SETTINGS = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

export const LIMITS = {
  focusMin: { min: 1, max: 90, label: PHASE_LABELS[FOCUS], unit: 'minutes' },
  shortBreakMin: { min: 1, max: 30, label: PHASE_LABELS[SHORT_BREAK], unit: 'minutes' },
  longBreakMin: { min: 1, max: 30, label: PHASE_LABELS[LONG_BREAK], unit: 'minutes' },
  longBreakEvery: { min: 2, max: 8, label: 'Sessions before a long break', unit: 'sessions' },
};

const MINUTE = 60 * 1000;

const SETTING_FOR_PHASE = {
  [FOCUS]: 'focusMin',
  [SHORT_BREAK]: 'shortBreakMin',
  [LONG_BREAK]: 'longBreakMin',
};

function phaseDuration(phase, settings) {
  return settings[SETTING_FOR_PHASE[phase]] * MINUTE;
}

// status: 'idle' | 'running' | 'paused'. phaseStartedAt is the first start
// of the phase (kept across pauses) and becomes the logged start time.
function enterPhase(phase, completedFocus, settings) {
  const durationMs = phaseDuration(phase, settings);
  return {
    phase,
    status: 'idle',
    settings: { ...settings },
    completedFocus,
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
    phaseStartedAt: null,
  };
}

export function createTimer(settings = DEFAULT_SETTINGS) {
  return enterPhase(FOCUS, 0, settings);
}

export function nextPhase(phase, completedFocus, longBreakEvery) {
  if (phase !== FOCUS) return FOCUS;
  return completedFocus > 0 && completedFocus % longBreakEvery === 0 ? LONG_BREAK : SHORT_BREAK;
}

export function getRemaining(state, now) {
  return state.status === 'running' ? Math.max(0, state.endsAt - now) : state.remainingMs;
}

// 0 at the start of a phase, 1 when it runs out.
export function getProgress(state, now) {
  return 1 - getRemaining(state, now) / state.durationMs;
}

export function start(state, now) {
  if (state.status === 'running') return state;
  return {
    ...state,
    status: 'running',
    endsAt: now + state.remainingMs,
    phaseStartedAt: state.phaseStartedAt ?? now,
  };
}

export function pause(state, now) {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', remainingMs: getRemaining(state, now), endsAt: null };
}

export function reset(state) {
  return enterPhase(state.phase, state.completedFocus, state.settings);
}

// A skipped focus session is not completed, so it never leads to a long break.
export function skip(state) {
  const next = state.phase === FOCUS ? SHORT_BREAK : FOCUS;
  return enterPhase(next, state.completedFocus, state.settings);
}

// If the running phase has ended, returns the next phase and the finished one
// in `completed` (endedAt = when it ran out, not when we noticed).
export function tick(state, now) {
  if (state.status !== 'running' || now < state.endsAt) {
    return { state, completed: null };
  }
  const completed = {
    phase: state.phase,
    startedAt: state.phaseStartedAt,
    endedAt: state.endsAt,
    durationMs: state.durationMs,
  };
  const completedFocus = state.completedFocus + (state.phase === FOCUS ? 1 : 0);
  const phase = nextPhase(state.phase, completedFocus, state.settings.longBreakEvery);
  return { state: enterPhase(phase, completedFocus, state.settings), completed };
}

export function shouldAutoStart(state) {
  return state.phase === FOCUS ? state.settings.autoStartFocus : state.settings.autoStartBreaks;
}

export function validateSetting(key, raw) {
  const { min, max, label, unit } = LIMITS[key];
  const text = String(raw).trim();
  const value = Number(text);
  if (text === '' || !Number.isInteger(value) || value < min || value > max) {
    return { ok: false, error: `${label} must be a whole number from ${min} to ${max} ${unit}.` };
  }
  return { ok: true, value };
}

// A phase that has already started keeps its length; new settings apply next.
export function applySettings(state, settings) {
  const next = { ...state, settings: { ...settings } };
  if (state.status === 'idle') {
    next.durationMs = phaseDuration(state.phase, settings);
    next.remainingMs = next.durationMs;
  }
  return next;
}

export function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

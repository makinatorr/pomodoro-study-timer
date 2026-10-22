import {
  PHASE_LABELS, LIMITS, FOCUS, LONG_BREAK,
  createTimer, start, pause, reset, skip, tick, getRemaining, getProgress,
  shouldAutoStart, validateSetting, applySettings, formatTime,
} from './timer.js';
import { playSound, unlockSound, askNotificationPermission, notify } from './alerts.js';
import { bombDrawer, explode } from './bomb.js';
import { setupStepper } from './stepper.js';
import { load, save } from './storage.js';
import { selectedCourse, logSession, setLocked, askForCourse } from './study.js';
import { miniSupported, isMiniOpen, openMini, closeMini, renderMini, explodeMini } from './mini.js';

const STORAGE_KEY = 'ttb.timer.v1';
const PREFS_KEY = 'ttb.prefs.v1';
const DEFAULT_PREFS = { sound: 'chime', volume: 70, theme: 'system', autoPopOut: true };
const DISPLAY_INTERVAL_MS = 250;
const FINAL_SECONDS_MS = 10 * 1000;
// A phase that ended longer ago than this (page closed) completes silently.
const LATE_ALERT_LIMIT_MS = 60 * 1000;

const BUTTONS = {
  focus: { idle: 'Light the fuse', running: 'Hold', paused: 'Relight', skip: 'Defuse' },
  break: { idle: 'Start break', running: 'Pause', paused: 'Resume', skip: 'Skip break' },
};

const $ = id => document.getElementById(id);
const el = {
  time: $('time'),
  phaseName: $('phase-name'),
  dots: $('cycle-dots'),
  bombWrap: $('bomb-wrap'),
  startPause: $('start-pause'),
  reset: $('reset'),
  skip: $('skip'),
  popOut: $('pop-out'),
  status: $('status'),
  dialog: $('settings'),
  form: $('settings-form'),
  errors: $('settings-errors'),
};
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const drawBomb = bombDrawer(el.bombWrap);

let state = load(STORAGE_KEY, isValidState) ?? createTimer();
let prefs = { ...DEFAULT_PREFS, ...load(PREFS_KEY, Boolean) };
let endTimeout = null;

function isValidState(saved) {
  return PHASE_LABELS[saved?.phase] && saved.settings && typeof saved.durationMs === 'number';
}

function setState(next, message = '') {
  state = next;
  el.status.textContent = message;
  save(STORAGE_KEY, state);
  scheduleEnd();
  render();
}

// One-off timeouts are throttled less than repeating ones in background tabs,
// so this keeps the alert on time while the display interval may lag.
function scheduleEnd() {
  clearTimeout(endTimeout);
  if (state.status === 'running') {
    endTimeout = setTimeout(update, Math.max(0, state.endsAt - Date.now()) + 50);
  }
}

function update() {
  const now = Date.now();
  const { state: next, completed } = tick(state, now);
  if (completed) onPhaseComplete(next, completed, now - completed.endedAt <= LATE_ALERT_LIMIT_MS, now);
  else render();
}

function onPhaseComplete(next, completed, onTime, now) {
  const wasFocus = completed.phase === FOCUS;
  if (wasFocus) logSession(completed);
  const message = !wasFocus
    ? "Break's over. Ready to light the next fuse?"
    : next.phase === LONG_BREAK
      ? `Boom! ${next.settings.longBreakEvery} sessions down. Take a long break.`
      : `Boom! Session logged. Take ${next.settings.shortBreakMin} minutes.`;
  // Focus never starts by itself without a course.
  const autoStart = onTime && shouldAutoStart(next) && (wasFocus || selectedCourse());

  setState(autoStart ? start(next, now) : next, message);
  if (!onTime) return;
  playSound(prefs.sound, prefs.volume);
  notify(wasFocus ? 'Boom! Focus session done' : 'Break over', message);
  if (wasFocus) {
    explode(el.bombWrap);
    explodeMini();
  }
}

function themeMode() {
  if (state.phase !== FOCUS) return 'dark';
  if (prefs.theme === 'system') return darkQuery.matches ? 'dark' : 'light';
  return prefs.theme;
}

function renderDots() {
  const every = state.settings.longBreakEvery;
  const done = state.completedFocus;
  const isFocus = state.phase === FOCUS;
  // During a break, the session that just finished still belongs to this cycle.
  const doneInCycle = isFocus || done === 0 ? done % every : ((done - 1) % every) + 1;

  if (el.dots.children.length !== every) {
    el.dots.replaceChildren(...Array.from({ length: every }, () => document.createElement('span')));
  }
  [...el.dots.children].forEach((dot, i) => {
    dot.className = i < doneInCycle ? 'done' : isFocus && i === doneInCycle ? 'current' : '';
  });
  el.dots.setAttribute('aria-label', isFocus
    ? `Session ${doneInCycle + 1} of ${every}`
    : `${doneInCycle} of ${every} sessions done`);
}

function render() {
  const now = Date.now();
  const remaining = getRemaining(state, now);
  const time = formatTime(remaining);
  const label = PHASE_LABELS[state.phase];
  const buttons = BUTTONS[state.phase === FOCUS ? 'focus' : 'break'];
  const running = state.status === 'running';
  const finalSeconds = running && state.phase === FOCUS && remaining <= FINAL_SECONDS_MS;
  const mode = themeMode();
  const progress = getProgress(state, now);

  document.body.dataset.phase = state.phase;
  document.body.dataset.mode = mode;
  document.body.classList.toggle('running', running);
  document.body.classList.toggle('final-seconds', finalSeconds);

  el.time.textContent = time;
  el.phaseName.textContent = label;
  el.startPause.textContent = buttons[state.status];
  el.skip.textContent = buttons.skip;
  renderDots();
  drawBomb(progress);
  setLocked(state.phase === FOCUS && state.status !== 'idle');
  el.popOut.textContent = isMiniOpen() ? 'Pop in' : 'Pop out';
  renderMini({
    phase: state.phase,
    mode,
    running,
    finalSeconds,
    progress,
    label,
    time,
  });

  document.title = state.status === 'idle'
    ? 'Thinking Time Bomb'
    : `${time} · ${label}${state.status === 'paused' ? ' (paused)' : ''}`;
}

function startPause() {
  const now = Date.now();
  if (state.status === 'running') {
    setState(pause(state, now));
    return;
  }
  if (state.phase === FOCUS && state.status === 'idle' && !selectedCourse()) {
    el.status.textContent = askForCourse();
    return;
  }
  // Browsers only allow sound and permission prompts from a user action.
  unlockSound();
  askNotificationPermission();
  setState(start(state, now));
  // The click that lights the fuse may open the pop-out; a tab switch may not.
  if (state.phase === FOCUS && prefs.autoPopOut && miniSupported && !isMiniOpen()) {
    popOut({ quiet: true });
  }
}

// quiet: when the user didn't ask for it, a failure shows no message.
async function popOut({ quiet = false } = {}) {
  try {
    await openMini({ onTick: update, onClose: render });
    render();
  } catch {
    if (!quiet) {
      el.status.textContent = "This browser couldn't open the pop-out. It works in desktop Chrome and Edge.";
    }
  }
}

el.startPause.addEventListener('click', startPause);
el.reset.addEventListener('click', () => setState(reset(state)));

el.popOut.hidden = !miniSupported;
el.form.elements.autoPopOut.closest('.field').hidden = !miniSupported;
el.popOut.addEventListener('click', () => (isMiniOpen() ? closeMini() : popOut()));
el.skip.addEventListener('click', () => setState(skip(state)));

document.addEventListener('keydown', (event) => {
  if (document.querySelector('dialog[open]') || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest('input, select, textarea')) return;
  // A focused button already handles Space itself.
  if (event.code === 'Space' && !event.target.closest('button, a')) {
    event.preventDefault();
    startPause();
  } else if (event.key.toLowerCase() === 'r') {
    setState(reset(state));
  } else if (event.key.toLowerCase() === 's') {
    setState(skip(state));
  }
});

const fields = el.form.elements;
const refreshSteppers = Object.keys(LIMITS).map(key =>
  setupStepper(fields[key].closest('.stepper'), LIMITS[key]));

$('open-settings').addEventListener('click', () => {
  for (const key of Object.keys(LIMITS)) {
    fields[key].value = state.settings[key];
    fields[key].setAttribute('aria-invalid', 'false');
  }
  fields.autoStartBreaks.checked = state.settings.autoStartBreaks;
  fields.autoStartFocus.checked = state.settings.autoStartFocus;
  fields.sound.value = prefs.sound;
  fields.volume.value = prefs.volume;
  fields.theme.value = prefs.theme;
  fields.autoPopOut.checked = prefs.autoPopOut;
  refreshSteppers.forEach(refresh => refresh());
  el.errors.replaceChildren();
  el.dialog.showModal();
});

$('close-settings').addEventListener('click', () => el.dialog.close());
$('cancel-settings').addEventListener('click', () => el.dialog.close());

// Click on the dark backdrop (outside the drawer) closes it.
el.dialog.addEventListener('click', (event) => {
  if (event.target === el.dialog) el.dialog.close();
});

$('test-sound').addEventListener('click', () => {
  unlockSound();
  playSound(fields.sound.value, Number(fields.volume.value));
});

el.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const errors = [];
  const settings = {
    ...state.settings,
    autoStartBreaks: fields.autoStartBreaks.checked,
    autoStartFocus: fields.autoStartFocus.checked,
  };
  for (const key of Object.keys(LIMITS)) {
    const result = validateSetting(key, fields[key].value);
    fields[key].setAttribute('aria-invalid', String(!result.ok));
    if (result.ok) settings[key] = result.value;
    else errors.push(result.error);
  }
  el.errors.replaceChildren(...errors.map(text => {
    const li = document.createElement('li');
    li.textContent = text;
    return li;
  }));
  if (errors.length > 0) return;

  prefs = {
    sound: fields.sound.value,
    volume: Number(fields.volume.value),
    theme: fields.theme.value,
    autoPopOut: fields.autoPopOut.checked,
  };
  save(PREFS_KEY, prefs);
  el.dialog.close();
  setState(applySettings(state, settings), 'Settings saved.');
});

darkQuery.addEventListener('change', render);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) update();
});

scheduleEnd();
update(); // the phase may have ended while the page was closed
setInterval(update, DISPLAY_INTERVAL_MS);

// Courses, the session log, the course picker and the Courses panel.
import {
  activeCourses, validateCourseName, addCourse, renameCourse, deleteCourse, courseName,
} from './courses.js';
import { todayStats, weekRange, timeByCourse, streak, formatMinutes } from './stats.js';
import { load, save } from './storage.js';

const DATA_KEY = 'ttb.study.v1';
const MANAGE = 'manage';

const $ = id => document.getElementById(id);
const picker = $('course');
const dialog = $('log');
const list = $('course-list');
const addForm = $('add-course');
const courseError = $('course-error');
const bars = $('course-bars');

let data = load(DATA_KEY, d => Array.isArray(d?.courses) && Array.isArray(d.log))
  ?? { courses: [], selectedId: null, log: [] };
// True while a focus session is under way: its course can't change or be deleted.
let locked = false;

// A rename keeps the list as it is, so focus isn't lost when tabbing on.
function update(changes, { keepList = false } = {}) {
  data = { ...data, ...changes };
  save(DATA_KEY, data);
  renderPicker();
  if (!dialog.open) return;
  renderStats();
  if (!keepList) renderCourseList();
}

export function selectedCourse() {
  return activeCourses(data.courses).find(c => c.id === data.selectedId) ?? null;
}

export function logSession({ startedAt, endedAt, durationMs }) {
  update({ log: [...data.log, { courseId: data.selectedId, startedAt, endedAt, durationMs }] });
}

export function setLocked(value) {
  if (locked === value) return;
  locked = value;
  picker.disabled = value;
}

// Called when focus is started without a course. Returns the message to show.
export function askForCourse() {
  if (activeCourses(data.courses).length === 0) {
    openLog(true);
    return 'Add a course first, then light the fuse.';
  }
  picker.focus();
  return 'Pick a course first.';
}

function option(value, text) {
  const el = document.createElement('option');
  el.value = value;
  el.textContent = text;
  return el;
}

function renderPicker() {
  const placeholder = option('', 'Pick a course');
  placeholder.disabled = true;
  picker.replaceChildren(
    placeholder,
    ...activeCourses(data.courses).map(c => option(c.id, c.name)),
    option(MANAGE, 'Add or edit courses…'),
  );
  picker.value = selectedCourse()?.id ?? '';
}

function renderStats() {
  const now = Date.now();
  const today = todayStats(data.log, now);
  $('today-sessions').textContent = today.sessions;
  $('today-time').textContent = formatMinutes(today.minutes);
  $('streak').textContent = streak(data.log, now);

  const range = dialog.querySelector('[name="range"]:checked').value;
  const rows = timeByCourse(data.log, range === 'week' ? weekRange(now) : undefined);
  const max = Math.max(...rows.map(r => r.minutes), 1);
  bars.replaceChildren(...rows.map(({ courseId, minutes }) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="bar-name"></span><span class="bar-value"></span><span class="bar"><span></span></span>';
    li.querySelector('.bar-name').textContent = courseName(data.courses, courseId);
    li.querySelector('.bar-value').textContent = formatMinutes(minutes);
    li.querySelector('.bar span').style.width = `${(minutes / max) * 100}%`;
    return li;
  }));
  $('bars-empty').hidden = rows.length > 0;
}

function renderCourseList() {
  list.replaceChildren(...activeCourses(data.courses).map(course => {
    const li = document.createElement('li');
    li.innerHTML = `<input class="course-name" maxlength="30" aria-label="Course name">
      <button class="icon-btn" type="button"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>`;
    const input = li.querySelector('input');
    const remove = li.querySelector('button');
    input.value = course.name;
    input.dataset.id = course.id;
    remove.dataset.id = course.id;
    remove.setAttribute('aria-label', `Delete ${course.name}`);
    if (locked && course.id === data.selectedId) {
      remove.disabled = true;
      remove.title = 'In use by the current focus session';
    }
    return li;
  }));
}

export function openLog(focusAdd = false) {
  courseError.textContent = '';
  renderStats();
  renderCourseList();
  dialog.showModal();
  if (focusAdd) addForm.elements.name.focus();
}

picker.addEventListener('change', () => {
  if (picker.value === MANAGE) {
    picker.value = selectedCourse()?.id ?? '';
    openLog(true);
  } else {
    update({ selectedId: picker.value });
  }
});

addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = validateCourseName(data.courses, addForm.elements.name.value);
  courseError.textContent = result.ok ? '' : result.error;
  if (!result.ok) {
    addForm.elements.name.select();
    return;
  }
  const added = addCourse(data.courses, result.value, crypto.randomUUID());
  update({ courses: added.courses, selectedId: selectedCourse() ? data.selectedId : added.id });
  addForm.reset();
});

// Renames save when the field loses focus; Enter does the same.
list.addEventListener('change', (event) => {
  const { id } = event.target.dataset;
  const result = validateCourseName(data.courses, event.target.value, id);
  courseError.textContent = result.ok ? '' : result.error;
  if (result.ok) {
    event.target.value = result.value;
    event.target.nextElementSibling.setAttribute('aria-label', `Delete ${result.value}`);
    update({ courses: renameCourse(data.courses, id, result.value) }, { keepList: true });
  } else {
    event.target.value = courseName(data.courses, id);
  }
});

list.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches('input')) event.target.blur();
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  const { id } = button.dataset;
  courseError.textContent = '';
  update({
    courses: deleteCourse(data.courses, id),
    selectedId: data.selectedId === id ? null : data.selectedId,
  });
});

dialog.addEventListener('change', (event) => {
  if (event.target.name === 'range') renderStats();
});

$('open-log').addEventListener('click', () => openLog());
$('close-log').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

renderPicker();

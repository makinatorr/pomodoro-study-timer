// Pure stats over the session log. A session counts towards the local date it
// ended on, and `now` is passed in so tests can use a fake clock.
// Log entry: { courseId, startedAt, endedAt, durationMs }.

const MINUTE = 60 * 1000;

function startOfDay(time) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date;
}

// setDate (not adding 24 h) keeps midnight right across daylight saving.
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const dayKey = time => startOfDay(time).getTime();

function sumMinutes(sessions) {
  return Math.round(sessions.reduce((sum, s) => sum + s.durationMs, 0) / MINUTE);
}

export function todayStats(log, now) {
  const from = startOfDay(now);
  const to = addDays(from, 1);
  const today = log.filter(s => s.endedAt >= from && s.endedAt < to);
  return { sessions: today.length, minutes: sumMinutes(today) };
}

// Monday 00:00 to the next Monday 00:00, local time.
export function weekRange(now) {
  const today = startOfDay(now);
  const from = addDays(today, -((today.getDay() + 6) % 7));
  return { from: from.getTime(), to: addDays(from, 7).getTime() };
}

// Focus minutes per course, highest first. Without a range: all time.
export function timeByCourse(log, { from = -Infinity, to = Infinity } = {}) {
  const totals = new Map();
  for (const s of log) {
    if (s.endedAt >= from && s.endedAt < to) {
      totals.set(s.courseId, (totals.get(s.courseId) ?? 0) + s.durationMs);
    }
  }
  return [...totals]
    .sort((a, b) => b[1] - a[1])
    .map(([courseId, ms]) => ({ courseId, minutes: Math.round(ms / MINUTE) }));
}

// Consecutive days with a session. Without one today, it counts up to yesterday.
export function streak(log, now) {
  const days = new Set(log.map(s => dayKey(s.endedAt)));
  let day = startOfDay(now);
  if (!days.has(day.getTime())) day = addDays(day, -1);
  let count = 0;
  while (days.has(day.getTime())) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

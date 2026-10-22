import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayStats, weekRange, timeByCourse, streak, formatMinutes } from '../js/stats.js';

const MIN = 60 * 1000;
// Local times, so the tests pass in any time zone. 22 Oct 2026 is a Thursday.
const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();
const NOW = at(22, 15);

function session(courseId, endedAt, minutes = 25) {
  return { courseId, startedAt: endedAt - minutes * MIN, endedAt, durationMs: minutes * MIN };
}

test('today counts sessions that ended today', () => {
  const log = [session('a', at(22, 9)), session('b', at(22, 14)), session('a', at(21, 20))];
  assert.deepEqual(todayStats(log, NOW), { sessions: 2, minutes: 50 });
});

test('a session that ends after midnight counts for the new day', () => {
  const log = [session('a', at(22, 0, 10))]; // started 21 Oct at 23:45
  assert.deepEqual(todayStats(log, NOW), { sessions: 1, minutes: 25 });
});

test('the week runs Monday to Sunday', () => {
  const { from, to } = weekRange(NOW);
  assert.equal(from, at(19, 0));
  assert.equal(to, at(26, 0));
  assert.deepEqual(weekRange(at(25, 23)), { from, to }, 'Sunday is the last day');
  assert.equal(weekRange(at(26, 0)).from, at(26, 0), 'Monday starts a new week');
});

test('time per course this week, highest first', () => {
  const log = [
    session('a', at(19, 10)),
    session('b', at(20, 10), 50),
    session('a', at(22, 10), 20),
    session('b', at(18, 23, 59)), // Sunday last week
  ];
  assert.deepEqual(timeByCourse(log, weekRange(NOW)), [
    { courseId: 'b', minutes: 50 },
    { courseId: 'a', minutes: 45 },
  ]);
});

test('time per course for all time', () => {
  const log = [session('a', at(1, 10)), session('b', at(20, 10), 50), session('a', at(22, 10), 45)];
  assert.deepEqual(timeByCourse(log), [
    { courseId: 'a', minutes: 70 },
    { courseId: 'b', minutes: 50 },
  ]);
});

test('no sessions gives empty stats', () => {
  assert.deepEqual(todayStats([], NOW), { sessions: 0, minutes: 0 });
  assert.deepEqual(timeByCourse([]), []);
  assert.equal(streak([], NOW), 0);
});

test('streak counts consecutive days including today', () => {
  const log = [session('a', at(20, 10)), session('a', at(21, 10)), session('a', at(22, 10))];
  assert.equal(streak(log, NOW), 3);
});

test('streak counts up to yesterday when nothing is done today yet', () => {
  const log = [session('a', at(20, 10)), session('a', at(21, 23))];
  assert.equal(streak(log, NOW), 2);
});

test('a missed day breaks the streak', () => {
  const log = [session('a', at(19, 10)), session('a', at(21, 10)), session('a', at(22, 10))];
  assert.equal(streak(log, NOW), 2);
  assert.equal(streak([session('a', at(20, 10))], NOW), 0);
});

test('formatMinutes shows hours and minutes', () => {
  assert.equal(formatMinutes(0), '0 min');
  assert.equal(formatMinutes(45), '45 min');
  assert.equal(formatMinutes(60), '1 h');
  assert.equal(formatMinutes(125), '2 h 5 min');
});

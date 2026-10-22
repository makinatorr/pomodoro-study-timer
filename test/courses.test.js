import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  activeCourses, validateCourseName, addCourse, renameCourse, deleteCourse, courseName,
} from '../js/courses.js';

const COURSES = [{ id: 'a', name: 'DAVE3625' }, { id: 'b', name: 'DATA3730' }];

test('validateCourseName trims and collapses spaces', () => {
  assert.deepEqual(validateCourseName([], '  Web   dev  '), { ok: true, value: 'Web dev' });
});

test('validateCourseName rejects empty, too long and duplicate names', () => {
  assert.equal(validateCourseName([], '   ').ok, false);
  assert.equal(validateCourseName([], 'x'.repeat(31)).ok, false);
  assert.equal(validateCourseName([], 'x'.repeat(30)).ok, true);
  assert.match(validateCourseName(COURSES, 'dave3625').error, /already have/);
});

test('a course may keep its own name when renamed', () => {
  assert.equal(validateCourseName(COURSES, 'DAVE3625', 'a').ok, true);
  assert.equal(validateCourseName(COURSES, 'DAVE3625', 'b').ok, false);
});

test('the name of a deleted course can be used again', () => {
  const courses = deleteCourse(COURSES, 'a');
  assert.equal(validateCourseName(courses, 'DAVE3625').ok, true);
});

test('addCourse appends a new course with the given id', () => {
  const result = addCourse(COURSES, 'MATH1100', 'c');
  assert.equal(result.id, 'c');
  assert.deepEqual(result.courses.at(-1), { id: 'c', name: 'MATH1100' });
});

test('adding the name of a deleted course brings the old course back', () => {
  const courses = deleteCourse(COURSES, 'a');
  const result = addCourse(courses, 'dave3625', 'new');
  assert.equal(result.id, 'a', 'old sessions stay with the same course');
  assert.deepEqual(result.courses[0], { id: 'a', name: 'dave3625' });
  assert.equal(result.courses.length, 2);
});

test('deleting hides the course but keeps its name for old sessions', () => {
  const courses = deleteCourse(COURSES, 'a');
  assert.deepEqual(activeCourses(courses).map(c => c.id), ['b']);
  assert.equal(courseName(courses, 'a'), 'DAVE3625');
});

test('renameCourse changes only that course', () => {
  const courses = renameCourse(COURSES, 'b', 'Data science');
  assert.equal(courseName(courses, 'b'), 'Data science');
  assert.equal(courseName(courses, 'a'), 'DAVE3625');
});

test('courseName for a missing course', () => {
  assert.equal(courseName(COURSES, null), 'No course');
});

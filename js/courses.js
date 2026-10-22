// Pure course list logic. A deleted course stays in the list, marked
// `deleted`, so logged sessions keep showing its name.

export const NAME_MAX = 30;

export function activeCourses(courses) {
  return courses.filter(course => !course.deleted);
}

const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

// exceptId: the course being renamed, which may keep its own name.
export function validateCourseName(courses, raw, exceptId = null) {
  const name = String(raw).trim().replace(/\s+/g, ' ');
  if (name === '') return { ok: false, error: 'Give the course a name.' };
  if (name.length > NAME_MAX) {
    return { ok: false, error: `Course names can be at most ${NAME_MAX} characters.` };
  }
  if (activeCourses(courses).some(c => c.id !== exceptId && sameName(c.name, name))) {
    return { ok: false, error: `You already have a course called ${name}.` };
  }
  return { ok: true, value: name };
}

// Adding the name of a deleted course brings it back, so its old sessions
// and new ones count as one course.
export function addCourse(courses, name, newId) {
  const old = courses.find(c => c.deleted && sameName(c.name, name));
  if (old) {
    return {
      courses: courses.map(c => (c === old ? { id: c.id, name } : c)),
      id: old.id,
    };
  }
  return { courses: [...courses, { id: newId, name }], id: newId };
}

export function renameCourse(courses, id, name) {
  return courses.map(c => (c.id === id ? { ...c, name } : c));
}

export function deleteCourse(courses, id) {
  return courses.map(c => (c.id === id ? { ...c, deleted: true } : c));
}

export function courseName(courses, id) {
  return courses.find(c => c.id === id)?.name ?? 'No course';
}

export function load(key, isValid) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (isValid(saved)) return saved;
  } catch {
    // Corrupt or blocked storage: use defaults.
  }
  return null;
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked storage (private mode): works, but not across reloads.
  }
}

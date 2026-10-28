// Small localStorage wrapper. Storage can be unavailable (private mode, quota),
// so every access is guarded and falls back to the provided default.

export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Non-fatal: the app keeps working with in-memory state
  }
}

export const KEYS = {
  timer: 'taskflow.timer.v1',
  sessions: 'taskflow.focusSessions.v1',
  tone: 'taskflow.tone.v1',
}

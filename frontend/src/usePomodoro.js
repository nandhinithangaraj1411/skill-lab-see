import { useCallback, useEffect, useState } from 'react'
import { KEYS, loadJSON, saveJSON } from './storage'

export const MODES = {
  focus: { label: 'Focus', minutes: 25 },
  short: { label: 'Short break', minutes: 5 },
  long: { label: 'Long break', minutes: 15 },
}
export const LONG_BREAK_EVERY = 4

const durationMs = (mode) => MODES[mode].minutes * 60 * 1000
const BASE_TITLE = 'TaskFlow — Lock In'

const INITIAL_TIMER = {
  mode: 'focus',
  status: 'idle', // idle | running | paused
  endsAt: null, // epoch ms, only while running
  remainingMs: durationMs('focus'), // used while idle/paused
  taskId: null,
  taskTitle: null,
  cycleCount: 0, // focus sessions completed in this cycle
  lastCompleted: null, // { mode, taskId, taskTitle, at } until dismissed
}

function loadTimer() {
  const saved = loadJSON(KEYS.timer, null)
  if (!saved || !MODES[saved.mode] || !['idle', 'running', 'paused'].includes(saved.status)) {
    return INITIAL_TIMER
  }
  if (saved.status === 'running' && typeof saved.endsAt !== 'number') return INITIAL_TIMER
  return { ...INITIAL_TIMER, ...saved }
}

function loadSessions() {
  const saved = loadJSON(KEYS.sessions, [])
  return Array.isArray(saved) ? saved.filter((s) => s && s.id && s.completedAt && s.minutes > 0) : []
}

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Timestamp-based Pomodoro timer. The remaining time is always derived from
// `endsAt - now`, so background tabs, throttled intervals and reloads stay accurate.
export function usePomodoro() {
  const [timer, setTimer] = useState(loadTimer)
  const [sessions, setSessions] = useState(loadSessions)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => saveJSON(KEYS.timer, timer), [timer])
  useEffect(() => saveJSON(KEYS.sessions, sessions), [sessions])

  const running = timer.status === 'running'

  // Tick only while running; the interval is always cleaned up
  useEffect(() => {
    if (!running) return undefined
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [running])

  const total = durationMs(timer.mode)
  const remainingMs = running
    ? Math.min(total, Math.max(0, timer.endsAt - now))
    : timer.remainingMs
  const expired = running && now >= timer.endsAt

  // Finish the session once time is up (also handles expiry while the tab was closed).
  // Sessions are keyed by endsAt, so a repeated run cannot record a duplicate.
  useEffect(() => {
    if (!expired) return
    const finished = timer
    if (finished.mode === 'focus') {
      const session = {
        id: String(finished.endsAt),
        taskId: finished.taskId,
        taskTitle: finished.taskTitle,
        minutes: MODES.focus.minutes,
        completedAt: new Date(finished.endsAt).toISOString(),
      }
      setSessions((prev) => (prev.some((s) => s.id === session.id) ? prev : [...prev, session].slice(-500)))
    }
    const cycleCount = finished.mode === 'focus' ? finished.cycleCount + 1 : finished.cycleCount
    const nextMode =
      finished.mode === 'focus' ? (cycleCount % LONG_BREAK_EVERY === 0 ? 'long' : 'short') : 'focus'
    // Suggest the next mode, but wait for the user to start it
    setTimer({
      ...finished,
      mode: nextMode,
      status: 'idle',
      endsAt: null,
      remainingMs: durationMs(nextMode),
      cycleCount: nextMode === 'focus' && finished.mode === 'long' ? 0 : cycleCount,
      lastCompleted: { mode: finished.mode, taskId: finished.taskId, taskTitle: finished.taskTitle, at: finished.endsAt },
    })
  }, [expired, timer])

  // Show the countdown in the browser tab while a session is active
  const clock = formatClock(remainingMs)
  useEffect(() => {
    if (timer.status === 'idle') return undefined
    document.title = `${timer.status === 'paused' ? '⏸ ' : ''}${clock} · ${MODES[timer.mode].label} — TaskFlow`
    return () => {
      document.title = BASE_TITLE
    }
  }, [clock, timer.status, timer.mode])

  const start = useCallback(() => {
    const startedAt = Date.now()
    setNow(startedAt)
    setTimer((t) =>
      t.status === 'running' ? t : { ...t, status: 'running', endsAt: startedAt + t.remainingMs, lastCompleted: null }
    )
  }, [])

  const pause = useCallback(() => {
    setTimer((t) =>
      t.status !== 'running'
        ? t
        : { ...t, status: 'paused', remainingMs: Math.max(0, t.endsAt - Date.now()), endsAt: null }
    )
  }, [])

  const reset = useCallback(() => {
    setTimer((t) => ({ ...t, status: 'idle', endsAt: null, remainingMs: durationMs(t.mode) }))
  }, [])

  const setMode = useCallback((mode) => {
    setTimer((t) =>
      t.status === 'running'
        ? t
        : { ...t, mode, status: 'idle', endsAt: null, remainingMs: durationMs(mode), lastCompleted: null }
    )
  }, [])

  const selectTask = useCallback((task) => {
    setTimer((t) => ({ ...t, taskId: task?._id ?? null, taskTitle: task?.title ?? null }))
  }, [])

  const dismissCompleted = useCallback(() => {
    setTimer((t) => ({ ...t, lastCompleted: null }))
  }, [])

  return {
    timer,
    sessions,
    remainingMs,
    totalMs: total,
    progress: total ? 1 - remainingMs / total : 0,
    clock,
    start,
    pause,
    reset,
    setMode,
    selectTask,
    dismissCompleted,
  }
}

// Shared date + task helpers. Due dates are stored as UTC midnight, so they are
// compared by their YYYY-MM-DD part against the user's local calendar day.

const DAY_MS = 24 * 60 * 60 * 1000
const pad = (n) => String(n).padStart(2, '0')

export function localISO(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const todayISO = () => localISO()

export const dueDay = (task) => (task.dueDate ? task.dueDate.slice(0, 10) : null)

export const isActive = (task) => task.status !== 'completed'

export function isOverdue(task, today = todayISO()) {
  const day = dueDay(task)
  return Boolean(day && isActive(task) && day < today)
}

// Whole calendar days from today until the due day (negative = overdue)
export function daysUntilDue(task, today = todayISO()) {
  const day = dueDay(task)
  if (!day) return null
  return Math.round((Date.parse(day) - Date.parse(today)) / DAY_MS)
}

export function dueCountdown(task) {
  const days = daysUntilDue(task)
  if (days === null) return null
  if (task.status === 'completed') return null
  if (days < -1) return `${-days} days overdue`
  if (days === -1) return '1 day overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

export function formatDueDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Tasks completed before completedAt existed fall back to updatedAt
export function completedOn(task) {
  if (task.status !== 'completed') return null
  const ts = task.completedAt || task.updatedAt
  return ts ? localISO(new Date(ts)) : null
}

export function formatMinutes(min) {
  if (!min) return '0m'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

// Most urgent first: overdue, then soonest due date, then priority
export function byUrgency(a, b) {
  const da = daysUntilDue(a) ?? Infinity
  const db = daysUntilDue(b) ?? Infinity
  if (da !== db) return da - db
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
}

export function computeTaskStats(tasks, sessions) {
  const today = todayISO()
  const counts = { todo: 0, 'in-progress': 0, completed: 0 }
  let overdue = 0
  let dueToday = 0
  let completedToday = 0
  for (const t of tasks) {
    counts[t.status] = (counts[t.status] || 0) + 1
    if (isOverdue(t, today)) overdue++
    if (isActive(t) && dueDay(t) === today) dueToday++
    if (completedOn(t) === today) completedToday++
  }
  const total = tasks.length
  const active = counts.todo + counts['in-progress']
  const todaysSessions = sessions.filter((s) => localISO(new Date(s.completedAt)) === today)
  const focusMinutesToday = todaysSessions.reduce((sum, s) => sum + s.minutes, 0)
  // Today's plan = what's done today + what's due today or already late
  const planned = completedToday + dueToday + overdue
  const dailyProgress = planned ? Math.round((completedToday / planned) * 100) : 0
  const completionRate = total ? Math.round((counts.completed / total) * 100) : 0
  return {
    counts, total, active, overdue, dueToday, completedToday,
    focusMinutesToday, focusSessionsToday: todaysSessions.length, planned, dailyProgress, completionRate,
  }
}

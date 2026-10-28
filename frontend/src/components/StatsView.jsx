import { useMemo } from 'react'
import { PRIORITIES } from '../constants'
import { completedOn, formatMinutes, isActive, localISO } from '../utils'

function lastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      iso: localISO(d),
      short: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      long: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    })
  }
  return days
}

// Single-series bar chart: one hue, values on hover/focus, hidden table for screen readers
function BarChart({ title, data, format }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <figure className="card chart">
      <figcaption className="card-head">
        <h2>{title}</h2>
        <span className="muted-text">Total {format(data.reduce((n, d) => n + d.value, 0))}</span>
      </figcaption>
      <div className="bars" aria-hidden="true">
        {data.map((d) => (
          <div key={d.iso} className="bar-col">
            <span className="bar-tip">{d.long}: {format(d.value)}</span>
            <div className="bar-track">
              <div
                className={`bar${d.value === 0 ? ' empty' : ''}`}
                style={{ height: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className={`bar-label${d.short === 'Today' ? ' today' : ''}`}>{d.short}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.iso}><th scope="row">{d.long}</th><td>{format(d.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export default function StatsView({ tasks, sessions, stats }) {
  const data = useMemo(() => {
    const days = lastNDays(7)
    const focusByDay = days.map((d) => ({
      ...d,
      value: sessions.filter((s) => localISO(new Date(s.completedAt)) === d.iso).reduce((n, s) => n + s.minutes, 0),
    }))
    const doneByDay = days.map((d) => ({ ...d, value: tasks.filter((t) => completedOn(t) === d.iso).length }))

    const active = tasks.filter(isActive)
    const byPriority = PRIORITIES.map((p) => ({
      ...p,
      count: active.filter((t) => t.priority === p.value).length,
    }))

    const weekFocus = focusByDay.reduce((n, d) => n + d.value, 0)
    const totalFocus = sessions.reduce((n, s) => n + s.minutes, 0)
    const estimated = active.reduce((n, t) => n + (t.estimatedMinutes || 0), 0)

    // Consecutive days (ending today or yesterday) with at least one focus session
    const sessionDays = new Set(sessions.map((s) => localISO(new Date(s.completedAt))))
    let streak = 0
    const cursor = new Date()
    if (!sessionDays.has(localISO(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (sessionDays.has(localISO(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }

    const recent = [...sessions].reverse().slice(0, 8)
    return { focusByDay, doneByDay, byPriority, activeCount: active.length, weekFocus, totalFocus, estimated, streak, recent }
  }, [tasks, sessions])

  const tiles = [
    { label: 'Focus this week', value: formatMinutes(data.weekFocus), hint: `${formatMinutes(data.totalFocus)} all time` },
    { label: 'Focus streak', value: `${data.streak} ${data.streak === 1 ? 'day' : 'days'}`, hint: 'Days in a row with a session' },
    { label: 'Completion rate', value: `${stats.completionRate}%`, hint: `${stats.counts.completed} of ${stats.total} tasks done` },
    { label: 'Estimated work left', value: formatMinutes(data.estimated), hint: 'Sum of estimates on active tasks' },
  ]

  return (
    <div className="view-stack">
      <section className="stats stats-4" aria-label="Productivity summary">
        {tiles.map((t) => (
          <div key={t.label} className="stat-card">
            <p className="stat-label">{t.label}</p>
            <p className="stat-value">{t.value}</p>
            <p className="stat-hint">{t.hint}</p>
          </div>
        ))}
      </section>

      <div className="chart-grid">
        <BarChart title="Focus minutes · last 7 days" data={data.focusByDay} format={formatMinutes} />
        <BarChart title="Tasks completed · last 7 days" data={data.doneByDay} format={(n) => `${n} ${n === 1 ? 'task' : 'tasks'}`} />
      </div>

      <div className="chart-grid">
        <section className="card" aria-labelledby="prio-title">
          <div className="card-head">
            <h2 id="prio-title">Active tasks by priority</h2>
            <span className="muted-text">{data.activeCount} active</span>
          </div>
          <ul className="meter-list">
            {data.byPriority.map((p) => {
              const pct = data.activeCount ? Math.round((p.count / data.activeCount) * 100) : 0
              return (
                <li key={p.value}>
                  <div className="meter-row">
                    <span className={`prio-text p-${p.value}`}>{p.label}</span>
                    <span className="meter-value">{p.count} <small>({pct}%)</small></span>
                  </div>
                  <div className="progress" role="progressbar" aria-label={`${p.label} priority share`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`progress-fill fill-${p.value}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card" aria-labelledby="recent-title">
          <div className="card-head">
            <h2 id="recent-title">Recent focus sessions</h2>
            <span className="muted-text">{sessions.length} total</span>
          </div>
          {data.recent.length === 0 ? (
            <p className="empty-note">No sessions yet. Finish a 25-minute focus session to see it here.</p>
          ) : (
            <ul className="session-list">
              {data.recent.map((s) => (
                <li key={s.id}>
                  <span className="session-time">
                    {new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="session-title">{s.taskTitle || 'Free focus'}</span>
                  <span className="session-min">{s.minutes}m</span>
                </li>
              ))}
            </ul>
          )}
          <p className="field-note">Focus history is stored in this browser (localStorage).</p>
        </section>
      </div>
    </div>
  )
}

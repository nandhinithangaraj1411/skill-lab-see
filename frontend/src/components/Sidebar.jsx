import { MODES } from '../usePomodoro'
import { BoardIcon, BoltIcon, ChartIcon, HomeIcon, TimerIcon } from './Icons'

const NAV_ITEMS = [
  { view: 'overview', label: 'Overview', Icon: HomeIcon },
  { view: 'board', label: 'Kanban Board', Icon: BoardIcon },
  { view: 'focus', label: 'Focus Chamber', Icon: TimerIcon },
  { view: 'stats', label: 'Productivity Stats', Icon: ChartIcon },
]

export default function Sidebar({ view, onNavigate, stats, pomodoro }) {
  const { timer, clock } = pomodoro
  const timerActive = timer.status !== 'idle'

  const badgeFor = (v) => {
    if (v === 'overview' && stats.overdue > 0) return { text: stats.overdue, danger: true, label: `${stats.overdue} overdue` }
    if (v === 'board') return { text: stats.active, label: `${stats.active} active tasks` }
    if (v === 'focus' && timerActive) return { text: clock, live: true, label: `Timer ${clock}` }
    return null
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo"><BoltIcon width={18} height={18} strokeWidth={2.5} /></span>
        <div>
          <span className="brand-name">TaskFlow</span>
          <span className="brand-tag">Lock In</span>
        </div>
      </div>

      <nav className="nav" aria-label="Main navigation">
        <p className="nav-label">Workspace</p>
        {NAV_ITEMS.map((item) => {
          const badge = badgeFor(item.view)
          const ItemIcon = item.Icon
          return (
            <button
              key={item.view}
              type="button"
              className={`nav-item${view === item.view ? ' active' : ''}`}
              onClick={() => onNavigate(item.view)}
              aria-current={view === item.view ? 'page' : undefined}
            >
              <ItemIcon />
              <span className="nav-text">{item.label}</span>
              {badge && (
                <span
                  className={`nav-count${badge.danger ? ' danger' : ''}${badge.live ? ' live' : ''}`}
                  aria-label={badge.label}
                >
                  {badge.text}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {timerActive && view !== 'focus' && (
        <button type="button" className="mini-timer" onClick={() => onNavigate('focus')}>
          <span className={`mini-timer-dot${timer.status === 'running' ? ' pulse' : ''}`} />
          <span>
            <strong>{clock}</strong>
            <small>{MODES[timer.mode].label}{timer.status === 'paused' ? ' · paused' : ''}</small>
          </span>
        </button>
      )}

      <div className="workspace">
        <span className="avatar">TF</span>
        <div>
          <p className="workspace-name">Personal Workspace</p>
          <p className="workspace-meta">
            {stats.total} {stats.total === 1 ? 'task' : 'tasks'} · {stats.completionRate}% done
          </p>
        </div>
      </div>
    </aside>
  )
}

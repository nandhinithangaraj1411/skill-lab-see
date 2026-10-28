import { dueCountdown, formatMinutes, isOverdue } from '../utils'
import AccountabilityCard from './AccountabilityCard'
import StatsCards from './StatsCards'
import { ArrowRightIcon, BoltIcon, TargetIcon } from './Icons'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Overview({ tasks, upNext, lockInTask, stats, sessions, onLockIn, onFocus, onNavigate }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="view-stack">
      <section className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">{today}</p>
          <h2>{greeting()}. Time to lock in.</h2>
          <p className="hero-sub">
            {stats.active === 0
              ? 'Your board is clear. Add a task to plan your next move.'
              : `${stats.active} active ${stats.active === 1 ? 'task' : 'tasks'}` +
                (stats.dueToday ? `, ${stats.dueToday} due today` : '') +
                (stats.overdue ? `, ${stats.overdue} overdue` : '') +
                '.'}
          </p>
        </div>
        <div className="hero-action">
          <button
            type="button"
            className="btn lock-in-btn"
            onClick={onLockIn}
            aria-label={lockInTask ? `Just lock in: focus on ${lockInTask.title}` : 'Just lock in: open the Focus Chamber'}
          >
            <BoltIcon width={20} height={20} /> JUST LOCK IN
          </button>
          <p className="hero-hint">
            {lockInTask ? <>Next up: <strong>{lockInTask.title}</strong></> : '25 minutes. One task. No distractions.'}
          </p>
        </div>
      </section>

      <StatsCards stats={stats} />

      <div className="overview-grid">
        <AccountabilityCard tasks={tasks} sessions={sessions} />

        <section className="card up-next" aria-labelledby="up-next-title">
          <div className="card-head">
            <h2 id="up-next-title">Up next</h2>
            <button type="button" className="link-btn" onClick={() => onNavigate('board')}>
              Open board <ArrowRightIcon width={14} height={14} />
            </button>
          </div>
          {upNext.length === 0 ? (
            <p className="empty-note">No active tasks. Enjoy the calm, or add something new.</p>
          ) : (
            <ul className="up-next-list">
              {upNext.map((task) => (
                <li key={task._id} className={isOverdue(task) ? 'is-overdue' : undefined}>
                  <span className={`prio-bar p-${task.priority}`} aria-hidden="true" />
                  <div className="up-next-info">
                    <p className="up-next-title">{task.title}</p>
                    <p className="up-next-meta">
                      <span className={`prio-text p-${task.priority}`}>{task.priority}</span>
                      {dueCountdown(task) && <span>· {dueCountdown(task)}</span>}
                      {task.estimatedMinutes ? <span>· ~{formatMinutes(task.estimatedMinutes)}</span> : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-focus btn-sm"
                    onClick={() => onFocus(task)}
                    aria-label={`Focus on ${task.title}`}
                  >
                    <TargetIcon width={13} height={13} /> Focus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

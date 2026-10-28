import { AlertIcon, BoardIcon, CheckIcon, TimerIcon } from './Icons'

// Today's headline numbers, all derived from real tasks + recorded focus sessions
export default function StatsCards({ stats }) {
  const tiles = [
    {
      key: 'done-today',
      label: 'Completed today',
      value: stats.completedToday,
      hint: stats.completedToday ? 'Keep the streak going' : 'Nothing finished yet',
      Icon: CheckIcon,
    },
    {
      key: 'active',
      label: 'Active tasks',
      value: stats.active,
      hint: `${stats.counts['in-progress']} in progress · ${stats.counts.todo} to do`,
      Icon: BoardIcon,
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      hint: stats.overdue ? 'Needs attention' : 'All deadlines on track',
      Icon: AlertIcon,
      alert: stats.overdue > 0,
    },
    {
      key: 'focus',
      label: 'Focus minutes today',
      value: stats.focusMinutesToday,
      hint: `${stats.focusSessionsToday} focus ${stats.focusSessionsToday === 1 ? 'session' : 'sessions'}`,
      Icon: TimerIcon,
    },
  ]

  return (
    <section className="stats" aria-label="Today's statistics">
      {tiles.map((t) => {
        const TileIcon = t.Icon
        return (
          <div key={t.key} className={`stat-card stat-${t.key}${t.alert ? ' is-alert' : ''}`}>
            <div className="stat-head">
              <p className="stat-label">{t.label}</p>
              <span className="stat-icon"><TileIcon width={15} height={15} /></span>
            </div>
            <p className="stat-value">{t.value}</p>
            <p className="stat-hint">{t.hint}</p>
          </div>
        )
      })}

      <div className="stat-card stat-progress">
        <div className="stat-head">
          <p className="stat-label">Daily progress</p>
          <p className="stat-value-sm">{stats.dailyProgress}%</p>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Daily completion progress"
          aria-valuenow={stats.dailyProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-fill" style={{ width: `${stats.dailyProgress}%` }} />
        </div>
        <p className="stat-hint">
          {stats.planned
            ? `${stats.completedToday} of ${stats.planned} tasks done (completed today + due today + overdue)`
            : 'Nothing due today. Pick a task and get ahead.'}
        </p>
      </div>
    </section>
  )
}

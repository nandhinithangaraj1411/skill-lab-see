export default function StatsCards({ total, counts, completionRate }) {
  const stats = [
    { key: 'total', label: 'Total Tasks', value: total },
    { key: 'todo', label: 'To Do', value: counts.todo },
    { key: 'in-progress', label: 'In Progress', value: counts['in-progress'] },
    { key: 'completed', label: 'Completed', value: counts.completed },
  ]

  return (
    <section className="stats" aria-label="Task statistics">
      {stats.map((s) => (
        <div key={s.key} className={`stat-card stat-${s.key}`}>
          <p className="stat-label">{s.label}</p>
          <p className="stat-value">{s.value}</p>
        </div>
      ))}

      <div className="stat-card stat-progress">
        <p className="stat-label">Completion</p>
        <p className="stat-value">{completionRate}%</p>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-fill" style={{ width: `${completionRate}%` }} />
        </div>
      </div>
    </section>
  )
}

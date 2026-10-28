import { LONG_BREAK_EVERY, MODES } from '../usePomodoro'
import { dueCountdown, formatMinutes, localISO, todayISO } from '../utils'
import AccountabilityCard from './AccountabilityCard'
import { CheckIcon, PauseIcon, PlayIcon, ResetIcon, TargetIcon } from './Icons'

const RADIUS = 120
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function FocusChamber({ pomodoro, tasks, activeTasks, busyIds, onCompleteTask }) {
  const { timer, sessions, clock, progress, start, pause, reset, setMode, selectTask, dismissCompleted } = pomodoro
  const running = timer.status === 'running'
  const selectedTask = tasks.find((t) => t._id === timer.taskId) || null
  const selectedIsActive = selectedTask && selectedTask.status !== 'completed'

  const today = todayISO()
  const todaysSessions = sessions.filter((s) => localISO(new Date(s.completedAt)) === today).reverse()
  const minutesOnTask = selectedTask
    ? sessions.filter((s) => s.taskId === selectedTask._id).reduce((n, s) => n + s.minutes, 0)
    : 0

  const last = timer.lastCompleted
  const lastTask = last?.taskId ? tasks.find((t) => t._id === last.taskId) : null

  const handleSelect = (e) => {
    const task = activeTasks.find((t) => t._id === e.target.value) || null
    selectTask(task)
  }

  const startLabel = timer.status === 'paused' ? 'Resume' : `Start ${MODES[timer.mode].label.toLowerCase()}`

  return (
    <div className="view-stack">
      {last && (
        <div className={`card session-done${last.mode === 'focus' ? '' : ' break'}`} role="status">
          <div>
            <p className="session-done-title">
              {last.mode === 'focus' ? 'Focus session complete. 25 minutes logged.' : 'Break’s over.'}
            </p>
            <p className="session-done-sub">
              {last.mode === 'focus'
                ? `Ready for your ${MODES[timer.mode].label.toLowerCase()}? It won’t start until you say so.`
                : 'Ready for another focus session? Start whenever you are.'}
            </p>
          </div>
          <div className="session-done-actions">
            {last.mode === 'focus' && lastTask && lastTask.status !== 'completed' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onCompleteTask(lastTask)}
                disabled={busyIds.has(lastTask._id)}
              >
                <CheckIcon width={14} height={14} />
                {busyIds.has(lastTask._id) ? 'Saving…' : `Mark “${lastTask.title}” complete`}
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={start}>
              <PlayIcon width={13} height={13} /> Start {MODES[timer.mode].label.toLowerCase()}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={dismissCompleted}>
              Not yet
            </button>
          </div>
        </div>
      )}

      <div className="focus-grid">
        <section className={`card timer-card mode-${timer.mode}${running ? ' is-running' : ''}`} aria-label="Pomodoro timer">
          <div className="mode-tabs" role="group" aria-label="Timer mode">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                type="button"
                className={`mode-tab${timer.mode === key ? ' active' : ''}`}
                onClick={() => setMode(key)}
                disabled={running}
                aria-pressed={timer.mode === key}
                title={running ? 'Pause or reset the timer to switch modes' : `${m.minutes} minutes`}
              >
                {m.label} <small>{m.minutes}m</small>
              </button>
            ))}
          </div>

          <div className="ring-wrap">
            <svg className="ring" viewBox="0 0 280 280" aria-hidden="true">
              <defs>
                <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--ring-a)" />
                  <stop offset="100%" stopColor="var(--ring-b)" />
                </linearGradient>
              </defs>
              <circle className="ring-track" cx="140" cy="140" r={RADIUS} />
              <circle
                className="ring-progress"
                cx="140"
                cy="140"
                r={RADIUS}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              />
            </svg>
            <div className="ring-center">
              <p className="ring-time" role="timer" aria-live="off" aria-label={`${clock} remaining`}>{clock}</p>
              <p className="ring-label">
                {timer.status === 'paused' ? 'Paused' : running ? MODES[timer.mode].label : 'Ready'}
              </p>
            </div>
          </div>

          <p className="timer-task">
            {timer.mode === 'focus' ? (
              selectedTask ? (
                <>Focusing on <strong>{selectedTask.title}</strong></>
              ) : timer.taskTitle ? (
                <>Focusing on <strong>{timer.taskTitle}</strong> <small>(no longer on the board)</small></>
              ) : (
                'No task selected: free focus'
              )
            ) : (
              'Step away from the screen. You earned it.'
            )}
          </p>

          <div className="timer-controls">
            {running ? (
              <button type="button" className="btn btn-primary btn-lg" onClick={pause} aria-label="Pause timer">
                <PauseIcon width={16} height={16} /> Pause
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={start} aria-label={startLabel}>
                <PlayIcon width={16} height={16} /> {startLabel}
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={reset}
              disabled={timer.status === 'idle'}
              aria-label="Reset timer"
            >
              <ResetIcon width={16} height={16} /> Reset
            </button>
          </div>

          <div className="cycle" aria-label={`${timer.cycleCount % LONG_BREAK_EVERY} of ${LONG_BREAK_EVERY} focus sessions before a long break`}>
            {Array.from({ length: LONG_BREAK_EVERY }, (_, i) => (
              <span
                key={i}
                className={`cycle-dot${i < timer.cycleCount % LONG_BREAK_EVERY || (timer.mode === 'long' && timer.cycleCount > 0) ? ' filled' : ''}`}
              />
            ))}
            <small>Long break after {LONG_BREAK_EVERY} sessions</small>
          </div>
        </section>

        <div className="focus-side">
          <section className="card" aria-labelledby="focus-task-title">
            <div className="card-head">
              <h2 id="focus-task-title"><TargetIcon width={16} height={16} /> Focus target</h2>
            </div>
            <label className="field">
              <span>Choose an incomplete task</span>
              <select value={selectedIsActive ? selectedTask._id : ''} onChange={handleSelect} disabled={running}>
                <option value="">No task (free focus)</option>
                {activeTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.priority === 'high' ? '🔥 ' : ''}{t.title}
                  </option>
                ))}
              </select>
            </label>
            {running && <p className="field-note">Pause the timer to switch tasks.</p>}

            {selectedIsActive ? (
              <div className="focus-target">
                <p className="focus-target-title">{selectedTask.title}</p>
                {selectedTask.description && <p className="focus-target-desc">{selectedTask.description}</p>}
                <div className="task-meta">
                  <span className={`badge priority-${selectedTask.priority}`}>
                    <span className="badge-dot" aria-hidden="true" />{selectedTask.priority}
                  </span>
                  {dueCountdown(selectedTask) && <span className="chip">{dueCountdown(selectedTask)}</span>}
                  {selectedTask.estimatedMinutes ? (
                    <span className="chip">Est. {formatMinutes(selectedTask.estimatedMinutes)}</span>
                  ) : null}
                  <span className="chip">Focused {formatMinutes(minutesOnTask)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={() => onCompleteTask(selectedTask)}
                  disabled={busyIds.has(selectedTask._id)}
                >
                  <CheckIcon width={14} height={14} />
                  {busyIds.has(selectedTask._id) ? 'Saving…' : 'Mark complete'}
                </button>
              </div>
            ) : (
              activeTasks.length === 0 && <p className="empty-note">No incomplete tasks. Free focus it is.</p>
            )}
          </section>

          <AccountabilityCard tasks={tasks} sessions={sessions} compact />

          <section className="card" aria-labelledby="today-sessions-title">
            <div className="card-head">
              <h2 id="today-sessions-title">Today’s sessions</h2>
              <span className="muted-text">{formatMinutes(todaysSessions.reduce((n, s) => n + s.minutes, 0))}</span>
            </div>
            {todaysSessions.length === 0 ? (
              <p className="empty-note">No completed focus sessions yet today.</p>
            ) : (
              <ul className="session-list">
                {todaysSessions.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <span className="session-time">
                      {new Date(s.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="session-title">{s.taskTitle || 'Free focus'}</span>
                    <span className="session-min">{s.minutes}m</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

import { STATUS_LABELS, STATUS_ORDER } from '../constants'
import { daysUntilDue, dueCountdown, dueDay, formatDueDate, formatMinutes, isOverdue } from '../utils'
import {
  AlertIcon, ArrowLeftIcon, ArrowRightIcon, CalendarIcon, ClockIcon, EditIcon, TargetIcon, TrashIcon,
} from './Icons'

export default function TaskCard({ task, busy, focused, onMove, onEdit, onDelete, onFocus }) {
  const index = STATUS_ORDER.indexOf(task.status)
  const prevStatus = STATUS_ORDER[index - 1]
  const nextStatus = STATUS_ORDER[index + 1]

  const done = task.status === 'completed'
  const overdue = isOverdue(task)
  const days = daysUntilDue(task)
  const countdown = dueCountdown(task)
  const dueSoon = !done && !overdue && days !== null && days <= 1

  const classes = ['task-card', `p-${task.priority}`]
  if (busy) classes.push('is-busy')
  if (overdue) classes.push('is-overdue')
  if (focused) classes.push('is-focused')
  if (done) classes.push('is-done')

  return (
    <article className={classes.join(' ')} aria-busy={busy}>
      <div className="task-top">
        <div className="task-badges">
          <span className={`badge priority-${task.priority}`}>
            <span className="badge-dot" aria-hidden="true" />
            {task.priority}
          </span>
          {overdue && (
            <span className="badge badge-overdue">
              <AlertIcon width={11} height={11} /> Overdue
            </span>
          )}
          {focused && <span className="badge badge-focus">In focus</span>}
        </div>
        <div className="task-icons">
          <button className="icon-btn" onClick={() => onEdit(task)} disabled={busy} title="Edit task" aria-label={`Edit task ${task.title}`}>
            <EditIcon />
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(task)} disabled={busy} title="Delete task" aria-label={`Delete task ${task.title}`}>
            <TrashIcon />
          </button>
        </div>
      </div>

      <h3 className={`task-title${done ? ' done' : ''}`}>{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        {dueDay(task) ? (
          <span className={`chip${overdue ? ' chip-danger' : dueSoon ? ' chip-warn' : ''}`} title={formatDueDate(task.dueDate)}>
            <CalendarIcon width={12} height={12} />
            {countdown ?? formatDueDate(task.dueDate)}
          </span>
        ) : (
          <span className="chip chip-muted">No due date</span>
        )}
        {task.estimatedMinutes ? (
          <span className="chip" title="Estimated duration">
            <ClockIcon width={12} height={12} /> ~{formatMinutes(task.estimatedMinutes)}
          </span>
        ) : null}
      </div>

      <div className="task-footer">
        {!done ? (
          <button
            className="btn btn-focus btn-sm"
            onClick={() => onFocus(task)}
            disabled={busy}
            aria-label={`Focus on ${task.title}`}
            title="Open in the Focus Chamber"
          >
            <TargetIcon width={13} height={13} /> Focus
          </button>
        ) : (
          <span className="chip chip-done">Done</span>
        )}

        <div className="move-actions">
          {prevStatus && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onMove(task, prevStatus)}
              disabled={busy}
              title={`Move back to ${STATUS_LABELS[prevStatus]}`}
              aria-label={`Move back to ${STATUS_LABELS[prevStatus]}`}
            >
              <ArrowLeftIcon width={14} height={14} />
            </button>
          )}
          {nextStatus && (
            <button
              className="btn btn-soft btn-sm"
              onClick={() => onMove(task, nextStatus)}
              disabled={busy}
              aria-label={`Move to ${STATUS_LABELS[nextStatus]}`}
            >
              {nextStatus === 'completed' ? 'Complete' : 'Start'}
              <ArrowRightIcon width={14} height={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

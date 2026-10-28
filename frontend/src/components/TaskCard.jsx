import { STATUS_LABELS, STATUS_ORDER } from '../constants'
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, EditIcon, TrashIcon } from './Icons'

// Due dates are stored as UTC midnight, so format/compare by the YYYY-MM-DD part
function formatDueDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function TaskCard({ task, busy, onMove, onEdit, onDelete }) {
  const index = STATUS_ORDER.indexOf(task.status)
  const prevStatus = STATUS_ORDER[index - 1]
  const nextStatus = STATUS_ORDER[index + 1]

  const dueDay = task.dueDate ? task.dueDate.slice(0, 10) : null
  const overdue = dueDay && task.status !== 'completed' && dueDay < todayISO()

  return (
    <article className={`task-card${busy ? ' is-busy' : ''}`} aria-busy={busy}>
      <div className="task-top">
        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
        <div className="task-icons">
          <button className="icon-btn" onClick={() => onEdit(task)} disabled={busy} title="Edit task" aria-label="Edit task">
            <EditIcon />
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(task)} disabled={busy} title="Delete task" aria-label="Delete task">
            <TrashIcon />
          </button>
        </div>
      </div>

      <h3 className={`task-title${task.status === 'completed' ? ' done' : ''}`}>{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-footer">
        {dueDay ? (
          <span className={`due${overdue ? ' overdue' : ''}`}>
            <CalendarIcon width={14} height={14} />
            {overdue ? 'Overdue · ' : ''}
            {formatDueDate(task.dueDate)}
          </span>
        ) : (
          <span className="due muted">No due date</span>
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
            <button className="btn btn-soft btn-sm" onClick={() => onMove(task, nextStatus)} disabled={busy}>
              {nextStatus === 'completed' ? 'Complete' : 'Start'}
              <ArrowRightIcon width={14} height={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

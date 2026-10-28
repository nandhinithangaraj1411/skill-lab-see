import { useEffect, useState } from 'react'
import { PRIORITIES } from '../constants'

const EMPTY_FORM = { title: '', description: '', priority: 'medium', dueDate: '', estimatedMinutes: '' }

// Used for both creating and editing. `task` is null when creating.
export default function TaskModal({ task, onSubmit, onClose }) {
  const isEdit = Boolean(task)
  const [form, setForm] = useState(() =>
    task
      ? {
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
          estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : '',
        }
      : EMPTY_FORM
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Close on Escape (unless a request is in flight)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    const title = form.title.trim()
    if (!title) {
      setError('Title is required.')
      return
    }
    const estimate = form.estimatedMinutes === '' ? null : Number(form.estimatedMinutes)
    if (estimate !== null && (!Number.isInteger(estimate) || estimate < 1 || estimate > 1440)) {
      setError('Estimate must be a whole number of minutes between 1 and 1440.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title,
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
        estimatedMinutes: estimate,
      })
      // Parent closes the modal on success
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">{isEdit ? 'Edit Task' : 'Add New Task'}</h2>
        <p className="modal-subtitle">
          {isEdit ? 'Update the details of this task.' : 'New tasks start in the To Do column.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Title <em>*</em></span>
            <input
              type="text"
              value={form.title}
              onChange={update('title')}
              maxLength={100}
              placeholder="e.g. Prepare sprint demo"
              autoFocus
              required
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={update('description')}
              maxLength={500}
              rows={3}
              placeholder="Add a few details (optional)"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Priority</span>
              <select value={form.priority} onChange={update('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Due date <small>(optional)</small></span>
              <input type="date" value={form.dueDate} onChange={update('dueDate')} />
            </label>
          </div>

          <label className="field">
            <span>Estimated duration <small>(minutes, optional)</small></span>
            <input
              type="number"
              min={1}
              max={1440}
              step={1}
              inputMode="numeric"
              value={form.estimatedMinutes}
              onChange={update('estimatedMinutes')}
              placeholder="e.g. 50 (two focus sessions)"
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

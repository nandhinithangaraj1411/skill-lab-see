// Must match the backend enums in backend/src/models/Task.js
export const COLUMNS = [
  { status: 'todo', title: 'To Do', emptyText: 'Nothing queued up. Add a task to get started.' },
  { status: 'in-progress', title: 'In Progress', emptyText: 'No tasks in progress. Move one over from To Do.' },
  { status: 'completed', title: 'Completed', emptyText: 'No completed tasks yet. You’ve got this!' },
]

export const STATUS_ORDER = COLUMNS.map((c) => c.status)

export const STATUS_LABELS = Object.fromEntries(COLUMNS.map((c) => [c.status, c.title]))

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

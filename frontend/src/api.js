// In development, Vite proxies /api to the backend (see vite.config.js).
// Set VITE_API_URL to call a different backend directly.
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (!data) {
      // Proxy returns an empty 5xx when the backend is down
      throw new Error(
        res.status >= 500
          ? 'Server unavailable. Make sure the backend is running on port 5000.'
          : `Request failed (${res.status})`
      )
    }
    throw new Error(data.details?.join(' ') || data.error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  listTasks: () => request('/tasks'),
  createTask: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, updates) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
}

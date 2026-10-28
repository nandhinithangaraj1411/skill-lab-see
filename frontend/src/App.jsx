import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'
import Sidebar from './components/Sidebar'
import StatsCards from './components/StatsCards'
import Board from './components/Board'
import TaskModal from './components/TaskModal'
import { PlusIcon, RefreshIcon } from './components/Icons'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [modal, setModal] = useState(null) // { task: null } = create, { task } = edit

  // Track tasks with a request in flight. The ref gives a synchronous guard
  // against double clicks; the state copy drives the disabled UI.
  const busyRef = useRef(new Set())
  const [busyIds, setBusyIds] = useState(() => new Set())

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setTasks(await api.listTasks())
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Re-fetch after a successful mutation so the UI always reflects the database
  const refreshTasks = useCallback(async () => {
    try {
      setTasks(await api.listTasks())
    } catch (err) {
      setActionError(`Change saved, but the board could not be refreshed: ${err.message}`)
    }
  }, [])

  async function runTaskAction(id, action) {
    if (busyRef.current.has(id)) return
    busyRef.current.add(id)
    setBusyIds(new Set(busyRef.current))
    setActionError(null)
    try {
      await action()
      await refreshTasks()
    } catch (err) {
      setActionError(err.message)
    } finally {
      busyRef.current.delete(id)
      setBusyIds(new Set(busyRef.current))
    }
  }

  const handleMove = (task, status) =>
    runTaskAction(task._id, () => api.updateTask(task._id, { status }))

  const handleDelete = (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    runTaskAction(task._id, () => api.deleteTask(task._id))
  }

  // Errors thrown here are shown inside the modal, which stays open
  async function handleSubmit(values) {
    if (modal.task) {
      await api.updateTask(modal.task._id, values)
    } else {
      await api.createTask(values)
    }
    setModal(null)
    setActionError(null)
    await refreshTasks()
  }

  const openCreate = () => setModal({ task: null })
  const openEdit = (task) => setModal({ task })
  const closeModal = useCallback(() => setModal(null), [])

  const { counts, total, completionRate } = useMemo(() => {
    const counts = { todo: 0, 'in-progress': 0, completed: 0 }
    for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
    const total = tasks.length
    const completionRate = total ? Math.round((counts.completed / total) * 100) : 0
    return { counts, total, completionRate }
  }, [tasks])

  const showInitialLoading = loading && tasks.length === 0 && !loadError

  return (
    <div className="app">
      <Sidebar counts={counts} total={total} />

      <main className="main">
        <header className="page-header">
          <div>
            <h1>My Workspace</h1>
            <p className="subtitle">Plan, track and finish your work — all on one board.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={loadTasks} disabled={loading} title="Reload tasks">
              <RefreshIcon className={loading ? 'spin' : undefined} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <PlusIcon /> Add Task
            </button>
          </div>
        </header>

        {actionError && (
          <div className="alert" role="alert">
            <span>{actionError}</span>
            <button className="alert-close" onClick={() => setActionError(null)} aria-label="Dismiss">×</button>
          </div>
        )}

        {showInitialLoading ? (
          <div className="state-panel">
            <div className="spinner" />
            <p>Loading your tasks…</p>
          </div>
        ) : loadError ? (
          <div className="state-panel error">
            <p className="state-title">Couldn’t load tasks</p>
            <p>{loadError}</p>
            <button className="btn btn-primary" onClick={loadTasks} disabled={loading}>
              {loading ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : (
          <>
            <StatsCards total={total} counts={counts} completionRate={completionRate} />
            <Board
              tasks={tasks}
              busyIds={busyIds}
              onMove={handleMove}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAdd={openCreate}
            />
          </>
        )}
      </main>

      {modal && <TaskModal task={modal.task} onSubmit={handleSubmit} onClose={closeModal} />}
    </div>
  )
}

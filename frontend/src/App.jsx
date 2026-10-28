import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'
import Sidebar from './components/Sidebar'
import Board from './components/Board'
import TaskModal from './components/TaskModal'
import Overview from './components/Overview'
import FocusChamber from './components/FocusChamber'
import StatsView from './components/StatsView'
import { PlusIcon, RefreshIcon } from './components/Icons'
import { usePomodoro } from './usePomodoro'
import { byUrgency, computeTaskStats, isActive } from './utils'
import { VIEWS } from './constants'

const VIEW_COPY = {
  overview: { title: 'Overview', subtitle: 'Your day at a glance. Pick one thing and lock in.' },
  board: { title: 'Kanban Board', subtitle: 'Plan, track and finish your work — all on one board.' },
  focus: { title: 'Focus Chamber', subtitle: 'One task. 25 minutes. Everything else can wait.' },
  stats: { title: 'Productivity Stats', subtitle: 'Your output, measured from real tasks and focus sessions.' },
}

// The current view lives in the URL hash so back/forward and reloads work
function viewFromHash() {
  const hash = window.location.hash.replace('#', '')
  return VIEWS.includes(hash) ? hash : 'overview'
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [modal, setModal] = useState(null) // { task: null } = create, { task } = edit
  const [view, setView] = useState(viewFromHash)
  const pomodoro = usePomodoro()

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

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next) => {
    setView(next)
    if (window.location.hash !== `#${next}`) window.location.hash = next
    window.scrollTo({ top: 0 })
  }, [])

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

  const stats = useMemo(() => computeTaskStats(tasks, pomodoro.sessions), [tasks, pomodoro.sessions])
  const activeTasks = useMemo(() => tasks.filter(isActive).sort(byUrgency), [tasks])
  const upNext = activeTasks.slice(0, 5)

  // Lock in on the selected task if it is still open, otherwise the most urgent one
  const currentFocus = activeTasks.find((t) => t._id === pomodoro.timer.taskId)
  const lockInTask = currentFocus || activeTasks[0] || null

  // Selecting a task never starts the timer: the user presses Start in the chamber
  function focusOnTask(task) {
    const { timer } = pomodoro
    if (timer.status === 'running' && timer.taskId !== task._id) {
      const ok = window.confirm(
        `A focus session is running${timer.taskTitle ? ` on "${timer.taskTitle}"` : ''}. Switch it to "${task.title}"?`
      )
      if (!ok) return navigate('focus')
    }
    pomodoro.selectTask(task)
    if (timer.status !== 'running' && timer.mode !== 'focus') pomodoro.setMode('focus')
    navigate('focus')
  }

  function lockIn() {
    if (lockInTask && pomodoro.timer.status !== 'running') {
      pomodoro.selectTask(lockInTask)
      if (pomodoro.timer.mode !== 'focus') pomodoro.setMode('focus')
    }
    navigate('focus')
  }

  const showInitialLoading = loading && tasks.length === 0 && !loadError
  // The timer works without the API, so the Focus Chamber stays usable on load errors
  const blockedByError = loadError && view !== 'focus'
  const copy = VIEW_COPY[view]

  function renderView() {
    switch (view) {
      case 'board':
        return (
          <Board
            tasks={tasks}
            busyIds={busyIds}
            focusTaskId={pomodoro.timer.status !== 'idle' ? pomodoro.timer.taskId : null}
            onMove={handleMove}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdd={openCreate}
            onFocus={focusOnTask}
          />
        )
      case 'focus':
        return (
          <FocusChamber
            pomodoro={pomodoro}
            tasks={tasks}
            activeTasks={activeTasks}
            busyIds={busyIds}
            onCompleteTask={(task) => handleMove(task, 'completed')}
          />
        )
      case 'stats':
        return <StatsView tasks={tasks} sessions={pomodoro.sessions} stats={stats} />
      default:
        return (
          <Overview
            tasks={tasks}
            upNext={upNext}
            lockInTask={lockInTask}
            stats={stats}
            sessions={pomodoro.sessions}
            onLockIn={lockIn}
            onFocus={focusOnTask}
            onNavigate={navigate}
          />
        )
    }
  }

  return (
    <div className="app">
      <Sidebar view={view} onNavigate={navigate} stats={stats} pomodoro={pomodoro} />

      <main className="main">
        <header className="page-header">
          <div>
            <h1>{copy.title}</h1>
            <p className="subtitle">{copy.subtitle}</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={loadTasks} disabled={loading} title="Reload tasks" aria-label="Reload tasks">
              <RefreshIcon className={loading ? 'spin' : undefined} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={openCreate} aria-label="Add a new task">
              <PlusIcon /> Add Task
            </button>
          </div>
        </header>

        {actionError && (
          <div className="alert" role="alert">
            <span>{actionError}</span>
            <button className="alert-close" onClick={() => setActionError(null)} aria-label="Dismiss error">×</button>
          </div>
        )}

        {loadError && view === 'focus' && (
          <div className="alert" role="alert">
            <span>Couldn’t load tasks: {loadError} The timer still works.</span>
            <button className="alert-close" onClick={loadTasks} aria-label="Retry loading tasks">↻</button>
          </div>
        )}

        {showInitialLoading && view !== 'focus' ? (
          <div className="state-panel">
            <div className="spinner" />
            <p>Loading your tasks…</p>
          </div>
        ) : blockedByError ? (
          <div className="state-panel error">
            <p className="state-title">Couldn’t load tasks</p>
            <p>{loadError}</p>
            <button className="btn btn-primary" onClick={loadTasks} disabled={loading}>
              {loading ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : (
          <div className="view" key={view}>
            {renderView()}
          </div>
        )}
      </main>

      {modal && <TaskModal task={modal.task} onSubmit={handleSubmit} onClose={closeModal} />}
    </div>
  )
}

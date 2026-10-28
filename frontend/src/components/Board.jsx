import { COLUMNS } from '../constants'
import TaskCard from './TaskCard'
import { PlusIcon } from './Icons'

export default function Board({ tasks, busyIds, onMove, onEdit, onDelete, onAdd }) {
  return (
    <section className="board" id="board" aria-label="Kanban board">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status)
        return (
          <div key={col.status} className="column" id={`col-${col.status}`}>
            <header className="column-header">
              <span className={`dot dot-${col.status}`} />
              <h2>{col.title}</h2>
              <span className="column-count">{columnTasks.length}</span>
            </header>

            <div className="column-body">
              {columnTasks.length === 0 ? (
                <div className="column-empty">
                  <p>{col.emptyText}</p>
                  {col.status === 'todo' && (
                    <button className="btn btn-soft btn-sm" onClick={onAdd}>
                      <PlusIcon width={14} height={14} /> Add task
                    </button>
                  )}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    busy={busyIds.has(task._id)}
                    onMove={onMove}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}

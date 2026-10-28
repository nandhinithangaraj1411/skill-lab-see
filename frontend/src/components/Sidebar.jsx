import { COLUMNS } from '../constants'
import { BoardIcon, CheckIcon } from './Icons'

export default function Sidebar({ counts, total }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo"><CheckIcon width={18} height={18} strokeWidth={3} /></span>
        <span className="brand-name">TaskFlow</span>
      </div>

      <nav className="nav">
        <p className="nav-label">Boards</p>
        <a href="#board" className="nav-item active">
          <BoardIcon />
          <span>Kanban Board</span>
          <span className="nav-count">{total}</span>
        </a>

        <p className="nav-label">Columns</p>
        {COLUMNS.map((col) => (
          <a key={col.status} href={`#col-${col.status}`} className="nav-item">
            <span className={`dot dot-${col.status}`} />
            <span>{col.title}</span>
            <span className="nav-count">{counts[col.status]}</span>
          </a>
        ))}
      </nav>

      <div className="workspace">
        <span className="avatar">TF</span>
        <div>
          <p className="workspace-name">Personal Workspace</p>
          <p className="workspace-meta">{total} {total === 1 ? 'task' : 'tasks'}</p>
        </div>
      </div>
    </aside>
  )
}

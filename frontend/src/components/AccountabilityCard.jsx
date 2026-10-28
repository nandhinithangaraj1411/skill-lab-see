import { useMemo, useState } from 'react'
import { getSituations, pickMessage, TONES } from '../messages'
import { KEYS, loadJSON, saveJSON } from '../storage'
import { CloseIcon, FlameIcon, RefreshIcon } from './Icons'

export default function AccountabilityCard({ tasks, sessions, compact = false }) {
  const [tone, setTone] = useState(() => {
    const saved = loadJSON(KEYS.tone, 'savage')
    return TONES.some((t) => t.value === saved) ? saved : 'savage'
  })
  const [cycle, setCycle] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const situations = useMemo(() => getSituations(tasks, sessions), [tasks, sessions])

  // When the set of situations changes (e.g. a task was just completed), show
  // the newest one again. Adjusting state during render avoids an effect loop.
  const signature = situations.map((s) => s.key).join('|')
  const [prevSignature, setPrevSignature] = useState(signature)
  if (signature !== prevSignature) {
    setPrevSignature(signature)
    setCycle(0)
    setDismissed(false)
  }

  const message = pickMessage(situations, tone, cycle)

  const changeTone = (e) => {
    setTone(e.target.value)
    saveJSON(KEYS.tone, e.target.value)
  }

  if (dismissed) {
    return (
      <button type="button" className="btn btn-ghost btn-sm nudge-restore" onClick={() => setDismissed(false)}>
        <FlameIcon width={14} height={14} /> Show accountability nudge
      </button>
    )
  }

  return (
    <section className={`card accountability${compact ? ' compact' : ''} tone-${tone}`} aria-live="polite">
      <div className="accountability-head">
        <span className="eyebrow">
          <FlameIcon width={13} height={13} /> {message ? message.label : 'Accountability'}
        </span>
        <div className="accountability-actions">
          <label className="sr-only" htmlFor={`tone-${compact ? 'c' : 'f'}`}>Message tone</label>
          <select id={`tone-${compact ? 'c' : 'f'}`} className="tone-select" value={tone} onChange={changeTone}>
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCycle((c) => c + 1)}
            disabled={!message}
            aria-label="Show another message"
            title="Another one"
          >
            <RefreshIcon width={15} height={15} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss message"
            title="Dismiss"
          >
            <CloseIcon width={15} height={15} />
          </button>
        </div>
      </div>
      <p className="accountability-text">
        {message ? message.text : 'Add a task and I’ll start keeping you honest.'}
      </p>
    </section>
  )
}

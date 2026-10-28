// Deterministic accountability messages built from local templates.
// No external services: the same data + tone + cycle index always gives the same message.

import { byUrgency, completedOn, isActive, isOverdue, localISO, todayISO } from './utils'

export const TONES = [
  { value: 'savage', label: 'Savage' },
  { value: 'passive', label: 'Passive-aggressive' },
  { value: 'reality', label: 'Reality check' },
  { value: 'bestie', label: 'Supportive best friend' },
]

const q = (title) => `“${title}”`

const TEMPLATES = {
  overdue: {
    savage: [
      ({ task }) => `${q(task.title)} is overdue. That deadline wasn't a suggestion, babe.`,
      ({ count }) => `${count} overdue ${count === 1 ? 'task' : 'tasks'}. The calendar kept going. You didn't.`,
      ({ task }) => `${q(task.title)} has been waiting so long it's started journaling about it.`,
    ],
    passive: [
      ({ task }) => `No pressure, but ${q(task.title)} was due a while ago. Just mentioning it. Again.`,
      ({ count }) => `Love that you have ${count} overdue ${count === 1 ? 'task' : 'tasks'}. Very relaxed of you.`,
      ({ task }) => `I'm sure ${q(task.title)} will finish itself. Any minute now.`,
    ],
    reality: [
      ({ task, days }) => `${q(task.title)} is ${days} ${days === 1 ? 'day' : 'days'} past due. Start it now or move the date. Pick one.`,
      ({ count }) => `${count} ${count === 1 ? 'task is' : 'tasks are'} overdue. One focus session takes 25 minutes, so start with one.`,
      ({ task }) => `Overdue tasks don't get easier with age. ${q(task.title)} is still exactly as big as it was.`,
    ],
    bestie: [
      ({ task }) => `Hey, ${q(task.title)} slipped past its date. Happens to everyone. Let's do 25 minutes on it together?`,
      ({ count }) => `${count} overdue ${count === 1 ? 'thing' : 'things'}? Totally fixable. Pick the smallest and knock it out.`,
      () => `Your future self would like to thank you for starting. Even a little counts.`,
    ],
  },
  highPriority: {
    savage: [
      ({ task }) => `You ranked ${q(task.title)} HIGH priority. Your actions are giving LOW commitment.`,
      ({ count }) => `${count} high-priority ${count === 1 ? 'task' : 'tasks'} still open. "High" is doing a lot of work there.`,
      ({ task }) => `${q(task.title)} is marked urgent and you're reading this banner instead.`,
    ],
    passive: [
      ({ task }) => `Interesting choice to leave ${q(task.title)} for later when you called it high priority.`,
      ({ task }) => `${q(task.title)} is high priority. Or it was, the last time anyone checked.`,
      ({ count }) => `Not judging, but ${count} high-priority ${count === 1 ? 'task' : 'tasks'} are still sitting there.`,
    ],
    reality: [
      ({ task }) => `${q(task.title)} is your highest-impact open task. Everything else can wait 25 minutes.`,
      ({ count }) => `You have ${count} high-priority ${count === 1 ? 'task' : 'tasks'} open. Finish one before starting anything new.`,
      ({ task }) => `Busy isn't the same as productive. ${q(task.title)} is the one that matters today.`,
    ],
    bestie: [
      ({ task }) => `${q(task.title)} looks important, and you've got this. Want to give it one focus session?`,
      () => `Big tasks feel scary until minute five. Just start the timer, I'll be here.`,
      ({ task }) => `You picked ${q(task.title)} as high priority for a reason. Trust past you and lock in.`,
    ],
  },
  completed: {
    savage: [
      ({ count }) => `LOOK AT YOU. ${count} ${count === 1 ? 'task' : 'tasks'} done today. Who even are you?`,
      ({ task }) => `You finished ${q(task.title)}. Don't let it go to your head. Okay, maybe a little.`,
      () => `Someone actually followed through. Keep this energy before it notices.`,
    ],
    passive: [
      ({ count }) => `Oh, ${count} ${count === 1 ? 'task' : 'tasks'} done today? I guess miracles do happen.`,
      ({ task }) => `${q(task.title)} is done. See? That wasn't so impossible after all.`,
      () => `Wow, a completed task. I'll alert the press. Or you could just do another one.`,
    ],
    reality: [
      ({ count }) => `${count} done today. Momentum is real. Use it on the next task while it lasts.`,
      ({ task }) => `${q(task.title)}: shipped. That's one less thing in your head.`,
      () => `Progress logged. The fastest way to keep it going is to start the next one now.`,
    ],
    bestie: [
      ({ count }) => `${count} ${count === 1 ? 'task' : 'tasks'} done today! I'm so proud of you.`,
      ({ task }) => `You finished ${q(task.title)}! That deserves a little victory lap.`,
      () => `LOOK AT YOU. Someone actually followed through. Hydrate and keep going.`,
    ],
  },
  focusDone: {
    savage: [
      ({ minutes }) => `${minutes} focused minutes today. Your phone is filing a missing-person report.`,
      ({ sessions }) => `${sessions} focus ${sessions === 1 ? 'session' : 'sessions'} done. Locked in and dangerous.`,
      () => `Full session, zero excuses. Who gave you permission to be this productive?`,
    ],
    passive: [
      ({ minutes }) => `${minutes} whole minutes of focus. Look who decided to show up today.`,
      ({ sessions }) => `${sessions} ${sessions === 1 ? 'session' : 'sessions'} complete. Should've done this hours ago, but sure.`,
      () => `A finished focus session. Didn't know you had it in you. Pleasant surprise.`,
    ],
    reality: [
      ({ minutes }) => `${minutes} minutes of deep work today. That's what moves tasks, not planning them.`,
      ({ sessions }) => `${sessions} ${sessions === 1 ? 'session' : 'sessions'} logged. Take the break, then go again.`,
      () => `Session complete. Breaks are part of the system, so take yours and come back.`,
    ],
    bestie: [
      ({ minutes }) => `${minutes} focused minutes today! Your brain did that. Stretch, you earned it.`,
      ({ sessions }) => `${sessions} ${sessions === 1 ? 'session' : 'sessions'} done! Look at you go.`,
      () => `Your future self would like to thank you for starting. And finishing!`,
    ],
  },
  allClear: {
    savage: [
      () => `Zero overdue tasks. Suspicious. But respect.`,
      () => `Nothing overdue. Keep it that way, I'm watching the calendar.`,
    ],
    passive: [
      () => `No overdue tasks? Fine. I'll find something else to bring up.`,
      () => `All caught up. I'm sure that'll last.`,
    ],
    reality: [
      () => `No overdue tasks. Now's the cheapest time to get ahead on what's next.`,
      () => `You're on schedule. Protect it with one focus session today.`,
    ],
    bestie: [
      () => `Nothing overdue! You're doing amazing. Seriously.`,
      () => `All deadlines handled. Look at you being on top of things!`,
    ],
  },
}

const SITUATION_LABELS = {
  overdue: 'Overdue alert',
  highPriority: 'High priority check',
  completed: 'Task completed',
  focusDone: 'Focus session done',
  allClear: 'All clear',
}

const ORDER = ['overdue', 'highPriority', 'completed', 'focusDone', 'allClear']
const FRESH_MS = 30 * 60 * 1000

// Which situations are true right now. Wins from the last 30 minutes come first
// (celebrate them), then the fixed order: overdue, high priority, older wins, all clear.
export function getSituations(tasks, sessions, now = Date.now()) {
  const today = todayISO()
  const situations = []

  const todaysSessions = sessions.filter((s) => localISO(new Date(s.completedAt)) === today)
  if (todaysSessions.length) {
    situations.push({
      key: 'focusDone',
      at: Math.max(...todaysSessions.map((s) => Date.parse(s.completedAt))),
      ctx: { sessions: todaysSessions.length, minutes: todaysSessions.reduce((n, s) => n + s.minutes, 0) },
    })
  }

  const doneToday = tasks
    .filter((t) => completedOn(t) === today)
    .map((t) => ({ task: t, at: Date.parse(t.completedAt || t.updatedAt) }))
    .sort((a, b) => b.at - a.at)
  if (doneToday.length) {
    situations.push({ key: 'completed', at: doneToday[0].at, ctx: { count: doneToday.length, task: doneToday[0].task } })
  }

  const overdue = tasks.filter((t) => isOverdue(t, today)).sort(byUrgency)
  if (overdue.length) {
    const days = Math.round((Date.parse(today) - Date.parse(overdue[0].dueDate.slice(0, 10))) / 86400000)
    situations.push({ key: 'overdue', ctx: { count: overdue.length, task: overdue[0], days } })
  }

  const high = tasks.filter((t) => isActive(t) && t.priority === 'high').sort(byUrgency)
  if (high.length) {
    situations.push({ key: 'highPriority', ctx: { count: high.length, task: high[0] } })
  }

  if (!overdue.length && tasks.some(isActive)) {
    situations.push({ key: 'allClear', ctx: {} })
  }

  const isFresh = (s) => s.at && now - s.at < FRESH_MS
  return situations.sort((a, b) => {
    if (isFresh(a) !== isFresh(b)) return isFresh(a) ? -1 : 1
    if (isFresh(a)) return b.at - a.at
    return ORDER.indexOf(a.key) - ORDER.indexOf(b.key)
  })
}

// `cycle` advances on "refresh": it walks through situations, then templates
export function pickMessage(situations, tone, cycle) {
  if (!situations.length) return null
  const situation = situations[cycle % situations.length]
  const list = TEMPLATES[situation.key][tone] || TEMPLATES[situation.key].reality
  const template = list[Math.floor(cycle / situations.length) % list.length]
  return {
    key: situation.key,
    label: SITUATION_LABELS[situation.key],
    text: template(situation.ctx),
    taskId: situation.ctx.task?._id,
  }
}

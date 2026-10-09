// Where the candidate is in the assignment, and the clock. Kept in this browser so a reload
// brings her back to the same place.

import { useSyncExternalStore } from 'react'
import { handInChecks, problems } from './problems'

const KEY = 'order-pad-guide:v1'

export type ProblemProgress = {
  reached: boolean
  finishedAt: number | null
  spentMs: number
  done: boolean[]
  handIn: boolean[]
}

export type Progress = {
  phase: 'welcome' | 'work' | 'finished'
  startedAt: number | null
  endedAt: number | null
  current: number
  enteredAt: number | null
  handingIn: boolean
  collapsed: boolean
  problems: ProblemProgress[]
}

function fresh(): Progress {
  return {
    phase: 'welcome',
    startedAt: null,
    endedAt: null,
    current: 0,
    enteredAt: null,
    handingIn: false,
    collapsed: false,
    problems: problems.map((problem) => ({
      reached: false,
      finishedAt: null,
      spentMs: 0,
      done: problem.done.map(() => false),
      handIn: handInChecks.map(() => false),
    })),
  }
}

function load(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Progress | null
    if (saved && Array.isArray(saved.problems) && saved.problems.length === problems.length) return saved
  } catch {
    // Unreadable or blocked storage: begin again.
  }
  return fresh()
}

let state = load()
const listeners = new Set<() => void>()

function set(next: Progress) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // The guide still works for this visit without saving.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, () => state)
}

function patchProblem(index: number, patch: Partial<ProblemProgress>): ProblemProgress[] {
  return state.problems.map((problem, i) => (i === index ? { ...problem, ...patch } : problem))
}

// Adds the time since the current problem was opened to that problem's total.
function settled(now: number): ProblemProgress[] {
  if (state.enteredAt === null) return state.problems
  const spentMs = state.problems[state.current].spentMs + (now - state.enteredAt)
  return patchProblem(state.current, { spentMs })
}

export const actions = {
  start() {
    const now = Date.now()
    const begun = fresh()
    begun.problems[0].reached = true
    set({ ...begun, phase: 'work', startedAt: now, enteredAt: now })
  },

  goTo(index: number) {
    if (index === state.current && !state.handingIn) return
    const now = Date.now()
    const withTime = settled(now)
    set({
      ...state,
      current: index,
      enteredAt: now,
      handingIn: false,
      problems: withTime.map((problem, i) => (i === index ? { ...problem, reached: true } : problem)),
    })
  },

  toggleDone(item: number) {
    const done = state.problems[state.current].done.map((ticked, i) => (i === item ? !ticked : ticked))
    set({ ...state, problems: patchProblem(state.current, { done }) })
  },

  toggleHandIn(item: number) {
    const handIn = state.problems[state.current].handIn.map((ticked, i) => (i === item ? !ticked : ticked))
    set({ ...state, problems: patchProblem(state.current, { handIn }) })
  },

  beginHandIn() {
    set({ ...state, handingIn: true })
  },

  cancelHandIn() {
    set({ ...state, handingIn: false })
  },

  // Marks the current problem finished and opens the next one, or ends the session after the last.
  completeCurrent() {
    const finished = state.current
    set({ ...state, problems: patchProblem(finished, { finishedAt: Date.now() }) })
    if (finished + 1 < problems.length) actions.goTo(finished + 1)
    else actions.finish()
  },

  finish() {
    const now = Date.now()
    set({ ...state, phase: 'finished', endedAt: now, handingIn: false, enteredAt: null, problems: settled(now) })
  },

  reopen() {
    set({ ...state, phase: 'work', endedAt: null, enteredAt: Date.now() })
  },

  toggleCollapsed() {
    set({ ...state, collapsed: !state.collapsed })
  },

  startOver() {
    set(fresh())
  },
}

export function minutes(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000))
  if (total < 60) return `${total} min`
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')} min`
}

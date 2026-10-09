// When a step's button changes a setting, the control it changed lights up once, so the eye
// goes from the instruction to the thing it was about.

import { useSyncExternalStore } from 'react'

const counts = new Map<string, number>()
const listeners = new Set<() => void>()

export function flash(target: string) {
  counts.set(target, (counts.get(target) ?? 0) + 1)
  for (const listener of listeners) listener()
}

// Returns how many times `target` has been flashed; 0 means never.
export function useFlash(target: string): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => counts.get(target) ?? 0,
  )
}

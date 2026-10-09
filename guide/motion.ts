// Every transition the guide uses, in one place. With reduced motion switched on they all
// become instant.

import type { Transition } from 'motion/react'
import { useEffect, useState, useSyncExternalStore } from 'react'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (listener) => {
      reducedMotion.addEventListener('change', listener)
      return () => reducedMotion.removeEventListener('change', listener)
    },
    () => reducedMotion.matches,
  )
}

const EASE_ENTER = [0.32, 0.72, 0, 1] as const

const transitions = {
  // Something arriving on screen.
  enter: { duration: 0.24, ease: EASE_ENTER },
  // Something leaving: quicker and quieter than it arrived.
  exit: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  // A thumb or marker sliding between positions.
  slide: { type: 'spring', duration: 0.3, bounce: 0 },
  // The first screen handing over to the workbench.
  page: { duration: 0.36, ease: EASE_ENTER },
} satisfies Record<string, Transition>

const INSTANT: Transition = { duration: 0 }

export function useTransitions(): { reduce: boolean; t: Record<keyof typeof transitions, Transition> } {
  const reduce = usePrefersReducedMotion()
  if (!reduce) return { reduce, t: transitions }
  return { reduce, t: { enter: INSTANT, exit: INSTANT, slide: INSTANT, page: INSTANT } }
}

// False while a component first appears, true afterwards. Things already in place when the page
// loads use it to skip their entrance. (AnimatePresence's own `initial={false}` is not used for
// this: it also silences every animation that starts later inside the same child.)
export function useHasLoaded(): boolean {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => setLoaded(true), [])
  return loaded
}

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useFlash } from './flash'
import { useTransitions } from './motion'
import { MODE_LABEL, type Mode, type Till } from './problems'

const MODES: Mode[] = ['good', 'flaky', 'offline']

export const MODE_DOT: Record<Mode, string> = { good: 'bg-good', flaky: 'bg-flaky', offline: 'bg-offline' }

// Lights up once each time `count` goes up, then leaves the page. With reduced motion it shows
// and hides without moving.
export function FlashRing({ count, className = '' }: { count: number; className?: string }) {
  const { reduce } = useTransitions()
  const [finished, setFinished] = useState(0)

  useEffect(() => {
    if (count === 0) return
    const timer = setTimeout(() => setFinished(count), 1200)
    return () => clearTimeout(timer)
  }, [count])

  if (count === 0 || finished === count) return null

  const ring = `pointer-events-none absolute -inset-1 ring-[3px] ring-mark-deep ${className}`
  if (reduce) return <span aria-hidden className={ring} />
  return (
    <motion.span
      key={count}
      aria-hidden
      className={ring}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}

export function NetworkControl({ till, mode, onChange }: { till: Till; mode: Mode; onChange: (mode: Mode) => void }) {
  const { t } = useTransitions()
  // A change made from the keyboard moves the thumb at once; only a pointer gets the slide.
  const [fromKeyboard, setFromKeyboard] = useState(false)
  const flashed = useFlash(`network-${till}`)

  return (
    <div
      role="group"
      aria-label={`Network for Till ${till.toUpperCase()}`}
      className="relative flex rounded-[0.5rem] bg-ink/[0.06] p-0.5"
    >
      {MODES.map((option) => {
        const selected = option === mode
        return (
          <button
            key={option}
            aria-pressed={selected}
            onClick={(event) => {
              setFromKeyboard(event.detail === 0)
              onChange(option)
            }}
            className={`relative h-7 flex-auto rounded-control px-2.5 text-xs font-medium transition-colors duration-150 ${
              selected ? 'text-ink' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`network-thumb-${till}`}
                className="absolute inset-0 rounded-control bg-paper shadow-[0_1px_2px_oklch(0.25_0.012_60/0.18)]"
                transition={fromKeyboard ? { duration: 0 } : t.slide}
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              <span aria-hidden className={`size-1.5 rounded-full ${MODE_DOT[option]}`} />
              {MODE_LABEL[option]}
            </span>
          </button>
        )
      })}
      <FlashRing count={flashed} className="rounded-[0.7rem]" />
    </div>
  )
}

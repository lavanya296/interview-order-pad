// Small shared pieces: buttons, the tick box, icons and inline code.

import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { useTransitions } from './motion'

const press = 'transition-[scale,background-color,color] duration-150 ease-out active:scale-[0.97]'

export function PrimaryButton({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`h-11 rounded-button bg-ink px-5 text-[15px] font-medium text-paper hover:bg-[color-mix(in_oklch,var(--color-ink)_86%,white)] ${press} ${className}`}
    />
  )
}

export function QuietButton({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`h-9 rounded-button px-3 text-sm text-ink-2 hover:bg-ink/5 hover:text-ink ${press} ${className}`}
    />
  )
}

// A step's button: the highlighter colour says "the guide does this for you".
export function MarkButton({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`h-8 rounded-control bg-mark px-2.5 text-[13px] font-medium text-ink hover:bg-mark-deep ${press} ${className}`}
    />
  )
}

export function IconButton({
  label,
  className = '',
  children,
  ...props
}: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`relative grid size-8 shrink-0 place-items-center rounded-control text-ink-2 after:absolute after:-inset-1 hover:bg-ink/5 hover:text-ink ${press} ${className}`}
    >
      {children}
    </button>
  )
}

// A tick box with its label. The tick draws itself when the box is ticked.
export function Tick({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  const { t } = useTransitions()
  return (
    <label className="group relative flex cursor-pointer items-start gap-3 py-1.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`mt-[0.2em] grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
          checked ? 'border-ink bg-ink text-paper' : 'border-ink/30 bg-paper group-hover:border-ink/60'
        }`}
      >
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M2.5 6.4 5 8.8l4.6-5.4"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={t.enter}
          />
        </svg>
      </span>
      <span className={`transition-colors duration-150 ${checked ? 'text-ink-3' : 'text-ink'}`}>{children}</span>
    </label>
  )
}

// Shows `backticks` as code and **double stars** as the name of a control.
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) => {
        if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
        if (part.startsWith('**')) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// The heading of one part of the instructions.
export function Label({ children }: { children: ReactNode }) {
  return <h3 className="text-[1rem] leading-6 font-semibold">{children}</h3>
}

const icon = {
  viewBox: '0 0 16 16',
  className: 'size-4',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export const Icons = {
  reload: (
    <svg {...icon} aria-hidden>
      <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" />
    </svg>
  ),
  reset: (
    <svg {...icon} aria-hidden>
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8h5.8l.6-8M6.8 7v3.2M9.2 7v3.2" />
    </svg>
  ),
  open: (
    <svg {...icon} aria-hidden>
      <path d="M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5" />
    </svg>
  ),
  chevron: (
    <svg {...icon} aria-hidden>
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
  ),
  fold: (
    <svg {...icon} aria-hidden>
      <path d="M2.5 3h11v10h-11zM6 3v10M10.5 6.5 9 8l1.5 1.5" />
    </svg>
  ),
  close: (
    <svg {...icon} aria-hidden>
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  ),
  check: (
    <svg {...icon} aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  ),
}

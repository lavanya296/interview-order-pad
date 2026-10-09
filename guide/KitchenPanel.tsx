import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useFlash } from './flash'
import { useTransitions } from './motion'
import { FlashRing } from './NetworkControl'
import type { Kitchen } from './server'
import { QuietButton } from './ui'

// The panel shows whatever the API returns, in whatever shape. It only guesses at one thing:
// which field, if any, is the order's number, so that it can be read at a glance.
const NUMBER_FIELDS = ['number', 'orderNumber', 'no', 'id']

// The newest orders are listed; the count above is always the full number.
const SHOWN = 60

function brief(value: unknown): string {
  if (typeof value === 'string') return value.length > 22 ? `${value.slice(0, 21)}…` : value
  if (Array.isArray(value)) return `[${value.length}]`
  if (value !== null && typeof value === 'object') return '{…}'
  return String(value)
}

function summarise(order: unknown): { number: string | null; rest: string } {
  if (order === null || typeof order !== 'object' || Array.isArray(order)) {
    return { number: null, rest: JSON.stringify(order) }
  }
  const fields = Object.entries(order)
  const numberField = NUMBER_FIELDS.find((name) =>
    fields.some(([key, value]) => key === name && (typeof value === 'string' || typeof value === 'number')),
  )
  const number = fields.find(([key]) => key === numberField)
  return {
    number: number ? brief(number[1]) : null,
    rest: fields
      .filter(([key]) => key !== numberField)
      .map(([key, value]) => `${key}: ${brief(value)}`)
      .join(' · '),
  }
}

function Row({ order }: { order: unknown }) {
  const [open, setOpen] = useState(false)
  const { number, rest } = summarise(order)

  return (
    <div className="border-t border-line">
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-ink/[0.03]"
      >
        {number !== null && <span className="shrink-0 text-sm font-semibold tabular-nums">{number}</span>}
        <span className="truncate font-mono text-[11px] text-ink-2">{rest}</span>
      </button>
      {open && (
        <pre className="overflow-auto px-3 pb-3 font-mono text-[11px] leading-4 text-ink-2">
          {JSON.stringify(order, null, 2)}
        </pre>
      )}
    </div>
  )
}

type Props = {
  kitchen: Kitchen
  clearFailed: boolean
  onClear: () => void
}

export function KitchenPanel({ kitchen, clearFailed, onClear }: Props) {
  const { t } = useTransitions()
  const flashed = useFlash('kitchen')
  const orders = kitchen.status === 'ok' ? kitchen.orders : []

  return (
    <aside aria-label="Kitchen" className="relative flex min-h-0 flex-col rounded-card bg-paper shadow-object">
      <header className="px-3 pt-1.5 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Kitchen</h3>
          <QuietButton onClick={onClear} className="-mr-1.5 h-8 px-2 text-xs whitespace-nowrap">
            Clear orders
          </QuietButton>
        </div>
        <p className="text-xs text-ink-2">Orders the server has saved</p>
      </header>

      {kitchen.status === 'ok' && (
        <p className="flex items-baseline gap-2 px-3 pb-2.5" aria-live="polite">
          <span className="relative inline-flex overflow-hidden text-[2.25rem] leading-none font-semibold tracking-[-0.02em] tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={orders.length}
                initial={{ y: '45%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-45%', opacity: 0, transition: t.exit }}
                transition={t.enter}
              >
                {orders.length}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-sm text-ink-2">{orders.length === 1 ? 'order' : 'orders'}</span>
        </p>
      )}

      {clearFailed && (
        <p role="alert" className="px-3 pb-2.5 text-xs text-offline">
          The server did not clear its orders. Stopping and starting <code>pnpm dev</code> also empties them.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {kitchen.status === 'loading' && <p className="px-3 pb-3 text-xs text-ink-3">Reading the server…</p>}
        {kitchen.status === 'down' && (
          <p className="px-3 pb-3 text-xs text-offline">
            The API is not answering. Look at the terminal that is running <code>pnpm dev</code>.
          </p>
        )}
        {kitchen.status === 'unreadable' && (
          <p className="px-3 pb-3 text-xs text-offline">
            This panel reads <code>GET /api/orders</code> and expects a list. It did not get one.
          </p>
        )}
        {kitchen.status === 'ok' && orders.length === 0 && (
          <p className="border-t border-line px-3 py-3 text-xs text-ink-3">
            Nothing yet. Orders appear here when they reach the server.
          </p>
        )}
        <AnimatePresence initial={false}>
          {orders
            .map((order, index) => ({ order, index }))
            .reverse()
            .slice(0, SHOWN)
            .map(({ order, index }) => (
              <motion.div
                key={index}
                layout="position"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: t.exit }}
                transition={t.enter}
              >
                <Row order={order} />
              </motion.div>
            ))}
        </AnimatePresence>
        {orders.length > SHOWN && (
          <p className="border-t border-line px-3 py-3 text-xs text-ink-3">
            and {orders.length - SHOWN} earlier. <code>GET /api/orders</code> has them all.
          </p>
        )}
      </div>

      <FlashRing count={flashed} className="rounded-[1.1rem]" />
    </aside>
  )
}

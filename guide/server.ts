// The guide page's own calls: the Network setting and traffic for each till, and a direct
// reading of what the API has recorded. None of this goes through a till.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode, Till } from './problems'

export type TrafficEntry = {
  id: number
  at: number
  method: string
  path: string
  outcome: 'arrived' | 'lost' | 'answer-lost' | 'api-down'
  status?: number
}

export type GuideState = {
  modes: Record<Till, Mode>
  traffic: Record<Till, TrafficEntry[]>
}

export type Kitchen =
  | { status: 'loading' }
  | { status: 'ok'; orders: unknown[] }
  | { status: 'unreadable' }
  | { status: 'down' }

const EMPTY: GuideState = { modes: { a: 'good', b: 'good' }, traffic: { a: [], b: [] } }

// Calls `read` once a second while the page is visible.
function usePoll(read: () => Promise<void>) {
  const latest = useRef(read)
  latest.current = read
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    async function tick() {
      if (!document.hidden) await latest.current().catch(() => {})
      if (!stopped) timer = setTimeout(tick, 1000)
    }
    tick()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [])
}

export function useGuideState() {
  const [state, setState] = useState<GuideState>(EMPTY)

  const refresh = useCallback(async () => {
    const res = await fetch('/__guide/state', { cache: 'no-store' })
    if (res.ok) setState(await res.json())
  }, [])
  usePoll(refresh)

  const setMode = useCallback(async (tills: Till[], mode: Mode) => {
    setState((current) => {
      const modes = { ...current.modes }
      for (const till of tills) modes[till] = mode
      return { ...current, modes }
    })
    await Promise.all(
      tills.map((till) =>
        fetch('/__guide/network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ till, mode }),
        }),
      ),
    ).catch(() => {})
  }, [])

  return { state, setMode }
}

export function useKitchen() {
  const [kitchen, setKitchen] = useState<Kitchen>({ status: 'loading' })

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      if (res.status === 502) return setKitchen({ status: 'down' })
      const body: unknown = await res.json()
      setKitchen(res.ok && Array.isArray(body) ? { status: 'ok', orders: body } : { status: 'unreadable' })
    } catch {
      setKitchen({ status: 'unreadable' })
    }
  }, [])
  usePoll(refresh)

  // Resolves to false when the API did not clear its orders.
  const clear = useCallback(async () => {
    const res = await fetch('/api/orders', { method: 'DELETE' }).catch(() => null)
    await fetch('/__guide/traffic/clear', { method: 'POST' }).catch(() => {})
    await refresh()
    return res !== null && res.ok
  }, [refresh])

  return { kitchen, clear }
}

export function tillAddress(till: Till): string {
  return `http://${till}.localhost:${window.location.port}/`
}

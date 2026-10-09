import { useState } from 'react'
import { NetworkControl } from './NetworkControl'
import { MODE_CAPTION, type Mode, type Till } from './problems'
import { tillAddress, type TrafficEntry } from './server'
import { IconButton, Icons } from './ui'

function describe(entry: TrafficEntry): { text: string; tone: string } {
  switch (entry.outcome) {
    case 'arrived':
      return { text: `arrived · ${entry.status}`, tone: 'text-ink-2' }
    case 'lost':
      return { text: 'never arrived', tone: 'text-offline' }
    case 'answer-lost':
      return { text: `arrived, answer lost · ${entry.status}`, tone: 'text-[oklch(0.5_0.13_62)]' }
    case 'api-down':
      return { text: 'the API is not running', tone: 'text-offline' }
  }
}

const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function Traffic({ entries }: { entries: TrafficEntry[] }) {
  const [open, setOpen] = useState(false)
  const latest = entries[0]

  return (
    <div>
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center gap-1.5 px-3 text-left text-xs text-ink-2 hover:text-ink"
      >
        <span className={`transition-transform duration-150 ease-out ${open ? 'rotate-90' : ''}`}>{Icons.chevron}</span>
        <span className="font-medium">Traffic</span>
        {latest && !open && (
          <span className="truncate pl-1 text-ink-3">
            {latest.method} {latest.path}: {describe(latest).text}
          </span>
        )}
      </button>
      <div className="fold" data-open={open}>
        <div inert={!open}>
          <ul className="flex max-h-36 flex-col gap-1 overflow-auto px-3 pb-3 font-mono text-[11px] leading-4">
            {entries.length === 0 && <li className="font-sans text-xs text-ink-3">Nothing has been sent from this till yet.</li>}
            {entries.slice(0, 14).map((entry) => {
              const { text, tone } = describe(entry)
              return (
                <li key={entry.id} className="flex gap-3 whitespace-nowrap">
                  <span className="text-ink-3 tabular-nums">{clock.format(entry.at)}</span>
                  <span className="text-ink">
                    {entry.method} {entry.path}
                  </span>
                  <span className={tone}>{text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

type Props = {
  till: Till
  mode: Mode
  traffic: TrafficEntry[]
  onMode: (mode: Mode) => void
}

export function TillFrame({ till, mode, traffic, onMode }: Props) {
  // `path` is what the frame shows; a new `version` makes the frame load again.
  const [view, setView] = useState({ path: '', version: 0 })
  const name = `Till ${till.toUpperCase()}`
  const address = tillAddress(till)

  return (
    <section
      aria-label={name}
      className="@container flex h-full min-w-0 flex-col overflow-hidden rounded-card bg-paper shadow-object"
    >
      {/* In a narrow frame the Network control drops to its own row. */}
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 pt-2.5">
        <h3 className="text-sm font-semibold whitespace-nowrap">{name}</h3>
        <div className="order-last basis-full @[25rem]:order-none @[25rem]:basis-auto">
          <NetworkControl till={till} mode={mode} onChange={onMode} />
        </div>
        <span className="flex-1" />
        <IconButton label={`Reload ${name}`} onClick={() => setView((v) => ({ path: '', version: v.version + 1 }))}>
          {Icons.reload}
        </IconButton>
        <IconButton
          label={`Reset ${name}: clear what it has saved in the browser`}
          onClick={() => setView((v) => ({ path: '__guide/reset', version: v.version + 1 }))}
        >
          {Icons.reset}
        </IconButton>
        <a
          href={address}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${name} in its own tab`}
          title={`Open ${name} in its own tab`}
          className="relative grid size-8 shrink-0 place-items-center rounded-control text-ink-2 transition-colors duration-150 after:absolute after:-inset-1 hover:bg-ink/5 hover:text-ink"
        >
          {Icons.open}
        </a>
      </header>

      <p className="min-h-[2.75rem] px-3 pt-1.5 pb-2 text-xs leading-[1.05rem] text-ink-2">{MODE_CAPTION[mode]}</p>

      <div className="relative min-h-0 flex-1 border-y border-line">
        <iframe key={view.version} src={address + view.path} title={name} className="absolute inset-0 size-full bg-white" />
      </div>

      <Traffic entries={traffic} />
    </section>
  )
}

import { motion } from 'motion/react'
import { useState } from 'react'
import { flash } from './flash'
import { GuidePanel } from './GuidePanel'
import { KitchenPanel } from './KitchenPanel'
import { useHasLoaded, useTransitions } from './motion'
import type { StepAction } from './problems'
import type { Progress } from './progress'
import { useGuideState, useKitchen } from './server'
import { TillFrame } from './TillFrame'

export function Workbench({ progress, onStartOver }: { progress: Progress; onStartOver: () => void }) {
  const { t } = useTransitions()
  const loaded = useHasLoaded()
  const { state, setMode } = useGuideState()
  const { kitchen, clear } = useKitchen()
  const [clearFailed, setClearFailed] = useState(false)

  // The second till arrives with the third problem and then stays.
  const secondTill = progress.problems[2].reached

  async function clearOrders() {
    flash('kitchen')
    setClearFailed(!(await clear()))
  }

  function runAction(action: StepAction) {
    if (action.kind === 'clear') {
      clearOrders()
      return
    }
    setMode(action.tills, action.mode)
    for (const till of action.tills) flash(`network-${till}`)
  }

  return (
    <div className="grid h-dvh grid-cols-[auto_minmax(0,1fr)] overflow-clip bg-desk">
      <GuidePanel progress={progress} onAction={runAction} onStartOver={onStartOver} />

      <main className="@container flex min-h-0 min-w-0 flex-col gap-3 p-4">
        <header className="flex flex-wrap items-baseline gap-x-3 px-1">
          <h2 className="text-sm font-semibold">The till</h2>
          <p className="text-sm text-ink-2">
            This is what you are working on. Its code is in <code>src/</code> and <code>server/</code>.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_13rem] gap-3 @[58rem]:grid-cols-[minmax(0,1fr)_17.5rem] @[58rem]:grid-rows-1">
          <div className="flex min-h-0 min-w-0 gap-3">
            <div className="min-w-0 flex-1">
              <TillFrame till="a" mode={state.modes.a} traffic={state.traffic.a} onMode={(mode) => setMode(['a'], mode)} />
            </div>
            {secondTill && (
              <motion.div
                className="min-w-0 flex-1"
                initial={loaded ? { opacity: 0, x: 28 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={t.page}
              >
                <TillFrame till="b" mode={state.modes.b} traffic={state.traffic.b} onMode={(mode) => setMode(['b'], mode)} />
              </motion.div>
            )}
          </div>

          <KitchenPanel kitchen={kitchen} clearFailed={clearFailed} onClear={clearOrders} />
        </div>
      </main>
    </div>
  )
}

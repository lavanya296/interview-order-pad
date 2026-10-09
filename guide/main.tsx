import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Finish } from './Finish'
import './guide.css'
import { useHasLoaded, useTransitions } from './motion'
import type { Till } from './problems'
import { actions, useProgress } from './progress'
import { tillAddress } from './server'
import { Welcome } from './Welcome'
import { Workbench } from './Workbench'

const TILLS: Till[] = ['a', 'b']

// Puts everything back as it was before anyone sat down: the guide's place and clock, the
// server's orders, both Network settings, and what each till saved in the browser.
async function startOver() {
  actions.startOver()
  const post = (url: string, body?: unknown) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })
  await Promise.allSettled([
    fetch('/api/orders', { method: 'DELETE' }),
    post('/__guide/traffic/clear'),
    ...TILLS.map((till) => post('/__guide/network', { till, mode: 'good' })),
  ])
  for (const till of TILLS) {
    const frame = document.createElement('iframe')
    frame.hidden = true
    frame.src = `${tillAddress(till)}__guide/reset`
    document.body.append(frame)
    setTimeout(() => frame.remove(), 4000)
  }
}

// Opening the guide at /?fresh starts over without a click. It is for whoever sets the machine up.
if (new URLSearchParams(window.location.search).has('fresh')) {
  window.history.replaceState(null, '', '/')
  startOver()
}

function Guide() {
  const progress = useProgress()
  const { t, reduce } = useTransitions()
  const loaded = useHasLoaded()

  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
      <AnimatePresence mode="wait">
        {progress.phase === 'welcome' && (
          <motion.div key="welcome" exit={{ opacity: 0, y: -10, transition: t.exit }}>
            <Welcome />
          </motion.div>
        )}
        {progress.phase === 'work' && (
          <motion.div key="work" initial={loaded ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: t.exit }} transition={t.page}>
            <Workbench progress={progress} onStartOver={startOver} />
          </motion.div>
        )}
        {progress.phase === 'finished' && (
          <motion.div key="finished" initial={loaded ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: t.exit }} transition={t.page}>
            <Finish progress={progress} />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Guide />
  </StrictMode>,
)

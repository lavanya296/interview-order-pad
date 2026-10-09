import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTransitions } from './motion'
import { handInChecks, INTERVIEWER, problems, type StepAction } from './problems'
import { actions, minutes, type Progress } from './progress'
import { Stepper } from './Stepper'
import { IconButton, Icons, Inline, Label, MarkButton, PrimaryButton, QuietButton, Tick } from './ui'

function useNow(everyMs: number): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(timer)
  }, [everyMs])
  return now
}

function ProblemView({ progress, onAction }: { progress: Progress; onAction: (action: StepAction) => void }) {
  const now = useNow(15000)
  const index = progress.current
  const problem = problems[index]
  const state = progress.problems[index]
  const spent = state.spentMs + (progress.enteredAt === null ? 0 : now - progress.enteredAt)

  return (
    <div className="flex flex-col gap-8 px-6 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs text-ink-2 tabular-nums">
          Problem {index + 1} of {problems.length} · about {problem.minutes} minutes · {minutes(spent)} so far
        </p>
        <h2 className="text-[1.8rem] leading-[1.15] font-semibold tracking-[-0.025em]">{problem.title}</h2>
      </header>

      <section className="flex flex-col gap-2.5">
        <Label>What Meera, the cafe owner, says</Label>
        <blockquote className="border-l-2 border-ink pl-4 text-pretty">{problem.report}</blockquote>
      </section>

      <section className="flex flex-col gap-3">
        <Label>See the problem</Label>
        <ol className="flex flex-col gap-3.5">
          {problem.steps.map((step, i) => (
            <li key={step.text} className="grid grid-cols-[1.25rem_1fr] gap-x-2">
              <span className="font-semibold text-ink-3 tabular-nums">{i + 1}</span>
              <div className="flex flex-col items-start gap-2">
                <p>
                  <Inline text={step.text} />
                </p>
                {step.actions && (
                  <div className="flex flex-wrap gap-2">
                    {step.actions.map((action) => (
                      <MarkButton key={action.label} onClick={() => onAction(action)}>
                        {action.label}
                      </MarkButton>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-1 rounded-button bg-ink/[0.05] px-4 py-3">
          <p className="text-sm font-semibold">What is wrong</p>
          <p className="text-pretty">{problem.wrong}</p>
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <Label>Your task</Label>
        <p className="font-medium text-pretty">{problem.task}</p>
        {problem.taskNote && (
          <p className="text-ink-2">
            <Inline text={problem.taskNote} />
          </p>
        )}
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-ink-2">
          <li>
            How you fix it is your decision. The code is in <code>src/</code> and <code>server/</code>.
          </li>
          <li>
            Write what you decide in <code>NOTES.md</code>.
          </li>
          <li>If a choice is about how the cafe should work, ask {INTERVIEWER}.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-1.5">
        <Label>You are done when all of these are true</Label>
        <ul>
          {problem.done.map((item, i) => (
            <li key={item}>
              <Tick checked={state.done[i]} onChange={() => actions.toggleDone(i)}>
                <Inline text={item} />
              </Tick>
            </li>
          ))}
        </ul>
        <p className="pt-1 text-sm text-ink-2">Then press the button below.</p>
      </section>
    </div>
  )
}

function HandInView({ progress }: { progress: Progress }) {
  const index = progress.current
  const problem = problems[index]
  const state = progress.problems[index]
  return (
    <div className="flex flex-col gap-7 px-6 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs text-ink-2">
          Problem {index + 1} of {problems.length}: {problem.title}
        </p>
        <h2 className="text-[1.8rem] leading-[1.15] font-semibold tracking-[-0.025em]">Hand in this problem</h2>
      </header>

      <section className="flex flex-col gap-1.5">
        <Label>First, check these three things</Label>
        <ul>
          {handInChecks.map((item, i) => (
            <li key={item}>
              <Tick checked={state.handIn[i]} onChange={() => actions.toggleHandIn(i)}>
                <Inline text={item} />
              </Tick>
            </li>
          ))}
        </ul>
        <p className="pt-1 text-sm text-ink-2">To commit, run this in the project folder:</p>
        <pre className="overflow-x-auto rounded-button bg-ink/[0.05] px-3.5 py-2.5 font-mono text-[12.5px] leading-5">
          git add -A{'\n'}git commit -m "Problem {index + 1}: {problem.title.toLowerCase()}"
        </pre>
      </section>

      <section className="flex flex-col gap-2">
        <Label>Then tell {INTERVIEWER} you are ready</Label>
        <p className="text-ink-2">He will ask you to walk him through what you changed and why.</p>
      </section>
    </div>
  )
}

function Help({ onClose, onStartOver }: { onClose: (byKey: boolean) => void; onStartOver: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose(true)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="flex h-full flex-col overflow-auto bg-paper">
      <header className="flex items-center justify-between px-6 pt-5">
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em]">Help</h2>
        <IconButton ref={closeButton} label="Close help" onClick={(event) => onClose(event.detail === 0)}>
          {Icons.close}
        </IconButton>
      </header>
      <div className="flex flex-col gap-7 px-6 py-5">
        <section className="flex flex-col gap-2">
          <Label>What is on this screen</Label>
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="font-semibold">Network, above each till</dt>
              <dd className="text-ink-2">Sets that till’s connection to Good, Flaky or Offline.</dd>
            </div>
            <div>
              <dt className="font-semibold">Kitchen, on the right</dt>
              <dd className="text-ink-2">The orders the server has saved. Compare it with what the till shows.</dd>
            </div>
            <div>
              <dt className="font-semibold">Traffic, under each till</dt>
              <dd className="text-ink-2">Every request the till sent, and what happened to it.</dd>
            </div>
            <div>
              <dt className="font-semibold">The three icons above each till</dt>
              <dd className="text-ink-2">
                The arrow loads the till again. The bin clears what the till has saved in the browser. The last one
                opens the till in its own tab, for the browser’s developer tools.
              </dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-2">
          <Label>Your code</Label>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt>
              <code>src/</code>
            </dt>
            <dd>the till’s screen</dd>
            <dt>
              <code>server/</code>
            </dt>
            <dd>the API the till talks to</dd>
            <dt>
              <code>guide/</code>
            </dt>
            <dd className="text-ink-2">this page and the Network control. Not part of the task.</dd>
          </dl>
        </section>

        <section className="flex flex-col gap-2">
          <Label>Commands</Label>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt>
              <code>pnpm test</code>
            </dt>
            <dd>runs the tests</dd>
            <dt>
              <code>pnpm check</code>
            </dt>
            <dd>runs the type check, then the tests</dd>
          </dl>
          <p className="text-sm text-ink-2">
            The till reloads by itself when you save. The API restarts when you save a file in <code>server/</code>,
            and a restart empties its orders.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <Label>The two tills</Label>
          <p className="text-sm text-ink-2">
            Till A is at <code>a.localhost</code> and Till B at <code>b.localhost</code>. They are separate addresses, so
            what one till saves in the browser the other cannot see, as with two real machines.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <Label>Rules</Label>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li>Use Claude Code as much as you like.</li>
            <li>Be ready to explain every line you hand in.</li>
            <li>Add a package only if you can say why.</li>
            <li>Ask {INTERVIEWER} when a choice is about how the cafe should work.</li>
          </ul>
        </section>

        <section className="flex flex-col items-start gap-2 border-t border-line pt-5">
          {confirming ? (
            <>
              <p className="text-sm">This clears your place, your ticks and the clock.</p>
              <div className="flex gap-2">
                <QuietButton onClick={onStartOver} className="bg-ink/5 text-ink">
                  Start again
                </QuietButton>
                <QuietButton onClick={() => setConfirming(false)}>Keep going</QuietButton>
              </div>
            </>
          ) : (
            <QuietButton onClick={() => setConfirming(true)} className="-ml-3">
              Start again from the beginning
            </QuietButton>
          )}
        </section>
      </div>
    </div>
  )
}

function CollapsedRail({ progress }: { progress: Progress }) {
  const now = useNow(15000)
  return (
    <aside aria-label="Instructions, folded" className="flex h-dvh w-14 flex-col items-center gap-4 border-r border-line bg-paper py-3">
      <IconButton label="Show the instructions" onClick={actions.toggleCollapsed} className="-scale-x-100">
        {Icons.fold}
      </IconButton>
      <span className="grid size-6 place-items-center rounded-full bg-ink text-xs font-semibold text-paper tabular-nums">
        {progress.current + 1}
      </span>
      <span className="text-xs text-ink-2 tabular-nums [writing-mode:vertical-rl]">
        {minutes(now - (progress.startedAt ?? now))}
      </span>
    </aside>
  )
}

type Props = {
  progress: Progress
  onAction: (action: StepAction) => void
  onStartOver: () => void
}

export function GuidePanel({ progress, onAction, onStartOver }: Props) {
  const { t } = useTransitions()
  const now = useNow(15000)
  const [helpOpen, setHelpOpen] = useState(false)
  // Help shut with Escape goes at once; shut with the pointer it fades.
  const [helpClosedByKey, setHelpClosedByKey] = useState(false)
  const helpButton = useRef<HTMLButtonElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // Problems sit left to right, each followed by its hand-in page. The text slides the way
  // she moved.
  const position = progress.current * 2 + (progress.handingIn ? 1 : 0)
  const [previous, setPrevious] = useState(position)
  const [direction, setDirection] = useState(1)
  if (position !== previous) {
    setDirection(position > previous ? 1 : -1)
    setPrevious(position)
  }

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [position])

  if (progress.collapsed) return <CollapsedRail progress={progress} />

  const last = progress.current === problems.length - 1

  function closeHelp(byKey: boolean) {
    setHelpClosedByKey(byKey)
    setHelpOpen(false)
    helpButton.current?.focus()
  }

  return (
    <aside aria-label="Instructions" className="relative flex h-dvh w-[25.5rem] flex-col border-r border-line bg-paper">
      <header className="flex flex-col gap-4 border-b border-line px-6 pt-4 pb-4">
        <div className="flex items-center gap-1">
          <p className="font-semibold tracking-[-0.01em]">Order pad</p>
          <span className="flex-1" />
          <p className="pr-2 text-sm text-ink-2 tabular-nums" title="Time since you pressed Start">
            {minutes(now - (progress.startedAt ?? now))}
          </p>
          <QuietButton ref={helpButton} onClick={() => setHelpOpen(true)} aria-expanded={helpOpen} className="h-8 px-2.5">
            Help
          </QuietButton>
          <IconButton label="Fold the instructions away" onClick={actions.toggleCollapsed}>
            {Icons.fold}
          </IconButton>
        </div>
        <Stepper progress={progress} />
      </header>

      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)]"
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={position}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 14 }),
              shown: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -10, transition: t.exit }),
            }}
            initial="enter"
            animate="shown"
            exit="exit"
            transition={t.enter}
          >
            {progress.handingIn ? <HandInView progress={progress} /> : <ProblemView progress={progress} onAction={onAction} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex flex-col gap-1 border-t border-line px-6 pt-4 pb-3">
        {progress.handingIn ? (
          <>
            <PrimaryButton onClick={actions.completeCurrent}>
              {last ? 'Finish' : `Start problem ${progress.current + 2}`}
            </PrimaryButton>
            <QuietButton onClick={actions.cancelHandIn}>Back to the problem</QuietButton>
          </>
        ) : (
          <>
            <PrimaryButton onClick={actions.beginHandIn}>I have finished this problem</PrimaryButton>
            {last ? (
              <QuietButton onClick={actions.finish}>End the session here</QuietButton>
            ) : (
              <QuietButton onClick={() => actions.goTo(progress.current + 1)}>Move on without finishing</QuietButton>
            )}
          </>
        )}
      </footer>

      <AnimatePresence custom={helpClosedByKey}>
        {helpOpen && (
          <motion.div
            role="region"
            aria-label="Help"
            className="absolute inset-0 z-10"
            custom={helpClosedByKey}
            variants={{
              hidden: { opacity: 0, y: 10 },
              shown: { opacity: 1, y: 0 },
              gone: (byKey: boolean) => ({ opacity: 0, y: 6, transition: byKey ? { duration: 0 } : t.exit }),
            }}
            initial="hidden"
            animate="shown"
            exit="gone"
            transition={t.enter}
          >
            <Help
              onClose={closeHelp}
              onStartOver={() => {
                setHelpOpen(false)
                onStartOver()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}

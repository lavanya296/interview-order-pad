import { motion } from 'motion/react'
import { useTransitions } from './motion'
import { problems } from './problems'
import { actions, type Progress } from './progress'
import { Icons } from './ui'

export function Stepper({ progress }: { progress: Progress }) {
  const { t } = useTransitions()
  const furthest = progress.problems.reduce((last, problem, i) => (problem.reached ? i : last), 0)

  return (
    <ol className="grid grid-cols-3">
      {problems.map((problem, i) => {
        const { reached, finishedAt } = progress.problems[i]
        const current = i === progress.current
        const finished = finishedAt !== null

        let node = 'border-ink/20 text-ink-3'
        if (current) node = 'border-ink bg-ink text-paper'
        else if (reached) node = 'border-ink/50 text-ink'

        return (
          <li key={problem.title} className="relative">
            {i < problems.length - 1 && (
              <span aria-hidden className="absolute top-3 right-1 left-8 h-px bg-ink/15">
                <motion.span
                  className="absolute inset-0 origin-left bg-ink"
                  initial={false}
                  animate={{ scaleX: furthest > i ? 1 : 0 }}
                  transition={t.page}
                />
              </span>
            )}
            <button
              disabled={!reached}
              onClick={() => actions.goTo(i)}
              aria-current={current ? 'step' : undefined}
              className="flex flex-col items-start gap-1.5 rounded-control text-left disabled:cursor-default"
            >
              <span
                className={`grid size-6 place-items-center rounded-full border text-xs font-semibold tabular-nums transition-colors duration-150 ${node}`}
              >
                {finished ? Icons.check : i + 1}
              </span>
              <span className={`text-xs font-medium ${current ? 'text-ink' : reached ? 'text-ink-2' : 'text-ink-3'}`}>
                {problem.title}
                {finished && <span className="sr-only"> (finished)</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

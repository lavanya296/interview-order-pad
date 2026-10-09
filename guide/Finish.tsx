import { INTERVIEWER, problems } from './problems'
import { actions, minutes, type Progress } from './progress'
import { QuietButton } from './ui'

export function Finish({ progress }: { progress: Progress }) {
  const total = (progress.endedAt ?? Date.now()) - (progress.startedAt ?? Date.now())

  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto flex min-h-dvh max-w-[35rem] flex-col justify-center gap-9 px-8 py-16">
        <div className="flex flex-col gap-5">
          <h1 className="text-[2.9rem] leading-[1.05] font-semibold tracking-[-0.03em]">That is the session</h1>
          <p className="text-[1.15rem] leading-[1.5] text-ink-2 text-pretty">
            Now walk {INTERVIEWER} through it: what you changed, what you chose and why, and what you would do next.
          </p>
        </div>

        <table className="w-full text-left">
          <caption className="sr-only">Time spent on each problem</caption>
          <tbody>
            {problems.map((problem, i) => {
              const state = progress.problems[i]
              let outcome = 'not reached'
              if (state.finishedAt !== null) outcome = 'finished'
              else if (state.reached) outcome = 'not finished'
              return (
                <tr key={problem.title} className="border-t border-line">
                  <th scope="row" className="py-3 pr-4 text-[1.07rem] font-semibold">
                    {problem.title}
                  </th>
                  <td className="py-3 pr-4 text-sm text-ink-2">{outcome}</td>
                  <td className="py-3 text-right text-sm tabular-nums">{state.reached ? minutes(state.spentMs) : ''}</td>
                </tr>
              )
            })}
            <tr className="border-t border-ink">
              <th scope="row" className="py-3 pr-4 text-sm font-semibold">
                From Start to here
              </th>
              <td />
              <td className="py-3 text-right text-sm font-semibold tabular-nums">{minutes(total)}</td>
            </tr>
          </tbody>
        </table>

        <QuietButton onClick={actions.reopen} className="-ml-3 self-start">
          Back to the workbench
        </QuietButton>
      </div>
    </main>
  )
}

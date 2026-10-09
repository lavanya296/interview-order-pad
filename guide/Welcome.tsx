import { INTERVIEWER, problems } from './problems'
import { actions } from './progress'
import { Inline, PrimaryButton } from './ui'

const steps = [
  { title: 'Read the problem.', text: 'It is on the left of the next screen, in the words of Meera, the cafe owner.' },
  { title: 'See it happen.', text: 'The till runs on the right. A few numbered steps show you the fault.' },
  { title: 'Fix it.', text: 'Change the code in `src/` and `server/`. How you fix it is your decision.' },
  { title: 'Show it works.', text: `Tick off the checks, then explain your changes to ${INTERVIEWER}.` },
]

export function Welcome() {
  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto grid min-h-dvh max-w-[72rem] content-center gap-x-20 gap-y-12 px-8 py-10 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-9">
          <p className="font-semibold tracking-[-0.01em]">Order pad</p>

          <div className="flex flex-col gap-4">
            <h1 className="text-[2.9rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
              Fix three problems on a cafe till
            </h1>
            <p className="max-w-[33rem] text-[1.15rem] leading-[1.5] text-ink-2 text-pretty">
              Meera runs a small cafe. Her till takes orders, but three things go wrong. You fix them one at a time. You
              have about two and a half hours.
            </p>
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-[1.07rem] font-semibold">For each problem</h2>
            <ol className="flex max-w-[33rem] flex-col gap-3">
              {steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[1.5rem_1fr] gap-x-3">
                  <span className="font-semibold text-ink-3 tabular-nums">{i + 1}</span>
                  <p>
                    <strong className="font-semibold">{step.title}</strong> <Inline text={step.text} />
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <PrimaryButton onClick={actions.start} className="h-12 px-8 text-base">
              Start
            </PrimaryButton>
            <p className="text-sm text-ink-3">The clock starts when you press Start. It only counts up.</p>
          </div>
        </div>

        <aside className="flex max-w-[30rem] flex-col gap-4 lg:pt-[4.6rem]">
          <h2 className="text-[1.07rem] font-semibold">The three problems</h2>
          <ol className="flex flex-col">
            {problems.map((problem, i) => (
              <li key={problem.title} className="grid grid-cols-[1.5rem_1fr] gap-x-4">
                <div className="flex flex-col items-center">
                  <span className="grid size-6 place-items-center rounded-full border border-ink/50 text-xs font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  {i < problems.length - 1 && <span aria-hidden className="w-px flex-1 bg-ink/15" />}
                </div>
                <div className="flex flex-col gap-0.5 pb-8">
                  <p className="text-[1.2rem] leading-6 font-semibold tracking-[-0.01em]">{problem.title}</p>
                  <p className="text-sm text-ink-2 tabular-nums">about {problem.minutes} minutes</p>
                </div>
              </li>
            ))}
          </ol>

          <section className="flex flex-col gap-3">
            <h2 className="text-[1.07rem] font-semibold">Good to know</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>Use Claude Code as much as you like. You will be asked to explain every change, so read what it writes.</li>
              <li>
                Some details are left open on purpose. If a choice is about how the cafe should work, ask {INTERVIEWER}.
                He answers for Meera.
              </li>
              <li>We look at three things: whether you can explain your work, how you choose, and how you prove it works.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  )
}

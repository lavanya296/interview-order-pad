// The wording of the assignment.
// In any text here, `backticks` show as code and **double stars** show as the name of a control.

export const INTERVIEWER = 'Tarun'

export type Till = 'a' | 'b'
export type Mode = 'good' | 'flaky' | 'offline'

export type StepAction =
  | { kind: 'network'; tills: Till[]; mode: Mode; label: string }
  | { kind: 'clear'; label: string }

export type Step = { text: string; actions?: StepAction[] }

export type Problem = {
  title: string
  minutes: number
  // What the cafe owner said.
  report: string
  // One action each, in order, to make the fault appear.
  steps: Step[]
  // What is on the screen after the steps, and why it is wrong.
  wrong: string
  task: string
  taskNote?: string
  done: string[]
}

export const MODE_LABEL: Record<Mode, string> = { good: 'Good', flaky: 'Flaky', offline: 'Offline' }

export const MODE_CAPTION: Record<Mode, string> = {
  good: 'Everything arrives.',
  flaky: 'Slow. Of what the till sends, about 1 in 3 never arrives and 1 in 3 arrives but the answer is lost.',
  offline: 'Nothing gets through.',
}

export const problems: Problem[] = [
  {
    title: 'The pennies',
    minutes: 35,
    report:
      'The Taken today figure on my till is a long string of digits. And when I add up the day’s receipts on a calculator, the till is a penny or two out. It is worse on days with a lot of staff discounts.',
    steps: [
      { text: 'Empty the day’s orders.', actions: [{ kind: 'clear', label: 'Clear orders' }] },
      { text: 'On the till, tick **Staff discount**, press **Latte**, press **Pot of tea**, then press **Place order**.' },
      { text: 'Do step 2 two more times, so the till has three orders.' },
      { text: 'Read **Taken today** at the top of the till.' },
    ],
    wrong: 'Each order shows £5.81, so three of them should come to £17.43. Taken today shows £17.415000000000003.',
    task: 'Make every amount on the till correct to the penny.',
    done: [
      'Taken today always equals the orders in the list, added up.',
      'Every amount shows pounds and two digits of pence, like £2.50.',
      'The till and the server always agree on an order’s total.',
      'A test fails on the old code and passes on yours.',
    ],
  },
  {
    title: 'The bad Wi-Fi',
    minutes: 65,
    report:
      'The Wi-Fi in the cafe keeps dropping. Staff press Place order, it fails, and they press again. Sometimes the kitchen never gets the order. Sometimes the kitchen gets it twice and makes two of everything. And while the till is trying, the queue has to wait.',
    steps: [
      {
        text: 'Empty the day’s orders and give Till A a bad connection.',
        actions: [
          { kind: 'clear', label: 'Clear orders' },
          { kind: 'network', tills: ['a'], mode: 'flaky', label: 'Set Till A to Flaky' },
        ],
      },
      {
        text: 'On the till, press **Espresso**, then **Place order**. If the till says the order did not go through, press **Place order** again until it says the order is placed.',
      },
      { text: 'Do step 2 five more times, so you have placed six orders.' },
      { text: 'Count the orders in the **Kitchen** panel on the right. It shows what the server has saved.' },
      { text: 'Press **Traffic** under the till. It lists every request the till sent and what happened to it.' },
    ],
    wrong:
      'You placed six orders, and the Kitchen has more than six, because some arrived twice. You also had to wait and press again. An order that fails and is not pressed again never arrives at all.',
    task: 'Make every order the cashier places reach the kitchen exactly once, with one press and no waiting.',
    done: [
      'On Flaky, you place six orders with one press each. The Kitchen ends up with six, each one once.',
      'The basket clears at once, so the cashier can start the next order while the last one is still being sent.',
      'You reload the till while orders are still being sent. They still arrive, once each.',
      'You set Offline, place three orders, then set Good. All three arrive, once each.',
      'A test covers the part most likely to break.',
    ],
  },
  {
    title: 'The second till',
    minutes: 40,
    report:
      'We have bought a second till. The kitchen calls out order numbers, so both tills must show every order, and two orders must never have the same number. The cashier tells the customer their number when they pay. When the Wi-Fi is down the till has no number to give, and then nobody knows whose coffee is whose.',
    steps: [
      {
        text: 'Till B is now next to Till A. Place any order on **Till A**, then look at **Till B**. The order is not there until you press Till B’s reload arrow.',
      },
      {
        text: 'Take Till A’s connection away, then place an order on Till A. The cashier has no number to give the customer.',
        actions: [{ kind: 'network', tills: ['a'], mode: 'offline', label: 'Set Till A to Offline' }],
      },
      {
        text: 'Put both connections back.',
        actions: [{ kind: 'network', tills: ['a', 'b'], mode: 'good', label: 'Set both tills to Good' }],
      },
    ],
    wrong:
      'A till shows another till’s orders only after a reload. And an order gets its number from the server, so a till with no connection cannot give one.',
    task: 'Make both tills show every order within a few seconds. Give every order a number the moment it is placed, even with no connection, and make sure no two orders ever get the same number.',
    taskNote:
      'This problem has more than one good answer. Decide how the numbers should work, write your plan in `NOTES.md`, then build as much of it as you can. A clear plan with part of it built is a good result.',
    done: [
      'An order placed on one till appears on the other within a few seconds, without a reload.',
      'An order placed while Offline shows its number straight away.',
      'With both tills Offline, you place two orders on each, then set both to Good. The Kitchen has four orders with four different numbers.',
      '`NOTES.md` explains how the numbers are made and what you would do with more time.',
    ],
  },
]

export const handInChecks = [
  '`pnpm check` passes.',
  '`NOTES.md` says what you decided and what is not done.',
  'Your work is committed.',
]

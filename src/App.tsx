import { useEffect, useState } from 'react'
import { getMenu, getOrders, placeOrder, type MenuItem, type Order, type OrderLine } from './api'
import { orderTotal } from './total'

// Each till has its own address: a.localhost is Till A, b.localhost is Till B.
const TILL = window.location.hostname.startsWith('b.') ? 'B' : 'A'

export function App() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [basket, setBasket] = useState<OrderLine[]>([])
  const [staffDiscount, setStaffDiscount] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState<{ kind: 'placed' | 'failed'; text: string } | null>(null)

  useEffect(() => {
    getMenu().then(setMenu)
    getOrders().then(setOrders)
  }, [])

  const total = orderTotal(basket, staffDiscount)
  const totalOrders = orders.reduce((sum, order) => sum + order.total, 0)
  const takenToday = totalOrders.toFixed(2)

  function add(item: MenuItem) {
    setMessage(null)
    setBasket((lines) => {
      const existing = lines.find((line) => line.itemId === item.id)
      if (existing) {
        return lines.map((line) => (line.itemId === item.id ? { ...line, qty: line.qty + 1 } : line))
      }
      return [...lines, { itemId: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }

  function changeQty(itemId: string, by: number) {
    setBasket((lines) =>
      lines
        .map((line) => (line.itemId === itemId ? { ...line, qty: line.qty + by } : line))
        .filter((line) => line.qty > 0),
    )
  }

  async function handlePlaceOrder() {
    setPlacing(true)
    setMessage(null)
    try {
      const order = await placeOrder({ till: TILL, lines: basket, staffDiscount, total })
      setBasket([])
      setStaffDiscount(false)
      setMessage({ kind: 'placed', text: `Order ${order.number} placed.` })
      setOrders(await getOrders())
    } catch {
      setMessage({ kind: 'failed', text: 'The order did not go through. Press Place order again.' })
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900 antialiased">
      <header className="flex items-center justify-between gap-4 border-b border-black/10 bg-white px-4 py-3">
        <h1 className="text-base font-semibold">Till {TILL}</h1>
        <p className="text-sm text-stone-600">
          Taken today <span className="font-semibold text-stone-900 tabular-nums">£{takenToday}</span>
        </p>
      </header>

      <main className="grid items-start gap-4 p-4 sm:grid-cols-[1fr_17rem]">
        <section aria-label="Menu" className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => add(item)}
              className="flex min-h-16 flex-col justify-between rounded-lg border border-black/10 bg-white p-3 text-left transition-[background-color,scale] duration-150 hover:bg-stone-50 active:scale-[0.97] motion-reduce:transition-none"
            >
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm text-stone-600 tabular-nums">£{item.price.toFixed(2)}</span>
            </button>
          ))}
        </section>

        <section aria-label="Basket" className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4">
          <h2 className="text-sm font-semibold">Basket</h2>

          {basket.length === 0 ? (
            <p className="text-sm text-stone-600">Tap an item to start an order.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {basket.map((line) => (
                <li key={line.itemId} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{line.name}</span>
                  <button
                    onClick={() => changeQty(line.itemId, -1)}
                    aria-label={`One fewer ${line.name}`}
                    className="size-8 rounded-md border border-black/10 hover:bg-stone-50"
                  >
                    −
                  </button>
                  <span className="w-5 text-center tabular-nums">{line.qty}</span>
                  <button
                    onClick={() => changeQty(line.itemId, 1)}
                    aria-label={`One more ${line.name}`}
                    className="size-8 rounded-md border border-black/10 hover:bg-stone-50"
                  >
                    +
                  </button>
                  <span className="w-14 text-right tabular-nums">£{(line.price * line.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={staffDiscount}
              onChange={(event) => setStaffDiscount(event.target.checked)}
              className="size-4 accent-emerald-800"
            />
            Staff discount, 10% off
          </label>

          <div className="flex items-baseline justify-between border-t border-black/10 pt-3">
            <span className="text-sm text-stone-600">Total</span>
            <span className="text-xl font-semibold tabular-nums">£{total.toFixed(2)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={basket.length === 0 || placing}
            className="rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition-[background-color,scale] duration-150 hover:bg-emerald-900 active:scale-[0.97] disabled:bg-stone-200 disabled:text-stone-500 motion-reduce:transition-none"
          >
            {placing ? 'Placing…' : 'Place order'}
          </button>

          {message && (
            <p role="status" className={message.kind === 'failed' ? 'text-sm text-red-700' : 'text-sm text-stone-700'}>
              {message.text}
            </p>
          )}
        </section>

        <section aria-label="Orders" className="sm:col-span-2">
          <h2 className="mb-2 text-sm font-semibold">Orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-stone-600">No orders yet today.</p>
          ) : (
            <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
              {[...orders].reverse().map((order) => (
                <li key={order.number} className="flex items-baseline gap-3 px-4 py-2 text-sm">
                  <span className="w-8 font-semibold tabular-nums">{order.number}</span>
                  <span className="flex-1 text-stone-600">
                    {order.lines.map((line) => `${line.qty} × ${line.name}`).join(', ')}
                    {order.staffDiscount ? ' (staff)' : ''}
                  </span>
                  <span className="text-stone-500">Till {order.till}</span>
                  <span className="w-14 text-right tabular-nums">£{order.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

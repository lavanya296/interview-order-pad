import { orderTotal } from '../src/total.ts'
import type { MenuItem } from './menu'

type OrderLine = { itemId: string; name: string; price: number; qty: number }

export type PricedOrder =
  | { ok: true; lines: OrderLine[]; total: number }
  | { ok: false; error: string }

// The server works out the total itself from the menu, so a till can't save a wrong price or skip the discount.
export function priceOrder(
  body: { lines?: unknown; staffDiscount?: unknown; total?: unknown },
  menu: MenuItem[],
): PricedOrder {
  const { lines, staffDiscount, total } = body

  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: 'An order needs at least one line.' }
  }
  if (typeof staffDiscount !== 'boolean') {
    return { ok: false, error: 'staffDiscount must be true or false.' }
  }

  const priced: OrderLine[] = []
  for (const line of lines) {
    const item = menu.find((menuItem) => menuItem.id === line?.itemId)
    if (!item) {
      return { ok: false, error: `${line?.itemId} is not on the menu.` }
    }
    if (!Number.isInteger(line.qty) || line.qty < 1) {
      return { ok: false, error: `${item.name} needs a quantity of 1 or more.` }
    }
    priced.push({ itemId: item.id, name: item.name, price: item.price, qty: line.qty })
  }

  const serverTotal = orderTotal(priced, staffDiscount)
  if (total !== serverTotal) {
    return { ok: false, error: `The till's total (${total}) does not match the order (${serverTotal.toFixed(2)}).` }
  }

  return { ok: true, lines: priced, total: serverTotal }
}

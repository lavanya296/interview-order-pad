export type PricedLine = { price: number; qty: number }

// A whole-number percentage, so the discount maths never touches a binary fraction like 0.9.
export const STAFF_DISCOUNT_PERCENT = 10
export const STAFF_DISCOUNT = STAFF_DISCOUNT_PERCENT / 100

// Money is worked out in whole pence so totals never pick up float noise like 14.850000000000001.
export const toPence = (pounds: number) => Math.round(pounds * 100)

// Takes `percent` off a whole-pence amount; half a penny rounds up. Every step is integer maths.
export function applyDiscount(pence: number, percent: number): number {
  return Math.floor((pence * (100 - percent) + 50) / 100)
}

export function orderTotal(lines: PricedLine[], staffDiscount: boolean): number {
  const subtotal = lines.reduce((sum, line) => sum + toPence(line.price) * line.qty, 0)
  const total = staffDiscount ? applyDiscount(subtotal, STAFF_DISCOUNT_PERCENT) : subtotal
  return total / 100
}

export function takings(orders: { total: number }[]): number {
  return orders.reduce((sum, order) => sum + toPence(order.total), 0) / 100
}

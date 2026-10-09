export type PricedLine = { price: number; qty: number }

export const STAFF_DISCOUNT = 0.1

export function orderTotal(lines: PricedLine[], staffDiscount: boolean): number {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0)
  return staffDiscount ? subtotal * (1 - STAFF_DISCOUNT) : subtotal
}

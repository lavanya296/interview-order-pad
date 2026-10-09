import { describe, expect, it } from 'vitest'
import { orderTotal, takings } from './total'

describe('orderTotal', () => {
  it('adds up the lines', () => {
    const lines = [
      { price: 3, qty: 2 },
      { price: 2.5, qty: 1 },
    ]
    expect(orderTotal(lines, false)).toBe(8.5)
  })

  it('is zero for an empty basket', () => {
    expect(orderTotal([], false)).toBe(0)
    expect(orderTotal([], true)).toBe(0)
  })

  it('multiplies price by quantity', () => {
    expect(orderTotal([{ price: 2.85, qty: 3 }], false)).toBe(8.55)
  })

  it('takes 10% off with the staff discount', () => {
    expect(orderTotal([{ price: 10, qty: 1 }], true)).toBe(9)
    expect(orderTotal([{ price: 3, qty: 2 }, { price: 2.5, qty: 1 }], true)).toBe(7.65)
  })

  it('shows prices that do not divide evenly to the penny', () => {
    // 8.55 with 10% off is 7.695, so the till has to round it.
    expect(orderTotal([{ price: 8.55, qty: 1 }], true)).toBe(7.7)
  })
})

describe('takings', () => {
  it('is zero with no orders', () => {
    expect(takings([])).toBe(0)
  })

  it('adds up every order total', () => {
    expect(takings([{ total: 8.55 }, { total: 6.3 }])).toBe(14.85)
  })
})

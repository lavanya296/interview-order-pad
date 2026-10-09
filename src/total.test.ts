import { describe, expect, it } from 'vitest'
import { orderTotal } from './total'

describe('orderTotal', () => {
  it('adds up the lines', () => {
    const lines = [
      { price: 3, qty: 2 },
      { price: 2.5, qty: 1 },
    ]
    expect(orderTotal(lines, false)).toBe(8.5)
  })
})

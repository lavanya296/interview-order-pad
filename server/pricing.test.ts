import { describe, expect, it } from 'vitest'
import { menu } from './menu'
import { priceOrder } from './pricing'

const line = (itemId: string, qty: number, price = 0) => ({ itemId, name: '', price, qty })

describe('priceOrder', () => {
  it('accepts an order whose total matches the menu', () => {
    // 2 flat whites (3.40) + 1 toastie (6.95) = 13.75
    const result = priceOrder({ lines: [line('flat-white', 2), line('toastie', 1)], staffDiscount: false, total: 13.75 }, menu)
    expect(result).toMatchObject({ ok: true, total: 13.75 })
  })

  it('applies the 10% staff discount', () => {
    // 13.75 - 10% = 12.375, rounded to 12.38
    const result = priceOrder({ lines: [line('flat-white', 2), line('toastie', 1)], staffDiscount: true, total: 12.38 }, menu)
    expect(result).toMatchObject({ ok: true, total: 12.38 })
  })

  it('rejects a discounted order sent without the discount taken off', () => {
    const result = priceOrder({ lines: [line('flat-white', 2), line('toastie', 1)], staffDiscount: true, total: 13.75 }, menu)
    expect(result.ok).toBe(false)
  })

  it('uses the menu price, not the price the till sent', () => {
    const result = priceOrder({ lines: [line('brownie', 1, 0.01)], staffDiscount: false, total: 2.99 }, menu)
    expect(result).toMatchObject({ ok: true, lines: [{ price: 2.99 }], total: 2.99 })
  })

  it('rejects a total that does not match', () => {
    expect(priceOrder({ lines: [line('brownie', 1)], staffDiscount: false, total: 0.01 }, menu).ok).toBe(false)
  })

  it('rejects items that are not on the menu', () => {
    expect(priceOrder({ lines: [line('caviar', 1)], staffDiscount: false, total: 0 }, menu).ok).toBe(false)
  })

  it('rejects zero, negative or fractional quantities', () => {
    for (const qty of [0, -1, 1.5]) {
      expect(priceOrder({ lines: [line('tea', qty)], staffDiscount: false, total: 0 }, menu).ok).toBe(false)
    }
  })

  it('rejects an empty order', () => {
    expect(priceOrder({ lines: [], staffDiscount: false, total: 0 }, menu).ok).toBe(false)
  })

  it('prices every menu item correctly, with and without the discount', () => {
    for (const item of menu) {
      // Whole-pence maths read from the price text ("2.85" → 285), so no binary fractions are involved.
      const pence = Number(item.price.toFixed(2).replace('.', ''))
      const full = pence / 100
      const discounted = Math.floor((pence * 90 + 50) / 100) / 100
      expect(priceOrder({ lines: [line(item.id, 1)], staffDiscount: false, total: full }, menu)).toMatchObject({ ok: true, total: full })
      expect(priceOrder({ lines: [line(item.id, 1)], staffDiscount: true, total: discounted }, menu)).toMatchObject({ ok: true, total: discounted })
    }
  })
})

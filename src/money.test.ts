import { describe, expect, it } from 'vitest'
import { menu } from '../server/menu'
import { applyDiscount, orderTotal, STAFF_DISCOUNT_PERCENT, takings, toPence } from './total'

// The reference: BigInt maths only, so it is exact by construction and shares no code with total.ts.
// Prices are read from their decimal text ("8.55"), never multiplied as binary numbers.
function refPence(price: number): bigint {
  const [whole, frac = ''] = price.toFixed(2).split('.')
  return BigInt(whole) * 100n + BigInt(frac.padEnd(2, '0'))
}
function refDiscount(pence: bigint, percent: bigint): bigint {
  // Half a penny rounds up.
  return (pence * (100n - percent) + 50n) / 100n
}
function refOrderPence(lines: { price: number; qty: number }[], staffDiscount: boolean): bigint {
  const subtotal = lines.reduce((sum, line) => sum + refPence(line.price) * BigInt(line.qty), 0n)
  return staffDiscount ? refDiscount(subtotal, BigInt(STAFF_DISCOUNT_PERCENT)) : subtotal
}
const pounds = (pence: bigint) => Number(pence) / 100

// Fixed seed, so every run checks the same "random" baskets and a failure can be repeated.
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

// A total is only right if it has at most 2 decimal places and prints without extra digits.
function expectWholePence(total: number) {
  expect(total).toBe(Math.round(total * 100) / 100)
  expect(String(total)).toMatch(/^\d+(\.\d{1,2})?$/)
}

describe('every decimal value is exact to the penny', () => {
  it('converts every price from £0.00 to £10,000.00 to the right pence', () => {
    for (let pence = 0; pence <= 1_000_000; pence++) {
      const price = Number(`${Math.floor(pence / 100)}.${String(pence % 100).padStart(2, '0')}`)
      if (toPence(price) !== pence) expect({ price, got: toPence(price) }).toEqual({ price, got: pence })
    }
  })

  it('rounds every discount from 1% to 99% on every subtotal up to £1,000', () => {
    for (let percent = 1; percent <= 99; percent++) {
      for (let pence = 0; pence <= 100_000; pence++) {
        const got = applyDiscount(pence, percent)
        const want = Number(refDiscount(BigInt(pence), BigInt(percent)))
        if (got !== want) expect({ pence, percent, got }).toEqual({ pence, percent, got: want })
      }
    }
  })

  it('prices every menu item at every quantity from 1 to 50', () => {
    for (const item of menu) {
      for (let qty = 1; qty <= 50; qty++) {
        for (const staffDiscount of [false, true]) {
          const lines = [{ price: item.price, qty }]
          const total = orderTotal(lines, staffDiscount)
          expect(total, `${qty} × ${item.name}, discount ${staffDiscount}`).toBe(pounds(refOrderPence(lines, staffDiscount)))
          expectWholePence(total)
        }
      }
    }
  })

  it('prices 10,000 random baskets exactly', () => {
    const random = seededRandom(1)
    for (let i = 0; i < 10_000; i++) {
      const lines = Array.from({ length: 1 + Math.floor(random() * 10) }, () => ({
        price: menu[Math.floor(random() * menu.length)].price,
        qty: 1 + Math.floor(random() * 20),
      }))
      const staffDiscount = random() < 0.5
      const total = orderTotal(lines, staffDiscount)
      expect(total, JSON.stringify({ lines, staffDiscount })).toBe(pounds(refOrderPence(lines, staffDiscount)))
      expectWholePence(total)
    }
  })

  it('adds up 1,000 random orders for Taken today exactly', () => {
    const random = seededRandom(2)
    const orders: { total: number }[] = []
    let refSum = 0n
    for (let i = 0; i < 1_000; i++) {
      const pence = BigInt(1 + Math.floor(random() * 10_000))
      orders.push({ total: pounds(pence) })
      refSum += pence
      const sum = takings(orders)
      expect(sum).toBe(pounds(refSum))
      expectWholePence(sum)
    }
  })
})

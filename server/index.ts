import express from 'express'
import { menu } from './menu'

type OrderLine = { itemId: string; name: string; price: number; qty: number }

type Order = {
  number: number
  till: string
  lines: OrderLine[]
  staffDiscount: boolean
  total: number
  placedAt: string
}

const orders: Order[] = []

const app = express()
app.use(express.json())

app.get('/api/menu', (_req, res) => {
  res.json(menu)
})

app.get('/api/orders', (_req, res) => {
  res.json(orders)
})

app.post('/api/orders', (req, res) => {
  const { till, lines, staffDiscount, total } = req.body

  if (!Array.isArray(lines) || lines.length === 0) {
    res.status(400).json({ error: 'An order needs at least one line.' })
    return
  }

  const order: Order = {
    number: orders.length + 1,
    till,
    lines,
    staffDiscount,
    total,
    placedAt: new Date().toISOString(),
  }
  orders.push(order)
  res.status(201).json(order)
})

// The Kitchen panel's "Clear orders" button calls this.
app.delete('/api/orders', (_req, res) => {
  orders.length = 0
  res.status(204).end()
})

app.listen(3001, () => {
  console.log('API listening on http://localhost:3001')
})

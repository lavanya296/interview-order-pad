export type MenuItem = { id: string; name: string; price: number }

export type OrderLine = { itemId: string; name: string; price: number; qty: number }

export type NewOrder = {
  till: string
  lines: OrderLine[]
  staffDiscount: boolean
  total: number
}

export type Order = NewOrder & { number: number; placedAt: string }

export async function getMenu(): Promise<MenuItem[]> {
  const res = await fetch('/api/menu')
  return res.json()
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders')
  return res.json()
}

export async function placeOrder(order: NewOrder): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  if (!res.ok) throw new Error('The order was not saved.')
  return res.json()
}

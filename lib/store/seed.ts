import { PricePoint } from '@/lib/types'

/** Generate realistic price history with trend + volatility */
export function generatePriceHistory(basePrice: number, months = 12): PricePoint[] {
  const history: PricePoint[] = []
  const now = new Date()
  let price = basePrice * (0.88 + Math.random() * 0.1) // start 8–20% below current

  for (let i = months; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 30)

    // Trend: slight upward drift (0.5–1.5% per month)
    const trend = price * (0.005 + Math.random() * 0.01)
    // Volatility: ±2% daily random walk
    const volatility = price * 0.02 * (Math.random() - 0.48)
    price = Math.max(basePrice * 0.5, price + trend + volatility)

    history.push({ date, price: Math.round(price) })
  }

  // Ensure last point is close to basePrice
  history[history.length - 1] = { date: now, price: basePrice }
  return history
}

/** Format currency in INR with compact notation */
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
    return `₹${value.toFixed(0)}`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPct(v: number, decimals = 2): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`
}

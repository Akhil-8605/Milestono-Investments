import { Property, PricePoint } from '@/lib/types'

// Generate realistic mock properties with price history
const PROPERTY_NAMES = [
  'Sunset Plaza Premium Apartments',
  'Greenfield Residential Towers',
  'Tech Park Commercial Complex',
  'Riverside Luxury Villas',
  'Downtown Business District',
  'Heritage Valley Manor',
  'Cosmos Heights Residential',
  'Imperial Gateway Complex',
  'Smart City Development',
  'Emerald Park Properties',
]

const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Gurgaon', 'Hyderabad', 'Chennai', 'Kolkata']

const LOCATIONS = {
  Mumbai: 'Bandra',
  Bangalore: 'Indiranagar',
  Delhi: 'Dwarka',
  Pune: 'Kalyani Nagar',
  Gurgaon: 'DLF Phase',
  Hyderabad: 'HITEC City',
  Chennai: 'OMR',
  Kolkata: 'Salt Lake',
}

function generatePriceHistory(basePrice: number, months: number = 6): PricePoint[] {
  const history: PricePoint[] = []
  const today = new Date()

  for (let i = months; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(date.getMonth() - i)

    // Add realistic market fluctuations
    const volatility = basePrice * 0.03 // 3% volatility
    const trend = (months - i) * (basePrice * 0.01) // 1% monthly trend
    const randomChange = (Math.random() - 0.5) * volatility

    const price = basePrice + trend + randomChange

    history.push({
      date,
      price: Math.round(price),
    })
  }

  return history
}

export function generateMockProperties(count: number = 12): Property[] {
  const properties: Property[] = []

  for (let i = 0; i < count; i++) {
    const city = CITIES[i % CITIES.length]
    const unitPrice = 50000 + Math.random() * 400000 // ₹50K to ₹450K per unit
    const totalUnits = 100 + Math.floor(Math.random() * 900) // 100 to 1000 units

    properties.push({
      id: `prop-${i + 1}`,
      name: PROPERTY_NAMES[i % PROPERTY_NAMES.length],
      location: LOCATIONS[city as keyof typeof LOCATIONS],
      address: `${Math.floor(Math.random() * 999) + 1} Property Lane`,
      city,
      state: 'State',
      pincode: `${100000 + Math.floor(Math.random() * 900000)}`,
      totalUnits,
      unitsAvailable: Math.floor(totalUnits * (0.1 + Math.random() * 0.4)),
      unitPrice: Math.round(unitPrice),
      marketData: ((): import('@/lib/types').PropertyMarketData => {
        const cp = Math.round(unitPrice)
        const prev = Math.round(cp * (1 - (Math.random() - 0.48) * 0.04))
        const change = cp - prev
        const history = generatePriceHistory(cp)
        const prices = history.map(h => h.price)
        return {
          currentPrice: cp,
          prevDayPrice: prev,
          change,
          changePct: prev > 0 ? (change / prev) * 100 : 0,
          weekHigh: Math.max(...prices.slice(-7)),
          weekLow: Math.min(...prices.slice(-7)),
          yearHigh: Math.max(...prices),
          yearLow: Math.min(...prices),
          volume: Math.floor(Math.random() * 500) + 10,
          marketCap: cp * (100 + Math.floor(Math.random() * 900)),
          priceHistory: history,
        }
      })(),
      rentalData: {
        expectedYield: 6 + Math.random() * 8, // 6% to 14% yield
        occupancyRate: 70 + Math.random() * 25, // 70% to 95% occupancy
        rentalIncome: Math.round((Math.round(unitPrice) * totalUnits * (0.08 + Math.random() * 0.06)) / 12),
      },
      expectedYield: 6 + Math.random() * 8,
      occupancyRate: 70 + Math.random() * 25,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      documents: {
        termsUrl: '/docs/terms.pdf',
        prospectusUrl: '/docs/prospectus.pdf',
        riskDisclosureUrl: '/docs/risk.pdf',
      },
      createdBy: 'developer-1',
      listedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    })
  }

  return properties
}

// Mock investments
export function generateMockInvestments(userId: string, properties: Property[]) {
  const investmentCount = Math.floor(Math.random() * 5) + 2

  return Array.from({ length: investmentCount }).map((_, i) => {
    const property = properties[i % properties.length]
    const unitsOwned = Math.floor(Math.random() * 50) + 1
    const entryPrice = property.unitPrice * (0.8 + Math.random() * 0.4)
    const amountInvested = unitsOwned * entryPrice
    const currentValue = unitsOwned * property.marketData.currentPrice
    const returns = currentValue - amountInvested

    return {
      id: `inv-${userId}-${i}`,
      userId,
      propertyId: property.id,
      unitsOwned,
      unitPrice: entryPrice,
      amountInvested,
      currentValue,
      returns,
      returnPercentage: (returns / amountInvested) * 100,
      purchasedAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      status: 'active' as const,
    }
  })
}

// Mock transactions
export function generateMockTransactions(userId: string, count: number = 5) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `txn-${userId}-${i}`,
    userId,
    type: i % 2 === 0 ? ('buy' as const) : ('sell' as const),
    amount: 100000 + Math.random() * 1000000,
    razorpayOrderId: `razorpay-${i}`,
    status: 'completed' as const,
    timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    propertyId: `prop-${Math.floor(Math.random() * 10) + 1}`,
    units: Math.floor(Math.random() * 50) + 1,
  }))
}

import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, propertiesStore } from '@/lib/store/data'
import { ApiResponse, Property } from '@/lib/types'

// GET /api/properties?city=Mumbai&type=commercial&sort=yield&q=prestige
export async function GET(req: NextRequest) {
  try {
    ensureSeeded()

    const { searchParams } = req.nextUrl
    const city = searchParams.get('city')
    const type = searchParams.get('type')
    const status = searchParams.get('status') ?? 'active'
    const sort = searchParams.get('sort') ?? 'marketCap'
    const q = searchParams.get('q')?.toLowerCase()
    const minYield = parseFloat(searchParams.get('minYield') ?? '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') ?? 'Infinity')
    const minPrice = parseFloat(searchParams.get('minPrice') ?? '0')

    let properties = Array.from(propertiesStore.values())

    // Filter
    if (status) properties = properties.filter(p => p.status === status)
    if (city) properties = properties.filter(p => p.city.toLowerCase() === city.toLowerCase())
    if (type) properties = properties.filter(p => p.type === type)
    if (q) properties = properties.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.symbol.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    )
    if (minYield > 0) properties = properties.filter(p => p.expectedYield >= minYield)
    if (minPrice > 0) properties = properties.filter(p => p.marketData.currentPrice >= minPrice)
    if (maxPrice < Infinity) properties = properties.filter(p => p.marketData.currentPrice <= maxPrice)

    // Sort
    const sortFns: Record<string, (a: Property, b: Property) => number> = {
      marketCap: (a, b) => b.marketData.marketCap - a.marketData.marketCap,
      price: (a, b) => a.marketData.currentPrice - b.marketData.currentPrice,
      yield: (a, b) => b.expectedYield - a.expectedYield,
      change: (a, b) => b.marketData.changePct - a.marketData.changePct,
      volume: (a, b) => b.marketData.volume - a.marketData.volume,
      name: (a, b) => a.name.localeCompare(b.name),
    }
    properties.sort(sortFns[sort] ?? sortFns.marketCap)

    // Strip heavy price history for list view
    const lightweight = properties.map(({ marketData, ...rest }) => ({
      ...rest,
      marketData: {
        ...marketData,
        priceHistory: marketData.priceHistory.slice(-7), // last 7 days for sparkline
      },
    }))

    return NextResponse.json<ApiResponse<typeof lightweight>>({ success: true, data: lightweight })
  } catch (err) {
    console.error('[Properties] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/properties — create a new property (developer only)
export async function POST(req: NextRequest) {
  try {
    ensureSeeded()
    const body = await req.json()

    // Basic validation
    const required = ['name', 'symbol', 'city', 'state', 'totalUnits', 'unitPrice', 'type']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Prevent duplicate symbols
    const existingSymbol = Array.from(propertiesStore.values()).find(
      p => p.symbol.toUpperCase() === body.symbol.toUpperCase()
    )
    if (existingSymbol) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Symbol '${body.symbol.toUpperCase()}' already in use` },
        { status: 409 }
      )
    }

    const { generatePriceHistory } = await import('@/lib/store/seed')
    const id = `prop-${Date.now()}`
    const history = generatePriceHistory(body.unitPrice, 12)
    const currentPrice = history[history.length - 1].price
    const prevDayPrice = history[history.length - 2]?.price ?? currentPrice

    const property: Property = {
      id,
      symbol: body.symbol.toUpperCase(),
      name: body.name,
      type: body.type,
      description: body.description ?? '',
      amenities: body.amenities ?? [],
      location: body.location ?? '',
      address: body.address ?? '',
      city: body.city,
      state: body.state,
      pincode: body.pincode ?? '',
      totalUnits: Number(body.totalUnits),
      unitsAvailable: Number(body.totalUnits),
      unitPrice: Number(body.unitPrice),
      marketData: {
        currentPrice,
        prevDayPrice,
        change: currentPrice - prevDayPrice,
        changePct: ((currentPrice - prevDayPrice) / prevDayPrice) * 100,
        weekHigh: Math.max(...history.slice(-7).map(h => h.price)),
        weekLow: Math.min(...history.slice(-7).map(h => h.price)),
        yearHigh: Math.max(...history.map(h => h.price)),
        yearLow: Math.min(...history.map(h => h.price)),
        volume: 0,
        marketCap: currentPrice * Number(body.totalUnits),
        priceHistory: history,
      },
      rentalData: {
        expectedYield: Number(body.expectedYield ?? 8),
        occupancyRate: Number(body.occupancyRate ?? 85),
        rentalIncome: Number(body.rentalIncome ?? 0),
      },
      expectedYield: Number(body.expectedYield ?? 8),
      occupancyRate: Number(body.occupancyRate ?? 85),
      status: 'active',
      documents: body.documents ?? {},
      images: body.images ?? [],
      createdBy: body.createdBy ?? 'developer',
      listedAt: new Date(),
      lastUpdated: new Date(),
    }

    propertiesStore.set(id, property)

    return NextResponse.json<ApiResponse<Property>>({ success: true, data: property }, { status: 201 })
  } catch (err) {
    console.error('[Properties] POST error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create property' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, propertiesStore } from '@/lib/store/data'
import { ApiResponse, Property } from '@/lib/types'

// GET /api/properties/:id — full property data with complete price history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureSeeded()
    const { id } = await params
    const property = propertiesStore.get(id)

    if (!property) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json<ApiResponse<Property>>({ success: true, data: property })
  } catch (err) {
    console.error('[Properties/:id] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch property' }, { status: 500 })
  }
}

// PATCH /api/properties/:id — update price or metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureSeeded()
    const { id } = await params
    const property = propertiesStore.get(id)
    if (!property) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Property not found' }, { status: 404 })
    }

    const body = await req.json()

    // If price is being updated, add to history and recalculate market data
    if (body.currentPrice && body.currentPrice !== property.marketData.currentPrice) {
      const newPrice = Number(body.currentPrice)
      const prevPrice = property.marketData.currentPrice
      property.marketData.priceHistory.push({ date: new Date(), price: newPrice })
      property.marketData.currentPrice = newPrice
      property.marketData.prevDayPrice = prevPrice
      property.marketData.change = newPrice - prevPrice
      property.marketData.changePct = ((newPrice - prevPrice) / prevPrice) * 100
      property.marketData.marketCap = newPrice * property.totalUnits
      property.marketData.yearHigh = Math.max(property.marketData.yearHigh, newPrice)
      property.marketData.yearLow = Math.min(property.marketData.yearLow, newPrice)
    }

    // Merge other allowed updates
    const allowed = ['name', 'description', 'amenities', 'status', 'unitsAvailable',
                     'expectedYield', 'occupancyRate', 'rentalData', 'documents'] as const
    for (const key of allowed) {
      if (body[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(property as any)[key] = body[key]
      }
    }

    property.lastUpdated = new Date()
    propertiesStore.set(id, property)

    return NextResponse.json<ApiResponse<Property>>({ success: true, data: property })
  } catch (err) {
    console.error('[Properties/:id] PATCH error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update property' }, { status: 500 })
  }
}

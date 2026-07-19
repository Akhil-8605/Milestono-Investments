import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, watchlistStore, propertiesStore } from '@/lib/store/data'
import { ApiResponse } from '@/lib/types'

function resolveUserId(req: NextRequest, body?: Record<string, any>): string {
  const param = req.nextUrl.searchParams.get('userId') ?? body?.userId
  if (param) return param
  const token = req.cookies.get('milestono_token')?.value ?? ''
  // derive a stable key from token
  return `user-${token.split('_')[1]?.slice(0, 8) ?? 'demo'}`
}

// GET /api/watchlist
export async function GET(req: NextRequest) {
  try {
    ensureSeeded()
    const userId = resolveUserId(req)
    const ids = watchlistStore.get(userId) ?? []

    const items = ids
      .map(id => {
        const p = propertiesStore.get(id)
        if (!p) return null
        return {
          id: p.id,
          symbol: p.symbol,
          name: p.name,
          city: p.city,
          type: p.type,
          currentPrice: p.marketData.currentPrice,
          change: p.marketData.change,
          changePct: p.marketData.changePct,
          expectedYield: p.expectedYield,
          occupancyRate: p.occupancyRate,
          priceHistory: p.marketData.priceHistory,
        }
      })
      .filter(Boolean)

    return NextResponse.json<ApiResponse<typeof items>>({ success: true, data: items })
  } catch (err) {
    console.error('[Watchlist] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 })
  }
}

// POST /api/watchlist — add property
export async function POST(req: NextRequest) {
  try {
    ensureSeeded()
    const body = await req.json()
    const userId = resolveUserId(req, body)
    const { propertyId } = body

    if (!propertyId) return NextResponse.json<ApiResponse>({ success: false, error: 'propertyId required' }, { status: 400 })

    const current = watchlistStore.get(userId) ?? []
    if (!current.includes(propertyId)) {
      watchlistStore.set(userId, [...current, propertyId])
    }

    return NextResponse.json<ApiResponse>({ success: true, message: 'Added to watchlist' })
  } catch (err) {
    console.error('[Watchlist] POST error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update watchlist' }, { status: 500 })
  }
}

// DELETE /api/watchlist?propertyId=yyy
export async function DELETE(req: NextRequest) {
  try {
    const userId = resolveUserId(req)
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    if (!propertyId) return NextResponse.json<ApiResponse>({ success: false, error: 'propertyId required' }, { status: 400 })

    const current = watchlistStore.get(userId) ?? []
    watchlistStore.set(userId, current.filter(id => id !== propertyId))

    return NextResponse.json<ApiResponse>({ success: true, message: 'Removed from watchlist' })
  } catch (err) {
    console.error('[Watchlist] DELETE error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update watchlist' }, { status: 500 })
  }
}

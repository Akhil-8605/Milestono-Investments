import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'

function resolveUserId(req: NextRequest, body?: Record<string, any>): string {
  const param = req.nextUrl.searchParams.get('userId') ?? body?.userId
  if (param) return param
  const token = req.cookies.get('milestono_investments_token')?.value ?? ''
  return `user-${token.split('_')[1]?.slice(0, 8) ?? 'demo'}`
}

// GET /api/watchlist
export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const userId = resolveUserId(req)
    const docRef = db.collection('watchlists').doc(userId)
    const docSnap = await docRef.get()
    
    const ids: string[] = docSnap.exists ? (docSnap.data()?.propertyIds || []) : []

    const items = (await Promise.all(ids.map(async id => {
      const pSnap = await db.collection('properties').doc(id).get()
      if (!pSnap.exists) return null
      const p = pSnap.data() as any
      return {
        id: pSnap.id,
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
    }))).filter(Boolean)

    return NextResponse.json<ApiResponse<typeof items>>({ success: true, data: items })
  } catch (err) {
    console.error('[Watchlist] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 })
  }
}

// POST /api/watchlist — add property
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const body = await req.json()
    const userId = resolveUserId(req, body)
    const { propertyId } = body

    if (!propertyId) return NextResponse.json<ApiResponse>({ success: false, error: 'propertyId required' }, { status: 400 })

    const docRef = db.collection('watchlists').doc(userId)
    
    await db.runTransaction(async (t: any) => {
      const docSnap = await t.get(docRef)
      const currentIds: string[] = docSnap.exists ? (docSnap.data()?.propertyIds || []) : []
      if (!currentIds.includes(propertyId)) {
        t.set(docRef, { propertyIds: [...currentIds, propertyId] }, { merge: true })
      }
    })

    return NextResponse.json<ApiResponse>({ success: true, message: 'Added to watchlist' })
  } catch (err) {
    console.error('[Watchlist] POST error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update watchlist' }, { status: 500 })
  }
}

// DELETE /api/watchlist?propertyId=yyy
export async function DELETE(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    let body = {}
    try { body = await req.json() } catch { /* ignore */ }

    const userId = resolveUserId(req, body)
    const propertyId = req.nextUrl.searchParams.get('propertyId') || (body as any).propertyId

    if (!propertyId) return NextResponse.json<ApiResponse>({ success: false, error: 'propertyId required' }, { status: 400 })

    const docRef = db.collection('watchlists').doc(userId)
    
    await db.runTransaction(async (t: any) => {
      const docSnap = await t.get(docRef)
      if (docSnap.exists) {
        const currentIds: string[] = docSnap.data()?.propertyIds || []
        const newIds = currentIds.filter(id => id !== propertyId)
        t.set(docRef, { propertyIds: newIds }, { merge: true })
      }
    })

    return NextResponse.json<ApiResponse>({ success: true, message: 'Removed from watchlist' })
  } catch (err) {
    console.error('[Watchlist] DELETE error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update watchlist' }, { status: 500 })
  }
}

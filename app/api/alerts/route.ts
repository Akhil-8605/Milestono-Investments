import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, PriceAlert } from '@/lib/types'

function resolveUserId(req: NextRequest, body?: Record<string, any>): string {
  const param = req.nextUrl.searchParams.get('userId') ?? body?.userId
  if (param) return param
  const token = req.cookies.get('milestono_investments_token')?.value ?? ''
  return `user-${token.split('_')[1]?.slice(0, 8) ?? 'demo'}`
}

// GET /api/alerts
export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const userId = resolveUserId(req)

    const snapshot = await db.collection('alerts')
      .where('userId', '==', userId)
      .get()

    const rawAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceAlert))

    const alerts = await Promise.all(rawAlerts.map(async alert => {
      const pSnap = await db.collection('properties').doc(alert.propertyId).get()
      const property = pSnap.exists ? pSnap.data() as any : null
      const currentPrice = property?.marketData?.currentPrice

      // Auto-trigger check
      if (!alert.triggered && currentPrice) {
        if (
          (alert.alertType === 'above' && currentPrice >= alert.targetPrice) ||
          (alert.alertType === 'below' && currentPrice <= alert.targetPrice)
        ) {
          alert.triggered = true
          alert.triggeredAt = new Date()
          await db.collection('alerts').doc(alert.id).update({
            triggered: true,
            triggeredAt: alert.triggeredAt
          })
        }
      }

      return {
        ...alert,
        symbol: property?.symbol ?? alert.propertySymbol,
        name: property?.name ?? alert.propertyName,
        currentPrice,
      }
    }))

    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json<ApiResponse<typeof alerts>>({ success: true, data: alerts })
  } catch (err) {
    console.error('[Alerts] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST /api/alerts
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const body = await req.json()
    const userId = resolveUserId(req, body)
    const { propertyId, alertType, targetPrice } = body

    if (!propertyId || !alertType || !targetPrice) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'propertyId, alertType, and targetPrice are required' }, { status: 400 })
    }

    if (!['above', 'below'].includes(alertType)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'alertType must be "above" or "below"' }, { status: 400 })
    }

    const pSnap = await db.collection('properties').doc(propertyId).get()
    if (!pSnap.exists) return NextResponse.json<ApiResponse>({ success: false, error: 'Property not found' }, { status: 404 })
    const property = pSnap.data() as any

    const docRef = db.collection('alerts').doc()
    const alert: PriceAlert = {
      id: docRef.id,
      userId,
      propertyId,
      propertyName: property.name,
      propertySymbol: property.symbol,
      alertType,
      targetPrice: Number(targetPrice),
      triggered: false,
      createdAt: new Date(),
    }

    await docRef.set(alert)

    return NextResponse.json<ApiResponse<PriceAlert & { symbol: string; name: string }>>({
      success: true,
      data: { ...alert, symbol: property.symbol, name: property.name },
    }, { status: 201 })
  } catch (err) {
    console.error('[Alerts] POST error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create alert' }, { status: 500 })
  }
}

// DELETE /api/alerts?alertId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const alertId = req.nextUrl.searchParams.get('alertId') ?? req.nextUrl.searchParams.get('id')
    if (!alertId) return NextResponse.json<ApiResponse>({ success: false, error: 'alertId required' }, { status: 400 })
    
    await db.collection('alerts').doc(alertId).delete()

    return NextResponse.json<ApiResponse>({ success: true, message: 'Alert deleted' })
  } catch (err) {
    console.error('[Alerts] DELETE error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete alert' }, { status: 500 })
  }
}

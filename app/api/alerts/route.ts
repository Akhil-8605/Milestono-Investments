import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, alertsStore, propertiesStore } from '@/lib/store/data'
import { ApiResponse, PriceAlert } from '@/lib/types'

function resolveUserId(req: NextRequest, body?: Record<string, any>): string {
  const param = req.nextUrl.searchParams.get('userId') ?? body?.userId
  if (param) return param
  const token = req.cookies.get('milestono_token')?.value ?? ''
  return `user-${token.split('_')[1]?.slice(0, 8) ?? 'demo'}`
}

// GET /api/alerts
export async function GET(req: NextRequest) {
  try {
    ensureSeeded()
    const userId = resolveUserId(req)

    const alerts = Array.from(alertsStore.values())
      .filter(a => a.userId === userId)
      .map(alert => {
        const property = propertiesStore.get(alert.propertyId)
        const currentPrice = property?.marketData.currentPrice

        // Auto-trigger check
        if (!alert.triggered && currentPrice) {
          if (
            (alert.alertType === 'above' && currentPrice >= alert.targetPrice) ||
            (alert.alertType === 'below' && currentPrice <= alert.targetPrice)
          ) {
            alert.triggered = true
            alert.triggeredAt = new Date()
            alertsStore.set(alert.id, alert)
          }
        }

        return {
          ...alert,
          symbol: (property as any)?.symbol ?? alert.propertySymbol,
          name: property?.name ?? alert.propertyName,
          currentPrice,
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json<ApiResponse<typeof alerts>>({ success: true, data: alerts })
  } catch (err) {
    console.error('[Alerts] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST /api/alerts
export async function POST(req: NextRequest) {
  try {
    ensureSeeded()
    const body = await req.json()
    const userId = resolveUserId(req, body)
    const { propertyId, alertType, targetPrice } = body

    if (!propertyId || !alertType || !targetPrice) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'propertyId, alertType, and targetPrice are required' }, { status: 400 })
    }

    if (!['above', 'below'].includes(alertType)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'alertType must be "above" or "below"' }, { status: 400 })
    }

    const property = propertiesStore.get(propertyId)
    if (!property) return NextResponse.json<ApiResponse>({ success: false, error: 'Property not found' }, { status: 404 })

    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const alert: PriceAlert = {
      id,
      userId,
      propertyId,
      propertyName: property.name,
      propertySymbol: property.symbol,
      alertType,
      targetPrice: Number(targetPrice),
      triggered: false,
      createdAt: new Date(),
    }

    alertsStore.set(id, alert)
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
    const alertId = req.nextUrl.searchParams.get('alertId') ?? req.nextUrl.searchParams.get('id')
    if (!alertId) return NextResponse.json<ApiResponse>({ success: false, error: 'alertId required' }, { status: 400 })
    alertsStore.delete(alertId)
    return NextResponse.json<ApiResponse>({ success: true, message: 'Alert deleted' })
  } catch (err) {
    console.error('[Alerts] DELETE error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete alert' }, { status: 500 })
  }
}

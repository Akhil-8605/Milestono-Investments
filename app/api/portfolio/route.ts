import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'

function resolveUserId(req: NextRequest): string | null {
  const param = req.nextUrl.searchParams.get('userId')
  if (param) return param
  const token = req.cookies.get('milestono_investments_token')?.value
  if (token) return `user-${token.split('_')[1]?.slice(0, 8) ?? 'demo'}`
  return null
}

// GET /api/portfolio — compute live portfolio summary + holdings
export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const userId = resolveUserId(req)
    if (!userId) {
       return NextResponse.json<ApiResponse>({ success: false, error: 'userId required' }, { status: 400 })
    }

    const snapshot = await db.collection('investments')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get()

    const allInvestments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))

    let totalInvested = 0
    let currentValue = 0
    let prevDayValue = 0

    const holdings = (await Promise.all(allInvestments.map(async inv => {
      const propertyDoc = await db.collection('properties').doc(inv.propertyId).get()
      if (!propertyDoc.exists) return null

      const property = propertyDoc.data() as any

      const currentPrice = property.marketData?.currentPrice ?? property.unitPrice ?? 0
      const prevDayPrice = property.marketData?.prevDayPrice ?? property.unitPrice ?? 0

      const curVal = inv.unitsOwned * currentPrice
      const prevVal = inv.unitsOwned * prevDayPrice
      const pl = curVal - inv.amountInvested
      const plPct = inv.amountInvested > 0 ? (pl / inv.amountInvested) * 100 : 0

      totalInvested += inv.amountInvested
      currentValue  += curVal
      prevDayValue  += prevVal

      return {
        id: inv.id,
        propertyId: inv.propertyId,
        symbol: property.symbol,
        city: property.city,
        type: property.type,
        unitsOwned: inv.unitsOwned,
        buyPrice: inv.unitPrice,
        currentPrice: currentPrice,
        invested: inv.amountInvested,
        currentValue: curVal,
        pl,
        plPct,
        yield: property.expectedYield,
      }
    }))).filter(Boolean)

    const totalPL    = currentValue - totalInvested
    const plPct      = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0
    const dayPL      = currentValue - prevDayValue
    const dayPLPct   = prevDayValue > 0 ? (dayPL / prevDayValue) * 100 : 0

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: { totalInvested, currentValue, totalPL, plPct, dayPL, dayPLPct, holdings },
    })
  } catch (err) {
    console.error('[Portfolio] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to compute portfolio' }, { status: 500 })
  }
}

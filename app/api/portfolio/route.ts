import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, investmentsStore, propertiesStore } from '@/lib/store/data'
import { ApiResponse } from '@/lib/types'

function resolveUserId(req: NextRequest): string | null {
  const param = req.nextUrl.searchParams.get('userId')
  if (param) return param
  const token = req.cookies.get('milestono_token')?.value
  if (token) return `user-${token.split('_')[1]?.slice(0, 8) ?? 'demo'}`
  return null
}

// GET /api/portfolio — compute live portfolio summary + holdings
export async function GET(req: NextRequest) {
  try {
    ensureSeeded()
    const userId = resolveUserId(req)

    // Return enriched holdings
    const allInvestments = Array.from(investmentsStore.values())
      .filter(inv => (!userId || inv.userId === userId) && inv.status === 'active')

    let totalInvested = 0
    let currentValue = 0
    let prevDayValue = 0

    const holdings = allInvestments.map(inv => {
      const property = propertiesStore.get(inv.propertyId)
      if (!property) return null

      const curVal = inv.unitsOwned * property.marketData.currentPrice
      const prevVal = inv.unitsOwned * property.marketData.prevDayPrice
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
        currentPrice: property.marketData.currentPrice,
        invested: inv.amountInvested,
        currentValue: curVal,
        pl,
        plPct,
        yield: property.expectedYield,
      }
    }).filter(Boolean)

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

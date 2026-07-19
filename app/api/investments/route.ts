import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, investmentsStore, propertiesStore, transactionsStore } from '@/lib/store/data'
import { ApiResponse, Investment, Transaction } from '@/lib/types'

const GST_RATE = 0.05

// GET /api/investments?userId=xxx
export async function GET(req: NextRequest) {
  try {
    ensureSeeded()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId required' }, { status: 400 })
    }

    const investments = Array.from(investmentsStore.values())
      .filter(inv => inv.userId === userId && inv.status === 'active')

    // Enrich with current market data
    const enriched = investments.map(inv => {
      const property = propertiesStore.get(inv.propertyId)
      if (!property) return inv

      const currentValue = inv.unitsOwned * property.marketData.currentPrice
      const returns = currentValue - inv.amountInvested
      const returnPct = (returns / inv.amountInvested) * 100
      const prevValue = inv.unitsOwned * property.marketData.prevDayPrice
      const dayChange = currentValue - prevValue
      const dayChangePct = (dayChange / prevValue) * 100

      return {
        ...inv,
        property: {
          id: property.id,
          name: property.name,
          symbol: property.symbol,
          city: property.city,
          type: property.type,
          marketData: {
            currentPrice: property.marketData.currentPrice,
            changePct: property.marketData.changePct,
            change: property.marketData.change,
          },
        },
        currentValue,
        returns,
        returnPercentage: returnPct,
        dayChange,
        dayChangePct,
      }
    })

    return NextResponse.json<ApiResponse<typeof enriched>>({ success: true, data: enriched })
  } catch (err) {
    console.error('[Investments] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch investments' }, { status: 500 })
  }
}

// POST /api/investments — buy units
export async function POST(req: NextRequest) {
  try {
    ensureSeeded()
    const body = await req.json()
    const { propertyId, units, type } = body

    // Resolve userId from cookie token or body
    const cookieToken = req.cookies.get('milestono_token')?.value ?? ''
    const userId = body.userId ?? (cookieToken ? `user-${cookieToken.split('_')[1]?.slice(0, 8) ?? 'demo'}` : null)

    if (!userId || !propertyId || !units || units <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'userId, propertyId, and units (>0) are required' },
        { status: 400 }
      )
    }

    // For sell orders — just record transaction and return success
    if (type === 'SELL') {
      const property = propertiesStore.get(propertyId)
      if (!property) return NextResponse.json<ApiResponse>({ success: false, error: 'Property not found' }, { status: 404 })
      const txnId = `txn-sell-${Date.now()}`
      const sellAmount = units * property.marketData.currentPrice
      const transaction: Transaction = {
        id: txnId, userId, propertyId, propertyName: property.name, propertySymbol: property.symbol,
        type: 'sell', units, unitPrice: property.marketData.currentPrice, baseAmount: sellAmount,
        gst: sellAmount * GST_RATE, totalAmount: sellAmount * (1 - GST_RATE), status: 'completed', timestamp: new Date(),
      }
      transactionsStore.set(txnId, transaction)
      property.unitsAvailable = Math.min(property.totalUnits, property.unitsAvailable + units)
      propertiesStore.set(propertyId, property)
      return NextResponse.json<ApiResponse>({ success: true, data: { transaction }, message: `Sell order placed for ${units} units of ${property.symbol}` }, { status: 201 })
    }

    const property = propertiesStore.get(propertyId)
    if (!property) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Property not found' }, { status: 404 })
    }

    if (property.status !== 'active') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Property is not available for investment' }, { status: 400 })
    }

    if (units > property.unitsAvailable) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Only ${property.unitsAvailable} units available` },
        { status: 400 }
      )
    }

    const unitPrice = property.marketData.currentPrice
    const baseAmount = units * unitPrice
    const gst = baseAmount * GST_RATE
    const totalAmount = baseAmount + gst

    // Find existing investment or create new
    const existingKey = Array.from(investmentsStore.keys())
      .find(k => investmentsStore.get(k)?.userId === userId && investmentsStore.get(k)?.propertyId === propertyId && investmentsStore.get(k)?.status === 'active')

    let investment: Investment

    if (existingKey) {
      const existing = investmentsStore.get(existingKey)!
      const newUnits = existing.unitsOwned + units
      const newInvested = existing.amountInvested + baseAmount
      const avgPrice = newInvested / newUnits

      investment = {
        ...existing,
        unitsOwned: newUnits,
        unitPrice: avgPrice,
        amountInvested: newInvested,
        currentValue: newUnits * unitPrice,
        returns: newUnits * unitPrice - newInvested,
        returnPercentage: ((newUnits * unitPrice - newInvested) / newInvested) * 100,
        dayChange: 0,
        dayChangePct: 0,
      }
      investmentsStore.set(existingKey, investment)
    } else {
      const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      investment = {
        id,
        userId,
        propertyId,
        unitsOwned: units,
        unitPrice,
        amountInvested: baseAmount,
        currentValue: baseAmount,
        returns: 0,
        returnPercentage: 0,
        dayChange: 0,
        dayChangePct: 0,
        purchasedAt: new Date(),
        status: 'active',
      }
      investmentsStore.set(id, investment)
    }

    // Reduce available units
    property.unitsAvailable -= units
    property.marketData.volume += units
    propertiesStore.set(propertyId, property)

    // Record transaction
    const txnId = `txn-${Date.now()}`
    const transaction: Transaction = {
      id: txnId,
      userId,
      propertyId,
      propertyName: property.name,
      propertySymbol: property.symbol,
      type: 'buy',
      units,
      unitPrice,
      baseAmount,
      gst,
      totalAmount,
      status: 'completed',
      timestamp: new Date(),
    }
    transactionsStore.set(txnId, transaction)

    return NextResponse.json<ApiResponse<{ investment: Investment; transaction: Transaction }>>(
      { success: true, data: { investment, transaction }, message: `Successfully purchased ${units} units of ${property.symbol}` },
      { status: 201 }
    )
  } catch (err) {
    console.error('[Investments] POST error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Investment failed. Please try again.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, Investment, Transaction } from '@/lib/types'

const GST_RATE = 0.05

function resolveUserId(req: NextRequest, body?: any): string | null {
  if (body?.userId) return body.userId
  const param = req.nextUrl.searchParams.get('userId')
  if (param) return param
  const token = req.cookies.get('milestono_investments_token')?.value
  if (token) return `user-${token.split('_')[1]?.slice(0, 8) ?? 'demo'}`
  return null
}

// GET /api/investments?userId=xxx
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

    const investments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment))

    // Enrich with current market data
    const enriched = await Promise.all(investments.map(async inv => {
      const propertyDoc = await db.collection('properties').doc(inv.propertyId).get()
      if (!propertyDoc.exists) return inv

      const property = propertyDoc.data() as any
      const currentValue = inv.unitsOwned * property.marketData.currentPrice
      const returns = currentValue - inv.amountInvested
      const returnPct = (returns / inv.amountInvested) * 100
      const prevValue = inv.unitsOwned * property.marketData.prevDayPrice
      const dayChange = currentValue - prevValue
      const dayChangePct = prevValue > 0 ? (dayChange / prevValue) * 100 : 0

      return {
        ...inv,
        property: {
          id: propertyDoc.id,
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
    }))

    return NextResponse.json<ApiResponse<typeof enriched>>({ success: true, data: enriched })
  } catch (err) {
    console.error('[Investments] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch investments' }, { status: 500 })
  }
}

// POST /api/investments — buy units
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const body = await req.json()
    const { propertyId, units, type } = body
    const userId = resolveUserId(req, body)

    if (!userId || !propertyId || !units || units <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'userId, propertyId, and units (>0) are required' },
        { status: 400 }
      )
    }

    const result = await db.runTransaction(async (t: any) => {
      const propertyRef = db.collection('properties').doc(propertyId)
      const propertyDoc = await t.get(propertyRef)

      if (!propertyDoc.exists) {
        throw new Error('Property not found')
      }

      const property = propertyDoc.data() as any

      if (type === 'SELL') {
        const txnId = `txn-sell-${Date.now()}`
        const sellAmount = units * property.marketData.currentPrice
        const transaction: Transaction = {
          id: txnId, userId, propertyId, propertyName: property.name, propertySymbol: property.symbol,
          type: 'sell', units, unitPrice: property.marketData.currentPrice, baseAmount: sellAmount,
          gst: sellAmount * GST_RATE, totalAmount: sellAmount * (1 - GST_RATE), status: 'completed', timestamp: new Date(),
        }

        const newUnitsAvailable = Math.min(property.totalUnits, property.unitsAvailable + units)
        t.update(propertyRef, { unitsAvailable: newUnitsAvailable })

        const txnRef = db.collection('transactions').doc(txnId)
        t.set(txnRef, transaction)

        return { type: 'SELL', transaction, symbol: property.symbol }
      }

      // BUY logic
      if (property.status !== 'active') {
        throw new Error('Property is not available for investment')
      }
      if (units > property.unitsAvailable) {
        throw new Error(`Only ${property.unitsAvailable} units available`)
      }

      const unitPrice = property.marketData.currentPrice
      const baseAmount = units * unitPrice
      const gst = baseAmount * GST_RATE
      const totalAmount = baseAmount + gst

      // Find existing investment
      const invQuery = await db.collection('investments')
        .where('userId', '==', userId)
        .where('propertyId', '==', propertyId)
        .where('status', '==', 'active')
        .get()

      let investment: Investment
      let invRef

      if (!invQuery.empty) {
        invRef = invQuery.docs[0].ref
        const existing = invQuery.docs[0].data() as Investment
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
        t.update(invRef, investment as any)
      } else {
        invRef = db.collection('investments').doc()
        investment = {
          id: invRef.id,
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
        t.set(invRef, investment)
      }

      t.update(propertyRef, {
        unitsAvailable: property.unitsAvailable - units,
        'marketData.volume': (property.marketData?.volume || 0) + units
      })

      const txnId = `txn-buy-${Date.now()}`
      const txnRef = db.collection('transactions').doc(txnId)
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
      t.set(txnRef, transaction)

      return { type: 'BUY', investment, transaction, symbol: property.symbol }
    })

    if (result.type === 'SELL') {
      return NextResponse.json<ApiResponse>({ success: true, data: { transaction: result.transaction }, message: `Sell order placed for ${units} units of ${result.symbol}` }, { status: 201 })
    }

    return NextResponse.json<ApiResponse<{ investment: Investment; transaction: Transaction }>>(
      { success: true, data: { investment: result.investment!, transaction: result.transaction }, message: `Successfully purchased ${units} units of ${result.symbol}` },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[Investments] POST error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: err.message || 'Investment failed. Please try again.' }, { status: 400 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const firestore = db
    if (!firestore) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { id } = await context.params
    const body = await req.json()
    const { percentage, targetDateStr } = body // e.g. targetDateStr: "2026-07-31"

    if (typeof percentage !== 'number' || !targetDateStr) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const targetDate = new Date(targetDateStr)
    const today = new Date()
    today.setHours(0,0,0,0)
    targetDate.setHours(0,0,0,0)

    const daysDifference = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

    if (daysDifference < 0) {
      return NextResponse.json({ success: false, error: 'Target date must be today or in the future' }, { status: 400 })
    }

    const propertyRef = firestore.collection('properties').doc(id)
    
    await firestore.runTransaction(async (t) => {
      const doc = await t.get(propertyRef)
      if (!doc.exists) throw new Error('Property not found')

      const propertyData = doc.data()!
      let history = propertyData.marketData?.priceHistory || []
      
      const currentPricePoint = history[history.length - 1]
      const basePrice = currentPricePoint?.price || propertyData.unitPrice
      
      const targetPrice = basePrice * (1 + (percentage / 100))
      
      const totalDifference = targetPrice - basePrice
      const steps = daysDifference + 1 // Jump starts today
      const dailyIncrement = totalDifference / steps

      const newPoints = []
      for (let i = 1; i <= steps; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() + (i - 1))
        
        const priceAtDay = basePrice + (dailyIncrement * i)
        newPoints.push({
          date: d.toISOString(),
          price: Math.round(priceAtDay)
        })
      }

      const updatedHistory = [...history, ...newPoints]
      
      const newCurrentPrice = newPoints[0].price
      const prevPrice = basePrice

      t.update(propertyRef, {
        'marketData.priceHistory': updatedHistory,
        'marketData.currentPrice': newCurrentPrice,
        'marketData.prevDayPrice': prevPrice,
        'marketData.change': newCurrentPrice - prevPrice,
        'marketData.changePct': ((newCurrentPrice - prevPrice) / prevPrice) * 100,
        'marketData.marketCap': newCurrentPrice * propertyData.totalUnits
      })
      
      const scheduleRef = firestore.collection('appreciationSchedules').doc()
      t.set(scheduleRef, {
        propertyId: id,
        percentage,
        targetDate: targetDate.toISOString(),
        basePrice,
        targetPrice,
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      })
    })

    return NextResponse.json({ success: true, message: 'Appreciation schedule set successfully' })
  } catch (err: any) {
    console.error('[Appreciate POST]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { id } = await context.params

    const snapshot = await db.collection('appreciationSchedules')
      .where('propertyId', '==', id)
      .get()

    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Sort in memory to avoid Firestore composite index requirement
    history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({ success: true, data: history })
  } catch (err: any) {
    console.error('[Appreciate GET]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

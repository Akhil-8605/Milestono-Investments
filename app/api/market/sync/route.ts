import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function POST() {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const snapshot = await db.collection('properties').where('status', '==', 'active').get()
    
    let updatedCount = 0
    const now = new Date()

    const batch = db.batch()

    snapshot.docs.forEach(doc => {
      const property = doc.data()
      if (!property.marketData || !property.marketData.priceHistory || property.marketData.priceHistory.length === 0) {
        return
      }

      const history = property.marketData.priceHistory
      
      // Find the most recent price point that is on or before today
      let activePoint = null
      for (const point of history) {
        const pointDate = new Date(point.date)
        if (pointDate <= now) {
          activePoint = point
        }
      }

      if (activePoint && activePoint.price !== property.marketData.currentPrice) {
        // We found a new price point that should be active!
        const prevPrice = property.marketData.currentPrice
        const newCurrentPrice = activePoint.price
        
        batch.update(doc.ref, {
          'marketData.currentPrice': newCurrentPrice,
          'marketData.prevDayPrice': prevPrice,
          'marketData.change': newCurrentPrice - prevPrice,
          'marketData.changePct': ((newCurrentPrice - prevPrice) / prevPrice) * 100,
          'marketData.marketCap': newCurrentPrice * property.totalUnits
        })
        updatedCount++
      }
    })

    if (updatedCount > 0) {
      await batch.commit()
    }

    return NextResponse.json({ success: true, updated: updatedCount })
  } catch (err: any) {
    console.error('[Market Sync Error]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

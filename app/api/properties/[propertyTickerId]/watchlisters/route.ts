import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, context: { params: Promise<{ propertyTickerId: string }> }) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { propertyTickerId } = await context.params

    const propSnap = await db.collection('properties').where('symbol', '==', propertyTickerId).limit(1).get()
    const propGlobalSnap = await db.collection('properties').doc(propertyTickerId).get()
    
    let propertyId = propertyTickerId
    if (!propSnap.empty) {
      propertyId = propSnap.docs[0].id
    } else if (!propGlobalSnap.exists) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    const watchlistsSnap = await db.collection('watchlists')
      .where('propertyIds', 'array-contains', propertyId)
      .get()

    const watchlisters = []
    for (const doc of watchlistsSnap.docs) {
      const userId = doc.id
      let name = 'Unknown User'
      let email = ''
      try {
        const userDoc = await db.collection('users').doc(userId).get()
        if (userDoc.exists) {
          const userData = userDoc.data()
          name = userData?.name || name
          email = userData?.email || ''
        }
      } catch (e) { /* ignore */ }
      
      watchlisters.push({
        userId,
        name,
        email,
        watchlistedAt: new Date().toISOString() // We don't store exact timestamp in array right now, mock it
      })
    }

    return NextResponse.json({ success: true, data: watchlisters })
  } catch (err) {
    console.error('[Watchlisters Analytics API error]', err)
    return NextResponse.json({ success: false, error: 'Failed to load watchlisters' }, { status: 500 })
  }
}

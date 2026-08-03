import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, context: { params: Promise<{ propertyTickerId: string }> }) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { propertyTickerId } = await context.params

    // First fetch the property to get its true document ID, since propertyTickerId might be symbol or globalId
    const propSnap = await db.collection('properties').where('symbol', '==', propertyTickerId).limit(1).get()
    const propGlobalSnap = await db.collection('properties').doc(propertyTickerId).get()
    
    let propertyId = propertyTickerId
    if (!propSnap.empty) {
      propertyId = propSnap.docs[0].id
    } else if (!propGlobalSnap.exists) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    const investmentsSnap = await db.collection('investments')
      .where('propertyId', '==', propertyId)
      .where('status', '==', 'active')
      .get()

    // Aggregate units per user
    const userUnitsMap = new Map<string, { units: number, invested: number }>()
    investmentsSnap.docs.forEach(doc => {
      const data = doc.data()
      const existing = userUnitsMap.get(data.userId) || { units: 0, invested: 0 }
      userUnitsMap.set(data.userId, { 
        units: existing.units + data.unitsOwned,
        invested: existing.invested + data.amountInvested
      })
    })

    // Fetch user details for each investor
    const investors = []
    for (const [userId, stats] of Array.from(userUnitsMap.entries())) {
      let name = 'Unknown Investor'
      let email = ''
      let phone = ''
      let profilePhoto = ''
      
      try {
        // First try investors collection for complete profile
        const investorDoc = await db.collection('investors').doc(userId).get()
        if (investorDoc.exists) {
          const invData = investorDoc.data()
          name = invData?.fullName || invData?.name || name
          email = invData?.email || ''
          phone = invData?.phone || ''
          profilePhoto = invData?.profilePhoto || ''
        } else {
          // Fallback to users collection
          const userDoc = await db.collection('users').doc(userId).get()
          if (userDoc.exists) {
            const userData = userDoc.data()
            name = userData?.name || name
            email = userData?.email || ''
            phone = userData?.phone || ''
            profilePhoto = userData?.profilePhoto || ''
          }
        }
      } catch (e) { /* ignore */ }

      investors.push({
        id: userId,
        userId,
        name,
        email,
        phone,
        profilePhoto,
        unitsOwned: stats.units,
        amountInvested: stats.invested
      })
    }

    // Sort by units owned (descending)
    investors.sort((a, b) => b.unitsOwned - a.unitsOwned)

    return NextResponse.json({ success: true, data: investors })
  } catch (err) {
    console.error('[Investors Analytics API error]', err)
    return NextResponse.json({ success: false, error: 'Failed to load investors' }, { status: 500 })
  }
}

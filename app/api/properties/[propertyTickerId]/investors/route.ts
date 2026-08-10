import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, context: { params: Promise<{ propertyTickerId: string }> }) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { propertyTickerId } = await context.params

    // 1. Locate the exact property document
    let propDoc: FirebaseFirestore.DocumentSnapshot | null = null

    // Try doc ID first
    const byDocId = await db.collection('properties').doc(propertyTickerId).get()
    if (byDocId.exists) {
      propDoc = byDocId
    } else {
      // Try globalId
      const byGlobalId = await db.collection('properties').where('globalId', '==', propertyTickerId).limit(1).get()
      if (!byGlobalId.empty) {
        propDoc = byGlobalId.docs[0]
      } else {
        // Try symbol
        const bySymbol = await db.collection('properties').where('symbol', '==', propertyTickerId).limit(1).get()
        if (!bySymbol.empty) {
          propDoc = bySymbol.docs[0]
        }
      }
    }

    if (!propDoc || !propDoc.exists) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    const propData = propDoc.data() || {}
    const candidatePropertyIds = Array.from(
      new Set([
        propDoc.id,
        propData.globalId,
        propData.symbol,
        propertyTickerId,
      ].filter(Boolean))
    ) as string[]

    // 2. Fetch investments strictly for candidate IDs of THIS property
    const investmentsSnap = await db.collection('investments')
      .where('propertyId', 'in', candidatePropertyIds.slice(0, 10))
      .where('status', '==', 'active')
      .get()

    // Aggregate units & total invested per user
    const userUnitsMap = new Map<string, { units: number; invested: number }>()
    investmentsSnap.docs.forEach(doc => {
      const data = doc.data()
      if (!data.userId) return
      const existing = userUnitsMap.get(data.userId) || { units: 0, invested: 0 }
      userUnitsMap.set(data.userId, { 
        units: existing.units + (Number(data.unitsOwned) || 0),
        invested: existing.invested + (Number(data.amountInvested) || 0)
      })
    })

    // 3. Fetch comprehensive user details for each active investor
    const investors = []
    for (const [userId, stats] of Array.from(userUnitsMap.entries())) {
      let name = 'Verified Investor'
      let email = ''
      let phone = ''
      let profilePhoto = ''
      
      try {
        const [investorDoc, userDoc, devDoc] = await Promise.all([
          db.collection('investors').doc(userId).get(),
          db.collection('users').doc(userId).get(),
          db.collection('developers').doc(userId).get()
        ])

        const combinedData = {
          ...(userDoc.exists ? userDoc.data() : {}),
          ...(investorDoc.exists ? investorDoc.data() : {}),
          ...(devDoc.exists ? devDoc.data() : {})
        }

        name = combinedData.fullName || combinedData.name || combinedData.displayName || `${combinedData.firstName || ''} ${combinedData.lastName || ''}`.trim() || name
        email = combinedData.email || ''
        phone = combinedData.phone || combinedData.mobile || ''
        profilePhoto = combinedData.profilePhoto || combinedData.photoURL || combinedData.avatar || ''
      } catch (e) {
        console.error('[Investor Profile Fetch Error]', e)
      }

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

    // Sort by units owned descending
    investors.sort((a, b) => b.unitsOwned - a.unitsOwned)

    return NextResponse.json({ success: true, data: investors })
  } catch (err) {
    console.error('[Investors Analytics API error]', err)
    return NextResponse.json({ success: false, error: 'Failed to load investors' }, { status: 500 })
  }
}

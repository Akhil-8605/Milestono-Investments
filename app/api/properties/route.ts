import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, propertiesStore } from '@/lib/store/data'
import { ApiResponse, Property } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { searchParams } = req.nextUrl
    const city = searchParams.get('city')
    const type = searchParams.get('type')
    const status = searchParams.get('status') ?? 'active'
    const sort = searchParams.get('sort') ?? 'marketCap'
    const q = searchParams.get('q')?.toLowerCase()
    const developerId = searchParams.get('developerId')
    
    // We fetch all matching status and then filter in memory for complex filters 
    // since Firestore doesn't support all complex multi-field filtering out of the box easily.
    
    let query: FirebaseFirestore.Query = db.collection('properties')
    let properties: Property[] = []

    if (developerId) {
      const devIds = developerId.split(',').map(s => s.trim()).filter(Boolean)
      if (devIds.length > 0) {
        // Query by developerId field
        const snap1 = await db.collection('properties').where('developerId', 'in', devIds.slice(0, 10)).get()
        const docs1 = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property))

        // Query by developerInfo fields & globalId prefix fallback
        const snap2 = await db.collection('properties').get()
        const docs2 = snap2.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Property))
          .filter(p => {
            const pDevId = p.developerId
            const pDevInfoId = (p as any)?.developerInfo?.developerId
            const pDevEmail = (p as any)?.developerInfo?.email
            const pUserId = (p as any)?.userId
            const pGlobalId = p.globalId
            return devIds.some(id => 
              id === pDevId || 
              id === pDevInfoId || 
              id === pDevEmail || 
              id === pUserId || 
              (pGlobalId && pGlobalId.startsWith(id))
            )
          })

        const map = new Map<string, Property>()
        docs1.concat(docs2).forEach(p => map.set(p.id || p.symbol, p))
        properties = Array.from(map.values())
      }
    } else {
      if (status) {
        query = query.where('status', '==', status)
      }
      const snapshot = await query.get()
      properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property))
    }

    // Filter
    if (city) properties = properties.filter(p => p.city?.toLowerCase() === city.toLowerCase())
    if (type) properties = properties.filter(p => p.type === type)
    if (q) properties = properties.filter(p => {
      const locStr = typeof p.location === 'object' ? (p.location?.areaLocality || p.location?.city || '') : (p.location || '');
      return p.name?.toLowerCase().includes(q) ||
      p.symbol?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      locStr.toLowerCase().includes(q)
    })

    // Sort
    const sortFns: Record<string, (a: Property, b: Property) => number> = {
      marketCap: (a, b) => (b.marketData?.marketCap || 0) - (a.marketData?.marketCap || 0),
      price: (a, b) => (a.marketData?.currentPrice || 0) - (b.marketData?.currentPrice || 0),
      yield: (a, b) => (b.expectedYield || 0) - (a.expectedYield || 0),
      change: (a, b) => (b.marketData?.changePct || 0) - (a.marketData?.changePct || 0),
      volume: (a, b) => (b.marketData?.volume || 0) - (a.marketData?.volume || 0),
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
    }
    properties.sort(sortFns[sort] ?? sortFns.marketCap)

    // Strip heavy price history for list view
    const lightweight = properties.map(({ marketData, ...rest }) => ({
      ...rest,
      marketData: {
        ...marketData,
        priceHistory: marketData?.priceHistory?.slice(-7) || [], // last 7 days for sparkline
      },
    }))

    return NextResponse.json<ApiResponse<typeof lightweight>>({ success: true, data: lightweight })
  } catch (err) {
    console.error('[Properties] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/properties — create a new property (developer only)
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const body = await req.json()

    // Validate globalId uniqueness
    const { globalId } = body
    if (!globalId) {
      return NextResponse.json({ success: false, error: `Missing globalId` }, { status: 400 })
    }

    const docRef = db.collection('properties').doc(globalId) 
    const doc = await docRef.get()

    if (doc.exists) {
      return NextResponse.json({ success: false, error: `Property with this Ticker ID already exists` }, { status: 409 })
    }

    // Save to Firestore
    await docRef.set({
      ...body,
      status: body.status || 'pending_approval',
      createdAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true, data: { globalId } }, { status: 201 })
  } catch (err) {
    console.error('[Properties] POST error:', err)
    return NextResponse.json({ success: false, error: 'Failed to create property' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

  const status = req.nextUrl.searchParams.get('status')
  
  try {
    let query: FirebaseFirestore.Query = db.collection('properties')
    
    if (status) {
      query = query.where('status', '==', status)
    }
    
    const snapshot = await query.get()
    const properties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    properties.sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })

    return NextResponse.json({ success: true, data: properties })
  } catch (err) {
    console.error('[Admin Properties GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 })
  }
}

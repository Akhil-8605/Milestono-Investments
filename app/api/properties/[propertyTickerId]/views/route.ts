import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest, context: { params: Promise<{ propertyTickerId: string }> }) {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { propertyTickerId } = await context.params
    
    // We should parse the body for the investor details who viewed this.
    // In a real app we might grab this from the session token.
    const body = await req.json().catch(() => ({}))
    const { investorId, investorName } = body

    const propertyRef = db.collection('properties').doc(propertyTickerId)
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(propertyRef)
      if (!doc.exists) {
        throw new Error('Property not found')
      }

      const data = doc.data()
      const newViewCount = (data?.viewCount || 0) + 1
      
      t.update(propertyRef, { viewCount: newViewCount })

      if (investorId) {
        const viewRef = propertyRef.collection('views').doc()
        t.set(viewRef, {
          investorId,
          investorName: investorName || 'Unknown',
          viewedAt: new Date().toISOString()
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Views POST]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ propertyTickerId: string }> }) {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })
    
    const { propertyTickerId } = await context.params

    const snapshot = await db.collection('properties')
      .doc(propertyTickerId)
      .collection('views')
      .orderBy('viewedAt', 'desc')
      .get()

    const views = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ success: true, data: views })
  } catch (err: any) {
    console.error('[Views GET]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

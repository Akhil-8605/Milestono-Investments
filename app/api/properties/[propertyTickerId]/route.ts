import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function GET(req: NextRequest, context: { params: Promise<{ propertyTickerId: string }> }) {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { propertyTickerId } = await context.params
    const doc = await db.collection('properties').doc(propertyTickerId).get()

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    const data = { id: doc.id, ...doc.data() }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[Property GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch property' }, { status: 500 })
  }
}

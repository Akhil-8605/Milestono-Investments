import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

  const { id } = await params
  if (!id) return NextResponse.json({ success: false, error: 'Property ID required' }, { status: 400 })

  try {
    const body = await req.json()
    const { status, message } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const docRef = db.collection('properties').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    const finalStatus = status === 'approved' ? 'active' : 'rejected'

    await docRef.update({
      status: finalStatus,
      adminMessage: message || null,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true, message: `Property ${status} successfully` })
  } catch (err) {
    console.error('[Admin Properties PATCH]', err)
    return NextResponse.json({ success: false, error: 'Failed to update property' }, { status: 500 })
  }
}

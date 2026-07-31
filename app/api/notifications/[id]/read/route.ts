import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { id } = await context.params
    
    await db.collection('notifications').doc(id).update({ read: true })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Notifications PATCH]', err)
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

  const developerId = req.nextUrl.searchParams.get('developerId')
  const tickerId = req.nextUrl.searchParams.get('tickerId')

  if (!developerId || !tickerId) {
    return NextResponse.json({ success: false, error: 'developerId and tickerId required' }, { status: 400 })
  }

  try {
    const globalId = `${developerId}-${tickerId}`
    const docRef = db.collection('properties').doc(globalId)
    const propertyDoc = await docRef.get()

    if (propertyDoc.exists) {
      return NextResponse.json({ success: false, error: 'Ticker ID already used by this developer' })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[CheckTicker] error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

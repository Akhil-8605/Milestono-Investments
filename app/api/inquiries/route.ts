import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const body = await req.json()
    const { propertyTickerId, propertyId, developerId, investorId, investorName, message } = body

    if (!propertyTickerId || !developerId || !investorId || !message) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const batch = db.batch()

    // 1. Create Inquiry
    const inquiryRef = db.collection('inquiries').doc()
    batch.set(inquiryRef, {
      id: inquiryRef.id,
      propertyId,
      propertyTickerId,
      developerId,
      investorId,
      investorName, // Keeping it simple for demo instead of joining tables
      message,
      status: 'new',
      createdAt: new Date().toISOString()
    })

    // 2. Notification for Developer
    const devNotifRef = db.collection('notifications').doc()
    batch.set(devNotifRef, {
      id: devNotifRef.id,
      userId: developerId,
      type: 'inquiry_received',
      title: 'New Property Inquiry',
      message: `Investor ${investorName} submitted an inquiry for property ${propertyTickerId} says: "${message.substring(0, 50)}..."`,
      read: false,
      data: { propertyTickerId, inquiryId: inquiryRef.id },
      createdAt: new Date().toISOString()
    })

    // 3. Notification for Investor
    const invNotifRef = db.collection('notifications').doc()
    batch.set(invNotifRef, {
      id: invNotifRef.id,
      userId: investorId,
      type: 'inquiry_sent',
      title: 'Inquiry Submitted',
      message: `Your inquiry for property ${propertyTickerId} has been submitted successfully.`,
      read: false,
      data: { propertyTickerId },
      createdAt: new Date().toISOString()
    })

    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Inquiry POST]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const { searchParams } = req.nextUrl
    const developerId = searchParams.get('developerId')
    const propertyTickerId = searchParams.get('propertyTickerId')

    let query: FirebaseFirestore.Query = db.collection('inquiries')

    if (developerId) query = query.where('developerId', '==', developerId)
    if (propertyTickerId) query = query.where('propertyTickerId', '==', propertyTickerId)

    query = query.orderBy('createdAt', 'desc')

    const snapshot = await query.get()
    const inquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ success: true, data: inquiries })
  } catch (err) {
    console.error('[Inquiries GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}

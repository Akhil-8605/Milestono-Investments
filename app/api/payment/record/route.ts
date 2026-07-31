import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const {
      orderId,
      paymentId,
      transactionId,
      signature,
      userId,
      userEmail,
      userName,
      amount,
      purpose,
      status = 'success',
      invoiceUrl,
      dateTime = new Date().toISOString()
    } = body

    const docId = paymentId || transactionId || orderId || `pay_${Date.now()}`

    const paymentRecord = {
      orderId: orderId || '',
      paymentId: paymentId || transactionId || '',
      transactionId: transactionId || paymentId || '',
      signature: signature || '',
      userId: userId || '',
      userEmail: userEmail || '',
      userName: userName || '',
      amount: Number(amount) || 0,
      currency: 'INR',
      purpose: purpose || 'Platform Payment',
      status: status || 'success',
      invoiceUrl: invoiceUrl || '',
      dateTime,
      createdAt: new Date().toISOString()
    }

    // Save to 'payments' collection in Firestore
    await db.collection('payments').doc(docId).set(paymentRecord, { merge: true })

    return NextResponse.json({
      success: true,
      message: 'Payment record stored successfully',
      record: paymentRecord
    })
  } catch (error: any) {
    console.error('[Payment Record Error]:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to record payment' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 })
  }

  try {
    const userId = req.nextUrl.searchParams.get('userId')
    let query: any = db.collection('payments')

    if (userId) {
      query = query.where('userId', '==', userId)
    }

    const snapshot = await query.get()
    const payments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ success: true, payments })
  } catch (error: any) {
    console.error('[Get Payments Error]:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch payments' }, { status: 500 })
  }
}

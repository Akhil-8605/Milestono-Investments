import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 })
    }

    const doc = await db.collection('otps').doc(email).get()
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 })
    }

    const data = doc.data()
    if (!data) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 })
    }

    if (new Date(data.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 })
    }

    if (data.otp !== otp) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 })
    }

    // Clear the OTP
    await db.collection('otps').doc(email).delete()

    return NextResponse.json({ success: true, message: 'OTP verified successfully' })
  } catch (err: any) {
    console.error('[Verify OTP Error]', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to verify OTP' }, { status: 500 })
  }
}

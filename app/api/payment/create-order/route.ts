import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'INR', receipt } = await req.json()

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: 'Razorpay keys not configured' }, { status: 500 })
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
      // amount: amount * 100, // Razorpay takes amount in the smallest currency unit (paise)
      amount: 100, // FOR TESTING (₹1.00)
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    }

    const order = await instance.orders.create(options)

    if (!order) {
      return NextResponse.json({ success: false, error: 'Failed to create Razorpay order' }, { status: 500 })
    }

    return NextResponse.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID })
  } catch (err: any) {
    console.error('[Razorpay Order Error]', err)
    return NextResponse.json({ success: false, error: err.message || 'Payment initiation failed' }, { status: 500 })
  }
}

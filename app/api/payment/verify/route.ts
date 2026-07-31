import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    const secret = process.env.RAZORPAY_KEY_SECRET || 'fake_secret'
    
    const text = razorpay_order_id + "|" + razorpay_payment_id
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex')
    
    // For development, we bypass signature if secret is missing or fake_secret is used
    if (process.env.NODE_ENV !== 'production' && (!process.env.RAZORPAY_KEY_SECRET || secret === 'fake_secret')) {
        return NextResponse.json({ success: true, message: 'Payment verified (dev mode)' })
    }

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ success: true, message: 'Payment verified' })
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
    }

  } catch (err: any) {
    console.error('[Razorpay Verify Error]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save to Firestore
    await db.collection('otps').doc(email).set({
      otp,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    })

    // Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Send email
    await transporter.sendMail({
      from: `"Milestono Investments" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Milestono Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-md mx-auto; p-6 text-center">
          <h2 style="color: #2563eb;">Welcome to Milestono!</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 10px; border-radius: 8px;">${otp}</h1>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 5 minutes.</p>
        </div>
      `
    })

    return NextResponse.json({ success: true, message: 'OTP sent successfully' })
  } catch (err: any) {
    console.error('[OTP Error]', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to send OTP' }, { status: 500 })
  }
}

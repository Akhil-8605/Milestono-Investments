import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, otp } = await req.json()

    if (!email || !password || !name || !otp) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!db || !adminAuth) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 })
    }

    // Verify OTP
    const otpDoc = await db.collection('otps').doc(email).get()
    
    if (!otpDoc.exists) {
      return NextResponse.json({ success: false, error: 'OTP not found or expired' }, { status: 400 })
    }

    const otpData = otpDoc.data()
    
    if (otpData?.otp !== otp) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 })
    }

    if (new Date(otpData?.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 })
    }

    // Create User in Firebase Auth
    let userRecord
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      })
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 })
      }
      throw err
    }

    const userData = {
      id: userRecord.uid,
      name,
      email,
      role: 'investor', // default role
      profileCompleted: false,
      createdAt: new Date().toISOString()
    }

    // Save to Firestore users collection
    await db.collection('users').doc(userRecord.uid).set(userData)

    // Delete used OTP
    await db.collection('otps').doc(email).delete()

    // Generate Firebase Custom Token
    const customToken = await adminAuth.createCustomToken(userRecord.uid)

    // For consistency with existing frontend code, we'll return a structure similar to login
    // we use the customToken as both the generic token and firebaseToken
    const loginData = {
      token: customToken,
      firebaseToken: customToken,
      user: userData
    }

    const response = NextResponse.json({
      success: true,
      data: loginData,
    })

    response.cookies.set('milestono_token', customToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('[Signup Error]', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to create account' }, { status: 500 })
  }
}

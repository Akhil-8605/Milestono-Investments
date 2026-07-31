import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Firebase API key is missing' },
        { status: 500 }
      )
    }

    // Authenticate with Firebase REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    })

    const authData = await authRes.json()

    if (!authRes.ok) {
      console.warn('[Auth] Firebase login failed:', authData.error?.message)
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const uid = authData.localId

    if (!db || !adminAuth) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      )
    }

    // Fetch user details from Firestore
    const userDoc = await db.collection('users').doc(uid).get()
    
    let userData = {
      id: uid,
      email: authData.email,
      name: authData.displayName || email.split('@')[0],
      role: 'investor',
      profileCompleted: false
    }

    if (userDoc.exists) {
      userData = { ...userData, ...userDoc.data() }
    }

    // Generate Custom Token
    const customToken = await adminAuth.createCustomToken(uid)

    const responseData = {
      token: customToken,
      firebaseToken: customToken,
      user: userData
    }

    const response = NextResponse.json({
      success: true,
      data: responseData,
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
    console.error('[Auth] Login error:', err)
    return NextResponse.json(
      { success: false, error: 'Authentication service unavailable' },
      { status: 500 }
    )
  }
}

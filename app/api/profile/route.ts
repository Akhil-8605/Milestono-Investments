import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })
  }

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
  }

  try {
    const docRef = db.collection('profiles').doc(userId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: doc.data() })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { userId, ...profileData } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
    }

    const docRef = db.collection('profiles').doc(userId)
    
    await docRef.set({
      ...profileData,
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    return NextResponse.json({ success: true, message: 'Profile saved successfully' })
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to save profile' }, { status: 500 })
  }
}

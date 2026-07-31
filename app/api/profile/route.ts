import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })
  }

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
  }

  try {
    let doc = await db.collection('investors').doc(userId).get()
    if (!doc.exists) {
      doc = await db.collection('developers').doc(userId).get()
    }

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

    let developerId = profileData.developerId;

    if (profileData.role === 'developer' && !developerId && profileData.companyName) {
      let baseId = profileData.companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (baseId.length < 6) {
        baseId = baseId.padEnd(6, 'X');
      }
      baseId = baseId.substring(0, 6);
      
      let uniqueId = baseId;
      let isUnique = false;
      let counter = 1;
      
      while (!isUnique) {
        const querySnapshot = await db.collection('developers').where('developerId', '==', uniqueId).get();
        if (querySnapshot.empty) {
          isUnique = true;
        } else {
          uniqueId = baseId.substring(0, 5) + counter;
          counter++;
        }
      }
      developerId = uniqueId;
      profileData.developerId = developerId;
    }

    const collectionName = profileData.role === 'developer' ? 'developers' : 'investors';
    const docRef = db.collection(collectionName).doc(userId)
    
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

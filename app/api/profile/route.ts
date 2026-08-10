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
    let isDev = false
    let doc = await db.collection('developers').doc(userId).get()
    if (doc.exists) {
      isDev = true
    } else {
      doc = await db.collection('investors').doc(userId).get()
    }

    if (!doc.exists) {
      // Fallback response with auto-generated developerId for developer role
      const fallbackDevId = `DEV${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, '0')}`
      return NextResponse.json({ 
        success: true, 
        data: { 
          id: userId, 
          userId, 
          role: 'developer', 
          developerId: fallbackDevId 
        } 
      })
    }

    const data = doc.data() || {}
    if (isDev && !data.developerId) {
      const generatedId = `DEV${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, '0')}`
      await db.collection('developers').doc(userId).set({ developerId: generatedId }, { merge: true })
      data.developerId = generatedId
    }

    return NextResponse.json({ success: true, data })
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

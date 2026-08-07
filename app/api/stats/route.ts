import { NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    }
  }
  return getApps().length ? getFirestore() : null
}

export async function GET() {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Firebase Admin not initialized' }, { status: 500 })
    }
    const propertiesSnapshot = await adminDb.collection('properties').get()
    const investorsSnapshot = await adminDb.collection('investors').get()

    let totalAum = 0
    let propertyCount = propertiesSnapshot.size

    propertiesSnapshot.forEach(doc => {
      const data = doc.data()
      const price = data.marketData?.currentPrice ?? data.unitPrice ?? 0
      const units = data.totalUnits ?? 0
      totalAum += price * units
    })

    const investorCount = investorsSnapshot.size

    return NextResponse.json({
      success: true,
      data: {
        totalAum,
        propertyCount,
        investorCount
      }
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}

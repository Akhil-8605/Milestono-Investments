import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  try {
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
      console.log('Firebase Admin initialized successfully.')
    } else {
      console.warn('Firebase Admin credentials not found in .env. Profile features will fail.')
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error)
  }
}

export const db = getApps().length ? getFirestore() : null

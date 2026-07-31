import { addDoc, collection, doc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { BaseUser } from './types'

export const logPropertyView = async (propertyId: string, propertySymbol: string, developerId: string, user: BaseUser) => {
  if (!user) return

  try {
    const propRef = doc(db, 'properties', propertyId)
    await updateDoc(propRef, {
      viewCount: increment(1)
    })

    await addDoc(collection(db, 'property_views'), {
      propertyId,
      propertyTickerId: propertySymbol,
      developerId,
      investorId: user.id,
      investorName: user.name,
      investorEmail: user.email,
      investorPhone: user.phone || null,
      viewedAt: serverTimestamp()
    })
  } catch (err) {
    console.error('Failed to log property view:', err)
  }
}

export const logPropertyWatchlist = async (propertyId: string, propertySymbol: string, developerId: string, user: BaseUser, action: 'add' | 'remove') => {
  if (!user) return

  try {
    const watchRef = doc(db, 'property_watchlists', `${propertyId}_${user.id}`)
    const propRef = doc(db, 'properties', propertyId)
    
    if (action === 'add') {
      await setDoc(watchRef, {
        propertyId,
        propertyTickerId: propertySymbol,
        developerId,
        investorId: user.id,
        investorName: user.name,
        investorEmail: user.email,
        investorPhone: user.phone || null,
        watchlistedAt: serverTimestamp(),
        removed: false
      })
      await updateDoc(propRef, { watchlistCount: increment(1) }).catch(() => {})
    } else {
      await updateDoc(watchRef, {
        removed: true,
        removedAt: serverTimestamp()
      }).catch()
      await updateDoc(propRef, { watchlistCount: increment(-1) }).catch(() => {})
    }
  } catch (err) {
    console.error('Failed to log property watchlist:', err)
  }
}

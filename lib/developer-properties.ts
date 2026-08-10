import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Property } from '@/lib/types'

export async function fetchDeveloperProperties(user: any): Promise<Property[]> {
  const activeUserId = user?.id || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('milestono_user') || '{}')?.id)
  if (!activeUserId) return []

  let devIdFromProfile: string | null = null
  try {
    const profileRes = await fetch(`/api/profile?userId=${activeUserId}`)
    const profileJson = await profileRes.json()
    if (profileJson.success && profileJson.data?.developerId) {
      devIdFromProfile = profileJson.data.developerId
    }
  } catch (err) {
    console.warn('[DeveloperProperties] Profile fetch error:', err)
  }

  const candidateIds = Array.from(
    new Set([
      activeUserId,
      devIdFromProfile,
      (user as any)?.developerId,
      (user as any)?.uid,
      (user as any)?.email,
    ].filter(Boolean))
  ) as string[]

  try {
    const res = await fetch(`/api/properties?developerId=${encodeURIComponent(candidateIds.join(','))}`)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as Property[]
    }
  } catch (err) {
    console.error('[DeveloperProperties] API fetch error:', err)
  }

  return []
}

export function subscribeDeveloperProperties(
  user: any,
  onPropertiesLoaded: (properties: Property[]) => void
): () => void {
  let isSubscribed = true
  let unsubscribeFirestore: (() => void) | null = null

  const runSubscription = async () => {
    const activeUserId = user?.id || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('milestono_user') || '{}')?.id)
    if (!activeUserId) return

    let devIdFromProfile: string | null = null
    try {
      const profileRes = await fetch(`/api/profile?userId=${activeUserId}`)
      const profileJson = await profileRes.json()
      if (profileJson.success && profileJson.data?.developerId) {
        devIdFromProfile = profileJson.data.developerId
      }
    } catch (err) {
      console.warn('[DeveloperProperties] Profile fetch error:', err)
    }

    const candidateIds = Array.from(
      new Set([
        activeUserId,
        devIdFromProfile,
        (user as any)?.developerId,
        (user as any)?.uid,
        (user as any)?.email,
      ].filter(Boolean))
    ) as string[]

    const propertyMap = new Map<string, Property>()

    const notify = () => {
      if (isSubscribed) {
        onPropertiesLoaded(Array.from(propertyMap.values()))
      }
    }

    // 1. Initial fetch via Server API (Firebase Admin) for maximum reliability
    try {
      const res = await fetch(`/api/properties?developerId=${encodeURIComponent(candidateIds.join(','))}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        json.data.forEach((p: Property) => {
          if (p.id || p.symbol) propertyMap.set(p.id || p.symbol, p)
        })
        notify()
      }
    } catch (err) {
      console.error('[DeveloperProperties] API fetch error:', err)
    }

    // 2. Realtime listener via client Firestore
    try {
      const q = query(collection(db, 'properties'), where('developerId', 'in', candidateIds.slice(0, 10)))
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!isSubscribed) return
          snapshot.docs.forEach((docSnap) => {
            const p = { id: docSnap.id, ...docSnap.data() } as Property
            propertyMap.set(p.id || p.symbol, p)
          })
          notify()
        },
        (err) => {
          console.warn('[DeveloperProperties] Snapshot listener error:', err)
        }
      )
    } catch (err) {
      console.warn('[DeveloperProperties] Query creation failed:', err)
    }
  }

  runSubscription()

  return () => {
    isSubscribed = false
    if (unsubscribeFirestore) unsubscribeFirestore()
  }
}

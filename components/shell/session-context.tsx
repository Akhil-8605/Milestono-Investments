'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { BaseUser, Investor, Developer } from '@/lib/types'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

type AnyUser = BaseUser | Investor | Developer

const EIGHT_DAYS_MS = 7 * 24 * 60 * 60 * 1000

interface SessionContextValue {
  user: AnyUser | null
  setUser: (user: AnyUser | null) => void
  loading: boolean
  logout: () => void
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AnyUser | null>(null)
  const [loading, setLoading] = useState(true)

  const clearAuthStorage = () => {
    localStorage.removeItem('milestono_user')
    localStorage.removeItem('milestono_token')
    localStorage.removeItem('milestono_expires_at')
    localStorage.removeItem('milestono_auth_token')
    setUserState(null)
  }

  useEffect(() => {
    async function hydrateSession() {
      try {
        const expiresAt = localStorage.getItem('milestono_expires_at')
        if (expiresAt && new Date().getTime() > parseInt(expiresAt, 10)) {
          // Session expired after 7 days
          clearAuthStorage()
          setLoading(false)
          return
        }

        const raw = localStorage.getItem('milestono_user')
        if (!raw) {
          setUserState(null)
          setLoading(false)
          return
        }

        // If expiresAt is missing but user is logged in, auto extend to 7 days
        if (!expiresAt) {
          const newExpiry = Date.now() + EIGHT_DAYS_MS
          localStorage.setItem('milestono_expires_at', newExpiry.toString())
        }

        const parsed = JSON.parse(raw)
        let enrichedUser = parsed

        try {
          const response = await fetch(`/api/profile?userId=${parsed.id || parsed.email}`)
          if (response.ok) {
            const json = await response.json()
            if (json.success && json.data) {
              enrichedUser = {
                ...parsed,
                ...json.data,
                role: json.data.role || parsed.role || 'investor',
              }
              // Keep updated user in localStorage
              localStorage.setItem('milestono_user', JSON.stringify(enrichedUser))
            }
          }
        } catch (err) {
          console.warn('Failed to hydrate session profile:', err)
        }

        setUserState(enrichedUser)
      } catch (err) {
        console.warn('Failed to hydrate session user:', err)
      } finally {
        setLoading(false)
      }
    }

    hydrateSession()

    // 1. Listen for cross-tab storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'milestono_user' ||
        e.key === 'milestono_token' ||
        e.key === 'milestono_expires_at' ||
        e.key === null // localStorage.clear()
      ) {
        hydrateSession()
      }
    }

    // 2. Listen for same-tab custom auth changes
    const handleAuthChange = () => {
      hydrateSession()
    }

    // 3. Re-verify session when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        hydrateSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('milestono_auth_change', handleAuthChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 4. Connect Firebase Auth listener to keep tokens refreshed & active
    const unsubscribeFb = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken()
          localStorage.setItem('milestono_token', token)
          const currentExpires = localStorage.getItem('milestono_expires_at')
          if (!currentExpires || Date.now() > parseInt(currentExpires, 10)) {
            localStorage.setItem('milestono_expires_at', (Date.now() + EIGHT_DAYS_MS).toString())
          }
        } catch (err) {
          console.warn('Failed to refresh Firebase token:', err)
        }
      }
    })

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('milestono_auth_change', handleAuthChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      unsubscribeFb()
    }
  }, [])

  const setUser = (u: AnyUser | null) => {
    setUserState(u)
    if (u) {
      localStorage.setItem('milestono_user', JSON.stringify(u))
      const currentExpires = localStorage.getItem('milestono_expires_at')
      if (!currentExpires || Date.now() > parseInt(currentExpires, 10)) {
        localStorage.setItem('milestono_expires_at', (Date.now() + EIGHT_DAYS_MS).toString())
      }
    } else {
      clearAuthStorage()
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('milestono_auth_change'))
    }
  }

  const logout = () => {
    clearAuthStorage()
    signOut(auth).catch(() => {})
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('milestono_auth_change'))
    }
  }

  return (
    <SessionContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}

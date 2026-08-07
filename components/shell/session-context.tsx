'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { BaseUser, Investor, Developer } from '@/lib/types'

type AnyUser = BaseUser | Investor | Developer

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

  useEffect(() => {
    async function hydrateSession() {
      try {
        const expiresAt = localStorage.getItem('milestono_expires_at')
        if (expiresAt && new Date().getTime() > parseInt(expiresAt, 10)) {
          // Session expired
          localStorage.removeItem('milestono_user')
          localStorage.removeItem('milestono_token')
          localStorage.removeItem('milestono_expires_at')
          setLoading(false)
          return
        }

        const raw = localStorage.getItem('milestono_user')
        if (!raw) {
          setUserState(null)
          setLoading(false)
          return
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

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'milestono_user' || e.key === 'milestono_token') {
        hydrateSession()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setUser = (u: AnyUser | null) => {
    setUserState(u)
    if (u) {
      localStorage.setItem('milestono_user', JSON.stringify(u))
      // Note: expires_at is set during login/signup. If setUser is called directly (e.g. profile update), we keep the existing expires_at.
    } else {
      localStorage.removeItem('milestono_user')
      localStorage.removeItem('milestono_token')
      localStorage.removeItem('milestono_expires_at')
    }
  }

  const logout = () => {
    setUser(null)
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

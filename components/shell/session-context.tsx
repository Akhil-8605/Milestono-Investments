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
        const raw = sessionStorage.getItem('milestono_user')
        if (!raw) {
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
  }, [])

  const setUser = (u: AnyUser | null) => {
    setUserState(u)
    if (u) {
      sessionStorage.setItem('milestono_user', JSON.stringify(u))
    } else {
      sessionStorage.removeItem('milestono_user')
      sessionStorage.removeItem('milestono_token')
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

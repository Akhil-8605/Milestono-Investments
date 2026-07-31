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
    // Hydrate from sessionStorage on mount
    try {
      const token = sessionStorage.getItem('milestono_investments_token')
      const raw = sessionStorage.getItem('milestono_user')
      if (raw) setUserState(JSON.parse(raw))
    } catch {
      // ignore parse errors
    }
    setLoading(false)
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

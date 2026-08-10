'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { Loader2 } from 'lucide-react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSession } from './session-context'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  requiredRole?: 'investor' | 'developer' | 'admin'
  allowGuest?: boolean
  hideSidebar?: boolean
}

export function AppLayout({ children, title, subtitle, requiredRole, allowGuest, hideSidebar }: AppLayoutProps) {
  const router = useRouter()
  const { user: sessionUser, loading: sessionLoading, logout: sessionLogout } = useSession()
  const [user, setUser] = useState<{ id?: string; name: string; email: string; role: string } | null>(null)
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unviewedAlertsCount, setUnviewedAlertsCount] = useState(0)

  useEffect(() => {
    if (!user?.id || !user?.role || user.role === 'admin') return

    let isSubscribed = true
    let unsubs: (() => void)[] = []

    const setupUnviewedCounter = async () => {
      const activeUserId = user.id
      let devIdFromProfile: string | null = null

      if (user.role === 'developer') {
        try {
          const res = await fetch(`/api/profile?userId=${activeUserId}`)
          const json = await res.json()
          if (json.success && json.data?.developerId) {
            devIdFromProfile = json.data.developerId
          }
        } catch (err) {
          console.warn('Profile fetch error in AppLayout:', err)
        }
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

      let unreadNotifsCount = 0
      let unreadInquiriesCount = 0

      const updateCount = () => {
        if (isSubscribed) {
          setUnviewedAlertsCount(unreadNotifsCount + unreadInquiriesCount)
        }
      }

      // 1. Unread notifications query without compound index
      try {
        const qNotifs = query(collection(db, 'notifications'), where('userId', 'in', candidateIds.slice(0, 10)))
        const unsubN = onSnapshot(qNotifs, (snap) => {
          const docs = snap.docs.map(d => d.data())
          const unreadDocs = docs.filter(d => !d.read && (!d.role || d.role === user.role))
          unreadNotifsCount = unreadDocs.length
          updateCount()
        }, (err) => console.warn('[AppLayout] Notifications counter error:', err))
        unsubs.push(unsubN)
      } catch (e) {
        console.warn('[AppLayout] Notifications query error:', e)
      }

      // 2. Unread inquiries query for developers
      if (user.role === 'developer') {
        try {
          const qInq = query(collection(db, 'inquiries'), where('developerId', 'in', candidateIds.slice(0, 10)))
          const unsubI = onSnapshot(qInq, (snap) => {
            const docs = snap.docs.map(d => d.data())
            const newInquiries = docs.filter(d => d.status === 'new')
            unreadInquiriesCount = newInquiries.length
            updateCount()
          }, (err) => console.warn('[AppLayout] Inquiries counter error:', err))
          unsubs.push(unsubI)
        } catch (e) {
          console.warn('[AppLayout] Inquiries query error:', e)
        }
      }
    }

    setupUnviewedCounter()

    return () => {
      isSubscribed = false
      unsubs.forEach(u => u())
    }
  }, [user])

  const checkSessionAndProfile = useCallback(async () => {
    if (sessionLoading) return

    const raw = localStorage.getItem('milestono_user')
    if (!raw) {
      if (allowGuest) {
        setUser(null)
        setChecking(false)
        return
      }
      router.replace('/auth/login')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const userId = parsed.id || parsed.email

      // Check if profile is filled via backend API
      const profileRes = await fetch(`/api/profile?userId=${userId}`)
      const profileJson = await profileRes.json()

      if (!profileJson.success || !profileJson.data?.profileCompleted) {
        // Profile is not filled! Navigate to onboarding and disallow access to dashboards
        router.replace('/onboarding')
        return
      }

      const activeRole = profileJson.data.role || parsed.role || 'investor'
      const updatedUser = { ...parsed, ...profileJson.data, role: activeRole, id: userId }
      
      if (requiredRole && activeRole !== requiredRole && activeRole !== 'admin') {
        const roleRoutes: Record<string, string> = {
          investor: '/investor/dashboard',
          developer: '/developer/dashboard',
          admin: '/admin/properties',
        }
        router.replace(roleRoutes[activeRole] ?? '/auth/login')
        return
      }

      setUser(updatedUser)
      setChecking(false)
    } catch (err) {
      console.error('Error verifying user profile in AppLayout:', err)
      if (allowGuest) {
        setUser(null)
        setChecking(false)
      } else {
        router.replace('/onboarding')
      }
    }
  }, [sessionLoading, allowGuest, requiredRole, router])

  useEffect(() => {
    // Passive Market Sync (Resolves Appreciations)
    fetch('/api/market/sync', { method: 'POST' }).catch(() => {})
    checkSessionAndProfile()

    const handleAuthChange = () => {
      checkSessionAndProfile()
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'milestono_user' || e.key === 'milestono_token' || e.key === null) {
        checkSessionAndProfile()
      }
    }

    window.addEventListener('milestono_auth_change', handleAuthChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('milestono_auth_change', handleAuthChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [checkSessionAndProfile])

  function handleLogout() {
    sessionLogout()
    router.replace('/auth/login')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!user && !allowGuest) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors">
      {user && !hideSidebar && (
        <Sidebar
          role={user.role as 'investor' | 'developer' | 'admin'}
          userName={user.name}
          userEmail={user.email}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          unviewedAlertsCount={unviewedAlertsCount}
        />
      )}
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} isGuest={!user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

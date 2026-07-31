'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { Loader2 } from 'lucide-react'

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
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Passive Market Sync (Resolves Appreciations)
    fetch('/api/market/sync', { method: 'POST' }).catch(() => {})

    async function checkSessionAndProfile() {
      const raw = sessionStorage.getItem('milestono_user')
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
        const updatedUser = { ...parsed, ...profileJson.data, role: activeRole }
        
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
    }

    checkSessionAndProfile()
  }, [router, requiredRole, allowGuest])

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      sessionStorage.clear()
      router.replace('/auth/login')
    })
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

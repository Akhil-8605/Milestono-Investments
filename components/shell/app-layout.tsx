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
}

export function AppLayout({ children, title, subtitle, requiredRole }: AppLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('milestono_user')
    if (!raw) {
      router.replace('/auth/login')
      return
    }
    const parsed = JSON.parse(raw)
    if (requiredRole && parsed.role !== requiredRole && parsed.role !== 'admin') {
      const roleRoutes: Record<string, string> = {
        investor: '/investor/dashboard',
        developer: '/developer/dashboard',
        admin: '/admin/dashboard',
      }
      router.replace(roleRoutes[parsed.role] ?? '/auth/login')
      return
    }
    setUser(parsed)
    setChecking(false)
  }, [router, requiredRole])

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

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        role={user.role as 'investor' | 'developer' | 'admin'}
        userName={user.name}
        userEmail={user.email}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

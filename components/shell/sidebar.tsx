'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart3, Briefcase, Bell, BookOpen,
  Building2, PlusCircle, Settings, LogOut, TrendingUp,
  Star, Receipt, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
}

const INVESTOR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/investor/dashboard', icon: LayoutDashboard },
  { label: 'Market', href: '/investor/market', icon: TrendingUp },
  { label: 'Portfolio', href: '/investor/portfolio', icon: Briefcase },
  { label: 'Watchlist', href: '/investor/watchlist', icon: Star },
  { label: 'Orders', href: '/investor/orders', icon: Receipt },
  { label: 'Alerts', href: '/investor/alerts', icon: Bell },
  { label: 'Reports', href: '/investor/reports', icon: BarChart3 },
]

const DEVELOPER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/developer/dashboard', icon: LayoutDashboard },
  { label: 'My Properties', href: '/developer/properties', icon: Building2 },
  { label: 'List Property', href: '/developer/list', icon: PlusCircle },
  { label: 'Analytics', href: '/developer/analytics', icon: BarChart3 },
  { label: 'Transactions', href: '/developer/transactions', icon: Receipt },
]

const BOTTOM_NAV: NavItem[] = [
  { label: 'Knowledge', href: '/learn', icon: BookOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  role: 'investor' | 'developer' | 'admin'
  userName: string
  userEmail: string
  onLogout: () => void
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

export function Sidebar({ role, userName, userEmail, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'developer' ? DEVELOPER_NAV : INVESTOR_NAV

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col h-full w-[220px] bg-sidebar border-r border-border transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Building2 size={15} className="text-primary-foreground" />
        </div>
        <div>
          <div className="text-foreground font-bold text-sm leading-none">Milestono</div>
          <div className="text-primary text-[9px] uppercase tracking-[0.2em] mt-0.5 font-medium">Investors</div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3 border-b border-border">
        <span className={cn(
          'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded',
          role === 'developer' ? 'bg-primary/20 text-blue-500' :
          role === 'admin' ? 'bg-purple-500/10 text-purple-500' :
          'bg-green-500/10 text-green-500'
        )}>
          {role}
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon size={15} className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-muted-foreground'} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">{badge}</span>
              )}
              {active && <ChevronRight size={12} className="text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-border px-3 py-3 space-y-0.5">
        {BOTTOM_NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-loss hover:bg-loss/10 transition-all"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* User */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-foreground text-xs font-medium truncate">{userName}</div>
            <div className="text-muted-foreground text-[10px] truncate">{userEmail}</div>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}

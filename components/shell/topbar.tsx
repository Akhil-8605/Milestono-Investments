'use client'

import { useState, useEffect } from 'react'
import { Bell, Search, TrendingUp, TrendingDown, Sun, Moon, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useTheme } from './theme-provider'

const LIVE_TICKERS = [
  { sym: 'PRSN', chg: '+1.24%', up: true },
  { sym: 'GDBK', chg: '-0.38%', up: false },
  { sym: 'DLCG', chg: '+2.11%', up: true },
  { sym: 'EMTV', chg: '+0.87%', up: true },
  { sym: 'SBDA', chg: '-0.15%', up: false },
  { sym: 'HIBP', chg: '+1.55%', up: true },
  { sym: 'LDPA', chg: '+0.33%', up: true },
  { sym: 'THSR', chg: '-0.91%', up: false },
  { sym: 'BRHZ', chg: '+2.44%', up: true },
  { sym: 'MHWC', chg: '+0.72%', up: true },
]

interface TopbarProps {
  title?: string
  subtitle?: string
  onMenuClick?: () => void
}

export function Topbar({ title, subtitle, onMenuClick }: TopbarProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [time, setTime] = useState('')
  const [isMarketOpen, setIsMarketOpen] = useState(true)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      const h = now.getHours()
      const m = now.getMinutes()
      const totalMins = h * 60 + m
      setIsMarketOpen(totalMins >= 9 * 60 + 15 && totalMins < 15 * 60 + 30)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/investor/market?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  return (
    <div className="h-[52px] bg-sidebar border-b border-border flex items-center px-5 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button 
        onClick={onMenuClick}
        className="md:hidden h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 transition-colors hover:bg-secondary"
      >
        <Menu size={16} className="text-foreground" />
      </button>

      {/* Page title */}
      {title && (
        <div className="shrink-0">
          <div className="text-foreground text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-muted-foreground text-[10px] leading-none mt-0.5">{subtitle}</div>}
        </div>
      )}

      {/* Ticker strip */}
      <div className="flex-1 overflow-hidden mx-4">
        <div className="ticker-animate flex items-center gap-6 w-max">
          {[...LIVE_TICKERS, ...LIVE_TICKERS].map((t, i) => (
            <span key={i} className="flex items-center gap-1 text-xs shrink-0">
              <span className="text-muted-foreground font-medium">{t.sym}</span>
              <span className={t.up ? 'text-gain flex items-center gap-0.5' : 'text-loss flex items-center gap-0.5'}>
                {t.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {t.chg}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search symbol or city..."
            className="h-8 w-52 pl-8 bg-muted border-border text-foreground placeholder:text-muted-foreground text-xs focus-visible:border-primary focus-visible:ring-0"
          />
        </div>
      </form>

      {/* Market status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`h-1.5 w-1.5 rounded-full ${isMarketOpen ? 'bg-gain animate-pulse' : 'bg-[#6b7280]'}`} />
        <span className="text-[11px] text-muted-foreground font-medium">
          {isMarketOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>

      {/* Clock */}
      <div className="text-[11px] text-muted-foreground num shrink-0 font-mono hidden xl:block">{time}</div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="relative h-8 w-8 rounded-lg bg-muted hover:bg-secondary flex items-center justify-center transition-colors shrink-0 group"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun size={14} className="text-muted-foreground group-hover:text-yellow-500 transition-colors" />
        ) : (
          <Moon size={14} className="text-blue-800 group-hover:text-primary transition-colors" />
        )}
      </button>

      {/* Bell */}
      <button className="relative h-8 w-8 rounded-lg bg-muted hover:bg-secondary flex items-center justify-center transition-colors shrink-0">
        <Bell size={14} className="text-muted-foreground" />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
      </button>
    </div>
  )
}

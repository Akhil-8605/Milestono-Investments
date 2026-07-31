'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, TrendingUp, Shield, Percent, ArrowRight, BarChart3, Users, ChevronRight } from 'lucide-react'
import { Ticker } from '@/components/global/Ticker'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Property } from '@/lib/types'

const STATS: any[] = [
  { value: '₹140Cr+', label: 'Assets Under Management' },
  { value: '12,450', label: 'Active Investors' },
  { value: '48', label: 'Grade A Properties' },
  { value: '11.4%', label: 'Avg. Annual Yield' }
]

const FEATURES = [
  {
    icon: TrendingUp,
    color: 'var(--primary)',
    bg: '#1d3a6b',
    title: 'Stock-Exchange Experience',
    desc: 'Live price tickers, real-time charts, order books — real estate traded with the precision of equity markets.',
  },
  {
    icon: Percent,
    color: 'var(--gain)',
    bg: '#14281a',
    title: 'High-Yield Fractional Units',
    desc: 'Start with ₹35,000. Earn 7–13% annual rental yields from Grade A properties managed by top developers.',
  },
  {
    icon: Shield,
    color: '#8b5cf6',
    bg: '#2d1b5a',
    title: 'SEBI & RERA Compliant',
    desc: 'Every property is RERA registered. Investments governed by SEBI SM-REIT regulations for full transparency.',
  },
  {
    icon: BarChart3,
    color: '#f59e0b',
    bg: '#2d1e0a',
    title: 'Smart Portfolio Analytics',
    desc: 'Real-time P&L, sector allocation, rental income tracking, and stop-loss alerts — all in one dashboard.',
  },
  {
    icon: Users,
    color: '#06b6d4',
    bg: '#0c2d3a',
    title: 'Developer Marketplace',
    desc: 'Developers list properties, set pricing, and raise capital from thousands of verified investors directly.',
  },
  {
    icon: Building2,
    color: '#ec4899',
    bg: '#3a0c2d',
    title: 'Institutional Grade Assets',
    desc: 'Commercial offices, luxury residences, industrial parks — curated by our expert property committee.',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])

  useEffect(() => {
    // Passive Market Sync (Resolves Appreciations)
    fetch('/api/market/sync', { method: 'POST' }).catch(() => {})

    const raw = sessionStorage.getItem('milestono_user')
    if (raw) {
      try {
        const user = JSON.parse(raw)
        const routes: Record<string, string> = {
          investor: '/investor/dashboard',
          developer: '/developer/dashboard',
          admin: '/admin/properties',
        }
        router.replace(routes[user.role] ?? '/auth/login')
      } catch {
        sessionStorage.clear()
      }
    }
    const q = query(collection(db, 'properties'), where('status', '==', 'active'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[]
      setProperties(activeProps.slice(0, 5)) // Show top 5 on landing page
    }, (error) => {
      console.error('[Landing] Realtime Error:', error)
    })
    
    return () => unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="border-b border-border bg-sidebar/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 size={15} className="text-primary-foreground" />
            </div>
            <div>
              <div className="text-foreground font-bold text-sm leading-none">Milestono</div>
              <div className="text-primary text-[9px] uppercase tracking-[0.2em] font-medium">Investors</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#properties" className="hover:text-foreground transition-colors">Properties</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          </nav>
          <button
            onClick={() => router.push('/auth/login')}
            className="h-8 px-4 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            Sign In <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-blue-500 text-xs font-medium mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-gain animate-pulse" />
          Market Open · 12 properties traded today
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 text-balance max-w-4xl mx-auto">
          Real Estate.<br />
          <span className="text-primary">Traded Like Stocks.</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Buy fractional units of Grade A properties from ₹35,000. Earn rental income. Trade on India&apos;s most advanced real estate exchange platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.push('/auth/login')}
            className="h-11 px-7 rounded-lg bg-primary hover:bg-blue-600 text-white font-semibold text-sm transition-colors flex items-center gap-2"
          >
            Start Investing <ArrowRight size={16} />
          </button>
          <button
            onClick={() => router.push('/auth/login')}
            className="h-11 px-7 rounded-lg border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground font-semibold text-sm transition-colors flex items-center gap-2"
          >
            List a Property <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-foreground font-mono num">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Properties */}
      <section id="properties" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Live Market</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top performing properties right now</p>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="text-xs text-primary hover:text-blue-500 flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight size={11} />
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Symbol', 'Property', 'City', 'Type', 'Price', 'Yield', 'Change'].map(h => (
                  <th key={h} className={`py-3 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ${h === 'Symbol' || h === 'Property' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    Waiting for market data...
                  </td>
                </tr>
              ) : properties.map(p => {
                const price = p.marketData?.currentPrice || p.unitPrice || 0
                const changePct = p.marketData?.changePct || 0
                const up = changePct >= 0
                
                return (
                  <tr
                    key={p.symbol}
                    className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => router.push('/auth/login')}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
                          <span className="text-blue-500 text-[9px] font-bold">{p.symbol.slice(0, 2)}</span>
                        </div>
                        <span className="text-foreground text-xs font-bold">{p.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{p.name}</td>
                    <td className="py-3.5 px-4 text-right text-xs text-muted-foreground">{p.city}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary`}>
                        {p.type?.slice(0, 3)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs font-mono text-foreground">₹{price.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right text-xs font-semibold text-gain">{p.expectedYield}%</td>
                    <td className={`py-3.5 px-4 text-right text-xs font-bold ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {up ? '+' : ''}{changePct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border text-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mx-auto transition-colors"
            >
              Sign in to view all 48 properties and start investing <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Why Milestono Investors?</h2>
          <p className="text-muted-foreground text-sm">Built for serious investors. Designed like a trading terminal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-4" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-card border border-border rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20/20 to-transparent pointer-events-none" />
          <h2 className="text-2xl font-bold text-foreground mb-3 relative">Ready to invest in real estate?</h2>
          <p className="text-muted-foreground text-sm mb-7 max-w-lg mx-auto relative">
            Join 12,000+ investors earning passive income from India&apos;s finest properties. Start with as little as ₹35,000.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="h-11 px-8 rounded-lg bg-primary hover:bg-blue-600 text-white font-semibold text-sm transition-colors inline-flex items-center gap-2 relative"
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-sidebar">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Building2 size={11} className="text-white" />
            </div>
            <span className="text-muted-foreground text-xs">© 2026 Milestono Investors Pvt. Ltd. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="/legal/terms" className="hover:text-muted-foreground transition-colors">Terms</a>
            <a href="/legal/privacy" className="hover:text-muted-foreground transition-colors">Privacy</a>
            <a href="/legal/risk-disclosure" className="hover:text-muted-foreground transition-colors">Risk Disclosure</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

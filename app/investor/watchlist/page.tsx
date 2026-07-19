'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Sparkline } from '@/components/ui/sparkline'
import {
  Star, Trash2, Bell, Plus, BellOff, ChevronUp, ChevronDown,
  Building2, Search, MapPin, TrendingUp, TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

interface WProperty {
  id: string; symbol: string; name: string; city: string; type: string;
  currentPrice: number; changePct: number; change: number;
  expectedYield: number; occupancyRate: number;
  priceHistory: { date: string; price: number }[]
}

interface Alert {
  id: string; propertyId: string; symbol: string; name: string;
  type: 'above' | 'below'; targetPrice: number; triggered: boolean;
  createdAt: string;
}

export default function WatchlistPage() {
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WProperty[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [alertLoading, setAlertLoading] = useState(false)
  const [q, setQ] = useState('')
  const [showAlertForm, setShowAlertForm] = useState<string | null>(null)
  const [alertType, setAlertType] = useState<'above' | 'below'>('above')
  const [alertPrice, setAlertPrice] = useState('')

  const fetchWatchlist = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/watchlist')
      const json = await res.json()
      if (json.success) setWatchlist(json.data)
    } catch {
      setWatchlist([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts')
      const json = await res.json()
      if (json.success) setAlerts(json.data)
    } catch {
      setAlerts([])
    }
  }, [])

  useEffect(() => {
    fetchWatchlist()
    fetchAlerts()
  }, [fetchWatchlist, fetchAlerts])

  const removeFromWatchlist = async (propertyId: string) => {
    setWatchlist(prev => prev.filter(p => p.id !== propertyId))
    await fetch(`/api/watchlist?propertyId=${propertyId}`, { method: 'DELETE' })
  }

  const removeAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
    await fetch(`/api/alerts?alertId=${alertId}`, { method: 'DELETE' })
  }

  const createAlert = async (propertyId: string) => {
    const price = parseFloat(alertPrice)
    if (!price || price <= 0) return
    setAlertLoading(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, alertType, targetPrice: price }),
      })
      const json = await res.json()
      if (json.success) {
        setAlerts(prev => [...prev, json.data])
        setShowAlertForm(null)
        setAlertPrice('')
      }
    } finally {
      setAlertLoading(false)
    }
  }

  const filtered = watchlist.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.symbol.toLowerCase().includes(q.toLowerCase()) || p.city.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <AppLayout title="Watchlist" subtitle="Tracked Properties & Alerts">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-semibold text-base">Watchlist</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{watchlist.length} properties tracked</p>
          </div>
          <button
            onClick={() => router.push('/investor/market')}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-blue-500 px-3 py-1.5 rounded bg-primary/20/60 border border-primary/20 hover:border-primary/40 transition-all"
          >
            <Plus size={12} /> Add from Market
          </button>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Filter watchlist..."
            className="w-full h-8 pl-8 pr-3 rounded border border-border bg-muted text-foreground placeholder:text-muted-foreground text-xs outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Watchlist Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['', 'Property', 'LTP', 'Change', '7D Chart', 'Yield', 'Occupancy', 'Alert', ''].map(h => (
                  <th key={h} className={cn('py-2.5 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider', h === 'Property' || h === '' ? 'text-left' : 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 rounded bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Star size={28} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No properties in watchlist</p>
                    <button
                      onClick={() => router.push('/investor/market')}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Browse market to add properties
                    </button>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const up = p.changePct >= 0
                const sparkData = p.priceHistory?.map(h => h.price) ?? []
                const hasAlert = alerts.some(a => a.propertyId === p.id)

                return (
                  <>
                    <tr
                      key={p.id}
                      className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => router.push(`/investor/properties/${p.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          onClick={e => { e.stopPropagation(); removeFromWatchlist(p.id) }}
                          className="text-yellow-500 hover:text-yellow-500 transition-colors"
                        >
                          <Star size={13} fill="currentColor" />
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-blue-500 text-[9px] font-bold">{p.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="text-foreground text-xs font-semibold">{p.symbol}</div>
                            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                              <MapPin size={9} />{p.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="text-sm font-mono font-semibold text-foreground">{fmt(p.currentPrice)}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className={cn('flex items-center justify-end gap-1 text-xs font-bold', up ? 'text-gain' : 'text-loss')}>
                          {up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {Math.abs(p.changePct).toFixed(2)}%
                        </div>
                        <div className={cn('text-[10px] num', up ? 'text-gain/70' : 'text-loss/70')}>
                          {up ? '+' : ''}{fmt(p.change)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Sparkline data={sparkData} positive={up} width={72} height={28} />
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-semibold text-gain">
                        {p.expectedYield.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-muted-foreground">
                        {p.occupancyRate.toFixed(0)}%
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setShowAlertForm(showAlertForm === p.id ? null : p.id); setAlertPrice('') }}
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            hasAlert
                              ? 'text-yellow-500 bg-yellow-500/10'
                              : 'text-muted-foreground hover:text-muted-foreground bg-muted'
                          )}
                        >
                          {hasAlert ? <Bell size={13} fill="currentColor" /> : <Bell size={13} />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); removeFromWatchlist(p.id) }}
                          className="p-1.5 rounded bg-muted text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                    {/* Inline Alert Form */}
                    {showAlertForm === p.id && (
                      <tr key={`alert-${p.id}`} className="border-b border-border/40">
                        <td colSpan={9} className="px-6 py-3 bg-background">
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] text-muted-foreground">Alert for {p.symbol} when price is</span>
                            <div className="flex gap-1">
                              {(['above', 'below'] as const).map(t => (
                                <button
                                  key={t}
                                  onClick={() => setAlertType(t)}
                                  className={cn('px-3 py-1 rounded text-[11px] font-semibold capitalize transition-colors', alertType === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-muted-foreground')}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              value={alertPrice}
                              onChange={e => setAlertPrice(e.target.value)}
                              placeholder={`Target price (current: ${fmt(p.currentPrice)})`}
                              className="h-7 px-3 rounded border border-border bg-muted text-foreground placeholder:text-muted-foreground text-[11px] outline-none focus:border-primary w-64 transition-colors"
                            />
                            <button
                              onClick={() => createAlert(p.id)}
                              disabled={alertLoading || !alertPrice}
                              className="h-7 px-3 rounded bg-primary hover:bg-blue-600 text-white text-[11px] font-semibold disabled:opacity-50 transition-colors"
                            >
                              {alertLoading ? 'Creating...' : 'Set Alert'}
                            </button>
                            <button onClick={() => setShowAlertForm(null)} className="text-muted-foreground hover:text-muted-foreground">
                              <BellOff size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Active Alerts</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Symbol', 'Condition', 'Target Price', 'Status', 'Created', ''].map(h => (
                    <th key={h} className={cn('py-2.5 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider', h === 'Symbol' ? 'text-left' : 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id} className="border-b border-border/40 hover:bg-primary/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Bell size={12} className={a.triggered ? 'text-yellow-500' : 'text-primary'} />
                        <span className="text-xs font-semibold text-foreground">{a.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded', a.type === 'above' ? 'bg-green-500/10 text-green-500' : 'bg-loss/10 text-loss')}>
                        Price {a.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono text-foreground">{fmt(a.targetPrice)}</td>
                    <td className="py-3 px-4 text-right">
                      {a.triggered ? (
                        <span className="text-[10px] font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded flex items-center justify-end gap-1 w-fit ml-auto">
                          <Bell size={10} fill="currentColor" /> Triggered
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Watching</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-[10px] text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => removeAlert(a.id)}
                        className="p-1.5 rounded bg-muted text-muted-foreground hover:text-loss transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  TrendingUp, TrendingDown, Search, SlidersHorizontal,
  Star, Building2, ArrowUpDown, ChevronUp, ChevronDown,
  MapPin, Percent, BarChart3, Eye,
} from 'lucide-react'
import { AppLayout } from '@/components/shell/app-layout'
import { Sparkline } from '@/components/ui/sparkline'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CITIES = ['All', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Lucknow']
const TYPES = ['All', 'residential', 'commercial', 'industrial']
const SORTS = [
  { key: 'marketCap', label: 'Mkt Cap' },
  { key: 'yield', label: 'Yield' },
  { key: 'change', label: '% Change' },
  { key: 'price', label: 'Price' },
  { key: 'volume', label: 'Volume' },
]

interface PropertyRow {
  id: string
  symbol: string
  name: string
  city: string
  type: string
  totalUnits: number
  unitsAvailable: number
  unitPrice: number
  marketData: {
    currentPrice: number
    prevDayPrice: number
    change: number
    changePct: number
    weekHigh: number
    weekLow: number
    yearHigh: number
    yearLow: number
    volume: number
    marketCap: number
    priceHistory: Array<{ date: string; price: number }>
  }
  expectedYield: number
  occupancyRate: number
  status: string
}

function fmt(v: number) {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`
  return `₹${v.toLocaleString('en-IN')}`
}

function fmtPrice(v: number) {
  return `₹${v.toLocaleString('en-IN')}`
}

function MarketContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('All')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('marketCap')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [watchlisted, setWatchlisted] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort, status: 'active' })
      if (city !== 'All') params.set('city', city)
      if (type !== 'All') params.set('type', type)
      if (q) params.set('q', q)

      const res = await fetch(`/api/properties?${params}`)
      const json = await res.json()
      if (json.success) setProperties(json.data)
    } catch {
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [city, type, sort, q])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  // Load watchlist
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('milestono_user') ?? '{}')
    if (!user?.id) return
    fetch(`/api/watchlist?userId=${user.id}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) setWatchlisted(new Set(j.data.map((w: { id: string }) => w.id)))
      })
  }, [])

  async function toggleWatchlist(propertyId: string) {
    const user = JSON.parse(sessionStorage.getItem('milestono_user') ?? '{}')
    if (!user?.id) { router.push('/auth/login'); return }

    const inList = watchlisted.has(propertyId)
    setWatchlisted(prev => {
      const next = new Set(prev)
      inList ? next.delete(propertyId) : next.add(propertyId)
      return next
    })

    if (inList) {
      await fetch(`/api/watchlist?userId=${user.id}&propertyId=${propertyId}`, { method: 'DELETE' })
    } else {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, propertyId }),
      })
    }
  }

  function handleSort(key: string) {
    if (sort === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(key); setSortDir('desc') }
  }

  // Client-side sort direction
  const sorted = [...properties].sort((a, b) => {
    let va = 0, vb = 0
    switch (sort) {
      case 'marketCap': va = a.marketData.marketCap; vb = b.marketData.marketCap; break
      case 'yield': va = a.expectedYield; vb = b.expectedYield; break
      case 'change': va = a.marketData.changePct; vb = b.marketData.changePct; break
      case 'price': va = a.marketData.currentPrice; vb = b.marketData.currentPrice; break
      case 'volume': va = a.marketData.volume; vb = b.marketData.volume; break
    }
    return sortDir === 'desc' ? vb - va : va - vb
  })

  const SortIcon = ({ col }: { col: string }) => {
    if (sort !== col) return <ArrowUpDown size={11} className="text-muted-foreground" />
    return sortDir === 'desc' ? <ChevronDown size={11} className="text-primary" /> : <ChevronUp size={11} className="text-primary" />
  }

  const gainers = properties.filter(p => p.marketData.changePct > 0).length
  const losers = properties.filter(p => p.marketData.changePct < 0).length

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="bg-sidebar border-b border-border px-6 py-3 flex items-center gap-8">
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">{properties.length}</span> listings
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp size={12} className="text-gain" />
          <span className="text-gain font-semibold">{gainers}</span>
          <span className="text-muted-foreground">gainers</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingDown size={12} className="text-loss" />
          <span className="text-loss font-semibold">{losers}</span>
          <span className="text-muted-foreground">losers</span>
        </div>
        <div className="flex-1" />
        <span className="text-[11px] text-muted-foreground">Prices update every 30s</span>
      </div>

      {/* Filter bar */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search symbol, name or city..."
            className="h-8 w-60 pl-8 bg-muted border-border text-foreground placeholder:text-muted-foreground text-xs focus-visible:border-primary focus-visible:ring-0"
          />
        </div>

        {/* City filter */}
        <div className="flex items-center gap-1">
          {CITIES.map(c => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all',
                city === c
                  ? 'bg-primary/20 text-blue-500 border border-primary/30'
                  : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-secondary" />

        {/* Type filter */}
        <div className="flex items-center gap-1">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all capitalize',
                type === t
                  ? 'bg-green-500/10 text-green-500 border border-gain/30'
                  : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
              )}
            >
              {t === 'All' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted-foreground px-2 py-1.5 rounded hover:bg-muted"
        >
          <SlidersHorizontal size={13} />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-10">
                <Star size={11} />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Property
              </th>
              <th
                className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-muted-foreground"
                onClick={() => handleSort('price')}
              >
                <span className="flex items-center justify-end gap-1">LTP <SortIcon col="price" /></span>
              </th>
              <th
                className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-muted-foreground"
                onClick={() => handleSort('change')}
              >
                <span className="flex items-center justify-end gap-1">Chg % <SortIcon col="change" /></span>
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                7D Chart
              </th>
              <th
                className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-muted-foreground"
                onClick={() => handleSort('yield')}
              >
                <span className="flex items-center justify-end gap-1">Yield <SortIcon col="yield" /></span>
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Occupancy
              </th>
              <th
                className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-muted-foreground hidden lg:table-cell"
                onClick={() => handleSort('marketCap')}
              >
                <span className="flex items-center justify-end gap-1">Mkt Cap <SortIcon col="marketCap" /></span>
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                Available
              </th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/60">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-muted-foreground text-sm">
                  No properties found matching your criteria.
                </td>
              </tr>
            ) : (
              sorted.map((p) => {
                const up = p.marketData.changePct >= 0
                const pct = p.totalUnits > 0
                  ? ((p.totalUnits - p.unitsAvailable) / p.totalUnits) * 100
                  : 0
                const sparkData = p.marketData.priceHistory.map(h => h.price)

                return (
                  <tr
                    key={p.id}
                    className="market-row border-b border-border/40"
                    onClick={() => router.push(`/investor/properties/${p.id}`)}
                  >
                    {/* Watchlist star */}
                    <td className="px-6 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); toggleWatchlist(p.id) }}
                        className={cn(
                          'transition-colors',
                          watchlisted.has(p.id) ? 'text-yellow-500' : 'text-muted-foreground hover:text-muted-foreground'
                        )}
                      >
                        <Star size={13} fill={watchlisted.has(p.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>

                    {/* Property name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-blue-500 text-[9px] font-bold">{p.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground text-sm font-semibold">{p.symbol}</span>
                            <span className={cn(
                              'text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded',
                              p.type === 'commercial' ? 'bg-primary/20 text-blue-500' :
                              p.type === 'residential' ? 'bg-green-500/10 text-green-500' :
                              'bg-purple-500/10 text-purple-500'
                            )}>
                              {p.type.slice(0, 3)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={9} className="text-muted-foreground" />
                            <span className="text-muted-foreground text-[11px]">{p.city}</span>
                            <span className="text-muted-foreground text-[11px] hidden lg:inline">· {p.name}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LTP */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="text-foreground text-sm font-semibold num">{fmtPrice(p.marketData.currentPrice)}</div>
                      <div className="text-muted-foreground text-[11px] num">{fmtPrice(p.unitPrice)}</div>
                    </td>

                    {/* Change % */}
                    <td className="px-4 py-3.5 text-right">
                      <div className={cn('flex items-center justify-end gap-1 text-sm font-semibold num', up ? 'text-gain' : 'text-loss')}>
                        {up ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {Math.abs(p.marketData.changePct).toFixed(2)}%
                      </div>
                      <div className={cn('text-[11px] num', up ? 'text-gain/70' : 'text-loss/70')}>
                        {up ? '+' : ''}{fmtPrice(p.marketData.change)}
                      </div>
                    </td>

                    {/* Sparkline */}
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div className="flex justify-end">
                        <Sparkline data={sparkData} positive={up} width={72} height={28} />
                      </div>
                    </td>

                    {/* Yield */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gain">
                        <Percent size={11} />
                        {p.expectedYield.toFixed(1)}
                      </div>
                      <div className="text-muted-foreground text-[11px]">annual</div>
                    </td>

                    {/* Occupancy */}
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <div className="text-foreground text-sm num">{p.occupancyRate.toFixed(0)}%</div>
                      <div className="w-16 ml-auto mt-1 bg-muted rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-primary"
                          style={{ width: `${p.occupancyRate}%` }}
                        />
                      </div>
                    </td>

                    {/* Market cap */}
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <div className="text-foreground text-sm num">{fmt(p.marketData.marketCap)}</div>
                      <div className="text-muted-foreground text-[11px] num">{fmt(p.marketData.volume)} vol</div>
                    </td>

                    {/* Units available */}
                    <td className="px-4 py-3.5 text-right hidden xl:table-cell">
                      <div className="text-foreground text-sm num">{p.unitsAvailable.toLocaleString()}</div>
                      <div className="w-16 ml-auto mt-1 bg-muted rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-[#f59e0b]"
                          style={{ width: `${100 - pct}%` }}
                        />
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/investor/properties/${p.id}`) }}
                        className="row-action inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/20 hover:bg-blue-600 text-blue-500 hover:text-white text-xs font-semibold border border-primary/20 hover:border-primary/60 transition-all"
                      >
                        <Eye size={11} />
                        Invest
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-sidebar px-6 py-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{sorted.length} results · Prices in INR · RERA registered</span>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><BarChart3 size={10} /> Data sourced from property registrar</span>
        </div>
      </div>
    </div>
  )
}

export default function MarketPage() {
  return (
    <AppLayout title="Market" subtitle="Real Estate Exchange">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-muted-foreground text-sm">Loading market data...</div></div>}>
        <MarketContent />
      </Suspense>
    </AppLayout>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  TrendingUp, TrendingDown, Search, SlidersHorizontal,
  Star, Building2, ArrowUpDown, ChevronUp, ChevronDown,
  MapPin, Percent, BarChart3, Eye, IndianRupee,
} from 'lucide-react'
import { AppLayout } from '@/components/shell/app-layout'
import { useSession } from '@/components/shell/session-context'
import { Sparkline } from '@/components/ui/sparkline'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const CITIES = ['All', 'Mumbai', 'Delhi']
const TYPES = ['All', 'Apartment','Villa','Plot','Commercial Office','Retail Shop','Warehouse','Industrial','Land']
const SORTS = [
  { key: 'marketCap', label: 'Mkt Cap' },
  { key: 'yield', label: 'Yield' },
  { key: 'change', label: '% Change' },
  { key: 'price', label: 'Price' },
  { key: 'volume', label: 'Volume' },
]

interface PropertyRow {
  developerId: any
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
  const { user } = useSession()
  const [allProperties, setAllProperties] = useState<PropertyRow[]>([])
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

  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [minYield, setMinYield] = useState<number | ''>('')
  const [maxYield, setMaxYield] = useState<number | ''>('')
  const [gainersOnly, setGainersOnly] = useState(false)

  useEffect(() => {
    const qQuery = query(collection(db, 'properties'), where('status', '==', 'active'))
    const unsubscribe = onSnapshot(qQuery, (snapshot) => {
      const activeProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
      setAllProperties(activeProps)
      setLoading(false)
    }, (error) => {
      console.error('[Realtime Market] Error:', error)
      setAllProperties([])
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = [...allProperties]
    
    if (city !== 'All') {
      filtered = filtered.filter(p => p.city?.toLowerCase() === city.toLowerCase())
    }
    if (type !== 'All') {
      filtered = filtered.filter(p => p.type === type)
    }
    if (q) {
      const queryLower = q.toLowerCase()
      filtered = filtered.filter(p => {
        const locStr = typeof p.city === 'string' ? p.city : '';
        return p.name?.toLowerCase().includes(queryLower) ||
               p.symbol?.toLowerCase().includes(queryLower) ||
               locStr.toLowerCase().includes(queryLower)
      })
    }
    
    if (minPrice !== '') filtered = filtered.filter(p => (p.marketData?.currentPrice || p.unitPrice) >= minPrice)
    if (maxPrice !== '') filtered = filtered.filter(p => (p.marketData?.currentPrice || p.unitPrice) <= maxPrice)
    if (minYield !== '') filtered = filtered.filter(p => p.expectedYield >= minYield)
    if (maxYield !== '') filtered = filtered.filter(p => p.expectedYield <= maxYield)
    if (gainersOnly) filtered = filtered.filter(p => (p.marketData?.changePct || 0) > 0)
    
    setProperties(filtered)
  }, [allProperties, city, type, q, minPrice, maxPrice, minYield, maxYield, gainersOnly])

  // Load watchlist
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/watchlist?userId=${user.id}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) setWatchlisted(new Set(j.data.map((w: { id: string }) => w.id)))
      })
  }, [user?.id])

  async function toggleWatchlist(propertyId: string) {
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

  // Calculate market stats
  const totalMarketCap = properties.reduce((acc, p) => acc + ((p.marketData?.currentPrice || p.unitPrice) * p.totalUnits), 0)
  const avgYield = properties.length > 0 ? (properties.reduce((acc, p) => acc + p.expectedYield, 0) / properties.length) : 0

  const formatMarketCap = (value: number) => {
    if (value >= 10000000) return (value / 10000000).toFixed(2) + ' Cr'
    if (value >= 100000) return (value / 100000).toFixed(2) + ' L'
    return value.toLocaleString('en-IN')
  }

  return (
    <div className="flex flex-col h-full relative">
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
      <div className="bg-card/80 backdrop-blur-md border-y border-border px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 sticky top-0 z-20 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search symbol, name or city..."
            className="h-9 w-full md:w-64 pl-9 bg-background border-border/50 text-foreground placeholder:text-muted-foreground text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all"
          />
        </div>

        {/* City filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {CITIES.map(c => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                city === c
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="hidden md:block w-px h-6 bg-border mx-2" />

        {/* Type filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize whitespace-nowrap',
                type === t
                  ? 'bg-green-500/10 text-green-500 border border-green-500/30 shadow-sm'
                  : 'bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {t === 'All' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            "flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full transition-colors border",
            showFilters 
              ? "bg-primary text-primary-foreground border-primary" 
              : "text-foreground bg-background border-border/50 hover:bg-muted"
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-card/95 backdrop-blur-xl border-b border-border px-6 py-8 shadow-sm animate-in slide-in-from-top-2 duration-300 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><IndianRupee size={12}/> Price Range (₹)</h4>
              <div className="flex items-center gap-3">
                <Input type="number" placeholder="Min" className="h-10 bg-background" value={minPrice} onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')} />
                <span className="text-muted-foreground">-</span>
                <Input type="number" placeholder="Max" className="h-10 bg-background" value={maxPrice} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Percent size={12}/> Rental Yield (%)</h4>
              <div className="flex items-center gap-3">
                <Input type="number" placeholder="Min" className="h-10 bg-background" value={minYield} onChange={e => setMinYield(e.target.value ? Number(e.target.value) : '')} />
                <span className="text-muted-foreground">-</span>
                <Input type="number" placeholder="Max" className="h-10 bg-background" value={maxYield} onChange={e => setMaxYield(e.target.value ? Number(e.target.value) : '')} />
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ArrowUpDown size={12}/> Sort By</h4>
               <select 
                 className="w-full h-10 bg-background border border-border/50 hover:border-border rounded-xl px-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                 value={`${sort}-${sortDir}`}
                 onChange={(e) => {
                   const [k, d] = e.target.value.split('-');
                   setSort(k);
                   setSortDir(d as 'asc'|'desc');
                 }}
               >
                 <option value="marketCap-desc">Market Cap: High to Low</option>
                 <option value="yield-desc">Yield: High to Low</option>
                 <option value="price-asc">Price: Low to High</option>
                 <option value="price-desc">Price: High to Low</option>
                 <option value="change-desc">Change %: Gainers</option>
                 <option value="change-asc">Change %: Losers</option>
               </select>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><TrendingUp size={12}/> Quick Actions</h4>
               <div className="flex flex-wrap items-center gap-3">
                 <button 
                   onClick={() => setGainersOnly(!gainersOnly)} 
                   className={cn(
                     'px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex-1 text-center', 
                     gainersOnly ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-sm' : 'bg-background border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                   )}
                 >
                   Gainers Only
                 </button>
                 <button 
                   onClick={() => {
                     setMinPrice(''); setMaxPrice(''); setMinYield(''); setMaxYield(''); setGainersOnly(false); setSort('marketCap'); setSortDir('desc');
                   }} 
                   className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-background border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground flex-1 text-center"
                 >
                   Clear All
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

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
                const isFlat = p.marketData.changePct === 0
                const up = p.marketData.changePct > 0
                const pct = p.totalUnits > 0
                  ? ((p.totalUnits - p.unitsAvailable) / p.totalUnits) * 100
                  : 0
                const sparkData = p.marketData.priceHistory.map(h => h.price)

                return (
                  <tr
                    key={p.id}
                    className="market-row border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => router.push(`/properties/${p.id}`)}
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
                      <div className={cn('flex items-center justify-end gap-1 text-sm font-semibold num', isFlat ? 'text-muted-foreground' : up ? 'text-gain' : 'text-loss')}>
                        {!isFlat ? (up ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronUp size={14} className="opacity-0" />}
                        {Math.abs(p.marketData.changePct).toFixed(2)}%
                      </div>
                      <div className={cn('text-[11px] num', isFlat ? 'text-muted-foreground/70' : up ? 'text-gain/70' : 'text-loss/70')}>
                        {up && !isFlat ? '+' : ''}{fmtPrice(p.marketData.change)}
                      </div>
                    </td>

                    {/* Sparkline */}
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div className="flex justify-end">
                        <Sparkline data={sparkData} positive={isFlat ? undefined : up} width={72} height={28} />
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
                        onClick={e => { e.stopPropagation(); router.push(`/properties/${p.id}`) }}
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

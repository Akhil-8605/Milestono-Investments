'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property } from '@/lib/types'
import { Building2, MapPin, TrendingUp, Star, Loader2, IndianRupee, ArrowRight, BarChart3, Clock, TrendingDown, Search, SlidersHorizontal, Percent, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { Ticker } from '@/components/global/Ticker'
import { useSession } from '@/components/shell/session-context'

import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Sparkline } from '@/components/ui/sparkline'

const CITIES = ['All', 'Mumbai', 'Delhi']
const TYPES = ['All', 'Apartment','Villa','Plot','Commercial Office','Retail Shop','Warehouse','Industrial','Land']

export default function MarketPage() {
  const router = useRouter()
  const { user } = useSession()
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [city, setCity] = useState('All')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('marketCap')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [qStr, setQStr] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [minYield, setMinYield] = useState<number | ''>('')
  const [maxYield, setMaxYield] = useState<number | ''>('')
  const [gainersOnly, setGainersOnly] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'properties'), where('status', '==', 'active'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[]
      
      // Strip heavy history for the list view (keep last 7)
      const lightweight = activeProps.map(p => ({
        ...p,
        marketData: {
          ...p.marketData,
          priceHistory: p.marketData?.priceHistory?.slice(-7) || []
        }
      }))
      
      setAllProperties(lightweight)
      setIsLoading(false)
    }, (error) => {
      console.error('[Realtime Market] Error:', error)
      toast.error('Failed to sync live properties')
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = [...allProperties]
    
    if (city !== 'All') {
      filtered = filtered.filter(p => {
        const c = typeof p.location === 'object' ? p.location.city : p.city
        return c?.toLowerCase() === city.toLowerCase()
      })
    }
    if (type !== 'All') {
      filtered = filtered.filter(p => p.type === type)
    }
    if (qStr) {
      const queryLower = qStr.toLowerCase()
      filtered = filtered.filter(p => {
        const locStr = typeof p.location === 'object' ? p.location.city : (p.city || '');
        return p.name?.toLowerCase().includes(queryLower) ||
               p.symbol?.toLowerCase().includes(queryLower) ||
               locStr.toLowerCase().includes(queryLower)
      })
    }
    
    if (minPrice !== '') filtered = filtered.filter(p => (p.marketData?.currentPrice || p.unitPrice) >= minPrice)
    if (maxPrice !== '') filtered = filtered.filter(p => (p.marketData?.currentPrice || p.unitPrice) <= maxPrice)
    if (minYield !== '') filtered = filtered.filter(p => (p.expectedYield || 0) >= minYield)
    if (maxYield !== '') filtered = filtered.filter(p => (p.expectedYield || 0) <= maxYield)
    if (gainersOnly) filtered = filtered.filter(p => (p.marketData?.changePct || 0) > 0)
    
    // sorting
    filtered.sort((a, b) => {
      let va = 0, vb = 0
      switch (sort) {
        case 'marketCap': va = (a.marketData?.currentPrice || a.unitPrice) * (a.totalUnits || 0); vb = (b.marketData?.currentPrice || b.unitPrice) * (b.totalUnits || 0); break
        case 'yield': va = a.expectedYield || 0; vb = b.expectedYield || 0; break
        case 'change': va = a.marketData?.changePct || 0; vb = b.marketData?.changePct || 0; break
        case 'price': va = a.marketData?.currentPrice || a.unitPrice; vb = b.marketData?.currentPrice || b.unitPrice; break
        case 'volume': va = a.marketData?.volume || 0; vb = b.marketData?.volume || 0; break
      }
      return sortDir === 'desc' ? vb - va : va - vb
    })

    setProperties(filtered)
  }, [allProperties, city, type, qStr, minPrice, maxPrice, minYield, maxYield, gainersOnly, sort, sortDir])

  const addToWatchlist = async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault() // Prevent navigation to details
    e.stopPropagation()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, propertyId }),
      })
      if (!res.ok) throw new Error('API failed')
      toast.success(`Property added to watchlist!`)
    } catch (err) {
      toast.error('Failed to update watchlist')
    }
  }

  // Calculate market stats
  const totalMarketCap = properties.reduce((acc, p) => acc + ((p.marketData?.currentPrice || p.unitPrice) * p.totalUnits), 0)
  const avgYield = properties.length > 0 ? (properties.reduce((acc, p) => acc + p.expectedYield, 0) / properties.length) : 0
  const isYieldUp = true // In real life, compare to previous period

  const formatMarketCap = (value: number) => {
    if (value >= 10000000) return (value / 10000000).toFixed(2) + ' Cr'
    if (value >= 100000) return (value / 100000).toFixed(2) + ' L'
    return value.toLocaleString('en-IN')
  }

const MiniChart = ({ isUp }: { isUp: boolean }) => (
  <svg viewBox="0 0 100 30" className="w-20 h-10 overflow-visible opacity-80" preserveAspectRatio="none">
    <defs>
      <linearGradient id={`grad-${isUp}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.3} />
        <stop offset="100%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0} />
      </linearGradient>
    </defs>
    <path
      d={isUp 
        ? "M0,30 Q15,20 25,25 T50,15 T75,20 T100,5" 
        : "M0,5 Q15,15 25,10 T50,20 T75,15 T100,30"}
      fill="none"
      stroke={isUp ? "#10b981" : "#f43f5e"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d={isUp 
        ? "M0,30 Q15,20 25,25 T50,15 T75,20 T100,5 L100,30 L0,30 Z" 
        : "M0,5 Q15,15 25,10 T50,20 T75,15 T100,30 L100,30 L0,30 Z"}
      fill={`url(#grad-${isUp})`}
      stroke="none"
    />
  </svg>
)

  return (
    <AppLayout allowGuest title="Global Market">
      {/* Background elements */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/10 via-background/50 to-background pointer-events-none -z-10" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none -z-10" />
      
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Professional Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Market Overview
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live
              </span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Real-time asset pricing, analytics, and available fractional units across all premium properties.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-muted-foreground">Market Cap</span>
              <span className="text-2xl font-bold flex items-center gap-1 text-foreground">
                <IndianRupee className="h-5 w-5 text-primary" />
                {totalMarketCap > 0 ? formatMarketCap(totalMarketCap) : '0'}
              </span>
            </div>
            <div className="h-12 w-px bg-border mx-2 hidden md:block" />
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-muted-foreground">Avg Yield</span>
              <span className={`text-2xl font-bold flex items-center gap-1 ${avgYield > 0 ? 'text-green-500' : 'text-foreground'}`}>
                {avgYield.toFixed(1)}%
                {avgYield > 0 && <TrendingUp className="h-5 w-5" />}
              </span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={qStr}
              onChange={e => setQStr(e.target.value)}
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
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl px-6 py-8 shadow-sm animate-in slide-in-from-top-2 duration-300 relative z-10 -mt-8">
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
                       setMinPrice(''); setMaxPrice(''); setMinYield(''); setMaxYield(''); setGainersOnly(false); setSort('marketCap'); setSortDir('desc'); setCity('All'); setType('All'); setQStr('');
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

        {/* Content */}
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium animate-pulse">Loading market data...</p>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col h-[300px] items-center justify-center border border-dashed rounded-xl bg-muted/20 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No Properties Available</h3>
            <p className="text-sm text-muted-foreground mt-1">Market is currently updating.</p>
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm mt-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/40 border-b border-border/60">
                  <tr>
                    <th className="w-12 px-6 py-3" />
                    <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Asset Details</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">LTP</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">% Change</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">7 Day Trend</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Yield</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Mkt Cap</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Available</th>
                    <th className="text-right px-6 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => {
                    const changePct = p.marketData?.changePct || 0
                    const isFlat = changePct === 0
                    const up = changePct > 0
                    const pct = p.totalUnits > 0
                      ? (((p.unitsSold || 0)) / p.totalUnits) * 100
                      : 0
                    const sparkData = p.marketData?.priceHistory?.map((h: any) => h.price) || []
                    const marketCap = (p.marketData?.currentPrice || p.unitPrice) * (p.totalUnits || 0)

                    return (
                      <tr 
                        key={p.id} 
                        className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => router.push(`/properties/${p.id}`)}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={e => addToWatchlist(e, p.id)}
                            className="text-muted-foreground hover:text-yellow-500 transition-colors"
                          >
                            <Star size={14} />
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-primary text-[10px] font-bold">{p.symbol?.slice(0, 2) || 'PR'}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-foreground text-sm font-semibold">{p.symbol}</span>
                                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {(p.type || 'unknown').slice(0, 3)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-muted-foreground" />
                                <span className="text-muted-foreground text-[11px]">{typeof p.location === 'object' ? p.location.city : p.city}</span>
                                <span className="text-muted-foreground text-[11px] hidden lg:inline line-clamp-1 max-w-[120px]">· {p.name}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="text-foreground text-sm font-semibold font-mono">
                            ₹{(p.marketData?.currentPrice || p.unitPrice || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-muted-foreground text-[11px] font-mono mt-0.5">
                            ₹{(p.unitPrice || 0).toLocaleString('en-IN')}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className={`flex items-center justify-end gap-1 text-sm font-semibold font-mono ${isFlat ? 'text-muted-foreground' : up ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {!isFlat ? (up ? <TrendingUp size={14} /> : <TrendingDown size={14} />) : <TrendingUp size={14} className="opacity-0" />}
                            {Math.abs(changePct).toFixed(2)}%
                          </div>
                          <div className={`text-[11px] font-mono mt-0.5 ${isFlat ? 'text-muted-foreground/70' : up ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            {up && !isFlat ? '+' : ''}₹{(p.marketData?.change || 0).toLocaleString('en-IN')}
                          </div>
                        </td>

                        <td className="px-4 py-4 hidden xl:table-cell">
                          <div className="flex justify-end w-[100px] ml-auto">
                            {sparkData.length > 0 ? (
                              <Sparkline data={sparkData} positive={isFlat ? undefined : up} width={80} height={32} />
                            ) : (
                              <div className="h-8 w-20 bg-muted/30 rounded flex items-center justify-center text-[9px] text-muted-foreground">No data</div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 text-sm font-semibold text-emerald-500">
                            {p.expectedYield?.toFixed(1) || 0}%
                          </div>
                          <div className="text-muted-foreground text-[11px] mt-0.5">annual</div>
                        </td>

                        <td className="px-4 py-4 text-right hidden lg:table-cell">
                          <div className="text-foreground text-sm font-mono">{formatMarketCap(marketCap)}</div>
                          <div className="text-muted-foreground text-[11px] font-mono mt-0.5">
                            {formatMarketCap(p.marketData?.volume || 0)} vol
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right hidden xl:table-cell">
                          <div className="text-foreground text-sm font-mono">
                            {((p.totalUnits || 0) - (p.unitsSold || 0)).toLocaleString()}
                          </div>
                          <div className="w-16 ml-auto mt-1.5 bg-muted rounded-full h-1 overflow-hidden">
                            <div
                              className="h-1 rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/properties/${p.id}`)
                            }}
                          >
                            Explore <ArrowRight className="w-3 h-3 ml-1.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property } from '@/lib/types'
import { Building2, MapPin, TrendingUp, Star, Loader2, IndianRupee, ArrowRight, BarChart3, Clock, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Ticker } from '@/components/global/Ticker'

import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Sparkline } from '@/components/ui/sparkline'

export default function MarketPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'properties'), where('status', '==', 'active'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[]
      // Sort by market cap descending like the API did
      activeProps.sort((a, b) => (b.marketData?.marketCap || 0) - (a.marketData?.marketCap || 0))
      
      // Strip heavy history for the list view (keep last 7)
      const lightweight = activeProps.map(p => ({
        ...p,
        marketData: {
          ...p.marketData,
          priceHistory: p.marketData?.priceHistory?.slice(-7) || []
        }
      }))
      
      setProperties(lightweight)
      setIsLoading(false)
    }, (error) => {
      console.error('[Realtime Market] Error:', error)
      toast.error('Failed to sync live properties')
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addToWatchlist = async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault() // Prevent navigation to details
    e.stopPropagation()
    toast.success(`Property added to watchlist!`)
    // TODO: Implement actual API call to add to watchlist
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

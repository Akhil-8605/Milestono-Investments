'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property, Inquiry } from '@/lib/types'
import { Building2, Loader2, IndianRupee, Eye, MessageSquare, TrendingUp, ChevronLeft, Phone, Mail, Send, Activity, BarChart3, Users, Star, PieChart } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function DeveloperAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const propertyTickerId = params.propertyTickerId as string

  const [property, setProperty] = useState<Property | null>(null)
  const [views, setViews] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [investors, setInvestors] = useState<any[]>([])
  const [watchlisters, setWatchlisters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '1Y' | 'ALL'>('1M')

  useEffect(() => {
    if (!propertyTickerId) return

    setIsLoading(true)

    // 1. Property live data
    const qProp = query(collection(db, 'properties'), where('symbol', '==', propertyTickerId))
    const unsubProp = onSnapshot(qProp, (snap) => {
      if (!snap.empty) {
        setProperty({ id: snap.docs[0].id, ...snap.docs[0].data() } as Property)
      } else {
        toast.error('Property not found')
      }
      setIsLoading(false)
    })

    // 2. Views live data
    const qViews = query(collection(db, 'property_views'), where('propertyTickerId', '==', propertyTickerId))
    const unsubViews = onSnapshot(qViews, (snap) => {
      setViews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // 3. Inquiries live data
    const qInq = query(collection(db, 'inquiries'), where('propertyTicker', '==', propertyTickerId))
    const unsubInq = onSnapshot(qInq, (snap) => {
      setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry)))
    })

    // 4. Watchlisters live data
    const qWatch = query(collection(db, 'property_watchlists'), where('propertyTickerId', '==', propertyTickerId), where('removed', '==', false))
    const unsubWatch = onSnapshot(qWatch, (snap) => {
      setWatchlisters(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // 5. Investors fallback (no realtime needed since this could be heavy)
    fetch(`/api/properties/${propertyTickerId}/investors`)
      .then(r => r.json())
      .then(d => { if (d.success) setInvestors(d.data) })
      .catch(() => {})

    return () => {
      unsubProp()
      unsubViews()
      unsubInq()
      unsubWatch()
    }
  }, [propertyTickerId])

  if (isLoading) return (
    <AppLayout requiredRole="developer">
      <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
    </AppLayout>
  )

  if (!property) return null

  const filterChartData = () => {
    if (!property?.marketData?.priceHistory) return []
    const hist = property.marketData.priceHistory
    if (timeframe === 'ALL' || hist.length === 0) return hist
    
    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    let cutoffMs = 0
    if (timeframe === '1W') cutoffMs = 7 * msPerDay
    if (timeframe === '1M') cutoffMs = 30 * msPerDay
    if (timeframe === '1Y') cutoffMs = 365 * msPerDay
    
    const cutoffDate = new Date(now.getTime() - cutoffMs)
    return hist.filter((point: any) => new Date(point.date) >= cutoffDate)
  }
  
  const chartData = filterChartData()
  
  const currentPrice = property.marketData?.currentPrice ?? property.unitPrice ?? 0
  const changePct = property.marketData?.changePct ?? 0
  const isUp = changePct > 0
  const isFlat = changePct === 0

  return (
    <AppLayout requiredRole="developer" title={`${property.symbol} Analytics`}>
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg" onClick={() => router.push('/developer/properties')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md font-bold text-xs border border-primary/20">
                  {property.symbol}
                </span>
                <span className="bg-muted px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {property.type}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{property.name} Analytics</h1>
            </div>
          </div>
          <Button variant="default" size="lg" className="rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform" onClick={() => router.push(`/developer/list?edit=${property.id}`)}>
            Manage Property
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 flex flex-col justify-center border shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Total Views</span>
            <span className="text-2xl font-bold flex items-center text-foreground font-mono">
              {property.viewCount || 0}
            </span>
          </Card>
          
          <Card className="p-5 flex flex-col justify-center border shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Inquiries</span>
            <span className="text-2xl font-bold flex items-center text-foreground font-mono">
              {inquiries.length}
            </span>
          </Card>
          
          <Card className="p-5 flex flex-col justify-center border shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Current Price</span>
            <span className="text-2xl font-bold flex items-center text-foreground font-mono">
              <IndianRupee className="w-5 h-5 mr-1 text-primary" />
              {(property.marketData?.currentPrice || property.unitPrice).toLocaleString('en-IN')}
            </span>
          </Card>
          
          <Card className="p-5 flex flex-col justify-center border shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Appreciation</span>
            <span className={cn("text-2xl font-bold flex items-center font-mono", isUp ? "text-green-600 dark:text-green-500" : isFlat ? "text-muted-foreground" : "text-red-600 dark:text-red-500")}>
              {isUp ? '+' : ''}{(property.marketData?.changePct || 0).toFixed(2)}%
            </span>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <Card className="p-6 border shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Price Performance</h3>
                  <p className="text-muted-foreground font-medium mt-1">Asset valuation over time</p>
                </div>
                <div className="flex bg-muted/50 rounded-xl p-1.5 border border-border/50 backdrop-blur-md self-start sm:self-auto">
                  {(['1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
                    <button 
                      key={tf} 
                      onClick={() => setTimeframe(tf)}
                      className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", tf === timeframe ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="colorPriceDev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isFlat ? "hsl(var(--muted-foreground))" : isUp ? "hsl(142.1 76.2% 36.3%)" : "hsl(346.8 77.2% 49.8%)"} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={isFlat ? "hsl(var(--muted-foreground))" : isUp ? "hsl(142.1 76.2% 36.3%)" : "hsl(346.8 77.2% 49.8%)"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600}} 
                        dy={15} 
                        minTickGap={30} 
                        tickFormatter={(value) => {
                          try {
                            const date = new Date(value);
                            if (isNaN(date.getTime())) return String(value);
                            return format(date, 'MMM d, h:mm a');
                          } catch { return String(value) }
                        }}
                      />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600}} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: isFlat ? "hsl(var(--muted-foreground))" : isUp ? "hsl(142.1 76.2% 36.3%)" : "hsl(346.8 77.2% 49.8%)", fontWeight: 'bold', fontSize: '16px' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Price']}
                        labelFormatter={(label) => {
                          try {
                            const date = new Date(label);
                            if (isNaN(date.getTime())) return String(label);
                            return format(date, 'MMM d, yyyy, h:mm a');
                          } catch { return String(label) }
                        }}
                      />
                      <Area type="monotone" dataKey="price" stroke={isFlat ? "hsl(var(--muted-foreground))" : isUp ? "hsl(142.1 76.2% 36.3%)" : "hsl(346.8 77.2% 49.8%)"} strokeWidth={3} fillOpacity={1} fill="url(#colorPriceDev)" activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                    <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                    <span className="font-medium">No price history available</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Inquiries */}
            <Card className="p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-xl font-bold tracking-tight">Investor Inquiries</h3>
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold">{inquiries.length} Total</span>
              </div>
              
              {inquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl">
                  <MessageSquare className="w-8 h-8 mb-4 opacity-20" />
                  <span className="font-medium text-sm">No inquiries received yet.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map(inq => (
                    <div key={inq.id} className="p-4 border rounded-xl hover:border-primary/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg">{inq.investorName}</h4>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-semibold tracking-wider">New</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{inq.message}</p>
                        <p className="text-xs text-muted-foreground font-semibold">{inq.createdAt ? ((inq.createdAt as any).toDate ? formatDistanceToNow((inq.createdAt as any).toDate()) : formatDistanceToNow(new Date(inq.createdAt))) : 'Just now'} ago</p>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger render={<Button variant="outline" size="sm" className="shrink-0 rounded-md" />}>
                          Review Details
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader className="border-b pb-4 mb-2">
                            <DialogTitle className="text-lg font-bold">Inquiry Details</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">From: <span className="font-semibold text-foreground">{inq.investorName}</span></p>
                          </DialogHeader>
                          <div className="py-2 space-y-6">
                            <div className="space-y-2">
                              <h5 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Message</h5>
                              <p className="text-sm bg-muted/50 p-4 rounded-lg leading-relaxed border">{inq.message}</p>
                            </div>
                            <div className="space-y-3 pt-2">
                              <h5 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</h5>
                              <Button className="w-full justify-start rounded-lg" variant="outline">
                                <Phone className="w-4 h-4 mr-2" /> Call Investor
                              </Button>
                              <Button className="w-full justify-start rounded-lg" variant="outline">
                                <Mail className="w-4 h-4 mr-2" /> Send Email Response
                              </Button>
                              <Button className="w-full justify-start rounded-lg" variant="outline">
                                <Send className="w-4 h-4 mr-2" /> Platform Notification
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            {/* Price History */}
            <Card className="p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Price Updates</h3>
              </div>
              
              {(!property.marketData?.priceHistory || property.marketData.priceHistory.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground font-medium bg-muted/20 rounded-xl border border-dashed text-sm">
                  No price history available.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {[...property.marketData.priceHistory].reverse().map((ph: any, i: number, arr: any[]) => {
                    const prevPrice = arr[i + 1]?.price
                    let changePct = 0
                    if (prevPrice && prevPrice > 0) {
                      changePct = ((ph.price - prevPrice) / prevPrice) * 100
                    }
                    const isUp = changePct > 0
                    const isFlat = changePct === 0
                    
                    return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0 shadow-sm">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">₹{ph.price.toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-muted-foreground font-semibold">
                            {(() => {
                              try {
                                const d = new Date(ph.date);
                                if (isNaN(d.getTime())) return String(ph.date);
                                return format(d, 'MMM d, yyyy, h:mm a');
                              } catch { return String(ph.date) }
                            })()}
                          </p>
                        </div>
                      </div>
                      
                      {prevPrice !== undefined ? (
                        <div className={cn("text-xs font-bold font-mono px-2 py-1 rounded-md", isUp ? "bg-green-500/10 text-green-600 dark:text-green-400" : isFlat ? "bg-muted text-muted-foreground" : "bg-red-500/10 text-red-600 dark:text-red-400")}>
                          {isUp ? '+' : ''}{changePct.toFixed(2)}%
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold font-mono px-2 py-1 rounded-md bg-muted text-muted-foreground uppercase tracking-widest">
                          Initial
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </Card>

            {/* Investors List */}
            <Card className="p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-2 bg-primary/10 rounded-md">
                  <PieChart className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Active Investors</h3>
              </div>
              
              {investors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-medium bg-muted/20 rounded-xl border border-dashed text-sm">
                  No active investors yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {investors.map(inv => (
                    <div key={inv.userId} className="flex items-center justify-between p-3 rounded-xl border hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0 shadow-sm">
                          {inv.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold line-clamp-1">{inv.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                             <Mail className="w-3 h-3" /> {inv.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{inv.unitsOwned} <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Units</span></p>
                        <p className="text-xs font-mono font-bold text-primary">₹{inv.amountInvested.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Watchlisters */}
            <Card className="p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-2 bg-amber-500/10 rounded-md">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Watchlisted By</h3>
              </div>
              
              {watchlisters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-medium bg-muted/20 rounded-xl border border-dashed text-sm">
                  No users have watchlisted this.
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {watchlisters.map(watcher => (
                    <Dialog key={watcher.id}>
                      <DialogTrigger render={
                        <div className="flex items-center gap-4 p-3 rounded-xl border hover:border-primary/50 transition-all cursor-pointer">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0 shadow-sm">
                            {watcher.investorName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{watcher.investorName || 'Unknown User'}</p>
                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {watcher.investorEmail || 'Private Email'}
                            </p>
                          </div>
                        </div>
                      }/>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Investor Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center gap-4 border-b pb-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-md">
                              {watcher.investorName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="text-xl font-bold">{watcher.investorName || 'Unknown User'}</h4>
                              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                <Mail className="w-3.5 h-3.5"/> {watcher.investorEmail || 'N/A'}
                              </p>
                              {watcher.investorPhone && (
                                <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                  <Phone className="w-3.5 h-3.5"/> {watcher.investorPhone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-xl border space-y-2">
                            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Interaction Activity</p>
                            <p className="text-sm font-medium flex justify-between">
                              <span>Added to Watchlist</span>
                              <span>{watcher.watchlistedAt ? (watcher.watchlistedAt.toDate ? formatDistanceToNow(watcher.watchlistedAt.toDate()) : formatDistanceToNow(new Date(watcher.watchlistedAt))) : 'Unknown'} ago</span>
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Views */}
            <Card className="p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Recent Profile Views</h3>
              </div>
              
              {views.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-medium bg-muted/20 rounded-xl border border-dashed text-sm">
                  No views recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {views.slice(0, 8).map(view => (
                    <Dialog key={view.id}>
                      <DialogTrigger render={
                        <div className="flex items-center gap-4 p-3 rounded-xl border hover:border-primary/50 transition-all cursor-pointer">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0 shadow-sm">
                            {view.investorName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{view.investorName || 'Unknown User'}</p>
                            <p className="text-xs text-muted-foreground font-medium">{view.viewedAt ? (view.viewedAt.toDate ? formatDistanceToNow(view.viewedAt.toDate()) : formatDistanceToNow(new Date(view.viewedAt))) : 'Unknown'} ago</p>
                          </div>
                        </div>
                      }/>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Investor Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center gap-4 border-b pb-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-md">
                              {view.investorName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="text-xl font-bold">{view.investorName || 'Unknown User'}</h4>
                              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                <Mail className="w-3.5 h-3.5"/> {view.investorEmail || 'N/A'}
                              </p>
                              {view.investorPhone && (
                                <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                  <Phone className="w-3.5 h-3.5"/> {view.investorPhone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-xl border space-y-2">
                            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Interaction Activity</p>
                            <p className="text-sm font-medium flex justify-between">
                              <span>Last Viewed</span>
                              <span>{view.viewedAt ? (view.viewedAt.toDate ? formatDistanceToNow(view.viewedAt.toDate()) : formatDistanceToNow(new Date(view.viewedAt))) : 'Unknown'} ago</span>
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

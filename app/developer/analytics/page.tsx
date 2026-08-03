'use client'

import { AppLayout } from '@/components/shell/app-layout'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { 
  ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts'
import { Users, Activity, Eye, MessageSquare, Star, ArrowRight, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const fmtC = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-2xl backdrop-blur-xl min-w-[200px]">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between mb-2 last:mb-0 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span className="text-sm font-semibold text-foreground capitalize">{p.name}:</span>
            </div>
            <span className="text-sm font-mono font-black text-foreground">
              {p.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const { user } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [views, setViews] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<any[]>([])
  const [watchlists, setWatchlists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    let unsubs: any[] = []

    const unsubProps = onSnapshot(
      query(collection(db, 'properties'), where('developerId', '==', user.id)),
      (snap) => {
        const props = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
        setProperties(props)
        
        if (props.length === 0) {
          setLoading(false)
          return
        }

        const propIds = props.map(p => p.id)
        const propTickers = props.map(p => p.symbol).filter(Boolean)

        // Clean up previous chunked listeners if properties change
        unsubs.forEach(u => u())
        unsubs = []

        const setupChunkedListeners = (collectionName: string, field: string, values: string[], setter: any) => {
          const allData = new Map()
          let pendingInitialLoads = Math.ceil(values.length / 10)
          let loaded = 0

          const notify = () => {
            setter(Array.from(allData.values()))
          }

          if (values.length === 0) {
             setter([])
             return
          }

          for (let i = 0; i < values.length; i += 10) {
            const chunk = values.slice(i, i + 10)
            const q = query(collection(db, collectionName), where(field, 'in', chunk))
            const unsub = onSnapshot(q, (snap) => {
              snap.docChanges().forEach(change => {
                if (change.type === 'removed') {
                  allData.delete(change.doc.id)
                } else {
                  allData.set(change.doc.id, { id: change.doc.id, ...change.doc.data() })
                }
              })
              notify()
              if (loaded < pendingInitialLoads) {
                loaded++
                if (loaded === pendingInitialLoads) {
                  // Ready
                }
              }
            })
            unsubs.push(unsub)
          }
        }

        setupChunkedListeners('investments', 'propertyId', propIds, setInvestments)
        setupChunkedListeners('property_views', 'propertyTickerId', propTickers, setViews)
        setupChunkedListeners('inquiries', 'propertyTicker', propTickers, setInquiries)
        setupChunkedListeners('property_watchlists', 'propertyTickerId', propTickers, setWatchlists)

        setLoading(false)
      }
    )

    return () => {
      unsubProps()
      unsubs.forEach(u => u())
    }
  }, [user])

  // --- Aggregate Stats ---
  const activeInvestorsCount = new Set(investments.filter(i => i.status === 'active').map(i => i.userId)).size
  const totalViews = views.length
  const totalInquiries = inquiries.length
  const activeWatchlists = watchlists.filter(w => !w.removed).length

  // --- Global Graph Data ---
  const getGraphData = () => {
    const dataMap: Record<string, any> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('default', { month: 'short' })
      dataMap[key] = { name: key, Views: 0, Inquiries: 0, Watchlists: 0, _date: d }
    }

    views.forEach(v => {
      const d = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp || Date.now())
      const m = d.toLocaleString('default', { month: 'short' })
      if (dataMap[m] && d.getFullYear() === dataMap[m]._date.getFullYear()) dataMap[m].Views++
    })

    inquiries.forEach(i => {
      const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt || Date.now())
      const m = d.toLocaleString('default', { month: 'short' })
      if (dataMap[m] && d.getFullYear() === dataMap[m]._date.getFullYear()) dataMap[m].Inquiries++
    })

    watchlists.forEach(w => {
      if (w.removed) return
      const d = w.createdAt?.toDate ? w.createdAt.toDate() : new Date(w.createdAt || Date.now())
      const m = d.toLocaleString('default', { month: 'short' })
      if (dataMap[m] && d.getFullYear() === dataMap[m]._date.getFullYear()) dataMap[m].Watchlists++
    })

    return Object.values(dataMap)
  }
  const graphData = getGraphData()

  // --- Sorting Lists ---
  const recentInquiries = [...inquiries].sort((a, b) => {
    const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime()
    const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime()
    return tB - tA
  }).slice(0, 10)

  const recentWatchlists = [...watchlists].filter(w => !w.removed).sort((a, b) => {
    const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime()
    const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime()
    return tB - tA
  }).slice(0, 10)

  // --- Property Cards Data ---
  const propertyCardsData = properties.map(p => {
    const pViews = views.filter(v => v.propertyTickerId === p.symbol).length
    const pInq = inquiries.filter(i => i.propertyTicker === p.symbol).length
    const pWatch = watchlists.filter(w => w.propertyTickerId === p.symbol && !w.removed).length
    
    const miniGraph: any[] = []
    const now = new Date()
    for (let i = 3; i >= 0; i--) {
        miniGraph.push({ name: `W${4-i}`, Views: 0, Inquiries: 0 })
    }
    
    views.filter(v => v.propertyTickerId === p.symbol).forEach(v => {
        const d = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp || Date.now())
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24))
        const weekIdx = 3 - Math.floor(diffDays / 7)
        if (weekIdx >= 0 && weekIdx < 4) miniGraph[weekIdx].Views++
    })

    inquiries.filter(i => i.propertyTicker === p.symbol).forEach(inv => {
        const d = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt || Date.now())
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24))
        const weekIdx = 3 - Math.floor(diffDays / 7)
        if (weekIdx >= 0 && weekIdx < 4) miniGraph[weekIdx].Inquiries++
    })

    return {
      ...p,
      stats: { views: pViews, inquiries: pInq, watchlists: pWatch },
      miniGraph
    }
  })

  return (
    <AppLayout title="Advanced Analytics" subtitle="Deep engagement and performance insights" requiredRole="developer">
      <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              Engagement Analytics <Activity className="text-primary w-6 h-6" />
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Track views, inquiries, and watchlists across your entire portfolio.</p>
          </div>
        </div>

        {loading ? (
           <div className="py-32 flex justify-center text-primary"><span className="animate-pulse font-bold text-xl">Crunching analytics...</span></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Views', value: totalViews, change: '+12%', icon: Eye, color: 'var(--primary)' },
                { label: 'Active Inquiries', value: totalInquiries, change: '+5%', icon: MessageSquare, color: '#f59e0b' },
                { label: 'Watchlists', value: activeWatchlists, change: '+18%', icon: Star, color: '#8b5cf6' },
                { label: 'Active Investors', value: activeInvestorsCount, change: '+2', icon: Users, color: 'var(--gain)' },
              ].map(({ label, value, change, icon: Icon, color }) => (
                <div key={label} className="bg-card border border-border/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500" style={{ background: color }} />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                    <div className="p-2.5 rounded-xl bg-background border border-border/50 shadow-sm" style={{ color }}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="text-3xl lg:text-4xl font-black tracking-tight font-mono relative z-10">{value}</div>
                  <div className={cn("text-xs font-bold mt-2 flex items-center gap-1.5 relative z-10", change.includes('+') ? 'text-gain' : 'text-red-500')}>
                    {change.includes('+') ? '▲' : '▼'} {change} from last month
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">Engagement Trends</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Correlation between Views, Inquiries, and Watchlists.</p>
                  </div>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={graphData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} iconType="circle" />
                      <Area yAxisId="left" type="monotone" dataKey="Views" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                      <Bar yAxisId="left" dataKey="Watchlists" barSize={16} fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.8} />
                      <Line yAxisId="left" type="monotone" dataKey="Inquiries" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-black text-foreground tracking-tight">Recent Inquiries</h3>
                </div>
                {recentInquiries.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-medium border border-dashed rounded-xl opacity-50">No recent inquiries</div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {recentInquiries.map((inq, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-all bg-muted/10">
                        <div className="flex justify-between items-start mb-2">
                           <div className="font-bold text-sm">{inq.investorName}</div>
                           <span className="text-[10px] text-muted-foreground font-semibold">
                             {inq.createdAt?.toDate ? formatDistanceToNow(inq.createdAt.toDate()) : 'Just now'} ago
                           </span>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{inq.message}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 inline-block px-2 py-0.5 rounded-sm border border-primary/20">
                           {inq.propertyTicker}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 mt-8">
               <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3 border-b border-border/50 pb-4">
                  Property Breakdowns <TrendingUp className="text-muted-foreground w-6 h-6" />
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {propertyCardsData.map((p) => (
                    <Card key={p.id} className="p-6 border-border/50 shadow-sm flex flex-col hover:shadow-lg transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md font-bold text-[10px] border border-primary/20">
                                {p.symbol}
                              </span>
                            </div>
                            <h4 className="text-xl font-black tracking-tight line-clamp-1">{p.name || p.basicDetails?.propertyName}</h4>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2 mb-6">
                          <div className="bg-muted/30 p-3 rounded-xl text-center">
                             <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Views</div>
                             <div className="text-lg font-black font-mono">{p.stats.views}</div>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-xl text-center">
                             <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Inquiries</div>
                             <div className="text-lg font-black font-mono">{p.stats.inquiries}</div>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-xl text-center">
                             <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Watchlist</div>
                             <div className="text-lg font-black font-mono">{p.stats.watchlists}</div>
                          </div>
                       </div>

                       <div className="h-[120px] w-full mb-6 border-b border-border/50 pb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={p.miniGraph}>
                               <Area type="monotone" dataKey="Views" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                               <Line type="monotone" dataKey="Inquiries" stroke="#f59e0b" strokeWidth={2} dot={false} />
                               <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
                            </ComposedChart>
                          </ResponsiveContainer>
                       </div>

                       <Button 
                         onClick={() => router.push(`/developer/properties/${p.symbol}`)} 
                         variant="outline" 
                         className="w-full mt-auto rounded-xl font-bold justify-between group"
                       >
                         View Detailed Analytics
                         <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </Button>
                    </Card>
                 ))}
                 
                 {propertyCardsData.length === 0 && (
                   <div className="col-span-full py-12 flex items-center justify-center text-muted-foreground border border-dashed rounded-2xl">
                      No properties found in your portfolio.
                   </div>
                 )}
               </div>
            </div>

          </>
        )}
      </div>
    </AppLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Building2, TrendingUp, Users, Wallet, Plus, ArrowRight,
  ChevronUp, ChevronDown, Activity, BadgeIndianRupee, Percent, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtC = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return fmt(n)
}

function MetricCard({ label, value, sub, icon: Icon, type, className }: {
  label: string, value: string, sub?: string, icon: React.ElementType, type: 'neutral' | 'gain' | 'loss' | 'brand', className?: string
}) {
  const iconColors = {
    neutral: 'text-muted-foreground',
    gain: 'text-gain',
    loss: 'text-red-600',
    brand: 'text-primary'
  }
  const bgColors = {
    neutral: 'bg-muted/30',
    gain: 'bg-gain/10',
    loss: 'bg-red-600/10',
    brand: 'bg-primary/10'
  }

  return (
    <div className={cn("bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group", className)}>
      <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 blur-2xl", bgColors[type])} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={cn("p-2 rounded-xl", bgColors[type])}>
          <Icon size={18} className={iconColors[type]} />
        </div>
      </div>
      <div className="text-3xl lg:text-4xl font-black tracking-tight font-mono relative z-10">{value}</div>
      {sub && <div className={cn("text-sm font-semibold mt-2 flex items-center gap-1.5 relative z-10", type === 'gain' ? 'text-gain' : type === 'loss' ? 'text-red-600' : 'text-muted-foreground')}>
        {sub.includes('▲') ? <ChevronUp size={16} className="stroke-[4]" /> : sub.includes('▼') ? <ChevronDown size={16} className="stroke-[4]" /> : null}
        {sub.replace('▲', '').replace('▼', '')}
      </div>}
    </div>
  )
}

const Tip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-card border border-border/50 rounded-xl px-5 py-4 text-sm shadow-2xl backdrop-blur-xl">
      <p className="text-muted-foreground mb-3 font-bold uppercase tracking-wider text-xs">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-3 mb-2 last:mb-0">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
          <span className="font-semibold text-foreground">{p.name}:</span>
          <span className="font-mono text-foreground font-black">
            {typeof p.value === 'number' && p.value > 999 && p.name !== 'Units' && p.name !== 'Views' && p.name !== 'Enquiries' ? fmtC(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  ) : null

export default function DeveloperDashboard() {
  const router = useRouter()
  const { user } = useSession()
  const [properties, setProperties] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      query(collection(db, 'properties'), where('developerId', '==', user.id)),
      async (snap) => {
        const props = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setProperties(props)

        const propertyIds = props.map(p => p.id)
        let allInvestments: any[] = []
        if (propertyIds.length > 0) {
          try {
            for (let i = 0; i < propertyIds.length; i += 10) {
              const chunk = propertyIds.slice(i, i + 10)
              const q = query(collection(db, 'investments'), where('propertyId', 'in', chunk))
              const invSnap = await getDocs(q)
              allInvestments = [...allInvestments, ...invSnap.docs.map(d => ({ id: d.id, ...d.data() }))]
            }
          } catch (e) {
            console.error(e)
          }
        }

        const sData: any = {}
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthName = d.toLocaleString('default', { month: 'short' })
          sData[monthName] = { month: monthName, units: 0, revenue: 0, _date: d }
        }

        const aData: any = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(now.getDate() - i)
          const dayName = d.toLocaleString('default', { weekday: 'short' })
          aData[dayName] = { day: dayName, views: Math.floor(Math.random() * 80) + 20, investments: 0, _date: d }
        }

        allInvestments.forEach(inv => {
          if (inv.status !== 'active') return
          const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt || Date.now())

          const monthKey = invDate.toLocaleString('default', { month: 'short' })
          if (sData[monthKey] && invDate.getFullYear() === sData[monthKey]._date.getFullYear()) {
            sData[monthKey].units += (inv.unitsOwned || 1)
            sData[monthKey].revenue += (inv.amountInvested || 0)
          }

          const diffTime = Math.abs(now.getTime() - invDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            const dayKey = invDate.toLocaleString('default', { weekday: 'short' })
            if (aData[dayKey]) {
              aData[dayKey].investments += 1
            }
          }
        })

        setSalesData(Object.values(sData).map((d: any) => ({ month: d.month, units: d.units, revenue: d.revenue })))
        setActivityData(Object.values(aData).map((d: any) => ({ day: d.day, views: d.views, investments: d.investments })))
        setLoading(false)
      }
    )
    return () => unsub()
  }, [user])

  const totalUnits = properties.reduce((s, p) => s + (p.totalUnits || 0), 0)
  const totalUnitsSold = properties.reduce((s, p) => s + (p.unitsSold || 0), 0)
  const totalRevenue = properties.reduce((s, p) => s + ((p.unitsSold || 0) * (p.unitPrice || 0)), 0)
  const pendingPayout = totalRevenue * 0.95

  return (
    <AppLayout title="Developer Console" subtitle="Command center for your real estate portfolio" requiredRole="developer">
      <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              Dashboard Overview <Sparkles className="text-primary w-6 h-6" />
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Real-time metrics and actionable insights for your properties.</p>
          </div>
          <Button onClick={() => router.push('/developer/list')} className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 transition-all gap-2">
            <Plus size={18} strokeWidth={3} /> Launch New Asset
          </Button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-primary font-bold animate-pulse text-lg">Aggregating Global Metrics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <MetricCard label="Total Capital Raised" value={fmtC(totalRevenue)} sub="▲ +18.4% MoM" icon={BadgeIndianRupee} type="brand" />
              <MetricCard label="Units Tokenized & Sold" value={totalUnitsSold.toLocaleString('en-IN')} sub={`out of ${totalUnits.toLocaleString()} capacity`} icon={Users} type="gain" />
              <MetricCard label="Active Developments" value={String(properties.length)} sub={`${properties.filter(p => p.status === 'active').length} actively funding`} icon={Building2} type="neutral" />
              <MetricCard label="Pending Disbursements" value={fmtC(pendingPayout)} sub="Ready for withdrawal" icon={Wallet} type="brand" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-card border border-border/50 rounded-3xl p-8 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">Capital Accumulation & Sales</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">6-month trailing volume</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                    <Activity size={16} /> Live Feed
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} barSize={24} barGap={8} margin={{ left: -10, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 13, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={15} />
                      <YAxis yAxisId="left" tickFormatter={v => String(v)} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={v => `₹${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<Tip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                      <Bar yAxisId="left" dataKey="units" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Units" opacity={0.9} />
                      <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} name="Revenue" opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>


              <div className="h-fit space-y-6">
                {/* Payout Summary */}

                <div className="h-fit bg-card/60 backdrop-blur-xl border border-border rounded-[1.5rem] p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-foreground">Financial Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gross Revenue</span>
                      <span className="text-sm font-mono font-bold text-foreground">{fmtC(totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Platform Fee (7%)</span>
                      <span className="text-sm font-mono font-bold text-loss">− {fmtC(totalRevenue * 0.07)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Net Payout</span>
                      <span className="text-lg font-mono font-black text-gain">{fmtC(pendingPayout)}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-2 bg-gain hover:bg-green-600 text-white font-semibold rounded-xl">
                    Request Payout
                  </Button>
                </div>
                {/* Quick Links */}
                <div className="bg-card/60 backdrop-blur-xl border border-border rounded-[1.5rem] p-6 shadow-sm">
                  <h3 className="text-base font-bold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-2.5">
                    <button className="w-full px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border text-foreground text-sm font-semibold transition-all flex items-center justify-between group">
                      <span className="flex items-center gap-2"><Plus size={16} className="text-violet-500" /> Add New Property</span>
                      <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="w-full px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border text-foreground text-sm font-semibold transition-all flex items-center justify-between group">
                      <span className="flex items-center gap-2"><Users size={16} className="text-blue-500" /> View Investor Enquiries</span>
                      <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm flex flex-col">
                <h3 className="text-xl font-black text-foreground tracking-tight mb-1">Investor Engagement</h3>
                <p className="text-sm font-medium text-muted-foreground mb-8">Platform traffic vs investments (7d)</p>
                <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ left: -20, bottom: 0, right: 10 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<Tip />} />
                      <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#colorViews)" name="Page Views" />
                      <Line type="monotone" dataKey="investments" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--foreground))' }} activeDot={{ r: 6 }} name="Investments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div> */}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-card border border-border/50 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-6 md:p-8 border-b border-border/50 bg-muted/10">
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">Active Portfolio</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Detailed breakdown of all your listed properties</p>
                  </div>
                  <Button variant="outline" className="h-10 px-5 rounded-xl text-sm font-bold border-border/50 hover:bg-muted">
                    View Complete Roster <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                        <th className="py-4 px-8 border-b border-border/50">Asset Name</th>
                        <th className="py-4 px-6 border-b border-border/50 text-center">Subscription Fill</th>
                        <th className="py-4 px-6 border-b border-border/50 text-right">Unit Pricing</th>
                        <th className="py-4 px-6 border-b border-border/50 text-right">Capital Raised</th>
                        <th className="py-4 px-8 border-b border-border/50 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {properties.length > 0 ? properties.map(p => {
                        const unitsSold = p.unitsSold || 0
                        const fill = p.totalUnits ? Math.round((unitsSold / p.totalUnits) * 100) : 0
                        const revenue = unitsSold * (p.unitPrice || 0)

                        let statusColor = "bg-muted text-muted-foreground"
                        let statusText = p.status
                        if (p.status === 'active') { statusColor = "bg-primary/10 text-primary"; statusText = 'Funding Active' }
                        else if (p.status === 'pending') { statusColor = "bg-yellow-500/10 text-yellow-600"; statusText = 'Under Review' }
                        else if (p.status === 'completed') { statusColor = "bg-green-500/10 text-green-600"; statusText = 'Fully Funded' }

                        return (
                          <tr key={p.id} onClick={() => router.push(`/investor/buy/${p.tickerSymbol}`)} className="hover:bg-muted/20 transition-colors cursor-pointer group">
                            <td className="py-5 px-8">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50 group-hover:border-primary/50 transition-colors">
                                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 m-3 text-muted-foreground" />}
                                </div>
                                <div>
                                  <div className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{p.basicDetails?.propertyName || p.name || 'Unnamed Asset'}</div>
                                  <div className="text-xs font-semibold text-muted-foreground font-mono mt-0.5">{p.tickerSymbol || p.id.slice(0, 6)} • {p.basicDetails?.city || 'Location'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="w-full max-w-[120px] mx-auto">
                                <div className="flex justify-between text-xs mb-1.5 font-bold">
                                  <span className="text-foreground">{fill}%</span>
                                  <span className="text-muted-foreground">{unitsSold}/{p.totalUnits}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${fill}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-right font-mono font-bold text-sm text-foreground">
                              {fmt(p.unitPrice || 0)}
                            </td>
                            <td className="py-5 px-6 text-right font-mono font-black text-sm text-gain">
                              {fmt(revenue)}
                            </td>
                            <td className="py-5 px-8 text-right">
                              <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-current/10", statusColor)}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        )
                      }) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm font-medium">
                            No properties listed yet. <br />
                            <Button onClick={() => router.push('/developer/list')} variant="link" className="text-violet-500 mt-2">Create your first listing</Button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

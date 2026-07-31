'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Building2, TrendingUp, Users, Wallet, Plus, ArrowRight,
  ChevronUp, ChevronDown, Eye, Pencil, BarChart3, Percent, Crown, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const fmtC = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return fmt(n)
}

const SALES_DATA = [
  { month: 'Jul', units: 48, revenue: 5760000 },
  { month: 'Aug', units: 62, revenue: 7440000 },
  { month: 'Sep', units: 55, revenue: 6600000 },
  { month: 'Oct', units: 79, revenue: 9480000 },
  { month: 'Nov', units: 91, revenue: 10920000 },
  { month: 'Dec', units: 104, revenue: 12480000 },
]

const ENQUIRIES_DATA = [
  { day: 'Mon', views: 234, enquiries: 18 },
  { day: 'Tue', views: 312, enquiries: 24 },
  { day: 'Wed', views: 198, enquiries: 14 },
  { day: 'Thu', views: 402, enquiries: 31 },
  { day: 'Fri', views: 376, enquiries: 28 },
  { day: 'Sat', views: 512, enquiries: 42 },
  { day: 'Sun', views: 289, enquiries: 21 },
]

const PROPERTIES: any[] = []

function MetricCard({ label, value, sub, icon: Icon, type, className }: {
  label: string, value: string, sub?: string, icon: React.ElementType, type: 'neutral' | 'gain' | 'loss' | 'brand', className?: string
}) {
  const iconColors = {
    neutral: 'text-muted-foreground',
    gain: 'text-green-600',
    loss: 'text-red-600',
    brand: 'text-primary'
  }

  return (
    <div className={cn("bg-card border rounded-xl p-5 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon size={16} className={iconColors[type]} />
      </div>
      <div className="text-2xl lg:text-3xl font-extrabold tracking-tight font-mono">{value}</div>
      {sub && <div className={cn("text-xs font-medium mt-2 flex items-center gap-1", type === 'gain' ? 'text-green-600' : type === 'loss' ? 'text-red-600' : 'text-muted-foreground')}>
        {sub.includes('▲') ? <ChevronUp size={14} className="stroke-[3]" /> : sub.includes('▼') ? <ChevronDown size={14} className="stroke-[3]" /> : null}
        {sub.replace('▲', '').replace('▼', '')}
      </div>}
    </div>
  )
}

const Tip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-card border border-border rounded-lg px-4 py-3 text-xs shadow-lg">
      <p className="text-muted-foreground mb-2 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-medium text-foreground">{p.name}:</span>
          <span className="font-mono text-foreground font-bold">
            {typeof p.value === 'number' && p.value > 999 && p.name !== 'Units' && p.name !== 'Views' && p.name !== 'Enquiries' ? fmtC(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  ) : null

export default function DeveloperDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState(PROPERTIES)

  const totalRevenue = properties.reduce((s, p) => s + p.revenue, 0)
  const totalUnitsSold = properties.reduce((s, p) => s + p.unitsSold, 0)
  const totalUnits = properties.reduce((s, p) => s + p.totalUnits, 0)
  const avgYield = properties.length ? properties.reduce((s, p) => s + p.yield, 0) / properties.length : 0
  const pendingPayout = totalRevenue * 0.93 // after 7% platform fee

  return (
    <AppLayout title="Developer Console" subtitle="Property Management & Analytics">
      <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Dashboard
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Manage listings, monitor sales, and process payouts</p>
          </div>
          <Button onClick={() => router.push('/developer/list')} className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all gap-2">
            <Plus size={16} /> List New Property
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Active Properties" value={String(properties.length)} sub={`${properties.filter(p => p.status === 'active').length} active listings`} icon={Building2} type="brand" />
          <MetricCard label="Total Units Sold" value={totalUnitsSold.toLocaleString('en-IN')} sub={`of ${totalUnits.toLocaleString()} total capacity`} icon={Users} type="gain" />
          <MetricCard label="Gross Revenue" value={fmtC(totalRevenue)} sub="Total lifetime value" icon={TrendingUp} type="neutral" />
          <MetricCard label="Pending Payout" value={fmtC(pendingPayout)} sub="Available for withdrawal" icon={Wallet} type="neutral" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales */}
          <div className="lg:col-span-2 bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Revenue & Sales Volume</h3>
                <p className="text-xs text-muted-foreground mt-1">Monthly performance breakdown</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
                <Activity size={14} /> High Activity
              </div>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SALES_DATA} barSize={20} barGap={6} margin={{ left: -20, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis yAxisId="left" tickFormatter={v => String(v)} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={v => `₹${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<Tip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
                  <Bar yAxisId="left" dataKey="units" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Units" />
                  <Bar yAxisId="right" dataKey="revenue" fill="var(--foreground)" radius={[4, 4, 0, 0]} name="Revenue" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Enquiries */}
          <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-foreground mb-1">Traffic & Enquiries</h3>
            <p className="text-xs text-muted-foreground mb-6">Last 7 days engagement</p>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ENQUIRIES_DATA} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} name="Views" />
                  <Line type="monotone" dataKey="enquiries" stroke="var(--muted-foreground)" strokeWidth={2} dot={{ r: 3, fill: 'var(--muted-foreground)', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} name="Enquiries" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Properties Table */}
          <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-base font-bold text-foreground">Your Listings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Manage and track your active properties</p>
              </div>
              <Button variant="ghost" className="text-xs font-semibold hover:bg-muted text-primary h-8 px-3">
                View All <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-5 text-left font-semibold">Property</th>
                    <th className="py-3 px-4 text-center font-semibold">Fill Rate</th>
                    <th className="py-3 px-4 text-right font-semibold">Unit Price</th>
                    <th className="py-3 px-4 text-right font-semibold">Revenue</th>
                    <th className="py-3 px-5 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {properties.length > 0 ? properties.map(p => {
                    const fill = Math.round((p.unitsSold / p.totalUnits) * 100)
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary/40 transition-colors">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="text-foreground font-medium group-hover:text-primary transition-colors">{p.symbol}</div>
                              <div className="text-muted-foreground text-[11px]">{p.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-center">
                            <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{fill}% Filled</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground text-xs">{fmt(p.unitPrice)}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-foreground">{fmtC(p.revenue)}</td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border',
                              p.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                p.status === 'draft' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                  'bg-secondary text-muted-foreground border-border'
                            )}>
                              {p.status}
                            </span>
                            <button className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all">
                              <Eye size={14} />
                            </button>
                          </div>
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

          {/* Quick Actions & Summary */}
          <div className="space-y-6">
            {/* Payout Summary */}
            <div className="bg-card/60 backdrop-blur-xl border border-border rounded-[1.5rem] p-6 shadow-sm space-y-4">
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
        </div>

      </div>
    </AppLayout>
  )
}

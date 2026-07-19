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
  ChevronUp, ChevronDown, Eye, Pencil, BarChart3, Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const PROPERTIES: {
  id: string; symbol: string; name: string; city: string; type: string;
  totalUnits: number; unitsSold: number; unitPrice: number; yield: number;
  occupancy: number; status: 'active' | 'draft' | 'paused'; revenue: number;
}[] = []

function MetricCard({ label, value, sub, icon: Icon, colorClass, bgClass }: {
  label: string; value: string; sub?: string; icon: React.ElementType; colorClass: string; bgClass: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${bgClass}`}>
          <Icon size={14} className={colorClass} />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground num font-mono">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}

const Tip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-muted border border-border rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? fmtC(p.value) : p.value}
        </p>
      ))}
    </div>
  ) : null

export default function DeveloperDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState(PROPERTIES)

  const totalRevenue = properties.reduce((s, p) => s + p.revenue, 0)
  const totalUnitsSold = properties.reduce((s, p) => s + p.unitsSold, 0)
  const totalUnits = properties.reduce((s, p) => s + p.totalUnits, 0)
  const avgYield = properties.reduce((s, p) => s + p.yield, 0) / properties.length
  const pendingPayout = totalRevenue * 0.93 // after 7% platform fee

  return (
    <AppLayout title="Developer Console" subtitle="Property Management & Analytics">
      <div className="p-6 space-y-6">

        {/* Header action */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-semibold text-base">Developer Overview</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Manage properties and track investor activity</p>
          </div>
          <Button
            onClick={() => router.push('/developer/list')}
            size="sm"
            className="h-8 text-xs bg-primary hover:bg-blue-600 text-white"
          >
            <Plus size={13} className="mr-1.5" />
            List Property
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Properties" value={String(properties.length)} sub={`${properties.filter(p => p.status === 'active').length} active`} icon={Building2} colorClass="text-primary" bgClass="bg-primary/20" />
          <MetricCard label="Units Sold" value={totalUnitsSold.toLocaleString('en-IN')} sub={`of ${totalUnits.toLocaleString()} total`} icon={Users} colorClass="text-gain" bgClass="bg-gain/10" />
          <MetricCard label="Total Revenue" value={fmtC(totalRevenue)} sub="Gross from sales" icon={TrendingUp} colorClass="text-yellow-500" bgClass="bg-yellow-900/40" />
          <MetricCard label="Pending Payout" value={fmtC(pendingPayout)} sub="After 7% platform fee" icon={Wallet} colorClass="text-purple-500" bgClass="bg-purple-900/40" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Monthly Sales</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Units sold & revenue trend</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SALES_DATA} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={v => String(v)} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={v => `₹${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<Tip />} />
                <Bar yAxisId="left" dataKey="units" fill="var(--primary)" radius={[3, 3, 0, 0]} name="Units" />
                <Bar yAxisId="right" dataKey="revenue" fill="var(--gain)" radius={[3, 3, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Enquiries */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Weekly Enquiries</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Views vs enquiries</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ENQUIRIES_DATA}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={2} dot={false} name="Views" />
                <Line type="monotone" dataKey="enquiries" stroke="#f59e0b" strokeWidth={2} dot={false} name="Enquiries" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Your Listings</h3>
            <button className="text-[11px] text-primary hover:text-blue-500 flex items-center gap-1">
              View All <ArrowRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Property', 'Type', 'Units Sold', 'Fill %', 'Unit Price', 'Yield', 'Occupancy', 'Revenue', 'Status', ''].map(h => (
                    <th key={h} className={cn(
                      'py-2.5 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider',
                      h === 'Property' ? 'text-left' : 'text-right',
                      h === '' ? 'text-right' : ''
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.map(p => {
                  const fill = Math.round((p.unitsSold / p.totalUnits) * 100)
                  return (
                    <tr key={p.id} className="border-b border-border/40 hover:bg-primary/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-blue-500 text-[9px] font-bold">{p.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="text-foreground text-xs font-semibold">{p.symbol}</div>
                            <div className="text-muted-foreground text-[10px]">{p.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded',
                          p.type === 'commercial' ? 'bg-primary/20 text-blue-500' :
                          p.type === 'residential' ? 'bg-green-500/10 text-green-500' :
                          'bg-purple-500/10 text-purple-500'
                        )}>
                          {p.type.slice(0, 3)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs num text-foreground">{p.unitsSold.toLocaleString()} / {p.totalUnits.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${fill}%` }} />
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground w-8 text-right">{fill}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs num text-foreground">{fmt(p.unitPrice)}</td>
                      <td className="py-3.5 px-4 text-right text-xs text-gain font-semibold">{p.yield}%</td>
                      <td className="py-3.5 px-4 text-right text-xs num text-foreground">{p.occupancy}%</td>
                      <td className="py-3.5 px-4 text-right text-xs num text-foreground font-semibold">{fmtC(p.revenue)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded',
                          p.status === 'active' ? 'bg-green-500/10 text-green-500' :
                          p.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-secondary text-muted-foreground'
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => router.push(`/investor/properties/${p.id}`)}
                            className="p-1.5 rounded bg-muted hover:bg-secondary text-muted-foreground hover:text-muted-foreground transition-colors"
                          >
                            <Eye size={12} />
                          </button>
                          <button className="p-1.5 rounded bg-muted hover:bg-secondary text-muted-foreground hover:text-muted-foreground transition-colors">
                            <Pencil size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Gross Revenue', value: fmtC(totalRevenue), color: 'var(--foreground)' },
            { label: 'Platform Fee (7%)', value: `− ${fmtC(totalRevenue * 0.07)}`, color: 'var(--loss)' },
            { label: 'Net Payout', value: fmtC(pendingPayout), color: 'var(--gain)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
              <span className="text-sm font-bold font-mono num" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Performance Summary</h3>
            {[
              { label: 'Avg. Units per Property', value: Math.round(totalUnitsSold / properties.length) },
              { label: 'Avg. Yield', value: `${avgYield.toFixed(1)}%` },
              { label: 'Occupancy Rate', value: `${(properties.reduce((s, p) => s + p.occupancy, 0) / properties.length).toFixed(0)}%` },
              { label: 'Properties Listed', value: properties.length },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <span className="text-sm font-mono font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 rounded bg-primary hover:bg-blue-600 text-white text-xs font-semibold transition-colors">
                + Add New Property
              </button>
              <button className="w-full px-4 py-2 rounded border border-border hover:border-primary/40 text-muted-foreground hover:text-muted-foreground text-xs font-semibold transition-colors">
                View Investor Enquiries
              </button>
              <button className="w-full px-4 py-2 rounded border border-border hover:border-primary/40 text-muted-foreground hover:text-muted-foreground text-xs font-semibold transition-colors">
                Request Payout
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

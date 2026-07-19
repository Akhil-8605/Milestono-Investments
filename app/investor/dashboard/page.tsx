'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { AlertsPanel } from '@/components/alerts/alerts-panel'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Briefcase, ArrowRight, Building2,
  Wallet, Percent, BarChart3, RefreshCcw, ChevronUp, ChevronDown, Bell,
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

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

interface Holding {
  id: string
  propertyId: string
  propertyName: string
  symbol: string
  city: string
  type: string
  unitsOwned: number
  buyPrice: number
  currentPrice: number
  invested: number
  currentValue: number
  pl: number
  plPct: number
  yield: number
}

interface Portfolio {
  totalInvested: number
  currentValue: number
  totalPL: number
  plPct: number
  dayPL: number
  dayPLPct: number
  holdings: Holding[]
}

const PORTFOLIO_HISTORY = [
  { month: 'Jan', value: 1200000 },
  { month: 'Feb', value: 1340000 },
  { month: 'Mar', value: 1280000 },
  { month: 'Apr', value: 1510000 },
  { month: 'May', value: 1620000 },
  { month: 'Jun', value: 1740000 },
  { month: 'Jul', value: 1690000 },
  { month: 'Aug', value: 1820000 },
  { month: 'Sep', value: 1950000 },
  { month: 'Oct', value: 1880000 },
  { month: 'Nov', value: 2100000 },
  { month: 'Dec', value: 2250000 },
]

const PROPERTIES: any[] = []

const SECTOR_DATA = [
  { name: 'Commercial', value: 45 },
  { name: 'Residential', value: 32 },
  { name: 'Industrial', value: 23 },
]

const MONTHLY_INCOME = [
  { month: 'Jul', income: 14200 },
  { month: 'Aug', income: 15800 },
  { month: 'Sep', income: 15200 },
  { month: 'Oct', income: 17400 },
  { month: 'Nov', income: 16900 },
  { month: 'Dec', income: 18600 },
]

function StatCard({
  label, value, sub, icon: Icon, positive, neutral,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  positive?: boolean
  neutral?: boolean
}) {
  const textColorClass = neutral ? 'text-muted-foreground' : positive ? 'text-gain' : 'text-loss'
  const bgClass = neutral ? 'bg-muted' : positive ? 'bg-gain/10' : 'bg-loss/10'

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${bgClass}`}>
          <Icon size={14} className={textColorClass} />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground font-mono num">{value}</div>
      {sub && <div className={`text-[11px] mt-1 ${textColorClass}`}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted border border-border rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name}: {fmtC(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function InvestorDashboard() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])

  const fetchPortfolio = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio')
      const json = await res.json()
      if (json.success) {
        setPortfolio(json.data)
        setLastUpdated(new Date())
      }
    } catch {
      // use demo data on failure
      setPortfolio({
        totalInvested: 1850000,
        currentValue: 2250000,
        totalPL: 400000,
        plPct: 21.62,
        dayPL: 12400,
        dayPLPct: 0.56,
        holdings: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch alerts
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
    fetchPortfolio()
    fetchAlerts()
  }, [fetchPortfolio, fetchAlerts])

  const isPositive = (portfolio?.totalPL ?? 0) >= 0
  const isDayPositive = (portfolio?.dayPL ?? 0) >= 0

  // Prepare allocation pie data from holdings
  const allocationData = portfolio?.holdings?.length
    ? portfolio.holdings.slice(0, 6).map((h, i) => ({
        name: h.symbol,
        value: h.currentValue,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
    : SECTOR_DATA.map((s, i) => ({ ...s, color: PIE_COLORS[i] }))

  return (
    <AppLayout title="Dashboard" subtitle="Portfolio Overview">
      <div className="p-6 space-y-6">

        {/* Top bar: summary + refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-semibold text-base">Portfolio Summary</h2>
            {lastUpdated && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPortfolio}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted-foreground px-3 py-1.5 rounded bg-muted border border-border hover:border-primary/40 transition-all"
            >
              <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Button
              onClick={() => router.push('/investor/market')}
              size="sm"
              className="h-8 text-xs bg-primary hover:bg-blue-600 text-white"
            >
              Invest More
              <ArrowRight size={12} className="ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Invested"
              value={fmtC(portfolio?.totalInvested ?? 0)}
              sub={`${portfolio?.holdings?.length ?? 0} properties`}
              icon={Wallet}
              neutral
            />
            <StatCard
              label="Current Value"
              value={fmtC(portfolio?.currentValue ?? 0)}
              sub="Market price today"
              icon={Briefcase}
              neutral
            />
            <StatCard
              label="Total P&L"
              value={fmtC(portfolio?.totalPL ?? 0)}
              sub={`${isPositive ? '▲' : '▼'} ${Math.abs(portfolio?.plPct ?? 0).toFixed(2)}% overall`}
              icon={isPositive ? TrendingUp : TrendingDown}
              positive={isPositive}
            />
            <StatCard
              label="Day P&L"
              value={fmtC(portfolio?.dayPL ?? 0)}
              sub={`${isDayPositive ? '▲' : '▼'} ${Math.abs(portfolio?.dayPLPct ?? 0).toFixed(2)}% today`}
              icon={BarChart3}
              positive={isDayPositive}
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Performance */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Portfolio Performance</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">12-month value trend</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gain bg-gain/10 px-2.5 py-1 rounded">
                <TrendingUp size={11} />
                +28.4% YTD
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={PORTFOLIO_HISTORY}>
                <defs>
                  <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1e5).toFixed(0)}L`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v: any) => [fmtC(v), 'Portfolio Value']} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 11 }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#portGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: '#0d0f14', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Pie */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Allocation</h3>
            <p className="text-[11px] text-muted-foreground mb-3">By property / sector</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={40} outerRadius={64} dataKey="value" strokeWidth={0}>
                  {allocationData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [typeof v === 'number' && v > 100 ? fmtC(v) : `${v}%`, '']} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {allocationData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-foreground font-mono">{typeof d.value === 'number' && d.value > 100 ? fmtC(d.value) : `${d.value}%`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Income + Holdings Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Rental Income */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Rental Income</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Monthly receivables</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={MONTHLY_INCOME} barSize={18}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: any) => [fmt(v), 'Income']} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 11 }} />
                <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">Last month</span>
              <span className="text-gain font-mono font-semibold">{fmt(18600)}</span>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Holdings</h3>
              <button
                onClick={() => router.push('/investor/portfolio')}
                className="text-[11px] text-primary hover:text-blue-500 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight size={11} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Symbol', 'Units', 'Avg Cost', 'LTP', 'Current Value', 'P&L', 'P&L %'].map(h => (
                      <th key={h} className={cn(
                        'py-2.5 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider',
                        h === 'Symbol' ? 'text-left' : 'text-right'
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(portfolio?.holdings?.length ? portfolio.holdings : DEMO_HOLDINGS).slice(0, 6).map((h: Holding, i) => {
                    const up = (h.pl ?? h.plPct) >= 0
                    return (
                      <tr
                        key={h.id ?? i}
                        className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/investor/properties/${h.propertyId}`)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-blue-500 text-[8px] font-bold">{h.symbol?.slice(0, 2)}</span>
                            </div>
                            <div>
                              <div className="text-foreground text-xs font-semibold">{h.symbol}</div>
                              <div className="text-muted-foreground text-[10px]">{h.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-sm num text-foreground">{h.unitsOwned}</td>
                        <td className="py-3 px-3 text-right text-xs num text-muted-foreground">{fmt(h.buyPrice ?? h.invested / h.unitsOwned)}</td>
                        <td className="py-3 px-3 text-right text-xs num text-foreground">{fmt(h.currentPrice)}</td>
                        <td className="py-3 px-3 text-right text-xs num text-foreground font-semibold">{fmtC(h.currentValue)}</td>
                        <td className={cn('py-3 px-3 text-right text-xs num font-semibold', up ? 'text-gain' : 'text-loss')}>
                          {up ? '+' : ''}{fmtC(h.pl)}
                        </td>
                        <td className={cn('py-3 px-3 text-right text-xs font-bold', up ? 'text-gain' : 'text-loss')}>
                          <span className="flex items-center justify-end gap-0.5">
                            {up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {Math.abs(h.plPct).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!portfolio?.holdings?.length && !DEMO_HOLDINGS.length && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                        No holdings yet.{' '}
                        <button onClick={() => router.push('/investor/market')} className="text-primary hover:underline">
                          Browse market
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Market', href: '/investor/market', icon: TrendingUp, color: 'var(--primary)', bg: '#1d3a6b' },
            { label: 'Portfolio', href: '/investor/portfolio', icon: Briefcase, color: 'var(--gain)', bg: '#14281a' },
            { label: 'Watchlist', href: '/investor/watchlist', icon: BarChart3, color: '#f59e0b', bg: '#2d1e0a' },
            { label: 'Alerts', href: '/investor/watchlist', icon: Bell, color: '#8b5cf6', bg: '#2d1b5a' },
          ].map(({ label, href, icon: Icon, color, bg }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
              <ArrowRight size={13} className="ml-auto text-muted-foreground group-hover:text-muted-foreground transition-colors" />
            </button>
          ))}
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Price Alerts</h3>
              <button
                onClick={() => router.push('/investor/watchlist')}
                className="text-xs text-primary hover:text-blue-500 flex items-center gap-1 transition-colors"
              >
                Manage <ArrowRight size={11} />
              </button>
            </div>
            <AlertsPanel alerts={alerts} onRemove={async (alertId) => {
              setAlerts(prev => prev.filter(a => a.id !== alertId))
              await fetch(`/api/alerts?alertId=${alertId}`, { method: 'DELETE' })
            }} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}

// Demo holdings shown when no real data yet
const DEMO_HOLDINGS: Holding[] = [
  { id: 'd1', propertyId: 'prop-1', propertyName: 'Prestige Sunrise Park', symbol: 'PRSN', city: 'Bangalore', type: 'residential', unitsOwned: 12, buyPrice: 118000, currentPrice: 125000, invested: 1416000, currentValue: 1500000, pl: 84000, plPct: 5.93, yield: 9.2 },
  { id: 'd2', propertyId: 'prop-2', propertyName: 'Godrej BKC Heights', symbol: 'GDBK', city: 'Mumbai', type: 'commercial', unitsOwned: 5, buyPrice: 272000, currentPrice: 285000, invested: 1360000, currentValue: 1425000, pl: 65000, plPct: 4.78, yield: 7.8 },
  { id: 'd3', propertyId: 'prop-4', propertyName: 'Embassy Tech Village', symbol: 'EMTV', city: 'Bangalore', type: 'commercial', unitsOwned: 20, buyPrice: 95200, currentPrice: 98000, invested: 1904000, currentValue: 1960000, pl: 56000, plPct: 2.94, yield: 11.2 },
  { id: 'd4', propertyId: 'prop-11', propertyName: 'Mahindra World City', symbol: 'MHWC', city: 'Chennai', type: 'industrial', unitsOwned: 30, buyPrice: 36500, currentPrice: 35000, invested: 1095000, currentValue: 1050000, pl: -45000, plPct: -4.11, yield: 12.4 },
]

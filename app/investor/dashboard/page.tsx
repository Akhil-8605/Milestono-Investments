'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { AlertsPanel } from '@/components/alerts/alerts-panel'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, Briefcase, ArrowRight, Building2,
  Wallet, BarChart3, RefreshCcw, ChevronUp, ChevronDown, Bell, Zap, PlayCircle
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

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899']

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

function StatCard({ label, value, sub, icon: Icon, type, className }: {
  label: string, value: string, sub?: string, icon: React.ElementType, type: 'neutral' | 'gain' | 'loss' | 'brand', className?: string
}) {
  const colors = {
    neutral: 'bg-card text-foreground border-border shadow-md',
    gain: 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 text-green-500 shadow-green-500/5',
    loss: 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 text-red-500 shadow-red-500/5',
    brand: 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 text-white shadow-blue-500/20'
  }

  const iconColors = {
    neutral: 'text-muted-foreground bg-muted',
    gain: 'text-green-500 bg-green-500/10',
    loss: 'text-red-500 bg-red-500/10',
    brand: 'text-white bg-white/20'
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[1.5rem] border p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", colors[type], className)}>
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[40px] rounded-full pointer-events-none" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className={cn("text-xs font-semibold uppercase tracking-wider", type === 'brand' ? 'text-blue-200' : 'text-muted-foreground')}>{label}</span>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shadow-inner", iconColors[type])}>
          <Icon size={16} />
        </div>
      </div>
      <div className={cn("text-2xl lg:text-3xl font-extrabold tracking-tight font-mono num relative z-10")}>{value}</div>
      {sub && <div className={cn("text-xs font-medium mt-2 flex items-center gap-1 relative z-10", type === 'brand' ? 'text-blue-100' : type === 'gain' ? 'text-green-600' : type === 'loss' ? 'text-red-600' : 'text-muted-foreground')}>
        {sub.includes('▲') ? <ChevronUp size={14} className="stroke-[3]" /> : sub.includes('▼') ? <ChevronDown size={14} className="stroke-[3]" /> : null}
        {sub.replace('▲', '').replace('▼', '')}
      </div>}
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
      setPortfolio({
        totalInvested: 1850000, currentValue: 2250000, totalPL: 400000, plPct: 21.62,
        dayPL: 12400, dayPLPct: 0.56, holdings: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts')
      const json = await res.json()
      if (json.success) setAlerts(json.data)
    } catch { setAlerts([]) }
  }, [])

  useEffect(() => { fetchPortfolio(); fetchAlerts(); }, [fetchPortfolio, fetchAlerts])

  const isPositive = (portfolio?.totalPL ?? 0) >= 0
  const isDayPositive = (portfolio?.dayPL ?? 0) >= 0
  const allocationData = portfolio?.holdings?.length
    ? portfolio.holdings.slice(0, 6).map((h, i) => ({ name: h.symbol, value: h.currentValue, color: PIE_COLORS[i % PIE_COLORS.length] }))
    : SECTOR_DATA.map((s, i) => ({ ...s, color: PIE_COLORS[i] }))

  return (
    <AppLayout title="Dashboard" subtitle="Welcome back, Investor.">
      <div className="p-6 md:p-8 space-y-8 bg-background min-h-screen relative overflow-hidden">
        
        {/* Dynamic Background */}
        <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Portfolio Overview <Zap className="text-yellow-500 w-5 h-5 fill-yellow-500/20" />
            </h2>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last synced: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchPortfolio} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted transition-all shadow-sm">
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Button onClick={() => router.push('/investor/market')} className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 transition-all gap-2">
              Invest Now <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-[1.5rem] p-6 h-36 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            <StatCard label="Current Value" value={fmtC(portfolio?.currentValue ?? 0)} sub="Total market value" icon={Briefcase} type="brand" />
            <StatCard label="Invested Amount" value={fmtC(portfolio?.totalInvested ?? 0)} sub={`${portfolio?.holdings?.length ?? 0} active properties`} icon={Wallet} type="neutral" />
            <StatCard label="Total Return" value={fmtC(portfolio?.totalPL ?? 0)} sub={`${isPositive ? '▲' : '▼'} ${Math.abs(portfolio?.plPct ?? 0).toFixed(2)}% overall`} icon={isPositive ? TrendingUp : TrendingDown} type={isPositive ? 'gain' : 'loss'} />
            <StatCard label="Today's Return" value={fmtC(portfolio?.dayPL ?? 0)} sub={`${isDayPositive ? '▲' : '▼'} ${Math.abs(portfolio?.dayPLPct ?? 0).toFixed(2)}% today`} icon={BarChart3} type={isDayPositive ? 'gain' : 'loss'} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Performance Chart */}
          <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-border rounded-[1.5rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Value Trajectory</h3>
                <p className="text-xs text-muted-foreground mt-1">12-month historical performance</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                <TrendingUp size={14} /> +28.4% YTD
              </div>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PORTFOLIO_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tickFormatter={v => `₹${(v / 1e5).toFixed(0)}L`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(v: any) => [fmtC(v), 'Value']} 
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#portGrad)" dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: 'var(--background)', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation */}
          <div className="bg-card/60 backdrop-blur-xl border border-border rounded-[1.5rem] p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-foreground mb-1">Asset Allocation</h3>
            <p className="text-xs text-muted-foreground mb-6">Distribution by property</p>
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={0}>
                      {allocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(v: any) => [typeof v === 'number' && v > 100 ? fmtC(v) : `${v}%`, '']} 
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-foreground">{allocationData.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Assets</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {allocationData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase truncate w-[80px]">{d.name}</span>
                      <span className="text-xs font-bold text-foreground">{typeof d.value === 'number' && d.value > 100 ? fmtC(d.value) : `${d.value}%`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* Income Chart */}
          <div className="bg-card/60 backdrop-blur-xl border border-border rounded-[1.5rem] p-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-1">Passive Income</h3>
            <p className="text-xs text-muted-foreground mb-6">Monthly rental payouts</p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_INCOME} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(v: any) => [fmt(v), 'Rental Income']} 
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />
                  <Bar dataKey="income" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Holdings */}
          <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-border rounded-[1.5rem] shadow-sm flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-foreground">Active Holdings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Your current property investments</p>
              </div>
              <Button onClick={() => router.push('/investor/portfolio')} variant="ghost" className="text-xs font-semibold hover:bg-muted text-primary">
                View Details <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-[10px] uppercase tracking-widest font-semibold bg-muted/20">
                    <th className="py-4 px-6 text-left">Asset</th>
                    <th className="py-4 px-4 text-right">Units</th>
                    <th className="py-4 px-4 text-right">Avg Price</th>
                    <th className="py-4 px-4 text-right">Value</th>
                    <th className="py-4 px-6 text-right">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {(portfolio?.holdings?.length ? portfolio.holdings : DEMO_HOLDINGS).slice(0, 4).map((h: Holding, i) => {
                    const up = (h.pl ?? h.plPct) >= 0
                    return (
                      <tr key={h.id ?? i} onClick={() => router.push(`/properties/${h.propertyId}`)} className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary/40 transition-colors">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-foreground font-semibold group-hover:text-primary transition-colors">{h.symbol}</div>
                              <div className="text-muted-foreground text-xs">{h.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-foreground font-medium">{h.unitsOwned}</td>
                        <td className="py-4 px-4 text-right font-mono text-muted-foreground text-xs">{fmt(h.buyPrice ?? h.invested / h.unitsOwned)}</td>
                        <td className="py-4 px-4 text-right font-mono font-semibold text-foreground">{fmtC(h.currentValue)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className={cn("inline-flex items-center gap-1 font-mono font-bold px-2 py-1 rounded-md text-xs", up ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10')}>
                            {up ? <ChevronUp size={12} className="stroke-[3]" /> : <ChevronDown size={12} className="stroke-[3]" />}
                            {Math.abs(h.plPct).toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

const DEMO_HOLDINGS: Holding[] = [
  { id: 'd1', propertyId: 'prop-1', propertyName: 'Prestige Sunrise Park', symbol: 'PRSN', city: 'Bangalore', type: 'residential', unitsOwned: 12, buyPrice: 118000, currentPrice: 125000, invested: 1416000, currentValue: 1500000, pl: 84000, plPct: 5.93, yield: 9.2 },
  { id: 'd2', propertyId: 'prop-2', propertyName: 'Godrej BKC Heights', symbol: 'GDBK', city: 'Mumbai', type: 'commercial', unitsOwned: 5, buyPrice: 272000, currentPrice: 285000, invested: 1360000, currentValue: 1425000, pl: 65000, plPct: 4.78, yield: 7.8 },
  { id: 'd3', propertyId: 'prop-4', propertyName: 'Embassy Tech Village', symbol: 'EMTV', city: 'Bangalore', type: 'commercial', unitsOwned: 20, buyPrice: 95200, currentPrice: 98000, invested: 1904000, currentValue: 1960000, pl: 56000, plPct: 2.94, yield: 11.2 },
  { id: 'd4', propertyId: 'prop-11', propertyName: 'Mahindra World City', symbol: 'MHWC', city: 'Chennai', type: 'industrial', unitsOwned: 30, buyPrice: 36500, currentPrice: 35000, invested: 1095000, currentValue: 1050000, pl: -45000, plPct: -4.11, yield: 12.4 },
]

'use client'

import { AppLayout } from '@/components/shell/app-layout'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, Building2, Target, Calendar, Filter } from 'lucide-react'

const REVENUE_DATA = [
  { month: 'Jan', revenue: 245000, occupancy: 85 },
  { month: 'Feb', revenue: 312000, occupancy: 87 },
  { month: 'Mar', revenue: 289000, occupancy: 86 },
  { month: 'Apr', revenue: 401000, occupancy: 89 },
  { month: 'May', revenue: 378000, occupancy: 91 },
  { month: 'Jun', revenue: 425000, occupancy: 92 },
]

const PROPERTY_PERFORMANCE = [
  { name: 'Prestige Heights', revenue: 1250000, roi: 18.5 },
  { name: 'Golden Gate Plaza', revenue: 980000, roi: 16.2 },
  { name: 'Tech Park', revenue: 750000, roi: 14.8 },
  { name: 'Skyline Towers', revenue: 920000, roi: 19.2 },
]

const INVESTOR_DIST = [
  { name: 'Retail (< ₹5L)', value: 45 },
  { name: 'Mid (₹5L - ₹25L)', value: 35 },
  { name: 'HNI (> ₹25L)', value: 20 },
]

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const stats = {
    totalRevenue: 2045000,
    avgROI: 17.2,
    activeInvestors: 1243,
    avgOccupancy: 89,
    revenueGrowth: 12.5,
    occupancyGrowth: 5.2,
  }

  return (
    <AppLayout title="Analytics" subtitle="Revenue and performance insights" requiredRole="developer">
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`, change: `+${stats.revenueGrowth}%`, up: true, icon: DollarSign, color: 'var(--gain)' },
            { label: 'Avg ROI', value: `${stats.avgROI}%`, change: '+2.1%', up: true, icon: TrendingUp, color: 'var(--primary)' },
            { label: 'Active Investors', value: stats.activeInvestors, change: '+89', up: true, icon: Users, color: '#f59e0b' },
            { label: 'Avg Occupancy', value: `${stats.avgOccupancy}%`, change: `+${stats.occupancyGrowth}%`, up: true, icon: Building2, color: '#8b5cf6' },
          ].map(({ label, value, change, up, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-xl font-bold text-foreground">{value}</div>
                <div className={`text-xs font-semibold flex items-center gap-1 ${up ? 'text-green-500' : 'text-red-500'}`}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Occupancy Trend */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar size={14} />
              Revenue & Occupancy Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6 }} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="occupancy" stroke="#22c55e" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Property Performance */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target size={14} />
              Property Performance (Revenue vs ROI)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={PROPERTY_PERFORMANCE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#6b7280" width={120} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6 }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={14} />
              Monthly Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6 }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Investor Distribution */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={14} />
              Investor Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={INVESTOR_DIST} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {INVESTOR_DIST.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 size={14} />
              Property-wise Breakdown
            </h3>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Filter size={12} />
              Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Property</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Revenue</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">ROI</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Investors</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {PROPERTY_PERFORMANCE.map((prop, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{prop.name}</td>
                    <td className="px-4 py-3 text-right text-green-500 font-semibold">₹{(prop.revenue / 100000).toFixed(1)}L</td>
                    <td className="px-4 py-3 text-right text-blue-500 font-semibold">{prop.roi}%</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{Math.floor(Math.random() * 150) + 100}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-500 font-semibold">{Math.floor(Math.random() * 20) + 80}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

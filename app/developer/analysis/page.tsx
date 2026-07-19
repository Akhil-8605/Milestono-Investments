'use client'

import { AppLayout } from '@/components/shell/app-layout'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, Users, Wallet, Calendar } from 'lucide-react'

const revenueData = [
  { month: 'Jan', revenue: 2400000, expenses: 240000 },
  { month: 'Feb', revenue: 2100000, expenses: 221000 },
  { month: 'Mar', revenue: 2800000, expenses: 229000 },
  { month: 'Apr', revenue: 3908000, expenses: 200000 },
  { month: 'May', revenue: 4800000, expenses: 221000 },
  { month: 'Jun', revenue: 3800000, expenses: 250000 },
]

const investorData = [
  { name: 'Residential', value: 45 },
  { name: 'Commercial', value: 35 },
  { name: 'Industrial', value: 20 },
]

const colors = ['#3b82f6', '#22c55e', '#f59e0b']

export default function DevAnalysisPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track property performance and investor metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: '₹2.3Cr', change: '+12.5%', icon: Wallet },
            { label: 'Active Investors', value: '1,250', change: '+8.3%', icon: Users },
            { label: 'Occupancy Rate', value: '87%', change: '+2.1%', icon: Calendar },
            { label: 'Avg ROI', value: '11.8%', change: '+0.5%', icon: TrendingUp },
          ].map(({ label, value, change, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
                  <p className="text-xs text-gain mt-1">{change}</p>
                </div>
                <Icon size={24} className="text-primary" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  formatter={(val) => `₹${(val / 1000000).toFixed(1)}M`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Property Distribution */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Investor Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={investorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {investorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Monthly Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  formatter={(val) => `₹${(val / 1000000).toFixed(1)}M`}
                />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performers */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Top Properties</h3>
            <div className="space-y-3">
              {[
                { name: 'Downtown Office Complex', roi: '12.5%', revenue: '₹3.0M' },
                { name: 'Sky Residence Tower', roi: '10.8%', revenue: '₹2.0M' },
                { name: 'West Shopping Mall', roi: '15.2%', revenue: '₹2.8M' },
              ].map(({ name, roi, revenue }) => (
                <div
                  key={name}
                  className="p-3 bg-card border border-border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">ROI: {roi}</p>
                  </div>
                  <span className="text-sm font-bold text-gain">{revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

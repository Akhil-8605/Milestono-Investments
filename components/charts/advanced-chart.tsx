'use client'

import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts'
import { cn } from '@/lib/utils'

interface PerformanceData {
  month: string
  value: number
  revenue?: number
  units?: number
  occupancy?: number
}

interface AdvancedChartProps {
  title: string
  subtitle?: string
  data: PerformanceData[]
  type: 'area' | 'line' | 'bar' | 'composed'
  dataKey: string | string[]
  colors?: string | string[]
  height?: number
  loading?: boolean
}

export function AdvancedChart({
  title,
  subtitle,
  data,
  type,
  dataKey,
  colors = '#3b82f6',
  height = 200,
  loading,
}: AdvancedChartProps) {
  const chartColors = Array.isArray(colors) ? colors : [colors]
  const dataKeys = Array.isArray(dataKey) ? dataKey : [dataKey]

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="h-4 bg-muted rounded w-1/3 mb-4 animate-pulse" />
        <div style={{ height }} className="bg-muted rounded animate-pulse" />
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              {dataKeys.map((_, i) => (
                <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[i]} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={chartColors[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 11 }} />
            {dataKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[i]}
                fill={`url(#grad-${i})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </AreaChart>
        )
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 11 }} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[i]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        )
      case 'bar':
        return (
          <BarChart data={data} barSize={24} barGap={4}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 11 }} />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={chartColors[i]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        )
      case 'composed':
        return (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 11 }} />
            <Legend />
            {dataKeys.map((key, i) => {
              if (i === 0) {
                return <Bar key={key} dataKey={key} fill={chartColors[i]} radius={[3, 3, 0, 0]} />
              }
              return <Line key={key} type="monotone" dataKey={key} stroke={chartColors[i]} strokeWidth={2} dot={false} />
            })}
          </ComposedChart>
        )
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

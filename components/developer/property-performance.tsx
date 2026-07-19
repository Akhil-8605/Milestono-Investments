'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, Users, DollarSign, Percent } from 'lucide-react'

export interface PropertyPerformanceMetric {
  propertySymbol: string
  propertyName: string
  status: 'active' | 'draft' | 'paused'
  subscriptionRate: number
  monthlyRevenue: number
  unitsSold: number
  totalUnits: number
  trend: number // positive or negative
  avgRating?: number
}

interface PropertyPerformanceProps {
  properties: PropertyPerformanceMetric[]
  loading?: boolean
}

export function PropertyPerformance({ properties, loading }: PropertyPerformanceProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <TrendingUp size={28} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No properties yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {properties.map((prop, i) => {
        const subscription = Math.round((prop.unitsSold / prop.totalUnits) * 100)
        const trendUp = prop.trend >= 0

        return (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-semibold text-foreground">{prop.propertySymbol}</p>
                  <span className={cn(
                    'text-[8px] font-bold uppercase px-1.5 py-0.5 rounded',
                    prop.status === 'active' && 'bg-green-500/10 text-gain',
                    prop.status === 'draft' && 'bg-yellow-500/10 text-yellow-500',
                    prop.status === 'paused' && 'bg-secondary text-muted-foreground'
                  )}>
                    {prop.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{prop.propertyName}</p>
              </div>
              <div className={cn(
                'text-xs font-bold flex items-center gap-1',
                trendUp ? 'text-gain' : 'text-loss'
              )}>
                {trendUp ? '↑' : '↓'} {Math.abs(prop.trend).toFixed(1)}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Subscription</span>
                <span className="text-[9px] font-mono text-foreground">{subscription}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${subscription}%` }}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-[9px] text-center">
                <p className="text-muted-foreground">Revenue</p>
                <p className="font-mono font-bold text-foreground text-[10px]">{fmt(prop.monthlyRevenue).split('₹')[1]}</p>
              </div>
              <div className="text-[9px] text-center border-l border-r border-border">
                <p className="text-muted-foreground">Sold</p>
                <p className="font-mono font-bold text-foreground text-[10px]">{prop.unitsSold}</p>
              </div>
              <div className="text-[9px] text-center">
                <p className="text-muted-foreground">Total</p>
                <p className="font-mono font-bold text-foreground text-[10px]">{prop.totalUnits}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

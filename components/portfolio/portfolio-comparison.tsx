'use client'

import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'

interface ComparisonMetric {
  label: string
  value: string | number
  change?: number
  positive?: boolean
  benchmark?: string
  target?: string
}

interface PortfolioComparisonProps {
  title: string
  metrics: ComparisonMetric[]
  loading?: boolean
}

export function PortfolioComparison({ title, metrics, loading }: PortfolioComparisonProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="h-4 bg-muted rounded w-1/3 mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {metrics.map((metric, i) => {
          const isPositive = metric.positive !== false && (metric.change ?? 0) >= 0

          return (
            <div
              key={i}
              className="p-3 rounded-lg bg-background border border-border hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{metric.label}</span>
                {metric.change !== undefined && (
                  <div className={cn('flex items-center gap-1', isPositive ? 'text-gain' : 'text-loss')}>
                    {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    <span className="text-[10px] font-semibold">{Math.abs(metric.change).toFixed(2)}%</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-lg font-bold font-mono text-foreground">{metric.value}</div>
                {metric.benchmark && (
                  <div className="text-xs text-muted-foreground">
                    vs <span className="text-muted-foreground">{metric.benchmark}</span>
                  </div>
                )}
              </div>
              {metric.target && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Target: <span className="text-blue-500">{metric.target}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

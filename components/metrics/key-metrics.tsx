'use client'

import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface KeyMetric {
  label: string
  value: string | number
  unit?: string
  change?: number
  changeLabel?: string
  positive?: boolean
  icon?: React.ReactNode
}

interface KeyMetricsProps {
  metrics: KeyMetric[]
  loading?: boolean
}

export function KeyMetrics({ metrics, loading }: KeyMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-3 animate-pulse">
            <div className="h-3 bg-muted rounded w-1/2 mb-2" />
            <div className="h-5 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((metric, i) => {
        const isPositive = metric.positive !== false && (metric.change ?? 0) >= 0

        return (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</span>
              {metric.icon}
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-lg font-bold font-mono text-foreground">{metric.value}</span>
              {metric.unit && <span className="text-[10px] text-muted-foreground">{metric.unit}</span>}
            </div>
            {(metric.change !== undefined || metric.changeLabel) && (
              <div className={cn(
                'flex items-center gap-1 text-[10px] font-semibold',
                isPositive ? 'text-gain' : 'text-loss'
              )}>
                {metric.change !== undefined && (
                  <>
                    {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(metric.change).toFixed(2)}%
                  </>
                )}
                {metric.changeLabel && <span>{metric.changeLabel}</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

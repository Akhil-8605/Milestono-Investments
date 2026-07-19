'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down'
    period: string
  }
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange'
}

export function StatsCard({
  icon,
  label,
  value,
  change,
  color = 'blue',
}: StatsCardProps) {
  const colorMap = {
    blue: { bg: '#1d3a6b', text: '#3b82f6' },
    green: { bg: '#14281a', text: '#22c55e' },
    red: { bg: '#3b1a1a', text: '#ef4444' },
    purple: { bg: '#2d1b5a', text: '#8b5cf6' },
    orange: { bg: '#2d1e0a', text: '#f59e0b' },
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div
          className="p-2 rounded-lg"
          style={{ background: colorMap[color].bg }}
        >
          <div style={{ color: colorMap[color].text }}>{icon}</div>
        </div>
        {change && (
          <div
            className={cn(
              'text-xs font-semibold flex items-center gap-1',
              change.trend === 'up'
                ? 'text-gain'
                : 'text-loss'
            )}
          >
            {change.trend === 'up' ? '+' : '-'}
            {change.value}% {change.period}
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      </div>
    </div>
  )
}

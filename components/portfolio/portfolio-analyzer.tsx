'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, TrendingUp, Target, DollarSign } from 'lucide-react'

interface PortfolioInsight {
  type: 'opportunity' | 'risk' | 'performance' | 'action'
  title: string
  description: string
  recommendation?: string
  metric?: string
  priority: 'high' | 'medium' | 'low'
}

interface PortfolioAnalyzerProps {
  insights: PortfolioInsight[]
  loading?: boolean
}

export function PortfolioAnalyzer({ insights, loading }: PortfolioAnalyzerProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp size={16} className="text-gain" />
      case 'risk':
        return <AlertCircle size={16} className="text-loss" />
      case 'performance':
        return <Target size={16} className="text-primary" />
      case 'action':
        return <DollarSign size={16} className="text-yellow-500" />
      default:
        return null
    }
  }

  const getStyles = (type: string, priority: string) => {
    const baseStyles = 'border-l-4'
    if (type === 'opportunity') {
      return `${baseStyles} border-gain bg-green-500/10/40`
    } else if (type === 'risk') {
      return `${baseStyles} border-loss bg-loss/10`
    } else if (type === 'performance') {
      return `${baseStyles} border-primary bg-primary/20/40`
    } else if (type === 'action') {
      return `${baseStyles} border-yellow-500 bg-yellow-500/10/40`
    }
    return baseStyles
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <TrendingUp size={28} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No insights available yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div
          key={i}
          className={cn(
            'bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all',
            getStyles(insight.type, insight.priority)
          )}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {getIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
                <span className={cn(
                  'text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full',
                  insight.priority === 'high' && 'bg-loss/20 text-loss',
                  insight.priority === 'medium' && 'bg-[#f59e0b]/20 text-yellow-500',
                  insight.priority === 'low' && 'bg-primary/20 text-primary'
                )}>
                  {insight.priority}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
              {insight.recommendation && (
                <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
                  <span className="text-primary">→</span> {insight.recommendation}
                </p>
              )}
              {insight.metric && (
                <div className="text-xs font-mono text-blue-500 mt-2">
                  {insight.metric}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

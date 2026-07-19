'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Bell, Trash2, AlertCircle, TrendingUp, TrendingDown, X } from 'lucide-react'

export interface PriceAlert {
  id: string
  symbol: string
  name: string
  type: 'above' | 'below'
  targetPrice: number
  currentPrice: number
  triggered: boolean
  createdAt: string
}

interface AlertsPanelProps {
  alerts: PriceAlert[]
  onRemove: (alertId: string) => void
  onAdd?: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void
  loading?: boolean
}

export function AlertsPanel({ alerts, onRemove, onAdd, loading }: AlertsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const triggeredCount = alerts.filter(a => a.triggered).length
  const activeCount = alerts.filter(a => !a.triggered).length

  if (alerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <Bell size={32} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm">No price alerts set</p>
        <p className="text-muted-foreground text-xs mt-1">Create alerts to get notified of price changes</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active</p>
          <p className="text-xl font-bold text-foreground">{activeCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Triggered</p>
          <p className="text-xl font-bold text-yellow-500">{triggeredCount}</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={cn(
              'bg-card border rounded-lg p-4 transition-all cursor-pointer',
              alert.triggered ? 'border-yellow-500 bg-yellow-500/10/30' : 'border-border hover:border-primary/30'
            )}
            onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {alert.triggered ? (
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle size={16} className="text-yellow-500" />
                  </div>
                ) : (
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    alert.type === 'above' ? 'bg-green-500/10' : 'bg-loss/10'
                  )}>
                    {alert.type === 'above' ? (
                      <TrendingUp size={16} className="text-gain" />
                    ) : (
                      <TrendingDown size={16} className="text-loss" />
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{alert.symbol}</p>
                    <span className={cn(
                      'text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded',
                      alert.triggered ? 'bg-yellow-500/10 text-yellow-500' : alert.type === 'above' ? 'bg-green-500/10 text-gain' : 'bg-loss/10 text-loss'
                    )}>
                      {alert.triggered ? 'Triggered' : `Price ${alert.type}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{alert.name}</p>
                </div>
              </div>

              <button
                onClick={e => { e.stopPropagation(); onRemove(alert.id) }}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-loss transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Expanded Content */}
            {expandedId === alert.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Current Price</p>
                    <p className="font-mono font-semibold text-foreground">
                      ₹{alert.currentPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Target Price</p>
                    <p className="font-mono font-semibold text-foreground">
                      ₹{alert.targetPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Difference</p>
                    <p className={cn(
                      'font-mono font-semibold',
                      alert.targetPrice > alert.currentPrice ? 'text-gain' : 'text-loss'
                    )}>
                      {alert.targetPrice > alert.currentPrice ? '+' : ''}
                      ₹{(alert.targetPrice - alert.currentPrice).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Created {new Date(alert.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

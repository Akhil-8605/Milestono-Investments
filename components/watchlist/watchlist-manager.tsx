'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Star, Bell, Trash2, Plus, Filter, TrendingUp, TrendingDown } from 'lucide-react'

export interface WatchlistItem {
  id: string
  symbol: string
  name: string
  city: string
  type: string
  currentPrice: number
  changePct: number
  change: number
  yield: number
  occupancy: number
  hasAlert: boolean
  alertCount?: number
  addedAt: string
}

interface WatchlistManagerProps {
  items: WatchlistItem[]
  onRemove: (itemId: string) => void
  onAddAlert: (itemId: string) => void
  onSort?: (sortBy: string) => void
  loading?: boolean
}

export function WatchlistManager({ items, onRemove, onAddAlert, onSort, loading }: WatchlistManagerProps) {
  const [sortBy, setSortBy] = useState('addedAt')
  const [filterType, setFilterType] = useState('all')

  const handleSort = (key: string) => {
    setSortBy(key)
    onSort?.(key)
  }

  const filtered = filterType === 'all'
    ? items
    : items.filter(item => item.type.toLowerCase() === filterType.toLowerCase())

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'yield':
        return b.yield - a.yield
      case 'change':
        return b.changePct - a.changePct
      case 'price':
        return b.currentPrice - a.currentPrice
      case 'addedAt':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    }
  })

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Star size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No items in watchlist</p>
        <p className="text-muted-foreground text-xs mt-1">Add properties from the market to track them</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded p-1">
          {[
            { label: 'Added', key: 'addedAt' },
            { label: 'Yield', key: 'yield' },
            { label: 'Change', key: 'change' },
            { label: 'Price', key: 'price' },
          ].map(({ label, key }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                sortBy === key
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-muted-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-2.5 py-1 rounded text-xs bg-muted border border-border text-muted-foreground hover:text-muted-foreground focus:border-primary outline-none transition-colors"
        >
          <option value="all">All Types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="industrial">Industrial</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {sorted.map(item => {
          const isUp = item.changePct >= 0

          return (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => {}}
                    className="p-1 rounded hover:bg-muted text-yellow-500 transition-colors shrink-0 mt-0.5"
                  >
                    <Star size={14} fill="currentColor" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{item.symbol}</span>
                      <span className={cn(
                        'text-[8px] font-bold uppercase px-1 py-0.5 rounded',
                        item.type === 'commercial' ? 'bg-primary/20 text-blue-500' :
                        item.type === 'residential' ? 'bg-green-500/10 text-green-500' :
                        'bg-purple-500/10 text-purple-500'
                      )}>
                        {item.type.slice(0, 3)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{item.name}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <div className="font-mono font-semibold text-foreground text-xs mb-0.5">
                    ₹{item.currentPrice.toLocaleString('en-IN')}
                  </div>
                  <div className={cn('text-xs font-bold flex items-center justify-end gap-0.5', isUp ? 'text-gain' : 'text-loss')}>
                    {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(item.changePct).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Bottom Metrics */}
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[9px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Yield: <span className="text-gain">{item.yield}%</span></span>
                  <span>·</span>
                  <span>Occupancy: <span className="text-foreground">{item.occupancy}%</span></span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onAddAlert(item.id)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      item.hasAlert ? 'bg-yellow-500/10 text-yellow-500' : 'hover:bg-muted text-muted-foreground hover:text-muted-foreground'
                    )}
                    title="Add price alert"
                  >
                    <Bell size={12} />
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-loss transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No properties match your filters
        </div>
      )}
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, X } from 'lucide-react'

interface ScreenerConfig {
  minYield: number
  maxYield: number
  minOccupancy: number
  minMarketCap: number
  maxPrice: number
  priceChange: 'any' | 'gainer' | 'loser'
}

interface MarketScreenerProps {
  isOpen: boolean
  onClose: () => void
  config: ScreenerConfig
  onConfigChange: (config: ScreenerConfig) => void
  properties: Array<{ expectedYield: number; occupancyRate: number; marketData: { marketCap: number; currentPrice: number; changePct: number } }>
}

export function MarketScreener({ isOpen, onClose, config, onConfigChange, properties }: MarketScreenerProps) {
  if (!isOpen) return null

  const handleChange = (key: keyof ScreenerConfig, value: any) => {
    onConfigChange({ ...config, [key]: value })
  }

  // Calculate filtered count
  const filtered = properties.filter(p => {
    if (p.expectedYield < config.minYield || p.expectedYield > config.maxYield) return false
    if (p.occupancyRate < config.minOccupancy) return false
    if (p.marketData.marketCap < config.minMarketCap) return false
    if (p.marketData.currentPrice > config.maxPrice) return false
    if (config.priceChange === 'gainer' && p.marketData.changePct < 0) return false
    if (config.priceChange === 'loser' && p.marketData.changePct > 0) return false
    return true
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">Market Screener</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Yield Range */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Expected Yield</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                <input
                  type="number"
                  value={config.minYield}
                  onChange={e => handleChange('minYield', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-border bg-muted text-foreground text-sm focus:border-primary outline-none transition-colors"
                  min="0"
                  max="20"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                <input
                  type="number"
                  value={config.maxYield}
                  onChange={e => handleChange('maxYield', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-border bg-muted text-foreground text-sm focus:border-primary outline-none transition-colors"
                  min="0"
                  max="20"
                  step="0.5"
                />
              </div>
            </div>
          </div>

          {/* Occupancy */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Min. Occupancy: {config.minOccupancy}%</label>
            <input
              type="range"
              value={config.minOccupancy}
              onChange={e => handleChange('minOccupancy', parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-full"
            />
          </div>

          {/* Market Cap */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Min. Market Cap</label>
            <select
              value={config.minMarketCap}
              onChange={e => handleChange('minMarketCap', parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded border border-border bg-muted text-foreground text-sm focus:border-primary outline-none transition-colors"
            >
              <option value={0}>Any</option>
              <option value={50000000}>₹50 Cr+</option>
              <option value={100000000}>₹100 Cr+</option>
              <option value={500000000}>₹500 Cr+</option>
              <option value={1000000000}>₹1000 Cr+</option>
            </select>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Max Price</label>
            <input
              type="number"
              value={config.maxPrice}
              onChange={e => handleChange('maxPrice', parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded border border-border bg-muted text-foreground text-sm focus:border-primary outline-none transition-colors"
              min="0"
              step="10000"
            />
          </div>

          {/* Price Change */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Price Change</label>
            <div className="flex gap-2">
              {[
                { key: 'any', label: 'Any', icon: null },
                { key: 'gainer', label: 'Gainers', icon: TrendingUp },
                { key: 'loser', label: 'Losers', icon: TrendingDown },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleChange('priceChange', key as any)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all',
                    config.priceChange === key
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:text-muted-foreground border border-border'
                  )}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-between sticky bottom-0">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{filtered.length}</span> properties match criteria
          </p>
          <Button
            onClick={onClose}
            className="h-9 bg-primary hover:bg-blue-600 text-white text-sm font-semibold"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface OrderBookProps {
  symbol: string
  currentPrice: number
  bids: Array<{ price: number; quantity: number; orders: number }>
  asks: Array<{ price: number; quantity: number; orders: number }>
}

export function OrderBook({ symbol, currentPrice, bids, asks }: OrderBookProps) {
  const maxQty = Math.max(
    ...bids.map(b => b.quantity),
    ...asks.map(a => a.quantity)
  )

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-background">
        <h3 className="text-sm font-semibold text-foreground">{symbol} Order Book</h3>
      </div>

      <div className="grid grid-cols-2">
        {/* Bids */}
        <div className="border-r border-border">
          <div className="px-3 py-2 border-b border-border bg-green-500/10/40">
            <p className="text-[10px] font-semibold text-gain uppercase tracking-wider">Bid</p>
          </div>
          <div className="divide-y divide-border">
            {bids.slice(0, 6).map((bid, i) => (
              <div key={i} className="px-3 py-2 relative hover:bg-muted transition-colors">
                <div
                  className="absolute inset-0 bg-gain/5"
                  style={{ width: `${(bid.quantity / maxQty) * 100}%` }}
                />
                <div className="relative space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-foreground font-semibold">
                      ₹{bid.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-muted-foreground text-[10px]">{bid.orders}o</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {bid.quantity.toLocaleString()} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div>
          <div className="px-3 py-2 border-b border-border bg-loss/10">
            <p className="text-[10px] font-semibold text-loss uppercase tracking-wider">Ask</p>
          </div>
          <div className="divide-y divide-border">
            {asks.slice(0, 6).map((ask, i) => (
              <div key={i} className="px-3 py-2 relative hover:bg-muted transition-colors">
                <div
                  className="absolute inset-0 bg-loss/5"
                  style={{ width: `${(ask.quantity / maxQty) * 100}%` }}
                />
                <div className="relative space-y-0.5 text-right">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[10px]">{ask.orders}o</span>
                    <span className="font-mono text-foreground font-semibold">
                      ₹{ask.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {ask.quantity.toLocaleString()} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spread Info */}
      <div className="px-4 py-2 border-t border-border bg-background text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Bid-Ask Spread</span>
          <span className="font-mono text-muted-foreground">
            ₹{Math.abs(asks[0]?.price - bids[0]?.price || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react'

export interface Transaction {
  id: string
  date: string
  type: 'buy' | 'sell' | 'dividend'
  units: number
  pricePerUnit: number
  totalAmount: number
  status: 'completed' | 'pending'
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  loading?: boolean
}

export function TransactionHistory({ transactions, loading }: TransactionHistoryProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-10 bg-background border-b border-border px-4 flex items-center">
          <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <TrendingUp size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-background">
        <h3 className="text-sm font-semibold text-foreground">Transaction History</h3>
      </div>
      <div className="divide-y divide-border">
        {transactions.map(tx => {
          const isBuy = tx.type === 'buy'
          const isDividend = tx.type === 'dividend'

          return (
            <div key={tx.id} className="px-4 py-3 hover:bg-background transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    isDividend ? 'bg-yellow-500/10' : isBuy ? 'bg-green-500/10' : 'bg-loss/10'
                  )}>
                    {isDividend ? (
                      <TrendingUp size={14} className="text-yellow-500" />
                    ) : isBuy ? (
                      <ArrowDown size={14} className="text-gain" />
                    ) : (
                      <ArrowUp size={14} className="text-loss" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground capitalize">{tx.type}</p>
                      <span className={cn(
                        'text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded',
                        tx.status === 'completed'
                          ? 'bg-green-500/10 text-gain'
                          : 'bg-yellow-500/10 text-yellow-500'
                      )}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {tx.units} units @ ₹{tx.pricePerUnit.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn(
                    'text-sm font-bold font-mono',
                    isDividend ? 'text-yellow-500' : isBuy ? 'text-gain' : 'text-loss'
                  )}>
                    {isDividend ? '+' : isBuy ? '-' : '+'}
                    {fmt(tx.totalAmount)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(tx.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

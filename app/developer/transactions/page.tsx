'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { DataTable } from '@/components/table/data-table'
import { Wallet, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mockTransactions = [
  {
    id: '1',
    date: '2024-01-22',
    type: 'deposit',
    property: 'Downtown Office Complex',
    amount: 5000000,
    status: 'completed',
    method: 'Bank Transfer',
    reference: 'TXN-2024-001',
  },
  {
    id: '2',
    date: '2024-01-20',
    type: 'payout',
    property: 'Sky Residence Tower',
    amount: -2500000,
    status: 'completed',
    method: 'Bank Account',
    reference: 'PAYOUT-2024-001',
  },
  {
    id: '3',
    date: '2024-01-15',
    type: 'revenue',
    property: 'West Shopping Mall',
    amount: 1800000,
    status: 'pending',
    method: 'Investor Payment',
    reference: 'REV-2024-001',
  },
]

export default function DevTransactionsPage() {
  const [transactions] = useState(mockTransactions)
  const [filterType, setFilterType] = useState<string | null>(null)

  const filteredTransactions = filterType
    ? transactions.filter((t) => t.type === filterType)
    : transactions

  const stats = {
    totalDeposits: transactions
      .filter((t) => t.type === 'deposit')
      .reduce((s, t) => s + t.amount, 0),
    totalPayouts: Math.abs(
      transactions
        .filter((t) => t.type === 'payout')
        .reduce((s, t) => s + t.amount, 0)
    ),
    totalRevenue: transactions
      .filter((t) => t.type === 'revenue')
      .reduce((s, t) => s + t.amount, 0),
    pendingAmount: transactions
      .filter((t) => t.status === 'pending')
      .reduce((s, t) => s + Math.abs(t.amount), 0),
  }

  return (
    <AppLayout title="Transactions" subtitle="Transaction history and payouts">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View your transaction history and payouts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Deposits',
              value: `₹${(stats.totalDeposits / 10000000).toFixed(1)}Cr`,
              color: 'green',
            },
            {
              label: 'Total Payouts',
              value: `₹${(stats.totalPayouts / 10000000).toFixed(1)}Cr`,
              color: 'red',
            },
            {
              label: 'Total Revenue',
              value: `₹${(stats.totalRevenue / 1000000).toFixed(1)}M`,
              color: 'blue',
            },
            {
              label: 'Pending',
              value: `₹${(stats.pendingAmount / 1000000).toFixed(1)}M`,
              color: 'orange',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className={`text-2xl font-bold mt-2 ${
                color === 'green'
                  ? 'text-gain'
                  : color === 'red'
                  ? 'text-loss'
                  : color === 'blue'
                  ? 'text-primary'
                  : 'text-yellow-500'
              }`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { label: 'All', value: null },
            { label: 'Deposits', value: 'deposit' },
            { label: 'Payouts', value: 'payout' },
            { label: 'Revenue', value: 'revenue' },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setFilterType(value)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                filterType === value
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    tx.type === 'deposit'
                      ? 'bg-green-500/10'
                      : tx.type === 'payout'
                      ? 'bg-loss/10'
                      : 'bg-primary/20'
                  }`}>
                    <Wallet
                      size={20}
                      className={tx.type === 'deposit' ? 'text-gain' : tx.type === 'payout' ? 'text-loss' : 'text-primary'}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{tx.property}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded bg-card text-muted-foreground">
                        {tx.date}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-card text-muted-foreground">
                        {tx.method}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        tx.status === 'completed'
                          ? 'bg-green-500/10 text-gain'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-lg font-bold font-mono ${
                      tx.amount > 0 ? 'text-gain' : 'text-loss'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{tx.reference}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Request Payout */}
        <div className="bg-gradient-to-r from-primary/20 to-card border border-primary/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Request Payout</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Minimum payout amount: ₹1,00,000
              </p>
            </div>
            <Button className="bg-primary hover:bg-blue-600 text-white flex items-center gap-2">
              <ArrowRight size={16} />
              Request Payout
            </Button>
          </div>
        </div>

        {/* Download */}
        <Button className="w-full bg-card border border-border hover:border-primary/40 text-foreground py-3 flex items-center justify-center gap-2">
          <Download size={18} />
          Download Statement
        </Button>
      </div>
    </AppLayout>
  )
}

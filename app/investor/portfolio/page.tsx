'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import {
  Briefcase, TrendingUp, TrendingDown, ArrowRight,
  ChevronUp, ChevronDown, RefreshCcw, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const fmtC = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return fmt(n)
}

const DEMO: any[] = [
  { id: 'd1', propertyId: 'prop-1', symbol: 'PRSN', city: 'Bangalore', type: 'residential', unitsOwned: 12, buyPrice: 118000, currentPrice: 125000, invested: 1416000, currentValue: 1500000, pl: 84000, plPct: 5.93, yield: 9.2 },
  { id: 'd2', propertyId: 'prop-2', symbol: 'GDBK', city: 'Mumbai',    type: 'commercial',  unitsOwned: 5,  buyPrice: 272000, currentPrice: 285000, invested: 1360000, currentValue: 1425000, pl: 65000, plPct: 4.78, yield: 7.8 },
  { id: 'd3', propertyId: 'prop-4', symbol: 'EMTV', city: 'Bangalore', type: 'commercial',  unitsOwned: 20, buyPrice: 95200,  currentPrice: 98000,  invested: 1904000, currentValue: 1960000, pl: 56000, plPct: 2.94, yield: 11.2 },
  { id: 'd4', propertyId: 'prop-11',symbol: 'MHWC', city: 'Chennai',   type: 'industrial',  unitsOwned: 30, buyPrice: 36500,  currentPrice: 35000,  invested: 1095000, currentValue: 1050000, pl: -45000,plPct: -4.11, yield: 12.4 },
  { id: 'd5', propertyId: 'prop-6', symbol: 'PHPL', city: 'Lucknow',   type: 'commercial',  unitsOwned: 8,  buyPrice: 52000,  currentPrice: 55000,  invested: 416000,  currentValue: 440000,  pl: 24000, plPct: 5.77, yield: 10.5 },
  { id: 'd6', propertyId: 'prop-9', symbol: 'THSR', city: 'Mumbai',    type: 'residential', unitsOwned: 4,  buyPrice: 188000, currentPrice: 195000, invested: 752000,  currentValue: 780000,  pl: 28000, plPct: 3.72, yield: 9.7 },
]

export default function PortfolioPage() {
  const router = useRouter()
  const [holdings, setHoldings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState('currentValue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<'all' | 'gain' | 'loss'>('all')

  const fetchPortfolio = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio')
      const json = await res.json()
      setHoldings(json.success && json.data?.holdings?.length ? json.data.holdings : DEMO)
    } catch {
      setHoldings(DEMO)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPortfolio() }, [fetchPortfolio])

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const displayed = holdings
    .filter(h => filter === 'all' ? true : filter === 'gain' ? h.pl >= 0 : h.pl < 0)
    .sort((a, b) => {
      const va = a[sortCol] ?? 0
      const vb = b[sortCol] ?? 0
      return sortDir === 'desc' ? vb - va : va - vb
    })

  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0)
  const totalCurrent  = holdings.reduce((s, h) => s + h.currentValue, 0)
  const totalPL       = totalCurrent - totalInvested
  const totalPLPct    = totalInvested ? (totalPL / totalInvested) * 100 : 0
  const gainers       = holdings.filter(h => h.pl >= 0).length
  const losers        = holdings.filter(h => h.pl < 0).length

  const SortIcon = ({ col }: { col: string }) =>
    sortCol !== col ? <span className="text-muted-foreground text-[10px]">↕</span>
      : sortDir === 'desc' ? <ChevronDown size={11} className="text-primary" />
      : <ChevronUp size={11} className="text-primary" />

  const COLS = [
    { key: 'symbol',       label: 'Symbol',       align: 'left'  },
    { key: 'unitsOwned',   label: 'Units',        align: 'right' },
    { key: 'buyPrice',     label: 'Avg Cost',     align: 'right' },
    { key: 'currentPrice', label: 'LTP',          align: 'right' },
    { key: 'invested',     label: 'Invested',     align: 'right' },
    { key: 'currentValue', label: 'Curr. Value',  align: 'right' },
    { key: 'pl',           label: 'P&L',          align: 'right' },
    { key: 'plPct',        label: 'P&L %',        align: 'right' },
    { key: 'yield',        label: 'Yield',        align: 'right' },
  ]

  return (
    <AppLayout title="Portfolio" subtitle="Holdings & P&L">
      <div className="p-6 space-y-6">

        {/* Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Invested', value: fmtC(totalInvested), color: 'var(--foreground)' },
            { label: 'Current Value', value: fmtC(totalCurrent), color: 'var(--foreground)' },
            { label: 'Total P&L', value: (totalPL >= 0 ? '+' : '') + fmtC(totalPL), color: totalPL >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'P&L %', value: (totalPLPct >= 0 ? '+' : '') + totalPLPct.toFixed(2) + '%', color: totalPLPct >= 0 ? '#22c55e' : '#ef4444' },
            { label: `${gainers}G / ${losers}L`, value: `${holdings.length} Holdings`, color: '#9ca3af' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
              <div className="text-sm font-bold font-mono num" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filter + Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['all', 'gain', 'loss'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors',
                  filter === f
                    ? f === 'gain' ? 'bg-green-500/10 text-green-500' : f === 'loss' ? 'bg-loss/10 text-loss' : 'bg-primary/20 text-blue-500'
                    : 'text-muted-foreground hover:text-muted-foreground bg-muted'
                )}
              >
                {f === 'gain' ? `Gainers (${gainers})` : f === 'loss' ? `Losers (${losers})` : `All (${holdings.length})`}
              </button>
            ))}
          </div>
          <button
            onClick={fetchPortfolio}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted-foreground px-3 py-1.5 rounded bg-muted border border-border transition-colors"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Holdings Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {COLS.map(c => (
                    <th
                      key={c.key}
                      onClick={() => handleSort(c.key)}
                      className={cn(
                        'py-2.5 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-muted-foreground select-none transition-colors',
                        c.align === 'right' ? 'text-right' : 'text-left'
                      )}
                    >
                      <span className={cn('flex items-center gap-1', c.align === 'right' ? 'justify-end' : '')}>
                        {c.label} <SortIcon col={c.key} />
                      </span>
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-3 rounded bg-muted animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : displayed.map(h => {
                  const up = h.pl >= 0
                  const typeColor = h.type === 'commercial' ? { bg: '#1d3a6b', text: '#93c5fd' } : h.type === 'industrial' ? { bg: '#2d1b5a', text: '#c4b5fd' } : { bg: '#14281a', text: '#4ade80' }
                  return (
                    <tr
                      key={h.id}
                      className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => router.push(`/investor/properties/${h.propertyId}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: typeColor.bg }}>
                            <span className="text-[9px] font-bold" style={{ color: typeColor.text }}>{h.symbol?.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="text-foreground text-xs font-bold">{h.symbol}</div>
                            <div className="text-muted-foreground text-[10px]">{h.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-mono text-foreground">{h.unitsOwned}</td>
                      <td className="py-3.5 px-4 text-right text-xs font-mono text-muted-foreground">{fmt(h.buyPrice ?? (h.invested / h.unitsOwned))}</td>
                      <td className="py-3.5 px-4 text-right text-xs font-mono text-foreground">{fmt(h.currentPrice)}</td>
                      <td className="py-3.5 px-4 text-right text-xs num text-muted-foreground">{fmtC(h.invested)}</td>
                      <td className="py-3.5 px-4 text-right text-xs num font-semibold text-foreground">{fmtC(h.currentValue)}</td>
                      <td className={cn('py-3.5 px-4 text-right text-xs num font-semibold', up ? 'text-gain' : 'text-loss')}>
                        {up ? '+' : ''}{fmtC(h.pl)}
                      </td>
                      <td className={cn('py-3.5 px-4 text-right text-xs font-bold', up ? 'text-gain' : 'text-loss')}>
                        <span className="flex items-center justify-end gap-0.5">
                          {up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          {Math.abs(h.plPct).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-semibold text-gain">{h.yield?.toFixed(1)}%</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/investor/properties/${h.propertyId}`) }}
                          className="text-[10px] px-2.5 py-1 rounded bg-primary/20 hover:bg-blue-600 text-blue-500 hover:text-white border border-primary/20 hover:border-primary/60 transition-all"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom disclaimer */}
        <p className="text-[10px] text-muted-foreground text-center">
          P&L figures are indicative. Actual returns may vary based on market conditions. Past performance is not indicative of future results.
        </p>
      </div>
    </AppLayout>
  )
}

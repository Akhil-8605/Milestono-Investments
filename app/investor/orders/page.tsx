'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { SearchFilter } from '@/components/search/search-filter'
import { DataTable } from '@/components/table/data-table'
import { Eye, Trash2, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mockOrders = [
  {
    id: '1',
    symbol: 'DOWNOFC',
    property: 'Downtown Office Complex',
    type: 'buy',
    units: 50,
    unitPrice: 10000,
    totalValue: 500000,
    date: '2024-01-15',
    status: 'completed',
    return: 2500,
  },
  {
    id: '2',
    symbol: 'SKYRES',
    property: 'Sky Residence Tower',
    type: 'buy',
    units: 100,
    unitPrice: 8500,
    totalValue: 850000,
    date: '2024-01-20',
    status: 'completed',
    return: 5100,
  },
  {
    id: '3',
    symbol: 'WESTMALL',
    property: 'West Shopping Mall',
    type: 'sell',
    units: 30,
    unitPrice: 12000,
    totalValue: 360000,
    date: '2024-01-22',
    status: 'pending',
    return: -900,
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState(mockOrders)

  const handleSearch = (query: string) => {
    const filtered = orders.filter(
      (order) =>
        order.symbol.toLowerCase().includes(query.toLowerCase()) ||
        order.property.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredOrders(filtered)
  }

  const handleFilter = (filters: Record<string, any>) => {
    let filtered = orders

    if (filters.type) {
      filtered = filtered.filter((o) => o.type === filters.type)
    }
    if (filters.status) {
      filtered = filtered.filter((o) => o.status === filters.status)
    }

    setFilteredOrders(filtered)
  }

  const handleExport = () => {
    const csv = [
      ['Symbol', 'Property', 'Type', 'Units', 'Unit Price', 'Total Value', 'Date', 'Status'].join(','),
      ...filteredOrders.map((o) =>
        [o.symbol, o.property, o.type, o.units, o.unitPrice, o.totalValue, o.date, o.status].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orders.csv'
    a.click()
  }

  return (
    <AppLayout title="Orders" subtitle="Investment order history">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-1">View and manage all your investment orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Orders',
              value: orders.length,
              icon: '📊',
              color: 'blue',
            },
            {
              label: 'Buy Orders',
              value: orders.filter((o) => o.type === 'buy').length,
              icon: '📈',
              color: 'green',
            },
            {
              label: 'Sell Orders',
              value: orders.filter((o) => o.type === 'sell').length,
              icon: '📉',
              color: 'red',
            },
            {
              label: 'Total Returns',
              value: `₹${orders.reduce((sum, o) => sum + o.return, 0).toLocaleString()}`,
              icon: '💰',
              color: 'purple',
            },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
                </div>
                <span className="text-3xl">{icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <SearchFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          onExport={handleExport}
          filters={[
            {
              label: 'Order Type',
              key: 'type',
              type: 'select',
              options: [
                { label: 'Buy', value: 'buy' },
                { label: 'Sell', value: 'sell' },
              ],
            },
            {
              label: 'Status',
              key: 'status',
              type: 'select',
              options: [
                { label: 'Completed', value: 'completed' },
                { label: 'Pending', value: 'pending' },
              ],
            },
          ]}
          placeholder="Search orders..."
        />

        {/* Data Table */}
        <DataTable
          columns={[
            {
              key: 'symbol' as const,
              label: 'Symbol',
              width: 'w-20',
              render: (val) => (
                <span className="font-mono font-semibold text-primary">{val}</span>
              ),
            },
            {
              key: 'property' as const,
              label: 'Property',
              sortable: true,
            },
            {
              key: 'type' as const,
              label: 'Type',
              render: (val) => (
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    val === 'buy'
                      ? 'bg-green-500/10 text-gain'
                      : 'bg-loss/10 text-loss'
                  )}
                >
                  {val.toUpperCase()}
                </span>
              ),
            },
            {
              key: 'units' as const,
              label: 'Units',
              sortable: true,
              render: (val) => val.toLocaleString(),
            },
            {
              key: 'unitPrice' as const,
              label: 'Unit Price',
              sortable: true,
              render: (val) => `₹${val.toLocaleString()}`,
            },
            {
              key: 'totalValue' as const,
              label: 'Total Value',
              sortable: true,
              render: (val) => (
                <span className="font-semibold text-foreground">
                  ₹{val.toLocaleString()}
                </span>
              ),
            },
            {
              key: 'date' as const,
              label: 'Date',
              sortable: true,
              render: (val) => new Date(val).toLocaleDateString(),
            },
            {
              key: 'status' as const,
              label: 'Status',
              render: (val) => (
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    val === 'completed'
                      ? 'bg-green-500/10 text-gain'
                      : 'bg-yellow-500/10 text-yellow-500'
                  )}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </span>
              ),
            },
            {
              key: 'return' as const,
              label: 'Return',
              render: (val) => (
                <span
                  className={val >= 0 ? 'text-gain' : 'text-loss'}
                >
                  {val >= 0 ? '+' : ''}₹{Math.abs(val).toLocaleString()}
                </span>
              ),
            },
          ]}
          data={filteredOrders}
          rowKey="id"
          onRowClick={(row) => {
            console.log('Order clicked:', row)
          }}
        />
      </div>
    </AppLayout>
  )
}

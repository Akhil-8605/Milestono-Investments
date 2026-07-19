'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { SearchFilter } from '@/components/search/search-filter'
import { DataTable } from '@/components/table/data-table'
import { AlertForm } from '@/components/forms/alert-form'
import { Bell, Trash2, Edit2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mockAlerts = [
  {
    id: '1',
    symbol: 'DOWNOFC',
    property: 'Downtown Office Complex',
    type: 'price_above',
    triggerPrice: 11000,
    currentPrice: 10500,
    status: 'active',
    createdAt: '2024-01-10',
    notifications: ['email', 'push'],
  },
  {
    id: '2',
    symbol: 'SKYRES',
    property: 'Sky Residence Tower',
    type: 'price_below',
    triggerPrice: 8000,
    currentPrice: 8500,
    status: 'active',
    createdAt: '2024-01-15',
    notifications: ['email'],
  },
  {
    id: '3',
    symbol: 'WESTMALL',
    property: 'West Shopping Mall',
    type: 'yield_change',
    triggerPrice: 0,
    currentPrice: 12000,
    status: 'triggered',
    createdAt: '2024-01-20',
    notifications: ['email', 'sms'],
  },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts)
  const [filteredAlerts, setFilteredAlerts] = useState(mockAlerts)
  const [showForm, setShowForm] = useState(false)

  const handleSearch = (query: string) => {
    const filtered = alerts.filter(
      (alert) =>
        alert.symbol.toLowerCase().includes(query.toLowerCase()) ||
        alert.property.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredAlerts(filtered)
  }

  const handleFilter = (filters: Record<string, any>) => {
    let filtered = alerts

    if (filters.status) {
      filtered = filtered.filter((a) => a.status === filters.status)
    }
    if (filters.type) {
      filtered = filtered.filter((a) => a.type === filters.type)
    }

    setFilteredAlerts(filtered)
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    setFilteredAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const handleCreateAlert = (data: any) => {
    console.log('Creating alert:', data)
    setShowForm(false)
  }

  return (
    <AppLayout title="Alerts" subtitle="Price & notification alerts">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Price Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your price alerts and notifications
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-blue-600 text-white flex items-center gap-2"
          >
            <Bell size={18} />
            Create Alert
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Alerts', value: alerts.length, icon: '🔔' },
            {
              label: 'Active',
              value: alerts.filter((a) => a.status === 'active').length,
              icon: '✓',
            },
            {
              label: 'Triggered',
              value: alerts.filter((a) => a.status === 'triggered').length,
              icon: '⚡',
            },
            {
              label: 'Today',
              value: alerts.filter((a) => a.createdAt === '2024-01-20').length,
              icon: '📅',
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <span className="text-2xl">{icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Create Alert Form */}
        {showForm && (
          <AlertForm
            currentPrice={10500}
            onSubmit={handleCreateAlert}
          />
        )}

        {/* Search and Filter */}
        <SearchFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          filters={[
            {
              label: 'Status',
              key: 'status',
              type: 'select',
              options: [
                { label: 'Active', value: 'active' },
                { label: 'Triggered', value: 'triggered' },
                { label: 'Inactive', value: 'inactive' },
              ],
            },
            {
              label: 'Type',
              key: 'type',
              type: 'select',
              options: [
                { label: 'Price Above', value: 'price_above' },
                { label: 'Price Below', value: 'price_below' },
                { label: 'Yield Change', value: 'yield_change' },
              ],
            },
          ]}
          placeholder="Search alerts..."
        />

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold font-mono text-primary">
                      {alert.symbol}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-semibold',
                        alert.status === 'active'
                          ? 'bg-green-500/10 text-gain'
                          : alert.status === 'triggered'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm mb-3">{alert.property}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Current Price</p>
                      <p className="font-bold text-foreground font-mono">
                        ₹{alert.currentPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Trigger Price</p>
                      <p className="font-bold text-foreground font-mono">
                        ₹{alert.triggerPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Type</p>
                      <p className="font-semibold text-foreground">
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Notifications</p>
                      <p className="font-semibold text-foreground">
                        {alert.notifications.join(', ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    className="p-2 bg-card border border-border hover:border-primary/40"
                    title="Edit alert"
                  >
                    <Edit2 size={16} className="text-muted-foreground" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-2 bg-card border border-border hover:border-loss/40"
                    title="Delete alert"
                  >
                    <Trash2 size={16} className="text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Bell size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No alerts found</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

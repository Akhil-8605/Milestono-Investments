'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { DataTable } from '@/components/table/data-table'
import { ImageGallery } from '@/components/gallery/image-gallery'
import { Eye, Edit2, Archive, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mockProperties = [
  {
    id: '1',
    symbol: 'DOWNOFC',
    name: 'Downtown Office Complex',
    location: 'Mumbai, Maharashtra',
    status: 'active',
    totalUnits: 1000,
    soldUnits: 650,
    totalInvestment: 50000000,
    currentValue: 56250000,
    monthlyRent: 2500000,
    occupancy: 85,
    roi: 12.5,
    listDate: '2023-06-15',
    revenue: 30000000,
    images: [
      { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', caption: 'Front' },
    ],
  },
  {
    id: '2',
    symbol: 'SKYRES',
    name: 'Sky Residence Tower',
    location: 'Bangalore, Karnataka',
    status: 'active',
    totalUnits: 1000,
    soldUnits: 820,
    totalInvestment: 42000000,
    currentValue: 46620000,
    monthlyRent: 1950000,
    occupancy: 92,
    roi: 10.8,
    listDate: '2023-08-20',
    revenue: 23400000,
    images: [
      { url: 'https://images.unsplash.com/photo-1576672543604-6e6767f7bd72?w=800', caption: 'Tower' },
    ],
  },
]

export default function DevMyPropertiesPage() {
  const [properties] = useState(mockProperties)
  const [selectedProperty, setSelectedProperty] = useState<typeof mockProperties[0] | null>(null)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Properties</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your property listings
            </p>
          </div>
          <Button className="bg-primary hover:bg-blue-600 text-white">
            + New Property
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[
            { label: 'Active Properties', value: properties.length, icon: '🏢' },
            {
              label: 'Total Revenue',
              value: `₹${(properties.reduce((s, p) => s + p.revenue, 0) / 10000000).toFixed(1)}Cr`,
              icon: '💰',
            },
            {
              label: 'Avg ROI',
              value: `${(properties.reduce((s, p) => s + p.roi, 0) / properties.length).toFixed(1)}%`,
              icon: '📈',
            },
            {
              label: 'Units Sold',
              value: properties.reduce((s, p) => s + p.soldUnits, 0).toLocaleString(),
              icon: '✓',
            },
            {
              label: 'Avg Occupancy',
              value: `${(properties.reduce((s, p) => s + p.occupancy, 0) / properties.length).toFixed(0)}%`,
              icon: '👥',
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

        {/* Properties with Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property List */}
          <div className="lg:col-span-2 space-y-3">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => setSelectedProperty(property)}
                className={cn(
                  'bg-card border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50',
                  selectedProperty?.id === property.id
                    ? 'border-primary'
                    : 'border-border'
                )}
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={property.images[0].url}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold text-primary font-mono">
                          {property.symbol}
                        </span>
                        <h3 className="text-sm font-bold text-foreground mt-1">
                          {property.name}
                        </h3>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/10 text-gain">
                        {property.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">{property.location}</p>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Total Units</p>
                        <p className="font-bold text-foreground">{property.totalUnits.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sold</p>
                        <p className="font-bold text-gain">
                          {((property.soldUnits / property.totalUnits) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-bold text-foreground">₹{(property.revenue / 1000000).toFixed(0)}M</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROI</p>
                        <p className="font-bold text-gain">{property.roi}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Sidebar */}
          {selectedProperty && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <ImageGallery images={selectedProperty.images} title="Property Photos" />

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">Performance</h3>
                {[
                  { label: 'Monthly Rent', value: `₹${(selectedProperty.monthlyRent / 1000000).toFixed(1)}M` },
                  { label: 'Occupancy', value: `${selectedProperty.occupancy}%` },
                  { label: 'Total Revenue', value: `₹${(selectedProperty.revenue / 10000000).toFixed(1)}Cr` },
                  { label: 'Current Value', value: `₹${(selectedProperty.currentValue / 1000000).toFixed(1)}M` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between p-2 bg-card rounded">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Button className="w-full bg-primary hover:bg-blue-600 text-white flex items-center justify-center gap-2">
                  <Eye size={16} />
                  View Details
                </Button>
                <Button className="w-full bg-card border border-border hover:border-primary/40 text-foreground flex items-center justify-center gap-2">
                  <Edit2 size={16} />
                  Edit Property
                </Button>
                <Button className="w-full bg-card border border-border hover:border-primary/40 text-foreground flex items-center justify-center gap-2">
                  <Archive size={16} />
                  Archive
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

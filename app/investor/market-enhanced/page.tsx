'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { SearchFilter } from '@/components/search/search-filter'
import { DataTable } from '@/components/table/data-table'
import { ImageGallery } from '@/components/gallery/image-gallery'
import { Heart, Share2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mockProperties = [
  {
    id: '1',
    symbol: 'DOWNOFC',
    name: 'Downtown Office Complex',
    location: 'Mumbai, Maharashtra',
    type: 'commercial',
    price: 10500,
    yield: 8.5,
    roi: 12.5,
    occupancy: 85,
    sold: 650,
    available: 350,
    images: [
      { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', caption: 'Front View' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37519c06fe5d?w=800', caption: 'Lobby' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', caption: 'Office Space' },
    ],
  },
  {
    id: '2',
    symbol: 'SKYRES',
    name: 'Sky Residence Tower',
    location: 'Bangalore, Karnataka',
    type: 'residential',
    price: 8500,
    yield: 7.2,
    roi: 10.8,
    occupancy: 92,
    sold: 820,
    available: 180,
    images: [
      { url: 'https://images.unsplash.com/photo-1576672543604-6e6767f7bd72?w=800', caption: 'Exterior' },
    ],
  },
  {
    id: '3',
    symbol: 'WESTMALL',
    name: 'West Shopping Mall',
    location: 'Delhi, Delhi',
    type: 'commercial',
    price: 12000,
    yield: 9.8,
    roi: 15.2,
    occupancy: 78,
    sold: 450,
    available: 550,
    images: [
      { url: 'https://images.unsplash.com/photo-1528384380409-f2b9d8fd4a7b?w=800', caption: 'Mall Interior' },
    ],
  },
]

export default function MarketPage() {
  const [properties, setProperties] = useState(mockProperties)
  const [filteredProperties, setFilteredProperties] = useState(mockProperties)
  const [selectedProperty, setSelectedProperty] = useState<typeof mockProperties[0] | null>(null)

  const handleSearch = (query: string) => {
    const filtered = properties.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.symbol.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredProperties(filtered)
  }

  const handleFilter = (filters: Record<string, any>) => {
    let filtered = properties

    if (filters.type) {
      filtered = filtered.filter((p) => p.type === filters.type)
    }
    if (filters.roi_min || filters.roi_max) {
      filtered = filtered.filter(
        (p) =>
          (filters.roi_min ? p.roi >= parseInt(filters.roi_min) : true) &&
          (filters.roi_max ? p.roi <= parseInt(filters.roi_max) : true)
      )
    }
    if (filters.yield_min || filters.yield_max) {
      filtered = filtered.filter(
        (p) =>
          (filters.yield_min ? p.yield >= parseInt(filters.yield_min) : true) &&
          (filters.yield_max ? p.yield <= parseInt(filters.yield_max) : true)
      )
    }

    setFilteredProperties(filtered)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Market Listings</h1>
          <p className="text-muted-foreground mt-1">
            Explore and invest in real estate properties
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          filters={[
            {
              label: 'Property Type',
              key: 'type',
              type: 'select',
              options: [
                { label: 'Residential', value: 'residential' },
                { label: 'Commercial', value: 'commercial' },
                { label: 'Industrial', value: 'industrial' },
              ],
            },
            {
              label: 'ROI %',
              key: 'roi',
              type: 'range',
              min: 0,
              max: 50,
            },
            {
              label: 'Yield %',
              key: 'yield',
              type: 'range',
              min: 0,
              max: 20,
            },
            {
              label: 'Occupancy %',
              key: 'occupancy',
              type: 'range',
              min: 0,
              max: 100,
            },
          ]}
          placeholder="Search by property name, location, or symbol..."
        />

        {/* Properties Grid with Detail Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredProperties.map((property) => (
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
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={property.images[0].url}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
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
                        {property.occupancy}% Occupied
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">{property.location}</p>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-bold text-foreground">₹{property.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Yield</p>
                        <p className="font-bold text-gain">{property.yield}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROI</p>
                        <p className="font-bold text-gain">{property.roi}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Available</p>
                        <p className="font-bold text-foreground">{property.available}</p>
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
              {/* Images */}
              <ImageGallery images={selectedProperty.images} title="Property Photos" />

              {/* Quick Stats */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">Property Details</h3>
                {[
                  { label: 'Unit Price', value: `₹${selectedProperty.price.toLocaleString()}` },
                  { label: 'Annual Yield', value: `${selectedProperty.yield}%` },
                  { label: 'Expected ROI', value: `${selectedProperty.roi}%` },
                  { label: 'Occupancy Rate', value: `${selectedProperty.occupancy}%` },
                  { label: 'Units Sold', value: selectedProperty.sold.toLocaleString() },
                  { label: 'Available Units', value: selectedProperty.available.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between p-2 bg-card rounded">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full bg-primary hover:bg-blue-600 text-white">
                  <TrendingUp size={16} className="mr-2" />
                  Buy Now
                </Button>
                <Button className="w-full bg-card border border-border hover:border-primary/40 text-foreground">
                  <Heart size={16} className="mr-2" />
                  Add to Watchlist
                </Button>
                <Button className="w-full bg-card border border-border hover:border-primary/40 text-foreground">
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">No properties found matching your criteria</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

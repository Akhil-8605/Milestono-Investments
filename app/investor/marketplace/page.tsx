'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { PropertyCard } from '@/components/marketplace/property-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { generateMockProperties } from '@/lib/mock-data/properties'
import { Property } from '@/lib/types'
import { Search, Filter } from 'lucide-react'

export default function MarketplacePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filtered, setFiltered] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('All')
  const [minYield, setMinYield] = useState(0)

  useEffect(() => {
    // Generate mock properties
    setProperties(generateMockProperties(12))
  }, [])

  useEffect(() => {
    let result = properties

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // City filter
    if (selectedCity !== 'All') {
      result = result.filter((p) => p.city === selectedCity)
    }

    // Yield filter
    if (minYield > 0) {
      result = result.filter((p) => p.expectedYield >= minYield)
    }

    setFiltered(result)
  }, [properties, searchTerm, selectedCity, minYield])

  const cities = ['All', ...new Set(properties.map((p) => p.city))]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Real Estate Investment Marketplace</h1>
          <p className="text-muted-foreground text-lg">
            Browse and invest in premium fractional real estate properties
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search properties, cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Inline Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <div className="flex flex-wrap gap-2">
                  {cities.map((city) => (
                    <Button
                      key={city}
                      variant={selectedCity === city ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCity(city)}
                      className="text-xs"
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Minimum Yield */}
              <div className="space-y-2">
                <label htmlFor="yield" className="text-sm font-medium">
                  Min. Yield: {minYield}%
                </label>
                <input
                  id="yield"
                  type="range"
                  min="0"
                  max="15"
                  value={minYield}
                  onChange={(e) => setMinYield(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Active Properties Count */}
              <div className="flex items-end">
                <div>
                  <p className="text-sm text-muted-foreground">Showing</p>
                  <p className="text-lg font-semibold">
                    {filtered.length} of {properties.length} Properties
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Filter size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No properties found</p>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  )
}

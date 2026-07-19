'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Building2, TrendingUp, Users, MapPin, Search, Filter, MoreVertical, Eye, Edit2, Trash2, BarChart3, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Property {
  id: string
  name: string
  location: string
  city: string
  type: 'Residential' | 'Commercial' | 'Mixed'
  units: number
  unitPrice: number
  occupancy: number
  revenue: number
  status: 'Active' | 'Pending' | 'Sold Out'
  listedDate: string
  image: string
}

const PROPERTIES: Property[] = [
  {
    id: 'PROP001',
    name: 'Prestige Heights Mumbai',
    location: 'Bandra, Mumbai',
    city: 'Mumbai',
    type: 'Residential',
    units: 500,
    unitPrice: 125000,
    occupancy: 92,
    revenue: 5750000,
    status: 'Active',
    listedDate: '2024-01-15',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a9a6fded0?w=400&h=300&fit=crop',
  },
  {
    id: 'PROP002',
    name: 'Golden Gate Plaza Bangalore',
    location: 'Whitefield, Bangalore',
    city: 'Bangalore',
    type: 'Commercial',
    units: 300,
    unitPrice: 185000,
    occupancy: 88,
    revenue: 4920000,
    status: 'Active',
    listedDate: '2024-02-20',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop',
  },
  {
    id: 'PROP003',
    name: 'Skyline Towers Delhi',
    location: 'Gurugram, Delhi NCR',
    city: 'Delhi',
    type: 'Residential',
    units: 600,
    unitPrice: 95000,
    occupancy: 100,
    revenue: 5700000,
    status: 'Sold Out',
    listedDate: '2023-11-10',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
  },
  {
    id: 'PROP004',
    name: 'Tech Park Hyderabad',
    location: 'HITEC City, Hyderabad',
    city: 'Hyderabad',
    type: 'Commercial',
    units: 250,
    unitPrice: 155000,
    occupancy: 76,
    revenue: 2945000,
    status: 'Active',
    listedDate: '2024-03-05',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
  },
]

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = PROPERTIES.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
    const matchCity = !filterCity || p.city === filterCity
    const matchType = !filterType || p.type === filterType
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchCity && matchType && matchStatus
  })

  const stats = {
    total: PROPERTIES.length,
    active: PROPERTIES.filter(p => p.status === 'Active').length,
    totalUnits: PROPERTIES.reduce((s, p) => s + p.units, 0),
    totalRevenue: PROPERTIES.reduce((s, p) => s + p.revenue, 0),
  }

  return (
    <AppLayout title="Properties" subtitle="Manage your property portfolio" requiredRole="developer">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Properties', value: stats.total, icon: Building2, color: 'var(--primary)' },
            { label: 'Active Listings', value: stats.active, icon: BarChart3, color: 'var(--gain)' },
            { label: 'Total Units', value: stats.totalUnits, icon: Users, color: '#f59e0b' },
            { label: 'Total Revenue', value: `₹${(stats.totalRevenue / 10000000).toFixed(1)}Cr`, icon: TrendingUp, color: '#8b5cf6' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
              </div>
              <div className="text-xl font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-popover border-border h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              className="h-9 px-3 rounded-lg bg-popover border border-border text-sm text-foreground"
            >
              <option value="">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-9 px-3 rounded-lg bg-popover border border-border text-sm text-foreground"
            >
              <option value="">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed">Mixed</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-lg bg-popover border border-border text-sm text-foreground"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Sold Out">Sold Out</option>
            </select>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(property => (
            <div key={property.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group">
              {/* Image */}
              <div className="relative h-32 bg-muted overflow-hidden">
                <img src={property.image} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  property.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                  property.status === 'Sold Out' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {property.status}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">{property.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin size={11} />
                      {property.location}
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-muted rounded p-2">
                    <span className="text-muted-foreground block">Units</span>
                    <span className="font-semibold text-foreground">{property.units}</span>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <span className="text-muted-foreground block">Occupancy</span>
                    <span className={`font-semibold ${property.occupancy >= 90 ? 'text-green-500' : property.occupancy >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {property.occupancy}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Eye size={12} className="mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Edit2 size={12} className="mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-3">
                    <BarChart3 size={12} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

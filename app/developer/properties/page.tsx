'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Property } from '@/lib/types'
import { 
  Building2, PlusCircle, Loader2, IndianRupee, Eye, TrendingUp, 
  Settings, MapPin, Star, Edit2, Search, Filter, ArrowUpDown, XCircle, AlertCircle, CheckCircle2 
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { subscribeDeveloperProperties } from '@/lib/developer-properties'

export default function DeveloperPropertiesPage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_approval' | 'rejected'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'price_desc' | 'price_asc' | 'views'>('newest')

  useEffect(() => {
    if (sessionLoading) {
      setIsLoading(true)
      return
    }

    setIsLoading(true)
    const unsubscribe = subscribeDeveloperProperties(user, (props) => {
      setProperties(props)
      setIsLoading(false)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user, sessionLoading])

  // Process Search, Filter, and Sorting
  const filteredAndSortedProperties = useMemo(() => {
    let result = [...properties]

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p => {
        const name = (p.name || '').toLowerCase()
        const symbol = (p.symbol || '').toLowerCase()
        const city = (p.location && typeof p.location === 'object' ? p.location?.city : p.city || '').toLowerCase()
        const desc = (p.description || '').toLowerCase()
        return name.includes(q) || symbol.includes(q) || city.includes(q) || desc.includes(q)
      })
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    // 3. Type filter
    if (typeFilter !== 'all') {
      result = result.filter(p => (p.type || '').toLowerCase() === typeFilter.toLowerCase())
    }

    // 4. Sort By
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return timeB - timeA
      }
      if (sortBy === 'oldest') {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return timeA - timeB
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'price_desc') {
        return (b.unitPrice || 0) - (a.unitPrice || 0)
      }
      if (sortBy === 'price_asc') {
        return (a.unitPrice || 0) - (b.unitPrice || 0)
      }
      if (sortBy === 'views') {
        return (b.viewCount || 0) - (a.viewCount || 0)
      }
      return 0
    })

    return result
  }, [properties, searchQuery, statusFilter, typeFilter, sortBy])

  const propertyTypes = useMemo(() => {
    const types = new Set(properties.map(p => p.type).filter(Boolean))
    return Array.from(types)
  }, [properties])

  return (
    <AppLayout requiredRole="developer" title="My Properties">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Property Portfolio</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your listed properties, track application status, and view performance.</p>
          </div>
          <Button size="sm" onClick={() => router.push('/developer/list')} className="gap-2 rounded-xl font-bold shadow-md shadow-primary/20 transition-all h-11 px-5">
            <PlusCircle className="w-4 h-4" /> List New Property
          </Button>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-card/60 backdrop-blur-xl border border-border/60 p-4 rounded-2xl shadow-sm">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by property name, symbol, city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background text-sm rounded-xl"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Statuses ({properties.length})</option>
              <option value="active">Active / Live ({properties.filter(p => p.status === 'active').length})</option>
              <option value="pending_approval">Pending Approval ({properties.filter(p => p.status === 'pending_approval').length})</option>
              <option value="rejected">Rejected ({properties.filter(p => p.status === 'rejected').length})</option>
            </select>
          </div>

          {/* Property Type Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
            >
              <option value="all">All Types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="md:col-span-3 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Name (A - Z)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="views">Sort: Views (Most Popular)</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="overflow-hidden border border-border/40 rounded-2xl flex flex-col lg:flex-row bg-card/40 animate-pulse h-64">
                <div className="w-full lg:w-80 h-full bg-muted/60" />
                <div className="p-6 flex-1 space-y-4">
                  <div className="h-6 w-1/3 bg-muted/60 rounded" />
                  <div className="h-4 w-1/4 bg-muted/40 rounded" />
                  <div className="grid grid-cols-4 gap-4 pt-4">
                    <div className="h-10 bg-muted/30 rounded" />
                    <div className="h-10 bg-muted/30 rounded" />
                    <div className="h-10 bg-muted/30 rounded" />
                    <div className="h-10 bg-muted/30 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedProperties.length === 0 ? (
          <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 rounded-2xl bg-card/30 backdrop-blur-sm text-center shadow-none p-6">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-foreground">
              {properties.length === 0 ? 'No Properties Listed Yet' : 'No Matching Properties Found'}
            </h3>
            <p className="text-muted-foreground font-medium mt-2 max-w-sm text-sm">
              {properties.length === 0 
                ? "Start listing your properties to raise capital and engage with verified real estate investors." 
                : "Try adjusting your search criteria or clearing filters to see listed properties."}
            </p>
            {properties.length === 0 ? (
              <Button size="sm" onClick={() => router.push('/developer/list')} variant="outline" className="mt-6 gap-2 rounded-xl h-11 px-5 font-bold">
                <PlusCircle className="w-4 h-4 text-primary" /> List your first property
              </Button>
            ) : (
              <Button size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }} variant="outline" className="mt-6 gap-2 rounded-xl">
                Reset All Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredAndSortedProperties.map((property) => {
              const pctSold = property.totalUnits > 0 ? ((property.unitsSold || 0) / property.totalUnits) * 100 : 0
              const marketCap = (property.marketData?.currentPrice || property.unitPrice) * (property.totalUnits || 0)
              const status = property.status || 'pending_approval'

              return (
                <Card key={property.id} className={`overflow-hidden border transition-all rounded-2xl flex flex-col lg:flex-row bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-xl group ${
                  status === 'rejected' ? 'border-rose-500/40 bg-rose-500/5' : 
                  status === 'pending_approval' ? 'border-amber-500/30 bg-amber-500/5' : 
                  'border-border/50 hover:border-primary/40'
                }`}>
                  {/* Left Side: Image & Tags */}
                  <div className="relative w-full lg:w-80 h-64 lg:h-auto shrink-0 bg-muted overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground relative z-10 bg-gradient-to-br from-muted to-background">
                        <Building2 className="h-16 w-16 opacity-20" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                      <span className="bg-background/90 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-border flex items-center gap-1.5 font-mono">
                        {property.symbol}
                      </span>
                      <span className="bg-background/90 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-border flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-indigo-500" /> {property.viewCount || 0}
                      </span>
                      <span className="bg-background/90 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-border flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" /> {property.watchlistCount || 0}
                      </span>
                    </div>
                    
                    <div className="absolute top-4 right-4 z-20">
                      <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-1.5 ${
                        status === 'active' ? 'bg-emerald-500 text-white border-emerald-400' : 
                        status === 'pending_approval' ? 'bg-amber-500 text-white border-amber-400' : 
                        'bg-rose-500 text-white border-rose-400'
                      }`}>
                        {status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : status === 'pending_approval' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        {status === 'active' ? 'Active / Live' : status === 'pending_approval' ? 'Pending Approval' : 'Rejected'}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <h3 className="text-white font-extrabold text-xl leading-tight line-clamp-1">{property.name}</h3>
                      <p className="text-white/90 text-xs font-medium flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> 
                        {property.location && typeof property.location === 'object' ? property.location.areaLocality || property.location.city : property.location}, {property.location && typeof property.location === 'object' ? property.location.state : property.city}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Details & Actions */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    {/* Status Banners */}
                    {status === 'rejected' && (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-600 block">Application Rejected by Admin</span>
                            <span className="text-muted-foreground italic">"{property.adminMessage || 'Details require revision.'}"</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => router.push(`/developer/list?edit=${property.symbol}`)}
                          className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10 shrink-0 rounded-xl font-bold gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit & Resubmit Property
                        </Button>
                      </div>
                    )}

                    {status === 'pending_approval' && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3 text-xs text-amber-700 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>This property application is under review by Milestono Admin. You will be notified upon approval.</span>
                      </div>
                    )}

                    {status === 'active' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-600 font-bold">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Live on Marketplace & Developer Hub</span>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/properties/${property.symbol}`)} className="text-xs text-emerald-600 hover:bg-emerald-500/10 gap-1 h-7 rounded-lg">
                          View Live Page <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-background/60 p-4 rounded-xl border border-border/40">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Token Unit Price</span>
                        <span className="text-lg font-black font-mono text-foreground mt-0.5 block">
                          ₹{Number(property.marketData?.currentPrice || property.unitPrice || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Property Valuation</span>
                        <span className="text-lg font-black font-mono text-gain mt-0.5 block">
                          ₹{Number(marketCap || property.totalValue || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Units Sold / Available</span>
                        <span className="text-lg font-black font-mono text-foreground mt-0.5 block">
                          {property.unitsSold || 0} / {property.totalUnits || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Expected Yield</span>
                        <span className="text-lg font-black font-mono text-emerald-500 mt-0.5 block">
                          {property.expectedYield || property.rentalData?.expectedYield || 0}% p.a.
                        </span>
                      </div>
                    </div>

                    {/* Funding Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Token Sales Progress</span>
                        <span className="font-bold text-primary">{pctSold.toFixed(1)}% Sold</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pctSold}%` }} />
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/developer/properties/${property.symbol}`)}
                          className="rounded-xl font-bold text-xs h-10 px-4 gap-1.5 border-border/80 hover:bg-muted"
                        >
                          <Settings className="w-3.5 h-3.5 text-primary" /> Property Management & Inquiries
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => router.push(`/developer/list?edit=${property.symbol}`)}
                          className="rounded-xl font-bold text-xs h-10 px-4 gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-foreground" /> Edit Property Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

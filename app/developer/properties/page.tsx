'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property } from '@/lib/types'
import { Building2, PlusCircle, Loader2, IndianRupee, Eye, TrendingUp, Settings, MapPin, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function DeveloperPropertiesPage() {
  const router = useRouter()
  const { user } = useSession()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const developerId = user?.id

  useEffect(() => {
    if (!developerId) {
      if (user === null) setIsLoading(false)
      return
    }

    const q = query(collection(db, 'properties'), where('developerId', '==', developerId))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[]
      setProperties(docs)
      setIsLoading(false)
    }, (error) => {
      console.error('Realtime fetch error:', error)
      toast.error('Failed to sync live properties')
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [developerId, user])

  return (
    <AppLayout requiredRole="developer" title="My Properties">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 space-y-8 pb-20">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Property Portfolio</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your listed properties, update details, and view analytics.</p>
          </div>
          <Button size="sm" onClick={() => router.push('/developer/list')} className="gap-2 rounded-lg font-bold shadow-sm transition-all">
            <PlusCircle className="w-4 h-4" /> List New Property
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 rounded-xl bg-card/30 backdrop-blur-sm text-center shadow-none">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-foreground">No Properties Listed</h3>
            <p className="text-muted-foreground font-medium mt-2 max-w-sm text-sm">You haven't listed any properties yet. Start your journey by listing your first asset.</p>
            <Button size="sm" onClick={() => router.push('/developer/list')} variant="outline" className="mt-6 gap-2 rounded-lg">
              <PlusCircle className="w-4 h-4 text-primary" /> List your first property
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {properties.map((property) => {
              const pctSold = property.totalUnits > 0 ? ((property.unitsSold || 0) / property.totalUnits) * 100 : 0
              const marketCap = (property.marketData?.currentPrice || property.unitPrice) * (property.totalUnits || 0)

              return (
                <Card key={property.id} className="overflow-hidden border border-border/50 rounded-2xl flex flex-col lg:flex-row bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all group">
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
                    
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span className="bg-background/90 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-border flex items-center gap-1.5">
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
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-1 ${
                        property.status === 'active' ? 'bg-green-500/20 text-green-100 border-green-500/30' : 
                        property.status === 'pending_approval' ? 'bg-yellow-500/20 text-yellow-100 border-yellow-500/30' : 
                        'bg-background/80 text-foreground border-border'
                      }`}>
                        {property.status === 'pending_approval' ? 'Pending' : property.status}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <h3 className="text-white font-extrabold text-xl leading-tight line-clamp-1">{property.name}</h3>
                      <p className="text-white/90 text-xs font-medium flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> 
                        {typeof property.location === 'object' ? property.location.areaLocality || property.location.city : property.location}, {typeof property.location === 'object' ? property.location.state : property.city}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Details & Actions */}
                  <div className="p-6 lg:p-8 flex-1 flex flex-col relative z-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 flex-1">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">Current Price</p>
                        <p className="font-mono font-bold text-lg text-foreground flex items-center gap-1">
                          <IndianRupee className="w-4 h-4 text-muted-foreground" />
                          {(property.marketData?.currentPrice || property.unitPrice || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">Market Cap</p>
                        <p className="font-mono font-bold text-lg text-foreground flex items-center gap-1">
                          <IndianRupee className="w-4 h-4 text-muted-foreground" />
                          {marketCap >= 10000000 ? (marketCap / 10000000).toFixed(2) + ' Cr' : marketCap.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">Expected Yield</p>
                        <p className="font-mono font-bold text-lg text-gain flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {(property.expectedYield || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">Availability</p>
                        <p className="font-mono font-bold text-lg text-foreground">
                          {((property.totalUnits || 0) - (property.unitsSold || 0)).toLocaleString()} <span className="text-sm text-muted-foreground font-medium">left</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">Units Sold Progress</span>
                        <span className="text-xs font-bold font-mono">{pctSold.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${pctSold}%` }} 
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium">
                        <span>{property.unitsSold || 0} Sold</span>
                        <span>{property.totalUnits || 0} Total</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border/50">
                      <Button variant="outline" className="w-full sm:flex-1 h-11 rounded-xl bg-background/50 hover:bg-muted font-bold transition-all" onClick={() => router.push(`/developer/properties/${property.symbol}`)}>
                        <Settings className="w-4 h-4 mr-2 text-muted-foreground" /> Manage Property
                      </Button>
                      <Button variant="default" className="w-full sm:flex-1 h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 font-bold transition-all" onClick={() => router.push(`/properties/details/${developerId}/${property.symbol}`)}>
                        <Eye className="w-4 h-4 mr-2" /> View Public Listing
                      </Button>
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

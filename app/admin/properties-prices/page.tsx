'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property } from '@/lib/types'
import { Building2, Loader2, IndianRupee, TrendingUp, Settings, MapPin, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function AdminPropertiesPricesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const unsub = onSnapshot(query(collection(db, 'properties'), where('status', '==', 'active')), (snap) => {
      setProperties(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[])
      setIsLoading(false)
    }, (err) => {
      toast.error('Failed to load properties')
      setIsLoading(false)
    })
    return () => unsub()
  }, [])

  return (
    <AppLayout requiredRole="admin" title="Price Management">
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/10 via-background/80 to-background pointer-events-none -z-10" />
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Price Management</h1>
            <p className="text-muted-foreground mt-2 font-medium">Control global property prices, trigger appreciations, and monitor asset values.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 rounded-3xl bg-card/30 backdrop-blur-sm text-center shadow-none">
            <Building2 className="h-16 w-16 text-muted-foreground mb-6 opacity-30" />
            <h3 className="text-xl font-bold text-foreground">No Active Properties</h3>
            <p className="text-muted-foreground font-medium mt-2 max-w-md">There are currently no active properties being traded on the market.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden border border-border/50 rounded-3xl bg-card/60 backdrop-blur-xl flex flex-col shadow-xl hover:shadow-2xl transition-all group">
                <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
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
                  
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-background/80 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-border/50 flex items-center gap-1.5">
                      {property.symbol}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col relative z-20 bg-gradient-to-b from-transparent to-background/80">
                  <div>
                    <h3 className="font-extrabold text-xl line-clamp-1">{property.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-1 mt-1.5 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> 
                      {property.location && typeof property.location === 'object' ? property.location.areaLocality || property.location.city : property.location || property.city || 'Unknown Location'}
                      {(property.location && typeof property.location === 'object' && property.location.state) ? `, ${property.location.state}` : ''}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-6 mt-auto">
                    <div className="bg-muted/30 p-3 rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5">Trading Price</p>
                      <div className="flex items-center font-extrabold text-lg text-foreground">
                        <IndianRupee className="h-4 w-4 mr-0.5 text-primary" />
                        {(property.marketData?.currentPrice || property.unitPrice).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5">Net Appreciation</p>
                      <div className="font-extrabold text-lg text-green-500 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +{property.marketData?.changePct?.toFixed(2) || 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-border/50">
                    <Button className="w-full gap-2 h-12 rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors" onClick={() => router.push(`/admin/properties-prices/${property.id}`)}>
                      <Settings className="w-4 h-4" /> Manage Pricing Controls
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

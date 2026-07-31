'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, TrendingUp, IndianRupee, History, Building2, MapPin, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { Property } from '@/lib/types'

export default function AdminPropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [appreciationHist, setAppreciationHist] = useState<any[]>([])

  const [percentage, setPercentage] = useState('')
  const [targetDateStr, setTargetDateStr] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProperty()
    fetchHistory()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`)
      const json = await res.json()
      if (json.success && json.data) {
        setProperty(json.data)
      } else {
        toast.error('Failed to load property details')
      }
    } catch (e) {
      toast.error('Error fetching property')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/appreciate`)
      const json = await res.json()
      if (json.success) {
        setAppreciationHist(json.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAppreciate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!percentage || !targetDateStr) {
      toast.error('Please fill all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/appreciate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage: parseFloat(percentage),
          targetDateStr
        })
      })
      const json = await res.json()
      
      if (json.success) {
        toast.success('Appreciation schedule set!')
        setPercentage('')
        setTargetDateStr('')
        fetchProperty() // Refresh data
        fetchHistory()
      } else {
        toast.error(json.error || 'Failed to set appreciation')
      }
    } catch (e) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Property Details" requiredRole="admin">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!property) {
    return (
      <AppLayout title="Not Found" requiredRole="admin">
        <div className="p-6 text-center">Property not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Property Details" requiredRole="admin">
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Main Info Column */}
          <div className="flex-[2] space-y-8">
            <Card className="p-6 overflow-hidden relative group border-2">
              <div className="absolute top-0 right-0 p-4">
                 <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-widest uppercase">
                   {property.symbol}
                 </span>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-muted relative shrink-0">
                  {property.images && property.images.length > 0 ? (
                    <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ImageIcon className="w-8 h-8 opacity-20" /></div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-foreground">{property.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-2 font-medium">
                    <MapPin className="w-4 h-4" /> {typeof property.location === 'object' ? property.location.areaLocality || property.location.city : property.location}, {typeof property.location === 'object' ? property.location.state : property.city}
                  </p>
                  <p className="mt-4 text-sm max-w-xl text-muted-foreground leading-relaxed line-clamp-3">
                    {property.description}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="p-6">
                 <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2 mb-4">Financial Overview</h3>
                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-muted-foreground">Original Total Price</span>
                     <span className="font-semibold flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5 text-primary"/>{(property.investmentInfo?.totalPropertyPrice || 0).toLocaleString('en-IN')}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-muted-foreground">Original Unit Price</span>
                     <span className="font-semibold flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5 text-primary"/>{(property.unitPrice || 0).toLocaleString('en-IN')}</span>
                   </div>
                   <div className="flex justify-between items-center bg-primary/5 p-2 rounded-lg">
                     <span className="text-sm text-muted-foreground font-bold">Current Market Price</span>
                     <span className="font-bold text-primary flex items-center text-lg"><IndianRupee className="w-4 h-4 mr-0.5"/>{((property.marketData?.currentPrice || property.unitPrice) || 0).toLocaleString('en-IN')}</span>
                   </div>
                 </div>
               </Card>

               <Card className="p-6">
                 <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2 mb-4">Property Stats</h3>
                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-muted-foreground">Total Units</span>
                     <span className="font-semibold">{property.totalUnits}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-muted-foreground">Available Units</span>
                     <span className="font-semibold text-blue-500">{property.unitsAvailable}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-muted-foreground">Yield</span>
                     <span className="font-semibold text-green-500 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>{property.expectedYield}%</span>
                   </div>
                 </div>
               </Card>
            </div>
          </div>

          {/* Appreciation Sidebar */}
          <div className="flex-[1.2] space-y-6">
            <Card className="p-6 bg-card border-border shadow-lg">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                Set Price Appreciation
              </h3>

              <form onSubmit={handleAppreciate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Appreciation (%)</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 15.5" 
                    value={percentage}
                    onChange={e => setPercentage(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">The percentage increase from the current market price.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Date</label>
                  <Input 
                    type="date" 
                    value={targetDateStr}
                    onChange={e => setTargetDateStr(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">The date by which this appreciation should be fully realized.</p>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirm Appreciation'}
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2 mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> History
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {appreciationHist.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No appreciation records found.</p>
                ) : (
                  appreciationHist.map((hist, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-l-2 border-primary pl-3 py-1">
                      <div>
                        <p className="font-semibold text-foreground">+{hist.percentage}%</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(hist.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Target: {new Date(hist.targetDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-muted-foreground">Admin</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}

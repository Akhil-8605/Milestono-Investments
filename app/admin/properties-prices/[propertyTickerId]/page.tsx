'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Property, AppreciationSchedule } from '@/lib/types'
import { Building2, Loader2, IndianRupee, TrendingUp, ChevronLeft, Calendar, Percent, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { numberToIndianWords } from '@/lib/utils'

export default function AdminSetAppreciationPage() {
  const router = useRouter()
  const params = useParams()
  const propertyTickerId = params.propertyTickerId as string

  const [property, setProperty] = useState<Property | null>(null)
  const [history, setHistory] = useState<AppreciationSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [appreciationForm, setAppreciationForm] = useState({ percentage: '', targetDate: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!propertyTickerId) return
    
    const qProp = query(collection(db, 'properties'), where('symbol', '==', propertyTickerId))
    const unsubscribe = onSnapshot(qProp, (snap) => {
      if (!snap.empty) {
        setProperty({ id: snap.docs[0].id, ...snap.docs[0].data() } as Property)
      } else {
        toast.error('Property not found')
      }
      setIsLoading(false)
    }, (error) => {
      console.error('[Admin Pricing] Realtime Error:', error)
      toast.error('Failed to sync live data')
      setIsLoading(false)
    })
    
    return () => unsubscribe()
  }, [propertyTickerId])

  useEffect(() => {
    if (property?.id) {
      fetchHistory(property.id)
    }
  }, [property?.id])

  const fetchHistory = async (propId: string) => {
    try {
      const histRes = await fetch(`/api/admin/properties/${propId}/appreciate`)
      const histData = await histRes.json()

      if (histData.success) setHistory(histData.data)

    } catch (e) {
      toast.error('Failed to load data')
    }
  }

  const handleSetAppreciation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property?.id) return

    setIsSubmitting(true)

    const percentage = parseFloat(appreciationForm.percentage)
    if (isNaN(percentage)) {
      toast.error('Invalid percentage')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch(`/api/admin/properties/${property.id}/appreciate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage,
          targetDateStr: appreciationForm.targetDate
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchHistory(property.id) // Refresh history only, property updates automatically via onSnapshot
        setAppreciationForm({ percentage: '', targetDate: '' })
      } else {
        toast.error(data.error || 'Failed to set appreciation')
      }
    } catch (e) {
      toast.error('Failed to set appreciation')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return (
    <AppLayout requiredRole="admin">
      <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
    </AppLayout>
  )

  if (!property) return null

  const currentPrice = property.marketData?.currentPrice || property.unitPrice

  return (
    <AppLayout requiredRole="admin" title="Set Appreciation">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg" onClick={() => router.push('/admin/properties')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md font-bold text-xs border border-primary/20">
                  {property.symbol}
                </span>
                <span className="bg-muted px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-500" /> Admin Access
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{property.name} Pricing</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage dynamic appreciation schedules and valuation algorithms.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 shadow-sm border border-border relative overflow-hidden">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 block">Current Base Price</span>
              <span className="text-3xl font-extrabold flex items-center mt-2 text-foreground font-mono">
                <IndianRupee className="w-6 h-6 mr-1 text-primary" />
                {currentPrice.toLocaleString('en-IN')}
              </span>
              <div className="flex flex-col gap-4 mt-8 pt-6 border-t relative z-10">
                 <div className="flex justify-between items-center">
                   <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider">Total Units</p>
                   <p className="font-semibold text-sm">{property.totalUnits.toLocaleString()}</p>
                 </div>
                 <div className="flex justify-between items-center">
                   <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider">Market Cap</p>
                   <p className="font-semibold text-sm">₹{(currentPrice * property.totalUnits / 10000000).toFixed(2)} Cr</p>
                 </div>
              </div>
            </Card>

            {/* Set Appreciation Module */}
            <Card className="p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <TrendingUp className="w-4 h-4 text-primary" /> 
                </div>
                Schedule Appreciation
              </h3>
              <form onSubmit={handleSetAppreciation} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5" /> Percentage Target (+/-)
                  </label>
                  <Input 
                    required 
                    type="number" 
                    step="0.01"
                    className="h-10 rounded-lg font-medium text-sm"
                    placeholder="e.g. 1.5 or -1.0" 
                    value={appreciationForm.percentage}
                    onChange={e => setAppreciationForm(prev => ({...prev, percentage: e.target.value}))}
                  />
                  <p className="text-xs text-muted-foreground">Total percentage change from current base.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Target Completion Date
                  </label>
                  <Input 
                    required 
                    type="date"
                    className="h-10 rounded-lg font-medium text-sm"
                    min={new Date().toISOString().split('T')[0]}
                    value={appreciationForm.targetDate}
                    onChange={e => setAppreciationForm(prev => ({...prev, targetDate: e.target.value}))}
                  />
                  <p className="text-xs text-muted-foreground">Algorithmic daily interpolation applied.</p>
                </div>

                {appreciationForm.percentage && appreciationForm.targetDate && (() => {
                  const pct = parseFloat(appreciationForm.percentage)
                  if (isNaN(pct)) return null
                  const targetPrice = currentPrice * (1 + (pct / 100))
                  const today = new Date()
                  today.setHours(0,0,0,0)
                  const target = new Date(appreciationForm.targetDate)
                  target.setHours(0,0,0,0)
                  const daysDifference = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24))
                  if (daysDifference < 0) return null
                  const steps = daysDifference + 1
                  const diff = targetPrice - currentPrice
                  const dailyInc = diff / steps
                  const priceToday = currentPrice + dailyInc
                  
                  return (
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-sm leading-relaxed text-foreground mt-4 shadow-inner">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="w-full">
                          <p className="mb-2 text-xs">Preview: Asset price adjusted by <strong className="text-primary">{pct}%</strong>.</p>
                          <div className="flex justify-between items-center bg-background/50 p-2 rounded-md mb-1 text-xs">
                            <span className="text-muted-foreground">Today's Price Jump:</span>
                            <strong className="font-mono">₹{Math.round(priceToday).toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="flex justify-between items-center bg-background/50 p-2 rounded-md mb-1 text-xs">
                            <span className="text-muted-foreground">Target ({format(target, 'MMM dd')}):</span>
                            <strong className="font-mono">₹{Math.round(targetPrice).toLocaleString('en-IN')}</strong>
                          </div>
                          <p className="text-[10px] text-primary text-right italic">{numberToIndianWords(Math.round(targetPrice))} Rupees</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <Button type="submit" className="w-full mt-2 rounded-lg font-semibold transition-all" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Processing...' : 'Apply Schedule'}
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 shadow-sm border border-border h-full flex flex-col">
              <h3 className="text-lg font-bold mb-6 border-b pb-4">Appreciation History Log</h3>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-xl flex-1">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No appreciation schedules recorded.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border flex-1">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-5 py-3">Timestamp</th>
                        <th className="px-5 py-3 text-center">Delta</th>
                        <th className="px-5 py-3 text-right">Base Price</th>
                        <th className="px-5 py-3 text-right">Target Price</th>
                        <th className="px-5 py-3 text-right">Target Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {history.map((record) => (
                        <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-xs text-muted-foreground">{format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm')}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${record.percentage >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                              {record.percentage > 0 ? '+' : ''}{record.percentage}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">₹{record.basePrice?.toLocaleString('en-IN') || '-'}</td>
                          <td className="px-5 py-3 text-right font-mono font-medium text-foreground">₹{record.targetPrice?.toLocaleString('en-IN') || '-'}</td>
                          <td className="px-5 py-3 text-right font-medium text-xs text-muted-foreground">{format(new Date(record.targetDate), 'MMM dd, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Property, Investment } from '@/lib/types'
import { Loader2, TrendingUp, TrendingDown, ArrowLeft, BarChart3, PieChart, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PortfolioDetailPage({ params }: { params: Promise<{ propertyTickerId: string }> }) {
  const router = useRouter()
  const { user } = useSession()
  const resolvedParams = use(params)
  
  const [property, setProperty] = useState<Property | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        // 1. Fetch Property
        const pQ = query(collection(db, 'properties'), where('symbol', '==', resolvedParams.propertyTickerId))
        const pSnap = await getDocs(pQ)
        if (pSnap.empty) {
          toast.error('Property not found')
          router.push('/investor/portfolio')
          return
        }
        const prop = { id: pSnap.docs[0].id, ...pSnap.docs[0].data() } as Property
        setProperty(prop)

        // 2. Fetch Investments for this property by this user
        const iQ = query(
          collection(db, 'investments'),
          where('userId', '==', user.id),
          where('propertyId', '==', prop.id)
        )
        const iSnap = await getDocs(iQ)
        const invs = iSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment))
        setInvestments(invs)
      } catch (err) {
        toast.error('Failed to load portfolio details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user, resolvedParams.propertyTickerId, router])

  if (isLoading || !property) {
    return (
      <AppLayout requiredRole="investor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  // Aggregate Investment Data
  const totalUnits = investments.reduce((sum, inv) => sum + inv.unitsOwned, 0)
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0)
  const avgEntryPrice = totalUnits > 0 ? totalInvested / totalUnits : 0
  
  const currentPrice = property.marketData?.currentPrice ?? property.unitPrice ?? 0
  const currentValue = totalUnits * currentPrice
  
  const pnl = currentValue - totalInvested
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0
  const isUp = pnl >= 0

  // Mock Price History if property doesn't have one (for MVP demonstration)
  const chartData = property.priceHistory?.map((ph: { timestamp: string | number | Date; price: any }) => ({
    date: format((ph.timestamp as any)?.toDate ? (ph.timestamp as any).toDate() : new Date(ph.timestamp), 'MMM dd'),
    price: ph.price
  })) || Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (14 - i))
    return {
      date: format(d, 'MMM dd'),
      price: currentPrice * (1 - (14 - i) * 0.005) // Simulated slight uptrend
    }
  })

  // Add current price to the end
  if (!property.priceHistory) {
    chartData.push({ date: 'Today', price: currentPrice })
  }

  return (
    <AppLayout requiredRole="investor" title={`${property.symbol} Analytics`}>
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8 relative">
        
        {/* Background glow */}
        <div className="fixed top-[20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* Header */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/50 pb-6">
          <div>
            <Link href="/investor/portfolio" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {property.symbol}
              </span>
              <span className="text-muted-foreground text-sm font-semibold">{property.city}</span>
            </div>
            <h1 className="text-4xl font-black text-foreground">{property.name}</h1>
          </div>
          
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 p-6 rounded-3xl shadow-sm text-right min-w-[250px]">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Live Valuation</p>
            <p className="text-4xl font-mono font-black text-foreground">₹{currentValue.toLocaleString('en-IN')}</p>
            <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-bold ${isUp ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')} ({isUp ? '+' : ''}{pnlPct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {totalUnits === 0 && (
          <div className="relative z-10 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-600 dark:text-amber-400 font-medium">
            You do not hold any verified units of this property. If you recently purchased, it may be pending admin verification.
          </div>
        )}

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Chart Section */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-8 border-border/50 bg-card/60 backdrop-blur-xl rounded-[2rem] shadow-lg">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Performance Analytics</h3>
                <div className="flex gap-2">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-bold">Price vs Entry</span>
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Price']}
                    />
                    
                    {avgEntryPrice > 0 && (
                      <ReferenceLine y={avgEntryPrice} stroke="#f59e0b" strokeDasharray="5 5" label={{ position: 'top', value: 'Your Entry Price', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                    )}

                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      dot={false}
                      activeDot={{ r: 8, fill: '#10b981', stroke: '#000', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Individual Tranches */}
            <h3 className="text-xl font-bold mt-10 mb-4">Investment Tranches</h3>
            <div className="grid grid-cols-1 gap-4">
              {investments.map(inv => {
                const trPnl = (currentPrice * inv.unitsOwned) - inv.amountInvested
                const trPnlPct = (trPnl / inv.amountInvested) * 100
                const isTrUp = trPnl >= 0
                return (
                  <div key={inv.id} className="flex justify-between items-center p-5 bg-card/40 border border-border/50 rounded-2xl hover:bg-card/60 transition-colors">
                    <div>
                      <p className="font-bold text-lg">{inv.unitsOwned.toLocaleString()} Units</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                        Bought on {format((inv.purchasedAt as any)?.toDate ? (inv.purchasedAt as any).toDate() : new Date(), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold">@ ₹{inv.unitPrice.toLocaleString('en-IN')}</p>
                      <p className={`text-sm font-bold ${isTrUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isTrUp ? '+' : ''}{trPnlPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Key Metrics Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 border-border/50 bg-card/60 backdrop-blur-xl rounded-[2rem] shadow-lg">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-500" /> Investment Summary</h3>
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Units Owned</p>
                  <p className="text-2xl font-mono font-black">{totalUnits.toLocaleString()}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Capital Deployed</p>
                  <p className="text-2xl font-mono font-black">₹{totalInvested.toLocaleString('en-IN')}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Average Entry Price</p>
                  <p className="text-2xl font-mono font-black">₹{avgEntryPrice.toLocaleString('en-IN')}</p>
                </div>

                <div className="space-y-1 pt-4 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Current Market Price</p>
                  <p className="text-3xl font-mono font-black text-primary">₹{currentPrice.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border/50 space-y-3">
                <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl" onClick={() => router.push(`/investor/buy/${property.symbol}`)}>
                  Buy More Units
                </Button>
                <Button variant="outline" className="w-full h-14 text-lg font-bold rounded-xl bg-background/50">
                  Sell Units
                </Button>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

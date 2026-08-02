'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Building2, MapPin, Download, Briefcase, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function PortfolioDetailsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const router = useRouter()
  const { user } = useSession()
  const resolvedParams = use(params)
  
  const [property, setProperty] = useState<any>(null)
  const [investments, setInvestments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user) return
      try {
        const propQ = query(collection(db, 'properties'), where('symbol', '==', resolvedParams.symbol))
        const propSnap = await getDocs(propQ)
        if (propSnap.empty) {
          toast.error('Property not found')
          router.push('/investor/portfolio')
          return
        }
        const propData = { id: propSnap.docs[0].id, ...propSnap.docs[0].data() } as any
        setProperty(propData)

        const invQ = query(
          collection(db, 'investments'),
          where('userId', '==', user.id),
          where('propertyId', '==', propData.id)
        )
        const invSnap = await getDocs(invQ)
        const invs = invSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setInvestments(invs)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load portfolio details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetails()
  }, [user, resolvedParams.symbol, router])

  if (isLoading || !property) {
    return (
      <AppLayout requiredRole="investor">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  const totalUnits = investments.reduce((acc, inv) => acc + (inv.unitsOwned || 0), 0)
  const totalInvested = investments.reduce((acc, inv) => acc + (inv.amountInvested || 0), 0)
  
  const currentPrice = property.marketData?.currentPrice || property.unitPrice
  const totalCurrentValue = totalUnits * currentPrice
  const totalPL = totalCurrentValue - totalInvested
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0
  const isUp = totalPL >= 0

  const chartData = property.marketData?.priceHistory?.map((h: any) => {
    const d = new Date(h.date)
    return {
      date: isNaN(d.getTime()) ? h.date : format(d, 'MMM dd'),
      price: h.price
    }
  }) || []

  return (
    <AppLayout requiredRole="investor" title={`Portfolio: ${property.symbol}`}>
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8 pb-32">
        <button onClick={() => router.push('/investor/portfolio')} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Portfolio
        </button>

        {/* Header Section */}
        <div className="bg-card border rounded-[2rem] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black border border-primary/20">
                {property.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-black">{property.symbol}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded text-muted-foreground">{property.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <MapPin className="w-4 h-4" /> {property.city} • {property.name}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none gap-2 font-bold" onClick={() => router.push(`/properties/${property.id}`)}>
                <Activity className="w-4 h-4" /> Market View
              </Button>
              <Button className="flex-1 md:flex-none gap-2 font-bold">
                Trade Asset
              </Button>
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 rounded-2xl border bg-card/60">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Total Invested</p>
            <p className="text-2xl font-mono font-black">{fmt(totalInvested)}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Price: {fmt(totalInvested / totalUnits)}</p>
          </Card>
          <Card className="p-6 rounded-2xl border bg-card/60">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Current Value</p>
            <p className="text-2xl font-mono font-black">{fmt(totalCurrentValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">LTP: {fmt(currentPrice)}</p>
          </Card>
          <Card className="p-6 rounded-2xl border bg-card/60">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Total Returns</p>
            <p className={`text-2xl font-mono font-black flex items-center gap-2 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isUp ? '+' : ''}{fmt(totalPL)}
            </p>
            <p className={`text-xs font-bold mt-1 ${isUp ? 'text-emerald-500/80' : 'text-rose-500/80'} flex items-center gap-1`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Math.abs(totalPLPct).toFixed(2)}% ROI
            </p>
          </Card>
          <Card className="p-6 rounded-2xl border bg-card/60">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Units Owned</p>
            <p className="text-2xl font-mono font-black">{totalUnits.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-500 font-bold">Yield: {property.expectedYield?.toFixed(1)}% p.a.</p>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <Card className="lg:col-span-2 p-6 rounded-[2rem] border bg-card shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Asset Performance
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                    formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <div className="space-y-6">
            <Card className="p-6 rounded-[2rem] border bg-card shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Holdings Breakdown
              </h3>
              <div className="space-y-4">
                {investments.map((inv, idx) => (
                  <div key={inv.id} className="bg-muted/30 p-4 rounded-xl border flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">Tranche {idx + 1}</p>
                      <p className="text-xs text-muted-foreground">{inv.unitsOwned} Units @ {fmt(inv.unitPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm">{fmt(inv.amountInvested)}</p>
                      <p className="text-[10px] text-muted-foreground">Invested</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="p-6 rounded-[2rem] border bg-gradient-to-br from-indigo-500/10 to-primary/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Building2 className="w-32 h-32" />
              </div>
              <h3 className="text-lg font-bold mb-2 relative z-10">Asset Documents</h3>
              <p className="text-sm text-muted-foreground mb-4 relative z-10">Download prospectuses, title reports, and ownership certificates.</p>
              <div className="space-y-3 relative z-10">
                <Button variant="secondary" className="w-full justify-between shadow-sm bg-background/80 hover:bg-background">
                  Title Report <Download className="w-4 h-4" />
                </Button>
                <Button variant="secondary" className="w-full justify-between shadow-sm bg-background/80 hover:bg-background">
                  Ownership Certificate <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

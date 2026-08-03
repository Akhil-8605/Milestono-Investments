'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Building2, MapPin, Download, Briefcase, Activity, ShieldCheck, DollarSign, Home, Percent, FileText, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
        const invs = invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
        setInvestments(invs.filter(i => i.status === 'active'))
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
  
  const currentPrice = property.marketData?.currentPrice || property.unitPrice || 0
  const totalCurrentValue = totalUnits * currentPrice
  const totalPL = totalCurrentValue - totalInvested
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0
  const isUp = totalPL >= 0

  let chartData = []
  if (property.marketData?.priceHistory && property.marketData.priceHistory.length > 0) {
    chartData = property.marketData.priceHistory.map((h: any) => {
      const d = new Date(h.date)
      return {
        date: isNaN(d.getTime()) ? h.date : format(d, 'MMM dd'),
        price: Number(h.price) || 0
      }
    })
  } else {
    // Robust mock generation avoiding NaN
    const startPrice = property.unitPrice || 100
    const endPrice = currentPrice || startPrice
    const diff = endPrice - startPrice
    const step = diff / 6
    const noise = Math.abs(step) * 0.2 || (startPrice * 0.05)
    
    chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i) * 5)
      let p = startPrice + (step * i)
      if (i !== 0 && i !== 6) p += (Math.random() * noise * 2) - noise
      if (i === 6) p = endPrice
      return {
        date: format(d, 'MMM dd'),
        price: Math.max(0, p)
      }
    })
  }

  const handleDownload = (docName: string) => {
    // Generate an HTML file as a mock document that looks a bit more realistic and downloads properly
    const htmlContent = `
      <html>
        <head>
          <title>${docName} - ${property.symbol}</title>
          <style>body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; } h1 { color: #1e3a8a; } .confidential { color: #dc2626; font-weight: bold; font-size: 12px; border: 1px solid #dc2626; padding: 4px 8px; display: inline-block; border-radius: 4px; }</style>
        </head>
        <body>
          <div class="confidential">STRICTLY CONFIDENTIAL</div>
          <h1>${docName}</h1>
          <h2>Asset: ${property.name || property.basicDetails?.propertyName} (${property.symbol})</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <hr />
          <p>This document certifies the valid ownership/entitlement associated with the tokenized asset listed on Milestono Investments.</p>
          <p>Location: ${property.city || property.basicDetails?.city}</p>
          <p>Units Tokenized: ${property.totalUnits}</p>
          <br><br>
          <p style="font-size: 12px; color: #666;">(Mock Document Output - Generated for Demo)</p>
        </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docName.replace(/\s+/g, '_')}_${property.symbol}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${docName} downloaded successfully`)
  }

  return (
    <AppLayout requiredRole="investor" title={`Portfolio: ${property.symbol}`}>
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8 pb-32">
        <button onClick={() => router.push('/investor/portfolio')} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-bold tracking-wide">
          <ArrowLeft className="w-4 h-4 mr-2" /> RETURN TO PORTFOLIO
        </button>

        {/* Header Section */}
        <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary/20">
                {property.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-3xl font-black text-foreground tracking-tight">{property.symbol}</h1>
                  <span className="text-xs font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-md">{property.type || property.basicDetails?.propertyType || 'Asset'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                  <MapPin className="w-4 h-4" /> {property.city || property.basicDetails?.city} • {property.name || property.basicDetails?.propertyName}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <Button className="flex-1 md:flex-none gap-2 font-bold h-12 px-6 rounded-xl shadow-lg" onClick={() => router.push(`/properties/${property.id}`)}>
                <ExternalLink className="w-4 h-4" /> View Market Listing
              </Button>
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 hover:bg-card transition-colors">
            <p className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Invested</p>
            <p className="text-3xl font-mono font-black text-foreground">{fmt(totalInvested)}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-2">Avg Buy: {fmt(totalUnits > 0 ? totalInvested / totalUnits : 0)}</p>
          </Card>
          <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 hover:bg-card transition-colors">
            <p className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Current Value</p>
            <p className="text-3xl font-mono font-black text-foreground">{fmt(totalCurrentValue)}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-2">LTP: {fmt(currentPrice)}</p>
          </Card>
          <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 hover:bg-card transition-colors">
            <p className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Total Returns</p>
            <p className={`text-3xl font-mono font-black flex items-center gap-2 ${isUp ? 'text-gain' : 'text-rose-500'}`}>
              {isUp ? '+' : ''}{fmt(totalPL)}
            </p>
            <p className={`text-xs font-bold mt-2 ${isUp ? 'text-gain' : 'text-rose-500'} flex items-center gap-1`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Math.abs(totalPLPct).toFixed(2)}% ROI
            </p>
          </Card>
          <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 hover:bg-card transition-colors">
            <p className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Units Owned</p>
            <p className="text-3xl font-mono font-black text-foreground">{totalUnits.toLocaleString()}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-2 text-primary">Yield: {(property.rentalData?.expectedYield || property.expectedYield || 8.5).toFixed(1)}% p.a.</p>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <Card className="lg:col-span-2 p-8 rounded-[2rem] border border-border/50 bg-card shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black flex items-center gap-2 text-foreground tracking-tight">
                <TrendingUp className="w-6 h-6 text-primary" /> Asset Value Trajectory
              </h3>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val).toLocaleString('en-IN')}`}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.3)' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '900', fontFamily: 'monospace', fontSize: '16px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fill="url(#colorPrice)"
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <div className="space-y-6">
            <Card className="p-8 rounded-[2rem] border border-border/50 bg-card shadow-sm">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2 tracking-tight">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Tranche Breakdown
              </h3>
              <div className="space-y-4">
                {investments.length > 0 ? investments.map((inv, idx) => (
                  <div key={inv.id} className="bg-muted/40 p-4 rounded-2xl border border-border/50 flex justify-between items-center hover:border-primary/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-foreground mb-0.5">Tranche {idx + 1}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{inv.unitsOwned} Units @ {fmt(inv.unitPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-black text-sm text-foreground">{fmt(inv.amountInvested)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Invested</p>
                    </div>
                  </div>
                )) : (
                   <p className="text-sm text-muted-foreground font-semibold">No active investments found.</p>
                )}
              </div>
            </Card>
            
            <Card className="p-8 rounded-[2rem] border border-border/50 bg-card shadow-sm">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2 tracking-tight">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Advanced Analytics
              </h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-border/50 pb-4">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Projected Annual Yield</span>
                  <span className="font-black text-emerald-500">{property.rentalData?.expectedYield || property.expectedYield || 8.5}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-4">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Percent className="w-4 h-4" /> Occupancy Rate</span>
                  <span className="font-black text-foreground">{property.rentalData?.occupancyRate || property.occupancyRate || 95}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-4">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Home className="w-4 h-4" /> Total Built Area</span>
                  <span className="font-bold font-mono text-foreground">{property.basicDetails?.totalArea || '1,250'} sqft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Asset Volatility</span>
                  <span className="font-bold text-emerald-500 uppercase text-[10px] tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Low Risk</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Documents Section */}
        <Card className="p-8 rounded-[2rem] border border-border/50 bg-gradient-to-br from-indigo-500/5 via-card to-primary/5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-10 opacity-[0.03] pointer-events-none">
            <Building2 className="w-64 h-64" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-2xl font-black mb-2 text-foreground tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" /> Asset Documentation
              </h3>
              <p className="text-sm font-medium text-muted-foreground">Download prospectuses, title reports, and official ownership certificates.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button onClick={() => handleDownload('Title Report')} variant="outline" className="justify-between bg-background shadow-sm hover:border-primary/50 font-bold h-12 px-6 rounded-xl">
                Title Report <Download className="w-4 h-4 ml-3" />
              </Button>
              <Button onClick={() => handleDownload('Ownership Certificate')} variant="default" className="justify-between bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-bold h-12 px-6 rounded-xl">
                Ownership Certificate <Download className="w-4 h-4 ml-3" />
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </AppLayout>
  )
}

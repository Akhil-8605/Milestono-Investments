'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Property } from '@/lib/types'
import { doc, onSnapshot, collection, query, where, updateDoc, arrayUnion, addDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSession } from '@/components/shell/session-context'
import { toast } from 'sonner'
import { Loader2, MapPin, TrendingUp, Star, Share2, Send, Building2, BarChart3, Clock, IndianRupee, ShieldCheck, ChevronLeft, ChevronRight, X, Phone, Mail, User2, Globe, FileText, FileStack, Map, Navigation, Bed, Bath, Trees, Layers, Landmark, CheckCircle2, ChevronDown, Lock } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { logPropertyView, logPropertyWatchlist } from '@/lib/interactions'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Percent, ShieldAlert } from 'lucide-react'
import { numberToIndianWords } from '@/lib/utils'
export default function AdminSetAppreciationPage() {
  const params = useParams()
  const propertyTickerId = params.propertyTickerId as string

  const [history, setHistory] = useState<any[]>([])
  const [appreciationForm, setAppreciationForm] = useState({ percentage: "", targetDate: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inquiryText, setInquiryText] = useState('')
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '1Y' | 'ALL'>('1M')
  const { user } = useSession()

  // fetchHistory is now handled via onSnapshot below

  const hasLoggedView = useRef(false)

  // Auto-play carousel
  useEffect(() => {
    if (!property?.images || property.images.length <= 1 || isOverlayOpen) return
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % property.images!.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [property?.images, isOverlayOpen])

  useEffect(() => {
    if (property && user && !hasLoggedView.current) {
      logPropertyView(property.id, property.symbol, property.developerId, user)
      hasLoggedView.current = true
    }
  }, [property, user])

  useEffect(() => {
    if (!propertyTickerId) return

    const qProp = query(collection(db, 'properties'), where('symbol', '==', propertyTickerId))
    const unsubscribe = onSnapshot(qProp, (snap) => {
      if (!snap.empty) {
        setProperty({ id: snap.docs[0].id, ...snap.docs[0].data() } as any)
      } else {
        toast.error('Property not found')
        router.push('/admin/properties')
      }
      setIsLoading(false)
    }, (error) => {
      console.error('[Admin Pricing] Realtime Error:', error)
      toast.error('Failed to sync live data')
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [propertyTickerId, router])

  

  const handleInquire = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please log in to send an inquiry')
      return
    }

    setIsSubmittingInquiry(true)
    try {
      await addDoc(collection(db, 'inquiries'), {
        propertyId: property?.id || propertyTickerId,
        propertyTicker: property?.symbol || '',
        userId: user.id,
        investorName: user.name,
        investorEmail: user.email,
        developerId: property?.developerId || property?.developerInfo?.id || null,
        message: inquiryText,
        status: 'new',
        createdAt: serverTimestamp()
      })
      toast.success('Inquiry sent successfully! The developer will contact you shortly.')
      setInquiryText('')
    } catch (err) {
      console.error('Failed to send inquiry:', err)
      toast.error('Failed to send inquiry')
    } finally {
      setIsSubmittingInquiry(false)
    }
  }

  const addToWatchlist = async () => {
    if (!user) {
      toast.error('Please log in to add to watchlist')
      return
    }
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, propertyId: property?.id || propertyTickerId }),
      })
      if (!res.ok) throw new Error('API failed')

      if (property) {
        await logPropertyWatchlist(property.id, property.symbol, property.developerId, user, 'add')
      }
      toast.success('Added to watchlist!')
    } catch (err) {
      console.error('Watchlist Error:', err)
      toast.error('Failed to update watchlist')
    }
  }

  useEffect(() => {
    if (!property?.id) return
    const unsub = onSnapshot(query(collection(db, 'appreciationSchedules'), where('propertyId', '==', property.id)), (snap) => {
      const hist = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      hist.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setHistory(hist)
    })
    return () => unsub()
  }, [property?.id])

  const handleSetAppreciation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property?.id) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/properties/${property.id}/appreciate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage: parseFloat(appreciationForm.percentage),
          targetDateStr: appreciationForm.targetDate
        })
      })
      
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to set appreciation')
      }
      
      toast.success('Appreciation schedule set successfully')
      setAppreciationForm({ percentage: "", targetDate: "" })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error setting appreciation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: property?.name || 'Milestono Investment',
      text: `Check out ${property?.name} (${property?.symbol}) fractional investment opportunity!`,
      url: window.location.href
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing', err)
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <AppLayout allowGuest hideSidebar title="Loading Asset...">
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!property) return null

  const currentPrice = property.marketData?.currentPrice ?? property.unitPrice ?? 0
  const changePct = property.marketData?.changePct ?? 0
  const isUp = changePct > 0
  const isFlat = changePct === 0
  const marketCap = currentPrice * (property.totalUnits || 0)

  const filterChartData = () => {
    if (!property?.marketData?.priceHistory) return []
    const hist = property.marketData.priceHistory
    if (timeframe === 'ALL' || hist.length === 0) return hist
    
    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    let cutoffMs = 0
    if (timeframe === '1W') cutoffMs = 7 * msPerDay
    if (timeframe === '1M') cutoffMs = 30 * msPerDay
    if (timeframe === '1Y') cutoffMs = 365 * msPerDay
    
    const cutoffDate = new Date(now.getTime() - cutoffMs)
    return hist.filter((point: any) => new Date(point.date) >= cutoffDate)
  }
  const chartData = filterChartData()

  const loc = typeof property.location === 'object' ? property.location : null
  const rawForm = (property as any).rawFormData || {}
  const specs = property.specifications || rawForm.specifications || null
  const inv = property.investmentInfo || rawForm.investmentInfo || null
  const dev = property.developerInfo || rawForm.developerInfo || null
  const basicDetails = property.basicDetails || rawForm.basicDetails || null

  return (
    <AppLayout requiredRole="admin" title={`${property.name} Pricing`}>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-32">
        {/* Advanced Ambient Glow (Theme Aware) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute top-[30%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[20%] w-[700px] h-[700px] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"></div>
        </div>

        {/* Hero Header section */}
        <header className="relative z-10 border-b border-border/50 bg-background/60 dark:bg-black/20 backdrop-blur-2xl pt-14 pb-8 px-6 md:px-12">
          <div className="w-[90vw] max-w-[95rem] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="space-y-5 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-extrabold text-sm shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                  {property.symbol}
                </span>
                <span className="bg-muted border border-border px-4 py-1.5 rounded-full text-xs font-bold uppercase text-muted-foreground">
                  {basicDetails?.propertyType || property.type}
                </span>
                {property.status === 'active' && (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Live Market
                  </span>
                )}
                {property.legalVerification?.reraNumber && (
                  <span className="bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" /> RERA Verified
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground max-w-3xl leading-tight">
                {property.name}
              </h1>

              <div className="flex items-center text-muted-foreground text-sm md:text-base font-medium">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {loc ? `${loc.areaLocality || loc.city}, ${loc.state}` : `${property.location}, ${property.city}`}
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end w-full lg:w-auto bg-card/60 dark:bg-card/40 border border-border/50 p-6 rounded-3xl backdrop-blur-md shadow-sm">
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-2">Live Trading Value (₹)</p>
              <div className="flex items-end gap-4 mb-5">
                <span className="text-5xl lg:text-6xl font-mono font-black tracking-tighter text-foreground drop-shadow-sm">
                  {currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={cn(
                  "flex items-center text-2xl font-bold mb-2 px-3 py-1 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm",
                  isFlat ? "text-muted-foreground" : isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {isFlat ? null : isUp ? <TrendingUp className="w-5 h-5 mr-1.5" /> : <TrendingUp className="w-5 h-5 mr-1.5 rotate-180" />}
                  {isUp && !isFlat ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-3 w-full">
                <Button variant="outline" className="flex-1 gap-2 transition-all h-12 rounded-xl backdrop-blur-md bg-background/50 hover:bg-background/80 shadow-sm" onClick={addToWatchlist}>
                  <Star className="w-4 h-4 text-amber-500" /> Watchlist
                </Button>
                <Button variant="outline" className="flex-1 gap-2 transition-all h-12 rounded-xl backdrop-blur-md bg-background/50 hover:bg-background/80 shadow-sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 text-primary" /> Share
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="w-[90vw] max-w-[95rem] mx-auto px-6 mt-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content (Left 8 Columns) */}
          <div className="lg:col-span-8 space-y-10">

            {/* Media Bento Box */}
            {property.images && property.images.length > 0 && (
              <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[500px]">
                <div
                  className="col-span-2 row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer border border-border/50 shadow-lg"
                  onClick={() => { setCurrentImageIndex(0); setIsOverlayOpen(true); }}
                >
                  <img src={property.images[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Main" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:opacity-60 transition-all duration-500" />
                </div>

                {property.images[1] ? (
                  <div
                    className="col-span-1 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer border border-border/50 shadow-md"
                    onClick={() => { setCurrentImageIndex(1); setIsOverlayOpen(true); }}
                  >
                    <img src={property.images[1]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Img 2" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-500" />
                  </div>
                ) : <div className="col-span-1 row-span-1 rounded-3xl bg-muted/50 border border-border/50 backdrop-blur-sm" />}

                {property.images[2] ? (
                  <div
                    className="col-span-1 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer border border-border/50 shadow-md flex items-center justify-center"
                    onClick={() => { setCurrentImageIndex(2); setIsOverlayOpen(true); }}
                  >
                    <img src={property.images[2]} className="absolute inset-0 w-full h-full object-cover brightness-[0.5] transition-all duration-1000 group-hover:scale-110 group-hover:brightness-[0.4]" alt="Img 3" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="bg-background/80 dark:bg-black/50 p-3 rounded-full backdrop-blur-md border border-border/50 text-foreground">
                        <Layers className="w-6 h-6" />
                      </div>
                      <span className="text-foreground text-xs font-bold uppercase tracking-widest bg-background/80 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-border/50 shadow-sm">View All {property.images.length}</span>
                    </div>
                  </div>
                ) : <div className="col-span-1 row-span-1 rounded-3xl bg-muted/50 border border-border/50 backdrop-blur-sm" />}
              </div>
            )}

            {/* Price Chart */}
            <div className="bg-card/60 dark:bg-card/40 border border-border/50 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg relative overflow-hidden group transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" /> Price Action
                </h3>
                <div className="flex bg-muted/50 rounded-xl p-1.5 border border-border/50 backdrop-blur-md">
                  {(['1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
                    <button 
                      key={tf} 
                      onClick={() => setTimeframe(tf)}
                      className={cn("px-5 py-2 rounded-lg text-xs font-bold transition-all", tf === timeframe ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[350px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isFlat ? "hsl(var(--muted-foreground))" : isUp ? "hsl(142.1 76.2% 36.3%)" : "hsl(346.8 77.2% 49.8%)"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isFlat ? "hsl(var(--muted-foreground))" : isUp ? "hsl(142.1 76.2% 36.3%)" : "hsl(346.8 77.2% 49.8%)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} 
                      dy={15} 
                      minTickGap={30} 
                      tickFormatter={(value) => {
                        try {
                          const date = new Date(value);
                          if (isNaN(date.getTime())) return String(value);
                          return format(date, 'MMM d, h:mm a');
                        } catch { return String(value) }
                      }}
                    />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`} dx={-15} orientation="right" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', fontSize: '16px' }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Price']}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                      labelFormatter={(label) => {
                        try {
                          const date = new Date(label);
                          if (isNaN(date.getTime())) return String(label);
                          return format(date, 'MMM d, yyyy, h:mm a');
                        } catch { return String(label) }
                      }}
                    />
                    <Area type="monotone" dataKey="price" stroke={isFlat ? "hsl(var(--muted-foreground))" : isUp ? "hsl(142.1 76.2% 36.3%)" : "hsl(346.8 77.2% 49.8%)"} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* About Asset */}
            <div className="bg-card/60 dark:bg-card/40 border border-border/50 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
              <h3 className="text-2xl font-bold text-foreground mb-4">About the Asset</h3>
              <p className="text-muted-foreground leading-loose text-lg font-medium">
                {basicDetails?.description || property.description || 'No description provided.'}
              </p>
            </div>

            {/* Investment & Financials */}
            {(inv || property.marketData || property.unitPrice) && (
              <div className="bg-gradient-to-br from-indigo-500/5 to-primary/5 dark:from-indigo-500/10 dark:to-primary/10 border border-border/50 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[60px] rounded-full"></div>
                <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3 relative z-10">
                  <BarChart3 className="w-6 h-6 text-primary" /> Financial Metrics
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                  <div className="bg-background/60 dark:bg-black/20 p-5 rounded-2xl border border-border/50 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Total Valuation</p>
                    <p className="font-bold text-xl text-foreground font-mono">₹{(inv?.totalPropertyPrice || property.marketData?.marketCap || (property.unitPrice * (property.totalUnits || 0)) || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-background/60 dark:bg-black/20 p-5 rounded-2xl border border-border/50 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Total Units</p>
                    <p className="font-bold text-xl text-foreground font-mono">{(inv?.totalInvestmentUnits || property.totalUnits || 0).toLocaleString()}</p>
                  </div>
                  {(inv?.rentalYield || property.expectedYield || property.rentalData?.expectedYield) ? (
                    <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 font-bold">Target Yield</p>
                      <p className="font-bold text-xl text-emerald-600 dark:text-emerald-400 font-mono">{inv?.rentalYield || property.expectedYield || property.rentalData?.expectedYield}% p.a.</p>
                    </div>
                  ) : null}
                  {(inv?.expectedAppreciation) ? (
                    <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                      <p className="text-[10px] text-primary uppercase tracking-widest mb-2 font-bold">Target Appreciation</p>
                      <p className="font-bold text-xl text-primary font-mono">{inv?.expectedAppreciation}% p.a.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Property Specifications */}
            <div className="bg-card/60 dark:bg-card/40 border border-border/50 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
              <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" /> Asset Specifications
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Type</p>
                  <p className="font-bold text-lg text-foreground capitalize">{basicDetails?.propertyType || property.type}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Status</p>
                  <p className="font-bold text-lg text-foreground capitalize">{basicDetails?.constructionStatus || property.status?.replace('_', ' ')}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{specs?.areaType || "Total Area"}</p>
                  <p className="font-bold text-lg text-foreground">{specs?.areaValue ? `${specs.areaValue} sq.ft` : basicDetails?.builtUpArea || basicDetails?.carpetArea ? `${basicDetails.builtUpArea || basicDetails.carpetArea} sq.ft` : 'N/A'}</p>
                </div>

                {specs?.floorNumber !== undefined && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Floor</p>
                    <p className="font-bold text-lg text-foreground">{specs.floorNumber} {specs.totalFloors ? `of ${specs.totalFloors}` : ''}</p>
                  </div>
                )}

                {specs?.bedrooms !== undefined && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5"><Bed className="w-3.5 h-3.5" /> Bedrooms</p>
                    <p className="font-bold text-lg text-foreground">{specs.bedrooms}</p>
                  </div>
                )}

                {specs?.bathrooms !== undefined && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5"><Bath className="w-3.5 h-3.5" /> Bathrooms</p>
                    <p className="font-bold text-lg text-foreground">{specs.bathrooms}</p>
                  </div>
                )}

                {specs?.furnishedStatus && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Furnishing</p>
                    <p className="font-bold text-lg text-foreground">{specs.furnishedStatus}</p>
                  </div>
                )}

                {specs?.ageOfProperty !== undefined && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Age</p>
                    <p className="font-bold text-lg text-foreground">{specs.ageOfProperty === 0 ? 'Brand New' : `${specs.ageOfProperty} Years`}</p>
                  </div>
                )}
              </div>

              {((property.amenities?.length ?? 0) > 0 || (specs?.amenities?.length ?? 0) > 0) && (
                <div className="mt-8 pt-8 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-5 font-bold">Premium Amenities</p>
                  <div className="flex flex-wrap gap-3">
                    {(specs?.amenities || property.amenities || []).map((amenity: string, idx: number) => (
                      <span key={idx} className="bg-background hover:bg-muted transition-colors text-foreground text-sm px-4 py-2 rounded-xl border border-border/50 flex items-center gap-2 font-medium shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Map & Location */}
            <div className="bg-card/60 dark:bg-card/40 border border-border/50 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
              <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-rose-500 dark:text-rose-400" /> Location & Connectivity
              </h3>

              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-background/60 dark:bg-black/20 p-6 rounded-2xl border border-border/50 shadow-sm">
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">Full Address</p>
                    <p className="font-bold text-lg text-foreground">{loc?.fullAddress || property.address || 'Address not disclosed'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">City/State</p>
                    <p className="font-bold text-lg text-foreground">{loc?.city || property.city}, {loc?.state || property.state}</p>
                  </div>
                  {loc?.pincode || property.pincode ? (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">Pincode</p>
                      <p className="font-bold text-lg text-foreground">{loc?.pincode || property.pincode}</p>
                    </div>
                  ) : null}
                  {loc?.landmark && (
                    <div className="md:col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">Landmark</p>
                      <p className="font-bold text-lg text-foreground">{loc.landmark}</p>
                    </div>
                  )}
                </div>

                {/* Real Interactive Map */}
                <div className="w-full h-[400px] rounded-2xl border border-border/50 overflow-hidden relative shadow-inner group bg-muted">
                  {(loc?.lat && loc?.lng) || (loc?.latitude && loc?.longitude) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      className="border-0 dark:filter dark:invert-[90%] dark:hue-rotate-[180deg]"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}&q=${loc.lat || loc.latitude},${loc.lng || loc.longitude}&zoom=15`}
                    ></iframe>
                  ) : (
                    <iframe
                      width="100%"
                      height="100%"
                      className="border-0 dark:filter dark:invert-[90%] dark:hue-rotate-[180deg]"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}&q=${encodeURIComponent(loc?.fullAddress || property.address || property.city || 'India')}&zoom=14`}
                    ></iframe>
                  )}
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/10 pointer-events-none group-hover:bg-transparent transition-colors"></div>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                    <Button
                      className="bg-background text-foreground hover:bg-muted h-14 px-8 rounded-full font-bold shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 border border-border/50"
                      onClick={() => {
                        const coords = loc?.lat ? `${loc.lat},${loc.lng}` : (loc?.latitude ? `${loc.latitude},${loc.longitude}` : encodeURIComponent(loc?.fullAddress || property.address || property.city || 'India'));
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
                      }}
                    >
                      <Navigation className="w-5 h-5 mr-2 text-primary" /> Get Directions
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal & Documents */}
            {(property.legalVerification || property.media) && (
              <div className="bg-card/60 dark:bg-card/40 border border-border/50 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
                <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                  <Landmark className="w-6 h-6 text-amber-500" /> Legal & Documents
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {property.legalVerification?.reraNumber && (
                    <div className="p-6 rounded-2xl bg-background/60 dark:bg-black/20 border border-border/50 flex flex-col hover:bg-muted/50 transition-colors shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">RERA Number</p>
                      <p className="font-mono font-bold text-xl text-foreground">{property.legalVerification.reraNumber}</p>
                    </div>
                  )}
                  {property.legalVerification?.propertyRegistrationNumber && (
                    <div className="p-6 rounded-2xl bg-background/60 dark:bg-black/20 border border-border/50 flex flex-col hover:bg-muted/50 transition-colors shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Registration No.</p>
                      <p className="font-mono font-bold text-xl text-foreground">{property.legalVerification.propertyRegistrationNumber}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-border/50">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-5">Official Documents</p>
                  <div className="flex flex-wrap gap-4">
                    {property.media?.brochurePdf && (
                      <Button variant="outline" className="h-14 px-6 rounded-xl font-bold bg-background/50 hover:bg-muted shadow-sm" onClick={() => window.open(property.media.brochurePdf, '_blank')}>
                        <FileText className="w-5 h-5 mr-2 text-primary" /> Brochure
                      </Button>
                    )}
                    {property.media?.masterPlan && (
                      <Button variant="outline" className="h-14 px-6 rounded-xl font-bold bg-background/50 hover:bg-muted shadow-sm" onClick={() => window.open(property.media.masterPlan, '_blank')}>
                        <Map className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" /> Master Plan
                      </Button>
                    )}
                    {property.media?.floorPlan && (
                      <Button variant="outline" className="h-14 px-6 rounded-xl font-bold bg-background/50 hover:bg-muted shadow-sm" onClick={() => window.open(property.media.floorPlan, '_blank')}>
                        <Layers className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400" /> Floor Plan
                      </Button>
                    )}
                    {property.legalVerification?.ownershipProofUrl && (
                      <Button variant="outline" className="h-14 px-6 rounded-xl font-bold bg-background/50 hover:bg-muted shadow-sm" onClick={() => window.open(property.legalVerification.ownershipProofUrl, '_blank')}>
                        <FileStack className="w-5 h-5 mr-2 text-emerald-500 dark:text-emerald-400" /> Title Deed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          
          {/* Right Column: Pricing & Controls */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-8">
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
      </div>
    </AppLayout>
  )
}
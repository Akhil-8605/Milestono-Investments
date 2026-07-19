'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  TrendingUp, TrendingDown, MapPin, Building2, Star, StarOff,
  ArrowLeft, ChevronRight, AlertTriangle, FileText, ShieldCheck,
  BarChart2, Percent, Users, Layers, CircleDot,
} from 'lucide-react'
import { Property } from '@/lib/types'
import { cn } from '@/lib/utils'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtCompact = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return fmt(n)
}

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

type Range = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
type OrderType = 'BUY' | 'SELL'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-muted mb-1">{new Date(label).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      <p className="text-foreground font-semibold">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('3M')
  const [orderType, setOrderType] = useState<OrderType>('BUY')
  const [units, setUnits] = useState(1)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderMsg, setOrderMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchProperty = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/properties/${id}`)
      const data = await res.json()
      if (data.success) setProperty(data.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchProperty() }, [fetchProperty])

  // Toggle watchlist
  const toggleWatchlist = async () => {
    if (!property) return
    const method = inWatchlist ? 'DELETE' : 'POST'
    await fetch('/api/watchlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: property.id }),
    })
    setInWatchlist(v => !v)
  }

  const placeOrder = async () => {
    if (!property || units < 1) return
    setOrderLoading(true)
    setOrderMsg(null)
    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id, units, type: orderType }),
      })
      const data = await res.json()
      if (data.success) {
        setOrderMsg({ type: 'success', text: `${orderType} order placed for ${units} unit${units > 1 ? 's' : ''}` })
        fetchProperty()
      } else {
        setOrderMsg({ type: 'error', text: data.error || 'Order failed' })
      }
    } catch {
      setOrderMsg({ type: 'error', text: 'Network error. Try again.' })
    } finally {
      setOrderLoading(false)
    }
  }

  // Slice price history based on range
  const getSlicedHistory = () => {
    if (!property) return []
    const h = property.marketData.priceHistory
    const map: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: h.length }
    return h.slice(-map[range])
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted">Property not found</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/investor/market')}>
            Back to Market
          </Button>
        </div>
      </AppLayout>
    )
  }

  const { marketData } = property
  const isUp = marketData.change >= 0
  const chartData = getSlicedHistory()
  const chartColor = isUp ? '#22c55e' : '#ef4444'
  const totalCost = units * marketData.currentPrice
  const gst = totalCost * 0.05
  const commission = totalCost * 0.02
  const netTotal = totalCost + gst + commission

  const unitsSold = property.totalUnits - property.unitsAvailable
  const fillPct = Math.round((unitsSold / property.totalUnits) * 100)

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-4">
        <button onClick={() => router.push('/investor/market')} className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft size={12} /> Market
        </button>
        <ChevronRight size={12} />
        <span className="text-foreground">{property.symbol}</span>
      </div>

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded bg-accent/10 flex items-center justify-center border border-accent/20">
              <Building2 size={20} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{property.name}</h1>
                <Badge variant="outline" className="text-[10px] font-mono tracking-widest border-accent/30 text-accent">
                  {property.symbol}
                </Badge>
                <Badge
                  className={cn('text-[10px] capitalize', property.type === 'commercial'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : property.type === 'industrial'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : 'bg-accent/10 text-accent border-accent/20'
                  )}
                  variant="outline"
                >
                  {property.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                <MapPin size={11} />
                <span>{property.location}, {property.city}, {property.state}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={toggleWatchlist}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors self-start lg:self-auto mt-1"
        >
          {inWatchlist ? <Star size={14} className="fill-accent text-accent" /> : <StarOff size={14} />}
          {inWatchlist ? 'Watchlisted' : 'Add to Watchlist'}
        </button>
      </div>

      {/* Price Strip */}
      <div className="flex flex-wrap items-end gap-4 mb-6 pb-6 border-b border-border">
        <div>
          <p className="text-3xl font-bold text-foreground font-mono">{fmt(marketData.currentPrice)}</p>
          <p className="text-xs text-muted mt-0.5">per unit</p>
        </div>
        <div className={cn('flex items-center gap-1.5 text-sm font-semibold', isUp ? 'text-gain' : 'text-loss')}>
          {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {fmt(Math.abs(marketData.change))} ({fmtPct(marketData.changePct)}) Today
        </div>
        <div className="flex gap-6 ml-auto text-xs">
          {[
            { label: '52W H', value: fmt(marketData.yearHigh), cls: 'text-gain' },
            { label: '52W L', value: fmt(marketData.yearLow), cls: 'text-loss' },
            { label: 'Vol', value: marketData.volume.toLocaleString('en-IN') },
            { label: 'Mkt Cap', value: fmtCompact(marketData.marketCap) },
          ].map(({ label, value, cls }) => (
            <div key={label}>
              <p className="text-muted">{label}</p>
              <p className={cn('font-mono font-medium mt-0.5', cls ?? 'text-foreground')}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart + Tabs */}
        <div className="lg:col-span-2 space-y-6">

          {/* Chart Card */}
          <div className="bg-surface rounded-xl border border-border p-4">
            {/* Range Selector */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Price Chart</p>
              <div className="flex gap-1">
                {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as Range[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      'text-[11px] px-2.5 py-1 rounded font-medium transition-colors',
                      range === r
                        ? 'bg-accent text-white'
                        : 'text-muted hover:text-foreground hover:bg-surface-2'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={marketData.prevDayPrice} stroke="#374151" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, stroke: '#0f1117', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Info Tabs */}
          <div className="bg-surface rounded-xl border border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full rounded-b-none bg-surface border-b border-border h-10 justify-start px-4 gap-1">
                {['overview', 'financials', 'documents'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="text-[11px] uppercase tracking-wide data-[state=active]:bg-accent data-[state=active]:text-white rounded px-3 h-7"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="p-4 space-y-4">
                <p className="text-sm text-muted leading-relaxed">{property.description}</p>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {(property.amenities ?? []).map(a => (
                      <span key={a} className="text-xs bg-surface-2 text-muted px-2.5 py-1 rounded-full border border-border">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Address', value: property.address },
                    { label: 'City', value: `${property.city}, ${property.state}` },
                    { label: 'PIN Code', value: property.pincode },
                    { label: 'Listed', value: new Date(property.listedAt).toLocaleDateString('en-IN') },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
                      <p className="text-xs text-foreground mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="financials" className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Unit Price', value: fmt(property.unitPrice), icon: <BarChart2 size={14} /> },
                    { label: 'Expected Yield', value: `${property.expectedYield}% p.a.`, icon: <Percent size={14} />, cls: 'text-gain' },
                    { label: 'Occupancy', value: `${property.occupancyRate}%`, icon: <Users size={14} />, cls: property.occupancyRate >= 90 ? 'text-gain' : 'text-loss' },
                    { label: 'Annual Income', value: fmtCompact(property.rentalData.rentalIncome * 12), icon: <TrendingUp size={14} /> },
                    { label: 'Total Units', value: property.totalUnits.toLocaleString('en-IN'), icon: <Layers size={14} /> },
                    { label: 'Available', value: property.unitsAvailable.toLocaleString('en-IN'), icon: <CircleDot size={14} />, cls: 'text-gain' },
                    { label: 'Market Cap', value: fmtCompact(marketData.marketCap), icon: <Building2 size={14} /> },
                    { label: 'Total Value', value: fmtCompact(property.totalUnits * property.unitPrice), icon: <BarChart2 size={14} /> },
                  ].map(({ label, value, icon, cls }) => (
                    <div key={label} className="bg-surface-2 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-muted mb-1.5">
                        {icon}
                        <span className="text-[10px] uppercase tracking-wide">{label}</span>
                      </div>
                      <p className={cn('text-sm font-semibold font-mono', cls ?? 'text-foreground')}>{value}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="p-4 space-y-2">
                {[
                  { icon: <ShieldCheck size={16} className="text-gain" />, label: 'Risk Disclosure Document', sub: 'SEBI mandated risk disclosure for real estate investments' },
                  { icon: <FileText size={16} className="text-accent" />, label: 'Investment Prospectus', sub: 'Detailed property financial projections and exit options' },
                  { icon: <FileText size={16} className="text-blue-400" />, label: 'Terms & Conditions', sub: 'Legal agreement governing fractional ownership' },
                  { icon: <AlertTriangle size={16} className="text-orange-400" />, label: 'RERA Certificate', sub: `Registration number: ${property.city.substring(0, 3).toUpperCase()}/2024/${property.id}` },
                ].map(({ icon, label, sub }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-2 hover:bg-border transition-colors text-left"
                  >
                    {icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted mt-0.5 truncate">{sub}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted shrink-0" />
                  </button>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right: Order Panel */}
        <div className="space-y-4">
          {/* Subscription Progress */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted uppercase tracking-wider">Subscription</p>
              <p className="text-xs font-mono font-bold text-foreground">{fillPct}%</p>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>{unitsSold.toLocaleString('en-IN')} units filled</span>
              <span>{property.unitsAvailable.toLocaleString('en-IN')} left</span>
            </div>
          </div>

          {/* Order Box */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* BUY / SELL Toggle */}
            <div className="grid grid-cols-2">
              <button
                onClick={() => setOrderType('BUY')}
                className={cn(
                  'py-3 text-sm font-bold transition-colors',
                  orderType === 'BUY' ? 'bg-gain text-white' : 'text-muted hover:text-foreground'
                )}
              >
                BUY
              </button>
              <button
                onClick={() => setOrderType('SELL')}
                className={cn(
                  'py-3 text-sm font-bold transition-colors border-l border-border',
                  orderType === 'SELL' ? 'bg-loss text-white' : 'text-muted hover:text-foreground'
                )}
              >
                SELL
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Unit Price */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Price / Unit</span>
                <span className="text-sm font-mono font-bold text-foreground">{fmt(marketData.currentPrice)}</span>
              </div>

              {/* Units Input */}
              <div>
                <label className="text-xs text-muted mb-1.5 block">No. of Units</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUnits(u => Math.max(1, u - 1))}
                    className="w-8 h-8 rounded border border-border text-foreground hover:bg-surface-2 transition-colors text-lg leading-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={property.unitsAvailable}
                    value={units}
                    onChange={e => setUnits(Math.max(1, Math.min(property.unitsAvailable, Number(e.target.value))))}
                    className="flex-1 h-8 rounded border border-border bg-surface-2 text-center text-sm font-mono font-bold text-foreground outline-none focus:border-accent transition-colors"
                  />
                  <button
                    onClick={() => setUnits(u => Math.min(property.unitsAvailable, u + 1))}
                    className="w-8 h-8 rounded border border-border text-foreground hover:bg-surface-2 transition-colors text-lg leading-none"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1">Max: {property.unitsAvailable.toLocaleString('en-IN')} units</p>
              </div>

              {/* Breakdown */}
              <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                {[
                  { label: 'Subtotal', value: fmt(totalCost) },
                  { label: 'GST (5%)', value: fmt(gst), cls: 'text-muted' },
                  { label: 'Commission (2%)', value: fmt(commission), cls: 'text-muted' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted">{label}</span>
                    <span className={cn('font-mono', cls ?? 'text-foreground')}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-mono font-bold text-foreground">{fmt(netTotal)}</span>
                </div>
              </div>

              {/* Order Feedback */}
              {orderMsg && (
                <div className={cn(
                  'text-xs rounded px-3 py-2 text-center',
                  orderMsg.type === 'success' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
                )}>
                  {orderMsg.text}
                </div>
              )}

              <Button
                className={cn(
                  'w-full font-bold h-10 text-sm',
                  orderType === 'BUY'
                    ? 'bg-gain hover:bg-gain/90 text-white'
                    : 'bg-loss hover:bg-loss/90 text-white'
                )}
                onClick={placeOrder}
                disabled={orderLoading}
              >
                {orderLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Place ${orderType} Order`
                )}
              </Button>

              <p className="text-[10px] text-muted text-center">
                Secured by Razorpay · SEBI Regulated · RERA Registered
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs text-muted uppercase tracking-wider">Quick Stats</p>
            {[
              { label: 'Yield', value: `${property.expectedYield}% p.a.`, cls: 'text-gain' },
              { label: 'Occupancy', value: `${property.occupancyRate}%`, cls: property.occupancyRate >= 90 ? 'text-gain' : 'text-loss' },
              { label: 'Monthly Income/Unit', value: fmt(property.rentalData.rentalIncome / property.totalUnits) },
              { label: 'Day Range', value: `${fmt(marketData.weekLow)} – ${fmt(marketData.weekHigh)}` },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted">{label}</span>
                <span className={cn('font-mono font-medium', cls ?? 'text-foreground')}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

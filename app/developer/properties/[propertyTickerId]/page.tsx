'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Property, Inquiry } from '@/lib/types'
import { createNotification } from '@/lib/notifications'
import { ImageGallery } from '@/components/gallery/image-gallery'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { collection, onSnapshot, query, where, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BarChart3, Download, Eye, FileText, MessageSquare, Users, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Bar, Line, Legend, Tooltip } from 'recharts'

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value))
}

const parseTimestamp = (value: any) => {
  if (!value) return new Date()
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

const generateRealGraphData = (startValue: number, endValue: number) => {
  const diff = endValue - startValue
  const step = diff / 6
  const noise = Math.abs(step) * 0.18 || Math.max(10, Math.abs(startValue) * 0.05)

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index) * 5)
    let value = startValue + step * index
    if (index !== 0 && index !== 6) value += (Math.random() * noise * 2) - noise
    if (index === 6) value = endValue
    return {
      name: format(date, 'd MMM'),
      value: Math.max(0, Number(value)),
    }
  })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground mb-3">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-2 text-sm text-foreground">
          <span className="font-semibold">{entry.name}</span>
          <span className="font-mono">{entry.name === 'Price' ? formatCurrency(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

import { useSession } from '@/components/shell/session-context'

export default function DeveloperAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const propertyTickerId = params.propertyTickerId as string
  const { user } = useSession()

  const [property, setProperty] = useState<Property | null>(null)
  const [views, setViews] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [investors, setInvestors] = useState<any[]>([])
  const [watchlisters, setWatchlisters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '1Y' | 'ALL'>('1M')
  const [selectedInvestor, setSelectedInvestor] = useState<any | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null)
  const [messageText, setMessageText] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [sendingMsg, setSendingMsg] = useState<boolean>(false)

  useEffect(() => {
    if (!propertyTickerId) return

    setIsLoading(true)

    let unsubViews: (() => void) | null = null
    let unsubInquiries: (() => void) | null = null
    let unsubWatch: (() => void) | null = null

    const initPropertyView = async () => {
      // 1. Fetch property details
      try {
        let propData: Property | null = null
        const byDocSnap = await getDoc(doc(db, 'properties', propertyTickerId))
        if (byDocSnap.exists()) {
          propData = { id: byDocSnap.id, ...byDocSnap.data() } as Property
        } else {
          const qSym = query(collection(db, 'properties'), where('symbol', '==', propertyTickerId))
          const snapSym = await getDocs(qSym)
          if (!snapSym.empty) {
            propData = { id: snapSym.docs[0].id, ...snapSym.docs[0].data() } as Property
          } else {
            const qGlob = query(collection(db, 'properties'), where('globalId', '==', propertyTickerId))
            const snapGlob = await getDocs(qGlob)
            if (!snapGlob.empty) {
              propData = { id: snapGlob.docs[0].id, ...snapGlob.docs[0].data() } as Property
            }
          }
        }

        if (propData) {
          setProperty(propData)
          const candPropIds = Array.from(new Set([propData.id, propData.symbol, propData.globalId, propertyTickerId].filter(Boolean))) as string[]

          // 2. Realtime views
          const qViews = query(collection(db, 'property_views'), where('propertyTickerId', 'in', candPropIds.slice(0, 10)))
          unsubViews = onSnapshot(qViews, (snap) => setViews(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))

          // 3. Realtime inquiries
          const qInq = query(collection(db, 'inquiries'), where('propertyTicker', 'in', candPropIds.slice(0, 10)))
          unsubInquiries = onSnapshot(qInq, (snap) => setInquiries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry))))

          // 4. Realtime watchlists
          const qWatch = query(collection(db, 'property_watchlists'), where('propertyTickerId', 'in', candPropIds.slice(0, 10)), where('removed', '==', false))
          unsubWatch = onSnapshot(qWatch, (snap) => setWatchlisters(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
        } else {
          toast.error('Property not found')
        }
      } catch (err) {
        console.error('Error fetching property details:', err)
      } finally {
        setIsLoading(false)
      }

      // 5. Fetch investors strictly for this property
      fetch(`/api/properties/${propertyTickerId}/investors`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.data)) {
            setInvestors(data.data)
          }
        })
        .catch((err) => console.error('Error fetching investors:', err))
    }

    initPropertyView()

    return () => {
      if (unsubViews) unsubViews()
      if (unsubInquiries) unsubInquiries()
      if (unsubWatch) unsubWatch()
    }
  }, [propertyTickerId])

  const priceHistory = useMemo(() => {
    return property?.marketData?.priceHistory?.map((point: any) => ({
      date: parseTimestamp(point.date),
      price: Number(point.price) || 0,
    })) || []
  }, [property])

  const filteredPriceHistory = useMemo(() => {
    if (!priceHistory.length) return []
    if (timeframe === 'ALL') return priceHistory
    const now = new Date()
    const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 365
    return priceHistory.filter((item) => item.date.getTime() >= now.getTime() - days * 24 * 60 * 60 * 1000)
  }, [priceHistory, timeframe])

  const chartData = useMemo(() => {
    return filteredPriceHistory.map((item) => ({
      date: format(item.date, 'd MMM'),
      price: item.price,
    }))
  }, [filteredPriceHistory])

  const engagementData = useMemo(() => {
    const buckets = Array.from({ length: 6 }, (_, idx) => {
      const reference = new Date()
      reference.setDate(reference.getDate() - (5 - idx) * 7)
      return {
        name: format(reference, 'd MMM'),
        Views: 0,
        Inquiries: 0,
        Watchlists: 0,
        start: reference.getTime() - 3.5 * 24 * 60 * 60 * 1000,
        end: reference.getTime() + 3.5 * 24 * 60 * 60 * 1000,
      }
    })

    const bucketRecord = (date: Date, key: 'Views' | 'Inquiries' | 'Watchlists') => {
      const bucket = buckets.find((item) => date.getTime() >= item.start && date.getTime() <= item.end)
      if (bucket) bucket[key] += 1
    }

    views.forEach((item) => bucketRecord(parseTimestamp(item.timestamp), 'Views'))
    inquiries.forEach((item) => bucketRecord(parseTimestamp(item.createdAt), 'Inquiries'))
    watchlisters.forEach((item) => bucketRecord(parseTimestamp(item.createdAt), 'Watchlists'))

    return buckets.map(({ name, Views, Inquiries, Watchlists }) => ({ name, Views, Inquiries, Watchlists }))
  }, [views, inquiries, watchlisters])

  const currentPrice = property?.marketData?.currentPrice ?? property?.unitPrice ?? 0
  const changePct = Number(property?.marketData?.changePct ?? 0)
  const isUp = changePct > 0
  const isFlat = changePct === 0

  const detailedInvestors = useMemo(() => {
    return investors.map((inv) => {
      const totalInvested = Number(inv.amountInvested ?? 0)
      const totalCurrentValue = Number(inv.unitsOwned ?? 0) * currentPrice
      const totalPL = totalCurrentValue - totalInvested
      const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0
      return {
        ...inv,
        totalInvested,
        totalCurrentValue,
        totalPL,
        totalPLPct,
        graphData: generateRealGraphData(totalInvested, totalCurrentValue),
      }
    })
  }, [investors, currentPrice])

  const handleSendMessageToInvestor = async () => {
    if (!selectedInvestor) return
    try {
      setSendingMsg(true)
      const userId = selectedInvestor.userId || selectedInvestor.id
      
      const activeUserId = user?.id || (property as any)?.userId
      let profileDevId = property?.developerInfo?.developerId || property?.developerId || (user as any)?.developerId || null
      let profileDevCompany = property?.developerInfo?.companyName || user?.name || null
      let profileDevPhone = property?.developerInfo?.mobile || property?.developerInfo?.phone || user?.phone || null
      let profileDevLogo = property?.developerInfo?.logo || property?.developerInfo?.companyLogo || null
      let profileDevBanner = property?.developerInfo?.banner || property?.developerInfo?.companyBanner || null

      if (activeUserId && (!profileDevId || !profileDevCompany || !profileDevLogo || !profileDevBanner)) {
        try {
          const pRes = await fetch(`/api/profile?userId=${activeUserId}`)
          const pJson = await pRes.json()
          if (pJson.success && pJson.data) {
            profileDevId = profileDevId || pJson.data.developerId
            profileDevCompany = profileDevCompany || pJson.data.companyName || pJson.data.name
            profileDevPhone = profileDevPhone || pJson.data.phone || pJson.data.mobile
            profileDevLogo = profileDevLogo || pJson.data.logo || pJson.data.companyLogo
            profileDevBanner = profileDevBanner || pJson.data.banner || pJson.data.companyBanner
          }
        } catch (e) { /* ignore */ }
      }

      const devIdToUse = profileDevId || property?.developerId || activeUserId

      const metadata: Record<string, any> = {
        propertyId: property?.id || null,
        propertySymbol: property?.symbol || null,
        propertyName: property?.name || null,
        propertyImage: property?.images?.[0] || null,
        developerId: devIdToUse,
        globalId: devIdToUse,
        devId: devIdToUse,
        developerCompany: profileDevCompany || 'Developer Partner',
        senderName: profileDevCompany || user?.name || 'Developer Partner',
        developerLogo: profileDevLogo,
        developerBanner: profileDevBanner || property?.images?.[0] || null,
        developerPhone: profileDevPhone,
        inquiryMessage: selectedInvestor?.message || '',
        senderRole: 'Developer',
      }

      await createNotification(
        userId,
        'investor',
        'developer_message',
        `Response from ${profileDevCompany || property?.symbol || 'Developer'} regarding ${property?.symbol || property?.name || 'Property'}`,
        messageText || 'Message from developer',
        metadata
      )
      toast.success('Realtime notification sent to investor')
      setDialogOpen(false)
      setSelectedInvestor(null)
      setMessageText('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to send message')
    } finally {
      setSendingMsg(false)
    }
  }

  const handleExport = async (
    type: 'price' | 'inquiries' | 'watchlisted' | 'certificate',
    formatType: 'csv' | 'pdf'
  ) => {
    try {
      if (type === 'certificate') {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' })
        doc.setFontSize(24)
        doc.text('Title & Ownership Certificate', 40, 80)
        doc.setFontSize(12)
        doc.text(`Property: ${property?.name || propertyTickerId}`, 40, 130)
        doc.text(`Symbol: ${property?.symbol || propertyTickerId}`, 40, 150)
        doc.text(`Investors: ${investors.length}`, 40, 170)
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 40, 190)
        doc.setFontSize(10)
        doc.text(
          'This certificate summarizes title ownership information for the property shown above. Use this document for internal investor communication and compliance.',
          40,
          220,
          { maxWidth: 520 }
        )
        doc.save(`${propertyTickerId}-certificate.pdf`)
        toast.success('Ownership certificate generated')
        return
      }

      const rows =
        type === 'price'
          ? priceHistory.map((row) => [format(row.date, 'dd MMM yyyy'), row.price.toString()])
          : type === 'inquiries'
          ? inquiries.map((inq) => [inq.investorName || 'Anonymous', inq.message || '-', format(parseTimestamp(inq.createdAt), 'dd MMM yyyy')])
          : watchlisters.map((watch) => [watch.investorName || 'Investor', watch.investorEmail || '-', watch.investorPhone || '-'])

      if (formatType === 'csv') {
        const headers = type === 'price' ? ['Date', 'Price'] : type === 'inquiries' ? ['Investor', 'Message', 'Date'] : ['Investor', 'Email', 'Phone']
        const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${propertyTickerId}-${type}.csv`
        anchor.click()
        URL.revokeObjectURL(url)
      } else {
        const doc = new jsPDF()
        doc.text(`${type === 'price' ? 'Price History' : type === 'inquiries' ? 'Recent Inquiries' : 'Watchlisted By'} - ${propertyTickerId}`, 14, 22)
        autoTable(doc, {
          head: [type === 'price' ? ['Date', 'Price'] : type === 'inquiries' ? ['Investor', 'Message', 'Date'] : ['Investor', 'Email', 'Phone']],
          body: rows,
          startY: 32,
        })
        doc.save(`${propertyTickerId}-${type}.pdf`)
      }

      toast.success('Export ready')
    } catch (error) {
      console.error(error)
      toast.error('Export failed')
    }
  }

  if (isLoading) {
    return (
      <AppLayout requiredRole="developer">
        <div className="flex h-[84vh] items-center justify-center">
          <BarChart3 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!property) {
    return (
      <AppLayout requiredRole="developer">
        <div className="flex min-h-[84vh] items-center justify-center px-6">
          <Card className="max-w-md rounded-[2rem] border border-border/60 bg-card/95 p-10 text-center shadow-xl">
            <p className="text-xl font-bold text-foreground">Property not found</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">This property could not be loaded. Please return to the listing and select another asset.</p>
            <Button className="mt-8 w-full rounded-3xl" onClick={() => router.push('/developer/properties')}>
              Back to properties
            </Button>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout requiredRole="developer" title={`${property.symbol} Analytics`}>
      <div className="mx-auto max-w-[1600px] px-6 pb-16 pt-8">
        <div className="grid gap-6 xl:grid-cols-[1.6fr_minmax(320px,1fr)]">
          <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-8 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">{property.symbol}</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">{property.type || 'Asset'}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground">{property.name}</h1>
                  <p className="max-w-2xl pt-1 text-sm leading-7 text-muted-foreground">
                    {property.description || 'A complete analytics workspace for this asset, blending performance, demand signals, and investor behavior into one dashboard.'}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Location</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{property.city || property.location || 'Unknown'}</p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Units sold</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{property.unitsSold ?? 0} / {property.totalUnits ?? 0}</p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Expected yield</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{property.expectedYield ? `${property.expectedYield}%` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Button variant="default" className="rounded-3xl h-14 min-w-[180px]" onClick={() => router.push(`/developer/list?edit=${property.id}`)}>
                  Manage property
                </Button>
                <Button variant="outline" className="rounded-3xl h-14 min-w-[180px]" onClick={() => handleExport('certificate', 'pdf')}>
                  <FileText className="mr-2 h-4 w-4" /> Generate certificate
                </Button>
              </div>
            </div>
            {/* Insert images gallery under the header */}
            {property?.images && property.images.length > 0 && (
              <div className="mt-6">
                <ImageGallery images={property.images.map((url: string) => ({ url }))} title="Property images" />
              </div>
            )}
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Live valuation</p>
                  <p className="mt-3 text-3xl font-black text-foreground">{formatCurrency(currentPrice)}</p>
                </div>
                <span className={cn('rounded-full px-3 py-2 text-sm font-semibold', isFlat ? 'bg-muted text-muted-foreground' : isUp ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700')}>
                  {isUp ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Inquiries</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{inquiries.length}</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Watchlists</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{watchlisters.length}</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Investor count</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{investors.length}</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">View rate</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{property.viewCount ?? views.length ?? 0}</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Funding progress</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{property.unitsSold ?? 0} of {property.totalUnits ?? 0} units funded</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {Math.round(((property.unitsSold ?? 0) / Math.max(1, property.totalUnits ?? 1)) * 100)}%
                </span>
              </div>
              <div className="rounded-3xl bg-muted/30 p-4">
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500" style={{ width: `${Math.min(100, ((property.unitsSold ?? 0) / Math.max(1, property.totalUnits ?? 1)) * 100)}%` }} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.62fr_0.98fr]">
          <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-8 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-foreground">Price Performance</h2>
                <p className="mt-2 text-sm text-muted-foreground">Review latest valuation movement with selectable timeframes.</p>
              </div>
              <div className="flex flex-wrap gap-2 rounded-3xl bg-muted/50 p-1.5 border border-border/60">
                {(['1W', '1M', '1Y', 'ALL'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTimeframe(option)}
                    className={cn(
                      'rounded-2xl px-4 py-2 text-xs font-semibold transition',
                      option === timeframe ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 h-[430px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGraph" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isFlat ? '#94a3b8' : isUp ? '#10b981' : '#ef4444'} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={isFlat ? '#94a3b8' : isUp ? '#10b981' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }} dy={12} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }} tickFormatter={(value) => `₹${(Number(value) / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="price" stroke={isFlat ? '#94a3b8' : isUp ? '#10b981' : '#ef4444'} strokeWidth={3} fill="url(#priceGraph)" fillOpacity={1} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground">
                  <BarChart3 className="mb-4 h-12 w-12" />
                  <p className="font-semibold">No price history found</p>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-foreground">Property Pulse</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Quick growth, interest and investor signals.</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Updated now</span>
              </div>
              <div className="grid gap-4">
                <div className="rounded-3xl border border-border/60 bg-background p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Recent watchlisted</p>
                  <p className="mt-3 text-2xl font-black text-foreground">{watchlisters.length}</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">New inquiries</p>
                  <p className="mt-3 text-2xl font-black text-foreground">{inquiries.length}</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Investor activity</p>
                  <p className="mt-3 text-2xl font-black text-foreground">{investors.length}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-foreground">Price Updates</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Latest valuations and changes.</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-3xl" onClick={() => handleExport('price', 'pdf')}>
                  Download PDF
                </Button>
              </div>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {priceHistory.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-muted-foreground">No price history available.</div>
                ) : (
                  [...priceHistory].slice().reverse().map((item, index, arr) => {
                    const prev = arr[index + 1]?.price
                    const change = prev ? ((item.price - prev) / prev) * 100 : 0
                    const positive = change > 0
                    return (
                      <div key={index} className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{format(item.date, 'dd MMM yyyy')}</p>
                            <p className="text-xs text-muted-foreground mt-1">{format(item.date, 'h:mm a')}</p>
                          </div>
                          <div className={cn('rounded-2xl px-3 py-2 text-sm font-semibold', positive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700')}>
                            {prev === undefined ? 'Base' : `${positive ? '+' : ''}${change.toFixed(2)}%`}
                          </div>
                        </div>
                        <p className="mt-4 text-lg font-black text-foreground">{formatCurrency(item.price)}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">Recent Inquiries</h2>
                <p className="mt-2 text-sm text-muted-foreground">Click an inquiry to view full investor details and send a realtime notification.</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-3xl" onClick={() => handleExport('inquiries', 'csv')}>
                Export CSV
              </Button>
            </div>
            {inquiries.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center text-muted-foreground">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-30" />
                <p className="text-base font-semibold">No inquiries yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.slice(0, 10).map((inq) => (
                  <Card 
                    key={inq.id} 
                    onClick={() => {
                      setSelectedInquiry(inq)
                      setSelectedInvestor({
                        id: inq.investorId || (inq as any).userId,
                        userId: inq.investorId || (inq as any).userId,
                        name: inq.investorName,
                        email: (inq as any).investorEmail,
                        phone: (inq as any).investorPhone || (inq as any).phone || '',
                        message: inq.message,
                        createdAt: inq.createdAt
                      })
                      setDialogOpen(true)
                    }}
                    className="rounded-3xl border border-border/60 bg-background hover:bg-muted/30 p-5 shadow-sm transition-all cursor-pointer group hover:border-primary/50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold group-hover:scale-105 transition-transform">
                          {(inq.investorName || 'I')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{inq.investorName || 'Verified Investor'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{(inq as any).investorEmail || 'No email provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium">{formatDistanceToNow(parseTimestamp(inq.createdAt), { addSuffix: true })}</span>
                        <Button size="sm" variant="outline" className="rounded-full text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10">
                          View & Reply
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 bg-muted/40 p-3 rounded-2xl border border-border/40 text-sm text-muted-foreground line-clamp-2 italic">
                      "{inq.message || 'No message provided.'}"
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          <Card className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">Watchlist Activity</h2>
                <p className="mt-2 text-sm text-muted-foreground">Recent investors tracking this property.</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-3xl" onClick={() => handleExport('watchlisted', 'csv')}>
                Export CSV
              </Button>
            </div>
            {watchlisters.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center text-muted-foreground">
                <Eye className="mx-auto mb-4 h-12 w-12 opacity-30" />
                <p className="text-base font-semibold">No watchlist entries yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlisters.slice(0, 6).map((watch) => (
                  <div key={watch.id} className="rounded-3xl border border-border/60 bg-background p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{watch.investorName || 'Investor'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{watch.investorEmail || 'No email'}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{formatDistanceToNow(parseTimestamp(watch.createdAt), { addSuffix: true })}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black text-foreground">Active Investors</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A detailed view of investors currently holding units for {property.symbol}.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="rounded-3xl">Export investors</Button>
              <Button variant="default" size="sm" className="rounded-3xl">Message all</Button>
            </div>
          </div>

          {detailedInvestors.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-border/60 bg-muted/20 p-16 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12 text-primary opacity-70" />
              <p className="text-xl font-semibold text-foreground">No active investors yet</p>
              <p className="mt-2 text-sm">Once investors hold this asset, their portfolios will appear here.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 xl:grid-cols-1">
              {detailedInvestors.map((inv) => (
                <Card key={inv.userId || inv.id} className="w-full overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-sm">
                  <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] p-6 w-full">
                    <div className="space-y-5 rounded-3xl border border-border/60 bg-card/90 p-5 text-center w-full">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-black text-white">
                        {inv.name?.charAt(0) || 'I'}
                      </div>
                      <div>
                        <p className="text-lg font-black text-foreground">{inv.name || 'Investor'}</p>
                        <p className="mt-1 text-sm text-muted-foreground truncate">{inv.email || 'No email'}</p>
                      </div>
                      <div className="rounded-3xl bg-muted p-4 text-left">
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Holdings</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{inv.unitsOwned ?? 0} units</p>
                      </div>
                      <Button variant="outline" className="w-full rounded-3xl" onClick={() => { setSelectedInvestor(inv); setDialogOpen(true) }}>Message</Button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/90 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Portfolio value</p>
                            <p className="mt-2 text-2xl font-black text-foreground">{formatCurrency(inv.totalCurrentValue)}</p>
                          </div>
                          <span className={cn('rounded-full px-3 py-2 text-sm font-semibold', inv.totalPLPct >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700')}>
                            {inv.totalPLPct >= 0 ? '+' : ''}{inv.totalPLPct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-3xl bg-background p-4 text-center">
                            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Invested</p>
                            <p className="mt-2 text-lg font-black text-foreground">{formatCurrency(inv.totalInvested)}</p>
                          </div>
                          <div className="rounded-3xl bg-background p-4 text-center">
                            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Units</p>
                            <p className="mt-2 text-lg font-black text-foreground">{inv.unitsOwned ?? 0}</p>
                          </div>
                          <div className="rounded-3xl bg-background p-4 text-center">
                            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">P&L</p>
                            <p className={cn('mt-2 text-lg font-black', inv.totalPL >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                              {inv.totalPL >= 0 ? '+' : ''}{formatCurrency(inv.totalPL)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-border/60 bg-card/90 p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Growth trend</p>
                        <div className="mt-3 h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={inv.graphData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`investorTrend-${inv.userId || inv.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={inv.totalPL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.28} />
                                  <stop offset="95%" stopColor={inv.totalPL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'transparent' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'transparent' }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="value" stroke={inv.totalPL >= 0 ? '#10b981' : '#ef4444'} strokeWidth={3} fill={`url(#investorTrend-${inv.userId || inv.id})`} fillOpacity={1} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section> */}

        {/* Investor Inquiry Overlay Modal */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setSelectedInvestor(null)
            setMessageText('')
          }
        }}>
          <DialogContent className="max-w-2xl rounded-3xl p-7 border border-border/80 shadow-2xl bg-card/95 backdrop-blur-xl">
            <DialogHeader className="border-b border-border/60 pb-4">
              <DialogTitle className="text-xl font-bold flex items-center justify-between gap-3 text-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg shadow-sm">
                    {(selectedInvestor?.name || 'I')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-lg font-extrabold text-foreground block">{selectedInvestor?.name || 'Verified Investor'}</span>
                    <span className="text-xs text-muted-foreground font-medium">{selectedInvestor?.email || 'Registered Investor'}</span>
                  </div>
                </div>
                {property?.symbol && (
                  <span className="text-xs font-bold font-mono bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                    {property.symbol}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 my-2">
              {/* Investor Contact Details */}
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3.5 rounded-2xl border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">Email Address</span>
                  <span className="font-mono font-bold text-foreground line-clamp-1">{selectedInvestor?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">Phone Number</span>
                  <span className="font-mono font-bold text-foreground">{selectedInvestor?.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Inquiry Message Block */}
              {selectedInvestor?.message && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Inquiry Message</span>
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 text-sm leading-relaxed text-foreground italic border-l-4 border-l-primary">
                    "{selectedInvestor.message}"
                  </div>
                </div>
              )}

              {/* Realtime Notification Reply Input */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" /> Send Realtime Notification to Investor
                </label>
                <textarea 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  placeholder="Type your response or update message here... The investor will receive an instant realtime notification."
                  className="w-full rounded-2xl border border-border/80 bg-background p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[120px] transition-all" 
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
                <Button variant="outline" className="rounded-xl font-bold h-11 px-5" onClick={() => { setDialogOpen(false); setSelectedInvestor(null); setMessageText('') }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessageToInvestor} 
                  disabled={sendingMsg || !messageText.trim()}
                  className="rounded-xl font-bold h-11 px-6 gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {sendingMsg ? 'Sending Notification...' : 'Send Realtime Notification'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

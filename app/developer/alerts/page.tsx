'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppNotification } from '@/lib/notifications'
import { 
  Bell, CheckCircle, XCircle, MessageCircle, Eye, Loader2, User, 
  Building2, Check, CheckCheck, Search, ArrowRight, TrendingUp 
} from 'lucide-react'
import { collection, query, where, onSnapshot, doc, updateDoc, documentId, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSession } from '@/components/shell/session-context'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { fetchDeveloperProperties } from '@/lib/developer-properties'
import { cn } from '@/lib/utils'

export default function DeveloperAlertsPage() {
  const router = useRouter()
  const { user } = useSession()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [investorProfilesMap, setInvestorProfilesMap] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'inquiries' | 'investments' | 'watchlist' | 'approvals'>('all')

  useEffect(() => {
    if (!user) return

    let isSubscribed = true
    let unsubs: (() => void)[] = []

    const setupRealtimeAlerts = async () => {
      const activeUserId = user.id
      let devIdFromProfile: string | null = null

      try {
        const res = await fetch(`/api/profile?userId=${activeUserId}`)
        const json = await res.json()
        if (json.success && json.data?.developerId) {
          devIdFromProfile = json.data.developerId
        }
      } catch (err) {
        console.warn('Alerts profile fetch error:', err)
      }

      const candidateIds = Array.from(
        new Set([
          activeUserId,
          devIdFromProfile,
          (user as any)?.developerId,
          (user as any)?.uid,
          (user as any)?.email,
        ].filter(Boolean))
      ) as string[]

      // Fetch developer properties for ticker symbols
      let devProps: any[] = []
      try {
        devProps = await fetchDeveloperProperties(user)
      } catch (err) {
        console.warn('Alerts dev props fetch error:', err)
      }

      const candidateTickers = Array.from(
        new Set(devProps.map((p) => p.symbol).filter(Boolean))
      ) as string[]

      let rawNotifs: AppNotification[] = []
      let rawInquiries: any[] = []

      const combineAndSet = async () => {
        if (!isSubscribed) return

        const combinedMap = new Map<string, AppNotification>()

        // 1. Process notifications doc
        rawNotifs.forEach((n) => {
          if (!n.role || n.role === 'developer') {
            combinedMap.set(n.id || `notif_${Math.random()}`, n)
          }
        })

        // 2. Process inquiries docs to synthesize real-time alerts if missing from notifications
        rawInquiries.forEach((inq) => {
          const inqId = inq.id
          const inqMsg = inq.message || ''
          const inqTicker = inq.propertyTicker || inq.propertyTickerId || inq.propertyId || ''
          const inqPhone = inq.investorPhone || inq.phone || inq.mobile || inq.contactNumber || ''
          
          const alreadyExists = Array.from(combinedMap.values()).some((n) => 
            n.id === inqId || 
            n.metadata?.inquiryId === inqId || 
            (n.metadata?.inquiryMessage === inqMsg && (n.metadata?.propertySymbol === inqTicker || n.metadata?.propertyTickerId === inqTicker))
          )

          if (!alreadyExists) {
            const inqDate = inq.createdAt?.toMillis 
              ? new Date(inq.createdAt.toMillis()) 
              : inq.createdAt?.toDate 
                ? inq.createdAt.toDate() 
                : new Date(inq.createdAt || Date.now())

            combinedMap.set(`inq_${inqId}`, {
              id: `inq_${inqId}`,
              userId: activeUserId,
              role: 'developer',
              type: 'investor_inquiry',
              title: `New Property Inquiry - ${inqTicker}`,
              message: `Investor ${inq.investorName || 'An investor'} sent an inquiry: "${inqMsg.substring(0, 80)}${inqMsg.length > 80 ? '...' : ''}"`,
              read: inq.status !== 'new',
              createdAt: inqDate,
              metadata: {
                propertySymbol: inqTicker,
                propertyTickerId: inqTicker,
                propertyName: inqTicker,
                investorId: inq.investorId || inq.userId || '',
                investorName: inq.investorName || 'Verified Investor',
                investorEmail: inq.investorEmail || '',
                investorPhone: inqPhone,
                inquiryMessage: inqMsg,
                inquiryId: inqId,
              }
            })
          }
        })

        const sorted = Array.from(combinedMap.values()).sort((a, b) => {
          const timeA = a.createdAt?.getTime ? a.createdAt.getTime() : a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime()
          const timeB = b.createdAt?.getTime ? b.createdAt.getTime() : b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime()
          return timeB - timeA
        })

        setNotifications(sorted)
        setIsLoading(false)

        // 3. Resolve investor user profiles in background to fill phone, email, and name gaps
        const invIds = Array.from(new Set([
          ...rawNotifs.map(n => n.metadata?.investorId || n.metadata?.userId || (n as any).investorId || (n as any).userId),
          ...rawInquiries.map(i => i.investorId || i.userId)
        ].filter(Boolean))) as string[]

        const missingIds = invIds.filter(id => !investorProfilesMap[id])
        if (missingIds.length > 0) {
          try {
            const profMap: Record<string, any> = {}
            for (let i = 0; i < missingIds.length; i += 10) {
              const chunk = missingIds.slice(i, i + 10)
              const qUsers = query(collection(db, 'users'), where(documentId(), 'in', chunk))
              const uSnap = await getDocs(qUsers).catch(() => null)
              if (uSnap) {
                uSnap.docs.forEach(docSnap => {
                  profMap[docSnap.id] = docSnap.data()
                })
              }
            }
            if (Object.keys(profMap).length > 0) {
              setInvestorProfilesMap(prev => ({ ...prev, ...profMap }))
            }
          } catch (e) {
            console.warn('[DeveloperAlerts] Background user profile lookup error:', e)
          }
        }
      }

      // Listener A: Notifications collection
      try {
        const qNotif = query(collection(db, 'notifications'), where('userId', 'in', candidateIds.slice(0, 10)))
        const unsubNotif = onSnapshot(qNotif, (snap) => {
          rawNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification))
          combineAndSet()
        }, (err) => console.warn('[DeveloperAlerts] Notifications snapshot error:', err))
        unsubs.push(unsubNotif)
      } catch (err) {
        console.warn('[DeveloperAlerts] Notifications query error:', err)
      }

      // Listener B: Inquiries collection by developerId
      try {
        const qInqDev = query(collection(db, 'inquiries'), where('developerId', 'in', candidateIds.slice(0, 10)))
        const unsubInqDev = onSnapshot(qInqDev, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          rawInquiries = Array.from(new Map([...rawInquiries, ...docs].map(d => [d.id, d])).values())
          combineAndSet()
        }, (err) => console.warn('[DeveloperAlerts] Inquiries dev snapshot error:', err))
        unsubs.push(unsubInqDev)
      } catch (err) {
        console.warn('[DeveloperAlerts] Inquiries dev query error:', err)
      }

      // Listener C: Inquiries collection by propertyTicker
      if (candidateTickers.length > 0) {
        try {
          const qInqTick = query(collection(db, 'inquiries'), where('propertyTicker', 'in', candidateTickers.slice(0, 10)))
          const unsubInqTick = onSnapshot(qInqTick, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            rawInquiries = Array.from(new Map([...rawInquiries, ...docs].map(d => [d.id, d])).values())
            combineAndSet()
          }, (err) => console.warn('[DeveloperAlerts] Inquiries ticker snapshot error:', err))
          unsubs.push(unsubInqTick)
        } catch (err) {
          console.warn('[DeveloperAlerts] Inquiries ticker query error:', err)
        }
      }
    }

    setupRealtimeAlerts()

    return () => {
      isSubscribed = false
      unsubs.forEach(u => u())
    }
  }, [user])

  const markAsRead = async (id?: string, currentlyRead?: boolean) => {
    if (!id || currentlyRead) return
    try {
      if (id.startsWith('inq_')) {
        const realInqId = id.replace('inq_', '')
        await updateDoc(doc(db, 'inquiries', realInqId), { status: 'read' })
      } else {
        await updateDoc(doc(db, 'notifications', id), { read: true })
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      toast.success('Marked as read')
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) return
    try {
      for (const n of unread) {
        if (n.id) {
          if (n.id.startsWith('inq_')) {
            await updateDoc(doc(db, 'inquiries', n.id.replace('inq_', '')), { status: 'read' }).catch(() => {})
          } else {
            await updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {})
          }
        }
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (err) {
      console.error(err)
    }
  }

  const resolveInvestorInfo = (n: AppNotification) => {
    const invId = n.metadata?.investorId || n.metadata?.userId || (n as any).investorId || (n as any).userId || ''
    const profile = investorProfilesMap[invId] || {}

    const investorName = 
      n.metadata?.investorName || 
      profile.name || 
      profile.fullName || 
      profile.investorName || 
      (n as any).investorName || 
      'Verified Investor'

    const investorEmail = 
      n.metadata?.investorEmail || 
      n.metadata?.email || 
      profile.email || 
      profile.investorEmail || 
      (n as any).investorEmail || 
      'N/A'

    const investorPhone = 
      n.metadata?.investorPhone || 
      n.metadata?.phone || 
      n.metadata?.mobile || 
      n.metadata?.phoneNumber || 
      n.metadata?.contactNumber || 
      n.metadata?.investorMobile ||
      profile.phone || 
      profile.mobile || 
      profile.phoneNumber || 
      profile.contactNumber || 
      profile.mobileNumber || 
      (n as any).investorPhone || 
      (n as any).phone || 
      (n as any).mobile || 
      'N/A'

    const investorPhoto = n.metadata?.investorPhoto || profile.photoURL || profile.profilePhoto || null

    return { invId, investorName, investorEmail, investorPhone, investorPhoto }
  }

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const filteredNotifications = useMemo(() => {
    let list = notifications

    // 1. Filter by category tab
    if (activeTab === 'inquiries') {
      list = list.filter(n => n.type === 'investor_inquiry' || n.type === 'inquiry_received' || (n.id && n.id.startsWith('inq_')))
    } else if (activeTab === 'investments') {
      list = list.filter(n => n.type === 'investment_received' || n.type === 'investment_confirm' || n.type === 'transaction_approved')
    } else if (activeTab === 'watchlist') {
      list = list.filter(n => n.type === 'investor_watchlisted' || n.type === 'property_shortlisted' || n.type === 'watchlist_alert')
    } else if (activeTab === 'approvals') {
      list = list.filter(n => n.type === 'property_approved' || n.type === 'property_rejected')
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(n => {
        const title = (n.title || '').toLowerCase()
        const message = (n.message || '').toLowerCase()
        const propSymbol = (n.metadata?.propertySymbol || n.metadata?.propertyTickerId || '').toLowerCase()
        const propName = (n.metadata?.propertyName || '').toLowerCase()
        const invName = (n.metadata?.investorName || '').toLowerCase()
        const invEmail = (n.metadata?.investorEmail || '').toLowerCase()
        const invPhone = (n.metadata?.investorPhone || '').toLowerCase()
        return (
          title.includes(q) ||
          message.includes(q) ||
          propSymbol.includes(q) ||
          propName.includes(q) ||
          invName.includes(q) ||
          invEmail.includes(q) ||
          invPhone.includes(q)
        )
      })
    }

    return list
  }, [notifications, activeTab, searchQuery])

  const renderNotification = (n: AppNotification) => {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || Date.now())

    if (n.type === 'investment_received' || n.type === 'investment_confirm' || n.type === 'transaction_approved') {
      const propSymbol = n.metadata?.propertySymbol || n.metadata?.propertyTickerId || (n as any).propertySymbol || ''
      const propName = n.metadata?.propertyName || n.metadata?.name || (n as any).propertyName || propSymbol || 'Development Project'
      const { investorName, investorEmail, investorPhone, investorPhoto } = resolveInvestorInfo(n)

      const unitsCount = Number(n.metadata?.units || n.metadata?.unitsOwned || (n as any).units || 1)
      const unitPrice = Number(n.metadata?.unitPrice || (n as any).unitPrice || 0)

      let totalAmt = Number(
        n.metadata?.totalAmount || 
        n.metadata?.amountInvested || 
        n.metadata?.amount || 
        (n as any).totalAmount || 
        (n as any).amountInvested || 
        0
      )

      if (!totalAmt && unitPrice > 0 && unitsCount > 0) {
        totalAmt = unitsCount * unitPrice
      }

      const paymentMethod = n.metadata?.paymentMethod || 'Verified Escrow Gateway'

      return (
        <Card 
          key={n.id} 
          onClick={() => markAsRead(n.id, n.read)} 
          className={cn(
            'p-0 overflow-hidden border transition-all duration-500 rounded-[2.5rem] relative group cursor-pointer shadow-2xl',
            n.read 
              ? 'border-emerald-500/20 bg-card/85 opacity-85' 
              : 'border-emerald-500/60 bg-gradient-to-br from-slate-950 via-emerald-950/40 to-teal-950/50 shadow-emerald-500/15 hover:border-emerald-400 hover:shadow-emerald-500/25'
          )}
        >
          {/* Top Banner Accent */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest">
              <TrendingUp className="w-5 h-5 text-emerald-200 animate-pulse" />
              <span>New Property Investment Received & Verified</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold opacity-90">{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
              {!n.read && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); markAsRead(n.id, n.read); }} 
                  className="h-8 text-xs gap-1.5 font-bold text-white bg-white/20 hover:bg-white/30 rounded-xl px-3 border border-white/20"
                >
                  <Check className="w-3.5 h-3.5" /> Mark Read
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Massive Hero Highlight Box */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-emerald-500/10 border border-emerald-500/20 p-6 md:p-8 rounded-[2rem] backdrop-blur-md relative overflow-hidden">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white border border-emerald-400/40 flex items-center justify-center font-black text-2xl shrink-0 shadow-xl shadow-emerald-500/30">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Capital Inflow Verified</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase px-3 py-0.5 rounded-full">
                      {unitsCount} {unitsCount === 1 ? 'Unit' : 'Units'} Purchased
                    </span>
                  </div>

                  <div className="text-3xl md:text-5xl font-black font-mono text-emerald-400 tracking-tight my-2">
                    ₹{Number(totalAmt).toLocaleString('en-IN')}
                  </div>

                  <h3 className="text-lg md:text-xl font-extrabold text-foreground mt-1">
                    {investorName} invested in <span className="text-emerald-400 font-mono">{propName} ({propSymbol})</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funds have been confirmed and allocated to your property ticker portfolio.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <Button 
                  variant="default" 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl h-12 px-6 gap-2 shadow-xl shadow-emerald-600/30 hover:scale-[1.02] transition-transform"
                  onClick={(e) => {
                    e.stopPropagation()
                    markAsRead(n.id, n.read)
                    router.push('/developer/relations')
                  }}
                >
                  <User className="w-4.5 h-4.5" /> View Investor Relations <ArrowRight className="w-4 h-4" />
                </Button>
                {propSymbol && (
                  <Button 
                    variant="outline" 
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-2xl h-12 px-5 gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(n.id, n.read)
                      router.push(`/developer/properties/${propSymbol}`)
                    }}
                  >
                    <Building2 className="w-4.5 h-4.5" /> Asset Analytics
                  </Button>
                )}
              </div>
            </div>

            {/* Investor & Investment Dual Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investor Profile Box */}
              <div className="bg-background/80 backdrop-blur-md p-6 rounded-[2rem] border border-border/60 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-3">
                  <User className="w-4 h-4 text-emerald-400" /> Investor Profile & Contact
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-300 font-black text-xl flex items-center justify-center border-2 border-emerald-500/30 shrink-0 shadow-md">
                    {investorPhoto ? (
                      <img src={investorPhoto} alt="Investor" className="w-full h-full object-cover" />
                    ) : (
                      investorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-base text-foreground leading-tight">{investorName}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block mt-1 border border-emerald-500/20">
                      Verified Capital Investor
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                  <div className="flex justify-between items-center"><span className="font-semibold">Email:</span> <span className="font-mono text-foreground font-bold truncate max-w-[200px]">{investorEmail}</span></div>
                  <div className="flex justify-between items-center"><span className="font-semibold">Phone:</span> <span className="font-mono text-foreground font-bold">{investorPhone}</span></div>
                </div>
              </div>

              {/* Investment Financial Summary Box */}
              <div className="bg-background/80 backdrop-blur-md p-6 rounded-[2rem] border border-border/60 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-3">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Investment Transaction Breakdown
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Target Asset:</span> <span className="font-bold text-foreground">{propName} ({propSymbol})</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Units Allocated:</span> <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{unitsCount} Units</span></div>
                  {unitPrice > 0 && <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Price per Unit:</span> <span className="font-mono font-bold text-foreground">₹{Number(unitPrice).toLocaleString('en-IN')}</span></div>}
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Total Capital Raised:</span> <span className="font-mono font-bold text-emerald-400 text-sm">₹{Number(totalAmt).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Payment Channel:</span> <span className="font-bold text-emerald-400">{paymentMethod}</span></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    if (n.type === 'property_rejected') {
      return (
        <Card key={n.id} onClick={() => markAsRead(n.id, n.read)} className={`p-0 overflow-hidden border ${n.read ? 'border-border/50 opacity-70' : 'border-rose-500/30 shadow-lg shadow-rose-500/10'} transition-all cursor-pointer rounded-2xl`}>
          <div className="bg-rose-500/10 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
              {n.metadata?.propertyImage ? (
                <img src={n.metadata.propertyImage} alt="Property" className="w-full h-full object-cover" />
              ) : (
                <XCircle className="w-10 h-10 text-rose-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white px-2 py-0.5 rounded">Rejected</span>
                  <span className="text-xs text-muted-foreground font-medium">{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, n.read); }} className="h-7 text-xs gap-1 font-bold text-rose-500 hover:bg-rose-500/10">
                    <Check className="w-3 h-3" /> Mark Read
                  </Button>
                )}
              </div>
              <h3 className="text-xl font-bold text-rose-600 mb-1">{n.title}</h3>
              <p className="text-sm font-semibold text-foreground mb-3">{n.metadata?.propertyName} <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border ml-2">{n.metadata?.propertySymbol}</span></p>
              <div className="bg-background p-4 rounded-xl border border-rose-500/20 text-sm text-muted-foreground italic border-l-4 border-l-rose-500 mb-4">
                "{n.message}"
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-bold gap-2 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation()
                  markAsRead(n.id, n.read)
                  if (n.metadata?.propertySymbol) router.push(`/developer/list?edit=${n.metadata.propertySymbol}`)
                }}
              >
                Edit & Resubmit Property
              </Button>
            </div>
          </div>
        </Card>
      )
    }

    if (n.type === 'investor_inquiry' || n.type === 'inquiry_received') {
      const propSymbol = n.metadata?.propertySymbol || n.metadata?.propertyTickerId || n.metadata?.propertyTicker || n.data?.propertyTickerId || ''
      const { investorName, investorEmail, investorPhone, investorPhoto } = resolveInvestorInfo(n)

      return (
        <Card key={n.id} onClick={() => {
          markAsRead(n.id, n.read)
          if (propSymbol) router.push(`/developer/properties/${propSymbol}`)
        }} className={`p-6 border ${n.read ? 'border-border/50 opacity-80' : 'border-primary/40 shadow-xl shadow-primary/10'} transition-all cursor-pointer rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 hover:border-primary/60`}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight text-foreground">{n.title}</h3>
                  <span className="text-xs text-muted-foreground font-medium">{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {!n.read && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-3 text-[11px] font-bold rounded-lg border-primary/30 text-primary hover:bg-primary/10 gap-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(n.id, n.read)
                      }}
                    >
                      <Check className="w-3 h-3" /> Mark as Read
                    </Button>
                  )}
                  {!n.read && (
                    <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                      New
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-background/90 backdrop-blur-md p-4 rounded-xl border border-border/60 border-l-4 border-l-primary space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inquiry Message:</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">"{n.metadata?.inquiryMessage || n.message}"</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {propSymbol && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-2 text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(n.id, n.read)
                      router.push(`/developer/properties/${propSymbol}`)
                    }}
                  >
                    <Building2 className="w-4 h-4" /> View Property & Inquiries <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 ml-auto">
                  Property: {n.metadata?.propertyName || propSymbol} ({propSymbol})
                </span>
              </div>
            </div>

            <div className="w-full md:w-72 bg-card border border-border/70 rounded-2xl p-4 shrink-0 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-3 border-b border-border/50 pb-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  {investorPhoto ? (
                    <img src={investorPhoto} alt="Investor" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground leading-tight">{investorName}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{n.metadata?.investorOccupation || 'Real Estate Investor'}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-foreground/90">
                <p className="flex items-center justify-between"><span className="text-muted-foreground font-semibold">Email:</span> <span className="font-mono text-[11px] font-bold text-foreground line-clamp-1">{investorEmail}</span></p>
                <p className="flex items-center justify-between"><span className="text-muted-foreground font-semibold">Phone:</span> <span className="font-mono text-[11px] font-bold text-foreground">{investorPhone}</span></p>
                {n.metadata?.investorIncome && <p className="flex items-center justify-between"><span className="text-muted-foreground font-semibold">Income:</span> <span className="font-bold text-emerald-500">{n.metadata.investorIncome}</span></p>}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    if (n.type === 'property_approved') {
      const propSymbol = n.metadata?.propertySymbol || n.metadata?.symbol || (n as any).propertySymbol || ''
      const propName = n.metadata?.propertyName || n.metadata?.name || (n as any).propertyName || propSymbol || 'Listed Property'
      const propImage = n.metadata?.propertyImage || (n as any).propertyImage || null

      return (
        <Card 
          key={n.id} 
          onClick={() => markAsRead(n.id, n.read)} 
          className={`p-0 overflow-hidden border transition-all duration-500 rounded-3xl relative group cursor-pointer ${
            n.read 
              ? 'border-border/60 bg-card/80 opacity-85' 
              : 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/30 via-card to-cyan-950/20 shadow-2xl shadow-emerald-500/10 hover:border-emerald-400 hover:shadow-emerald-500/20'
          }`}
        >
          {/* Top Banner Accent */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-3 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <CheckCircle className="w-4 h-4 animate-bounce" />
              <span>Property Listing Approved & Published</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold opacity-90">{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
              {!n.read && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); markAsRead(n.id, n.read); }} 
                  className="h-7 text-xs gap-1 font-bold text-white bg-white/20 hover:bg-white/30 rounded-lg px-2.5"
                >
                  <Check className="w-3.5 h-3.5" /> Mark Read
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative shadow-md">
              {propImage ? (
                <img src={propImage} alt="Property" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <Building2 className="w-10 h-10 text-emerald-500" />
              )}
              {propSymbol && (
                <span className="absolute bottom-1 right-1 bg-background/90 backdrop-blur-md text-foreground font-mono text-[9px] font-black px-1.5 py-0.5 rounded border border-border/50">
                  {propSymbol}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-block mb-1">
                  Status: Active Trading Live
                </span>
                <h3 className="text-xl md:text-2xl font-black text-foreground">{n.title || 'Property Approved!'}</h3>
                <p className="text-sm font-semibold text-muted-foreground mt-0.5">{propName} ({propSymbol})</p>
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-xl border border-border/60 border-l-4 border-l-emerald-500 text-sm text-foreground leading-relaxed">
                "{n.message || 'Your property listing has been verified and approved by admin. It is now open for public investor trading.'}"
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {propSymbol && (
                  <Button 
                    variant="default" 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-10 px-5 gap-2 shadow-lg shadow-emerald-600/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(n.id, n.read)
                      router.push(`/properties/${propSymbol}`)
                    }}
                  >
                    <Building2 className="w-4 h-4" /> View Market Listing <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
                {propSymbol && (
                  <Button 
                    variant="outline" 
                    className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 font-bold rounded-xl h-10 px-4 gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(n.id, n.read)
                      router.push(`/developer/properties/${propSymbol}`)
                    }}
                  >
                    Manage Asset Analytics
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    if (n.type === 'investor_watchlisted' || n.type === 'property_shortlisted' || n.type === 'watchlist_alert') {
      const propSymbol = n.metadata?.propertySymbol || n.metadata?.symbol || (n as any).propertySymbol || ''
      const propName = n.metadata?.propertyName || propSymbol || 'Developer Asset'
      const { investorName, investorEmail, investorPhone, investorPhoto } = resolveInvestorInfo(n)

      return (
        <Card 
          key={n.id} 
          onClick={() => markAsRead(n.id, n.read)} 
          className={`p-0 overflow-hidden border transition-all duration-500 rounded-3xl relative group cursor-pointer ${
            n.read 
              ? 'border-purple-500/20 bg-card/85 opacity-85' 
              : 'border-purple-500/60 bg-gradient-to-br from-slate-950 via-purple-950/40 to-indigo-950/50 shadow-2xl shadow-purple-500/15 hover:border-purple-400 hover:shadow-purple-500/25'
          }`}
        >
          {/* Top Banner Accent */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 font-black text-xs uppercase tracking-widest">
              <Eye className="w-4 h-4 text-purple-200 animate-pulse" />
              <span>Asset Shortlisted by High-Intent Investor</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold opacity-90">{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
              {!n.read && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); markAsRead(n.id, n.read); }} 
                  className="h-7 text-xs gap-1 font-bold text-white bg-white/20 hover:bg-white/30 rounded-lg px-2.5"
                >
                  <Check className="w-3.5 h-3.5" /> Mark Read
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Shortlist Highlight Box */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                  ★
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-400">High-Intent Lead</span>
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                      Watchlist Added
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold text-foreground mt-1">
                    {investorName} shortlisted <span className="text-purple-400 font-mono">{propName} ({propSymbol})</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    This accredited investor is actively tracking yield rate updates & market availability for this asset.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <Button 
                  variant="default" 
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl h-11 px-5 gap-2 shadow-lg shadow-purple-600/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    markAsRead(n.id, n.read)
                    router.push('/developer/relations')
                  }}
                >
                  <User className="w-4 h-4" /> Direct Outreach <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                {propSymbol && (
                  <Button 
                    variant="outline" 
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-bold rounded-xl h-11 px-4 gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(n.id, n.read)
                      router.push(`/developer/properties/${propSymbol}`)
                    }}
                  >
                    <Building2 className="w-4 h-4" /> Asset Analytics
                  </Button>
                )}
              </div>
            </div>

            {/* Investor & Shortlisted Asset Dual Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investor Profile Box */}
              <div className="bg-background/80 backdrop-blur-md p-5 rounded-2xl border border-border/60 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                  <User className="w-4 h-4 text-purple-400" /> Prospect Investor Details
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-500/20 text-purple-300 font-black text-lg flex items-center justify-center border border-purple-500/30 shrink-0 shadow-sm">
                    {investorPhoto ? (
                      <img src={investorPhoto} alt="Investor" className="w-full h-full object-cover" />
                    ) : (
                      investorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-base text-foreground leading-tight">{investorName}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-500/20">
                      Active Capital Partner
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                  <div className="flex justify-between items-center"><span className="font-semibold">Email:</span> <span className="font-mono text-foreground font-bold truncate max-w-[200px]">{investorEmail}</span></div>
                  <div className="flex justify-between items-center"><span className="font-semibold">Phone:</span> <span className="font-mono text-foreground font-bold">{investorPhone}</span></div>
                </div>
              </div>

              {/* Shortlisted Asset Summary Box */}
              <div className="bg-background/80 backdrop-blur-md p-5 rounded-2xl border border-border/60 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
                  <Building2 className="w-4 h-4 text-purple-400" /> Shortlisted Asset Breakdown
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Asset Title:</span> <span className="font-bold text-foreground">{propName}</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Ticker Symbol:</span> <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{propSymbol}</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Interest Level:</span> <span className="font-bold text-purple-400">High (Watchlisted)</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground font-semibold">Status:</span> <span className="font-bold text-emerald-400">Trading Active</span></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // Default Fallback
    return (
      <Card key={n.id} onClick={() => markAsRead(n.id, n.read)} className={`p-4 border ${n.read ? 'border-border/50 opacity-70' : 'border-border shadow-sm'} transition-all cursor-pointer rounded-xl flex items-center justify-between gap-4`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">{n.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
            <p className="text-[10px] text-muted-foreground mt-2">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
          </div>
        </div>
        {!n.read && (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, n.read); }} className="h-7 text-xs gap-1 font-bold">
            <Check className="w-3 h-3" /> Mark Read
          </Button>
        )}
      </Card>
    )
  }

  return (
    <AppLayout requiredRole="developer" title="Alerts & Notifications">
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6 pb-20">
        
        <div className="flex flex-col gap-4 border-b border-border/50 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                  <Bell className="w-6 h-6" />
                </div>
                Developer Alerts & Notifications
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Realtime lead alerts, investor inquiries, investment updates & listing approvals.</p>
            </div>

            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                className="gap-2 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/10 h-10 px-4 shadow-sm"
              >
                <CheckCheck className="w-4 h-4 text-primary" /> Mark All as Read ({unreadCount})
              </Button>
            )}
          </div>

          {/* Search Bar & Category Filter Tabs */}
          <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by investor name, email, property ticker, or inquiry text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background border-border/60 rounded-xl text-sm focus:border-primary transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-2xl border border-border/50 overflow-x-auto w-full md:w-auto shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('all')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('inquiries')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'inquiries' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Inquiries
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('investments')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'investments' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Investments
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('watchlist')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'watchlist' ? 'bg-purple-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Watchlist
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('approvals')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'approvals' ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Approvals
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[380px] border border-dashed rounded-3xl bg-card/30 p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-lg font-bold">No Notifications Found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">No updates match your search query or filter selection. You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredNotifications.map(n => renderNotification(n))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

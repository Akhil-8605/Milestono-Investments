'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Bell, Loader2, Info, Building2, CheckCircle2, Clock, MapPin, 
  Mail, Phone, ExternalLink, ShieldCheck, ArrowRight, Sparkles, 
  TrendingUp, Send, Receipt, Banknote, AlertCircle, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AppNotification } from '@/lib/notifications'
import { format } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function InvestorAlertsPage() {
  const { user } = useSession()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null)
  const [developersMap, setDevelopersMap] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'all' | 'developer' | 'payments' | 'admin'>('all')

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('role', '==', 'investor')
    )
    const unsubscribe = onSnapshot(q, (snap) => {
      let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification))
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()
        return timeB - timeA
      })
      setNotifications(docs)
      setIsLoading(false)
    }, (err) => {
      console.error(err)
      toast.error('Failed to load realtime alerts')
      setIsLoading(false)
    })

    const unsubDevs = onSnapshot(collection(db, 'developers'), (snap) => {
      const devMap: Record<string, any> = {}
      snap.docs.forEach(doc => {
        const data = doc.data()
        const fullDev = { id: doc.id, ...data }
        devMap[doc.id] = fullDev
        if (data.developerId) devMap[data.developerId] = fullDev
        if (data.globalId) devMap[data.globalId] = fullDev
      })
      setDevelopersMap(devMap)
    })

    return () => { unsubscribe(); unsubDevs(); }
  }, [user])

  const markAsRead = async (id?: string, currentlyRead?: boolean) => {
    if (!id || currentlyRead) return
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      toast.success('Marked as read')
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadDocs = notifications.filter(n => !n.read && n.id)
    if (unreadDocs.length === 0) return
    try {
      await Promise.all(unreadDocs.map(n => updateDoc(doc(db, 'notifications', n.id!), { read: true })))
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (err) {
      console.error(err)
      toast.error('Failed to mark all as read')
    }
  }

  const handleOpenMessage = (n: AppNotification) => {
    setSelectedNotification(n)
    if (!n.read && n.id) {
      markAsRead(n.id, false)
    }
  }

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications
    if (activeTab === 'developer') {
      return notifications.filter(n => 
        n.type === 'developer_message' || 
        n.type === 'developer_reply' || 
        n.type === 'inquiry_sent' || 
        n.type === 'inquiry_received'
      )
    }
    if (activeTab === 'payments') {
      return notifications.filter(n => 
        n.type === 'investment_received' || 
        n.type === 'investment_confirm' || 
        n.type === 'payment_successful' || 
        n.type === 'order_placed' || 
        n.type === 'neft_submitted' || 
        n.type === 'neft_on_hold' || 
        n.type === 'transaction_approved'
      )
    }
    if (activeTab === 'admin') {
      return notifications.filter(n => 
        n.type === 'admin_message' || 
        n.type === 'system' || 
        n.type === 'general' || 
        n.type === 'welcome' || 
        n.type === 'welcome_message'
      )
    }
    return notifications
  }, [notifications, activeTab])

  const renderNotification = (n: AppNotification) => {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || Date.now())
    const rawDevId = n.metadata?.globalId || n.metadata?.developerId || (n as any).developerId || 'DEV001'
    const devData = developersMap[rawDevId] || developersMap[n.metadata?.developerId] || {}
    const devId = n.metadata?.globalId || n.metadata?.developerId || devData.developerId || devData.globalId || rawDevId
    const nType = n.type as string

    const senderName = n.metadata?.developerCompany || n.metadata?.senderName || devData.companyName || 'Developer Partner'
    const developerLogo = n.metadata?.developerLogo || devData.logo || devData.companyLogo
    const developerBanner = n.metadata?.developerBanner || devData.banner || devData.companyBanner || n.metadata?.propertyImage
    const developerPhone = n.metadata?.developerPhone || devData.companyPhone || devData.phone

    // 1. Message from Developer
    if (nType === 'developer_reply' || nType === 'developer_message') {
      return (
        <Card key={n.id} className={cn('p-6 border transition-all rounded-3xl relative overflow-hidden bg-gradient-to-br from-card via-card to-indigo-500/5', n.read ? 'border-border/60 opacity-85' : 'border-indigo-500/40 shadow-xl shadow-indigo-500/5 hover:border-indigo-500/60')}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">Message from Developer</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Response</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-indigo-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md animate-pulse">New</span>}
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border/60 border-l-4 border-l-indigo-500 space-y-2 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject: {n.title}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">"{n.message}"</p>
                {n.metadata?.inquiryMessage && (
                  <div className="mt-3 pt-2.5 border-t border-border/40 text-xs text-muted-foreground italic flex items-start gap-1.5">
                    <span className="font-semibold not-italic text-foreground shrink-0">Original Inquiry:</span>
                    <span className="line-clamp-2">"{n.metadata.inquiryMessage}"</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button variant="outline" size="sm" onClick={() => handleOpenMessage(n)} className="gap-2 text-xs font-bold rounded-xl border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10">
                  <Mail className="w-3.5 h-3.5" /> Read Full Message
                </Button>
                <Link href={`/developers/${devId}`}>
                  <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold rounded-xl bg-muted/60 hover:bg-muted border border-border/50">
                    <Building2 className="w-3.5 h-3.5" /> Developer Profile <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                {n.metadata?.propertySymbol && (
                  <Link href={`/properties/${n.metadata.propertyId || n.metadata.propertySymbol}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/30">
                      <Building2 className="w-3.5 h-3.5" /> View Property ({n.metadata.propertySymbol}) <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as read
                  </Button>
                )}
              </div>
            </div>

            {/* Aesthetic Developer Profile Card */}
            <div className="w-full md:w-72 bg-card border border-border/60 rounded-2xl p-4 shrink-0 overflow-hidden relative shadow-sm">
              {developerBanner ? (
                <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden">
                  <img src={developerBanner} className="w-full h-full object-cover opacity-70" alt="Banner" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-card" />
                </div>
              ) : (
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
              )}
              
              <div className="relative z-10 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-background border shadow-md shrink-0 flex items-center justify-center">
                    {developerLogo ? (
                      <img src={developerLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-1">{senderName}</h4>
                    <span className="text-[10px] text-indigo-500 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md font-semibold mt-1 inline-block border border-indigo-500/20">
                      ID: {devId}
                    </span>
                  </div>
                </div>

                {developerPhone && (
                  <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3 mt-2 font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {developerPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // 2. Inquiry Sent by Investor
    if (nType === 'inquiry_sent') {
      return (
        <Card key={n.id} className={cn('p-6 border transition-all rounded-3xl relative overflow-hidden bg-gradient-to-br from-card via-card to-sky-500/5', n.read ? 'border-border/60 opacity-85' : 'border-sky-500/40 shadow-xl shadow-sky-500/5 hover:border-sky-500/60')}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0 shadow-inner">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">Inquiry Sent to Developer</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">Delivered</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-sky-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">Sent</span>}
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border/60 border-l-4 border-l-sky-500 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Property: {n.metadata?.propertySymbol || n.metadata?.propertyName || n.title}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed italic">"{n.message}"</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {n.metadata?.propertySymbol && (
                  <Link href={`/properties/${n.metadata.propertyId || n.metadata.propertySymbol}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 border-sky-500/30">
                      <Building2 className="w-3.5 h-3.5" /> Property Details ({n.metadata.propertySymbol}) <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
                {devId && (
                  <Link href={`/developers/${devId}`}>
                    <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-bold rounded-xl bg-muted/60 hover:bg-muted border border-border/50">
                      <Building2 className="w-3.5 h-3.5" /> Developer Profile
                    </Button>
                  </Link>
                )}
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // 3. Admin Message / System Platform Announcement
    if (nType === 'admin_message' || nType === 'system' || nType === 'general') {
      return (
        <Card key={n.id} className={cn('p-6 border transition-all rounded-3xl relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5', n.read ? 'border-border/60 opacity-85' : 'border-primary/40 shadow-xl shadow-primary/10 hover:border-primary/60')}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">Official Admin Notice</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Milestono Official</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">Official</span>}
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border/60 border-l-4 border-l-primary space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{n.title}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">"{n.message}"</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button variant="outline" size="sm" onClick={() => handleOpenMessage(n)} className="gap-2 text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                  <ShieldCheck className="w-3.5 h-3.5" /> Read Official Notice
                </Button>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as read
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full md:w-64 bg-primary/5 border border-primary/20 rounded-2xl p-6 shrink-0 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary border border-primary/20 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Milestono Support</h4>
              <p className="text-xs text-muted-foreground mt-1">Platform Admin Verified</p>
            </div>
          </div>
        </Card>
      )
    }

    // 4. Investment Confirmed
    if (nType === 'investment_received' || nType === 'investment_confirm' || nType === 'transaction_approved') {
      return (
        <Card key={n.id} className={cn('p-6 border transition-all rounded-3xl relative overflow-hidden bg-gradient-to-br from-card via-card to-emerald-500/10', n.read ? 'border-border/60 opacity-85' : 'border-emerald-500/40 shadow-xl shadow-emerald-500/10 hover:border-emerald-500/60')}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">Investment Confirmed!</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Ownership Verified</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">Confirmed</span>}
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border/60 border-l-4 border-l-emerald-500 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{n.title}</p>
                  {n.metadata?.propertySymbol && (
                    <span className="text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {n.metadata.propertySymbol}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">{n.message}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/investor/portfolio">
                  <Button size="sm" className="gap-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5" /> View Portfolio Holdings <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                {n.metadata?.propertySymbol && (
                  <Link href={`/properties/${n.metadata.propertyId || n.metadata.propertySymbol}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                      <Building2 className="w-3.5 h-3.5" /> Asset Page
                    </Button>
                  </Link>
                )}
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // 5. Payment Confirmed / Order Placed
    if (nType === 'payment_successful' || nType === 'order_placed') {
      return (
        <Card key={n.id} className={cn('p-6 border transition-all rounded-3xl relative overflow-hidden bg-gradient-to-br from-card via-card to-cyan-500/10', n.read ? 'border-border/60 opacity-85' : 'border-cyan-500/40 shadow-xl shadow-cyan-500/10 hover:border-cyan-500/60')}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 shrink-0 shadow-inner">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">Payment Received & Order Placed</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Payment Successful</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-cyan-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">Paid</span>}
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border/60 border-l-4 border-l-cyan-500 space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{n.title}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">{n.message}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href={`/investor/orders/${n.metadata?.orderId || ''}`}>
                  <Button size="sm" className="gap-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/20">
                    <Receipt className="w-3.5 h-3.5" /> View Order Receipt <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // 6. Token Paid & NEFT Submitted / Pending
    if (nType === 'neft_submitted' || nType === 'neft_on_hold') {
      return (
        <Card key={n.id} className={cn('p-6 border transition-all rounded-3xl relative overflow-hidden bg-gradient-to-br from-card via-card to-amber-500/10', n.read ? 'border-border/60 opacity-85' : 'border-amber-500/40 shadow-xl shadow-amber-500/10 hover:border-amber-500/60')}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">Token Paid - NEFT Verification Pending</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">In Progress</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-amber-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">Pending</span>}
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border/60 border-l-4 border-l-amber-500 space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{n.title}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">{n.message}</p>
                {n.metadata?.utrNumber && (
                  <div className="text-xs font-mono font-bold text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-lg w-max border border-amber-500/20">
                    UTR Ref: {n.metadata.utrNumber}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href={`/investor/orders`}>
                  <Button size="sm" variant="outline" className="gap-2 text-xs font-bold rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                    <Banknote className="w-3.5 h-3.5" /> Check Bank Status <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // 7. Welcome Message
    if (nType === 'welcome' || nType === 'welcome_message') {
      return (
        <Card key={n.id} className={cn('p-6 border transition-all rounded-3xl relative overflow-hidden bg-gradient-to-br from-card via-purple-500/5 to-pink-500/10', n.read ? 'border-border/60 opacity-85' : 'border-purple-500/40 shadow-xl shadow-purple-500/10 hover:border-purple-500/60')}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0 shadow-inner">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">Welcome to Milestono!</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Getting Started</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-purple-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">Welcome</span>}
              </div>

              <div className="bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border/60 border-l-4 border-l-purple-500 space-y-1">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">{n.title || 'Welcome Aboard'}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">{n.message}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/market">
                  <Button size="sm" className="gap-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20">
                    <Building2 className="w-3.5 h-3.5" /> Explore Properties Market <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                <Link href="/investor/profile">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold rounded-xl border-purple-500/30 text-purple-600 hover:bg-purple-500/10">
                    Complete Profile
                  </Button>
                </Link>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // 8. Watchlist & Generic Fallback
    return (
      <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={cn('p-5 border transition-all cursor-pointer rounded-3xl flex items-start gap-4 hover:border-primary/50 bg-gradient-to-br from-card via-card to-muted/20', n.read ? 'border-border/50 opacity-75' : 'border-purple-500/30 shadow-md')}>
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0 shadow-inner">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
            <p className="text-[10px] text-muted-foreground">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
          {!n.read && (
            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id, false) }} className="gap-1 text-xs font-bold rounded-xl text-emerald-600 hover:bg-emerald-500/10">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark read
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <AppLayout requiredRole="investor" title="Alerts & Updates">
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                <Bell className="w-6 h-6" />
              </div>
              Alerts & Updates
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time status tracking for developer replies, investments, NEFT payments & announcements.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead} 
                className="rounded-xl text-xs font-bold h-9 px-4 gap-2 bg-background border-border/80 hover:bg-muted text-foreground shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mark all as read ({unreadCount})
              </Button>
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-2xl border border-border/50 overflow-x-auto">
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
                onClick={() => setActiveTab('developer')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'developer' ? 'bg-indigo-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Developer Replies
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('payments')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'payments' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Investments & Orders
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('admin')}
                className={cn('rounded-xl text-xs font-bold h-9 px-3.5 transition-all', activeTab === 'admin' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Admin Notices
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
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">No updates in this category. You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredNotifications.map(n => renderNotification(n))}
          </div>
        )}

        {/* Full Message View Modal */}
        {selectedNotification && (
          <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
            <DialogContent className="max-w-xl rounded-3xl p-6 border border-border/80 shadow-2xl bg-card/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  {selectedNotification.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 my-2">
                <div className="bg-background p-4 rounded-2xl border border-border/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Message Details</p>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>

                {/* Developer Info in Modal */}
                {selectedNotification.metadata?.developerId && (
                  <div className="bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center border shrink-0">
                        {developersMap[selectedNotification.metadata?.developerId || '']?.logo || selectedNotification.metadata?.developerLogo ? (
                          <img src={developersMap[selectedNotification.metadata?.developerId || '']?.logo || selectedNotification.metadata?.developerLogo} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{developersMap[selectedNotification.metadata?.developerId || '']?.companyName || selectedNotification.metadata?.developerCompany || 'Developer Partner'}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {developersMap[selectedNotification.metadata?.developerId || '']?.developerId || (selectedNotification.metadata?.developerId || '').substring(0, 6).toUpperCase()}</p>
                      </div>
                    </div>
                    <Link href={`/developers/${developersMap[selectedNotification.metadata?.developerId || '']?.developerId || (selectedNotification.metadata?.developerId || '').substring(0, 6).toUpperCase()}`}>
                      <Button size="sm" className="gap-1 rounded-xl font-bold">
                        View Profile <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </AppLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bell, Loader2, Info, Building2, CheckCircle2, Clock, MapPin, Mail, Phone, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AppNotification } from '@/lib/notifications'
import { format } from 'date-fns'
import Link from 'next/link'

export default function InvestorAlertsPage() {
  const { user } = useSession()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null)

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
    return () => unsubscribe()
  }, [user])

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenMessage = (n: AppNotification) => {
    setSelectedNotification(n)
    if (!n.read && n.id) {
      markAsRead(n.id, false)
    }
  }

  const renderNotification = (n: AppNotification) => {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || Date.now())
    const devId = n.metadata?.developerId || (n as any).developerId || 'DEV001'

    if (n.type === 'developer_reply' || n.type === 'developer_message') {
      return (
        <Card key={n.id} className={`p-6 border ${n.read ? 'border-border/50 opacity-80' : 'border-indigo-500/40 shadow-lg shadow-indigo-500/10'} transition-all rounded-2xl bg-gradient-to-br from-card via-card to-indigo-500/5 hover:border-indigo-500/60`}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight text-foreground">{n.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
                {!n.read && <span className="ml-auto bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>}
              </div>
              
              <div className="bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border/60 border-l-4 border-l-indigo-500">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Message Preview:</p>
                <p className="text-sm font-medium text-foreground line-clamp-3">"{n.message}"</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button variant="outline" size="sm" onClick={() => handleOpenMessage(n)} className="gap-2 text-xs font-bold rounded-xl border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10">
                  <Mail className="w-3.5 h-3.5" /> Read Full Message
                </Button>
                <Link href={`/developers/${devId}`}>
                  <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold rounded-xl">
                    <Building2 className="w-3.5 h-3.5" /> Developer Profile <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                {n.metadata?.propertySymbol && (
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full flex items-center gap-1.5 ml-auto">
                    <Building2 className="w-3 h-3 text-primary" /> {n.metadata.propertySymbol}
                  </span>
                )}
              </div>
            </div>

            {/* Aesthetic Developer Profile Card */}
            <div className="w-full md:w-72 bg-card border border-border/60 rounded-2xl p-4 shrink-0 overflow-hidden relative shadow-sm">
              {n.metadata?.developerBanner ? (
                <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden">
                  <img src={n.metadata.developerBanner} className="w-full h-full object-cover opacity-60" alt="Banner" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>
              ) : (
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
              )}
              
              <div className="relative z-10 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-background border shadow-md shrink-0">
                    {n.metadata?.developerLogo ? (
                      <img src={n.metadata.developerLogo} alt="Developer Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-1">{n.metadata?.developerCompany || 'Developer Partner'}</h4>
                    <span className="text-[10px] text-indigo-500 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md font-semibold mt-1 inline-block">
                      ID: {devId}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3 mt-2">
                  {n.metadata?.developerPhone && (
                    <p className="flex items-center gap-2 font-medium">
                      <Phone className="w-3 h-3 text-indigo-500 shrink-0" /> {n.metadata.developerPhone}
                    </p>
                  )}
                  {n.metadata?.developerAddress && (
                    <p className="flex items-start gap-2 text-[11px]">
                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" /> 
                      <span className="line-clamp-2">{n.metadata.developerAddress}</span>
                    </p>
                  )}
                  <div className="pt-2">
                    <Link href={`/developers/${devId}`} className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1">
                      View Full Portfolio <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    let Icon = Info
    let colorClass = 'text-blue-500'
    let bgClass = 'bg-blue-500/10'
    let borderClass = 'border-blue-500/30'

    if (n.type === 'payment_successful' || n.type === 'order_placed') {
      Icon = CheckCircle2
      colorClass = 'text-emerald-500'
      bgClass = 'bg-emerald-500/10'
      borderClass = 'border-emerald-500/30'
    } else if (n.type === 'neft_submitted' || n.type === 'neft_on_hold') {
      Icon = Clock
      colorClass = 'text-amber-500'
      bgClass = 'bg-amber-500/10'
      borderClass = 'border-amber-500/30'
    } else if (n.type === 'watchlist_alert') {
      Icon = Bell
      colorClass = 'text-purple-500'
      bgClass = 'bg-purple-500/10'
      borderClass = 'border-purple-500/30'
    }

    return (
      <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={`p-4 border ${n.read ? 'border-border/50 opacity-70' : `${borderClass} shadow-sm`} transition-all cursor-pointer rounded-xl flex items-start gap-4 hover:border-primary/50`}>
        <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${colorClass} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm">{n.title}</h4>
            <p className="text-[10px] text-muted-foreground">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
        </div>
      </Card>
    )
  }

  return (
    <AppLayout requiredRole="investor" title="Alerts & Updates">
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6 pb-20">
        
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Updates</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your order statuses, developer replies, and watchlist alerts in real-time.</p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] border border-dashed rounded-2xl bg-card/30">
            <Bell className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-lg font-bold">No Updates</p>
            <p className="text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(n => renderNotification(n))}
          </div>
        )}

        {/* Full Message View Modal */}
        {selectedNotification && (
          <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
            <DialogContent className="max-w-xl rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  {selectedNotification.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 my-2">
                <div className="bg-muted/40 p-4 rounded-xl border border-border/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Message Details</p>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>

                {/* Developer Info in Modal */}
                <div className="bg-card border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center border shrink-0">
                      {selectedNotification.metadata?.developerLogo ? (
                        <img src={selectedNotification.metadata.developerLogo} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{selectedNotification.metadata?.developerCompany || 'Developer Partner'}</p>
                      <p className="text-xs text-muted-foreground">ID: {selectedNotification.metadata?.developerId || (selectedNotification as any).developerId || 'DEV001'}</p>
                    </div>
                  </div>
                  <Link href={`/developers/${selectedNotification.metadata?.developerId || (selectedNotification as any).developerId || 'DEV001'}`}>
                    <Button size="sm" className="gap-1 rounded-xl">
                      View Profile <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </AppLayout>
  )
}

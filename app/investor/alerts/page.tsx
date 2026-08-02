'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Bell, Loader2, Info, Building2, CheckCircle2, Clock, MapPin, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AppNotification } from '@/lib/notifications'
import { format } from 'date-fns'

export default function InvestorAlertsPage() {
  const { user } = useSession()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const renderNotification = (n: AppNotification) => {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || Date.now())

    if (n.type === 'developer_reply') {
      return (
        <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={`p-6 border ${n.read ? 'border-border/50 opacity-70' : 'border-indigo-500/30 shadow-lg shadow-indigo-500/10'} transition-all cursor-pointer rounded-2xl bg-gradient-to-br from-card to-indigo-500/5`}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg">{n.title}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
              </div>
              
              <div className="bg-background p-4 rounded-xl border mb-4 border-l-4 border-l-indigo-500">
                <p className="text-sm font-medium">Message:</p>
                <p className="text-sm text-muted-foreground mt-1">"{n.message}"</p>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 bg-indigo-500/10 w-fit px-3 py-1.5 rounded-full">
                <Building2 className="w-3.5 h-3.5" /> Property: {n.metadata?.propertySymbol}
              </div>
            </div>

            <div className="w-full md:w-64 bg-background border rounded-xl p-4 shrink-0 overflow-hidden relative">
              {n.metadata?.developerBanner && (
                <div className="absolute top-0 left-0 right-0 h-12">
                  <img src={n.metadata.developerBanner} className="w-full h-full object-cover opacity-50" />
                </div>
              )}
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-6 relative z-10">Developer Profile</h4>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-background border shadow-sm">
                  {n.metadata?.developerLogo ? (
                    <img src={n.metadata.developerLogo} alt="Developer" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-full h-full p-2 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">{n.metadata?.developerCompany || 'Developer'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded mt-1 inline-block">{n.metadata?.developerId || 'ID'}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs relative z-10">
                {n.metadata?.developerPhone && <p className="flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground" /> {n.metadata.developerPhone}</p>}
                {n.metadata?.developerAddress && <p className="flex items-start gap-2"><MapPin className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" /> <span className="line-clamp-2">{n.metadata.developerAddress}</span></p>}
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
      <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={`p-4 border ${n.read ? 'border-border/50 opacity-70' : `${borderClass} shadow-sm`} transition-all cursor-pointer rounded-xl flex items-start gap-4`}>
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
          <p className="text-muted-foreground text-sm mt-1">Track your order statuses, developer replies, and watchlist alerts.</p>
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
      </div>
    </AppLayout>
  )
}

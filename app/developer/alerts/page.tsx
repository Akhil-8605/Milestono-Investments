'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Bell, FileCheck, XCircle, User, MessageCircle, AlertCircle, Eye, CheckCircle2, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { AppNotification } from '@/lib/notifications'
import { format } from 'date-fns'

export default function DeveloperAlertsPage() {
  const { user } = useSession()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('role', '==', 'developer')
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

    if (n.type === 'property_rejected') {
      return (
        <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={`p-0 overflow-hidden border ${n.read ? 'border-border/50 opacity-70' : 'border-rose-500/30 shadow-lg shadow-rose-500/10'} transition-all cursor-pointer rounded-2xl`}>
          <div className="bg-rose-500/10 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
              {n.metadata?.propertyImage ? (
                <img src={n.metadata.propertyImage} alt="Property" className="w-full h-full object-cover" />
              ) : (
                <XCircle className="w-10 h-10 text-rose-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white px-2 py-0.5 rounded">Rejected</span>
                <span className="text-xs text-muted-foreground font-medium">{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
              </div>
              <h3 className="text-xl font-bold text-rose-600 mb-1">{n.title}</h3>
              <p className="text-sm font-semibold text-foreground mb-3">{n.metadata?.propertyName} <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border ml-2">{n.metadata?.propertySymbol}</span></p>
              <div className="bg-background p-4 rounded-xl border border-rose-500/20 text-sm text-muted-foreground italic border-l-4 border-l-rose-500 mb-4">
                "{n.message}"
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(n.id!, n.read);
                  window.location.href = `/developer/list?edit=${n.metadata?.propertySymbol}`;
                }}
              >
                Edit & Resubmit Property
              </Button>
            </div>
          </div>
        </Card>
      )
    }

    if (n.type === 'investor_inquiry') {
      return (
        <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={`p-6 border ${n.read ? 'border-border/50 opacity-70' : 'border-primary/30 shadow-lg shadow-primary/10'} transition-all cursor-pointer rounded-2xl bg-gradient-to-br from-card to-primary/5`}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg">{n.title}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{format(date, 'MMM dd, yyyy')}</span>
              </div>
              
              <div className="bg-background p-4 rounded-xl border mb-4">
                <p className="text-sm font-medium">Message:</p>
                <p className="text-sm text-muted-foreground mt-1">"{n.message}"</p>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 w-fit px-3 py-1.5 rounded-full">
                <Building2 className="w-3.5 h-3.5" /> Regarding: {n.metadata?.propertySymbol}
              </div>
            </div>

            <div className="w-full md:w-64 bg-background border rounded-xl p-4 shrink-0">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 border-b pb-2">Investor Profile</h4>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border">
                  {n.metadata?.investorPhoto ? (
                    <img src={n.metadata.investorPhoto} alt="Investor" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full p-2 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">{n.metadata?.investorName || 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground">{n.metadata?.investorOccupation || 'Investor'}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <p><span className="text-muted-foreground font-medium">Email:</span> {n.metadata?.investorEmail}</p>
                <p><span className="text-muted-foreground font-medium">Phone:</span> {n.metadata?.investorPhone}</p>
                {n.metadata?.investorIncome && <p><span className="text-muted-foreground font-medium">Income:</span> {n.metadata?.investorIncome}</p>}
              </div>
            </div>
          </div>
        </Card>
      )
    }

    if (n.type === 'investor_watchlisted') {
      return (
        <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={`p-4 border ${n.read ? 'border-border/50 opacity-70' : 'border-indigo-500/30 bg-indigo-500/5'} transition-all cursor-pointer rounded-xl flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-bold">{n.metadata?.investorName}</span> ({n.metadata?.investorEmail}) watchlisted your property <span className="font-bold text-indigo-500">{n.metadata?.propertySymbol}</span>.
            </p>
            <p className="text-xs text-muted-foreground mt-1">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
          </div>
        </Card>
      )
    }

    // Default Fallback
    return (
      <Card key={n.id} onClick={() => markAsRead(n.id!, n.read)} className={`p-4 border ${n.read ? 'border-border/50 opacity-70' : 'border-border shadow-sm'} transition-all cursor-pointer rounded-xl flex items-start gap-4`}>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm">{n.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
          <p className="text-[10px] text-muted-foreground mt-2">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
        </div>
      </Card>
    )
  }

  return (
    <AppLayout requiredRole="developer" title="Alerts & Notifications">
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6 pb-20">
        
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated on property approvals, rejections, and investor inquiries.</p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] border border-dashed rounded-2xl bg-card/30">
            <Bell className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-lg font-bold">No Notifications</p>
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

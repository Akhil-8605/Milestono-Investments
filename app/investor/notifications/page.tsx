'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AppNotification } from '@/lib/types'
import { Bell, CheckCircle2, Inbox, MessageSquare, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/shell/session-context'

export default function InvestorNotificationsPage() {
  const router = useRouter()
  const { user } = useSession()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const investorId = user?.id

  useEffect(() => {
    if (investorId) {
      fetchNotifications()
    } else if (user === null) {
      // Not logged in
      setIsLoading(false)
    }
  }, [investorId, user])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${investorId}`)
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data)
      }
    } catch (e) {
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpen = (notification: AppNotification) => {
    markAsRead(notification.id)
    if (notification.data?.propertyTickerId) {
      router.push(`/market`) // Update this to actual details page later if needed
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppLayout requiredRole="investor" title="Notifications">
      {/* Background styling */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/10 via-background/50 to-background pointer-events-none -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border/50 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              Inbox Center
            </h1>
            <p className="text-muted-foreground mt-2 text-sm font-medium">You have <strong className="text-foreground">{unreadCount}</strong> unread messages requiring your attention.</p>
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-xl bg-background/50 backdrop-blur font-bold hover:bg-muted shadow-sm transition-all" onClick={() => notifications.filter(n=>!n.read).forEach(n => markAsRead(n.id))}>
            <CheckCircle2 className="w-5 h-5 mr-2" /> Mark all as read
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-12 rounded-xl bg-muted/50 p-1 mb-8">
            <TabsTrigger value="all" className="rounded-lg font-bold text-sm">All Notifications</TabsTrigger>
            <TabsTrigger value="unread" className="rounded-lg font-bold text-sm flex items-center gap-2">
              Unread 
              {unreadCount > 0 && <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-[10px] animate-pulse">{unreadCount}</span>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 outline-none">
            <NotificationList notifications={notifications} onOpen={handleOpen} onMarkRead={markAsRead} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="unread" className="space-y-4 outline-none">
            <NotificationList notifications={notifications.filter(n => !n.read)} onOpen={handleOpen} onMarkRead={markAsRead} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}

function NotificationList({ notifications, onOpen, onMarkRead, isLoading }: any) {
  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  if (notifications.length === 0) {
    return (
      <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 rounded-3xl bg-card/30 backdrop-blur-sm text-center shadow-none">
        <Inbox className="h-16 w-16 text-muted-foreground mb-6 opacity-30" />
        <h3 className="text-xl font-bold text-foreground">You're all caught up!</h3>
        <p className="text-muted-foreground font-medium mt-2 max-w-md">No notifications to show. When you receive updates on your investments or properties, they'll appear here.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif: AppNotification) => (
        <Card 
          key={notif.id} 
          className={`p-6 rounded-2xl transition-all duration-300 group ${!notif.read ? 'border-l-[6px] border-l-primary bg-card/80 backdrop-blur-xl shadow-lg scale-[1.01]' : 'bg-muted/20 border-border/50 shadow-sm hover:bg-muted/40'}`}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${!notif.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {notif.type === 'inquiry_sent' ? <MessageSquare className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h4 className={`text-lg font-bold tracking-tight ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</h4>
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-2 md:mt-0">{formatDistanceToNow(new Date(notif.createdAt))} ago</span>
              </div>
              <p className={`text-sm leading-relaxed max-w-3xl ${!notif.read ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                {notif.message}
              </p>
              
              <div className="flex items-center gap-3 mt-6">
                <Button size="sm" onClick={() => onOpen(notif)} className={`h-9 px-4 rounded-lg font-bold shadow-sm transition-all ${!notif.read ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5' : 'bg-background hover:bg-muted text-foreground border border-border'}`}>
                  View Details <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
                {!notif.read && (
                  <Button size="sm" variant="ghost" onClick={() => onMarkRead(notif.id)} className="h-9 px-4 rounded-lg font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

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

export default function DeveloperNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const developerId = 'developer-1' // Dummy for demo

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${developerId}`)
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
    if (notification.type === 'inquiry_received' && notification.data?.propertyTickerId) {
      router.push(`/developer/properties/${notification.data.propertyTickerId}`)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppLayout requiredRole="developer" title="Notifications">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
            <p className="text-muted-foreground mt-1 text-sm">You have {unreadCount} unread messages.</p>
          </div>
          <Button variant="outline" onClick={() => notifications.filter(n=>!n.read).forEach(n => markAsRead(n.id))}>
            Mark all as read
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">{unreadCount}</span></TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6 space-y-4">
            <NotificationList notifications={notifications} onOpen={handleOpen} onMarkRead={markAsRead} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="unread" className="mt-6 space-y-4">
            <NotificationList notifications={notifications.filter(n => !n.read)} onOpen={handleOpen} onMarkRead={markAsRead} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}

function NotificationList({ notifications, onOpen, onMarkRead, isLoading }: any) {
  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (notifications.length === 0) {
    return (
      <Card className="flex flex-col h-48 items-center justify-center border-dashed text-center">
        <Inbox className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-muted-foreground">No Notifications</h3>
      </Card>
    )
  }

  return (
    <>
      {notifications.map((notif: AppNotification) => (
        <Card 
          key={notif.id} 
          className={`p-4 transition-all duration-300 ${!notif.read ? 'border-l-4 border-l-primary bg-card shadow-md' : 'bg-muted/30 border-l-4 border-l-transparent'}`}
        >
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {notif.type === 'inquiry_received' ? <MessageSquare className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`font-semibold ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</h4>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notif.createdAt))} ago</span>
              </div>
              <p className={`text-sm mt-1 leading-relaxed ${!notif.read ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                {notif.message}
              </p>
              
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" onClick={() => onOpen(notif)} className="gap-2 bg-primary/10 text-primary hover:bg-primary/20">
                  Open <ArrowRight className="w-3 h-3" />
                </Button>
                {!notif.read && (
                  <Button size="sm" variant="ghost" onClick={() => onMarkRead(notif.id)} className="gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3" /> Mark read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  )
}

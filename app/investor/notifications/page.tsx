'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AppNotification } from '@/lib/types'
import { Bell, CheckCircle2, Inbox, MessageSquare, Loader2, ArrowRight, Building2, ExternalLink, Mail, Phone, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/shell/session-context'
import Link from 'next/link'

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

  const markAsRead = async (id?: string) => {
    if (!id) return
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpen = (notification: AppNotification) => {
    markAsRead(notification.id)
    if (notification.metadata?.propertyId || notification.metadata?.propertySymbol || notification.data?.propertyTickerId) {
      const target = notification.metadata?.propertyId || notification.metadata?.propertySymbol || notification.data?.propertyTickerId
      router.push(`/properties/${target}`)
    } else if (notification.metadata?.developerId || notification.metadata?.devId) {
      const devId = notification.metadata?.developerId || notification.metadata?.devId
      router.push(`/developers/${devId}`)
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

  const parseTimestamp = (val: any) => {
    if (!val) return new Date()
    if (typeof val.toDate === 'function') return val.toDate()
    return new Date(val)
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif: AppNotification) => {
        const meta = notif.metadata || notif.data || {}
        const isDevMsg = notif.type === 'developer_message' || notif.type === 'developer_reply' || notif.type === 'inquiry_sent'
        const devId = meta.devId || meta.developerId || meta.globalId || 'DEV001'
        const devName = meta.developerCompany || meta.senderName || 'Developer Partner'
        const devLogo = meta.developerLogo
        const devBanner = meta.developerBanner || meta.propertyImage
        const devPhone = meta.developerPhone
        const propertySymbol = meta.propertySymbol || meta.propertyTicker
        const propertyId = meta.propertyId

        return (
          <Card 
            key={notif.id} 
            className={`p-6 rounded-2xl transition-all duration-300 group overflow-hidden ${!notif.read ? 'border-l-[6px] border-l-primary bg-card/80 backdrop-blur-xl shadow-lg' : 'bg-muted/20 border-border/50 shadow-sm hover:bg-muted/40'}`}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${!notif.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {isDevMsg ? <MessageSquare className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className={`text-base font-bold tracking-tight ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</h4>
                      <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(parseTimestamp(notif.createdAt))} ago</span>
                    </div>
                  </div>
                  {!notif.read && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>}
                </div>

                <div className="bg-background/80 p-4 rounded-xl border border-border/50">
                  <p className={`text-sm leading-relaxed ${!notif.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    "{notif.message}"
                  </p>
                  {meta.inquiryMessage && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40 italic">
                      Original Inquiry: "{meta.inquiryMessage}"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button size="sm" onClick={() => onOpen(notif)} className={`h-9 px-4 rounded-xl font-bold shadow-sm transition-all ${!notif.read ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background hover:bg-muted text-foreground border border-border'}`}>
                    View Details <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>

                  {devId && (
                    <Link href={`/developers/${devId}`}>
                      <Button size="sm" variant="outline" className="h-9 px-4 rounded-xl font-bold gap-1.5 text-xs bg-muted/30 hover:bg-muted border-border/60">
                        <Building2 className="w-3.5 h-3.5" /> Developer Profile
                      </Button>
                    </Link>
                  )}

                  {propertySymbol && (
                    <Link href={`/properties/${propertyId || propertySymbol}`}>
                      <Button size="sm" variant="outline" className="h-9 px-4 rounded-xl font-bold gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-primary/30">
                        <Building2 className="w-3.5 h-3.5" /> View Property ({propertySymbol}) <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}

                  {!notif.read && (
                    <Button size="sm" variant="ghost" onClick={() => onMarkRead(notif.id)} className="h-9 px-3 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark read
                    </Button>
                  )}
                </div>
              </div>

              {/* Developer Sidebar Card */}
              {isDevMsg && (
                <div className="w-full md:w-64 bg-card border border-border/60 rounded-xl p-4 shrink-0 relative overflow-hidden shadow-sm">
                  {devBanner ? (
                    <div className="absolute top-0 left-0 right-0 h-14 overflow-hidden">
                      <img src={devBanner} className="w-full h-full object-cover opacity-70" alt="Banner" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-card" />
                    </div>
                  ) : (
                    <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
                  )}

                  <div className="relative z-10 pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-background border shadow-sm shrink-0 flex items-center justify-center">
                        {devLogo ? (
                          <img src={devLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs leading-tight text-foreground line-clamp-1">{devName}</h5>
                        <span className="text-[10px] text-indigo-500 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md font-semibold mt-1 inline-block">
                          ID: {devId}
                        </span>
                      </div>
                    </div>

                    {devPhone && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 border-t border-border/40 pt-2 mt-2 font-medium">
                        <Phone className="w-3 h-3 text-indigo-500 shrink-0" /> {devPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

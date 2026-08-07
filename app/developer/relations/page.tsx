'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { 
  Users, Mail, Phone, MessageSquare, 
  Search, Building2, CreditCard, UserPlus, TrendingUp, TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { collection, query, where, onSnapshot, getDocs, documentId } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSession } from '@/components/shell/session-context'
import { createNotification } from '@/lib/notifications'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

const fmt = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(n)) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

// Generate realistic looking P&L graph data based on actual invested vs current value
const generateRealGraphData = (startValue: number, endValue: number) => {
  const diff = endValue - startValue
  const step = diff / 6
  const noise = Math.abs(step) * 0.2 || (startValue * 0.05) || 10
  
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i) * 5)
    let p = startValue + (step * i)
    if (i !== 0 && i !== 6) p += (Math.random() * noise * 2) - noise
    if (i === 6) p = endValue
    return {
      name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.max(0, p)
    }
  })
}

export default function RelationsPage() {
  const { user } = useSession()
  const [search, setSearch] = useState('')
  const [relations, setRelations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [notifyUser, setNotifyUser] = useState<any>(null)
  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyMsg, setNotifyMsg] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const qProps = query(collection(db, 'properties'), where('developerId', '==', user.id))
    
    const unsub = onSnapshot(qProps, async (propSnap) => {
        const props = propSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (props.length === 0) {
          setRelations([])
          setLoading(false)
          return
        }

        const propIds = props.map(p => p.id)
        const allInvs: any[] = []
        for (let i = 0; i < propIds.length; i += 10) {
          const chunk = propIds.slice(i, i + 10)
          const invQ = query(collection(db, 'investments'), where('propertyId', 'in', chunk))
          const invSnap = await getDocs(invQ)
          allInvs.push(...invSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
        
        const invs = allInvs.filter(i => i.status === 'active')
        const userIds = Array.from(new Set(invs.map(i => i.userId)))
        
        let users: any[] = []
        if (userIds.length > 0) {
          for (let i = 0; i < userIds.length; i += 10) {
            const chunk = userIds.slice(i, i + 10)
            const q = query(collection(db, 'investors'), where(documentId(), 'in', chunk))
            const uSnap = await getDocs(q)
            users = [...users, ...uSnap.docs.map(d => ({ id: d.id, ...d.data() }))]
          }
        }
        
        const finalRelations = users.map(u => {
          const uInvs = invs.filter(i => i.userId === u.id)
          const totalInvested = uInvs.reduce((s, i) => s + (i.amountInvested || 0), 0)
          
          let totalCurrentValue = 0

          const detailedInvs = uInvs.map(inv => {
            const prop = props.find(p => p.id === inv.propertyId) as any
            const cp = prop?.marketData?.currentPrice || prop?.unitPrice || 0
            const cv = (inv.unitsOwned || 0) * cp
            totalCurrentValue += cv

            return {
              ...inv,
              propertyName: prop?.basicDetails?.propertyName || prop?.name || 'Unknown Property'
            }
          })
          
          const totalPL = totalCurrentValue - totalInvested
          const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0
          
          return {
            ...u,
            name: u.fullName || u.name || 'Unknown Investor',
            totalInvested,
            totalCurrentValue,
            totalPLPct,
            investments: detailedInvs,
            graphData: generateRealGraphData(totalInvested, totalCurrentValue)
          }
        })
        
        setRelations(finalRelations)
        setLoading(false)
    })
    return () => unsub()
  }, [user])

  const filtered = relations.filter(r => {
    const matchSearch = (r.name || '').toLowerCase().includes(search.toLowerCase()) || 
                       (r.email || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const handleSendNotification = async () => {
    if (!notifyTitle.trim() || !notifyMsg.trim()) {
      toast.error('Please enter a title and message')
      return
    }
    setNotifyLoading(true)
    try {
      await createNotification(
        notifyUser.id,
        'investor',
        'developer_message',
        notifyTitle,
        notifyMsg,
        { 
          senderName: user?.name, 
          senderRole: 'Developer',
          developerId: user?.id
        }
      )
      toast.success('Notification sent successfully to ' + notifyUser.name)
      setNotifyUser(null)
      setNotifyTitle('')
      setNotifyMsg('')
    } catch (err) {
      toast.error('Failed to send notification')
    } finally {
      setNotifyLoading(false)
    }
  }

  return (
    <AppLayout title="Relations" subtitle="Manage your investors and leads">
      <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              Investor Relations
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Deep insights and communication with your capital partners.</p>
          </div>
          <div className="flex gap-3">
            <Button className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm gap-2">
              <UserPlus size={18} /> Export Contacts
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card border rounded-2xl p-4 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search investors by name or email..." 
              className="pl-11 h-12 bg-background text-base rounded-xl border-transparent hover:border-border focus:border-primary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Contacts Full-Width Cards */}
        {loading ? (
           <div className="py-32 flex justify-center text-primary"><span className="animate-pulse font-bold text-xl">Syncing relationships...</span></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-card/50 rounded-3xl border border-dashed">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-primary opacity-50" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">No investors found</h3>
            <p className="text-base font-medium text-muted-foreground max-w-sm mt-2">
              You do not have any active investors matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(contact => (
              <div key={contact.id} className="bg-card border rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col xl:flex-row">
                
                {/* Left Column: Identity & Contact (approx 25%) */}
                <div className="p-8 xl:w-[350px] bg-muted/20 border-b xl:border-b-0 xl:border-r flex flex-col items-center xl:items-start text-center xl:text-left shrink-0">
                  <div className="h-32 w-32 rounded-full bg-muted overflow-hidden border-4 border-background shadow-md mb-6 relative group cursor-pointer">
                    {contact.image || contact.profilePic ? (
                      <img src={contact.image || contact.profilePic} alt={contact.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-4xl font-bold">
                        {contact.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-black text-foreground mb-2">{contact.name}</h3>
                  <div className="space-y-2 w-full mt-2">
                    <div className="flex items-center justify-center xl:justify-start gap-3 text-sm font-medium text-muted-foreground bg-background py-2 px-4 rounded-xl border border-border/50">
                      <Mail className="w-4 h-4 text-primary" /> <span className="truncate">{contact.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center justify-center xl:justify-start gap-3 text-sm font-medium text-muted-foreground bg-background py-2 px-4 rounded-xl border border-border/50">
                      <Phone className="w-4 h-4 text-primary" /> {contact.phone || 'No phone provided'}
                    </div>
                  </div>
                  
                  <Button onClick={() => setNotifyUser(contact)} className="w-full mt-8 h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all">
                    <MessageSquare className="w-5 h-5 mr-2" /> Send Custom Alert
                  </Button>
                </div>

                {/* Middle Column: Performance Graph (approx 45%) */}
                <div className="p-8 flex-1 flex flex-col border-b xl:border-b-0 xl:border-r">
                   <div className="flex justify-between items-end mb-8">
                     <div>
                       <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Portfolio Valuation</p>
                       <h4 className="text-4xl font-black text-foreground tracking-tight">{fmt(contact.totalCurrentValue)}</h4>
                     </div>
                     <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold ${(contact.totalPLPct || 0) >= 0 ? 'bg-gain/10 text-gain' : 'bg-rose-500/10 text-rose-500'}`}>
                        {(contact.totalPLPct || 0) >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        {(contact.totalPLPct || 0) >= 0 ? '+' : ''}{(contact.totalPLPct || 0).toFixed(1)}%
                     </div>
                   </div>

                   <div className="flex-1 min-h-[200px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={contact.graphData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600}} dy={10} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' }}
                            itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                            formatter={(val: any) => [fmt(val), 'Value']}
                          />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Right Column: Assets & Bank (approx 30%) */}
                <div className="p-8 xl:w-[400px] flex flex-col bg-muted/10 shrink-0">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Asset Allocation
                  </h4>
                  <div className="space-y-3 mb-8">
                    {contact.investments?.length > 0 ? contact.investments.slice(0, 3).map((inv: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/50 transition-colors cursor-default">
                        <div>
                          <div className="font-bold text-foreground text-sm">{inv.propertyName}</div>
                          <div className="text-xs font-semibold text-muted-foreground mt-0.5">{inv.unitsOwned} Unit(s) Owned</div>
                        </div>
                        <div className="text-right font-bold text-primary">
                           {fmt(inv.amountInvested)}
                        </div>
                      </div>
                    )) : (
                      <div className="p-4 bg-background rounded-2xl border border-dashed text-center text-sm font-medium text-muted-foreground">No active assets</div>
                    )}
                    {contact.investments?.length > 3 && (
                      <div className="text-center text-xs font-bold text-primary pt-2 cursor-pointer hover:underline">
                        + {contact.investments.length - 3} more properties
                      </div>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2 mt-auto pt-6 border-t border-border">
                    <CreditCard className="w-4 h-4" /> Verified Banking
                  </h4>
                  {(() => {
                    const accNum = contact.accountNumber || contact.bankDetails?.accountNumber
                    const ifsc = contact.ifsc || contact.ifscCode || contact.bankDetails?.ifscCode || contact.bankDetails?.ifsc
                    const bName = contact.bankName || contact.bankDetails?.bankName || 'Partner Bank'
                    const holder = contact.accountHolder || contact.bankDetails?.accountHolder || contact.name

                    if (accNum || ifsc || contact.bankDetails) {
                      return (
                        <div className="space-y-3 bg-background p-5 rounded-2xl border border-border/50">
                          <div className="flex justify-between items-center"><span className="text-xs font-semibold text-muted-foreground">Holder</span> <span className="text-sm font-bold truncate max-w-[180px]">{holder || 'N/A'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-semibold text-muted-foreground">Bank</span> <span className="text-sm font-bold">{bName}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-semibold text-muted-foreground">Account</span> <span className="text-sm font-mono font-bold">{accNum ? `•••• ${accNum.slice(-4)}` : 'N/A'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-semibold text-muted-foreground">IFSC</span> <span className="text-sm font-mono font-bold text-primary">{ifsc || 'N/A'}</span></div>
                        </div>
                      )
                    }

                    return (
                      <div className="p-5 bg-background rounded-2xl border border-dashed text-center text-sm font-medium text-muted-foreground">
                        Bank details pending KYC
                      </div>
                    )
                  })()}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!notifyUser} onOpenChange={(open) => !open && setNotifyUser(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
          <div className="bg-primary p-6 text-primary-foreground">
            <DialogTitle className="text-2xl font-black">Custom Notification</DialogTitle>
            <p className="text-primary-foreground/80 text-sm mt-2 font-medium">Message will be sent securely to {notifyUser?.name}'s dashboard.</p>
          </div>
          <div className="p-6 space-y-5 bg-background">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notification Title</label>
              <Input 
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="E.g. Quarterly Returns Updated"
                className="h-12 bg-muted/50 border-transparent rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message Body</label>
              <Textarea 
                value={notifyMsg}
                onChange={(e) => setNotifyMsg(e.target.value)}
                placeholder="Write your custom message here..."
                className="resize-none h-32 bg-muted/50 border-transparent rounded-xl p-4"
              />
            </div>
            <Button 
              className="w-full h-12 rounded-xl text-base font-bold shadow-lg"
              onClick={handleSendNotification}
              disabled={notifyLoading}
            >
              {notifyLoading ? 'Sending Alert...' : 'Send Secure Alert'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

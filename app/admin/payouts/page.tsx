'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Wallet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PayoutRequest, User } from '@/lib/types'
import { format } from 'date-fns'
import { createNotification } from '@/lib/notifications'

type PayoutWithUser = PayoutRequest & { developerName?: string; developerEmail?: string }

export default function AdminPayoutsPage() {
  const { user } = useSession()
  const [payouts, setPayouts] = useState<PayoutWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setIsLoading(false)
      return
    }

    const unsubPayouts = onSnapshot(collection(db, 'payouts'), async (snap) => {
      const rawPayouts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutRequest))
      
      if (rawPayouts.length === 0) {
        setPayouts([])
        setIsLoading(false)
        return
      }

      // Fetch developer names
      const devIds = Array.from(new Set(rawPayouts.map(p => p.developerId)))
      let allUsers: User[] = []
      
      for (let i = 0; i < devIds.length; i += 10) {
        const chunk = devIds.slice(i, i + 10)
        const q = query(collection(db, 'users'), where('id', 'in', chunk))
        const usersSnap = await getDocs(q)
        allUsers = [...allUsers, ...usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User))]
      }

      const combined = rawPayouts.map(p => {
        const dev = allUsers.find(u => u.id === p.developerId)
        return {
          ...p,
          developerName: dev?.name || 'Unknown Developer',
          developerEmail: dev?.email || 'Unknown Email'
        }
      })

      combined.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt).getTime()
        const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt).getTime()
        return timeB - timeA
      })

      setPayouts(combined)
      setIsLoading(false)
    }, (err) => {
      console.error(err)
      toast.error('Failed to load payouts')
      setIsLoading(false)
    })

    return () => unsubPayouts()
  }, [user])

  const handleApprove = async (payout: PayoutWithUser) => {
    setProcessingId(payout.id)
    try {
      await updateDoc(doc(db, 'payouts', payout.id), {
        status: 'completed',
        updatedAt: new Date().toISOString()
      })

      await createNotification(
        payout.developerId,
        'developer',
        'payout_approved',
        'Payout Processed',
        `Your payout request for ₹${payout.netAmount.toLocaleString('en-IN')} has been processed and transferred to your bank account.`,
        {
          payoutId: payout.id,
          amount: payout.netAmount
        }
      )

      toast.success('Payout marked as completed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve payout')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (payout: PayoutWithUser) => {
    setProcessingId(payout.id)
    try {
      await updateDoc(doc(db, 'payouts', payout.id), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      })

      await createNotification(
        payout.developerId,
        'developer',
        'payout_rejected',
        'Payout Rejected',
        `Your payout request for ₹${payout.netAmount.toLocaleString('en-IN')} was rejected due to an issue with your banking details. Please contact support.`,
        {
          payoutId: payout.id,
          amount: payout.netAmount
        }
      )

      toast.success('Payout rejected')
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject payout')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AppLayout requiredRole="admin" title="Process Payouts">
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Developer Payouts</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Review and process payout requests from property developers.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center h-64 items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : payouts.length === 0 ? (
          <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 bg-card/30 shadow-none">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold">No Payout Requests</h3>
            <p className="text-muted-foreground text-sm mt-2">There are currently no developer payouts to process.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {payouts.map(p => {
              const date = (p.createdAt as any)?.toDate ? (p.createdAt as any).toDate() : new Date(p.createdAt || Date.now())
              
              return (
                <Card key={p.id} className="p-6 border-border/50 hover:shadow-lg transition-all rounded-2xl flex flex-col md:flex-row justify-between items-start gap-6">
                  
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded tracking-widest ${
                          p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          p.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {p.status}
                        </span>
                        <h3 className="text-xl font-black mt-2">{p.developerName}</h3>
                        <p className="text-sm text-muted-foreground">{p.developerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{format(date, 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {p.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Sales</p>
                        <p className="font-mono font-medium">₹{p.amountRequested.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Platform (2%)</p>
                        <p className="font-mono font-medium text-rose-500">-₹{p.platformFee.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">GST (3%)</p>
                        <p className="font-mono font-medium text-rose-500">-₹{p.gst.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Net Payable</p>
                        <p className="font-mono font-black text-emerald-500 text-xl">₹{p.netAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  {p.status === 'pending' && (
                    <div className="flex flex-col gap-3 w-full md:w-48 shrink-0">
                      <Button 
                        onClick={() => handleApprove(p)}
                        disabled={processingId === p.id}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                      >
                        {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Mark as Paid
                      </Button>
                      <Button 
                        onClick={() => handleReject(p)}
                        disabled={processingId === p.id}
                        variant="outline"
                        className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Reject Request
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Wallet, Download, ArrowRight, Loader2, CheckCircle2, Clock, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Transaction, Property, PayoutRequest } from '@/lib/types'
import { format } from 'date-fns'

export default function DevTransactionsPage() {
  const { user } = useSession()
  const [properties, setProperties] = useState<Property[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)

  // Fetch properties and their transactions
  useEffect(() => {
    if (!user) return

    const unsubProps = onSnapshot(query(collection(db, 'properties'), where('developerId', '==', user.id)), (snap) => {
      const props = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property))
      setProperties(props)
      
      if (props.length === 0) {
        setTransactions([])
        setIsLoading(false)
        return
      }

      // Fetch transactions for these properties (chunked by 10 to avoid firestore 'in' limits)
      const propIds = props.map(p => p.id)
      
      const fetchTxs = async () => {
        let allTxs: Transaction[] = []
        for (let i = 0; i < propIds.length; i += 10) {
          const chunk = propIds.slice(i, i + 10)
          const q = query(
            collection(db, 'transactions'),
            where('propertyId', 'in', chunk),
            where('status', '==', 'completed')
          )
          const qs = await getDocs(q)
          allTxs = [...allTxs, ...qs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))]
        }
        allTxs.sort((a, b) => {
          const timeA = (a.timestamp as any)?.toMillis ? (a.timestamp as any).toMillis() : new Date(a.timestamp).getTime()
          const timeB = (b.timestamp as any)?.toMillis ? (b.timestamp as any).toMillis() : new Date(b.timestamp).getTime()
          return timeB - timeA
        })
        setTransactions(allTxs)
        setIsLoading(false)
      }
      fetchTxs()

    }, (err) => {
      console.error(err)
      toast.error('Failed to load properties')
      setIsLoading(false)
    })

    const unsubPayouts = onSnapshot(query(collection(db, 'payouts'), where('developerId', '==', user.id)), (snap) => {
      setPayouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutRequest)))
    })

    return () => {
      unsubProps()
      unsubPayouts()
    }
  }, [user])

  const availableBalance = transactions.reduce((acc, tx) => acc + tx.baseAmount, 0)
  const requestedBalance = payouts.reduce((acc, p) => acc + p.amountRequested, 0)
  const netAvailable = availableBalance - requestedBalance

  const handleRequestPayout = async () => {
    if (netAvailable <= 0) {
      toast.error('No available balance to request payout.')
      return
    }

    setIsRequesting(true)
    try {
      // Find all transaction IDs that are NOT part of any payout request yet
      const allTxIds = transactions.map(t => t.id)
      const usedTxIds = payouts.flatMap(p => p.transactionIds)
      const unrequestedTxIds = allTxIds.filter(id => !usedTxIds.includes(id))

      const platformFee = netAvailable * 0.02
      const gst = netAvailable * 0.03
      const netAmount = netAvailable - platformFee - gst

      await addDoc(collection(db, 'payouts'), {
        developerId: user!.id,
        amountRequested: netAvailable,
        platformFee,
        gst,
        netAmount,
        status: 'pending',
        transactionIds: unrequestedTxIds,
        createdAt: serverTimestamp()
      })
      toast.success('Payout requested successfully. Admin will review and process it.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to request payout')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <AppLayout requiredRole="developer" title="Transactions & Payouts">
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Financial Ledger</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Track your property sales and request payouts to your bank account.</p>
          </div>
          <Button 
            onClick={handleRequestPayout}
            disabled={netAvailable <= 0 || isRequesting || isLoading}
            className="h-12 px-6 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            {isRequesting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Wallet className="w-5 h-5 mr-2" />}
            Request Payout (₹{netAvailable.toLocaleString('en-IN')})
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center h-64 items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6 lg:col-span-2">
              <h2 className="text-xl font-bold">Recent Unit Sales</h2>
              {transactions.length === 0 ? (
                <Card className="flex flex-col h-[300px] items-center justify-center border-dashed border-2 bg-card/30 shadow-none">
                  <Landmark className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                  <p className="text-muted-foreground font-medium">No sales transactions found yet.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {transactions.map(tx => {
                    const date = (tx.timestamp as any)?.toDate ? (tx.timestamp as any).toDate() : new Date(tx.timestamp || Date.now())
                    return (
                      <Card key={tx.id} className="p-5 flex items-center justify-between border-border/50 hover:shadow-md transition-all rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold">{tx.propertyName}</h4>
                            <p className="text-sm text-muted-foreground">Sold {tx.units} units to investor</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-500">+ ₹{tx.baseAmount.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground">{format(date, 'MMM dd, yyyy')}</p>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold">Payout Requests</h2>
              {payouts.length === 0 ? (
                <Card className="flex flex-col p-6 items-center justify-center border-dashed border-2 bg-card/30 shadow-none text-center h-[300px]">
                  <Wallet className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No payout requests submitted.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {payouts.sort((a,b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()).map(p => {
                    return (
                      <Card key={p.id} className="p-5 border-border/50 rounded-2xl">
                        <div className="flex justify-between items-start mb-4 border-b pb-3">
                          <div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded tracking-widest ${
                              p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              p.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-black">₹{p.amountRequested.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Requested</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Platform Fee (2%)</span>
                            <span>- ₹{p.platformFee.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>GST (3%)</span>
                            <span>- ₹{p.gst.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-2 border-t text-foreground">
                            <span>Net Payout</span>
                            <span className="text-emerald-500">₹{p.netAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

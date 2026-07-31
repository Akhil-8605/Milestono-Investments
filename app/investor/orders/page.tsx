'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Transaction } from '@/lib/types'
import { Loader2, ArrowRightLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'

export default function InvestorOrdersPage() {
  const { user } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.id)
        )
        const snap = await getDocs(q)
        let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
        
        // Sort in memory to avoid composite index error for MVP
        docs.sort((a, b) => {
          const timeA = (a.timestamp as any)?.toMillis ? (a.timestamp as any).toMillis() : new Date(a.timestamp).getTime()
          const timeB = (b.timestamp as any)?.toMillis ? (b.timestamp as any).toMillis() : new Date(b.timestamp).getTime()
          return timeB - timeA
        })
        
        setTransactions(docs)
      } catch (err) {
        toast.error('Failed to load transaction history')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [user])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'Completed' }
      case 'pending_admin_approval': return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'Verification Pending' }
      case 'failed': return { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'Failed' }
      default: return { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', text: status }
    }
  }

  return (
    <AppLayout requiredRole="investor" title="My Orders">
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Order History</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Track your investment allocations and payment statuses.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 bg-card/30 shadow-none">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold">No Transactions Found</h3>
            <p className="text-muted-foreground text-sm mt-2">You haven't made any investment purchases yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const cfg = getStatusConfig(tx.status)
              const Icon = cfg.icon
              const date = (tx.timestamp as any)?.toDate ? (tx.timestamp as any).toDate() : new Date(tx.timestamp || Date.now())

              return (
                <Card key={tx.id} className="p-6 border border-border/50 hover:shadow-lg transition-all rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg">{tx.propertyName} <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-xs tracking-widest">{tx.propertySymbol}</span></h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                        <span>{format(date, 'MMM dd, yyyy • hh:mm a')}</span>
                        <span>•</span>
                        <span>{tx.type === 'buy' ? 'Purchase' : 'Sell'}</span>
                        {tx.paymentMethod === 'neft_with_token' && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-500 font-bold">NEFT / Token</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 w-full md:w-auto bg-muted/20 p-4 rounded-xl border">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total Allocation</span>
                    <span className="text-2xl font-mono font-black text-foreground">₹{tx.totalAmount.toLocaleString('en-IN')}</span>
                    <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground font-medium">{tx.units} Units @ ₹{tx.unitPrice.toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.text}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

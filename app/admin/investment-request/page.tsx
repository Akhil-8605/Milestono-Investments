'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Transaction } from '@/lib/types'
import { Loader2, CheckCircle2, XCircle, FileImage, ExternalLink, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'

export default function AdminInvestmentRequestsPage() {
  const { user } = useSession()
  const [requests, setRequests] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [user])

  const fetchRequests = async () => {
    if (user?.role !== 'admin') return
    try {
      const q = query(
        collection(db, 'transactions'),
        where('status', '==', 'pending_admin_approval')
      )
      const snap = await getDocs(q)
      let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
      
      docs.sort((a, b) => {
        const timeA = (a.timestamp as any)?.toMillis ? (a.timestamp as any).toMillis() : new Date(a.timestamp).getTime()
        const timeB = (b.timestamp as any)?.toMillis ? (b.timestamp as any).toMillis() : new Date(b.timestamp).getTime()
        return timeB - timeA
      })
      
      setRequests(docs)
    } catch (err) {
      toast.error('Failed to load investment requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (tx: Transaction) => {
    setProcessingId(tx.id)
    try {
      // 1. Update Transaction Status
      const txRef = doc(db, 'transactions', tx.id)
      await updateDoc(txRef, {
        status: 'completed',
        verifiedByAdmin: true
      })

      // 2. Create the Investment Portfolio Document
      await addDoc(collection(db, 'investments'), {
        userId: tx.userId,
        propertyId: tx.propertyId,
        unitsOwned: tx.units,
        unitPrice: tx.unitPrice,
        amountInvested: tx.totalAmount,
        currentValue: tx.totalAmount, // Initial value is cost
        returns: 0,
        returnPercentage: 0,
        dayChange: 0,
        dayChangePct: 0,
        purchasedAt: serverTimestamp(),
        status: 'active'
      })

      // 3. Update Property Units Sold
      const propRef = doc(db, 'properties', tx.propertyId)
      await updateDoc(propRef, {
        unitsSold: increment(tx.units)
      }).catch(console.error)

      toast.success(`Approved investment for ${tx.units} units of ${tx.propertySymbol}`)
      
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== tx.id))
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve transaction')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (tx: Transaction) => {
    setProcessingId(tx.id)
    try {
      const txRef = doc(db, 'transactions', tx.id)
      await updateDoc(txRef, {
        status: 'failed',
        verifiedByAdmin: false
      })
      toast.success('Transaction rejected')
      setRequests(prev => prev.filter(r => r.id !== tx.id))
    } catch (err) {
      toast.error('Failed to reject transaction')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AppLayout requiredRole="admin" title="Investment Requests">
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">NEFT Verifications</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Review and approve high-value transactions pending manual NEFT clearance.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 bg-card/30 shadow-none">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold">All Caught Up</h3>
            <p className="text-muted-foreground text-sm mt-2">There are no pending investment requests at this time.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((tx) => {
              const date = (tx.timestamp as any)?.toDate ? (tx.timestamp as any).toDate() : new Date(tx.timestamp || Date.now())

              return (
                <Card key={tx.id} className="p-6 border border-border/50 shadow-lg rounded-[2rem] space-y-6 bg-card/60 backdrop-blur-xl">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-border/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-2xl tracking-tight">{tx.propertyName} <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-sm tracking-widest uppercase">{tx.propertySymbol}</span></h4>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        {format(date, 'MMM dd, yyyy • hh:mm a')} • User ID: <span className="font-mono text-xs">{tx.userId}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Capital</p>
                      <p className="text-3xl font-mono font-black text-foreground">₹{tx.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h5 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Banking Details
                      </h5>
                      <div className="bg-muted/30 p-5 rounded-2xl border font-mono text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Token Paid (Razorpay)</span>
                          <span className="text-amber-500 font-bold">₹{tx.tokenAmountPaid?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NEFT Balance Due</span>
                          <span className="text-foreground font-bold">₹{(tx.totalAmount - (tx.tokenAmountPaid || 0)).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-border/50">
                          <div className="flex justify-between"><span className="text-muted-foreground">Sender Bank</span><span>{tx.neftDetails?.bankName}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Sender IFSC</span><span>{tx.neftDetails?.ifsc}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">UTR Reference</span><span className="text-indigo-500 font-bold">{tx.neftDetails?.utrNumber}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <FileImage className="w-4 h-4" /> Proof of Payment
                      </h5>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {tx.neftDetails?.proofImages?.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer" className="relative group block w-32 h-32 rounded-xl border border-border/50 overflow-hidden shrink-0 hover:border-primary transition-colors">
                            <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Proof" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="w-6 h-6 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                    <Button 
                      onClick={() => handleApprove(tx)} 
                      disabled={processingId !== null}
                      className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                      {processingId === tx.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Verify & Allocate Units</>}
                    </Button>
                    <Button 
                      onClick={() => handleReject(tx)} 
                      disabled={processingId !== null}
                      variant="outline"
                      className="flex-none h-14 px-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-bold text-lg rounded-xl"
                    >
                      {processingId === tx.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reject'}
                    </Button>
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

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Property, Transaction } from '@/lib/types'
import { Loader2, CheckCircle2, FileImage, ExternalLink, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'
import { createNotification } from '@/lib/notifications'

const pendingStatuses = ['pending_admin_approval', 'pending_neft', 'pending', 'neft_submitted', 'neft_on_hold']
const completedStatuses = ['completed']

const getInvestorName = (tx: any) => {
  return (
    tx.investorName ||
    tx.name ||
    tx.fullName ||
    tx.userName ||
    tx.metadata?.investorName ||
    tx.metadata?.name ||
    tx.userId ||
    'Unknown Investor'
  )
}

const getInvestorEmail = (tx: any) => {
  return (
    tx.investorEmail ||
    tx.userEmail ||
    tx.email ||
    tx.metadata?.investorEmail ||
    tx.metadata?.email ||
    'No email available'
  )
}

const getInvestorPhone = (tx: any) => {
  return (
    tx.investorPhone ||
    tx.phone ||
    tx.metadata?.investorPhone ||
    tx.metadata?.phone ||
    'Not provided'
  )
}

const getInvestorPhoto = (tx: any) => {
  return (
    tx.investorPhoto ||
    tx.photo ||
    tx.profileImage ||
    tx.metadata?.investorPhoto ||
    tx.metadata?.photo ||
    null
  )
}

const getDeveloperReference = (tx: any) => {
  return (
    tx.developerId ||
    tx.propertyDeveloperId ||
    tx.metadata?.developerId ||
    tx.developer?.developerId ||
    tx.propertyDeveloper?.developerId ||
    null
  )
}

export default function AdminInvestmentRequestsPage() {
  const router = useRouter()
  const { user } = useSession()
  const [requests, setRequests] = useState<Transaction[]>([])
  const [propertiesById, setPropertiesById] = useState<Record<string, Property>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvestor, setSelectedInvestor] = useState<Transaction | null>(null)
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null)
  const [proofModalOpen, setProofModalOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const txQuery = query(collection(db, 'transactions'))
    const unsubscribe = onSnapshot(
      txQuery,
      async (snap) => {
        try {
          const allDocs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any))

          const counts: Record<string, number> = {}
          allDocs.forEach((item) => {
            const status = (item.status || 'undefined').toString()
            counts[status] = (counts[status] || 0) + 1
          })
          setStatusCounts(counts)

          const buyTransactions = allDocs.filter((item) => item.type === 'buy' || item.type === undefined || item.type === null)
          buyTransactions.sort((a, b) => {
            const timeA = (a.timestamp as any)?.toMillis ? (a.timestamp as any).toMillis() : new Date(a.timestamp || Date.now()).getTime()
            const timeB = (b.timestamp as any)?.toMillis ? (b.timestamp as any).toMillis() : new Date(b.timestamp || Date.now()).getTime()
            return timeB - timeA
          })

          setRequests(buyTransactions)

          const propertyIds = Array.from(new Set(buyTransactions.map((tx) => tx.propertyId).filter(Boolean)))
          if (propertyIds.length > 0) {
            const propertyDocs: Record<string, Property> = {}
            for (let i = 0; i < propertyIds.length; i += 10) {
              const chunk = propertyIds.slice(i, i + 10)
              const propQuery = query(collection(db, 'properties'), where('__name__', 'in', chunk))
              const snapshotProps = await getDocs(propQuery)
              snapshotProps.docs.forEach((propDoc) => {
                propertyDocs[propDoc.id] = { id: propDoc.id, ...propDoc.data() } as Property
              })
            }
            setPropertiesById((current) => ({ ...current, ...propertyDocs }))
          }

          setIsLoading(false)
        } catch (error) {
          console.error(error)
          toast.error('Failed to load investment requests.')
          setIsLoading(false)
        }
      },
      (error) => {
        console.error(error)
        toast.error('Realtime fetch failed.')
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const filteredRequests = useMemo(() => {
    const queryText = searchTerm.trim().toLowerCase()
    return requests.filter((tx) => {
      const status = (tx.status || '').toString()
      if (activeTab === 'pending' && !pendingStatuses.includes(status)) return false
      if (activeTab === 'completed' && !completedStatuses.includes(status)) return false
      if (!queryText) return true

      return [
        tx.propertyName,
        tx.propertySymbol,
        tx.investorName,
        (tx as any).investorEmail,
        tx.userId,
        tx.id,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(queryText))
    })
  }, [requests, activeTab, searchTerm])

  const getPropertyImage = (tx: Transaction) => {
    const property = tx.propertyId ? propertiesById[tx.propertyId] : null
    return property?.images?.[0] || (tx as any).propertyImage || null
  }

  const openInvestorModal = (tx: Transaction) => setSelectedInvestor(tx)
  const closeInvestorModal = () => setSelectedInvestor(null)
  const openProofModal = (imageUrl: string) => {
    setSelectedProofImage(imageUrl)
    setProofModalOpen(true)
  }
  const closeProofModal = () => {
    setSelectedProofImage(null)
    setProofModalOpen(false)
  }

  const handleApprove = async (tx: Transaction) => {
    setProcessingId(tx.id)
    try {
      const txRef = doc(db, 'transactions', tx.id)
      await updateDoc(txRef, {
        status: 'completed',
        verifiedByAdmin: true,
        approvedByAdmin: user?.id || null,
        approvedAt: serverTimestamp(),
      })

      await addDoc(collection(db, 'investments'), {
        userId: tx.userId,
        propertyId: tx.propertyId,
        unitsOwned: tx.units,
        unitPrice: tx.unitPrice,
        amountInvested: tx.totalAmount,
        currentValue: tx.totalAmount,
        returns: 0,
        returnPercentage: 0,
        dayChange: 0,
        dayChangePct: 0,
        purchasedAt: serverTimestamp(),
        status: 'active',
      })

      const propRef = doc(db, 'properties', tx.propertyId)
      await runTransaction(db, async (t) => {
        const pDoc = await t.get(propRef)
        if (!pDoc.exists()) return
        const currentHold = pDoc.data().unitsOnHold || 0
        const currentSold = pDoc.data().unitsSold || 0
        const holdDeduction = Math.min(currentHold, tx.units)
        t.update(propRef, {
          unitsSold: currentSold + tx.units,
          unitsOnHold: currentHold - holdDeduction,
        })
      }).catch(console.error)

      await createNotification(
        tx.userId,
        'investor',
        'transaction_approved',
        'Investment Approved!',
        `Your NEFT payment for ${tx.units} units of ${tx.propertySymbol} has been verified and approved. Units have been allocated to your portfolio.`,
        {
          transactionId: tx.id,
          propertySymbol: tx.propertySymbol,
        }
      )

      const developerId = (tx as any).developerId || (tx as any).propertyDeveloperId
      if (developerId) {
        await createNotification(
          developerId,
          'developer',
          'investment_received',
          'Investment Allocated',
          `Allocated ${tx.units} units of ${tx.propertySymbol} to investor ${tx.investorName || tx.userId}.`,
          {
            transactionId: tx.id,
            propertySymbol: tx.propertySymbol,
            investorId: tx.userId,
          }
        ).catch(console.error)
      }

      toast.success(`Approved investment for ${tx.units} units of ${tx.propertySymbol}`)
    } catch (error) {
      console.error(error)
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
        verifiedByAdmin: false,
        rejectedByAdmin: user?.id || null,
        rejectedAt: serverTimestamp(),
      })

      const propRef = doc(db, 'properties', tx.propertyId)
      await runTransaction(db, async (t) => {
        const pDoc = await t.get(propRef)
        if (!pDoc.exists()) return
        const currentHold = pDoc.data().unitsOnHold || 0
        const holdDeduction = Math.min(currentHold, tx.units)
        t.update(propRef, {
          unitsOnHold: currentHold - holdDeduction,
        })
      }).catch(console.error)

      await createNotification(
        tx.userId,
        'investor',
        'transaction_rejected',
        'Investment Rejected',
        `Your NEFT payment for ${tx.units} units of ${tx.propertySymbol} was rejected. Please contact support.`,
        {
          transactionId: tx.id,
          propertySymbol: tx.propertySymbol,
        }
      )

      toast.success('Transaction rejected')
    } catch (error) {
      console.error(error)
      toast.error('Failed to reject transaction')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AppLayout requiredRole="admin" title="Investment Requests">
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Investment Requests</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Review all orders, verify NEFT proofs, and allocate units to investors.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by investor, property, or order ID"
              className="min-w-[320px]"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'pending' | 'completed')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-semibold">Status counts:</span>
          {Object.entries(statusCounts).map(([status, count]) => (
            <span key={status} className="px-3 py-1 rounded-full bg-muted/70 text-muted-foreground">
              {status}: {count}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="flex flex-col h-[360px] items-center justify-center border-dashed border-2 bg-card/30 shadow-none">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold">No matching orders</h3>
            <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or switching tabs.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((tx) => {
              const date = (tx.timestamp as any)?.toDate ? (tx.timestamp as any).toDate() : new Date(tx.timestamp || Date.now())
              const isPending = pendingStatuses.includes((tx.status || '').toString())
              const propertyImage = getPropertyImage(tx)
              const totalAmount = tx.totalAmount || 0
              const tokenPaid = tx.tokenAmountPaid || 0

              return (
                <Card key={tx.id} className="p-6 border border-border/50 shadow-lg rounded-[2rem] space-y-6 bg-card/60 backdrop-blur-xl">
                  <div className="flex flex-col xl:flex-row justify-between gap-6 border-b border-border/50 pb-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-background border border-border/50">
                        {propertyImage ? (
                          <img src={propertyImage} alt={tx.propertyName || 'Property'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-xs text-center px-2">No property image available</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-2xl font-black tracking-tight">{tx.propertyName || 'Property'}</span>
                          <span className="text-xs uppercase tracking-[0.2em] bg-muted/50 px-3 py-1 rounded-full">{tx.propertySymbol || 'N/A'}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Order ID: {tx.id}</div>
                        <p className="text-sm text-muted-foreground">{format(date, 'MMM dd, yyyy • hh:mm a')}</p>
                        <p className="text-sm text-foreground">Investor: <span className="font-semibold">{getInvestorName(tx)}</span></p>
                        <p className="text-sm text-muted-foreground">{getInvestorEmail(tx)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between gap-3 text-right">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</div>
                        <div className="mt-2 font-bold text-foreground">{tx.status || 'pending'}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Amount</div>
                        <div className="mt-2 font-black text-2xl">₹{totalAmount.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Investor Details</h5>
                        <Button variant="outline" size="sm" onClick={() => openInvestorModal(tx)}>
                          View Investor
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p className="font-semibold text-foreground">Name</p>
                          <p>{getInvestorName(tx)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Email</p>
                          <p>{getInvestorEmail(tx)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Units</p>
                          <p>{tx.units}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Payment</p>
                          <p>₹{tokenPaid.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Property Actions</h5>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/properties/${tx.propertyId}`)}>
                          View Property
                        </Button>
                      </div>
                      <div className="bg-muted/40 p-4 rounded-3xl border border-border/60 text-sm space-y-3">
                        <div className="flex justify-between text-muted-foreground"><span>Bank</span><span>{tx.neftDetails?.bankName || 'N/A'}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>IFSC</span><span>{tx.neftDetails?.ifsc || 'N/A'}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>UTR</span><span>{tx.neftDetails?.utrNumber || 'N/A'}</span></div>
                      </div>
                      <div className="text-sm">
                        <h6 className="font-semibold text-foreground mb-2">Proof of Payment</h6>
                        <div className="flex flex-wrap gap-3">
                          {tx.neftDetails?.proofImages?.length ? (
                            tx.neftDetails.proofImages.map((img: string, index: number) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => openProofModal(img)}
                                className="w-24 h-24 rounded-3xl overflow-hidden border border-border/60 hover:border-primary transition"
                              >
                                <img src={img} alt={`Proof ${index + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No proof images uploaded yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-border/50">
                    {isPending ? (
                      <div className="flex flex-col sm:flex-row sm:gap-3 w-full">
                        <Button
                          onClick={() => handleApprove(tx)}
                          disabled={Boolean(processingId)}
                          className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                        >
                          {processingId === tx.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Approve & Allocate'}
                        </Button>
                        <Button
                          onClick={() => handleReject(tx)}
                          disabled={Boolean(processingId)}
                          variant="outline"
                          className="flex-1 h-14 rounded-xl border-rose-500 text-rose-500 hover:bg-rose-500/10"
                        >
                          {processingId === tx.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reject'}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No admin action needed for this order.</div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedInvestor)} onOpenChange={(open) => !open && closeInvestorModal()}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>Investor Details</DialogTitle>
          </DialogHeader>
          {selectedInvestor ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-background border border-border/50">
                  {selectedInvestor.investorPhoto ? (
                    <img src={selectedInvestor.investorPhoto} alt={selectedInvestor.investorName || 'Investor'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No Photo</div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">{selectedInvestor.investorName || 'Investor'}</h3>
                  <p className="text-sm text-muted-foreground">{(selectedInvestor as any).investorEmail || 'No email available'}</p>
                  <p className="text-sm text-muted-foreground">User ID: <span className="font-mono">{selectedInvestor.userId}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-muted/20 p-4 rounded-3xl border border-border/60">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Investment Summary</p>
                  <p><span className="font-semibold">Property:</span> {selectedInvestor.propertyName || 'N/A'}</p>
                  <p><span className="font-semibold">Units:</span> {selectedInvestor.units}</p>
                  <p><span className="font-semibold">Order Value:</span> ₹{(selectedInvestor.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-3 bg-muted/20 p-4 rounded-3xl border border-border/60">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact Information</p>
                  <p><span className="font-semibold">Email:</span> {(selectedInvestor as any).investorEmail || 'N/A'}</p>
                  <p><span className="font-semibold">Phone:</span> {(selectedInvestor as any).investorPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={closeInvestorModal}>Close</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={proofModalOpen} onOpenChange={(open) => !open && closeProofModal()}>
        <DialogContent className="max-w-3xl rounded-3xl p-4 bg-transparent shadow-none">
          <div className="relative overflow-hidden rounded-[2rem] bg-background border border-border/60">
            <div className="p-4 flex justify-end">
              <Button variant="ghost" onClick={closeProofModal}>Close</Button>
            </div>
            {selectedProofImage ? (
              <img src={selectedProofImage} alt="Proof of payment" className="w-full h-auto max-h-[80vh] object-contain" />
            ) : (
              <div className="p-20 text-center text-muted-foreground">No proof image selected.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

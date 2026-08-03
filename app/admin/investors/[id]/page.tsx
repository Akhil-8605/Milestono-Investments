'use client'

import { useEffect, useMemo, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Property, Investment, Transaction } from '@/lib/types'
import { ArrowLeft, Loader2, User2, IndianRupee, Layers, CheckCircle2, Mail, Phone, Calendar, Building2 } from 'lucide-react'
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'

function getInvestorName(investor: any) {
  return investor.name || investor.fullName || investor.displayName || investor.investorName || 'Investor'
}

function getInvestorEmail(investor: any) {
  return investor.email || investor.userEmail || investor.investorEmail || 'No email available'
}

function getInvestorPhone(investor: any) {
  return investor.phone || investor.mobile || investor.investorPhone || 'Not provided'
}

function getInvestorPhoto(investor: any) {
  return investor.photo || investor.avatar || investor.profileImage || null
}

function getInvestorLocation(investor: any) {
  return investor.address || investor.location || investor.officeAddress || 'India'
}

export default function AdminInvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const investorId = resolvedParams.id
  const router = useRouter()
  const [investor, setInvestor] = useState<any | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'investments' | 'transactions'>('profile')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!investorId) return

    let unsubscribeInvestor: (() => void) | null = null
    let unsubscribeInvestments: (() => void) | null = null
    let unsubscribeTransactions: (() => void) | null = null

    const loadInvestor = async () => {
      setIsLoading(true)

      try {
        const investorRef = doc(db, 'investors', investorId)
        unsubscribeInvestor = onSnapshot(investorRef, (snapshot) => {
          if (snapshot.exists()) {
            setInvestor({ id: snapshot.id, ...snapshot.data() })
          } else {
            setInvestor(null)
          }
          setIsLoading(false)
        })

        const investmentsQuery = query(collection(db, 'investments'), where('userId', '==', investorId))
        unsubscribeInvestments = onSnapshot(investmentsQuery, (snapshot) => {
          setInvestments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Investment)))
        })

        const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', investorId))
        unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
          setTransactions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Transaction)))
        })
      } catch (error) {
        console.error('Failed to load investor details', error)
        setIsLoading(false)
      }
    }

    loadInvestor()

    return () => {
      unsubscribeInvestor?.()
      unsubscribeInvestments?.()
      unsubscribeTransactions?.()
    }
  }, [investorId])

  useEffect(() => {
    const propertyIds = Array.from(new Set(investments.map((investment) => investment.propertyId).filter(Boolean)))
    if (propertyIds.length === 0) {
      setProperties([])
      return
    }

    const loadProperties = async () => {
      try {
        const fetchedProperties: Property[] = []
        for (let i = 0; i < propertyIds.length; i += 10) {
          const chunk = propertyIds.slice(i, i + 10)
          const propsQuery = query(collection(db, 'properties'), where('__name__', 'in', chunk))
          const snapshot = await getDocs(propsQuery)
          snapshot.docs.forEach((doc) => {
            fetchedProperties.push({ id: doc.id, ...doc.data() } as Property)
          })
        }
        setProperties(fetchedProperties)
      } catch (error) {
        console.error('Unable to load investor property details', error)
      }
    }

    loadProperties()
  }, [investments])

  const totalInvested = useMemo(
    () => investments.reduce((sum, investment) => sum + Number(investment.amountInvested || 0), 0),
    [investments]
  )

  const totalUnits = useMemo(
    () => investments.reduce((sum, investment) => sum + Number(investment.unitsOwned || 0), 0),
    [investments]
  )

  const currentValue = useMemo(
    () => investments.reduce((sum, investment) => sum + Number(investment.currentValue || 0), 0),
    [investments]
  )

  const activeInvestments = investments.filter((investment) => investment.status === 'active')

  if (isLoading) {
    return (
      <AppLayout requiredRole="admin" title="Investor Details">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!investor) {
    return (
      <AppLayout requiredRole="admin" title="Investor Details">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <CheckCircle2 className="w-14 h-14 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground">Investor not found</h2>
          <p className="text-sm text-muted-foreground">The requested investor profile could not be found or may have been removed.</p>
          <Button variant="outline" onClick={() => router.push('/admin/investors')}>Back to investors</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout requiredRole="admin" title={`Investor ${getInvestorName(investor)}`}>
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" className="rounded-3xl px-4 py-3" onClick={() => router.push('/admin/investors')}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <span className="rounded-full border border-border/70 bg-muted/50 px-3 py-2 font-semibold">Investor ID: {investor.id}</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">{getInvestorName(investor)}</h1>
              <p className="text-sm text-muted-foreground">{getInvestorEmail(investor)} • {getInvestorPhone(investor)}</p>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-3">
            <Card className="p-5 rounded-3xl border-border/60 bg-card/80">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Invested</p>
              <p className="mt-3 text-2xl font-black text-foreground">₹{totalInvested.toLocaleString('en-IN')}</p>
            </Card>
            <Card className="p-5 rounded-3xl border-border/60 bg-card/80">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Units</p>
              <p className="mt-3 text-2xl font-black text-foreground">{totalUnits}</p>
            </Card>
            <Card className="p-5 rounded-3xl border-border/60 bg-card/80">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Current value</p>
              <p className="mt-3 text-2xl font-black text-emerald-500">₹{currentValue.toLocaleString('en-IN')}</p>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'profile' | 'investments' | 'transactions')}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 rounded-3xl border-border/70 p-6 bg-card/80">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-24 w-24 rounded-3xl bg-muted/80 overflow-hidden border border-border/70">
                    {getInvestorPhoto(investor) ? (
                      <img src={getInvestorPhoto(investor)} alt={getInvestorName(investor)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground text-lg font-black">INV</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Profile summary</p>
                    <p className="mt-3 text-lg font-semibold text-foreground">{investor.kycVerified ? 'KYC verified investor' : 'Pending KYC review'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{investor.companyName || investor.affiliation || 'Registered investor account'}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-muted/60 p-5 border border-border/60">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Name</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{getInvestorName(investor)}</p>
                  </div>
                  <div className="rounded-3xl bg-muted/60 p-5 border border-border/60">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Email</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{getInvestorEmail(investor)}</p>
                  </div>
                  <div className="rounded-3xl bg-muted/60 p-5 border border-border/60">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Phone</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{getInvestorPhone(investor)}</p>
                  </div>
                  <div className="rounded-3xl bg-muted/60 p-5 border border-border/60">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Location</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{getInvestorLocation(investor)}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-border/70 p-6 bg-card/80">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Account status</p>
                  <p className="mt-3 text-base font-semibold text-foreground">{investor.role || 'investor'}</p>
                </div>

                <div className="rounded-3xl bg-muted/60 p-5 border border-border/60">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Member since</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{investor.createdAt ? format(new Date(investor.createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>

                <div className="rounded-3xl bg-primary/5 p-5 border border-primary/20">
                  <div className="flex items-center gap-3 text-primary">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-semibold">Verified investment profile</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">Review this investor’s profile, portfolio, and transaction activity from a single admin view.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="rounded-3xl border-border/60 p-6 bg-card/80">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Active investments</p>
                <p className="mt-3 text-3xl font-black text-foreground">{activeInvestments.length}</p>
              </Card>
              <Card className="rounded-3xl border-border/60 p-6 bg-card/80">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total invested</p>
                <p className="mt-3 text-3xl font-black text-foreground">₹{totalInvested.toLocaleString('en-IN')}</p>
              </Card>
              <Card className="rounded-3xl border-border/60 p-6 bg-card/80">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Estimated current value</p>
                <p className="mt-3 text-3xl font-black text-emerald-500">₹{currentValue.toLocaleString('en-IN')}</p>
              </Card>
            </div>

            {investments.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-border/50 p-12 text-center bg-card/60">
                <p className="text-lg font-semibold text-foreground">No investments found</p>
                <p className="text-sm text-muted-foreground mt-2">This investor has not purchased any assets yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {investments.map((investment) => {
                  const property = properties.find((prop) => prop.id === investment.propertyId)
                  return (
                    <Card key={investment.id} className="rounded-3xl border-border/60 p-6 bg-card/80">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Property</p>
                          <p className="text-lg font-semibold text-foreground mt-1">{property?.name || investment.propertyName || 'Unknown asset'}</p>
                          <p className="text-sm text-muted-foreground mt-1">{property?.symbol || investment.propertySymbol || investment.propertyId}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Units</p>
                            <p className="mt-1 font-semibold text-foreground">{investment.unitsOwned}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Invested</p>
                            <p className="mt-1 font-semibold text-foreground">₹{investment.amountInvested.toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Current value</p>
                            <p className="mt-1 font-semibold text-emerald-500">₹{investment.currentValue.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-border/50 p-12 text-center bg-card/60">
                <p className="text-lg font-semibold text-foreground">No transaction history</p>
                <p className="text-sm text-muted-foreground mt-2">Once purchases are recorded, they will appear here.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {transactions.map((transaction) => {
                  const transactionDate = transaction.timestamp ? new Date(transaction.timestamp as any) : new Date()
                  return (
                    <Card key={transaction.id} className="rounded-3xl border-border/60 p-6 bg-card/80">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Transaction ID</p>
                          <p className="text-lg font-semibold text-foreground mt-1">{transaction.id}</p>
                          <p className="text-sm text-muted-foreground mt-2">{format(transactionDate, 'MMM dd, yyyy • hh:mm a')}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 text-sm text-right">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Amount</p>
                            <p className="mt-1 font-semibold text-foreground">₹{(transaction.totalAmount || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Units</p>
                            <p className="mt-1 font-semibold text-foreground">{transaction.units || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
                            <p className="mt-1 font-semibold text-foreground">{transaction.status || 'pending'}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

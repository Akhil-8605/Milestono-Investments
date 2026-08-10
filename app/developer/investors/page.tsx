'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Users, Building2, TrendingUp, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, onSnapshot, documentId } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Property, Investment, User } from '@/lib/types'

import { subscribeDeveloperProperties } from '@/lib/developer-properties'

type InvestorData = {
  user: User;
  investments: (Investment & { propertySymbol: string; propertyName: string })[];
  totalInvested: number;
}

export default function DevInvestorsPage() {
  const { user } = useSession()
  const [investors, setInvestors] = useState<InvestorData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    setIsLoading(true)
    let unsubInvestments: () => void
    let unsubProps: () => void

    const loadData = async () => {
      try {
        unsubProps = subscribeDeveloperProperties(user, (props) => {
          if (props.length === 0) {
            setInvestors([])
            setIsLoading(false)
            return
          }

          const propIds = props.map(p => p.id)
          
          if (unsubInvestments) unsubInvestments()

          // We can't do an 'in' query if propIds > 10, so we do multiple queries, or just get all active investments and filter.
          // For simplicity in onSnapshot, getting all and filtering client-side is safer if > 10.
          unsubInvestments = onSnapshot(query(collection(db, 'investments'), where('status', '==', 'active')), async (snap) => {
            const allActiveInvestments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment))
            const ourInvestments = allActiveInvestments.filter(inv => propIds.includes(inv.propertyId))

            if (ourInvestments.length === 0) {
              setInvestors([])
              setIsLoading(false)
              return
            }

            const userIds = Array.from(new Set(ourInvestments.map(inv => inv.userId)))
            let allUsers: User[] = []
            
            for (let i = 0; i < userIds.length; i += 10) {
              const chunk = userIds.slice(i, i + 10)
              const q = query(collection(db, 'users'), where(documentId(), 'in', chunk))
              const usersSnap = await getDocs(q)
              allUsers = [...allUsers, ...usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))]
            }

            const investorMap = new Map<string, InvestorData>()
            for (const inv of ourInvestments) {
              const u = allUsers.find(x => x.id === inv.userId)
              if (!u) continue
              const p = props.find(x => x.id === inv.propertyId)
              if (!p) continue

              if (!investorMap.has(u.id)) {
                investorMap.set(u.id, { user: u, investments: [], totalInvested: 0 })
              }
              const data = investorMap.get(u.id)!
              data.investments.push({ ...inv, propertySymbol: p.symbol, propertyName: p.name })
              data.totalInvested += inv.amountInvested
            }

            setInvestors(Array.from(investorMap.values()).sort((a, b) => b.totalInvested - a.totalInvested))
            setIsLoading(false)
          })
        })
      } catch (err) {
        console.error(err)
        toast.error('Failed to load investors')
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      if (unsubProps) unsubProps()
      if (unsubInvestments) unsubInvestments()
    }
  }, [user])

  return (
    <AppLayout requiredRole="developer" title="Investors">
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">My Investors</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">View the list of investors who hold fractional ownership in your properties.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold">
            <Users className="w-5 h-5" />
            <span>{investors.length} Total Investors</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center h-64 items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : investors.length === 0 ? (
          <Card className="flex flex-col h-[400px] items-center justify-center border-dashed border-2 bg-card/30 shadow-none">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold">No Investors Yet</h3>
            <p className="text-muted-foreground text-sm mt-2">You don't have any active investors in your properties.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investors.map(inv => (
              <Card key={inv.user.id} className="p-6 rounded-2xl border-border/50 hover:border-primary/40 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-inner border border-primary/20">
                    {inv.user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{inv.user.name}</h3>
                    <p className="text-sm text-muted-foreground">{inv.user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Total Invested</span>
                    <span className="text-lg font-black font-mono">₹{inv.totalInvested.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Holdings ({inv.investments.length})</span>
                    <div className="space-y-2">
                      {inv.investments.map(i => (
                        <div key={i.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="font-medium">{i.propertySymbol}</span>
                          </div>
                          <span className="font-mono text-muted-foreground">{i.unitsOwned} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Users, IndianRupee, Briefcase, Mail, Phone, TrendingUp } from 'lucide-react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const fallbackAvatar = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80'

function getInvestorName(investor: any) {
  return investor.name || investor.fullName || investor.displayName || investor.investorName || 'Investor'
}

function getInvestorEmail(investor: any) {
  return investor.email || investor.userEmail || investor.investorEmail || 'No email available'
}

function getInvestorPhoto(investor: any) {
  return investor.photo || investor.avatar || investor.profileImage || fallbackAvatar
}

export default function AdminInvestorsPage() {
  const router = useRouter()
  const [investors, setInvestors] = useState<any[]>([])
  const [investmentSummary, setInvestmentSummary] = useState<Record<string, { totalInvested: number; totalUnits: number; currentValue: number }>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const investorsQuery = query(collection(db, 'investors'))
    const unsubscribe = onSnapshot(investorsQuery, (snapshot) => {
      setInvestors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, () => setLoading(false))

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const investmentsQuery = query(collection(db, 'investments'))
    const unsubscribe = onSnapshot(investmentsQuery, (snapshot) => {
      const summary: Record<string, { totalInvested: number; totalUnits: number; currentValue: number }> = {}
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as any
        const userId = data.userId
        if (!userId) return
        summary[userId] ||= { totalInvested: 0, totalUnits: 0, currentValue: 0 }
        summary[userId].totalInvested += Number(data.amountInvested || 0)
        summary[userId].totalUnits += Number(data.unitsOwned || 0)
        summary[userId].currentValue += Number(data.currentValue || 0)
      })
      setInvestmentSummary(summary)
    }, () => {})

    return () => unsubscribe()
  }, [])

  const filteredInvestors = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return investors
    return investors.filter((investor) => {
      const name = getInvestorName(investor).toLowerCase()
      const email = getInvestorEmail(investor).toLowerCase()
      const id = (investor.id || '').toLowerCase()
      return name.includes(term) || email.includes(term) || id.includes(term)
    })
  }, [investors, search])

  return (
    <AppLayout requiredRole="admin" title="Investors" subtitle="Review all investor profiles and portfolio summaries">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Investors</h1>
            <p className="mt-2 text-sm text-muted-foreground">Browse registered investors, view their portfolio health, and open a full investor profile.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or ID"
              className="min-w-[280px]"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 border border-border/70 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="w-5 h-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Total investors</p>
                <p className="mt-2 text-3xl font-black text-foreground">{investors.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border/70 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <IndianRupee className="w-5 h-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Platform invested</p>
                <p className="mt-2 text-3xl font-black text-foreground">₹{Object.values(investmentSummary).reduce((sum, item) => sum + item.totalInvested, 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border/70 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Briefcase className="w-5 h-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Total holdings</p>
                <p className="mt-2 text-3xl font-black text-foreground">{Object.values(investmentSummary).reduce((sum, item) => sum + item.totalUnits, 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center rounded-[2rem] border border-dashed border-border/40 bg-card/40">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredInvestors.length === 0 ? (
          <Card className="flex h-72 items-center justify-center rounded-[2rem] border border-dashed border-border/40 bg-card/40 text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">No investors found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search term.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredInvestors.map((investor) => {
              const totals = investmentSummary[investor.id] || { totalInvested: 0, totalUnits: 0, currentValue: 0 }
              return (
                <Card key={investor.id} className="overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-lg transition hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={getInvestorPhoto(investor)} alt={getInvestorName(investor)} className="h-16 w-16 rounded-3xl object-cover border border-border/70" />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-black text-foreground">{getInvestorName(investor)}</h2>
                        <p className="text-sm text-muted-foreground">{getInvestorEmail(investor)}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 rounded-[1.75rem] bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">Invested Value</span>
                        <span>₹{totals.totalInvested.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">Units Owned</span>
                        <span>{totals.totalUnits}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">Current Value</span>
                        <span>₹{totals.currentValue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border/60 bg-slate-50 p-4">
                    <Button
                      variant="outline"
                      className="w-full rounded-3xl border-border/70 text-sm font-semibold"
                      onClick={() => router.push(`/admin/investors/${investor.id}`)}
                    >
                      View full details
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

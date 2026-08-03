'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, UserCog, Building2, Layers, Star, IndianRupee } from 'lucide-react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

function getDisplayDeveloperId(developer: any) {
  return developer.developerId || developer.id?.slice(0, 6).toUpperCase() || 'DEV000'
}

export default function AdminDevelopersPage() {
  const router = useRouter()
  const [developers, setDevelopers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const devQuery = query(collection(db, 'developers'))
    const unsubscribe = onSnapshot(devQuery, (snapshot) => {
      setDevelopers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, () => setLoading(false))

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const propQuery = query(collection(db, 'properties'))
    const unsubscribe = onSnapshot(propQuery, (snapshot) => {
      setProperties(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }, () => {})

    return () => unsubscribe()
  }, [])

  const developerCards = useMemo(() => {
    return developers.map((developer) => {
      const listedProperties = properties.filter(
        (property) => property.developerId === developer.id || property.developerInfo?.developerId === developer.developerId
      )
      const unitsSold = listedProperties.reduce((sum, property) => sum + Number(property.unitsSold || 0), 0)
      const assetValue = listedProperties.reduce(
        (sum, property) => sum + Number((property.marketData?.currentPrice || property.unitPrice || 0) * (property.totalUnits || 0)),
        0
      )
      return {
        ...developer,
        listedProperties,
        propertiesPosted: listedProperties.length,
        unitsSold,
        assetValue,
      }
    })
  }, [developers, properties])

  const filteredDevelopers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return developerCards
    return developerCards.filter((developer) => {
      const label = getDisplayDeveloperId(developer).toLowerCase()
      const name = (developer.companyName || developer.name || '').toLowerCase()
      return label.includes(term) || name.includes(term)
    })
  }, [developerCards, search])

  return (
    <AppLayout requiredRole="admin" title="Developers" subtitle="Explore registered developers and their published asset portfolios">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Developers</h1>
            <p className="mt-2 text-sm text-muted-foreground">A polished listing of all registered developers with platform metrics and direct public navigation links.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by developer, ID or company"
              className="min-w-[280px]"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 border border-border/70 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <UserCog className="w-5 h-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Developer accounts</p>
                <p className="mt-2 text-3xl font-black text-foreground">{developers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border/70 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Building2 className="w-5 h-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Properties listed</p>
                <p className="mt-2 text-3xl font-black text-foreground">{properties.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border/70 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <IndianRupee className="w-5 h-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Platform asset value</p>
                <p className="mt-2 text-3xl font-black text-foreground">₹{developerCards.reduce((sum, developer) => sum + developer.assetValue, 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center rounded-[2rem] border border-dashed border-border/40 bg-card/40">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredDevelopers.length === 0 ? (
          <Card className="flex h-72 items-center justify-center rounded-[2rem] border border-dashed border-border/40 bg-card/40 text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">No developers found</p>
              <p className="mt-2 text-sm text-muted-foreground">Search by developer ID or company name to filter list.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredDevelopers.map((developer) => (
              <Card key={developer.id} className="overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-lg transition hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Developer ID</p>
                      <p className="mt-2 text-xl font-black text-foreground">{getDisplayDeveloperId(developer)}</p>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                      {developer.verified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Company</p>
                      <p className="mt-2 text-lg font-bold text-foreground">{developer.companyName || developer.name || 'Untitled Developer'}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-700">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Properties</p>
                        <p className="mt-2 text-2xl font-black">{developer.propertiesPosted}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Units sold</p>
                        <p className="mt-2 text-2xl font-black">{developer.unitsSold}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Asset value</p>
                        <p className="mt-2 text-2xl font-black">₹{developer.assetValue.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/60 bg-slate-50 p-4">
                  <Button
                    className="w-full rounded-3xl border-border/70 text-sm font-semibold"
                    variant="outline"
                    onClick={() => router.push(`/developers/${getDisplayDeveloperId(developer)}`)}
                  >
                    View public page
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

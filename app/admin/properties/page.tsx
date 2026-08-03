'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Building2, Search, Loader2, MapPin, TrendingUp, Filter, IndianRupee, BadgeCheck, Briefcase, User2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function AdminPropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter State
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    setLoading(true)
    const unsub = onSnapshot(query(collection(db, 'properties'), where('status', '==', 'active')), (snap) => {
      setProperties(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, (err) => {
      toast.error('Failed to load properties')
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Filter Logic
  const filteredProperties = properties.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = 
      (p.globalId || '').toLowerCase().includes(s) || 
      (p.name || '').toLowerCase().includes(s) ||
      (p.symbol || '').toLowerCase().includes(s) ||
      (p.developerId || '').toLowerCase().includes(s)
    
    const matchType = typeFilter === 'All' || p.type === typeFilter
    const matchStatus = statusFilter === 'All' || p.status === statusFilter

    return matchSearch && matchType && matchStatus
  })

  // Mini Analytics
  const totalProperties = properties.length
  const totalValue = properties.reduce((acc, p) => acc + ((p.marketData?.currentPrice || p.unitPrice || 0) * (p.totalUnits || 0)), 0)
  const activeDevelopers = new Set(properties.map(p => p.developerId)).size

  return (
    <AppLayout title="All Properties" subtitle="Manage all approved platform properties" requiredRole="admin">
      <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex flex-col gap-3 shadow-sm border">
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Live Properties</span>
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-bold font-mono">{totalProperties}</h3>
          </Card>
          <Card className="p-5 flex flex-col gap-3 shadow-sm border" title={`₹${totalValue.toLocaleString('en-IN')}`}>
            <div className="flex justify-between items-center text-green-600">
              <span className="text-xs font-semibold uppercase tracking-wider">Platform Asset Value</span>
              <IndianRupee className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-bold font-mono">₹{(totalValue / 10000000).toFixed(2)} Cr</h3>
          </Card>
          <Card className="p-5 flex flex-col gap-3 shadow-sm border">
            <div className="flex justify-between items-center text-primary">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Developers</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-bold font-mono">{activeDevelopers}</h3>
          </Card>
        </div>

        {/* Command Toolbar and List */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 border-b bg-muted/20">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search ID, Ticker, Name, Developer..." 
                className="pl-9 h-9 bg-background text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                className="h-9 px-3 rounded-md border bg-background text-xs font-medium min-w-[130px] outline-none focus:ring-1 focus:ring-primary"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Commercial Office">Commercial</option>
              </select>
              <select 
                className="h-9 px-3 rounded-md border bg-background text-xs font-medium min-w-[130px] outline-none focus:ring-1 focus:ring-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Ready">Ready</option>
                <option value="Under Construction">Under Const.</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Filter className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No properties found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground border-b font-semibold">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Global ID</th>
                    <th className="px-5 py-3 font-semibold">Asset Details</th>
                    <th className="px-5 py-3 font-semibold">Developer</th>
                    <th className="px-5 py-3 font-semibold text-right">Value (Cr)</th>
                    <th className="px-5 py-3 font-semibold text-right">Appreciation</th>
                    <th className="px-5 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProperties.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs">{p.globalId}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Building2 className="w-5 h-5 text-muted-foreground opacity-50" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm line-clamp-1">{p.name || 'Unnamed Property'}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{p.symbol} • {p.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Dialog>
                          <DialogTrigger render={
                            <Button variant="outline" size="sm" className="h-8 gap-2 bg-muted/50 hover:bg-muted font-bold text-xs shadow-sm border-border" />
                          }>
                            <Briefcase className="w-3.5 h-3.5 text-primary" />
                            {p.developerId ? p.developerId.substring(0, 6).toUpperCase() : 'VISHWA'}
                          </DialogTrigger>
                          <DialogContent showCloseButton={false} className="sm:max-w-[425px] p-0 overflow-hidden bg-transparent border-0 shadow-2xl">
                            <div className="bg-card w-full h-[500px] flex flex-col relative rounded-3xl overflow-hidden border border-border/50">
                              <div className="h-32 bg-gradient-to-br from-primary to-indigo-600 relative">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                              </div>
                              <div className="absolute top-16 inset-x-0 flex justify-center">
                                <div className="w-32 h-32 rounded-2xl bg-background border-4 border-card shadow-xl flex items-center justify-center overflow-hidden">
                                  {p.developerInfo?.logoUrl ? (
                                    <img src={p.developerInfo.logoUrl} alt="Developer Logo" className="w-full h-full object-cover" />
                                  ) : (
                                    <Building2 className="w-16 h-16 text-muted-foreground opacity-50" />
                                  )}
                                </div>
                              </div>
                              <div className="mt-20 px-8 pb-8 text-center flex-1 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-2xl font-black text-foreground mb-1">{p.developerInfo?.companyName || (p.developerId ? p.developerId.substring(0, 6).toUpperCase() : 'VISHWA')}</h3>
                                  <p className="text-sm text-primary font-bold tracking-widest uppercase mb-4 flex items-center justify-center gap-1">
                                    <BadgeCheck className="w-4 h-4" /> Verified Developer
                                  </p>
                                  <div className="bg-muted/50 p-4 rounded-2xl border border-border/50 flex flex-col gap-3 text-left">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 border"><User2 className="w-4 h-4 text-muted-foreground" /></div>
                                      <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Contact Person</p>
                                        <p className="text-sm font-semibold">{p.developerInfo?.contactPerson || 'Not Provided'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 border font-mono text-[10px] font-bold">ID</div>
                                      <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Developer UID</p>
                                        <p className="text-xs font-mono truncate">{p.developerId || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-border/50">
                                  <p className="text-[10px] text-muted-foreground font-mono">ID Card valid for Milestono Platform strictly.</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="px-5 py-3 font-mono text-sm text-right" title={`₹${((p.marketData?.currentPrice || p.unitPrice || 0) * (p.totalUnits || 0)).toLocaleString('en-IN')}`}>
                        ₹{((p.marketData?.currentPrice || p.unitPrice || 0) * (p.totalUnits || 0) / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-5 py-3 text-right">
                        {(() => {
                          const currentPrice = p.marketData?.currentPrice || p.unitPrice || 0;
                          const initialPrice = p.unitPrice || 0;
                          const hasAppreciation = p.marketData?.currentPrice !== undefined && initialPrice > 0;
                          
                          if (hasAppreciation) {
                            const appreciationPct = ((currentPrice - initialPrice) / initialPrice) * 100;
                            return (
                              <div className="flex flex-col items-end">
                                <span className={appreciationPct >= 0 ? "text-xs font-bold text-emerald-500" : "text-xs font-bold text-rose-500"}>
                                  {appreciationPct > 0 ? '+' : ''}{appreciationPct.toFixed(2)}%
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current</span>
                              </div>
                            );
                          } else if (p.marketData?.appreciationPct !== undefined) {
                            return (
                              <div className="flex flex-col items-end">
                                <span className={p.marketData.appreciationPct >= 0 ? "text-xs font-bold text-emerald-500" : "text-xs font-bold text-rose-500"}>
                                  {p.marketData.appreciationPct >= 0 ? '+' : ''}{p.marketData.appreciationPct.toFixed(2)}%
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current</span>
                              </div>
                            );
                          } else if (p.appreciationSchedule) {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-primary">+{p.appreciationSchedule.percentage}%</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-emerald-500">0.00%</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current</span>
                              </div>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[11px] border-primary/20 hover:border-primary text-primary hover:bg-primary/10"
                          onClick={() => router.push(`/admin/properties-prices/${p.symbol}`)}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" /> Set Price
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

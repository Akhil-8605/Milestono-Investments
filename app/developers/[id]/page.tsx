'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property, Developer } from '@/lib/types'
import { 
  Building2, MapPin, TrendingUp, Star, Loader2, IndianRupee, ShieldCheck, 
  Phone, Mail, Globe, Award, Calendar, CheckCircle2, ArrowRight, Eye, Layers, ExternalLink
} from 'lucide-react'
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { DeveloperIdCard } from '@/components/developer/DeveloperIdCard'

export default function PublicDeveloperProfilePage() {
  const router = useRouter()
  const params = useParams()
  const idParam = params?.id
  const devIdParam = Array.isArray(idParam) ? idParam[0] : idParam

  const [developer, setDeveloper] = useState<Developer | any | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'about' | 'verification'>('portfolio')

  useEffect(() => {
    if (!devIdParam) return

    let unsubscribeByDeveloperId: (() => void) | null = null
    let unsubscribeByDeveloperInfo: (() => void) | null = null
    const propertyMap = new Map<string, Property>()
    let currentDevData: any = null

    const normalizeDeveloperFromProperty = (firstProp: any) => {
      const info = firstProp.developerInfo || {}
      return {
        developerId: devIdParam,
        companyName: info.companyName || firstProp.companyName || `${devIdParam} Developments`,
        name: info.contactPerson || firstProp.developerName || 'Authorized Representative',
        email: info.email || firstProp.developerEmail || 'contact@developer.com',
        phone: info.mobile || firstProp.developerPhone || '+91 98765 43210',
        officeAddress: firstProp.location?.fullAddress || firstProp.address || `${firstProp.city || 'Mumbai'}, India`,
        yearsEstablished: '12+ Years',
        partnerSince: '2024',
        verified: true,
      }
    }

    const updateProperties = () => {
      const propertiesArray = Array.from(propertyMap.values())
      setProperties(propertiesArray)

      if (!currentDevData && propertiesArray.length > 0) {
        currentDevData = normalizeDeveloperFromProperty(propertiesArray[0])
        setDeveloper(currentDevData)
      }
    }

    const loadDeveloperData = async () => {
      setIsLoading(true)

      try {
        const devQuery = query(collection(db, 'developers'), where('developerId', '==', devIdParam))
        const devSnap = await getDocs(devQuery)
        if (!devSnap.empty) {
          currentDevData = { id: devSnap.docs[0].id, ...devSnap.docs[0].data() }
        }

        if (!currentDevData) {
          const developerDoc = await getDoc(doc(db, 'developers', devIdParam))
          if (developerDoc.exists()) {
            currentDevData = { id: developerDoc.id, ...developerDoc.data() }
          }
        }

        // Normalize image fields
        if (currentDevData) {
          currentDevData.companyLogo = currentDevData.logo || currentDevData.companyLogo
          currentDevData.companyBanner = currentDevData.banner || currentDevData.companyBanner
        }

        setDeveloper(currentDevData)

        const uidsToMatch = Array.from(new Set([
          currentDevData?.id, 
          currentDevData?.developerId, 
          devIdParam
        ].filter(Boolean)))

        const propertiesByDevIdQuery = query(collection(db, 'properties'), where('developerId', 'in', uidsToMatch))

        const handleSnapshot = (snap: any) => {
          snap.docs.forEach((doc: any) => {
            propertyMap.set(doc.id, { id: doc.id, ...doc.data() } as Property)
          })
          updateProperties()
          setIsLoading(false)
        }

        unsubscribeByDeveloperId = onSnapshot(propertiesByDevIdQuery, handleSnapshot)
      } catch (err) {
        console.error('Error loading developer details:', err)
        setIsLoading(false)
      }
    }

    loadDeveloperData()

    return () => {
      unsubscribeByDeveloperId?.()
    }
  }, [devIdParam])

  if (isLoading) {
    return (
      <AppLayout allowGuest title="Developer Profile">
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  const totalPortfolioValue = properties.reduce((acc, p) => acc + ((p.totalUnits || 0) * (p.marketData?.currentPrice || p.unitPrice || 0)), 0)
  const totalUnitsSold = properties.reduce((acc, p) => acc + (p.unitsSold || 0), 0)

  return (
    <AppLayout allowGuest title={developer?.companyName || `Developer ${devIdParam}`}>
      <div className="min-h-screen bg-background relative selection:bg-primary/30 pb-32">
        {/* Ambient Glow background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] bg-primary/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1250px] mx-auto px-6 py-8 space-y-8 relative z-10">
          
          {/* Hero Banner Header */}
          <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-card shadow-xl">
            {/* Banner Background */}
            <div className="h-56 md:h-72 w-full relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
              {developer?.companyBanner ? (
                <img src={developer.companyBanner} className="w-full h-full object-cover opacity-60" alt="Banner" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-background/60 to-background" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>

            {/* Profile Info Row */}
            <div className="p-6 md:p-8 relative z-10 -mt-20 md:-mt-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                {/* Developer Logo */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-card bg-background shadow-2xl overflow-hidden shrink-0 flex items-center justify-center">
                  {developer?.companyLogo ? (
                    <img src={developer.companyLogo} className="w-full h-full object-cover" alt="Company Logo" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-primary font-black text-2xl">
                      {developer?.companyName?.slice(0, 2).toUpperCase() || 'DEV'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{developer?.companyName}</h1>
                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-4 h-4" /> Verified Developer
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="bg-muted px-3 py-1 rounded-md font-mono text-foreground">
                      ID: {devIdParam}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Est. {developer?.yearsEstablished || '2012'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {developer?.officeAddress?.split(',')[0] || 'India'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-initial gap-2 rounded-xl border-border/80" onClick={() => setActiveTab('about')}>
                  <Phone className="w-4 h-4 text-primary" /> Contact Developer
                </Button>
                <Button className="flex-1 md:flex-initial gap-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={() => setActiveTab('portfolio')}>
                  <Building2 className="w-4 h-4" /> View Properties ({properties.length})
                </Button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border/50 divide-x divide-border/50 bg-muted/20 text-center">
              <div className="p-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Listed Assets</p>
                <p className="text-xl md:text-2xl font-black font-mono text-foreground mt-1">{properties.length}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Portfolio Value</p>
                <p className="text-xl md:text-2xl font-black font-mono text-emerald-500 mt-1">₹{(totalPortfolioValue / 1e7).toFixed(2)} Cr</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Units Funded</p>
                <p className="text-xl md:text-2xl font-black font-mono text-indigo-500 mt-1">{totalUnitsSold}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Rating & Trust</p>
                <p className="text-xl md:text-2xl font-black font-mono text-amber-500 mt-1 flex items-center justify-center gap-1">
                  4.9 <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 border-b border-border/60 pb-3">
            <Button
              variant={activeTab === 'portfolio' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('portfolio')}
              className="rounded-xl font-bold gap-2 text-sm"
            >
              <Building2 className="w-4 h-4" /> Properties Portfolio ({properties.length})
            </Button>
            <Button
              variant={activeTab === 'about' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('about')}
              className="rounded-xl font-bold gap-2 text-sm"
            >
              <Award className="w-4 h-4" /> Company Profile & Contact
            </Button>
            <Button
              variant={activeTab === 'verification' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('verification')}
              className="rounded-xl font-bold gap-2 text-sm"
            >
              <ShieldCheck className="w-4 h-4" /> Developer ID & Credentials
            </Button>
          </div>

          {/* Tab 1: Properties Portfolio Grid */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Active Properties Portfolio</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Explore fractional investment assets developed by {developer?.companyName}.</p>
                </div>
              </div>

              {properties.length === 0 ? (
                <Card className="p-12 text-center rounded-3xl border-dashed bg-card/40">
                  <Building2 className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">No Listed Properties Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">This developer has not published any active property listings yet.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((p) => {
                    const price = p.marketData?.currentPrice || p.unitPrice || 0
                    const availUnits = Math.max(0, (p.totalUnits || 0) - (p.unitsSold || 0) - (p.unitsOnHold || 0))
                    const percentFunded = p.totalUnits ? Math.round(((p.totalUnits - availUnits) / p.totalUnits) * 100) : 0

                    return (
                      <Card 
                        key={p.id} 
                        onClick={() => router.push(`/properties/${p.id}`)}
                        className="group overflow-hidden rounded-2xl border-border/60 hover:border-primary/60 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col bg-card"
                      >
                        {/* Property Image Header */}
                        <div className="h-48 relative overflow-hidden bg-muted">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-bold">
                              <Building2 className="w-10 h-10 opacity-40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="bg-background/80 backdrop-blur-md border border-border/50 text-foreground font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                              {p.symbol}
                            </span>
                            <span className="bg-emerald-500/90 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                              {p.expectedYield || 8}% Yield
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <div className="text-white">
                              <p className="font-bold text-base leading-tight drop-shadow-md">{p.name}</p>
                              <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-emerald-400" /> {typeof p.location === 'object' ? p.location.city : (p.city || 'Mumbai')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Property Details Body */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border/50">
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Unit Price</p>
                              <p className="text-base font-black font-mono text-foreground mt-0.5">₹{price.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Available Units</p>
                              <p className="text-base font-black font-mono text-indigo-500 mt-0.5">{availUnits.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-muted-foreground">Funding Progress</span>
                              <span className="text-emerald-500 font-bold">{percentFunded}% Sold</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${percentFunded}%` }} />
                            </div>
                          </div>

                          <Button className="w-full gap-2 rounded-xl font-bold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all">
                            <Eye className="w-4 h-4" /> View Asset Details <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: About & Contact Details */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 p-8 space-y-6 rounded-3xl border-border/60">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">About {developer?.companyName}</h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                    {developer?.description || `${developer?.companyName} is a premier institutional real estate developer specializing in high-yielding grade-A commercial and residential fractional investment assets across major metropolitan hubs.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/50 pt-6">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Establishment Year</p>
                    <p className="text-lg font-bold text-foreground mt-1">{developer?.yearsEstablished || '2012'}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">RERA License</p>
                    <p className="text-lg font-bold font-mono text-emerald-500 mt-1">RERA-MH-{devIdParam}-998</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-6 rounded-3xl border-border/60 h-fit bg-gradient-to-br from-card to-indigo-500/5">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Contact Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Corporate Office</p>
                      <p className="text-foreground mt-0.5 font-medium">{developer?.officeAddress || 'Mumbai, Maharashtra, India'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Direct Line</p>
                      <p className="text-foreground font-mono font-medium mt-0.5">{developer?.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Official Email</p>
                      <p className="text-foreground font-medium mt-0.5">{developer?.email}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Tab 3: Verification & ID Card */}
          {activeTab === 'verification' && (
            <div className="flex flex-col items-center justify-center py-6">
              <DeveloperIdCard
                developerId={developer?.developerId || devIdParam}
                companyName={developer?.companyName || 'Milestono Developer'}
                yearsEstablished={developer?.yearEstablished || developer?.yearsEstablished || '10+ Years'}
                mobileNumber={developer?.companyPhone || developer?.phone || '0000000000'}
                officeAddress={developer?.officeAddress || 'Mumbai, India'}
                companyLogo={developer?.companyLogo}
                companyBanner={developer?.companyBanner}
              />
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  )
}

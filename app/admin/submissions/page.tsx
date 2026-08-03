'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import {
  FileCheck, Building2, MapPin, Search, Loader2, CheckCircle2, XCircle,
  ChevronRight, ChevronLeft, FileText, IndianRupee, ShieldCheck, Layers,
  Image as ImageIcon, ExternalLink, ArrowRight, ArrowLeft, Check, Info,
  Calendar, UserCheck, Percent, Sparkles, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { createNotification } from '@/lib/notifications'

const REVIEW_STEPS = [
  { id: 'basic', label: 'Basic Details', icon: Building2 },
  { id: 'specs', label: 'Specifications', icon: Layers },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'financial', label: 'Financials', icon: IndianRupee },
  { id: 'media', label: 'Media & Gallery', icon: ImageIcon },
  { id: 'legal', label: 'Legal & Docs', icon: ShieldCheck },
  { id: 'decision', label: 'Admin Decision', icon: FileCheck }
]

export default function AdminSubmissionsPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [reviewStep, setReviewStep] = useState(0)

  const [rejectMessage, setRejectMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'properties'), where('status', '==', 'pending_approval'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProperties(pendingProps)
      setLoading(false)
    }, (error) => {
      console.error('[Admin Submissions] Realtime Error:', error)
      toast.error('Failed to sync submissions')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const getPropName = (p: any) => p?.name || p?.basicDetails?.propertyName || p?.rawFormData?.basicDetails?.propertyName || 'Untitled Property'
  const getPropSymbol = (p: any) => p?.symbol || p?.basicDetails?.tickerId || p?.rawFormData?.basicDetails?.tickerId || p?.globalId || 'NO-ID'
  const getPropCity = (p: any) => p?.city || p?.location?.city || p?.rawFormData?.location?.city || 'N/A'
  const getPropState = (p: any) => p?.state || p?.location?.state || p?.rawFormData?.location?.state || 'N/A'
  const getPropAddress = (p: any) => p?.address || p?.location?.fullAddress || p?.rawFormData?.location?.fullAddress || `${getPropCity(p)}, ${getPropState(p)}`
  const getPropPincode = (p: any) => p?.pincode || p?.location?.pincode || p?.rawFormData?.location?.pincode || ''
  const getPropDevName = (p: any) => p?.developerName || p?.companyName || p?.developerInfo?.companyName || p?.rawFormData?.developerInfo?.companyName || 'Developer'
  const getPropDevMobile = (p: any) => p?.developerMobile || p?.developerInfo?.mobile || p?.rawFormData?.developerInfo?.mobile || 'N/A'
  const getPropType = (p: any) => p?.type || p?.propertyType || p?.basicDetails?.propertyType || p?.rawFormData?.basicDetails?.propertyType || 'N/A'
  const getPropStatus = (p: any) => p?.basicDetails?.constructionStatus || p?.rawFormData?.basicDetails?.constructionStatus || p?.status || 'Pending'
  const getPropUnits = (p: any) => p?.totalUnits || p?.investmentInfo?.totalInvestmentUnits || p?.rawFormData?.investmentInfo?.totalInvestmentUnits || 0
  const getPropValuation = (p: any) => p?.totalValue || (p?.totalUnits && p?.unitPrice ? p.totalUnits * p.unitPrice : 0) || p?.investmentInfo?.totalPropertyPrice || p?.rawFormData?.investmentInfo?.totalPropertyPrice || 0
  const getPropUnitPrice = (p: any) => p?.unitPrice || p?.investmentInfo?.pricePerUnit || (getPropValuation(p) && getPropUnits(p) ? Math.round(getPropValuation(p) / getPropUnits(p)) : 0)
  const getPropImage = (p: any) => p?.images?.[0] || p?.media?.images?.[0] || p?.rawFormData?.media?.images?.[0] || ''
  const getPropImages = (p: any) => p?.images || p?.media?.images || p?.rawFormData?.media?.images || (getPropImage(p) ? [getPropImage(p)] : [])
  const getPropRera = (p: any) => p?.reraNumber || p?.legalVerification?.reraNumber || p?.rawFormData?.legalVerification?.reraNumber || 'Not Provided'
  const getPropYield = (p: any) => p?.expectedYield || p?.investmentInfo?.rentalYield || p?.rawFormData?.investmentInfo?.rentalYield || 0
  const getPropDescription = (p: any) => p?.description || p?.basicDetails?.description || p?.rawFormData?.basicDetails?.description || 'No detailed description provided.'
  const getPropAmenities = (p: any) => p?.amenities || p?.specifications?.amenities || p?.rawFormData?.specifications?.amenities || []

  const filteredProperties = properties.filter(p =>
    getPropName(p).toLowerCase().includes(search.toLowerCase()) ||
    getPropSymbol(p).toLowerCase().includes(search.toLowerCase()) ||
    getPropDevName(p).toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedProperty) return
    if (status === 'rejected' && !rejectMessage.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setActionLoading(true)
    try {
      const finalStatus = status === 'approved' ? 'active' : 'rejected'

      const propRef = doc(db, 'properties', selectedProperty.id)
      await updateDoc(propRef, {
        status: finalStatus,
        adminMessage: status === 'rejected' ? rejectMessage : null,
        updatedAt: serverTimestamp()
      })

      toast.success(`Property ${status} successfully`)

      const devId = selectedProperty.developerId || selectedProperty.userId

      if (devId) {
        if (status === 'rejected') {
          await createNotification(
            devId,
            'developer',
            'property_rejected',
            'Property Submission Rejected',
            rejectMessage,
            {
              propertySymbol: getPropSymbol(selectedProperty),
              propertyName: getPropName(selectedProperty),
              propertyImage: getPropImage(selectedProperty)
            }
          )
        } else if (status === 'approved') {
          await createNotification(
            devId,
            'developer',
            'property_approved',
            'Property Approved!',
            'Your property has been successfully approved and is now live on the marketplace.',
            {
              propertySymbol: getPropSymbol(selectedProperty),
              propertyName: getPropName(selectedProperty)
            }
          )
        }
      }

      setSelectedProperty(null)
      setRejectMessage('')
      setReviewStep(0)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update property status')
    } finally {
      setActionLoading(false)
    }
  }

  const openInNewTab = (url: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <AppLayout title="New Submissions" subtitle="Review and approve new property listings" requiredRole="admin">
      <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">

        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by property name, ID, or developer..."
              className="pl-9 h-11 bg-background text-sm rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-primary font-semibold bg-primary/10 px-5 h-11 rounded-lg border border-primary/20">
            <FileCheck className="w-5 h-5" />
            {properties.length} Pending Approvals
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading submissions...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-card/30 border border-dashed rounded-2xl">
            <FileCheck className="w-16 h-16 mb-6 text-primary opacity-20" />
            <p className="text-xl font-bold text-foreground">No pending submissions</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map(p => (
              <Card
                key={p.id}
                className="group overflow-hidden rounded-2xl hover:shadow-lg transition-all border-border/50 hover:border-primary/30 flex flex-col cursor-pointer"
                onClick={() => {
                  setSelectedProperty(p)
                  setReviewStep(0)
                  setRejectMessage('')
                }}
              >
                {/* Banner Image */}
                <div className="h-40 w-full bg-muted relative overflow-hidden">
                  {getPropImage(p) ? (
                    <img src={getPropImage(p)} alt="Property" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 opacity-20" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="font-bold text-white text-lg line-clamp-1">{getPropName(p)}</h3>
                      <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {getPropCity(p)}, {getPropState(p)}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 text-[10px] font-mono bg-black/60 text-white backdrop-blur-md px-2 py-1 rounded-md border border-white/10 shadow-sm">
                    {getPropSymbol(p)}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Developer</span>
                      <p className="font-medium text-foreground line-clamp-1">{getPropDevName(p)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Value</span>
                      <p className="font-bold text-gain flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{getPropValuation(p).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</span>
                      <p className="font-medium text-foreground">{getPropType(p)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Units</span>
                      <p className="font-medium text-foreground">{getPropUnits(p) || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
                    Review Application Wizzard
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Step Overlay Modal */}
      <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent className="w-[95vw] md:w-[90vw] xl:w-[85vw] max-w-[95vw] md:max-w-[90vw] xl:max-w-[85vw] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-background">
          {selectedProperty && (
            <div className="flex flex-col h-[90vh] max-h-[850px] w-full">

              {/* Top Header & Stepper */}
              <div className="bg-card border-b border-border p-6 shrink-0 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {REVIEW_STEPS[reviewStep].icon && (() => {
                        const Icon = REVIEW_STEPS[reviewStep].icon
                        return <Icon className="w-6 h-6" />
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black tracking-tight text-foreground">{getPropName(selectedProperty)}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                          {getPropSymbol(selectedProperty)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        Step {reviewStep + 1} of {REVIEW_STEPS.length}: <span className="font-bold text-foreground">{REVIEW_STEPS[reviewStep].label}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-xl">
                      Developer: <span className="text-foreground font-bold">{getPropDevName(selectedProperty)}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Stepper Tabs */}
                <div className="grid grid-cols-7 gap-2">
                  {REVIEW_STEPS.map((step, idx) => {
                    const StepIcon = step.icon
                    const isPassed = idx < reviewStep
                    const isCurrent = idx === reviewStep
                    return (
                      <button
                        key={step.id}
                        onClick={() => setReviewStep(idx)}
                        className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all border text-center ${isCurrent
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-md shadow-primary/20 scale-[1.02]'
                          : isPassed
                            ? 'bg-primary/10 text-primary border-primary/20 font-semibold'
                            : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'
                          }`}
                      >
                        <StepIcon className="w-4 h-4 mb-1" />
                        <span className="text-[10px] hidden sm:block truncate w-full px-1">{step.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-background/50">

                {/* STEP 0: Basic Details */}
                {reviewStep === 0 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Property Name</span>
                        <p className="text-lg font-black text-foreground">{getPropName(selectedProperty)}</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Property Ticker</span>
                        <p className="text-lg font-mono font-black text-primary">{getPropSymbol(selectedProperty)}</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Property Type</span>
                        <p className="text-lg font-black text-foreground capitalize">{getPropType(selectedProperty)}</p>
                      </Card>
                    </div>

                    <Card className="p-6 rounded-2xl border border-border/50 bg-card space-y-4">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" /> Property Description
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line bg-muted/30 p-4 rounded-xl border border-border/40">
                        {getPropDescription(selectedProperty)}
                      </p>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Construction Status</span>
                        <p className="text-base font-bold text-foreground">{getPropStatus(selectedProperty)}</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Submission Status</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 mt-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Pending Admin Review
                        </span>
                      </Card>
                    </div>
                  </div>
                )}

                {/* STEP 1: Specifications */}
                {reviewStep === 1 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="p-6 rounded-2xl border border-border/50 bg-card space-y-4">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Amenities & Features
                      </h3>
                      {getPropAmenities(selectedProperty).length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {getPropAmenities(selectedProperty).map((amenity: string, i: number) => (
                            <span key={i} className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> {amenity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No specific amenities listed.</p>
                      )}
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Bedrooms</span>
                        <p className="text-xl font-mono font-black">{selectedProperty.specifications?.bedrooms || selectedProperty.rawFormData?.specifications?.bedrooms || 'N/A'}</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Bathrooms</span>
                        <p className="text-xl font-mono font-black">{selectedProperty.specifications?.bathrooms || selectedProperty.rawFormData?.specifications?.bathrooms || 'N/A'}</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">{selectedProperty?.rawFormData?.specifications?.areaType || 'Total Area'}</span>
                        <p className="text-xl font-mono font-black">{selectedProperty.specifications?.area || selectedProperty.rawFormData?.specifications?.areaValue || 'N/A'} sq.ft</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Furnishing</span>
                        <p className="text-base font-bold capitalize">{selectedProperty.specifications?.furnishing || selectedProperty.rawFormData?.specifications?.furnishedStatus || 'N/A'}</p>
                      </Card>
                    </div>
                  </div>
                )}

                {/* STEP 2: Location */}
                {reviewStep === 2 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">City</span>
                        <p className="text-lg font-black text-foreground">{getPropCity(selectedProperty)}</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">State</span>
                        <p className="text-lg font-black text-foreground">{getPropState(selectedProperty)}</p>
                      </Card>
                      <Card className="p-5 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Pincode</span>
                        <p className="text-lg font-mono font-black text-primary">{getPropPincode(selectedProperty) || 'N/A'}</p>
                      </Card>
                    </div>

                    <Card className="p-6 rounded-2xl border border-border/50 bg-card space-y-4">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> Complete Address
                      </h3>
                      <p className="text-base font-medium text-foreground bg-muted/30 p-4 rounded-xl border border-border/40">
                        {getPropAddress(selectedProperty)}
                      </p>
                    </Card>

                    <Card className="p-6 rounded-2xl border border-border/50 bg-card space-y-4">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />Address in Map
                      </h3>
                      <p className="text-base font-medium text-foreground bg-muted/30 p-4 rounded-xl border border-border/40">
                        <iframe
                          title="Property Location"
                          width="100%"
                          height="350"
                          loading="lazy"
                          allowFullScreen
                          className="rounded-xl border"
                          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedProperty.rawFormData?.location?.latitude},${selectedProperty.rawFormData?.location?.longitude}&zoom=16`}
                        />
                      </p>
                    </Card>
                  </div>
                )}

                {/* STEP 3: Financials */}
                {reviewStep === 3 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                      <Card className="p-6 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-2">Total Property Price</span>
                        <p className="text-2xl font-mono font-black text-gain">₹{getPropValuation(selectedProperty).toLocaleString('en-IN')}</p>
                      </Card>
                      <Card className="p-6 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-2">Total Tokenized Units</span>
                        <p className="text-2xl font-mono font-black text-foreground">{getPropUnits(selectedProperty).toLocaleString('en-IN')}</p>
                      </Card>
                      <Card className="p-6 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-2">Base Unit Price</span>
                        <p className="text-2xl font-mono font-black text-primary">₹{getPropUnitPrice(selectedProperty).toLocaleString('en-IN')}</p>
                      </Card>
                      <Card className="p-6 rounded-2xl border border-border/50 bg-card">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-2">Expected Rental Yield</span>
                        <p className="text-2xl font-mono font-black text-emerald-500">{getPropYield(selectedProperty)}% p.a.</p>
                      </Card>
                    </div>
                  </div>
                )}

                {/* STEP 4: Media & Gallery */}
                {reviewStep === 4 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div>
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" /> Property Images (Click image to open full resolution in new tab)
                      </h3>
                      {getPropImages(selectedProperty).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {getPropImages(selectedProperty).map((imgUrl: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => openInNewTab(imgUrl)}
                              className="group relative h-48 rounded-2xl overflow-hidden border border-border/50 cursor-pointer shadow-sm hover:shadow-xl transition-all"
                            >
                              <img src={imgUrl} alt={`Property ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]">
                                <ExternalLink className="w-4 h-4" /> Open Full Resolution
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Card className="p-12 text-center text-muted-foreground border-dashed">
                          No images uploaded for this property.
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 5: Legal & Docs */}
                {reviewStep === 5 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                      <span className="text-xs font-bold uppercase text-indigo-500 tracking-wider block">RERA Registration Number</span>
                      <p className="text-xl font-mono font-black text-indigo-700">{getPropRera(selectedProperty)}</p>
                    </Card>

                    <div>
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Verification Documents (Click to view in new tab)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Ownership Title Proof', url: selectedProperty.legalVerification?.ownershipProofUrl || selectedProperty.documents?.termsUrl },
                          { label: 'Occupancy Certificate', url: selectedProperty.legalVerification?.occupancyCertificateUrl || selectedProperty.documents?.prospectusUrl },
                          { label: 'Tax Payment Receipts', url: selectedProperty.legalVerification?.taxReceiptsUrl || selectedProperty.documents?.riskDisclosureUrl },
                          { label: 'Master Architectural Plan', url: selectedProperty.media?.masterPlan },
                          { label: 'Floor Plan Blueprint', url: selectedProperty.media?.floorPlan },
                          { label: 'Project Prospectus PDF', url: selectedProperty.media?.brochurePdf },
                          { label: 'Complete Legal Bundle PDF', url: selectedProperty.media?.documentsPdf },
                        ].map((docItem, idx) => (
                          <div
                            key={idx}
                            onClick={() => docItem.url ? openInNewTab(docItem.url) : toast.info(`${docItem.label} not provided`)}
                            className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${docItem.url
                              ? 'bg-card hover:bg-primary/5 border-border/50 hover:border-primary/40 cursor-pointer shadow-sm'
                              : 'bg-muted/30 border-dashed opacity-60 cursor-not-allowed'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-xl ${docItem.url ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">{docItem.label}</p>
                                <p className="text-xs text-muted-foreground">{docItem.url ? 'Click to open in new tab' : 'Not Uploaded'}</p>
                              </div>
                            </div>
                            {docItem.url && <ExternalLink className="w-4 h-4 text-primary" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: Admin Decision */}
                {reviewStep === 6 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="p-6 rounded-2xl border border-border/50 bg-card space-y-4">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" /> Developer Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-muted/30 p-4 rounded-xl border">
                          <span className="text-xs text-muted-foreground font-semibold block">Company Name</span>
                          <span className="font-bold text-foreground">{getPropDevName(selectedProperty)}</span>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl border">
                          <span className="text-xs text-muted-foreground font-semibold block">Developer Phone</span>
                          <span className="font-bold text-foreground">{getPropDevMobile(selectedProperty)}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 rounded-2xl border border-border/50 bg-card space-y-4">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                        Rejection Reason (Required only if rejecting)
                      </h3>
                      <Textarea
                        value={rejectMessage}
                        onChange={(e) => setRejectMessage(e.target.value)}
                        placeholder="State clearly why this property application is rejected so the developer can fix it..."
                        className="resize-none h-28 text-sm bg-muted/30 rounded-xl"
                      />
                    </Card>
                  </div>
                )}

              </div>

              {/* Footer Control Bar */}
              <div className="p-5 bg-card border-t border-border flex items-center justify-between shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setReviewStep(prev => Math.max(0, prev - 1))}
                  disabled={reviewStep === 0 || actionLoading}
                  className="h-11 px-6 rounded-xl font-bold gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </Button>

                {reviewStep < REVIEW_STEPS.length - 1 ? (
                  <Button
                    onClick={() => setReviewStep(prev => Math.min(REVIEW_STEPS.length - 1, prev + 1))}
                    className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold h-11 px-6 rounded-xl"
                      onClick={() => handleAction('rejected')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject Application
                    </Button>
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20"
                      onClick={() => handleAction('approved')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Approve & List Property
                    </Button>
                  </div>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

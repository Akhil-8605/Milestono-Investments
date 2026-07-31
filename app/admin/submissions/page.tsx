'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { FileCheck, Building2, MapPin, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function AdminSubmissionsPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  
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

  const filteredProperties = properties.filter(p => 
    p.basicDetails?.propertyName?.toLowerCase().includes(search.toLowerCase()) ||
    p.globalId?.toLowerCase().includes(search.toLowerCase()) ||
    p.developerInfo?.companyName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedProperty) return
    if (status === 'rejected' && !rejectMessage.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/properties/${selectedProperty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message: rejectMessage })
      })
      const json = await res.json()
      
      if (json.success) {
        toast.success(`Property ${status} successfully`)
        setSelectedProperty(null)
        setRejectMessage('')
      } else {
        toast.error(json.error)
      }
    } catch (err) {
      toast.error('Failed to update property status')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AppLayout title="New Submissions" subtitle="Review and approve new property listings" requiredRole="admin">
      <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID, or developer..." 
              className="pl-9 h-9 bg-background text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold bg-muted/50 px-4 h-9 rounded-md border">
            <FileCheck className="w-4 h-4 text-primary" />
            {properties.length} Pending Approvals
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading submissions...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
            <FileCheck className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No pending submissions</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map(p => (
              <Card key={p.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col" onClick={() => setSelectedProperty(p)}>
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border bg-muted">
                    {p.media?.images?.[0] ? (
                      <img src={p.media.images[0]} alt="Property" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 opacity-20" /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{p.basicDetails?.propertyName}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {p.location?.city}, {p.location?.state}
                    </p>
                    <div className="mt-2 text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">
                      {p.globalId}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-xs mb-4 mt-auto">
                  <div className="text-muted-foreground">Developer:</div>
                  <div className="font-medium text-right line-clamp-1">{p.developerInfo?.companyName}</div>
                  <div className="text-muted-foreground">Type:</div>
                  <div className="font-medium text-right">{p.basicDetails?.propertyType}</div>
                  <div className="text-muted-foreground">Total Value:</div>
                  <div className="font-medium text-right text-gain">₹{p.investmentInfo?.totalPropertyPrice?.toLocaleString('en-IN')}</div>
                </div>
                
                <Button variant="secondary" className="w-full text-xs h-8">Review Details</Button>
              </Card>
            ))}
          </div>
        )}

      </div>

      <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Review Property Submission</span>
              <span className="text-xs font-mono bg-primary/10 text-primary px-3 py-1 rounded-full mr-6">
                {selectedProperty?.globalId}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-8 py-4">
              {/* Review Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary border-b pb-1">Basic Details</h4>
                  <div className="text-sm grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Name:</span> <span className="col-span-2 font-medium">{selectedProperty.basicDetails.propertyName}</span>
                    <span className="text-muted-foreground">Type:</span> <span className="col-span-2">{selectedProperty.basicDetails.propertyType}</span>
                    <span className="text-muted-foreground">Status:</span> <span className="col-span-2">{selectedProperty.basicDetails.constructionStatus}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary border-b pb-1">Location</h4>
                  <div className="text-sm grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">City:</span> <span className="col-span-2">{selectedProperty.location.city}, {selectedProperty.location.state}</span>
                    <span className="text-muted-foreground">Area:</span> <span className="col-span-2">{selectedProperty.location.areaLocality}</span>
                    <span className="text-muted-foreground">Address:</span> <span className="col-span-2">{selectedProperty.location.fullAddress}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary border-b pb-1">Investment Info</h4>
                  <div className="text-sm grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Total Price:</span> <span className="col-span-2 font-semibold text-gain">₹{selectedProperty.investmentInfo.totalPropertyPrice.toLocaleString('en-IN')}</span>
                    <span className="text-muted-foreground">Total Units:</span> <span className="col-span-2">{selectedProperty.investmentInfo.totalInvestmentUnits}</span>
                    <span className="text-muted-foreground">Unit Price:</span> <span className="col-span-2 font-medium">₹{Math.round(selectedProperty.investmentInfo.totalPropertyPrice / selectedProperty.investmentInfo.totalInvestmentUnits).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary border-b pb-1">Legal & Developer</h4>
                  <div className="text-sm grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">RERA:</span> <span className="col-span-2 font-mono text-xs">{selectedProperty.legalVerification.reraNumber}</span>
                    <span className="text-muted-foreground">Developer:</span> <span className="col-span-2">{selectedProperty.developerInfo.companyName}</span>
                    <span className="text-muted-foreground">Contact:</span> <span className="col-span-2">{selectedProperty.developerInfo.mobile}</span>
                  </div>
                </div>
              </div>

              {/* Documents & Verification Area */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary border-b pb-1">Documents & Verification</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Ownership Proof', url: selectedProperty.legalVerification.ownershipProofUrl },
                    { label: 'Occupancy Cert.', url: selectedProperty.legalVerification.occupancyCertificateUrl },
                    { label: 'Tax Receipts', url: selectedProperty.legalVerification.taxReceiptsUrl },
                    { label: 'Master Plan', url: selectedProperty.media.masterPlan },
                    { label: 'Floor Plan', url: selectedProperty.media.floorPlan },
                    { label: 'Brochure', url: selectedProperty.media.brochurePdf },
                    { label: 'Legal Docs', url: selectedProperty.media.documentsPdf },
                  ].map((doc, idx) => doc.url && (
                    <div key={idx} className="bg-muted/30 p-3 rounded-lg border flex flex-col gap-2 items-center text-center">
                      <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{doc.label}</span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          Open in New Tab
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Area */}
              <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                <h4 className="text-sm font-semibold">Admin Decision</h4>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Rejection Reason (only if rejecting)</label>
                  <Input 
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                    placeholder="E.g. Document proofs are blurry, please re-upload."
                    className="bg-background"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-2">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleAction('rejected')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                  <Button 
                    className="bg-gain hover:bg-gain/90 text-white"
                    onClick={() => handleAction('approved')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Approve Property
                  </Button>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

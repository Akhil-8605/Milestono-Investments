'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Building2, Mail, Phone, MapPin, CreditCard, CheckCircle2, Loader2, FileText, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DeveloperProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = sessionStorage.getItem('milestono_user')
    if (raw) {
      const user = JSON.parse(raw)
      fetch(`/api/profile?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setProfile(data.data)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [])

  if (loading) {
    return (
      <AppLayout title="Company Profile" subtitle="Manage your firm's details">
        <div className="p-6 flex justify-center items-center h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout title="Company Profile" subtitle="Manage your firm's details">
        <div className="p-6 text-center text-muted-foreground mt-10">
          Profile not found. Please complete onboarding.
        </div>
      </AppLayout>
    )
  }

  const getImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'
    return `${apiUrl}${url}`
  }

  return (
    <AppLayout title="Company Profile" subtitle="Manage your firm's details">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Header / Banner Section */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-32 sm:h-48 w-full bg-secondary relative">
            {profile.companyBanner ? (
              <img src={getImageUrl(profile.companyBanner)} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center text-muted-foreground/30">
                <Globe size={64} />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/90 text-white backdrop-blur shadow-sm">
                <CheckCircle2 size={14} /> Verified Developer
              </span>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-8 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-4 border-card bg-background flex-shrink-0 shadow-lg -mt-12 sm:-mt-16 z-10">
              {profile.companyLogo ? (
                <img src={getImageUrl(profile.companyLogo)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <Building2 size={40} />
                </div>
              )}
            </div>
            
            <div className="text-center sm:text-left flex-1 pb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{profile.companyName}</h1>
              <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                <MapPin size={14} /> Headquartered in {profile.address?.split(',').pop() || 'India'} • Est. {profile.yearEstablished}
              </p>
            </div>

            <div className="pb-2">
              <Button variant="outline" className="border-border bg-background">Edit Profile</Button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold border-b border-border pb-2 text-foreground flex items-center gap-2 mb-4">
                <FileText size={18} className="text-primary" /> Company Overview
              </h2>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio || 'No overview provided.'}
              </p>
            </div>

            {/* Operating Info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold border-b border-border pb-2 text-foreground flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-primary" /> Operating Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Support Email</p>
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <Mail size={14} className="text-muted-foreground" /> {profile.supportEmail}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Phone Number</p>
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <Phone size={14} className="text-muted-foreground" /> {profile.phone}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Registered Address</p>
                  <p className="text-sm text-foreground">{profile.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Legal */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b border-border pb-2 text-foreground flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Legal
              </h2>
              <div className="bg-background rounded-lg border border-border p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Registration Number</p>
                <p className="text-sm font-mono font-bold text-foreground">{profile.registrationNumber}</p>
              </div>
              {profile.gst && (
                <div className="bg-background rounded-lg border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">GST Number</p>
                  <p className="text-sm font-mono font-bold text-foreground">{profile.gst}</p>
                </div>
              )}
            </div>

            {/* Bank Details */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b border-border pb-2 text-foreground flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Bank Details
              </h2>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Account Name</p>
                <p className="text-sm text-foreground">{profile.accountHolder}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Bank Name</p>
                <p className="text-sm text-foreground">{profile.bankName}</p>
              </div>
              <div className="bg-background rounded-lg border border-border p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Account Number</p>
                <p className="text-sm font-mono font-bold text-foreground">
                  •••• {profile.accountNumber ? profile.accountNumber.slice(-4) : 'XXXX'}
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-2 mb-1">IFSC Code</p>
                <p className="text-sm font-mono font-bold text-foreground uppercase">{profile.ifsc}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

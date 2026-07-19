'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { UserCircle2, Mail, Phone, Calendar, MapPin, CreditCard, Building, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InvestorProfilePage() {
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
      <AppLayout title="Profile" subtitle="Manage your account">
        <div className="p-6 flex justify-center items-center h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout title="Profile" subtitle="Manage your account">
        <div className="p-6 text-center text-muted-foreground mt-10">
          Profile not found. Please complete onboarding.
        </div>
      </AppLayout>
    )
  }

  // Prepend base url for absolute path to node backend images if needed
  // Or relative is fine if node is proxy or if on same domain.
  // Assuming the node backend returns absolute URL or we prefix it:
  const getImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'
    return `${apiUrl}${url}`
  }

  return (
    <AppLayout title="Profile" subtitle="Your investor identity">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/10 text-gain">
              <CheckCircle2 size={14} /> Verified Investor
            </span>
          </div>

          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-background bg-secondary flex-shrink-0 shadow-xl">
            {profile.profilePic ? (
              <img src={getImageUrl(profile.profilePic)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <UserCircle2 size={48} />
              </div>
            )}
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-bold text-foreground">{profile.fullName}</h1>
            <p className="text-muted-foreground text-sm mt-1 mb-4 flex items-center justify-center sm:justify-start gap-2">
              <MapPin size={14} /> {profile.city}, {profile.state}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Button variant="outline" className="h-8 text-xs border-border bg-background">Edit Profile</Button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Personal Info */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold border-b border-border pb-2 text-foreground flex items-center gap-2">
              <UserCircle2 size={18} className="text-primary" /> Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Email Address</p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Mail size={14} className="text-muted-foreground" /> {profile.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Mobile Number</p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Phone size={14} className="text-muted-foreground" /> {profile.mobile}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Date of Birth</p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar size={14} className="text-muted-foreground" /> {new Date(profile.dob).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Full Address</p>
                <p className="text-sm text-foreground">{profile.address}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{profile.city}, {profile.state}</p>
              </div>
            </div>
          </div>

          {/* Identity & Banking */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold border-b border-border pb-2 text-foreground flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Identity Documents
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">PAN Number</p>
                  <p className="text-sm font-mono font-bold text-foreground">{profile.pan}</p>
                </div>
                <div className="bg-background rounded-lg border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Aadhaar Number</p>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {profile.aadhaar ? `•••• •••• ${profile.aadhaar.slice(-4)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold border-b border-border pb-2 text-foreground flex items-center gap-2">
                <Building size={18} className="text-primary" /> Bank Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Account Name</p>
                  <p className="text-sm text-foreground">{profile.accountHolder}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Bank Name</p>
                    <p className="text-sm text-foreground">{profile.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">IFSC Code</p>
                    <p className="text-sm text-foreground font-mono uppercase">{profile.ifsc}</p>
                  </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Account Number</p>
                  <p className="text-sm font-mono font-bold text-foreground">
                    •••• •••• {profile.accountNumber ? profile.accountNumber.slice(-4) : 'XXXX'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

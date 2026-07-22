'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Loader2, Camera, MapPin, CreditCard, Shield, Edit2, CheckCircle2, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/lib/upload'

export default function InvestorProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const userStr = sessionStorage.getItem('milestono_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      setUserId(user.id)
      try {
        const res = await fetch(`/api/profile?userId=${user.id}`)
        const json = await res.json()
        if (json.success) {
          setProfile(json.data)
          setFormData(json.data)
        }
      } catch (err) {
        console.error('Error fetching profile', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setSaving(true)
    try {
      const url = await uploadImage(e.target.files[0])
      if (url) {
        setFormData((prev: any) => ({ ...prev, profilePic: url }))
        // If not in edit mode, auto save the image
        if (!editing) {
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...profile, profilePic: url, userId })
          })
          setProfile((prev: any) => ({ ...prev, profilePic: url }))
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...formData, userId }
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        setProfile(formData)
        setEditing(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Profile" subtitle="Manage your investor account">
        <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-muted-foreground w-8 h-8" /></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="My Profile" subtitle="Manage your identity and bank details">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/10 pointer-events-none" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background shadow-md overflow-hidden bg-muted">
              {formData?.profilePic ? (
                <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                  {formData?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              {(editing || !formData?.profilePic) && (
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">Change</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{profile?.fullName}</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {profile?.city}, {profile?.state}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-500/10 text-green-600 text-[11px] font-semibold mt-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                KYC Verified
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full sm:w-auto">
            {!editing ? (
              <Button onClick={() => setEditing(true)} variant="outline" className="w-full sm:w-auto gap-2">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={() => { setEditing(false); setFormData(profile) }} variant="ghost" disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Info Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Personal Info */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Personal Information</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Full Name</label>
                  {editing ? <Input name="fullName" value={formData.fullName || ''} onChange={handleChange} className="h-8 text-sm" /> : <div className="text-sm font-medium text-foreground">{profile?.fullName}</div>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Date of Birth</label>
                  {editing ? <Input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="h-8 text-sm" /> : <div className="text-sm font-medium text-foreground">{profile?.dob}</div>}
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Email Address</label>
                  <div className="text-sm font-medium text-foreground">{profile?.email} <span className="text-[10px] text-muted-foreground ml-2">(Cannot be changed)</span></div>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Mobile Number</label>
                  {editing ? <Input name="mobile" value={formData.mobile || ''} onChange={handleChange} className="h-8 text-sm" /> : <div className="text-sm font-medium text-foreground">{profile?.mobile}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Legal & Bank */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-foreground text-sm">Identity Documents</h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">PAN Number</label>
                  {editing ? <Input name="pan" value={formData.pan || ''} onChange={handleChange} className="h-8 text-sm uppercase" /> : <div className="text-sm font-medium text-foreground uppercase">{profile?.pan}</div>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Aadhaar</label>
                  {editing ? <Input name="aadhaar" value={formData.aadhaar || ''} onChange={handleChange} className="h-8 text-sm" /> : <div className="text-sm font-medium text-foreground">{profile?.aadhaar}</div>}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-foreground text-sm">Bank Details</h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Account Holder Name</label>
                  {editing ? <Input name="accountHolder" value={formData.accountHolder || ''} onChange={handleChange} className="h-8 text-sm" /> : <div className="text-sm font-medium text-foreground">{profile?.accountHolder}</div>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Bank Name</label>
                  {editing ? <Input name="bankName" value={formData.bankName || ''} onChange={handleChange} className="h-8 text-sm" /> : <div className="text-sm font-medium text-foreground">{profile?.bankName}</div>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">IFSC Code</label>
                  {editing ? <Input name="ifsc" value={formData.ifsc || ''} onChange={handleChange} className="h-8 text-sm uppercase" /> : <div className="text-sm font-medium text-foreground uppercase">{profile?.ifsc}</div>}
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Account Number</label>
                  {editing ? <Input name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} className="h-8 text-sm" /> : <div className="text-sm font-medium text-foreground">••••••••{profile?.accountNumber?.slice(-4) || '****'}</div>}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  )
}

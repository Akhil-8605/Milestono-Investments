'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { 
  Loader2, Camera, MapPin, CreditCard, Shield, Edit2, 
  CheckCircle2, User as UserIcon, Calendar, Briefcase, 
  IndianRupee, Upload, FileText, Check, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/lib/upload'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function InvestorProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const userStr = localStorage.getItem('milestono_user')
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
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploadingField(fieldName)
    try {
      const url = await uploadImage(e.target.files[0])
      if (url) {
        setFormData((prev: any) => ({ ...prev, [fieldName]: url }))
        if (!editing) {
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...profile, [fieldName]: url, userId })
          })
          setProfile((prev: any) => ({ ...prev, [fieldName]: url }))
          toast.success('Document updated securely')
        }
      }
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploadingField(null)
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
        const raw = localStorage.getItem('milestono_user')
        if (raw) {
          const parsed = JSON.parse(raw)
          localStorage.setItem('milestono_user', JSON.stringify({ ...parsed, name: formData.fullName }))
        }
        toast.success('Profile updated successfully')
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 py-8 px-4 md:px-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border border-border shadow-sm overflow-hidden bg-muted flex-shrink-0 group">
                {formData?.profilePic ? (
                  <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                    {formData?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
                {(editing || !formData?.profilePic) && (
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white transition-opacity">
                    {uploadingField === 'profilePic' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profilePic')} />
                  </label>
                )}
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{profile?.fullName}</h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2 font-medium">
                  <MapPin className="w-4 h-4" /> {profile?.city ? `${profile.city}, ${profile.state}` : 'Location not set'}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> KYC Verified
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    <UserIcon className="w-4 h-4" /> Investor Level 1
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="outline" className="w-full sm:w-auto gap-2 h-10 rounded-lg">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={() => { setEditing(false); setFormData(profile) }} variant="ghost" disabled={saving} className="flex-1 sm:flex-none h-10 rounded-lg px-4">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none gap-2 h-10 rounded-lg px-6">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            
            {/* Personal Info */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-semibold mb-6 flex items-center gap-2"><UserIcon className="w-4 h-4 text-muted-foreground" /> Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                  {editing ? <Input name="fullName" value={formData.fullName || ''} onChange={handleChange} className="h-10 bg-muted/50" /> : <div className="text-sm text-foreground">{profile?.fullName}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Address</label>
                  <div className="text-sm text-foreground flex justify-between items-center h-10">
                    {profile?.email} <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Read-only</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Mobile Number</label>
                  {editing ? <Input name="mobile" value={formData.mobile || ''} onChange={handleChange} className="h-10 bg-muted/50" /> : <div className="text-sm text-foreground">{profile?.mobile}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Date of Birth</label>
                  {editing ? <Input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="h-10 bg-muted/50" /> : <div className="text-sm text-foreground">{profile?.dob || '-'}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Occupation</label>
                  {editing ? <Input name="occupation" value={formData.occupation || ''} onChange={handleChange} className="h-10 bg-muted/50" placeholder="e.g. Software Engineer" /> : <div className="text-sm text-foreground">{profile?.occupation || '-'}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Annual Income</label>
                  {editing ? <Input name="annualIncome" value={formData.annualIncome || ''} onChange={handleChange} className="h-10 bg-muted/50" placeholder="e.g. 15,00,000" /> : <div className="text-sm text-foreground">{profile?.annualIncome ? `₹${profile.annualIncome}` : '-'}</div>}
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-semibold mb-6 flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" /> Identity Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* PAN */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">PAN Number</label>
                    {editing ? <Input name="pan" value={formData.pan || ''} onChange={handleChange} className="h-10 bg-muted/50 uppercase" /> : <div className="text-sm text-foreground uppercase">{profile?.pan || '-'}</div>}
                  </div>
                  {(editing || formData?.panUrl) && (
                    <div className="border border-border rounded-xl p-4 bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {formData?.panUrl ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div>
                              <p className="text-sm font-medium">PAN Uploaded</p>
                              <a href={formData.panUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View File</a>
                            </div>
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No document</p>
                          </>
                        )}
                      </div>
                      {editing && (
                        <label className="cursor-pointer text-xs font-medium bg-background border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-1">
                          {uploadingField === 'panUrl' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload
                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'panUrl')} />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Aadhaar */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Aadhaar Number</label>
                    {editing ? <Input name="aadhaar" value={formData.aadhaar || ''} onChange={handleChange} className="h-10 bg-muted/50" /> : <div className="text-sm text-foreground">{profile?.aadhaar || '-'}</div>}
                  </div>
                  {(editing || formData?.aadhaarUrl) && (
                    <div className="border border-border rounded-xl p-4 bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {formData?.aadhaarUrl ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div>
                              <p className="text-sm font-medium">Aadhaar Uploaded</p>
                              <a href={formData.aadhaarUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View File</a>
                            </div>
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No document</p>
                          </>
                        )}
                      </div>
                      {editing && (
                        <label className="cursor-pointer text-xs font-medium bg-background border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-1">
                          {uploadingField === 'aadhaarUrl' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload
                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'aadhaarUrl')} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
                
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-semibold mb-6 flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /> Bank Details</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Holder Name</label>
                  {editing ? <Input name="accountHolder" value={formData.accountHolder || ''} onChange={handleChange} className="h-10 bg-muted/50" /> : <div className="text-sm text-foreground">{profile?.accountHolder || '-'}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Number</label>
                  {editing ? <Input name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} className="h-10 bg-muted/50 font-mono" /> : <div className="text-sm text-foreground font-mono">••••{profile?.accountNumber?.slice(-4) || '****'}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">IFSC Code</label>
                  {editing ? <Input name="ifsc" value={formData.ifsc || ''} onChange={handleChange} className="h-10 bg-muted/50 uppercase" /> : <div className="text-sm text-foreground uppercase">{profile?.ifsc || '-'}</div>}
                </div>
                <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
                  Withdrawals and fractional yields are automatically credited to this verified account.
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  )
}

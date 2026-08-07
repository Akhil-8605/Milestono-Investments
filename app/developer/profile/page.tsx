'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { 
  Loader2, Camera, Edit2, Building, Mail, Phone, MapPin, 
  Globe2, ShieldCheck, CreditCard, Check, X, FileText, Calendar, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/lib/upload'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DeveloperIdCard } from '@/components/developer/DeveloperIdCard'

export default function DeveloperProfilePage() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          toast.success('Image updated securely')
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
          localStorage.setItem('milestono_user', JSON.stringify({ ...parsed, name: formData.companyName }))
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
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Minimal Banner */}
          <div className="h-40 md:h-48 w-full relative bg-muted/30 border-b border-border">
            {formData?.banner ? (
              <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-muted to-muted/50" />
            )}
            
            {(editing || !formData?.banner) && (
              <label className="absolute top-4 right-4 bg-background/90 text-foreground px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer shadow-sm border border-border hover:bg-muted transition-colors flex items-center gap-2">
                {uploadingField === 'banner' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4" /> Change Cover</>}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
              </label>
            )}
          </div>

          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-12 sm:-mt-16 justify-between">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
                {/* Logo */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-card rounded-2xl border-4 border-card shadow-sm flex items-center justify-center overflow-hidden shrink-0 group">
                  {formData?.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building className="w-10 h-10 text-muted-foreground" />
                  )}
                  {(editing || !formData?.logo) && (
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white transition-opacity">
                      {uploadingField === 'logo' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </label>
                  )}
                </div>
                
                <div className="pb-1">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">{profile?.companyName}</h1>
                  <p className="text-muted-foreground mt-1.5 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile?.city || 'Location unknown'}</span>
                    <span className="flex items-center gap-1.5 text-primary font-medium"><ShieldCheck className="w-4 h-4"/> Verified</span>
                  </p>
                </div>
              </div>
              
              <div className="pb-1 w-full sm:w-auto">
                {!editing ? (
                  <Button onClick={() => setEditing(true)} variant="outline" className="w-full sm:w-auto gap-2 h-10 rounded-lg">
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={() => { setEditing(false); setFormData(profile) }} variant="ghost" disabled={saving} className="flex-1 sm:flex-none h-10 rounded-lg px-4">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none gap-2 h-10 rounded-lg px-6">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            {/* About */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-semibold mb-5 flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /> About Company</h2>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Name</label>
                    <Input name="companyName" value={formData.companyName || ''} onChange={handleChange} className="bg-muted/50 h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
                    <textarea 
                      name="bio" value={formData.bio || ''} onChange={handleChange} 
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm min-h-[140px] outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{profile?.bio || 'No description provided.'}</p>
              )}
            </div>

            {/* Location */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-semibold mb-5 flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Office Location</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                  {editing ? <Input name="officeAddress" value={formData.officeAddress || ''} onChange={handleChange} className="bg-muted/50 h-10" /> : <div className="text-sm text-foreground">{profile?.officeAddress || '-'}</div>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                    {editing ? <Input name="city" value={formData.city || ''} onChange={handleChange} className="bg-muted/50 h-10" /> : <div className="text-sm text-foreground">{profile?.city || '-'}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
                    {editing ? <Input name="state" value={formData.state || ''} onChange={handleChange} className="bg-muted/50 h-10" /> : <div className="text-sm text-foreground">{profile?.state || '-'}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
                    {editing ? <Input name="country" value={formData.country || ''} onChange={handleChange} className="bg-muted/50 h-10" /> : <div className="text-sm text-foreground">{profile?.country || '-'}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Developer ID Card */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm overflow-hidden flex flex-col items-center">
              <h2 className="text-base font-semibold mb-5 flex items-center gap-2 self-start"><ShieldCheck className="w-4 h-4 text-muted-foreground" /> Developer ID Card</h2>
              <div className="w-full overflow-x-auto pb-4 scrollbar-hide flex justify-center">
                <DeveloperIdCard
                  developerId={profile?.developerId || 'MI-DEV-TBD'}
                  companyName={profile?.companyName || 'Company Name'}
                  yearsEstablished={profile?.yearEstablished ? `${new Date().getFullYear() - parseInt(profile.yearEstablished)} Years` : '10+ Years'}
                  mobileNumber={profile?.companyPhone || '-'}
                  officeAddress={profile?.officeAddress || '-'}
                  companyBanner={profile?.banner}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Contact */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-semibold mb-5">Contact Information</h3>
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Email</div>
                  {editing ? <Input name="companyEmail" value={formData.companyEmail || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm" /> : <div className="text-sm text-foreground">{profile?.companyEmail || '-'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Phone</div>
                  {editing ? <Input name="companyPhone" value={formData.companyPhone || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm" /> : <div className="text-sm text-foreground">{profile?.companyPhone || '-'}</div>}
                </div>
              </div>
            </div>

            {/* Registration */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-semibold mb-5">Registration Details</h3>
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Year Established</div>
                  {editing ? <Input name="yearEstablished" value={formData.yearEstablished || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm" /> : <div className="text-sm text-foreground">{profile?.yearEstablished || '-'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">CIN Number</div>
                  {editing ? <Input name="regNumber" value={formData.regNumber || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm uppercase" /> : <div className="text-sm text-foreground uppercase">{profile?.regNumber || '-'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">GST Number</div>
                  {editing ? <Input name="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm uppercase" /> : <div className="text-sm text-foreground uppercase">{profile?.gstNumber || '-'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">RERA Number</div>
                  {editing ? <Input name="reraNumber" value={formData.reraNumber || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm uppercase" /> : <div className="text-sm text-foreground uppercase">{profile?.reraNumber || '-'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">PAN</div>
                  {editing ? <Input name="pan" value={formData.pan || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm uppercase" /> : <div className="text-sm text-foreground uppercase">{profile?.pan || '-'}</div>}
                </div>
              </div>
            </div>

            {/* Bank */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-semibold mb-5">Bank Details</h3>
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Bank Name</div>
                  {editing ? <Input name="bankName" value={formData.bankName || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm" /> : <div className="text-sm text-foreground">{profile?.bankName || '-'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Account Holder</div>
                  {editing ? <Input name="accountHolder" value={formData.accountHolder || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm" /> : <div className="text-sm text-foreground">{profile?.accountHolder || '-'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Account Number</div>
                  {editing ? <Input name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm font-mono" /> : <div className="text-sm text-foreground font-mono">••••{profile?.accountNumber?.slice(-4) || '****'}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">IFSC Code</div>
                  {editing ? <Input name="ifsc" value={formData.ifsc || ''} onChange={handleChange} className="bg-muted/50 h-10 text-sm uppercase" /> : <div className="text-sm text-foreground uppercase">{profile?.ifsc || '-'}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

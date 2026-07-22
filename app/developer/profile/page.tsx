'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Loader2, Camera, Edit2, Building, Mail, Phone, MapPin, Building2, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/lib/upload'

export default function DeveloperProfilePage() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files || e.target.files.length === 0) return
    setSaving(true)
    try {
      const url = await uploadImage(e.target.files[0])
      if (url) {
        setFormData((prev: any) => ({ ...prev, [field]: url }))
        if (!editing) {
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...profile, [field]: url, userId })
          })
          setProfile((prev: any) => ({ ...prev, [field]: url }))
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
      <AppLayout title="Developer Hub" subtitle="Manage your company presence">
        <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-muted-foreground w-8 h-8" /></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Company Profile" subtitle="Your public developer identity">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* Banner & Logo Header */}
        <div className="relative bg-card border-x border-b border-border rounded-b-3xl shadow-sm">
          {/* Banner */}
          <div className="h-48 md:h-64 w-full relative bg-muted group rounded-t-3xl sm:rounded-none">
            {formData?.banner ? (
              <img src={formData.banner} alt="Banner" className="w-full h-full object-cover rounded-t-3xl sm:rounded-none" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-gray-800 to-gray-900 rounded-t-3xl sm:rounded-none" />
            )}
            {(editing || !formData?.banner) && (
              <label className="absolute top-4 right-4 bg-background/80 backdrop-blur text-foreground px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer shadow-sm hover:bg-background transition-colors flex items-center gap-2">
                <Camera className="w-4 h-4" /> Change Banner
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
              </label>
            )}
          </div>

          <div className="px-6 pb-6 md:px-10 md:pb-10 relative">
            {/* Logo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                <div className="relative w-32 h-32 md:w-40 md:h-40 bg-card rounded-2xl border-4 border-card shadow-lg flex items-center justify-center overflow-hidden z-10">
                  {formData?.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building className="w-12 h-12 text-muted-foreground" />
                  )}
                  {(editing || !formData?.logo) && (
                    <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white transition-opacity">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">Change Logo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </label>
                  )}
                </div>
                
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-foreground">{profile?.companyName}</h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <Globe2 className="w-4 h-4" /> Est. {profile?.yearEstablished} &bull; <MapPin className="w-4 h-4 ml-1" /> {profile?.city}, {profile?.country}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 relative z-10 pb-2">
                {!editing ? (
                  <Button onClick={() => setEditing(true)} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                    <Edit2 className="w-4 h-4" /> Edit Details
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => { setEditing(false); setFormData(profile) }} variant="outline" disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="px-4 md:px-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-border pb-4">
                <Building2 className="w-5 h-5 text-blue-500" /> About Company
              </h2>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</label>
                    <Input name="companyName" value={formData.companyName || ''} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Bio / Description</label>
                    <textarea 
                      name="bio" value={formData.bio || ''} onChange={handleChange} 
                      className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[120px]"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {profile?.bio || 'No description provided.'}
                </p>
              )}
            </div>

            <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-border pb-4">
                <MapPin className="w-5 h-5 text-red-500" /> Operating Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Country</label>
                  {editing ? <Input name="country" value={formData.country || ''} onChange={handleChange} className="mt-1" /> : <div className="font-medium mt-1">{profile?.country}</div>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
                  {editing ? <Input name="state" value={formData.state || ''} onChange={handleChange} className="mt-1" /> : <div className="font-medium mt-1">{profile?.state}</div>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">City</label>
                  {editing ? <Input name="city" value={formData.city || ''} onChange={handleChange} className="mt-1" /> : <div className="font-medium mt-1">{profile?.city}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-5">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="w-full">
                    <div className="text-[11px] text-muted-foreground uppercase">Email</div>
                    {editing ? <Input name="companyEmail" value={formData.companyEmail || ''} onChange={handleChange} className="h-8 mt-1 text-sm" /> : <div className="text-sm font-medium">{profile?.companyEmail}</div>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="w-full">
                    <div className="text-[11px] text-muted-foreground uppercase">Phone</div>
                    {editing ? <Input name="companyPhone" value={formData.companyPhone || ''} onChange={handleChange} className="h-8 mt-1 text-sm" /> : <div className="text-sm font-medium">{profile?.companyPhone}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-5">Registration Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Year Established</div>
                  {editing ? <Input name="yearEstablished" value={formData.yearEstablished || ''} onChange={handleChange} className="h-8 mt-1 text-sm" /> : <div className="text-sm font-medium">{profile?.yearEstablished}</div>}
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Reg. Number (CIN)</div>
                  {editing ? <Input name="regNumber" value={formData.regNumber || ''} onChange={handleChange} className="h-8 mt-1 text-sm" /> : <div className="text-sm font-medium">{profile?.regNumber}</div>}
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">GST Number</div>
                  {editing ? <Input name="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} className="h-8 mt-1 text-sm uppercase" /> : <div className="text-sm font-medium uppercase">{profile?.gstNumber || 'Not provided'}</div>}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm bg-blue-500/5 border-blue-500/20">
              <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider mb-5">Bank Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Bank Name</div>
                  {editing ? <Input name="bankName" value={formData.bankName || ''} onChange={handleChange} className="h-8 mt-1 text-sm" /> : <div className="text-sm font-medium">{profile?.bankName}</div>}
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Account Holder</div>
                  {editing ? <Input name="accountHolder" value={formData.accountHolder || ''} onChange={handleChange} className="h-8 mt-1 text-sm" /> : <div className="text-sm font-medium">{profile?.accountHolder}</div>}
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Account Number</div>
                  {editing ? <Input name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} className="h-8 mt-1 text-sm" /> : <div className="text-sm font-medium">••••{profile?.accountNumber?.slice(-4)}</div>}
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">IFSC Code</div>
                  {editing ? <Input name="ifsc" value={formData.ifsc || ''} onChange={handleChange} className="h-8 mt-1 text-sm uppercase" /> : <div className="text-sm font-medium uppercase">{profile?.ifsc}</div>}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}

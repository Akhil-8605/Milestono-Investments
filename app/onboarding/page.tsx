'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Building2, UserCircle2, ArrowRight, ArrowLeft, CheckCircle2, Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Forms state
  const [formData, setFormData] = useState<any>({})
  const [files, setFiles] = useState<Record<string, File>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    const raw = sessionStorage.getItem('milestono_user')
    if (!raw) {
      router.replace('/auth/login')
      return
    }
    const parsed = JSON.parse(raw)
    setUser(parsed)
    // Pre-fill email and name if available
    setFormData((prev: any) => ({
      ...prev,
      email: parsed.email,
      fullName: parsed.role === 'investor' ? parsed.name : prev.fullName,
      companyName: parsed.role === 'developer' ? parsed.name : prev.companyName,
    }))
  }, [router])

  if (!user) return null

  const isDeveloper = user.role === 'developer'
  const totalSteps = 3

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFiles({ ...files, [key]: file })
      setPreviews({ ...previews, [key]: URL.createObjectURL(file) })
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const data = new FormData()
    data.append('image', file)
    // Using environment variable or falling back to typical local Node.js port 5000
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'
    const res = await fetch(`${apiUrl}/api/investors/upload`, {
      method: 'POST',
      body: data,
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Upload failed')
    return json.url
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Upload images
      const uploadedUrls: Record<string, string> = {}
      for (const [key, file] of Object.entries(files)) {
        uploadedUrls[key] = await uploadFile(file)
      }

      // 2. Save profile
      const profileData = {
        userId: user.id,
        role: user.role,
        ...formData,
        ...uploadedUrls,
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      const json = await res.json()

      if (!json.success) throw new Error(json.error || 'Failed to save profile')

      // 3. Redirect
      router.push(isDeveloper ? '/developer/dashboard' : '/investor/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            {isDeveloper ? <Building2 size={32} className="text-primary" /> : <UserCircle2 size={32} className="text-primary" />}
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {isDeveloper ? 'Setup Developer Profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Let's get your {isDeveloper ? 'company' : 'investor'} account configured.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          {/* Progress Bar */}
          <div className="flex w-full h-1 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {error && (
              <div className="bg-loss/10 border border-loss/20 text-loss text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-loss animate-pulse" />
                {error}
              </div>
            )}

            {/* INVESTOR FLOW */}
            {!isDeveloper && (
              <>
                {step === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h2 className="text-xl font-semibold border-b border-border pb-2">Personal Information</h2>
                    <div className="flex justify-center mb-6">
                      <label className="cursor-pointer group relative w-32 h-32 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden">
                        {previews.profilePic ? (
                          <img src={previews.profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-muted-foreground group-hover:text-primary transition-colors">
                            <Camera size={24} className="mx-auto mb-1" />
                            <span className="text-xs">Upload Photo</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePic')} />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name</label>
                        <Input value={formData.fullName || ''} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Arjun Sharma" className="bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Date of Birth</label>
                        <Input type="date" value={formData.dob || ''} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                        <Input value={formData.email || ''} disabled className="bg-muted text-muted-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Mobile Number</label>
                        <Input value={formData.mobile || ''} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="+91 XXXXX XXXXX" className="bg-background" />
                      </div>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h2 className="text-xl font-semibold border-b border-border pb-2">Identity & Address</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">PAN Number</label>
                        <Input value={formData.pan || ''} onChange={(e) => setFormData({...formData, pan: e.target.value})} placeholder="ABCDE1234F" className="bg-background uppercase" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Aadhaar Number</label>
                        <Input value={formData.aadhaar || ''} onChange={(e) => setFormData({...formData, aadhaar: e.target.value})} placeholder="1234 5678 9012" className="bg-background" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Full Address</label>
                        <Input value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Street address, building, floor..." className="bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">City</label>
                        <Input value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. Mumbai" className="bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
                        <Input value={formData.state || ''} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="e.g. Maharashtra" className="bg-background" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DEVELOPER FLOW */}
            {isDeveloper && (
              <>
                {step === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h2 className="text-xl font-semibold border-b border-border pb-2">Company Assets</h2>
                    <div className="space-y-4">
                      <label className="cursor-pointer group relative w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center overflow-hidden bg-muted/50">
                        {previews.companyBanner ? (
                          <img src={previews.companyBanner} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-muted-foreground group-hover:text-primary transition-colors">
                            <UploadCloud size={28} className="mx-auto mb-2" />
                            <span className="text-sm font-medium">Upload Company Banner</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'companyBanner')} />
                      </label>
                      <label className="cursor-pointer group relative w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center overflow-hidden bg-muted/50 mt-[-3rem] ml-4 z-10 shadow-lg bg-background">
                        {previews.companyLogo ? (
                          <img src={previews.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-muted-foreground group-hover:text-primary transition-colors pt-2">
                            <Camera size={20} className="mx-auto mb-1" />
                            <span className="text-[10px] uppercase font-bold">Logo</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'companyLogo')} />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</label>
                        <Input value={formData.companyName || ''} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Year Established</label>
                        <Input value={formData.yearEstablished || ''} onChange={(e) => setFormData({...formData, yearEstablished: e.target.value})} type="number" placeholder="e.g. 2010" className="bg-background" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Company Bio</label>
                        <textarea 
                          value={formData.bio || ''} 
                          onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                          placeholder="Short description of your real estate firm..." 
                          className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h2 className="text-xl font-semibold border-b border-border pb-2">Legal & Operating</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Registration Number</label>
                        <Input value={formData.registrationNumber || ''} onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} placeholder="CIN / LLPIN" className="bg-background uppercase" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">GST Number (Optional)</label>
                        <Input value={formData.gst || ''} onChange={(e) => setFormData({...formData, gst: e.target.value})} placeholder="22AAAAA0000A1Z5" className="bg-background uppercase" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Support Email</label>
                        <Input value={formData.supportEmail || ''} onChange={(e) => setFormData({...formData, supportEmail: e.target.value})} placeholder="contact@company.com" className="bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
                        <Input value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" className="bg-background" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Operating Address</label>
                        <Input value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Headquarters address..." className="bg-background" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* COMMON FINAL STEP (Banking) */}
            {step === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Bank Details</h2>
                <p className="text-sm text-muted-foreground mb-4">Required for processing payouts and investments securely.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Account Holder Name</label>
                    <Input value={formData.accountHolder || ''} onChange={(e) => setFormData({...formData, accountHolder: e.target.value})} placeholder="As per bank records" className="bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Bank Name</label>
                    <Input value={formData.bankName || ''} onChange={(e) => setFormData({...formData, bankName: e.target.value})} placeholder="e.g. HDFC Bank" className="bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">IFSC Code</label>
                    <Input value={formData.ifsc || ''} onChange={(e) => setFormData({...formData, ifsc: e.target.value})} placeholder="HDFC0001234" className="bg-background uppercase" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Account Number</label>
                    <Input type="password" value={formData.accountNumber || ''} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} placeholder="XXXXXXXXXXXX" className="bg-background tracking-widest font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 mt-8 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1 || loading}
                className="bg-background text-muted-foreground border-border hover:bg-muted"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  className="bg-primary hover:bg-blue-600 text-white min-w-[100px]"
                >
                  Next
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-primary hover:bg-blue-600 text-white min-w-[140px]"
                >
                  {loading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle2 size={16} className="mr-2" /> Complete Setup</>
                  )}
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

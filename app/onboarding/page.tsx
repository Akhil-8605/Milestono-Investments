'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, UploadCloud, CheckCircle2, User as UserIcon, Building2, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/lib/upload'

export default function OnboardingPage() {
  const router = useRouter()
  const [role, setRole] = useState<'investor' | 'developer' | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const userStr = sessionStorage.getItem('milestono_user')
    if (!userStr) {
      router.push('/auth/login')
      return
    }
    const user = JSON.parse(userStr)
    setRole(user.role === 'developer' ? 'developer' : 'investor')
    setUserId(user.id)
    
    // Pre-fill email/name if available
    setFormData(prev => ({
      ...prev,
      email: user.email || '',
      fullName: user.name || '',
      companyName: user.name || ''
    }))
  }, [router])

  // Shared state for all possible fields
  const [formData, setFormData] = useState({
    // Investor Fields
    fullName: '',
    profilePic: '',
    email: '',
    mobile: '',
    dob: '',
    country: 'India',
    state: '',
    city: '',
    pan: '',
    aadhaar: '',
    // Developer Fields
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    bio: '',
    logo: '',
    banner: '',
    yearEstablished: '',
    regNumber: '',
    gstNumber: '',
    // Shared Bank Details
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setLoading(true)
    setError('')
    try {
      const url = await uploadImage(file)
      if (url) {
        setFormData(prev => ({ ...prev, [field]: url }))
      } else {
        setError('Failed to upload image. Please try again.')
      }
    } catch (err) {
      setError('An error occurred during upload.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => setStep(prev => prev + 1)
  const handlePrev = () => setStep(prev => prev - 1)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = { ...formData, userId, role }
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        if (role === 'developer') router.push('/developer/dashboard')
        else router.push('/investor/dashboard')
      } else {
        setError(data.error || 'Failed to save profile.')
      }
    } catch (err) {
      setError('An error occurred while saving profile.')
    } finally {
      setLoading(false)
    }
  }

  if (!role) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>

  const isDev = role === 'developer'
  const totalSteps = 3

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-2xl w-full space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {isDev ? <Building2 className="text-primary w-6 h-6" /> : <UserIcon className="text-primary w-6 h-6" />}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {isDev ? 'Complete Developer Profile' : 'Complete Investor Profile'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Step {step} of {totalSteps}: {
              step === 1 ? 'Basic Information' :
              step === 2 && isDev ? 'Company Details' :
              step === 2 && !isDev ? 'Identity Verification' :
              'Bank Details'
            }
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mt-6 overflow-hidden">
            <div 
              className="bg-primary h-1.5 transition-all duration-300" 
              style={{ width: `${(step / totalSteps) * 100}%` }} 
            />
          </div>
        </div>

        {error && (
          <div className="bg-loss/10 border border-loss/20 text-loss px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6 mt-8">
          {/* INVESTOR - STEP 1: Basic Info */}
          {!isDev && step === 1 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/50">
                {formData.profilePic ? (
                  <div className="relative w-24 h-24">
                    <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover rounded-full border border-border" />
                    <button onClick={() => setFormData({ ...formData, profilePic: '' })} className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 text-xs hover:text-loss">✕</button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-3" />
                    <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                      Upload Profile Picture
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profilePic')} />
                    </label>
                  </>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name</label>
                <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                <Input name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" disabled />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Mobile Number</label>
                <Input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+91" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date of Birth</label>
                <Input name="dob" type="date" value={formData.dob} onChange={handleChange} />
              </div>
            </div>
          )}

          {/* INVESTOR - STEP 2: Identity & Address */}
          {!isDev && step === 2 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
               <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Country</label>
                <Input name="country" value={formData.country} onChange={handleChange} placeholder="India" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
                <Input name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">City</label>
                <Input name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" />
              </div>
              <div className="sm:col-span-2 border-t border-border pt-4 mt-2"></div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">PAN Number</label>
                <Input name="pan" value={formData.pan} onChange={handleChange} placeholder="ABCDE1234F" className="uppercase" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Aadhaar Number</label>
                <Input name="aadhaar" value={formData.aadhaar} onChange={handleChange} placeholder="1234 5678 9012" />
              </div>
            </div>
          )}

          {/* DEVELOPER - STEP 1: Basic Info & Branding */}
          {isDev && step === 1 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-4">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/50 h-32 relative overflow-hidden">
                  {formData.banner ? (
                    <>
                      <img src={formData.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      <button onClick={() => setFormData({ ...formData, banner: '' })} className="relative z-10 bg-background/80 backdrop-blur border border-border rounded-md px-3 py-1 text-xs hover:text-loss">Remove Banner</button>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-muted-foreground mb-2" />
                      <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                        Upload Company Banner
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                      </label>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-20 h-20 bg-muted border border-border rounded-xl flex items-center justify-center overflow-hidden relative">
                     {formData.logo ? (
                        <>
                          <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                          <button onClick={() => setFormData({ ...formData, logo: '' })} className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 hover:opacity-100 flex items-center justify-center">Remove</button>
                        </>
                     ) : (
                       <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                         <Building className="w-6 h-6 text-muted-foreground mb-1" />
                         <span className="text-[10px] text-muted-foreground">Logo</span>
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                       </label>
                     )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</label>
                    <Input name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Milestono Dev Corp" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Company Email</label>
                <Input name="companyEmail" value={formData.companyEmail} onChange={handleChange} placeholder="contact@company.com" disabled={!!formData.email} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Company Phone</label>
                <Input name="companyPhone" value={formData.companyPhone} onChange={handleChange} placeholder="+91" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Company Bio</label>
                <textarea 
                  name="bio" value={formData.bio} onChange={handleChange} 
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Tell investors about your company..."
                />
              </div>
            </div>
          )}

          {/* DEVELOPER - STEP 2: Address & Legal */}
          {isDev && step === 2 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Country</label>
                <Input name="country" value={formData.country} onChange={handleChange} placeholder="India" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
                <Input name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">City</label>
                <Input name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Year Established</label>
                <Input name="yearEstablished" value={formData.yearEstablished} onChange={handleChange} placeholder="2010" />
              </div>
              <div className="sm:col-span-2 border-t border-border pt-4 mt-2"></div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Registration Number</label>
                <Input name="regNumber" value={formData.regNumber} onChange={handleChange} placeholder="CIN123456789" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">GST Number (Optional)</label>
                <Input name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" className="uppercase" />
              </div>
            </div>
          )}

          {/* SHARED - STEP 3: Bank Details */}
          {step === 3 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm px-4 py-3 rounded-lg mb-2">
                Your bank details are securely stored and will be used for transactions and distributions.
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Account Holder Name</label>
                <Input name="accountHolder" value={formData.accountHolder} onChange={handleChange} placeholder="Name exactly as on bank account" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Bank Name</label>
                <Input name="bankName" value={formData.bankName} onChange={handleChange} placeholder="HDFC Bank" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">IFSC Code</label>
                <Input name="ifsc" value={formData.ifsc} onChange={handleChange} placeholder="HDFC0001234" className="uppercase" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Account Number</label>
                <Input name="accountNumber" type="password" value={formData.accountNumber} onChange={handleChange} placeholder="••••••••••••" />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
          <Button 
            variant="ghost" 
            onClick={handlePrev} 
            disabled={step === 1 || loading}
            className="text-muted-foreground"
          >
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={loading} className="gap-2">
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 size={16} />}
              Complete Profile
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}

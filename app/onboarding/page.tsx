'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Briefcase, CheckCircle2, ChevronRight, Sparkles, User,
  Phone, MapPin, ArrowLeft, ShieldCheck, Loader2, Upload, Banknote, FileText, Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { generateAndDownloadInvoice } from '@/lib/invoice'
import { uploadImage } from '@/lib/upload'
import { cn } from '@/lib/utils'
import React from 'react'
import { DeveloperIdCard } from '@/components/developer/DeveloperIdCard'

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function OnboardingPage() {
  const router = useRouter()

  // Step 1: Role Selection
  // Step 2: Basic Details & Photos
  // Step 3: Identity & Docs
  // Step 4: Bank & Finalize
  // Step 5: Developer ID Card (Developers only)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [role, setRole] = useState<'investor' | 'developer'>('investor')

  const [loading, setLoading] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  // Base User Details
  const [userEmail, setUserEmail] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  // Shared Fields
  const [mobile, setMobile] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('India')

  // Investor Specific
  const [fullName, setFullName] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [dob, setDob] = useState('')
  const [occupation, setOccupation] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [aadhaar, setAadhaar] = useState('')
  const [aadhaarUrl, setAadhaarUrl] = useState('')

  // Developer Specific
  const [companyName, setCompanyName] = useState('')
  const [logo, setLogo] = useState('')
  const [banner, setBanner] = useState('')
  const [officeAddress, setOfficeAddress] = useState('')
  const [gst, setGst] = useState('')
  const [rera, setRera] = useState('')
  const [cin, setCin] = useState('')
  const [yearEstablished, setYearEstablished] = useState('')

  // Bank Details
  const [pan, setPan] = useState('')
  const [panUrl, setPanUrl] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const raw = sessionStorage.getItem('milestono_user')
    const token = sessionStorage.getItem('milestono_token')

    if (!raw || !token) {
      router.replace('/auth/login')
      return
    }
    try {
      const parsed = JSON.parse(raw)
      setUserEmail(parsed.email || '')
      setUserId(parsed.id || parsed.email || '')
      if (parsed.name && parsed.name !== 'User') {
        setFullName(parsed.name)
        setCompanyName(parsed.name)
      }
    } catch {
      router.replace('/auth/login')
    }
  }, [router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, setter: (val: string) => void) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploadingField(fieldName)
    try {
      const url = await uploadImage(e.target.files[0])
      if (url) {
        setter(url)
        toast.success(`${fieldName} uploaded successfully`)
      }
    } catch (err) {
      toast.error(`Failed to upload ${fieldName}`)
    } finally {
      setUploadingField(null)
    }
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!mobile) { newErrors.mobile = 'Mobile is required'; isValid = false }
    else if (!/^\d{10}$/.test(mobile.replace(/\D/g, '').slice(-10))) { newErrors.mobile = 'Invalid mobile number (10 digits)'; isValid = false }

    if (role === 'investor') {
      if (!fullName) { newErrors.fullName = 'Full Name is required'; isValid = false }
      if (!dob) { newErrors.dob = 'Date of Birth is required'; isValid = false }
    } else {
      if (!companyName) { newErrors.companyName = 'Company Name is required'; isValid = false }
      if (!logo) { newErrors.logo = 'Company Logo is required'; isValid = false }
      if (!banner) { newErrors.banner = 'Company Banner is required'; isValid = false }
      if (!officeAddress) { newErrors.officeAddress = 'Office Address is required'; isValid = false }
      if (!city) { newErrors.city = 'City is required'; isValid = false }
      if (!state) { newErrors.state = 'State is required'; isValid = false }
    }
    setErrors(newErrors)
    return isValid
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!pan) { newErrors.pan = 'PAN is required'; isValid = false }
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) { newErrors.pan = 'Invalid PAN format'; isValid = false }
    if (!panUrl) { toast.error('PAN Card upload is required'); isValid = false }

    if (role === 'investor') {
      if (!aadhaar) { newErrors.aadhaar = 'Aadhaar is required'; isValid = false }
      else if (!/^\d{12}$/.test(aadhaar.replace(/\D/g, ''))) { newErrors.aadhaar = 'Invalid Aadhaar (12 digits)'; isValid = false }
      if (!aadhaarUrl) { toast.error('Aadhaar upload is required'); isValid = false }
    } else {
      if (!gst) { newErrors.gst = 'GST is required'; isValid = false }
      if (!cin) { newErrors.cin = 'CIN is required'; isValid = false }
    }
    
    setErrors(newErrors)
    return isValid
  }

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true
    if (!accountHolder) { newErrors.accountHolder = 'Required'; isValid = false }
    if (!accountNumber) { newErrors.accountNumber = 'Required'; isValid = false }
    if (!ifsc) { newErrors.ifsc = 'Required'; isValid = false }
    setErrors(newErrors)
    return isValid
  }

  const proceed = () => {
    if (step === 2 && !validateStep2()) {
      toast.error('Please fill all required fields')
      return
    }
    if (step === 3 && !validateStep3()) {
      toast.error('Please fill all required fields')
      return
    }
    setStep((s) => Math.min(s + 1, 4) as any)
  }

  const handleFinalSubmit = async () => {
    if (!validateStep4()) {
      toast.error('Please complete bank details')
      return
    }
    setLoading(true)

    const payload = role === 'investor' ? {
      userId,
      email: userEmail,
      role: 'investor',
      profileCompleted: true,
      fullName,
      profilePic,
      mobile,
      dob,
      occupation,
      annualIncome,
      city, state, country,
      pan, panUrl,
      aadhaar, aadhaarUrl,
      accountHolder, accountNumber, ifsc,
      status: 'active',
      createdAt: new Date().toISOString()
    } : {
      userId,
      email: userEmail,
      role: 'developer',
      profileCompleted: true,
      companyName,
      companyEmail: userEmail,
      logo, banner,
      companyPhone: mobile,
      yearEstablished,
      officeAddress, city, state, country,
      pan, panUrl,
      gstNumber: gst,
      reraNumber: rera,
      regNumber: cin,
      accountHolder, accountNumber, ifsc,
      status: 'active',
      createdAt: new Date().toISOString()
    }

    if (role === 'investor') {
      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)

        const raw = sessionStorage.getItem('milestono_user')
        if (raw) {
          const parsed = JSON.parse(raw)
          sessionStorage.setItem('milestono_user', JSON.stringify({ ...parsed, name: fullName, role: 'investor', profileCompleted: true }))
        }

        try {
          await fetch('/api/auth/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, name: fullName, role: 'investor' })
          })
        } catch (e) { console.error('Failed to send welcome email', e) }

        toast.success('Investor Profile Created!')
        router.push('/investor/dashboard')
      } catch (e: any) {
        toast.error(e.message || 'Failed to create profile')
        setLoading(false)
      }
    } else {
      // Developer Payment
      try {
        const isLoaded = await loadRazorpay()
        if (!isLoaded) {
          toast.error('Razorpay SDK failed to load')
          setLoading(false)
          return
        }

        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 1999 })
        })
        const orderData = await res.json()
        if (!orderData.success) throw new Error('Payment initiation failed')

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.keyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Milestono Investments",
          description: "Developer Registration Fee",
          order_id: orderData.order.id,
          handler: async function (response: any) {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              })

              const raw = sessionStorage.getItem('milestono_user')
              if (raw) {
                const parsed = JSON.parse(raw)
                sessionStorage.setItem('milestono_user', JSON.stringify({ ...parsed, name: companyName, role: 'developer', profileCompleted: true }))
              }

              try {
                await fetch('/api/auth/send-welcome', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: userEmail, name: companyName, role: 'developer' })
                })
              } catch (e) { console.error('Failed to send welcome email', e) }

              const invoiceUrl = await generateAndDownloadInvoice({
                email: userEmail,
                orderId: response.razorpay_order_id || orderData.order.id,
                paymentId: response.razorpay_payment_id || 'PRE_PAID_000',
                amount: 1999,
                date: new Date().toLocaleDateString('en-IN'),
                description: 'Developer Registration Fee'
              })

              // Record payment in Firestore 'payments' collection
              try {
                await fetch('/api/payment/record', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: response.razorpay_order_id || orderData.order.id,
                    paymentId: response.razorpay_payment_id || 'PRE_PAID_000',
                    transactionId: response.razorpay_payment_id || 'PRE_PAID_000',
                    signature: response.razorpay_signature || '',
                    userId,
                    userEmail,
                    userName: companyName,
                    amount: 1999,
                    purpose: 'Developer Registration Fee',
                    status: 'success',
                    invoiceUrl: invoiceUrl || '',
                    dateTime: new Date().toISOString()
                  })
                })
              } catch (recErr) {
                console.error('Failed to store payment record in Firestore:', recErr)
              }

              toast.success('Developer Profile Activated!')
              setStep(5)
            } else {
              toast.error('Payment verification failed')
              setLoading(false)
            }
          },
          prefill: { name: companyName, email: userEmail, contact: mobile },
          theme: { color: "#3b82f6" }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function () {
          toast.error('Payment failed')
          setLoading(false)
        })
        rzp.open()
      } catch (e: any) {
        toast.error(e.message || 'Failed to initiate payment')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-violet-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full z-10 space-y-6 lg:space-y-8 animate-in fade-in zoom-in-95 duration-500">

        {/* Progress Tracker */}
        {step > 1 && (
          <div className="flex items-center justify-center gap-2 lg:gap-4 max-w-2xl mx-auto px-4">
            {[1, 2, 3, 4].map((num, i) => (
              <Fragment key={num}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center font-bold text-[10px] lg:text-xs transition-all",
                    step === num ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" :
                      step > num ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {step > num ? <CheckCircle2 size={14} /> : num}
                  </div>
                  <span className={cn("text-[10px] lg:text-xs font-semibold hidden md:block", step >= num ? "text-foreground" : "text-muted-foreground")}>
                    {num === 1 ? 'Role' : num === 2 ? 'Details' : num === 3 ? 'Docs' : 'Bank'}
                  </span>
                </div>
                {i < 3 && <div className={cn("flex-1 h-0.5 rounded-full transition-all", step > num ? "bg-emerald-500" : "bg-border")} />}
              </Fragment>
            ))}
          </div>
        )}

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">

          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1 as any)}
              className="absolute top-4 left-6 lg:top-8 lg:left-8 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={12} /> Back
            </button>
          )}

          {step === 1 && (
            <div className="space-y-8 text-center mt-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Choose Your Account Path</h1>
                <p className="text-sm text-muted-foreground">Select how you want to participate on India's premier fractional real estate platform.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4 max-w-2xl mx-auto">
                <div
                  onClick={() => { setRole('investor'); setStep(2) }}
                  className="cursor-pointer group relative text-left p-6 rounded-2xl border border-border bg-card hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-blue-600 text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                    <Briefcase size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Investor Account</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4 min-h-[40px]">
                    Invest in verified Grade-A properties, earn monthly rental yield, and trade fractional tokens.
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-bold uppercase tracking-wider">
                    Free Forever
                  </span>
                </div>

                <div
                  onClick={() => { setRole('developer'); setStep(2) }}
                  className="cursor-pointer group relative text-left p-6 rounded-2xl border border-border bg-card hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-violet-600 text-white shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Developer Account</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4 min-h-[40px]">
                    Tokenize and list commercial real estate, raise fractional capital, and disburse yields.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles size={11} /> Premium
                    </span>
                    <span className="text-foreground font-mono font-bold text-sm">₹1,999 Fee</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 mt-6 lg:mt-0">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Basic Information</h2>
                <p className="text-xs text-muted-foreground">Tell us about yourself or your company.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {role === 'investor' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</label>
                        <Input value={fullName} onChange={e => {setFullName(e.target.value); setErrors(e => ({...e, fullName: ''}))}} placeholder="Rahul Sharma" className="h-11 bg-muted/50" />
                        {errors.fullName && <p className="text-red-500 text-[10px]">{errors.fullName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date of Birth *</label>
                        <Input type="date" value={dob} onChange={e => {setDob(e.target.value); setErrors(e => ({...e, dob: ''}))}} className="h-11 bg-muted/50" />
                        {errors.dob && <p className="text-red-500 text-[10px]">{errors.dob}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company Name *</label>
                        <Input value={companyName} onChange={e => {setCompanyName(e.target.value); setErrors(e => ({...e, companyName: ''}))}} placeholder="Apex Realty Pvt Ltd" className="h-11 bg-muted/50" />
                        {errors.companyName && <p className="text-red-500 text-[10px]">{errors.companyName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Year Established</label>
                        <Input value={yearEstablished} onChange={e => setYearEstablished(e.target.value)} placeholder="2010" className="h-11 bg-muted/50" />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mobile Number *</label>
                    <div className="flex gap-2">
                      <Input value={mobile} onChange={e => {setMobile(e.target.value); setErrors(e => ({...e, mobile: ''}))}} placeholder="+91 98765 43210" className="h-11 bg-muted/50 flex-1" maxLength={10} minLength={10}/>
                      <Button type="button" onClick={() => toast.success('Mobile verified!')} variant="outline" className="h-11 border-primary text-primary hover:bg-primary/10">Verify</Button>
                    </div>
                    {errors.mobile && <p className="text-red-500 text-[10px]">{errors.mobile}</p>}
                  </div>
                </div>

                <div className="space-y-6">
                  {role === 'investor' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Profile Photo</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-muted border flex items-center justify-center overflow-hidden shrink-0">
                            {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User className="text-muted-foreground w-6 h-6" />}
                          </div>
                          <label className="flex-1 border border-dashed rounded-xl h-16 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'Profile Photo', setProfilePic)} />
                            {uploadingField === 'Profile Photo' ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <span className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Upload size={14} /> Upload Image</span>}
                          </label>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Occupation</label>
                        <Input value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Software Engineer" className="h-11 bg-muted/50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Income</label>
                        <Input value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="15,00,000" className="h-11 bg-muted/50" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company Logo *</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-muted border flex items-center justify-center overflow-hidden shrink-0">
                            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" /> : <Building2 className="text-muted-foreground w-6 h-6" />}
                          </div>
                          <label className="flex-1 border border-dashed rounded-xl h-16 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                            <input type="file" className="hidden" accept="image/*" onChange={e => { handleFileUpload(e, 'Logo', setLogo); setErrors(err => ({ ...err, logo: '' })) }} />
                            {uploadingField === 'Logo' ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <span className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Upload size={14} /> Upload Logo</span>}
                          </label>
                        </div>
                        {errors.logo && <p className="text-red-500 text-[10px]">{errors.logo}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company Banner / Cover *</label>
                        <label className="block border border-dashed rounded-xl p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20">
                          <input type="file" className="hidden" accept="image/*" onChange={e => { handleFileUpload(e, 'Company Banner', setBanner); setErrors(err => ({ ...err, banner: '' })) }} />
                          {uploadingField === 'Company Banner' ? (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-[10px]">Uploading...</span></div>
                          ) : banner ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <img src={banner} alt="Banner Preview" className="h-16 w-full object-cover rounded-lg border border-border" />
                              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Banner Uploaded</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 py-1 text-muted-foreground">
                              <Camera className="w-5 h-5" />
                              <span className="text-[11px] font-medium">Click to upload landscape cover banner</span>
                            </div>
                          )}
                        </label>
                        {errors.banner && <p className="text-red-500 text-[10px]">{errors.banner}</p>}
                      </div>
                    </div>
                  )}

                  {role === 'developer' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Office Address *</label>
                      <Input value={officeAddress} onChange={e => {setOfficeAddress(e.target.value); setErrors(e => ({...e, officeAddress: ''}))}} placeholder="123 Business Park" className="h-11 bg-muted/50" />
                      {errors.officeAddress && <p className="text-red-500 text-[10px]">{errors.officeAddress}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">City {role === 'developer' && '*'}</label>
                      <Input value={city} onChange={e => {setCity(e.target.value); setErrors(e => ({...e, city: ''}))}} placeholder="Mumbai" className="h-11 bg-muted/50" />
                      {errors.city && <p className="text-red-500 text-[10px]">{errors.city}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">State {role === 'developer' && '*'}</label>
                      <Input value={state} onChange={e => {setState(e.target.value); setErrors(e => ({...e, state: ''}))}} placeholder="Maharashtra" className="h-11 bg-muted/50" />
                      {errors.state && <p className="text-red-500 text-[10px]">{errors.state}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={proceed} className="h-11 px-8 bg-primary text-primary-foreground font-semibold gap-2">Next Step <ChevronRight size={16} /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 mt-6 lg:mt-0">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Identity & Documents</h2>
                <p className="text-xs text-muted-foreground">Required for KYC and regulatory compliance.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PAN Number *</label>
                    <Input value={pan} onChange={e => {setPan(e.target.value); setErrors(e => ({...e, pan: ''}))}} placeholder="ABCDE1234F" className="h-11 bg-muted/50 uppercase" />
                    {errors.pan && <p className="text-red-500 text-[10px]">{errors.pan}</p>}
                  </div>

                  {role === 'investor' ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aadhaar Number *</label>
                      <Input value={aadhaar} onChange={e => {setAadhaar(e.target.value); setErrors(e => ({...e, aadhaar: ''}))}} placeholder="1234 5678 9012" className="h-11 bg-muted/50" />
                      {errors.aadhaar && <p className="text-red-500 text-[10px]">{errors.aadhaar}</p>}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GST Number *</label>
                        <Input value={gst} onChange={e => {setGst(e.target.value); setErrors(e => ({...e, gst: ''}))}} placeholder="22AAAAA0000A1Z5" className="h-11 bg-muted/50 uppercase" />
                        {errors.gst && <p className="text-red-500 text-[10px]">{errors.gst}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CIN (Reg Number) *</label>
                        <Input value={cin} onChange={e => {setCin(e.target.value); setErrors(e => ({...e, cin: ''}))}} placeholder="U12345MH2020PTC123456" className="h-11 bg-muted/50 uppercase" />
                        {errors.cin && <p className="text-red-500 text-[10px]">{errors.cin}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RERA Registration</label>
                        <Input value={rera} onChange={e => setRera(e.target.value)} placeholder="P51800000000" className="h-11 bg-muted/50 uppercase" />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Upload PAN Card *</label>
                    <label className="block border border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20">
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'PAN Card', setPanUrl)} />
                      {uploadingField === 'PAN Card' ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-[10px]">Uploading...</span></div>
                      ) : panUrl ? (
                        <div className="flex flex-col items-center gap-2 text-gain"><CheckCircle2 className="w-5 h-5" /><span className="text-[10px]">Uploaded successfully</span></div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground"><FileText className="w-5 h-5" /><span className="text-[10px]">Click to browse (JPG/PNG/PDF)</span></div>
                      )}
                    </label>
                  </div>

                  {role === 'investor' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Upload Aadhaar *</label>
                      <label className="block border border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20">
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'Aadhaar Card', setAadhaarUrl)} />
                        {uploadingField === 'Aadhaar Card' ? (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-[10px]">Uploading...</span></div>
                        ) : aadhaarUrl ? (
                          <div className="flex flex-col items-center gap-2 text-gain"><CheckCircle2 className="w-5 h-5" /><span className="text-[10px]">Uploaded successfully</span></div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground"><FileText className="w-5 h-5" /><span className="text-[10px]">Click to browse (JPG/PNG/PDF)</span></div>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={proceed} className="h-11 px-8 bg-primary text-primary-foreground font-semibold gap-2">Next Step <ChevronRight size={16} /></Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 mt-6 lg:mt-0">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Bank Details & Finalize</h2>
                <p className="text-xs text-muted-foreground">Required for processing payments and payouts securely.</p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 max-w-xl mx-auto">
                <div className="flex items-center gap-2 mb-2 text-blue-500 font-semibold border-b border-border pb-3">
                  <Banknote className="w-5 h-5" /> Account Information
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account Holder Name *</label>
                  <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="As per bank records" className="h-11 bg-muted/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account Number *</label>
                    <Input type="password" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="••••••••••" className="h-11 bg-muted/50 font-mono tracking-widest" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">IFSC Code *</label>
                    <Input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="SBIN0001234" className="h-11 bg-muted/50 uppercase" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center pt-6 gap-4">
                {role === 'developer' && (
                  <div className="text-sm font-medium px-4 py-2 bg-violet-500/10 text-violet-600 rounded-lg flex items-center gap-2">
                    <ShieldCheck size={16} /> One-time Registration Fee: <span className="font-bold text-lg font-mono">₹1,999</span>
                  </div>
                )}

                <Button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className={cn(
                    "h-12 px-8 font-bold text-sm min-w-[240px] shadow-lg transition-all active:scale-[0.98]",
                    role === 'developer' ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/25" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processing...</span>
                  ) : role === 'developer' ? (
                    <span className="flex items-center gap-2">Pay ₹1,999 & Activate Profile <ChevronRight size={18} /></span>
                  ) : (
                    <span className="flex items-center gap-2">Complete Profile & Enter Dashboard <ChevronRight size={18} /></span>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center max-w-xs mx-auto">
                  By completing registration, you agree to the Terms of Service and Privacy Policy. {role === 'developer' && 'Secured by Razorpay.'}
                </p>
              </div>
            </div>
          )}

          {step === 5 && role === 'developer' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 mt-6 lg:mt-0 flex flex-col items-center text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-foreground">Welcome to Milestono, Developer!</h2>
                <p className="text-sm text-muted-foreground">Your official Developer ID Card is ready. You can always access this from your settings.</p>
              </div>

              <div className="w-full overflow-hidden flex justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <DeveloperIdCard
                  developerId={JSON.parse(sessionStorage.getItem('milestono_user') || '{}')?.developerId || 'MI-DEV-TBD'}
                  companyName={companyName}
                  yearsEstablished={yearEstablished ? `${new Date().getFullYear() - parseInt(yearEstablished)} Years` : '10+ Years'}
                  mobileNumber={mobile}
                  officeAddress={officeAddress}
                  companyBanner={banner}
                />
              </div>

              <Button
                onClick={() => router.push('/developer/dashboard')}
                className="h-12 px-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl mt-4"
              >
                Go to Dashboard <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

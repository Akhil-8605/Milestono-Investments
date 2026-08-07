'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Property } from '@/lib/types'
import { Building2, Loader2, IndianRupee, ShieldCheck, Upload, Landmark, CheckCircle2, FileImage, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Download } from 'lucide-react'
import { numberToIndianWords } from '@/lib/utils'

export default function InvestorBuyPage({ params }: { params: Promise<{ propertyTickerId: string }> }) {
  const router = useRouter()
  const { user } = useSession()
  const resolvedParams = use(params)

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [units, setUnits] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [tokenPaid, setTokenPaid] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceDetails, setInvoiceDetails] = useState<{ txId: string, amount: number, isToken: boolean } | null>(null)

  const [neftData, setNeftData] = useState({
    utrNumber: '',
    bankName: '',
    ifsc: '',
    proofImages: [] as string[]
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (user) {
      const currentRole = user.role?.toLowerCase() || ''
      if (currentRole === 'developer' || currentRole === 'admin') {
        toast.error(`Only investors can purchase fractional properties. Your role is: ${user.role}`)
        router.push('/dashboard')
      }
    }
  }, [user, router])

  useEffect(() => {
    const q = query(collection(db, 'properties'), where('symbol', '==', resolvedParams.propertyTickerId))
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setProperty({ id: snap.docs[0].id, ...snap.docs[0].data() } as Property)
      } else {
        toast.error('Property not found')
        router.push('/market')
      }
      setIsLoading(false)
    }, (err) => {
      toast.error('Failed to load property details in real-time')
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [resolvedParams.propertyTickerId, router])

  const currentPrice = property?.marketData?.currentPrice ?? property?.unitPrice ?? 0
  const totalAmount = units * currentPrice
  const isLargeTransaction = totalAmount >= 100000 // >= 1 Lakh

  const rawTokenAmount = totalAmount * 0.05
  const tokenAmount = Math.min(rawTokenAmount, 75000)

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

  const handleRazorpayPayment = async (amountToPay: number, isToken: boolean) => {
    if (!user || !property) return
    setIsProcessing(true)

    try {
      const isLoaded = await loadRazorpay()
      if (!isLoaded) {
        toast.error('Payment gateway failed to load')
        setIsProcessing(false)
        return
      }

      // Call backend to create Razorpay Order
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountToPay,
          receipt: `rcpt_${user.id}_${Date.now()}`
        }),
      })

      const orderData = await res.json()

      if (!orderData.success) {
        toast.error('Failed to initiate payment order')
        setIsProcessing(false)
        return
      }

      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Milestono Investments',
        description: isToken ? `Token Payment for ${property.symbol}` : `Full Purchase of ${property.symbol}`,
        order_id: orderData.order.id, // Pass the generated order ID
        handler: async function (response: any) {
          try {
            if (isToken) {
              // Record token payment and mark NEFT verification pending
              await finalizeTransaction('neft_with_token', tokenAmount, response.razorpay_payment_id)
              setTokenPaid(true)
              toast.success(`Token amount of ₹${tokenAmount.toLocaleString()} paid successfully!`)
            } else {
              // Full direct purchase
              await finalizeTransaction('razorpay_direct', amountToPay, response.razorpay_payment_id)
            }
          } catch (err) {
            console.error(err)
            toast.error('Error finalizing payment')
            setIsProcessing(false)
          } finally {
            setIsProcessing(false)
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#10b981',
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function () {
        toast.error('Payment failed or cancelled.')
        setIsProcessing(false)
      })
      rzp.open()

    } catch (err) {
      console.error(err)
      toast.error('Error initiating payment')
      setIsProcessing(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setUploadingImage(true)

    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setNeftData(prev => ({
          ...prev,
          proofImages: [...prev.proofImages, event.target!.result as string]
        }))
        toast.success('Image attached')
      }
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const handleNeftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!neftData.utrNumber || !neftData.bankName || !neftData.ifsc) {
      toast.error('Please fill all banking details')
      return
    }
    if (neftData.proofImages.length === 0) {
      toast.error('Please attach at least one proof of payment image')
      return
    }
    setIsProcessing(true)
    await finalizeTransaction('neft_with_token', tokenAmount, `mock_rzp_token_${Date.now()}`)
    setIsProcessing(false)
  }

  const generateInvoice = (transactionId: string, amount: number, isToken: boolean) => {
    setInvoiceDetails({ txId: transactionId, amount, isToken })
    setShowInvoiceModal(true)
  }

  useEffect(() => {
    if (showInvoiceModal && invoiceDetails) {
      setTimeout(() => {
        const element = document.getElementById('aesthetic-invoice')
        if (element) {
          html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            onclone: (clonedDoc) => {
              try {
                // Replace unsupported color functions in <style> tags
                const styleElements = clonedDoc.querySelectorAll('style')
                styleElements.forEach(styleEl => {
                  if (styleEl.textContent) {
                    styleEl.textContent = styleEl.textContent.replace(/(?:lab|oklab|oklch)\([^)]+\)/gi, 'rgb(0,0,0)')
                  }
                })

                // Remove external stylesheets to avoid unsupported functions from being parsed
                const linkSheets = clonedDoc.querySelectorAll('link[rel="stylesheet"]')
                linkSheets.forEach(link => link.remove())

                // Sanitize inline style attributes on all elements
                const styledEls = clonedDoc.querySelectorAll('[style]')
                styledEls.forEach(el => {
                  const s = el.getAttribute('style') || ''
                  const newS = s.replace(/(?:lab|oklab|oklch)\([^)]+\)/gi, 'rgb(0,0,0)')
                  if (newS !== s) el.setAttribute('style', newS)
                })
              } catch (err) {
                console.warn('Failed to sanitize cloned document for html2canvas', err)
              }
            }
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`Invoice_${property?.symbol}_${invoiceDetails.txId.slice(-6).toUpperCase()}.pdf`)
            toast.success('Invoice downloaded automatically.')
            setShowInvoiceModal(false)
          }).catch(console.error)
        }
      }, 1000)
    }
  }, [showInvoiceModal, invoiceDetails, property?.symbol])

  const finalizeTransaction = async (method: 'razorpay_direct' | 'neft_with_token', tokenPaidAmt?: number, rzpPaymentId?: string) => {
    try {
      const txRef = await addDoc(collection(db, 'transactions'), {
        userId: user!.id,
        investorName: user!.name || null,
        investorEmail: (user as any).email || null,
        investorPhoto: (user as any).photoURL || null,
        propertyId: property!.id,
        propertyName: property!.name,
        propertySymbol: property!.symbol,
        type: 'buy',
        units,
        unitPrice: currentPrice,
        baseAmount: totalAmount,
        gst: 0,
        totalAmount,
        paymentMethod: method,
        tokenAmountPaid: method === 'neft_with_token' ? tokenPaidAmt : null,
        razorpayPaymentId: rzpPaymentId || null,
        verifiedByAdmin: method === 'razorpay_direct',
        status: method === 'neft_with_token' ? 'pending_neft' : 'completed',
        neftDetails: method === 'neft_with_token' ? neftData : null,
        timestamp: serverTimestamp()
      })

      const propRef = doc(db, 'properties', property!.id)
      if (method === 'razorpay_direct') {
        await addDoc(collection(db, 'investments'), {
          userId: user!.id,
          propertyId: property!.id,
          unitsOwned: units,
          unitPrice: currentPrice,
          amountInvested: totalAmount,
          currentValue: totalAmount,
          returns: 0,
          returnPercentage: 0,
          dayChange: 0,
          dayChangePct: 0,
          purchasedAt: serverTimestamp(),
          status: 'active'
        })
        await updateDoc(propRef, {
          unitsSold: increment(units),
          unitsAvailable: increment(-units)
        }).catch(console.error)
      } else if (method === 'neft_with_token') {
        await updateDoc(propRef, { unitsOnHold: increment(units) }).catch(console.error)
      }

      // Add Investor Notification
      await addDoc(collection(db, 'notifications'), {
        userId: user!.id,
        role: 'investor',
        type: method === 'razorpay_direct' ? 'payment_successful' : 'neft_submitted',
        title: method === 'razorpay_direct' ? 'Investment Confirmed' : 'Token Paid & NEFT Submitted',
        message: method === 'razorpay_direct'
          ? `Purchased ${units} units of ${property!.name} (${property!.symbol}) for ₹${totalAmount.toLocaleString('en-IN')}.`
          : `Token payment of ₹${(tokenPaidAmt || 0).toLocaleString('en-IN')} received for ${property!.name}. NEFT verification pending.`,
        propertySymbol: property!.symbol,
        propertyId: property!.id,
        read: false,
        createdAt: serverTimestamp()
      }).catch(console.error)

      // Add Developer Notification
      if (property?.developerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: property.developerId,
          role: 'developer',
          type: 'investment_received',
          title: 'New Property Investment Received',
          message: `${user!.name || 'An investor'} purchased ${units} units of ${property.name} (${property.symbol}) totaling ₹${totalAmount.toLocaleString('en-IN')}.`,
          propertyId: property.id,
          propertySymbol: property.symbol,
          investorId: user!.id,
          investorName: user!.name || 'Investor',
          read: false,
          createdAt: serverTimestamp()
        }).catch(console.error)
      }

      toast.success(method === 'neft_with_token' ? 'Token Paid & NEFT Details Submitted! Redirecting to orders...' : 'Investment Successful! Redirecting to orders...')

      if (method === 'razorpay_direct' && txRef?.id) {
        generateInvoice(txRef.id, totalAmount, false)
      } else if (method === 'neft_with_token' && tokenPaidAmt && txRef?.id) {
        generateInvoice(txRef.id, tokenPaidAmt, true)
      }

      // Automatically navigate to /investor/orders after short delay
      setTimeout(() => {
        router.push('/investor/orders')
      }, 3000)

    } catch (err) {
      console.error(err)
      toast.error('Failed to save transaction')
      setIsProcessing(false)
    }
  }

  if (isLoading || !property) {
    return (
      <AppLayout requiredRole="investor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  const availableUnits = Math.max(0, (property.totalUnits || 0) - (property.unitsSold || 0) - (property.unitsOnHold || 0))

  return (
    <AppLayout requiredRole="investor" title={`Buy ${property.symbol}`}>
      <div className="min-h-screen bg-background relative selection:bg-primary/30 pb-32">
        {/* SOLD OUT OVERLAY */}
        {availableUnits <= 0 && (
          <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-md flex items-center justify-center overflow-hidden pointer-events-auto">
            <div className="bg-red-600/95 text-white font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-2xl md:text-5xl py-6 px-[200vw] -rotate-12 shadow-[0_0_100px_rgba(220,38,38,0.6)] border-y-8 border-red-500 whitespace-nowrap flex items-center gap-6 justify-center">
              <XCircle className="w-10 h-10 md:w-16 md:h-16 shrink-0" />
              SOLD OUT - NO UNITS AVAILABLE
              <XCircle className="w-10 h-10 md:w-16 md:h-16 shrink-0" />
            </div>
          </div>
        )}
        {/* Advanced Ambient Glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute top-[30%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[20%] w-[700px] h-[700px] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10 relative z-10">

          {/* Header Section */}
          <div className="bg-card/40 border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 opacity-50"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                    {property.symbol}
                  </span>
                  <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">{property.city}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">{property.name}</h1>
              </div>
              <div className="text-left md:text-right bg-background/50 p-6 rounded-3xl border border-border/50 shadow-inner">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Live Trading Price</p>
                <p className="text-5xl font-mono font-black text-emerald-500 drop-shadow-sm">₹{currentPrice.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Order Calculator */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold border-b pb-4">Order Configuration</h3>

              <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Units to Purchase</label>
                  <Input
                    type="number"
                    max={availableUnits}
                    value={units || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      setUnits(val as any)
                    }}
                    className={`h-14 text-xl font-bold bg-background ${units > availableUnits ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={tokenPaid || isProcessing}
                  />
                  {units > availableUnits && (
                    <p className="text-red-500 text-xs font-bold mt-1">
                      Cannot purchase more than available limit of {availableUnits.toLocaleString()} units
                    </p>
                  )}
                  {units < 1 && (
                    <p className="text-red-500 text-xs font-bold mt-1">
                      Please enter a valid number of units (minimum 1).
                    </p>
                  )}
                  <p className={`text-xs ${units > availableUnits || units < 1 ? 'text-red-500/80' : 'text-primary/80'} font-semibold italic tracking-wide`}>
                    {units > 0 ? `${numberToIndianWords(units)} units` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium flex justify-between pt-1">
                    <span>Available Depth: {availableUnits.toLocaleString()}</span>
                    <span>Max Limit: {availableUnits.toLocaleString()}</span>
                  </p>
                  <div className="text-xs text-muted-foreground font-medium flex justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setUnits(prev => Math.max(1, (Number(prev) || 1) - 1))}
                      disabled={units <= 1 || tokenPaid || isProcessing}
                      className="h-7 w-7 rounded-md bg-muted hover:bg-secondary text-foreground font-bold border border-border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnits(prev => Math.min(availableUnits, (Number(prev) || 0) + 1))}
                      disabled={units >= availableUnits || tokenPaid || isProcessing}
                      className="h-7 w-7 rounded-md bg-muted hover:bg-secondary text-foreground font-bold border border-border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span>₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex flex-col items-end pt-2">
                    <div className="flex justify-between items-center w-full text-lg font-black">
                      <span>Total Capital Required</span>
                      <span className="text-primary font-mono text-2xl">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary/70 italic uppercase tracking-wider mt-1">
                      Rupees {numberToIndianWords(totalAmount)} Only
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Gateway Logic */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold border-b pb-4">Secure Checkout</h3>

              {!isLargeTransaction ? (
                // LESS THAN 1 LAKH - DIRECT RAZORPAY
                <Card className="p-8 border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)] text-center space-y-6 bg-gradient-to-br from-card to-card/50">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Instant Direct Allocation</h4>
                    <p className="text-sm text-muted-foreground">Your transaction is under ₹1,00,000. You can purchase these units instantly via Razorpay. Units will be allocated to your portfolio immediately upon successful payment.</p>
                  </div>
                  <Button
                    onClick={() => handleRazorpayPayment(totalAmount, false)}
                    disabled={isProcessing || units > availableUnits || units < 1}
                    className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${totalAmount.toLocaleString('en-IN')} Securely`}
                  </Button>
                </Card>
              ) : (
                // GREATER THAN 1 LAKH - TOKEN
                <div className="space-y-6">
                  <Card className="p-8 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)] space-y-6 bg-gradient-to-br from-card to-card/50">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">High-Value Transaction Protocol</h4>
                        <p className="text-xs text-muted-foreground mt-1">Transactions over ₹1 Lakh require a Token Hold and NEFT transfer.</p>
                      </div>
                    </div>

                    <div className="bg-background p-4 rounded-xl border border-border text-sm space-y-3">
                      <div className="flex justify-between items-center text-muted-foreground font-medium">
                        <span>Total Amount</span>
                        <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex flex-col items-end pt-2 border-t border-border/30 mt-2">
                        <div className="flex justify-between items-center w-full text-muted-foreground font-medium">
                          <span>5% Token (Capped at 75K)</span>
                          <span className="text-amber-500 font-bold text-lg">₹{tokenAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-500/70 italic uppercase tracking-wider mt-1">
                          Rupees {numberToIndianWords(tokenAmount)} Only
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      To secure this allocation, pay the holding token via Razorpay now. Once paid, you will receive instructions to transfer the remaining balance of <strong className="text-foreground">₹{(totalAmount - tokenAmount).toLocaleString('en-IN')}</strong> via NEFT.
                    </p>

                    <Button
                      onClick={() => handleRazorpayPayment(tokenAmount, true)}
                      disabled={isProcessing || units > availableUnits || units < 1}
                      className="w-full h-14 text-lg font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay Token: ₹${tokenAmount.toLocaleString('en-IN')}`}
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AESTHETIC INVOICE MODAL OVERLAY */}
        {showInvoiceModal && invoiceDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-background rounded-3xl shadow-2xl p-8 flex flex-col my-8">
              <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="text-emerald-500" /> Payment Successful</h2>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2" onClick={() => toast.info('Auto-downloading, please wait...')}><Download className="w-4 h-4" /> Downloading...</Button>
                  <Button onClick={() => router.push('/investor/orders')} className="bg-primary text-primary-foreground">View Orders</Button>
                </div>
              </div>

              {/* THE INVOICE TO BE CAPTURED BY HTML2CANVAS */}
              <div style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }} className="p-10 rounded-xl mx-auto shadow-inner border w-full max-w-2xl relative" id="aesthetic-invoice">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Building2 className="w-64 h-64" />
                </div>

                <div style={{ borderBottomWidth: '2px', borderBottomColor: '#f3f4f6' }} className="flex justify-between items-start pb-8 mb-8 relative z-10 border-b-2">
                  <div>
                    <h1 style={{ color: '#059669' }} className="text-3xl font-black tracking-tight">MILESTONO</h1>
                    <p style={{ color: '#6b7280' }} className="text-sm font-medium tracking-widest uppercase mt-1">Investments Pvt Ltd</p>
                  </div>
                  <div className="text-right">
                    <h2 style={{ color: '#1f2937' }} className="text-2xl font-bold">TAX INVOICE</h2>
                    <p style={{ color: '#6b7280' }} className="text-sm font-bold font-mono mt-2 uppercase tracking-wider bg-gray-100 py-1 px-3 rounded inline-block">Transaction ID: <span className="text-gray-900">{invoiceDetails.txId}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10 relative z-10">
                  <div>
                    <p style={{ color: '#9ca3af' }} className="text-xs font-bold uppercase tracking-widest mb-2">Billed To</p>
                    <p style={{ color: '#1f2937' }} className="font-bold text-lg">{user?.name}</p>
                    <p style={{ color: '#4b5563' }} className="text-sm">{user?.email}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p style={{ color: '#9ca3af' }} className="text-xs font-bold uppercase tracking-widest mb-2">Invoice Details</p>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-right">
                      <p style={{ color: '#1f2937' }} className="text-sm font-bold">Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: '2-digit' })}</p>
                      <p style={{ color: '#4b5563' }} className="text-xs font-bold mt-1">Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
                    </div>
                    <p style={{ color: '#1f2937' }} className="text-sm font-semibold mt-2">Payment: Razorpay Secure</p>
                    {invoiceDetails.isToken && <p style={{ color: '#f59e0b', backgroundColor: '#fffbeb', borderColor: '#fde68a' }} className="text-[10px] tracking-widest font-black inline-block px-2 py-1 rounded mt-2 border">HOLDING TOKEN</p>}
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden relative z-10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottomColor: '#e5e7eb' }} className="border-b">
                        <th style={{ color: '#6b7280' }} className="py-4 px-6 text-xs font-bold uppercase tracking-widest">Description</th>
                        <th style={{ color: '#6b7280' }} className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-right">Units</th>
                        <th style={{ color: '#6b7280' }} className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottomColor: '#f3f4f6' }} className="border-b">
                        <td className="py-6 px-6">
                          <p style={{ color: '#1f2937' }} className="font-bold">{invoiceDetails.isToken ? 'Fractional Holding Token' : 'Fractional Ownership Allocation'}</p>
                          <p style={{ color: '#6b7280' }} className="text-sm">{property?.name} ({property?.symbol})</p>
                        </td>
                        <td style={{ color: '#1f2937' }} className="py-6 px-6 text-right font-mono font-medium">{invoiceDetails.isToken ? '-' : units}</td>
                        <td style={{ color: '#1f2937' }} className="py-6 px-6 text-right font-mono font-medium">₹{invoiceDetails.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ backgroundColor: '#ecfdf5', borderTopColor: '#d1fae5' }} className="flex justify-between items-center p-6 border-t">
                    <span style={{ color: '#065f46' }} className="text-sm font-bold uppercase tracking-widest">Total Paid</span>
                    <span style={{ color: '#047857' }} className="text-2xl font-black font-mono">₹{invoiceDetails.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={{ color: '#9ca3af', borderTopColor: '#f3f4f6' }} className="mt-12 text-center text-xs border-t pt-6">
                  <p>{invoiceDetails.isToken ? 'This is a token payment receipt. Final property allocation is subject to NEFT clearance.' : 'This is a computer-generated invoice and does not require a physical signature.'}</p>
                  <p className="mt-1">Thank you for investing with Milestono.</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

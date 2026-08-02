'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Transaction } from '@/lib/types'
import { Loader2, ArrowLeft, Upload, CheckCircle2, Clock, Landmark, AlertCircle, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'
import { createNotification } from '@/lib/notifications'
import { onSnapshot } from 'firebase/firestore'

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useSession()
  const resolvedParams = use(params)
  
  const [tx, setTx] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [neftData, setNeftData] = useState({
    utrNumber: '',
    bankName: '',
    ifsc: '',
    proofImages: [] as string[]
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = onSnapshot(doc(db, 'transactions', resolvedParams.id), (snap) => {
      if (snap.exists()) {
        setTx({ id: snap.id, ...snap.data() } as Transaction)
        setIsLoading(false)
      } else {
        toast.error('Order not found')
        router.push('/investor/orders')
      }
    }, (err) => {
      console.error(err)
      toast.error('Failed to load real-time order details')
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [resolvedParams.id, router])

  const compressImageToWebP = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setUploadingImage(true)
    
    try {
      const file = e.target.files[0]
      const webpDataUrl = await compressImageToWebP(file)
      setNeftData(prev => ({
        ...prev,
        proofImages: [...prev.proofImages, webpDataUrl]
      }))
      toast.success('Image compressed and attached')
    } catch (err) {
      console.error(err)
      toast.error('Failed to process image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleNeftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tx || !user) return

    if (!neftData.utrNumber || !neftData.bankName || !neftData.ifsc) {
      toast.error('Please fill all banking details')
      return
    }
    if (neftData.proofImages.length === 0) {
      toast.error('Please attach at least one proof of payment image')
      return
    }
    
    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'pending_admin_approval',
        neftDetails: neftData,
        updatedAt: new Date().toISOString()
      })

      // Notify admin
      await createNotification(
        'admin', // To all admins, or a specific admin ID if you have one. Here we use 'admin' assuming the query can check role
        'admin',
        'neft_submitted',
        'New NEFT Submission',
        `Investor ${user.name} has submitted NEFT proof for order ${tx.id.slice(-6).toUpperCase()}`,
        {
          transactionId: tx.id,
          propertySymbol: tx.propertySymbol,
          amount: (tx.totalAmount - (tx.tokenAmountPaid || 0))
        }
      )

      toast.success('NEFT details submitted! Pending Admin Approval.')
      router.push('/investor/orders')
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit NEFT details')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !tx) {
    return (
      <AppLayout requiredRole="investor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  const remainingBalance = tx.totalAmount - (tx.tokenAmountPaid || 0)
  const isNeftRequired = tx.status === 'pending_neft'

  return (
    <AppLayout requiredRole="investor" title={`Order ${tx.id.slice(-6).toUpperCase()}`}>
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-8">
        
        <button onClick={() => router.push('/investor/orders')} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </button>

        <div className="bg-card border rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{tx.propertySymbol}</span>
                <span className="text-xs font-mono text-muted-foreground">Order ID: {tx.id.slice(-8).toUpperCase()}</span>
              </div>
              <h1 className="text-3xl font-black">{tx.propertyName}</h1>
            </div>
            <div className="flex flex-col items-end bg-muted/30 p-4 rounded-xl border w-full md:w-auto">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Order Value</span>
              <span className="text-2xl font-mono font-black text-foreground">₹{tx.totalAmount.toLocaleString('en-IN')}</span>
              <span className="text-xs text-muted-foreground mt-1">{tx.units} Units @ ₹{tx.unitPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Payment Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Token Amount Paid</span>
                  <span className="font-mono font-semibold text-emerald-500">₹{(tx.tokenAmountPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Remaining Balance</span>
                  <span className="font-mono font-semibold text-rose-500">₹{remainingBalance.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-px bg-border my-2" />
                <div className="flex justify-between items-center text-base font-bold">
                  <span>Total Amount</span>
                  <span className="font-mono">₹{tx.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Order Status</h4>
                {tx.status === 'completed' && (
                  <div className="flex items-center gap-2 text-emerald-500 font-bold">
                    <CheckCircle2 className="w-5 h-5" /> Completed - Units Added to Portfolio
                  </div>
                )}
                {tx.status === 'pending_admin_approval' && (
                  <div className="flex items-center gap-2 text-amber-500 font-bold">
                    <Clock className="w-5 h-5" /> Verification Pending - Admin is reviewing your NEFT proof
                  </div>
                )}
                {tx.status === 'pending_neft' && (
                  <div className="flex items-center gap-2 text-rose-500 font-bold">
                    <AlertCircle className="w-5 h-5" /> Pending Balance - Please pay the remaining balance
                  </div>
                )}
              </div>
            </div>

            {isNeftRequired && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5">
                  <Building2 className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 mb-4">
                    <Landmark className="w-5 h-5" /> Complete Your Investment
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Transfer the remaining <strong className="text-foreground text-base">₹{remainingBalance.toLocaleString('en-IN')}</strong> to the official Milestono account and upload the proof below.
                  </p>
                  
                  <div className="bg-background/80 p-4 rounded-xl border border-indigo-500/20 font-mono text-xs space-y-2 mb-6">
                    <p><span className="text-muted-foreground">Bank:</span> HDFC Bank (Mumbai Branch)</p>
                    <p><span className="text-muted-foreground">Acc Name:</span> Milestono Investments Pvt Ltd</p>
                    <p><span className="text-muted-foreground">Acc No:</span> 50200012345678</p>
                    <p><span className="text-muted-foreground">IFSC:</span> HDFC0001234</p>
                  </div>

                  <form onSubmit={handleNeftSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bank Name</label>
                      <Input required value={neftData.bankName} onChange={e => setNeftData({...neftData, bankName: e.target.value})} className="h-10 text-sm bg-background/50" placeholder="e.g. ICICI Bank" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sender IFSC</label>
                      <Input required value={neftData.ifsc} onChange={e => setNeftData({...neftData, ifsc: e.target.value})} className="h-10 text-sm bg-background/50 uppercase" placeholder="e.g. ICIC0001234" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UTR Number</label>
                      <Input required value={neftData.utrNumber} onChange={e => setNeftData({...neftData, utrNumber: e.target.value})} className="h-10 text-sm bg-background/50 uppercase" placeholder="e.g. UTR1234567890" />
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Upload Proof (Screenshot)</label>
                      <div className="flex gap-4 items-center">
                        <Button type="button" variant="outline" className="h-10 text-sm shrink-0 relative overflow-hidden bg-background/50" disabled={uploadingImage}>
                          <Upload className="w-3 h-3 mr-2" /> 
                          {uploadingImage ? 'Attaching...' : 'Attach Image'}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </Button>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {neftData.proofImages.map((img, i) => (
                            <div key={i} className="relative group w-10 h-10 rounded border overflow-hidden">
                              <img src={img} className="w-full h-full object-cover" alt="Proof" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg mt-6">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { propertyFormSchema, PropertyFormValues } from '@/lib/schemas/property'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/components/shell/session-context'
import type { Developer } from '@/lib/types'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

import BasicDetails from './components/basic-details'
import Specifications from './components/specifications'
import LocationDetails from './components/location-details'
import InvestmentInfo from './components/investment-info'
import MediaUpload from './components/media-upload'
import LegalVerification from './components/legal-verification'
import DeveloperInfo from './components/developer-info'

const STEPS = [
  { id: 'basic', title: 'Basic Details' },
  { id: 'specs', title: 'Specifications' },
  { id: 'location', title: 'Location' },
  { id: 'investment', title: 'Investment Info' },
  { id: 'media', title: 'Media' },
  { id: 'legal', title: 'Legal & Docs' },
  { id: 'developer', title: 'Developer Info' }
]

function DeveloperListPropertyForm() {
  const router = useRouter()
  const { user } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [developerId, setDeveloperId] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null)
  const [isFetchingEdit, setIsFetchingEdit] = useState(false)
  const searchParams = useSearchParams()

  const methods = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      investmentInfo: {
        minimumInvestment: 1,
      },
      media: {
        images: []
      },
      specifications: {
        amenities: []
      }
    }
  })

  useEffect(() => {
    const raw = sessionStorage.getItem('milestono_user')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.developerId) {
        setDeveloperId(parsed.developerId)
      }
    }
  }, [])

  useEffect(() => {
    const editSymbol = searchParams.get('edit')
    if (editSymbol && user?.id) {
      setIsEditMode(true)
      setIsFetchingEdit(true)
      
      const fetchProperty = async () => {
        try {
          const q = query(
            collection(db, 'properties'), 
            where('symbol', '==', editSymbol),
            where('developerId', '==', user.id)
          )
          const snap = await getDocs(q)
          if (!snap.empty) {
            const docSnap = snap.docs[0]
            const data = docSnap.data()
            setEditPropertyId(docSnap.id)
            
            const formDataToReset = data.rawFormData || {
              basicDetails: {
                propertyName: data.name || data.basicDetails?.propertyName || '',
                propertyType: data.type || data.basicDetails?.propertyType || 'Apartment',
                description: data.description || data.basicDetails?.description || 'No description provided.',
                constructionStatus: data.basicDetails?.constructionStatus || 'Ready',
                tickerId: data.symbol || data.basicDetails?.tickerId || '',
              },
              specifications: data.specifications || {
                areaType: 'Carpet Area',
                areaValue: data.areaValue || 1000,
                amenities: data.amenities || ['Security'],
              },
              location: data.location || {
                country: 'India',
                state: data.state || '',
                city: data.city || '',
                areaLocality: data.areaLocality || '',
                fullAddress: data.address || '',
                latitude: data.latitude || 28.6139,
                longitude: data.longitude || 77.2090,
                pincode: data.pincode || '',
              },
              investmentInfo: data.investmentInfo || {
                totalPropertyPrice: data.totalValue || (data.totalUnits * data.unitPrice) || 0,
                totalInvestmentUnits: data.totalUnits || 0,
                minimumInvestment: data.investmentInfo?.minimumInvestment || 1,
                rentalYield: data.expectedYield || 0,
                expectedAppreciation: 0,
              },
              media: data.media || {
                images: data.images || [],
                masterPlan: '',
                floorPlan: '',
                brochurePdf: '',
                documentsPdf: '',
              },
              legalVerification: data.legalVerification || {
                reraNumber: data.reraNumber || 'N/A',
                propertyRegistrationNumber: data.propertyRegistrationNumber || 'N/A',
                ownershipProofUrl: data.documents?.termsUrl || '',
                occupancyCertificateUrl: data.documents?.termsUrl || '',
              },
              developerInfo: data.developerInfo || {
                companyName: data.companyName || user?.name || '',
                developerId: data.globalId?.split('-')[0] || (user as Developer)?.developerId || 'DEV001',
                contactPerson: user?.name || '',
                mobile: user?.phone || '0000000000',
                email: user?.email || '',
              }
            }

            methods.reset(formDataToReset)
          }
        } catch (err) {
          toast.error('Failed to load property for editing')
        } finally {
          setIsFetchingEdit(false)
        }
      }
      
      fetchProperty()
    }
  }, [searchParams, user, methods])

  const { handleSubmit, trigger, formState: { errors } } = methods

  const onFormError = (validationErrors: any) => {
    console.error('[Submit Validation Errors]:', validationErrors)
    const errorSections = Object.keys(validationErrors)
    if (errorSections.length > 0) {
      toast.error(`Validation error in section(s): ${errorSections.join(', ')}. Please check your inputs.`)
    }
  }

  const handleNext = async () => {
    const stepId = STEPS[currentStep].id as keyof PropertyFormValues
    const isStepValid = await trigger(stepId)
    if (isStepValid) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toast.error(`Please fix the errors in the ${STEPS[currentStep].title} section.`)
      
      // Scroll to the first error field
      setTimeout(() => {
        const firstErrorElement = document.querySelector('[aria-invalid="true"], .text-red-500')
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const onSubmit = async (data: PropertyFormValues) => {
    setIsSubmitting(true)
    try {
      const totalUnits = data.investmentInfo.totalInvestmentUnits
      const unitPrice = data.investmentInfo.totalPropertyPrice / totalUnits

      const payload = {
        symbol: data.basicDetails.tickerId,
        name: data.basicDetails.propertyName,
        type: data.basicDetails.propertyType,
        description: data.basicDetails.description,
        amenities: data.specifications.amenities,
        location: data.location,
        address: data.location.fullAddress,
        city: data.location.city,
        state: data.location.state,
        pincode: data.location.pincode,
        totalUnits: totalUnits,
        unitsAvailable: totalUnits,
        unitsSold: 0,
        unitsOnHold: 0,
        unitPrice: unitPrice,
        developerId: user?.id,
        status: 'pending_approval',
        adminMessage: null, // Reset rejection message on resubmission
        updatedAt: new Date().toISOString(),
        globalId: `${data.developerInfo.developerId}-${data.basicDetails.tickerId}`,
        expectedYield: data.investmentInfo.rentalYield || 0,
        occupancyRate: 100,
        documents: {
          termsUrl: data.legalVerification.ownershipProofUrl,
          prospectusUrl: data.media.brochurePdf || '',
          riskDisclosureUrl: data.media.documentsPdf || ''
        },
        images: data.media.images,
        marketData: {
          currentPrice: unitPrice,
          prevDayPrice: unitPrice,
          marketCap: data.investmentInfo.totalPropertyPrice,
          change: 0,
          changePct: 0,
          volume: 0,
          priceHistory: [
            {
              date: new Date().toISOString(),
              price: unitPrice
            }
          ]
        },
        rentalData: {
          expectedYield: data.investmentInfo.rentalYield || 0,
          occupancyRate: 100,
          rentalIncome: (data.investmentInfo.rentalYield || 0) / 100 * data.investmentInfo.totalPropertyPrice
        },
        rawFormData: data
      }

      if (isEditMode && editPropertyId) {
        await updateDoc(doc(db, 'properties', editPropertyId), payload)
        toast.success('Property updated and resubmitted for review successfully!')
      } else {
        const res = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to list property')
        toast.success('Property submitted successfully for review!')
      }

      router.push('/developer/dashboard')
    } catch (e: any) {
      toast.error(e.message || 'Error submitting property')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout requiredRole="developer" title="List Property">
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card p-8 rounded-2xl shadow-2xl border flex flex-col items-center max-w-sm text-center mx-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold mb-2">Publishing Property</h3>
            <p className="text-sm text-muted-foreground">Please wait while we list your property on the marketplace...</p>
          </div>
        </div>
      )}
      <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{isEditMode ? 'Edit & Resubmit Property' : 'List a New Property'}</h1>
          <p className="text-muted-foreground text-sm mt-1">Provide comprehensive details to list your property on the fractional marketplace.</p>
        </div>

        {/* Professional Stepper Header */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 gap-2 scrollbar-hide border-b">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 shrink-0 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${index < currentStep ? 'bg-primary text-primary-foreground' : 
                  index === currentStep ? 'bg-background text-primary border-2 border-primary' : 
                  'bg-muted text-muted-foreground border'}`}>
                {index < currentStep ? <CheckCircle2 size={14} /> : index + 1}
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-2 rounded-full ${index < currentStep ? 'bg-primary/50' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-6 border shadow-sm">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit as any, onFormError)} className="space-y-6">
              
              <div className="min-h-[400px]">
                {currentStep === 0 && <BasicDetails />}
                {currentStep === 1 && <Specifications />}
                {currentStep === 2 && <LocationDetails />}
                {currentStep === 3 && <InvestmentInfo />}
                {currentStep === 4 && <MediaUpload />}
                {currentStep === 5 && <LegalVerification />}
                {currentStep === 6 && <DeveloperInfo developerId={developerId} />}
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack} 
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                
                {currentStep < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Submit for Review
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </Card>
      </div>
    </AppLayout>
  )
}

export default function DeveloperListPropertyPage() {
  return (
    <Suspense fallback={
      <AppLayout requiredRole="developer" title="List Property">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    }>
      <DeveloperListPropertyForm />
    </Suspense>
  )
}

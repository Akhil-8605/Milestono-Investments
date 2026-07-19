'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { Building2, CheckCircle2, AlertCircle, ChevronRight, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PROPERTY_TYPES = ['residential', 'commercial', 'industrial'] as const
const INDIAN_STATES = ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal']

const DEFAULT_AMENITIES = ['Swimming Pool', 'Gym', '24/7 Security', 'Power Backup', 'EV Charging', 'Conference Rooms', 'Cafeteria', 'CCTV', 'Parking', 'Clubhouse']

interface FormState {
  name: string; symbol: string; type: string; state: string; city: string
  address: string; pincode: string; totalUnits: string; unitPrice: string
  expectedYield: string; occupancyRate: string; description: string; amenities: string[]
}

const EMPTY: FormState = {
  name: '', symbol: '', type: 'residential', state: '', city: '', address: '',
  pincode: '', totalUnits: '', unitPrice: '', expectedYield: '', occupancyRate: '',
  description: '', amenities: [],
}

function Field({ label, req, error, children }: { label: string; req?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{req && <span className="text-loss ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-loss mt-1">{error}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn('w-full h-9 px-3 rounded border border-border bg-muted text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors', className)}
    />
  )
}

export default function ListPropertyPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (key: keyof FormState) => (v: string) => setForm(f => ({ ...f, [key]: v }))

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }))
  }

  const validate = () => {
    const e: Partial<FormState> = {}
    if (!form.name.trim()) e.name = 'Property name is required'
    if (!form.symbol.trim() || form.symbol.length < 2) e.symbol = 'Symbol must be 2–6 chars'
    if (!form.state) e.state = 'State is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.address.trim()) e.address = 'Address is required'
    if (!form.pincode.match(/^\d{6}$/)) e.pincode = 'Valid 6-digit PIN required'
    if (!form.totalUnits || isNaN(Number(form.totalUnits)) || Number(form.totalUnits) < 10) e.totalUnits = 'Min 10 units'
    if (!form.unitPrice || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) < 10000) e.unitPrice = 'Min ₹10,000 per unit'
    if (!form.expectedYield || isNaN(Number(form.expectedYield))) e.expectedYield = 'Required'
    if (!form.description || form.description.length < 50) e.description = 'Min 50 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setServerError('')
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalUnits: Number(form.totalUnits),
          unitPrice: Number(form.unitPrice),
          expectedYield: Number(form.expectedYield),
          occupancyRate: Number(form.occupancyRate) || 0,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(true)
      } else {
        setServerError(json.error ?? 'Submission failed. Please try again.')
      }
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <AppLayout title="List Property" subtitle="Submit New Listing">
        <div className="flex items-center justify-center h-full p-6">
          <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-gain" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Listing Submitted!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your property has been submitted for review. Our team will verify the details and publish it within 2–3 business days.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => { setSuccess(false); setForm(EMPTY) }}
                variant="outline"
                className="flex-1 border-border text-muted-foreground hover:text-foreground"
              >
                List Another
              </Button>
              <Button
                onClick={() => router.push('/developer/dashboard')}
                className="flex-1 bg-primary hover:bg-blue-600 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="List Property" subtitle="Submit New Listing">
      <div className="p-6 max-w-4xl">

        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-foreground font-semibold text-base">List a New Property</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Submit property details for review. RERA registration is mandatory.</p>
        </div>

        {serverError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-loss/10 border border-loss/30 text-loss text-sm">
            <AlertCircle size={14} />
            {serverError}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 size={14} className="text-primary" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Property Name" req error={errors.name}>
                <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Prestige Sunrise Park" />
              </Field>
              <Field label="Ticker Symbol" req error={errors.symbol}>
                <TextInput
                  value={form.symbol.toUpperCase()}
                  onChange={v => set('symbol')(v.toUpperCase().slice(0, 6))}
                  placeholder="e.g. PRSN (2–6 chars)"
                />
              </Field>
              <Field label="Property Type" req>
                <div className="flex gap-2">
                  {PROPERTY_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => set('type')(t)}
                      className={cn(
                        'flex-1 py-2 rounded text-xs font-semibold capitalize transition-colors border',
                        form.type === t
                          ? t === 'commercial' ? 'bg-primary/20 text-blue-500 border-primary/40'
                            : t === 'industrial' ? 'bg-purple-500/10 text-purple-500 border-[#8b5cf6]/40'
                            : 'bg-green-500/10 text-green-500 border-gain/40'
                          : 'text-muted-foreground border-border hover:text-muted-foreground'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="State" req error={errors.state}>
                <select
                  value={form.state}
                  onChange={e => set('state')(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="City" req error={errors.city}>
                <TextInput value={form.city} onChange={set('city')} placeholder="e.g. Bangalore" />
              </Field>
              <Field label="PIN Code" req error={errors.pincode}>
                <TextInput value={form.pincode} onChange={set('pincode')} placeholder="6-digit PIN" type="text" />
              </Field>
            </div>
            <Field label="Full Address" req error={errors.address}>
              <TextInput value={form.address} onChange={set('address')} placeholder="Street, Locality, Area" />
            </Field>
          </div>

          {/* Financials */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ChevronRight size={14} className="text-gain" />
              Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Total Units" req error={errors.totalUnits}>
                <TextInput value={form.totalUnits} onChange={set('totalUnits')} placeholder="e.g. 500" type="number" />
              </Field>
              <Field label="Price per Unit (₹)" req error={errors.unitPrice}>
                <TextInput value={form.unitPrice} onChange={set('unitPrice')} placeholder="e.g. 125000" type="number" />
              </Field>
              <Field label="Expected Yield (%)" req error={errors.expectedYield}>
                <TextInput value={form.expectedYield} onChange={set('expectedYield')} placeholder="e.g. 9.2" type="number" />
              </Field>
              <Field label="Current Occupancy (%)">
                <TextInput value={form.occupancyRate} onChange={set('occupancyRate')} placeholder="e.g. 95" type="number" />
              </Field>
            </div>
            {form.totalUnits && form.unitPrice && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
                Total property value:
                <span className="text-foreground font-mono font-semibold ml-1">
                  ₹{(Number(form.totalUnits) * Number(form.unitPrice)).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Description & Amenities</h3>
            <Field label="Property Description" req error={errors.description}>
              <textarea
                value={form.description}
                onChange={e => set('description')(e.target.value)}
                rows={4}
                placeholder="Describe the property, its location advantages, tenant profile, construction quality... (min 50 characters)"
                className="w-full px-3 py-2 rounded border border-border bg-muted text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{form.description.length} / 50 min</p>
            </Field>
            <Field label="Amenities">
              <div className="flex flex-wrap gap-2">
                {DEFAULT_AMENITIES.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      form.amenities.includes(a)
                        ? 'bg-primary/20 text-blue-500 border-primary/40'
                        : 'text-muted-foreground border-border hover:border-primary/20 hover:text-muted-foreground'
                    )}
                  >
                    {form.amenities.includes(a) ? '✓ ' : ''}{a}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 px-8 bg-primary hover:bg-blue-600 text-white font-semibold"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : 'Submit for Review'}
            </Button>
            <Button
              onClick={() => setForm(EMPTY)}
              variant="outline"
              className="h-10 border-border text-muted-foreground hover:text-foreground"
            >
              Clear Form
            </Button>
            <p className="text-[11px] text-muted-foreground ml-auto">
              Submission subject to RERA verification · 2–3 business days
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

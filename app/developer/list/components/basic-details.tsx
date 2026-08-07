import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Building2 } from 'lucide-react'
import { useState } from 'react'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial Office', 'Retail Shop', 'Warehouse', 'Industrial', 'Land']

export default function BasicDetails() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  const activeType = watch('basicDetails.propertyType')
  const [tickerLoading, setTickerLoading] = useState(false)
  const [tickerError, setTickerError] = useState('')

  const handleTickerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4)
    setValue('basicDetails.tickerId', val, { shouldValidate: true })

    if (val.length >= 2) {
      setTickerLoading(true)
      setTickerError('')
      try {
        const raw = localStorage.getItem('milestono_user')
        if (raw) {
          const parsed = JSON.parse(raw)
          const developerId = parsed.developerId

          if (developerId) {
            const res = await fetch(`/api/properties/check-ticker?developerId=${developerId}&tickerId=${val}`)
            const data = await res.json()
            if (!data.success) {
              setTickerError('Ticker ID is already used by you')
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setTickerLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary border-b pb-4">
        <Building2 className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-foreground">Basic Property Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Name *</label>
          <Input 
            {...register('basicDetails.propertyName')} 
            placeholder="e.g. Prestige Sunrise Park" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.basicDetails?.propertyName && <p className="text-[10px] text-red-500">{errors.basicDetails.propertyName.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Type *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PROPERTY_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('basicDetails.propertyType', t as any, { shouldValidate: true })}
                className={cn(
                  'py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border text-center',
                  activeType === t
                    ? 'bg-primary/10 text-primary border-primary shadow-sm'
                    : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:bg-muted'
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.basicDetails?.propertyType && <p className="text-[10px] text-red-500">{errors.basicDetails.propertyType.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Construction Status *</label>
          <select 
            {...register('basicDetails.constructionStatus')}
            className="w-full h-11 px-3 rounded-md border border-border bg-muted/50 text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="">Select Status</option>
            <option value="Ready">Ready</option>
            <option value="Under Construction">Under Construction</option>
            <option value="Upcoming">Upcoming</option>
          </select>
          {errors.basicDetails?.constructionStatus && <p className="text-[10px] text-red-500">{errors.basicDetails.constructionStatus.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticker ID * (max 4 chars)</label>
          <div className="relative">
            <Input 
              {...register('basicDetails.tickerId')} 
              onChange={handleTickerChange}
              placeholder="e.g. PRSN" 
              className={cn("h-11 bg-muted/50 uppercase", tickerError ? "border-red-500 focus-visible:ring-red-500" : "")}
              maxLength={4}
            />
            {tickerLoading && <span className="absolute right-3 top-3 text-xs text-muted-foreground animate-pulse">Checking...</span>}
          </div>
          {errors.basicDetails?.tickerId && <p className="text-[10px] text-red-500">{errors.basicDetails.tickerId.message}</p>}
          {tickerError && !errors.basicDetails?.tickerId && <p className="text-[10px] text-red-500">{tickerError}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description *</label>
          <textarea 
            {...register('basicDetails.description')} 
            rows={5}
            placeholder="Detailed description of the property..." 
            className="w-full p-3 rounded-md border border-border bg-muted/50 text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
          />
          {errors.basicDetails?.description && <p className="text-[10px] text-red-500">{errors.basicDetails.description.message}</p>}
        </div>
      </div>
    </div>
  )
}

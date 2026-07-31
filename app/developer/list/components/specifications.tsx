import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn, numberToIndianWords } from '@/lib/utils'
import { Layers, Plus } from 'lucide-react'
import { useState } from 'react'

const AREA_TYPES = ['Built-up Area', 'Carpet Area', 'Plot Area']
const DEFAULT_AMENITIES = [
  'Swimming Pool', 'Gym', 'Lift', 'Club House', 'Garden', 
  "Children's Play Area", 'Security', 'CCTV', 'Power Backup', 
  'Water Supply', 'EV Charging', 'Visitor Parking', 'WiFi', 'Fire Safety'
]

export default function Specifications() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  const activeAreaType = watch('specifications.areaType')
  const activeAreaValue = watch('specifications.areaValue')
  const selectedAmenities = watch('specifications.amenities') || []
  const furnishedStatus = watch('specifications.furnishedStatus')
  
  const [customAmenity, setCustomAmenity] = useState('')
  const [amenitiesList, setAmenitiesList] = useState(DEFAULT_AMENITIES)

  const toggleAmenity = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity]
    setValue('specifications.amenities', updated, { shouldValidate: true })
  }

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !amenitiesList.includes(customAmenity.trim())) {
      const newAmenity = customAmenity.trim()
      setAmenitiesList([...amenitiesList, newAmenity])
      toggleAmenity(newAmenity)
      setCustomAmenity('')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary border-b pb-4">
        <Layers className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-foreground">Property Specifications</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area Measurement Type *</label>
          <div className="flex gap-2">
            {AREA_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('specifications.areaType', t as any, { shouldValidate: true })}
                className={cn(
                  'flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border text-center',
                  activeAreaType === t
                    ? 'bg-primary/10 text-primary border-primary shadow-sm'
                    : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:bg-muted'
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.specifications?.areaType && <p className="text-[10px] text-red-500">{errors.specifications.areaType.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area Value (sq.ft) *</label>
          <Input 
            {...register('specifications.areaValue', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 1500" 
            className="h-11 bg-muted/50 text-foreground"
          />
          <p className="text-[10px] text-primary">{activeAreaValue > 0 ? numberToIndianWords(activeAreaValue) : ''}</p>
          {errors.specifications?.areaValue && <p className="text-[10px] text-red-500">{errors.specifications.areaValue.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age of Property (Years)</label>
          <Input 
            {...register('specifications.ageOfProperty', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 2 (0 for new)" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.specifications?.ageOfProperty && <p className="text-[10px] text-red-500">{errors.specifications.ageOfProperty.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Floor Number</label>
          <Input 
            {...register('specifications.floorNumber', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 5" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.specifications?.floorNumber && <p className="text-[10px] text-red-500">{errors.specifications.floorNumber.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Floors</label>
          <Input 
            {...register('specifications.totalFloors', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 20" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.specifications?.totalFloors && <p className="text-[10px] text-red-500">{errors.specifications.totalFloors.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bedrooms</label>
          <Input 
            {...register('specifications.bedrooms', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 3" 
            className="h-11 bg-muted/50 text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bathrooms</label>
          <Input 
            {...register('specifications.bathrooms', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 3" 
            className="h-11 bg-muted/50 text-foreground"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balconies</label>
          <Input 
            {...register('specifications.balconies', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 2" 
            className="h-11 bg-muted/50 text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Furnished Status</label>
          <div className="flex gap-2">
            {['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('specifications.furnishedStatus', t as any, { shouldValidate: true })}
                className={cn(
                  'flex-1 py-2 rounded-md text-[10px] font-semibold transition-all border text-center leading-tight px-1',
                  furnishedStatus === t
                    ? 'bg-primary/10 text-primary border-primary shadow-sm'
                    : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:bg-muted'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 md:col-span-2 mt-4 pt-4 border-t">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amenities *</label>
          <div className="flex flex-wrap gap-2">
            {amenitiesList.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  selectedAmenities.includes(amenity)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                )}
              >
                {amenity}
              </button>
            ))}
          </div>
          {errors.specifications?.amenities && <p className="text-[10px] text-red-500">{errors.specifications.amenities.message}</p>}

          <div className="flex items-center gap-2 max-w-sm mt-2">
            <Input 
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              placeholder="Add custom amenity" 
              className="h-9 bg-muted/50 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
            />
            <Button type="button" size="sm" onClick={addCustomAmenity} className="h-9 px-3 shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

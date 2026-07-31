import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./map'), { ssr: false, loading: () => <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse text-muted-foreground text-sm">Loading Map...</div> })

export default function LocationDetails() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  
  const lat = watch('location.latitude') || 28.6139 // Default New Delhi
  const lng = watch('location.longitude') || 77.2090
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data && data.length > 0) {
        const { lat: newLat, lon: newLng, display_name } = data[0]
        setValue('location.latitude', parseFloat(newLat), { shouldValidate: true })
        setValue('location.longitude', parseFloat(newLng), { shouldValidate: true })
        
        // Auto-fill some fields if possible (basic heuristic)
        if (!watch('location.fullAddress')) {
          setValue('location.fullAddress', display_name, { shouldValidate: true })
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handlePositionChange = (pos: [number, number]) => {
    setValue('location.latitude', pos[0], { shouldValidate: true })
    setValue('location.longitude', pos[1], { shouldValidate: true })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary border-b pb-4">
        <MapPin className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-foreground">Location Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6 md:col-span-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country *</label>
              <Input {...register('location.country')} placeholder="India" className="bg-muted/50 text-foreground" />
              {errors.location?.country && <p className="text-[10px] text-red-500">{errors.location.country.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State *</label>
              <Input {...register('location.state')} placeholder="Maharashtra" className="bg-muted/50 text-foreground" />
              {errors.location?.state && <p className="text-[10px] text-red-500">{errors.location.state.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City *</label>
              <Input {...register('location.city')} placeholder="Mumbai" className="bg-muted/50 text-foreground" />
              {errors.location?.city && <p className="text-[10px] text-red-500">{errors.location.city.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pincode *</label>
              <Input {...register('location.pincode')} placeholder="400001" className="bg-muted/50 text-foreground" />
              {errors.location?.pincode && <p className="text-[10px] text-red-500">{errors.location.pincode.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area / Locality *</label>
            <Input {...register('location.areaLocality')} placeholder="Andheri East" className="bg-muted/50 text-foreground" />
            {errors.location?.areaLocality && <p className="text-[10px] text-red-500">{errors.location.areaLocality.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Address *</label>
            <textarea 
              {...register('location.fullAddress')} 
              rows={3}
              placeholder="Building Name, Street, etc." 
              className="w-full p-3 rounded-md border border-border bg-muted/50 text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            />
            {errors.location?.fullAddress && <p className="text-[10px] text-red-500">{errors.location.fullAddress.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Landmark</label>
            <Input {...register('location.landmark')} placeholder="Near Metro Station" className="bg-muted/50 text-foreground" />
          </div>
        </div>

        <div className="space-y-4 md:col-span-1 h-full flex flex-col">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pin Location on Map *</label>
          <div className="flex gap-2">
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search location to pin..." 
              className="bg-muted/50 text-foreground"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            />
            <Button type="button" variant="secondary" onClick={handleSearch} disabled={isSearching} className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Drag the map or click to set the exact property location.</p>
          
          <div className="flex-1 rounded-xl overflow-hidden border border-border relative min-h-[350px]">
            <MapComponent position={[lat, lng]} setPosition={handlePositionChange} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground">Latitude</label>
              <Input {...register('location.latitude', { valueAsNumber: true })} type="number" step="any" className="h-8 text-xs bg-muted/30" readOnly />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground">Longitude</label>
              <Input {...register('location.longitude', { valueAsNumber: true })} type="number" step="any" className="h-8 text-xs bg-muted/30" readOnly />
            </div>
          </div>
          {(errors.location?.latitude || errors.location?.longitude) && (
             <p className="text-[10px] text-red-500">Please select a valid location on the map.</p>
          )}
        </div>
      </div>
    </div>
  )
}

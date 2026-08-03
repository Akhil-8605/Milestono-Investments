import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./map'), { ssr: false, loading: () => <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse text-muted-foreground text-sm">Loading Map...</div> })

export default function LocationDetails() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  
  const lat = watch('location.latitude') || 28.6139 // Default New Delhi
  const lng = watch('location.longitude') || 77.2090
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (typeof window === 'undefined' || !apiKey) return
    if ((window as any).google?.maps) return

    const existingScript = document.getElementById('google-maps-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [apiKey])

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchSuggestions = (queryStr: string) => {
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places?.AutocompleteService) {
      try {
        const service = new (window as any).google.maps.places.AutocompleteService()
        service.getPlacePredictions({ input: queryStr }, (predictions: any[], status: string) => {
          if (status === 'OK' && predictions && predictions.length > 0) {
            setSuggestions(predictions.map((p: any) => ({
              description: p.description,
              placeId: p.place_id
            })))
            setShowSuggestions(true)
          } else {
            fallbackGeocodeSuggestions(queryStr)
          }
        })
      } catch {
        fallbackGeocodeSuggestions(queryStr)
      }
    } else {
      fallbackGeocodeSuggestions(queryStr)
    }
  }

  const fallbackGeocodeSuggestions = (queryStr: string) => {
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder()
      geocoder.geocode({ address: queryStr }, (results: any[], status: string) => {
        if (status === 'OK' && results) {
          setSuggestions(results.map((r: any) => ({
            description: r.formatted_address,
            result: r
          })))
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      })
    }
  }

  const handleSelectSuggestion = (item: any) => {
    setSearchQuery(item.description)
    setShowSuggestions(false)
    setIsSearching(true)

    if (item.result) {
      const first = item.result
      const newLat = first.geometry.location.lat()
      const newLng = first.geometry.location.lng()
      setValue('location.latitude', newLat, { shouldValidate: true })
      setValue('location.longitude', newLng, { shouldValidate: true })
      parseAndSetAddress(first)
      setIsSearching(false)
      return
    }

    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder()
      const req = item.placeId ? { placeId: item.placeId } : { address: item.description }
      geocoder.geocode(req, (results: any[], status: string) => {
        setIsSearching(false)
        if (status === 'OK' && results?.[0]) {
          const first = results[0]
          const newLat = first.geometry.location.lat()
          const newLng = first.geometry.location.lng()
          setValue('location.latitude', newLat, { shouldValidate: true })
          setValue('location.longitude', newLng, { shouldValidate: true })
          parseAndSetAddress(first)
        }
      })
    } else {
      setIsSearching(false)
    }
  }

  const parseAndSetAddress = (result: any) => {
    let country = ''
    let state = ''
    let city = ''
    let pincode = ''
    let areaLocality = ''
    let landmark = ''
    const fullAddress = result.formatted_address || ''

    if (result.address_components) {
      for (const comp of result.address_components) {
        const types = comp.types || []
        if (types.includes('country')) {
          country = comp.long_name
        }
        if (types.includes('administrative_area_level_1')) {
          state = comp.long_name
        }
        if (types.includes('locality') || types.includes('administrative_area_level_2') || types.includes('postal_town')) {
          if (!city) city = comp.long_name
        }
        if (types.includes('postal_code')) {
          pincode = comp.long_name
        }
        if (types.includes('sublocality_level_1') || types.includes('sublocality') || types.includes('neighborhood')) {
          if (!areaLocality) areaLocality = comp.long_name
        }
        if (types.includes('landmark') || types.includes('point_of_interest') || types.includes('establishment') || types.includes('premise') || types.includes('route')) {
          if (!landmark) landmark = comp.long_name
        }
      }
    }

    if (!areaLocality && city) areaLocality = city
    if (!country) country = 'India'

    if (country) setValue('location.country', country, { shouldValidate: true })
    if (state) setValue('location.state', state, { shouldValidate: true })
    if (city) setValue('location.city', city, { shouldValidate: true })
    if (pincode) setValue('location.pincode', pincode, { shouldValidate: true })
    if (areaLocality) setValue('location.areaLocality', areaLocality, { shouldValidate: true })
    if (fullAddress) setValue('location.fullAddress', fullAddress, { shouldValidate: true })
    if (landmark) setValue('location.landmark', landmark, { shouldValidate: true })
  }

  const reverseGeocode = (latitude: number, longitude: number) => {
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder()
      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[], status: string) => {
        if (status === 'OK' && results?.[0]) {
          parseAndSetAddress(results[0])
        }
      })
    }
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setShowSuggestions(false)

    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder()
      geocoder.geocode({ address: searchQuery }, (results: any[], status: string) => {
        setIsSearching(false)
        if (status === 'OK' && results?.[0]) {
          const first = results[0]
          const newLat = first.geometry.location.lat()
          const newLng = first.geometry.location.lng()
          setValue('location.latitude', newLat, { shouldValidate: true })
          setValue('location.longitude', newLng, { shouldValidate: true })
          parseAndSetAddress(first)
        }
      })
    } else {
      setIsSearching(false)
    }
  }

  const handlePositionChange = (pos: [number, number]) => {
    setValue('location.latitude', pos[0], { shouldValidate: true })
    setValue('location.longitude', pos[1], { shouldValidate: true })
    reverseGeocode(pos[0], pos[1])
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
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search location to pin..." 
                className="bg-muted/50 text-foreground w-full"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              />

              {showSuggestions && suggestions.length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                  onMouseDown={e => e.preventDefault()}
                >
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-4 py-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/40 last:border-0 flex items-start gap-2 text-foreground"
                    >
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{s.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
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

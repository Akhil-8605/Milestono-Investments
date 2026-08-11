'use client'

import { useEffect, useRef, useState } from 'react'

interface MapComponentProps {
  position: [number, number]
  setPosition: (pos: [number, number]) => void
}

export default function MapComponent({ position, setPosition }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const isAdvancedRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false
    const checkGoogle = () => {
      if (cancelled) return
      if ((window as any).google?.maps?.Map) {
        setIsLoaded(true)
      } else {
        setTimeout(checkGoogle, 100)
      }
    }

    const existingScript = document.getElementById('google-maps-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`
      script.async = true
      document.head.appendChild(script)
      checkGoogle()
    } else {
      checkGoogle()
    }

    return () => { cancelled = true }
  }, [apiKey])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !(window as any).google?.maps) return

    const google = (window as any).google

    // Validate position values are finite numbers
    const lat = Number.isFinite(position[0]) ? position[0] : 28.6139
    const lng = Number.isFinite(position[1]) ? position[1] : 77.2090
    const latLng = { lat, lng }

    if (!googleMapRef.current) {
      try {
        const map = new google.maps.Map(mapRef.current, {
          center: latLng,
          zoom: 15,
          mapId: 'DEMO_MAP_ID',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        let marker: any = null
        let isAdvanced = false

        // Try AdvancedMarkerElement first
        if (google.maps.marker?.AdvancedMarkerElement) {
          try {
            marker = new google.maps.marker.AdvancedMarkerElement({
              position: latLng,
              map: map,
              gmpDraggable: true,
              title: 'Property Location',
            })
            isAdvanced = true
          } catch {
            // AdvancedMarkerElement failed (e.g. no mapId support), fall back
            marker = null
          }
        }

        // Fallback to legacy Marker
        if (!marker) {
          marker = new google.maps.Marker({
            position: latLng,
            map: map,
            draggable: true,
            title: 'Property Location',
          })
          isAdvanced = false
        }

        isAdvancedRef.current = isAdvanced

        // Helper to safely extract lat/lng from various position types
        const extractLatLng = (pos: any): [number, number] | null => {
          if (!pos) return null
          try {
            const lt = typeof pos.lat === 'function' ? pos.lat() : pos.lat
            const ln = typeof pos.lng === 'function' ? pos.lng() : pos.lng
            if (Number.isFinite(lt) && Number.isFinite(ln)) return [lt, ln]
          } catch { /* ignore */ }
          return null
        }

        // Helper to safely update marker position
        const updateMarkerPosition = (newLatLng: { lat: number; lng: number }) => {
          try {
            if (isAdvanced) {
              marker.position = newLatLng
            } else {
              marker.setPosition(newLatLng)
            }
          } catch (err) {
            console.warn('[Map] Failed to update marker:', err)
          }
        }

        map.addListener('click', (e: any) => {
          try {
            if (!e.latLng) return
            const coords = extractLatLng(e.latLng)
            if (!coords) return
            updateMarkerPosition({ lat: coords[0], lng: coords[1] })
            setPosition(coords)
          } catch (err) {
            console.warn('[Map] Click handler error:', err)
          }
        })

        marker.addListener('dragend', () => {
          try {
            let coords: [number, number] | null = null
            if (isAdvanced) {
              coords = extractLatLng(marker.position)
            } else {
              coords = extractLatLng(marker.getPosition())
            }
            if (coords) {
              setPosition(coords)
            }
          } catch (err) {
            console.warn('[Map] Dragend handler error:', err)
          }
        })

        googleMapRef.current = map
        markerRef.current = marker
      } catch (err) {
        console.error('[Map] Initialization error:', err)
      }
    } else {
      // Update existing map and marker
      try {
        googleMapRef.current.setCenter(latLng)
        if (markerRef.current) {
          if (isAdvancedRef.current) {
            markerRef.current.position = latLng
          } else {
            markerRef.current.setPosition(latLng)
          }
        }
      } catch (err) {
        console.warn('[Map] Update error:', err)
      }
    }
  }, [isLoaded, position, setPosition])

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-muted/40 flex items-center justify-center p-4 text-center text-xs text-muted-foreground font-medium">
        Google Maps API Key missing in environment (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
      </div>
    )
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full rounded-xl border border-border" />
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center animate-pulse text-muted-foreground text-sm font-medium z-10">
          Loading Google Maps...
        </div>
      )}
    </div>
  )
}

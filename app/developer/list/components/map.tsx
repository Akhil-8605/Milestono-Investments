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
  const [isLoaded, setIsLoaded] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkGoogle = () => {
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
  }, [apiKey])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !(window as any).google?.maps) return

    const google = (window as any).google
    const latLng = { lat: position[0], lng: position[1] }

    if (!googleMapRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center: latLng,
        zoom: 15,
        mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })

      let marker: any = null
      if (google.maps.marker?.AdvancedMarkerElement) {
        marker = new google.maps.marker.AdvancedMarkerElement({
          position: latLng,
          map: map,
          gmpDraggable: true,
          title: 'Property Location',
        })
      } else {
        // Fallback for older API versions
        marker = new google.maps.Marker({
          position: latLng,
          map: map,
          draggable: true,
          title: 'Property Location',
        })
      }

      map.addListener('click', (e: any) => {
        if (!e.latLng) return
        const newLat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat
        const newLng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng
        if (marker.position !== undefined) {
          marker.position = { lat: newLat, lng: newLng } // AdvancedMarkerElement
        } else {
          marker.setPosition({ lat: newLat, lng: newLng }) // Fallback Marker
        }
        setPosition([newLat, newLng])
      })

      marker.addListener('dragend', (e: any) => {
        let newLat, newLng
        if (marker.position !== undefined) {
          // AdvancedMarkerElement
          newLat = typeof marker.position.lat === 'function' ? marker.position.lat() : marker.position.lat
          newLng = typeof marker.position.lng === 'function' ? marker.position.lng() : marker.position.lng
        } else if (e.latLng) {
          newLat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat
          newLng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng
        }
        if (newLat !== undefined && newLng !== undefined) {
          setPosition([newLat, newLng])
        }
      })

      googleMapRef.current = map
      markerRef.current = marker
    } else {
      googleMapRef.current.setCenter(latLng)
      if (markerRef.current) {
        if (markerRef.current.position !== undefined) {
          markerRef.current.position = latLng // AdvancedMarkerElement
        } else {
          markerRef.current.setPosition(latLng) // Fallback Marker
        }
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

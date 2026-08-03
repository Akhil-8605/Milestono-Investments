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

    if ((window as any).google?.maps) {
      setIsLoaded(true)
      return
    }

    const existingScript = document.getElementById('google-maps-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&maptype=satellite`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    } else {
      existingScript.addEventListener('load', () => setIsLoaded(true))
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
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })

      const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        draggable: true,
        title: 'Property Location',
      })

      map.addListener('click', (e: any) => {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        marker.setPosition({ lat: newLat, lng: newLng })
        setPosition([newLat, newLng])
      })

      marker.addListener('dragend', (e: any) => {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setPosition([newLat, newLng])
      })

      googleMapRef.current = map
      markerRef.current = marker
    } else {
      googleMapRef.current.setCenter(latLng)
      if (markerRef.current) {
        markerRef.current.setPosition(latLng)
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
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center animate-pulse text-muted-foreground text-sm font-medium">
          Loading Google Maps...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-xl border border-border" />
    </div>
  )
}

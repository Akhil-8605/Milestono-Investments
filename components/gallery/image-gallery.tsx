'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: Array<{
    url: string
    caption?: string
  }>
  title?: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const next = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (images.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}

      {/* Main Image */}
      <div className="relative bg-card border border-border rounded-xl overflow-hidden group">
        <div className="aspect-video bg-card flex items-center justify-center">
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].caption || 'Property'}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </>
        )}

        {/* Zoom Button */}
        <button
          onClick={() => setZoomOpen(true)}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <ZoomIn size={18} className="text-white" />
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-lg text-xs text-white">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Caption */}
        {images[currentIndex].caption && (
          <div className="absolute bottom-12 left-3 right-3 text-sm text-white bg-black/50 px-3 py-2 rounded-lg">
            {images[currentIndex].caption}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-colors',
                idx === currentIndex ? 'border-primary' : 'border-border hover:border-primary/50'
              )}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {zoomOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <img
              src={images[currentIndex].url}
              alt="Zoomed"
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

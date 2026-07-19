'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { PropertyForm } from '@/components/forms/property-form'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DevListPropertiesPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">List a New Property</h1>
            <p className="text-muted-foreground mt-1">
              Create and publish a new property listing on Milestono
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            {['Property Details', 'Financial Info', 'Documents', 'Preview', 'Publish'].map(
              (step, idx) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${
                    idx < 4 ? 'bg-secondary' : 'hidden'
                  }`} />
                  <span className="text-xs font-medium text-muted-foreground">{step}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Form */}
        <PropertyForm
          onSubmit={(data) => {
            console.log('Property submitted:', data)
            setShowForm(false)
          }}
        />

        {/* Tips */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText size={20} />
            Pro Tips for Better Listings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'High-Quality Images',
                desc: 'Use professional photos with multiple angles to increase investor interest',
              },
              {
                title: 'Accurate ROI',
                desc: 'Provide realistic returns based on market analysis and comparable properties',
              },
              {
                title: 'Complete Details',
                desc: 'Fill all fields with accurate information for transparency and compliance',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="p-4 bg-card border border-border rounded-lg">
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Plus, FileText } from 'lucide-react'

interface PropertyFormProps {
  onSubmit?: (data: any) => void
  isLoading?: boolean
}

export function PropertyForm({ onSubmit, isLoading }: PropertyFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)
    onSubmit?.(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Property Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Property Name
            </label>
            <Input
              name="name"
              placeholder="e.g., Downtown Office Complex"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Stock Symbol
            </label>
            <Input
              name="symbol"
              placeholder="e.g., DOWNOFC"
              className="bg-card border-border"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Location
            </label>
            <Input
              name="location"
              placeholder="City, State"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Property Type
            </label>
            <select
              name="type"
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              required
            >
              <option value="">Select type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="mixed">Mixed Use</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Financial Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Total Investment (₹)
            </label>
            <Input
              name="totalInvestment"
              type="number"
              placeholder="0"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Expected ROI (%)
            </label>
            <Input
              name="expectedROI"
              type="number"
              placeholder="12"
              step="0.1"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Total Units
            </label>
            <Input
              name="totalUnits"
              type="number"
              placeholder="1000"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Unit Price (₹)
            </label>
            <Input
              name="unitPrice"
              type="number"
              placeholder="0"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Annual Yield (%)
            </label>
            <Input
              name="annualYield"
              type="number"
              placeholder="8.5"
              step="0.1"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Holding Period (years)
            </label>
            <Input
              name="holdingPeriod"
              type="number"
              placeholder="5"
              className="bg-card border-border"
              required
            />
          </div>
        </div>
      </div>

      {/* Occupancy Details */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Occupancy Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Current Occupancy (%)
            </label>
            <Input
              name="occupancy"
              type="number"
              min="0"
              max="100"
              placeholder="85"
              className="bg-card border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Monthly Rent (₹)
            </label>
            <Input
              name="monthlyRent"
              type="number"
              placeholder="0"
              className="bg-card border-border"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Property description and highlights..."
            rows={4}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Document Upload */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Documents</h3>

        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Upload property documents (images, specs, etc.)</p>
          <input
            type="file"
            name="documents"
            multiple
            accept="image/*,.pdf"
            className="hidden"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1 bg-primary hover:bg-blue-600 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Listing'}
        </Button>
        <Button
          type="button"
          className="flex-1 bg-card border border-border hover:border-primary/40 text-foreground"
        >
          Save Draft
        </Button>
      </div>
    </form>
  )
}

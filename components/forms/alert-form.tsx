'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertFormProps {
  propertyName?: string
  currentPrice?: number
  onSubmit?: (alert: any) => void
}

export function AlertForm({ propertyName, currentPrice, onSubmit }: AlertFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)
    onSubmit?.(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Alert Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'price_above', label: 'Price Above', icon: TrendingUp, color: 'var(--gain)' },
            { value: 'price_below', label: 'Price Below', icon: TrendingDown, color: 'var(--loss)' },
            { value: 'yield_change', label: 'Yield Change', icon: Bell, color: 'var(--primary)' },
            { value: 'occupancy', label: 'Occupancy Alert', icon: AlertCircle, color: '#f59e0b' },
          ].map(({ value, label, icon: Icon, color }) => (
            <label
              key={value}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/20"
            >
              <input
                type="radio"
                name="alertType"
                value={value}
                className="w-4 h-4 cursor-pointer"
                defaultChecked={value === 'price_above'}
              />
              <Icon size={16} style={{ color }} />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {currentPrice && (
        <div className="p-3 bg-card border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">Current Price</p>
          <p className="text-lg font-bold text-primary font-mono">₹{currentPrice.toLocaleString()}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Trigger Price (₹)
        </label>
        <Input
          name="triggerPrice"
          type="number"
          placeholder="Enter price"
          className="bg-card border-border"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Notification Method
        </label>
        <div className="space-y-2">
          {['email', 'sms', 'push'].map((method) => (
            <label key={method} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notifications"
                value={method}
                defaultChecked={method === 'email'}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground capitalize">{method}</span>
            </label>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-blue-600 text-white"
      >
        Create Alert
      </Button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { Download, Share2, Printer, Calendar, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportGeneratorProps {
  onGenerate?: (format: 'pdf' | 'csv' | 'excel') => void
  timeRange?: 'month' | 'quarter' | 'year'
}

export function ReportGenerator({ onGenerate, timeRange = 'month' }: ReportGeneratorProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf')
  const [selectedRange, setSelectedRange] = useState(timeRange)

  return (
    <div className="space-y-6 bg-card border border-border rounded-xl p-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Report Details</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Portfolio', 'Holdings', 'Performance', 'Tax'].map((type) => (
                <button
                  key={type}
                  className="p-3 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors text-sm font-medium text-muted-foreground"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Time Range
            </label>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as any)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-sm"
            >
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['pdf', 'csv', 'excel'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`p-3 rounded-lg font-medium text-sm transition-colors ${
                    selectedFormat === format
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onGenerate?.(selectedFormat)}
          className="flex-1 bg-primary hover:bg-blue-600 text-white flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Generate Report
        </Button>
        <Button className="bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-muted-foreground p-2">
          <Printer size={16} />
        </Button>
        <Button className="bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-muted-foreground p-2">
          <Share2 size={16} />
        </Button>
      </div>
    </div>
  )
}

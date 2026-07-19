'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { ReportGenerator } from '@/components/forms/report-generator'
import { BarChart3, TrendingUp, Wallet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

const mockReports = [
  {
    id: '1',
    name: 'Portfolio Summary - January 2024',
    type: 'portfolio',
    date: '2024-01-31',
    size: '2.4 MB',
    status: 'ready',
  },
  {
    id: '2',
    name: 'Holdings Report - Q4 2023',
    type: 'holdings',
    date: '2024-01-15',
    size: '1.8 MB',
    status: 'ready',
  },
  {
    id: '3',
    name: 'Performance Analysis - 2023',
    type: 'performance',
    date: '2024-01-01',
    size: '3.2 MB',
    status: 'ready',
  },
]

export default function ReportsPage() {
  const [reports, setReports] = useState(mockReports)
  const [reportType, setReportType] = useState<'portfolio' | 'holdings' | 'performance' | 'tax'>('portfolio')

  const handleGenerateReport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log('Generating report:', { type: reportType, format })
    
    const newReport = {
      id: String(reports.length + 1),
      name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
      type: reportType,
      date: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      status: 'ready' as const,
    }
    
    setReports((prev) => [newReport, ...prev])
  }

  return (
    <AppLayout title="Reports" subtitle="Analytics and downloads">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Generate and download detailed portfolio reports
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Value',
              value: '₹45.2L',
              change: '+12.5%',
              icon: Wallet,
              color: 'blue',
            },
            {
              label: 'YTD Return',
              value: '18.3%',
              change: '+4.2%',
              icon: TrendingUp,
              color: 'green',
            },
            {
              label: 'Holdings',
              value: '8',
              change: '+1',
              icon: BarChart3,
              color: 'purple',
            },
            {
              label: 'Reports',
              value: reports.length,
              change: `+${Math.floor(Math.random() * 3)}`,
              icon: FileText,
              color: 'orange',
            },
          ].map(({ label, value, change, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
                  <p className="text-xs text-gain mt-1">{change} from last month</p>
                </div>
                <Icon size={24} className="text-primary" />
              </div>
            </div>
          ))}
        </div>

        {/* Report Generator */}
        <ReportGenerator onGenerate={handleGenerateReport} />

        {/* Recent Reports */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Recent Reports</h2>

          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <FileText size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded text-xs font-semibold bg-green-500/10 text-gain">
                    {report.status.toUpperCase()}
                  </span>
                  <Button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 text-sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export All */}
        <div className="bg-gradient-to-r from-primary/20 to-card border border-primary/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Export All Data
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Download all your reports in one file
              </p>
            </div>
            <Button className="bg-primary hover:bg-blue-600 text-white">
              Export
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

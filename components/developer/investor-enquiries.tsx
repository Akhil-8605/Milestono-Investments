'use client'

import { cn } from '@/lib/utils'
import { Mail, Phone, Calendar, MapPin, MessageSquare, Check, X } from 'lucide-react'

export interface EnquiryMessage {
  id: string
  propertySymbol: string
  propertyName: string
  investorName: string
  investorEmail: string
  phone?: string
  message: string
  createdAt: string
  status: 'unread' | 'read' | 'replied'
}

interface InvestorEnquiriesProps {
  enquiries: EnquiryMessage[]
  onReply?: (enquiryId: string) => void
  onClose?: (enquiryId: string) => void
  loading?: boolean
}

export function InvestorEnquiries({ enquiries, onReply, onClose, loading }: InvestorEnquiriesProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (enquiries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Mail size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No enquiries yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {enquiries.map(enquiry => (
        <div
          key={enquiry.id}
          className={cn(
            'bg-card border rounded-lg p-4 hover:border-primary/30 transition-all',
            enquiry.status === 'unread' ? 'border-primary bg-primary/20/20' : 'border-border'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">{enquiry.investorName}</span>
                <span className={cn(
                  'text-[8px] font-bold uppercase px-1.5 py-0.5 rounded',
                  enquiry.status === 'unread' && 'bg-primary text-white',
                  enquiry.status === 'read' && 'bg-[#6b7280]/20 text-muted-foreground',
                  enquiry.status === 'replied' && 'bg-gain/20 text-gain'
                )}>
                  {enquiry.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">For {enquiry.propertySymbol} · {enquiry.propertyName}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {new Date(enquiry.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-1.5 mb-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={12} className="text-muted-foreground" />
              {enquiry.investorEmail}
            </div>
            {enquiry.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone size={12} className="text-muted-foreground" />
                {enquiry.phone}
              </div>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{enquiry.message}</p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReply?.(enquiry.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-primary hover:bg-blue-600 text-white transition-colors"
            >
              <MessageSquare size={12} />
              Reply
            </button>
            <button
              onClick={() => onClose?.(enquiry.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-muted hover:bg-secondary text-muted-foreground hover:text-muted-foreground border border-border transition-colors"
            >
              <Check size={12} />
              Mark Done
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

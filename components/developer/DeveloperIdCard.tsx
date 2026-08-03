'use client'

import React, { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import { Download, Building2, Calendar, Phone, MapPin, CheckCircle2, ShieldCheck, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DeveloperIdCardProps {
  developerId: string
  companyName: string
  yearsEstablished?: string
  mobileNumber: string
  officeAddress: string
  companyLogo?: string
  companyBanner?: string
  partnerSince?: string
}

export function DeveloperIdCard({
  developerId,
  companyName,
  yearsEstablished = '10+ Years',
  mobileNumber,
  officeAddress,
  companyLogo,
  companyBanner,
  partnerSince = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}: DeveloperIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadCard = async () => {
    if (!cardRef.current) return
    try {
      toast.info('Generating high-quality ID card...', { id: 'downloading' })
      const canvas = await html2canvas(cardRef.current, { 
        scale: 3, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const styleElements = clonedDoc.querySelectorAll('style')
          styleElements.forEach(styleEl => {
            if (styleEl.textContent) {
              styleEl.textContent = styleEl.textContent.replace(/(?:lab|oklab|oklch)\([^)]+\)/gi, '#000000')
            }
          })
        }
      })
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const link = document.createElement('a')
      link.download = `Milestono-Developer-${developerId}.png`
      link.href = dataUrl
      link.click()
      toast.success('ID Card downloaded successfully!', { id: 'downloading' })
    } catch (err) {
      console.error('Failed to download ID card', err)
      toast.error('Failed to download ID card. This may be due to external image loading.', { id: 'downloading' })
    }
  }

  const qrUrl = `https://investments.milestono.com/developers/${developerId}`

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        ref={cardRef}
        className="w-[800px] h-[500px] bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col font-sans shrink-0 border border-slate-700/50"
        style={{ zoom: 0.8 }}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
        
        <div className="absolute top-0 right-0 w-[400px] h-full opacity-30 mask-image:linear-gradient(to_left,white,transparent)">
          {companyBanner ? (
            <img src={companyBanner} alt="Banner" className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
             <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-blue-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/50 to-slate-900" />
        </div>
        
        <div className="absolute top-8 right-8 z-10 flex flex-col items-end">
          <div className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">Authorized Developer</div>
          <div className="text-white text-lg font-bold tracking-widest mt-1">MILESTONO PARTNER</div>
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-950/50 rounded-full shadow-inner border border-white/5 z-20" />

        <div className="flex-1 flex px-12 pt-16 z-10">
          <div className="w-[50%] flex flex-col pt-4">
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-4 w-32 h-32 flex items-center justify-center border border-white/10 z-20 mb-8">
              <img src={companyLogo || "/logo.png"} alt="Company Logo" className="w-full h-auto object-contain filter brightness-0 invert opacity-80" crossOrigin="anonymous" />
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Company Name</p>
                <p className="text-2xl font-bold text-white leading-tight">{companyName}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Established</p>
                  <p className="text-sm font-bold text-slate-200">{yearsEstablished}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-bold text-slate-200">{mobileNumber}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Registered Address</p>
                <p className="text-sm font-medium text-slate-300 leading-snug max-w-[90%]">{officeAddress}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end items-end pb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col items-center gap-4 shadow-2xl w-48">
              <div className="bg-white p-3 rounded-xl shadow-lg w-full aspect-square flex items-center justify-center">
                <QRCodeSVG value={qrUrl} className="w-full h-full" level="H" />
              </div>
              <div className="text-center w-full pt-2 border-t border-white/10">
                <p className="text-[9px] font-bold text-blue-400 tracking-[0.2em] mb-1">DEVELOPER ID</p>
                <p className="text-lg font-mono font-bold text-white tracking-widest">{developerId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[80px] bg-slate-950/50 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-12 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="flex items-center gap-3 z-10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verification Status</p>
              <p className="text-sm font-bold text-emerald-400">VERIFIED PARTNER</p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Partner Since</p>
              <p className="text-sm font-bold text-blue-400">{partnerSince.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={downloadCard} className="w-[300px] gap-2 rounded-xl" size="lg">
        <Download className="w-5 h-5" /> Download ID Card
      </Button>
    </div>
  )
}

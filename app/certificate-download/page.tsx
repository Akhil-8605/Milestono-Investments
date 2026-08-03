'use client'

import { useMemo } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Button } from '@/components/ui/button'
import { ArrowDownCircle, Building2, ShieldCheck, Sparkles, Star } from 'lucide-react'

export default function CertificateDownloadPage() {
  const certificate = useMemo(
    () => ({
      id: 'MILE-2026-00123',
      owner: 'Amit Sharma',
      property: 'Regal Heights Residences',
      propertyLocation: 'Andheri East, Mumbai',
      units: 18,
      purchaseValue: 924000,
      issueDate: '12 Jun 2026',
      expiryDate: '12 Jun 2027',
      approvedBy: 'Milestono Investments',
      status: 'Verified',
    }),
    []
  )

  const handleDownload = () => {
    window.print()
  }

  return (
    <AppLayout allowGuest title="Title & Ownership Certificate">
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 px-8 py-12 text-white sm:px-10 sm:py-14">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200">
                  <ShieldCheck className="h-4 w-4" /> Milestono Investments
                </span>
                <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Title & Ownership Certificate</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Official certificate of ownership for a fractional property investment. Download the certified title record, share with stakeholders, or archive it for compliance review.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/10 p-4 text-sm text-slate-100">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Certificate ID</p>
                    <p className="mt-3 text-lg font-semibold">{certificate.id}</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4 text-sm text-slate-100">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Status</p>
                    <p className="mt-3 text-lg font-semibold text-emerald-300">{certificate.status}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button onClick={handleDownload} className="rounded-3xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-900/10 hover:bg-slate-100">
                    <ArrowDownCircle className="mr-2 h-4 w-4" /> Download Certificate
                  </Button>
                  <Button variant="outline" className="rounded-3xl border-white/30 px-6 py-3 text-sm font-semibold text-white hover:border-white hover:text-white/90">
                    View Full Title Report
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-8 px-6 py-10 md:grid-cols-[1.35fr_0.95fr] md:px-10 md:py-12">
              <div className="rounded-[2rem] bg-slate-50 p-8 shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Certificate Summary</p>
                    <h2 className="mt-4 text-2xl font-black text-slate-950">Verified title record</h2>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Certified</div>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Owner</p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">{certificate.owner}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Property</p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">{certificate.property}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Location</p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">{certificate.propertyLocation}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Units Owned</p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">{certificate.units}</p>
                  </div>
                </div>

                <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Title statement</p>
                  <p className="mt-4 text-base leading-8 text-slate-700">This certificate confirms the registered investor holds legal title and ownership entitlement for the specified units in the property listed above. It is issued by Milestono Investments as proof of ownership and compliance with platform terms.</p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] bg-slate-900 px-6 py-5 text-white">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Issued on</p>
                    <p className="mt-3 text-lg font-semibold">{certificate.issueDate}</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Valid through</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">{certificate.expiryDate}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-sm">
                <div className="text-sm uppercase tracking-[0.35em] text-slate-500">Milestono Ownership Seal</div>
                <div className="mt-10 space-y-5">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Ownership Grade</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">A+</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Asset Class</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">Premium Residential</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Verification</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">Blockchain-backed Proof</p>
                  </div>
                </div>

                <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-7 text-white">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Authorized signatory</p>
                  <p className="mt-4 text-3xl font-bold">{certificate.approvedBy}</p>
                  <p className="mt-3 text-sm text-slate-300">Trusted asset services since 2023 – Milestono Investments</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

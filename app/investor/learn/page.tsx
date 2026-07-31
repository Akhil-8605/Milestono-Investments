'use client'

import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { BookOpen, HelpCircle, ShieldCheck, TrendingUp, Building2, ChevronRight, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MODULES = [
  {
    title: 'Introduction to Fractional Real Estate',
    description: 'Learn how Milestono allows you to invest in Grade-A commercial properties with a fraction of the cost.',
    icon: Building2,
    time: '5 min read'
  },
  {
    title: 'Understanding Yields & Appreciation',
    description: 'Discover how rental yields and property appreciation generate wealth over time.',
    icon: TrendingUp,
    time: '8 min read'
  },
  {
    title: 'Security and Legal Protections',
    description: 'Explore the robust legal frameworks and SEBI regulations that protect your investments.',
    icon: ShieldCheck,
    time: '6 min read'
  },
  {
    title: 'Trading on the Secondary Market',
    description: 'How to buy and sell fractional units seamlessly via the Milestono exchange.',
    icon: PlayCircle,
    time: '10 min video'
  }
]

export default function InvestorLearnPage() {
  return (
    <AppLayout requiredRole="investor" title="Knowledge Base">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/10 via-background/80 to-background pointer-events-none -z-10" />
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border/50 pb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              Investor Academy
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base font-medium max-w-2xl">
              Master the art of fractional real estate investing. Gain the knowledge you need to analyze properties, manage your portfolio, and maximize your wealth.
            </p>
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-xl bg-background/50 backdrop-blur font-bold hover:bg-muted shadow-sm transition-all gap-2">
            <HelpCircle className="w-5 h-5" /> Help Center
          </Button>
        </div>

        {/* Featured Video / Main Banner */}
        <Card className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden group cursor-pointer relative">
          <div className="aspect-[21/9] bg-muted relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
              alt="Trading visualization" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="h-20 w-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.5)] group-hover:scale-110 transition-transform cursor-pointer backdrop-blur-md">
                <PlayCircle className="w-10 h-10 ml-1" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8 z-20">
              <span className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-primary/20 mb-3 inline-block">
                Getting Started
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">The Complete Guide to Milestono</h2>
              <p className="text-white/80 font-medium mt-2 max-w-xl">Learn how to build a diversified real estate portfolio in under 10 minutes.</p>
            </div>
          </div>
        </Card>

        {/* Modules Grid */}
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-6">Learning Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MODULES.map((mod, i) => (
              <Card key={i} className="p-6 md:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all group flex flex-col justify-between cursor-pointer">
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform shadow-inner">
                    <mod.icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold tracking-tight mb-3">{mod.title}</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed mb-6">
                    {mod.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{mod.time}</span>
                  <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/10 rounded-lg group-hover:translate-x-1 transition-transform">
                    Start Learning <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

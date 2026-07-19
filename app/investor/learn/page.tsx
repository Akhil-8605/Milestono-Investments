'use client'

import { AppLayout } from '@/components/shell/app-layout'
import { BookOpen, Video, FileText, Users, Lightbulb, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const learningContent = [
  {
    category: 'Getting Started',
    icon: Lightbulb,
    items: [
      { title: 'What is Real Estate Investing?', type: 'article', duration: '5 min' },
      { title: 'How to Buy Units', type: 'video', duration: '12 min' },
      { title: 'Understanding REIT Basics', type: 'article', duration: '8 min' },
    ],
  },
  {
    category: 'Investment Strategy',
    icon: BookOpen,
    items: [
      { title: 'Portfolio Diversification', type: 'article', duration: '10 min' },
      { title: 'Risk Management Strategies', type: 'video', duration: '15 min' },
      { title: 'Analyzing ROI & Yield', type: 'article', duration: '7 min' },
    ],
  },
  {
    category: 'Market Analysis',
    icon: FileText,
    items: [
      { title: 'Reading Market Charts', type: 'video', duration: '8 min' },
      { title: 'Fundamental Analysis Guide', type: 'article', duration: '12 min' },
      { title: 'Technical Indicators Explained', type: 'article', duration: '10 min' },
    ],
  },
  {
    category: 'FAQs & Support',
    icon: HelpCircle,
    items: [
      { title: 'Common Questions', type: 'article', duration: 'N/A' },
      { title: 'How to Withdraw Money', type: 'article', duration: '5 min' },
      { title: 'Contact Support', type: 'article', duration: 'N/A' },
    ],
  },
]

export default function InvestorLearnPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Learn & Resources</h1>
          <p className="text-muted-foreground mt-1">
            Master real estate investing with our comprehensive guides
          </p>
        </div>

        {/* Featured Course */}
        <div className="bg-gradient-to-r from-primary/20 to-card border border-primary/30 rounded-xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Beginner's Guide to Real Estate Investing</h2>
          <p className="text-muted-foreground">
            Learn the fundamentals of real estate investment and start building your portfolio today
          </p>
          <Button className="bg-primary hover:bg-blue-600 text-white">
            Start Learning
          </Button>
        </div>

        {/* Learning Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {learningContent.map(({ category, icon: Icon, items }) => (
            <div
              key={category}
              className="bg-card border border-border rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{category}</h3>
              </div>

              <div className="space-y-3">
                {items.map(({ title, type, duration }) => (
                  <div
                    key={title}
                    className="p-3 bg-card rounded-lg hover:bg-secondary transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {title}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-card text-muted-foreground">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                          {duration !== 'N/A' && (
                            <span className="text-xs px-2 py-1 rounded bg-card text-muted-foreground">
                              {duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button className="text-primary hover:text-blue-500 bg-transparent border-0 p-0">
                        →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full bg-card border border-border hover:border-primary/40 text-primary">
                View All in {category}
              </Button>
            </div>
          ))}
        </div>

        {/* Tools & Resources */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Tools & Resources</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'ROI Calculator', desc: 'Calculate potential returns' },
              { title: 'Mortgage Calculator', desc: 'Plan your financing' },
              { title: 'Portfolio Tracker', desc: 'Monitor your investments' },
            ].map(({ title, desc }) => (
              <button
                key={title}
                className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors text-left"
              >
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Community */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Community</h2>
          </div>
          <p className="text-muted-foreground">
            Join thousands of investors discussing strategies and sharing insights
          </p>
          <Button className="bg-primary hover:bg-blue-600 text-white w-full">
            Join Community Forum
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}

'use client'

import { AppLayout } from '@/components/shell/app-layout'
import { BookOpen, Video, FileText, Code, Users, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'

const learningContent = [
  {
    category: 'Getting Started',
    icon: Lightbulb,
    items: [
      { title: 'Platform Overview', type: 'article', duration: '5 min' },
      { title: 'How to List Properties', type: 'video', duration: '10 min' },
      { title: 'Understanding Commission Structure', type: 'article', duration: '8 min' },
    ],
  },
  {
    category: 'Technical Integration',
    icon: Code,
    items: [
      { title: 'REST API Guide', type: 'documentation', duration: 'N/A' },
      { title: 'Webhook Setup', type: 'video', duration: '12 min' },
      { title: 'Error Handling Best Practices', type: 'article', duration: '10 min' },
    ],
  },
  {
    category: 'Business Growth',
    icon: BookOpen,
    items: [
      { title: 'Marketing Your Properties', type: 'article', duration: '12 min' },
      { title: 'Investor Management', type: 'video', duration: '15 min' },
      { title: 'Maximizing ROI', type: 'article', duration: '10 min' },
    ],
  },
  {
    category: 'Compliance & Regulations',
    icon: FileText,
    items: [
      { title: 'REIT Regulations', type: 'article', duration: '15 min' },
      { title: 'Tax Implications', type: 'article', duration: '12 min' },
      { title: 'Investor Disclosures', type: 'documentation', duration: 'N/A' },
    ],
  },
]

export default function DevLearnPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Developer Resources</h1>
          <p className="text-muted-foreground mt-1">
            Learn best practices and technical guides for growing your properties
          </p>
        </div>

        {/* Featured */}
        <div className="bg-gradient-to-r from-primary/20 to-card border border-primary/30 rounded-xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Complete Developer Guide</h2>
          <p className="text-muted-foreground">
            Everything you need to know about listing properties and managing investors on Milestono
          </p>
          <Button className="bg-primary hover:bg-blue-600 text-white">
            Read Full Guide
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

        {/* Tools */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Developer Tools</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'API Documentation', desc: 'Complete API reference' },
              { title: 'Code Samples', desc: 'Ready-to-use code examples' },
              { title: 'SDKs & Libraries', desc: 'Download SDKs for your language' },
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

        {/* Support */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Support & Community</h2>
          </div>
          <p className="text-muted-foreground">
            Get help from our support team or connect with other developers
          </p>
          <div className="flex gap-3">
            <Button className="flex-1 bg-primary hover:bg-blue-600 text-white">
              Contact Support
            </Button>
            <Button className="flex-1 bg-card border border-border hover:border-primary/40 text-primary">
              Join Community
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

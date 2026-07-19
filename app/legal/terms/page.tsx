import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-8 text-muted-foreground">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p>
                Milestono Investors (&quot;Platform&quot;) provides fractional real estate investment opportunities.
                By accessing and using this platform, you agree to be bound by these terms and conditions. These terms
                apply to all users of the platform, whether they are investors or developers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. User Eligibility</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Must be at least 18 years old</li>
                <li>Must be a legal resident of India</li>
                <li>Must complete KYC (Know Your Customer) verification</li>
                <li>Must comply with all applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Investment Risks</h2>
              <p className="mb-4">
                Real estate investment involves significant risks. Past performance is not indicative of future results.
                The value of your investment can fluctuate and you may lose some or all of your invested capital.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Market risk: Property values may decrease</li>
                <li>Liquidity risk: You may not be able to sell units immediately</li>
                <li>Rental risk: Tenants may default on rent payments</li>
                <li>Interest rate risk: Changes in interest rates may affect property values</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Fee Structure</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>GST on Investment</span>
                  <span className="font-semibold">5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Commission</span>
                  <span className="font-semibold">Variable (Developer-defined)</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Maintenance Fee</span>
                  <span className="font-semibold">0% - 1% (Varies by property)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Milestono Investors shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, including lost profits, arising from your use
                of the platform or investment decisions made through the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Governing Law</h2>
              <p>
                These terms are governed by and construed in accordance with the laws of India, without regard to its
                conflict of law principles. You agree to submit to the exclusive jurisdiction of the courts in India.
              </p>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground border-t border-border pt-8">
            <p>Last Updated: June 2026</p>
            <p>© 2026 Milestono Investors. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

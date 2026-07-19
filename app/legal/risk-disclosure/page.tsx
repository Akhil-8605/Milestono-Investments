import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
          <h1 className="text-4xl font-bold">Risk Disclosure</h1>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            IMPORTANT: Real estate investment involves significant risks. Please read this disclosure carefully before
            investing.
          </p>
        </div>

        <div className="space-y-8 text-muted-foreground">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Market Risk</h2>
              <p>
                Real estate property values fluctuate based on market conditions, interest rates, economic factors,
                and supply-demand dynamics. The value of your investment may decrease, and you could lose some or all
                of your invested capital.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Liquidity Risk</h2>
              <p>
                Unlike stocks, real estate units may not be easily or quickly converted to cash. There may be limited
                buyers for units, and the selling process could take weeks or months. You may be unable to access your
                funds when needed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Rental/Income Risk</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Tenants may default on rent payments</li>
                <li>Properties may remain vacant for extended periods</li>
                <li>Expected rental yields may not materialize</li>
                <li>Occupancy rates can fluctuate based on market conditions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Interest Rate Risk</h2>
              <p>
                Changes in interest rates can impact property values and rental demand. Rising interest rates may reduce
                property valuations, while falling rates may increase demand but lower returns.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Development Risk</h2>
              <p>
                Projects may experience delays, cost overruns, or may not complete as planned. This could impact
                property values and expected returns. Construction defects or poor quality may affect property value.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Regulatory & Legal Risk</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Changes in real estate laws and regulations</li>
                <li>Tax policy changes affecting real estate investments</li>
                <li>Legal disputes involving property ownership</li>
                <li>Environmental or compliance issues with properties</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Concentration Risk</h2>
              <p>
                Investing heavily in single properties or geographic locations increases risk. Economic downturns in
                specific regions or property types could significantly impact your portfolio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Platform Risk</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Technical issues or system failures may prevent access to your investments</li>
                <li>Cyber attacks or data breaches could compromise your information</li>
                <li>Changes to platform policies or operations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Tax Implications</h2>
              <p className="mb-4">
                Real estate investments have various tax implications:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Capital gains tax on appreciation</li>
                <li>Income tax on rental yields</li>
                <li>GST (5%) on initial investment</li>
                <li>Tax implications of selling units</li>
              </ul>
              <p className="mt-4 text-sm">
                Consult a tax professional for your specific tax situation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Past Performance</h2>
              <p>
                Historical performance or projections are not guarantees of future results. Models and projections used
                on this platform are based on assumptions that may not materialize.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Acknowledgment</h2>
              <p className="text-sm">
                By investing through Milestono Investors, you acknowledge that you have read, understood, and accept
                these risks. You confirm that you have the financial capacity to invest and sustain potential losses.
                You should not invest funds you cannot afford to lose.
              </p>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground border-t border-border pt-8">
            <p>Last Updated: June 2026</p>
            <p>© 2026 Milestono Investors. All rights reserved.</p>
            <p className="mt-4">
              For support or questions, contact: support@milestono.com
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

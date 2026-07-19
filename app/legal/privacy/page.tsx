import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-8 text-muted-foreground">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p className="mb-4">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Personal Information: Name, email, phone, address, date of birth</li>
                <li>Financial Information: Bank account details, investment history, transactions</li>
                <li>KYC Information: Government ID, PAN, Aadhaar (where applicable)</li>
                <li>Usage Data: IP address, browser type, pages visited, time spent</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To verify your identity and comply with KYC requirements</li>
                <li>To process investments and transactions</li>
                <li>To provide customer support</li>
                <li>To send marketing communications (with your consent)</li>
                <li>To comply with legal and regulatory requirements</li>
                <li>To improve our platform and services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information, including
                encryption, secure servers, and regular security audits. However, no method of transmission over the
                internet is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Third-Party Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. However, we may share your
                information with:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Service providers who assist in operating our platform</li>
                <li>Payment processors (Razorpay) for transaction processing</li>
                <li>Legal authorities when required by law</li>
                <li>Property developers for investment documentation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Cookie Policy</h2>
              <p>
                We use cookies and similar technologies to enhance your experience on our platform. You can control
                cookie settings through your browser preferences. Disabling cookies may limit some platform
                functionality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at
                privacy@milestono.com
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

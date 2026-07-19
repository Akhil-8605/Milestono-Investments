import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from '@/components/shell/session-context'
import { ThemeProvider } from '@/components/shell/theme-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'Milestono Investors', template: '%s | Milestono Investors' },
  description: 'India\'s premier fractional real estate exchange — invest in premium properties like stocks.',
  keywords: ['real estate', 'fractional investment', 'property exchange', 'milestono'],
  generator: 'v0.app',
}

export const viewport = {
  themeColor: '#0d0f14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`bg-background ${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <SessionProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

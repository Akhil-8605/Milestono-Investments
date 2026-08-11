'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#09090b',
          color: '#fafafa',
        }}>
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            {/* Icon */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px',
            }}>
              <AlertTriangle style={{ width: '36px', height: '36px', color: '#ef4444' }} />
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.025em' }}>
              Critical Error
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
              A critical application error occurred. Please try reloading the page.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={reset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: '#3b82f6',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '280px',
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fafafa',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '280px',
                }}
              >
                <Home style={{ width: '16px', height: '16px' }} />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Milestono Error Boundary]:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-rose-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while loading this page. This has been logged and we&apos;re working on it.
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <div className="mt-4 p-4 bg-muted/50 border border-border rounded-xl text-left max-h-32 overflow-auto">
              <p className="text-xs font-mono text-rose-500 break-all">{error.message}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all hover:scale-[1.02] w-full sm:w-auto justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-muted border border-border text-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-all w-full sm:w-auto justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-muted border border-border text-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-all w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Go Home
          </a>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go back to previous page
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, TrendingUp, Shield, Building2, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STATS: any[] = []

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Stock-Exchange Style Trading',
    desc: 'Buy and sell fractional property units like shares with real-time price discovery.',
  },
  {
    icon: Building2,
    title: 'Premium Real Estate Access',
    desc: 'Invest in Grade-A commercial, residential & industrial properties from ₹42,000.',
  },
  {
    icon: Shield,
    title: 'SEBI-Compliant Platform',
    desc: 'RERA registered, KYC verified, and fully compliant with Indian investment regulations.',
  },
]

const TICKERS: any[] = []

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const user = {
          id: payload._id,
          name: payload.email.split('@')[0],
          email: payload.email,
          role: payload.role || 'investor',
        }
        sessionStorage.setItem('milestono_user', JSON.stringify(user))
        sessionStorage.setItem('milestono_token', token)
        
        // Check profile
        fetch(`/api/profile?userId=${user.id}`)
          .then(res => res.json())
          .then(profileRes => {
            if (profileRes.success) {
              if (user.role === 'developer') router.push('/developer/dashboard')
              else if (user.role === 'admin') router.push('/admin/dashboard')
              else router.push('/investor/dashboard')
            } else {
              router.push('/onboarding')
            }
          })
          .catch(() => router.push('/onboarding'))
      } catch (e) {
        setError('Invalid login token from Google')
      }
    }
  }, [searchParams, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error || 'Login failed'); return }

      sessionStorage.setItem('milestono_user', JSON.stringify(json.data.user))
      sessionStorage.setItem('milestono_token', json.data.token)

      const role = json.data.user.role
      
      // Check profile
      const profileRes = await fetch(`/api/profile?userId=${json.data.user.id}`)
      const profileJson = await profileRes.json()

      if (profileJson.success) {
        if (role === 'developer') router.push('/developer/dashboard')
        else if (role === 'admin') router.push('/admin/dashboard')
        else router.push('/investor/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Ticker bar */}
      <div className="border-b border-border bg-sidebar px-4 py-1.5 flex items-center gap-6 overflow-hidden">
        <span className="text-primary font-bold text-xs shrink-0 tracking-widest">MILESTONO</span>
        <div className="flex items-center gap-5 flex-1 overflow-hidden">
          {TICKERS.map((t) => (
            <span key={t.sym} className="flex items-center gap-1.5 shrink-0 text-xs">
              <span className="text-foreground font-medium">{t.sym}</span>
              <span className="text-muted-foreground num">{t.price}</span>
              <span className={t.up ? 'text-gain' : 'text-loss'}>{t.chg}</span>
            </span>
          ))}
        </div>
        <span className="shrink-0 text-muted-foreground text-xs">NSE &bull; {time}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1">
        {/* Left — value prop */}
        <div className="hidden lg:flex flex-col justify-between w-[55%] p-14 border-r border-border">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 size={17} className="text-primary-foreground" />
            </div>
            <div>
              <div className="text-foreground font-bold text-sm leading-none tracking-tight">Milestono</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-[0.15em] mt-0.5">Investors</div>
            </div>
          </div>

          {/* Hero */}
          <div className="space-y-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-blue-500 text-[11px] font-medium px-3 py-1 rounded-full border border-primary/20">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                India&apos;s Premier Real Estate Exchange
              </div>
              <h1 className="text-[2.6rem] font-bold text-foreground leading-[1.15] text-balance">
                Invest in Properties<br />Like You Trade Stocks
              </h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md">
                Fractional ownership of Grade-A properties. Real-time price discovery. Liquidity like never before in real estate.
              </p>
            </div>

            <div className="space-y-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={15} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-foreground text-sm font-semibold">{title}</div>
                    <div className="text-muted-foreground text-xs leading-relaxed mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 border-t border-border pt-6">
            {STATS.map(({ label, value }) => (
              <div key={label}>
                <div className="text-foreground text-xl font-bold num">{value}</div>
                <div className="text-muted-foreground text-[11px] mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[360px] space-y-7">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Building2 size={17} className="text-primary-foreground" />
              </div>
              <div>
                <div className="text-foreground font-bold text-sm">Milestono Investors</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-widest">Real Estate Exchange</div>
              </div>
            </div>

            <div>
              <h2 className="text-foreground text-xl font-semibold">Welcome back</h2>
              <p className="text-muted-foreground text-sm mt-1">Sign in with your Milestono account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">Password</label>
                  <button type="button" className="text-[11px] text-primary hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    className="h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground pr-10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded bg-loss/10 border border-loss/25 text-loss text-xs px-3 py-2.5">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-blue-600 text-primary-foreground font-semibold gap-2 transition-colors"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight size={15} /></>}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-border text-foreground hover:bg-muted"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              By signing in you agree to our{' '}
              <a href="/legal/terms" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

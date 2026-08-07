'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, TrendingUp, Shield, Building2, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'

const AVERAGE_YIELD = '9.4%'

const formatCompactIndianCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`
  return `₹${value.toLocaleString('en-IN')}`
}

const getPropertyValue = (property: any) => {
  const price = property.marketData?.currentPrice ?? property.unitPrice ?? 0
  const units = property.totalUnits ?? 0
  return price * units
}

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


import { AnimatedNumber } from '@/components/ui/animated-counter'
import { Suspense } from 'react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState('')
  const [stats, setStats] = useState([
    { label: 'AUM', value: '—' },
    { label: 'Properties', value: '—' },
    { label: 'Avg. Yield', value: AVERAGE_YIELD },
    { label: 'Investors', value: '—' },
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const json = await res.json()
        if (json.success) {
          const { totalAum, propertyCount, investorCount } = json.data
          setStats([
            { label: 'AUM', value: formatCompactIndianCurrency(totalAum) },
            { label: 'Properties', value: propertyCount.toLocaleString('en-IN') },
            { label: 'Avg. Yield', value: AVERAGE_YIELD },
            { label: 'Investors', value: investorCount.toLocaleString('en-IN') },
          ])
        }
      } catch (e) {
        console.error('Failed to fetch stats', e)
      }
    }
    fetchStats()
    const statsInterval = setInterval(fetchStats, 10000)

    return () => {
      clearInterval(statsInterval)
    }
  }, [])

  const handleSuccessAuth = async (user: any) => {
    const token = await user.getIdToken()
    const userData = {
      id: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || ''
    }

    const expiresAt = new Date().getTime() + 7 * 24 * 60 * 60 * 1000
    localStorage.setItem('milestono_token', token)
    localStorage.setItem('milestono_user', JSON.stringify(userData))
    localStorage.setItem('milestono_expires_at', expiresAt.toString())

    try {
      const res = await fetch(`/api/profile?userId=${user.uid}`)
      const json = await res.json()
      if (json.success && json.data?.profileCompleted) {
        toast.success(`Welcome back, ${json.data.companyName || json.data.fullName || 'User'}!`)
        if (json.data.role === 'admin') {
          router.push('/admin/properties')
        } else if (json.data.role === 'developer') {
          router.push('/developer/dashboard')
        } else {
          router.push('/investor/dashboard')
        }
      } else {
        // If Google user and first time, redirect to add password
        if (user.providerData.some((p: any) => p.providerId === 'google.com') && !json.success) {
          toast.success('Google sign in successful! Please set a password for future use.')
          router.push('/auth/add-password')
          return
        }
        toast.success('Account verified! Let\'s complete your profile.')
        router.push('/onboarding')
      }
    } catch {
      if (user.providerData.some((p: any) => p.providerId === 'google.com')) {
        router.push('/auth/add-password')
      } else {
        router.push('/onboarding')
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await handleSuccessAuth(result.user)
    } catch (err: any) {
      console.error('Google Auth Error:', err)
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      await handleSuccessAuth(res.user)
    } catch (err: any) {
      console.error('Login Error:', err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password')
      } else {
        setError(err.message || 'Connection error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

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
            {stats.map(({ label, value }) => (
              <div key={label}>
                <AnimatedNumber value={value} />
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

              {error ? (
                <div className="rounded bg-loss/10 border border-loss/25 text-loss text-xs px-3 py-2.5">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-11 bg-primary hover:bg-blue-600 text-primary-foreground font-semibold gap-2 transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading ? <ArrowRight size={15} /> : null}
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
              className="w-full h-11 border-border text-foreground hover:bg-muted gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Sign in with Google
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
                Create Account
              </Link>
            </p>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

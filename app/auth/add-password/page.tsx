'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { updatePassword } from 'firebase/auth'
import { ShieldCheck, ChevronRight, Loader2, Lock, EyeOff, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AddPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If no user is signed in, redirect back to login
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        router.push('/auth/login')
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const user = auth.currentUser
    if (!user) {
      setError('You must be signed in to set a password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await updatePassword(user, password)
      toast.success('Password set successfully!')
      router.push('/onboarding')
    } catch (err: any) {
      console.error('Error setting password:', err)
      setError(err.message || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-violet-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-6 lg:space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">Secure Your Account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            You signed in with Google. Set a password now so you can also log in using your email and password in the future.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-muted/50"
                  required
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-muted/50"
                  required
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-4 font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set Password'}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="w-full text-muted-foreground hover:text-foreground mt-2"
            >
              Skip for now
            </Button>
          </form>
        </div>

      </div>
    </div>
  )
}

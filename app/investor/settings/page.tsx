'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from '@/components/shell/session-context'
import { auth } from '@/lib/firebase'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { toast } from 'sonner'
import { Settings, Shield, Bell, Lock, KeyRound, Loader2, User, Mail, UserCog } from 'lucide-react'

export default function InvestorSettingsPage() {
  const { user } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser || !currentUser.email) {
      toast.error('Authentication error. Please log in again.')
      return
    }

    setIsLoading(true)
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, newPassword)
      
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Password change error', error)
      if (error.code === 'auth/invalid-credential') {
        toast.error('Incorrect current password')
      } else {
        toast.error(error.message || 'Failed to update password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout requiredRole="investor" title="Settings">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/10 via-background/80 to-background pointer-events-none -z-10" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
        
        <div className="flex items-center gap-4 border-b border-border/50 pb-8">
          <div className="p-3 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground mt-2 font-medium">Manage your security preferences and profile details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Nav */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-bold">
              <Shield className="w-5 h-5" /> Security
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted/50 rounded-xl font-medium cursor-not-allowed opacity-50">
              <Bell className="w-5 h-5" /> Notifications (Coming Soon)
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Profile Overview Card */}
            <Card className="p-6 md:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-primary/20 border-4 border-background flex items-center justify-center text-primary text-3xl font-bold shadow-lg shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight">{user?.name || 'Investor'}</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                      <Mail className="w-4 h-4" /> {user?.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                      <UserCog className="w-4 h-4" /> Investor Account
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Password Change Card */}
            <Card className="p-6 md:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Change Password</h3>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      required 
                      className="pl-10 h-11 rounded-xl bg-background/50 backdrop-blur border-border/50" 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      required 
                      minLength={6}
                      className="pl-10 h-11 rounded-xl bg-background/50 backdrop-blur border-border/50" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      required 
                      minLength={6}
                      className="pl-10 h-11 rounded-xl bg-background/50 backdrop-blur border-border/50" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all mt-4"
                >
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Updating...</> : 'Update Password'}
                </Button>
              </form>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}

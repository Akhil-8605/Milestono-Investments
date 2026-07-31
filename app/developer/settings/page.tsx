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
import { Settings, Shield, Bell, Lock, KeyRound, Loader2, Building, Mail, UserCog, ShieldCheck } from 'lucide-react'
import { DeveloperIdCard } from '@/components/developer/DeveloperIdCard'
import { useEffect } from 'react'

export default function DeveloperSettingsPage() {
  const { user } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/profile?userId=${user.id}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setProfile(json.data)
        })
    }
  }, [user])

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
    <AppLayout requiredRole="developer" title="Settings">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
        
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Developer Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your security preferences and enterprise profile details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-primary/10 text-primary rounded-md font-semibold text-sm">
              <Shield className="w-4 h-4" /> Security
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted/50 rounded-md font-medium text-sm cursor-not-allowed opacity-50">
              <Bell className="w-4 h-4" /> Notifications <span className="text-[10px] uppercase ml-auto">Soon</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Profile Overview Card */}
            <Card className="p-6 border shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                  <Building className="w-8 h-8" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">{user?.name || 'Developer Company'}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Mail className="w-4 h-4" /> {user?.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <UserCog className="w-4 h-4" /> Developer Account
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Password Change Card */}
            <Card className="p-6 border shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Change Password</h3>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      required 
                      className="pl-9 h-10 rounded-lg text-sm" 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      required 
                      minLength={6}
                      className="pl-9 h-10 rounded-lg text-sm" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      required 
                      minLength={6}
                      className="pl-9 h-10 rounded-lg text-sm" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-10 rounded-lg font-semibold mt-2"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...</> : 'Update Password'}
                </Button>
              </form>
            </Card>

            {/* Developer ID Card */}
            {profile && (
              <Card className="p-6 border shadow-sm flex flex-col items-center">
                <div className="flex items-center gap-2 mb-6 border-b pb-4 self-stretch">
                  <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">Developer ID Card</h3>
                </div>
                <div className="w-full overflow-x-auto pb-4 scrollbar-hide flex justify-center">
                  <DeveloperIdCard
                    developerId={profile?.developerId || 'MI-DEV-TBD'}
                    companyName={profile?.companyName || 'Company Name'}
                    yearsEstablished={profile?.yearEstablished ? `${new Date().getFullYear() - parseInt(profile.yearEstablished)} Years` : '10+ Years'}
                    mobileNumber={profile?.companyPhone || '-'}
                    officeAddress={profile?.officeAddress || '-'}
                    companyBanner={profile?.banner}
                  />
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  )
}

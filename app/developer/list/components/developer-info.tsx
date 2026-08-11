import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { Building, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from '@/components/shell/session-context'

export default function DeveloperInfo({ developerId }: { developerId: string }) {
  const { register, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  const { user } = useSession()
  const [fetchedId, setFetchedId] = useState(developerId || '')
  
  useEffect(() => {
    let isSubscribed = true
    const activeUserId = user?.id || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('milestono_user') || '{}')?.id)

    const raw = typeof window !== 'undefined' ? localStorage.getItem('milestono_user') : null
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setValue('developerInfo.companyName', parsed.name || user?.name || '', { shouldValidate: true })
        setValue('developerInfo.email', parsed.email || user?.email || '', { shouldValidate: true })
      } catch (e) {
        console.warn('[DeveloperInfo] Failed to parse milestono_user from localStorage:', e)
      }
    }

    const loadProfileDevId = async () => {
      if (!activeUserId) return
      try {
        const res = await fetch(`/api/profile?userId=${activeUserId}`)
        const json = await res.json()
        if (json.success && json.data?.developerId && isSubscribed) {
          setFetchedId(json.data.developerId)
          setValue('developerInfo.developerId', json.data.developerId, { shouldValidate: true })
        } else if (developerId && isSubscribed) {
          setValue('developerInfo.developerId', developerId, { shouldValidate: true })
        } else if (isSubscribed) {
          const fallback = `DEV${activeUserId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, '0')}`
          setFetchedId(fallback)
          setValue('developerInfo.developerId', fallback, { shouldValidate: true })
        }
      } catch (err) {
        console.error('Error fetching developer profile ID:', err)
        if (developerId && isSubscribed) {
          setValue('developerInfo.developerId', developerId, { shouldValidate: true })
        }
      }
    }

    loadProfileDevId()
    return () => { isSubscribed = false }
  }, [developerId, user, setValue])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary border-b pb-4">
        <Building className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-foreground">Developer Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company Name *</label>
          <Input 
            {...register('developerInfo.companyName')} 
            className="h-11 bg-muted/50 text-foreground"
            readOnly
          />
          <p className="text-[10px] text-muted-foreground">Auto-filled from your profile</p>
          {errors.developerInfo?.companyName && <p className="text-[10px] text-red-500">{errors.developerInfo.companyName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Developer ID *</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground normal-case font-normal">
              <Lock className="w-3 h-3 text-emerald-500" /> System Assigned
            </span>
          </label>
          <Input 
            {...register('developerInfo.developerId')} 
            disabled
            readOnly
            className="h-11 bg-muted/70 text-foreground font-mono font-bold uppercase cursor-not-allowed opacity-90 border-emerald-500/30"
          />
          <p className="text-[10px] text-emerald-600 font-medium">Auto-fetched from developer profile (read-only)</p>
          {errors.developerInfo?.developerId && <p className="text-[10px] text-red-500">{errors.developerInfo.developerId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Person *</label>
          <Input 
            {...register('developerInfo.contactPerson')} 
            placeholder="e.g. John Doe" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.developerInfo?.contactPerson && <p className="text-[10px] text-red-500">{errors.developerInfo.contactPerson.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Number *</label>
          <Input 
            {...register('developerInfo.mobile')} 
            placeholder="e.g. 9876543210" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.developerInfo?.mobile && <p className="text-[10px] text-red-500">{errors.developerInfo.mobile.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address *</label>
          <Input 
            {...register('developerInfo.email')} 
            placeholder="e.g. contact@company.com" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.developerInfo?.email && <p className="text-[10px] text-red-500">{errors.developerInfo.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website (Optional)</label>
          <Input 
            {...register('developerInfo.website')} 
            placeholder="https://www.company.com" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.developerInfo?.website && <p className="text-[10px] text-red-500">{errors.developerInfo.website.message}</p>}
        </div>
      </div>
    </div>
  )
}

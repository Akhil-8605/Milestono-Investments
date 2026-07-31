import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { Building } from 'lucide-react'
import { useEffect } from 'react'

export default function DeveloperInfo({ developerId }: { developerId: string }) {
  const { register, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  
  useEffect(() => {
    const raw = sessionStorage.getItem('milestono_user')
    if (raw) {
      const parsed = JSON.parse(raw)
      setValue('developerInfo.companyName', parsed.name || '', { shouldValidate: true })
      setValue('developerInfo.email', parsed.email || '', { shouldValidate: true })
      if (developerId) {
        setValue('developerInfo.developerId', developerId, { shouldValidate: true })
      }
    }
  }, [developerId, setValue])

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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Developer ID *</label>
          <Input 
            {...register('developerInfo.developerId')} 
            className="h-11 bg-muted/50 text-foreground font-mono uppercase"
          />
          <p className="text-[10px] text-muted-foreground">Unique identifier assigned to your company</p>
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

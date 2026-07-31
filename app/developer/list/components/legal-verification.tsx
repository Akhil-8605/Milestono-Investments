import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Upload, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function LegalVerification() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  const ownershipProofUrl = watch('legalVerification.ownershipProofUrl')
  const taxReceiptsUrl = watch('legalVerification.taxReceiptsUrl')
  const occupancyCertificateUrl = watch('legalVerification.occupancyCertificateUrl')

  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingField(field)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) {
        setValue(`legalVerification.${field}` as any, json.url, { shouldValidate: true })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingField(null)
    }
  }

  const renderUploadBox = (label: string, field: string, value: string | undefined, req: boolean = false) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label} {req && '*'}</label>
      <label className="block border border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20 relative overflow-hidden group">
        <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => handleFileUpload(e, field)} />
        {uploadingField === field ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[10px]">Uploading...</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center gap-2">
            {value.includes('.pdf') ? (
               <FileText className="w-8 h-8 text-primary" />
            ) : (
               <img src={value} alt={label} className="h-16 w-full object-cover rounded-md" />
            )}
            <span className="text-[10px] text-emerald-500 font-semibold">Uploaded</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <Upload className="w-6 h-6 group-hover:text-primary transition-colors" />
            <span className="text-[11px] font-medium">Click to upload document</span>
          </div>
        )}
      </label>
      {(errors.legalVerification as any)?.[field] && <p className="text-[10px] text-red-500">{(errors.legalVerification as any)[field].message}</p>}
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary border-b pb-4">
        <ShieldCheck className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-foreground">Legal & Verification</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RERA Registration Number *</label>
          <Input 
            {...register('legalVerification.reraNumber')} 
            placeholder="e.g. PRM/KA/RERA/1251/446/PR/171014/000401" 
            className="h-11 bg-muted/50 text-foreground uppercase"
          />
          {errors.legalVerification?.reraNumber && <p className="text-[10px] text-red-500">{errors.legalVerification.reraNumber.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Registration Number *</label>
          <Input 
            {...register('legalVerification.propertyRegistrationNumber')} 
            placeholder="e.g. REG-12345678" 
            className="h-11 bg-muted/50 text-foreground uppercase"
          />
          {errors.legalVerification?.propertyRegistrationNumber && <p className="text-[10px] text-red-500">{errors.legalVerification.propertyRegistrationNumber.message}</p>}
        </div>

        {renderUploadBox("Ownership Proof", "ownershipProofUrl", ownershipProofUrl, true)}
        {renderUploadBox("Occupancy Certificate", "occupancyCertificateUrl", occupancyCertificateUrl, true)}
        {renderUploadBox("Tax Receipts (Optional)", "taxReceiptsUrl", taxReceiptsUrl, false)}
      </div>
    </div>
  )
}

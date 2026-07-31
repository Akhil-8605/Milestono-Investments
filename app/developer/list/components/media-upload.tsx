import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Image as ImageIcon, Upload, FileText, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { uploadImage } from '@/lib/upload'

export default function MediaUpload() {
  const { watch, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  const images = watch('media.images') || []
  const masterPlan = watch('media.masterPlan')
  const floorPlan = watch('media.floorPlan')
  const brochurePdf = watch('media.brochurePdf')
  const documentsPdf = watch('media.documentsPdf')

  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, isArray: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingField(field)
    try {
      // Re-using uploadImage which compresses to webp, but for PDFs it might fail or we should handle it
      // if it's a PDF, we might need a different route or just upload it as raw in our mock upload.
      // Assuming uploadImage handles PDFs or we only restrict to images. Wait, `uploadImage` converts to webp.
      // So for PDFs, we should probably upload them directly without conversion.
      // Let's modify or just use a generic fetch to `/api/upload` if it's a PDF.
      let url = null
      
      if (file.type.startsWith('image/')) {
        url = await uploadImage(file)
      } else {
        const formData = new FormData()
        formData.append('image', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (json.success) url = json.url
      }

      if (url) {
        if (isArray) {
          setValue('media.images', [...images, url], { shouldValidate: true })
        } else {
          setValue(`media.${field}` as any, url, { shouldValidate: true })
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingField(null)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setValue('media.images', newImages, { shouldValidate: true })
  }

  const renderUploadBox = (label: string, field: string, value: string | undefined, accept: string = "image/*", isArray: boolean = false) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <label className="block border border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20 relative overflow-hidden group">
        <input type="file" className="hidden" accept={accept} onChange={e => handleFileUpload(e, field, isArray)} />
        {uploadingField === field ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[10px]">Uploading...</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center gap-2">
            {accept.includes('pdf') ? (
               <FileText className="w-8 h-8 text-primary" />
            ) : (
               <img src={value} alt={label} className="h-16 w-full object-cover rounded-md" />
            )}
            <span className="text-[10px] text-emerald-500 font-semibold">Uploaded</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <Upload className="w-6 h-6 group-hover:text-primary transition-colors" />
            <span className="text-[11px] font-medium">Click to upload</span>
          </div>
        )}
      </label>
      {(errors.media as any)?.[field] && <p className="text-[10px] text-red-500">{(errors.media as any)[field].message}</p>}
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary border-b pb-4">
        <ImageIcon className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-foreground">Property Media</h2>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Images (Min 1) *</label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-border group">
              <img src={url} alt={`Property ${i+1}`} className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          <label className="aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20">
            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'images', true)} />
            {uploadingField === 'images' ? (
               <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
               <>
                 <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                 <span className="text-[10px] font-medium text-muted-foreground">Add Image</span>
               </>
            )}
          </label>
        </div>
        {errors.media?.images && <p className="text-[10px] text-red-500">{errors.media.images.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
        {renderUploadBox("Master Plan (Optional)", "masterPlan", masterPlan)}
        {renderUploadBox("Floor Plan (Optional)", "floorPlan", floorPlan)}
        {renderUploadBox("Brochure (PDF) (Optional)", "brochurePdf", brochurePdf, "application/pdf")}
        {renderUploadBox("Other Documents (PDF) (Optional)", "documentsPdf", documentsPdf, "application/pdf")}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { uploadsApi } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Building2, Camera, Loader2 } from 'lucide-react'

interface LogoUploadProps {
  entityType: 'organization' | 'enterprise'
  entityId: string
  currentLogoUrl?: string
  entityName?: string
  onSuccess?: (url: string) => void
}

export function LogoUpload({ entityType, entityId, currentLogoUrl, entityName, onSuccess }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const res = await uploadsApi.uploadLogo(file, entityType, entityId)
      toast({ title: 'Logo mis à jour !', variant: 'success' })
      onSuccess?.(res.data.url)
    } catch {
      toast({ title: 'Erreur upload', variant: 'error' })
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl || currentLogoUrl

  return (
    <div className="relative group cursor-pointer w-20 h-20" onClick={() => !uploading && inputRef.current?.click()}>
      <div className="w-20 h-20 rounded-2xl border-2 border-gray-100 overflow-hidden bg-brand-50 flex items-center justify-center">
        {displayUrl ? (
          <img src={displayUrl} alt={entityName} className="w-full h-full object-cover" />
        ) : (
          <Building2 className="w-8 h-8 text-brand-300" />
        )}
      </div>
      <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}

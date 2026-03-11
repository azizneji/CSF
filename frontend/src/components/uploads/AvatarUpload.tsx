'use client'

import { useRef, useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { uploadsApi } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { getInitials, getAvatarUrl } from '@/lib/utils'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  user: any
  onSuccess?: (url: string) => void
}

export function AvatarUpload({ user, onSuccess }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const res = await uploadsApi.uploadAvatar(file)
      toast({ title: 'Photo de profil mise à jour !', variant: 'success' })
      onSuccess?.(res.data.url)
    } catch {
      toast({ title: 'Erreur upload', variant: 'error' })
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl || getAvatarUrl(user.full_name, user.avatar_url)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group cursor-pointer" onClick={() => !uploading && inputRef.current?.click()}>
        <Avatar className="w-24 h-24 ring-4 ring-brand-100">
          <AvatarImage src={displayUrl} />
          <AvatarFallback className="text-2xl">{getInitials(user.full_name)}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <p className="text-xs text-gray-400">Cliquez pour changer la photo</p>
    </div>
  )
}

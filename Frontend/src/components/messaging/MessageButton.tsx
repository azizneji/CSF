'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { MessageSquare } from 'lucide-react'

type ActorType = 'user' | 'organization' | 'enterprise'

interface MessageButtonProps {
  theirType: ActorType
  theirId: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function MessageButton({
  theirType,
  theirId,
  variant = 'secondary',
  size = 'sm',
  label = 'Message',
}: MessageButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMessage = async () => {
    if (!user) { router.push('/auth/login'); return }
    setLoading(true)
    try {
      const res = await api.post('/messages/conversations', {
        my_type: 'user',
        my_id: user.id,
        their_type: theirType,
        their_id: theirId,
      })
      router.push(`/messages?open=${res.data.conversation_id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleMessage} loading={loading}>
      <MessageSquare className="w-4 h-4" />
      {label}
    </Button>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { getInitials, getAvatarUrl } from '@/lib/utils'
import { ArrowLeft, Crown, Shield, UserX, ChevronDown } from 'lucide-react'

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  owner: { label: 'Propriétaire', color: 'bg-amber-100 text-amber-700' },
  admin: { label: 'Admin', color: 'bg-brand-100 text-brand-700' },
  member: { label: 'Membre', color: 'bg-gray-100 text-gray-600' },
}

export default function GroupMembersPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<any[]>([])
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    try {
      const [groupRes, membersRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/members`),
      ])
      setGroup(groupRes.data)
      setMembers(membersRes.data || [])
    } catch {
      router.push(`/groups/${id}`)
    } finally {
      setLoading(false)
    }
  }

  const isOwner = group?.membership === 'owner'

  const handleKick = async (userId: string, name: string) => {
    if (!confirm(`Exclure ${name} du groupe ?`)) return
    try {
      await api.delete(`/groups/${id}/members/${userId}`)
      toast({ title: `${name} a été exclu`, variant: 'success' })
      setMembers(prev => prev.filter((m: any) => m.user.id !== userId))
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  const handleRoleChange = async (userId: string, role: 'admin' | 'member') => {
    try {
      await api.patch(`/groups/${id}/members/${userId}/role`, { role })
      toast({ title: 'Rôle mis à jour', variant: 'success' })
      setMembers(prev => prev.map((m: any) =>
        m.user.id === userId ? { ...m, role } : m
      ))
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href={`/groups/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au groupe
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">Membres ({members.length})</h1>
        </div>

        <div className="space-y-2">
          {members.map((m: any) => {
            const roleConf = ROLE_CONFIG[m.role] || ROLE_CONFIG.member
            const isMe = m.user.id === user?.id
            const canManage = isOwner && !isMe && m.role !== 'owner'

            return (
              <div key={m.user.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex items-center gap-3">
                <Link href={`/profile/${m.user.id}`}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getAvatarUrl(m.user.full_name, m.user.avatar_url)} />
                    <AvatarFallback>{getInitials(m.user.full_name)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${m.user.id}`}>
                    <p className="font-medium text-sm text-gray-900 hover:text-brand-600">{m.user.full_name}</p>
                  </Link>
                  {m.user.bio && <p className="text-xs text-gray-400 truncate">{m.user.bio}</p>}
                </div>
                <Badge className={roleConf.color}>{roleConf.label}</Badge>

                {canManage && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRoleChange(m.user.id, m.role === 'admin' ? 'member' : 'admin')}
                      title={m.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                    >
                      <Shield className="w-4 h-4 text-brand-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleKick(m.user.id, m.user.full_name)}
                      title="Exclure"
                    >
                      <UserX className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}

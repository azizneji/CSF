'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { connectionsApi, usersApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils'
import {
  Users, Check, X, Trash2, Bell, Link2, Search,
  UserPlus, Building2, Briefcase, ChevronRight, Clock
} from 'lucide-react'

type Tab = 'connections' | 'pending' | 'discover'

function ActorAvatar({ type, name, avatar }: any) {
  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-brand-50 flex items-center justify-center">
      {avatar
        ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
        : type === 'organization' ? <Building2 className="w-5 h-5 text-brand-600" />
        : type === 'enterprise' ? <Briefcase className="w-5 h-5 text-sand-600" />
        : <div className="w-full h-full flex items-center justify-center bg-blue-50">
            <span className="text-xs font-bold text-blue-600">{getInitials(name)}</span>
          </div>}
    </div>
  )
}

export default function ConnectionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('connections')
  const [connections, setConnections] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [discover, setDiscover] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    Promise.all([
      connectionsApi.getForActor(user.id),
      connectionsApi.getPending(),
      usersApi.getAll(),
    ]).then(([connRes, pendingRes, usersRes]) => {
      setConnections(connRes.data || [])
      setPending(pendingRes.data || [])
      // Discover: all users not already connected
      const connectedIds = new Set([
        ...(connRes.data || []).map((c: any) =>
          c.requester_id === user.id ? c.target_id : c.requester_id),
        ...(pendingRes.data || []).map((p: any) => p.requester_id),
        user.id,
      ])
      setDiscover((usersRes.data?.data || usersRes.data || [])
        .filter((u: any) => !connectedIds.has(u.id)))
    }).finally(() => setLoading(false))
  }, [user])

  const handleRespond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await connectionsApi.respond(id, status)
      setPending(prev => prev.filter(p => p.id !== id))
      toast({
        title: status === 'accepted' ? '✅ Connexion acceptée !' : 'Connexion refusée',
        variant: status === 'accepted' ? 'success' : 'default'
      })
    } catch {
      toast({ title: 'Erreur', variant: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette connexion ?')) return
    await connectionsApi.delete(id)
    setConnections(prev => prev.filter(c => c.id !== id))
    toast({ title: 'Connexion supprimée' })
  }

  const handleConnect = async (targetId: string) => {
    try {
      await connectionsApi.request({
        requester_type: 'user',
        requester_id: user!.id,
        target_type: 'user',
        target_id: targetId,
      })
      setDiscover(prev => prev.filter(u => u.id !== targetId))
      toast({ title: 'Demande envoyée !', variant: 'success' })
    } catch {
      toast({ title: 'Erreur', variant: 'error' })
    }
  }

  const filteredConnections = connections.filter(c => {
    if (!search) return true
    const name = c.target_profile?.full_name || c.requester_profile?.full_name || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const filteredDiscover = discover.filter(u => {
    if (!search) return true
    return (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
           (u.email || '').toLowerCase().includes(search.toLowerCase())
  })

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'connections', label: 'Mes connexions',  count: connections.length },
    { id: 'pending',     label: 'En attente',       count: pending.length },
    { id: 'discover',    label: 'Découvrir',        count: undefined },
  ]

  if (authLoading || loading) return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Connexions</h1>
          <p className="text-gray-500">Gérez vos connexions et développez votre réseau.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                  t.id === 'pending' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {t.count > 9 ? '9+' : t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-5">
          <Input
            placeholder={tab === 'discover' ? "Rechercher une personne..." : "Filtrer par nom..."}
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* ── Connections tab ───────────────────────────────── */}
        {tab === 'connections' && (
          <div>
            {filteredConnections.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {search ? 'Aucun résultat pour cette recherche' : 'Aucune connexion pour le moment'}
                </p>
                {!search && (
                  <button onClick={() => setTab('discover')} className="mt-3 text-sm text-brand-600 hover:underline">
                    Découvrir des personnes →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConnections.map((c: any) => {
                  const isRequester = c.requester_id === user!.id
                  const profile = isRequester ? c.target_profile : c.requester_profile
                  const otherId = isRequester ? c.target_id : c.requester_id
                  const name = profile?.full_name || 'Membre'
                  const avatar = profile?.avatar_url

                  return (
                    <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-soft p-4 flex items-center gap-3">
                      <Link href={`/profile/${otherId}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={getAvatarUrl(name, avatar)} />
                          <AvatarFallback className="text-sm">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Connecté le {formatDate(c.updated_at)}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/profile/${otherId}`}>
                          <Button size="sm" variant="secondary">
                            Profil <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Pending tab ───────────────────────────────────── */}
        {tab === 'pending' && (
          <div>
            {pending.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((p: any) => {
                  const profile = p.requester_profile
                  const name = profile?.full_name || 'Quelqu\'un'

                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-soft p-4 flex items-center gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={getAvatarUrl(name, profile?.avatar_url)} />
                        <AvatarFallback className="text-sm">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{name}</p>
                        <p className="text-xs text-gray-400">
                          {profile?.email || 'Demande de connexion'} · {formatDate(p.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => handleRespond(p.id, 'accepted')}>
                          <Check className="w-3.5 h-3.5" /> Accepter
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRespond(p.id, 'rejected')}>
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Discover tab ──────────────────────────────────── */}
        {tab === 'discover' && (
          <div>
            {filteredDiscover.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <UserPlus className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {search ? 'Aucun résultat' : 'Vous êtes connecté à tous les membres !'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDiscover.slice(0, 30).map((u: any) => (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-soft p-4 flex items-center gap-3">
                    <Link href={`/profile/${u.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={getAvatarUrl(u.full_name, u.avatar_url)} />
                        <AvatarFallback className="text-sm">{getInitials(u.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {u.bio ? u.bio.slice(0, 50) + (u.bio.length > 50 ? '…' : '') : u.email}
                        </p>
                      </div>
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => handleConnect(u.id)} className="flex-shrink-0">
                      <UserPlus className="w-3.5 h-3.5" /> Connecter
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

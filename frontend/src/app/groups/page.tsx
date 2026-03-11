'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { getAvatarUrl } from '@/lib/utils'
import { Users, Plus, Search, Lock, Eye, EyeOff, CheckCircle, Globe } from 'lucide-react'

const VISIBILITY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  public:   { label: 'Public',    icon: Globe,       color: 'text-green-600 bg-green-50' },
  approval: { label: 'Sur approbation', icon: CheckCircle, color: 'text-amber-600 bg-amber-50' },
  private:  { label: 'Privé',    icon: Lock,        color: 'text-red-600 bg-red-50' },
  hidden:   { label: 'Caché',    icon: EyeOff,      color: 'text-gray-600 bg-gray-50' },
}

export default function GroupsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [groups, setGroups] = useState<any[]>([])
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'discover' | 'mine'>('discover')

  useEffect(() => {
    fetchGroups()
    if (user) fetchMyGroups()
  }, [user])

  const fetchGroups = async (q = '') => {
    setLoading(true)
    try {
      const res = await api.get('/groups', { params: { search: q || undefined } })
      setGroups(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  const fetchMyGroups = async () => {
    try {
      const res = await api.get('/groups/mine')
      setMyGroups(res.data || [])
    } catch {}
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchGroups(search)
  }

  const displayGroups = tab === 'mine' ? myGroups : groups

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Groupes</h1>
            <p className="text-gray-500 mt-1">Rejoignez des espaces de discussion privés</p>
          </div>
          {user && (
            <Link href="/groups/create">
              <Button><Plus className="w-4 h-4" /> Créer un groupe</Button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
            {[
              { key: 'discover', label: 'Découvrir' },
              { key: 'mine', label: 'Mes groupes' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        {tab === 'discover' && (
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un groupe..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>
        )}

        {/* Groups grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-44 animate-pulse" />
            ))}
          </div>
        ) : displayGroups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">
              {tab === 'mine' ? "Vous n'êtes membre d'aucun groupe." : 'Aucun groupe trouvé.'}
            </p>
            {user && (
              <Link href="/groups/create" className="mt-4 inline-block">
                <Button variant="secondary">Créer le premier groupe</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayGroups.map((group: any) => {
              const vis = VISIBILITY_CONFIG[group.visibility] || VISIBILITY_CONFIG.public
              const VisIcon = vis.icon
              return (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-card transition-shadow overflow-hidden card-lift h-full flex flex-col">
                    {/* Cover */}
                    <div className="h-24 bg-gradient-to-br from-brand-500 to-brand-700 relative overflow-hidden">
                      {group.cover_url && (
                        <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${vis.color}`}>
                        <VisIcon className="w-3 h-3" />
                        {vis.label}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-display font-bold text-gray-900 mb-1 truncate">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 flex-1">{group.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {group.member_count} membre{group.member_count !== 1 ? 's' : ''}
                        </span>
                        {group.membership && (
                          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full capitalize">
                            {group.membership}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

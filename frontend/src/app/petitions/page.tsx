'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { FileText, Plus, Search, Target, Users, Clock, CheckCircle2, XCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active:       { label: 'Active',           color: 'text-green-700 bg-green-50 border-green-200',  icon: Clock },
  goal_reached: { label: 'Objectif atteint', color: 'text-brand-700 bg-brand-50 border-brand-200',  icon: CheckCircle2 },
  closed:       { label: 'Clôturée',         color: 'text-gray-600 bg-gray-50 border-gray-200',     icon: XCircle },
}

export default function PetitionsPage() {
  const { user } = useAuth()
  const [petitions, setPetitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchPetitions() }, [statusFilter])

  const fetchPetitions = async (q = '') => {
    setLoading(true)
    try {
      const res = await api.get('/petitions', {
        params: { search: q || undefined, status: statusFilter || undefined },
      })
      setPetitions(res.data.data || [])
      setTotal(res.data.total || 0)
    } finally { setLoading(false) }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPetitions(search)
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Pétitions</h1>
            <p className="text-gray-500 mt-1">Signez et partagez des pétitions citoyennes</p>
          </div>
          {user && (
            <Link href="/petitions/create">
              <Button><Plus className="w-4 h-4" /> Créer une pétition</Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { value: '', label: 'Toutes' },
              { value: 'active', label: 'Actives' },
              { value: 'goal_reached', label: 'Objectif atteint' },
              { value: 'closed', label: 'Clôturées' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === f.value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Petitions list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
            ))}
          </div>
        ) : petitions.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Aucune pétition trouvée.</p>
            {user && (
              <Link href="/petitions/create" className="mt-4 inline-block">
                <Button variant="secondary">Créer la première pétition</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {petitions.map((p: any) => {
              const pct = Math.min(Math.round((p.signature_count / p.goal) * 100), 100)
              const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.active
              const StIcon = st.icon
              return (
                <Link key={p.id} href={`/petitions/${p.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-card transition-shadow p-5 flex gap-4 card-lift">
                    {p.cover_url && (
                      <img src={p.cover_url} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="font-display font-bold text-gray-900 text-lg leading-snug line-clamp-2">{p.title}</h2>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${st.color}`}>
                          <StIcon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                      {p.target_institution && (
                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" /> {p.target_institution}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.objective}</p>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${p.status === 'goal_reached' ? 'bg-brand-600' : 'bg-brand-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                          {p.signature_count.toLocaleString()} / {p.goal.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.signature_count} signataire{p.signature_count !== 1 ? 's' : ''}</span>
                        {p.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Jusqu&apos;au {new Date(p.deadline).toLocaleDateString('fr-TN')}</span>}
                        <span>Par {p.author?.full_name || p.author?.name}</span>
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

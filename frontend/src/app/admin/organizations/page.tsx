'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { Search, Building2, Trash2, CheckCircle2, Clock, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all')

  const fetchOrgs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/organizations', { params: { search: search || undefined } })
      const all = res.data.data || []
      setTotal(res.data.total || 0)
      if (filter === 'pending') setOrgs(all.filter((o: any) => !o.is_verified))
      else if (filter === 'verified') setOrgs(all.filter((o: any) => o.is_verified))
      else setOrgs(all)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOrgs() }, [filter])

  const handleVerify = async (orgId: string) => {
    try {
      await api.patch(`/admin/organizations/${orgId}/verify`)
      toast({ title: '✅ Organisation vérifiée et publiée !', variant: 'success' })
      fetchOrgs()
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  const handleDelete = async (orgId: string, name: string) => {
    if (!confirm(`Supprimer "${name}" définitivement ?`)) return
    try {
      await api.delete(`/admin/organizations/${orgId}`)
      toast({ title: 'Organisation supprimée', variant: 'success' })
      fetchOrgs()
    } catch { toast({ title: 'Erreur suppression', variant: 'error' }) }
  }

  const pending = orgs.filter(o => !o.is_verified).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Organisations</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} organisations · {pending} en attente de vérification</p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">{pending} à vérifier</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={e => { e.preventDefault(); fetchOrgs() }} className="flex gap-2 flex-1">
          <Input placeholder="Rechercher une organisation..." icon={<Search className="w-4 h-4" />}
            value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
          <Button type="submit" variant="secondary">Rechercher</Button>
        </form>
        <div className="flex gap-2">
          {(['all', 'pending', 'verified'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'Toutes' : f === 'pending' ? 'En attente' : 'Vérifiées'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : orgs.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aucune organisation{filter === 'pending' ? ' en attente' : filter === 'verified' ? ' vérifiée' : ''}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Organisation', 'Catégorie', 'Membres', 'Créée le', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgs.map((org: any) => (
                <tr key={org.id} className={`hover:bg-gray-50 transition-colors ${!org.is_verified ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {org.logo_url
                          ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                          : <Building2 className="w-4 h-4 text-brand-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-900 text-sm">{org.name}</p>
                          <Link href={`/organizations/${org.id}`} target="_blank">
                            <ExternalLink className="w-3 h-3 text-gray-400 hover:text-brand-600" />
                          </Link>
                        </div>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{org.description?.slice(0, 60)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium capitalize">{org.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-3.5 h-3.5" />{org.members?.[0]?.count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(org.created_at)}</td>
                  <td className="px-4 py-3">
                    {org.is_verified
                      ? <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-3 h-3" />Vérifiée
                        </span>
                      : <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                          <Clock className="w-3 h-3" />En attente
                        </span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {!org.is_verified && (
                        <Button size="sm" onClick={() => handleVerify(org.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5" />Vérifier
                        </Button>
                      )}
                      <button onClick={() => handleDelete(org.id, org.name)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

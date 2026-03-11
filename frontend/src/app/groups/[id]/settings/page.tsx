'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Globe, Lock, CheckCircle, EyeOff, Trash2, UserPlus, Search } from 'lucide-react'

const VISIBILITY_OPTIONS = [
  { value: 'public',   label: 'Public',           icon: Globe,        desc: 'Visible par tous, tout le monde peut rejoindre' },
  { value: 'approval', label: 'Sur approbation',  icon: CheckCircle,  desc: 'Visible par tous, rejoindre nécessite une approbation' },
  { value: 'private',  label: 'Privé',            icon: Lock,         desc: 'Accessible seulement par invitation' },
  { value: 'hidden',   label: 'Caché',            icon: EyeOff,       desc: 'Non listé, accessible via lien direct uniquement' },
]

export default function GroupSettingsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<any>({})
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [inviting, setInviting] = useState<string | null>(null)

  useEffect(() => { loadGroup() }, [id])

  const loadGroup = async () => {
    try {
      const res = await api.get(`/groups/${id}`)
      if (!['admin', 'owner'].includes(res.data.membership)) {
        router.push(`/groups/${id}`)
        return
      }
      setGroup(res.data)
      setForm({
        name: res.data.name,
        description: res.data.description || '',
        visibility: res.data.visibility,
        post_approval: res.data.post_approval,
      })
    } catch {
      router.push(`/groups/${id}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/groups/${id}`, form)
      toast({ title: 'Paramètres sauvegardés', variant: 'success' })
      setGroup({ ...group, ...form })
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce groupe définitivement ? Cette action est irréversible.')) return
    setDeleting(true)
    try {
      await api.delete(`/groups/${id}`)
      toast({ title: 'Groupe supprimé', variant: 'success' })
      router.push('/groups')
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
      setDeleting(false)
    }
  }

  const handleInviteSearch = async (q: string) => {
    setInviteSearch(q)
    if (!q.trim()) { setSearchResults([]); return }
    try {
      const res = await api.get('/users', { params: { search: q } })
      setSearchResults((res.data || []).slice(0, 5))
    } catch {}
  }

  const handleInvite = async (userId: string) => {
    setInviting(userId)
    try {
      await api.post(`/groups/${id}/invite`, { user_id: userId })
      toast({ title: 'Invitation envoyée', variant: 'success' })
      setSearchResults(prev => prev.filter(u => u.id !== userId))
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setInviting(null)
    }
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href={`/groups/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au groupe
        </Link>

        <h1 className="font-display text-2xl font-bold text-gray-900 mb-8">Paramètres du groupe</h1>

        <div className="space-y-8">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 space-y-4">
            <h2 className="font-display font-bold text-gray-900">Informations</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <h2 className="font-display font-bold text-gray-900 mb-4">Visibilité</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {VISIBILITY_OPTIONS.map(opt => {
                const Icon = opt.icon
                const selected = form.visibility === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, visibility: opt.value })}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selected ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selected ? 'text-brand-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm font-medium ${selected ? 'text-brand-700' : 'text-gray-700'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Post approval */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <h2 className="font-display font-bold text-gray-900 mb-4">Publications</h2>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="post_approval"
                checked={form.post_approval}
                onChange={e => setForm({ ...form, post_approval: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-brand-600"
              />
              <label htmlFor="post_approval" className="cursor-pointer">
                <p className="text-sm font-medium text-gray-900">Approbation des publications</p>
                <p className="text-xs text-gray-500 mt-0.5">Les publications des membres nécessitent une validation avant d&apos;être visibles</p>
              </label>
            </div>
          </div>

          {/* Invite users */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <h2 className="font-display font-bold text-gray-900 mb-4">Inviter des membres</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={inviteSearch}
                onChange={e => handleInviteSearch(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-800">{u.full_name}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={inviting === u.id}
                      onClick={() => handleInvite(u.id)}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Inviter
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSave} loading={saving} className="w-full">
            Sauvegarder les paramètres
          </Button>

          {/* Danger zone - owner only */}
          {group?.membership === 'owner' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h2 className="font-display font-bold text-red-800 mb-2">Zone dangereuse</h2>
              <p className="text-sm text-red-600 mb-4">La suppression du groupe est irréversible. Tous les membres, publications et messages seront supprimés.</p>
              <Button variant="outline" onClick={handleDelete} loading={deleting} className="border-red-300 text-red-600 hover:bg-red-100">
                <Trash2 className="w-4 h-4" /> Supprimer le groupe
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

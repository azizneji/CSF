'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, orgsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, FolderOpen } from 'lucide-react'

const STATUSES = [
  { value: 'planning',  label: '🗓️ En préparation' },
  { value: 'active',    label: '🟢 En cours' },
  { value: 'paused',    label: '⏸️ En pause' },
  { value: 'completed', label: '✅ Terminé' },
]

export default function CreateProjectPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '', description: '', objectives: '',
    organization_id: '', status: 'planning',
    start_date: '', end_date: '',
  })

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    orgsApi.getMine().then(r => {
      const orgs = (r.data || [])
        .filter((m: any) => ['admin', 'manager'].includes(m.role))
        .map((m: any) => m.organization).filter(Boolean)
      setMyOrgs(orgs)
      if (orgs.length > 0) setForm(f => ({ ...f, organization_id: orgs[0].id }))
    }).catch(() => {})
  }, [user])

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.organization_id) {
      toast({ title: 'Titre, description et organisation requis', variant: 'error' }); return
    }
    setLoading(true)
    try {
      const res = await api.post('/projects', form)
      toast({ title: 'Projet créé !', variant: 'success' })
      router.push(`/projects/${res.data.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Nouveau projet</h1>
            <p className="text-gray-500 text-sm">Créez et gérez un projet pour votre organisation</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-display font-bold text-gray-900">Informations</h2>

            {myOrgs.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation *</label>
                <select value={form.organization_id} onChange={e => setForm({ ...form, organization_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {myOrgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
                Vous devez être admin ou manager d'une organisation pour créer un projet.
              </div>
            )}

            <Input label="Titre du projet *" placeholder="Ex: Campagne de sensibilisation 2024"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <textarea rows={4} placeholder="Décrivez le projet et son contexte..."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Objectifs</label>
              <textarea rows={3} placeholder="Listez les objectifs principaux du projet..."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map(s => (
                  <button key={s.value} type="button" onClick={() => setForm({ ...form, status: s.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      form.status === s.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Date de début" type="date" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
              <Input label="Date de fin prévue" type="date" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end pb-10">
            <Button size="lg" onClick={handleSubmit} loading={loading} disabled={myOrgs.length === 0}>
              Créer le projet
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

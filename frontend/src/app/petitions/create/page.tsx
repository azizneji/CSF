'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api, uploadsApi } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Target, Building2, Image, Calendar, Users, ChevronDown } from 'lucide-react'

export default function CreatePetitionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [orgs, setOrgs] = useState<any[]>([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    objective: '',
    target_institution: '',
    cover_url: '',
    goal: 100,
    deadline: '',
    author_type: 'user' as 'user' | 'organization',
    author_id: '',
  })

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, author_id: user.id }))
      // Load user's orgs
      api.get(`/organizations?member_id=${user.id}`).then(res => {
        setOrgs(res.data?.data || res.data || [])
      }).catch(() => {})
    }
  }, [user])

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const handleAuthorTypeChange = (type: 'user' | 'organization') => {
    set('author_type', type)
    set('author_id', type === 'user' ? user?.id : '')
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadsApi.uploadPostImage(file)
      set('cover_url', res.data.url)
    } finally { setUploading(false) }
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.objective.trim()) {
      toast({ title: 'Veuillez remplir tous les champs obligatoires', variant: 'error' })
      return
    }
    if (form.author_type === 'organization' && !form.author_id) {
      toast({ title: 'Veuillez sélectionner une organisation', variant: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const payload: any = { ...form, goal: Number(form.goal) }
      if (!payload.deadline) delete payload.deadline
      if (!payload.target_institution) delete payload.target_institution
      if (!payload.cover_url) delete payload.cover_url

      const res = await api.post('/petitions', payload)
      toast({ title: 'Pétition créée !', variant: 'success' })
      router.push(`/petitions/${res.data.id}`)
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Erreur', variant: 'error' })
    } finally { setSubmitting(false) }
  }

  if (!user) return null

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Créer une pétition</h1>
          <p className="text-gray-500 mt-1">Lancez un appel à l&apos;action citoyenne</p>
        </div>

        <div className="space-y-6">

          {/* Author type */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Publier en tant que</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAuthorTypeChange('user')}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  form.author_type === 'user'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-brand-700" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Moi-même</p>
                  <p className="text-xs text-gray-400">{user.full_name}</p>
                </div>
              </button>

              {orgs.length > 0 && (
                <button
                  onClick={() => handleAuthorTypeChange('organization')}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    form.author_type === 'organization'
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Organisation</p>
                    <p className="text-xs text-gray-400">Au nom d&apos;une ONG</p>
                  </div>
                </button>
              )}
            </div>

            {form.author_type === 'organization' && orgs.length > 0 && (
              <div className="mt-3 relative">
                <select
                  value={form.author_id}
                  onChange={e => set('author_id', e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Sélectionner une organisation</option>
                  {orgs.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Cover image */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Image de couverture <span className="text-gray-400 font-normal">(optionnel)</span></p>
            {form.cover_url ? (
              <div className="relative">
                <img src={form.cover_url} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={() => set('cover_url', '')}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center"
                >×</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                <Image className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{uploading ? 'Envoi en cours...' : 'Cliquer pour ajouter une image'}</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Main info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Titre <span className="text-red-400">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Pour la protection des forêts tunisiennes"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Objectif <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.objective}
                onChange={e => set('objective', e.target.value)}
                placeholder="En une phrase, quel est le but de cette pétition ?"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Décrivez le contexte, les enjeux et pourquoi cette pétition est importante..."
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-brand-600" /> Institution ciblée</span>
              </label>
              <input
                value={form.target_institution}
                onChange={e => set('target_institution', e.target.value)}
                placeholder="Ex: Ministère de l'Environnement, Parlement, Mairie..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Goal & deadline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-brand-600" /> Objectif de signatures</span>
              </label>
              <input
                type="number"
                min={10}
                value={form.goal}
                onChange={e => set('goal', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand-600" /> Date de clôture</span>
              </label>
              <input
                type="date"
                value={form.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('deadline', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Lancer la pétition
            </Button>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

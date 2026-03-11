'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { activitiesApi, uploadsApi, usersApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, CalendarDays, Upload, X } from 'lucide-react'

const TYPES = [
  { value: 'training', label: '📚 Formation' },
  { value: 'health', label: '🏥 Caravane de santé' },
  { value: 'conference', label: '🎤 Conférence' },
  { value: 'workshop', label: '🛠️ Atelier' },
  { value: 'campaign', label: '📢 Campagne' },
  { value: 'fundraiser', label: '💰 Collecte de fonds' },
  { value: 'volunteering', label: '🤝 Bénévolat' },
  { value: 'cultural', label: '🎭 Culturel' },
  { value: 'sport', label: '⚽ Sportif' },
  { value: 'other', label: '📌 Autre' },
]

export default function CreateActivityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const coverRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', description: '', type: 'training',
    organization_id: '', start_date: '', end_date: '',
    location: '', cover_url: '', max_participants: '',
    price: 'Gratuit', registration_link: '',
  })

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    usersApi.getMyOrganizations()
      .then((r) => {
        const adminOrgs = r.data.filter((m: any) => ['admin', 'manager'].includes(m.role))
        setMyOrgs(adminOrgs)
        if (adminOrgs.length > 0) {
          setForm(f => ({ ...f, organization_id: adminOrgs[0].organization.id }))
        }
      })
  }, [user])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const res = await uploadsApi.uploadCover(file)
      setForm(f => ({ ...f, cover_url: res.data.url }))
      toast({ title: 'Image uploadée !', variant: 'success' })
    } catch {
      toast({ title: 'Erreur upload', variant: 'error' })
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.organization_id || !form.start_date) {
      toast({ title: 'Remplissez les champs requis', variant: 'error' }); return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
        end_date: form.end_date || undefined,
      }
      const res = await activitiesApi.create(payload)
      toast({ title: 'Activité créée !', variant: 'success' })
      router.push(`/activities/${res.data.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/activities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Nouvelle activité</h1>
            <p className="text-gray-500 text-sm">Formation, événement, caravane...</p>
          </div>
        </div>

        {myOrgs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Vous devez être admin ou manager d'une organisation pour créer une activité.</p>
            <Link href="/organizations/create">
              <Button>Créer une organisation</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 animate-fade-up">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Organization */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Organisation organisatrice *</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.organization_id}
                  onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
                >
                  {myOrgs.map((m: any) => (
                    <option key={m.organization.id} value={m.organization.id}>{m.organization.name}</option>
                  ))}
                </select>
              </div>

              <Input label="Titre *" placeholder="Ex: Formation en gestion de projet"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Type d'activité</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        form.type === t.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea rows={4} placeholder="Décrivez l'activité..."
                  className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Date de début *" type="datetime-local"
                  value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                <Input label="Date de fin" type="datetime-local"
                  value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>

              <Input label="Lieu" placeholder="Centre culturel, Tunis"
                value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Participants max" type="number" placeholder="50"
                  value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} />
                <Input label="Prix" placeholder="Gratuit"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>

              <Input label="Lien d'inscription (optionnel)" placeholder="https://..."
                value={form.registration_link} onChange={(e) => setForm({ ...form, registration_link: e.target.value })} />

              {/* Cover upload */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Image de couverture</label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {form.cover_url ? (
                  <div className="relative">
                    <img src={form.cover_url} alt="" className="w-full h-40 object-cover rounded-xl" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, cover_url: '' }))}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => coverRef.current?.click()}
                    disabled={uploadingCover}
                    className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadingCover ? 'Upload en cours...' : 'Ajouter une image de couverture'}
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/activities" className="flex-1">
                  <Button variant="outline" className="w-full" type="button">Annuler</Button>
                </Link>
                <Button type="submit" className="flex-1" loading={loading}>Créer l'activité</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

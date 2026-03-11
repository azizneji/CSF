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
import { ArrowLeft, Wrench } from 'lucide-react'

const CATEGORIES = [
  { value: 'legal',         label: '⚖️ Juridique' },
  { value: 'health',        label: '🏥 Santé' },
  { value: 'education',     label: '📚 Éducation' },
  { value: 'social',        label: '🤝 Social' },
  { value: 'psychological', label: '🧠 Psychologique' },
  { value: 'financial',     label: '💰 Financier' },
  { value: 'digital',       label: '💻 Numérique' },
  { value: 'other',         label: '📌 Autre' },
]

export default function CreateServicePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '', description: '', category: 'social',
    organization_id: '', location: '', target_audience: '',
    contact_email: '', contact_phone: '', website: '', schedule: '',
  })

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    orgsApi.getMine().then(r => {
      const orgs = (r.data || []).map((m: any) => m.organization).filter(Boolean)
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
      const res = await api.post('/services', form)
      toast({ title: 'Service publié !', variant: 'success' })
      router.push(`/services/${res.data.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Proposer un service</h1>
            <p className="text-gray-500 text-sm">Partagez un service gratuit avec la communauté</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-display font-bold text-gray-900">Informations du service</h2>

            {myOrgs.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation *</label>
                <select value={form.organization_id} onChange={e => setForm({ ...form, organization_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {myOrgs.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}

            <Input label="Titre du service *" placeholder="Ex: Consultation juridique gratuite"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <textarea rows={4} placeholder="Décrivez le service, ce qu'il offre, les conditions..."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      form.category === c.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-display font-bold text-gray-900">Détails pratiques</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Localisation" placeholder="Tunis, Sfax..." value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })} />
              <Input label="Public cible" placeholder="Femmes, jeunes, familles..."
                value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Horaires / Disponibilité</label>
              <textarea rows={2} placeholder="Ex: Lundi-Vendredi 9h-17h, sur rendez-vous..."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email de contact" type="email" value={form.contact_email}
                onChange={e => setForm({ ...form, contact_email: e.target.value })} />
              <Input label="Téléphone" value={form.contact_phone}
                onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
            <Input label="Site web" placeholder="https://..." value={form.website}
              onChange={e => setForm({ ...form, website: e.target.value })} />
          </div>

          <div className="flex justify-end pb-10">
            <Button size="lg" onClick={handleSubmit} loading={loading}>
              Publier le service
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { opportunitiesApi, orgsApi, enterprisesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Briefcase } from 'lucide-react'

const TYPES = [
  { value: 'job',        label: 'Offre d\'emploi' },
  { value: 'consultant', label: 'Appel à consultants' },
  { value: 'tender',     label: 'Appel d\'offres' },
  { value: 'volunteer',  label: 'Bénévolat' },
  { value: 'internship', label: 'Stage' },
  { value: 'grant',      label: 'Appel à projets' },
]

export default function CreateOpportunityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [myEnterprises, setMyEnterprises] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '', description: '', type: 'job', poster_type: 'organization',
    poster_id: '', location: '', deadline: '', salary_range: '',
    requirements: '', contact_email: '',
  })

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    // Fetch user's orgs and enterprises
    Promise.all([
      orgsApi.getAll().then(r => r.data),
      enterprisesApi.getAll().then(r => r.data),
    ]).then(([orgs, ents]) => {
      const myO = orgs.filter((o: any) => o.created_by === user.id)
      const myE = ents.filter((e: any) => e.created_by === user.id)
      setMyOrgs(myO)
      setMyEnterprises(myE)
      if (myO.length > 0) setForm(f => ({ ...f, poster_id: myO[0].id }))
    })
  }, [user])

  const posterOptions = form.poster_type === 'organization' ? myOrgs : myEnterprises

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.poster_id) {
      toast({ title: 'Remplissez les champs requis', variant: 'error' }); return
    }
    setLoading(true)
    try {
      const res = await opportunitiesApi.create(form)
      toast({ title: 'Opportunité publiée !', variant: 'success' })
      router.push(`/opportunities/${res.data.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-sand-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Nouvelle opportunité</h1>
            <p className="text-gray-500 text-sm">Emploi, consultance, appel d'offres...</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 animate-fade-up">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Type d'opportunité *</label>
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

            <Input label="Titre *" placeholder="Ex: Coordinateur de projet WASH"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea rows={5} placeholder="Décrivez l'opportunité en détail..."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Poster */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Publié par *</label>
              <div className="flex gap-2 mb-2">
                {['organization', 'enterprise'].map((pt) => (
                  <button key={pt} type="button"
                    onClick={() => { setForm({ ...form, poster_type: pt, poster_id: '' }) }}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      form.poster_type === pt ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {pt === 'organization' ? 'Organisation' : 'Entreprise'}
                  </button>
                ))}
              </div>
              {posterOptions.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Vous n'avez pas encore de {form.poster_type === 'organization' ? 'organisation' : 'entreprise'}.
                </p>
              ) : (
                <select
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.poster_id}
                  onChange={(e) => setForm({ ...form, poster_id: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {posterOptions.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Localisation" placeholder="Tunis, Tunisie"
                value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input label="Date limite" type="date"
                value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Rémunération" placeholder="1500-2000 TND"
                value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} />
              <Input label="Email de contact" type="email" placeholder="recrutement@org.tn"
                value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Profil recherché</label>
              <textarea rows={3} placeholder="Compétences requises, expérience..."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/opportunities" className="flex-1">
                <Button variant="outline" className="w-full" type="button">Annuler</Button>
              </Link>
              <Button type="submit" className="flex-1" loading={loading}>Publier</Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

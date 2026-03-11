'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { enterprisesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Briefcase } from 'lucide-react'

const SECTORS = [
  { value: 'tech', label: 'Technologie' }, { value: 'finance', label: 'Finance' },
  { value: 'energy', label: 'Énergie' }, { value: 'health', label: 'Santé' },
  { value: 'education', label: 'Éducation' }, { value: 'agriculture', label: 'Agriculture' },
  { value: 'retail', label: 'Commerce' }, { value: 'manufacturing', label: 'Industrie' },
  { value: 'services', label: 'Services' }, { value: 'other', label: 'Autre' },
]
const SIZES = [
  { value: 'startup', label: 'Startup' }, { value: 'sme', label: 'PME' },
  { value: 'large', label: 'Grande entreprise' }, { value: 'multinational', label: 'Multinationale' },
]

export default function CreateEnterprisePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', sector: 'other', size: 'sme', location: '', website: '',
  })
  const [errors, setErrors] = useState<any>({})

  const validate = () => {
    const e: any = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description trop courte'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth/login'); return }
    if (!validate()) return
    setLoading(true)
    try {
      const res = await enterprisesApi.create(form)
      toast({ title: 'Entreprise enregistrée !', variant: 'success' })
      router.push(`/enterprises/${res.data.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/enterprises" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-sand-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Nouvelle entreprise</h1>
            <p className="text-gray-500 text-sm">Rejoignez l'écosystème civique</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 animate-fade-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nom de l'entreprise *"
              placeholder="Ex: Innovatech Tunisia"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                rows={4}
                placeholder="Décrivez votre entreprise, ses activités et sa vision..."
                className={`flex w-full rounded-xl border px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none ${errors.description ? 'border-red-400' : 'border-gray-200'}`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Secteur</label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button key={s.value} type="button" onClick={() => setForm({ ...form, sector: s.value })}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.sector === s.value ? 'bg-sand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Taille</label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button key={s.value} type="button" onClick={() => setForm({ ...form, size: s.value })}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.size === s.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Ville / Région (optionnel)" placeholder="Tunis, Sfax..."
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input label="Site web (optionnel)" type="url" placeholder="https://monentreprise.tn"
              value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />

            <div className="flex gap-3 pt-2">
              <Link href="/enterprises" className="flex-1">
                <Button variant="outline" className="w-full" type="button">Annuler</Button>
              </Link>
              <Button type="submit" className="flex-1" loading={loading}>Enregistrer</Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

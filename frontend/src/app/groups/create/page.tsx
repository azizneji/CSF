'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Globe, Lock, CheckCircle, EyeOff } from 'lucide-react'

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    desc: 'Visible par tous, tout le monde peut rejoindre',
    icon: Globe,
    color: 'border-green-300 bg-green-50 text-green-700',
  },
  {
    value: 'approval',
    label: 'Sur approbation',
    desc: 'Visible par tous, mais rejoindre nécessite une approbation',
    icon: CheckCircle,
    color: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  {
    value: 'private',
    label: 'Privé',
    desc: 'Visible seulement par invitation',
    icon: Lock,
    color: 'border-red-300 bg-red-50 text-red-700',
  },
  {
    value: 'hidden',
    label: 'Caché',
    desc: 'Non listé, accessible uniquement via un lien direct',
    icon: EyeOff,
    color: 'border-gray-300 bg-gray-50 text-gray-700',
  },
]

export default function CreateGroupPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    visibility: 'public',
    post_approval: false,
  })

  if (!user) { router.push('/auth/login'); return null }

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast({ title: 'Le nom est requis', variant: 'error' })
    setLoading(true)
    try {
      const res = await api.post('/groups', form)
      toast({ title: 'Groupe créé !', variant: 'success' })
      router.push(`/groups/${res.data.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Créer un groupe</h1>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du groupe *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Équipe communication CSF"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="De quoi parle ce groupe ?"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Visibilité</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {VISIBILITY_OPTIONS.map(opt => {
                const Icon = opt.icon
                const selected = form.visibility === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, visibility: opt.value })}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      selected ? opt.color + ' border-current' : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs opacity-75 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Post approval */}
          <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
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

          <Button onClick={handleSubmit} loading={loading} className="w-full">
            Créer le groupe
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

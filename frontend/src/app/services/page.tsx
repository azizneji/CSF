'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { Search, Plus, Wrench, MapPin, Building2, Phone, Globe, Tag } from 'lucide-react'

const CATEGORIES = [
  { value: '',              label: 'Tous' },
  { value: 'legal',         label: '⚖️ Juridique' },
  { value: 'health',        label: '🏥 Santé' },
  { value: 'education',     label: '📚 Éducation' },
  { value: 'social',        label: '🤝 Social' },
  { value: 'psychological', label: '🧠 Psychologique' },
  { value: 'financial',     label: '💰 Financier' },
  { value: 'digital',       label: '💻 Numérique' },
  { value: 'other',         label: '📌 Autre' },
]

const CAT_COLORS: any = {
  legal: 'bg-blue-50 text-blue-700 border-blue-100',
  health: 'bg-green-50 text-green-700 border-green-100',
  education: 'bg-brand-50 text-brand-700 border-brand-100',
  social: 'bg-sand-50 text-sand-700 border-sand-100',
  psychological: 'bg-purple-50 text-purple-700 border-purple-100',
  financial: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  digital: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  other: 'bg-gray-50 text-gray-600 border-gray-100',
}

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await api.get('/services', { params: { category: category || undefined, search: search || undefined } })
      setServices(res.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchServices() }, [category])

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Services gratuits</h1>
            <p className="text-gray-500">Consultations, accompagnements et services offerts par la communauté.</p>
          </div>
          {user && (
            <Link href="/services/create">
              <Button><Plus className="w-4 h-4" />Proposer un service</Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 mb-8 space-y-4">
          <form onSubmit={e => { e.preventDefault(); fetchServices() }} className="flex gap-3">
            <Input placeholder="Rechercher un service..." icon={<Search className="w-4 h-4" />}
              value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  category === c.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-3">
                <div className="h-10 bg-gray-200 rounded-xl w-10" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Wrench className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucun service trouvé</p>
            {user && (
              <Link href="/services/create" className="mt-4 inline-block">
                <Button>Proposer un service</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc: any) => (
              <Link key={svc.id} href={`/services/${svc.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft card-lift p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-50 flex items-center justify-center flex-shrink-0">
                      {svc.organization?.logo_url
                        ? <img src={svc.organization.logo_url} alt="" className="w-full h-full object-cover" />
                        : <Wrench className="w-6 h-6 text-brand-600" />}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CAT_COLORS[svc.category] || CAT_COLORS.other}`}>
                      {CATEGORIES.find(c => c.value === svc.category)?.label?.replace(/^[^ ]+ /, '') || svc.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{svc.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3 flex-1">{svc.description}</p>

                  <div className="mt-4 pt-4 border-t border-gray-50 space-y-1.5">
                    {svc.organization?.name && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Building2 className="w-3.5 h-3.5 text-brand-500" />{svc.organization.name}
                      </div>
                    )}
                    {svc.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-brand-500" />{svc.location}
                      </div>
                    )}
                    {svc.target_audience && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Tag className="w-3.5 h-3.5 text-brand-500" />{svc.target_audience}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { enterprisesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Enterprise } from '@/types'
import { ENTERPRISE_SECTOR_LABELS, ENTERPRISE_SIZE_LABELS } from '@/lib/utils'
import { Search, Plus, Briefcase, MapPin, Globe } from 'lucide-react'

const SECTORS = [
  { value: '', label: 'Tous' },
  { value: 'tech', label: 'Tech' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Santé' },
  { value: 'education', label: 'Éducation' },
  { value: 'energy', label: 'Énergie' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Autre' },
]

export default function EnterprisesPage() {
  const { user } = useAuth()
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')

  const fetchEnterprises = async () => {
    setLoading(true)
    try {
      const res = await enterprisesApi.getAll(search || undefined, sector || undefined)
      setEnterprises(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEnterprises() }, [sector])

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Entreprises</h1>
            <p className="text-gray-500">Les entreprises tunisiennes engagées dans l'écosystème civique.</p>
          </div>
          {user && (
            <Link href="/enterprises/create">
              <Button><Plus className="w-4 h-4" />Enregistrer une entreprise</Button>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 mb-8 flex flex-col sm:flex-row gap-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchEnterprises() }} className="flex-1 flex gap-2">
            <Input
              placeholder="Rechercher une entreprise..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
          <div className="flex gap-2 flex-wrap">
            {SECTORS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSector(s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sector === s.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border p-6 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : enterprises.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucune entreprise trouvée</p>
            {user && (
              <Link href="/enterprises/create" className="mt-4 inline-block">
                <Button>Enregistrer une entreprise</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {enterprises.map((ent) => (
              <Link key={ent.id} href={`/enterprises/${ent.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 card-lift animate-fade-up h-full flex flex-col">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center flex-shrink-0">
                      {ent.logo_url ? (
                        <img src={ent.logo_url} alt={ent.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-sand-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{ent.name}</h3>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <Badge variant="sand">{ENTERPRISE_SECTOR_LABELS[ent.sector] || ent.sector}</Badge>
                        <Badge variant="gray">{ENTERPRISE_SIZE_LABELS[ent.size] || ent.size}</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{ent.description}</p>
                  {ent.location && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />{ent.location}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

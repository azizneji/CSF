'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { opportunitiesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { Search, Plus, Briefcase, MapPin, Calendar, Clock, Building2 } from 'lucide-react'

const TYPES = [
  { value: '',           label: 'Toutes',            color: 'gray' },
  { value: 'job',        label: 'Emploi',             color: 'blue' },
  { value: 'consultant', label: 'Consultant',         color: 'brand' },
  { value: 'tender',     label: 'Appel d\'offres',    color: 'sand' },
  { value: 'volunteer',  label: 'Bénévolat',          color: 'green' },
  { value: 'internship', label: 'Stage',              color: 'blue' },
  { value: 'grant',      label: 'Appel à projets',   color: 'sand' },
]

const TYPE_COLORS: any = {
  job:        'blue',
  consultant: 'default',
  tender:     'sand',
  volunteer:  'green',
  internship: 'blue',
  grant:      'sand',
}

export default function OpportunitiesPage() {
  const { user } = useAuth()
  const [opps, setOpps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')

  const fetchOpps = async () => {
    setLoading(true)
    try {
      const res = await opportunitiesApi.getAll({ type: type || undefined, search: search || undefined })
      setOpps(res.data.data || res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOpps() }, [type])

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Opportunités</h1>
            <p className="text-gray-500">Emplois, consultances, appels d'offres et bénévolat.</p>
          </div>
          {user && (
            <Link href="/opportunities/create">
              <Button><Plus className="w-4 h-4" />Publier une opportunité</Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 mb-8 space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchOpps() }} className="flex gap-2">
            <Input
              placeholder="Rechercher une opportunité..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  type === t.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : opps.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucune opportunité trouvée</p>
            {user && (
              <Link href="/opportunities/create" className="mt-4 inline-block">
                <Button>Publier une opportunité</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 stagger">
            {opps.map((opp) => (
              <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 card-lift animate-fade-up flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center flex-shrink-0">
                    {opp.poster?.logo_url ? (
                      <img src={opp.poster.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-6 h-6 text-sand-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{opp.poster?.name}</p>
                      </div>
                      <Badge variant={TYPE_COLORS[opp.type] || 'gray'} className="flex-shrink-0">
                        {TYPES.find(t => t.value === opp.type)?.label || opp.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{opp.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                      {opp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.location}</span>}
                      {opp.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Avant le {formatDate(opp.deadline)}</span>}
                      {opp.salary_range && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{opp.salary_range}</span>}
                    </div>
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

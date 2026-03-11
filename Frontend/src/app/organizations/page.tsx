'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { orgsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Organization } from '@/types'
import { ORG_CATEGORY_LABELS, formatDate } from '@/lib/utils'
import { Search, Plus, Building2, MapPin, Users, ChevronDown, X, CheckCircle2 } from 'lucide-react'

const CATEGORIES = [
  { value: '', label: 'Toutes catégories' },
  { value: 'ngo', label: 'ONG' },
  { value: 'association', label: 'Associations' },
  { value: 'foundation', label: 'Fondations' },
  { value: 'collective', label: 'Collectifs' },
  { value: 'other', label: 'Autres' },
]

// Common domaines — fetched dynamically but seeded with common ones
const COMMON_DOMAINES = [
  'Droits de l\'Homme', 'Environnement', 'Éducation', 'Santé', 'Culture',
  'Sport', 'Jeunesse', 'Genre & Féminisme', 'Migration', 'Développement local',
  'Démocratie & Gouvernance', 'Arts & Créativité', 'Aide humanitaire',
]

export default function OrganizationsPage() {
  const { user } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [domaine, setDomaine] = useState('')
  const [domaineInput, setDomaineInput] = useState('')
  const [showDomaineSuggest, setShowDomaineSuggest] = useState(false)

  const fetchOrgs = async () => {
    setLoading(true)
    try {
      const res = await orgsApi.getAll(search || undefined, category || undefined, domaine || undefined)
      setOrgs(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrgs() }, [category, domaine])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrgs()
  }

  const suggestions = domaineInput
    ? COMMON_DOMAINES.filter(d => d.toLowerCase().includes(domaineInput.toLowerCase()))
    : COMMON_DOMAINES

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Organisations</h1>
            <p className="text-gray-500">Découvrez les ONG, associations et collectifs actifs en Tunisie.</p>
          </div>
          {user && (
            <Link href="/organizations/create">
              <Button><Plus className="w-4 h-4" /> Créer une organisation</Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 mb-8 space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une organisation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
              />
            </div>
            <Button type="submit">Rechercher</Button>
          </form>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === c.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Domaine d'activité filter */}
          <div className="relative">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Domaine d'activité</p>
            <div className="flex gap-2 flex-wrap">
              {domaine && (
                <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm px-3 py-1 rounded-full font-medium">
                  {domaine}
                  <button onClick={() => { setDomaine(''); setDomaineInput('') }} className="hover:text-brand-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {!domaine && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrer par domaine..."
                    value={domaineInput}
                    onChange={(e) => setDomaineInput(e.target.value)}
                    onFocus={() => setShowDomaineSuggest(true)}
                    onBlur={() => setTimeout(() => setShowDomaineSuggest(false), 150)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 w-56"
                  />
                  {showDomaineSuggest && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-gray-100 shadow-card z-20 max-h-52 overflow-y-auto">
                      {suggestions.map((d) => (
                        <button
                          key={d}
                          onClick={() => { setDomaine(d); setDomaineInput(d); setShowDomaineSuggest(false) }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {d}
                        </button>
                      ))}
                      {domaineInput && !suggestions.find(s => s.toLowerCase() === domaineInput.toLowerCase()) && (
                        <button
                          onClick={() => { setDomaine(domaineInput); setShowDomaineSuggest(false) }}
                          className="w-full text-left px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium border-t border-gray-50"
                        >
                          Filtrer par "{domaineInput}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick domaine pills */}
            {!domaine && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_DOMAINES.slice(0, 8).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomaine(d)}
                    className="px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700 border border-gray-100 transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active filters summary */}
          {(category || domaine) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-50">
              <span>Filtres actifs :</span>
              {category && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{CATEGORIES.find(c => c.value === category)?.label}</span>}
              {domaine && <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{domaine}</span>}
              <button onClick={() => { setCategory(''); setDomaine(''); setDomaineInput('') }}
                className="text-red-400 hover:text-red-600 ml-1">Effacer tout</button>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucune organisation trouvée</p>
            <p className="text-gray-400 text-sm mt-1">Essayez d'autres termes ou créez la première !</p>
            {user && (
              <Link href="/organizations/create" className="mt-4 inline-block">
                <Button>Créer une organisation</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {orgs.map((org: any) => (
              <Link key={org.id} href={`/organizations/${org.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 card-lift animate-fade-up h-full flex flex-col">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {org.logo_url
                        ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-xl" />
                        : <Building2 className="w-6 h-6 text-brand-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                        {org.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="default">{ORG_CATEGORY_LABELS[org.category] || org.category}</Badge>
                        {org.domaine_activite && <Badge variant="sand" className="text-xs">{org.domaine_activite}</Badge>}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{org.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
                    {org.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{org.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {(org.members_count?.[0] as any)?.count || 0} membres
                    </span>
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

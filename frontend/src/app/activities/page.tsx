'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { activitiesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { Search, Plus, CalendarDays, MapPin, Building2, Clock, Users } from 'lucide-react'

const TYPES = [
  { value: '',             label: 'Toutes' },
  { value: 'training',     label: 'Formation' },
  { value: 'health',       label: 'Caravane santé' },
  { value: 'conference',   label: 'Conférence' },
  { value: 'workshop',     label: 'Atelier' },
  { value: 'campaign',     label: 'Campagne' },
  { value: 'fundraiser',   label: 'Collecte de fonds' },
  { value: 'volunteering', label: 'Bénévolat' },
  { value: 'cultural',     label: 'Culturel' },
  { value: 'sport',        label: 'Sportif' },
  { value: 'other',        label: 'Autre' },
]

const TYPE_COLORS: any = {
  training: 'blue', health: 'green', conference: 'default',
  workshop: 'sand', campaign: 'default', fundraiser: 'sand',
  volunteering: 'green', cultural: 'blue', sport: 'green', other: 'gray',
}

const TYPE_EMOJIS: any = {
  training: '📚', health: '🏥', conference: '🎤', workshop: '🛠️',
  campaign: '📢', fundraiser: '💰', volunteering: '🤝', cultural: '🎭',
  sport: '⚽', other: '📌',
}

export default function ActivitiesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [upcoming, setUpcoming] = useState(false)

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await activitiesApi.getAll({ type: type || undefined, upcoming })
      setActivities(res.data.data || res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchActivities() }, [type, upcoming])

  const formatActivityDate = (start: string, end?: string) => {
    const startDate = new Date(start)
    const dateStr = startDate.toLocaleDateString('fr-TN', { day: 'numeric', month: 'long', year: 'numeric' })
    const timeStr = startDate.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} à ${timeStr}`
  }

  const isUpcoming = (date: string) => new Date(date) > new Date()

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Activités & Événements</h1>
            <p className="text-gray-500">Formations, caravanes, conférences et plus encore.</p>
          </div>
          {user && (
            <Link href="/activities/create">
              <Button><Plus className="w-4 h-4" />Créer une activité</Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 mb-8 space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setUpcoming(false)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!upcoming ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Toutes les activités
            </button>
            <button
              onClick={() => setUpcoming(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${upcoming ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              À venir
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  type === t.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t.value && <span className="mr-1">{TYPE_EMOJIS[t.value]}</span>}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse overflow-hidden">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucune activité trouvée</p>
            {user && (
              <Link href="/activities/create" className="mt-4 inline-block">
                <Button>Créer une activité</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {activities.map((act) => (
              <Link key={act.id} href={`/activities/${act.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft card-lift animate-fade-up overflow-hidden h-full flex flex-col">
                  {/* Cover */}
                  <div className="h-48 relative flex-shrink-0">
                    {act.cover_url ? (
                      <img src={act.cover_url} alt={act.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
                        <span className="text-5xl">{TYPE_EMOJIS[act.type] || '📌'}</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant={TYPE_COLORS[act.type] || 'gray'} className="bg-white/90 backdrop-blur-sm">
                        {TYPES.find(t => t.value === act.type)?.label || act.type}
                      </Badge>
                      {isUpcoming(act.start_date) && (
                        <Badge variant="green" className="bg-white/90 backdrop-blur-sm">À venir</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{act.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 flex-1">{act.description}</p>

                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        {formatActivityDate(act.start_date)}
                      </div>
                      {act.location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-brand-500" />{act.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Building2 className="w-3.5 h-3.5 text-brand-500" />
                        {act.organization?.name}
                      </div>
                    </div>

                    {act.price && (
                      <div className="mt-3">
                        <Badge variant={act.price === 'Gratuit' ? 'green' : 'gray'}>{act.price}</Badge>
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

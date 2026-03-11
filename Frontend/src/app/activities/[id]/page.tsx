'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { activitiesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, MapPin, Clock, Building2, Users, Trash2, CalendarDays, Tag } from 'lucide-react'

const TYPE_LABELS: any = {
  training: 'Formation', health: 'Caravane de santé', conference: 'Conférence',
  workshop: 'Atelier', campaign: 'Campagne', fundraiser: 'Collecte de fonds',
  volunteering: 'Bénévolat', cultural: 'Culturel', sport: 'Sportif', other: 'Autre',
}
const TYPE_EMOJIS: any = {
  training: '📚', health: '🏥', conference: '🎤', workshop: '🛠️',
  campaign: '📢', fundraiser: '💰', volunteering: '🤝', cultural: '🎭',
  sport: '⚽', other: '📌',
}

export default function ActivityDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [act, setAct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    activitiesApi.getById(id as string)
      .then((r) => setAct(r.data))
      .catch(() => router.push('/activities'))
      .finally(() => setLoading(false))
  }, [id])

  const handleRegister = async () => {
    if (!user) { router.push('/auth/login'); return }
    setRegistering(true)
    try {
      await activitiesApi.register(act.id)
      setRegistered(true)
      toast({ title: 'Inscription confirmée !', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette activité ?')) return
    await activitiesApi.delete(act.id)
    toast({ title: 'Activité supprimée', variant: 'success' })
    router.push('/activities')
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-TN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const isOwner = user && act?.created_by === user.id
  const isUpcoming = act && new Date(act.start_date) > new Date()

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-2xl mb-6" />
        <div className="bg-white rounded-2xl p-8 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </MainLayout>
  )

  if (!act) return null

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/activities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux activités
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-fade-up">
          {/* Cover */}
          <div className="h-64 relative">
            {act.cover_url ? (
              <img src={act.cover_url} alt={act.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
                <span className="text-7xl">{TYPE_EMOJIS[act.type] || '📌'}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-4 left-6 flex gap-2">
              <Badge variant="default" className="bg-white/90 backdrop-blur-sm text-gray-800">
                {TYPE_LABELS[act.type] || act.type}
              </Badge>
              {isUpcoming && <Badge variant="green" className="bg-white/90 backdrop-blur-sm">À venir</Badge>}
              {act.price && <Badge variant={act.price === 'Gratuit' ? 'green' : 'gray'} className="bg-white/90 backdrop-blur-sm">{act.price}</Badge>}
            </div>
            {isOwner && (
              <div className="absolute top-4 right-4">
                <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
              </div>
            )}
          </div>

          <div className="p-8">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">{act.title}</h1>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Date de début</p>
                <p className="font-medium text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  {formatDate(act.start_date)}
                </p>
              </div>
              {act.end_date && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Date de fin</p>
                  <p className="font-medium text-gray-700 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-brand-600" />
                    {formatDate(act.end_date)}
                  </p>
                </div>
              )}
              {act.location && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Lieu</p>
                  <p className="font-medium text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />{act.location}
                  </p>
                </div>
              )}
              {act.max_participants && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Participants max</p>
                  <p className="font-medium text-gray-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-600" />{act.max_participants} personnes
                  </p>
                </div>
              )}
            </div>

            {/* Organization */}
            {act.organization && (
              <Link href={`/organizations/${act.organization.id}`}>
                <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl mb-6 hover:bg-brand-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    {act.organization.logo_url ? (
                      <img src={act.organization.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-5 h-5 text-brand-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Organisé par</p>
                    <p className="font-semibold text-brand-700">{act.organization.name}</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Description */}
            <div className="mb-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{act.description}</p>
            </div>

            {/* Register */}
            {!isOwner && isUpcoming && (
              <div className="border-t border-gray-100 pt-6">
                {act.registration_link ? (
                  <a href={act.registration_link} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="w-full">S'inscrire via le lien officiel</Button>
                  </a>
                ) : (
                  <Button size="lg" className="w-full" loading={registering}
                    onClick={handleRegister} disabled={registered}>
                    {registered ? '✅ Inscription confirmée' : 'S\'inscrire à cette activité'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

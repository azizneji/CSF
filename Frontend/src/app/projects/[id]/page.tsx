'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Building2, CalendarDays, Target, Trash2, Edit, MapPin, Clock } from 'lucide-react'

const STATUS_COLORS: any = {
  planning:  'bg-blue-50 text-blue-700',
  active:    'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  paused:    'bg-amber-50 text-amber-700',
}
const STATUS_LABELS: any = {
  planning: '🗓️ En préparation', active: '🟢 En cours',
  completed: '✅ Terminé', paused: '⏸️ En pause',
}
const TYPE_EMOJIS: any = {
  training: '📚', health: '🏥', conference: '🎤', workshop: '🛠️',
  campaign: '📢', fundraiser: '💰', volunteering: '🤝', cultural: '🎭', sport: '⚽', other: '📌',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(r => setProject(r.data))
      .catch(() => router.push('/projects'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Supprimer ce projet ?')) return
    await api.delete(`/projects/${id}`)
    toast({ title: 'Projet supprimé', variant: 'success' })
    router.push('/projects')
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-2xl mb-6" />
        <div className="bg-white rounded-2xl p-8 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    </MainLayout>
  )

  if (!project) return null

  const isOwner = user && project.created_by === user.id

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="font-display text-2xl font-bold text-gray-900">{project.title}</h1>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status]}`}>
                  {STATUS_LABELS[project.status]}
                </span>
              </div>
              {project.organization?.name && (
                <Link href={`/organizations/${project.organization?.id}`}>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600">
                    <Building2 className="w-4 h-4" />{project.organization.name}
                  </div>
                </Link>
              )}
            </div>
            {isOwner && (
              <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6 text-sm">
            {project.start_date && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Début</p>
                <p className="font-medium text-gray-700 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-brand-600" />{formatDate(project.start_date)}
                </p>
              </div>
            )}
            {project.end_date && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Fin prévue</p>
                <p className="font-medium text-gray-700 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-brand-600" />{formatDate(project.end_date)}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>

          {/* Objectives */}
          {project.objectives && (
            <div className="mb-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-600" />Objectifs
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">{project.objectives}</p>
            </div>
          )}

          {/* Activities */}
          {project.activities?.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-brand-600" />
                Activités liées ({project.activities.length})
              </h2>
              <div className="space-y-3">
                {project.activities.map((act: any) => (
                  <Link key={act.id} href={`/activities/${act.id}`}>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-brand-50 transition-colors">
                      <span className="text-2xl">{TYPE_EMOJIS[act.type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{act.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {act.start_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{formatDate(act.start_date)}
                            </span>
                          )}
                          {act.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{act.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { api, orgsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { Plus, FolderOpen, Building2, CalendarDays, Target, ChevronRight } from 'lucide-react'

const STATUS_COLORS: any = {
  planning:   'bg-blue-50 text-blue-700 border-blue-100',
  active:     'bg-green-50 text-green-700 border-green-100',
  completed:  'bg-gray-100 text-gray-600 border-gray-200',
  paused:     'bg-amber-50 text-amber-700 border-amber-100',
}

const STATUS_LABELS: any = {
  planning: '🗓️ En préparation',
  active: '🟢 En cours',
  completed: '✅ Terminé',
  paused: '⏸️ En pause',
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (user) {
      orgsApi.getMine().then(r => {
        const orgs = (r.data || []).map((m: any) => m.organization).filter(Boolean)
        setMyOrgs(orgs)
        if (orgs.length > 0) setSelectedOrg(orgs[0].id)
      }).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (!selectedOrg) return
    setLoading(true)
    api.get(`/projects/organization/${selectedOrg}`, { params: { status: statusFilter || undefined } })
      .then(r => setProjects(r.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [selectedOrg, statusFilter])

  if (!user) return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Connectez-vous pour voir vos projets</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button>Se connecter</Button>
        </Link>
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Projets</h1>
            <p className="text-gray-500">Gérez les projets de vos organisations.</p>
          </div>
          {selectedOrg && (
            <Link href="/projects/create">
              <Button><Plus className="w-4 h-4" />Nouveau projet</Button>
            </Link>
          )}
        </div>

        {/* Org selector */}
        {myOrgs.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex gap-2 flex-wrap">
            {myOrgs.map(org => (
              <button key={org.id} onClick={() => setSelectedOrg(org.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedOrg === org.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center">
                  {org.logo_url
                    ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                    : <Building2 className="w-3 h-3" />}
                </div>
                {org.name}
              </button>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: '', label: 'Tous' },
            { value: 'planning', label: '🗓️ Planification' },
            { value: 'active', label: '🟢 Actifs' },
            { value: 'completed', label: '✅ Terminés' },
            { value: 'paused', label: '⏸️ En pause' },
          ].map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s.value ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Projects */}
        {myOrgs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Vous n'êtes membre d'aucune organisation</p>
            <Link href="/organizations/create" className="mt-4 inline-block">
              <Button variant="secondary">Créer une organisation</Button>
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucun projet pour le moment</p>
            <Link href="/projects/create" className="mt-4 inline-block">
              <Button>Créer un projet</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft card-lift p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {project.start_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />{formatDate(project.start_date)}
                        </span>
                      )}
                      {project.activities?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />{project.activities.length} activité(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  ArrowLeft, Users, CalendarDays, Briefcase, Newspaper,
  Wrench, FolderOpen, TrendingUp, UserPlus, Clock, ChevronRight
} from 'lucide-react'

const TYPE_LABELS: any = {
  training: 'Formation', health: 'Santé', conference: 'Conférence',
  workshop: 'Atelier', campaign: 'Campagne', fundraiser: 'Collecte',
  volunteering: 'Bénévolat', cultural: 'Culturel', sport: 'Sport', other: 'Autre',
}

const TYPE_COLORS: any = {
  training: '#3b82f6', health: '#22c55e', conference: '#8b5cf6',
  workshop: '#f59e0b', campaign: '#ec4899', fundraiser: '#14b8a6',
  volunteering: '#06b6d4', cultural: '#f97316', sport: '#84cc16', other: '#94a3b8',
}

const CHART_COLOR = '#16803c'
const CHART_COLOR_2 = '#86efac'

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  const colors: any = {
    brand:  'bg-brand-50 text-brand-600',
    green:  'bg-green-50 text-green-600',
    blue:   'bg-blue-50 text-blue-600',
    sand:   'bg-sand-50 text-sand-600',
    purple: 'bg-purple-50 text-purple-600',
    gray:   'bg-gray-100 text-gray-500',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color] || colors.gray}`}>
          <Icon className="w-5 h-5" />
        </div>
        {sub !== undefined && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            +{sub} ce mois
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 font-display">{value?.toLocaleString() ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function SectionTitle({ children }: any) {
  return <h2 className="font-display text-lg font-bold text-gray-900 mb-4">{children}</h2>
}

export default function OrgAnalyticsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) return
    api.get(`/analytics/organizations/${id}`)
      .then(r => setData(r.data))
      .catch(err => {
        if (err.response?.status === 403) router.push(`/organizations/${id}`)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }, [id, user])

  const pieData = data?.charts?.activity_types
    ? Object.entries(data.charts.activity_types).map(([type, count]: any) => ({
        name: TYPE_LABELS[type] || type,
        value: count,
        color: TYPE_COLORS[type] || '#94a3b8',
      }))
    : []

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-')
    return new Date(+year, +month - 1).toLocaleDateString('fr-TN', { month: 'short', year: '2-digit' })
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </MainLayout>
  )

  if (error || !data) return (
    <MainLayout>
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Impossible de charger les analytiques.</p>
        <Link href={`/organizations/${id}`}>
          <Button variant="secondary" className="mt-4">Retour</Button>
        </Link>
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <Link href={`/organizations/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="w-4 h-4" /> {data.org.name}
            </Link>
            <h1 className="font-display text-3xl font-bold text-gray-900">Analytiques</h1>
            <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de l'activité de votre organisation</p>
          </div>
          <div className="flex gap-2">
            {data.highlights.pending_join_requests > 0 && (
              <Link href={`/organizations/${id}/edit`}>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">
                    {data.highlights.pending_join_requests} demande{data.highlights.pending_join_requests > 1 ? 's' : ''} d'adhésion
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Users}       label="Membres"       value={data.totals.members}       sub={data.highlights.new_members_30d} color="brand"  />
          <StatCard icon={CalendarDays} label="Activités"    value={data.totals.activities}    color="green"  />
          <StatCard icon={Briefcase}   label="Opportunités"  value={data.totals.opportunities} color="sand"   />
          <StatCard icon={Newspaper}   label="Publications"  value={data.totals.posts}         color="blue"   />
          <StatCard icon={Wrench}      label="Services"      value={data.totals.services}      color="purple" />
          <StatCard icon={FolderOpen}  label="Projets"       value={data.totals.projects}      color="gray"   />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">

          {/* Members over time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <SectionTitle>Nouveaux membres par mois</SectionTitle>
            {data.charts.members_by_month?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.charts.members_by_month.map((d: any) => ({ ...d, month: formatMonth(d.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 13 }}
                    formatter={(v: any) => [`${v} membre${v > 1 ? 's' : ''}`, '']}
                  />
                  <Bar dataKey="count" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Pas encore de données
              </div>
            )}
          </div>

          {/* Activities over time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <SectionTitle>Activités créées par mois</SectionTitle>
            {data.charts.activities_by_month?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.charts.activities_by_month.map((d: any) => ({ ...d, month: formatMonth(d.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 13 }}
                    formatter={(v: any) => [`${v} activité${v > 1 ? 's' : ''}`, '']}
                  />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLOR} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLOR }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Pas encore d'activités
              </div>
            )}
          </div>
        </div>

        {/* Pie + Recent members */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">

          {/* Activity type breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <SectionTitle>Types d'activités</SectionTitle>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 13 }}
                      formatter={(v: any, name: any) => [v, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Pas encore d'activités
              </div>
            )}
          </div>

          {/* Recent members */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Membres récents</SectionTitle>
              <Link href={`/organizations/${id}`}>
                <Button variant="ghost" size="sm" className="text-xs">Voir tous <ChevronRight className="w-3 h-3" /></Button>
              </Link>
            </div>
            {data.recent.members.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Aucun membre encore</div>
            ) : (
              <div className="space-y-3">
                {data.recent.members.map((m: any) => (
                  <div key={m.user?.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={getAvatarUrl(m.user?.full_name, m.user?.avatar_url)} />
                      <AvatarFallback className="text-xs">{getInitials(m.user?.full_name || 'M')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.user?.full_name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatDate(m.created_at)}
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs capitalize flex-shrink-0">{m.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent activities */}
        {data.recent.activities.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Dernières activités</SectionTitle>
              <Link href="/activities">
                <Button variant="ghost" size="sm" className="text-xs">Voir toutes <ChevronRight className="w-3 h-3" /></Button>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {data.recent.activities.map((act: any) => (
                <Link key={act.id} href={`/activities/${act.id}`}>
                  <div className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{act.title}</p>
                      <p className="text-xs text-gray-400">
                        {TYPE_LABELS[act.type] || act.type}
                        {act.start_date && ` · ${new Date(act.start_date).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}`}
                        {act.location && ` · ${act.location}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}

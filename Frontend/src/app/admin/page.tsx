'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import {
  Users, Building2, Briefcase, FileText, Activity,
  BookOpen, Wrench, ShieldCheck, TrendingUp, Settings,
  AlertCircle, Eye, ChevronRight
} from 'lucide-react'

const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getVerifications: (status?: string) => api.get('/admin/verifications', { params: { status } }),
}

function StatCard({ label, value, icon: Icon, color, href }: any) {
  return (
    <Link href={href || '#'}>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft hover:shadow-card transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
        <p className="text-3xl font-bold text-gray-900 font-display">{value?.toLocaleString() ?? '—'}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if ((user as any).role !== 'superadmin') {
      router.push('/dashboard'); return
    }
    Promise.all([
      adminApi.getStats(),
      adminApi.getVerifications('pending'),
    ]).then(([statsRes, verRes]) => {
      setStats(statsRes.data)
      setPendingVerifications(verRes.data || [])
    }).catch(() => toast({ title: 'Erreur chargement', variant: 'error' }))
    .finally(() => setLoading(false))
  }, [user])

  if (!user || (user as any).role !== 'superadmin') return null

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme CSF</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="w-11 h-11 bg-gray-200 rounded-xl mb-4" />
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Utilisateurs"  value={stats?.totals?.users}        icon={Users}     color="bg-blue-500"   href="/admin/users" />
          <StatCard label="Organisations" value={stats?.totals?.orgs}         icon={Building2} color="bg-brand-600"  href="/admin/organizations" />
          <StatCard label="Entreprises"   value={stats?.totals?.enterprises}  icon={Briefcase} color="bg-sand-500"   href="/admin/organizations" />
          <StatCard label="Publications"  value={stats?.totals?.posts}        icon={FileText}  color="bg-purple-500" href="/admin/content" />
          <StatCard label="Opportunités"  value={stats?.totals?.opportunities} icon={Briefcase} color="bg-orange-500" href="#" />
          <StatCard label="Activités"     value={stats?.totals?.activities}   icon={Activity}  color="bg-green-500"  href="#" />
          <StatCard label="Documents"     value={stats?.totals?.publications} icon={BookOpen}  color="bg-indigo-500" href="#" />
          <StatCard label="Services"      value={stats?.totals?.services}     icon={Wrench}    color="bg-teal-500"   href="/admin/services" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending verifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              Vérifications en attente
            </h2>
            <Link href="/admin/verifications">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingVerifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune demande en attente</div>
            ) : (
              pendingVerifications.slice(0, 5).map((req: any) => (
                <div key={req.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{req.organization?.name}</p>
                    <p className="text-xs text-gray-400">{req.submitter?.email}</p>
                  </div>
                  <Link href="/admin/verifications">
                    <Button size="sm" variant="secondary">
                      <Eye className="w-3.5 h-3.5" /> Examiner
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft">
          <div className="p-6 border-b border-gray-50">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              Activité récente
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl">
              <div>
                <p className="text-2xl font-bold text-brand-700 font-display">{stats?.new_users_30d ?? '—'}</p>
                <p className="text-sm text-brand-600">Nouveaux membres (30j)</p>
              </div>
              <Users className="w-8 h-8 text-brand-300" />
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div>
                <p className="text-2xl font-bold text-orange-700 font-display">{stats?.pending_verifications ?? '—'}</p>
                <p className="text-sm text-orange-600">Vérifications en attente</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-300" />
            </div>
            <Link href="/admin/settings" className="block">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <Settings className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-700">Paramètres de la plateforme</p>
                  <p className="text-xs text-gray-400">Textes, logo, couleurs, nom</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
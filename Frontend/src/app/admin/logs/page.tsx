'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, getAvatarUrl } from '@/lib/utils'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACTION_COLORS: any = {
  delete_organization: 'bg-red-100 text-red-700',
  verify_organization: 'bg-green-100 text-green-700',
  verification_approved: 'bg-green-100 text-green-700',
  verification_rejected: 'bg-red-100 text-red-700',
  impersonate: 'bg-purple-100 text-purple-700',
  bulk_create_users: 'bg-blue-100 text-blue-700',
  update_settings: 'bg-sand-100 text-sand-700',
  delete_post: 'bg-red-100 text-red-700',
}

const ACTION_LABELS: any = {
  delete_organization: '🗑️ Suppression d\'organisation',
  verify_organization: '✅ Vérification d\'organisation',
  verification_approved: '✅ Vérification approuvée',
  verification_rejected: '❌ Vérification rejetée',
  impersonate: '👤 Impersonation',
  bulk_create_users: '👥 Création en masse',
  update_settings: '⚙️ Paramètres modifiés',
  delete_post: '🗑️ Publication supprimée',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  const fetchLogs = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/logs', { params: { page: p } })
      setLogs(res.data.data || [])
      setTotal(res.data.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs(page) }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Logs d'activité</h1>
        <p className="text-gray-500 text-sm mt-0.5">{total} actions enregistrées</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Aucun log enregistré
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Admin', 'Action', 'Cible', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={getAvatarUrl(log.admin?.full_name, log.admin?.avatar_url)} />
                          <AvatarFallback className="text-xs">{getInitials(log.admin?.full_name || 'A')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.admin?.full_name || 'Système'}</p>
                          <p className="text-xs text-gray-400">{log.admin?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.target_type && (
                        <div className="text-sm text-gray-600">
                          <span className="text-xs text-gray-400 capitalize">{log.target_type}</span>
                          {log.target_id && (
                            <p className="text-xs font-mono text-gray-400 truncate max-w-[160px]">{log.target_id}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

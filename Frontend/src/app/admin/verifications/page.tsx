'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { ShieldCheck, FileText, Building2, ExternalLink, Check, X, Mail, Phone } from 'lucide-react'

const adminApi = {
  getVerifications: (status?: string) => api.get('/admin/verifications', { params: { status } }),
  review: (id: string, status: string, note?: string) => api.patch(`/admin/verifications/${id}`, { status, note }),
}

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getVerifications(filter || undefined)
      setRequests(res.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [filter])

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setReviewing(id)
    try {
      await adminApi.review(id, status, note)
      toast({ title: status === 'approved' ? '✅ Organisation vérifiée !' : '❌ Demande rejetée', variant: 'success' })
      setSelectedId(null); setNote('')
      fetchRequests()
    } catch { toast({ title: 'Erreur', variant: 'error' }) }
    finally { setReviewing(null) }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Demandes de vérification</h1>
        <p className="text-gray-500 text-sm mt-1">Examinez les dossiers soumis par les organisations</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', ''].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s === 'pending' ? '⏳ En attente' : s === 'approved' ? '✅ Approuvées' : s === 'rejected' ? '❌ Rejetées' : 'Toutes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Aucune demande {filter === 'pending' ? 'en attente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{req.organization?.name}</h3>
                      <p className="text-sm text-gray-500">
                        Soumis par {req.submitter?.full_name} · {formatDate(req.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={req.status === 'pending' ? 'sand' : req.status === 'approved' ? 'green' : 'red'}>
                    {req.status === 'pending' ? 'En attente' : req.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                  </Badge>
                </div>

                {/* Contact info */}
                {(req.contact_email || req.contact_phone) && (
                  <div className="mt-4 flex flex-wrap gap-4 p-3 bg-gray-50 rounded-xl">
                    {req.contact_email && (
                      <a href={`mailto:${req.contact_email}`}
                        className="flex items-center gap-1.5 text-sm text-brand-700 hover:underline">
                        <Mail className="w-3.5 h-3.5" /> {req.contact_email}
                      </a>
                    )}
                    {req.contact_phone && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Phone className="w-3.5 h-3.5" /> {req.contact_phone}
                      </span>
                    )}
                  </div>
                )}

                {/* Documents */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'jort_url',    label: 'JORT'    },
                    { key: 'statuts_url', label: 'Statuts' },
                    { key: 'patente_url', label: 'Patente' },
                  ].map(({ key, label }) => (
                    <a key={key} href={req[key]} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-colors ${
                        req[key]
                          ? 'bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer'
                          : 'bg-gray-50 text-gray-300 pointer-events-none'
                      }`}>
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                      {req[key] && <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0" />}
                    </a>
                  ))}
                  {/* RNE from extra_docs[0] if present */}
                  {req.extra_docs?.[0] && (
                    <a href={req.extra_docs[0]} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl text-sm bg-brand-50 text-brand-700 hover:bg-brand-100">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>RNE</span>
                      <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0" />
                    </a>
                  )}
                </div>

                {req.admin_note && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                    <span className="font-medium">Note admin :</span> {req.admin_note}
                  </div>
                )}

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="mt-4 border-t border-gray-50 pt-4">
                    {selectedId === req.id ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Note optionnelle (ex: raison du rejet)..."
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                        />
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>Annuler</Button>
                          <Button size="sm" variant="danger"
                            loading={reviewing === req.id}
                            onClick={() => handleReview(req.id, 'rejected')}>
                            <X className="w-4 h-4" /> Rejeter
                          </Button>
                          <Button size="sm"
                            loading={reviewing === req.id}
                            onClick={() => handleReview(req.id, 'approved')}>
                            <Check className="w-4 h-4" /> Approuver et vérifier
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedId(req.id)}>
                        Examiner la demande
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

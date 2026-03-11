'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { MessageCircle, CheckCircle2, Clock, AlertTriangle, Shield, FileText, HelpCircle, ChevronDown, ChevronUp, X } from 'lucide-react'

const CATEGORY_LABELS: any = {
  technical: 'Problème technique',
  account: 'Mon compte',
  organization: 'Organisation / Vérification',
  report: 'Signalement',
  other: 'Autre',
}

const CATEGORY_ICONS: any = {
  technical: AlertTriangle,
  account: Shield,
  organization: FileText,
  report: AlertTriangle,
  other: HelpCircle,
}

const CATEGORY_COLORS: any = {
  technical: 'text-red-500 bg-red-50',
  account: 'text-blue-500 bg-blue-50',
  organization: 'text-brand-600 bg-brand-50',
  report: 'text-orange-500 bg-orange-50',
  other: 'text-gray-500 bg-gray-100',
}

const STATUS_COLORS: any = {
  open: 'text-amber-600 bg-amber-50 border-amber-200',
  in_progress: 'text-blue-600 bg-blue-50 border-blue-200',
  resolved: 'text-green-600 bg-green-50 border-green-200',
  closed: 'text-gray-500 bg-gray-100 border-gray-200',
}

const STATUS_LABELS: any = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await api.get('/support', { params: { status: filter || undefined } })
      setTickets(res.data || [])
    } catch { toast({ title: 'Erreur chargement', variant: 'error' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [filter])

  const handleUpdate = async (id: string, status: string) => {
    setSaving(id)
    try {
      await api.patch(`/support/${id}`, { status, admin_note: notes[id] || undefined })
      toast({ title: 'Ticket mis à jour', variant: 'success' })
      fetchTickets()
      setExpanded(null)
    } catch { toast({ title: 'Erreur', variant: 'error' }) }
    finally { setSaving(null) }
  }

  const counts = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-500 text-sm mt-0.5">Demandes d'assistance des utilisateurs</p>
        </div>
        {(counts.open + counts.in_progress) > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">{counts.open + counts.in_progress} à traiter</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'open',        label: '🟡 Ouverts' },
          { value: 'in_progress', label: '🔵 En cours' },
          { value: 'resolved',    label: '✅ Résolus' },
          { value: 'closed',      label: '⬜ Fermés' },
          { value: '',            label: 'Tous' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Aucun ticket {filter ? STATUS_LABELS[filter]?.toLowerCase() : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => {
            const Icon = CATEGORY_ICONS[ticket.category] || HelpCircle
            const isOpen = expanded === ticket.id
            return (
              <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                {/* Header */}
                <div
                  className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : ticket.id)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${CATEGORY_COLORS[ticket.category]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{ticket.subject}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-gray-400">{ticket.email}</p>
                      <span className="text-gray-200">·</span>
                      <p className="text-xs text-gray-400">{CATEGORY_LABELS[ticket.category]}</p>
                      <span className="text-gray-200">·</span>
                      <p className="text-xs text-gray-400">{formatDate(ticket.created_at)}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-5 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Message de l'utilisateur</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    {ticket.user && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Envoyé par</span>
                        <span className="font-medium text-gray-700">{ticket.user.full_name}</span>
                        <span>({ticket.user.email})</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Note interne / Réponse</label>
                      <textarea rows={3} placeholder="Ajoutez une note ou réponse (optionnel)..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        value={notes[ticket.id] || ticket.admin_note || ''}
                        onChange={e => setNotes(n => ({ ...n, [ticket.id]: e.target.value }))} />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {ticket.status !== 'in_progress' && (
                        <Button size="sm" variant="secondary" onClick={() => handleUpdate(ticket.id, 'in_progress')}
                          loading={saving === ticket.id}>
                          🔵 Marquer en cours
                        </Button>
                      )}
                      {ticket.status !== 'resolved' && (
                        <Button size="sm" onClick={() => handleUpdate(ticket.id, 'resolved')}
                          loading={saving === ticket.id}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Résoudre
                        </Button>
                      )}
                      {ticket.status !== 'closed' && (
                        <Button size="sm" variant="ghost" onClick={() => handleUpdate(ticket.id, 'closed')}
                          loading={saving === ticket.id}>
                          <X className="w-3.5 h-3.5" /> Fermer
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

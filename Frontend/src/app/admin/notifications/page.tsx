'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials, getAvatarUrl } from '@/lib/utils'
import {
  Bell, Send, Users, User, Search, X, Megaphone,
  CalendarX, MapPin, Briefcase, AlertTriangle, CheckCircle2,
} from 'lucide-react'

const TEMPLATES = [
  {
    icon: CalendarX,
    label: 'Annulation d\'événement',
    color: 'text-red-600 bg-red-50',
    message: '⚠️ L\'événement "[NOM]" prévu le [DATE] est annulé. Nous vous présentons nos excuses.',
    link: '/activities',
  },
  {
    icon: MapPin,
    label: 'Changement de lieu',
    color: 'text-amber-600 bg-amber-50',
    message: '📍 Le lieu de l\'événement "[NOM]" a changé. Nouveau lieu : [ADRESSE]',
    link: '/activities',
  },
  {
    icon: Briefcase,
    label: 'Deadline opportunité',
    color: 'text-blue-600 bg-blue-50',
    message: '⏰ Dernière chance ! La candidature pour "[NOM]" se clôture le [DATE].',
    link: '/opportunities',
  },
  {
    icon: Megaphone,
    label: 'Annonce générale',
    color: 'text-brand-600 bg-brand-50',
    message: '',
    link: '',
  },
]

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all')
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<null | { count: number }>(null)

  // Search users
  useEffect(() => {
    if (!userSearch.trim() || userSearch.length < 2) { setSearchResults([]); return }
    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get('/admin/users', { params: { search: userSearch, limit: 10 } })
        setSearchResults(res.data?.data || [])
      } catch {} finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [userSearch])

  const applyTemplate = (tpl: any) => {
    setMessage(tpl.message)
    setLink(tpl.link)
  }

  const toggleUser = (u: any) => {
    setSelectedUsers(prev =>
      prev.find(x => x.id === u.id)
        ? prev.filter(x => x.id !== u.id)
        : [...prev, u]
    )
  }

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setSent(null)
    try {
      const body: any = { message: message.trim(), link: link.trim() || undefined }
      if (targetMode === 'specific' && selectedUsers.length > 0) {
        body.user_ids = selectedUsers.map(u => u.id)
      }
      const res = await api.post('/notifications/admin/broadcast', body)
      setSent({ count: res.data.sent })
      setMessage(''); setLink(''); setSelectedUsers([])
      toast({ title: `Notification envoyée à ${res.data.sent} utilisateurs`, variant: 'success' })
    } catch {
      toast({ title: 'Erreur lors de l\'envoi', variant: 'error' })
    } finally { setSending(false) }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Envoyez des notifications à tous les utilisateurs ou à une sélection</p>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Modèles rapides</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((tpl) => (
            <button key={tpl.label} onClick={() => applyTemplate(tpl)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tpl.color}`}>
                <tpl.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-700">{tpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Composer la notification</p>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{message.length} caractères</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Lien (optionnel)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/activities ou /opportunities/..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Target audience */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Destinataires</p>

        <div className="flex gap-2">
          <button
            onClick={() => setTargetMode('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              targetMode === 'all'
                ? 'bg-brand-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <Users className="w-4 h-4" /> Tous les utilisateurs
          </button>
          <button
            onClick={() => setTargetMode('specific')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              targetMode === 'specific'
                ? 'bg-brand-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <User className="w-4 h-4" /> Utilisateurs spécifiques
          </button>
        </div>

        {targetMode === 'specific' && (
          <div className="space-y-3">
            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1.5 rounded-full">
                    <span>{u.full_name}</span>
                    <button onClick={() => toggleUser(u)} className="hover:text-brand-900">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {searchResults.map(u => {
                  const selected = selectedUsers.find(x => x.id === u.id)
                  return (
                    <button key={u.id} onClick={() => toggleUser(u)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${selected ? 'bg-brand-50' : ''}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={getAvatarUrl(u.full_name, u.avatar_url)} />
                        <AvatarFallback className="text-xs">{getInitials(u.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      {selected && <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}

            {targetMode === 'specific' && selectedUsers.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                ⚠️ Aucun utilisateur sélectionné — la notification ne sera pas envoyée
              </p>
            )}
          </div>
        )}
      </div>

      {/* Send */}
      <div className="flex items-center justify-between">
        <div>
          {targetMode === 'all' && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Envoi à tous les utilisateurs
            </p>
          )}
          {targetMode === 'specific' && selectedUsers.length > 0 && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
            </p>
          )}
          {sent && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Envoyé à {sent.count} utilisateurs
            </p>
          )}
        </div>
        <Button
          onClick={handleSend}
          loading={sending}
          disabled={!message.trim() || (targetMode === 'specific' && selectedUsers.length === 0)}
          className="gap-2">
          <Send className="w-4 h-4" /> Envoyer la notification
        </Button>
      </div>
    </div>
  )
}

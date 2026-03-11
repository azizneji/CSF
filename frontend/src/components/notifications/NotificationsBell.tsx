'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { Bell, Check, CheckCheck, UserPlus, Building2, ShieldCheck, MessageCircle, Heart, X } from 'lucide-react'

const NOTIF_ICONS: any = {
  connection_request:   { icon: UserPlus,     color: 'text-blue-500 bg-blue-50' },
  connection_accepted:  { icon: UserPlus,     color: 'text-green-500 bg-green-50' },
  join_request:         { icon: Building2,    color: 'text-brand-600 bg-brand-50' },
  join_accepted:        { icon: Building2,    color: 'text-green-600 bg-green-50' },
  org_verified:         { icon: ShieldCheck,  color: 'text-green-600 bg-green-50' },
  new_comment:          { icon: MessageCircle,color: 'text-purple-500 bg-purple-50' },
  new_reaction:         { icon: Heart,        color: 'text-red-500 bg-red-50' },
  default:              { icon: Bell,         color: 'text-gray-500 bg-gray-100' },
}

function NotifIcon({ type }: { type: string }) {
  const cfg = NOTIF_ICONS[type] || NOTIF_ICONS.default
  const Icon = cfg.icon
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
      <Icon className="w-4 h-4" />
    </div>
  )
}

export function NotificationsBell() {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = async () => {
    if (!user) return
    try {
      const res = await api.get('/notifications')
      const data = res.data || []
      setNotifs(data.slice(0, 20))
      setUnread(data.filter((n: any) => !n.is_read).length)
    } catch {}
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [user])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifs(n => n.map(x => ({ ...x, is_read: true })))
      setUnread(0)
    } catch {}
  }

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
      setUnread(c => Math.max(0, c - 1))
    } catch {}
  }

  const handleClick = (notif: any) => {
    markRead(notif.id)
    setOpen(false)
    if (notif.link) router.push(notif.link)
  }

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
        aria-label="Notifications">
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fade-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-display font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifs.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.is_read ? 'bg-brand-50/30' : ''}`}>
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

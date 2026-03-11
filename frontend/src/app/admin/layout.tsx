'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import {
  TrendingUp, Users, Building2, ShieldCheck,
  FileText, Wrench, Settings, Activity, LogOut,
  MessageCircle, Clock, BarChart2
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [badges, setBadges] = useState({ verifications: 0, support: 0 })

  useEffect(() => {
    if (!loading && (!user || (user as any).role !== 'superadmin')) {
      router.push('/dashboard')
    }
  }, [user, loading])

  useEffect(() => {
    if (!user || (user as any).role !== 'superadmin') return
    Promise.all([
      api.get('/admin/stats').catch(() => ({ data: {} })),
      api.get('/support', { params: { status: 'open' } }).catch(() => ({ data: [] })),
    ]).then(([statsRes, supportRes]) => {
      setBadges({
        verifications: statsRes.data?.pending_verifications || 0,
        support: (supportRes.data || []).length,
      })
    })
  }, [user])

  if (loading || !user || (user as any).role !== 'superadmin') return null

  const NAV = [
    { href: '/admin',               icon: TrendingUp,    label: 'Tableau de bord' },
    { href: '/admin/analytics',     icon: BarChart2,     label: 'Analytics' },
    { href: '/admin/users',         icon: Users,         label: 'Utilisateurs' },
    { href: '/admin/organizations', icon: Building2,     label: 'Organisations' },
    { href: '/admin/verifications', icon: ShieldCheck,   label: 'Vérifications', badge: badges.verifications },
    { href: '/admin/support',       icon: MessageCircle, label: 'Support',        badge: badges.support },
    { href: '/admin/settings',      icon: Settings,      label: 'Paramètres' },
    { href: '/admin/logs',          icon: Activity,      label: 'Logs' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col fixed h-full">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">CSF</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Superadmin</p>
              <p className="text-xs text-gray-400 truncate max-w-36">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label, badge }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                pathname === href
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" /> Retour au site
            </button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { api, usersApi, connectionsApi, orgsApi } from '@/lib/api'
import { getInitials, getAvatarUrl, formatDate, ORG_CATEGORY_LABELS } from '@/lib/utils'
import {
  Building2, Briefcase, Users, Plus, Bell, ArrowRight, MapPin,
  CalendarDays, BookOpen, Wrench, FolderOpen, Newspaper, Search,
  UserCheck, Clock, ShieldCheck, Edit, ExternalLink, ChevronRight
} from 'lucide-react'

function QuickAction({ href, icon: Icon, label, color }: any) {
  const colorMap: any = {
    brand: 'bg-brand-100 text-brand-600 group-hover:bg-brand-200',
    sand:  'bg-sand-100 text-sand-600 group-hover:bg-sand-200',
    green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
    blue:  'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
    gray:  'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
  }
  return (
    <Link href={href}>
      <div className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-soft card-lift cursor-pointer animate-fade-up flex flex-col items-center gap-2 text-center">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${colorMap[color] || colorMap.gray}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-gray-700 leading-tight">{label}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    Promise.all([
      usersApi.getMyOrganizations().catch(() => ({ data: [] })),
      connectionsApi.getPending().catch(() => ({ data: [] })),
      api.get('/activities', { params: { upcoming: true } }).catch(() => ({ data: { data: [] } })),
      orgsApi.getMine().catch(() => ({ data: [] })),
    ]).then(([orgsRes, pendingRes, actRes, mineRes]) => {
      setMyOrgs(orgsRes.data || [])
      setPending(pendingRes.data || [])
      setRecentActivity((actRes.data?.data || actRes.data || []).slice(0, 4))
      // Collect pending join requests across all my admin orgs
      const adminOrgs = (mineRes.data || []).filter((m: any) => ['admin', 'manager'].includes(m.role))
      setJoinRequests(adminOrgs) // store orgs with pending requests flag
    }).finally(() => setLoadingData(false))
  }, [user])

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
    </div>
  )

  const profileComplete = [
    user.bio, user.location, user.avatar_url,
    (user as any).skills?.length, (user as any).sector
  ].filter(Boolean).length
  const profilePct = Math.round((profileComplete / 5) * 100)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-4 ring-brand-100">
                <AvatarImage src={getAvatarUrl(user.full_name, user.avatar_url)} />
                <AvatarFallback className="text-lg">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              {profilePct < 80 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-900">
                Bonjour, {user.full_name.split(' ')[0]} 👋
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {(user as any).location && (
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{(user as any).location}
                  </span>
                )}
                <span className="text-gray-400 text-xs">Membre depuis {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Alert badges */}
          <div className="flex gap-2 flex-wrap">
            {pending.length > 0 && (
              <Link href="/connections">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 hover:bg-blue-100 transition-colors">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700 font-medium">{pending.length} connexion{pending.length > 1 ? 's' : ''} en attente</span>
                </div>
              </Link>
            )}
            {joinRequests.length > 0 && (
              <Link href="/organizations">
                <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2 hover:bg-brand-100 transition-colors">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-brand-700 font-medium">Demandes d'adhésion</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Profile completion */}
        {profilePct < 80 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Complétez votre profil — {profilePct}%</p>
              <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${profilePct}%` }} />
              </div>
            </div>
            <Link href="/profile/edit">
              <Button size="sm" variant="secondary" className="flex-shrink-0">
                <Edit className="w-3.5 h-3.5" /> Compléter
              </Button>
            </Link>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3 mb-10">
          <QuickAction href="/feed"             icon={Newspaper}    label="Actualité"      color="gray"  />
          <QuickAction href="/activities"       icon={CalendarDays} label="Activités"      color="green" />
          <QuickAction href="/opportunities"    icon={Briefcase}    label="Opportunités"   color="sand"  />
          <QuickAction href="/knowledge"        icon={BookOpen}     label="Connaissances"  color="blue"  />
          <QuickAction href="/organizations"    icon={Users}        label="Organisations"  color="brand" />
          <QuickAction href="/services"         icon={Wrench}       label="Services"       color="gray"  />
          <QuickAction href="/projects"         icon={FolderOpen}   label="Projets"        color="brand" />
          <QuickAction href="/connections"      icon={UserCheck}    label="Connexions"     color="blue"  />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* My organizations — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-gray-900">Mes organisations</h2>
                <Link href="/organizations/create">
                  <Button variant="secondary" size="sm"><Plus className="w-4 h-4" /> Créer</Button>
                </Link>
              </div>
              {loadingData ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-16" />
                  ))}
                </div>
              ) : myOrgs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">Vous ne faites partie d'aucune organisation.</p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/organizations/create">
                      <Button size="sm">Créer</Button>
                    </Link>
                    <Link href="/organizations">
                      <Button size="sm" variant="secondary">Explorer</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrgs.map((m: any) => (
                    <Link key={m.organization.id} href={`/organizations/${m.organization.id}`}>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-soft flex items-center gap-3 card-lift">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {m.organization.logo_url
                            ? <img src={m.organization.logo_url} alt="" className="w-full h-full object-cover" />
                            : <Building2 className="w-5 h-5 text-brand-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{m.organization.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="default" className="text-xs capitalize">{m.role}</Badge>
                            {m.organization.is_verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
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

            {/* Upcoming activities */}
            {recentActivity.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-gray-900">Activités à venir</h2>
                  <Link href="/activities?upcoming=true">
                    <Button variant="ghost" size="sm">Voir tout <ArrowRight className="w-3.5 h-3.5" /></Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentActivity.map((act: any) => (
                    <Link key={act.id} href={`/activities/${act.id}`}>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-soft flex items-center gap-3 card-lift">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {act.cover_url
                            ? <img src={act.cover_url} alt="" className="w-full h-full object-cover" />
                            : <CalendarDays className="w-5 h-5 text-green-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate text-sm">{act.title}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(act.start_date).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}
                            {act.location && <><span className="mx-1">·</span><MapPin className="w-3 h-3" />{act.location}</>}
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

          {/* Right col — profile card + links */}
          <div className="space-y-6">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={getAvatarUrl(user.full_name, user.avatar_url)} />
                  <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              {(user as any).bio && (
                <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-brand-200 pl-3 mb-4 line-clamp-3">
                  {(user as any).bio}
                </p>
              )}
              <div className="flex gap-2">
                <Link href={`/profile/${user.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> Voir
                  </Button>
                </Link>
                <Link href="/profile/edit" className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    <Edit className="w-3.5 h-3.5" /> Modifier
                  </Button>
                </Link>
              </div>
            </div>

            {/* Create shortcuts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
              <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Publier</h3>
              <div className="space-y-1">
                {[
                  { href: '/organizations/create',  icon: Building2,    label: 'Nouvelle organisation' },
                  { href: '/enterprises/create',    icon: Briefcase,    label: 'Nouvelle entreprise' },
                  { href: '/opportunities/create',  icon: Briefcase,    label: 'Opportunité' },
                  { href: '/knowledge/create',      icon: BookOpen,     label: 'Document / Publication' },
                  { href: '/services/create',       icon: Wrench,       label: 'Service gratuit' },
                  { href: '/projects/create',       icon: FolderOpen,   label: 'Projet' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 hover:text-gray-900">
                      <Icon className="w-4 h-4 text-gray-400" />
                      {label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

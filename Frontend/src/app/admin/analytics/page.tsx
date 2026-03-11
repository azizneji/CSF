'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, TrendingUp, TrendingDown, Activity, Building2,
  CalendarDays, MessageSquare, Heart, UserCheck, Zap,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Globe,
  Smartphone, Monitor, Tablet, GitMerge, Target, RotateCcw,
} from 'lucide-react'

// ─── Colours ──────────────────────────────────────────────────
const C = {
  brand:  '#16803c',
  blue:   '#3b82f6',
  purple: '#8b5cf6',
  amber:  '#f59e0b',
  rose:   '#f43f5e',
  teal:   '#14b8a6',
  sky:    '#0ea5e9',
  lime:   '#84cc16',
  gray:   '#94a3b8',
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: C.brand,
  mobile:  C.blue,
  tablet:  C.amber,
  unknown: C.gray,
}

const SOURCE_COLORS: Record<string, string> = {
  organic:          C.brand,
  referral:         C.blue,
  social_facebook:  '#1877F2',
  social_linkedin:  '#0A66C2',
  social_instagram: '#E1306C',
  partner:          C.purple,
}

// ─── Helpers ──────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
function fmtMonth(m: string) {
  return new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}
function pct(n: number) { return `${n}%` }

// ─── Sub-components ───────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, subPositive, color = 'brand', suffix = '' }: any) {
  const bg: Record<string, string> = {
    brand:  'bg-brand-50 text-brand-600',
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber:  'bg-amber-50 text-amber-600',
    rose:   'bg-rose-50 text-rose-600',
    teal:   'bg-teal-50 text-teal-600',
    gray:   'bg-gray-100 text-gray-500',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {sub !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            subPositive === true  ? 'text-green-600 bg-green-50' :
            subPositive === false ? 'text-red-500 bg-red-50' :
            'text-gray-500 bg-gray-100'
          }`}>
            {subPositive === true  ? <ArrowUpRight className="w-3 h-3" /> :
             subPositive === false ? <ArrowDownRight className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 font-display">
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, color = 'brand' }: any) {
  const colors: Record<string, string> = {
    brand:  'bg-brand-100 text-brand-700',
    blue:   'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    amber:  'bg-amber-100 text-amber-700',
    teal:   'bg-teal-100 text-teal-700',
    rose:   'bg-rose-100 text-rose-700',
  }
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-display text-xl font-bold text-gray-900">{title}</h2>
    </div>
  )
}

function ChartCard({ title, children, className = '' }: any) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-soft p-5 ${className}`}>
      {title && <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">{title}</p>}
      {children}
    </div>
  )
}

function RetentionBar({ label, value }: { label: string; value: number }) {
  const color = value >= 40 ? C.brand : value >= 20 ? C.amber : C.rose
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-14">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold text-gray-900 w-10 text-right">{value}%</span>
    </div>
  )
}

const LOADING_SECTIONS = [1,2,3,4,5,6,7]

// ─── Main Dashboard ───────────────────────────────────────────
export default function PlatformAnalyticsDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await api.get('/platform-analytics')
      setData(res.data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="p-8 space-y-6">
      <div className="h-8 bg-gray-200 rounded-xl w-64 animate-pulse" />
      {LOADING_SECTIONS.map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(j => <div key={j} className="h-20 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      ))}
    </div>
  )

  if (!data) return (
    <div className="p-8 text-center text-gray-400">Impossible de charger les analytics.</div>
  )

  const { userGrowth, engagement, community, organizations, events, matching, retention } = data

  return (
    <div className="p-6 space-y-10 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Analytics Plateforme</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-400 mt-1">
              Mis à jour le {lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ══ 1. USER GROWTH ══════════════════════════════════════ */}
      <section>
        <SectionHeader icon={TrendingUp} title="Croissance des utilisateurs" color="brand" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Users}     label="Total utilisateurs"   value={userGrowth.totals.total}      color="brand" />
          <KpiCard icon={UserCheck} label="Nouveaux ce mois"     value={userGrowth.totals.new_month}  color="blue"
            sub={`${userGrowth.totals.growth_rate > 0 ? '+' : ''}${userGrowth.totals.growth_rate}%`}
            subPositive={userGrowth.totals.growth_rate > 0} />
          <KpiCard icon={Zap}       label="Taux d'activation"    value={userGrowth.totals.activation_rate} suffix="%" color="amber" />
          <KpiCard icon={Activity}  label="Utilisateurs activés" value={userGrowth.totals.activated}  color="teal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Inscriptions — 30 derniers jours" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userGrowth.charts.daily_signups}>
                <defs>
                  <linearGradient id="gBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.brand} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.brand} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={fmtDate} />
                <Area type="monotone" dataKey="count" stroke={C.brand} fill="url(#gBrand)" strokeWidth={2} name="Inscriptions" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Source d'acquisition">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={userGrowth.charts.by_source} dataKey="count" nameKey="source"
                  cx="50%" cy="50%" outerRadius={70} label={({ source, percent }: any) =>
                    `${source} ${Math.round(percent * 100)}%`}>
                  {userGrowth.charts.by_source.map((entry: any, i: number) => (
                    <Cell key={i} fill={SOURCE_COLORS[entry.source] || C.gray} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {userGrowth.charts.by_country.length > 0 && (
          <ChartCard title="Top pays" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {userGrowth.charts.by_country.slice(0, 10).map((c: any) => (
                <div key={c.country} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700 truncate">{c.country}</span>
                  <span className="ml-auto text-xs font-bold text-gray-900">{c.count}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </section>

      {/* ══ 2. ENGAGEMENT ════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={Activity} title="Engagement utilisateurs" color="blue" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Users} label="Actifs aujourd'hui (DAU)" value={engagement.totals.dau}  color="blue" />
          <KpiCard icon={Users} label="Actifs ce mois (MAU)"     value={engagement.totals.mau}  color="brand" />
          <KpiCard icon={Zap}   label="Stickiness (DAU/MAU)"     value={engagement.totals.stickiness} suffix="%" color="purple"
            sub={engagement.totals.stickiness >= 20 ? 'Bon' : engagement.totals.stickiness >= 10 ? 'Moyen' : 'Faible'}
            subPositive={engagement.totals.stickiness >= 20 ? true : engagement.totals.stickiness >= 10 ? undefined : false} />
          <KpiCard icon={Activity} label="Durée moy. session" value={`${engagement.totals.avg_session_min}min`} color="teal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="DAU — 14 derniers jours" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={engagement.charts.dau_trend}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={fmtDate} />
                <Area type="monotone" dataKey="count" stroke={C.blue} fill="url(#gBlue)" strokeWidth={2} name="Utilisateurs actifs" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Appareils">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={engagement.charts.devices} dataKey="count" nameKey="device"
                  cx="50%" cy="50%" outerRadius={70}
                  label={({ device, percent }: any) => `${device} ${Math.round(percent * 100)}%`}>
                  {engagement.charts.devices.map((entry: any, i: number) => (
                    <Cell key={i} fill={DEVICE_COLORS[entry.device] || C.gray} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {[{d:'desktop',icon:Monitor},{d:'mobile',icon:Smartphone},{d:'tablet',icon:Tablet}].map(({d, icon: Icon}) => {
                const entry = engagement.charts.devices.find((e: any) => e.device === d)
                return entry ? (
                  <div key={d} className="flex items-center gap-1 text-xs text-gray-500">
                    <Icon className="w-3 h-3" style={{ color: DEVICE_COLORS[d] }} />
                    {entry.count.toLocaleString()}
                  </div>
                ) : null
              })}
            </div>
          </ChartCard>
        </div>
      </section>

      {/* ══ 3. COMMUNITY INTERACTION ═════════════════════════════ */}
      <section>
        <SectionHeader icon={MessageSquare} title="Interactions communautaires" color="teal" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={GitMerge}    label="Connexions totales"   value={community.totals.connections}       color="brand" />
          <KpiCard icon={GitMerge}    label="Connexions ce mois"   value={community.totals.connections_month} color="teal" />
          <KpiCard icon={MessageSquare} label="Messages envoyés"   value={community.totals.messages}          color="blue" />
          <KpiCard icon={Heart}       label="Réactions sur posts"  value={community.totals.reactions}         color="rose" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <KpiCard icon={MessageSquare} label="Commentaires"          value={community.totals.comments}   color="purple" />
          <KpiCard icon={Building2}     label="Abonnements aux orgs"  value={community.totals.org_follows} color="amber" />
          <KpiCard icon={MessageSquare} label="Messages ce mois"      value={community.totals.messages_month} color="sky" />
        </div>

        <ChartCard title="Nouvelles connexions — 30 jours">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={community.charts.connections_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={fmtDate} />
              <Bar dataKey="count" fill={C.teal} radius={[4,4,0,0]} name="Connexions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ══ 4. ORGANIZATIONS ═════════════════════════════════════ */}
      <section>
        <SectionHeader icon={Building2} title="Organisations" color="purple" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Building2}  label="Total organisations"  value={organizations.totals.total}         color="brand" />
          <KpiCard icon={UserCheck}  label="Vérifiées"            value={organizations.totals.verified}      color="purple"
            sub={`${Math.round((organizations.totals.verified / Math.max(organizations.totals.total,1))*100)}%`} />
          <KpiCard icon={CalendarDays} label="Activités créées"   value={organizations.totals.activities}    color="teal" />
          <KpiCard icon={Target}     label="Opportunités postées" value={organizations.totals.opportunities} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Répartition par catégorie">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={organizations.charts.by_category} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill={C.purple} radius={[0,4,4,0]} name="Orgs" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Croissance des organisations">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={organizations.charts.org_growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={fmtMonth} />
                <Bar dataKey="count" fill={C.brand} radius={[4,4,0,0]} name="Nouvelles orgs" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      {/* ══ 5. EVENTS ════════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={CalendarDays} title="Activités & Événements" color="amber" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={CalendarDays} label="Total événements"    value={events.totals.total}         color="brand" />
          <KpiCard icon={CalendarDays} label="Créés ce mois"       value={events.totals.new_month}     color="amber" />
          <KpiCard icon={UserCheck}    label="Inscriptions totales" value={events.totals.registrations} color="teal" />
          <KpiCard icon={Target}       label="Moy. inscrits/event"  value={events.totals.avg_registrations} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Types d'événements">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={events.charts.by_type} dataKey="count" nameKey="type"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ type, percent }: any) => `${type} ${Math.round(percent * 100)}%`}>
                  {events.charts.by_type.map((_: any, i: number) => (
                    <Cell key={i} fill={Object.values(C)[i % Object.values(C).length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Prochains événements">
            {events.upcoming.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun événement à venir.</p>
            ) : (
              <div className="space-y-2">
                {events.upcoming.map((ev: any) => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(ev.start_date).toLocaleDateString('fr-FR')} · {ev.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </section>

      {/* ══ 6. MATCHING / ECOSYSTEM ══════════════════════════════ */}
      <section>
        <SectionHeader icon={GitMerge} title="Écosystème & Matching" color="rose" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Users}      label="Membres d'orgs (total)" value={matching.totals.total_joins}       color="brand" />
          <KpiCard icon={UserCheck}  label="Nouveaux membres/mois"  value={matching.totals.joins_month}       color="teal" />
          <KpiCard icon={Target}     label="Taux d'acceptation"     value={matching.totals.conversion_rate}   suffix="%" color="purple"
            sub={matching.totals.conversion_rate >= 60 ? 'Excellent' : 'Moyen'}
            subPositive={matching.totals.conversion_rate >= 60} />
          <KpiCard icon={GitMerge}   label="Collabs org–entreprise" value={matching.totals.collab_connections} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Demandes d'adhésion" className="lg:col-span-1">
            <div className="space-y-3 mt-2">
              {[
                { label: 'Acceptées',  value: matching.totals.accepted_requests, color: C.brand },
                { label: 'En attente', value: matching.totals.pending_requests,  color: C.amber },
                { label: 'Rejetées',   value: matching.totals.rejected_requests, color: C.rose  },
              ].map(({ label, value, color }) => {
                const total = matching.totals.accepted_requests + matching.totals.pending_requests + matching.totals.rejected_requests
                const pct = total ? Math.round((value / total) * 100) : 0
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-20">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-12 text-right">{value.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </ChartCard>

          <ChartCard title="Nouvelles adhésions — 30 jours" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={matching.charts.join_trend}>
                <defs>
                  <linearGradient id="gRose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.rose} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.rose} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={fmtDate} />
                <Area type="monotone" dataKey="count" stroke={C.rose} fill="url(#gRose)" strokeWidth={2} name="Adhésions" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      {/* ══ 7. RETENTION ════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={RotateCcw} title="Rétention" color="teal" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={`Cohorte de ${retention.cohort_size} utilisateurs (il y a 30 jours)`}>
            <div className="space-y-4 mt-2">
              <RetentionBar label="Jour 1"  value={retention.retention.day_1} />
              <RetentionBar label="Jour 7"  value={retention.retention.day_7} />
              <RetentionBar label="Jour 30" value={retention.retention.day_30} />
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Pourcentage des utilisateurs encore actifs après X jours d'inscription.
            </p>
          </ChartCard>

          <ChartCard title="Churn">
            <div className="flex items-center justify-center flex-col h-full py-4">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9155" fill="none"
                    stroke={retention.churn.churn_rate > 40 ? C.rose : retention.churn.churn_rate > 20 ? C.amber : C.brand}
                    strokeWidth="3"
                    strokeDasharray={`${retention.churn.churn_rate} ${100 - retention.churn.churn_rate}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{retention.churn.churn_rate}%</span>
                  <span className="text-xs text-gray-400">Churn</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {retention.churn.churned_users.toLocaleString()} utilisateurs inactifs depuis 30+ jours
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {retention.churn.churn_rate <= 20 ? '✅ Churn sain (< 20%)' :
                 retention.churn.churn_rate <= 40 ? '⚠️ Churn modéré (20–40%)' :
                 '🔴 Churn élevé — action requise'}
              </p>
            </div>
          </ChartCard>
        </div>
      </section>

    </div>
  )
}

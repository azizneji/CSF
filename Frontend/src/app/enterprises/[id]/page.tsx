'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { enterprisesApi, connectionsApi, opportunitiesApi, knowledgeApi, feedApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { Enterprise } from '@/types'
import { ENTERPRISE_SECTOR_LABELS, ENTERPRISE_SIZE_LABELS, formatDate, getAvatarUrl, getInitials } from '@/lib/utils'
import {
  Briefcase, MapPin, Globe, Calendar, Edit, Trash2, UserPlus,
  ArrowLeft, Clock, Building2, Newspaper, BookOpen, ArrowRight, Mail
} from 'lucide-react'
import { MessageButton } from '@/components/messaging/MessageButton'

const TABS = [
  { id: 'about',         label: 'À propos',     icon: Building2  },
  { id: 'posts',         label: 'Publications', icon: Newspaper  },
  { id: 'opportunities', label: 'Opportunités', icon: Briefcase  },
  { id: 'knowledge',     label: 'Ressources',   icon: BookOpen   },
]

const OPP_TYPE_LABELS: Record<string, string> = {
  job: 'Emploi', consultant: 'Consultant', tender: 'Appel d\'offres',
  volunteer: 'Bénévolat', internship: 'Stage', grant: 'Subvention',
}

export default function EnterpriseDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()

  const [enterprise, setEnterprise] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [tab, setTab] = useState('about')

  const [posts, setPosts] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [knowledge, setKnowledge] = useState<any[]>([])
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    enterprisesApi.getById(id as string)
      .then((r) => setEnterprise(r.data))
      .catch(() => router.push('/enterprises'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || tab === 'about') return
    setContentLoading(true)
    const load = async () => {
      try {
        if (tab === 'posts') {
          const r = await feedApi.getByAuthor('enterprise', id as string)
          setPosts(r.data?.data || [])
        } else if (tab === 'opportunities') {
          const r = await opportunitiesApi.getAll({ poster_id: id as string })
          setOpportunities(r.data?.data || [])
        } else if (tab === 'knowledge') {
          const r = await knowledgeApi.getAll({ author_type: 'enterprise', author_id: id as string })
          setKnowledge(r.data?.data || [])
        }
      } finally {
        setContentLoading(false)
      }
    }
    load()
  }, [tab, id])

  const isOwner = user && enterprise?.created_by === user.id

  const handleConnect = async () => {
    if (!user) { router.push('/auth/login'); return }
    setConnecting(true)
    try {
      await connectionsApi.request({
        requester_type: 'user', requester_id: user.id,
        target_type: 'enterprise', target_id: enterprise!.id,
      })
      setRequested(true)
      toast({ title: 'Demande envoyée !', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally { setConnecting(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette entreprise ?')) return
    await enterprisesApi.delete(enterprise!.id)
    toast({ title: 'Entreprise supprimée', variant: 'success' })
    router.push('/enterprises')
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="bg-white rounded-2xl p-8">
          <div className="flex gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )

  if (!enterprise) return null

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/enterprises" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux entreprises
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 mb-4 animate-fade-up">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-sand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {enterprise.logo_url
                  ? <img src={enterprise.logo_url} alt={enterprise.name} className="w-full h-full object-cover" />
                  : <Briefcase className="w-9 h-9 text-sand-600" />}
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">{enterprise.name}</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="sand">{ENTERPRISE_SECTOR_LABELS[enterprise.sector] || enterprise.sector}</Badge>
                  <Badge variant="gray">{ENTERPRISE_SIZE_LABELS[enterprise.size] || enterprise.size}</Badge>
                  {enterprise.location && <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{enterprise.location}</Badge>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-end">
              {isOwner ? (
                <>
                  <Link href={`/enterprises/${enterprise.id}/edit`}>
                    <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
                </>
              ) : user ? (
                <>
                  {requested
                    ? <Button size="sm" variant="secondary" disabled><Clock className="w-4 h-4" /> Demande envoyée</Button>
                    : <Button size="sm" onClick={handleConnect} loading={connecting}><UserPlus className="w-4 h-4" /> Se connecter</Button>}
                  <MessageButton theirType="enterprise" theirId={enterprise.id} />
                </>
              ) : (
                <Link href="/auth/login">
                  <Button size="sm"><UserPlus className="w-4 h-4" /> Se connecter</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button
              key={tid}
              onClick={() => setTab(tid)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
                tab === tid ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'about' && (
          <Card className="animate-fade-up">
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-600 leading-relaxed">{enterprise.description}</p>
              <div className="flex flex-wrap gap-6 text-sm text-gray-500 pt-4 border-t border-gray-50">
                {enterprise.website && (
                  <a href={enterprise.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
                    <Globe className="w-4 h-4" />{enterprise.website.replace('https://', '')}
                  </a>
                )}
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Inscrite le {formatDate(enterprise.created_at)}</span>
              </div>
              {enterprise.creator && (
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-2">Enregistrée par</p>
                  <Link href={`/profile/${enterprise.creator.id}`}>
                    <div className="flex items-center gap-2 hover:text-brand-600 transition-colors w-fit">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={getAvatarUrl(enterprise.creator.full_name, enterprise.creator.avatar_url)} />
                        <AvatarFallback className="text-xs">{getInitials(enterprise.creator.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700">{enterprise.creator.full_name}</span>
                    </div>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'posts' && (
          <div className="space-y-4 animate-fade-up">
            {contentLoading ? <Skeleton /> : posts.length === 0
              ? <Empty label="Aucune publication" />
              : posts.map((p: any) => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
                  <p className="text-gray-700 leading-relaxed">{p.content}</p>
                  {p.images?.length > 0 && (
                    <div className="mt-3 grid gap-2 grid-cols-2">
                      {p.images.map((img: string, i: number) => <img key={i} src={img} alt="" className="rounded-xl object-cover w-full max-h-48" />)}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3">{formatDate(p.created_at)}</p>
                </div>
              ))}
          </div>
        )}

        {tab === 'opportunities' && (
          <div className="space-y-3 animate-fade-up">
            {contentLoading ? <Skeleton /> : opportunities.length === 0
              ? <Empty label="Aucune opportunité" />
              : opportunities.map((o: any) => (
                <Link key={o.id} href={`/opportunities/${o.id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-soft hover:shadow-card transition-shadow p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="sand">{OPP_TYPE_LABELS[o.type] || o.type}</Badge>
                        {o.location && <span className="text-xs text-gray-400">{o.location}</span>}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">{o.title}</p>
                      {o.deadline && <p className="text-xs text-gray-400 mt-0.5">Deadline: {formatDate(o.deadline)}</p>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
          </div>
        )}

        {tab === 'knowledge' && (
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-up">
            {contentLoading ? <Skeleton /> : knowledge.length === 0
              ? <Empty label="Aucune ressource" />
              : knowledge.map((k: any) => (
                <Link key={k.id} href={`/knowledge/${k.id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-soft hover:shadow-card transition-shadow p-4">
                    {k.cover_url && <img src={k.cover_url} alt="" className="w-full h-28 object-cover rounded-lg mb-3" />}
                    <Badge variant="default" className="mb-2">{k.category}</Badge>
                    <p className="font-semibold text-gray-900 text-sm">{k.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(k.created_at)}</p>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

function Skeleton() {
  return (
    <div className="col-span-full space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  )
}

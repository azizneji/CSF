'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { orgsApi, connectionsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { Organization } from '@/types'
import { ORG_CATEGORY_LABELS, formatDate, getInitials, getAvatarUrl } from '@/lib/utils'
import { Building2, MapPin, Globe, Users, Calendar, Edit, Trash2, UserPlus, ArrowLeft, Shield, CheckCircle2, Clock } from 'lucide-react'

export default function OrganizationDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    orgsApi.getById(id as string)
      .then((r) => setOrg(r.data))
      .catch(() => router.push('/organizations'))
      .finally(() => setLoading(false))
  }, [id])

  const isAdmin  = user && org?.members?.some((m: any) => m.user.id === user.id && m.role === 'admin')
  const isMember = user && org?.members?.some((m: any) => m.user.id === user.id)

  const handleConnect = async () => {
    if (!user) { router.push('/auth/login'); return }
    setConnecting(true)
    try {
      await connectionsApi.request({
        requester_type: 'user',
        requester_id: user.id,
        target_type: 'organization',
        target_id: org!.id,
      })
      setRequested(true)
      toast({ title: 'Demande envoyée !', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setConnecting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette organisation ?')) return
    await orgsApi.delete(org!.id)
    toast({ title: 'Organisation supprimée', variant: 'success' })
    router.push('/organizations')
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="bg-white rounded-2xl p-8">
          <div className="flex gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2 w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-gray-100 rounded" />)}
          </div>
        </div>
      </div>
    </MainLayout>
  )

  if (!org) return null

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        <Link href="/organizations" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux organisations
        </Link>

        {/* Verification banner — visible to admin only when not verified */}
        {isAdmin && !org.is_verified && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Cette organisation n'est pas encore vérifiée</p>
                <p className="text-xs text-amber-700">Soumettez vos documents officiels pour obtenir le badge de vérification.</p>
              </div>
            </div>
            <Link href={`/organizations/${org.id}/verify`} className="flex-shrink-0">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-0">
                <Shield className="w-3.5 h-3.5" /> Faire vérifier
              </Button>
            </Link>
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 mb-6 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building2 className="w-9 h-9 text-brand-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-display text-3xl font-bold text-gray-900">{org.name}</h1>
                  {org.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" title="Organisation vérifiée" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">{ORG_CATEGORY_LABELS[org.category] || org.category}</Badge>
                  {org.location && (
                    <Badge variant="gray"><MapPin className="w-3 h-3 mr-1" />{org.location}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              {isAdmin && (
                <>
                  <Link href={`/organizations/${org.id}/edit`}>
                    <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              {!isMember && user && (
                requested
                  ? <Button size="sm" variant="secondary" disabled><Clock className="w-4 h-4" /> Demande envoyée</Button>
                  : <Button size="sm" onClick={handleConnect} loading={connecting}><UserPlus className="w-4 h-4" /> Rejoindre</Button>
              )}
              {!user && (
                <Link href="/auth/login">
                  <Button size="sm"><UserPlus className="w-4 h-4" /> Rejoindre</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-50">
            <p className="text-gray-600 leading-relaxed">{org.description}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500">
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
                <Globe className="w-4 h-4" />{org.website.replace('https://', '')}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />Créée le {formatDate(org.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />{org.members?.length || 0} membres
            </span>
          </div>
        </div>

        {/* Members */}
        <Card className="animate-fade-up">
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" /> Membres
            </h2>
            {!org.members || org.members.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun membre.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 stagger">
                {org.members.map((m: any) => (
                  <Link key={m.user.id} href={`/profile/${m.user.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors animate-fade-up">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={getAvatarUrl(m.user.full_name, m.user.avatar_url)} />
                        <AvatarFallback>{getInitials(m.user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.user.full_name}</p>
                        <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

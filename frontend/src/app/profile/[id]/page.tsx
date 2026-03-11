'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { usersApi, connectionsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { Profile, Organization } from '@/types'
import { getInitials, getAvatarUrl, formatDate, ORG_CATEGORY_LABELS } from '@/lib/utils'
import { MapPin, Globe, Phone, Calendar, Edit, UserPlus, Building2, ArrowLeft, Clock } from 'lucide-react'
import { MessageButton } from '@/components/messaging/MessageButton'

export default function ProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    usersApi.getById(id as string)
      .then((res) => setProfile(res.data))
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Profil introuvable'
        setError(msg)
        console.error('[ProfilePage] failed to load profile:', err)
      })
      .finally(() => setLoading(false))
  }, [id])

  const isOwnProfile = user?.id === id

  const handleConnect = async () => {
    if (!user) { router.push('/auth/login'); return }
    setConnecting(true)
    try {
      await connectionsApi.request({
        requester_type: 'user',
        requester_id: user.id,
        target_type: 'user',
        target_id: id as string,
      })
      setRequested(true)
      toast({ title: 'Demande de connexion envoyée !', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setConnecting(false)
    }
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
        <div className="bg-white rounded-2xl p-8 flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    </MainLayout>
  )

  if (error || !profile) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-500 mb-4">{error || 'Profil introuvable'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 mb-6 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <Avatar className="w-20 h-20 ring-4 ring-brand-50">
                <AvatarImage src={getAvatarUrl(profile.full_name, profile.avatar_url)} />
                <AvatarFallback className="text-2xl">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">{profile.full_name}</h1>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  {profile.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
                  )}
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Membre depuis {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {isOwnProfile ? (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm"><Edit className="w-4 h-4" /> Modifier</Button>
                </Link>
              ) : user ? (
                <>
                  {requested ? (
                    <Button size="sm" variant="secondary" disabled>
                      <Clock className="w-4 h-4" /> Demande envoyée
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleConnect} loading={connecting}>
                      <UserPlus className="w-4 h-4" /> Connecter
                    </Button>
                  )}
                  <MessageButton theirType="user" theirId={id as string} />
                </>
              ) : (
                <Link href="/auth/login">
                  <Button size="sm"><UserPlus className="w-4 h-4" /> Connecter</Button>
                </Link>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-gray-50">
              <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-5 text-sm text-gray-500">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
                <Globe className="w-4 h-4" />{profile.website.replace('https://', '')}
              </a>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{profile.phone}</span>
            )}
          </div>
        </div>

        {/* Organizations */}
        {profile.organizations && profile.organizations.length > 0 && (
          <Card className="animate-fade-up">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" /> Organisations
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 stagger">
                {(profile as any).organizations.map((org: Organization) => (
                  <Link key={org.id} href={`/organizations/${org.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-50 transition-colors animate-fade-up">
                      <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                        <Badge variant="default" className="mt-0.5">{ORG_CATEGORY_LABELS[org.category] || org.category}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

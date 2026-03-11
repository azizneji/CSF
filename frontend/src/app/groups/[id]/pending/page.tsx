'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function GroupPendingPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    try {
      const [postsRes, reqRes] = await Promise.all([
        api.get(`/groups/${id}/posts/pending`),
        api.get(`/groups/${id}/join-requests`),
      ])
      setPosts(postsRes.data || [])
      setRequests(reqRes.data || [])
    } catch {
      router.push(`/groups/${id}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (postId: string, action: 'approved' | 'rejected') => {
    try {
      await api.patch(`/groups/${id}/posts/${postId}/approve`, { action })
      toast({ title: action === 'approved' ? 'Publication approuvée' : 'Publication rejetée', variant: 'success' })
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  const handleRequest = async (requestId: string, action: 'accepted' | 'rejected', name: string) => {
    try {
      await api.patch(`/groups/${id}/join-requests/${requestId}`, { action })
      toast({ title: action === 'accepted' ? `${name} a rejoint le groupe` : `Demande de ${name} rejetée`, variant: 'success' })
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
    </MainLayout>
  )

  const total = posts.length + requests.length

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href={`/groups/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au groupe
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">En attente</h1>
          {total > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{total}</span>
          )}
        </div>

        {total === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">Tout est à jour. Aucun élément en attente.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Join requests */}
            {requests.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">
                  Demandes d&apos;adhésion ({requests.length})
                </h2>
                <div className="space-y-3">
                  {requests.map((req: any) => (
                    <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getAvatarUrl(req.user?.full_name, req.user?.avatar_url)} />
                        <AvatarFallback>{getInitials(req.user?.full_name || '')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{req.user?.full_name}</p>
                        {req.message && <p className="text-xs text-gray-500 truncate">{req.message}</p>}
                        <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRequest(req.id, 'accepted', req.user?.full_name)}>
                          <CheckCircle className="w-4 h-4" /> Accepter
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRequest(req.id, 'rejected', req.user?.full_name)}>
                          <XCircle className="w-4 h-4" /> Refuser
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending posts */}
            {posts.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">
                  Publications à approuver ({posts.length})
                </h2>
                <div className="space-y-3">
                  {posts.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={getAvatarUrl(post.author?.full_name, post.author?.avatar_url)} />
                          <AvatarFallback>{getInitials(post.author?.full_name || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{post.author?.full_name}</p>
                          <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4 line-clamp-4">{post.content}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handlePost(post.id, 'approved')}>
                          <CheckCircle className="w-4 h-4" /> Approuver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePost(post.id, 'rejected')}>
                          <XCircle className="w-4 h-4" /> Rejeter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

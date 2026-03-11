'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils'
import {
  ArrowLeft, Users, Settings, MessageCircle, Newspaper, Heart,
  Send, Globe, Lock, CheckCircle, EyeOff, Image, Loader2,
  Clock, ShieldAlert, UserPlus, LogOut
} from 'lucide-react'

const VISIBILITY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  public:   { label: 'Public',    icon: Globe,       color: 'text-green-600' },
  approval: { label: 'Sur approbation', icon: CheckCircle, color: 'text-amber-600' },
  private:  { label: 'Privé',    icon: Lock,        color: 'text-red-600' },
  hidden:   { label: 'Caché',    icon: EyeOff,      color: 'text-gray-600' },
}

export default function GroupPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'feed' | 'chat'>('feed')
  const [posts, setPosts] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [postContent, setPostContent] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [sending, setSending] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinStatus, setJoinStatus] = useState<string | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadGroup() }, [id])
  useEffect(() => {
    if (group?.membership) {
      if (tab === 'feed') loadPosts()
      if (tab === 'chat') loadMessages()
    }
  }, [tab, group?.membership])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadGroup = async () => {
    try {
      const res = await api.get(`/groups/${id}`)
      setGroup(res.data)
    } catch {
      router.push('/groups')
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const res = await api.get(`/groups/${id}/posts`)
      setPosts(res.data || [])
    } catch {}
  }

  const loadMessages = async () => {
    try {
      const res = await api.get(`/groups/${id}/messages`)
      setMessages(res.data || [])
    } catch {}
  }

  const handleJoin = async () => {
    if (!user) { router.push('/auth/login'); return }
    setJoining(true)
    try {
      const res = await api.post(`/groups/${id}/join`)
      if (res.data.status === 'pending') {
        setJoinStatus('pending')
        toast({ title: 'Demande envoyée', variant: 'success' })
      } else {
        toast({ title: 'Vous avez rejoint le groupe !', variant: 'success' })
        loadGroup()
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Quitter ce groupe ?')) return
    try {
      await api.post(`/groups/${id}/leave`)
      toast({ title: 'Vous avez quitté le groupe', variant: 'success' })
      router.push('/groups')
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  const handlePost = async () => {
    if (!postContent.trim()) return
    setPosting(true)
    try {
      const res = await api.post(`/groups/${id}/posts`, { content: postContent })
      setPostContent('')
      if (res.data.requiresApproval) {
        toast({ title: 'Publication soumise pour approbation', variant: 'success' })
      } else {
        toast({ title: 'Publication créée', variant: 'success' })
        loadPosts()
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setPosting(false)
    }
  }

  const handleReact = async (postId: string) => {
    try {
      await api.post(`/groups/${id}/posts/${postId}/react`, { type: 'like' })
      loadPosts()
    } catch {}
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/groups/${id}/messages`, { content: chatInput })
      setChatInput('')
      setMessages(prev => [...prev, res.data])
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </MainLayout>
  )

  if (!group) return null

  const isMember = !!group.membership
  const isAdmin = ['admin', 'owner'].includes(group.membership)
  const vis = VISIBILITY_CONFIG[group.visibility] || VISIBILITY_CONFIG.public
  const VisIcon = vis.icon

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* Group header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden mb-6">
          <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-800 relative">
            {group.cover_url && <img src={group.cover_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">{group.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                  <span className={`flex items-center gap-1 ${vis.color}`}>
                    <VisIcon className="w-3.5 h-3.5" /> {vis.label}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {group.member_count} membre{group.member_count !== 1 ? 's' : ''}
                  </span>
                  <span>Créé le {formatDate(group.created_at)}</span>
                </div>
                {group.description && <p className="text-gray-600 mt-2 text-sm">{group.description}</p>}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {isAdmin && (
                  <>
                    <Link href={`/groups/${id}/pending`}>
                      <Button variant="outline" size="sm"><ShieldAlert className="w-4 h-4" /> En attente</Button>
                    </Link>
                    <Link href={`/groups/${id}/settings`}>
                      <Button variant="outline" size="sm"><Settings className="w-4 h-4" /> Gérer</Button>
                    </Link>
                  </>
                )}
                {isMember && group.membership !== 'owner' && (
                  <Button variant="outline" size="sm" onClick={handleLeave}>
                    <LogOut className="w-4 h-4" /> Quitter
                  </Button>
                )}
                {!isMember && user && !joinStatus && (
                  <Button size="sm" onClick={handleJoin} loading={joining}>
                    <UserPlus className="w-4 h-4" />
                    {group.visibility === 'approval' ? 'Demander à rejoindre' : 'Rejoindre'}
                  </Button>
                )}
                {joinStatus === 'pending' && (
                  <Button size="sm" variant="secondary" disabled>
                    <Clock className="w-4 h-4" /> Demande envoyée
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Members preview */}
        <Link href={`/groups/${id}/members`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 mb-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" /> Voir les membres
            </span>
            <span className="text-xs text-gray-400">{group.member_count} membre{group.member_count !== 1 ? 's' : ''} →</span>
          </div>
        </Link>

        {/* Gate: must be member to see content */}
        {!isMember ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Rejoignez le groupe pour accéder aux publications et au chat.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
              {[
                { key: 'feed', label: 'Publications', icon: Newspaper },
                { key: 'chat', label: 'Chat', icon: MessageCircle },
              ].map(t => {
                const TIcon = t.icon
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as any)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TIcon className="w-4 h-4" /> {t.label}
                  </button>
                )
              })}
            </div>

            {/* FEED TAB */}
            {tab === 'feed' && (
              <div className="space-y-4">
                {/* Composer */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={getAvatarUrl(user.full_name, user.avatar_url)} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <textarea
                        value={postContent}
                        onChange={e => setPostContent(e.target.value)}
                        placeholder="Partagez quelque chose avec le groupe..."
                        rows={3}
                        className="w-full text-sm resize-none focus:outline-none text-gray-700 placeholder:text-gray-400"
                      />
                      <div className="flex justify-end mt-2">
                        <Button size="sm" onClick={handlePost} loading={posting} disabled={!postContent.trim()}>
                          <Send className="w-3.5 h-3.5" /> Publier
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posts */}
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Newspaper className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Aucune publication pour le moment.</p>
                  </div>
                ) : (
                  posts.map((post: any) => {
                    const myReaction = post.reactions?.find((r: any) => r.user_id === user?.id)
                    return (
                      <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
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
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
                        {post.image_url && (
                          <img src={post.image_url} alt="" className="rounded-xl max-h-64 object-cover mb-3" />
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-50">
                          <button
                            onClick={() => handleReact(post.id)}
                            className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${myReaction ? 'text-red-500' : ''}`}
                          >
                            <Heart className={`w-4 h-4 ${myReaction ? 'fill-current' : ''}`} />
                            {post.reactions?.length || 0}
                          </button>
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments?.length || 0} commentaire{(post.comments?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {/* Comments */}
                        {post.comments?.length > 0 && (
                          <div className="mt-3 space-y-2 pl-3 border-l-2 border-gray-100">
                            {post.comments.map((c: any) => (
                              <div key={c.id} className="text-sm">
                                <span className="font-medium text-gray-800">{c.author?.full_name} </span>
                                <span className="text-gray-600">{c.content}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {tab === 'chat' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-soft flex flex-col h-[560px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Aucun message pour le moment. Dites bonjour !</p>
                    </div>
                  ) : (
                    messages.map((msg: any) => {
                      const isMe = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarImage src={getAvatarUrl(msg.sender?.full_name, msg.sender?.avatar_url)} />
                            <AvatarFallback className="text-xs">{getInitials(msg.sender?.full_name || '')}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            {!isMe && <p className="text-xs text-gray-500 mb-0.5 ml-1">{msg.sender?.full_name}</p>}
                            <div className={`px-3 py-2 rounded-2xl text-sm ${
                              isMe ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 mx-1">{formatDate(msg.created_at)}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-100 p-3 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Écrire un message..."
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button size="sm" onClick={handleSendMessage} loading={sending} disabled={!chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils'
import { MessageSquare, Send, ArrowLeft, Building2, Briefcase, User, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
type ActorType = 'user' | 'organization' | 'enterprise'

interface Actor {
  type: ActorType
  id: string
  name: string
  avatar?: string
}

interface Message {
  id: string
  content: string
  sender_type: ActorType
  sender_id: string
  sender: Actor
  created_at: string
}

interface Conversation {
  id: string
  updated_at: string
  last_message: { content: string; created_at: string } | null
  unread_count: number
  participants: Actor[]
}

// ─── Helpers ──────────────────────────────────────────────────
function ActorIcon({ type, className = '' }: { type: ActorType; className?: string }) {
  if (type === 'organization') return <Building2 className={className} />
  if (type === 'enterprise')   return <Briefcase  className={className} />
  return <User className={className} />
}

function ActorAvatar({ actor, size = 'md' }: { actor: Actor; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
  return (
    <Avatar className={`${sz} flex-shrink-0`}>
      <AvatarImage src={getAvatarUrl(actor.name, actor.avatar)} />
      <AvatarFallback className="text-xs">{getInitials(actor.name || '?')}</AvatarFallback>
    </Avatar>
  )
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7)  return d.toLocaleDateString('fr-TN', { weekday: 'short' })
  return d.toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })
}

// ─── Main page ────────────────────────────────────────────────
export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // The actor the logged-in user is messaging AS (defaults to themselves)
  const [myActor, setMyActor] = useState<Actor | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout>()
  const activeConvRef = useRef<string | null>(null)

  // ── Init: set myActor to the logged-in user ──────────────────
  useEffect(() => {
    if (!authLoading && !user) { router.push('/auth/login'); return }
    if (user) {
      setMyActor({ type: 'user', id: user.id, name: user.full_name || user.email, avatar: user.avatar_url })
    }
  }, [user, authLoading])

  // ── Load conversations ───────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!myActor) return
    try {
      const res = await api.get('/messages/conversations', {
        params: { actor_type: myActor.type, actor_id: myActor.id }
      })
      setConversations(res.data || [])
    } catch {}
  }, [myActor])

  useEffect(() => {
    if (!myActor) return
    setLoadingConvs(true)
    loadConversations().finally(() => setLoadingConvs(false))
  }, [myActor])

  // ── Handle ?open=convId from URL (e.g. from Message button) ──
  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId && conversations.length > 0) {
      setActiveConv(openId)
    }
  }, [searchParams, conversations])

  // ── Load messages for active conversation ────────────────────
  const loadMessages = useCallback(async (convId: string, silent = false) => {
    if (!myActor) return
    if (!silent) setLoadingMsgs(true)
    try {
      const res = await api.get(`/messages/conversations/${convId}`, {
        params: { actor_type: myActor.type, actor_id: myActor.id }
      })
      setMessages(res.data.data || [])
    } catch {} finally {
      if (!silent) setLoadingMsgs(false)
    }
  }, [myActor])

  useEffect(() => {
    activeConvRef.current = activeConv
    if (!activeConv) { setMessages([]); return }
    loadMessages(activeConv)

    // Poll for new messages every 2s
    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      if (activeConvRef.current) {
        loadMessages(activeConvRef.current, true)
        loadConversations()
      }
    }, 2000)

    return () => clearInterval(pollRef.current)
  }, [activeConv])

  // ── Scroll to bottom on new messages ────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ─────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || !activeConv || !myActor || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender_type: myActor.type,
      sender_id: myActor.id,
      sender: myActor,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await api.post(`/messages/conversations/${activeConv}`, {
        actor_type: myActor.type,
        actor_id: myActor.id,
        content,
      })
      // Reload to get real message
      await loadMessages(activeConv, true)
      await loadConversations()
    } catch {
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  const activeConversation = conversations.find(c => c.id === activeConv)
  const otherActor = activeConversation?.participants?.[0]

  if (authLoading) return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-0 bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>

          {/* ── Conversation list ───────────────────────────── */}
          <div className={`flex flex-col border-r border-gray-100 ${activeConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0`}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h1 className="font-display text-xl font-bold text-gray-900">Messages</h1>
              {myActor && (
                <p className="text-xs text-gray-400 mt-0.5">En tant que : {myActor.name}</p>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center py-16">
                  <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Aucune conversation</p>
                  <p className="text-xs text-gray-400 mt-1">Envoyez un message depuis un profil, une organisation ou une entreprise.</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const other = conv.participants?.[0]
                  const isActive = conv.id === activeConv
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                        isActive ? 'bg-brand-50 border-r-2 border-brand-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      {other ? (
                        <ActorAvatar actor={other} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-sm font-semibold truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {other?.name || 'Conversation'}
                          </p>
                          {conv.last_message && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatTime(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                            {conv.last_message?.content || 'Nouvelle conversation'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 bg-brand-600 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {conv.unread_count > 9 ? '9+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Chat panel ──────────────────────────────────── */}
          <div className={`flex flex-col flex-1 min-w-0 ${activeConv ? 'flex' : 'hidden md:flex'}`}>
            {!activeConv ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <MessageSquare className="w-14 h-14 text-gray-200 mb-4" />
                <p className="font-display text-lg font-bold text-gray-700">Sélectionnez une conversation</p>
                <p className="text-sm text-gray-400 mt-1">ou démarrez-en une depuis un profil.</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white">
                  <button onClick={() => setActiveConv(null)} className="md:hidden mr-1 text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {otherActor && <ActorAvatar actor={otherActor} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{otherActor?.name || 'Conversation'}</p>
                    {otherActor && (
                      <p className="text-xs text-gray-400 capitalize flex items-center gap-1">
                        <ActorIcon type={otherActor.type} className="w-3 h-3" />
                        {otherActor.type === 'user' ? 'Citoyen' : otherActor.type === 'organization' ? 'Organisation' : 'Entreprise'}
                      </p>
                    )}
                  </div>
                  {otherActor && (
                    <Link href={
                      otherActor.type === 'user' ? `/profile/${otherActor.id}` :
                      otherActor.type === 'organization' ? `/organizations/${otherActor.id}` :
                      `/enterprises/${otherActor.id}`
                    }>
                      <Button variant="ghost" size="sm" className="text-xs text-gray-400">Voir le profil</Button>
                    </Link>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/50">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-sm text-gray-400">Envoyez le premier message !</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = myActor && msg.sender_id === myActor.id && msg.sender_type === myActor.type
                      const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id)
                      const showTime = i === messages.length - 1 ||
                        new Date(messages[i + 1]?.created_at).getTime() - new Date(msg.created_at).getTime() > 5 * 60 * 1000

                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className="w-7 h-7 flex-shrink-0">
                              {showAvatar && <ActorAvatar actor={msg.sender} size="sm" />}
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? 'bg-brand-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            {showTime && (
                              <span className="text-xs text-gray-400 mt-1 px-1">
                                {formatTime(msg.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                      <textarea
                        className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none outline-none max-h-32"
                        placeholder="Écrivez un message..."
                        rows={1}
                        value={input}
                        onChange={e => {
                          setInput(e.target.value)
                          e.target.style.height = 'auto'
                          e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      loading={sending}
                      className="rounded-xl h-10 w-10 p-0 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 px-1">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

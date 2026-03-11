'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/context/AuthContext'
import { feedApi, uploadsApi, api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils'
import {
  MessageCircle, Image, Paperclip, Send, Trash2,
  ChevronDown, Globe, Building2, Briefcase, Users,
  MessageSquare, X, Minus, ChevronUp, BookOpen, Calendar,
  ArrowRight, Loader2, FileText,
} from 'lucide-react'
import Link from 'next/link'

// ─── Reactions ────────────────────────────────────────────────
const REACTIONS = [
  { type: 'like',       emoji: '❤️',  label: "J'aime",    color: 'text-red-500'    },
  { type: 'support',    emoji: '🌱',  label: 'Soutien',    color: 'text-green-600'  },
  { type: 'inspiring',  emoji: '💪',  label: 'Inspirant',  color: 'text-orange-500' },
  { type: 'solidarity', emoji: '🤝',  label: 'Solidaire',  color: 'text-blue-500'   },
  { type: 'innovative', emoji: '💡',  label: 'Innovant',   color: 'text-yellow-500' },
]

// ─── Module card config ───────────────────────────────────────
const MODULE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string; href: string }> = {
  activity:    { icon: Calendar,  color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200', label: 'Activité',    href: '/activities'    },
  opportunity: { icon: Briefcase, color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  label: 'Opportunité', href: '/opportunities' },
  knowledge:   { icon: BookOpen,  color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',   label: 'Ressource',   href: '/knowledge'     },
  petition:    { icon: FileText,  color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200',   label: 'Pétition',    href: '/petitions'     },
}

// ════════════════════════════════════════════════════════════════
// MODULE POST CARD (activity / opportunity / knowledge / petition)
// ════════════════════════════════════════════════════════════════
function ModulePostCard({ post, currentUser, onDelete }: any) {
  const cfg = MODULE_CONFIG[post.post_type] || MODULE_CONFIG.activity
  const Icon = cfg.icon

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden animate-fade-up`}
      style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)' }}>
      <div className={`flex items-center justify-between px-5 py-3 border-b ${cfg.border}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white shadow-sm">
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
          {currentUser?.id === post.user_id && (
            <button onClick={() => onDelete(post.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Avatar className="w-8 h-8">
            <AvatarImage src={getAvatarUrl(post.author?.full_name || 'U', post.author?.avatar_url)} />
            <AvatarFallback className="text-xs">{getInitials(post.author?.full_name || 'U')}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{post.author?.full_name || 'Utilisateur'}</span>
            {post.post_type === 'petition'
              ? ' a lancé une '
              : ` a publié un${post.post_type === 'activity' ? 'e' : post.post_type === 'knowledge' ? 'e' : ''} `}
            <span className={`font-medium ${cfg.color}`}>{cfg.label.toLowerCase()}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-white/80 shadow-sm overflow-hidden">
          {post.ref_cover && (
            <img src={post.ref_cover} alt="" className="w-full h-36 object-cover" />
          )}
          <div className="p-4">
            <p className="font-semibold text-gray-900 text-base mb-1 leading-snug">
              {post.ref_title || post.content}
            </p>
            {post.ref_title && (
              <p className="text-gray-500 text-sm line-clamp-2">{post.content}</p>
            )}
          </div>
          {post.ref_id && (
            <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
              <Link href={`${cfg.href}/${post.ref_id}`}>
                <button className={`inline-flex items-center gap-1.5 text-sm font-semibold ${cfg.color} hover:opacity-80 transition-opacity`}>
                  {post.post_type === 'petition' ? 'Signer la pétition' : 'Voir plus'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// REGULAR POST CARD
// ════════════════════════════════════════════════════════════════
function PostCard({ post, currentUser, onReact, onComment, onDelete }: any) {
  const [showComments, setShowComments] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const reactionTimeout = useRef<any>(null)

  if (post.post_type && post.post_type !== 'post') {
    return <ModulePostCard post={post} currentUser={currentUser} onDelete={onDelete} />
  }

  const totalReactions = Object.values(post.reaction_counts || {}).reduce((a: number, b: unknown) => a + (b as number), 0) as number
  const userReaction = (post.reactions || []).find((r: any) => r.user_id === currentUser?.id)

  const handleReact = (type: string) => {
    if (!currentUser) return
    setShowReactions(false)
    onReact(post.id, type)
  }

  const handleComment = async () => {
    if (!commentText.trim() || !currentUser) return
    setSubmitting(true)
    try { await onComment(post.id, commentText); setCommentText('') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden animate-fade-up">
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={getAvatarUrl(post.author?.full_name || 'U', post.author?.avatar_url)} />
            <AvatarFallback>{getInitials(post.author?.full_name || 'U')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{post.author?.full_name || 'Utilisateur'}</p>
            <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
          </div>
        </div>
        {currentUser?.id === post.user_id && (
          <button onClick={() => onDelete(post.id)} className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-5 pb-3">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.images?.length > 0 && (
        <div className={`px-5 pb-3 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.images.map((img: string, i: number) => (
            <img key={i} src={img} alt="" className="w-full rounded-xl object-cover max-h-64" />
          ))}
        </div>
      )}

      {post.files?.length > 0 && (
        <div className="px-5 pb-3 space-y-2">
          {post.files.map((f: any, i: number) => (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-sm text-gray-700">
              <Paperclip className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span className="truncate">{f.name}</span>
            </a>
          ))}
        </div>
      )}

      <div className="px-5 py-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
        <span>{totalReactions > 0 ? `${totalReactions} réaction${totalReactions > 1 ? 's' : ''}` : ''}</span>
        <button onClick={() => setShowComments(!showComments)} className="hover:text-gray-600">
          {(post.comments?.length || 0) > 0 ? `${post.comments.length} commentaire${post.comments.length > 1 ? 's' : ''}` : ''}
        </button>
      </div>

      <div className="px-5 py-2 border-t border-gray-50 flex items-center gap-1">
        <div className="relative">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              userReaction ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => userReaction ? handleReact(userReaction.type) : setShowReactions(!showReactions)}
            onMouseEnter={() => { clearTimeout(reactionTimeout.current); setShowReactions(true) }}
            onMouseLeave={() => { reactionTimeout.current = setTimeout(() => setShowReactions(false), 300) }}
          >
            <span>{userReaction ? REACTIONS.find(r => r.type === userReaction.type)?.emoji : '❤️'}</span>
            <span>{userReaction ? REACTIONS.find(r => r.type === userReaction.type)?.label : 'Réagir'}</span>
          </button>
          {showReactions && (
            <div
              className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-card border border-gray-100 p-2 flex gap-1 z-10"
              onMouseEnter={() => clearTimeout(reactionTimeout.current)}
              onMouseLeave={() => { reactionTimeout.current = setTimeout(() => setShowReactions(false), 300) }}
            >
              {REACTIONS.map((r) => (
                <button key={r.type} onClick={() => handleReact(r.type)} title={r.label}
                  className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-gray-50 hover:scale-110 transition-all text-xs">
                  <span className="text-xl">{r.emoji}</span>
                  <span className="text-gray-500 whitespace-nowrap">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
          <MessageCircle className="w-4 h-4" /> Commenter
        </button>
      </div>

      {showComments && (
        <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 space-y-3">
          {(post.comments || []).map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={getAvatarUrl(c.author?.full_name || 'U', c.author?.avatar_url)} />
                <AvatarFallback className="text-xs">{getInitials(c.author?.full_name || 'U')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-white rounded-xl px-3 py-2 text-sm">
                <p className="font-semibold text-gray-900 text-xs mb-0.5">{c.author?.full_name}</p>
                <p className="text-gray-700">{c.content}</p>
              </div>
            </div>
          ))}
          {currentUser && (
            <div className="flex gap-2">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={getAvatarUrl(currentUser.full_name, currentUser.avatar_url)} />
                <AvatarFallback className="text-xs">{getInitials(currentUser.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
                  placeholder="Écrire un commentaire..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                />
                <button onClick={handleComment} disabled={submitting || !commentText.trim()}
                  className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 transition-colors flex-shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CREATE POST BOX
// ════════════════════════════════════════════════════════════════
function CreatePostBox({ currentUser, onPost }: any) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(picked.map(f => uploadsApi.uploadPostImage(f).then(r => r.data.url)))
      setImages(prev => [...prev, ...urls])
    } finally { setUploading(false) }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    setUploading(true)
    try {
      const uploaded = await Promise.all(picked.map(f => uploadsApi.uploadPostFile(f).then(r => ({ name: f.name, url: r.data.url }))))
      setFiles(prev => [...prev, ...uploaded])
    } finally { setUploading(false) }
  }

  const handlePost = async () => {
    if (!content.trim() || !currentUser) return
    setPosting(true)
    try {
      await onPost({ content, images, files, author_type: 'user', author_id: currentUser.id })
      setContent(''); setImages([]); setFiles([])
      toast({ title: 'Publication créée !', variant: 'success' })
    } catch {
      toast({ title: 'Erreur', variant: 'error' })
    } finally { setPosting(false) }
  }

  if (!currentUser) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 mb-6">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={getAvatarUrl(currentUser.full_name, currentUser.avatar_url)} />
          <AvatarFallback>{getInitials(currentUser.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            placeholder="Partagez une actualité, une réussite, un appel à l'action..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none placeholder:text-gray-400"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  <button onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                  <Paperclip className="w-3 h-3" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1">
              <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
              <button onClick={() => imageRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                <Image className="w-4 h-4" /> Photo
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                <Paperclip className="w-4 h-4" /> Fichier
              </button>
            </div>
            <Button size="sm" onClick={handlePost} loading={posting || uploading} disabled={!content.trim()}>
              <Globe className="w-4 h-4" /> Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// LEFT SIDEBAR — Browse widget
// ════════════════════════════════════════════════════════════════
function BrowseWidget() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <p className="font-semibold text-gray-900 text-sm">Explorer</p>
      </div>
      <div className="p-2">
        <Link href="/organizations"
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-200 transition-colors">
            <Users className="w-4 h-4 text-brand-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Organisations</p>
            <p className="text-xs text-gray-400">Découvrez les ONG</p>
          </div>
        </Link>
        <Link href="/enterprises"
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
            <Building2 className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Entreprises</p>
            <p className="text-xs text-gray-400">Partenaires & acteurs</p>
          </div>
        </Link>
        <Link href="/groups"
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 transition-colors">
            <Users className="w-4 h-4 text-violet-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Groupes</p>
            <p className="text-xs text-gray-400">Espaces de discussion</p>
          </div>
        </Link>
        <Link href="/petitions"
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-200 transition-colors">
            <FileText className="w-4 h-4 text-rose-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Pétitions</p>
            <p className="text-xs text-gray-400">Actions citoyennes</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// RIGHT SIDEBAR — Info widget (superadmin-controlled)
// ════════════════════════════════════════════════════════════════
function InfoWidget() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    api.get('/admin/settings').then(res => {
      const settings = res.data || {}
      const widgets: any[] = []
      for (let i = 1; i <= 5; i++) {
        const raw = settings[`feed_widget_${i}`]
        if (raw) {
          try { widgets.push(JSON.parse(raw)) }
          catch { widgets.push({ type: 'text', content: raw }) }
        }
      }
      setItems(widgets)
    }).catch(() => {})
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">À la une</p>
      {items.length === 0 ? (
        <div className="space-y-3">
          <div className="p-3 bg-brand-50 rounded-xl">
            <p className="text-xs font-semibold text-brand-700 mb-1">Bienvenue sur CSF 👋</p>
            <p className="text-xs text-brand-600 leading-relaxed">
              La plateforme qui connecte les ONG, entreprises et citoyens engagés de Tunisie.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400">
              Cette section est gérée par l&apos;administrateur de la plateforme.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i}>
              {item.type === 'image' && (
                <a href={item.link_url || '#'} target="_blank" rel="noopener noreferrer">
                  <img src={item.url} alt={item.title || ''} className="w-full rounded-xl object-cover" />
                  {item.title && <p className="text-xs font-medium text-gray-700 mt-1.5">{item.title}</p>}
                </a>
              )}
              {item.type === 'stat' && (
                <div className="p-3 bg-brand-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-brand-700">{item.value}</p>
                  <p className="text-xs text-brand-600">{item.label}</p>
                </div>
              )}
              {item.type === 'link' && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700 truncate">{item.title || item.url}</span>
                </a>
              )}
              {(!item.type || item.type === 'text') && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  {item.title && <p className="text-xs font-semibold text-gray-800 mb-1">{item.title}</p>}
                  <p className="text-xs text-gray-600 leading-relaxed">{item.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MESSAGING WIDGET — sticky bottom-right
// ════════════════════════════════════════════════════════════════
function MessagingWidget({ user }: { user: any }) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const myActor = user
    ? { type: 'user', id: user.id, name: user.full_name, avatar: user.avatar_url }
    : null

  const loadConversations = useCallback(async () => {
    if (!myActor) return
    try {
      const res = await api.get('/messages/conversations', {
        params: { actor_type: myActor.type, actor_id: myActor.id },
      })
      const convs = res.data || []
      setConversations(convs)
      setUnread(convs.reduce((s: number, c: any) => s + (c.unread_count || 0), 0))
    } catch {}
  }, [myActor?.id])

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await api.get(`/messages/conversations/${convId}/messages`, {
        params: { actor_type: myActor?.type, actor_id: myActor?.id },
      })
      setMessages(res.data || [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {}
  }, [myActor?.id])

  useEffect(() => {
    if (!open || !myActor) return
    loadConversations()
    const poll = setInterval(loadConversations, 10000)
    return () => clearInterval(poll)
  }, [open, loadConversations])

  useEffect(() => {
    if (!activeConv) return
    setLoading(true)
    loadMessages(activeConv.id).finally(() => setLoading(false))
    const poll = setInterval(() => loadMessages(activeConv.id), 5000)
    return () => clearInterval(poll)
  }, [activeConv?.id])

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || !myActor) return
    setSending(true)
    try {
      await api.post(`/messages/conversations/${activeConv.id}/messages`, {
        content: input.trim(),
        sender_type: myActor.type,
        sender_id: myActor.id,
      })
      setInput('')
      await loadMessages(activeConv.id)
    } catch {} finally { setSending(false) }
  }

  const getOther = (conv: any) =>
    conv.participants?.find((p: any) => !(p.type === myActor?.type && p.id === myActor?.id))
    || conv.participants?.[0]

  if (!user) return null

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open && (
        <button onClick={() => setOpen(true)}
          className="w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 relative">
          <MessageSquare className="w-6 h-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden transition-all ${
          minimized ? 'w-72 h-12' : 'w-80 h-[480px]'
        }`}>
          <div className="flex items-center justify-between px-4 py-3 bg-brand-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              {activeConv && (
                <button onClick={() => setActiveConv(null)} className="hover:opacity-70 mr-1">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
              )}
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-semibold truncate max-w-[160px]">
                {activeConv ? (getOther(activeConv)?.name || 'Conversation') : 'Messages'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(!minimized)} className="p-1 hover:opacity-70 rounded">
                {minimized ? <ChevronUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </button>
              <button onClick={() => { setOpen(false); setActiveConv(null) }} className="p-1 hover:opacity-70 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {!activeConv && (
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">Aucune conversation</p>
                      <p className="text-xs text-gray-400 mt-1">Visitez un profil pour démarrer</p>
                    </div>
                  ) : conversations.map((conv: any) => {
                    const other = getOther(conv)
                    return (
                      <button key={conv.id} onClick={() => setActiveConv(conv)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          <AvatarImage src={getAvatarUrl(other?.name || '?', other?.avatar)} />
                          <AvatarFallback className="text-xs">{getInitials(other?.name || '?')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900 truncate">{other?.name || 'Contact'}</p>
                            {conv.unread_count > 0 && (
                              <span className="w-4 h-4 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {conv.last_message?.content || 'Démarrer la conversation'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {activeConv && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loading ? (
                      <div className="flex justify-center pt-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                      </div>
                    ) : messages.map((msg: any) => {
                      const isMe = msg.sender_type === myActor?.type && msg.sender_id === myActor?.id
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                            isMe ? 'bg-brand-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <div className="p-3 border-t border-gray-100 flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                      placeholder="Message..."
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button onClick={sendMessage} disabled={!input.trim() || sending}
                      className="w-9 h-9 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 transition-colors flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadPosts = async (p = 1) => {
    try {
      const res = await feedApi.getFeed(p)
      const { data, total } = res.data
      if (p === 1) setPosts(data)
      else setPosts(prev => [...prev, ...data])
      setHasMore(p * 20 < total)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadPosts(1) }, [])

  const handlePost = async (data: any) => {
    const res = await feedApi.createPost(data)
    setPosts(prev => [res.data, ...prev])
  }

  const handleReact = async (postId: string, type: string) => {
    if (!user) return
    await feedApi.react(postId, { type, user_id: user.id })
    const res = await feedApi.getPost(postId)
    setPosts(prev => prev.map(p => p.id === postId ? res.data : p))
  }

  const handleComment = async (postId: string, content: string) => {
    if (!user) return
    await feedApi.addComment(postId, { content, author_type: 'user', author_id: user.id })
    const res = await feedApi.getPost(postId)
    setPosts(prev => prev.map(p => p.id === postId ? res.data : p))
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer cette publication ?')) return
    await feedApi.deletePost(postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
    toast({ title: 'Publication supprimée', variant: 'default' })
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">

          {/* ── Left sidebar ── */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              <BrowseWidget />
            </div>
          </aside>

          {/* ── Main feed ── */}
          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-0.5">Fil d&apos;actualité</h1>
              <p className="text-gray-500 text-sm">Les dernières nouvelles de la communauté</p>
            </div>

            <CreatePostBox currentUser={user} onPost={handlePost} />

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                        <div className="h-2 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Globe className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune publication pour le moment</p>
                <p className="text-gray-400 text-sm mt-1">Soyez le premier à partager quelque chose !</p>
              </div>
            ) : (
              <div className="space-y-4 stagger">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} currentUser={user}
                    onReact={handleReact} onComment={handleComment} onDelete={handleDelete} />
                ))}
                {hasMore && (
                  <div className="text-center pt-2">
                    <Button variant="outline" onClick={() => { const n = page + 1; setPage(n); loadPosts(n) }}>
                      <ChevronDown className="w-4 h-4" /> Voir plus
                    </Button>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ── Right sidebar ── */}
          <aside className="hidden xl:block w-60 flex-shrink-0">
            <div className="sticky top-24">
              <InfoWidget />
            </div>
          </aside>

        </div>
      </div>

      {/* Messaging sticky widget */}
      <MessagingWidget user={user} />
    </MainLayout>
  )
}

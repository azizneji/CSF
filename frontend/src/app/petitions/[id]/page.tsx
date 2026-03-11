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
  Target, Users, Clock, CheckCircle2, XCircle, Share2, Copy,
  MessageSquare, ChevronRight, Trash2, PenLine, FileDown,
  Instagram, Facebook, Send, Loader2, ArrowLeft,
} from 'lucide-react'

// WhatsApp icon
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active:       { label: 'Active',           color: 'text-green-700 bg-green-50 border-green-200',  icon: Clock },
  goal_reached: { label: 'Objectif atteint', color: 'text-brand-700 bg-brand-50 border-brand-200',  icon: CheckCircle2 },
  closed:       { label: 'Clôturée',         color: 'text-gray-600 bg-gray-50 border-gray-200',     icon: XCircle },
}

export default function PetitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [petition, setPetition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [comment, setComment] = useState('')
  const [shareToFeed, setShareToFeed] = useState(false)
  const [signers, setSigners] = useState<any[]>([])
  const [signersPage, setSignersPage] = useState(1)
  const [totalSigners, setTotalSigners] = useState(0)
  const [showUpdateBox, setShowUpdateBox] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)

  useEffect(() => { fetchPetition() }, [id])

  const fetchPetition = async () => {
    try {
      const res = await api.get(`/petitions/${id}`, {
        headers: user ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
      })
      setPetition(res.data)
    } catch { router.push('/petitions') }
    finally { setLoading(false) }
  }

  const fetchSigners = async (page = 1) => {
    const res = await api.get(`/petitions/${id}/signatures`, { params: { page } })
    if (page === 1) setSigners(res.data.data || [])
    else setSigners(prev => [...prev, ...(res.data.data || [])])
    setTotalSigners(res.data.total || 0)
    setSignersPage(page)
  }

  useEffect(() => { if (petition) fetchSigners() }, [petition?.id])

  const handleSign = async () => {
    if (!user) { router.push('/auth/login'); return }
    setSigning(true)
    try {
      await api.post(`/petitions/${id}/sign`, { comment, share_to_feed: shareToFeed })
      toast({ title: 'Pétition signée ! Merci pour votre engagement.', variant: 'success' })
      setShowSignModal(false)
      setComment('')
      fetchPetition()
      fetchSigners()
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Erreur', variant: 'error' })
    } finally { setSigning(false) }
  }

  const handleUnsign = async () => {
    if (!confirm('Retirer votre signature ?')) return
    try {
      await api.delete(`/petitions/${id}/sign`)
      toast({ title: 'Signature retirée', variant: 'default' })
      fetchPetition()
      fetchSigners()
    } catch { toast({ title: 'Erreur', variant: 'error' }) }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement cette pétition ?')) return
    try {
      await api.delete(`/petitions/${id}`)
      toast({ title: 'Pétition supprimée', variant: 'default' })
      router.push('/petitions')
    } catch { toast({ title: 'Erreur', variant: 'error' }) }
  }

  const handleClose = async () => {
    if (!confirm('Clôturer cette pétition ? Les nouvelles signatures ne seront plus acceptées.')) return
    await api.post(`/petitions/${id}/close`)
    toast({ title: 'Pétition clôturée', variant: 'default' })
    fetchPetition()
  }

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return
    setPostingUpdate(true)
    try {
      await api.post(`/petitions/${id}/updates`, { content: updateText })
      setUpdateText('')
      setShowUpdateBox(false)
      fetchPetition()
    } finally { setPostingUpdate(false) }
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/petitions/${id}` : ''
  const shareText = petition ? `Je soutiens : "${petition.title}" — signez cette pétition !` : ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({ title: 'Lien copié !', variant: 'success' })
  }
  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank')
  const handleFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
  const handleInstagramStory = () => {
    // Instagram doesn't support direct story sharing via URL — copy link + instruct user
    navigator.clipboard.writeText(shareUrl)
    toast({ title: 'Lien copié ! Partagez-le dans votre story Instagram.', variant: 'success' })
    window.open('https://www.instagram.com/', '_blank')
  }

  const isAuthor = user && petition && (
    (petition.author_type === 'user' && petition.author_id === user.id) ||
    (petition.author_type === 'organization')
  )

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    </MainLayout>
  )

  if (!petition) return null

  const pct = Math.min(Math.round((petition.signature_count / petition.goal) * 100), 100)
  const st = STATUS_CONFIG[petition.status] || STATUS_CONFIG.active
  const StIcon = st.icon
  const canSign = petition.status === 'active' && !petition.signed

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux pétitions
        </button>

        {/* Cover */}
        {petition.cover_url && (
          <img src={petition.cover_url} alt="" className="w-full h-48 object-cover rounded-2xl mb-6" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 leading-snug flex-1">
            {petition.title}
          </h1>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${st.color}`}>
            <StIcon className="w-3.5 h-3.5" /> {st.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          <span className="flex items-center gap-1.5">
            <Avatar className="w-5 h-5">
              <AvatarImage src={getAvatarUrl(petition.author?.full_name || petition.author?.name || 'U', petition.author?.avatar_url || petition.author?.logo_url)} />
              <AvatarFallback className="text-xs">{getInitials(petition.author?.full_name || petition.author?.name || 'U')}</AvatarFallback>
            </Avatar>
            {petition.author?.full_name || petition.author?.name}
          </span>
          {petition.target_institution && (
            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-brand-500" /> {petition.target_institution}</span>
          )}
          {petition.deadline && (
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Clôture le {new Date(petition.deadline).toLocaleDateString('fr-TN')}</span>
          )}
        </div>

        {/* Progress block */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 mb-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-4xl font-display font-bold text-gray-900">{petition.signature_count.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-0.5">signatures sur {petition.goal.toLocaleString()}</p>
            </div>
            <p className="text-2xl font-bold text-brand-600">{pct}%</p>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-700 ${petition.status === 'goal_reached' ? 'bg-brand-600' : 'bg-brand-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            {petition.status === 'active' && !petition.signed && (
              <Button className="flex-1" onClick={() => setShowSignModal(true)}>
                <PenLine className="w-4 h-4" /> Signer cette pétition
              </Button>
            )}
            {petition.signed && (
              <button
                onClick={handleUnsign}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Vous avez signé
              </button>
            )}
            <button
              onClick={() => setShowSharePanel(!showSharePanel)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Partager
            </button>
            {petition.pdf_url && (
              <a href={petition.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <FileDown className="w-4 h-4" /> PDF
              </a>
            )}
          </div>

          {/* Share panel */}
          {showSharePanel && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl grid grid-cols-2 gap-2">
              <button onClick={handleCopyLink} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Copy className="w-4 h-4 text-gray-500" /> Copier le lien
              </button>
              <button onClick={handleWhatsApp} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-green-600"><WhatsAppIcon /></span> WhatsApp
              </button>
              <button onClick={handleFacebook} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Facebook className="w-4 h-4 text-blue-600" /> Facebook
              </button>
              <button onClick={handleInstagramStory} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Instagram className="w-4 h-4 text-pink-600" /> Story Instagram
              </button>
            </div>
          )}
        </div>

        {/* Objective */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Objectif</p>
          <p className="text-gray-800 font-medium leading-relaxed">{petition.objective}</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{petition.description}</p>
        </div>

        {/* Creator updates */}
        {((petition.updates && petition.updates.length > 0) || isAuthor) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Mises à jour</h2>
              {isAuthor && petition.status === 'active' && (
                <button
                  onClick={() => setShowUpdateBox(!showUpdateBox)}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  + Ajouter
                </button>
              )}
            </div>
            {showUpdateBox && (
              <div className="mb-4 p-3 bg-brand-50 rounded-xl">
                <textarea
                  value={updateText}
                  onChange={e => setUpdateText(e.target.value)}
                  placeholder="Informez vos signataires des dernières avancées..."
                  rows={3}
                  className="w-full border border-brand-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-white"
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowUpdateBox(false)}>Annuler</Button>
                  <Button size="sm" onClick={handleAddUpdate} loading={postingUpdate}>Publier</Button>
                </div>
              </div>
            )}
            {petition.updates?.length === 0 && (
              <p className="text-sm text-gray-400">Aucune mise à jour pour l&apos;instant.</p>
            )}
            <div className="space-y-4">
              {(petition.updates || []).map((u: any) => (
                <div key={u.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={getAvatarUrl(u.author?.full_name || 'U', u.author?.avatar_url)} />
                    <AvatarFallback className="text-xs">{getInitials(u.author?.full_name || 'U')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-700">{u.author?.full_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(u.created_at)}</p>
                    </div>
                    <p className="text-sm text-gray-600">{u.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {totalSigners.toLocaleString()} signataire{totalSigners !== 1 ? 's' : ''}
          </h2>
          {signers.length === 0 ? (
            <p className="text-sm text-gray-400">Soyez le premier à signer cette pétition.</p>
          ) : (
            <div className="space-y-3">
              {signers.map((s: any) => (
                <div key={s.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={getAvatarUrl(s.user?.full_name || 'U', s.user?.avatar_url)} />
                    <AvatarFallback className="text-xs">{getInitials(s.user?.full_name || 'U')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.user?.full_name}</p>
                    {s.comment && <p className="text-sm text-gray-500 italic mt-0.5">&ldquo;{s.comment}&rdquo;</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.created_at)}</p>
                  </div>
                </div>
              ))}
              {signers.length < totalSigners && (
                <button
                  onClick={() => fetchSigners(signersPage + 1)}
                  className="w-full text-center text-sm text-brand-600 font-semibold hover:underline py-2"
                >
                  Voir plus de signataires
                </button>
              )}
            </div>
          )}
        </div>

        {/* Admin actions */}
        {isAuthor && (
          <div className="flex gap-3 justify-end">
            {petition.status === 'active' && (
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Clôturer
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Sign modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-display text-xl font-bold text-gray-900 mb-1">Signer la pétition</h3>
            <p className="text-sm text-gray-500 mb-5 line-clamp-2">{petition.title}</p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Laisser un commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Pourquoi soutenez-vous cette pétition ?"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer mb-5 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={shareToFeed}
                onChange={e => setShareToFeed(e.target.checked)}
                className="w-4 h-4 accent-brand-600"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Partager sur le fil</p>
                <p className="text-xs text-gray-400">Publier que vous avez signé cette pétition</p>
              </div>
            </label>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSignModal(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSign} loading={signing}>
                <PenLine className="w-4 h-4" /> Confirmer ma signature
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

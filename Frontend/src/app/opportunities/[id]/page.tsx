'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { opportunitiesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, MapPin, Calendar, Building2, Mail, Send, Trash2, Edit } from 'lucide-react'

const TYPE_LABELS: any = {
  job: 'Offre d\'emploi', consultant: 'Appel à consultants',
  tender: 'Appel d\'offres', volunteer: 'Bénévolat',
  internship: 'Stage', grant: 'Appel à projets',
}

export default function OpportunityDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [opp, setOpp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')
  const [showApplyForm, setShowApplyForm] = useState(false)

  useEffect(() => {
    opportunitiesApi.getById(id as string)
      .then((r) => setOpp(r.data))
      .catch(() => router.push('/opportunities'))
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = user && opp?.created_by === user.id

  const handleApply = async () => {
    if (!user) { router.push('/auth/login'); return }
    setApplying(true)
    try {
      await opportunitiesApi.apply(opp.id, message)
      toast({ title: 'Candidature envoyée !', variant: 'success' })
      setShowApplyForm(false)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setApplying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette opportunité ?')) return
    await opportunitiesApi.delete(opp.id)
    toast({ title: 'Opportunité supprimée', variant: 'success' })
    router.push('/opportunities')
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
        <div className="bg-white rounded-2xl p-8 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    </MainLayout>
  )

  if (!opp) return null

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux opportunités
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-sand-100 flex items-center justify-center flex-shrink-0">
                {opp.poster?.logo_url ? (
                  <img src={opp.poster.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-7 h-7 text-sand-600" />
                )}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">{opp.title}</h1>
                <p className="text-gray-500 mt-0.5">{opp.poster?.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="sand">{TYPE_LABELS[opp.type] || opp.type}</Badge>
                  {opp.location && <Badge variant="gray"><MapPin className="w-3 h-3 mr-1" />{opp.location}</Badge>}
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6 text-sm">
            {opp.deadline && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date limite</p>
                <p className="font-medium text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />{formatDate(opp.deadline)}
                </p>
              </div>
            )}
            {opp.salary_range && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Rémunération</p>
                <p className="font-medium text-gray-700">{opp.salary_range}</p>
              </div>
            )}
            {opp.contact_email && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Contact</p>
                <a href={`mailto:${opp.contact_email}`} className="font-medium text-brand-600 flex items-center gap-1.5 hover:underline">
                  <Mail className="w-3.5 h-3.5" />{opp.contact_email}
                </a>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Publiée le</p>
              <p className="font-medium text-gray-700">{formatDate(opp.created_at)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.description}</p>
          </div>

          {/* Requirements */}
          {opp.requirements && (
            <div className="mb-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Profil recherché</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.requirements}</p>
            </div>
          )}

          {/* Apply */}
          {!isOwner && (
            <div className="border-t border-gray-100 pt-6">
              {!showApplyForm ? (
                <Button className="w-full" size="lg" onClick={() => user ? setShowApplyForm(true) : router.push('/auth/login')}>
                  <Send className="w-4 h-4" /> Postuler / Manifester son intérêt
                </Button>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Votre message (optionnel)</h3>
                  <textarea
                    rows={4}
                    placeholder="Présentez-vous brièvement ou posez vos questions..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowApplyForm(false)}>Annuler</Button>
                    <Button className="flex-1" loading={applying} onClick={handleApply}>
                      <Send className="w-4 h-4" /> Envoyer ma candidature
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

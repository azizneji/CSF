'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { knowledgeApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { formatDate, getInitials, getAvatarUrl } from '@/lib/utils'
import { ArrowLeft, Download, Tag, Trash2, Calendar, Globe, FileText } from 'lucide-react'

const CAT_LABELS: any = {
  study: 'Étude', report: 'Rapport', guide: 'Guide',
  research: 'Recherche', policy: 'Note de politique',
  newsletter: 'Newsletter', other: 'Autre',
}

export default function PublicationDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [pub, setPub] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    knowledgeApi.getById(id as string)
      .then((r) => setPub(r.data))
      .catch(() => router.push('/knowledge'))
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = user && pub?.created_by === user.id

  const handleDelete = async () => {
    if (!confirm('Supprimer cette publication ?')) return
    await knowledgeApi.delete(pub.id)
    toast({ title: 'Publication supprimée', variant: 'success' })
    router.push('/knowledge')
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
        <div className="bg-white rounded-2xl p-8 space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </MainLayout>
  )

  if (!pub) return null

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à la base de connaissances
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-fade-up">
          {/* Cover */}
          <div className="h-56 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center relative">
            {pub.cover_url ? (
              <img src={pub.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <FileText className="w-16 h-16 text-brand-300" />
            )}
            <div className="absolute bottom-4 left-6">
              <Badge variant="default" className="bg-white text-brand-700">
                {CAT_LABELS[pub.category] || pub.category}
              </Badge>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="font-display text-2xl font-bold text-gray-900">{pub.title}</h1>
              {isOwner && (
                <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={getAvatarUrl(pub.author?.full_name || 'A', pub.author?.avatar_url)} />
                  <AvatarFallback className="text-xs">{getInitials(pub.author?.full_name || 'A')}</AvatarFallback>
                </Avatar>
                <span>{pub.author?.full_name || pub.author?.name}</span>
              </div>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />{formatDate(pub.created_at)}
              </span>
              {pub.year && <span>{pub.year}</span>}
              {pub.language && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />{pub.language.toUpperCase()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-6">{pub.description}</p>

            {/* Tags */}
            {pub.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {pub.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    <Tag className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Download */}
            {pub.file_url && (
              <a href={pub.file_url} target="_blank" rel="noopener noreferrer" download>
                <Button size="lg" className="w-full">
                  <Download className="w-5 h-5" /> Télécharger le document
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, MapPin, Building2, Phone, Globe, Mail, Tag, Trash2, Calendar } from 'lucide-react'

const CAT_LABELS: any = {
  legal: 'Juridique', health: 'Santé', education: 'Éducation',
  social: 'Social', psychological: 'Psychologique',
  financial: 'Financier', digital: 'Numérique', other: 'Autre',
}

export default function ServiceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [svc, setSvc] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/services/${id}`)
      .then(r => setSvc(r.data))
      .catch(() => router.push('/services'))
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = user && svc?.created_by === user.id

  const handleDelete = async () => {
    if (!confirm('Supprimer ce service ?')) return
    await api.delete(`/services/${id}`)
    toast({ title: 'Service supprimé', variant: 'success' })
    router.push('/services')
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

  if (!svc) return null

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux services
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {svc.organization?.logo_url
                  ? <img src={svc.organization.logo_url} alt="" className="w-full h-full object-cover" />
                  : <Building2 className="w-7 h-7 text-brand-600" />}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">{svc.title}</h1>
                {svc.organization?.name && <p className="text-gray-500 mt-0.5">{svc.organization.name}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="default">{CAT_LABELS[svc.category] || svc.category}</Badge>
                  <Badge variant="green">Gratuit</Badge>
                </div>
              </div>
            </div>
            {isOwner && (
              <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6 text-sm">
            {svc.location && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Lieu</p>
                <p className="font-medium text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />{svc.location}
                </p>
              </div>
            )}
            {svc.target_audience && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Public cible</p>
                <p className="font-medium text-gray-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-600" />{svc.target_audience}
                </p>
              </div>
            )}
            {svc.contact_phone && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                <a href={`tel:${svc.contact_phone}`} className="font-medium text-brand-600 flex items-center gap-1.5 hover:underline">
                  <Phone className="w-3.5 h-3.5" />{svc.contact_phone}
                </a>
              </div>
            )}
            {svc.contact_email && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                <a href={`mailto:${svc.contact_email}`} className="font-medium text-brand-600 flex items-center gap-1.5 hover:underline">
                  <Mail className="w-3.5 h-3.5" />{svc.contact_email}
                </a>
              </div>
            )}
            {svc.website && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Site web</p>
                <a href={svc.website} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 flex items-center gap-1.5 hover:underline">
                  <Globe className="w-3.5 h-3.5" />{svc.website.replace('https://', '')}
                </a>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Publié le</p>
              <p className="font-medium text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />{formatDate(svc.created_at)}
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{svc.description}</p>
          </div>

          {svc.schedule && (
            <div className="mt-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Horaires</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{svc.schedule}</p>
            </div>
          )}

          {svc.contact_email && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <a href={`mailto:${svc.contact_email}`}>
                <Button className="w-full" size="lg">
                  <Mail className="w-4 h-4" /> Contacter pour bénéficier du service
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

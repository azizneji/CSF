'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { orgsApi, uploadsApi, api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Upload, Building2, Save, Loader2, Users, Check, X, TrendingUp, ShieldX } from 'lucide-react'

const CATEGORIES = [
  { value: 'ngo', label: 'ONG' },
  { value: 'association', label: 'Association' },
  { value: 'foundation', label: 'Fondation' },
  { value: 'collective', label: 'Collectif' },
  { value: 'other', label: 'Autre' },
]

export default function EditOrganizationPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const logoRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [org, setOrg] = useState<any>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'ngo', location: '', website: '', logo_url: '',
  })

  useEffect(() => {
    if (!id) return
    orgsApi.getById(id as string).then(r => {
      const o = r.data
      // Check access once both org and user are loaded
      const isAdminOrManager = o.members?.some(
        (m: any) => m.user.id === user?.id && ['admin', 'manager'].includes(m.role)
      )
      if (!isAdminOrManager) {
        setAccessDenied(true)
        return
      }
      setOrg(o)
      setForm({
        name: o.name || '',
        description: o.description || '',
        category: o.category || 'ngo',
        location: o.location || '',
        website: o.website || '',
        logo_url: o.logo_url || '',
      })
    }).catch(() => router.push('/organizations'))
  }, [id, user])

  useEffect(() => {
    if (!id || !user || accessDenied) return
    setLoadingRequests(true)
    api.get(`/organizations/${id}/join-requests`)
      .then(r => setJoinRequests(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingRequests(false))
  }, [id, user, accessDenied])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingLogo(true)
    try {
      const res = await uploadsApi.uploadLogo(file, 'organization', id as string)
      setForm(f => ({ ...f, logo_url: res.data.url }))
      toast({ title: 'Logo mis à jour !', variant: 'success' })
    } catch { toast({ title: 'Erreur upload', variant: 'error' }) }
    finally { setUploadingLogo(false) }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Le nom est requis', variant: 'error' }); return }
    setSaving(true)
    try {
      await orgsApi.update(id as string, form)
      toast({ title: 'Organisation mise à jour !', variant: 'success' })
      router.push(`/organizations/${id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally { setSaving(false) }
  }

  const handleReviewRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/organizations/join-requests/${requestId}`, { status })
      setJoinRequests(r => r.filter(req => req.id !== requestId))
      toast({ title: status === 'accepted' ? '✅ Membre accepté !' : '❌ Demande rejetée', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  // Loading state
  if (authLoading || (!org && !accessDenied)) return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
      </div>
    </MainLayout>
  )

  // Access denied
  if (accessDenied) return (
    <MainLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
        <p className="text-gray-500 text-sm mb-6">
          Seuls les administrateurs et managers de cette organisation peuvent accéder à cette page.
        </p>
        <Link href={`/organizations/${id}`}>
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4" /> Retour à l'organisation
          </Button>
        </Link>
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/organizations/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/organizations/${id}/analytics`}>
              <Button variant="secondary">
                <TrendingUp className="w-4 h-4" /> Analytiques
              </Button>
            </Link>
            <Button onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4" /> Sauvegarder
            </Button>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">Logo de l'organisation</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center border-2 border-dashed border-brand-200 overflow-hidden flex-shrink-0">
              {form.logo_url
                ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                : <Building2 className="w-8 h-8 text-brand-400" />}
            </div>
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button variant="secondary" size="sm" onClick={() => logoRef.current?.click()} loading={uploadingLogo}>
                <Upload className="w-4 h-4" /> Changer le logo
              </Button>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG recommandé</p>
            </div>
          </div>
        </div>

        {/* Verification status */}
        {!org.is_verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800 text-sm">Organisation en attente de vérification</p>
              <p className="text-amber-600 text-xs mt-0.5">
                Votre organisation n'est pas encore visible publiquement. Elle sera affichée une fois vérifiée par un administrateur.
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900">Informations</h2>
          <Input label="Nom de l'organisation *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea rows={4} placeholder="Décrivez votre organisation..."
              className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.category === c.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{c.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Localisation" placeholder="Tunis, Tunisie" value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })} />
            <Input label="Site web" placeholder="https://..." value={form.website}
              onChange={e => setForm({ ...form, website: e.target.value })} />
          </div>
        </div>

        {/* Join requests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Demandes d'adhésion
            {joinRequests.length > 0 && (
              <span className="bg-brand-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {joinRequests.length}
              </span>
            )}
          </h2>

          {loadingRequests ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : joinRequests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune demande en attente</p>
          ) : (
            <div className="space-y-3">
              {joinRequests.map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 font-semibold text-brand-700 text-sm">
                    {req.user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{req.user?.full_name}</p>
                    {req.user?.job_title && <p className="text-xs text-gray-400 truncate">{req.user.job_title}</p>}
                    {req.message && <p className="text-xs text-gray-500 mt-0.5 italic truncate">"{req.message}"</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handleReviewRequest(req.id, 'rejected')}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReviewRequest(req.id, 'accepted')}
                      className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pb-10">
          <Button size="lg" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Sauvegarder
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

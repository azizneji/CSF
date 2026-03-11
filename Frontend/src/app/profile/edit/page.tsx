'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { api, uploadsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { getInitials, getAvatarUrl } from '@/lib/utils'
import { ArrowLeft, Camera, Plus, Trash2, Save, Loader2 } from 'lucide-react'

const EXP_TYPES = [
  { value: 'job', label: 'Emploi' },
  { value: 'education', label: 'Formation' },
  { value: 'volunteer', label: 'Bénévolat' },
  { value: 'certification', label: 'Certification' },
]
const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'youtube', 'website', 'email', 'phone']

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const avatarRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [experiences, setExperiences] = useState<any[]>([])
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [showExpForm, setShowExpForm] = useState(false)
  const [form, setForm] = useState({
    full_name: '', bio: '', location: '', website: '', phone: '',
    job_title: '', interests: '', skills: '',
  })
  const [newExp, setNewExp] = useState({
    type: 'job', title: '', organization: '', description: '',
    start_date: '', end_date: '', is_current: false,
  })

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    setForm({
      full_name: user.full_name || '',
      bio: (user as any).bio || '',
      location: (user as any).location || '',
      website: (user as any).website || '',
      phone: (user as any).phone || '',
      job_title: (user as any).job_title || '',
      interests: ((user as any).interests || []).join(', '),
      skills: ((user as any).skills || []).join(', '),
    })
    api.get(`/profile/${user.id}`).then(r => {
      setExperiences(r.data.experiences || [])
      const sl: Record<string, string> = {}
      for (const l of r.data.social_links || []) sl[l.platform] = l.url
      setSocialLinks(sl)
    })
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingAvatar(true)
    try {
      await uploadsApi.uploadAvatar(file)
      await refreshUser()
      toast({ title: 'Photo mise à jour !', variant: 'success' })
    } catch { toast({ title: 'Erreur upload', variant: 'error' }) }
    finally { setUploadingAvatar(false) }
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast({ title: 'Le nom est requis', variant: 'error' }); return }
    setSaving(true)
    try {
      await api.patch('/profile/me', {
        ...form,
        interests: form.interests ? form.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
        skills:    form.skills    ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      const links = Object.entries(socialLinks)
        .filter(([, url]) => url.trim())
        .map(([platform, url]) => ({ platform, url }))
      await api.patch('/profile/me/social-links', { links })
      await refreshUser()
      toast({ title: 'Profil mis à jour !', variant: 'success' })
      router.push(`/profile/${user?.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally { setSaving(false) }
  }

  const handleAddExp = async () => {
    if (!newExp.title || !newExp.organization) {
      toast({ title: 'Titre et organisation requis', variant: 'error' }); return
    }
    try {
      const res = await api.post('/profile/me/experiences', {
        ...newExp,
        start_date: newExp.start_date || null,
        end_date: newExp.is_current ? null : newExp.end_date || null,
      })
      setExperiences(p => [...p, res.data])
      setNewExp({ type: 'job', title: '', organization: '', description: '', start_date: '', end_date: '', is_current: false })
      setShowExpForm(false)
      toast({ title: 'Expérience ajoutée', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    }
  }

  const handleDeleteExp = async (id: string) => {
    await api.delete(`/profile/me/experiences/${id}`)
    setExperiences(p => p.filter(e => e.id !== id))
    toast({ title: 'Supprimé', variant: 'default' })
  }

  if (!user) return null

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${user.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Mon profil
          </Link>
          <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4" />Sauvegarder</Button>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">Photo de profil</h2>
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => !uploadingAvatar && avatarRef.current?.click()}>
              <Avatar className="w-20 h-20 ring-4 ring-brand-100">
                <AvatarImage src={getAvatarUrl(user.full_name, user.avatar_url)} />
                <AvatarFallback className="text-xl">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar
                  ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />}
              </div>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <p className="text-sm text-gray-400">Cliquez sur la photo pour la modifier</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900">Informations personnelles</h2>
          <Input label="Nom complet *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Titre / Poste" placeholder="Ex: Coordinateur de projets" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea rows={3} placeholder="Décrivez-vous..."
              className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>
          <Input label="Localisation" placeholder="Tunis, Tunisie" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Site web" placeholder="https://..." value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
            <Input label="Téléphone" placeholder="+216 ..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="Centres d'intérêt (séparés par virgules)"
            placeholder="ONG, droit, environnement..." value={form.interests}
            onChange={e => setForm({ ...form, interests: e.target.value })} />
          <Input label="Compétences (séparées par virgules)"
            placeholder="Gestion de projet, communication..." value={form.skills}
            onChange={e => setForm({ ...form, skills: e.target.value })} />
        </div>

        {/* Social links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900">Réseaux sociaux</h2>
          {SOCIAL_PLATFORMS.map(p => (
            <Input key={p} label={p.charAt(0).toUpperCase() + p.slice(1)}
              placeholder={p === 'email' ? 'votre@email.com' : p === 'phone' ? '+216...' : `https://${p}.com/...`}
              value={socialLinks[p] || ''}
              onChange={e => setSocialLinks({ ...socialLinks, [p]: e.target.value })} />
          ))}
        </div>

        {/* Experiences */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900">Mini CV</h2>
            <Button size="sm" variant="secondary" onClick={() => setShowExpForm(!showExpForm)}>
              <Plus className="w-4 h-4" /> Ajouter
            </Button>
          </div>

          {experiences.map(exp => (
            <div key={exp.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{exp.title}</p>
                <p className="text-sm text-gray-500">{exp.organization}</p>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full capitalize mt-1 inline-block">{exp.type}</span>
              </div>
              <button onClick={() => handleDeleteExp(exp.id)} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {showExpForm && (
            <div className="border border-brand-100 bg-brand-50/30 rounded-xl p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {EXP_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setNewExp({ ...newExp, type: t.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      newExp.type === t.value ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>{t.label}</button>
                ))}
              </div>
              <Input label="Titre *" placeholder="Chargé de mission"
                value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} />
              <Input label="Organisation *" placeholder="Nom de l'organisation"
                value={newExp.organization} onChange={e => setNewExp({ ...newExp, organization: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea rows={2} placeholder="Décrivez brièvement..."
                  className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date de début" type="date"
                  value={newExp.start_date} onChange={e => setNewExp({ ...newExp, start_date: e.target.value })} />
                {!newExp.is_current && (
                  <Input label="Date de fin" type="date"
                    value={newExp.end_date} onChange={e => setNewExp({ ...newExp, end_date: e.target.value })} />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={newExp.is_current}
                  onChange={e => setNewExp({ ...newExp, is_current: e.target.checked })}
                  className="rounded border-gray-300 text-brand-600" />
                Poste actuel
              </label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowExpForm(false)}>Annuler</Button>
                <Button size="sm" onClick={handleAddExp}>Ajouter</Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pb-10">
          <Button size="lg" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Sauvegarder le profil
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

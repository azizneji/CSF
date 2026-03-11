'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { knowledgeApi, uploadsApi, orgsApi, enterprisesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, BookOpen, Upload, X } from 'lucide-react'

const CATEGORIES = [
  { value: 'study', label: 'Étude' }, { value: 'report', label: 'Rapport' },
  { value: 'guide', label: 'Guide' }, { value: 'research', label: 'Recherche' },
  { value: 'policy', label: 'Note de politique' }, { value: 'newsletter', label: 'Newsletter' },
  { value: 'other', label: 'Autre' },
]

export default function CreatePublicationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [myEnterprises, setMyEnterprises] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', description: '', category: 'report',
    author_type: 'user', author_id: '',
    file_url: '', cover_url: '', tags: '', year: '',
    language: 'fr',
  })
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    setForm(f => ({ ...f, author_id: user.id }))
    Promise.all([
      orgsApi.getAll().then(r => r.data),
      enterprisesApi.getAll().then(r => r.data),
    ]).then(([orgs, ents]) => {
      setMyOrgs(orgs.filter((o: any) => o.created_by === user.id))
      setMyEnterprises(ents.filter((e: any) => e.created_by === user.id))
    })
  }, [user])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const res = await uploadsApi.uploadPublication(file)
      setForm(f => ({ ...f, file_url: res.data.url }))
      setFileName(file.name)
      toast({ title: 'Fichier uploadé !', variant: 'success' })
    } catch {
      toast({ title: 'Erreur upload', variant: 'error' })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const res = await uploadsApi.uploadCover(file)
      setForm(f => ({ ...f, cover_url: res.data.url }))
      toast({ title: 'Couverture uploadée !', variant: 'success' })
    } catch {
      toast({ title: 'Erreur upload', variant: 'error' })
    } finally {
      setUploadingCover(false)
    }
  }

  const handleAuthorTypeChange = (type: string) => {
    const id = type === 'user' ? user?.id || '' : ''
    setForm(f => ({ ...f, author_type: type, author_id: id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.author_id) {
      toast({ title: 'Remplissez les champs requis', variant: 'error' }); return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      const res = await knowledgeApi.create(payload)
      toast({ title: 'Publication créée !', variant: 'success' })
      router.push(`/knowledge/${res.data.id}`)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const authorOptions = form.author_type === 'organization' ? myOrgs : form.author_type === 'enterprise' ? myEnterprises : []

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Nouvelle publication</h1>
            <p className="text-gray-500 text-sm">Étude, rapport, guide...</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 animate-fade-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Titre *" placeholder="Ex: État de la société civile tunisienne 2025"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea rows={4} placeholder="Résumé de la publication..."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Catégorie</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      form.category === c.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Auteur</label>
              <div className="flex gap-2 mb-2">
                {['user', 'organization', 'enterprise'].map((t) => (
                  <button key={t} type="button" onClick={() => handleAuthorTypeChange(t)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      form.author_type === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {t === 'user' ? 'Moi' : t === 'organization' ? 'Organisation' : 'Entreprise'}
                  </button>
                ))}
              </div>
              {form.author_type !== 'user' && (
                <select
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.author_id}
                  onChange={(e) => setForm({ ...form, author_id: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {authorOptions.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              )}
            </div>

            {/* File upload */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Fichier (PDF, DOCX...)</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
              {form.file_url ? (
                <div className="flex items-center gap-2 p-3 bg-brand-50 border border-brand-200 rounded-xl">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-brand-700 flex-1 truncate">{fileName}</span>
                  <button type="button" onClick={() => { setForm(f => ({ ...f, file_url: '' })); setFileName('') }}>
                    <X className="w-4 h-4 text-brand-500" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  disabled={uploadingFile}
                  className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingFile ? 'Upload en cours...' : 'Choisir un fichier'}
                </button>
              )}
            </div>

            {/* Cover upload */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Image de couverture</label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              {form.cover_url ? (
                <div className="relative">
                  <img src={form.cover_url} alt="" className="w-full h-32 object-cover rounded-xl" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, cover_url: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                </div>
              ) : (
                <button type="button" onClick={() => coverRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingCover ? 'Upload en cours...' : 'Ajouter une couverture'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Année" placeholder="2025"
                value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Langue</label>
                <select className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <option value="fr">Français</option>
                  <option value="ar">Arabe</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
            </div>

            <Input label="Tags (séparés par des virgules)" placeholder="société civile, Tunisie, 2025"
              value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

            <div className="flex gap-3 pt-2">
              <Link href="/knowledge" className="flex-1">
                <Button variant="outline" className="w-full" type="button">Annuler</Button>
              </Link>
              <Button type="submit" className="flex-1" loading={loading}>Publier</Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

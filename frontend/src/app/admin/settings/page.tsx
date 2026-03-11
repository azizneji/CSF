'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadsApi } from '@/lib/api'
import { ArrowLeft, Save, Upload, Eye, Palette, Type, Image, Globe } from 'lucide-react'

const adminApi = {
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.patch('/admin/settings', data),
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const heroRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    adminApi.getSettings()
      .then(r => setSettings(r.data))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings(settings)
      toast({ title: 'Paramètres sauvegardés !', variant: 'success' })
    } catch {
      toast({ title: 'Erreur sauvegarde', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingLogo(true)
    try {
      const res = await uploadsApi.uploadCover(file)
      set('logo_url', res.data.url)
      toast({ title: 'Logo uploadé !', variant: 'success' })
    } finally { setUploadingLogo(false) }
  }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingHero(true)
    try {
      const res = await uploadsApi.uploadCover(file)
      set('hero_image_url', res.data.url)
      toast({ title: 'Image hero uploadée !', variant: 'success' })
    } finally { setUploadingHero(false) }
  }

  if (loading) return (
    <div className="p-8 animate-pulse space-y-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-xl" />)}
    </div>
  )

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Paramètres de la plateforme</h1>
          <p className="text-gray-500 text-sm mt-1">Modifiez le contenu, le logo et l'apparence du site</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" /> Sauvegarder
        </Button>
      </div>

      <div className="space-y-8">
        {/* Identity */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" /> Identité
          </h2>
          <Input label="Nom de la plateforme"
            value={settings.platform_name || ''}
            onChange={e => set('platform_name', e.target.value)} />
          <Input label="Tagline"
            value={settings.platform_tagline || ''}
            onChange={e => set('platform_tagline', e.target.value)} />
          <Input label="Email de contact"
            value={settings.contact_email || ''}
            onChange={e => set('contact_email', e.target.value)} />
          <Input label="Texte du footer"
            value={settings.footer_text || ''}
            onChange={e => set('footer_text', e.target.value)} />
        </section>

        {/* Logo */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
            <Image className="w-4 h-4 text-brand-600" /> Logo
          </h2>
          <div className="flex items-center gap-4">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-gray-100" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">CSF</div>
            )}
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button variant="secondary" size="sm" onClick={() => logoRef.current?.click()} loading={uploadingLogo}>
                <Upload className="w-4 h-4" /> Changer le logo
              </Button>
              <p className="text-xs text-gray-400 mt-1">PNG ou SVG recommandé</p>
            </div>
          </div>
          <Input label="URL du logo (ou entrez directement)"
            value={settings.logo_url || ''}
            onChange={e => set('logo_url', e.target.value)} />
        </section>

        {/* Hero section */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
            <Type className="w-4 h-4 text-brand-600" /> Section Hero
          </h2>
          <Input label="Titre principal"
            value={settings.hero_title || ''}
            onChange={e => set('hero_title', e.target.value)} />
          <Input label="Sous-titre"
            value={settings.hero_subtitle || ''}
            onChange={e => set('hero_subtitle', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Texte bouton principal"
              value={settings.hero_cta_primary || ''}
              onChange={e => set('hero_cta_primary', e.target.value)} />
            <Input label="Texte bouton secondaire"
              value={settings.hero_cta_secondary || ''}
              onChange={e => set('hero_cta_secondary', e.target.value)} />
          </div>

          {/* Hero image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Image hero</label>
            {settings.hero_image_url && (
              <img src={settings.hero_image_url} alt="Hero" className="w-full h-32 object-cover rounded-xl" />
            )}
            <div className="flex gap-2">
              <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
              <Button variant="secondary" size="sm" onClick={() => heroRef.current?.click()} loading={uploadingHero}>
                <Upload className="w-4 h-4" /> Uploader une image
              </Button>
            </div>
            <Input placeholder="https://... ou uploader ci-dessus"
              value={settings.hero_image_url || ''}
              onChange={e => set('hero_image_url', e.target.value)} />
          </div>
        </section>

        {/* Theme */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand-600" /> Thème
          </h2>
          <div className="flex items-center gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Couleur principale</label>
              <div className="flex items-center gap-3">
                <input type="color" value={settings.accent_color || '#2e9168'}
                  onChange={e => set('accent_color', e.target.value)}
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <Input value={settings.accent_color || '#2e9168'}
                  onChange={e => set('accent_color', e.target.value)}
                  className="w-36" />
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl flex-shrink-0" style={{ backgroundColor: settings.accent_color || '#2e9168' }} />
          </div>
        </section>

        {/* Preview */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-brand-600" /> Aperçu Hero
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: settings.accent_color || '#2e9168' }}>
            <div className="p-8 text-white text-center">
              <h3 className="font-display text-2xl font-bold mb-2">{settings.hero_title || 'Titre hero'}</h3>
              <p className="text-white/80 mb-4">{settings.hero_subtitle || 'Sous-titre'}</p>
              <div className="flex gap-3 justify-center">
                <div className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-medium">
                  {settings.hero_cta_primary || 'CTA Principal'}
                </div>
                <div className="border border-white/50 text-white px-4 py-2 rounded-xl text-sm font-medium">
                  {settings.hero_cta_secondary || 'CTA Secondaire'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Sauvegarder tous les paramètres
          </Button>
        </div>
      </div>
    </div>
  )
}

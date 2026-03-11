'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send, CheckCircle2, HelpCircle, AlertTriangle, FileText, Shield } from 'lucide-react'

const CATEGORIES = [
  { value: 'technical', label: 'Problème technique', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  { value: 'account', label: 'Mon compte', icon: Shield, color: 'text-blue-500 bg-blue-50' },
  { value: 'organization', label: 'Organisation / Vérification', icon: FileText, color: 'text-brand-600 bg-brand-50' },
  { value: 'report', label: 'Signalement', icon: AlertTriangle, color: 'text-orange-500 bg-orange-50' },
  { value: 'other', label: 'Autre demande', icon: HelpCircle, color: 'text-gray-500 bg-gray-100' },
]

export default function SupportPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    category: 'technical',
    subject: '',
    message: '',
    email: user?.email || '',
  })

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast({ title: 'Sujet et message requis', variant: 'error' }); return
    }
    if (!form.email.trim()) {
      toast({ title: 'Email requis pour vous répondre', variant: 'error' }); return
    }
    setSending(true)
    try {
      await api.post('/support', {
        category: form.category,
        subject: form.subject,
        message: form.message,
        email: form.email,
        user_id: user?.id || null,
      })
      setSubmitted(true)
    } catch (err: any) {
      toast({ title: 'Erreur lors de l\'envoi', description: err.response?.data?.message, variant: 'error' })
    } finally { setSending(false) }
  }

  if (submitted) return (
    <MainLayout>
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Demande envoyée !</h1>
        <p className="text-gray-500 mb-2">Votre message a été transmis à l'équipe d'administration.</p>
        <p className="text-gray-500 text-sm mb-8">Nous vous répondrons à <strong>{form.email}</strong> dans les plus brefs délais.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => router.back()}>Retour</Button>
          <Button onClick={() => { setSubmitted(false); setForm({ ...form, subject: '', message: '' }) }}>
            Nouvelle demande
          </Button>
        </div>
      </div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Support & Assistance</h1>
          <p className="text-gray-500">Notre équipe est là pour vous aider. Décrivez votre problème et nous vous répondrons rapidement.</p>
        </div>

        <div className="space-y-5">
          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-display font-bold text-gray-900 mb-4">Type de demande</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(c => {
                const Icon = c.icon
                return (
                  <button key={c.value} type="button"
                    onClick={() => setForm({ ...form, category: c.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.category === c.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-gray-700 leading-tight">{c.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-display font-bold text-gray-900">Votre message</h2>
            <Input label="Votre email *" type="email" placeholder="pour qu'on puisse vous répondre"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input label="Sujet *" placeholder="Résumez votre problème en quelques mots..."
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <textarea rows={6}
                placeholder="Décrivez votre problème en détail. Plus vous donnez d'informations, plus nous pourrons vous aider rapidement."
                className="flex w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none placeholder:text-gray-400"
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">{form.message.length}/2000 caractères</p>
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmit} loading={sending}>
              <Send className="w-4 h-4" /> Envoyer ma demande
            </Button>
          </div>

          {/* FAQ hint */}
          <div className="bg-gray-50 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-500">
              Vous avez une question fréquente ?{' '}
              <span className="text-brand-600 font-medium">Temps de réponse habituel : 24-48h</span>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

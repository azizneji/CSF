'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { Mail, Lock, User, MapPin, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', location: '', bio: '',
  })
  const [errors, setErrors] = useState<any>({})

  const validate = () => {
    const e: any = {}
    if (!form.full_name.trim()) e.full_name = 'Nom complet requis'
    if (!form.email) e.email = 'Email requis'
    if (!form.password || form.password.length < 6) e.password = 'Mot de passe minimum 6 caractères'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form)
      toast({ title: 'Compte créé !', description: 'Bienvenue sur Citoyens Sans Frontières', variant: 'success' })
      router.push('/dashboard')
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message || 'Une erreur est survenue', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-brand-700">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CSF</span>
            </div>
            Citoyens SF
          </Link>
          <h1 className="font-display text-3xl font-bold text-gray-900 mt-6 mb-2">Créer un compte</h1>
          <p className="text-gray-500">Rejoignez l'écosystème civique tunisien</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom complet"
              placeholder="Ahmed Ben Ali"
              icon={<User className="w-4 h-4" />}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              error={errors.full_name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              icon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="Minimum 6 caractères"
              icon={<Lock className="w-4 h-4" />}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
            />
            <Input
              label="Ville (optionnel)"
              placeholder="Tunis, Sfax..."
              icon={<MapPin className="w-4 h-4" />}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <div className="w-full space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Bio (optionnel)</label>
              <textarea
                placeholder="Parlez-nous de votre engagement..."
                rows={3}
                className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Users, Briefcase, Building2, ArrowRight, Globe, Shield, Zap, Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  )

  if (user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  )

  return (
    <MainLayout>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36">
          <div className="max-w-3xl stagger">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-brand-100 mb-6 animate-fade-up">
              <Globe className="w-3.5 h-3.5" />
              La plateforme civique de Tunisie
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-up">
              Ensemble,<br />
              <span className="text-sand-300">changeons</span><br />
              la Tunisie.
            </h1>
            <p className="text-lg md:text-xl text-brand-200 leading-relaxed mb-10 max-w-xl animate-fade-up">
              Citoyens Sans Frontières connecte les ONG, les entreprises et les citoyens engagés dans un écosystème unifié pour un impact collectif.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-up">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 shadow-glow">
                  Rejoindre la plateforme <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 80Z" fill="#f8faf9"/>
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {[
            { icon: Users, label: 'Citoyens', color: 'brand' },
            { icon: Building2, label: 'Organisations', color: 'sand' },
            { icon: Briefcase, label: 'Entreprises', color: 'brand' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 md:p-6 shadow-card text-center card-lift">
              <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color === 'brand' ? 'bg-brand-100' : 'bg-sand-100'}`}>
                <Icon className={`w-5 h-5 ${color === 'brand' ? 'text-brand-600' : 'text-sand-600'}`} />
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">{label}</p>
              <p className="text-lg md:text-2xl font-display font-bold text-gray-900 mt-0.5">Rejoignez-nous</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Un écosystème simple pour connecter tous les acteurs du changement.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 stagger">
          {[
            { step: '01', title: 'Créez votre profil', desc: 'Inscrivez-vous en quelques minutes et construisez votre identité numérique.', icon: Users },
            { step: '02', title: 'Rejoignez ou créez', desc: 'Créez votre organisation ou rejoignez des initiatives existantes.', icon: Building2 },
            { step: '03', title: 'Connectez & collaborez', desc: 'Établissez des liens avec d\'autres acteurs et créez un impact collectif.', icon: Zap },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="bg-white rounded-2xl p-8 shadow-soft border border-gray-50 card-lift animate-fade-up">
              <div className="text-6xl font-display font-bold text-brand-50 mb-4 leading-none">{step}</div>
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-3xl p-12 text-center text-white shadow-glow">
          <Shield className="w-12 h-12 mx-auto mb-5 text-brand-200" />
          <h2 className="font-display text-4xl font-bold mb-4">Prêt à rejoindre le mouvement ?</h2>
          <p className="text-brand-100 text-lg mb-8 max-w-md mx-auto">
            Inscrivez-vous gratuitement et faites partie de la communauté civique tunisienne.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  )
}

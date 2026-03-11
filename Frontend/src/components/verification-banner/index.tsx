'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { ShieldAlert, X, ArrowRight, CheckCircle2 } from 'lucide-react'

// Shown as a modal popup when user logs in and is admin of an unverified org
export function UnverifiedOrgModal() {
  const { user } = useAuth()
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [unverifiedOrgs, setUnverifiedOrgs] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    const dismissed = sessionStorage.getItem('verify-modal-dismissed')
    if (dismissed) return

    api.get('/organizations/mine').then(r => {
      const mine = r.data || []
      const unverified = mine
        .filter((m: any) => ['admin', 'manager'].includes(m.role) && !m.organization?.is_verified)
        .map((m: any) => m.organization)
        .filter(Boolean)
      if (unverified.length > 0) {
        setUnverifiedOrgs(unverified)
        setShow(true)
      }
    }).catch(() => {})
  }, [user])

  const dismiss = () => {
    sessionStorage.setItem('verify-modal-dismissed', '1')
    setShow(false)
  }

  if (!show || unverifiedOrgs.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
          {unverifiedOrgs.length === 1 ? 'Organisation non vérifiée' : 'Organisations non vérifiées'}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          {unverifiedOrgs.length === 1
            ? `"${unverifiedOrgs[0].name}" n'est pas encore visible publiquement. Soumettez une demande de vérification pour qu'elle apparaisse sur la plateforme.`
            : `Vous avez ${unverifiedOrgs.length} organisations qui ne sont pas encore visibles publiquement.`}
        </p>

        <div className="space-y-2 mb-5">
          {unverifiedOrgs.map((org: any) => (
            <div key={org.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {org.logo_url
                  ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-amber-700 text-xs font-bold">{org.name?.charAt(0)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                <p className="text-xs text-amber-600">En attente de vérification</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={dismiss}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Plus tard
          </button>
          <button
            onClick={() => { dismiss(); router.push(`/organizations/${unverifiedOrgs[0].id}/edit`) }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-1.5">
            Demander la vérification <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Inline banner shown inside the org edit page
export function VerificationBanner({ orgId, orgName, isVerified, onRequestSent }: {
  orgId: string; orgName: string; isVerified: boolean; onRequestSent?: () => void
}) {
  const [requesting, setRequesting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRequest = async () => {
    setRequesting(true)
    try {
      await api.post(`/verification/organizations/${orgId}/submit-simple`)
      setSent(true)
      onRequestSent?.()
    } catch (err: any) {
      // May already have a request — treat as success
      setSent(true)
    } finally { setRequesting(false) }
  }

  if (isVerified) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      <p className="text-sm font-medium text-green-800">Organisation vérifiée et visible publiquement ✅</p>
    </div>
  )

  if (sent) return (
    <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
      <p className="text-sm font-medium text-brand-800">Demande de vérification envoyée ! Un administrateur examinera votre organisation.</p>
    </div>
  )

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-800 text-sm">Organisation non vérifiée</p>
          <p className="text-amber-600 text-xs mt-0.5">
            "{orgName}" n'est pas encore visible publiquement. Soumettez une demande pour qu'un administrateur la valide.
          </p>
        </div>
      </div>
      <button onClick={handleRequest} disabled={requesting}
        className="mt-3 w-full px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        {requesting ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Envoi en cours...
          </span>
        ) : (
          <>Demander la vérification <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  )
}

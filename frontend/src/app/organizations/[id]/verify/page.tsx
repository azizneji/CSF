'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { orgsApi, verificationApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Shield, FileText, CheckCircle2, Clock, Upload, X, AlertCircle, Mail, Phone } from 'lucide-react'

function DocUpload({
  label,
  hint,
  file,
  onChange,
  required,
}: {
  label: string
  hint: string
  file: File | null
  onChange: (f: File | null) => void
  required?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div
      className={`rounded-xl border-2 p-4 flex items-center justify-between gap-4 transition-all ${
        file
          ? 'border-brand-400 bg-brand-50'
          : 'border-dashed border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            file ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {file ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          {file ? (
            <p className="text-xs text-brand-600 truncate">{file.name}</p>
          ) : (
            <p className="text-xs text-gray-400">{hint}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {file && (
          <button
            onClick={() => onChange(null)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => ref.current?.click()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            file
              ? 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {file ? 'Changer' : 'Choisir'}
        </button>
      </div>
    </div>
  )
}

export default function OrganizationVerifyPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()

  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<any>(null)

  const [jort,    setJort]    = useState<File | null>(null)
  const [statuts, setStatuts] = useState<File | null>(null)
  const [patente, setPatente] = useState<File | null>(null)
  const [rne,     setRne]     = useState<File | null>(null)
  const [phone,   setPhone]   = useState('')
  const [email,   setEmail]   = useState('')

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }

    Promise.all([
      orgsApi.getById(id as string),
      verificationApi.getStatus(id as string).catch(() => ({ data: null })),
    ])
      .then(([orgRes, verRes]) => {
        const orgData = orgRes.data
        setOrg(orgData)
        setVerificationStatus(verRes.data)
        if (orgData.email) setEmail(orgData.email)
        if (orgData.phone) setPhone(orgData.phone)

        // Only admins can access this page
        const isAdmin = orgData.members?.some(
          (m: any) => m.user.id === user?.id && m.role === 'admin'
        )
        if (!isAdmin) router.push(`/organizations/${id}`)
      })
      .catch(() => router.push('/organizations'))
      .finally(() => setLoading(false))
  }, [id, user])

  const handleSubmit = async () => {
    if (!jort && !statuts) {
      toast({
        title: 'Document requis',
        description: 'Veuillez joindre au minimum la publication au JORT ou les statuts.',
        variant: 'error',
      })
      return
    }
    if (!phone || !email) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez renseigner le numéro de contact et l\'email de l\'ONG.',
        variant: 'error',
      })
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      if (jort)    fd.append('jort',    jort)
      if (statuts) fd.append('statuts', statuts)
      if (patente) fd.append('patente', patente)
      if (rne)     fd.append('extras',  rne)
      fd.append('contact_phone', phone)
      fd.append('contact_email', email)

      await verificationApi.submitDocs(id as string, fd)
      toast({
        title: 'Dossier soumis !',
        description: 'Notre équipe examinera votre dossier sous 5 à 7 jours ouvrables.',
        variant: 'success',
      })
      router.push(`/organizations/${id}`)
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Veuillez réessayer.',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <MainLayout>
      <div className="max-w-xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    </MainLayout>
  )

  if (!org) return null

  const isPending  = verificationStatus?.latest_request?.status === 'pending'
  const isVerified = verificationStatus?.is_verified

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">

        <Link
          href={`/organizations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à {org.name}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Demande de vérification</h1>
              <p className="text-sm text-gray-500">{org.name}</p>
            </div>
          </div>

          {isVerified && (
            <div className="mt-4 flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl p-3 text-brand-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">Cette organisation est déjà vérifiée.</p>
            </div>
          )}

          {!isVerified && isPending && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">Demande en cours d'examen — vous serez notifié(e) par email.</p>
            </div>
          )}

          {!isVerified && !isPending && (
            <div className="mt-4 flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">Soumettez vos documents officiels pour obtenir le badge de vérification. Traitement sous 5 à 7 jours ouvrables.</p>
            </div>
          )}
        </div>

        {/* Form — only show if not verified and no pending request */}
        {!isVerified && !isPending && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 space-y-6">

            <div>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Informations de contact</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de l'ONG <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="contact@organisation.tn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="+216 XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-1">Documents officiels</h2>
              <p className="text-sm text-gray-500 mb-5">
                Formats acceptés : PDF, JPG, PNG. Au moins un des deux premiers documents est obligatoire.
              </p>

              <div className="space-y-3">
                <DocUpload
                  label="Publication au JORT"
                  hint="Journal Officiel de la République Tunisienne"
                  file={jort}
                  onChange={setJort}
                  required
                />
                <DocUpload
                  label="Statuts de l'ONG"
                  hint="Document officiel des statuts de l'association"
                  file={statuts}
                  onChange={setStatuts}
                  required
                />
                <DocUpload
                  label="Patente"
                  hint="Attestation de la patente fiscale"
                  file={patente}
                  onChange={setPatente}
                />
                <DocUpload
                  label="RNE"
                  hint="Extrait du Registre National des Entreprises"
                  file={rne}
                  onChange={setRne}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href={`/organizations/${id}`} className="flex-1">
                <Button variant="outline" className="w-full">Annuler</Button>
              </Link>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={(!jort && !statuts) || !phone || !email}
                className="flex-1"
              >
                <Shield className="w-4 h-4" /> Soumettre le dossier
              </Button>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { knowledgeApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate, getInitials, getAvatarUrl } from '@/lib/utils'
import { Search, Plus, BookOpen, FileText, Download, Tag } from 'lucide-react'

const CATEGORIES = [
  { value: '',            label: 'Toutes' },
  { value: 'study',       label: 'Études' },
  { value: 'report',      label: 'Rapports' },
  { value: 'guide',       label: 'Guides' },
  { value: 'research',    label: 'Recherches' },
  { value: 'policy',      label: 'Notes de politique' },
  { value: 'newsletter',  label: 'Newsletters' },
  { value: 'other',       label: 'Autres' },
]

const CAT_COLORS: any = {
  study: 'blue', report: 'sand', guide: 'green',
  research: 'blue', policy: 'default', newsletter: 'gray', other: 'gray',
}

export default function KnowledgePage() {
  const { user } = useAuth()
  const [pubs, setPubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const fetchPubs = async () => {
    setLoading(true)
    try {
      const res = await knowledgeApi.getAll({ category: category || undefined, search: search || undefined })
      setPubs(res.data.data || res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPubs() }, [category])

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Base de connaissances</h1>
            <p className="text-gray-500">Études, rapports, guides et publications de la communauté.</p>
          </div>
          {user && (
            <Link href="/knowledge/create">
              <Button><Plus className="w-4 h-4" />Publier un document</Button>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 mb-8 space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchPubs() }} className="flex gap-2">
            <Input placeholder="Rechercher une publication..."
              icon={<Search className="w-4 h-4" />}
              value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  category === c.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-xl mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : pubs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucune publication trouvée</p>
            {user && (
              <Link href="/knowledge/create" className="mt-4 inline-block">
                <Button>Publier un document</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {pubs.map((pub) => (
              <Link key={pub.id} href={`/knowledge/${pub.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft card-lift animate-fade-up h-full flex flex-col overflow-hidden">
                  {/* Cover */}
                  <div className="h-40 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center flex-shrink-0 relative">
                    {pub.cover_url ? (
                      <img src={pub.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-12 h-12 text-brand-300" />
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant={CAT_COLORS[pub.category] || 'gray'}>
                        {CATEGORIES.find(c => c.value === pub.category)?.label || pub.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{pub.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3 flex-1">{pub.description}</p>

                    {pub.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {pub.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="flex items-center gap-0.5 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            <Tag className="w-2.5 h-2.5" />{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={getAvatarUrl(pub.author?.full_name || 'A', pub.author?.avatar_url)} />
                          <AvatarFallback className="text-xs">{getInitials(pub.author?.full_name || 'A')}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500 truncate max-w-24">{pub.author?.full_name || pub.author?.name}</span>
                      </div>
                      {pub.file_url && (
                        <span className="flex items-center gap-1 text-xs text-brand-600">
                          <Download className="w-3 h-3" /> Télécharger
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

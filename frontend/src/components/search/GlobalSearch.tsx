'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getInitials, getAvatarUrl } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Search, User, Building2, Briefcase, CalendarDays, BookOpen, X, Loader2 } from 'lucide-react'

const SECTION_ICONS: any = {
  users:         { icon: User,         label: 'Personnes',      color: 'text-blue-500'   },
  organizations: { icon: Building2,    label: 'Organisations',  color: 'text-brand-600'  },
  enterprises:   { icon: Briefcase,    label: 'Entreprises',    color: 'text-sand-600'   },
  activities:    { icon: CalendarDays, label: 'Activités',      color: 'text-green-600'  },
  knowledge:     { icon: BookOpen,     label: 'Connaissances',  color: 'text-purple-600' },
}

function ResultItem({ item, type, onClick }: any) {
  const Icon = SECTION_ICONS[type]?.icon || Search
  const color = SECTION_ICONS[type]?.color || 'text-gray-500'

  const name = item.full_name || item.name || item.title
  const sub = item.email || item.category || item.type || item.sector

  return (
    <button onClick={() => onClick(item, type)}
      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
      {type === 'users' ? (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={getAvatarUrl(item.full_name, item.avatar_url)} />
          <AvatarFallback className="text-xs">{getInitials(item.full_name)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100`}>
          {item.logo_url || item.cover_url
            ? <img src={item.logo_url || item.cover_url} alt="" className="w-full h-full object-cover rounded-lg" />
            : <Icon className={`w-4 h-4 ${color}`} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        {sub && <p className="text-xs text-gray-400 capitalize truncate">{sub}</p>}
      </div>
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${color} bg-opacity-10`}>
        {SECTION_ICONS[type]?.label}
      </span>
    </button>
  )
}

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<any>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const search = async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults({}); setOpen(false); return }
    setLoading(true)
    setOpen(true)
    try {
      const res = await api.get('/search', { params: { q } })
      setResults(res.data || {})
    } catch {
      setResults({})
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }

  const getLink = (item: any, type: string) => {
    switch (type) {
      case 'users':         return `/profile/${item.id}`
      case 'organizations': return `/organizations/${item.id}`
      case 'enterprises':   return `/enterprises/${item.id}`
      case 'activities':    return `/activities/${item.id}`
      case 'knowledge':     return `/knowledge/${item.id}`
      default:              return '/'
    }
  }

  const handleSelect = (item: any, type: string) => {
    router.push(getLink(item, type))
    setOpen(false)
    setQuery('')
    setResults({})
  }

  const totalResults = Object.values(results).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0) as number
  const hasResults = totalResults > 0

  return (
    <div className="relative" ref={ref}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Rechercher..."
          className="w-48 lg:w-64 pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all placeholder:text-gray-400"
        />
        {query ? (
          <button onClick={() => { setQuery(''); setResults({}); setOpen(false) }}
            className="absolute right-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2 hidden lg:flex items-center gap-0.5 text-xs text-gray-400 font-mono">
            <span>⌘</span><span>K</span>
          </kbd>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fade-up overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Recherche en cours...</span>
            </div>
          ) : !hasResults ? (
            <div className="py-10 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun résultat pour "{query}"</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-2">
              {Object.entries(results).map(([type, items]: any) => {
                if (!items?.length) return null
                const { label, icon: Icon, color } = SECTION_ICONS[type] || {}
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                    </div>
                    {items.map((item: any) => (
                      <ResultItem key={item.id} item={item} type={type} onClick={handleSelect} />
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

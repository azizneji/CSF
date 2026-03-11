'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials, getAvatarUrl } from '@/lib/utils'
import {
  Briefcase, LayoutDashboard, LogOut, User, Menu, X,
  ShieldCheck, Newspaper, BookOpen, CalendarDays, HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NotificationsBell } from '@/components/notifications/NotificationsBell'
import { GlobalSearch } from '@/components/search/GlobalSearch'

const navLinks = [
  { href: '/feed',          label: 'Actualité',     icon: Newspaper    },
  { href: '/activities',    label: 'Activités',     icon: CalendarDays },
  { href: '/opportunities', label: 'Opportunités',  icon: Briefcase    },
  { href: '/knowledge',     label: 'Connaissances', icon: BookOpen     },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

        {/* ── Far left: Logo + Search bar ───────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-xl text-brand-700">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">CSF</span>
            </div>
            <span className="hidden sm:block whitespace-nowrap">Citoyens SF</span>
          </Link>
          {user && (
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
          )}
        </div>

        {/* ── Center: 4 nav links ───────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                pathname.startsWith(href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Far right: Notifications + Dashboard + Avatar ── */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {user ? (
            <>
              <NotificationsBell />

              <Link href="/dashboard" className="hidden md:block">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden lg:block">Dashboard</span>
                </Button>
              </Link>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-transparent hover:ring-brand-300 transition-all">
                      <AvatarImage src={getAvatarUrl(user.full_name, user.avatar_url)} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-48 bg-white rounded-xl shadow-card border border-gray-100 p-1.5 animate-fade-up"
                    sideOffset={8} align="end"
                  >
                    <div className="px-3 py-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                    <DropdownMenu.Item asChild>
                      <Link href={`/profile/${user.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">
                        <User className="w-4 h-4" /> Mon profil
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                    </DropdownMenu.Item>
                    {(user as any).role === 'superadmin' && (
                      <>
                        <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                        <DropdownMenu.Item asChild>
                          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-brand-700 font-medium rounded-lg hover:bg-brand-50 cursor-pointer outline-none">
                            <ShieldCheck className="w-4 h-4" /> Superadmin
                          </Link>
                        </DropdownMenu.Item>
                      </>
                    )}
                    <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                    <DropdownMenu.Item asChild>
                      <Link href="/support" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">
                        <HelpCircle className="w-4 h-4" /> Support
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 cursor-pointer outline-none"
                      onSelect={logout}
                    >
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login"><Button variant="outline" size="sm">Connexion</Button></Link>
              <Link href="/auth/register"><Button size="sm">Rejoindre</Button></Link>
            </div>
          )}

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 animate-fade-in">
          {user && <div className="pb-2"><GlobalSearch /></div>}
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/support" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <HelpCircle className="w-4 h-4" /> Support
              </Link>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" className="flex-1"><Button variant="outline" className="w-full">Connexion</Button></Link>
              <Link href="/auth/register" className="flex-1"><Button className="w-full">Rejoindre</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

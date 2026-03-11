'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { authApi } from '@/lib/api'
import { Profile } from '@/types'

interface AuthContextType {
  user: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  location?: string
  bio?: string
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      authApi.me()
        .then((res) => {
          setUser(res.data)
        })
        .catch(() => {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { session, profile } = res.data
    Cookies.set('access_token', session.access_token, { expires: 7 })
    Cookies.set('refresh_token', session.refresh_token, { expires: 30 })
    setUser(profile)
  }

  const register = async (data: RegisterData) => {
    const res = await authApi.register(data)
    const { session } = res.data
    Cookies.set('access_token', session.access_token, { expires: 7 })
    Cookies.set('refresh_token', session.refresh_token, { expires: 30 })
    const profileRes = await authApi.me()
    setUser(profileRes.data)
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    setUser(null)
    window.location.href = '/'
  }

  const refreshUser = async () => {
    const res = await authApi.me()
    setUser(res.data)
  }

  // Show a full-screen spinner while checking auth state on first load
  // This prevents pages from flashing to login before the cookie is checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

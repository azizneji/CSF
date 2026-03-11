'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils'
import { Search, UserX, Shield, UserCheck, LogIn, Plus, Upload } from 'lucide-react'

const adminApi = {
  getUsers: (p: any) => api.get('/admin/users', { params: p }),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  impersonate: (id: string) => api.post(`/admin/users/${id}/impersonate`),
  bulkCreate: (users: any[]) => api.post('/admin/users/bulk-create', { users }),
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkCsv, setBulkCsv] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers({ search: search || undefined, role: roleFilter || undefined })
      setUsers(res.data.data || [])
      setTotal(res.data.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  const handleSuspend = async (user: any) => {
    await adminApi.updateUser(user.id, { is_suspended: !user.is_suspended })
    toast({ title: user.is_suspended ? 'Compte réactivé' : 'Compte suspendu', variant: 'success' })
    fetchUsers()
  }

  const handleRoleChange = async (userId: string, role: string) => {
    await adminApi.updateUser(userId, { role })
    toast({ title: 'Rôle mis à jour', variant: 'success' })
    fetchUsers()
  }

  const handleImpersonate = async (userId: string) => {
    try {
      const res = await adminApi.impersonate(userId)
      const link = res.data.action_link
      if (link) window.open(link, '_blank')
      else toast({ title: 'Lien généré — vérifiez les logs', variant: 'success' })
    } catch { toast({ title: 'Erreur impersonation', variant: 'error' }) }
  }

  const handleBulkCreate = async () => {
    const lines = bulkCsv.trim().split('\n').filter(Boolean)
    const users = lines.map(line => {
      const [email, full_name, password] = line.split(',').map(s => s.trim())
      return { email, full_name, password }
    }).filter(u => u.email && u.full_name)

    if (!users.length) { toast({ title: 'Format invalide', variant: 'error' }); return }
    setBulkLoading(true)
    try {
      const res = await adminApi.bulkCreate(users)
      const success = res.data.filter((r: any) => r.success).length
      toast({ title: `${success}/${users.length} utilisateurs créés`, variant: 'success' })
      setShowBulk(false); setBulkCsv('')
      fetchUsers()
    } finally { setBulkLoading(false) }
  }

  const ROLE_COLORS: any = { user: 'gray', moderator: 'blue', superadmin: 'default' }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{total} membres au total</p>
        </div>
        <Button onClick={() => setShowBulk(true)}><Plus className="w-4 h-4" />Ajout en masse</Button>
      </div>

      {/* Bulk create modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="font-display text-xl font-bold mb-4">Ajout en masse</h2>
            <p className="text-sm text-gray-500 mb-3">Format CSV: <code className="bg-gray-100 px-1 rounded">email, nom complet, mot_de_passe (optionnel)</code></p>
            <textarea rows={8} placeholder="aziz@example.com, Aziz Neji, MonMotDePasse1!&#10;sara@example.com, Sara Ben Ali"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={bulkCsv} onChange={e => setBulkCsv(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowBulk(false)}>Annuler</Button>
              <Button className="flex-1" loading={bulkLoading} onClick={handleBulkCreate}>Créer les comptes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex gap-3">
        <form onSubmit={e => { e.preventDefault(); fetchUsers() }} className="flex gap-2 flex-1">
          <Input placeholder="Rechercher par nom ou email..."
            icon={<Search className="w-4 h-4" />}
            value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
          <Button type="submit" variant="secondary">Rechercher</Button>
        </form>
        <div className="flex gap-2">
          {['', 'user', 'moderator', 'superadmin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === r ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {r || 'Tous'}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Utilisateur', 'Rôle', 'Membre depuis', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={getAvatarUrl(u.full_name, u.avatar_url)} />
                        <AvatarFallback className="text-xs">{getInitials(u.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500">
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.is_suspended ? 'red' : 'green'}>
                      {u.is_suspended ? 'Suspendu' : 'Actif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" title="Impersonate" onClick={() => handleImpersonate(u.id)}>
                        <LogIn className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" title={u.is_suspended ? 'Réactiver' : 'Suspendre'}
                        onClick={() => handleSuspend(u)}>
                        {u.is_suspended ? <UserCheck className="w-3.5 h-3.5 text-green-600" /> : <UserX className="w-3.5 h-3.5 text-red-500" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

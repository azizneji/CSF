import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Endpoints that are public — 401 on these should NOT redirect to login
const PUBLIC_ENDPOINTS = [
  '/users/',
  '/organizations',
  '/enterprises',
  '/activities',
  '/opportunities',
  '/knowledge',
  '/services',
  '/feed',
]

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isPublic = PUBLIC_ENDPOINTS.some((p) => url.includes(p))

      if (!isPublic) {
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; location?: string; bio?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ─── Users ────────────────────────────────────────────────────
export const usersApi = {
  getAll: (search?: string) => api.get('/users', { params: { search } }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateMe: (data: any) => api.patch('/users/me', data),
  getMyOrganizations: () => api.get('/users/me/organizations'),
}

// ─── Organizations ────────────────────────────────────────────
export const orgsApi = {
  getAll: (search?: string, category?: string, domaine?: string) =>
    api.get('/organizations', { params: { search, category, domaine } }),
  getMine: () => api.get('/organizations/mine'),
  getById: (id: string) => api.get(`/organizations/${id}`),
  create: (data: any) => api.post('/organizations', data),
  update: (id: string, data: any) => api.patch(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  addMember: (orgId: string, userId: string, role?: string) =>
    api.post(`/organizations/${orgId}/members/${userId}`, { role }),
  removeMember: (orgId: string, userId: string) =>
    api.delete(`/organizations/${orgId}/members/${userId}`),
  getJoinRequests: (orgId: string) =>
    api.get(`/organizations/${orgId}/join-requests`),
  respondJoinRequest: (orgId: string, requestId: string, action: 'accept' | 'reject') =>
    api.patch(`/organizations/${orgId}/join-requests/${requestId}`, { action }),
  requestJoin: (orgId: string, message?: string) =>
    api.post(`/organizations/${orgId}/join`, { message }),
}

// ─── Enterprises ──────────────────────────────────────────────
export const enterprisesApi = {
  getAll: (search?: string, sector?: string) =>
    api.get('/enterprises', { params: { search, sector } }),
  getById: (id: string) => api.get(`/enterprises/${id}`),
  create: (data: any) => api.post('/enterprises', data),
  update: (id: string, data: any) => api.patch(`/enterprises/${id}`, data),
  delete: (id: string) => api.delete(`/enterprises/${id}`),
}

// ─── Connections ──────────────────────────────────────────────
export const connectionsApi = {
  request: (data: any) => api.post('/connections', data),
  respond: (id: string, status: 'accepted' | 'rejected') =>
    api.patch(`/connections/${id}/respond`, { status }),
  getForActor: (actorId: string) => api.get(`/connections/actor/${actorId}`),
  getPending: () => api.get('/connections/pending'),
  delete: (id: string) => api.delete(`/connections/${id}`),
}

// ─── Feed ─────────────────────────────────────────────────────
export const feedApi = {
  getFeed: (page = 1) => api.get('/feed', { params: { page } }),
  getPost: (id: string) => api.get(`/feed/${id}`),
  createPost: (data: any) => api.post('/feed', data),
  deletePost: (id: string) => api.delete(`/feed/${id}`),
  react: (postId: string, data: { type: string; user_id: string }) =>
    api.post(`/feed/${postId}/reactions`, data),
  addComment: (postId: string, data: any) =>
    api.post(`/feed/${postId}/comments`, data),
  deleteComment: (commentId: string) =>
    api.delete(`/feed/comments/${commentId}`),
  getByAuthor: (authorType: string, authorId: string, page = 1) =>
    api.get('/feed', { params: { author_type: authorType, author_id: authorId, page } }),
}

// ─── Opportunities ────────────────────────────────────────────
export const opportunitiesApi = {
  getAll: (params?: { type?: string; search?: string; page?: number; poster_id?: string }) =>
    api.get('/opportunities', { params }),
  getById: (id: string) => api.get(`/opportunities/${id}`),
  create: (data: any) => api.post('/opportunities', data),
  update: (id: string, data: any) => api.patch(`/opportunities/${id}`, data),
  delete: (id: string) => api.delete(`/opportunities/${id}`),
  apply: (id: string, message?: string) =>
    api.post(`/opportunities/${id}/apply`, { message }),
  getApplications: (id: string) =>
    api.get(`/opportunities/${id}/applications`),
}

// ─── Knowledge ────────────────────────────────────────────────
export const knowledgeApi = {
  getAll: (params?: { category?: string; search?: string; author_type?: string; author_id?: string; page?: number }) =>
    api.get('/knowledge', { params }),
  getById: (id: string) => api.get(`/knowledge/${id}`),
  create: (data: any) => api.post('/knowledge', data),
  update: (id: string, data: any) => api.patch(`/knowledge/${id}`, data),
  delete: (id: string) => api.delete(`/knowledge/${id}`),
}

// ─── Activities ───────────────────────────────────────────────
export const activitiesApi = {
  getAll: (params?: { type?: string; organization_id?: string; upcoming?: boolean; page?: number }) =>
    api.get('/activities', { params }),
  getById: (id: string) => api.get(`/activities/${id}`),
  create: (data: any) => api.post('/activities', data),
  update: (id: string, data: any) => api.patch(`/activities/${id}`, data),
  delete: (id: string) => api.delete(`/activities/${id}`),
  register: (id: string) => api.post(`/activities/${id}/register`),
  getRegistrations: (id: string) => api.get(`/activities/${id}/registrations`),
}

// ─── Services (free directory) ────────────────────────────────
export const servicesApi = {
  getAll: (params?: { category?: string; search?: string; organization_id?: string }) =>
    api.get('/services', { params }),
  getById: (id: string) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
}

// ─── Projects ─────────────────────────────────────────────────
export const projectsApi = {
  getByOrg: (orgId: string, status?: string) =>
    api.get(`/projects/organization/${orgId}`, { params: { status } }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  linkActivity: (projectId: string, activityId: string) =>
    api.post(`/projects/${projectId}/activities/${activityId}`),
}

// ─── Support ──────────────────────────────────────────────────
export const supportApi = {
  submit: (data: { category: string; subject: string; message: string; email: string }) =>
    api.post('/support', data),
  getAll: (status?: string) => api.get('/support', { params: { status } }),
  update: (id: string, data: { status?: string; admin_note?: string }) =>
    api.patch(`/support/${id}`, data),
}

// ─── Notifications ────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

// ─── Search ───────────────────────────────────────────────────
export const searchApi = {
  search: (q: string) => api.get('/search', { params: { q } }),
}

// ─── Verification ─────────────────────────────────────────────
export const verificationApi = {
  getStatus: (orgId: string) => api.get(`/verification/organizations/${orgId}`),
  submitDocs: (orgId: string, formData: FormData) =>
    api.post(`/verification/organizations/${orgId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getRequests: (status?: string) =>
    api.get('/admin/verifications', { params: { status } }),
  review: (id: string, status: string, note?: string) =>
    api.patch(`/admin/verifications/${id}`, { status, note }),
}

// ─── Uploads ──────────────────────────────────────────────────
export const uploadsApi = {
  uploadAvatar: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/uploads/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadLogo: (file: File, entityType: string, entityId: string) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/uploads/logo/${entityType}/${entityId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadPostImage: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/uploads/post-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadPostFile: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/uploads/post-file', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadPublication: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/uploads/publication', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadCover: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/uploads/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ─── Groups ───────────────────────────────────────────────────
// ADD THIS BLOCK to your existing api.ts file

export const groupsApi = {
  getAll: (search?: string) => api.get('/groups', { params: { search } }),
  getMine: () => api.get('/groups/mine'),
  getById: (id: string) => api.get(`/groups/${id}`),
  create: (data: any) => api.post('/groups', data),
  update: (id: string, data: any) => api.patch(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),

  // Membership
  join: (id: string, message?: string) => api.post(`/groups/${id}/join`, { message }),
  leave: (id: string) => api.post(`/groups/${id}/leave`),
  getMembers: (id: string) => api.get(`/groups/${id}/members`),
  updateMemberRole: (id: string, userId: string, role: string) =>
    api.patch(`/groups/${id}/members/${userId}/role`, { role }),
  kickMember: (id: string, userId: string) => api.delete(`/groups/${id}/members/${userId}`),

  // Join requests
  getJoinRequests: (id: string) => api.get(`/groups/${id}/join-requests`),
  respondJoinRequest: (id: string, requestId: string, action: 'accepted' | 'rejected') =>
    api.patch(`/groups/${id}/join-requests/${requestId}`, { action }),

  // Invites
  invite: (id: string, userId: string) => api.post(`/groups/${id}/invite`, { user_id: userId }),
  respondInvite: (id: string, action: 'accepted' | 'rejected') =>
    api.post(`/groups/${id}/invites/respond`, { action }),
  getMyInvites: () => api.get('/groups/invites'),

  // Posts
  getPosts: (id: string) => api.get(`/groups/${id}/posts`),
  getPendingPosts: (id: string) => api.get(`/groups/${id}/posts/pending`),
  createPost: (id: string, data: any) => api.post(`/groups/${id}/posts`, data),
  approvePost: (id: string, postId: string, action: 'approved' | 'rejected') =>
    api.patch(`/groups/${id}/posts/${postId}/approve`, { action }),
  deletePost: (id: string, postId: string) => api.delete(`/groups/${id}/posts/${postId}`),
  reactPost: (id: string, postId: string, type = 'like') =>
    api.post(`/groups/${id}/posts/${postId}/react`, { type }),
  commentPost: (id: string, postId: string, content: string) =>
    api.post(`/groups/${id}/posts/${postId}/comments`, { content }),

  // Messages
  getMessages: (id: string) => api.get(`/groups/${id}/messages`),
  sendMessage: (id: string, content: string) => api.post(`/groups/${id}/messages`, { content }),
}

// ─────────Petitions────────────────────────────────────────────────────

export const petitionsApi = {
  // Browse
  getAll: (params?: { status?: string; search?: string; page?: number }) =>
    api.get('/petitions', { params }),

  // Single
  getById: (id: string) =>
    api.get(`/petitions/${id}`),

  // Create
  create: (data: {
    title: string
    description: string
    objective: string
    target_institution?: string
    cover_url?: string
    author_type: 'user' | 'organization'
    author_id: string
    goal?: number
    deadline?: string
  }) => api.post('/petitions', data),

  // Update
  update: (id: string, data: Partial<{
    title: string
    description: string
    objective: string
    target_institution: string
    cover_url: string
    goal: number
    deadline: string
  }>) => api.patch(`/petitions/${id}`, data),

  // Delete
  delete: (id: string) =>
    api.delete(`/petitions/${id}`),

  // Close manually
  close: (id: string) =>
    api.post(`/petitions/${id}/close`),

  // Sign
  sign: (id: string, data: { comment?: string; share_to_feed?: boolean }) =>
    api.post(`/petitions/${id}/sign`, data),

  // Unsign
  unsign: (id: string) =>
    api.delete(`/petitions/${id}/sign`),

  // Get signatures list
  getSignatures: (id: string, page = 1) =>
    api.get(`/petitions/${id}/signatures`, { params: { page } }),

  // Add creator update
  addUpdate: (id: string, content: string) =>
    api.post(`/petitions/${id}/updates`, { content }),
}

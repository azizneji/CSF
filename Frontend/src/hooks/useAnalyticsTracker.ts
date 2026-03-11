'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'

const SESSION_KEY = 'csf_session_id'
const SESSION_START_KEY = 'csf_session_start'
const PAGE_COUNT_KEY = 'csf_page_count'

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString())
    sessionStorage.setItem(PAGE_COUNT_KEY, '0')
  }
  return id
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function getReferrer(): string {
  if (typeof document === 'undefined') return 'organic'
  const ref = document.referrer
  if (!ref) return 'organic'
  if (ref.includes('facebook') || ref.includes('instagram')) return 'social_facebook'
  if (ref.includes('linkedin')) return 'social_linkedin'
  if (ref.includes('twitter') || ref.includes('x.com')) return 'social_twitter'
  return 'referral'
}

export function useAnalyticsTracker() {
  const pathname = usePathname()
  const sessionStarted = useRef(false)

  // Start session on mount
  useEffect(() => {
    if (sessionStarted.current) return
    sessionStarted.current = true

    const sessionId = getOrCreateSessionId()
    const device    = getDeviceType()
    const referrer  = getReferrer()

    api.post('/platform-analytics/session/start', {
      id:          sessionId,
      device_type: device,
      referrer,
    }).catch(() => {}) // silent — don't break the app

    // End session on page unload
    const handleUnload = () => {
      const pageCount = parseInt(sessionStorage.getItem(PAGE_COUNT_KEY) || '1', 10)
      // Use sendBeacon for reliability on unload
      const payload = JSON.stringify({ session_id: sessionId, page_count: pageCount })
      navigator.sendBeacon?.('/api/analytics/session-end', payload)
      // Also try the API
      api.post('/platform-analytics/session/end', {
        session_id: sessionId,
        page_count: pageCount,
      }).catch(() => {})
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // Track page views on route change
  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    const count = parseInt(sessionStorage.getItem(PAGE_COUNT_KEY) || '0', 10) + 1
    sessionStorage.setItem(PAGE_COUNT_KEY, count.toString())

    api.post('/platform-analytics/track', {
      event_type:  'page_view',
      category:    'page_view',
      session_id:  sessionId,
      device_type: getDeviceType(),
      metadata:    { path: pathname },
    }).catch(() => {})
  }, [pathname])
}

// Standalone tracker for specific events
export async function trackEvent(
  eventType: string,
  options?: {
    category?:    string
    entity_type?: string
    entity_id?:   string
    metadata?:    Record<string, any>
  }
) {
  const sessionId = getOrCreateSessionId()
  await api.post('/platform-analytics/track', {
    event_type:  eventType,
    category:    options?.category    || 'user_action',
    entity_type: options?.entity_type,
    entity_id:   options?.entity_id,
    metadata:    options?.metadata    || {},
    session_id:  sessionId,
    device_type: getDeviceType(),
  }).catch(() => {})
}

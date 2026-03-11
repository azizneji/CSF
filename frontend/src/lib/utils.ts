import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-TN', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getAvatarUrl(name: string, avatarUrl?: string) {
  if (avatarUrl) return avatarUrl
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f7453&color=fff&bold=true`
}

export const ORG_CATEGORY_LABELS: Record<string, string> = {
  ngo: 'ONG',
  association: 'Association',
  foundation: 'Fondation',
  collective: 'Collectif',
  other: 'Autre',
}

export const ENTERPRISE_SECTOR_LABELS: Record<string, string> = {
  tech: 'Technologie',
  finance: 'Finance',
  energy: 'Énergie',
  health: 'Santé',
  education: 'Éducation',
  agriculture: 'Agriculture',
  retail: 'Commerce',
  manufacturing: 'Industrie',
  services: 'Services',
  other: 'Autre',
}

export const ENTERPRISE_SIZE_LABELS: Record<string, string> = {
  startup: 'Startup',
  sme: 'PME',
  large: 'Grande entreprise',
  multinational: 'Multinationale',
}

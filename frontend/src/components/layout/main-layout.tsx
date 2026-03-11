import { Navbar } from './navbar'
import { Footer } from './footer'
import { UnverifiedOrgModal } from '@/components/verification-banner'
import { useAnalyticsTracker } from '@/hooks/useAnalyticsTracker'

export function MainLayout({ children }: { children: React.ReactNode }) {
  useAnalyticsTracker()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <UnverifiedOrgModal />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

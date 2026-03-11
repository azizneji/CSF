import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">CSF</span>
              </div>
              <span className="font-display font-bold text-xl text-white">Citoyens Sans Frontières</span>
            </div>
            <p className="text-sm text-brand-400 max-w-sm leading-relaxed">
              La plateforme qui connecte les ONG, entreprises et citoyens engagés de Tunisie pour un impact collectif.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Explorer</h4>
            <ul className="space-y-2 text-sm text-brand-400">
              <li><Link href="/organizations" className="hover:text-white transition-colors">Organisations</Link></li>
              <li><Link href="/enterprises" className="hover:text-white transition-colors">Entreprises</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Compte</h4>
            <ul className="space-y-2 text-sm text-brand-400">
              <li><Link href="/auth/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Se connecter</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-800 mt-8 pt-6 text-xs text-brand-500 text-center">
          © {new Date().getFullYear()} Citoyens Sans Frontières. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}

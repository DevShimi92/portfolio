//Hook pour la détection du type de la route activé (si c'est une route (section) ou un standalone)
'use client'
import { usePathname } from 'next/navigation'
import { NavLink } from '@/app/types/navlink';
import { NAV_LINKS } from '@/app/lib/navigation'

export function useActiveNavLink() {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0] ?? ''
  const pathWithoutLocale = '/' + segments.slice(1).join('/')

  const routeLinks = NAV_LINKS.filter(
    (l): l is NavLink & { type: 'route'; path: string } => l.type === 'route'
  )

  const activeRouteLink = routeLinks.find(
    (l) => pathWithoutLocale === l.path || pathWithoutLocale.startsWith(`${l.path}/`)
  )

  return {
    isStandaloneRoute: Boolean(activeRouteLink),
    activeRouteId: activeRouteLink?.id ?? null,
    locale,
  }
}

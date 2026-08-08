'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useActiveNavLink } from '@/app/[locale]/_hooks/useActiveNavLink'
import navStyles from './navbar.module.css'
import hamStyles from './hamburger.module.css'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import SocialLinks, { SocialLinksInline } from '@/app/[locale]/_components/socialButton/socialButton'
import ThemeToggle, { ThemeToggleInline } from '../themeToggle/themeToggle'
import LangToggle, { LangToggleInline } from '../langToggle/langToggle'

type NavLink = | { id: string; label: string; type: 'section' } | { id: string; label: string; type: 'route'; path: string }

const LINKS: NavLink[] = [
  { id: 'home',    label: 'Home',    type: 'section' },
  { id: 'about',   label: 'Info',    type: 'section' },
  { id: 'projets', label: 'Projets', type: 'section' },
  { id: 'contact', label: 'Contact', type: 'route', path: '/contact' },
]

const PINNED_SECTIONS = ['articles']

export default function NavBar() {
  const { currentSection } = useBackground()
  const [menuOpen, setMenuOpen] = useState(false)

  const { isStandaloneRoute, activeRouteId, locale } = useActiveNavLink()

  function renderLink(link: NavLink, className: string, activeClassName: string, tabIndex?: number) {

    const isActive = link.type === 'route'
      ? activeRouteId === link.id
      : !isStandaloneRoute && currentSection === link.id
    const combinedClassName = `${className} ${isActive ? activeClassName : ''}`

    // Route standalone
    if (link.type === 'route') {
          return (
            <Link
              key={link.id}
              href={`/${locale}${link.path}`}
              className={combinedClassName}
              onClick={() => setMenuOpen(false)}
              tabIndex={tabIndex}
            >
              {link.label}
            </Link>
          )
        }

        // Section, mais on est sur une autre route standalone → lien vers l'ancre racine
        if (isStandaloneRoute) {
          return (
            <Link
              key={link.id}
              href={`/${locale}#${link.id}`}
              className={combinedClassName}
              onClick={() => setMenuOpen(false)}
              tabIndex={tabIndex}
            >
              {link.label}
            </Link>
          )
        }

        // Section, on est déjà sur la page racine → scroll natif
        return (
          <button
            key={link.id}
            className={combinedClassName}
            onClick={() => scrollTo(link.id)}
            tabIndex={tabIndex}
          >
            {link.label}
          </button>
        )
    }

  const isPinned = PINNED_SECTIONS.includes(currentSection)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <>
      {/* ── Desktop : navbar verticale gauche + sociaux fixed ── */}
      <nav
        className={`${navStyles.navbar} ${isPinned ? navStyles.navbarPinned : navStyles.navbarHidden}`} role="navigation" aria-label="Navigation principale">
        {LINKS.map((link) =>
            renderLink(link, navStyles.navBtn, navStyles.navBtnActive)
        )}
      </nav>
      <SocialLinks />
      {/*<ThemeToggle />*/}
      <LangToggle />

      {/* ── Mobile : bouton hamburger ── */}
      <button
        className={hamStyles.hamburger}
        onClick={() => setMenuOpen(o => !o)}
        aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={menuOpen}>
        <span className={`${hamStyles.hamburgerLine} ${menuOpen ? hamStyles.hamburgerLineTop : ''}`} />
        <span className={`${hamStyles.hamburgerLine} ${menuOpen ? hamStyles.hamburgerLineMid : ''}`} />
        <span className={`${hamStyles.hamburgerLine} ${menuOpen ? hamStyles.hamburgerLineBot : ''}`} />
      </button>

      {/* ── Mobile : overlay plein écran ── */}
      <div
        className={`${hamStyles.overlay} ${menuOpen ? hamStyles.overlayOpen : ''}`}
        aria-hidden={!menuOpen} >
        <nav className={hamStyles.overlayNav} role="navigation" aria-label="Menu mobile">
          {LINKS.map((link) =>
            renderLink(link, hamStyles.overlayBtn, hamStyles.overlayBtnActive, menuOpen ? 0 : -1)
          )}
        </nav>

        {/* Sociaux en bas de l'overlay */}
        <div className={hamStyles.overlayBottom}>
          <div className={hamStyles.overlayBottomLeft}>
            <SocialLinksInline />
          </div>
          <div className={hamStyles.overlayBottomRight}>
            {/* <ThemeToggleInline />*/}
            <LangToggleInline />
          </div>
        </div>
      </div>
    </>
  )
}

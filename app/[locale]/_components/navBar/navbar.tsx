'use client'
import { useState } from 'react'
import navStyles from './navbar.module.css'
import hamStyles from './hamburger.module.css'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import SocialLinks, { SocialLinksInline } from '@/app/[locale]/_components/socialButton/socialButton'

const LINKS = [
  { href: 'home', label: 'Home' },
  { href: 'about',   label: 'Info' },
  { href: 'projets', label: 'Projets' },
]

const PINNED_SECTIONS = ['articles']

export default function NavBar() {
  const { currentSection } = useBackground()
  const [menuOpen, setMenuOpen] = useState(false)

  const isPinned = PINNED_SECTIONS.includes(currentSection)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <>
      {/* ── Desktop : navbar verticale gauche + sociaux fixed ── */}
      <nav
        className={`${navStyles.navbar} ${isPinned ? navStyles.navbarPinned : navStyles.navbarHidden}`}
        role="navigation"
        aria-label="Navigation principale">
        {LINKS.map(({ href, label }) => (
          <button
            key={href}
            className={`${navStyles.navBtn} ${currentSection === href ? navStyles.navBtnActive : ''}`}
            onClick={() => scrollTo(href)}>
            {label}
          </button>
        ))}
      </nav>
      <SocialLinks />

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
          {LINKS.map(({ href, label }) => (
            <button
              key={href}
              className={`${hamStyles.overlayBtn} ${currentSection === href ? hamStyles.overlayBtnActive : ''}`}
              onClick={() => scrollTo(href)}
              tabIndex={menuOpen ? 0 : -1} >
              {label}
            </button>
          ))}
        </nav>

        {/* Sociaux en bas de l'overlay */}
        <div className={hamStyles.overlayBottom}>
          <div className={hamStyles.overlayBottomLeft}>
            <SocialLinksInline />
          </div>
          <div className={hamStyles.overlayBottomRight}>
          </div>
        </div>
      </div>
    </>
  )
}

import { socials } from './socials'
import { SiGithub } from 'react-icons/si'
import { IoLogoLinkedin } from 'react-icons/io5'
import type { IconType } from 'react-icons'
import styles from './socialButton.module.css'

const ICONS: Record<string, IconType> = {
  github:   SiGithub,
  linkedin: IoLogoLinkedin,
}

/* ── Desktop : colonne verticale, position fixed bas gauche ── */
export default function SocialLinks() {
  return (
    <div className={styles.socialLinks}>
      {socials.map(({ label, href, icon }) => {
        const Icon = ICONS[icon]
        return (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            aria-label={label} className={styles.navBtnSocial}>
            <Icon size={16} />
          </a>
        )
      })}
    </div>
  )
}

/* ── Mobile : ligne horizontale, sans positionnement fixed ── */
export function SocialLinksInline() {
  return (
    <div className={styles.socialLinksInline}>
      {socials.map(({ label, href, icon }) => {
        const Icon = ICONS[icon]
        return (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            aria-label={label} className={styles.navBtnSocial}>
            <Icon size={16} />
          </a>
        )
      })}
    </div>
  )
}

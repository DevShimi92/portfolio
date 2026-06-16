'use client'
import { useParams, usePathname, useRouter } from 'next/navigation'
import styles from './langToggle.module.css'

function LangLabel({ locale }: { locale: string }) {
  return <span className={styles.label}>{locale.toUpperCase()}</span>
}

/* ── Desktop : fixed haut droite ── */
export default function LangToggle() {
  const params = useParams()
  const locale = (params.locale as string) ?? 'en'
  const pathname = usePathname()
  const router = useRouter()

  function toggle() {
    const nextLocale = locale === 'fr' ? 'en' : 'fr'
    const newPathname = pathname.replace(`/${locale}`, `/${nextLocale}`) || `/${nextLocale}`
    router.push(newPathname)
  }

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Changer la langue — actuellement ${locale.toUpperCase()}`}>
      <LangLabel locale={locale} />
    </button>
  )
}

/* ── Mobile overlay : sans position fixed ── */
export function LangToggleInline() {
  const params = useParams()
  const locale = (params.locale as string) ?? 'en'
  const pathname = usePathname()
  const router = useRouter()

  function toggle() {
    const nextLocale = locale === 'fr' ? 'en' : 'fr'
    const newPathname = pathname.replace(`/${locale}`, `/${nextLocale}`) || `/${nextLocale}`
    router.push(newPathname)
  }

  return (
    <button
      className={styles.toggleInline}
      onClick={toggle}
      aria-label={`Changer la langue — actuellement ${locale.toUpperCase()}`}>
      <LangLabel locale={locale} />
    </button>
  )
}

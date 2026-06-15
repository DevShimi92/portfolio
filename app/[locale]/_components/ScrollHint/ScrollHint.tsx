'use client'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import styles from './ScrollHint.module.css'

const FADE_THRESHOLD = 0.15

export default function ScrollHint() {
  const { blurAmount } = useBackground()

  const opacity = Math.max(0, 1 - blurAmount / FADE_THRESHOLD)

  if (opacity === 0) return null

  function scrollToNext() {
    const nextSection = document.getElementById('about')
    if (!nextSection) return
    nextSection.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToNext}
      aria-label="Défiler vers la section suivante"
      className={styles.btn}
      style={{ opacity }}
    >
      <span className={styles.label}>Scroll</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.arrow}
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </button>
  )
}

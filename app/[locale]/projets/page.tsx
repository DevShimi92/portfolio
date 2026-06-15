'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Link from 'next/link'
import type { Project } from '@/app/types/projets'
import styles from './projects.module.css'




function GifOrPlaceholder({ gif, title }: { gif: string | null; title: string }) {
  if (gif) {
    return (
      <img
        src={gif}
        alt={`Aperçu ${title}`}
        className={styles.gif}
      />
    )
  }

  // Placeholder — affiché si gif est null ou absent
  return (
    <div className={styles.gifPlaceholder}>
      <span className={styles.gifPlaceholderLabel}>{title.toLowerCase()}.gif</span>
    </div>
  )
}

export default function Projets() {

  const t = useTranslations('projetsPage')
  const slides = t.raw('projects') as Project[]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExpanded, setIsExpanded]   = useState(false)

  const currentSlide = slides[currentIndex]

  // ── Navigation — fade out puis mise à jour du contenu ──
  function goToSlide(newIndex: number) {
    if (isAnimating) return
    setIsAnimating(true)

    setTimeout(() => {
      setCurrentIndex((newIndex + slides.length) % slides.length)
      setIsAnimating(false)
      setIsExpanded(false)
    }, 200)
  }

  return (
    <section className={styles.section}>

        {/* Titre section */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ce que je fais</h2>
        </div>

        <div className={styles.slideshow}>

          {/* Flèche précédente */}
          <button
            className={`${styles.navArrow} ${styles.navArrowPrev}`}
            onClick={() => goToSlide(currentIndex - 1)}
            aria-label="Catégorie précédente"
          >
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* Flèche suivante */}
          <button
            className={`${styles.navArrow} ${styles.navArrowNext}`}
            onClick={() => goToSlide(currentIndex + 1)}
            aria-label="Catégorie suivante"
          >
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {/* Badge hobby — conditionnel */}
          {currentSlide.isHobby && (
            <span className={`${styles.hobbyBadge} ${!isAnimating ? styles.isVisible : ''}`}>Hobby</span>
          )}

          {/* GIF ou placeholder — transition fade */}
          <div className={`${styles.gifBlock} ${isAnimating ? styles.isHidden : ''}`}>
            <GifOrPlaceholder gif={currentSlide.gif} title={currentSlide.title} />
          </div>

          {/* Bloc info — desktop : bas droite / mobile : overlay pleine largeur */}
            <div
              className={`${styles.slideInfo} ${!isAnimating ? styles.isVisible : ''} ${isExpanded ? styles.isExpanded : ''}`}
              onClick={() => setIsExpanded(prev => !prev)}
              role="button"
              aria-expanded={isExpanded}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setIsExpanded(prev => !prev)}
            >
              <p className={styles.slideInfoLabel}>{currentSlide.label}</p>
              <h3 className={styles.slideTitle}>{currentSlide.title}</h3>

              {/* Wrapper tiroir — mobile only */}
              <div className={`${styles.descWrapper} ${isExpanded ? styles.descExpanded : ''}`}>
                <p className={styles.slideDescription}>{currentSlide.description}</p>
                {/* Fade gradient — masqué quand ouvert */}
                <div className={`${styles.descFade} ${isExpanded ? styles.descFadeHidden : ''}`} aria-hidden="true" />
              </div>

            {/* Lien optionnel — cliquable sans déclencher le tiroir */}
                     {currentSlide.href && (
                       <Link
                         href={currentSlide.href}
                         target="_blank"
                         rel="noopener noreferrer"
                         className={styles.slideLink}
                         onClick={e => e.stopPropagation()}
                       >
                         {currentSlide.hrefLabel}
                         <span className={styles.arrow}>→</span>
                       </Link>
                     )}
          </div>

        </div>

      </section>
  )
}

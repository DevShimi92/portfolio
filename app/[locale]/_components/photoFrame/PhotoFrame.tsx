'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './PhotoFrame.module.css'

const FALLBACK_IMG = '/images/profile-placeholder.jpg'

type Props = { imgUrl: string }

export default function PhotoFrame({ imgUrl }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          wrapper.classList.add(styles.draw)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} className={styles.photoWrapper} onContextMenu={(e) => e.preventDefault()}>
      <Image src={imgUrl ?? FALLBACK_IMG}
        alt="Photo de profil"
        fill
        sizes="(max-width: 768px) 85vw, 30vw"
        className={styles.photo}
        priority
      />

      {/* Contour SVG animé */}
      <svg className={styles.photoBorder} viewBox="0 0 272 332" preserveAspectRatio="none">
        <rect x="1" y="1" width="270" height="330" rx="4"/>
      </svg>

      {/* Coins décoratifs PCB */}
      <span className={`${styles.corner} ${styles.cornerTl}`}/>
      <span className={`${styles.corner} ${styles.cornerTr}`}/>
      <span className={`${styles.corner} ${styles.cornerBl}`}/>
      <span className={`${styles.corner} ${styles.cornerBr}`}/>

      {/* Label flottant */}
      <a  href={process.env.PROFILE_IMG_LINK ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.photoTag}  >Télécharger mon CV</a>
    </div>
  )
}

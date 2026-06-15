'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'

interface Props {
  children: React.ReactNode
  id: string
  isHome?: boolean
}

export default function AnimatedSection({ children, id, isHome }: Props) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { setBlurAmount, setCurrentSection } = useBackground()

  useEffect(() => {
    if (!isHome) return

    let rafId: number

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const section = ref.current
        if (!section) return
        const scrollProgress = Math.min(Math.max(window.scrollY / section.offsetHeight, 0), 1)
        setBlurAmount(scrollProgress)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [isHome, setBlurAmount])

  // ── IntersectionObserver → currentSection ──
    useEffect(() => {
      const section = ref.current
      if (!section) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          // Met à jour currentSection dès que la section occupe 50% du viewport
          if (entry.isIntersecting) setCurrentSection(id)
        },
        { threshold: 0.5 }
      )

      observer.observe(section)
      return () => observer.disconnect()
    }, [id, setCurrentSection])

  return (
    <motion.section id={id} ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} >
      {children}
    </motion.section>
  )
}
